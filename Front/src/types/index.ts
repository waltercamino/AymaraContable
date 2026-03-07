// src/types/index.ts
// Interfaces TypeScript para el backend

export interface Usuario {
  id: number
  username: string
  email: string
  nombre_completo: string
  rol_id: number
  activo: boolean
  creado_en: string
  ultimo_acceso?: string
}

export interface Producto {
  id: number
  sku: string
  nombre: string
  categoria_id?: number
  proveedor_id?: number
  unidad_medida: string
  stock_actual: number
  stock_minimo: number
  precio_costo_promedio?: number
  activo: boolean
  creado_en: string
}

export interface Categoria {
  id: number
  nombre: string
  descripcion?: string
  activo: boolean
}

export interface Proveedor {
  id: number
  nombre: string
  contacto?: string
  telefono?: string
  email?: string
  direccion?: string
  cuit?: string
  activo: boolean
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
}

export interface Venta {
  id: number
  fecha: string
  turno?: string
  tipo_venta: 'minorista' | 'mayorista'
  cliente_nombre?: string
  total_venta: number
  medio_pago?: string
  creado_en: string
}

export interface Factura {
  id: number
  punto_venta: number
  numero_factura: number
  tipo_comprobante: 'FA' | 'FB' | 'FC' | 'TK'
  fecha: string
  cliente_id?: number
  subtotal: number
  iva: number
  total: number
  medio_pago?: string
  estado: 'emitida' | 'anulada' | 'con_nota_credito'
  creado_en: string
}

export interface Token {
  access_token: string
  token_type: 'bearer'
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ApiResponse<T> {
  data: T | null
  message?: string
  error?: string
}

// Interfaces adicionales para el frontend
export interface MovimientoCaja {
  id: number
  fecha: string
  tipo: 'venta' | 'compra' | 'gasto' | 'insumo' | 'impuesto' | 'alquiler'
  concepto: string
  monto: number
  observaciones?: string
}

export interface EstadisticaDashboard {
  ventasHoy: number
  ventasMes: number
  gastosMes: number
  productosStockCritico: number
}

export interface VentaItem {
  productoId: number
  nombre: string
  cantidad: number
  precio: number
  subtotal: number
}

// Interfaces extendidas para mock data (con propiedades legacy)
export interface ProductoLegacy extends Producto {
  codigo: string
  categoria: string
  precio: number
  costo: number
  stock: number
  proveedor: string
  stock_actual: number
  stock_minimo: number
}

export interface ProveedorLegacy extends Proveedor {
  documentos: Array<{
    id: number
    nombre: string
    url: string
    fecha: string
  }>
}