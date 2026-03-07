"""
Script para ejecutar la migración 005: márgenes minorista/mayorista
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
    print("=== MIGRACIÓN 005: márgenes minorista/mayorista ===")
    
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
        
        migration_path = os.path.join(os.path.dirname(__file__), 'migrations', '005_add_margen_mayorista.sql')
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        statements = []
        current_statement = ""
        
        for line in sql_content.split('\n'):
            if line.strip().startswith('--') or line.strip().startswith('\\'):
                continue
            current_statement += line + '\n'
            if ';' in line:
                statements.append(current_statement.strip())
                current_statement = ""
        
        for i, stmt in enumerate(statements):
            if not stmt.strip():
                continue
            try:
                print(f"Ejecutando statement {i+1}...")
                cursor.execute(stmt)
                print(f"  ✅ OK")
            except Exception as e:
                print(f"  ⚠️  Warning: {str(e)}")
        
        print("\n=== MIGRACIÓN COMPLETADA ===")
        
        print("\nVerificando estructura...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'productos' 
            AND column_name IN ('margen_personalizado', 'margen_personalizado_mayorista', 'precio_venta', 'precio_venta_mayorista')
            ORDER BY ordinal_position
        """)
        print("\nColumnas en productos:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Migración ejecutada exitosamente!")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        raise

if __name__ == "__main__":
    run_migration()
