// src/pages/FCVenta.tsx
// Gestión de Facturas de Venta a Clientes

import { useState, useEffect } from 'react'
import { fcVenta, clientes, productos, type FCVenta, Cliente, Producto } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { validarFechaNoFutura } from '../utils/validaciones'
import { useLoading } from '../hooks/useLoading'
import { Spinner } from '../components/Spinner'
import { toast } from 'react-toastify'
import { Plus, Package, ShoppingCart, FileText, MessageCircle, Mail } from 'lucide-react'
import Select from 'react-select'

// Factura de Venta extendida con propiedades del backend
interface FCVentaCompleta extends Omit<FCVenta, 'cliente_nombre'> {
  id: number
  numero_interno: string
  numero_factura: number
  tipo_comprobante: string
  fecha: string
  cliente_id: number
  estado: 'emitida' | 'anulada'
  total: number
  subtotal: number
  medio_pago?: string
  observaciones?: string
}

// Detalle de factura de venta
interface FCVentaItem {
  producto_id: number
  producto_nombre?: string
  producto_sku?: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

// Producto con stock actual
interface ProductoConStock extends Producto {
  stock_actual?: number
  costo_promedio?: number
  precio_venta?: number
  precio_venta_mayorista?: number
}

// Cliente con tipo
interface ClienteConTipo extends Cliente {
  tipo_cliente: 'minorista' | 'mayorista'
}

export default function FCVenta() {
  // Estados principales
  const [ventasList, setVentasList] = useState<FCVentaCompleta[]>([])
  const [clientesList, setClientesList] = useState<ClienteConTipo[]>([])
  const [productosList, setProductosList] = useState<ProductoConStock[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'emitida' | 'anulada'>('all')
  const [filtroCliente, setFiltroCliente] = useState<number | 'all'>('all')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tipo_comprobante: 'venta' as 'venta' | 'nota_credito',
    tipo_documento: 'FC' as 'FC' | 'FB' | 'TK',
    punto_venta: 1,
    cliente_id: null as number | null,
    medio_pago: 'transferencia',
    fecha_vencimiento: '',
    observaciones: '',
    items: [] as FCVentaItem[]
  })
  const [carrito, setCarrito] = useState<FCVentaItem[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
  const [cantidadVenta, setCantidadVenta] = useState(1)
  const [precioVenta, setPrecioVenta] = useState(0)

  // 🔴 NUEVO: Tipo de comprobante (Venta o Nota de Crédito)
  const [tipoComprobante, setTipoComprobante] = useState<'venta' | 'nota_credito'>('venta')

  // 🔴 NUEVO: Factura de Venta original para NC de Clientes
  const [facturaVentaOriginalId, setFacturaVentaOriginalId] = useState<number | null>(null)
  const [facturaVentaOriginalItems, setFacturaVentaOriginalItems] = useState<Array<{
    producto_id: number
    producto_nombre: string
    cantidad: number
    precio_unitario: number
    subtotal: number
  }>>([])
  const [loadingFactura, setLoadingFactura] = useState(false)

  // 🔴 Modal "Nuevo Cliente"
  const [showNuevoClienteModal, setShowNuevoClienteModal] = useState(false)
  const [nuevoClienteData, setNuevoClienteData] = useState({
    nombre: '',
    cuit: '',
    email: '',
    telefono: '',
    condicion_iva: 'consumidor_final' as 'consumidor_final' | 'responsable_inscripto' | 'monotributista' | 'exento',
    tipo_cliente: 'minorista' as 'minorista' | 'mayorista'
  })
  const [loadingCrearCliente, setLoadingCrearCliente] = useState(false)

  // Obtener tipo de cliente seleccionado
  const clienteSeleccionado = clientesList.find(c => c.id === formData.cliente_id)
  const tipoCliente = clienteSeleccionado?.tipo_cliente || 'minorista'

  // Obtener precio según tipo de cliente
  const getPrecioParaCliente = (producto: ProductoConStock) => {
    if (tipoCliente === 'mayorista' && producto.precio_venta_mayorista) {
      return producto.precio_venta_mayorista
    }
    return producto.precio_venta || 0
  }

  // Vista previa y validación
  const [showPreview, setShowPreview] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // 🔴 Cargar detalles de factura original para NC de Clientes
  useEffect(() => {
    const cargarDatosFactura = async () => {
      if (!facturaVentaOriginalId) {
        setFacturaVentaOriginalItems([])
        return
      }

      setLoadingFactura(true)
      try {
        const response = await fetch(`/api/fc-venta/${facturaVentaOriginalId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const data = await response.json()

        if (data.items?.length) {
          const items = data.items.map((item: any) => ({
            producto_id: item.producto_id,
            producto_nombre: item.producto_nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          }))

          setFacturaVentaOriginalItems(items)
          setCarrito(items)  // Precargar carrito con items de la factura
        }
      } catch (err) {
        toast.error('No se pudieron cargar los productos de la factura')
      } finally {
        setLoadingFactura(false)
      }
    }

    cargarDatosFactura()
  }, [facturaVentaOriginalId])

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [filtroEstado, filtroCliente])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filtroEstado !== 'all') params.estado = filtroEstado
      if (filtroCliente !== 'all') params.cliente_id = String(filtroCliente)

      const [ventasRes, clientesRes, productosRes] = await Promise.all([
        fcVenta.getAll(params),
        clientes.getAll(),
        productos.getAll()
      ])

      if (ventasRes.error) throw new Error(ventasRes.error)
      if (clientesRes.error) throw new Error(clientesRes.error)
      if (productosRes.error) throw new Error(productosRes.error)

      setVentasList((ventasRes.data as unknown as FCVentaCompleta[]) || [])
      setClientesList((clientesRes.data as unknown as ClienteConTipo[]) || [])
      setProductosList((productosRes.data as unknown as ProductoConStock[]) || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleCrear = () => {
    setFormData({
      tipo_comprobante: 'venta',
      tipo_documento: 'FC',
      punto_venta: 1,
      cliente_id: null,
      medio_pago: 'transferencia',
      fecha_vencimiento: '',
      observaciones: '',
      items: []
    })
    setCarrito([])
    setProductoSeleccionado(null)
    setCantidadVenta(1)
    setPrecioVenta(0)
    setTipoComprobante('venta')
    setFacturaVentaOriginalId(null)
    setFacturaVentaOriginalItems([])
    setShowModal(true)
  }

  // Agregar producto al carrito
  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidadVenta <= 0) return

    const producto = productosList.find(p => p.id === productoSeleccionado)
    if (!producto) return

    // 🔒 VALIDACIÓN: Si hay factura, solo productos de esa factura
    if (tipoComprobante === 'nota_credito' && facturaVentaOriginalId && facturaVentaOriginalItems) {
      const itemOriginal = facturaVentaOriginalItems.find(fi => fi.producto_id === productoSeleccionado)
      if (!itemOriginal) {
        toast.error('Solo podés acreditar productos de la factura original')
        return
      }

      // Validar cantidad no exceda lo facturado
      const cantidadEnCarrito = carrito
        .filter(item => item.producto_id === productoSeleccionado)
        .reduce((sum, item) => sum + item.cantidad, 0)

      if (cantidadEnCarrito + cantidadVenta > itemOriginal.cantidad) {
        toast.error(`No podés acreditar más de ${itemOriginal.cantidad} unidades (ya tenés ${cantidadEnCarrito} en el carrito)`)
        return
      }
    }

    // 🔒 CALCULAR PRECIO: Si hay factura, usar precio original
    let precio: number
    if (tipoComprobante === 'nota_credito' && facturaVentaOriginalItems?.length && facturaVentaOriginalId) {
      const itemOriginal = facturaVentaOriginalItems.find(fi => fi.producto_id === productoSeleccionado)
      if (itemOriginal) {
        precio = itemOriginal.precio_unitario  // ← Precio original de la factura
      } else {
        precio = precioVenta > 0 ? precioVenta : getPrecioParaCliente(producto)
      }
    } else {
      // Venta normal o NC sin factura: usar precio de lista o manual
      precio = precioVenta > 0 ? precioVenta : getPrecioParaCliente(producto)
    }

    // Validar stock (solo para ventas, no para NC)
    if (tipoComprobante === 'venta' && producto.stock_actual && producto.stock_actual < cantidadVenta) {
      toast.error(`Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock_actual}`)
      return
    }

    const nuevoItem: FCVentaItem = {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      producto_sku: producto.sku || '',
      cantidad: cantidadVenta,
      precio_unitario: precio,
      subtotal: cantidadVenta * precio
    }

    setCarrito([...carrito, nuevoItem])
    setProductoSeleccionado(null)
    setCantidadVenta(1)
    setPrecioVenta(0)
  }

  // Eliminar item del carrito
  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  // Actualizar item en tiempo real y recalcular total
  const actualizarItem = (index: number, field: 'cantidad' | 'precio_unitario', value: number) => {
    const nuevosItems = [...carrito]
    if (nuevosItems[index]) {
      nuevosItems[index] = {
        ...nuevosItems[index],
        [field]: value,
        subtotal: field === 'cantidad'
          ? value * nuevosItems[index].precio_unitario
          : nuevosItems[index].cantidad * value
      }
      setCarrito(nuevosItems)
    }
  }

  // Calcular total del carrito (SIN IVA - monotributista)
  const subtotalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  const totalCarrito = subtotalCarrito  // Total = Subtotal (sin IVA)

  // Validar formulario en tiempo real
  useEffect(() => {
    const errores: {[key: string]: string} = {}
    if (!formData.cliente_id) errores.cliente_id = 'Obligatorio'
    if (carrito.length === 0) errores.carrito = 'Al menos 1 producto'
    // Validar fecha no futura
    if (formData.fecha_vencimiento) {
      const validacionFecha = validarFechaNoFutura(formData.fecha_vencimiento)
      if (!validacionFecha.valido) errores.fecha_vencimiento = validacionFecha.mensaje || 'Fecha inválida'
    }
    setFormErrors(errores)
  }, [formData.cliente_id, carrito, formData.fecha_vencimiento])

  // Abrir vista previa
  const abrirVistaPrevia = () => {
    const errores: {[key: string]: string} = {}
    if (!formData.cliente_id) errores.cliente_id = 'Seleccioná un Cliente'
    if (carrito.length === 0) errores.carrito = 'Agregá al menos 1 producto'
    // Validar fecha no futura
    if (formData.fecha_vencimiento) {
      const validacionFecha = validarFechaNoFutura(formData.fecha_vencimiento)
      if (!validacionFecha.valido) errores.fecha_vencimiento = validacionFecha.mensaje || 'Fecha inválida'
    }

    if (Object.keys(errores).length > 0) {
      setFormErrors(errores)
      toast.error('Completá los campos obligatorios')
      return
    }

    setShowPreview(true)
  }

  // Confirmar y guardar FC Venta con loading
  const confirmarFCVenta = async () => {
    if (Object.keys(formErrors).length > 0) {
      toast.error('Completá los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      const payload = {
        tipo_comprobante: formData.tipo_comprobante,
        punto_venta: formData.punto_venta,
        // numero_factura se genera automáticamente en el backend
        cliente_id: formData.cliente_id!,
        fecha: new Date().toISOString().split('T')[0],
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        medio_pago: formData.medio_pago,
        observaciones: formData.observaciones || undefined,
        items: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: parseFloat(String(item.cantidad)),
          precio_unitario: parseFloat(String(item.precio_unitario))
        }))
      }

      console.log('DEBUG [payload FC Venta]:', payload)

      const response = await fcVenta.create(payload)
      console.log('DEBUG [response FC Venta]:', response)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        toast.error(errorMsg)
      } else {
        const numeroInterno = (response.data as any)?.numero_interno || 'emitida'
        const numeroCompleto = (response.data as any)?.numero_factura_completo || '-'
        toast.success(`FC Venta ${numeroInterno} (${numeroCompleto}) creada correctamente`)
        setShowPreview(false)
        setShowModal(false)
        resetForm()
        cargarDatos()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar')
      console.error('FC Venta error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      tipo_comprobante: 'FC',
      punto_venta: 1,
      cliente_id: null,
      medio_pago: 'transferencia',
      fecha_vencimiento: '',
      observaciones: '',
      items: []
    })
    setCarrito([])
    setProductoSeleccionado(null)
    setCantidadVenta(1)
    setPrecioVenta(0)
    setFormErrors({})
  }

  // 🔴 Crear nuevo cliente
  const handleCrearCliente = async () => {
    if (!nuevoClienteData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoadingCrearCliente(true)
    try {
      const response = await clientes.create(nuevoClienteData)
      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        toast.error(errorMsg)
      } else {
        const nuevoCliente = response.data as unknown as ClienteConTipo
        toast.success(`Cliente "${nuevoCliente.nombre}" creado correctamente`)
        
        // Refrescar lista de clientes
        const clientesRes = await clientes.getAll()
        if (!clientesRes.error) {
          setClientesList((clientesRes.data as unknown as ClienteConTipo[]) || [])
        }
        
        // Seleccionar el nuevo cliente
        setFormData({ ...formData, cliente_id: nuevoCliente.id })
        
        // Cerrar modal y limpiar
        setShowNuevoClienteModal(false)
        setNuevoClienteData({
          nombre: '',
          cuit: '',
          email: '',
          telefono: '',
          condicion_iva: 'consumidor_final',
          tipo_cliente: 'minorista'
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear cliente')
    } finally {
      setLoadingCrearCliente(false)
    }
  }

  // Resetear precio cuando cambia el cliente
  useEffect(() => {
    setPrecioVenta(0)
  }, [formData.cliente_id, tipoCliente])

  // Descargar PDF de factura
  const descargarPDF = async (ventaId: number, numeroInterno: string, clienteNombre: string) => {
    try {
      const url = fcVenta.getPDF(ventaId)
      const token = sessionStorage.getItem('access_token')
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Error al generar PDF')
      }
      
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const nombreCliente = clienteNombre.replace(/\s+/g, '_') || 'cliente'
      a.download = `FC_Venta_${numeroInterno}_${nombreCliente}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al descargar PDF')
    }
  }

  // 📱 Enviar por WhatsApp: Descargar PDF + Abrir WhatsApp
  const enviarPorWhatsApp = async (ventaId: number) => {
    try {
      // 1. Obtener link de WhatsApp + URL del PDF + nombre de archivo
      const response = await fcVenta.enviarWhatsApp(ventaId)
      if (response.error) {
        throw new Error(response.error)
      }
      const data = response.data as { link: string; telefono: string; cliente: string; pdf_url: string; pdf_filename: string }
      
      // 2. Descargar PDF con nombre correcto
      const token = sessionStorage.getItem('access_token')
      const pdfUrl = `${data.pdf_url}${token ? '?token=' + token : ''}`
      
      const pdfResponse = await fetch(pdfUrl)
      const blob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.pdf_filename  // ← Usar nombre del backend
      link.click()
      window.URL.revokeObjectURL(url)
      
      // 3. Esperar un momento y abrir WhatsApp
      setTimeout(() => {
        window.open(data.link, '_blank')
        toast.info('PDF descargado. Ahora adjuntalo manualmente en WhatsApp.')
      }, 1000)
      
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al generar link'
      toast.error(errorMsg)
    }
  }

  // ✉️ Enviar por Email: Descargar PDF + Abrir app de correo
  const enviarPorEmail = async (ventaId: number, emailDestino: string) => {
    try {
      // 1. Obtener link mailto + URL del PDF + nombre de archivo
      const response = await fcVenta.enviarEmail(ventaId)
      if (response.error) {
        throw new Error(response.error)
      }
      const data = response.data as { link: string; email: string; pdf_url: string; pdf_filename: string }
      
      // 2. Descargar PDF con nombre correcto
      const token = sessionStorage.getItem('access_token')
      const pdfUrl = `${data.pdf_url}${token ? '?token=' + token : ''}`
      
      const pdfResponse = await fetch(pdfUrl)
      const blob = await pdfResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = data.pdf_filename  // ← Usar nombre del backend
      link.click()
      window.URL.revokeObjectURL(url)
      
      // 3. Abrir app de correo nativa
      setTimeout(() => {
        window.location.href = data.link
        toast.info('PDF descargado. Ahora adjuntalo manualmente en el email.')
      }, 1000)
      
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al abrir correo'
      toast.error(errorMsg)
    }
  }

  // Las ventas ya vienen filtradas del backend
  const ventasMostradas = ventasList

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">FC Venta</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná facturas de venta a clientes y salida de stock</p>
        </div>
        <button
          onClick={handleCrear}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={18} />
          Nueva Factura de Venta
        </button>
      </div>

      {/* Info box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <ShoppingCart className="text-green-600 flex-shrink-0" size={20} />
        <div className="text-sm text-green-800">
          <p className="font-medium">Flujo de Facturas de Venta</p>
          <p className="mt-1">
            1. Creá una FC Venta → 2. El stock se descuenta → 3. Podés anular la FC (revierte stock)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro por Cliente */}
          <select
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todos los Clientes</option>
            {clientesList.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'all' | 'emitida' | 'anulada')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">📋 Todas</option>
            <option value="emitida">✅ Emitidas</option>
            <option value="anulada">❌ Anuladas</option>
          </select>

          {/* Botón Filtrar */}
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            🔍 Filtrar
          </button>

          {/* Botón Limpiar */}
          <button
            onClick={() => {
              setFiltroCliente('all')
              setFiltroEstado('all')
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            🔄 Limpiar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && ventasList.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      )}

      {/* Tabla de Ventas */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ventasMostradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No hay facturas de venta registradas
                  </td>
                </tr>
              ) : (
                ventasMostradas.map((venta) => {
                  return (
                    <tr key={venta.id} className="hover:bg-gray-50">
                      {/* ✅ SOLO NÚMERO DE EMISIÓN (no numero_interno) */}
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {venta.punto_venta}-{venta.numero_factura.toString().padStart(8, '0')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{venta.tipo_comprobante}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(venta.fecha)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{venta.cliente_nombre || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          venta.estado === 'emitida' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {venta.estado === 'emitida' ? '✅ Emitida' : '❌ Anulada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                        {venta.medio_pago || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-green-600">
                        {formatCurrency(venta.total)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Imprimir - siempre visible para facturas emitidas */}
                          {venta.estado === 'emitida' && (
                            <button
                              onClick={() => descargarPDF(
                                venta.id,
                                venta.numero_interno || `FV-${venta.id.toString().padStart(4, '0')}`,
                                venta.cliente_nombre || 'Cliente'
                              )}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              title="Imprimir Factura"
                            >
                              <FileText size={16} />
                              <span className="text-xs">Imprimir</span>
                            </button>
                          )}

                          {/* 📱 WhatsApp - para todas las facturas emitidas */}
                          {venta.estado === 'emitida' && (
                            <button
                              onClick={() => enviarPorWhatsApp(venta.id)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle size={16} />
                              <span className="text-xs">WhatsApp</span>
                            </button>
                          )}

                          {/* ✉️ Email - para todas las facturas emitidas */}
                          {venta.estado === 'emitida' && (
                            <button
                              onClick={() => enviarPorEmail(venta.id, '')}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1"
                              title="Enviar por Email"
                            >
                              <Mail size={16} />
                              <span className="text-xs">Email</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nueva Factura de Venta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {tipoComprobante === 'nota_credito' 
                  ? '🔴 Nueva Nota de Crédito de Cliente' 
                  : '📦 Nueva Factura de Venta'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Datos principales */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Operación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoComprobante}
                    onChange={(e) => {
                      const nuevoTipo = e.target.value as 'venta' | 'nota_credito'
                      setTipoComprobante(nuevoTipo)
                      setFormData({...formData, tipo_comprobante: nuevoTipo})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="venta">🟢 Factura de Venta</option>
                    <option value="nota_credito">🔴 Nota de Crédito de Cliente</option>
                  </select>
                  {tipoComprobante === 'nota_credito' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ℹ️ Para devoluciones o ajustes a clientes
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo Documento <span className="text-gray-400">(solo ventas)</span>
                  </label>
                  <select
                    value={formData.tipo_documento}
                    onChange={(e) => setFormData({...formData, tipo_documento: e.target.value as 'FC' | 'FB' | 'TK'})}
                    disabled={tipoComprobante === 'nota_credito'}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      tipoComprobante === 'nota_credito' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="FC">FC - Factura Completa</option>
                    <option value="FB">FB - Factura B</option>
                    <option value="TK">TK - Ticket</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Punto de Venta <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.punto_venta}
                    onChange={(e) => setFormData({...formData, punto_venta: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value={1}>0001</option>
                    <option value={2}>0002</option>
                    <option value={3}>0003</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Factura (Auto) <span className="text-gray-400">(se genera al confirmar)</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    placeholder="Se genera automáticamente"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Consecutivo por punto de venta + tipo
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2 items-start">
                    <select
                      value={formData.cliente_id || ''}
                      onChange={(e) => setFormData({...formData, cliente_id: e.target.value ? Number(e.target.value) : null})}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                        formErrors.cliente_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Seleccionar cliente...</option>
                      {clientesList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} {c.cuit ? `(${c.cuit})` : ''} {c.tipo_cliente === 'mayorista' ? 'Ⓜ️' : ''}
                        </option>
                      ))}
                    </select>
                    {tipoComprobante === 'venta' && (
                      <button
                        type="button"
                        onClick={() => setShowNuevoClienteModal(true)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap flex-shrink-0"
                        title="Crear nuevo cliente"
                      >
                        ➕ Nuevo Cliente
                      </button>
                    )}
                  </div>
                  {tipoComprobante === 'nota_credito' && (
                    <button
                      type="button"
                      onClick={() => setShowNuevoClienteModal(true)}
                      className="mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                      title="Crear nuevo cliente"
                    >
                      ➕ Nuevo Cliente
                    </button>
                  )}
                  {formErrors.cliente_id && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.cliente_id}</p>
                  )}
                  {formData.cliente_id && (
                    <p className="text-xs text-gray-500 mt-1">
                      ℹ️ Tipo: <span className="font-medium capitalize">{tipoCliente}</span> -
                      {tipoCliente === 'mayorista' ? ' Precios mayoristas' : ' Precios minoristas'}
                    </p>
                  )}
                </div>

                {/* 🔴 Selector de factura original (solo para NC de Clientes) */}
                {tipoComprobante === 'nota_credito' && formData.cliente_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Factura de Venta Original <span className="text-gray-400">(opcional)</span>
                    </label>
                    <select
                      value={facturaVentaOriginalId || ''}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : null
                        setFacturaVentaOriginalId(id)
                        if (!id) setFacturaVentaOriginalItems([])
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Seleccionar factura...</option>
                      {ventasList
                        .filter(v => v.cliente_id === formData.cliente_id && v.estado === 'emitida')
                        .map(v => (
                          <option key={v.id} value={v.id}>
                            {v.numero_interno} - ${v.total} ({formatDate(v.fecha)})
                          </option>
                        ))}
                    </select>
                    {loadingFactura && <p className="text-xs text-blue-600 mt-1">⏳ Cargando...</p>}
                    {facturaVentaOriginalId ? (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Los productos se cargarán automáticamente
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Dejá vacío para crédito comercial (productos libres)
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vencimiento <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento ? formData.fecha_vencimiento.split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                      formErrors.fecha_vencimiento ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.fecha_vencimiento && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fecha_vencimiento}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Para cta. cte.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Medio de Pago</label>
                  {tipoComprobante === 'nota_credito' ? (
                    <div>
                      <input
                        type="text"
                        value="cta_cte"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Las Notas de Crédito solo ajustan deuda (sin movimiento de dinero)
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.medio_pago}
                      onChange={(e) => setFormData({...formData, medio_pago: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="cta_cte">📋 Cuenta Corriente (Deja deuda)</option>
                      <option value="efectivo">💵 Efectivo (Pago inmediato)</option>
                      <option value="transferencia">🏦 Transferencia (Pago inmediato)</option>
                      <option value="cheque">📄 Cheque (Pago inmediato)</option>
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {tipoComprobante === 'nota_credito'
                      ? '💡 Las Notas de Crédito solo ajustan deuda (sin movimiento de dinero)'
                      : formData.medio_pago === 'cta_cte'
                      ? 'ℹ️ La deuda queda pendiente en cuenta corriente'
                      : 'ℹ️ El pago se registra automáticamente como recibido'}
                  </p>
                </div>
              </div>

              {/* Info monotributo */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <span className="text-amber-600 text-lg">ℹ️</span>
                <p className="text-xs text-amber-800">
                  <strong>Monotributo:</strong> No se discrimina IVA. El precio de venta es el total que paga el cliente.
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Notas adicionales sobre la venta..."
                />
              </div>

              {/* Agregar productos */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Package size={18} />
                  Agregar Productos
                </h4>
                <div className="grid grid-cols-5 gap-3 items-end">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Producto *</label>
                    <Select
                      options={productosList.map(p => {
                        const precioParaCliente = getPrecioParaCliente(p)
                        return {
                          value: p.id,
                          label: `${p.nombre} | SKU: ${p.sku || 'N/A'} | Stock: ${p.stock_actual ?? 0} | Precio: $${precioParaCliente.toFixed(2)}`,
                          sku: p.sku,
                          precio: precioParaCliente,
                          stock: p.stock_actual
                        }
                      })}
                      onChange={(selected) => {
                        if (selected) {
                          setProductoSeleccionado(selected.value)
                          setPrecioVenta(selected.precio || 0)
                        }
                      }}
                      value={productoSeleccionado ?
                        productosList
                          .map(p => {
                            const precioParaCliente = getPrecioParaCliente(p)
                            return {
                              value: p.id,
                              label: `${p.nombre} | SKU: ${p.sku || 'N/A'} | Stock: ${p.stock_actual ?? 0} | Precio: $${precioParaCliente.toFixed(2)}`,
                              sku: p.sku,
                              precio: precioParaCliente,
                              stock: p.stock_actual
                            }
                          })
                          .find(opt => opt.value === productoSeleccionado)
                        : null
                      }
                      placeholder="Buscar producto por nombre, SKU o descripción..."
                      isSearchable={true}
                      isClearable={true}
                      noOptionsMessage={() => "No se encontraron productos"}
                      className="w-full"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          borderColor: '#d1d5db',
                          borderRadius: '0.5rem',
                          padding: '0.125rem'
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 50
                        })
                      }}
                    />
                    {tipoComprobante === 'nota_credito' && facturaVentaOriginalId ? (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Solo productos de la factura seleccionada
                      </p>
                    ) : tipoComprobante === 'nota_credito' ? (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Crédito comercial: productos libres con precio manual
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Escribí para buscar por nombre, SKU o descripción
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadVenta}
                      onChange={(e) => setCantidadVenta(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Precio Unit.</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={precioVenta}
                      onChange={(e) => setPrecioVenta(Number(e.target.value))}
                      placeholder="0 = Auto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <button
                      onClick={agregarAlCarrito}
                      className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Carrito */}
              {carrito.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">
                    {tipoComprobante === 'nota_credito' 
                      ? '🔴 Productos a Acreditar/Devolver' 
                      : '📦 Productos a Vender'} ({carrito.length} items)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {carrito.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.producto_nombre || 'Producto'}</span>
                            {item.producto_sku && (
                              <span className="text-xs text-gray-500 font-mono">SKU: {item.producto_sku}</span>
                            )}
                          </div>
                        </div>
                        {/* Inputs editables para cantidad y precio */}
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <label className="block text-xs text-gray-500">Cant.</label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-500">Precio Unit.</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.precio_unitario}
                              onChange={(e) => actualizarItem(index, 'precio_unitario', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-xs text-gray-500 block">Subtotal</span>
                            <span className="font-medium text-gray-900">{formatCurrency(item.subtotal)}</span>
                          </div>
                          <button
                            onClick={() => eliminarDelCarrito(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totales (SIN IVA - monotributo) */}
                  <div className="mt-4 border-t pt-4 space-y-2">
                    <div className="flex justify-between text-lg font-bold text-green-600 border-t pt-2">
                      <span>{tipoComprobante === 'nota_credito' ? 'Total Nota de Crédito:' : 'Total Venta:'}</span>
                      <span>{formatCurrency(totalCarrito)}</span>
                    </div>
                    <p className="text-xs text-gray-500 text-right">
                      IVA no discriminado (Monotributo)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={abrirVistaPrevia}
                disabled={carrito.length === 0 || !formData.cliente_id || Object.keys(formErrors).length > 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:bg-gray-400"
              >
                👁️ Vista Previa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="flex justify-between items-center border-b pb-3 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-800">
                {tipoComprobante === 'nota_credito' 
                  ? '🔴 Vista Previa - Nota de Crédito de Cliente' 
                  : '📄 Vista Previa - Factura de Venta'}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Datos del Comprobante */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-600">Tipo Comprobante</p>
                  <p className="font-semibold">{formData.tipo_comprobante}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">N° Interno</p>
                  <p className="font-semibold text-green-600">Se genera al confirmar</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Punto de Venta</p>
                  <p className="font-semibold">{formData.punto_venta.toString().padStart(4, '0')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">N° Factura</p>
                  <p className="font-semibold text-blue-600">
                    {formData.punto_venta}-???????? <span className="text-xs text-gray-500">(Auto)</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-semibold">
                    {clientesList.find(c => c.id === formData.cliente_id)?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha</p>
                  <p className="font-semibold">{new Date().toLocaleDateString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Medio de Pago</p>
                  <p className="font-semibold capitalize">{formData.medio_pago}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencimiento</p>
                  <p className="font-semibold">
                    {formData.fecha_vencimiento
                      ? new Date(formData.fecha_vencimiento).toLocaleDateString('es-AR')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Atención:</strong> Al confirmar, {tipoComprobante === 'nota_credito' ? 'esta nota de crédito va a:' : 'esta factura va a:'}
                </p>
                <ul className="text-sm text-yellow-800 mt-1 ml-4 list-disc">
                  {tipoComprobante === 'nota_credito' ? (
                    <>
                      <li>Reintegrar stock de los productos</li>
                      <li>Registrar la devolución/ajuste</li>
                      <li>Reducir deuda en Cuenta Corriente del Cliente</li>
                    </>
                  ) : (
                    <>
                      <li>Restar stock de los productos</li>
                      <li>Registrar la venta</li>
                      <li>Generar movimiento en Cuenta Corriente del Cliente</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Efecto en Cuenta Corriente */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <p className="text-sm text-blue-800">
                  💰 <strong>Efecto en Cuenta Corriente:</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-1 ml-4 list-disc">
                  {tipoComprobante === 'nota_credito' ? (
                    <>
                      <li>Saldo cliente: <strong className="text-green-600">Reduce deuda en ${totalCarrito.toFixed(2)}</strong></li>
                      <li>Crédito a favor del cliente</li>
                      <li>Se aplica automáticamente en cuenta corriente</li>
                    </>
                  ) : formData.medio_pago === 'cta_cte' ? (
                    <>
                      <li>Saldo cliente: <strong className="text-red-600">Aumenta en ${totalCarrito.toFixed(2)}</strong></li>
                      <li>Deuda pendiente de cobro</li>
                      <li>Podés registrar cobros parciales después</li>
                    </>
                  ) : (
                    <>
                      <li>Saldo cliente: <strong className="text-green-600">No cambia (pago inmediato)</strong></li>
                      <li>Cobro registrado automáticamente</li>
                      <li>No queda deuda pendiente</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Tabla de Productos */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Productos ({carrito.length} items)</h4>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Producto</th>
                      <th className="px-3 py-2 text-right">Cantidad</th>
                      <th className="px-3 py-2 text-right">Precio Unit.</th>
                      <th className="px-3 py-2 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-3 py-2">{item.producto_nombre || 'Producto'}</td>
                        <td className="px-3 py-2 text-right">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right">${item.precio_unitario.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          ${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="bg-gray-100 rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Factura:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${totalCarrito.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Observaciones */}
              {formData.observaciones && (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Observaciones:</p>
                  <p className="text-sm text-gray-800">{formData.observaciones}</p>
                </div>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 border-t pt-4 px-6 py-4">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                ← Volver y Editar
              </button>
              <button
                onClick={confirmarFCVenta}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Spinner size="sm" color="white" />}
                {loading ? (tipoComprobante === 'nota_credito' ? 'Creando Nota de Crédito...' : 'Creando Factura...') 
                         : (tipoComprobante === 'nota_credito' ? '✅ Confirmar Nota de Crédito' : '✅ Confirmar Factura')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Nuevo Cliente" */}
      {showNuevoClienteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">➕ Nuevo Cliente</h3>
              <button
                onClick={() => setShowNuevoClienteModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre / Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nuevoClienteData.nombre}
                  onChange={(e) => setNuevoClienteData({...nuevoClienteData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Juan Pérez o Razón Social S.A."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CUIT <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteData.cuit}
                    onChange={(e) => setNuevoClienteData({...nuevoClienteData, cuit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="20-12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoClienteData.telefono}
                    onChange={(e) => setNuevoClienteData({...nuevoClienteData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="261-1234567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="email"
                  value={nuevoClienteData.email}
                  onChange={(e) => setNuevoClienteData({...nuevoClienteData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condición IVA
                  </label>
                  <select
                    value={nuevoClienteData.condicion_iva}
                    onChange={(e) => setNuevoClienteData({...nuevoClienteData, condicion_iva: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="consumidor_final">Consumidor Final</option>
                    <option value="responsable_inscripto">Responsable Inscripto</option>
                    <option value="monotributista">Monotributista</option>
                    <option value="exento">Exento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={nuevoClienteData.tipo_cliente}
                    onChange={(e) => setNuevoClienteData({...nuevoClienteData, tipo_cliente: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="minorista">Minorista</option>
                    <option value="mayorista">Mayorista</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4 mt-4">
              <button
                onClick={() => setShowNuevoClienteModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loadingCrearCliente}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearCliente}
                disabled={loadingCrearCliente || !nuevoClienteData.nombre.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingCrearCliente && <Spinner size="sm" color="white" />}
                {loadingCrearCliente ? 'Guardando...' : '✅ Guardar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
