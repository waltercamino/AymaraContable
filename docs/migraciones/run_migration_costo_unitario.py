"""
Script para ejecutar la migración: add costo_unitario to factura_detalles
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
    print("=== MIGRACIÓN: add costo_unitario to factura_detalles ===")

    try:
        # Conectar a la base de datos
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

        # Ejecutar migration
        print("Ejecutando ALTER TABLE...")
        cursor.execute("""
            ALTER TABLE factura_detalles 
            ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(12,2) DEFAULT 0
        """)
        print("  ✅ Columna costo_unitario agregada")

        # Verificar estructura
        print("\nVerificando estructura...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'factura_detalles'
            ORDER BY ordinal_position
        """)
        print("\nColumnas en factura_detalles:")
        for row in cursor.fetchall():
            default_val = row[3] if row[3] else 'NULL'
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {default_val})")

        cursor.close()
        conn.close()

        print("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!")

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
