import React, { useState, useEffect } from 'react'
import { useConfig } from '../context/ConfigContext'
import { configuracion } from '../services/api'
import { toast } from 'react-toastify'
import { validarCUIT, formatearCUIT } from '../utils/validaciones'

const Ajustes: React.FC = () => {
  const { config, refreshConfig } = useConfig()
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [errorCUIT, setErrorCUIT] = useState<string>('')

  const [formData, setFormData] = useState({
    nombre_empresa: '',
    razon_social: '',
    cuit: '',
    condicion_iva: '',
    ingresos_brutos: '',
    inicio_actividades: '',
    direccion: '',
    localidad: '',
    telefono: '',
    email: '',
    pie_factura: ''
  })

  // Cargar datos cuando llega la config del contexto
  useEffect(() => {
    if (config) {
      setFormData({
        nombre_empresa: config.nombre_empresa || '',
        razon_social: config.razon_social || '',
        cuit: config.cuit || '',
        condicion_iva: config.condicion_iva || '',
        ingresos_brutos: config.ingresos_brutos || '',
        inicio_actividades: config.inicio_actividades ? config.inicio_actividades.split('T')[0] : '',
        direccion: config.direccion || '',
        localidad: config.localidad || '',
        telefono: config.telefono || '',
        email: config.email || '',
        pie_factura: config.pie_factura || ''
      })
      setLogoPreview(config.logo_url || '')
    }
  }, [config])

  const handleGuardar = async () => {
    console.log('🔍 [AJUSTES] Guardando configuración...', formData)
    setLoading(true)
    try {
      // Actualizar datos de empresa
      console.log('🔍 [AJUSTES] Actualizando datos...', formData)
      const updateResponse = await configuracion.updateEmpresa(formData)
      console.log('✅ Datos guardados:', updateResponse.data)
      
      // Subir logo si hay nuevo
      if (logoFile) {
        console.log('🔍 [AJUSTES] Subiendo logo...', logoFile.name, logoFile.size, 'bytes')
        const logoResponse = await configuracion.subirLogo(logoFile)
        console.log('✅ Logo subido:', logoResponse.data)
      }
      
      await refreshConfig()
      toast.success('✅ Configuración guardada correctamente')
    } catch (error: any) {
      console.error('❌ ERROR guardando:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido'
      toast.error(`❌ Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">⚙️ Ajustes del Sistema</h1>
      <p className="text-gray-600 mb-6">Configuración de datos de la empresa</p>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">🏢 Datos de la Empresa</h2>
        
        {/* Logo */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la Empresa</label>
          {logoPreview && (
            <div className="mb-3">
              <img 
                src={logoPreview.startsWith('/') ? logoPreview : logoPreview} 
                alt="Logo" 
                className="h-20 object-contain border rounded p-2"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Formatos permitidos: PNG, JPG, SVG</p>
        </div>

        {/* Nombre */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Empresa</label>
          <input
            type="text"
            value={formData.nombre_empresa}
            onChange={(e) => setFormData({ ...formData, nombre_empresa: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Mi Empresa SA"
          />
        </div>

        {/* Razón Social */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
          <input
            type="text"
            value={formData.razon_social}
            onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Mi Empresa S.A."
          />
        </div>

        {/* CUIT */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
          <input
            type="text"
            value={formData.cuit}
            onChange={(e) => {
              const valor = e.target.value
              const formateado = formatearCUIT(valor)
              setFormData({ ...formData, cuit: formateado })
              
              const validacion = validarCUIT(formateado)
              if (!validacion.valido && formateado.trim() !== '') {
                setErrorCUIT(validacion.mensaje!)
              } else {
                setErrorCUIT('')
              }
            }}
            onBlur={(e) => {
              const validacion = validarCUIT(e.target.value)
              if (!validacion.valido && e.target.value.trim() !== '') {
                setErrorCUIT(validacion.mensaje!)
              } else {
                setErrorCUIT('')
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errorCUIT ? 'border-red-500' : 'border-gray-300'
            }`}
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

        {/* Dirección */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            type="text"
            value={formData.direccion}
            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Calle 123, Ciudad"
          />
        </div>

        {/* Localidad */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
          <input
            type="text"
            value={formData.localidad}
            onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Buenos Aires"
          />
        </div>

        {/* Condición IVA */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Condición IVA</label>
          <select
            value={formData.condicion_iva}
            onChange={(e) => setFormData({ ...formData, condicion_iva: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Seleccionar...</option>
            <option value="Responsable Inscripto">Responsable Inscripto</option>
            <option value="Consumidor Final">Consumidor Final</option>
            <option value="Monotributista">Monotributista</option>
            <option value="Exento">Exento</option>
            <option value="No Responsable">No Responsable</option>
          </select>
        </div>

        {/* Ingresos Brutos */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Ingresos Brutos</label>
          <input
            type="text"
            value={formData.ingresos_brutos}
            onChange={(e) => setFormData({ ...formData, ingresos_brutos: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 088-123456-7"
          />
        </div>

        {/* Inicio de Actividades */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Inicio de Actividades</label>
          <input
            type="date"
            value={formData.inicio_actividades}
            onChange={(e) => setFormData({ ...formData, inicio_actividades: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Teléfono */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+54 9 11 1234-5678"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contacto@miempresa.com"
          />
        </div>

        {/* Pie de Factura */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pie de Factura</label>
          <textarea
            value={formData.pie_factura}
            onChange={(e) => setFormData({ ...formData, pie_factura: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Gracias por su compra."
          />
          <p className="text-xs text-gray-500 mt-1">Este texto aparecerá en el pie de las facturas impresas</p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={handleGuardar}
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '💾 Guardando...' : '💾 Guardar Configuración'}
          </button>
          <button
            onClick={() => {
              if (config) {
                setFormData({
                  nombre_empresa: config.nombre_empresa || '',
                  cuit: config.cuit || '',
                  direccion: config.direccion || '',
                  telefono: config.telefono || '',
                  email: config.email || '',
                  pie_factura: config.pie_factura || ''
                })
                setLogoPreview(config.logo_url || '')
                setLogoFile(null)
                toast.info('Cambios descartados')
              }
            }}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">ℹ️ Información</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Los datos de esta sección se utilizan en todos los PDFs del sistema (facturas, pedidos, estado de cuenta, etc.)</li>
          <li>• El logo aparecerá en el header de la navbar y en los comprobantes impresos</li>
          <li>• Esta configuración es compartida por todos los usuarios del sistema</li>
        </ul>
      </div>
    </div>
  )
}

export default Ajustes
