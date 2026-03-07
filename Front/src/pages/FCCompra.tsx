// src/pages/FCCompra.tsx
// Gestión de Facturas de Compra a Proveedores + Actualización de Stock

import { useState, useEffect, useRef } from 'react'
import { fcCompra, proveedores, productos, type FCCompra, Proveedor, Producto } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { validarFechaNoFutura } from '../utils/validaciones'
import { useLoading } from '../hooks/useLoading'
import { Spinner } from '../components/Spinner'
import { toast } from 'react-toastify'
import { Plus, Package, Truck } from 'lucide-react'
import Select from 'react-select'

// Factura de Compra extendida con propiedades del backend
interface FCCompraCompleta extends Omit<FCCompra, 'proveedor_nombre'> {
  id: number
  numero_factura: string
  numero_remision?: string
  fecha: string
  proveedor_id: number
  estado: 'registrada' | 'anulada'
  total: number
  subtotal: number
  impuestos?: number
  medio_pago?: string
  observaciones?: string
}

// Detalle de factura de compra
interface FCCompraDetalle {
  producto_id: number
  producto_nombre?: string
  cantidad: number
  costo_unitario: number
  subtotal: number
}

// Producto con stock actual
interface ProductoConStock extends Producto {
  stock_actual?: number
  costo_promedio?: number
}

export default function FCCompra() {
  // Estados principales
  const [comprasList, setComprasList] = useState<FCCompraCompleta[]>([])
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([])
  const [productosList, setProductosList] = useState<ProductoConStock[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<'all' | 'registrada' | 'anulada'>('all')
  const [filtroProveedor, setFiltroProveedor] = useState<number | 'all'>('all')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    proveedor_id: null as number | null,
    estado: 'registrada' as 'registrada' | 'anulada',
    medio_pago: 'transferencia',
    numero_remision: '',
    numero_factura: '',
    fecha_emision: '',
    fecha_vencimiento: '',
    observaciones: '',
    detalles: [] as FCCompraDetalle[]
  })
  const [carrito, setCarrito] = useState<FCCompraDetalle[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<number | null>(null)
  const [cantidadCompra, setCantidadCompra] = useState(1)
  const [costoCompra, setCostoCompra] = useState(0)

  // 🔴 NUEVO: Tipo de comprobante (Compra o Nota de Crédito)
  const [tipoComprobante, setTipoComprobante] = useState<'compra' | 'nota_credito'>('compra')

  // 🔴 NUEVO: Factura de Compra original para NC de Proveedores
  const [facturaCompraOriginalId, setFacturaCompraOriginalId] = useState<number | null>(null)
  const [facturaCompraOriginalItems, setFacturaCompraOriginalItems] = useState<Array<{
    producto_id: number
    producto_nombre: string
    cantidad: number
    costo_unitario: number
    subtotal: number
  }>>([])
  const [loadingFactura, setLoadingFactura] = useState(false)

  // ⚠️ FIX: Vista previa y validación
  const [showPreview, setShowPreview] = useState(false)
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({})

  // ⚠️ FIX: Validación de unicidad de N° Factura con debounce
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [validandoFactura, setValidandoFactura] = useState(false)

  // 🔴 Modal "Nuevo Proveedor"
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false)
  const [nuevoProveedorData, setNuevoProveedorData] = useState({
    nombre: '',
    cuit: '',
    email: '',
    telefono: '',
    direccion: '',
    contacto: '',
    condicion_iva: 'responsable_inscripto' as 'consumidor_final' | 'responsable_inscripto' | 'monotributista' | 'exento'
  })
  const [loadingCrearProveedor, setLoadingCrearProveedor] = useState(false)

  useEffect(() => {
    const validarUnicidadFactura = async () => {
      const numero = formData.numero_factura.trim()
      const proveedorId = formData.proveedor_id
      
      // Limpiar validación anterior si no hay datos completos
      if (!numero || !proveedorId) {
        setFormErrors(prev => {
          const { numero_factura, ...rest } = prev
          return rest
        })
        return
      }

      setValidandoFactura(true)
      
      // Esperar debounce de 500ms
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      debounceRef.current = setTimeout(async () => {
        try {
          const response = await fcCompra.verificarNumero(numero, proveedorId)
          if (response.data?.existe) {
            setFormErrors(prev => ({
              ...prev,
              numero_factura: 'Ya existe una factura con este número para este proveedor'
            }))
          } else {
            // Remover error si existe
            setFormErrors(prev => {
              const { numero_factura, ...rest } = prev
              return rest
            })
          }
        } catch (err) {
          console.error('Error al verificar número de factura:', err)
        } finally {
          setValidandoFactura(false)
        }
      }, 500)
    }

    validarUnicidadFactura()
    
    // Cleanup: limpiar timeout al desmontar o cambiar datos
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [formData.numero_factura, formData.proveedor_id])

  // 🔴 Cargar detalles de factura original para NC de Proveedores
  useEffect(() => {
    const cargarDatosFactura = async () => {
      if (!facturaCompraOriginalId) {
        setFacturaCompraOriginalItems([])
        return
      }

      setLoadingFactura(true)
      try {
        const response = await fetch(`/api/fc-compra/${facturaCompraOriginalId}`, {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }
        })
        const data = await response.json()

        if (data.detalles?.length) {
          const items = data.detalles.map((d: any) => ({
            producto_id: d.producto_id,
            producto_nombre: productosList.find(p => p.id === d.producto_id)?.nombre || 'Producto',
            cantidad: d.cantidad,
            costo_unitario: d.costo_unitario,
            subtotal: d.subtotal
          }))

          setFacturaCompraOriginalItems(items)
          setCarrito(items)  // Precargar carrito con items de la factura
        }
      } catch (err) {
        toast.error('No se pudieron cargar los productos de la factura')
      } finally {
        setLoadingFactura(false)
      }
    }

    cargarDatosFactura()
  }, [facturaCompraOriginalId])

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [filtroEstado, filtroProveedor])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filtroEstado !== 'all') params.estado = filtroEstado
      if (filtroProveedor !== 'all') params.proveedor_id = String(filtroProveedor)

      const [comprasRes, proveedoresRes, productosRes] = await Promise.all([
        fcCompra.getAll(params),
        proveedores.getAll(),
        productos.getAll()
      ])

      if (comprasRes.error) throw new Error(comprasRes.error)
      if (proveedoresRes.error) throw new Error(proveedoresRes.error)
      if (productosRes.error) throw new Error(productosRes.error)

      setComprasList((comprasRes.data as unknown as FCCompraCompleta[]) || [])
      setProveedoresList(proveedoresRes.data || [])
      setProductosList((productosRes.data as unknown as ProductoConStock[]) || [])
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleCrear = () => {
    setEditandoId(null)
    setFormData({
      proveedor_id: null,
      estado: 'registrada',
      medio_pago: 'transferencia',
      numero_remision: '',
      numero_factura: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      observaciones: '',
      detalles: []
    })
    setCarrito([])
    setProductoSeleccionado(null)
    setCantidadCompra(1)
    setCostoCompra(0)
    setShowModal(true)
  }

  // Abrir modal para editar
  const handleEditar = async (compra: FCCompraCompleta) => {
    setEditandoId(compra.id)
    setFormData({
      proveedor_id: compra.proveedor_id,
      estado: compra.estado,
      medio_pago: compra.medio_pago || 'transferencia',
      numero_remision: compra.numero_remision || '',
      numero_factura: compra.numero_factura || '',
      fecha_vencimiento: '',
      observaciones: compra.observaciones || '',
      detalles: []
    })

    // ⚠️ FIX: Cargar detalles de la compra para editar
    try {
      const response = await fcCompra.getById(compra.id)
      if (response.data) {
        const compraCompleta = response.data as any
        if (compraCompleta.detalles && Array.isArray(compraCompleta.detalles)) {
          const itemsEdit: FCCompraDetalle[] = compraCompleta.detalles.map((d: any) => ({
            producto_id: d.producto_id,
            producto_nombre: productosList.find(p => p.id === d.producto_id)?.nombre || 'Producto',
            cantidad: parseFloat(String(d.cantidad)),
            costo_unitario: parseFloat(String(d.costo_unitario)),
            subtotal: parseFloat(String(d.subtotal))
          }))
          setCarrito(itemsEdit)
        }
      }
    } catch (err) {
      console.error('Error al cargar detalles de compra:', err)
    }

    setShowModal(true)
  }

  // Agregar producto al carrito
  const agregarAlCarrito = () => {
    if (!productoSeleccionado || cantidadCompra <= 0) return

    const producto = productosList.find(p => p.id === productoSeleccionado)
    if (!producto) return

    // 🔒 VALIDACIÓN: Si hay factura, solo productos de esa factura
    if (tipoComprobante === 'nota_credito' && facturaCompraOriginalId && facturaCompraOriginalItems) {
      const itemOriginal = facturaCompraOriginalItems.find(fi => fi.producto_id === productoSeleccionado)
      if (!itemOriginal) {
        toast.error('Solo podés acreditar productos de la factura original')
        return
      }

      // Validar cantidad no exceda lo facturado
      const cantidadEnCarrito = carrito
        .filter(item => item.producto_id === productoSeleccionado)
        .reduce((sum, item) => sum + item.cantidad, 0)

      if (cantidadEnCarrito + cantidadCompra > itemOriginal.cantidad) {
        toast.error(`No podés acreditar más de ${itemOriginal.cantidad} unidades (ya tenés ${cantidadEnCarrito} en el carrito)`)
        return
      }
    }

    // Calcular costo: Si hay factura, usar costo original; si no, precio manual o costo promedio
    let costo_unitario: number
    if (tipoComprobante === 'nota_credito' && facturaCompraOriginalItems?.length && facturaCompraOriginalId) {
      const itemOriginal = facturaCompraOriginalItems.find(fi => fi.producto_id === productoSeleccionado)
      costo_unitario = itemOriginal?.costo_unitario || 0  // ← Precio original de compra
    } else {
      // NC sin factura original (crédito comercial) o compra normal: usar precio manual o costo promedio
      costo_unitario = costoCompra > 0 ? costoCompra : (producto.costo_promedio || 0)
    }

    const nuevoItem: FCCompraDetalle = {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      cantidad: cantidadCompra,
      costo_unitario: costo_unitario,
      subtotal: cantidadCompra * costo_unitario
    }

    setCarrito([...carrito, nuevoItem])
    setProductoSeleccionado(null)
    setCantidadCompra(1)
    setCostoCompra(0)
  }

  // Eliminar item del carrito
  const eliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index))
  }

  // ⚠️ FIX: Actualizar item en tiempo real y recalcular total
  const actualizarItem = (index: number, field: 'cantidad' | 'costo_unitario', value: number) => {
    const nuevosItems = [...carrito]
    if (nuevosItems[index]) {
      nuevosItems[index] = { 
        ...nuevosItems[index], 
        [field]: value,
        subtotal: field === 'cantidad' 
          ? value * nuevosItems[index].costo_unitario 
          : nuevosItems[index].cantidad * value
      }
      setCarrito(nuevosItems)
    }
  }

  // Calcular total del carrito (SIN IVA - monotributista)
  const subtotalCarrito = carrito.reduce((sum, item) => sum + item.subtotal, 0)
  const totalCarrito = subtotalCarrito  // Total = Subtotal (sin IVA)

  // ⚠️ FIX: Validar formulario en tiempo real
  useEffect(() => {
    const errores: {[key: string]: string} = {}
    if (!formData.numero_factura.trim()) errores.numero_factura = 'Obligatorio'
    if (!formData.proveedor_id) errores.proveedor_id = 'Obligatorio'
    if (carrito.length === 0) errores.carrito = 'Al menos 1 producto'
    // Validar fecha emisión no futura
    if (formData.fecha_emision) {
      const resultadoFecha = validarFechaNoFutura(formData.fecha_emision)
      if (!resultadoFecha.valido && resultadoFecha.mensaje) errores.fecha_emision = resultadoFecha.mensaje
    }
    // Validar fecha vencimiento no futura
    if (formData.fecha_vencimiento) {
      const resultadoFecha = validarFechaNoFutura(formData.fecha_vencimiento)
      if (!resultadoFecha.valido && resultadoFecha.mensaje) errores.fecha_vencimiento = resultadoFecha.mensaje
    }
    setFormErrors(errores)
  }, [formData.numero_factura, formData.proveedor_id, carrito, formData.fecha_vencimiento, formData.fecha_emision])

  // ⚠️ FIX: Confirmar y guardar FC con loading
  const confirmarFCCompra = async () => {
    const errores: {[key: string]: string} = {}
    if (!formData.numero_factura.trim()) errores.numero_factura = 'Ingresá el N° de Factura'
    if (!formData.proveedor_id) errores.proveedor_id = 'Seleccioná un Proveedor'
    if (carrito.length === 0) errores.carrito = 'Agregá al menos 1 producto'
    if (formData.fecha_emision) {
      const resultadoFecha = validarFechaNoFutura(formData.fecha_emision)
      if (!resultadoFecha.valido && resultadoFecha.mensaje) errores.fecha_emision = resultadoFecha.mensaje
    }
    if (formData.fecha_vencimiento) {
      const resultadoFecha = validarFechaNoFutura(formData.fecha_vencimiento)
      if (!resultadoFecha.valido && resultadoFecha.mensaje) errores.fecha_vencimiento = resultadoFecha.mensaje
    }

    if (Object.keys(errores).length > 0) {
      setFormErrors(errores)
      toast.error('Completá los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      const payload: FCCompraCreate & { tipo_comprobante?: string } = {
        numero_factura: formData.numero_factura.trim(),
        proveedor_id: formData.proveedor_id!,
        fecha: formData.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        numero_remision: formData.numero_remision || undefined,
        medio_pago: formData.medio_pago,
        observaciones: formData.observaciones || undefined,
        detalles: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: parseFloat(String(item.cantidad)),
          costo_unitario: parseFloat(String(item.costo_unitario))
        })),
        tipo_comprobante: tipoComprobante  // ← Agregar campo
      }

      console.log('DEBUG [payload FC]:', payload)

      const response = await fcCompra.create(payload)
      console.log('DEBUG [response FC]:', response)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        toast.error(errorMsg)
      } else {
        const numeroInterno = (response.data as any)?.numero_interno || 'registrada'
        
        // ✅ FIX: Guardar cambios de precio para el filtro "Solo precios que cambiaron"
        const productosConCambios = (response.data as any)?.productos_con_cambios || []
        if (productosConCambios.length > 0) {
          // Guardar en localStorage para que Precios.tsx pueda leerlos
          const preciosCambiados: Record<number, number> = {}
          productosConCambios.forEach((prod: any) => {
            preciosCambiados[prod.id] = prod.precio_venta_anterior
          })
          
          const preciosGuardados = JSON.parse(localStorage.getItem('fc_compra_precios_cambiados') || '{}')
          localStorage.setItem('fc_compra_precios_cambiados', JSON.stringify({
            ...preciosGuardados,
            ...preciosCambiados
          }))
          
          console.log('✅ FC Compra: Guardados', productosConCambios.length, 'cambios de precio en localStorage')
        }
        
        toast.success(`FC ${numeroInterno} creada correctamente`)
        setShowPreview(false)
        setShowModal(false)
        resetForm()
        cargarDatos()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al confirmar')
      console.error('FC Compra error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ⚠️ FIX: Abrir vista previa
  const abrirVistaPrevia = () => {
    const errores: {[key: string]: string} = {}

    if (!formData.numero_factura.trim()) errores.numero_factura = 'Ingresá el N° de Factura'
    if (!formData.proveedor_id) errores.proveedor_id = 'Seleccioná un Proveedor'
    if (carrito.length === 0) errores.carrito = 'Agregá al menos 1 producto'

    if (formData.fecha_emision) {
      const resultadoFecha = validarFechaNoFutura(formData.fecha_emision)
      if (!resultadoFecha.valido && resultadoFecha.mensaje) errores.fecha_emision = resultadoFecha.mensaje
    }
    if (formData.fecha_vencimiento) {
      const resultadoFecha = validarFechaNoFutura(formData.fecha_vencimiento)
      if (!resultadoFecha.valido && resultadoFecha.mensaje) errores.fecha_vencimiento = resultadoFecha.mensaje
    }

    if (Object.keys(errores).length > 0) {
      setFormErrors(errores)
      toast.error('Completá los campos obligatorios')
      return
    }

    setShowPreview(true)
  }

  // ⚠️ FIX: Resetear formulario
  const resetForm = () => {
    setFormData({
      proveedor_id: null,
      estado: 'registrada',
      medio_pago: 'transferencia',
      numero_remision: '',
      numero_factura: '',
      fecha_emision: '',
      fecha_vencimiento: '',
      observaciones: '',
      detalles: []
    })
    setCarrito([])
    setProductoSeleccionado(null)
    setCantidadCompra(1)
    setCostoCompra(0)
    setFormErrors({})
    setTipoComprobante('compra')  // ← Resetear tipo a compra
    setFacturaCompraOriginalId(null)  // ← Resetear factura original
    setFacturaCompraOriginalItems([])  // ← Resetear items
  }

  // 🔴 Crear nuevo proveedor
  const handleCrearProveedor = async () => {
    if (!nuevoProveedorData.nombre.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setLoadingCrearProveedor(true)
    try {
      const response = await proveedores.create(nuevoProveedorData)
      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        toast.error(errorMsg)
      } else {
        const nuevoProveedor = response.data as any
        toast.success(`Proveedor "${nuevoProveedor.nombre}" creado correctamente`)
        
        // Refrescar lista de proveedores
        const proveedoresRes = await proveedores.getAll()
        if (!proveedoresRes.error) {
          setProveedoresList((proveedoresRes.data as any[]) || [])
        }
        
        // Seleccionar el nuevo proveedor
        setFormData({ ...formData, proveedor_id: nuevoProveedor.id })
        
        // Cerrar modal y limpiar
        setShowNuevoProveedorModal(false)
        setNuevoProveedorData({
          nombre: '',
          cuit: '',
          email: '',
          telefono: '',
          direccion: '',
          contacto: '',
          condicion_iva: 'responsable_inscripto'
        })
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al crear proveedor')
    } finally {
      setLoadingCrearProveedor(false)
    }
  }

  // Guardar compra (para editar - directo sin preview)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formData.proveedor_id) {
        toast.error('Seleccioná un proveedor')
        return
      }
      if (!formData.numero_factura.trim()) {
        toast.error('Ingresá el N° de Factura del proveedor')
        return
      }
      if (carrito.length === 0) {
        toast.error('Agregá al menos un producto')
        return
      }

      const payload: FCCompraCreate = {
        numero_factura: formData.numero_factura.trim(),
        proveedor_id: formData.proveedor_id,
        fecha: formData.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        numero_remision: formData.numero_remision || undefined,
        medio_pago: formData.medio_pago,
        observaciones: formData.observaciones || undefined,
        detalles: carrito.map(item => ({
          producto_id: item.producto_id,
          cantidad: parseFloat(String(item.cantidad)),
          costo_unitario: parseFloat(String(item.costo_unitario))
        }))
      }

      console.log('DEBUG [payload FC]:', payload)

      const response = await fcCompra.update(editandoId!, payload)
      console.log('DEBUG [response FC]:', response)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        toast.error(errorMsg)
      } else {
        toast.success('Factura de Compra actualizada')
        setShowModal(false)
        cargarDatos()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
      console.error('Compra error:', err)
    }
  }

  // Las compras ya vienen filtradas del backend
  const comprasMostradas = comprasList

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">FC Compra</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná facturas de compra a proveedores y entrada de stock</p>
        </div>
        <button
          onClick={handleCrear}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          📦 Nuevo Comprobante de Compra
        </button>
      </div>

      {/* Info box */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
        <Truck className="text-indigo-600 flex-shrink-0" size={20} />
        <div className="text-sm text-indigo-800">
          <p className="font-medium">Flujo de Facturas de Compra</p>
          <p className="mt-1">
            1. Creá una FC → 2. El stock y costo se actualizan → 3. Podés anular la FC (revierte stock y costo)
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filtro por Proveedor */}
          <select
            value={filtroProveedor}
            onChange={(e) => setFiltroProveedor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los Proveedores</option>
            {proveedoresList.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as 'all' | 'registrada' | 'anulada')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">📋 Todas</option>
            <option value="registrada">✅ Registradas</option>
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
              setFiltroProveedor('all')
              setFiltroEstado('all')
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            🔄 Limpiar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && comprasList.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Tabla de Compras */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Factura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {comprasMostradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No hay facturas de compra registradas
                  </td>
                </tr>
              ) : (
                comprasMostradas.map((compra) => {
                  return (
                    <tr key={compra.id} className="hover:bg-gray-50">
                      {/* ✅ SOLO NÚMERO DE FACTURA (no numero_interno) */}
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        {compra.numero_factura || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(compra.fecha)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{(compra as any).proveedor_nombre || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          compra.estado === 'registrada' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {compra.estado === 'registrada' ? '✅ Registrada' : '❌ Anulada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">
                        {compra.medio_pago || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right text-indigo-600">
                        {formatCurrency(compra.total)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        {compra.estado === 'registrada' ? (
                          <>
                            <button
                              onClick={() => handleEditar(compra)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar FC"
                            >
                              ✏️ Editar
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">No modificable</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nueva Factura de Compra */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
              <h3 className={`text-lg font-semibold ${
                tipoComprobante === 'nota_credito' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
              }`}>
                {tipoComprobante === 'nota_credito' ? '🔴 Nueva Nota de Crédito de Proveedor' : '📦 Nueva Factura de Compra'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Datos principales */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Proveedor <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.proveedor_id || ''}
                      onChange={(e) => setFormData({...formData, proveedor_id: e.target.value ? Number(e.target.value) : null})}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                        formErrors.proveedor_id ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {proveedoresList.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowNuevoProveedorModal(true)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                      title="Crear nuevo proveedor"
                    >
                      ➕ Nuevo Proveedor
                    </button>
                  </div>
                  {formErrors.proveedor_id && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.proveedor_id}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Tipo de Operación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipoComprobante}
                    onChange={(e) => setTipoComprobante(e.target.value as 'compra' | 'nota_credito')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="compra">🟢 Factura de Compra</option>
                    <option value="nota_credito">🔴 Nota de Crédito de Proveedor</option>
                  </select>
                  {tipoComprobante === 'nota_credito' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ℹ️ Para devoluciones de mercadería o ajustes de precio
                    </p>
                  )}
                </div>
              </div>

              {/* 🔍 DEBUG - Remover después */}
              {typeof window !== 'undefined' && ((): null => {
                console.log('🔍 Debug Selector FC:', {
                  proveedor_seleccionado: formData.proveedor_id,
                  tipo_proveedor: typeof formData.proveedor_id,
                  compras_en_lista: comprasList?.length,
                  compras_mismo_proveedor_strict: comprasList?.filter(c => c.proveedor_id === formData.proveedor_id)?.length,
                  compras_mismo_proveedor_flexible: comprasList?.filter(c => String(c.proveedor_id) === String(formData.proveedor_id))?.length,
                  ids_en_lista: comprasList?.map(c => ({ id: c.id, prov_id: c.proveedor_id, tipo: typeof c.proveedor_id })),
                  estados_disponibles: [...new Set(comprasList?.map(c => c.estado))]
                })
                return null
              })()}

              {/* Selector de factura original (solo para NC de Proveedores) */}
              {tipoComprobante === 'nota_credito' && formData.proveedor_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Factura de Compra Original <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
                  </label>
                  <select
                    value={facturaCompraOriginalId || ''}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null
                      setFacturaCompraOriginalId(id)
                      if (!id) setFacturaCompraOriginalItems([])
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  >
                    <option value="">Seleccionar factura...</option>
                    {comprasList
                      .filter(c => {
                        const mismoProveedor = String(c.proveedor_id) === String(formData.proveedor_id)
                        const estadoOk = c.estado === 'registrada'
                        return mismoProveedor && estadoOk
                      })
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.numero_factura} - ${c.total} ({formatDate(c.fecha)})
                        </option>
                      ))}
                  </select>
                  {loadingFactura && <p className="text-xs text-blue-600 mt-1">⏳ Cargando...</p>}
                  {facturaCompraOriginalId ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      💡 Los productos se cargarán automáticamente
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      💡 Dejá vacío para crédito comercial (productos libres)
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    N° Factura Proveedor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.numero_factura}
                      onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                        formErrors.numero_factura ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } ${validandoFactura ? 'opacity-75' : ''}`}
                      placeholder="ej: 999 257630"
                      required
                    />
                    {validandoFactura && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>
                  {formErrors.numero_factura && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.numero_factura}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ℹ️ Formato libre (como figura en el comprobante del proveedor)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    N° Remito <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.numero_remision}
                    onChange={(e) => setFormData({...formData, numero_remision: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    placeholder="opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={formData.fecha_emision}
                    onChange={(e) => setFormData({...formData, fecha_emision: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      formErrors.fecha_emision ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.fecha_emision && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fecha_emision}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fecha de la factura</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Vencimiento <span className="text-gray-400 dark:text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento ? formData.fecha_vencimiento.split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                      formErrors.fecha_vencimiento ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.fecha_vencimiento && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.fecha_vencimiento}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Para cta. cte.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Medio de Pago</label>
                  {tipoComprobante === 'nota_credito' ? (
                    <div>
                      <input
                        type="text"
                        value="cta_cte"
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed dark:bg-gray-600 dark:border-gray-500 dark:text-gray-300"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 Las Notas de Crédito solo ajustan deuda (sin movimiento de dinero)
                      </p>
                    </div>
                  ) : (
                    <select
                      value={formData.medio_pago}
                      onChange={(e) => setFormData({...formData, medio_pago: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    >
                      <option value="cta_cte">📋 Cuenta Corriente (Deja deuda)</option>
                      <option value="efectivo">💵 Efectivo (Pago inmediato)</option>
                      <option value="transferencia">🏦 Transferencia (Pago inmediato)</option>
                      <option value="cheque">📄 Cheque (Pago inmediato)</option>
                    </select>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {tipoComprobante === 'nota_credito'
                      ? '💡 Las Notas de Crédito solo ajustan deuda (sin movimiento de dinero)'
                      : formData.medio_pago === 'cta_cte'
                      ? 'ℹ️ La deuda queda pendiente en cuenta corriente'
                      : 'ℹ️ El pago se registra automáticamente como recibido'}
                  </p>
                </div>
              </div>

              {/* Info monotributo */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 dark:bg-amber-900/30 dark:border-amber-600">
                <span className="text-amber-600 text-lg dark:text-amber-400">ℹ️</span>
                <p className="text-xs text-amber-900 dark:text-amber-100">
                  <strong>Monotributo:</strong> El IVA está incluido en el costo (no se discrimina).
                  Todo el valor de la compra es considerado costo del producto.
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  rows={2}
                  placeholder="Notas adicionales sobre la compra..."
                />
              </div>

              {/* Agregar productos */}
              <div className="border-t pt-4 dark:border-gray-600">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Package size={18} />
                  Agregar Productos
                </h4>
                <div className="grid grid-cols-5 gap-3 items-end">
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Producto *</label>
                    <Select
                      options={
                        (tipoComprobante === 'nota_credito' && facturaCompraOriginalItems?.length
                          ? productosList.filter(p => facturaCompraOriginalItems.some(fi => fi.producto_id === p.id))
                          : productosList
                        ).map(p => ({
                          value: p.id,
                          label: `${p.nombre} | SKU: ${p.sku || 'N/A'} | Stock: ${p.stock_actual ?? 0} | Costo: $${(p.costo_promedio ?? 0).toFixed(2)}`,
                          sku: p.sku,
                          costo: tipoComprobante === 'nota_credito' && facturaCompraOriginalItems?.length
                            ? facturaCompraOriginalItems.find(fi => fi.producto_id === p.id)?.costo_unitario || p.costo_promedio
                            : p.costo_promedio,
                          stock: p.stock_actual
                        }))
                      }
                      onChange={(selected) => {
                        if (selected) {
                          setProductoSeleccionado(selected.value)
                          setCostoCompra(selected.costo || 0)
                        }
                      }}
                      value={productoSeleccionado ?
                        productosList
                          .map(p => ({
                            value: p.id,
                            label: `${p.nombre} | SKU: ${p.sku || 'N/A'} | Stock: ${p.stock_actual ?? 0} | Costo: $${(p.costo_promedio ?? 0).toFixed(2)}`,
                            sku: p.sku,
                            costo: p.costo_promedio,
                            stock: p.stock_actual
                          }))
                          .find(opt => opt.value === productoSeleccionado)
                        : null
                      }
                      placeholder="Buscar producto por nombre o SKU..."
                      isSearchable={true}
                      isClearable={true}
                      noOptionsMessage={() => "No se encontraron productos"}
                      className="w-full"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          borderColor: state.isFocused ? '#6366f1' : '#d1d5db',
                          borderRadius: '0.5rem',
                          padding: '0.125rem',
                          backgroundColor: 'transparent',
                          boxShadow: state.isFocused ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : null
                        }),
                        menu: (base) => ({
                          ...base,
                          zIndex: 50,
                          backgroundColor: '#1f2937',
                          borderRadius: '0.5rem'
                        }),
                        menuList: (base) => ({
                          ...base,
                          padding: '4px'
                        }),
                        option: (base, state) => ({
                          ...base,
                          backgroundColor: state.isSelected
                            ? '#4f46e5'
                            : state.isFocused
                            ? '#374151'
                            : 'transparent',
                          color: '#f9fafb',
                          cursor: 'pointer',
                          padding: '8px 12px',
                          borderRadius: '4px'
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: '#111827'
                        }),
                        input: (base) => ({
                          ...base,
                          color: '#111827'
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: '#9ca3af'
                        }),
                        dropdownIndicator: (base) => ({
                          ...base,
                          color: '#6b7280'
                        }),
                        clearIndicator: (base) => ({
                          ...base,
                          color: '#6b7280'
                        }),
                        noOptionsMessage: (base) => ({
                          ...base,
                          color: '#9ca3af',
                          backgroundColor: 'transparent'
                        })
                      }}
                    />
                    {tipoComprobante === 'nota_credito' && facturaCompraOriginalId ? (
                      <p className="text-xs text-green-600 mt-1">
                        ✅ Solo productos de la factura seleccionada
                      </p>
                    ) : tipoComprobante === 'nota_credito' ? (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ Crédito comercial: productos libres con precio manual
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 Escribí para buscar por nombre, SKU o descripción
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={cantidadCompra}
                      onChange={(e) => setCantidadCompra(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Costo Unit.</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        tipoComprobante === 'nota_credito' && productoSeleccionado && facturaCompraOriginalItems?.find(fi => fi.producto_id === productoSeleccionado)?.costo_unitario
                        || costoCompra
                      }
                      onChange={(e) => !(tipoComprobante === 'nota_credito' && facturaCompraOriginalId) && setCostoCompra(Number(e.target.value))}
                      disabled={tipoComprobante === 'nota_credito' && !!facturaCompraOriginalId}
                      placeholder={tipoComprobante === 'nota_credito' && facturaCompraOriginalId ? 'De factura original' : '0 = Auto'}
                      className={`w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 ${
                        tipoComprobante === 'nota_credito' && facturaCompraOriginalId
                          ? 'bg-gray-100 cursor-not-allowed dark:bg-gray-600'
                          : 'focus:ring-2 focus:ring-indigo-500'
                      }`}
                    />
                    {tipoComprobante === 'nota_credito' && facturaCompraOriginalId && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">💡 Costo de la factura original (no editable)</p>
                    )}
                  </div>
                  <div>
                    <button
                      onClick={agregarAlCarrito}
                      className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>

              {/* Carrito */}
              {carrito.length > 0 && (
                <div className="border-t pt-4 dark:border-gray-600">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    {editandoId ? 'Editar Productos' : (
                      tipoComprobante === 'nota_credito' ? '🔴 Productos a Devolver/Descontar' : '📦 Productos a Comprar'
                    )} ({carrito.length} items)
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {carrito.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-100 p-3 rounded dark:bg-gray-600 dark:border dark:border-gray-500">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white">{item.producto_nombre || 'Producto'}</span>
                            {item.producto_nombre && (
                              <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">
                                {item.producto_nombre.includes('SKU:') ? '' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* ⚠️ FIX: Inputs editables para cantidad y costo */}
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <label className="block text-xs text-gray-600 dark:text-gray-300 font-medium">Cant.</label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs text-gray-600 dark:text-gray-300 font-medium">Costo Unit.</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.costo_unitario}
                              onChange={(e) => actualizarItem(index, 'costo_unitario', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm font-medium border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-500 dark:text-white"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium block">Subtotal</span>
                            <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.subtotal)}</span>
                          </div>
                          <button
                            onClick={() => eliminarDelCarrito(index)}
                            className="text-red-600 hover:text-red-800 p-1 dark:text-red-400 dark:hover:text-red-300"
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totales (SIN IVA - monotributo) */}
                  <div className="mt-4 border-t pt-4 space-y-2 dark:border-gray-600">
                    <div className="flex justify-between text-lg font-bold text-indigo-700 dark:text-indigo-300 border-t pt-2 dark:border-gray-600">
                      <span>Total Compra:</span>
                      <span>{formatCurrency(totalCarrito)}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 text-right font-medium">
                      IVA no discriminado (Monotributo)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              {editandoId ? (
                <button
                  onClick={handleGuardar}
                  disabled={carrito.length === 0 || !formData.proveedor_id}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Actualizar
                </button>
              ) : (
                <button
                  onClick={abrirVistaPrevia}
                  disabled={
                    carrito.length === 0 ||
                    !formData.proveedor_id ||
                    Object.keys(formErrors).length > 0 ||
                    validandoFactura
                  }
                  className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:bg-gray-400 ${
                    tipoComprobante === 'nota_credito'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {validandoFactura ? '⏳ Verificando...' : (
                    tipoComprobante === 'nota_credito' ? '🔴 Emitir Nota de Crédito' : '👁️ Vista Previa'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ FIX: Modal de Vista Previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Encabezado */}
            <div className="flex justify-between items-center border-b pb-3 px-6 py-4 dark:border-gray-600">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {tipoComprobante === 'nota_credito'
                  ? '🔴 Vista Previa - Nota de Crédito de Proveedor'
                  : '📄 Vista Previa - Factura de Compra'}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Datos del Comprobante */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded dark:bg-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">N° Factura Proveedor</p>
                  <p className="font-semibold dark:text-gray-100">{formData.numero_factura}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">N° Interno</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">Se genera al confirmar</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Proveedor</p>
                  <p className="font-semibold dark:text-gray-100">
                    {proveedoresList.find(p => p.id === formData.proveedor_id)?.nombre || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Fecha de Emisión</p>
                  <p className="font-semibold dark:text-gray-100">
                    {formData.fecha_emision
                      ? new Date(formData.fecha_emision).toLocaleDateString('es-AR')
                      : new Date().toLocaleDateString('es-AR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Medio de Pago</p>
                  <p className="font-semibold capitalize dark:text-gray-100">{formData.medio_pago}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Vencimiento</p>
                  <p className="font-semibold dark:text-gray-100">
                    {formData.fecha_vencimiento
                      ? new Date(formData.fecha_vencimiento).toLocaleDateString('es-AR')
                      : '-'}
                  </p>
                </div>
              </div>

              {/* Advertencia */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3 dark:bg-yellow-900/30 dark:border-yellow-700">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ <strong>Atención:</strong> Al confirmar, esta factura va a:
                </p>
                <ul className="text-sm text-yellow-800 dark:text-yellow-300 mt-1 ml-4 list-disc">
                  <li>Sumar stock de los productos</li>
                  <li>Actualizar el costo promedio</li>
                  <li>Recalcular precios de venta</li>
                  <li>Generar movimiento en Cuenta Corriente del Proveedor</li>
                </ul>
              </div>

              {/* Efecto en Cuenta Corriente */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3 dark:bg-blue-900/30 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  💰 <strong>Efecto en Cuenta Corriente:</strong>
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-300 mt-1 ml-4 list-disc">
                  {formData.medio_pago === 'cta_cte' ? (
                    <>
                      <li>Saldo proveedor: <strong className="text-red-600 dark:text-red-400">Aumenta en ${totalCarrito.toFixed(2)}</strong></li>
                      <li>Deuda pendiente de pago</li>
                      <li>Podés registrar pagos parciales después</li>
                    </>
                  ) : (
                    <>
                      <li>Saldo proveedor: <strong className="text-green-600">No cambia (pago inmediato)</strong></li>
                      <li>Recibo generado automáticamente</li>
                      <li>No queda deuda pendiente</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Tabla de Productos */}
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">Productos ({carrito.length} items)</h4>
                <table className="w-full text-sm">
                  <thead className="bg-gray-200 dark:bg-gray-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-bold text-gray-900 dark:text-white">Producto</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">Cantidad</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">Costo Unit.</th>
                      <th className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrito.map((item, idx) => (
                      <tr key={idx} className="border-b dark:border-gray-500">
                        <td className="px-3 py-2 font-bold text-gray-900 dark:text-white">{item.producto_nombre || 'Producto'}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">{item.cantidad}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">${item.costo_unitario.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-bold text-gray-900 dark:text-white">
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
                  <span className="text-lg font-semibold">
                    {tipoComprobante === 'nota_credito' ? 'Total Nota de Crédito:' : 'Total Factura:'}
                  </span>
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
                onClick={confirmarFCCompra}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Spinner size="sm" color="white" />}
                {loading ? 'Creando Comprobante...' : '✅ Confirmar Comprobante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Nuevo Proveedor" */}
      {showNuevoProveedorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">➕ Nuevo Proveedor</h3>
              <button
                onClick={() => setShowNuevoProveedorModal(false)}
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
                  value={nuevoProveedorData.nombre}
                  onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Distribuidora S.A."
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
                    value={nuevoProveedorData.cuit}
                    onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, cuit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="20-12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoProveedorData.contacto}
                    onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, contacto: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de contacto"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoProveedorData.telefono}
                    onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="261-1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={nuevoProveedorData.email}
                    onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="proveedor@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={nuevoProveedorData.direccion}
                  onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Calle 123, Mendoza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condición IVA
                </label>
                <select
                  value={nuevoProveedorData.condicion_iva}
                  onChange={(e) => setNuevoProveedorData({...nuevoProveedorData, condicion_iva: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributista">Monotributista</option>
                  <option value="exento">Exento</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4 mt-4">
              <button
                onClick={() => setShowNuevoProveedorModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loadingCrearProveedor}
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearProveedor}
                disabled={loadingCrearProveedor || !nuevoProveedorData.nombre.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingCrearProveedor && <Spinner size="sm" color="white" />}
                {loadingCrearProveedor ? 'Guardando...' : '✅ Guardar Proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}