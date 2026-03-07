-- ============================================
-- LIMPIEZA DE DATOS DE PRUEBA - CAJA
-- ============================================
-- Ejecutar SOLO en entorno de desarrollo/pruebas
-- ============================================

-- ============================================
-- OPCIÓN 1: Limpieza completa (recomendado)
-- ============================================
-- Elimina TODOS los movimientos y reinicia IDs
TRUNCATE TABLE movimientos_caja RESTART IDENTITY CASCADE;

-- ============================================
-- OPCIÓN 2: Resetear solo caja abierta
-- ============================================
-- Si hay caja abierta, la cierra sin saldo final
-- UPDATE caja_dia 
-- SET estado = 'cerrado', 
--     saldo_final = 0, 
--     fecha_cierre = NOW(),
--     observaciones_cierre = 'Cierre por limpieza de datos de prueba'
-- WHERE estado = 'abierto';

-- ============================================
-- OPCIÓN 3: Eliminar por rango de fechas
-- ============================================
-- Elimina movimientos de un período específico
-- DELETE FROM movimientos_caja 
-- WHERE fecha >= '2026-01-01' AND fecha <= '2026-12-31';

-- ============================================
-- VERIFICACIÓN POST-LIMPIEZA
-- ============================================

-- 1. Verificar que no haya movimientos
SELECT COUNT(*) as total_movimientos FROM movimientos_caja;

-- 2. Verificar estado de cajas
SELECT 
    fecha, 
    estado, 
    saldo_inicial, 
    saldo_final 
FROM caja_dia 
ORDER BY fecha DESC 
LIMIT 10;

-- 3. Verificar categorías (deberían estar las 14 del seed)
SELECT tipo, COUNT(*) as cantidad 
FROM categorias_caja 
GROUP BY tipo;

-- ============================================
-- REINICIAR SECUENCIA (si es necesario)
-- ============================================
-- Reinicia el ID de movimientos para que comience desde 1
-- SELECT setval('movimientos_caja_id_seq', 1, false);
