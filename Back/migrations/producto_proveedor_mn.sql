-- Migración: Relación M:N Producto-Proveedor
-- Fecha: 2026-03-01
-- Descripción: Crea tabla intermedia para permitir múltiples proveedores por producto

-- 1. Crear tabla intermedia producto_proveedor
CREATE TABLE IF NOT EXISTS producto_proveedor (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE CASCADE,
    costo_compra NUMERIC(10,2),
    es_principal BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, proveedor_id)
);

-- 2. Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_producto_proveedor_producto ON producto_proveedor(producto_id);
CREATE INDEX IF NOT EXISTS idx_producto_proveedor_proveedor ON producto_proveedor(proveedor_id);

-- 3. Migrar datos existentes (el proveedor actual pasa a ser "principal")
INSERT INTO producto_proveedor (producto_id, proveedor_id, es_principal)
SELECT id, proveedor_id, TRUE 
FROM productos 
WHERE proveedor_id IS NOT NULL
ON CONFLICT (producto_id, proveedor_id) DO NOTHING;

-- 4. Opcional: Comentar pero NO eliminar proveedor_id de productos (backward compatibility)
-- ALTER TABLE productos DROP COLUMN proveedor_id;

-- 5. Verificar migración
SELECT 
    p.nombre AS producto,
    COUNT(pp.proveedor_id) AS cantidad_proveedores,
    STRING_AGG(prv.nombre, ', ') AS proveedores
FROM productos p
LEFT JOIN producto_proveedor pp ON p.id = pp.producto_id
LEFT JOIN proveedores prv ON pp.proveedor_id = prv.id
GROUP BY p.id, p.nombre
ORDER BY cantidad_proveedores DESC;

-- Notas:
-- - Si hay conflicto de UNIQUE, se ignora (ON CONFLICT DO NOTHING)
-- - es_principal = TRUE para el proveedor histórico
-- - proveedor_id en productos se mantiene como fallback (no se elimina)
