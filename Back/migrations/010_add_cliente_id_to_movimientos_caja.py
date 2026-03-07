"""
Migración: Agregar cliente_id a movimientos_caja
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
    print("=== MIGRACIÓN: Agregar cliente_id a movimientos_caja ===")

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

        # Verificar si ya existe cliente_id
        print("Verificando columna cliente_id...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'movimientos_caja' 
            AND column_name = 'cliente_id'
        """)
        
        result = cursor.fetchone()
        
        if result:
            print("  ℹ️  Columna cliente_id ya existe")
        else:
            # Agregar columna cliente_id
            print("  Agregando columna cliente_id...")
            cursor.execute("""
                ALTER TABLE movimientos_caja 
                ADD COLUMN cliente_id INTEGER REFERENCES clientes(id)
            """)
            print("  ✅ Columna cliente_id agregada")

        # Verificar proveedor_id también (por consistencia)
        print("\nVerificando columna proveedor_id...")
        cursor.execute("""
            SELECT column_name, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'movimientos_caja' 
            AND column_name = 'proveedor_id'
        """)
        
        result = cursor.fetchone()
        if result:
            is_nullable = result[1]
            if is_nullable == 'NO':
                print("  Haciendo proveedor_id nullable...")
                cursor.execute("""
                    ALTER TABLE movimientos_caja 
                    ALTER COLUMN proveedor_id DROP NOT NULL
                """)
                print("  ✅ proveedor_id ahora es nullable")
            else:
                print("  ✅ proveedor_id ya es nullable")
        else:
            print("  ⚠️  proveedor_id no existe")

        cursor.close()
        conn.close()

        print("\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!")
        print("\n⚠️ IMPORTANTE: Reiniciar el backend para que los cambios surtan efecto")

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
