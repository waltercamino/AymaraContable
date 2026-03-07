-- ============================================
-- MIGRACIÓN 002: Campos adicionales en Productos
-- ============================================
-- Para ejecutar en PostgreSQL

-- 1. Agregar columnas de IVA a productos (SOLO flags informativos)
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS iva_compra BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS iva_venta BOOLEAN DEFAULT FALSE;

-- NOTA: NO agregar 'con_iva' porque es propiedad de la TRANSACCIÓN, no del producto
-- - compras.con_iva: si ESA compra tiene IVA discriminado
-- - ventas.con_iva: si ESA venta tiene IVA (default false para monotributistas)

-- 2. Verificar estructura
\d productos

-- 3. Verificar datos
SELECT id, nombre, costo_promedio, iva_compra, iva_venta 
FROM productos 
LIMIT 10;

-- ============================================
-- MIGRACIÓN 002b: Listas de Precios
-- ============================================

-- 1. Crear tabla listas_precios si no existe
CREATE TABLE IF NOT EXISTS listas_precios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    tipo VARCHAR(20),  -- Legacy, nullable
    tipo_cliente VARCHAR(20) NOT NULL DEFAULT 'todos',  -- 'minorista' | 'mayorista' | 'todos'
    categorias_incluidas JSONB DEFAULT '[]',  -- Array de IDs de categorías
    vigencia_desde DATE NOT NULL DEFAULT CURRENT_DATE,
    vigencia_hasta DATE,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla detalles_lista_precios si no existe
CREATE TABLE IF NOT EXISTS detalles_lista_precios (
    id SERIAL PRIMARY KEY,
    lista_precios_id INTEGER REFERENCES listas_precios(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    costo_compra NUMERIC(10,2) NOT NULL,
    margen_porcentaje NUMERIC(5,2) NOT NULL,
    precio_venta NUMERIC(10,2) NOT NULL,
    unidad_venta VARCHAR(20) NOT NULL,
    UNIQUE(lista_precios_id, producto_id)
);

-- 3. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_listas_precios_tipo_cliente ON listas_precios(tipo_cliente);
CREATE INDEX IF NOT EXISTS idx_listas_precios_activa ON listas_precios(activa);
CREATE INDEX IF NOT EXISTS idx_detalles_lista_producto ON detalles_lista_precios(producto_id);
CREATE INDEX IF NOT EXISTS idx_detalles_lista_lista ON detalles_lista_precios(lista_precios_id);

-- 4. Verificar estructura
\d listas_precios
\d detalles_lista_precios

-- 5. Verificar datos
SELECT id, nombre, tipo_cliente, categorias_incluidas, activa 
FROM listas_precios 
ORDER BY creado_en DESC;
