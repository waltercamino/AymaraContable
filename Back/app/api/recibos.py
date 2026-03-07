from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db
from app.models import Recibo, ReciboImputacion, Cliente, Proveedor, CuentaCorriente, MovimientoCaja, CategoriaCaja, ConfiguracionEmpresa
from app.schemas import ReciboCreate, ReciboResponse, ReciboImputacionCreate, ReciboAnular
from app.reportes.recibo_pdf import generar_pdf_recibo

router = APIRouter(prefix="/api/recibos", tags=["recibos"])


@router.get("/")
def listar_recibos(
    tipo: Optional[str] = None,  # 'cobro' o 'pago'
    entidad_id: Optional[int] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    estado: Optional[str] = 'registrado',
    db: Session = Depends(get_db)
):
    """
    Lista recibos con filtros:
    - tipo: 'cobro', 'pago', 'todas'
    - entidad_id: cliente_id (cobros) o proveedor_id (pagos)
    - fecha_desde / fecha_hasta: Rango de fechas
    - estado: 'registrado', 'anulado', 'todas'
    """
    query = db.query(Recibo).options(
        joinedload(Recibo.cliente),
        joinedload(Recibo.proveedor),
        joinedload(Recibo.imputaciones)
    )
    
    # Filtro por estado
    if estado and estado != 'todas':
        query = query.filter(Recibo.estado == estado)
    
    # Filtro por tipo
    if tipo and tipo != 'todas':
        query = query.filter(Recibo.tipo == tipo)
    
    # Filtro por entidad
    if entidad_id:
        if tipo == 'cobro':
            query = query.filter(Recibo.cliente_id == entidad_id)
        elif tipo == 'pago':
            query = query.filter(Recibo.proveedor_id == entidad_id)
    
    # Filtro por fecha
    if fecha_desde:
        query = query.filter(Recibo.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Recibo.fecha <= fecha_hasta)
    
    recibos = query.order_by(Recibo.fecha.desc()).all()

    return [{
        "id": r.id,
        "numero_interno": r.numero_interno,
        "tipo": r.tipo,
        "cliente_id": r.cliente_id,
        "proveedor_id": r.proveedor_id,
        "cliente_nombre": r.cliente.nombre if r.cliente else None,
        "proveedor_nombre": r.proveedor.nombre if r.proveedor else None,
        "entidad_nombre": r.cliente.nombre if r.cliente else (r.proveedor.nombre if r.proveedor else "N/A"),
        "fecha": r.fecha.isoformat() if r.fecha else None,
        "monto": float(r.monto),
        "medio_pago": r.medio_pago,
        "estado": r.estado,
        "observaciones": r.observaciones,
        "creado_en": r.creado_en.isoformat() if r.creado_en else None,
        # ✅ Auditoría de anulación
        "anulado_por": r.anulado_por,
        "fecha_anulacion": r.fecha_anulacion.isoformat() if r.fecha_anulacion else None,
        "motivo_anulacion": r.motivo_anulacion,
        "imputaciones": [
            {
                "id": i.id,
                "venta_id": i.venta_id,
                "compra_id": i.compra_id,
                "monto_imputado": float(i.monto_imputado)
            } for i in r.imputaciones
        ]
    } for r in recibos]


@router.get("/{recibo_id}")
def obtener_recibo(recibo_id: int, db: Session = Depends(get_db)):
    """Obtiene un recibo con sus imputaciones"""
    recibo = db.query(Recibo).options(
        joinedload(Recibo.cliente),
        joinedload(Recibo.proveedor),
        joinedload(Recibo.imputaciones)
    ).filter(Recibo.id == recibo_id).first()
    
    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")
    
    return {
        "id": recibo.id,
        "numero_interno": recibo.numero_interno,
        "tipo": recibo.tipo,
        "cliente_id": recibo.cliente_id,
        "proveedor_id": recibo.proveedor_id,
        "cliente_nombre": recibo.cliente.nombre if recibo.cliente else None,
        "proveedor_nombre": recibo.proveedor.nombre if recibo.proveedor else None,
        "fecha": recibo.fecha.isoformat() if recibo.fecha else None,
        "monto": float(recibo.monto),
        "medio_pago": recibo.medio_pago,
        "estado": recibo.estado,
        "observaciones": recibo.observaciones,
        "creado_en": recibo.creado_en.isoformat() if recibo.creado_en else None,
        "imputaciones": [
            {
                "id": i.id,
                "venta_id": i.venta_id,
                "compra_id": i.compra_id,
                "monto_imputado": float(i.monto_imputado)
            } for i in recibo.imputaciones
        ]
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_recibo(
    data: ReciboCreate,
    db: Session = Depends(get_db),
    usuario_id: Optional[int] = None
):
    """
    Crea un nuevo recibo (cobro o pago):
    1. Genera número interno automático (R-0001)
    2. Registra el recibo
    3. Procesa imputaciones a FCs específicas
    4. Registra en Cuenta Corriente (reduce deuda)
    5. Registra en Caja (movimiento de dinero)
    """
    # Validaciones básicas
    if data.tipo == 'cobro' and not data.cliente_id:
        raise HTTPException(status_code=400, detail="Cliente es requerido para cobros")
    if data.tipo == 'pago' and not data.proveedor_id:
        raise HTTPException(status_code=400, detail="Proveedor es requerido para pagos")

    # ✅ PERMITIR: Recibos sin imputación (saldo a favor)
    # Solo validar que el monto sea mayor a 0
    if not data.monto or data.monto <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")
    
    # 1. Generar número interno automático
    ultimo_recibo = db.query(Recibo).order_by(Recibo.id.desc()).first()
    numero_interno = f"R-{(ultimo_recibo.id + 1) if ultimo_recibo else 1:04d}"
    
    # 2. Crear recibo
    recibo = Recibo(
        numero_interno=numero_interno,
        tipo=data.tipo,  # 'cobro' o 'pago'
        cliente_id=data.cliente_id if data.tipo == 'cobro' else None,
        proveedor_id=data.proveedor_id if data.tipo == 'pago' else None,
        fecha=data.fecha,
        monto=data.monto,
        medio_pago=data.medio_pago,
        estado='registrado',
        observaciones=data.observaciones,
        usuario_id=usuario_id
    )
    db.add(recibo)
    db.flush()

    # 3. ✅ SIMPLIFICADO: Registrar en Cuenta Corriente (sin imputación a FCs específicas)
    # El monto total va como haber (pago) o debe (cobro) en cuenta corriente
    entidad_id = data.cliente_id if data.tipo == 'cobro' else data.proveedor_id
    
    # Registrar movimiento en Cuenta Corriente
    movimiento_cc = CuentaCorriente(
        tipo='cliente' if data.tipo == 'cobro' else 'proveedor',
        entidad_id=entidad_id,
        cobro_id=recibo.id if data.tipo == 'cobro' else None,
        pago_id=recibo.id if data.tipo == 'pago' else None,
        # ✅ SIN venta_id/compra_id - no hay imputación a FC específica
        debe=0,
        haber=float(data.monto),  # El monto total reduce deuda/crédito
        saldo=-float(data.monto),
        fecha=data.fecha,
        descripcion=f"Recibo {numero_interno} - {data.medio_pago}",
        medio_pago=data.medio_pago
    )
    db.add(movimiento_cc)

    # 4. Registrar en Caja
    # NOTA: MovimientoCaja NO tiene cliente_id, solo proveedor_id
    # Para cobros de clientes, guardamos la info en descripcion
    tipo_movimiento = "cobro" if data.tipo == 'cobro' else "pago"
    tipo_caja = "ingreso" if data.tipo == 'cobro' else "egreso"
    
    # Obtener nombre de la entidad para la descripción
    entidad_nombre = ""
    if data.tipo == 'cobro' and data.cliente_id:
        cliente = db.query(Cliente).filter(Cliente.id == data.cliente_id).first()
        entidad_nombre = cliente.nombre if cliente else f"Cliente #{data.cliente_id}"
    elif data.tipo == 'pago' and data.proveedor_id:
        proveedor = db.query(Proveedor).filter(Proveedor.id == data.proveedor_id).first()
        entidad_nombre = proveedor.nombre if proveedor else f"Proveedor #{data.proveedor_id}"

    # 🔍 Buscar caja abierta para vincular movimiento (ORDER BY para obtener la más reciente)
    from app.models import CajaDia
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == date.today(),
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()

    movimiento_caja = MovimientoCaja(
        fecha=data.fecha,
        tipo_movimiento=tipo_movimiento,
        categoria_caja_id=None,  # Se puede asignar categoría específica
        descripcion=f"Recibo {numero_interno} - {tipo_movimiento.capitalize()} a {entidad_nombre} - {data.medio_pago}",
        monto=float(data.monto),
        tipo=tipo_caja,
        proveedor_id=data.proveedor_id if data.tipo == 'pago' else None,  # Solo para pagos
        medio_pago=data.medio_pago,
        comprobante_nro=numero_interno,
        usuario_id=usuario_id,
        caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX: Vincular a sesión de caja
    )
    db.add(movimiento_caja)
    
    db.commit()
    db.refresh(recibo)
    
    return {
        "id": recibo.id,
        "numero_interno": recibo.numero_interno,
        "tipo": recibo.tipo,
        "monto": float(recibo.monto),
        "medio_pago": recibo.medio_pago,
        "mensaje": "Recibo registrado correctamente"
    }


@router.post("/{recibo_id}/anular")
def anular_recibo(
    recibo_id: int,
    data: ReciboAnular,  # ✅ Usar schema con motivo requerido
    db: Session = Depends(get_db),
    usuario_id: Optional[int] = None
):
    """
    Anula un recibo y revierte los movimientos en Cuenta Corriente
    """
    recibo = db.query(Recibo).filter(
        Recibo.id == recibo_id,
        Recibo.estado == 'registrado'
    ).first()

    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo no encontrado o ya está anulado")

    # ✅ Validar motivo requerido
    if not data.motivo or len(data.motivo.strip()) < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El motivo de anulación es requerido y no puede estar vacío"
        )

    motivo = data.motivo.strip()

    try:
        # Revertir movimientos en Cuenta Corriente
        # ✅ 1. Buscar TODOS los movimientos asociados al recibo (imputaciones + saldo a favor)
        entidad_id = recibo.cliente_id if recibo.tipo == 'cobro' else recibo.proveedor_id
        
        movimientos_existentes = db.query(CuentaCorriente).filter(
            or_(
                CuentaCorriente.cobro_id == recibo.id,
                CuentaCorriente.pago_id == recibo.id
            )
        ).all()

        # ✅ 2. Crear movimiento inverso por cada movimiento existente
        for mov in movimientos_existentes:
            # Invertir: debe ↔ haber
            movimiento_inverso = CuentaCorriente(
                tipo='cliente' if recibo.tipo == 'cobro' else 'proveedor',
                entidad_id=entidad_id,
                cobro_id=recibo.id if recibo.tipo == 'cobro' else None,
                pago_id=recibo.id if recibo.tipo == 'pago' else None,
                venta_id=mov.venta_id,  # Mantener referencia a FC si existe
                compra_id=mov.compra_id,  # Mantener referencia a FC si existe
                debe=float(mov.haber),  # Invertir: haber → debe
                haber=float(mov.debe),  # Invertir: debe → haber
                saldo=float(mov.debe) - float(mov.haber),  # Saldo inverso
                fecha=datetime.utcnow(),
                descripcion=f"Anulación Recibo {recibo.numero_interno} - {motivo}",
                medio_pago='anulacion'
            )
            db.add(movimiento_inverso)

        # ✅ 3. Actualizar estado del recibo
        recibo.estado = 'anulado'
        recibo.anulado_por = usuario_id
        recibo.fecha_anulacion = datetime.utcnow()
        recibo.motivo_anulacion = motivo

        db.commit()
        
        return {
            "message": "Recibo anulado correctamente",
            "numero_interno": recibo.numero_interno,
            "motivo": motivo
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al anular: {str(e)}")


@router.get("/{recibo_id}/pdf")
def imprimir_recibo(recibo_id: int, db: Session = Depends(get_db)):
    """
    Genera un PDF del recibo para imprimir
    """
    print(f"🔍 [RECIBO-API] === INICIO ===")
    print(f"🔍 [RECIBO-API] recibo_id: {recibo_id}")
    
    recibo = db.query(Recibo).options(
        joinedload(Recibo.cliente),
        joinedload(Recibo.proveedor),
        joinedload(Recibo.imputaciones).joinedload(ReciboImputacion.venta),
        joinedload(Recibo.imputaciones).joinedload(ReciboImputacion.compra)
    ).filter(Recibo.id == recibo_id).first()

    if not recibo:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")

    print(f"🔍 [RECIBO-API] recibo.numero_interno: {recibo.numero_interno}")
    print(f"🔍 [RECIBO-API] recibo.tipo: {recibo.tipo}")
    print(f"🔍 [RECIBO-API] recibo.fecha: {recibo.fecha}")
    print(f"🔍 [RECIBO-API] recibo.monto: {recibo.monto}")

    # Serializar datos para el generador de PDF
    recibo_data = {
        "id": recibo.id,
        "numero_interno": recibo.numero_interno,  # ← R-0018, NO recibo.id
        "tipo": recibo.tipo,
        "fecha": recibo.fecha.isoformat() if recibo.fecha else None,
        "monto": float(recibo.monto),
        "medio_pago": recibo.medio_pago,
        "estado": recibo.estado,
        "observaciones": recibo.observaciones,
        "cliente": {
            "nombre": recibo.cliente.nombre if recibo.cliente else '',
            "apellido": recibo.cliente.apellido if recibo.cliente else '',
            "cuit": recibo.cliente.cuit if recibo.cliente else None,
            "direccion": recibo.cliente.direccion if recibo.cliente else None
        } if recibo.cliente else None,
        "proveedor": {
            "nombre": recibo.proveedor.nombre if recibo.proveedor else ''
        } if recibo.proveedor else None,
        "imputaciones": [
            {
                "venta_id": i.venta_id,
                "compra_id": i.compra_id,
                "monto_imputado": float(i.monto_imputado),
                "venta_numero": i.venta.numero_interno if i.venta else None,
                "compra_numero": i.compra.numero_interno if i.compra else None
            } for i in recibo.imputaciones
        ]
    }

    print(f"🔍 [RECIBO-API] recibo_data: {recibo_data}")

    # Obtener datos de empresa
    config = db.query(ConfiguracionEmpresa).first()
    empresa_data = {
        'nombre_empresa': config.nombre_empresa if config else 'AYMARA',
        'cuit': config.cuit if config else '',
        'direccion': config.direccion if config else '',
        'telefono': config.telefono if config else '',
        'email': config.email if config else '',
        'pie_factura': config.pie_factura if config else ''
    }

    try:
        pdf_bytes = generar_pdf_recibo(recibo_data, empresa_data)
    except Exception as e:
        import traceback
        print(f"❌ [RECIBO-API] ERROR: {str(e)}")
        print(f"❌ [RECIBO-API] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar PDF: {str(e)}"
        )

    print(f"✅ [RECIBO-API] PDF generado: {len(pdf_bytes)} bytes")

    # Nombre del archivo con fecha - Formato: cobro_NombreCliente_YYYYMMDD.pdf
    from datetime import datetime
    import re
    
    if recibo.tipo == 'cobro':
        cliente_nombre = recibo.cliente.nombre if recibo.cliente else "sin_nombre"
        cliente_nombre_sanitizado = re.sub(r'[^\w\s-]', '', cliente_nombre).strip().replace(' ', '_')
        fecha_str = datetime.now().strftime("%Y%m%d")
        nombre_archivo = f"cobro_{cliente_nombre_sanitizado}_{fecha_str}.pdf"
    else:
        # Para pagos
        proveedor_nombre = recibo.proveedor.nombre if recibo.proveedor else "sin_nombre"
        proveedor_nombre_sanitizado = re.sub(r'[^\w\s-]', '', proveedor_nombre).strip().replace(' ', '_')
        fecha_str = datetime.now().strftime("%Y%m%d")
        nombre_archivo = f"pago_{proveedor_nombre_sanitizado}_{fecha_str}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={nombre_archivo}"
        }
    )
