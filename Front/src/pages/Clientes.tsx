// src/pages/Clientes.tsx
// CRUD de Clientes + Historial de Compras + Cuenta Corriente

import { useState, useEffect } from 'react'
import { clientes, Cliente } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Edit, Trash2, History, Wallet, TrendingUp } from 'lucide-react'

// Cliente extendido con propiedades del backend
interface ClienteCompleto extends Cliente {
  id: number
  nombre: string
  apellido?: string
  cuit?: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  condicion_iva: string
  tipo_cliente: 'minorista' | 'mayorista'
  activo: boolean
  creado_en: string
}

// Factura del historial
interface FacturaHistorial {
  id: number
  numero_factura: number
  tipo_comprobante: string
  fecha: string
  total: number
  estado: string
  medio_pago?: string
}

// Resumen del cliente
interface ResumenCliente {
  cliente_id: number
  cliente_nombre: string
  total_facturas: number
  monto_facturado: number
  total_ventas: number
  monto_ventas: number
  total_notas_credito: number
  monto_total_comprado: number
}

// Movimiento de cuenta corriente
interface MovimientoCC {
  id: number
  fecha: string
  tipo: 'factura' | 'pago' | 'nota_credito'
  documento: string
  descripcion: string
  debe: number
  haber: number
  saldo: number
}

export default function Clientes() {
  // Estados principales
  const [clientesList, setClientesList] = useState<ClienteCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'minorista' | 'mayorista'>('all')
  const [busqueda, setBusqueda] = useState('')

  // Modal CRUD
  const [showModal, setShowModal] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cuit: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    condicion_iva: 'Consumidor Final',
    tipo_cliente: 'minorista' as 'minorista' | 'mayorista',
    activo: true
  })

  // Modal Historial / Cuenta Corriente
  const [showHistorial, setShowHistorial] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteCompleto | null>(null)
  const [facturasHistorial, setFacturasHistorial] = useState<FacturaHistorial[]>([])
  const [resumenCliente, setResumenCliente] = useState<ResumenCliente | null>(null)
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Cuenta corriente (mock por ahora - se implementa con backend completo)
  const [cuentaCorriente, setCuentaCorriente] = useState<MovimientoCC[]>([])

  // Cargar datos al montar
  useEffect(() => {
    cargarDatos()
  }, [filtroTipo])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const params = filtroTipo === 'all' ? {} : { tipo_cliente: filtroTipo }
      const response = await clientes.getAll(params)

      if (response.error) throw new Error(response.error)
      setClientesList((response.data as ClienteCompleto[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleCrear = () => {
    setEditandoId(null)
    setFormData({
      nombre: '',
      apellido: '',
      cuit: '',
      email: '',
      telefono: '',
      direccion: '',
      ciudad: '',
      codigo_postal: '',
      condicion_iva: 'Consumidor Final',
      tipo_cliente: 'minorista',
      activo: true
    })
    setShowModal(true)
  }

  // Abrir modal para editar
  const handleEditar = (cliente: ClienteCompleto) => {
    setEditandoId(cliente.id)
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido || '',
      cuit: cliente.cuit || '',
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      ciudad: cliente.ciudad || '',
      codigo_postal: cliente.codigo_postal || '',
      condicion_iva: cliente.condicion_iva,
      tipo_cliente: cliente.tipo_cliente,
      activo: cliente.activo
    })
    setShowModal(true)
  }

  // Guardar (crear o editar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')

      if (!formData.nombre.trim()) {
        setError('El nombre es obligatorio')
        return
      }

      let response
      if (editandoId) {
        response = await clientes.update(editandoId, formData)
      } else {
        response = await clientes.create(formData)
      }

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(editandoId ? 'Cliente actualizado' : 'Cliente creado')
        setShowModal(false)
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  // Eliminar cliente
  const handleEliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      const response = await clientes.delete(id)
      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Cliente eliminado')
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Ver historial y cuenta corriente
  const handleVerHistorial = async (cliente: ClienteCompleto) => {
    try {
      setLoadingHistorial(true)
      setClienteSeleccionado(cliente)
      setShowHistorial(true)

      // Cargar facturas del cliente
      const facturasRes = await clientes.getFacturas(cliente.id)
      if (!facturasRes.error) {
        setFacturasHistorial((facturasRes.data as unknown as FacturaHistorial[]) || [])
      }

      // Cargar resumen del cliente
      const resumenRes = await clientes.getResumen(cliente.id)
      if (!resumenRes.error) {
        setResumenCliente((resumenRes.data as unknown as ResumenCliente) || null)
      }

      // Cuenta corriente (MOCK - implementar cuando esté el backend)
      // Por ahora generamos movimientos ficticios basados en las facturas
      const movimientos: MovimientoCC[] = (facturasRes.data as unknown as FacturaHistorial[] || []).map((f) => ({
        id: f.id,
        fecha: f.fecha,
        tipo: 'factura',
        documento: `${f.tipo_comprobante}-${f.numero_factura.toString().padStart(8, '0')}`,
        descripcion: `Factura ${f.tipo_comprobante}`,
        debe: f.total,
        haber: 0,
        saldo: f.total
      }))
      setCuentaCorriente(movimientos)

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar historial')
    } finally {
      setLoadingHistorial(false)
    }
  }

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientesList.filter(cliente => {
    if (!busqueda) return true
    const texto = `${cliente.nombre} ${cliente.apellido || ''} ${cliente.cuit || ''} ${cliente.email || ''}`.toLowerCase()
    return texto.includes(busqueda.toLowerCase())
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná tus clientes y consultá su historial</p>
        </div>
        <button
          onClick={handleCrear}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Cliente
        </button>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, CUIT o email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as 'all' | 'minorista' | 'mayorista')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="minorista">Minoristas</option>
            <option value="mayorista">Mayoristas</option>
          </select>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? '⏳' : '🔄'} Actualizar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && clientesList.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Cards de Clientes */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientesFiltrados.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hay clientes registrados. ¡Creá el primero!
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {cliente.nombre} {cliente.apellido || ''}
                    </h3>
                    <p className="text-sm text-gray-600">{cliente.condicion_iva}</p>
                    {cliente.cuit && <p className="text-xs text-gray-400">CUIT: {cliente.cuit}</p>}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    cliente.tipo_cliente === 'mayorista'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {cliente.tipo_cliente}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p>📞 {cliente.telefono || '-'}</p>
                  <p>✉️ {cliente.email || '-'}</p>
                  <p>📍 {cliente.ciudad || '-'}</p>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs rounded ${
                    cliente.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {cliente.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleVerHistorial(cliente)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    title="Ver historial y cuenta corriente"
                  >
                    <History size={14} />
                    Historial
                  </button>
                  <button
                    onClick={() => handleEditar(cliente)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(cliente.id, cliente.nombre)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal CRUD Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">
              {editandoId ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            <form onSubmit={handleGuardar} className="space-y-4">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={formData.apellido}
                    onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* CUIT y Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
                  <input
                    type="text"
                    value={formData.cuit}
                    onChange={(e) => setFormData({...formData, cuit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="20-12345678-9"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Teléfono y Ciudad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Condición IVA y Tipo Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA</label>
                  <select
                    value={formData.condicion_iva}
                    onChange={(e) => setFormData({...formData, condicion_iva: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Consumidor Final">Consumidor Final</option>
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Exento">Exento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Cliente</label>
                  <select
                    value={formData.tipo_cliente}
                    onChange={(e) => setFormData({...formData, tipo_cliente: e.target.value as 'minorista' | 'mayorista'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="minorista">Minorista</option>
                    <option value="mayorista">Mayorista</option>
                  </select>
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">Cliente Activo</label>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editandoId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial / Cuenta Corriente */}
      {showHistorial && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-bold">📋 Historial de {clienteSeleccionado.nombre}</h2>
                <p className="text-sm text-gray-500">CUIT: {clienteSeleccionado.cuit || '-'}</p>
              </div>
              <button
                onClick={() => setShowHistorial(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Resumen del Cliente */}
              {resumenCliente && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Facturas</p>
                    <p className="text-2xl font-bold text-blue-600">{resumenCliente.total_facturas}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total Comprado</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(resumenCliente.monto_total_comprado)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Notas de Crédito</p>
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(resumenCliente.total_notas_credito)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Saldo Cuenta Corriente</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(resumenCliente.monto_total_comprado)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pestañas */}
              <div className="border-b border-gray-200">
                <div className="flex gap-4">
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                    📄 Facturas
                  </button>
                  <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                    💰 Cuenta Corriente
                  </button>
                </div>
              </div>

              {/* Loading Historial */}
              {loadingHistorial && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}

              {/* Tabla de Facturas */}
              {!loadingHistorial && facturasHistorial.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Comprobante</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {facturasHistorial.map((factura) => (
                        <tr key={factura.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{formatDate(factura.fecha)}</td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {factura.tipo_comprobante}-{factura.numero_factura.toString().padStart(8, '0')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                              {factura.tipo_comprobante}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              factura.estado === 'emitida' ? 'bg-green-100 text-green-800' :
                              factura.estado === 'anulada' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {factura.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                            {formatCurrency(factura.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loadingHistorial && facturasHistorial.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Wallet size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No hay facturas registradas para este cliente</p>
                </div>
              )}

              {/* Cuenta Corriente (MOCK - implementar con backend) */}
              {!loadingHistorial && cuentaCorriente.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Cuenta Corriente
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <p>⚠️ <strong>Nota:</strong> La cuenta corriente completa requiere implementar los endpoints de pagos en el backend.</p>
                    <p className="mt-2">Por ahora se muestran las facturas como movimientos "Deben".</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setShowHistorial(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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