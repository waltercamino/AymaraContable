// src/pages/Pedidos.tsx
// Gestión de Pedidos a Proveedores

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { pedidos as pedidosApi, proveedores, type Producto } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Search, ShoppingCart, FileText, CheckCircle, XCircle, Send, Mail, Copy, Truck } from 'lucide-react'

interface ProductoParaPedido {
  id: number
  nombre: string
  sku?: string
  stock_actual: number
  stock_minimo: number
  precio_costo?: number
  proveedor_id?: number
  proveedor_nombre?: string
  categoria_nombre?: string
}

interface Pedido {
  id: number
  numero_interno: string
  fecha_pedido: string
  proveedor_id: number
  proveedor_nombre: string
  proveedor_telefono?: string  // ← Para WhatsApp
  proveedor_email?: string  // ← Para Email
  estado: string
  total_estimado: number
  creado_en?: string
  cantidad_productos?: number
  detalles?: any[]  // ← Para vista previa
}

export default function Pedidos() {
  const location = useLocation()

  // Estados principales
  const [vista, setVista] = useState<'armar' | 'historial'>('armar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 📦 Producto preseleccionado desde Dashboard
  const productoPreseleccionado = location.state?.productoPreseleccionado

  // Armar pedido
  const [todosProductos, setTodosProductos] = useState<ProductoParaPedido[]>([])
  const [productosSeleccionados, setProductosSeleccionados] = useState<Record<number, number>>({})
  const [listaPedido, setListaPedido] = useState<Array<{
    producto_id: number
    producto_nombre: string
    cantidad: number
    precio_costo: number
  }>>([])
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<number | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState<string>('')
  const [listaProveedores, setListaProveedores] = useState<any[]>([])

  // Historial
  const [listaPedidos, setListaPedidos] = useState<Pedido[]>([])
  const [filtroEstado, setFiltroEstado] = useState<string>('')
  const [filtroProveedorHistorial, setFiltroProveedorHistorial] = useState<string>('')
  const [previewPedido, setPreviewPedido] = useState<Pedido | null>(null)

  // 🔴 Modal "Vista Previa" (CON precios - solo interno)
  const [showVistaPrevia, setShowVistaPrevia] = useState(false)
  const [pedidoParaVistaPrevia, setPedidoParaVistaPrevia] = useState<any>(null)

  // 🔴 Modal "Nuevo Proveedor"
  const [showNuevoProveedorModal, setShowNuevoProveedorModal] = useState(false)
  const [nuevoProveedorData, setNuevoProveedorData] = useState({
    nombre: '',
    cuit: '',
    email: '',
    telefono: '',
    direccion: '',
    condicion_iva: 'responsable_inscripto' as 'consumidor_final' | 'responsable_inscripto' | 'monotributista' | 'exento'
  })
  const [loadingCrearProveedor, setLoadingCrearProveedor] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales()
  }, [])

  // Toggle producto seleccionado
  const toggleProducto = (productoId: number, cantidad: number = 10) => {
    setProductosSeleccionados(prev => ({
      ...prev,
      [productoId]: prev[productoId] ? 0 : cantidad
    }))
  }

  // Agregar producto a la lista de pedido
  const agregarAlPedido = (producto: ProductoParaPedido, cantidad: number) => {
    setListaPedido(prev => {
      const existe = prev.find(item => item.producto_id === producto.id)
      if (existe) {
        return prev.map(item => 
          item.producto_id === producto.id 
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [...prev, {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        cantidad,
        precio_costo: producto.precio_costo || 0
      }]
    })
    setProductosSeleccionados(prev => {
      const nuevo = { ...prev }
      delete nuevo[producto.id]
      return nuevo
    })
  }

  // Eliminar de la lista de pedido
  const eliminarDeLista = (productoId: number) => {
    setListaPedido(prev => prev.filter(item => item.producto_id !== productoId))
  }

  // 📦 Auto-seleccionar producto si viene desde Dashboard
  useEffect(() => {
    if (productoPreseleccionado?.id && todosProductos.length > 0) {
      const producto = todosProductos.find(p => p.id === productoPreseleccionado.id)
      if (producto) {
        // Auto-seleccionar con cantidad sugerida (reposición = stock_minimo)
        toggleProducto(producto.id, producto.stock_minimo || 10)
        setSuccess(`📦 ${productoPreseleccionado.nombre} agregado al pedido`)
        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setSuccess(''), 5000)
      }
    }
  }, [productoPreseleccionado, todosProductos])

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true)
      const [productosRes, proveedoresRes] = await Promise.all([
        pedidosApi.getProductos(),
        proveedores.getAll()
      ])

      if (productosRes.error) {
        const errorMsg = typeof productosRes.error === 'string' 
          ? productosRes.error 
          : (productosRes.error as any)?.detail?.[0]?.msg || 'Error al cargar productos'
        throw new Error(errorMsg)
      }
      if (proveedoresRes.error) {
        const errorMsg = typeof proveedoresRes.error === 'string' 
          ? proveedoresRes.error 
          : (proveedoresRes.error as any)?.detail?.[0]?.msg || 'Error al cargar proveedores'
        throw new Error(errorMsg)
      }

      setTodosProductos((productosRes.data as unknown as ProductoParaPedido[]) || [])
      setListaProveedores((proveedoresRes.data as any[]) || [])
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar datos'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Buscar productos (filtrado local)
  const productosFiltrados = todosProductos.filter(prod => {
    const matchBusqueda = !busqueda ||
      prod.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      prod.sku?.toLowerCase().includes(busqueda.toLowerCase())

    const matchProveedor = !filtroProveedor || prod.proveedor_id === Number(filtroProveedor)

    return matchBusqueda && matchProveedor
  })

  // Actualizar cantidad
  const actualizarCantidad = (productoId: number, cantidad: number) => {
    setProductosSeleccionados(prev => ({
      ...prev,
      [productoId]: Math.max(0, cantidad)
    }))
  }

  // Actualizar cantidad en lista de pedido
  const actualizarCantidadLista = (productoId: number, cantidad: number) => {
    setListaPedido(prev => prev.map(item => 
      item.producto_id === productoId ? { ...item, cantidad: Math.max(1, cantidad) } : item
    ))
  }

  // Calcular total estimado
  const totalEstimado = listaPedido.reduce((sum, item) => sum + (item.cantidad * item.precio_costo), 0)

  // Crear pedido
  const crearPedido = async () => {
    try {
      setError('')

      if (!proveedorSeleccionado) {
        setError('Debe seleccionar un proveedor')
        return
      }

      if (listaPedido.length === 0) {
        setError('Debe agregar al menos un producto al pedido')
        return
      }

      const detalles = listaPedido.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_costo: item.precio_costo
      }))

      const response = await pedidosApi.create({
        proveedor_id: proveedorSeleccionado,
        detalles
      })

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : (response.error as any)?.detail?.msg || 'Error al crear pedido'
        setError(errorMsg)
      } else {
        setSuccess(`Pedido ${response.data?.numero_interno} creado correctamente`)
        setListaPedido([])
        setProveedorSeleccionado(null)
        cargarHistorial()
        setVista('historial')
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear pedido'
      setError(errorMsg)
    }
  }

  // Cargar historial
  const cargarHistorial = async () => {
    try {
      setLoading(true)
      const params: Record<string, string> = {}
      if (filtroEstado) params.estado = filtroEstado
      if (filtroProveedorHistorial) params.proveedor_id = filtroProveedorHistorial

      const response = await pedidosApi.getAll(params)
      if (response.error) throw new Error(response.error)
      setListaPedidos((response.data as unknown as Pedido[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }

  // 📝 Generar mensaje SIN precios (para WhatsApp/Email externo)
  const generarMensajePedido = (pedido: any) => {
    // Verificar que hay detalles
    if (!pedido.detalles || pedido.detalles.length === 0) {
      console.error('⚠️ Pedido sin detalles:', pedido)
      return 'Error: Pedido sin productos'
    }
    
    // Construir líneas de productos
    const lineasProductos = pedido.detalles.map((detalle: any, index: number) => {
      const nombre = detalle.producto_nombre || `Producto ${index + 1}`
      const cantidad = detalle.cantidad || 0
      // Pad para alinear (nombre 30 chars, cantidad 8 chars)
      return `${nombre.padEnd(30)} ${String(cantidad).padStart(8)}`
    }).join('\n')
    
    // Mensaje SIN emojis problemáticos (usar texto o Unicode simple)
    const mensaje = 
`*AYMARA CONTABLE*
*PEDIDO DE COMPRA N° ${pedido.numero_interno}*
*Fecha:* ${formatDate(pedido.fecha_pedido)}

*Producto*                      *Cant.*
─────────────────────────────────────────
${lineasProductos}
─────────────────────────────────────────

*Precios sujetos a confirmación*
*Favor enviar confirmación con precios y disponibilidad*

─────────────────────────────────────────
*Contacto:* [nuestro teléfono]
*Dirección:* [nuestra dirección]
`
    
    console.log('🔍 [WHATSAPP] Mensaje generado:', mensaje) // Debug
    return mensaje
  }

  // 👁️ Generar vista previa CON precios (solo interno)
  const generarVistaPrevia = (pedido: any) => {
    const lineas = pedido.detalles?.map((d: any) => {
      const subtotal = d.cantidad * (d.precio_costo || 0)
      return `${d.producto_nombre.padEnd(20)} ${String(d.cantidad).padStart(6)}  ${String(d.precio_costo || 0).padStart(10)}  ${String(subtotal).padStart(10)}`
    }).join('\n') || ''
    
    const total = pedido.detalles?.reduce((sum: number, d: any) => sum + (d.cantidad * (d.precio_costo || 0)), 0) || 0
    
    return `📦 *VISTA PREVIA DEL PEDIDO* (INTERNO)
─────────────────────────────────────────────────────────
Proveedor: ${pedido.proveedor_nombre || 'N/A'}
Fecha: ${formatDate(pedido.fecha_pedido)}
Estado: ${pedido.estado}

*Producto*            *Cant.*   *Precio*   *Subtotal*
─────────────────────────────────────────────────────────
${lineas}
─────────────────────────────────────────────────────────
*TOTAL ESTIMADO: $${total.toLocaleString()}*

⚠️ *Precios internos de referencia - NO enviar al proveedor*
`.trim()
  }

  // 📱 Enviar por WhatsApp - AUTOMÁTICO (sin pedir teléfono)
  const enviarPorWhatsApp = async (pedido: any) => {
    console.log('🔍 [WHATSAPP] Pedido recibido:', pedido) // Debug
    console.log('🔍 [WHATSAPP] Detalles:', pedido.detalles) // Debug
    
    if (!pedido.proveedor_telefono) {
      setError('⚠️ El proveedor no tiene teléfono registrado.\n\nVaya a Sistema → Proveedores y agregue el teléfono con código de área (ej: 3521234567)')
      setTimeout(() => setError(''), 5000)
      return
    }
    
    const mensaje = generarMensajePedido(pedido)
    
    // URL directa de WhatsApp Web/App
    const url = `https://wa.me/${pedido.proveedor_telefono}?text=${encodeURIComponent(mensaje)}`
    
    console.log('🔍 [WHATSAPP] URL:', url) // Debug
    
    // Abrir en nueva pestaña
    window.open(url, '_blank')
    
    // Actualizar estado a "enviado"
    try {
      await pedidosApi.enviar(pedido.id, 'whatsapp')
      setSuccess('Pedido marcado como enviado por WhatsApp')
      cargarHistorial()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado')
      setTimeout(() => setError(''), 3000)
    }
  }

  // ✉️ Enviar por Email - AUTOMÁTICO (sin pedir email)
  const enviarPorEmail = async (pedido: any) => {
    if (!pedido.proveedor_email) {
      setError('⚠️ El proveedor no tiene email registrado.\n\nVaya a Sistema → Proveedores y agregue el email.')
      setTimeout(() => setError(''), 5000)
      return
    }
    
    const asunto = `Pedido de Compra N° ${pedido.numero_interno} - Aymara Contable`
    const cuerpo = generarMensajePedido(pedido)
    
    // Usar location.href para mailto (más compatible)
    window.location.href = `mailto:${pedido.proveedor_email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
    
    // Actualizar estado a "enviado"
    try {
      await pedidosApi.enviar(pedido.id, 'email')
      setSuccess('Pedido marcado como enviado por Email')
      cargarHistorial()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado')
      setTimeout(() => setError(''), 3000)
    }
  }

  // 🔴 Crear nuevo proveedor
  const handleCrearProveedor = async () => {
    if (!nuevoProveedorData.nombre.trim()) {
      setError('El nombre es obligatorio')
      setTimeout(() => setError(''), 3000)
      return
    }

    setLoadingCrearProveedor(true)
    try {
      const response = await proveedores.create(nuevoProveedorData)
      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        setError(errorMsg)
        setTimeout(() => setError(''), 3000)
      } else {
        const nuevoProveedor = response.data as any
        setSuccess(`Proveedor "${nuevoProveedor.nombre}" creado correctamente`)
        
        // Refrescar lista de proveedores
        const proveedoresRes = await proveedores.getAll()
        if (!proveedoresRes.error) {
          setListaProveedores((proveedoresRes.data as any[]) || [])
        }
        
        // Seleccionar el nuevo proveedor
        setProveedorSeleccionado(nuevoProveedor.id)
        
        // Cerrar modal y limpiar
        setShowNuevoProveedorModal(false)
        setNuevoProveedorData({
          nombre: '',
          cuit: '',
          email: '',
          telefono: '',
          direccion: '',
          condicion_iva: 'responsable_inscripto'
        })
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear proveedor'
      setError(errorMsg)
      setTimeout(() => setError(''), 3000)
    } finally {
      setLoadingCrearProveedor(false)
    }
  }

  // Enviar pedido
  const enviarPedido = async (pedidoId: number, medio: 'whatsapp' | 'email') => {
    try {
      const response = await pedidosApi.enviar(pedidoId, medio)
      const data = response.data as any
      
      if (medio === 'whatsapp') {
        if (data?.tiene_telefono && data?.link) {
          // Abrir WhatsApp Web o App
          window.open(data.link, '_blank')
          setSuccess(`Pedido marcado como enviado por WhatsApp`)
        } else {
          setError('El proveedor no tiene teléfono registrado')
          setTimeout(() => setError(''), 5000)
          return
        }
      } 
      else if (medio === 'email' && data?.mailto_link) {
        // Abrir cliente de email
        window.location.href = data.mailto_link
        setSuccess(`Pedido marcado como enviado por Email`)
      }
      
      // ✅ Recargar lista para mostrar nuevo estado
      setPreviewPedido(null)  // Cerrar modal si está abierto
      cargarHistorial()  // ← Recargar lista para mostrar estado "enviado"
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      // Manejar error como string, no objeto
      const msg = typeof error === 'string' ? error : error?.detail?.[0]?.msg || error?.message || 'Error al enviar'
      setError(msg)
      setTimeout(() => setError(''), 5000)
    }
  }

  // Abrir preview con detalles completos (VISTA PREVIA CON PRECIOS)
  const abrirPreview = async (pedidoId: number) => {
    try {
      const response = await pedidosApi.getById(pedidoId)
      if (response.error) {
        setError(response.error)
      } else {
        setPedidoParaVistaPrevia(response.data as any)
        setShowVistaPrevia(true)
      }
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : error?.detail?.[0]?.msg || 'Error al cargar detalles'
      setError(msg)
    }
  }

  // Eliminar pedido
  const confirmarEliminar = (pedidoId: number, numeroInterno: string) => {
    if (window.confirm(`¿Eliminar pedido ${numeroInterno}?\n\nEsta acción no se puede deshacer.`)) {
      eliminarPedido(pedidoId)
    }
  }

  const eliminarPedido = async (pedidoId: number) => {
    try {
      const response = await pedidosApi.eliminar(pedidoId)
      if (response.error) {
        const msg = typeof response.error === 'string' 
          ? response.error 
          : (response.error as any)?.detail?.msg || 'Error al eliminar'
        setError(msg)
      } else {
        setSuccess('Pedido eliminado correctamente')
        cargarHistorial()  // Recargar lista
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : error?.detail?.[0]?.msg || error?.message || 'Error al eliminar'
      setError(msg)
      setTimeout(() => setError(''), 5000)
    }
  }

  // Marcar como recibido
  const marcarComoRecibido = async (pedidoId: number) => {
    if (!window.confirm('¿Marcar pedido como recibido?\n\nNOTA: Esto solo actualiza el estado del pedido. Para actualizar el stock, debe crear una FC Compra.')) return
    
    try {
      const response = await pedidosApi.recibir(pedidoId)
      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Pedido marcado como recibido (stock no actualizado)')
        cargarHistorial()
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al marcar como recibido')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pedidos a Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de solicitudes de compra</p>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setVista('armar')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            vista === 'armar'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Plus size={18} />
          Armar Pedido
        </button>
        <button
          onClick={() => { setVista('historial'); cargarHistorial() }}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            vista === 'historial'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText size={18} />
          Historial
        </button>
      </div>

      {/* Vista: Armar Pedido */}
      {vista === 'armar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Productos */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filtros */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="🔍 Buscar productos por nombre o SKU..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Todos los proveedores</option>
                {listaProveedores.map(prov => (
                  <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                ))}
              </select>
            </div>

            {/* Lista de productos */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart size={20} />
                Productos ({productosFiltrados.length})
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : productosFiltrados.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No hay productos que coincidan con los filtros
                </p>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-gray-700 border-b border-gray-200 sticky top-0 bg-white">
                      <tr>
                        <th className="text-left py-2">Producto</th>
                        <th className="text-right">Stock</th>
                        <th className="text-right">Costo</th>
                        <th className="text-center">Proveedor</th>
                        <th className="text-center">Agregar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map(prod => (
                        <tr key={prod.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2">
                            <div className="font-medium">{prod.nombre}</div>
                            <div className="text-xs text-gray-500">{prod.sku}</div>
                          </td>
                          <td className={`text-right font-medium ${
                            prod.stock_actual === 0 ? 'text-red-600' : 
                            prod.stock_actual < prod.stock_minimo ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {prod.stock_actual}
                          </td>
                          <td className="text-right text-gray-600">
                            ${formatCurrency(prod.precio_costo || 0)}
                          </td>
                          <td className="text-center text-sm text-gray-500">
                            {prod.proveedor_nombre || '—'}
                          </td>
                          <td className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <input
                                type="checkbox"
                                checked={!!productosSeleccionados[prod.id]}
                                onChange={(e) => toggleProducto(prod.id, 10)}
                                className="w-4 h-4"
                              />
                              {productosSeleccionados[prod.id] && (
                                <>
                                  <input
                                    type="number"
                                    value={productosSeleccionados[prod.id]}
                                    onChange={(e) => actualizarCantidad(prod.id, parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 border rounded text-right text-sm"
                                    min="1"
                                  />
                                  <button
                                    onClick={() => agregarAlPedido(prod, productosSeleccionados[prod.id])}
                                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                  >
                                    Agregar
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Resumen */}
          <div className="bg-white border rounded-lg p-4 h-fit sticky top-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText size={20} />
              Resumen del Pedido
            </h3>

            {/* Lista de pedido */}
            {listaPedido.length > 0 ? (
              <>
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {listaPedido.map(item => (
                    <div key={item.producto_id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.producto_nombre}</p>
                        <p className="text-xs text-gray-500">{item.cantidad} un. × ${formatCurrency(item.precio_costo)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) => actualizarCantidadLista(item.producto_id, parseInt(e.target.value) || 1)}
                          className="w-16 px-1 py-1 border rounded text-right text-xs"
                          min="1"
                        />
                        <button
                          onClick={() => eliminarDeLista(item.producto_id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-3 mb-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total estimado:</span>
                    <span className="text-blue-600">{formatCurrency(totalEstimado)}</span>
                  </div>
                </div>

                {/* Selector de proveedor */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proveedor
                  </label>
                  <select
                    value={proveedorSeleccionado || ''}
                    onChange={(e) => setProveedorSeleccionado(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar proveedor...</option>
                    {listaProveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Botón crear */}
                <button
                  onClick={crearPedido}
                  disabled={!proveedorSeleccionado}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  📄 Generar Pedido
                </button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-8 text-sm">
                No hay productos en el pedido<br/>
                <span className="text-xs">Seleccioná productos y hacé click en "Agregar"</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Vista: Historial */}
      {vista === 'historial' && (
        <div>
          {/* Filtros */}
          <div className="bg-white border rounded-lg p-4 mb-4 flex gap-4">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="enviado">Enviado</option>
              <option value="recibido">Recibido</option>
              <option value="cancelado">Cancelado</option>
            </select>
            <select
              value={filtroProveedorHistorial}
              onChange={(e) => setFiltroProveedorHistorial(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Todos los proveedores</option>
              {listaProveedores.map(prov => (
                <option key={prov.id} value={prov.id}>{prov.nombre}</option>
              ))}
            </select>
            <button
              onClick={cargarHistorial}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔍 Filtrar
            </button>
          </div>

          {/* Tabla de pedidos */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Pedido</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {listaPedidos.map(pedido => (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {pedido.numero_interno}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(pedido.fecha_pedido)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {pedido.proveedor_nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(pedido.total_estimado)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                        pedido.estado === 'enviado' ? 'bg-green-100 text-green-800' :
                        pedido.estado === 'recibido' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pedido.estado === 'pendiente' && '⏳ Pendiente'}
                        {pedido.estado === 'enviado' && '✅ Enviado'}
                        {pedido.estado === 'recibido' && '📦 Recibido'}
                        {pedido.estado === 'cancelado' && '❌ Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      {/* 👁️ Previsualizar (CON precios) */}
                      <button
                        onClick={() => abrirPreview(pedido.id)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                        title="Ver vista previa"
                      >
                        👁️
                      </button>
                      
                      {/* 📱 WhatsApp (SIN precios) - solo pendientes */}
                      {pedido.estado === 'pendiente' ? (
                        <button
                          onClick={() => enviarPorWhatsApp(pedido)}
                          disabled={!pedido.proveedor_telefono}
                          className={`inline-flex items-center gap-1 ${
                            pedido.proveedor_telefono
                              ? 'text-green-600 hover:text-green-800'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={
                            !pedido.proveedor_telefono
                              ? 'Proveedor sin teléfono (agregue en Sistema → Proveedores)'
                              : 'Enviar por WhatsApp'
                          }
                        >
                          📱
                        </button>
                      ) : null}
                      
                      {/* ✉️ Email (SIN precios) - solo pendientes */}
                      {pedido.estado === 'pendiente' ? (
                        <button
                          onClick={() => enviarPorEmail(pedido)}
                          disabled={!pedido.proveedor_email}
                          className={`inline-flex items-center gap-1 ${
                            pedido.proveedor_email
                              ? 'text-gray-600 hover:text-gray-700'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={
                            !pedido.proveedor_email
                              ? 'Proveedor sin email (agregue en Sistema → Proveedores)'
                              : 'Enviar por Email'
                          }
                        >
                          ✉️
                        </button>
                      ) : null}
                      
                      {/* 🗑️ Eliminar - solo pendientes */}
                      {pedido.estado === 'pendiente' && (
                        <button
                          onClick={() => confirmarEliminar(pedido.id, pedido.numero_interno)}
                          className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                          title="Eliminar pedido"
                        >
                          🗑️
                        </button>
                      )}
                      
                      {/* ✅ Marcar como recibido - solo enviados */}
                      {pedido.estado === 'enviado' && (
                        <button
                          onClick={() => marcarComoRecibido(pedido.id)}
                          className="text-orange-600 hover:text-orange-800 inline-flex items-center gap-1"
                          title="Marcar como recibido"
                        >
                          📦
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {listaPedidos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2">No hay pedidos registrados</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa (CON PRECIOS - solo interno) */}
      {showVistaPrevia && pedidoParaVistaPrevia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full my-8 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">📦 Vista Previa - Pedido {pedidoParaVistaPrevia.numero_interno}</h3>
                <p className="text-sm text-gray-600">
                  {formatDate(pedidoParaVistaPrevia.fecha_pedido)} • {pedidoParaVistaPrevia.proveedor_nombre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Estado: <span className="font-medium">{pedidoParaVistaPrevia.estado}</span>
                </p>
              </div>
              <button
                onClick={() => setShowVistaPrevia(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Vista previa formateada (CON precios) */}
            <pre className="whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded-lg font-mono overflow-x-auto">
              {generarVistaPrevia(pedidoParaVistaPrevia)}
            </pre>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowVistaPrevia(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cerrar
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
                {loadingCrearProveedor && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {loadingCrearProveedor ? 'Guardando...' : '✅ Guardar Proveedor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
