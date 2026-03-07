"""
Script para agregar columnas de auditoría de anulación a la tabla recibos
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
    print("=== MIGRACIÓN: add auditoría de anulación a recibos ===")

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

        # Ejecutar migration para agregar columnas de auditoría
        print("Ejecutando ALTER TABLE recibos...")
        
        # Columna: anulado_por
        print("  Agregando columna anulado_por...")
        cursor.execute("""
            ALTER TABLE recibos 
            ADD COLUMN IF NOT EXISTS anulado_por INTEGER
        """)
        
        # Columna: fecha_anulacion
        print("  Agregando columna fecha_anulacion...")
        cursor.execute("""
            ALTER TABLE recibos 
            ADD COLUMN IF NOT EXISTS fecha_anulacion TIMESTAMP
        """)
        
        # Columna: motivo_anulacion
        print("  Agregando columna motivo_anulacion...")
        cursor.execute("""
            ALTER TABLE recibos 
            ADD COLUMN IF NOT EXISTS motivo_anulacion VARCHAR(500)
        """)
        
        print("  ✅ Columnas agregadas")

        # Verificar estructura
        print("\nVerificando estructura...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'recibos'
            ORDER BY ordinal_position
        """)
        print("\nColumnas en recibos:")
        for row in cursor.fetchall():
            default_val = row[3] if row[3] else 'NULL'
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]}, default: {default_val})")

        cursor.close()
        conn.close()

        print("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!")
        print("\n⚠️ IMPORTANTE: Reiniciar el servidor backend para que los cambios surtan efecto")

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
