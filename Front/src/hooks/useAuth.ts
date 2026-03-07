import { useState, useEffect } from 'react'
import { auth, caja, isTokenExpired, removeToken } from '../services/api'

interface Usuario {
  id: number
  username: string
  nombre_completo: string
  email: string
  rol_id: number
}

interface CajaAbierta {
  id: number
  fecha: string
  fecha_apertura: string
  usuario_id: number
  usuario_nombre: string
  saldo_inicial: number
}

export const useAuth = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [cajasAbiertas, setCajasAbiertas] = useState<CajaAbierta[]>([])
  const [showExpiredToast, setShowExpiredToast] = useState(false)

  useEffect(() => {
    // ✅ Suscribirse al evento de expiración de auth
    const handleAuthExpired = () => {
      console.warn('⚠️ [useAuth] Sesión expirada detectada. Cerrando...')
      setShowExpiredToast(true)
      handleLogout()
    }

    window.addEventListener('auth-expired', handleAuthExpired)

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('access_token')
    const usuarioGuardado = sessionStorage.getItem('usuario')
    const cajasGuardadas = sessionStorage.getItem('cajas_abiertas_login')

    // ✅ Validar que no sea null, undefined, NI la string "undefined"
    const usuarioValido = usuarioGuardado &&
                          usuarioGuardado !== 'undefined' &&
                          usuarioGuardado !== 'null'

    // ✅ Verificar expiración del token al iniciar
    if (token && isTokenExpired()) {
      console.warn('⚠️ [useAuth] Token expirado al iniciar. Cerrando sesión...')
      handleLogout()
      return
    }

    if (token && usuarioValido) {
      try {
        setUsuario(JSON.parse(usuarioGuardado))
        setIsAuthenticated(true)
        // Cargar cajas abiertas detectadas en login
        if (cajasGuardadas && cajasGuardadas !== 'undefined') {
          setCajasAbiertas(JSON.parse(cajasGuardadas))
        }
      } catch (e) {
        console.warn('❌ [useAuth] Error parseando usuario:', e)
        // Limpiar dato corrupto
        sessionStorage.removeItem('usuario')
      }
    }
    setLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await auth.login(username, password)

      // ✅ Validar que response.data.usuario exista y sea objeto
      if (response?.data?.usuario && typeof response.data.usuario === 'object') {
        sessionStorage.setItem('access_token', response.data.access_token)
        sessionStorage.setItem('usuario', JSON.stringify(response.data.usuario))

        // ✅ Guardar cajas abiertas detectadas en login
        const cajasAbiertasDetectadas = response.data.cajas_abiertas || []
        console.log('🔍 [useAuth] Cajas abiertas recibidas del backend:', cajasAbiertasDetectadas)
        if (cajasAbiertasDetectadas.length > 0) {
          sessionStorage.setItem('cajas_abiertas_login', JSON.stringify(cajasAbiertasDetectadas))
          setCajasAbiertas(cajasAbiertasDetectadas)
          console.log('⚠️ [LOGIN] Se detectaron', cajasAbiertasDetectadas.length, 'caja(s) abierta(s)')
        } else {
          sessionStorage.removeItem('cajas_abiertas_login')
          setCajasAbiertas([])
        }

        setUsuario(response.data.usuario)
        setIsAuthenticated(true)
        return { success: true, cajas_abiertas: cajasAbiertasDetectadas }
      }

      console.warn('❌ [useAuth] usuario no válido en response:', response?.data?.usuario)
      return { success: false, error: 'Datos de usuario inválidos' }
    } catch (error: any) {
      console.error('❌ [useAuth] Error en login:', error)
      return { success: false, error: error?.message || 'Error de conexión' }
    }
  }

  // ✅ Logout completo
  const handleLogout = () => {
    try {
      auth.logout().catch(() => {})
    } catch (error) {
      console.warn('Logout backend falló, cerrando sesión en frontend')
    } finally {
      removeToken()  // ✅ Usa la función que limpia token + timestamp
      sessionStorage.removeItem('usuario')
      sessionStorage.removeItem('cajas_abiertas_login')
      setUsuario(null)
      setIsAuthenticated(false)
      setCajasAbiertas([])
    }
  }

  const logout = async () => {
    handleLogout()
  }

  // ✅ Limpiar cajas abiertas después de ser gestionadas
  const limpiarCajasAbiertas = () => {
    sessionStorage.removeItem('cajas_abiertas_login')
    setCajasAbiertas([])
  }

  // ✅ Registrar recuperación de caja
  const registrarRecuperacionCaja = async (cajaId: number, accion: 'continuar' | 'cerrar') => {
    try {
      await caja.registrarRecuperacion(cajaId, accion)
      console.log(`✅ [CAJA] Caja ${cajaId} registrada como recuperada - acción: ${accion}`)

      // Eliminar esta caja de la lista de abiertas
      const nuevasCajas = cajasAbiertas.filter(c => c.id !== cajaId)
      if (nuevasCajas.length === 0) {
        limpiarCajasAbiertas()
      } else {
        sessionStorage.setItem('cajas_abiertas_login', JSON.stringify(nuevasCajas))
        setCajasAbiertas(nuevasCajas)
      }

      return { success: true }
    } catch (error: any) {
      console.error('❌ [CAJA] Error al registrar recuperación:', error)
      return { success: false, error: error?.message || 'Error al registrar' }
    }
  }

  // ✅ ADMIN: Forzar cierre de caja de otro usuario
  const forzarCierreCaja = async (cajaId: number, motivo: string) => {
    try {
      await caja.forzarCierre(cajaId, motivo)
      console.log(`✅ [ADMIN] Caja ${cajaId} cerrada por administrador - motivo: ${motivo}`)

      // Eliminar esta caja de la lista de abiertas
      const nuevasCajas = cajasAbiertas.filter(c => c.id !== cajaId)
      if (nuevasCajas.length === 0) {
        limpiarCajasAbiertas()
      } else {
        sessionStorage.setItem('cajas_abiertas_login', JSON.stringify(nuevasCajas))
        setCajasAbiertas(nuevasCajas)
      }

      return { success: true }
    } catch (error: any) {
      console.error('❌ [ADMIN] Error al forzar cierre:', error)
      return { success: false, error: error?.message || 'Error al forzar cierre' }
    }
  }

  // ✅ Verificar rol (Admin siempre puede)
  const hasRole = (allowedRoles: number[]): boolean => {
    if (!usuario?.rol_id) return false
    if (usuario.rol_id === 1) return true  // Admin bypass
    return allowedRoles.includes(usuario.rol_id)
  }

  // ✅ Verificar permiso específico
  const hasPermiso = (modulo: string, accion: string): boolean => {
    if (!usuario?.rol_id) return false
    if (usuario.rol_id === 1) return true  // Admin bypass

    // Configuración de permisos (debe coincidir con backend)
    const permisosConfig: Record<string, number[]> = {
      'fc_venta:crear': [1, 2, 3],
      'fc_venta:anular': [1],
      'fc_venta:ver': [1, 2, 3],
      'nota_credito:crear': [1],
      'nota_credito:ver': [1, 2, 3],
      'caja:movimiento': [1, 3],
      'caja:ver': [1, 2, 3],
      'configuracion:editar': [1],
      'usuarios:gestionar': [1],
    }

    const clave = `${modulo}:${accion}`
    const rolesPermitidos = permisosConfig[clave] || []
    return rolesPermitidos.includes(usuario.rol_id)
  }

  return {
    usuario,
    isAuthenticated,
    loading,
    cajasAbiertas,
    login,
    logout,
    limpiarCajasAbiertas,
    registrarRecuperacionCaja,
    forzarCierreCaja,
    hasRole,
    hasPermiso
  }
}
