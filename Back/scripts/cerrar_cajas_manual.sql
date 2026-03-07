-- ============================================
-- SCRIPT PARA CERRAR CAJAS ABIERTAS MANUALMENTE
-- ============================================
-- Usar ESTE SCRIPT con precaución:
-- 1. Verificar qué cajas están abiertas
-- 2. Cerrarlas con saldo_final = saldo_inicial (si no hay movimientos)
-- 3. Solo usar si el frontend no permite cerrarlas

-- Paso 1: Ver cajas abiertas actuales
SELECT 
    id,
    fecha,
    saldo_inicial,
    saldo_final,
    estado,
    fecha_apertura,
    fecha_cierre,
    observaciones_cierre
FROM caja_dia
WHERE estado = 'abierto'
ORDER BY fecha DESC;

-- Paso 2: Cerrar cajas (ajustar saldo_final según corresponda)
-- OPCIÓN A: Si NO hay movimientos, usar saldo_inicial como saldo_final
UPDATE caja_dia
SET 
    estado = 'cerrado',
    saldo_final = saldo_inicial,
    fecha_cierre = NOW(),
    observaciones_cierre = 'Cierre manual desde SQL - Sin movimientos'
WHERE estado = 'abierto';

-- OPCIÓN B: Si HAY movimientos, primero calcular el saldo
-- (Ejecutar solo si conoce el saldo final correcto)
-- UPDATE caja_dia
-- SET 
--     estado = 'cerrado',
--     saldo_final = [VALOR_CORRECTO],
--     fecha_cierre = NOW(),
--     observaciones_cierre = 'Cierre manual desde SQL - Con movimientos'
-- WHERE estado = 'abierto';

-- Paso 3: Verificar cierre
SELECT 
    id,
    fecha,
    estado,
    saldo_final,
    fecha_cierre,
    observaciones_cierre
FROM caja_dia
WHERE estado = 'cerrado'
ORDER BY fecha DESC
LIMIT 10;
