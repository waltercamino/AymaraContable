-- =================================================================
-- MIGRACIÓN: Agregar campo costo_anterior en detalle_compras
-- =================================================================
-- PROPÓSITO:
--   Guardar el costo del producto ANTES de cada compra para poder
--   restaurarlo exactamente al anular la compra.
--
-- PROBLEMA QUE RESUELVE:
--   Sin este campo, al anular una compra el sistema busca la última
--   compra anterior, pero puede no existir o ser incorrecta.
--
-- SOLUCIÓN:
--   Guardar el costo_anterior en el detalle de la compra al crearla.
--   Al anular, se restaura ese costo exacto.
-- =================================================================

-- 1. Agregar columna costo_anterior
ALTER TABLE compra_detalles 
ADD COLUMN IF NOT EXISTS costo_anterior NUMERIC(12,2);

-- 2. Verificar que se agregó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'compra_detalles'
ORDER BY ordinal_position;

-- 3. Ver datos de ejemplo (después de crear una compra)
-- SELECT 
--     id,
--     compra_id,
--     producto_id,
--     cantidad,
--     costo_unitario,
--     costo_anterior,
--     subtotal
-- FROM compra_detalles
-- ORDER BY id DESC
-- LIMIT 10;

-- =================================================================
-- TEST MANUAL
-- =================================================================
-- 1. Ejecutar este SQL en pgAdmin
-- 2. Crear una compra con productos
-- 3. Verificar que costo_anterior se guardó:
--    SELECT * FROM compra_detalles ORDER BY id DESC LIMIT 5;
-- 4. Anular la compra
-- 5. Verificar que el costo del producto se restauró correctamente
-- =================================================================

-- Resultado esperado:
-- | id | compra_id | producto_id | cantidad | costo_unitario | costo_anterior | subtotal |
-- |----|-----------|-------------|----------|----------------|----------------|----------|
-- | 1  | 1         | 5           | 10       | 25000.00       | 15000.00       | 250000   |
-- 
-- Al anular: costo_promedio del producto vuelve a $15.000 ✅
