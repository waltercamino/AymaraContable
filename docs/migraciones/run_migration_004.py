"""
Script para ejecutar la migración 004: margen_personalizado e historial_margenes
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
    print("=== MIGRACIÓN 004: margen_personalizado e historial_margenes ===")
    
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
        
        # Leer el archivo SQL
        migration_path = os.path.join(os.path.dirname(__file__), 'migrations', '004_add_margen_personalizado_historial.sql')
        with open(migration_path, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Ejecutar cada statement por separado (ignorar comentarios y comandos psql)
        statements = []
        current_statement = ""
        
        for line in sql_content.split('\n'):
            # Ignorar comentarios y comandos psql
            if line.strip().startswith('--') or line.strip().startswith('\\'):
                continue
            current_statement += line + '\n'
            if ';' in line:
                statements.append(current_statement.strip())
                current_statement = ""
        
        # Ejecutar statements
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
        
        # Verificar estructura
        print("\nVerificando estructura...")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'productos' AND column_name IN ('margen_personalizado', 'precio_venta')
            ORDER BY ordinal_position
        """)
        print("\nColumnas en productos:")
        for row in cursor.fetchall():
            print(f"  - {row[0]}: {row[1]} (nullable: {row[2]})")
        
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'historial_margenes'
            ORDER BY ordinal_position
        """)
        print("\nColumnas en historial_margenes:")
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
