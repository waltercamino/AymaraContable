// src/pages/Productos.tsx
// CRUD de Productos con gestión de márgenes minorista/mayorista

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { productos, categorias, proveedores, Producto, HistorialMargen, ActualizarMargenMasivoData, MargenIndividualUpdateData } from '../services/api'
import { formatCurrency } from '../utils/format'

export default function Productos() {
  // Estados
  const [productosList, setProductosList] = useState<Producto[]>([])
  const [categoriasList, setCategoriasList] = useState<Categoria[]>([])
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<number | 'all'>('all')
  const [filtroActivo, setFiltroActivo] = useState<boolean | 'all'>('all')
  const [busqueda, setBusqueda] = useState('')

  // Modal (crear/editar)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    sku: '',
    nombre: '',
    categoria_id: null as number | null,
    proveedor_id: null as number | null,
    unidad_medida: 'unidad',
    stock_actual: 0,
    stock_minimo: 10,
    costo_promedio: 0,
    activo: true
  })

  // Estados para gestión de márgenes
  const [modalMargen, setModalMargen] = useState(false)
  const [nuevoMargen, setNuevoMargen] = useState<number>(25)
  const [motivoMargen, setMotivoMargen] = useState<string>('manual')
  const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([])
  const [categoriaFiltro, setCategoriaFiltro] = useState<number | 'all' | 'seleccionados'>('all')
  const [modalHistorial, setModalHistorial] = useState(false)
  const [historialProducto, setHistorialProducto] = useState<HistorialMargen[]>([])
  const [productoNombreHistorial, setProductoNombreHistorial] = useState('')

  // Nuevos estados para márgenes individuales
  const [modalEditarMargen, setModalEditarMargen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [margenMinorista, setMargenMinorista] = useState<number>(25)
  const [margenMayorista, setMargenMayorista] = useState<number>(25)
  const [motivoIndividual, setMotivoIndividual] = useState<string>('manual')
  const [tipoMargenMasivo, setTipoMargenMasivo] = useState<'minorista' | 'mayorista' | 'ambos'>('minorista')

  // Selección múltiple
  const [seleccionarTodos, setSeleccionarTodos] = useState(false)

  // Tipos para categorías y proveedores
  type Categoria = { id: number; nombre: string; margen_default_minorista?: number; margen_default_mayorista?: number }
  type Proveedor = { id: number; nombre: string }

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos()
  }, [filtroCategoria, filtroActivo])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      const params: Record<string, string | boolean> = {}
      if (filtroCategoria !== 'all') params.categoria_id = String(filtroCategoria)
      if (filtroActivo !== 'all') params.activo = filtroActivo

      const [productosRes, categoriasRes, proveedoresRes] = await Promise.all([
        productos.getAll(params),
        categorias.getAll(),
        proveedores.getAll()
      ])

      if (productosRes.error) throw new Error(productosRes.error)
      if (categoriasRes.error) throw new Error(categoriasRes.error)
      if (proveedoresRes.error) throw new Error(proveedoresRes.error)

      setProductosList(productosRes.data as Producto[] || [])
      setCategoriasList(categoriasRes.data as unknown as Categoria[] || [])
      setProveedoresList(proveedoresRes.data as unknown as Proveedor[] || [])

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos'
      toast.error(errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleCrear = () => {
    setEditandoId(null)
    setFormData({
      sku: '',
      nombre: '',
      categoria_id: null,
      proveedor_id: null,
      unidad_medida: 'unidad',
      stock_actual: 0,
      stock_minimo: 10,
      costo_promedio: 0,
      activo: true
    })
    setModalAbierto(true)
  }

  // Abrir modal para editar
  const handleEditar = (producto: Producto) => {
    setEditandoId(producto.id)
    setFormData({
      sku: (producto.sku as string) || '',
      nombre: producto.nombre,
      categoria_id: (producto.categoria_id as number) || null,
      proveedor_id: (producto.proveedor_id as number) || null,
      unidad_medida: (producto.unidad_medida as string) || 'unidad',
      stock_actual: (producto.stock_actual as number) ?? 0,
      stock_minimo: (producto.stock_minimo as number) ?? 10,
      costo_promedio: (producto.costo_promedio as number) || 0,
      activo: (producto.activo as boolean) ?? true
    })
    setModalAbierto(true)
  }

  // Guardar (crear o editar)
  const handleGuardar = async () => {
    try {
      if (!formData.nombre.trim()) {
        toast.error('El nombre es obligatorio')
        return
      }

      let response
      if (editandoId) {
        response = await productos.update(editandoId, formData)
      } else {
        response = await productos.create(formData)
      }

      if (response.error) {
        // El backend ya envía el mensaje limpio para SKU duplicado
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error
        toast.error(errorMsg)
      } else {
        toast.success(editandoId ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
        setModalAbierto(false)
        cargarDatos()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar'
      toast.error(errorMessage)
      console.error(err)
    }
  }

  // Eliminar producto
  const handleEliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"?`)) return

    try {
      const response = await productos.delete(id)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error
        toast.error(errorMsg)
      } else {
        toast.success('Producto eliminado correctamente')
        cargarDatos()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar'
      toast.error(errorMessage)
      console.error(err)
    }
  }

  // Abrir modal de edición individual de márgenes
  const handleEditarMargenIndividual = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setMargenMinorista(producto.margen_efectivo_minorista || 25)
    setMargenMayorista(producto.margen_efectivo_mayorista || 25)
    setMotivoIndividual('manual')
    setModalEditarMargen(true)
  }

  // Guardar márgenes individuales
  const handleGuardarMargenIndividual = async () => {
    try {
      if (!productoSeleccionado) return

      const payload: MargenIndividualUpdateData = {
        margen_minorista: margenMinorista,
        margen_mayorista: margenMayorista,
        motivo: motivoIndividual
      }

      const response = await productos.updateMargenes(productoSeleccionado.id, payload)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error
        toast.error(errorMsg)
      } else {
        toast.success(response.message || 'Márgenes actualizados')
        setModalEditarMargen(false)
        cargarDatos()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar márgenes'
      toast.error(errorMessage)
    }
  }

  // Calcular precios estimados en tiempo real
  const calcularPrecioEstimado = (margen: number) => {
    if (!productoSeleccionado) return 0
    const costo = productoSeleccionado.costo_promedio || 0
    return Math.round(costo * (1 + margen / 100) / 100) * 100 - 1
  }

  // Abrir modal de actualización masiva
  const handleAbrirModalMargen = () => {
    setNuevoMargen(25)
    setMotivoMargen('manual')
    setCategoriaFiltro('all')
    setTipoMargenMasivo('minorista')
    setProductosSeleccionados([])
    setSeleccionarTodos(false)
    setModalMargen(true)
  }

  // Actualización masiva de márgenes
  const handleActualizarMargenMasivo = async () => {
    try {
      const payload: ActualizarMargenMasivoData = {
        nuevo_margen: nuevoMargen,
        motivo: motivoMargen,
        tipo_cliente: tipoMargenMasivo,
      }

      if (categoriaFiltro === 'seleccionados') {
        payload.producto_ids = productosSeleccionados
      } else if (categoriaFiltro !== 'all') {
        payload.categoria_id = Number(categoriaFiltro)
      }

      const response = await productos.actualizarMargenMasivo(payload)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error
        toast.error(errorMsg)
      } else {
        toast.success(`${response.actualizados} márgenes actualizados`)
        setModalMargen(false)
        cargarDatos()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar márgenes'
      toast.error(errorMessage)
    }
  }

  // Ver historial de márgenes
  const handleVerHistorial = async (producto: Producto) => {
    try {
      const response = await productos.getHistorialMargen(producto.id)
      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : response.error
        toast.error(errorMsg)
      } else {
        setHistorialProducto(response.data as unknown as HistorialMargen[])
        setProductoNombreHistorial(producto.nombre)
        setModalHistorial(true)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar historial'
      toast.error(errorMessage)
    }
  }

  // Toggle selección de producto
  const toggleSeleccionarProducto = (productoId: number) => {
    setProductosSeleccionados(prev =>
      prev.includes(productoId)
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId]
    )
  }

  // Toggle seleccionar todos
  const toggleSeleccionarTodos = () => {
    if (seleccionarTodos) {
      setProductosSeleccionados([])
    } else {
      setProductosSeleccionados(productosFiltrados.map(p => p.id))
    }
    setSeleccionarTodos(!seleccionarTodos)
  }

  // Filtrar por búsqueda
  const productosFiltrados = productosList.filter(p => {
    const matchBusqueda = !busqueda ||
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ((p.sku as string) && (p.sku as string).toLowerCase().includes(busqueda.toLowerCase()))
    return matchBusqueda
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestioná tu catálogo de productos y márgenes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAbrirModalMargen}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700
                     transition-colors font-medium flex items-center gap-2"
          >
            <span>📊</span> Actualizar Márgenes
          </button>
          <button
            onClick={handleCrear}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     transition-colors font-medium flex items-center gap-2"
          >
            <span>+</span> Nuevo Producto
          </button>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Buscar</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre o SKU..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2
                       focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2
                       focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas</option>
              {categoriasList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
            <select
              value={String(filtroActivo)}
              onChange={(e) => setFiltroActivo(e.target.value === 'all' ? 'all' : e.target.value === 'true')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2
                       focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Actualizar */}
          <div className="flex items-end">
            <button
              onClick={cargarDatos}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600
                       transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-300"></div>
              ) : (
                '🔄 Actualizar'
              )}
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <span>Mostrando {productosFiltrados.length} de {productosList.length} productos</span>
          {productosFiltrados.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seleccionarTodos}
                onChange={toggleSeleccionarTodos}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Seleccionar todos ({productosSeleccionados.length})</span>
            </label>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && productosList.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tabla de Productos */}
      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={seleccionarTodos}
                    onChange={toggleSeleccionarTodos}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Costo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  🛒 P. Venta Minorista
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  🏢 P. Venta Mayorista
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  🛒 Margen Minorista %
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  🏢 Margen Mayorista %
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Última Mod.
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No hay productos registrados. ¡Creá el primero!
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => {
                  const categoria = categoriasList.find((c: Categoria) => c.id === producto.categoria_id)
                  const stockActual = (producto.stock_actual as number) ?? 0
                  const stockMinimo = (producto.stock_minimo as number) ?? 10
                  const stockBajo = stockActual <= stockMinimo
                  
                  const margenMinorista = producto.margen_efectivo_minorista ?? 0
                  const margenMayorista = producto.margen_efectivo_mayorista ?? 0
                  const catMinorista = producto.margen_categoria_minorista ?? 25
                  const catMayorista = producto.margen_categoria_mayorista ?? catMinorista
                  
                  const tieneMargenPersonalizadoMinorista = producto.margen_personalizado !== null && producto.margen_personalizado !== undefined
                  const tieneMargenPersonalizadoMayorista = producto.margen_personalizado !== null && producto.margen_personalizado !== undefined

                  return (
                    <tr key={producto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={productosSeleccionados.includes(producto.id)}
                          onChange={() => toggleSeleccionarProducto(producto.id)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{producto.nombre}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(producto.sku as string) || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {(categoria?.nombre as string) || 'Sin categoría'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-right">
                        ${producto.costo_promedio?.toFixed(2) || '0,00'}
                      </td>

                      {/* Precio Venta Minorista */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">
                        <div className="text-sm font-medium">
                          ${(producto.precio_venta_minorista || producto.precio_venta)?.toFixed(0) || '0'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          margen: {margenMinorista.toFixed(1)}%
                        </div>
                      </td>

                      {/* Precio Venta Mayorista */}
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-right">
                        <div className="text-sm font-medium">
                          ${(producto.precio_venta_mayorista || producto.precio_venta)?.toFixed(0) || '0'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          margen: {margenMayorista.toFixed(1)}%
                        </div>
                      </td>

                      {/* Margen Minorista */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{margenMinorista.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">cat: {catMinorista.toFixed(0)}%</div>
                        {tieneMargenPersonalizadoMinorista && (
                          <div className="text-xs text-blue-500 dark:text-blue-400">📌 Personalizado</div>
                        )}
                      </td>

                      {/* Margen Mayorista */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{margenMayorista.toFixed(1)}%</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">cat: {catMayorista.toFixed(0)}%</div>
                        {tieneMargenPersonalizadoMayorista && (
                          <div className="text-xs text-blue-500 dark:text-blue-400">📌 Personalizado</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          stockBajo ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {stockActual}
                        </span>
                        {stockBajo && (
                          <span className="ml-2 text-xs text-red-600 dark:text-red-400">⚠️ Bajo</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {producto.actualizado_en
                          ? new Date(producto.actualizado_en).toLocaleString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditarMargenIndividual(producto)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          title="Editar márgenes de este producto"
                        >
                          ✏️ Márgenes
                        </button>
                        <button
                          onClick={() => handleVerHistorial(producto)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                          title="Ver historial de márgenes"
                        >
                          📜
                        </button>
                        <button
                          onClick={() => handleEditar(producto)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(producto.id, producto.nombre)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar Producto */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editandoId ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
                    placeholder="Ej: PROD001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Nombre del producto"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formData.categoria_id || ''}
                    onChange={(e) => setFormData({...formData, categoria_id: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sin categoría</option>
                    {categoriasList.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <select
                    value={formData.proveedor_id || ''}
                    onChange={(e) => setFormData({...formData, proveedor_id: e.target.value ? Number(e.target.value) : null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sin proveedor</option>
                    {proveedoresList.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramo</option>
                    <option value="l">Litro</option>
                    <option value="ml">Mililitro</option>
                    <option value="m">Metro</option>
                    <option value="caja">Caja</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({...formData, stock_actual: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({...formData, stock_minimo: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Costo Promedio</label>
                <input
                  type="number"
                  value={formData.costo_promedio}
                  onChange={(e) => setFormData({...formData, costo_promedio: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Producto Activo</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editandoId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición Individual de Márgenes */}
      {modalEditarMargen && productoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-2">Editar Márgenes - {productoSeleccionado.nombre}</h3>
            <p className="text-sm text-gray-600 mb-4">
              📋 Estos cambios se registran en el historial para auditoría
            </p>
            
            {/* Margen Minorista */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🛒 Margen Minorista (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={margenMinorista}
                  onChange={(e) => setMargenMinorista(parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  step="0.1"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Categoría: {(productoSeleccionado.margen_categoria_minorista ?? 25).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Precio venta estimado: ${calcularPrecioEstimado(margenMinorista).toFixed(2)}
              </div>
            </div>
            
            {/* Margen Mayorista */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🏢 Margen Mayorista (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={margenMayorista}
                  onChange={(e) => setMargenMayorista(parseFloat(e.target.value))}
                  className="flex-1 px-3 py-2 border rounded-lg"
                  step="0.1"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Categoría: {(productoSeleccionado.margen_categoria_mayorista ?? margenMinorista).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Precio venta estimado: ${calcularPrecioEstimado(margenMayorista).toFixed(2)}
              </div>
            </div>
            
            {/* Motivo - EXPLICADO */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📝 Motivo del cambio
              </label>
              <select
                value={motivoIndividual}
                onChange={(e) => setMotivoIndividual(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="manual">Ajuste manual</option>
                <option value="oferta">Oferta/Promoción temporal</option>
                <option value="competencia">Ajuste por competencia</option>
                <option value="costo">Cambio en costo del producto</option>
                <option value="estrategia">Cambio de estrategia comercial</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este registro se guarda en el historial para poder rastrear cambios futuros
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setModalEditarMargen(false)} 
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarMargenIndividual} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Actualización Masiva de Márgenes */}
      {modalMargen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Actualizar Márgenes</h3>

            {/* Tipo de margen */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎯 Tipo de margen a actualizar
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoMargen"
                    value="minorista"
                    checked={tipoMargenMasivo === 'minorista'}
                    onChange={(e) => setTipoMargenMasivo(e.target.value as 'minorista' | 'mayorista' | 'ambos')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>🛒 Minorista</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoMargen"
                    value="mayorista"
                    checked={tipoMargenMasivo === 'mayorista'}
                    onChange={(e) => setTipoMargenMasivo(e.target.value as 'minorista' | 'mayorista' | 'ambos')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>🏢 Mayorista</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipoMargen"
                    value="ambos"
                    checked={tipoMargenMasivo === 'ambos'}
                    onChange={(e) => setTipoMargenMasivo(e.target.value as 'minorista' | 'mayorista' | 'ambos')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span>🔄 Ambos</span>
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar a</label>
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value === 'all' ? 'all' : e.target.value === 'seleccionados' ? 'seleccionados' : Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">Todos los productos</option>
                {categoriasList.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
                <option value="seleccionados">Productos seleccionados ({productosSeleccionados.length})</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Margen (%)</label>
              <input
                type="number"
                value={nuevoMargen}
                onChange={(e) => setNuevoMargen(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
                step="0.1"
                min="-100"
              />
              {nuevoMargen < 0 && (
                <p className="text-xs text-red-600 mt-1">⚠️ Margen negativo: afecta rentabilidad</p>
              )}
              {nuevoMargen >= 0 && nuevoMargen < 10 && (
                <p className="text-xs text-yellow-600 mt-1">⚠️ Margen muy bajo: revisar rentabilidad</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
              <select
                value={motivoMargen}
                onChange={(e) => setMotivoMargen(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="manual">Ajuste manual</option>
                <option value="actualizacion_masiva">Actualización masiva</option>
                <option value="oferta">Oferta/Promoción</option>
                <option value="competencia">Ajuste por competencia</option>
                <option value="costo">Cambio en costo</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                ℹ️ Este registro se guarda en el historial para auditoría
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setModalMargen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleActualizarMargenMasivo} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historial de Márgenes */}
      {modalHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Historial de Márgenes - {productoNombreHistorial}
              </h3>
              <button
                onClick={() => setModalHistorial(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {historialProducto.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay historial de cambios para este producto</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Margen Ant.</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Margen Nuevo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Ant.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Nuevo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historialProducto.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(h.creado_en).toLocaleString('es-AR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900">
                          {h.margen_anterior?.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                          {h.margen_nuevo?.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          ${h.precio_venta_anterior?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          ${h.precio_venta_nuevo?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {h.motivo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setModalHistorial(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
