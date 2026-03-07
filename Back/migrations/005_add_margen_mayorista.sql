-- ============================================
-- MIGRACIÓN 005: Márgenes separados (Minorista/Mayorista)
-- ============================================
-- Para ejecutar en PostgreSQL

-- 1. Agregar campo margen_personalizado_mayorista a productos
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS margen_personalizado_mayorista NUMERIC(5,2);

-- 2. Agregar campo precio_venta_mayorista (opcional, para futuro)
ALTER TABLE productos
ADD COLUMN IF NOT EXISTS precio_venta_mayorista NUMERIC(10,2) DEFAULT 0;

-- 3. Verificar estructura
\d productos

-- 4. Verificar datos
SELECT id, nombre, costo_promedio, precio_venta, margen_personalizado, margen_personalizado_mayorista
FROM productos
ORDER BY nombre
LIMIT 20;

-- ============================================
-- NOTAS DE NEGOCIO
-- ============================================
-- - margen_personalizado: para minorista (ya existía)
-- - margen_personalizado_mayorista: NUEVO - para mayorista
-- - NULL = usa margen_default de categoría
-- - precio_venta: precio minorista (ya existía)
-- - precio_venta_mayorista: precio mayorista (futuro uso)
