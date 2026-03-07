// src/services/api.ts
// Servicio centralizado para llamadas al backend

const API_BASE = '/api'

// Tipos de respuesta
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// Entidades (usar nombres en español para consistencia con backend)
export interface Usuario {
  id: number
  username: string
  email?: string
  nombre_completo?: string
  rol?: string
  activo?: boolean
  creado_en?: string
  ultimo_acceso?: string
  [key: string]: unknown
}

export interface Producto {
  id: number
  nombre: string
  sku?: string | null
  categoria_id?: number | null
  categoria_nombre?: string | null
  proveedor_id?: number | null  // ← Legacy (proveedor principal)
  stock_actual?: number
  stock_minimo?: number
  costo_promedio?: number
  precio_venta?: number
  precio_venta_minorista?: number
  precio_venta_mayorista?: number
  margen_personalizado?: number | null
  margen_categoria_minorista?: number | null
  margen_efectivo_minorista?: number | null
  margen_categoria_mayorista?: number | null
  margen_efectivo_mayorista?: number | null
  iva_compra?: boolean
  iva_venta?: boolean
  activo?: boolean
  creado_en?: string
  actualizado_en?: string | null
  // ← Nuevos campos para M:N
  proveedores?: ProveedorAsociado[]  // Array de proveedores asociados
  proveedor_principal?: ProveedorAsociado  // Proveedor principal
  [key: string]: unknown
}

export interface HistorialMargen {
  id: number
  producto_id: number
  margen_anterior: number
  margen_nuevo: number
  precio_costo_anterior: number
  precio_costo_nuevo: number
  precio_venta_anterior: number
  precio_venta_nuevo: number
  usuario_id?: number | null
  motivo: string
  creado_en: string
}

export interface ActualizarMargenMasivoData {
  producto_ids?: number[]
  categoria_id?: number
  nuevo_margen: number
  tipo_cliente?: 'minorista' | 'mayorista' | 'ambos'
  motivo?: string
}

export interface MargenIndividualUpdateData {
  margen_minorista?: number
  margen_mayorista?: number
  motivo: string
}

export interface MargenIndividualResponse {
  message: string
  producto: string
  margen_minorista_anterior?: number | null
  margen_minorista_nuevo?: number | null
  margen_mayorista_anterior?: number | null
  margen_mayorista_nuevo?: number | null
  precio_venta_minorista?: number | null
  precio_venta_mayorista?: number | null
  error?: string | null
}

export interface Categoria {
  id: number
  nombre: string
  margen_default_minorista?: number
  margen_default_mayorista?: number
  [key: string]: unknown
}

export interface Proveedor {
  id: number
  nombre: string
  cuit?: string  // ← AGREGADO para consistencia con Cliente
  contacto?: string
  telefono?: string
  email?: string
  [key: string]: unknown
}

// ← Nuevo: Proveedor asociado a producto (M:N)
export interface ProveedorAsociado {
  id: number
  nombre: string
  costo_compra?: number
  es_principal?: boolean
}

export interface Cliente {
  id: number
  nombre: string  // Single field: "Juan Perez" o "Razón Social S.A."
  cuit?: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  codigo_postal?: string
  condicion_iva: string
  tipo_cliente: 'minorista' | 'mayorista'
  creado_en: string
  [key: string]: unknown  // Para campos extra del backend
}

export interface Venta {
  id: number
  [key: string]: unknown
}

export interface Factura {
  id: number
  [key: string]: unknown
}

export interface Compra {
  id: number
  [key: string]: unknown
}

export interface NotaCredito {
  id: number
  [key: string]: unknown
}

export interface Precio {
  id: number
  [key: string]: unknown
}

export interface CajaMovimiento {
  id: number
  [key: string]: unknown
}

export interface CuentaCorrienteMovimiento {
  id: number
  tipo: string
  entidad_id: number
  debe: number
  haber: number
  saldo: number
  descripcion: string
  fecha: string
  medio_pago?: string
  creado_en: string
}

export interface CuentaCorrienteSaldo {
  proveedor_id?: number
  cliente_id?: number
  saldo_actual: number
  movimientos: CuentaCorrienteMovimiento[]
}

export interface Reporte {
  [key: string]: unknown
}

// Token management con expiración de 8 horas
const TOKEN_EXPIRATION_HOURS = 8
const TOKEN_KEY = 'access_token'
const TOKEN_TIMESTAMP_KEY = 'token_timestamp'

const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY)
const setToken = (token: string): void => {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString())
}
const removeToken = (): void => {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_TIMESTAMP_KEY)
}

// ✅ Verificar si el token expiró (8 horas)
const isTokenExpired = (): boolean => {
  const timestamp = sessionStorage.getItem(TOKEN_TIMESTAMP_KEY)
  if (!timestamp) return true
  
  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000 // 8 horas en ms
  
  return tokenAge > maxAge
}

// ✅ Obtener tiempo restante del token (en minutos)
const getTokenRemainingTime = (): number => {
  const timestamp = sessionStorage.getItem(TOKEN_TIMESTAMP_KEY)
  if (!timestamp) return 0
  
  const tokenAge = Date.now() - parseInt(timestamp)
  const maxAge = TOKEN_EXPIRATION_HOURS * 60 * 60 * 1000
  const remaining = maxAge - tokenAge
  
  return Math.max(0, Math.floor(remaining / 60000)) // minutos
}

// Request helper con auth automática
async function request<T>(
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, unknown> | null,
  formData: boolean = false
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`
  const token = getToken()

  // ✅ Verificar expiración del token antes de hacer la petición
  if (token && isTokenExpired()) {
    console.warn('⚠️ [API] Token expirado (8hs). Cerrando sesión...')
    removeToken()
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('cajas_abiertas_login')
    
    // ✅ Dispatch event para notificar a la app que debe redirigir a login
    window.dispatchEvent(new CustomEvent('auth-expired'))
    
    return {
      data: null as unknown as T,
      error: 'Sesión expirada. Volvé a loguearte.'
    }
  }

  const headers: HeadersInit = {
    'Accept': 'application/json',
  }

  if (!formData) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    // ✅ FIX: Convertir body a string o FormData según corresponda
    let requestBody: BodyInit | null = null
    if (body) {
      requestBody = formData
        ? (body as unknown as BodyInit)
        : JSON.stringify(body)
    }

    const response = await fetch(url, {
      method,
      headers,
      body: requestBody,
    })

    const data = await response.json()

    if (!response.ok) {
      // ✅ Manejar error 401 (no autorizado) - token inválido o expirado
      if (response.status === 401) {
        console.warn('⚠️ [API] Error 401 - Token inválido/expirado. Cerrando sesión...')
        removeToken()
        sessionStorage.removeItem('usuario')
        sessionStorage.removeItem('cajas_abiertas_login')
        
        // ✅ Dispatch event para notificar a la app que debe redirigir a login
        window.dispatchEvent(new CustomEvent('auth-expired'))
      }
      
      return {
        data: null as unknown as T,
        error: data.detail || data.message || 'Error en la petición'
      }
    }

    return { data: data as T, message: 'OK' }
  } catch (error) {
    console.error('API Error:', error)
    return {
      data: null as unknown as T,
      error: 'Error de conexión con el servidor'
    }
  }
}

// ✅ GET helper para blobs (backup, reportes, etc.)
async function getBlob(
  endpoint: string,
  options?: { responseType?: 'blob' | 'arraybuffer' }
): Promise<Blob> {
  const url = `${API_BASE}${endpoint}`
  const token = getToken()

  // ✅ Verificar expiración del token
  if (token && isTokenExpired()) {
    console.warn('⚠️ [API] Token expirado (8hs). Cerrando sesión...')
    removeToken()
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('cajas_abiertas_login')
    window.dispatchEvent(new CustomEvent('auth-expired'))
    throw new Error('Sesión expirada. Volvé a loguearte.')
  }

  const headers: HeadersInit = {
    'Accept': 'application/octet-stream',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    // ✅ Manejar error 401
    if (response.status === 401) {
      console.warn('⚠️ [API] Error 401 - Token inválido/expirado. Cerrando sesión...')
      removeToken()
      sessionStorage.removeItem('usuario')
      sessionStorage.removeItem('cajas_abiertas_login')
      window.dispatchEvent(new CustomEvent('auth-expired'))
    }
    
    const error = await response.json().catch(() => ({ detail: 'Error en la petición' }))
    throw new Error(error.detail || 'Error al descargar archivo')
  }

  return await response.blob()
}

// ✅ Exportar api como objeto con métodos get y post
// Función específica para POST con FormData (backup, archivos, etc.)
async function postFormData<T>(
  endpoint: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`
  const token = getToken()

  const headers: HeadersInit = {
    'Accept': 'application/json',
  }

  // ✅ NO establecer Content-Type - el navegador lo hace con el boundary
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    // ✅ Intentar parsear JSON, si falla retornar texto plano
    let data: any
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      const text = await response.text()
      data = { detail: text || `Error ${response.status}` }
    }

    if (!response.ok) {
      console.error('❌ [api] Error detallado:', {
        status: response.status,
        detail: data?.detail || data?.message,
        contentType
      })
      return {
        data: null as unknown as T,
        error: data?.detail || data?.message || 'Error en la petición'
      }
    }

    return { data: data as T, message: 'OK' }
  } catch (error: any) {
    console.error('❌ [api] Error de conexión:', {
      message: error?.message,
      name: error?.name
    })
    return {
      data: null as unknown as T,
      error: 'Error de conexión con el servidor'
    }
  }
}

// ✅ Exportar utilidades de token para uso externo
export { isTokenExpired, getTokenRemainingTime, removeToken }

export const api = {
  get: getBlob,
  post: postFormData,  // ✅ Usa postFormData para FormData
  request: request,    // ✅ Mantiene request para JSON
}

// ============================================
// AUTH
// ============================================
export const auth = {
  login: async (username: string, password: string) => {
    // OAuth2 requiere form-data, no JSON
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${API_BASE}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data.detail || 'Error de autenticación' }
    }

    setToken(data.access_token)
    return { data, message: 'Login exitoso' }
  },

  logout: async () => {
    try {
      await request('/usuarios/logout', 'POST')
    } catch (error) {
      // Si falla el logout del backend, continuar con logout local
      console.warn('Logout backend falló')
    } finally {
      removeToken()
    }
  },

  me: async () => {
    return request('/usuarios/me')
  },

  isAuthenticated: (): boolean => {
    return !!getToken()
  },

  getToken: () => getToken(),
}

// ============================================
// USUARIOS
// ============================================
export const usuarios = {
  getAll: (params?: { rol?: string; activo?: boolean }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Usuario[]>(`/usuarios/${qs ? '?' + qs : ''}`)
  },
  getById: (id: number) => request<Usuario>(`/usuarios/${id}`),
  create: (data: Partial<Usuario>) => request<Usuario>('/usuarios/', 'POST', data),
  update: (id: number, data: Partial<Usuario>) => request<Usuario>(`/usuarios/${id}`, 'PUT', data),
  delete: (id: number) => request<void>(`/usuarios/${id}`, 'DELETE'),
  me: () => request<Usuario>('/usuarios/me'),
}

// ============================================
// PRODUCTOS ✅ FIX: Usar Producto (no Product)
// ============================================
export const productos = {
  getAll: (params?: { categoria_id?: number; proveedor_id?: number; activo?: boolean }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Producto[]>(`/productos/${qs ? '?' + qs : ''}`)
  },
  getById: (id: number) => request<Producto>(`/productos/${id}`),
  create: (data: Partial<Producto>) => request<Producto>('/productos/', 'POST', data),
  update: (id: number, data: Partial<Producto>) => request<Producto>(`/productos/${id}`, 'PUT', data),
  delete: (id: number) => request<void>(`/productos/${id}`, 'DELETE'),
  updateMargen: (id: number, margen: number, motivo?: string) => 
    request(`/productos/${id}/margen`, 'PUT', { margen_personalizado: margen, motivo: motivo || 'manual' }),
  updateMargenes: (id: number, data: MargenIndividualUpdateData) => 
    request<MargenIndividualResponse>(`/productos/${id}/margenes`, 'PUT', data),
  actualizarMargenMasivo: (data: ActualizarMargenMasivoData) => 
    request<{actualizados: number, error: string | null, detalle?: any[]}>('/productos/actualizar-margen-masivo', 'POST', data),
  getHistorialMargen: (id: number) => request<HistorialMargen[]>(`/productos/${id}/historial-margen`),
}

// ============================================
// CATEGORÍAS
// ============================================
export const categorias = {
  getAll: () => request<Categoria[]>('/categorias/'),
  getById: (id: number) => request<Categoria>(`/categorias/${id}`),
  create: (data: Partial<Categoria>) => request<Categoria>('/categorias/', 'POST', data),
  update: (id: number, data: Partial<Categoria>) => request<Categoria>(`/categorias/${id}`, 'PUT', data),
  delete: (id: number) => request<void>(`/categorias/${id}`, 'DELETE'),
}

// ============================================
// PROVEEDORES
// ============================================
export const proveedores = {
  getAll: () => {
    return request<Proveedor[]>('/proveedores/')
  },
  getById: (id: number) => request<Proveedor>(`/proveedores/${id}`),
  create: (data: Partial<Proveedor>) => request<Proveedor>('/proveedores/', 'POST', data),
  update: (id: number, data: Partial<Proveedor>) => request<Proveedor>(`/proveedores/${id}`, 'PUT', data),
  delete: (id: number) => request<void>(`/proveedores/${id}`, 'DELETE'),
  getCompras: (id: number) => request<Compra[]>(`/proveedores/${id}/compras`),
  getResumen: (id: number) => request<Record<string, unknown>>(`/proveedores/${id}/resumen`),
}

// ============================================
// CLIENTES
// ============================================
export const clientes = {
  getAll: (params?: { tipo_cliente?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Cliente[]>(`/clientes/${qs ? '?' + qs : ''}`)
  },
  getById: (id: number) => request<Cliente>(`/clientes/${id}`),
  create: (data: Partial<Cliente>) => request<Cliente>('/clientes/', 'POST', data),
  update: (id: number, data: Partial<Cliente>) => request<Cliente>(`/clientes/${id}`, 'PUT', data),
  delete: (id: number) => request<void>(`/clientes/${id}`, 'DELETE'),
  getByCuit: (cuit: string) => request<Cliente>(`/clientes/cuit/${cuit}`),
  getFacturas: (id: number) => request<Factura[]>(`/clientes/${id}/facturas`),
  getResumen: (id: number) => request<Record<string, unknown>>(`/clientes/${id}/resumen`),
}

// ============================================
// FC COMPRA (Factura de Compra)
// ============================================
export const fcCompra = {
  getAll: (params?: { estado?: string; proveedor_id?: number; fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<FCCompra[]>(`/fc-compra/${qs ? '?' + qs : ''}`)
  },
  getById: (id: number) => request<FCCompra>(`/fc-compra/${id}`),
  create: (data: FCCompraCreate) => request<FCCompra>('/fc-compra/', 'POST', data as unknown as Record<string, unknown>),
  update: (id: number, data: Record<string, unknown>) => request<FCCompra>(`/fc-compra/${id}`, 'PUT', data),
  // ⚠️ REMOVIDO: anular() - Las facturas no se anulan directamente, usar Notas de Crédito
  verificarNumero: (numero: string, proveedorId: number) =>
    request<{ existe: boolean }>(`/fc-compra/verificar-numero?numero_factura=${encodeURIComponent(numero)}&proveedor_id=${proveedorId}`),
}

// Interface para Factura de Compra
export interface FCCompra {
  id: number
  numero_interno?: string  // FC-0001 (auto generado)
  numero_factura: string  // 0001-00001234 (del proveedor)
  proveedor_id: number
  proveedor_nombre?: string
  fecha: string
  fecha_vencimiento?: string
  total: number
  medio_pago: string
  estado: 'registrada' | 'anulada'
  observaciones?: string
  [key: string]: unknown
}

// Interface para crear Factura de Compra
export interface FCCompraCreate {
  numero_factura: string  // Obligatorio (del proveedor)
  proveedor_id: number
  fecha?: string
  fecha_vencimiento?: string
  numero_remision?: string
  medio_pago: string  // efectivo, transferencia, cta_cte, cheque
  observaciones?: string
  detalles: Array<{
    producto_id: number
    cantidad: number
    costo_unitario: number
  }>
}

// ============================================
// FC VENTA (Factura de Venta)
// ============================================
export const fcVenta = {
  getAll: (params?: { estado?: string; cliente_id?: number; fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<FCVenta[]>(`/fc-venta/${qs ? '?' + qs : ''}`)
  },
  getById: (id: number) => request<FCVenta>(`/fc-venta/${id}`),
  create: (data: FCVentaCreate) => request<FCVenta>('/fc-venta/', 'POST', data as unknown as Record<string, unknown>),
  // ⚠️ REMOVIDO: anular() - Las facturas no se anulan directamente, usar Notas de Crédito
  // Descargar PDF de factura
  getPDF: (id: number) => {
    const token = getToken()
    const url = `${API_BASE}/fc-venta/${id}/pdf`
    return token ? `${url}?token=${token}` : url
  },
  // Enviar por WhatsApp (descargar PDF + abrir WhatsApp)
  enviarWhatsApp: (id: number) => request(`/fc-venta/${id}/whatsapp`),
  // Enviar por Email (descargar PDF + abrir app de correo)
  enviarEmail: (id: number) => request(`/fc-venta/${id}/email`),
}

// Interface para Factura de Venta
export interface FCVenta {
  id: number
  numero_interno?: string  // FV-0001 (auto generado)
  punto_venta: number
  numero_factura: number
  tipo_comprobante: string
  cliente_id: number
  cliente_nombre?: string
  fecha: string
  fecha_vencimiento?: string
  total: number
  medio_pago: string
  estado: 'emitida' | 'anulada'
  observaciones?: string
  [key: string]: unknown
}

// Interface para crear Factura de Venta
export interface FCVentaCreate {
  tipo_comprobante: string  // FC, FB, TK
  punto_venta: number
  numero_factura?: number  // ← AUTO GENERADO (opcional)
  cliente_id: number
  fecha?: string
  fecha_vencimiento?: string
  medio_pago: string  // efectivo, transferencia, cta_cte, cheque
  observaciones?: string
  items: Array<{
    producto_id: number
    cantidad: number
    precio_unitario: number
  }>
}

// ============================================
// NOTAS DE CRÉDITO
// ============================================
export const notasCredito = {
  getAll: (params?: { fecha_desde?: string; fecha_hasta?: string; cliente_id?: number; estado?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<NotaCredito[]>(`/notas-credito/${qs ? '?' + qs : ''}`)
  },
  getById: (id: number) => request<NotaCredito>(`/notas-credito/${id}`),
  create: (data: Partial<NotaCredito>) => request<NotaCredito>('/notas-credito/', 'POST', data),
  anular: (id: number) => request<NotaCredito>(`/notas-credito/${id}/anular`, 'POST'),
  getPdf: (id: number) => {
    const token = getToken()
    return `${API_BASE}/notas-credito/${id}/pdf${token ? `?token=${token}` : ''}`
  },
}

// ============================================
// PRECIOS
// ============================================
export const precios = {
  getAll: () => request<Record<string, unknown>>('/precios/'),
  getListas: () => request<Record<string, unknown>>('/precios/listas'),
  createLista: (data: Record<string, unknown>) => request<Record<string, unknown>>('/precios/listas', 'POST', data),
  updateLista: (id: number, data: Record<string, unknown>) => request<Record<string, unknown>>(`/precios/listas/${id}`, 'PUT', data),
  deleteLista: (id: number) => request<void>(`/precios/listas/${id}`, 'DELETE'),
  actualizacionMasiva: (data: ActualizacionMasiva) => request<Record<string, unknown>>('/precios/actualizacion-masiva', 'POST', data),
  updateBloque: (data: Record<string, unknown>) => request<Record<string, unknown>>('/precios/actualizar-bloque', 'POST', data),
  getEtiquetas: (params?: { categoria_id?: number }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Record<string, unknown>>(`/precios/exportar-etiquetas${qs ? '?' + qs : ''}`)
  },
  getListaMayorista: () => request<Record<string, unknown>>('/precios/exportar-lista-mayorista'),
}

// Interface para actualización masiva (usada solo en el frontend)
export interface ActualizacionMasiva {
  producto_ids: number[]
  tipo_actualizacion: 'porcentaje' | 'monto_fijo' | 'nuevo_costo'  // ← Actualiza costo_promedio
  valor: number
  redondeo?: 'none' | '50' | '99' | '90' | '100'
  // NOTA: Esto actualiza costo_promedio, el precio_venta se recalcula automáticamente
}

// ============================================
// CAJA
// ============================================
export interface CajaAperturaCreate {
  saldo_inicial: number
  observaciones?: string
}

export interface CajaCierreCreate {
  saldo_final: number
  observaciones?: string
}

export interface CajaDia {
  id: number
  fecha: string
  saldo_inicial: number
  saldo_final?: number
  estado: 'abierto' | 'cerrado'
  usuario_id?: number
  fecha_apertura?: string
  fecha_cierre?: string
  observaciones_cierre?: string
}

export const caja = {
  getAll: (params?: { fecha_desde?: string; fecha_hasta?: string; tipo?: string; categoria_id?: number; caja_id?: number }) => {
    // ✅ Filtrar undefined para no enviarlos como query params
    const cleanParams: Record<string, any> = {}
    if (params?.fecha_desde) cleanParams.fecha_desde = params.fecha_desde
    if (params?.fecha_hasta) cleanParams.fecha_hasta = params.fecha_hasta
    if (params?.tipo) cleanParams.tipo = params.tipo
    if (params?.categoria_id) cleanParams.categoria_id = params.categoria_id
    if (params?.caja_id) cleanParams.caja_id = params.caja_id  // ✅ FIX: Filtrar por sesión
    const qs = Object.keys(cleanParams).length ? new URLSearchParams(cleanParams).toString() : ''
    return request<CajaMovimiento[]>(`/caja/${qs ? '?' + qs : ''}`)
  },
  create: (data: Partial<CajaMovimiento>) => request<CajaMovimiento>('/caja/', 'POST', data),
  delete: (id: number) => request<void>(`/caja/${id}`, 'DELETE'),
  getResumen: (params?: { fecha_desde?: string; fecha_hasta?: string; caja_id?: number }) => {
    // ✅ Filtrar undefined
    const cleanParams: Record<string, any> = {}
    if (params?.fecha_desde) cleanParams.fecha_desde = params.fecha_desde
    if (params?.fecha_hasta) cleanParams.fecha_hasta = params.fecha_hasta
    if (params?.caja_id) cleanParams.caja_id = params.caja_id
    const qs = Object.keys(cleanParams).length ? new URLSearchParams(cleanParams).toString() : ''
    // 🔍 DEBUG: Ver URL generada
    console.log(`🔍 getResumen URL: /caja/resumen${qs ? '?' + qs : ''}`)
    return request<Record<string, unknown>>(`/caja/resumen${qs ? '?' + qs : ''}`)
  },
  getResumenHoy: () => request<Record<string, unknown>>('/caja/resumen-hoy'),
  getCategorias: () => request<CajaMovimiento[]>('/caja/categorias'),
  // Apertura/Cierre
  getHoy: () => request<Record<string, unknown>>('/caja/hoy'),
  apertura: (data: CajaAperturaCreate) => request('/caja/apertura', 'POST', data),
  cierre: (data: CajaCierreCreate) => request('/caja/cierre', 'POST', data),
  // Historial
  getHistorial: (params?: { fecha_desde?: string; fecha_hasta?: string; estado?: string }) => {
    // ✅ Filtrar undefined
    const cleanParams: Record<string, any> = {}
    if (params?.fecha_desde) cleanParams.fecha_desde = params.fecha_desde
    if (params?.fecha_hasta) cleanParams.fecha_hasta = params.fecha_hasta
    if (params?.estado) cleanParams.estado = params.estado
    const qs = Object.keys(cleanParams).length ? new URLSearchParams(cleanParams).toString() : ''
    return request<CajaDia[]>(`/caja/historial${qs ? '?' + qs : ''}`)
  },
  getMovimientosDeCaja: (cajaId: number) => request<CajaMovimiento[]>(`/caja/historial/${cajaId}/movimientos`),
  // 🚨 EMERGENCIA: Cierre manual
  getCajasAbiertas: () => request<CajaDia[]>(`/caja/abiertas`),
  cerrarCajaManual: (cajaId: number) => request(`/caja/cerrar-manual/${cajaId}`, 'POST'),
  // 🔍 RECUPERACIÓN: Registrar caja recuperada por cierre inesperado
  registrarRecuperacion: (cajaId: number, accion: 'continuar' | 'cerrar') => 
    request(`/caja/registrar-recuperacion?caja_id=${cajaId}&accion=${accion}`, 'POST'),
  // 🔒 ADMIN: Forzar cierre de caja de otro usuario
  forzarCierre: (cajaId: number, motivo: string) =>
    request(`/caja/forzar-cierre?caja_id=${cajaId}&motivo=${encodeURIComponent(motivo)}`, 'POST'),
}

// ============================================
// PEDIDOS A PROVEEDORES
// ============================================
export interface PedidoProveedor {
  id: number
  numero_interno: string
  fecha_pedido: string
  proveedor_id: number
  proveedor_nombre?: string
  estado: string
  total_estimado: number
  creado_en?: string
  cantidad_productos?: number
}

export interface PedidoDetalleCreate {
  producto_id: number
  cantidad: number
  precio_costo: number
}

export const pedidos = {
  getProductos: (params?: { busqueda?: string; proveedor_id?: number }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request(`/pedidos/productos${qs ? '?' + qs : ''}`)
  },
  
  getAll: (params?: { fecha_desde?: string; fecha_hasta?: string; proveedor_id?: number; estado?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<PedidoProveedor[]>(`/pedidos/${qs ? '?' + qs : ''}`)
  },
  
  getById: (id: number) => request<PedidoProveedor>(`/pedidos/${id}`),
  
  eliminar: (id: number) => request(`/pedidos/${id}`, 'DELETE'),
  
  create: (data: { proveedor_id: number; detalles: PedidoDetalleCreate[] }) => 
    request<{ id: number; numero_interno: string }>('/pedidos/', 'POST', data),
  
  enviar: (id: number, medio: string) => request(`/pedidos/${id}/enviar?medio=${medio}`),
  
  recibir: (id: number) => request(`/pedidos/${id}/recibir`, 'POST'),
  
  cancelar: (id: number) => request(`/pedidos/${id}/cancelar`, 'POST'),
  
  getResumen: () => request('/pedidos/resumen/estado'),
}

// ============================================
// REPORTES ✅ FIX: Reporte (no Reportes)
// ============================================
export const reportes = {
  getVentasSemanales: () => request<Record<string, unknown>>('/reportes/ventas-semanales'),
  getVentas: (params?: { fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Reporte>(`/reportes/ventas${qs ? '?' + qs : ''}`)
  },
  getStock: () => request<Reporte>('/reportes/stock'),
  getCaja: (params?: { fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Reporte>(`/reportes/caja${qs ? '?' + qs : ''}`)
  },
  getProductosMasVendidos: (params?: { limite?: number; fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Reporte>(`/reportes/productos-mas-vendidos${qs ? '?' + qs : ''}`)
  },
  getVentasPorProducto: (params?: { fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Reporte>(`/reportes/ventas-por-producto${qs ? '?' + qs : ''}`)
  },
  getComprasPorProducto: (params?: { fecha_desde?: string; fecha_hasta?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Reporte>(`/reportes/compras-por-producto${qs ? '?' + qs : ''}`)
  },
  getStockInteligente: (dias_proyeccion: number = 30) =>
    request<Reporte>(`/reportes/stock-inteligente?dias_proyeccion=${dias_proyeccion}`),
  getSugerenciaCompras: (dias_proyeccion: number = 30) =>
    request<Reporte>(`/reportes/sugerencia-compras?dias_proyeccion=${dias_proyeccion}`),
  getGanancia: (params?: { 
    fecha_desde?: string; 
    fecha_hasta?: string; 
    canal?: 'minorista' | 'mayorista' | 'todos' 
  }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request(`/reportes/ganancia${qs ? '?' + qs : ''}`)
  },
  
  getGananciaPorCategoria: (params?: { 
    fecha_desde?: string; 
    fecha_hasta?: string;
    canal?: 'minorista' | 'mayorista' | 'todos'
  }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request(`/reportes/ganancia-por-categoria${qs ? '?' + qs : ''}`)
  },
  
  getGananciaPorMetodoPago: (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
    canal?: 'minorista' | 'mayorista' | 'todos'
  }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request(`/reportes/ganancia-por-metodo-pago${qs ? '?' + qs : ''}`)
  },

  getEgresosOperativos: (params?: {
    fecha_desde?: string;
    fecha_hasta?: string;
  }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request(`/reportes/egresos-operativos${qs ? '?' + qs : ''}`)
  },

  getProyeccionVentas: (params: {
    mes: number;
    anio_actual: number;
    anio_anterior: number;
    categoria_id?: number;
    canal?: 'minorista' | 'mayorista' | 'todos';
  }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return request(`/reportes/proyeccion-ventas?${qs}`)
  },
}

// ============================================
// CUENTA CORRIENTE
// ============================================
export const cuentaCorriente = {
  getSaldoProveedor: (proveedorId: number) => request<CuentaCorrienteSaldo>(`/cuenta-corriente/proveedores/${proveedorId}`),
  getSaldoCliente: (clienteId: number) => request<CuentaCorrienteSaldo>(`/cuenta-corriente/clientes/${clienteId}`),
  registrarPago: (data: { proveedor_id: number; monto: number; medio_pago: string; descripcion?: string; fecha?: string }) =>
    request('/cuenta-corriente/registrar-pago', 'POST', data),
  registrarCobro: (data: { cliente_id: number; monto: number; medio_pago: string; descripcion?: string; fecha?: string }) =>
    request('/cuenta-corriente/registrar-cobro', 'POST', data),
  getResumen: () => request('/cuenta-corriente/resumen'),
  // Descargar PDF
  descargarPDF: (tipo: 'cliente' | 'proveedor', entidadId: number, fechaDesde?: string, fechaHasta?: string) => {
    const token = getToken()
    let url = `${API_BASE}/cuenta-corriente/${tipo}/${entidadId}/pdf`
    const params = new URLSearchParams()
    if (fechaDesde) params.append('fecha_desde', fechaDesde)
    if (fechaHasta) params.append('fecha_hasta', fechaHasta)
    if (token) params.append('token', token)
    const qs = params.toString()
    return `${url}${qs ? '?' + qs : ''}`
  },
  // Descargar Excel
  descargarExcel: (tipo: 'cliente' | 'proveedor', entidadId: number, fechaDesde?: string, fechaHasta?: string) => {
    const token = getToken()
    let url = `${API_BASE}/cuenta-corriente/${tipo}/${entidadId}/excel`
    const params = new URLSearchParams()
    if (fechaDesde) params.append('fecha_desde', fechaDesde)
    if (fechaHasta) params.append('fecha_hasta', fechaHasta)
    if (token) params.append('token', token)
    const qs = params.toString()
    return `${url}${qs ? '?' + qs : ''}`
  },
}

// ============================================
// RECIBOS (COBROS Y PAGOS) - Solo para Dashboard
// ============================================
export interface Recibo {
  id: number
  numero_interno: string
  tipo: 'cobro' | 'pago'
  cliente_id?: number
  proveedor_id?: number
  cliente_nombre?: string
  proveedor_nombre?: string
  entidad_nombre?: string
  fecha: string
  monto: number
  medio_pago: string
  estado: 'registrado' | 'anulado'
  observaciones?: string
  creado_en?: string
}

export const recibos = {
  // Solo getAll para Dashboard (cobros/pagos recientes)
  getAll: (params?: { tipo?: string; entidad_id?: number; fecha_desde?: string; fecha_hasta?: string; estado?: string }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request<Recibo[]>(`/recibos/${qs ? '?' + qs : ''}`)
  },
  // Descargar PDF de recibo
  getPdf: (id: number) => {
    const token = getToken()
    const url = `${API_BASE}/recibos/${id}/pdf`
    return token ? `${url}?token=${token}` : url
  },
}

// ============================================
// CONFIGURACIÓN DE EMPRESA
// ============================================
export interface ConfiguracionEmpresa {
  id: number
  nombre_empresa: string
  cuit: string
  direccion: string
  telefono: string
  email: string
  logo_url: string
  pie_factura: string
  creado_en: string
  actualizado_en: string
}

export const configuracion = {
  getEmpresa: () => request<ConfiguracionEmpresa>('/configuracion/empresa'),
  updateEmpresa: (data: Partial<ConfiguracionEmpresa>) => request<ConfiguracionEmpresa>('/configuracion/empresa', 'PUT', data),
  subirLogo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request<{ logo_url: string }>('/configuracion/empresa/logo', 'POST', formData as unknown as Record<string, unknown>, true)
  },
  inicializar: () => request<ConfiguracionEmpresa>('/configuracion/empresa/inicializar', 'POST'),
}

// Export default para uso fácil
export default {
  auth,
  usuarios,
  productos,
  categorias,
  proveedores,
  clientes,
  fcCompra,
  fcVenta,
  notasCredito,
  precios,
  caja,
  reportes,
  cuentaCorriente,
  recibos,
  configuracion,
}