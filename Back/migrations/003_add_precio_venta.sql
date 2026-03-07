-- ============================================
-- MIGRACIÓN 003: Agregar precio_venta y redondeo
-- ============================================
-- Para ejecutar en PostgreSQL

-- 1. Agregar campo precio_venta (para actualización masiva directa)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS precio_venta NUMERIC(10,2) DEFAULT 0;

-- 2. Inicializar precio_venta con costo_promedio * (1 + margen/100)
UPDATE productos p
SET precio_venta = ROUND(p.costo_promedio * (1 + c.margen_default_minorista / 100), 2)
FROM categorias c
WHERE p.categoria_id = c.id AND p.precio_venta = 0;

-- 3. Verificar estructura
\d productos

-- 4. Verificar datos
SELECT id, nombre, costo_promedio, precio_venta 
FROM productos 
ORDER BY nombre
LIMIT 20;

-- ============================================
-- EJEMPLOS DE REDONDEO (ARGENTINA)
-- ============================================

-- Redondeo psicológico (99): $473 → $499, $527 → $499, $985 → $999
UPDATE productos 
SET precio_venta = ROUND(precio_venta / 100) * 100 - 1 
WHERE precio_venta > 0;

-- Redondeo a 50: $473 → $450, $527 → $550, $985 → $1000
UPDATE productos 
SET precio_venta = ROUND(precio_venta / 50) * 50 
WHERE precio_venta > 0;

-- Redondeo a 90: $473 → $490, $527 → $490, $985 → $990
UPDATE productos 
SET precio_venta = ROUND(precio_venta / 100) * 100 - 10 
WHERE precio_venta > 0;

-- Redondeo a 100: $473 → $500, $527 → $500, $985 → $1000
UPDATE productos 
SET precio_venta = ROUND(precio_venta / 100) * 100 
WHERE precio_venta > 0;

-- ============================================
-- TEST DE ACTUALIZACIÓN MASIVA
-- ============================================

-- Verificar precios actuales
SELECT id, nombre, costo_promedio, precio_venta 
FROM productos 
WHERE precio_venta > 0
ORDER BY precio_venta DESC
LIMIT 10;
