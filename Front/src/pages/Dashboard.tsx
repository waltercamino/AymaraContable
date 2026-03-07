// src/pages/Dashboard.tsx
// Dashboard con datos reales del backend

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { reportes, recibos, fcCompra, caja, pedidos, type Recibo } from '../services/api'
import { formatCurrency } from '../utils/format'
import { Wallet, CreditCard } from 'lucide-react'

// Interfaces para los reportes de caja y stock
interface ReporteCaja {
  total_ingresos: number
  total_egresos: number
  saldo: number
  por_categoria: Record<string, number>
}

interface ReporteStock {
  total_productos: number
  stock_bajo: number
  productos_bajo: Array<{
    id: number
    nombre: string
    sku: string
    stock_actual: number
    stock_minimo: number
    faltante: number
  }>
  valor_total_stock: number
}

interface ReporteVentas {
  total_ventas: number
  total_facturas: number
  monto_ventas: number
  monto_facturas: number
  monto_total: number
  por_tipo: Record<string, number>
  promedio_por_venta: number
}

// ReporteGanancia interface removed - moved to Reportes page

// Datos para gráficos de ventas semanales
interface VentasSemanalesResponse {
  labels: string[]
  datasets: Array<{
    data: number[]
  }>
}

// Cards del dashboard
interface DashboardCard {
  title: string
  value: string | number
  change?: string
  icon: string
  color: string
}

// Datos para gráficos
interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string | string[]
    backgroundColor: string | string[]
  }[]
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 🔍 Helper para calcular fechas del mes actual (reutilizable en JSX)
  const getFechasMesActual = () => {
    const hoy = new Date()
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
    const hoyStr = hoy.toISOString().split('T')[0]
    return { primerDia, hoyStr }
  }

  // 📦 Navegar a Pedidos con producto preseleccionado
  const handleReponer = (productoId: number, productoNombre: string) => {
    navigate('/pedidos', {
      state: {
        productoPreseleccionado: {
          id: productoId,
          nombre: productoNombre
        }
      }
    })
  }

  // Datos del dashboard - ESTADOS PRINCIPALES PRIMERO
  const [chartVentas, setChartVentas] = useState<ChartData | null>(null)
  const [chartCaja, setChartCaja] = useState<ChartData | null>(null)
  const [stockBajo, setStockBajo] = useState<Array<{
    id: number
    nombre: string
    sku: string
    stock_actual: number
    stock_minimo: number
    faltante: number
  }>>([])

  // Cobros y pagos recientes
  const [cobrosRecientes, setCobrosRecientes] = useState<Recibo[]>([])
  const [pagosRecientes, setPagosRecientes] = useState<Recibo[]>([])

  // Ventas del mes
  const [ventasMes, setVentasMes] = useState<ReporteVentas | null>(null)

  // Compras del mes
  const [comprasMes, setComprasMes] = useState<{ monto_total: number; total_facturas: number }>({
    monto_total: 0,
    total_facturas: 0
  })

  // Caja del mes
  const [cajaMes, setCajaMes] = useState<{ total_ingresos: number; total_egresos: number; saldo: number }>({
    total_ingresos: 0,
    total_egresos: 0,
    saldo: 0
  })

  // 📊 Ventas hoy - Estado para forzar re-render de la card
  const [ventasHoyValor, setVentasHoyValor] = useState(0)

  // 📊 Datos para las cards (se actualizan en cargarDashboard)
  const [cajaDataForCards, setCajaDataForCards] = useState<ReporteCaja | null>(null)
  const [stockDataForCards, setStockDataForCards] = useState<ReporteStock | null>(null)

  // 📊 Obtener ventas de hoy desde el gráfico semanal
  const getVentasHoy = (): number => {
    console.log('🔍 [VENTAS-HOY] === INICIO ===')
    console.log('🔍 [VENTAS-HOY] chartVentas completo:', chartVentas)
    console.log('🔍 [VENTAS-HOY] labels:', chartVentas?.labels)
    console.log('🔍 [VENTAS-HOY] datasets:', chartVentas?.datasets)
    console.log('🔍 [VENTAS-HOY] datasets[0].data:', chartVentas?.datasets?.[0]?.data)
    
    if (!chartVentas?.labels || !chartVentas?.datasets?.[0]?.data) {
      console.log('⚠️ [VENTAS-HOY] No hay datos en chartVentas')
      return 0
    }

    const hoy = new Date()
    const hoyLabel = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}`
    
    console.log('🔍 [VENTAS-HOY] Día actual:', hoy.getDate())
    console.log('🔍 [VENTAS-HOY] Label buscado:', hoyLabel)
    console.log('🔍 [VENTAS-HOY] Labels disponibles:', chartVentas.labels)
    console.log('🔍 [VENTAS-HOY] Valores disponibles:', chartVentas.datasets[0].data)

    const index = chartVentas.labels.findIndex((label: string) => label === hoyLabel)
    
    console.log('🔍 [VENTAS-HOY] Índice encontrado:', index)
    
    if (index === -1) {
      console.log('⚠️ [VENTAS-HOY] No se encontró label para hoy')
      return 0
    }

    const valor = chartVentas.datasets[0].data[index] || 0
    console.log('✅ [VENTAS-HOY] Valor encontrado:', valor)
    return valor
  }

  // 🔍 DEBUG: Log cuando cambia chartVentas
  useEffect(() => {
    console.log('🔍 [USE-EFFECT] chartVentas cambió:', !!chartVentas)
    
    if (chartVentas?.labels?.length && chartVentas?.datasets?.[0]?.data) {
      const valor = getVentasHoy()
      console.log('✅ [USE-EFFECT] getVentasHoy() =', valor)
      console.log('✅ [USE-EFFECT] Antes de setVentasHoyValor:', ventasHoyValor)
      
      setVentasHoyValor(valor)
      
      console.log('✅ [USE-EFFECT] Después de setVentasHoyValor (próximo render):', valor)
    } else {
      console.log('⚠️ [USE-EFFECT] chartVentas no tiene datos aún')
    }
  }, [chartVentas])

  // Cargar datos al montar
  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async () => {
    try {
      setLoading(true)
      setError('')

      // Calcular fechas del mes actual usando helper
      const { primerDia: primerDiaMes, hoyStr } = getFechasMesActual()

      // Cargar datos en paralelo desde endpoints reales
      const [ventasSemanalesRes, cajaRes, stockRes, cobrosRes, pagosRes, ventasMesRes, comprasMesRes, cajaMesRes] = await Promise.all([
        reportes.getVentasSemanales(),  // GET /api/reportes/ventas-semanales
        reportes.getCaja(),              // GET /api/reportes/caja
        reportes.getStock(),             // GET /api/reportes/stock
        recibos.getAll({ tipo: 'cobro', estado: 'registrado' }),
        recibos.getAll({ tipo: 'pago', estado: 'registrado' }),
        reportes.getVentas({ fecha_desde: primerDiaMes, fecha_hasta: hoyStr }),  // Ventas del mes
        fcCompra.getAll({ fecha_desde: primerDiaMes, fecha_hasta: hoyStr, estado: 'registrada' }),  // Compras del mes
        reportes.getCaja({ fecha_desde: primerDiaMes, fecha_hasta: hoyStr })  // Caja del mes
      ])

      console.log('DEBUG [ventas-semanales]:', ventasSemanalesRes.data)
      console.log('DEBUG [caja]:', cajaRes.data)
      console.log('DEBUG [stock]:', stockRes.data)
      console.log('DEBUG [ventas-mes]:', ventasMesRes.data)
      console.log('DEBUG [compras-mes]:', comprasMesRes.data)
      console.log('DEBUG [caja-mes]:', cajaMesRes.data)

      // Type assertions correctas
      const cajaData = cajaRes.data as unknown as ReporteCaja | null
      const stockData = stockRes.data as unknown as ReporteStock | null
      const ventasMesData = ventasMesRes.data as unknown as ReporteVentas | null

      // Guardar ventas del mes
      setVentasMes(ventasMesData)

      // ✅ Procesar respuesta de compras
      if (comprasMesRes.data && Array.isArray(comprasMesRes.data)) {
        const total = comprasMesRes.data.reduce((sum, fc) => sum + (fc.total || 0), 0)
        setComprasMes({
          monto_total: total,
          total_facturas: comprasMesRes.data.length
        })
      }

      // ✅ Procesar respuesta de caja del mes
      if (cajaMesRes.data) {
        setCajaMes({
          total_ingresos: cajaMesRes.data.total_ingresos || 0,
          total_egresos: cajaMesRes.data.total_egresos || 0,
          saldo: cajaMesRes.data.saldo || 0
        })
      }

      // Ganancia del mes - REMOVED: moved to Reportes page

      // Guardar datos para las cards (se procesan abajo con useMemo)
      setCajaDataForCards(cajaRes.data as unknown as ReporteCaja | null)
      setStockDataForCards(stockRes.data as unknown as ReporteStock | null)

      // Guardar ventas del mes
      setVentasMes(ventasMesData)

      // Procesar gráfico de ventas semanales desde endpoint real
      const ventasSemanalesTyped = ventasSemanalesRes.data as unknown as VentasSemanalesResponse | null
      if (ventasSemanalesTyped?.labels && ventasSemanalesTyped?.datasets?.[0]?.data) {
        setChartVentas({
          labels: ventasSemanalesTyped.labels,
          datasets: [{
            label: 'Ventas ($)',
            data: ventasSemanalesTyped.datasets[0].data,
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)'
          }]
        })
      } else {
        // Fallback: mostrar mensaje en lugar de gráfico vacío
        setChartVentas(null)
      }

      // Procesar gráfico de caja con datos reales
      setChartCaja({
        labels: ['Ingresos', 'Egresos'],
        datasets: [{
          label: 'Caja ($)',
          data: [
            cajaData?.total_ingresos || 0,
            cajaData?.total_egresos || 0
          ],
          borderColor: ['#10B981', '#EF4444'],
          backgroundColor: ['rgba(16, 185, 129, 0.2)', 'rgba(239, 68, 68, 0.2)']
        }]
      })

      // Productos con stock bajo desde endpoint real
      setStockBajo(stockData?.productos_bajo || [])

      // Cobros y pagos recientes (últimos 5 de cada uno)
      if (cobrosRes.data) {
        setCobrosRecientes((cobrosRes.data as Recibo[]).slice(0, 5))
      }
      if (pagosRes.data) {
        setPagosRecientes((pagosRes.data as Recibo[]).slice(0, 5))
      }

    } catch (err) {
      setError('Error al cargar datos del dashboard')
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Renderizar gráfico de barras simple (sin librerías externas)
  const renderBarChart = (data: ChartData, title: string) => {
    const maxValue = Math.max(...data.datasets[0].data, 1)  // Evitar división por cero

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-4">
          {data.labels.map((label, index) => {
            const value = data.datasets[0].data[index]
            const percentage = (value / maxValue) * 100
            const colors = data.datasets[0].borderColor
            const bgColor = Array.isArray(colors) ? colors[index] : colors

            return (
              <div key={label} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-16">{label}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      backgroundColor: bgColor || '#3B82F6'
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-24 text-right">
                  {formatCurrency(value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ✅ MEMO: Cards se re-crean cuando ventasHoyValor, cajaDataForCards o stockDataForCards cambian
  const cards = useMemo(() => [
    {
      title: 'Ventas Hoy',
      value: formatCurrency(ventasHoyValor),  // ✅ Ahora sí se actualiza
      change: 'Datos en tiempo real',
      icon: '📊',
      color: 'bg-green-500'
    },
    {
      title: 'Ingresos Caja',
      value: formatCurrency(cajaDataForCards?.total_ingresos || 0),
      change: '+8%',
      icon: '💰',
      color: 'bg-blue-500'
    },
    {
      title: 'Egresos Caja',
      value: formatCurrency(cajaDataForCards?.total_egresos || 0),
      change: '-3%',
      icon: '💸',
      color: 'bg-red-500'
    },
    {
      title: 'Saldo Actual',
      value: formatCurrency(cajaDataForCards?.saldo || 0),
      change: (cajaDataForCards?.saldo || 0) >= 0 ? '+5%' : '-2%',
      icon: '🏦',
      color: (cajaDataForCards?.saldo || 0) >= 0 ? 'bg-emerald-500' : 'bg-orange-500'
    },
    {
      title: 'Productos Activos',
      value: stockDataForCards?.total_productos || 0,
      icon: '📦',
      color: 'bg-purple-500'
    },
    {
      title: 'Stock Bajo',
      value: stockDataForCards?.stock_bajo || 0,
      change: (stockDataForCards?.stock_bajo || 0) > 0 ? '⚠️ Reponer' : '✅ OK',
      icon: '⚡',
      color: (stockDataForCards?.stock_bajo || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-500'
    }
  ] as DashboardCard[], [ventasHoyValor, cajaDataForCards, stockDataForCards])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">Resumen de tu negocio en tiempo real</p>
        </div>
        <button
          onClick={cargarDashboard}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900
                   border border-gray-300 rounded-lg hover:bg-gray-50
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              Actualizando...
            </>
          ) : (
            '🔄 Actualizar'
          )}
        </button>
      </div>

      {/* Loading / Error */}
      {loading && cards.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
          <button
            onClick={cargarDashboard}
            className="ml-4 underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Cards del Dashboard */}
      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  {card.change && (
                    <p className={`text-xs mt-1 ${
                      card.change.includes('+') || card.change.includes('✅') || card.change.includes('OK')
                        ? 'text-green-600'
                        : card.change.includes('-') || card.change.includes('⚠️')
                        ? 'text-red-600'
                        : 'text-gray-500'
                    }`}>
                      {card.change}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 ${card.color} rounded-full flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ventas del Mes - Card especial clicable */}
      {!loading && ventasMes && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition border-l-4 border-green-500"
            onClick={() => {
              const { primerDia, hoyStr } = getFechasMesActual()
              navigate('/fc-venta', {
                state: { filtroFecha: { desde: primerDia, hasta: hoyStr } }
              })
            }}
            title="Click para ver detalle de ventas del mes"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">💰 Ventas del Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(ventasMes.monto_total || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {ventasMes.total_facturas} facturas emitidas
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          {/* 📦 Compras del Mes - CARD CLICABLE */}
          <div
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition border-l-4 border-purple-500"
            onClick={() => {
              const { primerDia, hoyStr } = getFechasMesActual()
              navigate('/fc-compra', {
                state: { filtroFecha: { desde: primerDia, hasta: hoyStr } }
              })
            }}
            title="Click para ver detalle de compras del mes"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">📦 Compras del Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(comprasMes.monto_total || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {comprasMes.total_facturas} facturas registradas
                </p>
              </div>
              <div className="text-3xl">🚚</div>
            </div>
          </div>

          {/* 💵 Caja del Mes - CARD CLICABLE */}
          <div
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition border-l-4 border-orange-500"
            onClick={() => {
              const { primerDia, hoyStr } = getFechasMesActual()
              navigate('/caja', {
                state: { filtroFecha: { desde: primerDia, hasta: hoyStr } }
              })
            }}
            title="Click para ver detalle de caja del mes"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">💵 Caja del Mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(cajaMes.saldo || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Ingresos: {formatCurrency(cajaMes.total_ingresos)} | Egresos: {formatCurrency(cajaMes.total_egresos)}
                </p>
              </div>
              <div className="text-3xl">🏦</div>
            </div>
          </div>
        </div>
      )}

      {/* Ganancia del Mes - REMOVED: moved to Reportes page */}

      {/* Gráficos */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {chartVentas ? (
            renderBarChart(chartVentas, '📈 Ventas de la Semana')
          ) : (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500">No hay datos de ventas para mostrar</p>
            </div>
          )}
          {chartCaja && renderBarChart(chartCaja, '💰 Movimientos de Caja')}
        </div>
      )}

      {/* Alertas de Stock Bajo */}
      {!loading && stockBajo.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">⚠️ Productos con Stock Bajo</h3>
            <p className="text-sm text-gray-500">Reponé estos productos antes de que se agoten</p>
          </div>
          <div className="divide-y divide-gray-200">
            {stockBajo.slice(0, 5).map((producto) => (
              <div key={producto.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{producto.nombre}</p>
                  <p className="text-sm text-gray-500">SKU: {producto.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    Stock: {producto.stock_actual} / Mín: {producto.stock_minimo}
                  </p>
                  <p className="text-xs text-gray-500">
                    Faltan: {producto.faltante} unidades
                  </p>
                </div>
                <button
                  onClick={() => handleReponer(producto.id, producto.nombre)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  title="Crear pedido para este producto"
                >
                  📦 Reponer
                </button>
              </div>
            ))}
          </div>
          {stockBajo.length > 5 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <button
                onClick={() => navigate('/productos', {
                  state: { filtroStock: 'bajo' }
                })}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Ver todos los productos con stock bajo →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mensaje si no hay alertas */}
      {!loading && stockBajo.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">✅ Todo en orden</p>
          <p className="text-sm text-green-600">No hay productos con stock bajo</p>
        </div>
      )}

      {/* Cobros y Pagos Recientes */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cobros Recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">💰 Cobros Recientes</h3>
                <p className="text-sm text-gray-500">Últimos 5 cobros registrados</p>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {cobrosRecientes.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No hay cobros recientes</p>
                </div>
              ) : (
                cobrosRecientes.map((cobro) => (
                  <div key={cobro.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{cobro.numero_interno}</p>
                      <p className="text-sm text-gray-500">
                        {cobro.entidad_nombre || cobro.cliente_nombre || '-'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(cobro.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        {formatCurrency(cobro.monto)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{cobro.medio_pago}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagos Recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">💸 Pagos Recientes</h3>
                <p className="text-sm text-gray-500">Últimos 5 pagos registrados</p>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {pagosRecientes.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2">No hay pagos recientes</p>
                </div>
              ) : (
                pagosRecientes.map((pago) => (
                  <div key={pago.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{pago.numero_interno}</p>
                      <p className="text-sm text-gray-500">
                        {pago.entidad_nombre || pago.proveedor_nombre || '-'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(pago.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {formatCurrency(pago.monto)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{pago.medio_pago}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
