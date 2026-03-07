import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

const ROLES = [
  { id: 1, nombre: 'Admin', color: 'bg-green-100', icon: '👑' },
  { id: 2, nombre: 'Vendedor', color: 'bg-blue-100', icon: '📦' },
  { id: 3, nombre: 'Administrador', color: 'bg-purple-100', icon: '⚙️' },
]

// ✅ Formato compacto: una fila por módulo, todas las acciones juntas
const PERMISOS = [
  { modulo: 'FC Ventas', acciones: [
    { nombre: 'Crear/Ver', roles: [1, 2, 3] },
    { nombre: 'Editar', roles: [1] },
    { nombre: 'Crear NC', roles: [1, 3] },  // Nota de Crédito para correcciones
  ]},
  { modulo: 'Nota de Crédito', acciones: [
    { nombre: 'Ver', roles: [1, 2, 3] },
    { nombre: 'Crear/Anular', roles: [1] },
  ]},
  { modulo: 'FC Compras', acciones: [
    { nombre: 'Crear/Ver', roles: [1, 3] },
    { nombre: 'Editar', roles: [1] },
    { nombre: 'Crear NC', roles: [1, 3] },  // Nota de Crédito para correcciones
  ]},
  { modulo: 'Caja', acciones: [
    { nombre: 'Ver', roles: [1, 2, 3] },
    { nombre: 'Movimientos', roles: [1, 3] },
    { nombre: 'Cierre', roles: [1] },
  ]},
  { modulo: 'Clientes', acciones: [
    { nombre: 'ABM', roles: [1, 2, 3] },
  ]},
  { modulo: 'Productos', acciones: [
    { nombre: 'Ver', roles: [1, 2, 3] },
    { nombre: 'ABM/Stock/Precios', roles: [1, 3] },
  ]},
  { modulo: 'Proveedores', acciones: [
    { nombre: 'ABM', roles: [1, 3] },
  ]},
  { modulo: 'Pedidos', acciones: [
    { nombre: 'Ver', roles: [1, 2, 3] },
    { nombre: 'Crear/Enviar/Recibir/Cancelar', roles: [1, 3] },
  ]},
  { modulo: 'Recibos', acciones: [
    { nombre: 'Ver', roles: [1, 2, 3] },
    { nombre: 'Crear', roles: [1, 3] },
    { nombre: 'Anular', roles: [1] },
  ]},
  { modulo: 'Reportes', acciones: [
    { nombre: 'Ver', roles: [1, 2, 3] },
    { nombre: 'Exportar', roles: [1, 3] },
  ]},
  { modulo: 'Configuración', acciones: [
    { nombre: 'Editar', roles: [1] },
  ]},
  { modulo: 'Usuarios', acciones: [
    { nombre: 'ABM', roles: [1] },
  ]},
  { modulo: 'Backup', acciones: [
    { nombre: 'Exportar/Restaurar', roles: [1] },
  ]},
]

export const PermisosMatriz = () => {
  const { hasRole } = useAuth()
  const [moduloExpandido, setModuloExpandido] = useState<string | null>(null)

  if (!hasRole([1])) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 text-xl font-semibold">🔒 Solo Admin</div>
        <p className="text-gray-700 mt-2">
          Solo el Admin Total puede ver la matriz de permisos.
        </p>
      </div>
    )
  }

  return (
    // ✅ FONDO GRIS CLARO FIJO (no cambia con dark mode)
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          {/* 1. TÍTULO - Oscuro siempre */}
          <h2 className="text-2xl font-bold mb-2 text-gray-900">
            🔐 Permisos por Rol
          </h2>
          <p className="text-gray-600 mt-1">
            Vista rápida de qué puede hacer cada rol en el sistema.
          </p>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow"
        >
          📄 Imprimir
        </button>
      </div>

      {/* 2. TABLA - Fondo blanco, bordes grises oscuros */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-300">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 px-3 py-2 text-left w-1/3 text-gray-900 font-semibold">
                Módulo / Acción
              </th>
              {ROLES.map(rol => (
                <th 
                  key={rol.id} 
                  className={`border border-gray-400 px-3 py-2 text-center w-1/6 text-gray-900 font-semibold ${rol.color}`}
                >
                  <span className="text-lg">{rol.icon}</span> {rol.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISOS.map((item, idx) => (
              <tr 
                key={item.modulo}
                onClick={() => setModuloExpandido(moduloExpandido === item.modulo ? null : item.modulo)}
                className={`cursor-pointer transition-colors ${
                  idx % 2 === 0 
                    ? 'bg-white hover:bg-gray-50' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">▶</span>
                    {item.modulo}
                  </div>
                </td>
                {ROLES.map(rol => {
                  const tieneAlgunPermiso = item.acciones.some(acc => acc.roles.includes(rol.id))
                  const tieneTodos = item.acciones.every(acc => acc.roles.includes(rol.id))
                  
                  return (
                    <td key={rol.id} className="border border-gray-300 px-3 py-2 text-center">
                      {tieneTodos ? (
                        <span className="text-green-700 font-semibold">✅ Todo</span>
                      ) : tieneAlgunPermiso ? (
                        <span className="text-yellow-700">⚡ Parcial</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3. LEYENDA - Fondo gris claro, texto oscuro */}
      <div className="mt-4 flex gap-4 text-xs bg-gray-200 p-3 rounded-lg border border-gray-300">
        <div className="flex items-center gap-1">
          <span className="text-green-700 font-semibold">✅ Todo</span>
          <span className="text-gray-700">= Acceso completo al módulo</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-yellow-700 font-semibold">⚡ Parcial</span>
          <span className="text-gray-700">= Algunas acciones permitidas</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 font-semibold">—</span>
          <span className="text-gray-700">= Sin acceso</span>
        </div>
      </div>

      {/* 4. DETALLE EXPANDIDO - Fondo gris claro */}
      {moduloExpandido && (
        <div className="mt-4 bg-gray-200 rounded-lg p-4 border-2 border-gray-400 shadow">
          <h3 className="font-bold mb-3 text-gray-900 text-base">
            📋 Detalle: {moduloExpandido}
          </h3>
          <div className="space-y-2 text-sm">
            {PERMISOS.find(p => p.modulo === moduloExpandido)?.acciones.map(acc => (
              <div key={acc.nombre} className="flex justify-between items-center py-2 px-3 bg-white border border-gray-300 rounded">
                <span className="font-medium text-gray-900">{acc.nombre}</span>
                <div className="flex gap-2">
                  {acc.roles.includes(1) && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium border border-green-300">
                      👑 Admin
                    </span>
                  )}
                  {acc.roles.includes(2) && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium border border-blue-300">
                      📦 Vendedor
                    </span>
                  )}
                  {acc.roles.includes(3) && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium border border-purple-300">
                      ⚙️ Administrador
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TARJETAS DE ROLES - Fondo claro fijo, texto oscuro */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {/* Admin */}
        <div className="p-4 bg-green-50 border-2 border-green-400 rounded-lg shadow">
          <h3 className="font-bold text-green-900 text-base flex items-center gap-2">
            <span className="text-xl">👑</span> Admin (rol_id=1)
          </h3>
          <p className="text-sm text-green-800 mt-2 leading-relaxed">
            Dueño del negocio. Acceso total a todo el sistema, incluyendo anular facturas, 
            gestionar usuarios y backups.
          </p>
        </div>
        
        {/* Vendedor */}
        <div className="p-4 bg-blue-50 border-2 border-blue-400 rounded-lg shadow">
          <h3 className="font-bold text-blue-900 text-base flex items-center gap-2">
            <span className="text-xl">📦</span> Vendedor (rol_id=2)
          </h3>
          <p className="text-sm text-blue-800 mt-2 leading-relaxed">
            Solo facturar, ver clientes y reportes básicos. No puede anular documentos 
            ni editar precios.
          </p>
        </div>
        
        {/* Administrador */}
        <div className="p-4 bg-purple-50 border-2 border-purple-400 rounded-lg shadow">
          <h3 className="font-bold text-purple-900 text-base flex items-center gap-2">
            <span className="text-xl">⚙️</span> Administrador (rol_id=3)
          </h3>
          <p className="text-sm text-purple-800 mt-2 leading-relaxed">
            Gestión operativa: precios, caja, productos, pedidos. No puede anular facturas 
            ni gestionar usuarios.
          </p>
        </div>
      </div>

      {/* Estilo para impresión */}
      <style>{`
        @media print {
          .sidebar, header, button, .no-print { display: none !important; }
          body { background: white !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>
    </div>
  )
}
