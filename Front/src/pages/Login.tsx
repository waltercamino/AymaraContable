// src/pages/Login.tsx
import { useState, FormEvent, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface CajaAbierta {
  id: number
  fecha: string
  fecha_apertura: string
  usuario_id: number
  usuario_nombre: string
  saldo_inicial: number
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { login, cajasAbiertas: cajasDelAuth, registrarRecuperacionCaja, limpiarCajasAbiertas } = useAuth()

  // ✅ Usar cajasDelAuth directamente (sin estado local duplicado)
  const cajasAbiertas = cajasDelAuth
  const showCajasModal = cajasAbiertas.length > 0

  // Obtener ruta de redirección (si viene de una página protegida)
  const from = (location.state as { from?: string })?.from || '/dashboard'

  // ✅ Log cuando cambian las cajas abiertas
  useEffect(() => {
    console.log('🔍 [Login.tsx] cajasDelAuth:', cajasDelAuth, 'showCajasModal:', showCajasModal)
  }, [cajasDelAuth, showCajasModal])

  // 🔍 TEST: Forzar cajas abiertas para debugging (remover después)
  const testForzarCajas = () => {
    const cajasTest: CajaAbierta[] = [{
      id: 1,
      fecha: '2026-03-06',
      fecha_apertura: new Date().toISOString(),
      usuario_id: 1,
      usuario_nombre: 'Test',
      saldo_inicial: 1000
    }]
    console.log('🔍 [TEST] Forzando cajas abiertas:', cajasTest)
    // Guardar en sessionStorage para que useAuth lo lea
    sessionStorage.setItem('cajas_abiertas_login', JSON.stringify(cajasTest))
    window.location.reload()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validación básica
    if (!username.trim() || !password.trim()) {
      setError('Por favor completá usuario y contraseña')
      setLoading(false)
      return
    }

    try {
      const result = await login(username, password)

      if (result.success) {
        const tokenGuardado = sessionStorage.getItem('access_token')
        const usuarioGuardado = sessionStorage.getItem('usuario')
        const cajasGuardadas = sessionStorage.getItem('cajas_abiertas_login')

        console.log('✅ [Login] Token guardado:', tokenGuardado ? 'SÍ ✅' : 'NO ❌')
        console.log('✅ [Login] Usuario guardado:', usuarioGuardado && usuarioGuardado !== 'undefined' ? 'SÍ ✅' : 'NO ❌')
        console.log('✅ [Login] Cajas guardadas:', cajasGuardadas ? cajasGuardadas : 'NINGUNA')
        console.log('✅ [Login] result.cajas_abiertas:', result.cajas_abiertas)

        // ✅ Si hay cajas abiertas, el modal se mostrará vía useEffect
        // Si no, redirigir directamente
        if (!result.cajas_abiertas || result.cajas_abiertas.length === 0) {
          console.log('🔍 [Login] Sin cajas abiertas - redirigiendo al dashboard')
          navigate(from, { replace: true })
        } else {
          console.log('🔍 [Login] Con cajas abiertas - esperando useEffect muestre el modal')
        }
      } else {
        setError(result.error || 'Error de autenticación')
      }
    } catch (err: any) {
      setError(err?.message || 'Error de conexión con el servidor')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Manejar acción del modal
  const handleAccionCaja = async (cajaId: number, accion: 'continuar' | 'cerrar' | 'mas_tarde') => {
    if (accion === 'mas_tarde') {
      // Mantener cajas en sessionStorage para mostrar alerta en Header
      // Las cajas se mantienen en useAuth, el modal se oculta porque ya no estamos en Login
      navigate(from, { replace: true })
      return
    }

    try {
      await registrarRecuperacionCaja(cajaId, accion)

      // Redirigir según acción
      if (accion === 'continuar') {
        // Ir directamente a la página de Caja
        navigate('/caja', { replace: true })
      } else if (accion === 'cerrar') {
        // Ir a cierre de caja (misma página de Caja, pero se puede mostrar el modal de cierre)
        navigate('/caja', { replace: true })
      }

      // limpiarCajasAbiertas() se llama dentro de registrarRecuperacionCaja via useAuth
    } catch (error: any) {
      console.error('Error al registrar recuperación:', error)
    }
  }

  // ✅ Formatear fecha de apertura
  const formatearFechaApertura = (fechaIso: string) => {
    const fecha = new Date(fechaIso)
    return fecha.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // ✅ Calcular tiempo transcurrido desde apertura
  const calcularTiempoTranscurrido = (fechaAperturaIso: string) => {
    const apertura = new Date(fechaAperturaIso)
    const ahora = new Date()
    const diffMs = ahora.getTime() - apertura.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} día(s) y ${diffHours % 24} hora(s)`
    } else if (diffHours > 0) {
      return `${diffHours} hora(s) y ${diffMins % 60} minuto(s)`
    } else {
      return `${diffMins} minuto(s)`
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Aymara Contable
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresá tus credenciales para continuar
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="admin"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent
                     rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2
                     focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Conectando...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>

          {/* 🔍 TEST BUTTON: Remove after debugging */}
          <button
            type="button"
            onClick={testForzarCajas}
            className="w-full py-2 px-4 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 text-xs font-medium rounded transition-colors"
          >
            🧪 TEST: Forzar caja abierta (debug)
          </button>
        </form>

        <div className="text-center text-xs text-gray-500">
          <p>Sistema de Gestión Comercial - Aymara Contable</p>
          <p className="mt-1">Versión 1.0.0</p>
        </div>
      </div>

      {/* 🔍 MODAL: Cajas Abiertas por Cierre Inesperado */}
      {showCajasModal && cajasAbiertas.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Header con advertencia */}
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-bold text-yellow-900">
                    Caja(s) Abierta(s) Detectada(s)
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Se detectó un cierre inesperado del sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Mensaje principal con cantidad y tiempo */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-gray-800 font-bold text-lg">
                  ⚠️ Tenés {cajasAbiertas.length} caja(s) abierta(s)
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Desde {formatearFechaApertura(cajasAbiertas[0].fecha_apertura)} ({calcularTiempoTranscurrido(cajasAbiertas[0].fecha_apertura)})
                </p>
              </div>

              {/* Lista de cajas (mostrar solo la primera para acción) */}
              {cajasAbiertas.slice(0, 1).map((caja, index) => (
                <div key={caja.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">
                        Caja #{caja.id} - {caja.fecha}
                      </p>
                      <p className="text-sm text-gray-600">
                        Usuario: <span className="font-medium">{caja.usuario_nombre}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Saldo inicial: <span className="font-medium">${caja.saldo_inicial.toFixed(2)}</span>
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded">
                      ABIERTA
                    </span>
                  </div>
                </div>
              ))}

              {cajasAbiertas.length > 1 && (
                <p className="text-sm text-gray-500 italic mb-4">
                  + {cajasAbiertas.length - 1} caja(s) más. Se gestionarán una por una.
                </p>
              )}

              {/* Opciones de acción */}
              <div className="space-y-3 mt-6">
                <p className="text-sm font-medium text-gray-700 mb-2">¿Qué deseás hacer?</p>

                <button
                  onClick={() => handleAccionCaja(cajasAbiertas[0].id, 'continuar')}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  🔄 Continuar turno
                </button>

                <button
                  onClick={() => handleAccionCaja(cajasAbiertas[0].id, 'cerrar')}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  🛑 Cerrar con arqueo
                </button>

                <button
                  onClick={() => handleAccionCaja(cajasAbiertas[0].id, 'mas_tarde')}
                  className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                >
                  ⏰ Ver más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}