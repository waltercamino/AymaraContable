from dotenv import load_dotenv 
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from app.config import settings
from app.database import verify_schema, generate_migration_sql
from app.api import productos
from app.api import categorias
from app.api import caja
from app.api import proveedores
from app.api import usuarios
from app.api import precios
from app.api import reportes
from app.api import clientes
from app.api import fccompra
from app.api import fcventa
from app.api import notas_credito
from app.api import cuenta_corriente
from app.api import recibos
from app.api import pedidos
from app.api import configuracion
from app.api import backup
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup y Shutdown de la aplicación
    """
    # Startup
    logger.info("🚀 Iniciando Aymara Contable API...")
    
    # Verificar esquema de base de datos
    logger.info("🔍 Verificando esquema de base de datos...")
    issues = verify_schema()
    
    if issues['missing_tables'] or issues['missing_columns']:
        logger.warning("⚠️  PROBLEMAS DE ESQUEMA DETECTADOS:")
        
        if issues['missing_tables']:
            for table in issues['missing_tables']:
                logger.warning(f"  ❌ Tabla faltante: {table}")
        
        for table, columns in issues['missing_columns'].items():
            logger.warning(f"  ❌ Columnas faltantes en {table}: {', '.join(columns)}")
        
        # Generar SQL de migración
        migration_sql = generate_migration_sql(issues)
        logger.info("💡 SQL de migración generado:")
        logger.info("\n" + migration_sql)
        
        logger.warning("⚠️  La API puede funcionar incorrectamente hasta ejecutar las migraciones")
    else:
        logger.info("✅ Esquema de base de datos verificado correctamente")
    
    yield
    
    # Shutdown
    logger.info("👋 Cerrando Aymara Contable API...")


app = FastAPI(
    title="Aymara Contable API",
    description="Sistema de gestión comercial mayorista/minorista",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]  # ✅ Permitir leer nombre de archivo
)

# Registrar TODOS los routers
app.include_router(productos.router)  # Ya incluye prefix="/api/productos" en el router
app.include_router(categorias.router, prefix="/api/categorias", tags=["Categorías"])
app.include_router(caja.router)  # Ya incluye prefix="/api/caja" en el router
app.include_router(proveedores.router, prefix="/api/proveedores", tags=["Proveedores"])
app.include_router(usuarios.router, prefix="/api/usuarios", tags=["Usuarios"])
app.include_router(precios.router, prefix="/api/precios", tags=["Precios"])
app.include_router(reportes.router, prefix="/api/reportes", tags=["Reportes"])
app.include_router(clientes.router, prefix="/api/clientes", tags=["Clientes"])
app.include_router(fccompra.router)  # Ya incluye prefix="/api/fc-compra" en el router
app.include_router(fcventa.router)  # Ya incluye prefix="/api/fc-venta" en el router
app.include_router(notas_credito.router, prefix="/api/notas-credito", tags=["Notas de Crédito"])
app.include_router(cuenta_corriente.router)  # Ya incluye prefix="/api/cuenta-corriente" en el router
app.include_router(recibos.router)  # Ya incluye prefix="/api/recibos" en el router
app.include_router(pedidos.router)  # Ya incluye prefix="/api/pedidos" en el router
app.include_router(configuracion.router)  # Ya incluye prefix="/api/configuracion" en el router
app.include_router(backup.router, prefix="/api")

# Servir archivos estáticos (logos, etc.)
from pathlib import Path
base_dir = Path(__file__).parent.parent
uploads_dir = base_dir / "uploads"
uploads_dir.mkdir(exist_ok=True)  # Crear carpeta si no existe
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Aymara Contable API - Funcionando ✅"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}