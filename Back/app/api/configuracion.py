"""
Router para configuración de empresa (nombre, CUIT, logo, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import shutil
from datetime import datetime

from app.database import get_db
from app.models import ConfiguracionEmpresa
from app.schemas import ConfiguracionEmpresaResponse, ConfiguracionEmpresaUpdate

router = APIRouter(prefix="/api/configuracion", tags=["Configuración"])


@router.get("/empresa", response_model=ConfiguracionEmpresaResponse)
def obtener_configuracion(db: Session = Depends(get_db)):
    """Obtener configuración de empresa (siempre hay 1 registro)"""
    from pathlib import Path
    
    config = db.query(ConfiguracionEmpresa).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada. Debe crearla primero.")
    
    # Obtener ruta absoluta del logo para backend
    base_dir = Path(__file__).parent.parent.parent  # Back/
    upload_dir = base_dir / "uploads"
    
    # Buscar logo existente
    logo_path = None
    for ext in [".png", ".jpg", ".jpeg", ".svg", ".webp"]:
        test_path = upload_dir / f"logo_empresa{ext}"
        if test_path.exists():
            logo_path = str(test_path)
            break
    
    # Crear respuesta con datos adicionales
    response_data = {
        "id": config.id,
        "nombre_empresa": config.nombre_empresa,
        "razon_social": config.razon_social,
        "cuit": config.cuit,
        "condicion_iva": config.condicion_iva,
        "ingresos_brutos": config.ingresos_brutos,
        "inicio_actividades": config.inicio_actividades,
        "direccion": config.direccion,
        "localidad": config.localidad,
        "telefono": config.telefono,
        "email": config.email,
        "pie_factura": config.pie_factura,
        "logo_url": config.logo_url,
        "logo_path": logo_path,  # Ruta absoluta para backend
        "creado_en": config.creado_en,
        "actualizado_en": config.actualizado_en
    }
    
    return response_data


@router.put("/empresa", response_model=ConfiguracionEmpresaResponse)
def actualizar_configuracion(
    config_data: ConfiguracionEmpresaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar configuración de empresa"""
    try:
        config = db.query(ConfiguracionEmpresa).first()
        if not config:
            raise HTTPException(status_code=404, detail="Configuración no encontrada. Debe crearla primero.")

        update_data = config_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(config, key, value)

        config.actualizado_en = datetime.now()
        db.commit()
        db.refresh(config)
        return config
        
    except IntegrityError as e:
        db.rollback()
        error_str = str(e)
        if "cuit" in error_str.lower() or "chk_cuit" in error_str.lower():
            raise HTTPException(
                status_code=400,
                detail="CUIT inválido. Verifique el formato (XX-XXXXXXXX-X)."
            )
        raise HTTPException(status_code=400, detail="Error al actualizar configuración")
        
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR actualizando configuración: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/empresa/logo")
def subir_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Subir logo de empresa"""
    try:
        from pathlib import Path
        
        # Ruta ABSOLUTA para guardar el archivo
        base_dir = Path(__file__).parent.parent.parent  # Back/
        upload_dir = base_dir / "uploads"
        upload_dir.mkdir(exist_ok=True)
        
        # Extensión del archivo
        file_ext = Path(file.filename).suffix.lower()
        allowed = [".png", ".jpg", ".jpeg", ".svg", ".webp"]
        
        if file_ext not in allowed:
            raise HTTPException(status_code=400, detail=f"Solo: {', '.join(allowed)}")
        
        # Nombre fijo para el logo
        filename = f"logo_empresa{file_ext}"
        filepath = upload_dir / filename
        
        # Guardar archivo físico
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"✅ Logo guardado en: {filepath}")  # Debug
        
        # Actualizar BD con ruta RELATIVA para frontend
        config = db.query(ConfiguracionEmpresa).first()
        if not config:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        
        config.logo_url = f"/uploads/logo_empresa{file_ext}"  # Ruta relativa con extensión real
        config.actualizado_en = datetime.now()
        db.commit()
        
        return {"logo_url": config.logo_url, "filepath": str(filepath)}

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR subiendo logo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al guardar logo: {str(e)}")


@router.get("/logo")
def obtener_logo():
    """Servir archivo de logo (endpoint público)"""
    from fastapi.responses import FileResponse
    from pathlib import Path
    
    base_dir = Path(__file__).parent.parent.parent
    upload_dir = base_dir / "uploads"
    
    # Verificar extensiones posibles
    filepath = None
    for ext in [".png", ".jpg", ".jpeg", ".svg", ".webp"]:
        test_path = upload_dir / f"logo_empresa{ext}"
        if test_path.exists():
            filepath = test_path
            break
    
    if not filepath or not filepath.exists():
        print(f"❌ Logo no encontrado en: {upload_dir}")  # Debug
        raise HTTPException(status_code=404, detail="Logo no configurado")
    
    print(f"✅ Sirviendo logo desde: {filepath}")  # Debug
    return FileResponse(filepath, media_type="image/png")


@router.post("/empresa/inicializar")
def inicializar_configuracion(db: Session = Depends(get_db)):
    """Inicializar configuración con valores por defecto (si no existe)"""
    config = db.query(ConfiguracionEmpresa).first()
    if config:
        return {"message": "La configuración ya existe", "config": config}
    
    # Crear configuración por defecto
    config = ConfiguracionEmpresa(
        nombre_empresa="AYMARA CONTABLE",
        cuit="",
        direccion="",
        telefono="",
        email="",
        logo_url="",
        pie_factura="Gracias por su compra."
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    
    return {"message": "Configuración inicial creada", "config": config}
