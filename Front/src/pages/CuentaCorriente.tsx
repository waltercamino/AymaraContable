import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cuentaCorriente, proveedores, clientes } from '../services/api'
import { formatCurrency } from '../utils/format'
import { Wallet, DollarSign, FileText, FileSpreadsheet, Printer } from 'lucide-react'
import { toast } from 'react-toastify'

interface Movimiento {
  id: number
  tipo: string
  entidad_id: number
  debe: number
  haber: number
  saldo: number
  descripcion: string
  fecha: string
  creado_en: string
  medio_pago?: string
  cobro_id?: number
  pago_id?: number
}

export default function CuentaCorriente() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Leer tipo de la URL (query param), default a 'cliente'
  const tipoFromURL = searchParams.get('tipo') === 'proveedor' ? 'proveedor' : 'cliente'
  const [tipo, setTipo] = useState<'proveedor' | 'cliente'>(tipoFromURL)
  const [entidadId, setEntidadId] = useState<number>(0)
  const [saldo, setSaldo] = useState<number>(0)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Listas
  const [proveedoresList, setProveedoresList] = useState<any[]>([])
  const [clientesList, setClientesList] = useState<any[]>([])

  // Modal de pago/cobro
  const [showModal, setShowModal] = useState(false)
  const [montoPago, setMontoPago] = useState<number>(0)
  const [medioPago, setMedioPago] = useState('transferencia')
  const [descripcionPago, setDescripcionPago] = useState('')

  // Filtro de fechas
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')

  // Resúmenes de Deudores y Acreedores
  const [resumenDeudores, setResumenDeudores] = useState<any[]>([])
  const [resumenAcreedores, setResumenAcreedores] = useState<any[]>([])
  const [loadingResumen, setLoadingResumen] = useState(false)

  // Actualizar URL cuando cambia el tipo
  useEffect(() => {
    navigate(`/cuenta-corriente?tipo=${tipo}`, { replace: true })
  }, [tipo, navigate])

  // Cargar resúmenes de Deudores y Acreedores
  useEffect(() => {
    const cargarResumenes = async () => {
      try {
        setLoadingResumen(true)
        const [deudoresRes, acreedoresRes] = await Promise.all([
          fetch('/api/cuenta-corriente/resumen/deudores', {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }
          }),
          fetch('/api/cuenta-corriente/resumen/acreedores', {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem('access_token')}` }
          })
        ])
        
        const deudores = await deudoresRes.json()
        const acreedores = await acreedoresRes.json()
        
        setResumenDeudores(deudores)
        setResumenAcreedores(acreedores)
      } catch (err) {
        console.error('Error al cargar resúmenes:', err)
      } finally {
        setLoadingResumen(false)
      }
    }
    cargarResumenes()
  }, [])

  // Cargar listas
  useEffect(() => {
    cargarListas()
  }, [tipo])

  const cargarListas = async () => {
    try {
      if (tipo === 'proveedor') {
        const res = await proveedores.getAll()
        setProveedoresList(res.data || [])
        if (res.data && res.data.length > 0) {
          setEntidadId(res.data[0].id)
        }
      } else {
        const res = await clientes.getAll()
        setClientesList(res.data || [])
        if (res.data && res.data.length > 0) {
          setEntidadId(res.data[0].id)
        }
      }
    } catch (err) {
      console.error('Error al cargar listas:', err)
    }
  }

  // Cargar saldo cuando cambia la entidad
  useEffect(() => {
    if (entidadId > 0) {
      cargarSaldo()
    }
  }, [tipo, entidadId])

  const cargarSaldo = async () => {
    try {
      setLoading(true)
      setError('')
      
      const endpoint = tipo === 'proveedor' ? 'getSaldoProveedor' : 'getSaldoCliente'
      const data = await cuentaCorriente[endpoint](entidadId)
      
      if (data.error) {
        setError(data.error)
      } else {
        setSaldo(data.data.saldo_actual)
        setMovimientos(data.data.movimientos || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar saldo')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar movimientos por fecha
  const movimientosFiltrados = useMemo(() => {
    let filtrados = movimientos
    
    if (fechaDesde) {
      filtrados = filtrados.filter(m => new Date(m.fecha) >= new Date(fechaDesde))
    }
    if (fechaHasta) {
      filtrados = filtrados.filter(m => new Date(m.fecha) <= new Date(fechaHasta))
    }
    
    return filtrados
  }, [movimientos, fechaDesde, fechaHasta])

  // Calcular saldo anterior (antes del período filtrado)
  const saldoAnterior = useMemo(() => {
    if (!fechaDesde) return 0
    
    return movimientos
      .filter(m => new Date(m.fecha) < new Date(fechaDesde))
      .reduce((acc, m) => {
        const debe = parseFloat(m.debe) || 0
        const haber = parseFloat(m.haber) || 0
        return acc + debe - haber
      }, 0)
  }, [movimientos, fechaDesde])

  // Registrar pago/cobro
  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')

      if (montoPago <= 0) {
        setError('El monto debe ser mayor a 0')
        return
      }

      let response
      if (tipo === 'proveedor') {
        response = await cuentaCorriente.registrarPago({
          proveedor_id: entidadId,
          monto: montoPago,
          medio_pago: medioPago,
          descripcion: descripcionPago || undefined,
          fecha: new Date().toISOString().split('T')[0]
        })
      } else {
        response = await cuentaCorriente.registrarCobro({
          cliente_id: entidadId,
          monto: montoPago,
          medio_pago: medioPago,
          descripcion: descripcionPago || undefined,
          fecha: new Date().toISOString().split('T')[0]
        })
      }

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(tipo === 'proveedor' ? 'Pago registrado' : 'Cobro registrado')
        setShowModal(false)
        setMontoPago(0)
        setMedioPago('transferencia')
        setDescripcionPago('')
        cargarSaldo()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    }
  }

  const entidadSeleccionada = tipo === 'proveedor'
    ? proveedoresList.find(p => p.id === entidadId)
    : clientesList.find(c => c.id === entidadId)

  // Descargar PDF
  const descargarPDF = async () => {
    try {
      setError('')
      const url = cuentaCorriente.descargarPDF(tipo, entidadId, fechaDesde || undefined, fechaHasta || undefined)
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
      const nombreEntidad = entidadSeleccionada?.nombre.replace(/\s+/g, '_') || 'entidad'
      const periodo = fechaDesde && fechaHasta ? `_del_${fechaDesde}_al_${fechaHasta}` : ''
      a.download = `estado_cuenta_${tipo}_${entidadId}_${nombreEntidad}${periodo}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al descargar PDF')
    }
  }

  // Descargar PDF de comprobante (desde movimiento CC)
  const imprimirComprobante = async (movimiento: Movimiento) => {
    try {
      const token = sessionStorage.getItem('access_token')

      // Usar endpoint genérico de comprobante CC para todos los medios de pago
      const url = `/api/cuenta-corriente/movimiento/${movimiento.id}/imprimir`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Error al generar comprobante')
      }

      const blob = await response.blob()
      
      // ✅ Leer nombre del header Content-Disposition
      let filename = `recibo_${movimiento.id}_${Date.now()}.pdf`  // fallback
      const disposition = response.headers.get('Content-Disposition')
      
      if (disposition && disposition.includes('filename=')) {
        // Extraer filename: attachment; filename="cobro_Juan_20260302.pdf"
        const filenameMatch = disposition.match(/filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/)
        if (filenameMatch) {
          filename = decodeURIComponent((filenameMatch[1] || filenameMatch[2] || filenameMatch[3] || '').trim())
          console.log(`✅ [DOWNLOAD] Nombre del header: ${filename}`)
        }
      }
      
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename  // ✅ Usar nombre del header
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)

      console.log(`🔍 [DOWNLOAD] Archivo: ${filename}`)
      toast.success('Comprobante generado correctamente')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al imprimir comprobante')
    }
  }

  // Descargar Excel
  const descargarExcel = async () => {
    try {
      setError('')
      const url = cuentaCorriente.descargarExcel(tipo, entidadId, fechaDesde || undefined, fechaHasta || undefined)
      const token = sessionStorage.getItem('access_token')

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Error al generar Excel')
      }

      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const nombreEntidad = entidadSeleccionada?.nombre.replace(/\s+/g, '_') || 'entidad'
      const periodo = fechaDesde && fechaHasta ? `_del_${fechaDesde}_al_${fechaHasta}` : ''
      a.download = `estado_cuenta_${tipo}_${entidadId}_${nombreEntidad}${periodo}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al descargar Excel')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Cuenta Corriente</h1>
          <p className="text-sm text-gray-500 mt-1">Control de deuda con proveedores y crédito con clientes</p>
        </div>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Resúmenes de Deudores y Acreedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Deudores (Clientes que nos deben) */}
        <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="font-bold text-red-900 dark:text-red-400 mb-2 flex items-center gap-2">
            📋 Deudores
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">Clientes con saldo a favor</p>
          {loadingResumen ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-700 dark:border-red-400"></div>
            </div>
          ) : resumenDeudores.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-2 text-gray-900 dark:text-gray-200 font-semibold">Cliente</th>
                    <th className="text-right text-gray-900 dark:text-gray-200 font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenDeudores.map(cliente => (
                    <tr key={cliente.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="py-2 text-gray-900 dark:text-gray-200 font-medium">{cliente.nombre}</td>
                      <td className="text-right text-red-700 dark:text-red-400 font-bold">
                        $ {cliente.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No hay deudores</p>
          )}
        </div>

        {/* Acreedores (Proveedores a quienes debemos) */}
        <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
            📋 Acreedores
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">Proveedores con deuda pendiente</p>
          {loadingResumen ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700 dark:border-blue-400"></div>
            </div>
          ) : resumenAcreedores.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="text-left sticky top-0 bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="py-2 text-gray-900 dark:text-gray-200 font-semibold">Proveedor</th>
                    <th className="text-right text-gray-900 dark:text-gray-200 font-semibold">Deuda Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenAcreedores.map(proveedor => (
                    <tr key={proveedor.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="py-2">
                        <div className="font-medium text-gray-900 dark:text-gray-200">{proveedor.nombre}</div>
                        {proveedor.cuit && (
                          <div className="text-xs text-gray-700 dark:text-gray-400">CUIT: {proveedor.cuit}</div>
                        )}
                      </td>
                      <td className="text-right text-blue-700 dark:text-blue-400 font-bold">
                        $ {proveedor.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">No hay proveedores con deuda pendiente</p>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <Wallet className="text-blue-700 dark:text-blue-400 flex-shrink-0" size={20} />
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <p className="font-medium">Gestión de Cuenta Corriente</p>
          <p className="mt-1 text-gray-700 dark:text-gray-300">
            {tipo === 'proveedor'
              ? 'Saldo positivo = deuda con el proveedor | Pagos reducen la deuda'
              : 'Saldo positivo = cliente nos debe | Cobros reducen la deuda'}
          </p>
        </div>
      </div>

      {/* Selector de tipo y entidad */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Pestañas (Tabs) */}
        <div className="flex border-b mb-4">
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              tipo === 'cliente' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTipo('cliente')}
          >
            👥 Clientes
          </button>
          <button
            className={`px-6 py-3 font-medium transition-colors ${
              tipo === 'proveedor' 
                ? 'border-b-2 border-blue-600 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTipo('proveedor')}
          >
            🏢 Proveedores
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tipo === 'proveedor' ? 'Proveedor' : 'Cliente'}
            </label>
            <select
              value={entidadId}
              onChange={(e) => setEntidadId(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              {(tipo === 'proveedor' ? proveedoresList : clientesList).map((entidad) => (
                <option key={entidad.id} value={entidad.id}>
                  {entidad.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={cargarSaldo}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 mt-6"
          >
            {loading ? '⏳' : '🔄'} Actualizar
          </button>

          {/* Filtro de fechas */}
          <div className="flex gap-4 mt-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={() => {
                setFechaDesde('')
                setFechaHasta('')
              }}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Limpiar
            </button>
          </div>

          {/* Saldo anterior (solo cuando hay filtro de fechas) */}
          {fechaDesde && saldoAnterior !== 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                💡 <strong>Saldo anterior al {fechaDesde}:</strong> $ {saldoAnterior.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}

          {/* Botones de exportar - solo visibles si hay entidad seleccionada */}
          {entidadId > 0 && (
            <div className="flex gap-2 mt-6">
              <button
                onClick={descargarPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors"
                title="Descargar PDF"
              >
                <FileText size={18} />
                PDF
              </button>
              <button
                onClick={descargarExcel}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
                title="Descargar Excel"
              >
                <FileSpreadsheet size={18} />
                Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Saldo actual */}
      {entidadSeleccionada && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {entidadSeleccionada.nombre}
              </h2>
              <p className="text-sm text-gray-500">
                {tipo === 'proveedor' ? 'Proveedor' : 'Cliente'}
              </p>
            </div>
            <div className={`text-right ${saldo > 0 ? 'text-red-600' : saldo < 0 ? 'text-green-600' : 'text-gray-600'}`}>
              <p className="text-sm">
                {saldo > 0
                  ? (tipo === 'proveedor' ? 'Deuda pendiente' : 'Cliente nos debe')
                  : saldo < 0
                    ? 'Saldo a favor'
                    : 'Saldo en cero'}
              </p>
              <p className="text-3xl font-bold">
                {formatCurrency(Math.abs(saldo))}
              </p>
            </div>
          </div>

          {/* Botón de pago/cobro */}
          <button
            onClick={() => setShowModal(true)}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              saldo > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={saldo <= 0}
          >
            {tipo === 'proveedor' ? 'Registrar Pago' : 'Registrar Cobro'}
            {saldo > 0 && (
              <span className="ml-2 text-sm opacity-80">
                (Saldo: {formatCurrency(saldo)})
              </span>
            )}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && movimientos.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Movimientos */}
      {!loading && movimientos.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Movimientos</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medio Pago</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Debe</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Haber</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {movimientosFiltrados.map((mov) => (
                <tr key={mov.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(mov.fecha).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {mov.descripcion?.includes('Anulación') || mov.descripcion?.includes('[ANULADO]') ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-orange-600 font-medium" title="Movimiento revertido por anulación">
                          🔁 {mov.descripcion}
                        </span>
                        <span className="text-xs text-gray-500 italic">
                          Reversión por anulación de recibo
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-700">{mov.descripcion}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 capitalize">{mov.medio_pago || '-'}</td>
                  <td className="px-6 py-4 text-sm text-right">
                    {mov.debe > 0 ? (
                      <span className={mov.descripcion?.includes('Anulación') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        {mov.descripcion?.includes('Anulación') ? '+' : ''}{formatCurrency(mov.debe)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {mov.haber > 0 ? (
                      <span className={mov.descripcion?.includes('Anulación') ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                        {mov.descripcion?.includes('Anulación') ? '-' : ''}{formatCurrency(mov.haber)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium">
                    {formatCurrency(mov.saldo)}
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    {/* Botón Imprimir Comprobante - para TODOS los cobros/pagos */}
                    {(mov.cobro_id || mov.pago_id) && (
                      <button
                        onClick={() => imprimirComprobante(mov)}
                        className="text-blue-600 hover:text-blue-900 flex items-center justify-center gap-1 mx-auto"
                        title="Imprimir Comprobante"
                      >
                        <Printer size={16} />
                        <span className="text-xs">Imprimir</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && movimientos.length === 0 && entidadId > 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No hay movimientos registrados</p>
        </div>
      )}

      {/* Modal de Pago/Cobro */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {tipo === 'proveedor' ? 'Registrar Pago' : 'Registrar Cobro'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegistrarPago} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {entidadSeleccionada?.nombre}
                </label>
                <p className="text-sm text-gray-500">
                  Saldo actual: {formatCurrency(saldo)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoPago}
                  onChange={(e) => setMontoPago(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medio de Pago
                </label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={descripcionPago}
                  onChange={(e) => setDescripcionPago(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Detalles del pago/cobro..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {tipo === 'proveedor' ? 'Registrar Pago' : 'Registrar Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
