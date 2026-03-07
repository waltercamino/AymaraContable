from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date  # ✅ Agregar date
from decimal import Decimal
import re as re_module  # ✅ Para regex de limpieza de descripcion
from app.database import get_db
from app.models import CuentaCorriente, MovimientoCaja, Proveedor, Cliente, CajaDia, CategoriaCaja, Recibo, ConfiguracionEmpresa
from app.schemas import CuentaCorrienteResponse, CuentaCorrienteCreate, PagoCreate, CobroCreate
from app.reportes.estado_cuenta_pdf import generar_pdf
from app.reportes.estado_cuenta_excel import generar_excel

router = APIRouter(prefix="/api/cuenta-corriente", tags=["cuenta_corriente"])

@router.get("/proveedores/{proveedor_id}")
def obtener_saldo_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el saldo y movimientos de cuenta corriente de un proveedor.
    Saldo positivo = deuda con el proveedor.
    """
    movimientos = db.query(CuentaCorriente).filter(
        CuentaCorriente.tipo == 'proveedor',
        CuentaCorriente.entidad_id == proveedor_id
    ).order_by(CuentaCorriente.fecha.asc()).all()

    # Calcular saldo acumulado
    saldo = sum(float(m.debe) - float(m.haber) for m in movimientos)

    # Serializar movimientos explícitamente
    return {
        "proveedor_id": proveedor_id,
        "saldo_actual": saldo,
        "movimientos": [
            {
                "id": m.id,
                "tipo": m.tipo,
                "entidad_id": m.entidad_id,
                "debe": float(m.debe),
                "haber": float(m.haber),
                "saldo": float(m.saldo),
                "descripcion": m.descripcion,
                "fecha": m.fecha.isoformat() if m.fecha else None,
                "medio_pago": m.medio_pago,
                "creado_en": m.creado_en.isoformat() if m.creado_en else None,
                "compra_id": m.compra_id,
                "venta_id": m.venta_id,
                "pago_id": m.pago_id,
                "cobro_id": m.cobro_id
            } for m in movimientos
        ]
    }

@router.get("/clientes/{cliente_id}")
def obtener_saldo_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """
    Obtiene el saldo y movimientos de cuenta corriente de un cliente.
    Saldo positivo = cliente nos debe.
    """
    movimientos = db.query(CuentaCorriente).filter(
        CuentaCorriente.tipo == 'cliente',
        CuentaCorriente.entidad_id == cliente_id
    ).order_by(CuentaCorriente.fecha.asc()).all()

    # Calcular saldo acumulado (debe - haber = nos debe)
    saldo = sum(float(m.debe) - float(m.haber) for m in movimientos)

    # Serializar movimientos explícitamente
    return {
        "cliente_id": cliente_id,
        "saldo_actual": saldo,
        "movimientos": [
            {
                "id": m.id,
                "tipo": m.tipo,
                "entidad_id": m.entidad_id,
                "debe": float(m.debe),
                "haber": float(m.haber),
                "saldo": float(m.saldo),
                "descripcion": m.descripcion,
                "fecha": m.fecha.isoformat() if m.fecha else None,
                "medio_pago": m.medio_pago,
                "creado_en": m.creado_en.isoformat() if m.creado_en else None,
                "compra_id": m.compra_id,
                "venta_id": m.venta_id,
                "pago_id": m.pago_id,
                "cobro_id": m.cobro_id
            } for m in movimientos
        ]
    }

@router.post("/registrar-pago", status_code=status.HTTP_201_CREATED)
def registrar_pago(
    pago: PagoCreate,
    db: Session = Depends(get_db)
):
    """
    Registra un pago a un proveedor (reduce deuda).
    Solo registra en caja si medio_pago es inmediato (efectivo, transferencia, cheque, tarjeta)
    """
    # ✅ Medios que se registran en caja
    medios_pago_caja = ["efectivo", "transferencia", "cheque", "tarjeta"]
    
    # 🔍 Buscar caja abierta
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == date.today(),  # ✅ Ahora 'date' está importado
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()
    
    print(f"🔍 [CTEPAGO] caja_abierta.id={caja_abierta.id if caja_abierta else 'NULL'}")
    print(f"🔍 [CTEPAGO] medio_pago={pago.medio_pago}")
    print(f"🔍 [CTEPAGO] ¿Se registra en caja? {pago.medio_pago in medios_pago_caja}")
    
    movimiento_caja = None
    
    # ✅ Solo crear movimiento en caja si medio_pago es inmediato
    if caja_abierta and pago.medio_pago in medios_pago_caja:
        # 🔍 Buscar categoría
        categoria_caja = db.query(CategoriaCaja).filter(
            CategoriaCaja.nombre == "Pago a Proveedores"
        ).first()
        if not categoria_caja:
            categoria_caja = db.query(CategoriaCaja).filter(
                CategoriaCaja.tipo == "egreso"
            ).first()
        
        movimiento_caja = MovimientoCaja(
            fecha=pago.fecha or date.today(),
            tipo_movimiento="pago",
            categoria_caja_id=categoria_caja.id if categoria_caja else None,
            descripcion=f"Pago a proveedor - {pago.descripcion or pago.medio_pago}",
            monto=Decimal(str(pago.monto)),  # ✅ Usar Decimal
            tipo="egreso",
            proveedor_id=pago.proveedor_id,
            medio_pago=pago.medio_pago,
            caja_id=caja_abierta.id  # ✅ Ahora siempre tiene valor si hay caja
        )
        db.add(movimiento_caja)
        db.flush()
        print(f"✅ [CTEPAGO] Movimiento caja ID={movimiento_caja.id} creado con caja_id={movimiento_caja.caja_id}")
    else:
        print(f"⚠️ [CTEPAGO] NO se crea movimiento en caja:")
        print(f"   - caja_abierta: {bool(caja_abierta)}")
        print(f"   - medio_pago in {medios_pago_caja}: {pago.medio_pago in medios_pago_caja}")
    
    # Crear movimiento en cuenta corriente (HABER)
    movimiento_cc = CuentaCorriente(
        tipo='proveedor',
        entidad_id=pago.proveedor_id,
        pago_id=movimiento_caja.id if movimiento_caja else None,
        debe=0,
        haber=float(pago.monto),
        saldo=0,
        descripcion=f"Pago: {pago.descripcion or pago.medio_pago}",
        fecha=pago.fecha or date.today()
    )
    db.add(movimiento_cc)
    db.commit()
    
    return {
        "message": "Pago registrado correctamente",
        "monto": float(pago.monto),
        "proveedor_id": pago.proveedor_id
    }

@router.post("/registrar-cobro", status_code=status.HTTP_201_CREATED)
def registrar_cobro(
    cobro: CobroCreate,
    db: Session = Depends(get_db)
):
    """
    Registra un cobro a un cliente (reduce deuda).
    Solo registra en caja si medio_pago es inmediato.
    """
    # ✅ Medios que se registran en caja
    medios_pago_caja = ["efectivo", "transferencia", "cheque", "tarjeta"]
    
    # 🔍 Buscar caja abierta
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == date.today(),
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()
    
    print(f"🔍 [CTECOBR] caja_abierta.id={caja_abierta.id if caja_abierta else 'NULL'}")
    print(f"🔍 [CTECOBR] medio_pago={cobro.medio_pago}")
    
    movimiento_caja = None
    
    # ✅ Solo crear movimiento en caja si medio_pago es inmediato
    if caja_abierta and cobro.medio_pago in medios_pago_caja:
        # 🔍 Buscar categoría
        categoria_caja = db.query(CategoriaCaja).filter(
            CategoriaCaja.nombre == "Cobro de Clientes"
        ).first()
        if not categoria_caja:
            categoria_caja = db.query(CategoriaCaja).filter(
                CategoriaCaja.tipo == "ingreso"
            ).first()
        
        movimiento_caja = MovimientoCaja(
            fecha=cobro.fecha or date.today(),
            tipo_movimiento="cobro",
            categoria_caja_id=categoria_caja.id if categoria_caja else None,
            descripcion=f"Cobro a cliente - {cobro.descripcion or cobro.medio_pago}",
            monto=Decimal(str(cobro.monto)),
            tipo="ingreso",
            cliente_id=cobro.cliente_id,
            medio_pago=cobro.medio_pago,
            caja_id=caja_abierta.id
        )
        db.add(movimiento_caja)
        db.flush()
        print(f"✅ [CTECOBR] Movimiento caja ID={movimiento_caja.id} creado con caja_id={movimiento_caja.caja_id}")
    
    # Crear movimiento en cuenta corriente
    movimiento_cc = CuentaCorriente(
        tipo='cliente',
        entidad_id=cobro.cliente_id,
        cobro_id=movimiento_caja.id if movimiento_caja else None,
        debe=0,
        haber=float(cobro.monto),
        saldo=0,
        descripcion=f"Cobro: {cobro.descripcion or cobro.medio_pago}",
        fecha=cobro.fecha or date.today()
    )
    db.add(movimiento_cc)
    db.commit()
    
    return {
        "message": "Cobro registrado correctamente",
        "monto": float(cobro.monto),
        "cliente_id": cobro.cliente_id
    }

@router.get("/resumen")
def obtener_resumen_cta_cte(db: Session = Depends(get_db)):
    """
    Obtiene resumen de todos los proveedores y clientes con saldo.
    """
    # Proveedores con saldo
    proveedores = db.query(
        CuentaCorriente.entidad_id,
        Proveedor.nombre,
        func.sum(CuentaCorriente.debe).label('total_debe'),
        func.sum(CuentaCorriente.haber).label('total_haber')
    ).join(
        Proveedor, CuentaCorriente.entidad_id == Proveedor.id
    ).filter(
        CuentaCorriente.tipo == 'proveedor'
    ).group_by(
        CuentaCorriente.entidad_id, Proveedor.nombre
    ).all()

    # Clientes con saldo
    clientes = db.query(
        CuentaCorriente.entidad_id,
        Cliente.nombre,
        func.sum(CuentaCorriente.debe).label('total_debe'),
        func.sum(CuentaCorriente.haber).label('total_haber')
    ).join(
        Cliente, CuentaCorriente.entidad_id == Cliente.id
    ).filter(
        CuentaCorriente.tipo == 'cliente'
    ).group_by(
        CuentaCorriente.entidad_id, Cliente.nombre
    ).all()

    return {
        "proveedores": [
            {
                "id": p.entidad_id,
                "nombre": p.nombre,
                "saldo": float(p.total_debe - p.total_haber)
            } for p in proveedores if (p.total_debe - p.total_haber) != 0
        ],
        "clientes": [
            {
                "id": c.entidad_id,
                "nombre": c.nombre,
                "saldo": float(c.total_debe - c.total_haber)
            } for c in clientes if (c.total_debe - c.total_haber) != 0
        ]
    }


@router.get("/{tipo}/{entidad_id}/pdf")
def generar_estado_cuenta_pdf(
    tipo: str,  # 'cliente' o 'proveedor'
    entidad_id: int,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Genera un PDF con el estado de cuenta de un cliente o proveedor.
    
    Args:
        tipo: 'cliente' o 'proveedor'
        entidad_id: ID del cliente o proveedor
        fecha_desde: Fecha de inicio del período (YYYY-MM-DD)
        fecha_hasta: Fecha de fin del período (YYYY-MM-DD)
    """
    # 1. Obtener datos de la entidad
    if tipo == 'cliente':
        entidad = db.query(Cliente).filter(Cliente.id == entidad_id).first()
    elif tipo == 'proveedor':
        entidad = db.query(Proveedor).filter(Proveedor.id == entidad_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo inválido: {tipo}. Debe ser 'cliente' o 'proveedor'"
        )
    
    if not entidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{'Cliente' if tipo == 'cliente' else 'Proveedor'} no encontrado"
        )
    
    # 2. Calcular saldo ANTERIOR al período (si hay filtro de fechas)
    saldo_anterior = 0
    if fecha_desde:
        movimientos_anteriores = db.query(CuentaCorriente).filter(
            CuentaCorriente.tipo == tipo,
            CuentaCorriente.entidad_id == entidad_id,
            CuentaCorriente.fecha < fecha_desde  # ANTES del período
        ).all()
        
        for mov in movimientos_anteriores:
            debe = float(mov.debe) if mov.debe else 0
            haber = float(mov.haber) if mov.haber else 0
            saldo_anterior += debe - haber

    # 3. Obtener movimientos DEL PERÍODO
    query = db.query(CuentaCorriente).filter(
        CuentaCorriente.tipo == tipo,
        CuentaCorriente.entidad_id == entidad_id
    )

    if fecha_desde:
        query = query.filter(CuentaCorriente.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(CuentaCorriente.fecha <= fecha_hasta)

    movimientos_db = query.order_by(CuentaCorriente.fecha.asc()).all()

    # 4. Serializar movimientos
    movimientos = [
        {
            "id": m.id,
            "fecha": m.fecha.isoformat() if m.fecha else None,
            "descripcion": m.descripcion or '',
            "debe": float(m.debe) if m.debe else 0,
            "haber": float(m.haber) if m.haber else 0
        } for m in movimientos_db
    ]

    # 5. Calcular totales del período y saldo final (acumulado desde saldo anterior)
    total_debe_periodo = sum(m['debe'] for m in movimientos)
    total_haber_periodo = sum(m['haber'] for m in movimientos)
    saldo_final = saldo_anterior + total_debe_periodo - total_haber_periodo

    # 6. Obtener datos de empresa
    config = db.query(ConfiguracionEmpresa).first()
    empresa_data = {
        'nombre_empresa': config.nombre_empresa if config else 'AYMARA CONTABLE',
        'cuit': config.cuit if config else '',
        'direccion': config.direccion if config else '',
        'telefono': config.telefono if config else '',
        'email': config.email if config else '',
        'pie_factura': config.pie_factura if config else '',
        'logo_url': config.logo_url if config else ''
    }

    # 7. Generar PDF con saldo anterior y datos de empresa
    try:
        pdf_bytes = generar_pdf(
            entidad_nombre=entidad.nombre,
            entidad_cuit=getattr(entidad, 'cuit', None),
            tipo=tipo,
            movimientos=movimientos,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            saldo_anterior=saldo_anterior,  # ← Saldo antes del período
            total_debe_periodo=total_debe_periodo,
            total_haber_periodo=total_haber_periodo,
            saldo_final=saldo_final,  # ← Saldo acumulado total
            empresa=empresa_data
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar PDF: {str(e)}"
        )
    
    # 6. Retornar como archivo descargable con fecha
    from datetime import datetime
    fecha_str = datetime.now().strftime("%Y%m%d")
    nombre_archivo = f"CTACTE_{tipo}_{entidad.nombre.replace(' ', '_')}_{fecha_str}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=\"{nombre_archivo}\""
        }
    )


@router.get("/{tipo}/{entidad_id}/excel")
def generar_estado_cuenta_excel(
    tipo: str,  # 'cliente' o 'proveedor'
    entidad_id: int,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Genera un Excel con el estado de cuenta de un cliente o proveedor.
    
    Args:
        tipo: 'cliente' o 'proveedor'
        entidad_id: ID del cliente o proveedor
        fecha_desde: Fecha de inicio del período (YYYY-MM-DD)
        fecha_hasta: Fecha de fin del período (YYYY-MM-DD)
    """
    # 1. Obtener datos de la entidad
    if tipo == 'cliente':
        entidad = db.query(Cliente).filter(Cliente.id == entidad_id).first()
    elif tipo == 'proveedor':
        entidad = db.query(Proveedor).filter(Proveedor.id == entidad_id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo inválido: {tipo}. Debe ser 'cliente' o 'proveedor'"
        )
    
    if not entidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{'Cliente' if tipo == 'cliente' else 'Proveedor'} no encontrado"
        )
    
    # 2. Obtener movimientos
    query = db.query(CuentaCorriente).filter(
        CuentaCorriente.tipo == tipo,
        CuentaCorriente.entidad_id == entidad_id
    )
    
    if fecha_desde:
        query = query.filter(CuentaCorriente.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(CuentaCorriente.fecha <= fecha_hasta)
    
    movimientos_db = query.order_by(CuentaCorriente.fecha.asc()).all()
    
    # 3. Serializar movimientos
    movimientos = [
        {
            "id": m.id,
            "fecha": m.fecha.isoformat() if m.fecha else None,
            "descripcion": m.descripcion or '',
            "debe": float(m.debe) if m.debe else 0,
            "haber": float(m.haber) if m.haber else 0,
            "saldo": float(m.saldo) if m.saldo else 0
        } for m in movimientos_db
    ]
    
    # 4. Calcular saldo final
    saldo_final = sum(m['debe'] - m['haber'] for m in movimientos)
    
    # 5. Generar Excel
    try:
        excel_bytes = generar_excel(
            entidad_nombre=entidad.nombre,
            entidad_cuit=getattr(entidad, 'cuit', None),
            tipo=tipo,
            movimientos=movimientos,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            saldo_final=saldo_final
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar Excel: {str(e)}"
        )
    
    # 6. Retornar como archivo descargable
    nombre_archivo = f"estado_cuenta_{tipo}_{entidad_id}_{entidad.nombre.replace(' ', '_')}.xlsx"
    
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=\"{nombre_archivo}\""
        }
    )


@router.get("/movimiento/{movimiento_id}/imprimir")
def imprimir_movimiento(
    movimiento_id: int,
    db: Session = Depends(get_db)
):
    """
    Genera un PDF de recibo usando datos de cuenta_corriente directamente.
    """
    print(f"🔍 [CTE-IMP] === INICIO ===")
    print(f"🔍 [CTE-IMP] movimiento_id: {movimiento_id}")
    
    # ✅ Usar tabla cuenta_corriente directamente (sin depender de recibos)
    registro = db.query(CuentaCorriente).filter(CuentaCorriente.id == movimiento_id).first()
    
    if not registro:
        print(f"❌ [CTE-IMP] Registro {movimiento_id} no encontrado en cuenta_corriente")
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    print(f"✅ [CTE-IMP] Registro encontrado en cuenta_corriente")
    print(f"🔍 [CTE-IMP] cobro_id: {registro.cobro_id}, pago_id: {registro.pago_id}")
    print(f"🔍 [CTE-IMP] descripcion: {registro.descripcion}")
    print(f"🔍 [CTE-IMP] medio_pago: {registro.medio_pago}")
    
    # Determinar tipo y entidad
    if registro.cobro_id:
        tipo = "cobro"
        tipo_entidad = "CLIENTE"
        entidad = db.query(Cliente).filter(Cliente.id == registro.entidad_id).first()
    elif registro.pago_id:
        tipo = "pago"
        tipo_entidad = "PROVEEDOR"
        entidad = db.query(Proveedor).filter(Proveedor.id == registro.entidad_id).first()
    else:
        # Fallback: intentar determinar por tipo de cuenta_corriente
        tipo = registro.tipo if registro.tipo in ['cobro', 'pago'] else 'cobro'
        tipo_entidad = "CLIENTE" if registro.tipo == 'cliente' else "PROVEEDOR"
        if registro.tipo == 'cliente':
            entidad = db.query(Cliente).filter(Cliente.id == registro.entidad_id).first()
        else:
            entidad = db.query(Proveedor).filter(Proveedor.id == registro.entidad_id).first()
    
    if not entidad:
        print(f"❌ [CTE-IMP] Entidad no encontrada (entidad_id={registro.entidad_id})")
        raise HTTPException(status_code=404, detail="Entidad no encontrada")
    
    # ✅ Generar número de recibo desde ID (fallback si no hay numero_interno)
    numero_recibo = f"R-{registro.id:04d}"  # Ej: R-0133

    # ✅ Extraer numero de descripcion si existe (ej: "Recibo R-0004 - efectivo")
    if registro.descripcion:
        match = re_module.search(r'R-\d+', registro.descripcion)
        if match:
            numero_recibo = match.group()

    # ✅ Limpiar descripcion (eliminar prefijo "Cobro:" o "Pago:")
    descripcion_limpia = ""
    if registro.descripcion:
        descripcion_limpia = re_module.sub(r'^(Cobro|Pago):\s*', '', registro.descripcion)
    
    # ✅ medio_pago: fallback si es None
    medio_pago = registro.medio_pago or "efectivo"

    # ✅ monto: usar 'haber' de cuenta_corriente (es el pago realizado)
    monto = float(registro.haber) if registro.haber else 0

    print(f"🔍 [CTE-IMP] numero_recibo: {numero_recibo}")
    print(f"🔍 [CTE-IMP] medio_pago final: {medio_pago}")
    print(f"🔍 [CTE-IMP] descripcion limpia: {descripcion_limpia}")
    print(f"🔍 [CTE-IMP] monto (desde haber): {monto}")

    # ✅ Usar datos de cuenta_corriente directamente
    recibo_data = {
        "numero_interno": numero_recibo,
        "tipo": tipo,
        "fecha": registro.fecha.isoformat() if registro.fecha else None,
        "medio_pago": medio_pago,  # ✅ "efectivo", no None
        "monto": monto,  # ✅ Usar 'haber' (pago realizado)
        "estado": "registrado",
        # ✅ Observaciones: descripcion sin prefijo "Cobro:" o "Pago:"
        "observaciones": descripcion_limpia,  # ✅ "PRUEBA", no "Cobro: PRUEBA"
        "cliente": {
            "nombre": entidad.nombre,
            "apellido": '',
            "cuit": getattr(entidad, 'cuit', None),
            "direccion": None
        } if tipo_entidad == "CLIENTE" else None,
        "proveedor": {
            "nombre": entidad.nombre
        } if tipo_entidad == "PROVEEDOR" else None,
        "imputaciones": []
    }
    
    print(f"🔍 [CTE-IMP] recibo_data: {recibo_data}")

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
    
    print(f"🔍 [CTE-IMP] empresa_data: {empresa_data}")

    # Generar PDF
    try:
        from app.reportes.recibo_pdf import generar_pdf_recibo
        pdf_bytes = generar_pdf_recibo(recibo_data, empresa=empresa_data)
    except Exception as e:
        import traceback
        print(f"❌ [CTE-IMP] ERROR: {str(e)}")
        print(f"❌ [CTE-IMP] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al generar PDF: {str(e)}"
        )

    print(f"✅ [CTE-IMP] PDF generado: {len(pdf_bytes)} bytes")

    # Nombre del archivo con fecha - Formato: cobro_NombreCliente_YYYYMMDD.pdf
    from datetime import datetime

    tipo = "cobro" if tipo == 'cobro' else "pago"
    nombre_entidad = entidad.nombre if entidad else "sin_nombre"
    nombre_sanitizado = re_module.sub(r'[^\w\s-]', '', nombre_entidad).strip().replace(' ', '_')
    fecha_str = datetime.now().strftime("%Y%m%d")
    nombre_archivo = f"{tipo}_{nombre_sanitizado}_{fecha_str}.pdf"

    print(f"🔍 [CTE-IMP] Nombre archivo: {nombre_archivo}")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={nombre_archivo}"
        }
    )


# ============================================
# RESUMEN DE DEUDORES Y ACREEDORES
# ============================================

@router.get("/resumen/deudores")
def resumen_deudores(db: Session = Depends(get_db)):
    """Clientes que nos deben dinero (saldo pendiente de cobro)"""
    clientes = db.query(Cliente).all()
    deudores = []
    
    for cliente in clientes:
        movimientos = db.query(CuentaCorriente).filter(
            CuentaCorriente.tipo == 'cliente',
            CuentaCorriente.entidad_id == cliente.id
        ).all()
        
        # Calcular saldo pendiente: DEBE (facturas) - HABER (pagos/créditos)
        # DEBE = lo que nos deben (facturas)
        # HABER = lo que nos pagaron (reduce deuda)
        total_debe = sum(float(m.debe) if m.debe else 0 for m in movimientos)
        total_haber = sum(float(m.haber) if m.haber else 0 for m in movimientos)
        saldo_pendiente = total_debe - total_haber  # ← Lo que nos deben
        
        # ✅ Mostrar si hay deuda pendiente (saldo > 0)
        if saldo_pendiente > 0.01:  # Pequeño margen para evitar problemas de punto flotante
            deudores.append({
                "id": cliente.id,
                "nombre": cliente.nombre,
                "cuit": cliente.cuit,
                "saldo": float(saldo_pendiente),
                "total_facturas": total_debe,
                "total_pagos": total_haber
            })
    
    # Ordenar por deuda (mayor a menor)
    deudores.sort(key=lambda x: x['saldo'], reverse=True)
    
    print(f"🔍 [DEUDORES] Encontrados: {len(deudores)}")  # ← Debug
    for d in deudores:
        print(f"  - {d['nombre']}: ${d['saldo']} (Facturas: ${d['total_facturas']}, Pagos: ${d['total_pagos']})")
    
    return deudores


@router.get("/resumen/acreedores")
def resumen_acreedores(db: Session = Depends(get_db)):
    """Proveedores a quienes les debemos dinero (saldo pendiente de pago)"""
    proveedores = db.query(Proveedor).all()
    acreedores = []
    
    for prov in proveedores:
        movimientos = db.query(CuentaCorriente).filter(
            CuentaCorriente.tipo == 'proveedor',
            CuentaCorriente.entidad_id == prov.id
        ).all()
        
        # Calcular saldo pendiente: DEBE (facturas) - HABER (pagos)
        # DEBE = lo que compramos (deuda)
        # HABER = lo que pagamos (reduce deuda)
        total_debe = sum(float(m.debe) if m.debe else 0 for m in movimientos)
        total_haber = sum(float(m.haber) if m.haber else 0 for m in movimientos)
        saldo_pendiente = total_debe - total_haber  # ← Lo que falta pagar
        
        # ✅ Mostrar si hay deuda pendiente (saldo > 0)
        if saldo_pendiente > 0.01:  # Pequeño margen para evitar problemas de punto flotante
            acreedores.append({
                "id": prov.id,
                "nombre": prov.nombre,
                "cuit": prov.cuit,
                "saldo": float(saldo_pendiente),  # ← Positivo = deuda pendiente
                "total_facturas": total_debe,
                "total_pagos": total_haber
            })
    
    # Ordenar por deuda (mayor a menor)
    acreedores.sort(key=lambda x: x['saldo'], reverse=True)
    
    print(f"🔍 [ACREEDORES] Encontrados: {len(acreedores)}")  # ← Debug
    for a in acreedores:
        print(f"  - {a['nombre']}: ${a['saldo']} (Facturas: ${a['total_facturas']}, Pagos: ${a['total_pagos']})")
    
    return acreedores
