"""
Script para ejecutar la migración 012: restricción UNIQUE en categoria.nombre
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
    print("=== MIGRACIÓN 012: UNIQUE en categoria.nombre ===")

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

        migration_path = os.path.join(os.path.dirname(__file__), 'migrations', '012_add_unique_nombre_categoria.sql')
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        print("Ejecutando SQL...")
        cursor.execute(sql_content)
        
        # Verificar resultados
        result = cursor.fetchone()
        if result:
            print(f"✅ Restricción creada: {result[0]}")
        
        print("✅ Migración completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    run_migration()
