/**
 * Utilidades de validación de datos
 */

/**
 * Valida formato de CUIT argentino
 * Formatos válidos: 20-12345678-9 o 20123456789 o 99-99999999-9 (comodín)
 * @param cuit - CUIT a validar (con o sin guiones)
 * @returns Objeto con resultado de validación
 */
export const validarCUIT = (cuit: string): { valido: boolean; mensaje?: string } => {
  // CUIT vacío es válido (campo opcional)
  if (!cuit || cuit.trim() === '') {
    return { valido: true }
  }

  // Limpiar guiones y espacios
  const cuitLimpio = cuit.replace(/[-\s]/g, '')

  // Debe tener exactamente 11 dígitos
  if (!/^\d{11}$/.test(cuitLimpio)) {
    return {
      valido: false,
      mensaje: 'El CUIT debe tener 11 dígitos (ej: 20-12345678-9 o 99-99999999-9)'
    }
  }

  // ✅ NO validar dígito verificador (permite comodín 99-99999999-9)
  // Solo validamos formato, no el algoritmo
  
  return { valido: true }
}

/**
 * Formatea un CUIT con guiones (XX-XXXXXXXX-X)
 * @param cuit - CUIT sin formato
 * @returns CUIT formateado
 */
export const formatearCUIT = (cuit: string): string => {
  const cuitLimpio = cuit.replace(/[-\s]/g, '')
  
  if (cuitLimpio.length === 11) {
    return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2, 10)}-${cuitLimpio.slice(10)}`
  }
  
  // Si no tiene 11 dígitos, devolver sin formato
  return cuit
}

/**
 * Valida formato de email
 */
export const validarEmail = (email: string): { valido: boolean; mensaje?: string } => {
  if (!email || email.trim() === '') {
    return { valido: true } // Email opcional
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valido: false, mensaje: 'Email inválido' }
  }
  
  return { valido: true }
}

/**
 * Valida formato de teléfono (opcional, flexible)
 */
export const validarTelefono = (telefono: string): { valido: boolean; mensaje?: string } => {
  if (!telefono || telefono.trim() === '') {
    return { valido: true } // Teléfono opcional
  }
  
  // Permitir números, espacios, guiones, + y paréntesis
  const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '')
  
  if (!/^\+?\d{7,15}$/.test(telefonoLimpio)) {
    return { 
      valido: false, 
      mensaje: 'Teléfono inválido (mínimo 7 dígitos)' 
    }
  }
  
  return { valido: true }
}

/**
 * Valida que una fecha no sea futura
 * @param fecha - Fecha en formato YYYY-MM-DD
 * @returns Objeto con resultado de validación
 */
export const validarFechaNoFutura = (fecha: string): { valido: boolean; mensaje?: string } => {
  if (!fecha || fecha.trim() === '') {
    return { valido: true } // Campo opcional
  }
  
  const fechaSeleccionada = new Date(fecha)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0) // Normalizar a medianoche
  
  if (fechaSeleccionada > hoy) {
    return { 
      valido: false, 
      mensaje: 'La fecha no puede ser futura' 
    }
  }
  
  return { valido: true }
}
