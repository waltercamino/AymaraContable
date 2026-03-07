"""
Backup de Base de Datos - Single-Tenant
Solo Admin (rol_id=1) puede exportar/restaurar
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.core.permissions import require_permiso
from app.api.usuarios import get_current_user
import subprocess
import os
import sys
import tempfile
from datetime import datetime
from fastapi.responses import FileResponse, JSONResponse
import shutil
from pathlib import Path

router = APIRouter(prefix="/backup", tags=["Backup"])

# ✅ FIX: Usar tempfile.gettempdir() para compatibilidad Windows/Linux
TEMP_DIR = tempfile.gettempdir()


def get_pg_dump_path() -> str:
    """
    Obtiene la ruta de pg_dump en orden de prioridad:
    1. Variable de entorno PG_DUMP_PATH
    2. Detección automática en rutas comunes (Windows)
    3. 'pg_dump' en PATH del sistema
    """
    # 1. Verificar variable de entorno
    env_path = os.getenv("PG_DUMP_PATH")
    if env_path and os.path.exists(env_path):
        print(f"🔍 [Backup] pg_dump desde PG_DUMP_PATH: {env_path}")
        return env_path
    
    # 2. Detección automática en Windows
    if sys.platform == "win32":
        common_paths = [
            r"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\15\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\14\bin\pg_dump.exe",
            r"C:\Program Files\PostgreSQL\13\bin\pg_dump.exe",
        ]
        for path in common_paths:
            if os.path.exists(path):
                print(f"🔍 [Backup] pg_dump detectado en: {path}")
                return path
    
    # 3. Fallback: asumir que está en PATH
    print("🔍 [Backup] Usando pg_dump desde PATH del sistema")
    return "pg_dump"


def get_psql_path() -> str:
    """
    Obtiene la ruta de psql en orden de prioridad:
    1. Variable de entorno PG_PSQL_PATH
    2. Detección automática en rutas comunes (Windows)
    3. 'psql' en PATH del sistema
    """
    # 1. Verificar variable de entorno
    env_path = os.getenv("PG_PSQL_PATH")
    if env_path and os.path.exists(env_path):
        print(f"🔍 [Backup] psql desde PG_PSQL_PATH: {env_path}")
        return env_path
    
    # 2. Detección automática en Windows
    if sys.platform == "win32":
        common_paths = [
            r"C:\Program Files\PostgreSQL\18\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\17\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\16\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\15\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\14\bin\psql.exe",
            r"C:\Program Files\PostgreSQL\13\bin\psql.exe",
        ]
        for path in common_paths:
            if os.path.exists(path):
                print(f"🔍 [Backup] psql detectado en: {path}")
                return path
    
    # 3. Fallback: asumir que está en PATH
    print("🔍 [Backup] Usando psql desde PATH del sistema")
    return "psql"


def generar_nombre_backup(db_name: str = "aymara") -> str:
    """Genera nombre único para archivo de backup"""
    fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{db_name}_{fecha}.sql"


@router.get("/exportar", dependencies=[Depends(require_permiso("backup", "exportar"))])
def exportar_backup(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Exporta la base de datos a archivo SQL.
    Abre diálogo nativo de guardado en Windows.
    Solo Admin puede ejecutar.
    """
    print(f"🔍 [Backup] Usuario solicitando backup: {usuario.username}, rol_id: {usuario.rol_id}")

    # 🔒 VALIDACIÓN: No permitir backup con cajas abiertas
    from app.models import CajaDia
    
    cajas_abiertas = db.query(CajaDia).filter(
        CajaDia.estado == "abierto"
    ).all()
    
    if cajas_abiertas:
        ids = [c.id for c in cajas_abiertas]
        print(f"⚠️ [Backup] Bloqueado: {len(cajas_abiertas)} caja(s) abierta(s): {ids}")
        raise HTTPException(
            status_code=400,
            detail={
                "error": "No se puede hacer backup con cajas abiertas",
                "cajas_abiertas": ids,
                "mensaje": "Cierre las cajas antes de exportar un backup para garantizar integridad de datos."
            }
        )
    
    print("✅ [Backup] Validación de cajas: todas cerradas")

    # Configuración de conexión (variables de entorno)
    db_url = os.getenv("DATABASE_URL")
    print(f"🔍 [Backup] DATABASE_URL existe: {bool(db_url)}")

    if not db_url:
        print("❌ [Backup] DATABASE_URL no configurada")
        raise HTTPException(status_code=500, detail="DATABASE_URL no configurada")

    from urllib.parse import urlparse
    parsed = urlparse(db_url)

    db_name = parsed.path.lstrip('/') or "sistema_contable"
    user = parsed.username
    password = parsed.password
    host = parsed.hostname or 'localhost'
    port = parsed.port or 5432

    print(f"🔍 [Backup] Conexión: host={host}, port={port}, db={db_name}, user={user}")

    # ✅ Nombre de archivo con formato: sistema_contable_YYYYMMDD_HHMMSS.sql
    filename = generar_nombre_backup(db_name)
    filepath = os.path.join(TEMP_DIR, filename)
    print(f"🔍 [Backup] Guardando en: {filepath}")

    try:
        # ✅ Obtener ruta de pg_dump (portable Windows/Linux)
        pg_dump_path = get_pg_dump_path()
        print(f"🔍 [Backup] Sistema: {sys.platform}")
        print(f"🔍 [Backup] Comando pg_dump: {pg_dump_path}")

        # Ejecutar pg_dump (PostgreSQL)
        env = os.environ.copy()
        if password:
            env["PGPASSWORD"] = str(password)

        print("🔍 [Backup] Ejecutando pg_dump...")

        # ✅ Agregar --clean --if-exists para DROP TABLE antes de cada COPY
        print("🔍 [Backup] Usando pg_dump con --clean --if-exists")
        result = subprocess.run(
            [pg_dump_path, "--clean", "--if-exists", "-h", host, "-U", user, "-d", db_name, "-f", filepath],
            env=env,
            capture_output=True,
            text=True
        )

        print(f"🔍 [Backup] Return code: {result.returncode}")
        if result.stderr:
            print(f"⚠️ [Backup] Stderr: {result.stderr}")

        if result.returncode != 0:
            print(f"❌ [Backup] Error al exportar BD: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail=f"Error al exportar BD: {result.stderr}"
            )

        print(f"✅ [Backup] Backup exportado exitosamente: {filename}")

        # ✅ Retornar archivo para descarga con Content-Disposition para diálogo nativo
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type="application/sql",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except FileNotFoundError as e:
        print(f"❌ [Backup] pg_dump no encontrado: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="pg_dump no encontrado. Instalar postgresql-client."
        )
    except Exception as e:
        print(f"❌ [Backup] Error inesperado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.post("/restaurar", dependencies=[Depends(require_permiso("backup", "restaurar"))])
async def restaurar_backup(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    ⚠️ RESTAURAR backup - DROP + RESTORE
    Antes de restaurar, crea auto-backup preventivo.
    Solo Admin (rol_id=1).
    """
    print(f"🔍 [Backup] INICIO restore - Usuario: {usuario.username}")

    # Validar archivo
    if not file.filename.endswith(".sql"):
        raise HTTPException(status_code=400, detail="Archivo debe ser .sql")

    # Parsear DATABASE_URL
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL no configurada")

    from urllib.parse import urlparse
    parsed = urlparse(db_url)
    db_name = parsed.path.lstrip('/') or "sistema_contable"
    user = parsed.username or "postgres"
    password = parsed.password
    host = parsed.hostname or "localhost"
    port = parsed.port or 5432

    print(f"🔍 [Backup] Conexión: host={host}, port={port}, db={db_name}, user={user}")

    # Guardar archivo temporalmente
    temp_path = os.path.join(TEMP_DIR, f"restore_{datetime.now().timestamp()}.sql")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"🔍 [Backup] Archivo guardado temporalmente: {temp_path}")

        # 🔒 AUTO-BACKUP PREVENTIVO antes de restaurar
        print("🔍 [Backup] Creando auto-backup preventivo...")
        fecha = datetime.now().strftime("%Y%m%d_%H%M%S")
        auto_backup_path = os.path.join(TEMP_DIR, f"{db_name}_AUTO_{fecha}.sql")

        pg_dump_path = get_pg_dump_path()
        env = os.environ.copy()
        if password:
            env["PGPASSWORD"] = str(password)

        # Ejecutar pg_dump para auto-backup
        dump_result = subprocess.run(
            [pg_dump_path, "--clean", "--if-exists", "-h", host, "-U", user, "-d", db_name, "-f", auto_backup_path],
            env=env,
            capture_output=True,
            text=True
        )

        if dump_result.returncode != 0:
            print(f"⚠️ [Backup] Auto-backup falló: {dump_result.stderr}")
        else:
            print(f"✅ [Backup] Auto-backup creado: {auto_backup_path}")

        # 🗑️ DROP + RESTORE
        print("🔍 [Backup] Ejecutando DROP + RESTORE...")

        # Primero desconectar usuarios activos de la BD (necesario para DROP)
        disconnect_query = f"""
        SELECT pg_terminate_backend(pg_stat_activity.pid)
        FROM pg_stat_activity
        WHERE pg_stat_activity.datname = '{db_name}'
        AND pid <> pg_backend_pid();
        """

        try:
            # Ejecutar desconexión via psql (conectar a BD 'postgres' para modificar la BD objetivo)
            psql_path = get_psql_path()
            disconnect_cmd = [
                psql_path, "-h", host, "-U", user, "-d", "postgres",
                "-c", disconnect_query
            ]
            if password:
                env["PGPASSWORD"] = str(password)
            disconnect_result = subprocess.run(disconnect_cmd, env=env, capture_output=True, text=True)
            print(f"🔍 [Backup] Desconexión resultado: {disconnect_result.returncode}")
            print("🔍 [Backup] Conexiones activas desconectadas")
        except Exception as e:
            print(f"⚠️ [Backup] No se pudo desconectar usuarios: {str(e)}")
            # Continuar igual

        # Ejecutar restore con psql
        psql_path = get_psql_path()
        print(f"🔍 [Backup] Sistema: {sys.platform}")
        print(f"🔍 [Backup] Comando psql: {psql_path}")

        restore_cmd = [psql_path, "-h", host, "-U", user, "-d", db_name, "-f", temp_path]
        if password:
            env["PGPASSWORD"] = str(password)

        print(f"🔍 [Backup] Ejecutando restore...")
        result = subprocess.run(
            restore_cmd,
            env=env,
            capture_output=True,
            text=True
        )

        # Log detallado del resultado
        print(f"🔍 [Backup] Return code: {result.returncode}")
        if result.stdout:
            print(f"🔍 [Backup] STDOUT: {result.stdout[:500]}")  # Primeros 500 chars
        if result.stderr:
            print(f"🔍 [Backup] STDERR: {result.stderr[:500]}")  # Primeros 500 chars

        # Limpiar archivo temporal del restore
        if os.path.exists(temp_path):
            os.remove(temp_path)

        if result.returncode != 0:
            print(f"❌ [Backup] ERROR en restore: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Restore falló: {result.stderr}")

        # ✅ VERIFICACIÓN POST-RESTORE: Validar integridad de cajas abiertas
        print("🔍 [Backup] Verificando integridad de cajas post-restore...")
        try:
            from sqlalchemy import text
            # Verificar cajas con estado inválido
            stmt = text("""
                SELECT id, estado, usuario_id 
                FROM caja_dia 
                WHERE estado NOT IN ('abierto', 'cerrado')
            """)
            invalidas = db.execute(stmt).fetchall()
            if invalidas:
                print(f"⚠️ [Backup] Cajas con estado inválido: {len(invalidas)}")
                for c in invalidas:
                    print(f"  - Caja {c.id}: estado='{c.estado}', usuario_id={c.usuario_id}")
            
            # Verificar cajas abiertas sin usuario válido
            stmt = text("""
                SELECT c.id, c.usuario_id 
                FROM caja_dia c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.estado = 'abierto' AND u.id IS NULL
            """)
            sin_usuario = db.execute(stmt).fetchall()
            if sin_usuario:
                print(f"⚠️ [Backup] Cajas abiertas sin usuario válido: {len(sin_usuario)}")
                for c in sin_usuario:
                    print(f"  - Caja {c.id}: usuario_id={c.usuario_id}")
            
            # Verificar FK rotas en general
            stmt = text("""
                SELECT c.id, c.usuario_id 
                FROM caja_dia c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE u.id IS NULL AND c.usuario_id IS NOT NULL
            """)
            fk_rotas = db.execute(stmt).fetchall()
            if fk_rotas:
                print(f"⚠️ [Backup] Cajas con FK rota a usuarios: {len(fk_rotas)}")
            
            db.commit()
            print("✅ [Backup] Verificación de cajas completada")
        except Exception as e:
            print(f"⚠️ [Backup] No se pudo verificar integridad de cajas: {e}")
            db.rollback()

        print("✅ [Backup] Restore completado exitosamente")
        return JSONResponse(
            content={
                "success": True,
                "message": "✅ Backup restaurado correctamente",
                "auto_backup": auto_backup_path if dump_result.returncode == 0 else None
            },
            status_code=200
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ [Backup] ERROR INESPERADO: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"❌ [Backup] Traceback: {traceback.format_exc()}")
        # Limpiar archivo temporal en caso de error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
