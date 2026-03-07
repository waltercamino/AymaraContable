"""
API de Pedidos a Proveedores
Gestión de solicitudes de compra (no registra deuda)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import date, datetime
from urllib.parse import quote
from app.database import get_db
from app.models import PedidoProveedor, PedidoDetalle, Producto, Proveedor
from app.schemas import BaseModel, Field
from decimal import Decimal

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])

# ============================================
# SCHEMAS
# ============================================

class PedidoDetalleCreate(BaseModel):
    producto_id: int
    cantidad: int
    precio_costo: float

class PedidoCreate(BaseModel):
    proveedor_id: int
    fecha_pedido: Optional[date] = None
    observaciones: Optional[str] = None
    detalles: List[PedidoDetalleCreate]

class RecibirPedido(BaseModel):
    actualizar_stock: bool = True

# ============================================
# HELPER FUNCTIONS
# ============================================

def formatear_telefono_arg(telefono: str) -> str:
    """
    Convierte teléfono a formato internacional WhatsApp Argentina:
    - 0351 2740236 → 5493512740236
    - 351 2740236 → 5493512740236
    - +54 9 351 2740236 → 5493512740236
    """
    if not telefono:
        return ""
    
    # Solo dígitos
    limpio = "".join(filter(str.isdigit, telefono))
    
    # Quitar prefijos locales
    if limpio.startswith("0"):
        limpio = limpio[1:]
    
    # Agregar código Argentina si no está
    if not limpio.startswith("549"):
        limpio = f"549{limpio}"
    
    return limpio


# ============================================
# ENDPOINTS
# ============================================

@router.get("/productos")
def listar_productos_para_pedidos(
    busqueda: Optional[str] = None,
    proveedor_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna TODOS los productos (no solo stock bajo)
    - busqueda: filtrar por nombre/sku
    - proveedor_id: filtrar por proveedor
    """
    query = db.query(Producto).options(
        joinedload(Producto.proveedor),
        joinedload(Producto.categoria)
    )
    
    # Filtros opcionales
    if busqueda:
        query = query.filter(
            or_(
                Producto.nombre.ilike(f"%{busqueda}%"),
                Producto.sku.ilike(f"%{busqueda}%")
            )
        )
    
    if proveedor_id:
        query = query.filter(Producto.proveedor_id == proveedor_id)
    
    # Ordenar por nombre
    productos = query.order_by(Producto.nombre).all()
    
    return [{
        "id": p.id,
        "nombre": p.nombre,
        "sku": p.sku,
        "stock_actual": p.stock_actual,
        "stock_minimo": p.stock_minimo,
        "precio_costo": float(p.costo_promedio or 0),
        "proveedor_id": p.proveedor_id,
        "proveedor_nombre": p.proveedor.nombre if p.proveedor else None,
        "categoria_nombre": p.categoria.nombre if p.categoria else None
    } for p in productos]

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_pedido(data: PedidoCreate, db: Session = Depends(get_db), usuario_id: Optional[int] = None):
    """
    Crear nuevo pedido a proveedor
    - Genera número interno automático (PED-0001)
    - Calcula total estimado
    """
    # Generar numero_interno automático
    ultimo = db.query(PedidoProveedor).order_by(PedidoProveedor.id.desc()).first()
    numero = f"PED-{str((ultimo.id + 1) if ultimo else 1).zfill(4)}" if ultimo else "PED-0001"
    
    # Calcular total estimado
    total_estimado = sum(
        Decimal(str(d.cantidad)) * Decimal(str(d.precio_costo)) 
        for d in data.detalles
    )
    
    # Crear pedido
    pedido = PedidoProveedor(
        numero_interno=numero,
        fecha_pedido=data.fecha_pedido or date.today(),
        proveedor_id=data.proveedor_id,
        estado='pendiente',
        total_estimado=float(total_estimado),
        observaciones=data.observaciones,
        usuario_id=usuario_id
    )
    db.add(pedido)
    db.flush()
    
    # Agregar detalles
    for detalle_data in data.detalles:
        detalle = PedidoDetalle(
            pedido_id=pedido.id,
            producto_id=detalle_data.producto_id,
            cantidad=detalle_data.cantidad,
            precio_costo=Decimal(str(detalle_data.precio_costo)),
            subtotal=float(Decimal(str(detalle_data.cantidad)) * Decimal(str(detalle_data.precio_costo)))
        )
        db.add(detalle)
    
    db.commit()
    db.refresh(pedido)
    
    return {
        "id": pedido.id,
        "numero_interno": pedido.numero_interno,
        "mensaje": "Pedido creado correctamente"
    }

@router.get("/")
def listar_pedidos(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    proveedor_id: Optional[int] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Listar pedidos con filtros
    - fecha_desde / fecha_hasta: Rango de fechas
    - proveedor_id: Filtrar por proveedor
    - estado: pendiente, enviado, recibido, cancelado
    """
    query = db.query(PedidoProveedor).options(
        joinedload(PedidoProveedor.proveedor),
        joinedload(PedidoProveedor.detalles).joinedload(PedidoDetalle.producto)
    )

    if fecha_desde:
        query = query.filter(PedidoProveedor.fecha_pedido >= fecha_desde)
    if fecha_hasta:
        query = query.filter(PedidoProveedor.fecha_pedido <= fecha_hasta)
    if proveedor_id:
        query = query.filter(PedidoProveedor.proveedor_id == proveedor_id)
    if estado:
        query = query.filter(PedidoProveedor.estado == estado)

    pedidos = query.order_by(PedidoProveedor.fecha_pedido.desc()).all()

    return [{
        "id": p.id,
        "numero_interno": p.numero_interno,
        "fecha_pedido": p.fecha_pedido.isoformat() if p.fecha_pedido else None,
        "proveedor_id": p.proveedor_id,
        "proveedor_nombre": p.proveedor.nombre if p.proveedor else None,
        "proveedor_telefono": formatear_telefono_arg(p.proveedor.telefono) if p.proveedor and p.proveedor.telefono else None,
        "proveedor_email": p.proveedor.email if p.proveedor else None,
        "estado": p.estado,
        "total_estimado": float(p.total_estimado) if p.total_estimado else 0,
        "creado_en": p.creado_en.isoformat() if p.creado_en else None,
        "cantidad_productos": len(p.detalles),
        "detalles": [{
            "producto_id": d.producto_id,
            "producto_nombre": d.producto.nombre if d.producto else "Producto eliminado",
            "cantidad": int(d.cantidad) if d.cantidad else 0,
            "precio_costo": float(d.precio_costo or 0)
        } for d in p.detalles]
    } for p in pedidos]

@router.get("/{pedido_id}")
def obtener_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Obtener detalle completo de un pedido"""
    pedido = db.query(PedidoProveedor).filter(
        PedidoProveedor.id == pedido_id
    ).options(
        joinedload(PedidoProveedor.proveedor),
        joinedload(PedidoProveedor.detalles).joinedload(PedidoDetalle.producto)
    ).first()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    return {
        "id": pedido.id,
        "numero_interno": pedido.numero_interno,
        "fecha_pedido": pedido.fecha_pedido.isoformat() if pedido.fecha_pedido else None,
        "proveedor_id": pedido.proveedor_id,
        "proveedor_nombre": pedido.proveedor.nombre if pedido.proveedor else None,
        "proveedor_telefono": pedido.proveedor.telefono if pedido.proveedor else None,
        "estado": pedido.estado,
        "total_estimado": float(pedido.total_estimado) if pedido.total_estimado else 0,
        "observaciones": pedido.observaciones,
        "creado_en": pedido.creado_en.isoformat() if pedido.creado_en else None,
        "detalles": [{
            "id": d.id,
            "producto_id": d.producto_id,
            "producto_nombre": d.producto.nombre if d.producto else "Producto eliminado",
            "cantidad": int(d.cantidad) if d.cantidad else 0,
            "precio_costo": float(d.precio_costo or 0),
            "subtotal": float((d.cantidad or 0) * (d.precio_costo or 0))
        } for d in pedido.detalles]
    }

@router.delete("/{pedido_id}")
def eliminar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """
    Eliminar pedido solo si está en estado 'pendiente'.
    No se pueden eliminar pedidos ya enviados o recibidos.
    """
    pedido = db.query(PedidoProveedor).filter(PedidoProveedor.id == pedido_id).first()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    if pedido.estado != 'pendiente':
        raise HTTPException(
            status_code=400,
            detail=f"No se puede eliminar un pedido con estado '{pedido.estado}'"
        )
    
    # Eliminar detalles primero (por cascade o manualmente)
    db.query(PedidoDetalle).filter(PedidoDetalle.pedido_id == pedido_id).delete()
    db.delete(pedido)
    db.commit()
    
    return {"message": "Pedido eliminado correctamente"}

@router.get("/{pedido_id}/enviar")
def enviar_pedido(
    pedido_id: int,
    medio: str,  # Query parameter: ?medio=whatsapp|email|texto
    db: Session = Depends(get_db)
):
    """
    Genera link/texto para enviar pedido por WhatsApp o Email.
    CAMBIA ESTADO a 'enviado' automáticamente.
    """
    pedido = db.query(PedidoProveedor).filter(
        PedidoProveedor.id == pedido_id
    ).options(
        joinedload(PedidoProveedor.proveedor),
        joinedload(PedidoProveedor.detalles).joinedload(PedidoDetalle.producto)
    ).first()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    # ✅ CAMBIAR ESTADO A 'ENVIADO'
    estado_anterior = pedido.estado
    pedido.estado = 'enviado'
    db.commit()  # ← Guardar el cambio de estado
    
    # ✅ USAR TELÉFONO DEL PROVEEDOR (formato internacional Argentina)
    telefono_proveedor = pedido.proveedor.telefono or "" if pedido.proveedor else ""
    telefono_internacional = formatear_telefono_arg(telefono_proveedor)
    
    # Si no hay teléfono, usar mensaje de error
    if not telefono_internacional and medio == 'whatsapp':
        telefono_internacional = ""  # Se manejará en frontend
    
    # Construir mensaje MEJORADO con "Aymará" como remitente
    mensaje_lines = [
        f"📦 *Pedido de Aymará*",
        f"",
        f"*N° Pedido:* {pedido.numero_interno}",
        f"*Fecha:* {pedido.fecha_pedido}",
        f"*De:* Aymará Contable",
        f"*Para:* {pedido.proveedor.nombre if pedido.proveedor else 'N/A'}",
        f"",
        f"*Productos solicitados:*"
    ]
    
    for d in pedido.detalles:
        nombre = d.producto.nombre if d.producto else "Producto eliminado"
        mensaje_lines.append(f"• {nombre}: {d.cantidad} un. x ${d.precio_costo:,.2f}")
    
    mensaje_lines.extend([
        f"",
        f"*Total estimado: ${pedido.total_estimado:,.2f}*",
        f"",
        f"_Gracias por confirmar la disponibilidad y precio._"
    ])
    
    mensaje = "\n".join(mensaje_lines)
    
    if medio == 'whatsapp':
        link = f"https://wa.me/{telefono_internacional}?text={quote(mensaje)}"
        return {
            "medio": "whatsapp",
            "link": link,
            "texto": mensaje,
            "telefono": telefono_internacional,
            "tiene_telefono": bool(telefono_internacional),
            "estado_anterior": pedido.estado,
            "estado_actual": "enviado"
        }
    
    elif medio == 'email':
        return {
            "medio": "email",
            "asunto": f"Pedido {pedido.numero_interno} - Aymará",
            "cuerpo": mensaje.replace("*", "").replace("_", ""),  # Email sin formato Markdown
            "mailto_link": f"mailto:?subject={quote(f'Pedido {pedido.numero_interno} - Aymará')}&body={quote(mensaje.replace('*', '').replace('_', ''))}",
            "estado_anterior": pedido.estado,
            "estado_actual": "enviado"
        }
    
    else:  # texto
        return {"medio": "texto", "texto": mensaje}

@router.post("/{pedido_id}/recibir")
def recibir_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """
    Marcar pedido como recibido (SOLO tracking, NO actualiza stock)
    Para actualizar inventario, crear FC Compra.
    """
    pedido = db.query(PedidoProveedor).filter(PedidoProveedor.id == pedido_id).first()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    # ✅ SOLO cambia estado - NO modifica stock
    pedido.estado = 'recibido'
    pedido.recibido_en = datetime.now()
    
    db.commit()
    
    return {
        "message": "Pedido marcado como recibido (sin actualizar stock)",
        "numero_interno": pedido.numero_interno
    }

@router.post("/{pedido_id}/cancelar")
def cancelar_pedido(pedido_id: int, db: Session = Depends(get_db)):
    """Cancelar pedido"""
    pedido = db.query(PedidoProveedor).filter(PedidoProveedor.id == pedido_id).first()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    
    pedido.estado = 'cancelado'
    db.commit()
    
    return {"message": "Pedido cancelado", "numero_interno": pedido.numero_interno}

@router.get("/resumen/estado")
def resumen_pedidos_por_estado(db: Session = Depends(get_db)):
    """Resumen de pedidos por estado"""
    from sqlalchemy import func
    
    resumen = db.query(
        PedidoProveedor.estado,
        func.count(PedidoProveedor.id).label('cantidad'),
        func.sum(PedidoProveedor.total_estimado).label('total')
    ).group_by(PedidoProveedor.estado).all()
    
    return {
        r.estado: {"cantidad": r.cantidad, "total": float(r.total or 0)}
        for r in resumen
    }
