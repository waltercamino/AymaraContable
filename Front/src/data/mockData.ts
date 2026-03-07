import { ProductoLegacy, ProveedorLegacy, MovimientoCaja, EstadisticaDashboard } from '../types';

export const mockProductos: ProductoLegacy[] = [
  { id: 1, sku: 'P001', codigo: 'P001', nombre: 'Laptop Dell XPS 13', categoria: 'Electrónica', categoria_id: 1, precio: 850000, costo: 650000, stock: 15, stock_actual: 15, stock_minimo: 5, proveedor: 'Tech Supplies SA', unidad_medida: 'unidad', precio_costo_promedio: 650000, activo: true, creado_en: '2024-01-01' },
  { id: 2, sku: 'P002', codigo: 'P002', nombre: 'Mouse Logitech MX Master', categoria: 'Accesorios', categoria_id: 2, precio: 45000, costo: 32000, stock: 3, stock_actual: 3, stock_minimo: 10, proveedor: 'Tech Supplies SA', unidad_medida: 'unidad', precio_costo_promedio: 32000, activo: true, creado_en: '2024-01-01' },
  { id: 3, sku: 'P003', codigo: 'P003', nombre: 'Teclado Mecánico RGB', categoria: 'Accesorios', categoria_id: 2, precio: 65000, costo: 45000, stock: 25, stock_actual: 25, stock_minimo: 10, proveedor: 'GameTech SRL', unidad_medida: 'unidad', precio_costo_promedio: 45000, activo: true, creado_en: '2024-01-01' },
  { id: 4, sku: 'P004', codigo: 'P004', nombre: 'Monitor LG 27" 4K', categoria: 'Electrónica', categoria_id: 1, precio: 320000, costo: 245000, stock: 8, stock_actual: 8, stock_minimo: 5, proveedor: 'Display Pro', unidad_medida: 'unidad', precio_costo_promedio: 245000, activo: true, creado_en: '2024-01-01' },
  { id: 5, sku: 'P005', codigo: 'P005', nombre: 'Auriculares Sony WH-1000XM4', categoria: 'Audio', categoria_id: 3, precio: 180000, costo: 135000, stock: 2, stock_actual: 2, stock_minimo: 8, proveedor: 'Audio Center', unidad_medida: 'unidad', precio_costo_promedio: 135000, activo: true, creado_en: '2024-01-01' },
];

export const mockProveedores: ProveedorLegacy[] = [
  {
    id: 1,
    nombre: 'Tech Supplies SA',
    contacto: 'Carlos Rodríguez',
    telefono: '011-4567-8901',
    email: 'carlos@techsupplies.com.ar',
    direccion: 'Av. Corrientes 1234, CABA',
    cuit: '30-12345678-9',
    activo: true,
    documentos: [
      { id: 1, nombre: 'Lista de Precios Enero 2024', url: '/docs/precios-enero.pdf', fecha: '2024-01-15' },
    ],
  },
  {
    id: 2,
    nombre: 'GameTech SRL',
    contacto: 'Ana Martínez',
    telefono: '011-2345-6789',
    email: 'ana@gametech.com.ar',
    direccion: 'Calle Falsa 123, CABA',
    cuit: '30-87654321-0',
    activo: true,
    documentos: [],
  },
];

export const mockMovimientos: MovimientoCaja[] = [
  { id: 1, fecha: '2024-02-17T10:30:00', tipo: 'venta', concepto: 'Venta #1', monto: 850000, observaciones: '' },
  { id: 2, fecha: '2024-02-17T14:15:00', tipo: 'venta', concepto: 'Venta #2', monto: 155000, observaciones: '' },
  { id: 3, fecha: '2024-02-16', tipo: 'compra', concepto: 'Compra stock Tech Supplies', monto: -450000, observaciones: '' },
  { id: 4, fecha: '2024-02-15', tipo: 'gasto', concepto: 'Servicios de limpieza', monto: -35000, observaciones: '' },
  { id: 5, fecha: '2024-02-15', tipo: 'alquiler', concepto: 'Alquiler local febrero', monto: -250000, observaciones: '' },
];

export const mockEstadisticas: EstadisticaDashboard = {
  ventasHoy: 1005000,
  ventasMes: 4850000,
  gastosMes: 1250000,
  productosStockCritico: 2,
};
