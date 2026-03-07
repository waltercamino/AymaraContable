-- ============================================================
-- LIMPIEZA DE TABLAS LEGACY - VENTAS
-- ============================================================
-- Este script elimina las tablas legacy del sistema de ventas
-- que fueron reemplazadas por el módulo FC Venta (facturas)
--
-- PRE-REQUISITOS:
-- 1. Haber ejecutado migrar_ventas_a_facturas.py
-- 2. Verificar que todos los datos estén en facturas/factura_detalles
-- 3. Tener backup reciente de la base de datos
--
-- FECHA: 2026-02-25
-- ============================================================

-- Verificar cantidad de registros antes de eliminar
SELECT 
    'ventas' as tabla, 
    COUNT(*) as cantidad 
FROM ventas
UNION ALL
SELECT 
    'venta_detalles' as tabla, 
    COUNT(*) as cantidad 
FROM venta_detalles;

-- ============================================================
-- ⚠️ EJECUTAR SOLO DESPUÉS DE VERIFICAR MIGRACIÓN
-- ============================================================

-- Eliminar tablas legacy (en orden correcto por foreign keys)
DROP TABLE IF EXISTS venta_detalles CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;

-- Verificar eliminación
SELECT 
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('ventas', 'venta_detalles');

-- Si devuelve 0 filas, las tablas fueron eliminadas correctamente

-- ============================================================
-- NOTAS:
-- - Las tablas facturas y factura_detalles NO se modifican
-- - Los datos migrados permanecen en el sistema
-- - El código legacy fue eliminado en la FASE 3
-- ============================================================
