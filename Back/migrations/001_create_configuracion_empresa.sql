-- ============================================
-- MIGRACIÓN: Configuración de Empresa
-- ============================================
-- Descripción: Agrega la tabla configuracion_empresa para almacenar
--              los datos de la empresa (nombre, CUIT, logo, etc.)
-- Fecha: 2026-03-01
-- ============================================

-- Crear tabla configuracion_empresa
CREATE TABLE IF NOT EXISTS configuracion_empresa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_empresa VARCHAR(200) NOT NULL,
    cuit VARCHAR(20),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(500),
    pie_factura TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración inicial por defecto
INSERT OR IGNORE INTO configuracion_empresa (
    id,
    nombre_empresa,
    cuit,
    direccion,
    telefono,
    email,
    logo_url,
    pie_factura,
    creado_en,
    actualizado_en
) VALUES (
    1,
    'AYMARA CONTABLE',
    '',
    '',
    '',
    '',
    '',
    'Gracias por su compra.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT * FROM configuracion_empresa;
