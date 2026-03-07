from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from decimal import Decimal
from app.database import get_db
from app.models import NotaCredito, NotaCreditoDetalle, Factura, Cliente, Producto
from app.schemas import NotaCreditoCreate, NotaCreditoResponse, NotaCreditoResponseComplete
from sqlalchemy import func
import tempfile
import os

router = APIRouter()

# ============================================
# ENDPOINTS
# ============================================
@router.get("/", response_model=List[NotaCreditoResponse])
def listar_notas_credito(fecha_desde: date = None, fecha_hasta: date = None, 
                         cliente_id: int = None, estado: str = None, 
                         db: Session = Depends(get_db)):
    """Lista notas de crédito con filtros"""
    query = db.query(NotaCredito)
    if fecha_desde:
        query = query.filter(NotaCredito.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(NotaCredito.fecha <= fecha_hasta)
    if cliente_id:
        query = query.filter(NotaCredito.cliente_id == cliente_id)
    if estado:
        query = query.filter(NotaCredito.estado == estado)
    return query.order_by(NotaCredito.fecha.desc()).all()

@router.get("/{nota_id}", response_model=NotaCreditoResponseComplete)
def obtener_nota_credito(nota_id: int, db: Session = Depends(get_db)):
    """Obtiene una nota de crédito con detalle"""
    nota = db.query(NotaCredito).filter(NotaCredito.id == nota_id).first()
    if not nota:
        raise HTTPException(status_code=404, detail="Nota de crédito no encontrada")
    return nota

@router.post("/", response_model=NotaCreditoResponse, status_code=status.HTTP_201_CREATED)
def crear_nota_credito(nota: NotaCreditoCreate, db: Session = Depends(get_db)):
    """
    Crea una nueva nota de crédito:
    1. Valida que la factura original exista
    2. Valida que medio_pago coincida con factura original
    3. Registra la nota de crédito
    4. REINTEGRA stock de productos
    5. Registra en Cuenta Corriente del cliente
    6. Ajusta caja (registro como egreso negativo / ingreso)
    """
    # Validar factura original si existe
    if nota.factura_id:
        factura = db.query(Factura).filter(Factura.id == nota.factura_id).first()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura original no encontrada")

        # Verificar que la factura no haya sido anulada
        if factura.estado == "anulada":
            raise HTTPException(status_code=400, detail="La factura original ya está anulada")
        
        # Validar que medio_pago coincida con la factura original
        if nota.medio_pago and factura.medio_pago:
            if nota.medio_pago != factura.medio_pago:
                raise HTTPException(
                    status_code=400,
                    detail=f"El medio de pago debe ser '{factura.medio_pago}' (igual que la factura original)"
                )
    
    # Obtener cliente para determinar tipo (mayorista/minorista)
    tipo_cliente = "minorista"
    cliente = db.query(Cliente).filter(Cliente.id == nota.cliente_id).first()
    if cliente:
        tipo_cliente = cliente.tipo_cliente
    
    # Obtener próximo número de nota de crédito
    max_numero = db.query(func.max(NotaCredito.numero_nota_credito)).filter(
        NotaCredito.punto_venta == nota.punto_venta,
        NotaCredito.tipo_comprobante == nota.tipo_comprobante
    ).scalar() or 0

    # Configuración de IVA: 0 = monotributo, 0.21 = responsable inscripto
    IVA_PORCENTAJE = Decimal("0")  # ← Cambiar a 0.21 si es responsable inscripto

    # Calcular totales (CONVERSIÓN DE TIPOS: float → Decimal)
    subtotal = Decimal("0")
    for detalle in nota.detalles:
        cantidad_dec = Decimal(str(detalle.cantidad))
        precio_dec = Decimal(str(detalle.precio_unitario))
        subtotal += cantidad_dec * precio_dec

    iva = subtotal * IVA_PORCENTAJE  # ← 0 para monotributo
    total = subtotal + iva
    
    # Crear nota de crédito
    db_nota = NotaCredito(
        factura_id=nota.factura_id,
        punto_venta=nota.punto_venta,
        numero_nota_credito=max_numero + 1,
        tipo_comprobante=nota.tipo_comprobante,
        fecha=date.today(),
        cliente_id=nota.cliente_id,
        motivo=nota.motivo,
        subtotal=float(subtotal),
        iva=float(iva),
        total=float(total),
        medio_pago=nota.medio_pago,
        estado="emitida"
    )
    db.add(db_nota)
    db.flush()
    
    # Crear detalles y REINTEGRAR stock
    for detalle in nota.detalles:
        cantidad_dec = Decimal(str(detalle.cantidad))
        precio_dec = Decimal(str(detalle.precio_unitario))
        
        db_detalle = NotaCreditoDetalle(
            nota_credito_id=db_nota.id,
            producto_id=detalle.producto_id,
            cantidad=cantidad_dec,
            precio_unitario=precio_dec,
            iva_porcentaje=Decimal(str(detalle.iva_porcentaje)),
            subtotal=cantidad_dec * precio_dec
        )
        db.add(db_detalle)
        
        # REINTEGRAR STOCK (la nota de crédito devuelve productos)
        producto = db.query(Producto).filter(Producto.id == detalle.producto_id).first()
        if producto:
            producto.stock_actual += cantidad_dec
    
    # Registrar en Caja como "Devolución de Venta" (ingreso negativo o egreso)
    from app.models import MovimientoCaja, CategoriaCaja, CuentaCorriente

    # Crear categoría si no existe (evita error silencioso)
    categoria_caja = db.query(CategoriaCaja).filter(
        CategoriaCaja.nombre == "Devolución de Ventas"
    ).first()

    if not categoria_caja:
        # Crear categoría si no existe
        categoria_caja = CategoriaCaja(
            nombre="Devolución de Ventas",
            tipo="egreso"
            # ← descripcion eliminado (no existe en el modelo)
        )
        db.add(categoria_caja)
        db.flush()  # Obtener ID sin commit

    # 🔍 Buscar caja abierta para vincular movimiento (ORDER BY para obtener la más reciente)
    from app.models import CajaDia
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == date.today(),
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()

    if categoria_caja:
        movimiento = MovimientoCaja(
            fecha=date.today(),
            tipo_movimiento="devolucion",
            categoria_caja_id=categoria_caja.id,
            descripcion=f"Nota de Crédito NC-{db_nota.numero_nota_credito} - {nota.motivo[:50]}",
            monto=float(total),
            tipo="egreso",  # Sale dinero de caja (devolución al cliente)
            cliente_id=nota.cliente_id,
            medio_pago=nota.medio_pago,
            caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX: Vincular a sesión de caja
        )
        db.add(movimiento)

    # Registrar movimiento en Cuenta Corriente del cliente
    # Reduce la deuda del cliente (es un crédito a su favor)
    movimiento_cc = CuentaCorriente(
        tipo='cliente',
        entidad_id=nota.cliente_id,
        venta_id=nota.factura_id,
        haber=float(total),  # Reduce deuda del cliente
        saldo=-float(total),
        descripcion=f"NC {db_nota.numero_nota_credito} - {nota.motivo[:50]}"
    )
    db.add(movimiento_cc)

    # Si hay factura original, marcar como "con nota de crédito"
    if nota.factura_id:
        factura.estado = "con_nota_credito"
    
    db.commit()
    db.refresh(db_nota)
    return db_nota

@router.get("/{nota_id}/pdf")
def descargar_nota_credito_pdf(nota_id: int, db: Session = Depends(get_db)):
    """Genera y descarga PDF de la nota de crédito"""
    from app.services.pdf_generator import generar_nota_credito_pdf
    
    nota = db.query(NotaCredito).filter(NotaCredito.id == nota_id).first()
    if not nota:
        raise HTTPException(status_code=404, detail="Nota de crédito no encontrada")
    
    # Obtener detalles y cliente
    detalles = db.query(NotaCreditoDetalle).filter(NotaCreditoDetalle.nota_credito_id == nota_id).all()
    cliente = db.query(Cliente).filter(Cliente.id == nota.cliente_id).first() if nota.cliente_id else None
    factura = db.query(Factura).filter(Factura.id == nota.factura_id).first() if nota.factura_id else None
    
    # Preparar datos para el PDF
    datos_nota = {
        "numero": f"{nota.tipo_comprobante}-{nota.punto_venta:04d}-{nota.numero_nota_credito:08d}",
        "fecha": nota.fecha.strftime("%d/%m/%Y"),
        "cliente": cliente.nombre if cliente else "Consumidor Final",
        "cuit": cliente.cuit if cliente else "00-00000000-0",
        "condicion_iva": cliente.condicion_iva if cliente else "Consumidor Final",
        "direccion": cliente.direccion if cliente else "",
        "factura_original": f"{factura.tipo_comprobante}-{factura.punto_venta:04d}-{factura.numero_factura:08d}" if factura else "N/A",
        "motivo": nota.motivo,
        "items": [
            {
                "descripcion": d.producto.nombre if d.producto else "Producto",
                "cantidad": float(d.cantidad),
                "precio_unitario": float(d.precio_unitario),
                "subtotal": float(d.subtotal)
            } for d in detalles
        ],
        "subtotal": float(nota.subtotal),
        "iva": float(nota.iva),
        "total": float(nota.total)
    }
    
    # Generar PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_path = tmp.name
    
    generar_nota_credito_pdf(datos_nota, output_path)
    
    with open(output_path, "rb") as f:
        content = f.read()
    
    os.unlink(output_path)
    
    return Response(
        content=content, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename=nota_credito_{nota.numero_nota_credito}.pdf"}
    )

@router.get("/resumen")
def resumen_notas_credito(fecha_desde: date = None, fecha_hasta: date = None, db: Session = Depends(get_db)):
    """Resumen de notas de crédito emitidas"""
    query = db.query(NotaCredito).filter(NotaCredito.estado == "emitida")
    if fecha_desde:
        query = query.filter(NotaCredito.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(NotaCredito.fecha <= fecha_hasta)
    
    notas = query.all()
    
    return {
        "total_notas": len(notas),
        "monto_total": sum(float(n.total) for n in notas),
        "por_cliente": {}
    }