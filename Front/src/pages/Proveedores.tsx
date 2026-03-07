// src/pages/Proveedores.tsx
// CRUD de Proveedores + UI Bolt + API Real

import { useState, useEffect } from 'react'
import { proveedores, Proveedor } from '../services/api'
import { formatCurrency, formatDate } from '../utils/format'
import { Plus, Upload, FileText, TrendingDown, Edit, Trash2 } from 'lucide-react'

// Interfaces tipadas
interface ProveedorCompleto extends Proveedor {
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  cuit?: string
  activo: boolean
  documentos?: Array<{ id: number; nombre: string; fecha: string }>
}

interface ProductoComparacion {
  id: number
  nombre: string
  costo: number
  precioProveedor2: number
  precioProveedor3: number
}

export default function Proveedores() {
  // Estados principales
  const [proveedoresList, setProveedoresList] = useState<ProveedorCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    cuit: '',
    activo: true
  })

  // Comparador de precios (mock por ahora)
  const [productosComparacion] = useState<ProductoComparacion[]>([
    { id: 1, nombre: 'Producto A', costo: 100, precioProveedor2: 105, precioProveedor3: 95 },
    { id: 2, nombre: 'Producto B', costo: 200, precioProveedor2: 210, precioProveedor3: 190 },
    { id: 3, nombre: 'Producto C', costo: 150, precioProveedor2: 155, precioProveedor3: 145 },
    { id: 4, nombre: 'Producto D', costo: 300, precioProveedor2: 315, precioProveedor3: 285 },
    { id: 5, nombre: 'Producto E', costo: 250, precioProveedor2: 260, precioProveedor3: 240 },
  ])

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const response = await proveedores.getAll()
      if (response.error) throw new Error(response.error)
      setProveedoresList((response.data as ProveedorCompleto[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal (crear o editar)
  const handleAbrirModal = (proveedor?: ProveedorCompleto) => {
    if (proveedor) {
      setEditandoId(proveedor.id)
      setFormData({
        nombre: proveedor.nombre,
        contacto: proveedor.contacto || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        direccion: proveedor.direccion || '',
        cuit: proveedor.cuit || '',
        activo: proveedor.activo
      })
    } else {
      setEditandoId(null)
      setFormData({
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
        cuit: '',
        activo: true
      })
    }
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
        response = await proveedores.update(editandoId, formData)
      } else {
        response = await proveedores.create(formData)
      }

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(editandoId ? 'Proveedor actualizado' : 'Proveedor creado')
        setShowModal(false)
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  // Eliminar proveedor
  const handleEliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      const response = await proveedores.delete(id)
      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Proveedor eliminado')
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Subir documento (placeholder)
  const handleSubirDocumento = (proveedorId: number) => {
    alert(`📄 Subir documento para proveedor ID: ${proveedorId}\n\n(Se implementará en próxima versión)`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Proveedores</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná tus proveedores y compará precios</p>
        </div>
        <button
          onClick={() => handleAbrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Loading */}
      {loading && proveedoresList.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Cards de Proveedores */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {proveedoresList.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No hay proveedores registrados. ¡Creá el primero!
            </div>
          ) : (
            proveedoresList.map((proveedor) => (
              <div key={proveedor.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{proveedor.nombre}</h3>
                    <p className="text-sm text-gray-600">{proveedor.contacto || 'Sin contacto'}</p>
                    {proveedor.cuit && <p className="text-xs text-gray-400">CUIT: {proveedor.cuit}</p>}
                  </div>
                  <span className={`px-3 py-1 text-sm rounded ${
                    proveedor.activo 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {proveedor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">📞 Teléfono:</span> {proveedor.telefono || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">✉️ Email:</span> {proveedor.email || '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">📍 Dirección:</span> {proveedor.direccion || '-'}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">📄 Documentos</h4>
                    <button 
                      onClick={() => handleSubirDocumento(proveedor.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <Upload size={16} />
                      Subir PDF
                    </button>
                  </div>
                  {(!proveedor.documentos || proveedor.documentos.length === 0) ? (
                    <p className="text-sm text-gray-500">No hay documentos</p>
                  ) : (
                    <div className="space-y-2">
                      {proveedor.documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-600" />
                            <span className="text-sm">{doc.nombre}</span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(doc.fecha)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => handleAbrirModal(proveedor)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(proveedor.id, proveedor.nombre)}
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

      {/* Comparador de Precios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Comparador de Precios</h2>
        <p className="text-sm text-gray-500 mb-4">Compará precios entre tus principales proveedores</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Proveedor 1</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Proveedor 2</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Proveedor 3</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Mejor Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productosComparacion.map((producto) => {
                const precios = [producto.costo, producto.precioProveedor2, producto.precioProveedor3]
                const menorPrecio = Math.min(...precios)

                return (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{producto.nombre}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatCurrency(producto.costo)}
                        {producto.costo === menorPrecio && <TrendingDown className="text-green-600" size={16} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatCurrency(producto.precioProveedor2)}
                        {producto.precioProveedor2 === menorPrecio && <TrendingDown className="text-green-600" size={16} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        {formatCurrency(producto.precioProveedor3)}
                        {producto.precioProveedor3 === menorPrecio && <TrendingDown className="text-green-600" size={16} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        {formatCurrency(menorPrecio)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editandoId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            <form onSubmit={handleGuardar} className="space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                <input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">Proveedor Activo</label>
              </div>
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
    </div>
  )
}