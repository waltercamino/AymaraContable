-- ============================================
-- MIGRACIÓN 004: Margen personalizado y historial
-- ============================================
-- Para ejecutar en PostgreSQL

-- 1. Agregar campo margen_personalizado a productos (NULL = usa categoría)
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS margen_personalizado NUMERIC(5,2);

-- 2. Crear tabla historial_margenes (auditoría de cambios)
CREATE TABLE IF NOT EXISTS historial_margenes (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    margen_anterior NUMERIC(5,2),
    margen_nuevo NUMERIC(5,2),
    precio_costo_anterior NUMERIC(10,2),
    precio_costo_nuevo NUMERIC(10,2),
    precio_venta_anterior NUMERIC(10,2),
    precio_venta_nuevo NUMERIC(10,2),
    usuario_id INTEGER REFERENCES usuarios(id),
    motivo VARCHAR(200),  -- 'manual', 'actualizacion_masiva', 'oferta', etc.
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_historial_margenes_producto ON historial_margenes(producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_margenes_fecha ON historial_margenes(creado_en DESC);

-- 4. Verificar estructura
\d productos
\d historial_margenes

-- 5. Verificar datos
SELECT id, nombre, costo_promedio, precio_venta, margen_personalizado
FROM productos
ORDER BY nombre
LIMIT 20;

-- ============================================
-- NOTAS DE NEGOCIO
-- ============================================
-- - margen_personalizado NULL: usa margen_default_minorista de categoría
-- - margen_personalizado valor: override individual (flexibilidad para ofertas)
-- - historial_margenes: auditoría completa (quién, cuándo, qué, motivo)
-- - costo_promedio: solo se actualiza al recibir compras (integridad)
-- - precio_venta: costo * (1 + margen/100) con redondeo Argentina ($499, $990, $1000)
