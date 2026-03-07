-- =================================================================
-- MIGRACIÓN: Agregar campos de auditoría de anulación en compras
-- =================================================================
-- PROPÓSITO:
--   Registrar quién anuló la FC, cuándo y por qué motivo
--   Para trazabilidad y auditoría del sistema
-- =================================================================

-- 1. Agregar columnas de auditoría
ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS anulado_por INTEGER REFERENCES usuarios(id);

ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMP;

ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS motivo_anulacion VARCHAR(500);

ALTER TABLE compras 
ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 2. Hacer usuario_id nullable (por si hay compras sin usuario)
ALTER TABLE compras 
ALTER COLUMN usuario_id DROP NOT NULL;

-- 3. Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'compras'
ORDER BY ordinal_position;

-- 4. Datos de ejemplo después de anular una FC
-- SELECT 
--     id,
--     numero_interno,
--     numero_factura,
--     estado,
--     anulado_por,
--     fecha_anulacion,
--     motivo_anulacion
-- FROM compras
-- WHERE estado = 'anulada';

-- =================================================================
-- TEST MANUAL
-- =================================================================
-- 1. Ejecutar este SQL en pgAdmin
-- 2. Reiniciar backend
-- 3. Probar GET /api/fc-compra/ → Debe devolver 200 OK
-- 4. Crear FC → Estado: 'registrada'
-- 5. Anular FC → Estado: 'anulada', anulado_por: ID usuario, motivo: texto
-- =================================================================
