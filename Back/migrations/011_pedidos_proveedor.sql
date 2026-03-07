-- Migración: Tablas de Pedidos a Proveedores
-- Permite gestionar pedidos/solicitudes sin impacto contable

-- 1. Tabla pedidos_proveedor
CREATE TABLE IF NOT EXISTS pedidos_proveedor (
    id SERIAL PRIMARY KEY,
    numero_interno VARCHAR(20) UNIQUE NOT NULL,
    fecha_pedido DATE DEFAULT CURRENT_DATE,
    proveedor_id INTEGER REFERENCES proveedores(id),
    estado VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, enviado, recibido, cancelado
    total_estimado NUMERIC(12,2) DEFAULT 0,
    observaciones TEXT,
    usuario_id INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    recibido_en TIMESTAMP,
    fecha_entrega_estimada DATE
);

-- 2. Tabla pedido_detalles
CREATE TABLE IF NOT EXISTS pedido_detalles (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER REFERENCES pedidos_proveedor(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_costo NUMERIC(12,2),
    subtotal NUMERIC(12,2),
    recibido_cantidad INTEGER DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'pendiente'  -- pendiente, recibido, cancelado
);

-- 3. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pedidos_proveedor ON pedidos_proveedor(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos_proveedor(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos_proveedor(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_detalles_pedido ON pedido_detalles(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_detalles_producto ON pedido_detalles(producto_id);

-- 4. Comentario descriptivo
COMMENT ON TABLE pedidos_proveedor IS 'Pedidos/solicitudes a proveedores (no registra deuda)';
COMMENT ON TABLE pedido_detalles IS 'Detalle de productos en cada pedido';
