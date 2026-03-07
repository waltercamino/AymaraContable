// src/components/Layout/Layout.tsx
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

export default function Layout() {
  const location = useLocation()
  const { logout, usuario, isAuthenticated, loading } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ✅ Escuchar evento de expiración de auth para mostrar toast
  useEffect(() => {
    const handleAuthExpired = () => {
      toast.warning('⚠️ Sesión expirada. Volvé a loguearte.', {
        autoClose: 5000,
        type: 'warning',
        position: 'top-center'
      })
    }

    window.addEventListener('auth-expired', handleAuthExpired)

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  // Mostrar loading mientras se verifica la sesión
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Verificar autenticación
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar fixed */}
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar onCollapsedChange={setSidebarCollapsed} />
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        <Header onLogout={logout} usuario={usuario} />

        <main
          className={`pt-16 p-6 transition-all duration-300 ${
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}