from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from app.database import get_db
from app.models import Proveedor
from app.schemas import ProveedorCreate, ProveedorResponse
from sqlalchemy import or_

router = APIRouter()

@router.get("/", response_model=List[ProveedorResponse])
def listar_proveedores(db: Session = Depends(get_db)):
    """Lista todos los proveedores"""
    return db.query(Proveedor).all()

@router.post("/", response_model=ProveedorResponse, status_code=status.HTTP_201_CREATED)
def crear_proveedor(proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    """Crea un nuevo proveedor"""
    try:
        db_proveedor = Proveedor(**proveedor.model_dump())
        db.add(db_proveedor)
        db.commit()
        db.refresh(db_proveedor)
        return db_proveedor
        
    except IntegrityError as e:
        db.rollback()
        error_str = str(e)
        # Detectar si es error de CUIT duplicado o inválido
        if "cuit" in error_str.lower() or "chk_cuit" in error_str.lower():
            raise HTTPException(
                status_code=400,
                detail="CUIT inválido o duplicado. Verifique el formato (XX-XXXXXXXX-X) o que no esté registrado."
            )
        raise HTTPException(status_code=400, detail=f"Error al crear proveedor: {error_str}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR creando proveedor: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/{proveedor_id}", response_model=ProveedorResponse)
def obtener_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """Obtiene un proveedor por ID"""
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return proveedor

@router.put("/{proveedor_id}", response_model=ProveedorResponse)
def actualizar_proveedor(proveedor_id: int, proveedor: ProveedorCreate, db: Session = Depends(get_db)):
    """Actualiza los datos de un proveedor"""
    db_proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    update_data = proveedor.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_proveedor, key, value)

    db.commit()
    db.refresh(db_proveedor)
    return db_proveedor

@router.delete("/{proveedor_id}")
def eliminar_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """Elimina un proveedor (hard delete) - Solo si no tiene transacciones"""
    from app.models import Compra, MovimientoCaja, Recibo, PedidoProveedor
    
    db_proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not db_proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    # ✅ Verificar transacciones antes de eliminar
    tiene_compras = db.query(Compra).filter(
        Compra.proveedor_id == proveedor_id
    ).first()
    tiene_movimientos = db.query(MovimientoCaja).filter(
        MovimientoCaja.proveedor_id == proveedor_id
    ).first()
    tiene_recibos = db.query(Recibo).filter(
        Recibo.proveedor_id == proveedor_id
    ).first()
    tiene_pedidos = db.query(PedidoProveedor).filter(
        PedidoProveedor.proveedor_id == proveedor_id
    ).first()
    
    if tiene_compras or tiene_movimientos or tiene_recibos or tiene_pedidos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: tiene compras, movimientos, pagos o pedidos asociados."
        )

    # ✅ Eliminar realmente (hard delete)
    db.delete(db_proveedor)
    db.commit()
    return {"message": "Proveedor eliminado correctamente"}

@router.get("/{proveedor_id}/compras")
def historial_compras_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las compras a un proveedor"""
    from app.models import Compra
    compras = db.query(Compra).filter(
        Compra.proveedor_id == proveedor_id
    ).order_by(Compra.fecha.desc()).all()
    
    return [{
        "id": c.id,
        "numero_factura": c.numero_factura,
        "fecha": str(c.fecha),
        "total": float(c.total),
        "estado": c.estado,
        "medio_pago": c.medio_pago
    } for c in compras]

@router.get("/{proveedor_id}/resumen")
def resumen_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """Resumen total de compras a un proveedor"""
    from app.models import Compra
    from sqlalchemy import func
    
    proveedor = db.query(Proveedor).filter(Proveedor.id == proveedor_id).first()
    if not proveedor:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    
    compras = db.query(
        func.count(Compra.id),
        func.sum(Compra.total)
    ).filter(
        Compra.proveedor_id == proveedor_id,
        Compra.estado == "registrada"
    ).first()
    
    return {
        "proveedor_id": proveedor_id,
        "proveedor_nombre": proveedor.nombre,
        "total_compras": compras[0] or 0,
        "monto_total_comprado": float(compras[1] or 0)
    }