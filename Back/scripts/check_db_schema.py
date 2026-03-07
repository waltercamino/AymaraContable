#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
VERIFICADOR DE ESQUEMA DE BASE DE DATOS
========================================

Este script compara los modelos SQLAlchemy con la base de datos PostgreSQL
y genera automáticamente el SQL de migración necesario.

USO:
----
# Desde la carpeta Back:
.\\venv\\Scripts\\Activate
python scripts\\check_db_schema.py

# O directamente:
python -m scripts.check_db_schema

SALIDA:
-------
- Lista de tablas faltantes
- Lista de columnas faltantes por tabla
- SQL de migración listo para ejecutar en pgAdmin
"""

import sys
import os

# Agregar ruta al padre para imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import verify_schema, generate_migration_sql, Base
from app.config import settings
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)


def print_header(text: str):
    """Imprime un encabezado decorativo"""
    print("\n" + "=" * 70)
    print(f" {text}")
    print("=" * 70)


def print_section(text: str):
    """Imprime una sección"""
    print(f"\n{text}")
    print("-" * 70)


def main():
    """Función principal"""
    print_header("🔍 VERIFICADOR DE ESQUEMA - AYMARA CONTABLE")
    
    print(f"\n📊 Base de datos: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    
    # Verificar esquema
    print_section("1. VERIFICANDO ESQUEMA...")
    issues = verify_schema()
    
    # Mostrar resultados
    print_section("2. RESULTADOS:")
    
    if not issues['missing_tables'] and not issues['missing_columns']:
        print("\n✅ ¡Esquema verificado correctamente!")
        print("   No se requieren migraciones.")
        return 0
    
    # Tablas faltantes
    if issues['missing_tables']:
        print_section("❌ TABLAS FALTANTES:")
        for table in issues['missing_tables']:
            print(f"   • {table}")
    
    # Columnas faltantes
    if issues['missing_columns']:
        print_section("❌ COLUMNAS FALTANTES:")
        for table, columns in issues['missing_columns'].items():
            print(f"\n   📋 Tabla: {table}")
            for col in columns:
                print(f"      • {col}")
    
    # Generar SQL
    print_section("3. SQL DE MIGRACIÓN:")
    migration_sql = generate_migration_sql(issues)
    print("\n" + migration_sql)
    
    # Guardar en archivo
    output_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        'migrations',
        'auto_generated_migration.sql'
    )
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("-- =================================================================\n")
            f.write("-- MIGRACIÓN AUTO-GENERADA - VERIFICADOR DE ESQUEMA\n")
            f.write("-- =================================================================\n")
            f.write(f"-- Fecha: {__import__('datetime').datetime.now().isoformat()}\n")
            f.write("--\n")
            f.write("-- Instrucciones:\n")
            f.write("-- 1. Revisar el SQL generado\n")
            f.write("-- 2. Ejecutar en pgAdmin\n")
            f.write("-- 3. Reiniciar el backend\n")
            f.write("-- =================================================================\n\n")
            f.write(migration_sql)
        
        print_section("4. ARCHIVO GUARDADO:")
        print(f"\n💾 SQL guardado en: {output_file}")
        print("\n💡 Para aplicar las migraciones:")
        print("   1. Abrir pgAdmin")
        print("   2. Conectar a la base de datos")
        print("   3. Abrir Query Tool")
        print(f"   4. Copiar y pegar el contenido de: {output_file}")
        print("   5. Ejecutar")
        print("   6. Reiniciar el backend")
        
    except Exception as e:
        print(f"\n⚠️  No se pudo guardar el archivo: {e}")
    
    print_header("✅ VERIFICACIÓN COMPLETADA")
    print()
    
    return 1  # Return 1 para indicar que hay problemas (pero no es error)


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
