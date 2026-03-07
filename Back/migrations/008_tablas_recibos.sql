-- ============================================
-- MIGRACIÓN 008: TABLAS DE RECIBOS
-- ============================================
-- Descripción: Agrega las tablas para gestión de cobros y pagos
-- Fecha: 2025-02-23

-- Tabla: recibos
CREATE TABLE IF NOT EXISTS recibos (
    id SERIAL PRIMARY KEY,
    numero_interno VARCHAR(20) UNIQUE NOT NULL,  -- R-0001 (automático)
    tipo VARCHAR(20) NOT NULL,  -- 'cobro' o 'pago'
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,  -- Si es cobro
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,  -- Si es pago
    fecha DATE NOT NULL,
    monto NUMERIC(12, 2) NOT NULL,
    medio_pago VARCHAR(50) NOT NULL,  -- efectivo, transferencia, cheque, tarjeta
    estado VARCHAR(20) DEFAULT 'registrado',  -- registrado, anulado
    observaciones VARCHAR(500),
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para recibos
CREATE INDEX IF NOT EXISTS idx_recibos_tipo ON recibos(tipo);
CREATE INDEX IF NOT EXISTS idx_recibos_cliente ON recibos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_recibos_proveedor ON recibos(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_recibos_fecha ON recibos(fecha);
CREATE INDEX IF NOT EXISTS idx_recibos_estado ON recibos(estado);

-- Tabla: recibo_imputaciones
CREATE TABLE IF NOT EXISTS recibo_imputaciones (
    id SERIAL PRIMARY KEY,
    recibo_id INTEGER NOT NULL REFERENCES recibos(id) ON DELETE CASCADE,
    venta_id INTEGER REFERENCES facturas(id) ON DELETE SET NULL,  -- Si es cobro
    compra_id INTEGER REFERENCES compras(id) ON DELETE SET NULL,  -- Si es pago
    monto_imputado NUMERIC(12, 2) NOT NULL
);

-- Índices para recibo_imputaciones
CREATE INDEX IF NOT EXISTS idx_recibo_imputaciones_recibo ON recibo_imputaciones(recibo_id);
CREATE INDEX IF NOT EXISTS idx_recibo_imputaciones_venta ON recibo_imputaciones(venta_id);
CREATE INDEX IF NOT EXISTS idx_recibo_imputaciones_compra ON recibo_imputaciones(compra_id);

-- Comentario de las tablas
COMMENT ON TABLE recibos IS 'Recibos de cobros a clientes y pagos a proveedores';
COMMENT ON TABLE recibo_imputaciones IS 'Imputaciones de recibos a facturas específicas';

-- Column comments
COMMENT ON COLUMN recibos.tipo IS 'cobro (entrada de dinero) o pago (salida de dinero)';
COMMENT ON COLUMN recibos.medio_pago IS 'efectivo, transferencia, cheque, tarjeta';
COMMENT ON COLUMN recibos.estado IS 'registrado (activo) o anulado';
COMMENT ON COLUMN recibo_imputaciones.venta_id IS 'FK a factura de venta (solo para cobros)';
COMMENT ON COLUMN recibo_imputaciones.compra_id IS 'FK a factura de compra (solo para pagos)';
