-- ============================================
-- VERIFICACIÓN DE DATOS PARA REPORTE DE GANANCIA
-- ============================================

-- 1. Ver qué valores distintos hay en tipo_comprobante
SELECT DISTINCT tipo_comprobante 
FROM facturas 
ORDER BY tipo_comprobante;

-- 2. Ver cuántas facturas hay por tipo
SELECT 
    tipo_comprobante, 
    COUNT(*) as cantidad,
    SUM(total) as total_facturado
FROM facturas 
WHERE estado = 'emitida'
GROUP BY tipo_comprobante 
ORDER BY cantidad DESC;

-- 3. Ver facturas de VENTA (las que deberían usarse para ganancia)
SELECT 
    tipo_comprobante,
    COUNT(*) as cantidad_ventas,
    SUM(total) as total_ventas
FROM facturas 
WHERE estado = 'emitida'
  AND tipo_comprobante IN ('FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND')
GROUP BY tipo_comprobante 
ORDER BY cantidad_ventas DESC;

-- 4. Verificar que hay costo_unitario cargado en factura_detalles
SELECT 
    COUNT(*) as total_detalles,
    COUNT(costo_unitario) as detalles_con_costo,
    SUM(costo_unitario * cantidad) as costo_total_ventas
FROM factura_detalles fd
JOIN facturas f ON fd.factura_id = f.id
WHERE f.estado = 'emitida'
  AND f.tipo_comprobante IN ('FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND');

-- 5. Verificar cálculo manual de ganancia para un período
SELECT 
    'Ventas' as concepto,
    COUNT(DISTINCT f.id) as cantidad_facturas,
    SUM(f.total) as monto_total
FROM facturas f
WHERE f.estado = 'emitida'
  AND f.tipo_comprobante IN ('FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND')
  AND f.fecha >= '2026-02-01'
  AND f.fecha <= '2026-02-28'

UNION ALL

SELECT 
    'Costo Ventas' as concepto,
    COUNT(DISTINCT fd.factura_id) as cantidad_detalles,
    SUM(fd.costo_unitario * fd.cantidad) as costo_total
FROM factura_detalles fd
JOIN facturas f ON fd.factura_id = f.id
WHERE f.estado = 'emitida'
  AND f.tipo_comprobante IN ('FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND')
  AND f.fecha >= '2026-02-01'
  AND f.fecha <= '2026-02-28'
  AND fd.costo_unitario IS NOT NULL;

-- 6. Cálculo completo de ganancia (para verificar con el endpoint)
SELECT 
    SUM(f.total) as monto_ventas,
    COALESCE(SUM(fd.costo_unitario * fd.cantidad), 0) as costo_ventas,
    SUM(f.total) - COALESCE(SUM(fd.costo_unitario * fd.cantidad), 0) as ganancia_bruta,
    ROUND(
        (SUM(f.total) - COALESCE(SUM(fd.costo_unitario * fd.cantidad), 0)) / 
        NULLIF(SUM(f.total), 0) * 100, 
        2
    ) as margen_porcentaje,
    COUNT(DISTINCT f.id) as total_facturas
FROM facturas f
LEFT JOIN factura_detalles fd ON f.id = fd.factura_id
WHERE f.estado = 'emitida'
  AND f.tipo_comprobante IN ('FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND')
  AND f.fecha >= '2026-02-01'
  AND f.fecha <= '2026-02-28';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- 1. El endpoint /ganancia usa estos tipos de comprobante:
--    ['FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND']
--
-- 2. Si faltan ventas en el cálculo, verificar:
--    SELECT DISTINCT tipo_comprobante FROM facturas;
--    Y agregar los tipos que falten al endpoint
--
-- 3. Si la ganancia parece incorrecta, verificar:
--    - Que haya costo_unitario cargado en factura_detalles
--    - Que los costos sean correctos (no cero o negativos)
--
-- ============================================
