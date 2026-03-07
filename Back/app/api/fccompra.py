from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from app.database import get_db
from app.models import Compra, CompraDetalle, Producto, Proveedor, HistorialCostos, MovimientoCaja, CategoriaCaja, CuentaCorriente, CajaDia
from app.schemas import FCCompraCreate, CompraResponse, CompraResponseComplete, CompraUpdate
from sqlalchemy import func

router = APIRouter(prefix="/api/fc-compra", tags=["fc_compra"])

# ============================================
# ENDPOINTS
# ============================================
@router.get("/")
def listar_fc_compras(
    estado: Optional[str] = None,  # 'registrada', 'anulada', 'todas'
    proveedor_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """
    Lista FC Compras con filtros:
    - estado: 'registrada', 'anulada', 'todas' (default: 'registrada')
    - proveedor_id: Filtrar por proveedor
    - fecha_desde / fecha_hasta: Rango de fechas
    """
    print("🔍 DEBUG: Entró a GET /api/fc-compra/")
    try:
        query = db.query(Compra).options(
            joinedload(Compra.proveedor),
            joinedload(Compra.detalles)
        )
        
        # Filtro por estado (default: 'registrada')
        if estado and estado != 'todas':
            query = query.filter(Compra.estado == estado)
            print(f"   Filtro estado: {estado}")
        elif not estado:
            query = query.filter(Compra.estado == "registrada")
            print("   Filtro estado: registrada (default)")
        
        # Filtro por proveedor
        if proveedor_id:
            query = query.filter(Compra.proveedor_id == proveedor_id)
            print(f"   Filtro proveedor_id: {proveedor_id}")
        
        # Filtro por fecha
        if fecha_desde:
            query = query.filter(Compra.fecha >= fecha_desde)
            print(f"   Filtro fecha_desde: {fecha_desde}")
        if fecha_hasta:
            query = query.filter(Compra.fecha <= fecha_hasta)
            print(f"   Filtro fecha_hasta: {fecha_hasta}")
        
        compras = query.order_by(Compra.fecha.desc()).all()
        print(f"✅ Encontradas {len(compras)} compras")

        result = [{
            "id": c.id,
            "numero_interno": c.numero_interno,
            "numero_factura": c.numero_factura,
            "proveedor_id": c.proveedor_id,
            "proveedor_nombre": c.proveedor.nombre if c.proveedor else "-",
            "fecha": c.fecha.isoformat() if c.fecha else None,
            "total": float(c.total),
            "medio_pago": c.medio_pago,
            "estado": c.estado,
            "anulado_por": c.anulado_por,
            "fecha_anulacion": c.fecha_anulacion.isoformat() if c.fecha_anulacion else None,
            "motivo_anulacion": c.motivo_anulacion
        } for c in compras]
        
        print(f"   Retornando {len(result)} registros")
        return result
        
    except Exception as e:
        print(f"❌ ERROR EN FC COMPRA: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

@router.get("/verificar-numero")
def verificar_numero_factura(
    numero_factura: str,
    proveedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Verifica si ya existe una factura con este número para el proveedor.
    Excluye facturas anuladas (pueden reutilizarse).
    """
    existe = db.query(Compra).filter(
        Compra.numero_factura == numero_factura,
        Compra.proveedor_id == proveedor_id,
        Compra.estado != 'anulada'
    ).first()

    return {"existe": existe is not None}

@router.get("/{compra_id}", response_model=CompraResponseComplete)
def obtener_compra(compra_id: int, db: Session = Depends(get_db)):
    """Obtiene una compra con detalle"""
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    return compra

@router.post("/", response_model=CompraResponse, status_code=status.HTTP_201_CREATED)
def crear_compra(compra: FCCompraCreate, db: Session = Depends(get_db), usuario_id: Optional[int] = None):
    """
    Crea una nueva Factura de Compra o Nota de Crédito de Proveedor:
    1. Valida formato de numero_factura (PV-NUMERO)
    2. Valida que numero_factura no esté duplicada para el proveedor
    3. Genera numero_interno automático (FC-0001)
    4. Registra la compra
    5. Stock: AUMENTA (compra) o RESTA (NC)
    6. Actualiza historial de costos
    7. Caja: EGRESO (compra) o INGRESO (NC)
    8. CC: Aumenta deuda (compra) o Reduce deuda (NC)

    ⚠️ FIX MONOTRIBUTISTA: No se discrimina IVA - todo es costo unitario
    ⚠️ FIX INFLACIÓN: Se usa el ÚLTIMO costo de compra (no promedio ponderado)
    """
    import re

    print(f"🔍 [FCCOMPRA] === INICIO ===")
    print(f"🔍 [FCCOMPRA] fecha del frontend: {compra.fecha}")
    print(f"🔍 [FCCOMPRA] fecha del servidor (date.today()): {date.today()}")
    print(f"🔍 [FCCOMPRA] medio_pago: {compra.medio_pago}")

    # Determinar tipo de operación
    es_nota_credito = compra.tipo_comprobante == "nota_credito"

    # ✅ FIX: Usar SIEMPRE la fecha del servidor, no la del frontend
    fecha_venta = date.today()
    print(f"✅ [FCCOMPRA] Usando fecha del servidor: {fecha_venta}")

    # Forzar medio_pago a cta_cte para Notas de Crédito
    medio_pago = "cta_cte" if es_nota_credito else compra.medio_pago

    # ⚠️ FIX: Validar formato de N° Factura (PV-NUMERO)
    numero_factura = compra.numero_factura.strip()

    # Validar formato: "0001-00001234" o "1-1234" (1-4 dígitos - 1-8 dígitos)
    patron_factura = r'^\d{1,4}-\d{1,8}$'
    if not re.match(patron_factura, numero_factura):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"N° de Factura inválido. Formato esperado: 0001-00001234 (Punto de Venta-Número)"
        )

    # Validar que numero_factura no exista para ese proveedor
    existe = db.query(Compra).filter(
        Compra.numero_factura == numero_factura,
        Compra.proveedor_id == compra.proveedor_id,
        Compra.estado == "registrada"
    ).first()

    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Factura '{numero_factura}' ya registrada para este proveedor"
        )

    # Generar numero_interno automático (FC-0001, FC-0002, etc.) - más corto
    ultima_compra = db.query(Compra).order_by(Compra.id.desc()).first()
    siguiente_numero = (ultima_compra.id + 1) if ultima_compra else 1
    numero_interno = f"FC-{siguiente_numero:04d}"  # FC-0025 (corto, 4 dígitos)

    # ⚠️ FIX: NO calcular IVA - monotributista (todo es costo)
    subtotal = sum(Decimal(str(d.cantidad)) * Decimal(str(d.costo_unitario)) for d in compra.detalles)
    iva = Decimal("0")  # ← NO discriminar IVA para monotributo
    total = subtotal  # Total = Subtotal (sin IVA discriminado)

    # Crear compra (usar estado 'registrada' para ambos tipos)
    db_compra = Compra(
        numero_interno=numero_interno,
        fecha=compra.fecha,
        proveedor_id=compra.proveedor_id,
        numero_remision=compra.numero_remision,
        numero_factura=compra.numero_factura,
        fecha_vencimiento=compra.fecha_vencimiento,
        subtotal=float(subtotal),
        iva=float(iva),
        total=float(total),
        medio_pago=compra.medio_pago,
        estado="registrada",
        observaciones=compra.observaciones,
        usuario_id=usuario_id
    )
    db.add(db_compra)
    db.flush()

    # Lista para registrar cambios de precio (para filtro "Solo precios que cambiaron")
    productos_con_cambios = []

    # Procesar detalles
    for detalle in compra.detalles:
        # Obtener producto y GUARDAR COSTO ANTERIOR antes de actualizar
        producto = db.query(Producto).filter(Producto.id == detalle.producto_id).first()
        costo_anterior = float(producto.costo_promedio) if producto and producto.costo_promedio else Decimal("0")

        # 1. Crear detalle de compra con costo_anterior guardado
        db_detalle = CompraDetalle(
            compra_id=db_compra.id,
            producto_id=detalle.producto_id,
            cantidad=Decimal(str(detalle.cantidad)),
            costo_unitario=Decimal(str(detalle.costo_unitario)),
            costo_anterior=Decimal(str(costo_anterior)),  # ← GUARDAR PARA ANULACIÓN
            subtotal=Decimal(str(detalle.cantidad)) * Decimal(str(detalle.costo_unitario))
        )
        db.add(db_detalle)

        # 2. STOCK: AUMENTA (compra) o RESTA (NC) según tipo
        if producto:
            stock_anterior = producto.stock_actual or 0
            cantidad_compra = Decimal(str(detalle.cantidad))
            costo_compra = Decimal(str(detalle.costo_unitario))

            # Guardar precio de venta anterior ANTES de actualizar
            precio_venta_anterior = float(producto.precio_venta) if producto.precio_venta else 0.0

            # Calcular nuevo stock (INVERTIR según tipo)
            if es_nota_credito:
                nuevo_stock = stock_anterior - cantidad_compra  # ← NC RESTA stock
            else:
                nuevo_stock = stock_anterior + cantidad_compra  # ← Compra SUMA stock

            # ⚠️ FIX: COSTO = ÚLTIMO PRECIO DE COMPRA (no promedio ponderado)
            # En contexto inflacionario, el último costo refleja mejor el costo de reposición
            producto.costo_promedio = costo_compra.quantize(Decimal('0.01'))
            producto.stock_actual = nuevo_stock

            # 3. Recalcular precio_venta con margen de categoría
            margen = float(producto.margen_personalizado) if producto.margen_personalizado is not None else (
                float(producto.categoria.margen_default_minorista) if producto.categoria else 25.0
            )
            from app.api.precios import aplicar_redondeo_argentino
            producto.precio_venta = aplicar_redondeo_argentino(float(producto.costo_promedio) * (1 + margen / 100))
            producto.actualizado_en = datetime.utcnow()

            # 4. Registrar cambio de precio para el filtro "Solo precios que cambiaron"
            precio_venta_nuevo = float(producto.precio_venta)
            costo_nuevo = float(producto.costo_promedio)
            
            # Solo registrar si el precio cambió significativamente
            if abs(precio_venta_nuevo - precio_venta_anterior) > 0.01:
                productos_con_cambios.append({
                    "id": producto.id,
                    "nombre": producto.nombre,
                    "costo_anterior": float(costo_anterior),
                    "costo_nuevo": costo_nuevo,
                    "precio_venta_anterior": precio_venta_anterior,
                    "precio_venta_nuevo": precio_venta_nuevo
                })

            print(f"DEBUG [último costo] {producto.nombre}:")
            print(f"  Stock anterior: {stock_anterior}")
            print(f"  Compra: {cantidad_compra} x {costo_compra}")
            print(f"  Costo anterior guardado: ${costo_anterior}")
            print(f"  Nuevo stock: {nuevo_stock}, Nuevo costo (último): ${producto.costo_promedio}")
            print(f"  Margen aplicado: {margen}%, Nuevo precio venta: ${producto.precio_venta}")
            print(f"  ✅ Precio cambió: ${precio_venta_anterior} → ${precio_venta_nuevo}")

        # 4. Actualizar HISTORIAL DE COSTOS
        # Cerrar costo anterior
        db.query(HistorialCostos).filter(
            HistorialCostos.producto_id == detalle.producto_id,
            HistorialCostos.fecha_hasta == None
        ).update({"fecha_hasta": compra.fecha})

        # Crear nuevo registro de costo
        nuevo_costo = HistorialCostos(
            producto_id=detalle.producto_id,
            costo_compra=Decimal(str(detalle.costo_unitario)),
            proveedor_id=compra.proveedor_id,
            fecha_desde=compra.fecha,
            fecha_hasta=None
        )
        db.add(nuevo_costo)

    # 5. Registrar EGRESO (compra) o INGRESO (NC) en Caja
    # 🔍 Buscar caja abierta para vincular movimiento (ORDER BY para obtener la más reciente)
    print(f"🔍 [FCCOMPRA] Buscando caja abierta para fecha: {fecha_venta}")
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == fecha_venta,  # ✅ Usar fecha_venta del servidor
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()

    print(f"🔍 [FCCOMPRA] caja_abierta.id: {caja_abierta.id if caja_abierta else 'NULL'}")
    print(f"🔍 [FCCOMPRA] caja_abierta.estado: {caja_abierta.estado if caja_abierta else 'NULL'}")

    # ✅ Medios de pago que se registran en caja (pagos inmediatos)
    medios_pago_caja = ["efectivo", "transferencia", "cheque", "tarjeta"]
    print(f"🔍 [FCCOMPRA] medio_pago: {medio_pago}, medios_pago_caja: {medios_pago_caja}")
    print(f"🔍 [FCCOMPRA] ¿medio_pago in caja? {medio_pago in medios_pago_caja}")

    # 🔍 Buscar categoría específica
    nombre_categoria = "Nota de Crédito" if es_nota_credito else "Compra de Mercadería"
    categoria_caja = db.query(CategoriaCaja).filter(
        CategoriaCaja.nombre == nombre_categoria
    ).first()

    # ✅ FALLBACK: Si no encuentra, usar primera categoría del tipo correcto
    if not categoria_caja:
        print(f"⚠️ [FCCOMPRA] Categoría '{nombre_categoria}' no encontrada, buscando fallback...")
        categoria_caja = db.query(CategoriaCaja).filter(
            CategoriaCaja.tipo == ("ingreso" if es_nota_credito else "egreso")
        ).first()
        if categoria_caja:
            print(f"✅ [FCCOMPRA] Usando fallback: {categoria_caja.nombre} (ID: {categoria_caja.id})")
        else:
            print(f"❌ [FCCOMPRA] No hay categorías de tipo '{'ingreso' if es_nota_credito else 'egreso'}' disponibles")

    # ✅ Crear movimiento solo si hay categoría Y caja abierta Y medio_pago válido
    if categoria_caja and caja_abierta and medio_pago in medios_pago_caja:
        movimiento = MovimientoCaja(
            fecha=fecha_venta,  # ✅ Usar fecha_venta del servidor
            tipo_movimiento="ingreso_nc" if es_nota_credito else "compra",
            categoria_caja_id=categoria_caja.id,
            descripcion=f"{'Nota de Crédito' if es_nota_credito else 'Compra'} a proveedor - Factura {compra.numero_factura or 'N/A'} ({medio_pago})",
            monto=Decimal(str(total)),
            tipo="ingreso" if es_nota_credito else "egreso",  # ← Invertir según tipo
            proveedor_id=compra.proveedor_id,
            medio_pago=medio_pago,
            caja_id=caja_abierta.id  # ✅ FIX: Vincular a sesión de caja
        )
        db.add(movimiento)
        print(f"✅ [FCCOMPRA] Movimiento ID={movimiento.id} creado con caja_id={movimiento.caja_id}, medio_pago={medio_pago}, tipo={movimiento.tipo}, monto={movimiento.monto}")
    else:
        print(f"⚠️ [FCCOMPRA] NO se creó movimiento:")
        print(f"   - categoria_caja: {bool(categoria_caja)}")
        print(f"   - caja_abierta: {bool(caja_abierta)}")
        print(f"   - medio_pago ({medio_pago}) in {medios_pago_caja}: {medio_pago in medios_pago_caja}")

    # 6. Registrar en CUENTA CORRIENTE según medio de pago (INVERTIR según tipo)
    if medio_pago == "cta_cte":
        # Deja deuda abierta (o reduce si es NC)
        movimiento_cc = CuentaCorriente(
            tipo='proveedor',
            entidad_id=compra.proveedor_id,
            compra_id=db_compra.id,
            debe=0 if es_nota_credito else float(total),      # ← Invertir
            haber=float(total) if es_nota_credito else 0,     # ← Invertir
            saldo=0,  # Se calcula dinámicamente
            fecha=compra.fecha,
            fecha_vencimiento=compra.fecha_vencimiento,
            descripcion=f"{'NC' if es_nota_credito else 'FC'} {compra.numero_factura} - Cuenta Corriente",
            medio_pago='cta_cte'
        )
        db.add(movimiento_cc)

    elif medio_pago in ['efectivo', 'transferencia', 'cheque']:
        # Pago inmediato → no genera deuda (debe = haber)
        movimiento_cc = CuentaCorriente(
            tipo='proveedor',
            entidad_id=compra.proveedor_id,
            compra_id=db_compra.id,
            debe=float(total) if not es_nota_credito else 0,  # ← Invertir
            haber=float(total) if es_nota_credito else 0,     # ← Invertir
            saldo=0,  # No queda deuda
            fecha=compra.fecha,
            descripcion=f"{'NC' if es_nota_credito else 'FC'} {compra.numero_factura} - {medio_pago}",
            medio_pago=medio_pago
        )
        db.add(movimiento_cc)

    db.commit()
    db.refresh(db_compra)

    # ⚠️ FIX: Devolver respuesta completa que coincida con CompraResponse schema
    # FastAPI valida que la respuesta tenga TODOS los campos del schema
    return {
        "id": db_compra.id,
        "numero_interno": db_compra.numero_interno,
        "numero_factura": db_compra.numero_factura,
        "numero_remision": db_compra.numero_remision,
        "fecha": db_compra.fecha.isoformat() if db_compra.fecha else None,
        "fecha_vencimiento": db_compra.fecha_vencimiento.isoformat() if db_compra.fecha_vencimiento else None,
        "proveedor_id": db_compra.proveedor_id,
        "subtotal": float(db_compra.subtotal) if db_compra.subtotal else 0,
        "iva": float(db_compra.iva) if db_compra.iva else 0,
        "total": float(db_compra.total) if db_compra.total else 0,
        "medio_pago": db_compra.medio_pago,
        "estado": db_compra.estado,
        "observaciones": db_compra.observaciones,
        "creado_en": db_compra.creado_en.isoformat() if db_compra.creado_en else None,
        "actualizado_en": db_compra.actualizado_en.isoformat() if db_compra.actualizado_en else None,
        "anulado_por": db_compra.anulado_por,
        "fecha_anulacion": db_compra.fecha_anulacion.isoformat() if db_compra.fecha_anulacion else None,
        "motivo_anulacion": db_compra.motivo_anulacion,
        "productos_con_cambios": productos_con_cambios  # ← Para filtro "Solo precios que cambiaron"
    }

# ================================================================
# ANULAR FC COMPRA - REMOVED
# ================================================================
# ⚠️ REMOVIDO: Las facturas NO se anulan directamente.
# Para corregir facturas emitidas, usar Notas de Crédito.
# ================================================================

@router.put("/{compra_id}", response_model=CompraResponse)
def modificar_compra(
    compra_id: int,
    data: CompraUpdate,
    db: Session = Depends(get_db)
):
    """
    Modifica una compra existente:
    1. Actualiza datos de la compra (factura, remito, medio_pago)
    2. Actualiza items (cantidad, costo_unitario)
    3. Recalcula total
    4. Actualiza costo y precio de productos
    
    ⚠️ FIX: Transaccional - si falla, restaura costos anteriores
    """
    compra = db.query(Compra).filter(Compra.id == compra_id).first()
    
    if not compra:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    
    if compra.estado == "anulada":
        raise HTTPException(status_code=400, detail="No se puede modificar compra anulada")
    
    # Guardar costos anteriores para restaurar si falla
    costos_anteriores = {}
    items_originales = db.query(CompraDetalle).filter(CompraDetalle.compra_id == compra_id).all()
    for item in items_originales:
        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if producto:
            costos_anteriores[item.producto_id] = producto.costo_promedio
    
    try:
        # Actualizar datos de la compra
        if data.numero_remision is not None:
            compra.numero_remision = data.numero_remision
        if data.numero_factura is not None:
            compra.numero_factura = data.numero_factura
        if data.medio_pago is not None:
            compra.medio_pago = data.medio_pago
        
        # Actualizar items y productos
        total_compra = Decimal("0")
        
        if data.detalles:
            # Eliminar items anteriores
            db.query(CompraDetalle).filter(CompraDetalle.compra_id == compra_id).delete()

            # Crear nuevos items
            for detalle_data in data.detalles:
                # Obtener producto y guardar costo anterior
                producto = db.query(Producto).filter(Producto.id == detalle_data.producto_id).first()
                costo_anterior_prod = float(producto.costo_promedio) if producto and producto.costo_promedio else Decimal("0")
                
                # Crear nuevo detalle con costo_anterior guardado
                db_detalle = CompraDetalle(
                    compra_id=compra_id,
                    producto_id=detalle_data.producto_id,
                    cantidad=Decimal(str(detalle_data.cantidad)),
                    costo_unitario=Decimal(str(detalle_data.costo_unitario)),
                    costo_anterior=Decimal(str(costo_anterior_prod)),  # ← GUARDAR PARA ANULACIÓN
                    subtotal=Decimal(str(detalle_data.cantidad)) * Decimal(str(detalle_data.costo_unitario))
                )
                db.add(db_detalle)

                # ⚠️ FIX: Actualizar costo del producto (último costo)
                if producto:
                    # Actualizar costo (último costo de compra)
                    producto.costo_promedio = Decimal(str(detalle_data.costo_unitario)).quantize(Decimal('0.01'))

                    # Recalcular precio_venta con margen
                    margen = float(producto.margen_personalizado) if producto.margen_personalizado is not None else (
                        float(producto.categoria.margen_default_minorista) if producto.categoria else 25.0
                    )
                    from app.api.precios import aplicar_redondeo_argentino
                    producto.precio_venta = aplicar_redondeo_argentino(
                        float(producto.costo_promedio) * (1 + margen / 100)
                    )
                    producto.actualizado_en = datetime.utcnow()

                    print(f"DEBUG [modificar] {producto.nombre}:")
                    print(f"  Costo anterior guardado: ${costo_anterior_prod}")
                    print(f"  Nuevo costo: ${producto.costo_promedio}")
                    print(f"  Nuevo precio venta: ${producto.precio_venta}")

                total_compra += db_detalle.subtotal
        
        compra.total = float(total_compra)
        compra.subtotal = float(total_compra)  # Sin IVA
        compra.iva = 0
        compra.actualizado_en = datetime.utcnow()
        
        db.commit()
        
        print(f"DEBUG [modificar compra] ID {compra_id}: Total = ${total_compra}")
        
        return compra
        
    except Exception as e:
        db.rollback()
        # Restaurar costos anteriores
        for prod_id, costo in costos_anteriores.items():
            producto = db.query(Producto).filter(Producto.id == prod_id).first()
            if producto:
                producto.costo_promedio = costo
        db.commit()
        print(f"ERROR [modificar compra] Rollback realizado: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al modificar: {str(e)}")

@router.get("/resumen")
def resumen_compras(fecha_desde: date = None, fecha_hasta: date = None, db: Session = Depends(get_db)):
    """Resumen de compras"""
    query = db.query(Compra).filter(Compra.estado == "registrada")
    if fecha_desde:
        query = query.filter(Compra.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Compra.fecha <= fecha_hasta)
    
    compras = query.all()
    
    por_proveedor = {}
    for c in compras:
        proveedor = db.query(Proveedor).filter(Proveedor.id == c.proveedor_id).first()
        nombre = proveedor.nombre if proveedor else "Sin proveedor"
        por_proveedor[nombre] = por_proveedor.get(nombre, 0) + float(c.total)
    
    return {
        "total_compras": len(compras),
        "monto_total": sum(float(c.total) for c in compras),
        "por_proveedor": por_proveedor
    }