-- ============================================
-- FIX: Eliminar FK rota en cuenta_corriente.venta_id
-- Problema: FK apunta a tabla 'ventas' que ya no existe
-- Solución: Cambiar FK para que apunte a 'facturas'
-- ============================================

-- 1. Eliminar FK antigua (si existe)
ALTER TABLE cuenta_corriente 
DROP CONSTRAINT IF EXISTS cuenta_corriente_venta_id_fkey;

-- 2. Agregar nueva FK apuntando a facturas (la tabla correcta)
ALTER TABLE cuenta_corriente 
ADD CONSTRAINT cuenta_corriente_venta_id_fkey 
FOREIGN KEY (venta_id) REFERENCES facturas(id);

-- 3. Verificar que no queden FKs hacia 'ventas'
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'cuenta_corriente'::regclass 
AND confrelid = 'ventas'::regclass;
-- Resultado esperado: 0 filas

-- 4. Verificar nueva FK hacia 'facturas'
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'cuenta_corriente'::regclass 
AND confrelid = 'facturas'::regclass;
-- Resultado esperado: cuenta_corriente_venta_id_fkey

-- ============================================
-- NOTA: La columna venta_id se mantiene por compatibilidad
-- pero ahora apunta correctamente a facturas.id
-- ============================================
