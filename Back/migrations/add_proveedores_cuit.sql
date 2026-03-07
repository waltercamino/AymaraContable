-- Migración: Agregar campo CUIT a Proveedores
-- Fecha: 2026-03-01
-- Descripción: Agrega columna cuit para consistencia con el modelo Cliente

-- 1. Agregar columna cuit (si no existe)
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS cuit VARCHAR(20);

-- 2. Verificar que se agregó
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'proveedores' 
AND column_name = 'cuit';

-- 3. Notas:
-- - La columna es nullable para mantener compatibilidad con datos existentes
-- - Se recomienda completar los CUITs de proveedores existentes manualmente
-- - El frontend ya espera este campo en el resumen de acreedores
