// src/pages/Usuarios.tsx
// CRUD de Usuarios + UI Bolt + API Real

import { useState, useEffect } from 'react'
import { usuarios, type Usuario } from '../services/api'
import { Plus, Edit, Trash2, UserCheck, UserX, Shield, Search } from 'lucide-react'

// Usuario extendido con propiedades completas
interface UsuarioCompleto extends Usuario {
  rol: string  // nombre del rol (string: 'admin', 'vendedor', 'administrador')
  rol_id?: number  // ID del rol (número para el backend: 1, 2, 3)
  activo: boolean
}

// Rol con configuración visual
interface RolConfig {
  id: string
  nombre: string
  descripcion: string
  badgeClass: string
  rol_id: number  // ID numérico para el backend
}

const rolesConfig: Record<string, RolConfig> = {
  admin: {
    id: 'admin',
    nombre: 'Administrador',
    descripcion: 'Administrador total del sistema',
    badgeClass: 'bg-purple-100 text-purple-700',
    rol_id: 1
  },
  vendedor: {
    id: 'vendedor',
    nombre: 'Vendedor',
    descripcion: 'Solo ventas y consulta de precios',
    badgeClass: 'bg-green-100 text-green-700',
    rol_id: 2
  },
  administrador: {
    id: 'administrador',
    nombre: 'Administrador',
    descripcion: 'Gestión de precios y caja',
    badgeClass: 'bg-blue-100 text-blue-700',
    rol_id: 3
  },
}

export default function Usuarios() {
  // Estados principales
  const [usuariosList, setUsuariosList] = useState<UsuarioCompleto[]>([])
  const [usuarioActual, setUsuarioActual] = useState<UsuarioCompleto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Filtros
  const [filtroRol, setFiltroRol] = useState<string | 'all'>('all')
  const [busqueda, setBusqueda] = useState('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<UsuarioCompleto | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    nombre_completo: '',
    password: '',
    password_confirm: '',
    rol_id: 2 as number,  // vendedor por defecto
    activo: true
  })

  // Cargar datos
  useEffect(() => {
    cargarDatos()
    cargarUsuarioActual()
  }, [filtroRol])

  const cargarUsuarioActual = async () => {
    try {
      const response = await usuarios.me()
      if (!response.error) {
        setUsuarioActual(response.data as unknown as UsuarioCompleto)
      }
    } catch (err) {
      console.error('Error al cargar usuario actual:', err)
    }
  }

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const params = filtroRol !== 'all' ? { rol: filtroRol } : {}
      const response = await usuarios.getAll(params)

      if (response.error) throw new Error(response.error)
      setUsuariosList((response.data as unknown as UsuarioCompleto[]) || [])
      console.log('DEBUG [usuarios]:', response.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
      console.error('Usuarios error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Abrir modal para crear
  const handleCrear = () => {
    setEditingUsuario(null)
    setFormData({
      username: '',
      email: '',
      nombre_completo: '',
      password: '',
      password_confirm: '',
      rol_id: 2,  // vendedor por defecto
      activo: true
    })
    setShowModal(true)
  }

  // Abrir modal para editar
  const handleEditar = (usuario: UsuarioCompleto) => {
    setEditingUsuario(usuario)
    setFormData({
      username: usuario.username,
      email: usuario.email || '',
      nombre_completo: usuario.nombre_completo || '',
      password: '',
      password_confirm: '',
      rol_id: usuario.rol_id || rolesConfig[usuario.rol]?.rol_id || 2,
      activo: usuario.activo
    })
    setShowModal(true)
  }

  // Guardar (crear o editar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')

      // Validaciones
      if (!formData.username.trim() || !formData.email.trim() || !formData.nombre_completo.trim()) {
        setError('Todos los campos obligatorios deben estar completos')
        return
      }
      if (!editingUsuario && !formData.password) {
        setError('La contraseña es obligatoria para nuevos usuarios')
        return
      }
      if (formData.password && formData.password !== formData.password_confirm) {
        setError('Las contraseñas no coinciden')
        return
      }

      // Preparar payload
      const payload: Record<string, unknown> = {
        username: formData.username,
        email: formData.email,
        nombre_completo: formData.nombre_completo,
        rol_id: formData.rol_id,
        activo: formData.activo
      }
      if (!editingUsuario || formData.password) {
        payload.password = formData.password
      }

      let response
      if (editingUsuario) {
        console.log('DEBUG [update payload]:', payload)
        response = await usuarios.update(editingUsuario.id, payload)
      } else {
        console.log('DEBUG [create payload]:', payload)
        response = await usuarios.create(payload)
      }

      console.log('DEBUG [update response]:', response)

      if (response.error) {
        // Manejar error que puede ser string u objeto del backend
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : JSON.stringify(response.error)
        setError(errorMsg)
      } else {
        setSuccess(editingUsuario ? 'Usuario actualizado' : 'Usuario creado')
        setShowModal(false)
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  // Eliminar usuario (borrado físico con validación)
  const handleEliminar = async (id: number, username: string) => {
    if (!confirm(`¿Eliminar PERMANENTEMENTE el usuario "${username}"?\n\n⚠️ Esta acción no se puede deshacer.\n\nSi el usuario tiene ventas o movimientos de caja, se recomienda DESACTIVAR en su lugar.`)) return
    try {
      const response = await usuarios.delete(id)
      if (response.error) {
        // Manejar error que puede ser string u objeto del backend
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : JSON.stringify(response.error)
        setError(errorMsg)
      } else {
        setSuccess('Usuario eliminado permanentemente')
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // Toggle activo/inactivo (UI Bolt style - llama a API)
  const toggleActivo = async (usuario: UsuarioCompleto) => {
    try {
      // Optimistic update
      setUsuariosList(prev => prev.map(u => 
        u.id === usuario.id ? { ...u, activo: !u.activo } : u
      ))
      
      const response = await usuarios.update(usuario.id, { activo: !usuario.activo })
      if (response.error) {
        // Revert si falla
        setUsuariosList(prev => prev.map(u => 
          u.id === usuario.id ? { ...u, activo: usuario.activo } : u
        ))
        setError(response.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
      cargarDatos() // Recargar para sincronizar
    }
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuariosList.filter(usuario => {
    const matchRol = filtroRol === 'all' || usuario.rol === filtroRol
    const matchBusqueda = !busqueda || 
      `${usuario.nombre_completo} ${usuario.username} ${usuario.email}`.toLowerCase().includes(busqueda.toLowerCase())
    return matchRol && matchBusqueda
  })

  // Helper para badge de rol
  const getRolBadge = (rol: string) => {
    const config = rolesConfig[rol]
    return config 
      ? <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.badgeClass}`}>{config.nombre}</span>
      : <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{rol}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná usuarios, roles y permisos del sistema</p>
        </div>
        {usuarioActual?.rol_id === 1 && (
          <button
            onClick={handleCrear}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Info solo para admin */}
      {usuarioActual && usuarioActual.rol_id !== 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium">
            🔒 Vista de solo lectura
          </p>
          <p className="text-sm text-amber-700 mt-1">
            Solo el <strong>Administrador Total</strong> puede crear, editar o eliminar usuarios.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar usuario, email o nombre..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value === 'all' ? 'all' : e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
            <option value="administrador">Administrador (precios/caja)</option>
          </select>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              '🔄 Actualizar'
            )}
          </button>
        </div>
      </div>

      {/* Info de roles */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Shield size={18} />
          Roles Disponibles
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.values(rolesConfig).map(rol => (
            <span key={rol.id} className={`px-3 py-1 rounded-full text-xs font-medium ${rol.badgeClass}`}>
              {rol.nombre}
            </span>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && usuariosList.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tabla de Usuarios (UI Bolt) */}
      {!loading && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Rol</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Estado</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usuariosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                        No hay usuarios que coincidan con los filtros
                      </td>
                    </tr>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {usuario.nombre_completo}
                          <p className="text-xs text-gray-400">@{usuario.username}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{usuario.email}</td>
                        <td className="px-4 py-3 text-center">
                          {getRolBadge(usuario.rol)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {usuarioActual?.rol_id === 1 ? (
                            <button
                              onClick={() => toggleActivo(usuario)}
                              className={`flex items-center gap-1 mx-auto px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                usuario.activo
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                              title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                            >
                              {usuario.activo ? (
                                <>
                                  <UserCheck size={14} />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <UserX size={14} />
                                  Inactivo
                                </>
                              )}
                            </button>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              usuario.activo
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {usuario.activo ? (
                                <>
                                  <UserCheck size={12} />
                                  Activo
                                </>
                              ) : (
                                <>
                                  <UserX size={12} />
                                  Inactivo
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {usuarioActual?.rol_id === 1 && (
                              <button
                                onClick={() => handleEditar(usuario)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {usuario.id !== usuarioActual?.id && usuarioActual?.rol_id === 1 && (
                              <button
                                onClick={() => handleEliminar(usuario.id, usuario.username)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Eliminar"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear/Editar (UI Bolt + API) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleGuardar} className="space-y-4">
              {/* Nombre Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: Juan Pérez"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: jperez"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="juan@empresa.com"
                  required
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.rol_id}
                  onChange={(e) => setFormData({...formData, rol_id: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.values(rolesConfig).map(rol => (
                    <option key={rol.id} value={rol.rol_id}>{rol.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Contraseña */}
              {!editingUsuario || formData.password ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña {editingUsuario ? '(dejar vacío para no cambiar)' : '*'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Mínimo 6 caracteres"
                      required={!editingUsuario}
                    />
                  </div>
                  {formData.password && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmar Contraseña
                      </label>
                      <input
                        type="password"
                        value={formData.password_confirm}
                        onChange={(e) => setFormData({...formData, password_confirm: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Repetir contraseña"
                      />
                    </div>
                  )}
                </>
              ) : null}

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
                  {editingUsuario ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}