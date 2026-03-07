from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Crear motor de base de datos
engine = create_engine(settings.DATABASE_URL)

# Sesión para consultas
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

# Dependencia para obtener sesión en cada request
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_schema():
    """
    Verifica que todas las tablas y columnas definidas en los modelos
    existan en la base de datos. Solo para DESARROLLO - no crashée.
    
    Returns:
        dict: {
            'missing_tables': [...],
            'missing_columns': {tabla: [columnas]},
            'warnings': [...]
        }
    """
    logger.info("🔍 Verificando esquema de base de datos...")
    
    issues = {
        'missing_tables': [],
        'missing_columns': {},
        'warnings': []
    }
    
    try:
        # Obtener inspector de la BD
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        # Verificar cada modelo
        for model in Base.registry._class_registry.values():
            if not hasattr(model, '__tablename__'):
                continue
            
            table_name = model.__tablename__
            
            # Verificar si la tabla existe
            if table_name not in existing_tables:
                issues['missing_tables'].append(table_name)
                logger.warning(f"⚠️ Tabla faltante: {table_name}")
                continue
            
            # Obtener columnas existentes en la BD
            existing_columns = {col['name'] for col in inspector.get_columns(table_name)}
            
            # Verificar columnas del modelo
            missing_cols = []
            for column in model.__table__.columns:
                if column.name not in existing_columns:
                    missing_cols.append(column.name)
            
            if missing_cols:
                issues['missing_columns'][table_name] = missing_cols
                logger.warning(f"⚠️ Columnas faltantes en {table_name}: {', '.join(missing_cols)}")
        
        # Resumen
        if not issues['missing_tables'] and not issues['missing_columns']:
            logger.info("✅ Esquema de base de datos verificado correctamente")
        else:
            total_issues = len(issues['missing_tables']) + sum(len(cols) for cols in issues['missing_columns'].values())
            logger.warning(f"⚠️ Se encontraron {total_issues} problemas de esquema")
            logger.warning("💡 Ejecutá las migraciones en la base de datos")
        
        return issues
        
    except Exception as e:
        logger.error(f"❌ Error al verificar esquema: {type(e).__name__}: {str(e)}")
        issues['warnings'].append(f"Error al verificar: {str(e)}")
        return issues


def generate_migration_sql(issues: dict) -> str:
    """
    Genera SQL de migración para solucionar los problemas detectados.
    
    Args:
        issues: Dict de verify_schema()
    
    Returns:
        str: SQL statements para migrar
    """
    sql_statements = []
    
    for table_name in issues['missing_tables']:
        sql_statements.append(f"-- ⚠️ Tabla {table_name} no existe - crear manualmente")
    
    for table_name, columns in issues['missing_columns'].items():
        for col_name in columns:
            # Obtener tipo de dato de la columna del modelo
            model_class = None
            for model in Base.registry._class_registry.values():
                if hasattr(model, '__tablename__') and model.__tablename__ == table_name:
                    model_class = model
                    break
            
            if model_class and hasattr(model_class, col_name):
                column_obj = model_class.__table__.columns[col_name]
                col_type = str(column_obj.type)
                nullable = "DROP NOT NULL" if column_obj.nullable else "SET NOT NULL"
                
                # Foreign key
                fk_clause = ""
                if column_obj.foreign_keys:
                    fk = list(column_obj.foreign_keys)[0]
                    fk_clause = f" REFERENCES {fk.column.table.name}({fk.column.name})"
                
                sql_statements.append(
                    f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {col_name} {col_type}{fk_clause};"
                )
                sql_statements.append(
                    f"ALTER TABLE {table_name} ALTER COLUMN {col_name} {nullable};"
                )
    
    return "\n".join(sql_statements) if sql_statements else "-- No se requieren migraciones"