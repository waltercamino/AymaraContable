// src/pages/ClientesProveedores.tsx
// CRUD Unificado de Clientes y Proveedores

import { useState, useEffect } from 'react'
import { clientes, proveedores, Cliente, Proveedor } from '../services/api'
import { formatCurrency } from '../utils/format'
import { validarCUIT, formatearCUIT } from '../utils/validaciones'
import { Plus, Edit, Trash2, Users, Building2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { Spinner } from '../components/Spinner'

// Tipos
interface ClienteCompleto extends Cliente {
  id: number
}

interface ProveedorCompleto extends Proveedor {
  id: number
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  cuit?: string
  activo: boolean
}

type TabActiva = 'clientes' | 'proveedores'

export default function ClientesProveedores() {
  // Tab activa
  const [tabActiva, setTabActiva] = useState<TabActiva>('clientes')

  // Estados principales
  const [clientesList, setClientesList] = useState<ClienteCompleto[]>([])
  const [proveedoresList, setProveedoresList] = useState<ProveedorCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<'all' | 'minorista' | 'mayorista'>('all')

  // Modal CRUD
  const [showModal, setShowModal] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  
  // Formulario para clientes
  const [formDataCliente, setFormDataCliente] = useState({
    nombre: '',  // Single field: "Juan Perez" o "Razón Social S.A."
    cuit: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: '',
    condicion_iva: 'consumidor_final' as 'consumidor_final' | 'responsable_inscripto' | 'monotributista' | 'exento',
    tipo_cliente: 'minorista' as 'minorista' | 'mayorista'
  })

  // Formulario para proveedores
  const [formDataProveedor, setFormDataProveedor] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    cuit: '',
    condicion_iva: 'responsable_inscripto' as 'consumidor_final' | 'responsable_inscripto' | 'monotributista' | 'exento'
  })

  const [loadingGuardar, setLoadingGuardar] = useState(false)
  const [errorCUIT, setErrorCUIT] = useState('')
  const [errorCUITProveedor, setErrorCUITProveedor] = useState('')

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [tabActiva])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      if (tabActiva === 'clientes') {
        const response = await clientes.getAll()
        if (response.error) throw new Error(response.error)
        setClientesList((response.data as ClienteCompleto[]) || [])
      } else {
        const response = await proveedores.getAll()
        if (response.error) throw new Error(response.error)
        setProveedoresList((response.data as ProveedorCompleto[]) || [])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal (crear o editar)
  const handleAbrirModal = (item?: ClienteCompleto | ProveedorCompleto) => {
    if (tabActiva === 'clientes') {
      if (item) {
        const cliente = item as ClienteCompleto
        setEditandoId(cliente.id)
        setFormDataCliente({
          nombre: cliente.nombre,
          cuit: cliente.cuit || '',
          email: cliente.email || '',
          telefono: cliente.telefono || '',
          direccion: cliente.direccion || '',
          ciudad: cliente.ciudad || '',
          codigo_postal: cliente.codigo_postal || '',
          condicion_iva: cliente.condicion_iva as any || 'consumidor_final',
          tipo_cliente: cliente.tipo_cliente || 'minorista'
        })
        setErrorCUIT('')
      } else {
        setEditandoId(null)
        setFormDataCliente({
          nombre: '',
          cuit: '',
          email: '',
          telefono: '',
          direccion: '',
          ciudad: '',
          codigo_postal: '',
          condicion_iva: 'consumidor_final',
          tipo_cliente: 'minorista'
        })
        setErrorCUIT('')
      }
    } else {
      if (item) {
        const proveedor = item as ProveedorCompleto
        setEditandoId(proveedor.id)
        setFormDataProveedor({
          nombre: proveedor.nombre,
          contacto: proveedor.contacto || '',
          telefono: proveedor.telefono || '',
          email: proveedor.email || '',
          direccion: proveedor.direccion || '',
          cuit: proveedor.cuit || '',
          condicion_iva: (proveedor as any).condicion_iva || 'responsable_inscripto'
        })
        setErrorCUITProveedor('')
      } else {
        setEditandoId(null)
        setFormDataProveedor({
          nombre: '',
          contacto: '',
          telefono: '',
          email: '',
          direccion: '',
          cuit: '',
          condicion_iva: 'responsable_inscripto'
        })
      }
    }
    setShowModal(true)
  }

  // Guardar (crear o editar)
  const handleGuardar = async () => {
    if (tabActiva === 'clientes') {
      if (!formDataCliente.nombre.trim()) {
        toast.error('El nombre es obligatorio')
        return
      }

      // Validar CUIT si está completo
      if (formDataCliente.cuit.trim()) {
        const validacion = validarCUIT(formDataCliente.cuit)
        if (!validacion.valido) {
          setErrorCUIT(validacion.mensaje!)
          toast.error(validacion.mensaje)
          return
        }
      }

      setLoadingGuardar(true)
      try {
        const payload = {
          ...formDataCliente,
          condicion_iva: formDataCliente.condicion_iva.toLowerCase()
        }

        const response = editandoId
          ? await clientes.update(editandoId, payload)
          : await clientes.create(payload)

        if (response.error) {
          const errorMsg = typeof response.error === 'string'
            ? response.error
            : JSON.stringify(response.error)
          toast.error(errorMsg)
        } else {
          toast.success(editandoId ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente')
          setShowModal(false)
          cargarDatos()
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar cliente')
      } finally {
        setLoadingGuardar(false)
      }
    } else {
      if (!formDataProveedor.nombre.trim()) {
        toast.error('El nombre es obligatorio')
        return
      }

      // Validar CUIT si está completo
      if (formDataProveedor.cuit.trim()) {
        const validacion = validarCUIT(formDataProveedor.cuit)
        if (!validacion.valido) {
          setErrorCUITProveedor(validacion.mensaje!)
          toast.error(validacion.mensaje)
          return
        }
      }

      setLoadingGuardar(true)
      try {
        const payload = {
          ...formDataProveedor,
          condicion_iva: formDataProveedor.condicion_iva.toLowerCase()
        }

        const response = editandoId
          ? await proveedores.update(editandoId, payload)
          : await proveedores.create(payload)

        if (response.error) {
          const errorMsg = typeof response.error === 'string'
            ? response.error
            : JSON.stringify(response.error)
          toast.error(errorMsg)
        } else {
          toast.success(editandoId ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente')
          setShowModal(false)
          cargarDatos()
        }
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar proveedor')
      } finally {
        setLoadingGuardar(false)
      }
    }
  }

  // Eliminar
  const handleEliminar = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Eliminar ${tabActiva === 'clientes' ? 'cliente' : 'proveedor'} "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
      return
    }

    try {
      const response = tabActiva === 'clientes'
        ? await clientes.delete(id)
        : await proveedores.delete(id)

      if (response.error) {
        const errorMsg = typeof response.error === 'string'
          ? response.error
          : JSON.stringify(response.error)
        toast.error(errorMsg)
      } else {
        toast.success(`${tabActiva === 'clientes' ? 'Cliente' : 'Proveedor'} eliminado correctamente`)
        cargarDatos()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Filtrar lista
  const listaFiltrada = tabActiva === 'clientes'
    ? clientesList.filter(cliente => {
        const matchBusqueda = !busqueda ||
          cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          cliente.cuit?.includes(busqueda) ||
          cliente.apellido?.toLowerCase().includes(busqueda.toLowerCase())
        
        const matchTipo = filtroTipo === 'all' || cliente.tipo_cliente === filtroTipo
        
        return matchBusqueda && matchTipo
      })
    : proveedoresList.filter(proveedor => {
        const matchBusqueda = !busqueda ||
          proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          proveedor.cuit?.includes(busqueda)
        
        return matchBusqueda
      })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes y Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión unificada de clientes y proveedores</p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          {tabActiva === 'clientes' ? 'Nuevo Cliente' : 'Nuevo Proveedor'}
        </button>
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
          onClick={() => { setTabActiva('clientes'); setBusqueda(''); setFiltroTipo('all') }}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            tabActiva === 'clientes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={18} />
          Clientes
        </button>
        <button
          onClick={() => { setTabActiva('proveedores'); setBusqueda('') }}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            tabActiva === 'proveedores'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building2 size={18} />
          Proveedores
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder={`🔍 Buscar ${tabActiva === 'clientes' ? 'cliente' : 'proveedor'} por nombre...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {tabActiva === 'clientes' && (
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as 'all' | 'minorista' | 'mayorista')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los tipos</option>
              <option value="minorista">Minoristas</option>
              <option value="mayorista">Mayoristas</option>
            </select>
          )}

          <button
            onClick={() => { setBusqueda(''); setFiltroTipo('all') }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            🔄 Limpiar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tabla */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                {tabActiva === 'clientes' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CUIT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={tabActiva === 'clientes' ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                    No hay {tabActiva === 'clientes' ? 'clientes' : 'proveedores'} registrados
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item.nombre}
                    </td>
                    {tabActiva === 'clientes' && (
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (item as ClienteCompleto).tipo_cliente === 'mayorista'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(item as ClienteCompleto).tipo_cliente === 'mayorista' ? 'Ⓜ️ Mayorista' : 'Minorista'}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.cuit || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(item as any).email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(item as any).telefono || '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleAbrirModal(item)}
                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                        title="Editar"
                      >
                        <Edit size={16} />
                        <span className="text-xs">Editar</span>
                      </button>
                      <button
                        onClick={() => handleEliminar(item.id, item.nombre)}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                        <span className="text-xs">Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal CRUD */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editandoId ? '✏️ Editar' : '➕ Nuevo'} {tabActiva === 'clientes' ? 'Cliente' : 'Proveedor'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {tabActiva === 'clientes' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre / Razón Social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formDataCliente.nombre}
                      onChange={(e) => setFormDataCliente({...formDataCliente, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej: Juan Perez o Razón Social S.A."
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIT
                      </label>
                      <input
                        type="text"
                        value={formDataCliente.cuit}
                        onChange={(e) => {
                          const valor = e.target.value
                          const formateado = formatearCUIT(valor)
                          setFormDataCliente({...formDataCliente, cuit: formateado})
                          const validacion = validarCUIT(formateado)
                          if (!validacion.valido) {
                            setErrorCUIT(validacion.mensaje!)
                          } else {
                            setErrorCUIT('')
                          }
                        }}
                        onBlur={(e) => {
                          const validacion = validarCUIT(e.target.value)
                          if (!validacion.valido) {
                            setErrorCUIT(validacion.mensaje!)
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errorCUIT ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="20-12345678-9"
                        maxLength={13}
                      />
                      {errorCUIT && (
                        <p className="text-red-500 text-sm mt-1">⚠️ {errorCUIT}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        Formato: XX-XXXXXXXX-X | 99-99999999-9 (consumidor final)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formDataCliente.email}
                        onChange={(e) => setFormDataCliente({...formDataCliente, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formDataCliente.telefono}
                        onChange={(e) => setFormDataCliente({...formDataCliente, telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condición IVA
                      </label>
                      <select
                        value={formDataCliente.condicion_iva}
                        onChange={(e) => setFormDataCliente({...formDataCliente, condicion_iva: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="consumidor_final">Consumidor Final</option>
                        <option value="responsable_inscripto">Responsable Inscripto</option>
                        <option value="monotributista">Monotributista</option>
                        <option value="exento">Exento</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Cliente
                      </label>
                      <select
                        value={formDataCliente.tipo_cliente}
                        onChange={(e) => setFormDataCliente({...formDataCliente, tipo_cliente: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="minorista">Minorista</option>
                        <option value="mayorista">Mayorista</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formDataCliente.direccion}
                      onChange={(e) => setFormDataCliente({...formDataCliente, direccion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        value={formDataCliente.ciudad}
                        onChange={(e) => setFormDataCliente({...formDataCliente, ciudad: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        value={formDataCliente.codigo_postal}
                        onChange={(e) => setFormDataCliente({...formDataCliente, codigo_postal: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre / Razón Social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formDataProveedor.nombre}
                      onChange={(e) => setFormDataProveedor({...formDataProveedor, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contacto
                      </label>
                      <input
                        type="text"
                        value={formDataProveedor.contacto}
                        onChange={(e) => setFormDataProveedor({...formDataProveedor, contacto: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIT
                      </label>
                      <input
                        type="text"
                        value={formDataProveedor.cuit}
                        onChange={(e) => {
                          const valor = e.target.value
                          const formateado = formatearCUIT(valor)
                          setFormDataProveedor({...formDataProveedor, cuit: formateado})
                          const validacion = validarCUIT(formateado)
                          if (!validacion.valido) {
                            setErrorCUITProveedor(validacion.mensaje!)
                          } else {
                            setErrorCUITProveedor('')
                          }
                        }}
                        onBlur={(e) => {
                          const validacion = validarCUIT(e.target.value)
                          if (!validacion.valido && e.target.value.trim() !== '') {
                            setErrorCUITProveedor(validacion.mensaje!)
                          } else {
                            setErrorCUITProveedor('')
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errorCUITProveedor ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="20-12345678-9"
                        maxLength={13}
                      />
                      {errorCUITProveedor && (
                        <p className="text-red-500 text-sm mt-1">⚠️ {errorCUITProveedor}</p>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        Formato: XX-XXXXXXXX-X | 99-99999999-9 (consumidor final)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formDataProveedor.email}
                        onChange={(e) => setFormDataProveedor({...formDataProveedor, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        value={formDataProveedor.telefono}
                        onChange={(e) => setFormDataProveedor({...formDataProveedor, telefono: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formDataProveedor.direccion}
                      onChange={(e) => setFormDataProveedor({...formDataProveedor, direccion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condición IVA
                      </label>
                      <select
                        value={formDataProveedor.condicion_iva}
                        onChange={(e) => setFormDataProveedor({...formDataProveedor, condicion_iva: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="consumidor_final">Consumidor Final</option>
                        <option value="responsable_inscripto">Responsable Inscripto</option>
                        <option value="monotributista">Monotributista</option>
                        <option value="exento">Exento</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t pt-4 px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loadingGuardar}
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={loadingGuardar || (tabActiva === 'clientes' ? !formDataCliente.nombre.trim() : !formDataProveedor.nombre.trim())}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingGuardar && <Spinner size="sm" color="white" />}
                {loadingGuardar ? 'Guardando...' : '✅ Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
