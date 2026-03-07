-- Migración: Eliminar campo `activo` de Clientes
-- Fecha: 2026-03-01
-- Descripción: Elimina la columna `activo` de la tabla clientes (hard delete - no más soft delete)

-- 1. Verificar si la columna existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'activo'
    ) THEN
        -- 2. Eliminar la columna
        ALTER TABLE clientes DROP COLUMN activo;
        
        RAISE NOTICE '✅ Columna `activo` eliminada de la tabla `clientes`';
    ELSE
        RAISE NOTICE 'ℹ️ La columna `activo` no existe en la tabla `clientes`';
    END IF;
END $$;

-- 3. Verificar que no haya referencias en el código
-- Nota: Esto es solo informativo, no ejecuta nada
-- Buscar en el backend:
--   - models.py: class Cliente (ya eliminado)
--   - schemas.py: ClienteResponse, ClienteUpdate (ya eliminado)
--   - api/clientes.py: endpoint GET /clientes (ya eliminado filtro activo)

-- 4. Notas importantes:
-- - Los clientes ahora se eliminan físicamente (hard delete) solo si no tienen transacciones
-- - La validación de transacciones está en el endpoint DELETE /clientes/{id}
-- - No hay forma de "desactivar" un cliente, solo se puede eliminar si no tiene uso
