import { useState, useRef, useEffect } from 'react'
import { toast } from 'react-toastify'
import { api, caja } from '../services/api'
import { useAuth } from '../hooks/useAuth'

const Backup = () => {
  const { hasRole } = useAuth()
  const [loading, setLoading] = useState(false)
  const [cajasAbiertas, setCajasAbiertas] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ✅ Verificar cajas abiertas al cargar
  useEffect(() => {
    const verificarCajas = async () => {
      try {
        // ✅ FIX: Usar caja.getHistorial() que devuelve JSON (no api.get que es para blobs)
        const response = await caja.getHistorial({ estado: 'abierto' })
        const cajas = response.data || []
        console.log('🔍 [BACKUP] Cajas abiertas encontradas:', cajas.length, cajas)
        setCajasAbiertas(cajas.length)
      } catch (error) {
        console.error('No se pudo verificar el estado de cajas:', error)
        setCajasAbiertas(null)  // Si falla, no bloquear
      }
    }
    verificarCajas()
  }, [])

  const handleExportar = async () => {
    // ✅ Verificar cajas abiertas antes de intentar
    if (cajasAbiertas !== null && cajasAbiertas > 0) {
      toast.warning(
        `⚠️ Hay ${cajasAbiertas} caja(s) abierta(s)\n\nCierre todas las cajas antes de exportar un backup.`,
        { autoClose: 8000 }
      )
      return
    }

    // ✅ Confirmación antes de exportar
    const confirmacion = window.confirm(
      '¿Exportar backup completo de la base de datos?\n\n' +
      'Se descargará un archivo .sql con TODOS los datos del sistema.\n\n' +
      'Asegúrese de que:\n' +
      '• Todas las cajas estén cerradas\n' +
      '• Todos los movimientos del día estén confirmados'
    )
    
    if (!confirmacion) return

    setLoading(true)
    console.log('🔍 [Backup] Iniciando exportación...')

    try {
      const blob = await api.get('/backup/exportar')

      console.log('✅ [Backup] Blob recibido:', {
        type: blob.type,
        size: blob.size
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const fecha = new Date().toISOString().slice(0,10).replace(/-/g,'')
      link.download = `aymara_backup_${fecha}.sql`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      console.log('✅ [Backup] Descarga completada')

      toast.success('✅ Backup exportado exitosamente')

    } catch (error: any) {
      console.log('❌ [Backup] Error detallado:', {
        message: error?.message,
        name: error?.name,
        detail: error?.response?.data?.detail
      })

      // ✅ Verificar si es error de cajas abiertas (validación del backend)
      const detail = error?.response?.data?.detail

      if (detail?.error?.includes('cajas abiertas')) {
        toast.warning(
          `⚠️ ${detail.mensaje}\n\nCajas abiertas: ${detail.cajas_abiertas.join(', ')}`,
          { autoClose: 8000 }
        )
      } else if (typeof detail === 'string') {
        toast.error(`❌ ${detail}`)
      } else {
        toast.error('❌ Error al exportar backup')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRestaurar = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      toast.error('❌ Seleccione un archivo .sql primero')
      return
    }

    if (!file.name.endsWith('.sql')) {
      toast.error('❌ Solo se permiten archivos .sql')
      return
    }

    // ✅ CONFIRMACIÓN CON INFORMACIÓN DE AUTO-BACKUP
    const confirmacion = window.confirm(
      '⚠️ ADVERTENCIA: Restaurar backup\n\n' +
      'Esta acción REEMPLAZARÁ todos los datos actuales (DROP + RESTORE).\n\n' +
      '🔒 ANTES de continuar, el sistema creará un AUTO-BACKUP preventivo\n' +
      '   que se guardará en la carpeta temporal del sistema.\n\n' +
      '¿Está SEGURO que desea continuar?'
    )

    if (!confirmacion) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // ✅ Sin headers - el navegador establece Content-Type con boundary automáticamente
      const response = await api.post('/backup/restaurar', formData)

      // ✅ Verificar respuesta del backend
      const data = response.data
      if (data?.success) {
        let mensajeExito = '✅ Backup restaurado correctamente'
        if (data.auto_backup) {
          mensajeExito += `\n🔒 Auto-backup: ${data.auto_backup}`
        }
        toast.success(mensajeExito, { autoClose: 5000 })

        // Limpiar input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }

        // Recargar página para reflejar cambios en la BD
        setTimeout(() => window.location.reload(), 2000)
      } else {
        throw new Error(data?.message || 'Error al restaurar')
      }

    } catch (error: any) {
      toast.error(error?.response?.data?.detail || '❌ Error al restaurar backup')
    } finally {
      setLoading(false)
    }
  }

  // Solo Admin puede ver esta sección
  if (!hasRole([1])) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-bold text-gray-900">Acceso Denegado</h2>
        <p className="text-gray-600 mt-2">
          Solo el Administrador Principal puede gestionar backups.
        </p>
      </div>
    )
  }

  return (
    // ✅ FONDO GRIS CLARO FIJO
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-2 text-gray-900">🗄️ Backup de Datos</h2>
      <p className="text-gray-700 mb-6 font-medium">
        Exporte o restaure la base de datos completa del sistema.
      </p>

      {/* ✅ ESTADO DE CAJAS - Advertencia visual antes de exportar */}
      {cajasAbiertas !== null && (
        <>
          {cajasAbiertas > 0 ? (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-bold text-yellow-900 mb-1">
                    Hay {cajasAbiertas} caja(s) abierta(s)
                  </p>
                  <p className="text-yellow-800 text-sm">
                    Para garantizar la integridad de los datos financieros, 
                    <strong> cierre todas las cajas</strong> antes de exportar un backup.
                    Esto asegura que todos los movimientos estén confirmados.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-bold text-green-900">
                    Todas las cajas están cerradas
                  </p>
                  <p className="text-green-800 text-sm">
                    El sistema está listo para exportar un backup consistente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ✅ ALERTA DE SEGURIDAD - Fondo amarillo fuerte, texto oscuro */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold text-yellow-900 mb-1">Importante:</p>
            <p className="text-yellow-800 text-sm leading-relaxed">
              Los backups contienen <strong>TODOS</strong> los datos del sistema. 
              Guárdelos en un lugar seguro y no los comparta con terceros.
            </p>
          </div>
        </div>
      </div>

      {/* ✅ EXPORTAR - Fondo blanco, bordes definidos */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-3">📥 Exportar Backup</h3>
        <p className="text-gray-700 mb-4 font-medium">
          Descarga un archivo .sql con todos los datos actuales de la base de datos.
        </p>
        <button
          onClick={handleExportar}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-semibold transition ${
            loading 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? '⏳ Exportando...' : '📥 Exportar Backup (.sql)'}
        </button>
      </div>

      {/* ✅ RESTAURAR - Fondo blanco, bordes definidos */}
      <div className="bg-white border border-gray-300 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-3">🔄 Restaurar Backup</h3>
        
        {/* Advertencia peligro */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
          <p className="text-red-800 font-semibold">
            ⚠️ Peligro: Esta acción reemplazará TODOS los datos actuales.
          </p>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".sql"
            className="flex-1 p-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium"
          />
          <button
            onClick={handleRestaurar}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading ? '⏳ Restaurando...' : '🔄 Restaurar'}
          </button>
        </div>

        <p className="text-gray-700 font-medium">
          Formato aceptado: PostgreSQL dump (.sql)
        </p>
      </div>
    </div>
  )
}

export default Backup
