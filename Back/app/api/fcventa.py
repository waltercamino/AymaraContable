from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from urllib.parse import quote
from app.database import get_db
from app.models import Factura, FacturaDetalle, Producto, Cliente, CuentaCorriente, CajaDia, MovimientoCaja, CategoriaCaja, ConfiguracionEmpresa, Usuario
from app.schemas import FCVentaCreate, FCVentaResponse
from app.reportes.factura_venta_pdf import generar_pdf_factura
from app.reportes.nota_credito_pdf import generar_pdf_nota_credito
from app.api.usuarios import get_current_user
from app.core.permissions import require_permiso
from sqlalchemy import func

router = APIRouter(prefix="/api/fc-venta", tags=["fc_venta"])

# ================================================================
# LISTAR FC VENTAS
# ================================================================

@router.get("/")
def listar_fc_ventas(
    estado: Optional[str] = 'emitida',
    cliente_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Lista FC Ventas con filtros:
    - estado: 'emitida', 'anulada', 'todas' (default: 'emitida')
    - cliente_id: Filtrar por cliente
    - fecha_desde / fecha_hasta: Rango de fechas
    """
    print("🔍 DEBUG: Entró a GET /api/fc-venta/")
    try:
        query = db.query(Factura).options(
            joinedload(Factura.cliente),
            joinedload(Factura.items)
        )
        
        # Filtro por estado (default: 'emitida')
        if estado and estado != 'todas':
            query = query.filter(Factura.estado == estado)
            print(f"   Filtro estado: {estado}")
        elif not estado:
            query = query.filter(Factura.estado == "emitida")
            print("   Filtro estado: emitida (default)")
        
        # Filtro por cliente
        if cliente_id:
            query = query.filter(Factura.cliente_id == cliente_id)
            print(f"   Filtro cliente_id: {cliente_id}")
        
        # Filtro por fecha
        if fecha_desde:
            query = query.filter(Factura.fecha >= fecha_desde)
            print(f"   Filtro fecha_desde: {fecha_desde}")
        if fecha_hasta:
            query = query.filter(Factura.fecha <= fecha_hasta)
            print(f"   Filtro fecha_hasta: {fecha_hasta}")
        
        facturas = query.order_by(Factura.fecha.desc()).all()
        print(f"✅ Encontradas {len(facturas)} facturas")
        
        result = [{
            "id": f.id,
            "numero_interno": f.numero_interno or f"FV-{f.id:04d}",
            "punto_venta": f.punto_venta,
            "numero_factura": f.numero_factura,
            "tipo_comprobante": f.tipo_comprobante,
            "cliente_id": f.cliente_id,
            "cliente_nombre": f.cliente.nombre if f.cliente else 'Sin Cliente',
            "fecha": f.fecha.isoformat() if f.fecha else None,
            "fecha_vencimiento": f.fecha_vencimiento.isoformat() if f.fecha_vencimiento else None,
            "subtotal": float(f.subtotal) if f.subtotal else 0,
            "iva": float(f.iva) if f.iva else 0,
            "total": float(f.total) if f.total else 0,
            "medio_pago": f.medio_pago,
            "estado": f.estado,
            "observaciones": f.observaciones,
            "creado_en": f.creado_en.isoformat() if f.creado_en else None,
            "anulado_por": f.anulado_por,
            "fecha_anulacion": f.fecha_anulacion.isoformat() if f.fecha_anulacion else None,
            "motivo_anulacion": f.motivo_anulacion
        } for f in facturas]
        
        print(f"   Retornando {len(result)} registros")
        return result
        
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

# ================================================================
# OBTENER FC VENTA POR ID
# ================================================================

@router.get("/{factura_id}")
def obtener_fc_venta(factura_id: int, db: Session = Depends(get_db)):
    """Obtiene una factura de venta con detalle"""
    factura = db.query(Factura).options(
        joinedload(Factura.cliente),
        joinedload(Factura.items).joinedload(FacturaDetalle.producto)
    ).filter(Factura.id == factura_id).first()

    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    return {
        "id": factura.id,
        "numero_interno": factura.numero_interno or f"FV-{factura.numero_factura:04d}",
        "punto_venta": factura.punto_venta,
        "numero_factura": factura.numero_factura,
        "tipo_comprobante": factura.tipo_comprobante,
        "cliente_id": factura.cliente_id,
        "cliente_nombre": factura.cliente.nombre if factura.cliente else '-',
        "fecha": factura.fecha.isoformat() if factura.fecha else None,
        "fecha_vencimiento": factura.fecha_vencimiento.isoformat() if factura.fecha_vencimiento else None,
        "subtotal": float(factura.subtotal) if factura.subtotal else 0,
        "iva": float(factura.iva) if factura.iva else 0,
        "total": float(factura.total) if factura.total else 0,
        "medio_pago": factura.medio_pago,
        "estado": factura.estado,
        "observaciones": factura.observaciones,
        "creado_en": factura.creado_en.isoformat() if factura.creado_en else None,
        "anulado_por": factura.anulado_por,
        "fecha_anulacion": factura.fecha_anulacion.isoformat() if factura.fecha_anulacion else None,
        "motivo_anulacion": factura.motivo_anulacion,
        "items": [
            {
                "id": item.id,
                "producto_id": item.producto_id,
                "producto_nombre": item.producto.nombre if item.producto else '-',
                "producto_sku": item.producto.sku if item.producto else '-',
                "cantidad": float(item.cantidad),
                "precio_unitario": float(item.precio_unitario),
                "costo_unitario": float(item.costo_unitario) if item.costo_unitario else 0,
                "subtotal": float(item.subtotal),
                "ganancia": float((item.precio_unitario - (item.costo_unitario or 0)) * item.cantidad)
            } for item in factura.items
        ]
    }

# ================================================================
# BUSCAR POR NÚMERO DE FACTURA (Migrado desde facturacion.py)
# ================================================================

@router.get("/numero/{numero_factura}")
def buscar_por_numero(
    numero_factura: int,
    punto_venta: int = 1,
    tipo_comprobante: str = "FB",
    db: Session = Depends(get_db)
):
    """
    Busca una factura por su número impreso (no por ID de BD)
    Útil para el frontend cuando el usuario busca por número de factura
    """
    factura = db.query(Factura).filter(
        Factura.numero_factura == numero_factura,
        Factura.punto_venta == punto_venta,
        Factura.tipo_comprobante == tipo_comprobante
    ).first()

    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    return {
        "id": factura.id,
        "numero_interno": factura.numero_interno or f"FV-{factura.numero_factura:04d}",
        "punto_venta": factura.punto_venta,
        "numero_factura": factura.numero_factura,
        "tipo_comprobante": factura.tipo_comprobante,
        "cliente_id": factura.cliente_id,
        "cliente_nombre": factura.cliente.nombre if factura.cliente else '-',
        "fecha": factura.fecha.isoformat() if factura.fecha else None,
        "fecha_vencimiento": factura.fecha_vencimiento.isoformat() if factura.fecha_vencimiento else None,
        "subtotal": float(factura.subtotal) if factura.subtotal else 0,
        "iva": float(factura.iva) if factura.iva else 0,
        "total": float(factura.total) if factura.total else 0,
        "medio_pago": factura.medio_pago,
        "estado": factura.estado,
        "observaciones": factura.observaciones
    }

# ================================================================
# CREAR FC VENTA
# ================================================================

@router.post("/", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permiso("fc_venta", "crear"))])
def crear_fc_venta(
    data: FCVentaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Crea una nueva Factura de Venta o Nota de Crédito de Cliente:
    1. Genera número de factura AUTOMÁTICO (consecutivo por PV + tipo)
    2. Genera numero_interno automático (FV-0001 / NC-0001)
    3. Valida stock suficiente (venta) o reintegra stock (NC)
    4. Registra la venta/NC
    5. RESTA stock (venta) / SUMA stock (NC)
    6. REGISTRA en Cuenta Corriente (reduce deuda para NC)
    7. Caja: Ingreso (venta) / Egreso (NC)

    ⚠️ MONOTRIBUTISTA: No se discrimina IVA - todo es precio de venta
    """
    print("🔍 DEBUG: Entró a POST /api/fc-venta/")
    print(f"🔍 [FCVENTA] fecha recibida del frontend: {data.fecha}")
    print(f"🔍 [FCVENTA] fecha del sistema (date.today()): {date.today()}")
    print(f"🔍 [FCVENTA] fecha y hora UTC (datetime.utcnow()): {datetime.utcnow()}")
    print(f"🔍 [FCVENTA] payload: tipo_comprobante={data.tipo_comprobante}, cliente_id={data.cliente_id}, items={len(data.items)}")
    
    try:
        # Determinar tipo de operación
        es_nota_credito = data.tipo_comprobante == "nota_credito"

        # Forzar medio_pago a cta_cte para Notas de Crédito
        medio_pago = "cta_cte" if es_nota_credito else data.medio_pago

        # ⚠️ FIX: Generar número de factura AUTOMÁTICO e INCREMENTAL
        # Buscar el último número para este punto de venta + tipo comprobante
        ultima_factura = db.query(Factura).filter(
            Factura.punto_venta == data.punto_venta,
            Factura.tipo_comprobante == data.tipo_comprobante,
            Factura.estado == 'emitida'
        ).order_by(Factura.numero_factura.desc()).first()

        if ultima_factura:
            nuevo_numero_factura = ultima_factura.numero_factura + 1
        else:
            nuevo_numero_factura = 1

        print(f"   📝 Número de factura auto-generado: {nuevo_numero_factura}")

        # ✅ Generar numero_interno basado en numero_factura (NO en el ID de la BD)
        # Ej: Si numero_factura = 42, entonces numero_interno = FV-0042
        numero_interno = f"{'NC' if es_nota_credito else 'FV'}-{nuevo_numero_factura:04d}"

        # ✅ FIX: Usar SIEMPRE la fecha del servidor, no la del frontend
        # Esto evita problemas de timezone y fecha incorrecta del cliente
        fecha_venta = date.today()
        print(f"✅ [FCVENTA] Usando fecha del servidor: {fecha_venta}")

        # Calcular total (Monotributo: IVA = 0)
        total = sum(Decimal(str(item.cantidad)) * Decimal(str(item.precio_unitario)) for item in data.items)
        iva = Decimal("0")  # ← NO discriminar IVA para monotributo
        subtotal = total  # Total = Subtotal (sin IVA discriminado)

        # Crear factura con número automático
        db_factura = Factura(
            numero_interno=numero_interno,
            punto_venta=data.punto_venta,
            numero_factura=nuevo_numero_factura,  # ← AUTO GENERADO
            tipo_comprobante=data.tipo_comprobante,
            cliente_id=data.cliente_id,
            fecha=fecha_venta,  # ✅ Usar fecha del servidor
            fecha_vencimiento=data.fecha_vencimiento,
            medio_pago=medio_pago,
            subtotal=float(subtotal),
            iva=float(iva),
            total=float(total),
            estado='emitida',
            observaciones=data.observaciones,
            usuario_id=usuario.id
        )
        db.add(db_factura)
        db.flush()

        # Procesar items
        for item in data.items:
            producto = db.query(Producto).filter(Producto.id == item.producto_id).first()

            if not producto:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Producto {item.producto_id} no encontrado"
                )

            # ⚠️ VALIDAR STOCK SUFICIENTE (solo para ventas, no para NC)
            if not es_nota_credito and producto.stock_actual < Decimal(str(item.cantidad)):
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuficiente para {producto.nombre}. Stock: {producto.stock_actual}, Solicitado: {item.cantidad}"
                )

            # Guardar costo actual (para cálculo de ganancia)
            costo_unitario = float(producto.costo_promedio) if producto.costo_promedio else 0

            # ⚠️ STOCK: RESTA (venta) / SUMA (NC) según tipo
            if es_nota_credito:
                producto.stock_actual += Decimal(str(item.cantidad))  # ← NC REINTEGRA stock
            else:
                producto.stock_actual -= Decimal(str(item.cantidad))  # ← Venta RESTA stock
            producto.actualizado_en = datetime.utcnow()

            # Crear detalle
            db_detalle = FacturaDetalle(
                factura_id=db_factura.id,
                producto_id=item.producto_id,
                cantidad=Decimal(str(item.cantidad)),
                precio_unitario=Decimal(str(item.precio_unitario)),
                costo_unitario=Decimal(str(costo_unitario)),  # ← Guardar costo para ganancia
                subtotal=Decimal(str(item.cantidad)) * Decimal(str(item.precio_unitario))
            )
            db.add(db_detalle)

            print(f"DEBUG [{'NC' if es_nota_credito else 'venta'}] {producto.nombre}:")
            print(f"  Stock {'reintegrado' if es_nota_credito else 'anterior'}: {producto.stock_actual - Decimal(str(item.cantidad)) if es_nota_credito else producto.stock_actual + Decimal(str(item.cantidad))}")
            print(f"  {'Reintegrado' if es_nota_credito else 'Vendido'}: {item.cantidad}")
            print(f"  Nuevo stock: {producto.stock_actual}")
            print(f"  Precio unitario: ${item.precio_unitario}, Costo: ${costo_unitario}")

        # ⚠️ REGISTRAR EN CUENTA CORRIENTE (INVERTIR según tipo)
        if medio_pago == 'cta_cte':
            if es_nota_credito:
                # NC: Reduce deuda del cliente (crédito a su favor)
                movimiento_cc = CuentaCorriente(
                    tipo='cliente',
                    entidad_id=data.cliente_id,
                    venta_id=db_factura.id,
                    debe=0,  # Reduce deuda
                    haber=float(total),  # ← Crédito a favor
                    saldo=0,  # Se calcula dinámicamente
                    fecha=datetime.utcnow(),
                    fecha_vencimiento=data.fecha_vencimiento,
                    descripcion=f"NC {db_factura.punto_venta}-{db_factura.numero_factura:08d} - Nota de Crédito",
                    medio_pago='cta_cte'
                )
            else:
                # Venta: Deja deuda abierta (cliente nos debe)
                movimiento_cc = CuentaCorriente(
                    tipo='cliente',
                    entidad_id=data.cliente_id,
                    venta_id=db_factura.id,
                    debe=float(total),  # Cliente nos debe
                    haber=0,
                    saldo=0,  # Se calcula dinámicamente
                    fecha=datetime.utcnow(),
                    fecha_vencimiento=data.fecha_vencimiento,
                    descripcion=f"FC {db_factura.punto_venta}-{db_factura.numero_factura:08d} - {medio_pago}",
                    medio_pago='cta_cte'
                )
            db.add(movimiento_cc)
        else:
            # Pago inmediato → no genera deuda (debe = haber)
            if es_nota_credito:
                # NC: Reduce deuda (inverso a venta)
                movimiento_cc = CuentaCorriente(
                    tipo='cliente',
                    entidad_id=data.cliente_id,
                    venta_id=db_factura.id,
                    debe=float(total),  # Entró la NC
                    haber=float(total),  # Se aplicó inmediatamente
                    saldo=0,  # No queda deuda
                    fecha=datetime.utcnow(),
                    descripcion=f"NC {db_factura.punto_venta}-{db_factura.numero_factura:08d} - {medio_pago}",
                    medio_pago=medio_pago
                )
            else:
                # Venta normal
                movimiento_cc = CuentaCorriente(
                    tipo='cliente',
                    entidad_id=data.cliente_id,
                    venta_id=db_factura.id,
                    debe=float(total),  # Entró la factura
                    haber=float(total),  # Se pagó inmediatamente
                    saldo=0,  # No queda deuda
                    fecha=fecha_venta,  # ✅ Consistente con la factura
                    descripcion=f"FC {db_factura.punto_venta}-{db_factura.numero_factura:08d} - {medio_pago}",
                    medio_pago=medio_pago
                )
            db.add(movimiento_cc)

        # ⚠️ REGISTRAR EN CAJA (INVERTIR según tipo)
        # 🔍 Buscar caja abierta para vincular movimiento (ORDER BY para obtener la más reciente)
        caja_abierta = db.query(CajaDia).filter(
            CajaDia.fecha == fecha_venta,  # ✅ Usar fecha_venta
            CajaDia.estado == "abierto"
        ).order_by(CajaDia.fecha_apertura.desc()).first()

        # 🔍 DEBUG: Logging temporal
        print(f"🔍 [FCVENTA] caja_abierta.id={caja_abierta.id if caja_abierta else None}")
        print(f"🔍 [FCVENTA] total={total}, tipo={'egreso' if es_nota_credito else 'ingreso'}")
        print(f"🔍 [FCVENTA] medio_pago={medio_pago}")

        # 🔍 Buscar categoría específica
        nombre_categoria = "Devolución de Ventas" if es_nota_credito else "Venta de Mercadería"
        categoria_caja = db.query(CategoriaCaja).filter(
            CategoriaCaja.nombre == nombre_categoria
        ).first()

        # ✅ FALLBACK: Si no encuentra, usar primera categoría del tipo correcto
        if not categoria_caja:
            print(f"⚠️ [FCVENTA] Categoría '{nombre_categoria}' no encontrada, buscando fallback...")
            categoria_caja = db.query(CategoriaCaja).filter(
                CategoriaCaja.tipo == ("egreso" if es_nota_credito else "ingreso")
            ).first()
            if categoria_caja:
                print(f"✅ [FCVENTA] Usando fallback: {categoria_caja.nombre} (ID: {categoria_caja.id})")
            else:
                print(f"❌ [FCVENTA] No hay categorías de tipo '{'egreso' if es_nota_credito else 'ingreso'}' disponibles")

        # ✅ Crear movimiento solo si hay categoría (específica o fallback) Y caja abierta
        # ✅ Medios de pago que se registran en caja (pagos inmediatos)
        medios_pago_caja = ["efectivo", "transferencia", "cheque", "tarjeta"]

        if categoria_caja and caja_abierta and medio_pago in medios_pago_caja:
            movimiento = MovimientoCaja(
                fecha=fecha_venta,  # ✅ Usar fecha_venta
                tipo_movimiento="devolucion" if es_nota_credito else "venta",
                categoria_caja_id=categoria_caja.id,
                descripcion=f"{'Nota de Crédito' if es_nota_credito else 'Venta'} - Factura {db_factura.punto_venta}-{db_factura.numero_factura:08d} ({medio_pago})",
                monto=Decimal(str(total)),
                tipo="egreso" if es_nota_credito else "ingreso",  # ← Invertir según tipo
                cliente_id=data.cliente_id,
                medio_pago=medio_pago,
                caja_id=caja_abierta.id  # ✅ FIX: Vincular a sesión de caja
            )
            db.add(movimiento)
            print(f"✅ [FCVENTA] Movimiento ID={movimiento.id} creado con caja_id={movimiento.caja_id}, medio_pago={medio_pago}")
        else:
            print(f"⚠️ [FCVENTA] NO se creó movimiento:")
            print(f"   - categoria_caja: {bool(categoria_caja)}")
            print(f"   - caja_abierta: {bool(caja_abierta)}")
            print(f"   - medio_pago ({medio_pago}) in {medios_pago_caja}: {medio_pago in medios_pago_caja}")

        db.commit()
        db.refresh(db_factura)

        print(f"✅ {'NC' if es_nota_credito else 'FC'} Venta {'emitida' if es_nota_credito else 'creada'}: {numero_interno}")

        # Devolver respuesta completa con número formateado
        return {
            "id": db_factura.id,
            "numero_interno": db_factura.numero_interno,
            "numero_factura_completo": f"{db_factura.punto_venta}-{db_factura.numero_factura:08d}",  # ← NÚMERO COMPLETO
            "punto_venta": db_factura.punto_venta,
            "numero_factura": db_factura.numero_factura,
            "tipo_comprobante": db_factura.tipo_comprobante,
            "cliente_id": db_factura.cliente_id,
            "cliente_nombre": db_factura.cliente.nombre if db_factura.cliente else '-',
            "fecha": db_factura.fecha.isoformat() if db_factura.fecha else None,
            "fecha_vencimiento": db_factura.fecha_vencimiento.isoformat() if db_factura.fecha_vencimiento else None,
            "subtotal": float(db_factura.subtotal),
            "iva": float(db_factura.iva),
            "total": float(db_factura.total),
            "medio_pago": db_factura.medio_pago,
            "estado": db_factura.estado,
            "observaciones": db_factura.observaciones,
            "creado_en": db_factura.creado_en.isoformat() if db_factura.creado_en else None,
            "items": [
                {
                    "id": item.id,
                    "producto_id": item.producto_id,
                    "producto_nombre": item.producto.nombre if item.producto else '-',
                    "producto_sku": item.producto.sku if item.producto else '-',
                    "cantidad": float(item.cantidad),
                    "precio_unitario": float(item.precio_unitario),
                    "costo_unitario": float(item.costo_unitario) if item.costo_unitario else 0,
                    "subtotal": float(item.subtotal),
                    "ganancia": float((item.precio_unitario - (item.costo_unitario or 0)) * item.cantidad)
                } for item in db_factura.items
            ]
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

# ================================================================
# ANULAR FC VENTA - REMOVED
# ================================================================
# ⚠️ REMOVIDO: Las facturas NO se anulan directamente.
# Para corregir facturas emitidas, usar Notas de Crédito.
# ================================================================


@router.get("/{venta_id}/pdf")
def generar_fc_venta_pdf(
    venta_id: int,
    db: Session = Depends(get_db)
):
    """
    Genera un PDF con la factura de venta.

    Args:
        venta_id: ID de la factura de venta
    """
    try:
        print(f"🔍 [PDF] === INICIO GENERACIÓN PDF ===")
        print(f"🔍 [PDF] venta_id: {venta_id}")
        
        # 1. Obtener factura con detalles y cliente
        factura = db.query(Factura).options(
            joinedload(Factura.cliente),
            joinedload(Factura.items).joinedload(FacturaDetalle.producto)
        ).filter(Factura.id == venta_id).first()

        if not factura:
            print(f"❌ [PDF] Factura no encontrada (ID: {venta_id})")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Factura no encontrada"
            )

        print(f"🔍 [PDF] Factura encontrada: {factura.numero_interno}")
        print(f"🔍 [PDF] Cliente: {factura.cliente.nombre if factura.cliente else 'NULL'}")
        print(f"🔍 [PDF] Número: {factura.punto_venta}-{factura.numero_factura:08d}")

        # 2. Serializar datos de la factura
        factura_data = {
            "id": factura.id,
            "numero_interno": factura.numero_interno or f"FV-{factura.numero_factura:04d}",
            "punto_venta": factura.punto_venta,
            "numero_factura": factura.numero_factura,
            "tipo_comprobante": factura.tipo_comprobante,
            "fecha": factura.fecha.isoformat() if factura.fecha else None,
            "subtotal": float(factura.subtotal) if factura.subtotal else 0,
            "iva": float(factura.iva) if factura.iva else 0,
            "total": float(factura.total) if factura.total else 0,
            "medio_pago": factura.medio_pago or 'N/A',
            "observaciones": factura.observaciones,
            "cliente": {
                "nombre": factura.cliente.nombre if factura.cliente else '',
                "nombre_completo": factura.cliente.nombre if factura.cliente else '',
                "cuit": factura.cliente.cuit if factura.cliente else None,
                "direccion": factura.cliente.direccion if factura.cliente else None,
                "localidad": factura.cliente.ciudad if factura.cliente else None,
                "email": factura.cliente.email if factura.cliente else None,
                "telefono": factura.cliente.telefono if factura.cliente else None,
                "condicion_iva": factura.cliente.condicion_iva if factura.cliente else 'N/A',
            },
            "items": [
                {
                    "producto_id": item.producto_id if item.producto else None,
                    "producto_codigo": item.producto.sku if item.producto else '',
                    "producto_nombre": item.producto.nombre if item.producto else 'N/A',
                    "cantidad": float(item.cantidad),
                    "precio_unitario": float(item.precio_unitario),
                    "descuento": float(item.descuento) if hasattr(item, 'descuento') and item.descuento else 0,
                    "subtotal": float(item.subtotal)
                } for item in factura.items
            ]
        }

        print(f"🔍 [PDF] Datos serializados, generando PDF...")

        # 3. Obtener datos de empresa
        config = db.query(ConfiguracionEmpresa).first()
        empresa_data = {
            'nombre_empresa': config.nombre_empresa if config else 'AYMARA',
            'razon_social': config.razon_social if config else '',
            'cuit': config.cuit if config else '',
            'condicion_iva': config.condicion_iva if config else '',
            'ingresos_brutos': config.ingresos_brutos if config else '',
            'inicio_actividades': config.inicio_actividades.isoformat() if config and config.inicio_actividades else '',
            'direccion': config.direccion if config else '',
            'localidad': config.localidad if config else '',
            'telefono': config.telefono if config else '',
            'email': config.email if config else '',
            'pie_factura': config.pie_factura if config else ''
        }

        # 4. Detectar tipo de comprobante y generar PDF correspondiente
        es_nota_credito = factura.tipo_comprobante and factura.tipo_comprobante.lower() in ['nota_credito', 'nc', 'nota de crédito']
        
        try:
            if es_nota_credito:
                print(f"✅ [PDF] Generando PDF de Nota de Crédito...")
                pdf_bytes = generar_pdf_nota_credito(factura_data, empresa_data)
                tipo_archivo = "NC"
            else:
                print(f"✅ [PDF] Generando PDF de Factura de Venta...")
                pdf_bytes = generar_pdf_factura(factura_data, empresa_data)
                tipo_archivo = "FC"
            print(f"✅ [PDF] PDF generado exitosamente ({len(pdf_bytes)} bytes)")
        except Exception as pdf_error:
            import traceback
            print(f"❌ [PDF] ERROR al generar PDF: {str(pdf_error)}")
            print(f"❌ [PDF] Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al generar PDF: {str(pdf_error)}"
            )

        # 5. Retornar como archivo descargable
        from datetime import datetime
        nombre_cliente = (factura.cliente.nombre or 'cliente').replace(' ', '_')
        fecha_str = datetime.now().strftime("%Y%m%d")
        
        # ✅ Determinar prefijo y número según tipo de comprobante
        es_nota_credito = factura.tipo_comprobante and factura.tipo_comprobante.lower() in ['nota_credito', 'nc', 'nota de crédito']
        
        if es_nota_credito:
            # NC: Usar solo el número (ej: "0005" de "NC-0005")
            numero_comprobante = factura.numero_interno or f"NC-{factura.numero_factura:04d}"
            numero_solo = numero_comprobante.replace('NC-', '')  # Sacar prefijo "NC-"
            nombre_archivo = f"NC_Ventas_{numero_solo}_{nombre_cliente}_{fecha_str}.pdf"
        else:
            # FC: Usar numero_interno completo (ej: "FV-0077")
            numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:04d}"
            nombre_archivo = f"FC_Venta_{numero_comprobante}_{nombre_cliente}_{fecha_str}.pdf"

        print(f"✅ [PDF] Retornando PDF: {nombre_archivo}")
        print(f"🔍 [PDF] === FIN ===")

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{nombre_archivo}\""
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ [PDF] ERROR CRÍTICO: {str(e)}")
        print(f"❌ [PDF] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}"
        )


# ================================================================
# COMPARTIR PDF - WHATSAPP / EMAIL (Reutilizar lógica de Pedidos)
# ================================================================

def generar_nombre_archivo(factura, tipo_comprobante: str) -> str:
    """
    Genera nombre de archivo igual que el endpoint de PDF
    Ej: FC_Venta_FV-0077_Lo_de_Juana_20260302.pdf o NC_Ventas_0005_Lo_de_Juana_20260302.pdf
    """
    import re
    from datetime import datetime

    # Nombre del cliente sanitizado
    cliente_nombre = "Cliente"
    if factura.cliente and factura.cliente.nombre:
        cliente_nombre = factura.cliente.nombre
    # Sanitizar: solo letras, números, guiones y guiones bajos
    cliente_nombre_sanitizado = re.sub(r'[^\w\s-]', '', cliente_nombre).strip().replace(' ', '_')

    # Fecha
    fecha_str = datetime.now().strftime("%Y%m%d")

    # ✅ Determinar prefijo y número según tipo de comprobante
    es_nota_credito = tipo_comprobante.lower() in ['nota_credito', 'nc', 'nota de crédito']
    
    if es_nota_credito:
        # NC: Usar solo el número (ej: "0005" de "NC-0005")
        numero_comprobante = factura.numero_interno or f"NC-{factura.numero_factura:04d}"
        numero_solo = numero_comprobante.replace('NC-', '')  # Sacar prefijo "NC-"
        return f"NC_Ventas_{numero_solo}_{cliente_nombre_sanitizado}_{fecha_str}.pdf"
    else:
        # FC: Usar numero_interno completo (ej: "FV-0077")
        numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:04d}"
        return f"FC_Venta_{numero_comprobante}_{cliente_nombre_sanitizado}_{fecha_str}.pdf"


def formatear_telefono_arg(telefono: str) -> str:
    """
    Convierte teléfono a formato internacional WhatsApp Argentina:
    - Elimina espacios, guiones, paréntesis
    - Quita 0 inicial si tiene
    - Agrega 549 al inicio si es de Argentina
    Ejemplo: "03512345678" → "5493512345678"
    """
    if not telefono:
        return ""

    # Solo dígitos
    telefono_limpio = ''.join(filter(str.isdigit, telefono))

    # ✅ Quitar 0 inicial si tiene (tu solución)
    if telefono_limpio.startswith('0'):
        telefono_limpio = telefono_limpio[1:]

    # Si ya tiene código de país, retornar
    if telefono_limpio.startswith('549'):
        return telefono_limpio

    # Si tiene 10 dígitos (celular), agregar 549
    if len(telefono_limpio) == 10:
        return f"549{telefono_limpio}"

    # Si tiene 11 dígitos (con 15 al inicio), quitar 15 y agregar 549
    if len(telefono_limpio) == 11 and telefono_limpio.startswith('15'):
        return f"549{telefono_limpio[2:]}"

    return telefono_limpio


@router.get("/{factura_id}/whatsapp", dependencies=[Depends(require_permiso("fc_venta", "ver"))])
def generar_link_whatsapp(factura_id: int, db: Session = Depends(get_db)):
    """
    Genera link de WhatsApp + URL para descargar PDF.
    Flujo: Descargar PDF primero → Abrir WhatsApp → Usuario adjunta manualmente.
    """
    factura = db.query(Factura).filter(Factura.id == factura_id).first()
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    if not factura.cliente or not factura.cliente.telefono:
        raise HTTPException(status_code=400, detail="Cliente sin teléfono registrado")

    # Determinar tipo de comprobante
    es_nota_credito = factura.tipo_comprobante and factura.tipo_comprobante.lower() in ['nota_credito', 'nc', 'nota de crédito']
    tipo_comprobante = "Nota de Crédito" if es_nota_credito else "Factura"

    numero_comprobante = f"{factura.punto_venta:04d}-{factura.numero_factura:08d}"

    # Formatear teléfono (sin 0 inicial)
    telefono = formatear_telefono_arg(factura.cliente.telefono)

    # Construir mensaje
    mensaje = f"""Hola! Te envío tu {tipo_comprobante} N° {numero_comprobante}.

Importe Total: $ {factura.total:,.2f}

Cualquier consulta, estamos a disposición.
Gracias!"""

    link = f"https://api.whatsapp.com/send?phone={telefono}&text={quote(mensaje)}"

    # ✅ URL para descargar PDF primero + NOMBRE DE ARCHIVO
    url_pdf = f"/api/fc-venta/{factura_id}/pdf"
    nombre_archivo = generar_nombre_archivo(factura, factura.tipo_comprobante or "factura")

    return {
        "link": link,
        "telefono": telefono,
        "cliente": factura.cliente.nombre if factura.cliente else '',
        "tipo_comprobante": tipo_comprobante,
        "numero_comprobante": numero_comprobante,
        "pdf_url": url_pdf,
        "pdf_filename": nombre_archivo  # ← Nombre formateado del backend
    }


@router.get("/{factura_id}/email", dependencies=[Depends(require_permiso("fc_venta", "ver"))])
def generar_link_email(factura_id: int, db: Session = Depends(get_db)):
    """
    Genera link mailto: para abrir app de correo nativa + URL para descargar PDF.
    Flujo: Descargar PDF primero → Abrir app de correo → Usuario adjunta manualmente.
    """
    factura = db.query(Factura).options(
        joinedload(Factura.cliente)
    ).filter(Factura.id == factura_id).first()
    
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    # Determinar tipo de comprobante
    es_nota_credito = factura.tipo_comprobante and factura.tipo_comprobante.lower() in ['nota_credito', 'nc', 'nota de crédito']
    tipo_comprobante = "Nota de Crédito" if es_nota_credito else "Factura"

    numero_comprobante = f"{factura.punto_venta:04d}-{factura.numero_factura:08d}"

    # Email del cliente si existe
    email_cliente = factura.cliente.email if factura.cliente and factura.cliente.email else ''

    asunto = f"{tipo_comprobante} {numero_comprobante}"
    cuerpo = f"""Estimado cliente,

Adjunto encontrará su {tipo_comprobante} N° {numero_comprobante}.

Importe Total: $ {factura.total:,.2f}

Muchas gracias por su confianza.

Saludos cordiales."""

    # ✅ Link mailto: para abrir app nativa
    link_mailto = f"mailto:{email_cliente}?subject={quote(asunto)}&body={quote(cuerpo)}"

    # ✅ URL para descargar PDF + NOMBRE DE ARCHIVO
    url_pdf = f"/api/fc-venta/{factura_id}/pdf"
    nombre_archivo = generar_nombre_archivo(factura, factura.tipo_comprobante or "factura")

    return {
        "link": link_mailto,
        "email": email_cliente,
        "pdf_url": url_pdf,
        "pdf_filename": nombre_archivo  # ← Nombre formateado del backend
    }
