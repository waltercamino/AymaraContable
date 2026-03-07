-- Migración 012: Agregar restricción UNIQUE a categoria.nombre
-- Para evitar categorías duplicadas

-- Primero, eliminar duplicados si los hubiera (mantener el de menor id)
DELETE FROM categorias a USING categorias b
WHERE a.id > b.id AND a.nombre = b.nombre;

-- Agregar restricción UNIQUE
ALTER TABLE categorias ADD CONSTRAINT categorias_nombre_unique UNIQUE (nombre);

-- Verificar que la restricción se creó
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'categorias' AND constraint_name = 'categorias_nombre_unique';
