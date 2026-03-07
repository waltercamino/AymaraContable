// src/pages/Reportes.tsx
// Reportes y Análisis con datos reales del backend

import { useState, useEffect } from 'react'
import { reportes, categorias } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Package, Download, Filter, RefreshCw } from 'lucide-react'

// Interfaces tipadas para los reportes
interface ProductoMasVendido {
  producto_id: number
  producto_nombre: string
  cantidad_vendida: number
  total_vendido: number
  precio_promedio: number
}

interface CategoriaData {
  id: number
  nombre: string
}

// ============================================
// 🆕 REPORTES FINANCIEROS (Ganancia)
// ============================================
interface ReporteGanancia {
  periodo: { desde: string | null; hasta: string | null }
  canal: string
  monto_ventas: number
  costo_ventas: number
  ganancia_bruta: number
  margen_porcentaje: number
  total_facturas: number
}

interface GananciaPorCategoria {
  categoria_id: number
  categoria_nombre: string
  ventas: number
  costo: number
  ganancia: number
  margen_porcentaje: number
  unidades_vendidas: number
}

interface EgresosOperativos {
  periodo: { desde: string | null; hasta: string | null }
  total_egresos: number
  por_categoria: Array<{
    categoria: string
    monto: number
    porcentaje: number
  }>
}

interface GananciaPorMetodoPago {
  metodo: string
  monto_ventas: number
  costo_ventas: number
  ganancia_bruta: number
  margen_porcentaje: number
  total_facturas: number
}

export default function Reportes() {
  // Estados de datos
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [categoriaId, setCategoriaId] = useState<number | 'all'>('all')

  // 🆕 Toggle para comparar con año anterior (Seasonality)
  const [compararConAnioAnterior, setCompararConAnioAnterior] = useState(false)

  // Datos de reportes
  const [productosMasVendidos, setProductosMasVendidos] = useState<ProductoMasVendido[]>([])
  const [categoriasList, setCategoriasList] = useState<CategoriaData[]>([])

  // 🆕 Ganancia del período
  const [gananciaPeriodo, setGananciaPeriodo] = useState<ReporteGanancia | null>(null)

  // ============================================
  // 🆕 ESTADOS PARA SEGMENTACIÓN POR CANAL
  // ============================================
  const [canalSeleccionado, setCanalSeleccionado] = useState<'todos' | 'minorista' | 'mayorista'>('todos')

  // Estados para ganancia segmentada
  const [gananciaMinorista, setGananciaMinorista] = useState<ReporteGanancia | null>(null)
  const [gananciaMayorista, setGananciaMayorista] = useState<ReporteGanancia | null>(null)
  const [gananciaTotal, setGananciaTotal] = useState<ReporteGanancia | null>(null)

  // Estados para gráficos
  const [gananciaPorCategoria, setGananciaPorCategoria] = useState<GananciaPorCategoria[]>([])
  const [gananciaPorMetodoPago, setGananciaPorMetodoPago] = useState<GananciaPorMetodoPago[]>([])

  // 🆕 Estado para egresos operativos (Resultado Neto)
  const [egresosOperativos, setEgresosOperativos] = useState<EgresosOperativos | null>(null)

  // 🆕 Estados para proyección de ventas estacional
  const [filtroProyeccion, setFiltroProyeccion] = useState({
    mes: new Date().getMonth() + 1,
    anio_actual: new Date().getFullYear(),
    anio_anterior: new Date().getFullYear() - 1,
    categoria_id: 'all' as string | number
  })
  const [proyecciones, setProyecciones] = useState<any[]>([])
  const [proyeccionesEditadas, setProyeccionesEditadas] = useState<Record<number, number>>({})

  // Cargar datos
  useEffect(() => {
    cargarReportes()
    cargarProyecciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta, categoriaId, canalSeleccionado, compararConAnioAnterior, filtroProyeccion])

  const cargarReportes = async () => {
    try {
      setLoading(true)
      setError('')

      // ============================================
      // 🆕 PARAMS BASE PARA FILTROS ORTOGONALES
      // - fecha: afecta TODO
      // - categoria_id: afecta productos, categorías, margen (WHAT)
      // - canal: afecta cards de canal, métodos de pago (WHO)
      // ============================================
      const baseParams: Record<string, string> = {}
      if (fechaDesde) baseParams.fecha_desde = fechaDesde
      if (fechaHasta) baseParams.fecha_hasta = fechaHasta
      if (categoriaId !== 'all') baseParams.categoria_id = String(categoriaId)

      // Canal se pasa por separado a endpoints específicos
      // Solo incluir si es un valor válido (no 'todos' ni undefined)
      const canalParam = canalSeleccionado !== 'todos' ? canalSeleccionado : undefined

      console.log('DEBUG [baseParams]:', baseParams)
      console.log('DEBUG [canalParam]:', canalParam)

      // ============================================
      // 🆕 CARGA DE DATOS CON FILTROS COMBINADOS
      // ============================================

      // Helper para construir params con canal solo si es válido
      const withCanal = (canal: string | undefined) => {
        const params = { ...baseParams }
        if (canal && canal !== 'todos') {
          params.canal = canal
        }
        return params
      }

      const [
        productosRes,
        categoriasRes,
        gananciaTotalRes,
        gananciaMinoristaRes,
        gananciaMayoristaRes,
        gananciaPorCategoriaRes,
        gananciaPorMetodoPagoRes,
        egresosRes
      ] = await Promise.all([
        // Productos más vendidos: filtra por fecha + categoría + canal + comparar año anterior
        reportes.getProductosMasVendidos({ ...withCanal(canalParam), comparar_con_anio_anterior: compararConAnioAnterior }),
        // Categorías: siempre todas (para el select)
        categorias.getAll(),
        // Ganancia total: filtra por fecha + categoría (NO por canal, es el total)
        reportes.getGanancia(baseParams),
        // Ganancia minorista: filtra por fecha + categoría + canal
        reportes.getGanancia({ ...baseParams, canal: 'minorista' }),
        // Ganancia mayorista: filtra por fecha + categoría + canal
        reportes.getGanancia({ ...baseParams, canal: 'mayorista' }),
        // Ganancia por categoría: filtra por fecha + categoría + canal
        reportes.getGananciaPorCategoria(withCanal(canalParam)),
        // Ganancia por método de pago: filtra por fecha + categoría + canal
        reportes.getGananciaPorMetodoPago(withCanal(canalParam)),
        // 🆕 Egresos operativos: filtra por fecha (para Resultado Neto)
        reportes.getEgresosOperativos(baseParams)
      ])

      console.log('=== DEBUG PRODUCTOS MÁS VENDIDOS ===')
      console.log('productosRes:', productosRes)
      console.log('productosRes.data:', productosRes?.data)
      console.log('datos_grafico:', productosRes?.data?.datos_grafico)
      console.log('DEBUG [categorias]:', categoriasRes.data)

      if (productosRes.error) throw new Error(productosRes.error)
      if (categoriasRes.error) throw new Error(categoriasRes.error)

      // ============================================
      // 🆕 PROCESAR GANANCIA DEL PERÍODO (TOTAL)
      // ============================================
      const gananciaData = gananciaTotalRes.data as unknown as ReporteGanancia | null
      setGananciaPeriodo(gananciaData)
      console.log('DEBUG [ganancia-total]:', gananciaData)

      // ============================================
      // 🆕 PROCESAR GANANCIA SEGMENTADA POR CANAL
      // ============================================
      setGananciaTotal(gananciaTotalRes.data as unknown as ReporteGanancia)
      setGananciaMinorista(gananciaMinoristaRes.data as unknown as ReporteGanancia)
      setGananciaMayorista(gananciaMayoristaRes.data as unknown as ReporteGanancia)
      setGananciaPorCategoria(gananciaPorCategoriaRes.data as unknown as GananciaPorCategoria[])
      setGananciaPorMetodoPago(gananciaPorMetodoPagoRes.data as unknown as GananciaPorMetodoPago[])

      console.log('DEBUG [ganancia-minorista]:', gananciaMinoristaRes.data)
      console.log('DEBUG [ganancia-mayorista]:', gananciaMayoristaRes.data)
      console.log('DEBUG [ganancia-por-categoria]:', gananciaPorCategoriaRes.data)

      // ============================================
      // 🆕 PROCESAR EGRESOS OPERATIVOS
      // ============================================
      setEgresosOperativos(egresosRes.data as unknown as EgresosOperativos)
      console.log('DEBUG [egresos-operativos]:', egresosRes.data)

      // ============================================
      // 1. PROCESAR PRODUCTOS MÁS VENDIDOS
      // ============================================
      const productosDataRaw = productosRes.data as unknown as { 
        periodo_actual?: ProductoMasVendido[]
        periodo_anterior?: ProductoMasVendido[]
        datos_grafico?: Array<{producto: string; actual: number; anterior: number}>
        comparacion?: boolean
      } | null

      console.log('=== PROCESAR PRODUCTOS ===')
      console.log('productosDataRaw:', productosDataRaw)
      console.log('datos_grafico:', productosDataRaw?.datos_grafico)

      // Guardar el objeto completo para acceder a datos_grafico en el gráfico
      if (productosDataRaw && 'datos_grafico' in productosDataRaw) {
        setProductosMasVendidos(productosDataRaw as any)
      } else if (Array.isArray(productosDataRaw)) {
        // Fallback: crear estructura con datos_grafico
        setProductosMasVendidos({
          periodo_actual: productosDataRaw.slice(0, 10),
          datos_grafico: productosDataRaw.slice(0, 10).map((p: any) => ({
            producto: p.nombre || p.producto_nombre,
            actual: p.cantidad_vendida || 0,
            anterior: 0
          })),
          comparacion: false
        } as any)
      } else {
        setProductosMasVendidos({
          periodo_actual: [],
          datos_grafico: [],
          comparacion: false
        } as any)
      }

      console.log('=== DESPUÉS DE SETEAR ===')
      console.log('productosMasVendidos state will be updated')

      // ============================================
      // 2. PROCESAR CATEGORÍAS (para el select)
      // ============================================
      const categoriasData = categoriasRes.data as unknown as CategoriaData[] | null
      setCategoriasList(categoriasData || [])
      console.log('DEBUG [categorias-list]:', categoriasData || [])

      setLastUpdate(new Date())

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar reportes'
      setError(errorMessage)
      console.error('Reportes error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Exportar reporte (placeholder)
  const handleExportar = (tipo: 'pdf' | 'excel') => {
    alert(`📥 Exportando reporte a ${tipo.toUpperCase()}...\n\n(Se implementará con librería jsPDF o SheetJS)`);
  }

  // Resetear filtros
  const handleResetFiltros = () => {
    setFechaDesde('')
    setFechaHasta('')
    setCategoriaId('all')
    setCanalSeleccionado('todos')
  }

  // 🆕 Cargar proyecciones de ventas estacional
  const cargarProyecciones = async () => {
    try {
      const params: any = {
        mes: filtroProyeccion.mes,
        anio_actual: filtroProyeccion.anio_actual,
        anio_anterior: filtroProyeccion.anio_anterior
      }
      if (filtroProyeccion.categoria_id !== 'all') {
        params.categoria_id = filtroProyeccion.categoria_id
      }
      if (canalSeleccionado !== 'todos') {
        params.canal = canalSeleccionado
      }

      const res = await reportes.getProyeccionVentas(params)
      setProyecciones((res.data as any).productos)
      setProyeccionesEditadas({})  // Resetear ediciones al cargar nuevos datos
    } catch (err) {
      console.error('Error cargando proyecciones:', err)
      setProyecciones([])
    }
  }

  // 🆕 Exportar proyecciones a Excel
  const exportarProyeccionesExcel = () => {
    import('xlsx').then((XLSX) => {
      const datos = proyecciones.map((prod: any) => ({
        Producto: prod.producto_nombre,
        SKU: prod.sku,
        Categoría: prod.categoria_nombre,
        [`${filtroProyeccion.anio_anterior}`]: prod.ventas_anterior,
        [`${filtroProyeccion.anio_actual}`]: prod.ventas_actual,
        'Variación %': prod.variacion_pct,
        Tendencia: prod.tendencia === 'up' ? '↑' : prod.tendencia === 'down' ? '↓' : '→',
        [`Proyección ${filtroProyeccion.anio_actual + 1}`]: proyeccionesEditadas[prod.producto_id] ?? prod.sugerencia ?? ''
      }))

      const ws = XLSX.utils.json_to_sheet(datos)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Proyecciones')
      XLSX.writeFile(wb, `proyeccion-ventas-${filtroProyeccion.mes}-${filtroProyeccion.anio_actual}.xlsx`)
    }).catch(() => {
      alert('⚠️ Error al cargar librería Excel. Intenta nuevamente.')
    })
  }

  // 🆕 Datos para gráfico de barras (Productos Más Vendidos) - usa datos_grafico del backend
  const chartProductosData = (productosMasVendidos as any)?.datos_grafico || []

  // Datos para gráfico de barras (Ganancia por Categoría) - usa datos reales del backend
  const chartGananciaCategoriaData = (gananciaPorCategoria || [])
    .filter(c => c && c.categoria_nombre)
    .map(c => ({
      categoria: c.categoria_nombre,
      ventas: c.ventas || 0,
      costo: c.costo || 0,
      ganancia: c.ganancia || 0,
      margen: c.margen_porcentaje || 0
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Reportes y Análisis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualizá tus métricas clave y tomá decisiones informadas
            {lastUpdate && <span className="ml-2 text-xs text-gray-400">• Actualizado: {formatDate(lastUpdate.toISOString())}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportar('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download size={16} />
            Excel
          </button>
          <button
            onClick={() => handleExportar('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Download size={16} />
            PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4 text-gray-700">
          <Filter size={18} />
          <span className="font-medium">Filtros de Reporte</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas</option>
              {(categoriasList || []).map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal de Venta</label>
            <select
              value={canalSeleccionado}
              onChange={(e) => setCanalSeleccionado(e.target.value as 'todos' | 'minorista' | 'mayorista')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="todos">📊 Todos los canales</option>
              <option value="minorista">🔵 Solo Minorista</option>
              <option value="mayorista">🟠 Solo Mayorista</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={cargarReportes}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <RefreshCw size={16} />
              )}
              Actualizar
            </button>
            <button
              onClick={handleResetFiltros}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* 🆕 INDICADOR DE FILTROS ACTIVOS */}
      {(categoriaId !== 'all' || canalSeleccionado !== 'todos') && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Filtros activos:</span>
          {categoriaId !== 'all' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
              🏷️ {categoriasList.find(c => c.id === categoriaId)?.nombre || 'Categoría'}
            </span>
          )}
          {canalSeleccionado !== 'todos' && (
            <span className={`px-3 py-1 rounded-full flex items-center gap-1 ${
              canalSeleccionado === 'minorista' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {canalSeleccionado === 'minorista' ? '🔵' : '🟠'} {canalSeleccionado === 'minorista' ? 'Minorista' : 'Mayorista'}
            </span>
          )}
          <button
            onClick={() => { setCategoriaId('all'); setCanalSeleccionado('todos'); }}
            className="text-red-500 hover:text-red-700 hover:underline flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={cargarReportes} className="text-red-800 hover:underline text-sm">Reintentar</button>
        </div>
      )}

      {/* Loading */}
      {loading && productosMasVendidos.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* === FILA ÚNICA: CARDS COMPARATIVAS POR CANAL === */}
      {gananciaMinorista && gananciaMayorista && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 🔵 MINORISTA */}
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="text-xl">🔵</span>
              <h3 className="text-base font-bold text-gray-800">MINORISTA</h3>
            </div>
            <div className="space-y-3">
              {/* Ventas */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📈 Ventas</span>
                <span className="font-semibold text-gray-900">{formatCurrency(gananciaMinorista.monto_ventas || 0)}</span>
              </div>
              {/* Costo */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📦 Costo</span>
                <span className="font-semibold text-red-600">{formatCurrency(gananciaMinorista.costo_ventas || 0)}</span>
              </div>
              {/* Ganancia */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💵 Ganancia</span>
                <span className={`font-semibold ${
                  (gananciaMinorista.ganancia_bruta || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>{formatCurrency(gananciaMinorista.ganancia_bruta || 0)}</span>
              </div>
              {/* Margen */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📊 Margen</span>
                <span className={`font-semibold ${
                  (gananciaMinorista.margen_porcentaje || 0) >= 30 ? 'text-green-600' :
                  (gananciaMinorista.margen_porcentaje || 0) >= 15 ? 'text-orange-600' : 'text-red-600'
                }`}>{(gananciaMinorista.margen_porcentaje || 0).toFixed(1)}%</span>
              </div>
              {/* Facturas */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">🧾 Facturas</span>
                <span className="font-semibold text-gray-900">{gananciaMinorista.total_facturas || 0}</span>
              </div>
            </div>
          </div>

          {/* 🟠 MAYORISTA */}
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="text-xl">🟠</span>
              <h3 className="text-base font-bold text-gray-800">MAYORISTA</h3>
            </div>
            <div className="space-y-3">
              {/* Ventas */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📈 Ventas</span>
                <span className="font-semibold text-gray-900">{formatCurrency(gananciaMayorista.monto_ventas || 0)}</span>
              </div>
              {/* Costo */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📦 Costo</span>
                <span className="font-semibold text-red-600">{formatCurrency(gananciaMayorista.costo_ventas || 0)}</span>
              </div>
              {/* Ganancia */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💵 Ganancia</span>
                <span className={`font-semibold ${
                  (gananciaMayorista.ganancia_bruta || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>{formatCurrency(gananciaMayorista.ganancia_bruta || 0)}</span>
              </div>
              {/* Margen */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📊 Margen</span>
                <span className={`font-semibold ${
                  (gananciaMayorista.margen_porcentaje || 0) >= 30 ? 'text-green-600' :
                  (gananciaMayorista.margen_porcentaje || 0) >= 15 ? 'text-orange-600' : 'text-red-600'
                }`}>{(gananciaMayorista.margen_porcentaje || 0).toFixed(1)}%</span>
              </div>
              {/* Facturas */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">🧾 Facturas</span>
                <span className="font-semibold text-gray-900">{gananciaMayorista.total_facturas || 0}</span>
              </div>
            </div>
          </div>

          {/* 📊 TOTAL (referencia) */}
          <div className="bg-white rounded-lg shadow p-5 border-l-4 border-gray-500 hover:shadow-md transition">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <span className="text-xl">📊</span>
              <h3 className="text-base font-bold text-gray-800">TOTAL</h3>
            </div>
            <div className="space-y-3">
              {/* Ventas */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📈 Ventas</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency((gananciaMinorista.monto_ventas || 0) + (gananciaMayorista.monto_ventas || 0))}
                </span>
              </div>
              {/* Costo */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📦 Costo</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency((gananciaMinorista.costo_ventas || 0) + (gananciaMayorista.costo_ventas || 0))}
                </span>
              </div>
              {/* Ganancia */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">💵 Ganancia</span>
                <span className={`font-semibold ${
                  ((gananciaMinorista.ganancia_bruta || 0) + (gananciaMayorista.ganancia_bruta || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency((gananciaMinorista.ganancia_bruta || 0) + (gananciaMayorista.ganancia_bruta || 0))}
                </span>
              </div>
              {/* Margen */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">📊 Margen</span>
                <span className={`font-semibold ${
                  (gananciaTotal?.margen_porcentaje || 0) >= 30 ? 'text-green-600' :
                  (gananciaTotal?.margen_porcentaje || 0) >= 15 ? 'text-orange-600' : 'text-red-600'
                }`}>{(gananciaTotal?.margen_porcentaje || 0).toFixed(1)}%</span>
              </div>
              {/* Facturas */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-600">🧾 Facturas</span>
                <span className="font-semibold text-gray-900">
                  {(gananciaMinorista.total_facturas || 0) + (gananciaMayorista.total_facturas || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 RESULTADO NETO - Ganancia Bruta - Egresos Operativos */}
      {gananciaTotal && egresosOperativos && (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">🎯 Resultado Neto del Período</h3>
            <span className="text-sm text-gray-500">
              {formatCurrency(gananciaTotal.ganancia_bruta)} - {formatCurrency(egresosOperativos.total_egresos)} = Resultado Neto
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium">💵 Ganancia Bruta</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(gananciaTotal.ganancia_bruta)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-700 font-medium">📉 Egresos Operativos</p>
              <p className="text-2xl font-bold text-red-600">
                -{formatCurrency(egresosOperativos.total_egresos)}
              </p>
            </div>
            <div className={`rounded-lg p-4 border ${
              (gananciaTotal.ganancia_bruta - egresosOperativos.total_egresos) >= 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="text-sm text-gray-700 font-medium">✨ Resultado Neto</p>
              <p className={`text-2xl font-bold ${
                (gananciaTotal.ganancia_bruta - egresosOperativos.total_egresos) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(gananciaTotal.ganancia_bruta - egresosOperativos.total_egresos)}
              </p>
            </div>
          </div>
          
          {/* Desglose de egresos (collapsible) */}
          {egresosOperativos.por_categoria.length > 0 && (
            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 flex items-center gap-2">
                <span>📋 Ver desglose de egresos</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {egresosOperativos.por_categoria.length} categorías
                </span>
              </summary>
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                {egresosOperativos.por_categoria.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <span className="text-gray-700">{cat.categoria}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900">{formatCurrency(cat.monto)}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{cat.porcentaje}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Fila 1: Productos Más Vendidos + Márgenes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos Más Vendidos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={24} />
              <h2 className="text-lg font-semibold text-gray-800">Productos Más Vendidos</h2>
            </div>
            {/* 🆕 Toggle para comparar con año anterior */}
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={compararConAnioAnterior}
                onChange={(e) => setCompararConAnioAnterior(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>📅 Comparar con año anterior</span>
            </label>
          </div>
          {/* DEBUG: Verificar datos en render */}
          {console.log('=== RENDER DEBUG ===')}
          {console.log('productosMasVendidos:', productosMasVendidos)}
          {console.log('chartProductosData:', chartProductosData)}
          {console.log('chartProductosData.length:', chartProductosData?.length)}
          {chartProductosData && chartProductosData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartProductosData} margin={{ top: 20, right: 10, bottom: 80, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="producto"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 11 }}
                />
                <YAxis tickFormatter={(value: number | undefined) => `${value || 0} un.`} />
                <Tooltip formatter={(value: number | undefined) => [`${value} un.`, 'Cantidad']} />
                <Legend />
                {/* Barra período actual */}
                <Bar dataKey="actual" name={compararConAnioAnterior ? "Período Actual" : "Cantidad"} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                {/* Barra período anterior (solo si se compara) */}
                {compararConAnioAnterior && (
                  <Bar dataKey="anterior" name="Año Anterior" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-center">
                {loading ? "Cargando..." : "No hay productos vendidos en el período seleccionado"}
              </p>
            </div>
          )}
        </div>

        {/* 🆕 Ganancia por Categoría - DATOS REALES */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="text-green-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-800">Ganancia por Categoría</h2>
          </div>
          {chartGananciaCategoriaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartGananciaCategoriaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="categoria" />
                <YAxis yAxisId="left" tickFormatter={(value: number | undefined) => `$${(value || 0)/1000}k`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value: number | undefined) => `${value || 0}%`} />
                <Tooltip formatter={(value: number | undefined, name: string) => {
                  if (name === 'Margen %') return `${value || 0}%`
                  return formatCurrency(value || 0)
                }} />
                <Legend />
                <Bar yAxisId="left" dataKey="ganancia" fill="#10B981" name="Ganancia" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="margen" fill="#3B82F6" name="Margen %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-center">
                No hay datos de ganancia por categoría en el período seleccionado
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🆕 PROYECCIÓN DE VENTAS ESTACIONAL */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Proyección de Ventas Estacional</h2>
        
        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">📅 Mes</label>
            <select 
              value={filtroProyeccion.mes}
              onChange={(e) => setFiltroProyeccion(f => ({...f, mes: parseInt(e.target.value)}))}
              className="px-3 py-2 border rounded"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('es-AR', {month: 'long'})}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Año Actual</label>
            <input 
              type="number" 
              value={filtroProyeccion.anio_actual} 
              onChange={(e) => setFiltroProyeccion(f => ({...f, anio_actual: parseInt(e.target.value)}))}
              className="px-3 py-2 border rounded w-20" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Año Anterior</label>
            <input 
              type="number" 
              value={filtroProyeccion.anio_anterior} 
              onChange={(e) => setFiltroProyeccion(f => ({...f, anio_anterior: parseInt(e.target.value)}))}
              className="px-3 py-2 border rounded w-20" 
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">🏷️ Categoría</label>
            <select 
              value={filtroProyeccion.categoria_id}
              onChange={(e) => setFiltroProyeccion(f => ({...f, categoria_id: e.target.value === 'all' ? 'all' : parseInt(e.target.value)}))}
              className="px-3 py-2 border rounded"
            >
              <option value="all">Todas</option>
              {categoriasList.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => { cargarProyecciones(); cargarReportes(); }} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            🔍 Aplicar
          </button>
          <button 
            onClick={exportarProyeccionesExcel} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📥 Excel
          </button>
        </div>

        {proyecciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-right">{filtroProyeccion.anio_anterior}</th>
                  <th className="px-4 py-2 text-right">{filtroProyeccion.anio_actual}</th>
                  <th className="px-4 py-2 text-right">Var%</th>
                  <th className="px-4 py-2 text-center">Tendencia</th>
                  <th className="px-4 py-2 text-right">Proyección {filtroProyeccion.anio_actual + 1}</th>
                </tr>
              </thead>
              <tbody>
                {proyecciones.map((prod: any) => {
                  const valorEditado = proyeccionesEditadas[prod.producto_id]
                  const mostrarValor = valorEditado ?? prod.sugerencia ?? ''
                  const variacion = prod.variacion_pct
                  return (
                    <tr key={prod.producto_id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium">{prod.producto_nombre}</div>
                        <div className="text-xs text-gray-500">{prod.sku} • {prod.categoria_nombre}</div>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600">{prod.ventas_anterior} un.</td>
                      <td className="px-4 py-2 text-right font-semibold">{prod.ventas_actual} un.</td>
                      <td className={`px-4 py-2 text-right font-semibold ${variacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variacion >= 0 ? '+' : ''}{variacion}%
                      </td>
                      <td className="px-4 py-2 text-center text-lg">
                        {prod.tendencia === 'up' && <span className="text-green-600">↑</span>}
                        {prod.tendencia === 'down' && <span className="text-red-600">↓</span>}
                        {prod.tendencia === 'stable' && <span className="text-gray-400">→</span>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input 
                          type="number"
                          value={mostrarValor}
                          onChange={(e) => setProyeccionesEditadas(p => ({
                            ...p, 
                            [prod.producto_id]: e.target.value ? parseInt(e.target.value) : undefined
                          }))}
                          className="w-24 px-2 py-1 border rounded text-right"
                          placeholder="-"
                        />
                        <span className="text-xs text-gray-500 ml-1">un.</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aplicar filtros para ver proyecciones estacionales
          </div>
        )}
        
        {/* Insights automáticos */}
        {proyecciones.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
            💡 <strong>Recomendación:</strong> {
              proyecciones.filter(p => p.variacion_pct >= 20).length > 0 
                ? `${proyecciones.filter(p => p.variacion_pct >= 20).length} producto(s) con crecimiento >20% → considerar aumentar stock`
                : proyecciones.filter(p => p.variacion_pct <= -30).length > 0
                ? `${proyecciones.filter(p => p.variacion_pct <= -30).length} producto(s) con declive >30% → revisar precio o promoción`
                : "Tendencias estables → mantener estrategia actual"
            }
          </div>
        )}
      </div>
    </div>
  )
}
