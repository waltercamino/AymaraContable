from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.database import get_db
from app.models import Cliente
from app.schemas import ClienteCreate, ClienteResponse, ClienteUpdate
from sqlalchemy import func

router = APIRouter()

# ================================================================
# FUNCIONES AUXILIARES
# ================================================================

def normalizar_cuit(cuit: str = None) -> Optional[str]:
    """
    Normaliza CUIT: vacío o genérico → None
    Permite clientes sin CUIT (Consumidor Final)
    """
    if not cuit or cuit.strip() == "" or cuit in ["00-00000000-0", "99-99999999-9"]:
        return None
    return cuit.strip()

@router.get("/", response_model=List[ClienteResponse])
def listar_clientes(tipo_cliente: str = None, db: Session = Depends(get_db)):
    """Lista todos los clientes"""
    query = db.query(Cliente)
    if tipo_cliente:
        query = query.filter(Cliente.tipo_cliente == tipo_cliente)
    return query.all()

@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(cliente: ClienteCreate, db: Session = Depends(get_db)):
    """Crea un nuevo cliente"""
    try:
        # ✅ Normalizar CUIT antes de validar
        cuit_normalizado = normalizar_cuit(cliente.cuit)
        
        # ✅ Solo validar unicidad si hay CUIT real
        if cuit_normalizado:
            existing = db.query(Cliente).filter(Cliente.cuit == cuit_normalizado).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"El CUIT {cuit_normalizado} ya está registrado")
        
        # ✅ Crear con CUIT normalizado (puede ser None)
        datos_cliente = cliente.model_dump(exclude_unset=True)
        datos_cliente['cuit'] = cuit_normalizado  # ← Guarda NULL si está vacío
        
        db_cliente = Cliente(**datos_cliente)
        db.add(db_cliente)
        db.commit()
        db.refresh(db_cliente)
        return db_cliente

    except IntegrityError as e:
        db.rollback()
        error_str = str(e)
        # Detectar si es error de CUIT duplicado o inválido
        if "cuit" in error_str.lower() or "chk_cuit" in error_str.lower():
            raise HTTPException(
                status_code=400,
                detail="CUIT inválido o duplicado. Verifique el formato (XX-XXXXXXXX-X)."
            )
        raise HTTPException(status_code=400, detail=f"Error al crear cliente: {error_str}")

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR creando cliente: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene un cliente por ID"""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(cliente_id: int, cliente: ClienteUpdate, db: Session = Depends(get_db)):
    """Actualiza un cliente"""
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # ✅ Si se envía CUIT, normalizarlo
    if cliente.cuit is not None:
        cuit_normalizado = normalizar_cuit(cliente.cuit)
        
        # ✅ Validar unicidad solo si es CUIT real y cambió
        if cuit_normalizado and cuit_normalizado != db_cliente.cuit:
            existe = db.query(Cliente).filter(
                Cliente.cuit == cuit_normalizado,
                Cliente.id != cliente_id
            ).first()
            if existe:
                raise HTTPException(
                    status_code=400,
                    detail=f"El CUIT {cuit_normalizado} ya está registrado en otro cliente"
                )
        cliente.cuit = cuit_normalizado
    
    # ✅ Actualizar campos
    update_data = cliente.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_cliente, key, value)

    db.commit()
    db.refresh(db_cliente)
    return db_cliente

@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Elimina un cliente (hard delete) - Solo si no tiene transacciones"""
    from app.models import Factura, MovimientoCaja, NotaCredito, Recibo
    from sqlalchemy import or_
    
    db_cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not db_cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # ✅ Verificar transacciones antes de eliminar
    tiene_facturas = db.query(Factura).filter(
        or_(Factura.cliente_id == cliente_id)
    ).first()
    tiene_movimientos = db.query(MovimientoCaja).filter(
        or_(MovimientoCaja.cliente_id == cliente_id)
    ).first()
    tiene_notas_credito = db.query(NotaCredito).filter(
        NotaCredito.cliente_id == cliente_id
    ).first()
    tiene_recibos = db.query(Recibo).filter(
        Recibo.cliente_id == cliente_id
    ).first()
    
    if tiene_facturas or tiene_movimientos or tiene_notas_credito or tiene_recibos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: tiene facturas, movimientos, notas de crédito o cobros asociados."
        )

    # ✅ Eliminar realmente (hard delete - no hay activo/inactivo)
    db.delete(db_cliente)
    db.commit()
    return {"message": "Cliente eliminado correctamente"}

@router.get("/cuit/{cuit}")
def buscar_por_cuit(cuit: str, db: Session = Depends(get_db)):
    """Busca cliente por CUIT"""
    cliente = db.query(Cliente).filter(Cliente.cuit == cuit).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

# ============================================
# 🆕 HISTORIALES Y RESUMEN POR CLIENTE
# ============================================
@router.get("/{cliente_id}/facturas")
def historial_facturas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las facturas de un cliente"""
    from app.models import Factura
    facturas = db.query(Factura).filter(
        Factura.cliente_id == cliente_id
    ).order_by(Factura.fecha.desc()).all()
    
    return [{
        "id": f.id,
        "numero_factura": f.numero_factura,
        "tipo_comprobante": f.tipo_comprobante,
        "fecha": str(f.fecha),
        "total": float(f.total),
        "estado": f.estado,
        "medio_pago": f.medio_pago
    } for f in facturas]

@router.get("/{cliente_id}/ventas")
def historial_ventas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene todas las facturas de un cliente (antes: ventas legacy)"""
    from app.models import Factura
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    facturas = db.query(Factura).filter(
        Factura.cliente_id == cliente_id
    ).order_by(Factura.fecha.desc()).all()

    return [{
        "id": f.id,
        "fecha": str(f.fecha),
        "total": float(f.total),
        "tipo_comprobante": f.tipo_comprobante,
        "medio_pago": f.medio_pago,
        "estado": f.estado
    } for f in facturas]

@router.get("/{cliente_id}/resumen")
def resumen_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Resumen total de compras del cliente (solo facturas)"""
    from app.models import Factura
    from sqlalchemy import func

    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Total facturas
    facturas = db.query(
        func.count(Factura.id),
        func.sum(Factura.total)
    ).filter(
        Factura.cliente_id == cliente_id,
        Factura.estado.in_(["emitida", "con_nota_credito"])
    ).first()

    # Notas de crédito (restan)
    from app.models import NotaCredito
    notas = db.query(
        func.sum(NotaCredito.total)
    ).filter(
        NotaCredito.cliente_id == cliente_id,
        NotaCredito.estado == "emitida"
    ).first()

    monto_facturas = float(facturas[1] or 0)
    monto_notas = float(notas[0] or 0)

    return {
        "cliente_id": cliente_id,
        "cliente_nombre": f"{cliente.nombre} {cliente.apellido or ''}",
        "total_facturas": facturas[0] or 0,
        "monto_facturado": monto_facturas,
        "total_notas_credito": len(notas) if notas else 0,
        "monto_notas_credito": monto_notas,
        "monto_total_comprado": monto_facturas - monto_notas
    }