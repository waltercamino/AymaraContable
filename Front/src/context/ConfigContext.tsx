import React, { createContext, useContext, useEffect, useState } from 'react'
import { configuracion, ConfiguracionEmpresa } from '../services/api'

interface ConfigContextType {
  config: ConfiguracionEmpresa | null
  loading: boolean
  refreshConfig: () => Promise<void>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfiguracionEmpresa | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshConfig = async () => {
    try {
      const response = await configuracion.getEmpresa()
      if (response.data) {
        setConfig(response.data)
      }
    } catch (error) {
      // Si no existe configuración, intentar inicializar
      try {
        await configuracion.inicializar()
        const response = await configuracion.getEmpresa()
        if (response.data) {
          setConfig(response.data)
        }
      } catch (initError) {
        console.error('Error inicializando configuración:', initError)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshConfig()
  }, [])

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig debe usarse dentro de ConfigProvider')
  }
  return context
}
