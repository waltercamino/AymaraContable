"""
Script para inicializar la configuración de empresa
Ejecutar: python scripts/init_configuracion.py
"""
import sqlite3
import os

# Ruta a la base de datos (ajustar según corresponda)
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "database.sqlite")

def init_configuracion():
    """Inicializa la tabla configuracion_empresa con valores por defecto"""
    
    print(f"🔍 Conectando a la base de datos: {DB_PATH}")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Crear tabla
        print("📝 Creando tabla configuracion_empresa...")
        cursor.execute("""
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
            )
        """)
        
        # Insertar configuración por defecto (solo si no existe)
        print("📝 Insertando configuración por defecto...")
        cursor.execute("""
            INSERT OR IGNORE INTO configuracion_empresa (
                id, nombre_empresa, cuit, direccion, telefono, email, logo_url, pie_factura
            ) VALUES (
                1, 'AYMARA CONTABLE', '', '', '', '', '', 'Gracias por su compra.'
            )
        """)
        
        conn.commit()
        
        # Verificar
        cursor.execute("SELECT * FROM configuracion_empresa")
        rows = cursor.fetchall()
        
        print(f"✅ Tabla creada exitosamente")
        print(f"📊 Registros encontrados: {len(rows)}")
        
        for row in rows:
            print(f"   - ID: {row[0]}, Nombre: {row[1]}")
        
    except sqlite3.Error as e:
        print(f"❌ Error de SQLite: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    finally:
        if conn:
            conn.close()
            print("👋 Conexión cerrada")


if __name__ == "__main__":
    init_configuracion()
