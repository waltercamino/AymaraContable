"""
Migración: Agregar tabla caja_dia para apertura/cierre de caja
"""
import os
import re
from dotenv import load_dotenv
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

load_dotenv()

# Parse DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres@localhost:5432/sistema_contable")
match = re.match(r'postgresql://([^:@]+)(?::([^@]+))?@([^:]+):(\d+)/(.+)', DATABASE_URL)
if match:
    DB_USER = match.group(1)
    DB_PASSWORD = match.group(2) or ""
    DB_HOST = match.group(3)
    DB_PORT = match.group(4)
    DB_NAME = match.group(5)
else:
    DB_HOST = "localhost"
    DB_PORT = "5432"
    DB_NAME = "sistema_contable"
    DB_USER = "postgres"
    DB_PASSWORD = ""

def run_migration():
    print("=== MIGRACIÓN: Agregar tabla caja_dia ===")

    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        print(f"Conectado a {DB_NAME}@{DB_HOST}:{DB_PORT}")

        # Crear tabla caja_dia
        print("Creando tabla caja_dia...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS caja_dia (
                id SERIAL PRIMARY KEY,
                fecha DATE NOT NULL UNIQUE,
                saldo_inicial NUMERIC(12,2) DEFAULT 0,
                saldo_final NUMERIC(12,2),
                estado VARCHAR(20) DEFAULT 'abierto',
                usuario_id INTEGER,
                fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_cierre TIMESTAMP,
                observaciones_cierre TEXT,
                creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  ✅ Tabla caja_dia creada")

        # Agregar columna usuario_id en movimientos_caja si no existe
        print("Verificando columna usuario_id en movimientos_caja...")
        cursor.execute("""
            ALTER TABLE movimientos_caja 
            ADD COLUMN IF NOT EXISTS usuario_id INTEGER
        """)
        print("  ✅ Columna usuario_id agregada/verificada")

        # Verificar categorías existentes
        print("\nVerificando categorías de caja...")
        categorias = [
            ("Venta Minorista", "ingreso", "efectivo"),
            ("Venta Minorista - Transferencia", "ingreso", "transferencia"),
            ("Cobro Cta. Cte.", "ingreso", "cta_cte"),
            ("Pago Proveedor", "egreso", "proveedor"),
            ("Impuestos", "egreso", "impuestos"),
            ("Alquiler", "egreso", "alquiler"),
            ("Servicios", "egreso", "servicios"),
            ("Insumos", "egreso", "insumos"),
            ("Reparaciones", "egreso", "mantenimiento"),
            ("Retiro Personal", "egreso", "personal"),
        ]
        
        for nombre, tipo, subcat in categorias:
            cursor.execute("""
                INSERT INTO categorias_caja (nombre, tipo, subcategoria)
                VALUES (%s, %s, %s)
                ON CONFLICT (nombre) DO NOTHING
            """, (nombre, tipo, subcat))
        
        print(f"  ✅ {len(categorias)} categorías verificadas/creadas")

        cursor.close()
        conn.close()

        print("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!")

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
