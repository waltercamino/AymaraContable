-- Migration: Add mostrar_precio_kilo field to productos table
-- Date: 2026-03-07
-- Description: Add optional field to show price per kilo on labels for GRAMO products

ALTER TABLE productos ADD COLUMN mostrar_precio_kilo BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN productos.mostrar_precio_kilo IS 'Mostrar precio por kilo en etiquetas (solo para productos con unidad_medida = GRAMO)';
