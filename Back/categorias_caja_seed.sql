-- ============================================
-- CATEGORÍAS DE CAJA - DATOS INICIALES
-- ============================================
-- Ejecutar una sola vez para poblar categorías básicas
-- ============================================

-- Ingresos
INSERT INTO categorias_caja (nombre, tipo, subcategoria) VALUES
('Venta de Mercadería', 'ingreso', 'venta'),
('Cobro de Facturas', 'ingreso', 'cobro'),
('Nota de Crédito', 'ingreso', 'devolucion'),
('Intereses Ganados', 'ingreso', 'financiero'),
('Otros Ingresos', 'ingreso', 'otros')
ON CONFLICT (nombre) DO NOTHING;

-- Egresos
INSERT INTO categorias_caja (nombre, tipo, subcategoria) VALUES
('Compra de Mercadería', 'egreso', 'compra'),
('Pago a Proveedores', 'egreso', 'pago'),
('Sueldos y Salarios', 'egreso', 'personal'),
('Servicios Públicos', 'egreso', 'gasto'),
('Alquileres', 'egreso', 'gasto'),
('Impuestos y Tasas', 'egreso', 'gasto'),
('Gastos Bancarios', 'egreso', 'financiero'),
('Devolución de Ventas', 'egreso', 'devolucion'),
('Gastos Varios', 'egreso', 'otros')
ON CONFLICT (nombre) DO NOTHING;

-- Verificar categorías cargadas
SELECT nombre, tipo, subcategoria FROM categorias_caja ORDER BY tipo, nombre;
