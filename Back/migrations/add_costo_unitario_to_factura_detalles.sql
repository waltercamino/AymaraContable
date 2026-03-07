-- Migration: Add costo_unitario to factura_detalles
-- Execute this in your PostgreSQL database

-- Add costo_unitario column if it doesn't exist
ALTER TABLE factura_detalles 
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(10,2);

-- Verify the column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'factura_detalles' 
-- ORDER BY ordinal_position;
