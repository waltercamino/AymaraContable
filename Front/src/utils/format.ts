// src/utils/format.ts
// Funciones de formato para mostrar datos

/**
 * Formatea un valor monetario a pesos argentinos
 * @param value - Puede ser number, string, null o undefined
 * @returns String formateado: "$ 1.234,56"
 */
export function formatCurrency(value: number | string | null | undefined): string {
  // Si es null/undefined, retornar vacío
  if (value == null) return '$ 0,00'
  
  // Convertir a número si es string
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  // Si no es un número válido, retornar vacío
  if (isNaN(numValue)) return '$ 0,00'
  
  // Formatear a pesos argentinos
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

/**
 * Formatea una fecha a formato DD/MM/YYYY
 * @param date - String ISO, Date object, o null
 * @returns String formateado: "18/02/2026"
 * 
 * ⚠️ FIX: Para fechas en formato "YYYY-MM-DD" (sin hora), usar la fecha directamente
 * sin conversión de zona horaria para evitar desfase de un día.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  // ✅ FIX: Si es string ISO sin hora (ej: "2026-03-05"), usar directamente
  // para evitar problema de zona horaria que muestra día anterior
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  }

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formatea fecha con hora: DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Trunca texto largo con ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Capitaliza la primera letra de un string
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Formatea número con separadores de miles
 */
export function formatNumber(value: number | string | null | undefined): string {
  if (value == null) return '0'
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return '0'
  
  return new Intl.NumberFormat('es-AR').format(numValue)
}

/**
 * Convierte estado a badge color (para UI)
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Facturas
    'emitida': 'bg-green-100 text-green-800',
    'anulada': 'bg-red-100 text-red-800',
    'con_nota_credito': 'bg-yellow-100 text-yellow-800',
    // Compras/Ventas
    'registrada': 'bg-blue-100 text-blue-800',
    // General
    'activo': 'bg-green-100 text-green-800',
    'inactivo': 'bg-gray-100 text-gray-800',
    'pendiente': 'bg-yellow-100 text-yellow-800',
    'completado': 'bg-green-100 text-green-800',
  }
  return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

/**
 * Formatea CUIT: 20-12345678-9
 */
export function formatCuit(cuit: string | null | undefined): string {
  if (!cuit) return '-'
  // Remover guiones y espacios, luego formatear
  const clean = cuit.replace(/[^0-9]/g, '')
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}