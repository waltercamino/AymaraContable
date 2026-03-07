// src/pages/Caja.tsx
// Gestión completa de Caja - Apertura, Movimientos, Cierre, Historial

import { useState, useEffect } from 'react'
import { caja, type CajaMovimiento } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { 
  Plus, TrendingUp, TrendingDown, Wallet, Calendar, 
  FileText, X, CheckCircle, AlertCircle, Eye 
} from 'lucide-react'

// Interfaces
interface MovimientoCaja extends CajaMovimiento {
  id: number
  fecha: string
  tipo: 'ingreso' | 'egreso'
  tipo_movimiento: string
  categoria_nombre?: string
  cliente_nombre?: string
  proveedor_nombre?: string
  descripcion: string
  monto: number
  medio_pago?: string
  creado_en?: string
}

interface ResumenCaja {
  total_ingresos: number
  total_egresos: number
  saldo: number
  por_categoria: Record<string, number>
}

interface CajaDia {
  id: number
  fecha: string
  saldo_inicial: number
  saldo_final?: number
  estado: 'abierto' | 'cerrado'
  usuario_id?: number
  fecha_apertura?: string
  fecha_cierre?: string
  observaciones_cierre?: string
}

// Tabs principales
interface TabPrincipal {
  id: string
  label: string
}

const tabsPrincipales: TabPrincipal[] = [
  { id: 'movimientos', label: 'Historial' },
  { id: 'historial', label: 'Historial de Cajas' },
]

export default function Caja() {
  // Estados principales
  const [tabPrincipal, setTabPrincipal] = useState('movimientos')
  const [activeTab, setActiveTab] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [showAperturaCierre, setShowAperturaCierre] = useState(false)
  const [showMovimientosCaja, setShowMovimientosCaja] = useState(false)
  const [cajaSeleccionada, setCajaSeleccionada] = useState<CajaDia | null>(null)
  
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([])
  const [historialCajas, setHistorialCajas] = useState<CajaDia[]>([])
  const [movimientosCajaSeleccionada, setMovimientosCajaSeleccionada] = useState<MovimientoCaja[]>([])
  const [resumen, setResumen] = useState<ResumenCaja | null>(null)
  const [cajaDelDia, setCajaDelDia] = useState<CajaDia | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    categoria_id: '',
    tipo: '',
    estado: 'todos'
  })

  // Formulario movimiento
  const [formData, setFormData] = useState({
    tipo_movimiento: 'ingreso' as 'ingreso' | 'egreso',
    categoria_caja_id: null as number | null,
    descripcion: '',
    monto: 0,
    medio_pago: 'efectivo',
    observaciones: ''
  })

  // Formulario apertura/cierre
  const [formDataApertura, setFormDataApertura] = useState({
    saldo_inicial: 0,
    observaciones: ''
  })

  const [formDataCierre, setFormDataCierre] = useState({
    saldo_final: 0,
    observaciones: ''
  })

  // Categorías
  const [categorias, setCategorias] = useState<Array<{id: number, nombre: string, tipo: string, subcategoria?: string}>>([])

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [tabPrincipal, filtros])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      if (tabPrincipal === 'movimientos') {
        // 🔍 DEBUG: Ver qué caja_id se está pasando
        console.log("🔍 cargarDatos (movimientos):", {
          cajaDelDia_id: cajaDelDia?.id,
          cajaDelDia_estado: cajaDelDia?.estado,
          caja_id_a_enviar: cajaDelDia?.id || undefined
        })

        // ✅ FIX: Primero obtener cajaDelDia, luego usar su ID en las otras llamadas
        const cajaHoyRes = await caja.getHoy()
        if (cajaHoyRes.error) throw new Error(cajaHoyRes.error)
        const cajaData = cajaHoyRes.data as unknown as CajaDia
        setCajaDelDia(cajaData)

        // ✅ Si no hay caja abierta, limpiar y salir (no llamar a getAll/getResumen)
        if (!cajaData) {
          console.log("⚠️ No hay caja abierta, limpiar movimientos y resumen")
          setMovimientos([])
          setResumen(null)
          setCategorias([])
          setLoading(false)
          return  // ← No continuar sin caja
        }

        // Ahora que tenemos cajaDelDia, hacer las otras llamadas en paralelo
        const [movimientosRes, resumenRes, categoriasRes] = await Promise.all([
          caja.getAll({
            fecha_desde: filtros.fecha_desde || undefined,
            fecha_hasta: filtros.fecha_hasta || undefined,
            tipo: filtros.tipo || undefined,
            categoria_id: filtros.categoria_id ? Number(filtros.categoria_id) : undefined,
            caja_id: cajaData.id || undefined  // ✅ FIX: Filtrar por sesión de caja actual
          }),
          caja.getResumen({
            fecha_desde: filtros.fecha_desde || undefined,
            fecha_hasta: filtros.fecha_hasta || undefined,
            caja_id: cajaData.id || undefined  // ✅ FIX: Filtrar por sesión de caja actual
          }),
          caja.getCategorias()
        ])

        // 🔍 DEBUG: Ver qué resumen se recibe
        console.log("🔍 Resumen recibido:", resumenRes.data)

        if (movimientosRes.error) throw new Error(movimientosRes.error)
        if (resumenRes.error) throw new Error(resumenRes.error)
        if (categoriasRes.error) throw new Error(categoriasRes.error)

        setMovimientos((movimientosRes.data as unknown as MovimientoCaja[]) || [])
        setResumen((resumenRes.data as unknown as ResumenCaja) || null)
        // setCajaDelDia ya fue llamado arriba después de getHoy()
        setCategorias(categoriasRes.data as unknown as Array<{id: number, nombre: string, tipo: string}> || [])
      } else {
        // Historial
        const historialRes = await caja.getHistorial({
          fecha_desde: filtros.fecha_desde || undefined,
          fecha_hasta: filtros.fecha_hasta || undefined,
          estado: filtros.estado !== 'todos' ? filtros.estado : undefined
        })

        if (historialRes.error) throw new Error(historialRes.error)
        setHistorialCajas(historialRes.data as unknown as CajaDia[] || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar movimientos por tab
  const movimientosFiltrados = movimientos.filter(m => {
    if (activeTab === 'todos') return true
    if (activeTab === 'ingresos') return m.tipo === 'ingreso' || m.tipo_movimiento === 'ingreso'
    if (activeTab === 'egresos') return m.tipo === 'egreso' || m.tipo_movimiento === 'egreso'
    return true
  })

  // Crear movimiento
  const handleCrearMovimiento = async () => {
    try {
      setError('')
      
      if (!formData.descripcion || !formData.monto || formData.monto <= 0) {
        setError('Complete todos los campos requeridos')
        return
      }

      const response = await caja.create({
        tipo_movimiento: formData.tipo_movimiento,
        categoria_caja_id: formData.categoria_caja_id || undefined,
        descripcion: formData.descripcion,
        monto: formData.monto,
        medio_pago: formData.medio_pago,
      })

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Movimiento registrado correctamente')
        setFormData({
          tipo_movimiento: 'ingreso',
          categoria_caja_id: null,
          descripcion: '',
          monto: 0,
          medio_pago: 'efectivo',
          observaciones: ''
        })
        cargarDatos()
        setShowModal(false)
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear movimiento')
    }
  }

  // Abrir caja
  const handleAbrirCaja = async () => {
    try {
      setError('')

      const response = await caja.apertura({
        saldo_inicial: formDataApertura.saldo_inicial,
        observaciones: formDataApertura.observaciones
      })

      if (response.error) {
        setError(response.error)
      } else {
        const cajaData = response.data as unknown as CajaDia
        
        setCajaDelDia(cajaData)
        setFormDataApertura({ saldo_inicial: 0, observaciones: '' })
        setShowAperturaCierre(false)
        setSuccess('✅ Caja abierta correctamente')
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al abrir caja')
    }
  }

  // Cerrar caja
  const handleCerrarCaja = async () => {
    try {
      setError('')

      const response = await caja.cierre({
        saldo_final: formDataCierre.saldo_final,
        observaciones: formDataCierre.observaciones
      })

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Caja cerrada correctamente')
        setCajaDelDia(response.data as unknown as CajaDia)
        setFormDataCierre({ saldo_final: 0, observaciones: '' })
        setShowAperturaCierre(false)
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cerrar caja')
    }
  }

  // Ver movimientos de una caja
  const verMovimientosDeCaja = async (cajaDia: CajaDia) => {
    try {
      setLoading(true)
      const response = await caja.getMovimientosDeCaja(cajaDia.id)

      if (response.error) throw new Error(response.error)

      setCajaSeleccionada(cajaDia)
      setMovimientosCajaSeleccionada(response.data as unknown as MovimientoCaja[])
      setShowMovimientosCaja(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }

  // 🚨 EMERGENCIA: Cerrar caja manualmente
  const cerrarCajaManual = async (cajaDia: CajaDia) => {
    const confirmacion = window.confirm(
      `🚨 CIERRE MANUAL DE EMERGENCIA\n\n` +
      `Caja del ${cajaDia.fecha}\n` +
      `Saldo inicial: $${cajaDia.saldo_inicial}\n\n` +
      `¿Está SEGURO que desea cerrar esta caja manualmente?\n` +
      `El sistema calculará el saldo teórico automáticamente.`
    )
    
    if (!confirmacion) return
    
    try {
      setLoading(true)
      setError('')
      
      const response = await caja.cerrarCajaManual(cajaDia.id)
      
      if (response.error) throw new Error(response.error)
      
      setSuccess(`✅ Caja cerrada manualmente - Saldo final: $${response.data?.saldo_final}`)
      cargarDatos()  // Recargar lista
      setTimeout(() => {
        setSuccess('')
        setError('')
      }, 5000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cerrar caja manualmente')
    } finally {
      setLoading(false)
    }
  }

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: '',
      fecha_hasta: '',
      categoria_id: '',
      tipo: '',
      estado: 'todos'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Caja</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de apertura, movimientos, cierre e historial</p>
        </div>
        {tabPrincipal === 'movimientos' && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowAperturaCierre(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <Calendar size={18} />
              {cajaDelDia?.estado === 'abierto' ? 'Ver Caja' : 'Abrir/Cerrar'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={!cajaDelDia || cajaDelDia.estado !== 'abierto'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />
              Nuevo Movimiento
            </button>
          </div>
        )}
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          {success}
        </div>
      )}

      {/* Tabs principales */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabsPrincipales.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTabPrincipal(tab.id)}
            className={`px-4 py-2 font-medium transition-colors ${
              tabPrincipal === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Estado de caja (solo en pestaña movimientos) */}
      {tabPrincipal === 'movimientos' && cajaDelDia && (
        <div className={`rounded-lg shadow p-4 ${
          cajaDelDia.estado === 'abierto' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {cajaDelDia.estado === 'abierto' ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <X className="text-red-600" size={24} />
              )}
              <div>
                <p className="font-semibold text-lg">
                  Caja {cajaDelDia.estado === 'abierto' ? '✅ Abierta' : '❌ Cerrada'}
                </p>
                <p className="text-sm text-gray-600">
                  Saldo Inicial: {formatCurrency(cajaDelDia.saldo_inicial)}
                  {cajaDelDia.estado === 'cerrado' && (
                    <span className="ml-4">
                      | Saldo Final: {formatCurrency(cajaDelDia.saldo_final || 0)}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {cajaDelDia.estado === 'abierto' && (
              <button
                onClick={() => {
                  setFormDataCierre({ 
                    saldo_final: resumen ? cajaDelDia.saldo_inicial + resumen.total_ingresos - resumen.total_egresos : 0,
                    observaciones: ''
                  })
                  setShowAperturaCierre(true)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cerrar Caja
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mensaje si no hay caja abierta */}
      {tabPrincipal === 'movimientos' && !cajaDelDia && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <div>
            <p className="font-semibold">⚠️ No hay caja abierta</p>
            <p className="text-sm">
              Debe abrir caja antes de registrar movimientos. Haga clic en "📅 Abrir/Cerrar" para iniciar la sesión.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={filtros.fecha_desde}
              onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={filtros.fecha_hasta}
              onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          {tabPrincipal === 'movimientos' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todos</option>
                  <option value="ingreso">Ingresos</option>
                  <option value="egreso">Egresos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filtros.categoria_id}
                  onChange={(e) => setFiltros({...filtros, categoria_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todas</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="todos">Todos</option>
                <option value="abierto">Abiertas</option>
                <option value="cerrado">Cerradas</option>
              </select>
            </div>
          )}
          <button
            onClick={cargarDatos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔍 Filtrar
          </button>
          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🔄 Limpiar
          </button>
        </div>
      </div>

      {/* Resumen (solo en movimientos) */}
      {tabPrincipal === 'movimientos' && resumen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Ingresos</h3>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(resumen.total_ingresos)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Egresos</h3>
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(resumen.total_egresos)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Saldo</h3>
              <Wallet className={resumen.saldo >= 0 ? "text-blue-600" : "text-orange-600"} size={20} />
            </div>
            <p className={`text-3xl font-bold ${
              resumen.saldo >= 0 ? "text-blue-600" : "text-orange-600"
            }`}>{formatCurrency(resumen.saldo)}</p>
          </div>
        </div>
      )}

      {/* Contenido según tab */}
      {tabPrincipal === 'movimientos' ? (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-4 border-b border-gray-200">
            {['todos', 'ingresos', 'egresos'].map(tabId => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === tabId
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tabId === 'todos' ? 'Todos' : tabId === 'ingresos' ? 'Ingresos' : 'Egresos'}
              </button>
            ))}
          </div>

          {/* Lista de movimientos */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Historial de Movimientos</h3>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : movimientosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4">No hay movimientos registrados</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medio Pago</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientosFiltrados.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(mov.fecha)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mov.tipo === 'ingreso' || mov.tipo_movimiento === 'ingreso'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo === 'ingreso' ? '💰 Ingreso' : '💸 Egreso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{mov.descripcion}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{mov.categoria_nombre || '-'}</td>
                      <td className={`px-6 py-4 text-sm text-right font-bold ${
                        mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.monto)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{mov.medio_pago || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        /* Historial de Cajas */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Historial de Cajas Diarias</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : historialCajas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4">No hay cajas registradas en el período seleccionado</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cierre</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historialCajas.map((caja) => (
                  <tr key={caja.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(caja.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        caja.estado === 'abierto'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {caja.estado === 'abierto' ? '✅ Abierta' : '🔒 Cerrada'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(caja.saldo_inicial)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {caja.saldo_final ? formatCurrency(caja.saldo_final) : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {caja.fecha_apertura ? new Date(caja.fecha_apertura).toLocaleString('es-AR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {caja.fecha_cierre ? new Date(caja.fecha_cierre).toLocaleString('es-AR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => verMovimientosDeCaja(caja)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 inline-flex"
                        >
                          <Eye size={16} />
                          Ver movimientos
                        </button>
                        {caja.estado === 'abierto' && (
                          <button
                            onClick={() => cerrarCajaManual(caja)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 inline-flex"
                            title="🚨 Cierre manual de emergencia"
                          >
                            <AlertCircle size={16} />
                            Cerrar manual
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Nuevo Movimiento */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nuevo Movimiento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Tipo de movimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Movimiento *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_movimiento: 'ingreso' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.tipo_movimiento === 'ingreso'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💰 Ingreso
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tipo_movimiento: 'egreso' })}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      formData.tipo_movimiento === 'egreso'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💸 Egreso
                  </button>
                </div>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.monto || ''}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-right"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoria_caja_id || ''}
                  onChange={(e) => setFormData({ ...formData, categoria_caja_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias
                    .filter(cat => cat.tipo === formData.tipo_movimiento)
                    .map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Pago de servicios, Cobro de factura..."
                />
              </div>

              {/* Medio de pago */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medio de Pago
                </label>
                <select
                  value={formData.medio_pago}
                  onChange={(e) => setFormData({ ...formData, medio_pago: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="cheque">📋 Cheque</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                </select>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCrearMovimiento}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Guardar Movimiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apertura/Cierre */}
      {showAperturaCierre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {cajaDelDia?.estado === 'abierto' ? '🔒 Cierre de Caja' : '🔓 Apertura de Caja'}
              </h3>
              <button
                onClick={() => {
                  setShowAperturaCierre(false)
                  setFormDataCierre({ saldo_final: 0, observaciones: '' })
                  setFormDataApertura({ saldo_inicial: 0, observaciones: '' })
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {cajaDelDia?.estado === 'abierto' ? (
              /* Formulario de CIERRE */
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">📊 Resumen del Día</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Saldo Inicial:</span>
                      <span className="font-medium">{formatCurrency(cajaDelDia.saldo_inicial)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Ingresos:</span>
                      <span className="font-medium">+{formatCurrency(resumen?.total_ingresos || 0)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Egresos:</span>
                      <span className="font-medium">-{formatCurrency(resumen?.total_egresos || 0)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-300 pt-2 font-bold">
                      <span>Saldo Teórico:</span>
                      <span>{formatCurrency(cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0))}</span>
                    </div>
                  </div>
                </div>

                {/* Diferencia entre saldo teórico y real */}
                {formDataCierre.saldo_final > 0 && (
                  <div className={`rounded-lg p-4 border-2 ${
                    Math.abs((cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final) < 0.01
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {Math.abs((cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final) < 0.01 ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600" size={20} />
                      )}
                      <h4 className={`font-semibold ${
                        Math.abs((cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final) < 0.01
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}>
                        {Math.abs((cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final) < 0.01
                          ? '✅ Caja Cuadra Perfectamente'
                          : '⚠️ Hay Diferencia'}
                      </h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Saldo Teórico:</span>
                        <span className="font-medium">{formatCurrency(cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saldo Real (ingresado):</span>
                        <span className="font-medium">{formatCurrency(formDataCierre.saldo_final)}</span>
                      </div>
                      <div className={`flex justify-between border-t pt-1 font-bold ${
                        (cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        <span>Diferencia:</span>
                        <span>
                          {(cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final >= 0 ? '+' : ''}
                          {formatCurrency((cajaDelDia.saldo_inicial + (resumen?.total_ingresos || 0) - (resumen?.total_egresos || 0)) - formDataCierre.saldo_final)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Final (conteo real) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formDataCierre.saldo_final || ''}
                      onChange={(e) => setFormDataCierre({...formDataCierre, saldo_final: parseFloat(e.target.value) || 0})}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-right"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ingrese el monto real contado en caja
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formDataCierre.observaciones}
                    onChange={(e) => setFormDataCierre({...formDataCierre, observaciones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Observaciones del cierre (ej: faltante, sobrante, etc.)..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAperturaCierre(false)
                      setFormDataCierre({ saldo_final: 0, observaciones: '' })
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCerrarCaja}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    🔒 Cerrar Caja
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario de APERTURA */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Inicial *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formDataApertura.saldo_inicial || ''}
                      onChange={(e) => setFormDataApertura({...formDataApertura, saldo_inicial: parseFloat(e.target.value) || 0})}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-right"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formDataApertura.observaciones}
                    onChange={(e) => setFormDataApertura({...formDataApertura, observaciones: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Observaciones de apertura..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAperturaCierre(false)
                      setFormDataApertura({ saldo_inicial: 0, observaciones: '' })
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAbrirCaja}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    🔓 Abrir Caja
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ver Movimientos de Caja */}
      {showMovimientosCaja && cajaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Movimientos del {formatDate(cajaSeleccionada.fecha)}
                </h3>
                <p className="text-sm text-gray-500">
                  Estado: {cajaSeleccionada.estado === 'abierto' ? 'Abierta' : 'Cerrada'}
                  {cajaSeleccionada.saldo_final && ` | Saldo Final: ${formatCurrency(cajaSeleccionada.saldo_final)}`}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMovimientosCaja(false)
                  setCajaSeleccionada(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : movimientosCajaSeleccionada.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4">No hay movimientos registrados para este día</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-14">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movimientosCajaSeleccionada.map((mov) => (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(mov.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo === 'ingreso' ? '💰 Ingreso' : '💸 Egreso'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{mov.descripcion}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{mov.categoria_nombre || '-'}</td>
                      <td className={`px-6 py-4 text-sm text-right font-bold ${
                        mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}{formatCurrency(mov.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
