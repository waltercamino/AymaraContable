from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models import Factura, FacturaDetalle, Compra, CompraDetalle, Producto, NotaCredito, NotaCreditoDetalle
from sqlalchemy import func, desc
from datetime import date, timedelta

router = APIRouter()

# ============================================
# CONSTANTES
# ============================================
# Tipos de comprobante de venta (para filtrar ganancias)
TIPOS_VENTA = ['FC-A', 'FC-B', 'ND-A', 'ND-B', 'FC', 'FB', 'ND']

# ============================================
# REPORTES EXISTENTES
# ============================================
@router.get("/ventas-semanales")
def ventas_semanales(db: Session = Depends(get_db)):
    """
    Devuelve facturas de los últimos 7 días para gráfico
    Formato: { labels: ['01/01', '02/01', ...], datasets: [{ data: [1000, 2000, ...] }] }
    """
    from app.models import Factura
    from datetime import datetime

    print(f"🔍 [VENTAS-SEMANALES] === INICIO ===")
    
    hoy = datetime.now().date()
    hace_7_dias = hoy - timedelta(days=6)
    
    print(f"🔍 [VENTAS-SEMANALES] fecha_desde: {hace_7_dias}")
    print(f"🔍 [VENTAS-SEMANALES] fecha_hasta: {hoy}")

    # Consultar facturas agrupadas por fecha
    resultados_facturas = db.query(
        Factura.fecha,
        func.sum(Factura.total).label('total')
    ).filter(
        Factura.fecha >= hace_7_dias,
        Factura.estado == "emitida"
    ).group_by(Factura.fecha).all()
    
    print(f"🔍 [VENTAS-SEMANALES] facturas encontradas (agrupadas): {len(resultados_facturas)}")
    
    # Log de cada factura individual para debugging
    facturas_individuales = db.query(Factura).filter(
        Factura.fecha >= hace_7_dias,
        Factura.fecha <= hoy
    ).all()
    print(f"🔍 [VENTAS-SEMANALES] facturas individuales (sin filtro estado): {len(facturas_individuales)}")
    
    # Log de cada factura con su estado
    for f in facturas_individuales[:10]:  # Primeras 10
        print(f"   - id={f.id}, fecha={f.fecha}, total={f.total}, estado={f.estado}, tipo={f.tipo_comprobante}")
    
    # Llenar los 7 días (incluso si no hay ventas)
    ventas_por_fecha = {}
    for r in resultados_facturas:
        fecha_str = r.fecha.strftime("%d/%m")
        ventas_por_fecha[fecha_str] = float(r.total)
    
    print(f"🔍 [VENTAS-SEMANALES] ventas_por_fecha: {ventas_por_fecha}")

    labels = []
    datos = []

    for i in range(7):
        fecha = hace_7_dias + timedelta(days=i)
        fecha_str = fecha.strftime("%d/%m")
        labels.append(fecha_str)
        datos.append(ventas_por_fecha.get(fecha_str, 0))
    
    print(f"🔍 [VENTAS-SEMANALES] labels: {labels}")
    print(f"🔍 [VENTAS-SEMANALES] datos: {datos}")
    print(f"🔍 [VENTAS-SEMANALES] === FIN ===")

    return {
        "labels": labels,
        "datasets": [{
            "label": "Ventas ($)",
            "data": datos,
            "borderColor": "#3B82F6",
            "backgroundColor": "rgba(59, 130, 246, 0.1)"
        }]
    }


@router.get("/ventas")
def reporte_ventas(fecha_desde: date = None, fecha_hasta: date = None, db: Session = Depends(get_db)):
    """Reporte general de ventas (solo facturas)"""
    from app.models import Factura

    query_facturas = db.query(Factura)

    if fecha_desde:
        query_facturas = query_facturas.filter(Factura.fecha >= fecha_desde)
    if fecha_hasta:
        query_facturas = query_facturas.filter(Factura.fecha <= fecha_hasta)

    facturas = query_facturas.filter(Factura.estado == "emitida").all()

    monto_facturas = sum(float(f.total) for f in facturas)

    por_tipo = {}
    for f in facturas:
        por_tipo[f.tipo_comprobante] = por_tipo.get(f.tipo_comprobante, 0) + float(f.total)

    return {
        "total_facturas": len(facturas),
        "monto_facturado": monto_facturas,
        "monto_total": monto_facturas,
        "por_tipo": por_tipo,
        "promedio_por_venta": monto_facturas / len(facturas) if facturas else 0
    }

@router.get("/stock")
def reporte_stock(db: Session = Depends(get_db)):
    """Reporte de stock - Productos con stock bajo"""
    productos = db.query(Producto).filter(
        Producto.activo == True,
        Producto.stock_actual <= Producto.stock_minimo
    ).all()
    
    todos = db.query(Producto).filter(Producto.activo == True).all()
    valor_total = sum(float(p.stock_actual) * float(p.precio_costo_promedio) for p in todos if hasattr(p, 'precio_costo_promedio'))
    
    return {
        "total_productos": len(todos),
        "stock_bajo": len(productos),
        "productos_bajo": [
            {
                "id": p.id,
                "nombre": p.nombre,
                "sku": p.sku,
                "stock_actual": float(p.stock_actual),
                "stock_minimo": float(p.stock_minimo),
                "faltante": float(p.stock_minimo - p.stock_actual)
            } for p in productos
        ],
        "valor_total_stock": valor_total
    }

@router.get("/caja")
def reporte_caja(fecha_desde: date = None, fecha_hasta: date = None, db: Session = Depends(get_db)):
    """Reporte de caja - Ingresos y egresos"""
    from app.models import MovimientoCaja
    
    query = db.query(MovimientoCaja)
    if fecha_desde:
        query = query.filter(MovimientoCaja.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(MovimientoCaja.fecha <= fecha_hasta)
    
    movimientos = query.all()
    
    ingresos = sum(float(m.monto) for m in movimientos if m.tipo == "ingreso")
    egresos = sum(float(m.monto) for m in movimientos if m.tipo == "egreso")
    
    por_categoria = {}
    for m in movimientos:
        cat = m.categoria_caja.nombre if m.categoria_caja else "Sin categoría"
        monto = float(m.monto) if m.tipo == "ingreso" else -float(m.monto)
        por_categoria[cat] = por_categoria.get(cat, 0) + monto
    
    return {
        "total_ingresos": ingresos,
        "total_egresos": egresos,
        "saldo": ingresos - egresos,
        "por_categoria": por_categoria
    }

@router.get("/productos-mas-vendidos")
def productos_mas_vendidos(
    limite: int = 10,
    fecha_desde: date = None,
    fecha_hasta: date = None,
    categoria_id: Optional[int] = None,
    canal: Optional[str] = Query(None, pattern="^(minorista|mayorista|todos)$"),
    comparar_con_anio_anterior: bool = False,
    db: Session = Depends(get_db)
):
    """
    Top productos más vendidos por cantidad.
    Si comparar_con_anio_anterior=True, retorna también el período anterior para análisis de seasonality.
    """
    from app.models import Cliente, Factura, FacturaDetalle
    from datetime import date as date_type

    def ejecutar_query(fd, fh, cat_id, can):
        """Ejecuta la query de productos más vendidos con los filtros dados (solo facturas)"""
        query_facturas = db.query(
            Producto.id,
            Producto.nombre,
            Producto.sku,
            func.sum(FacturaDetalle.cantidad).label("cantidad_vendida"),
            func.sum(FacturaDetalle.subtotal).label("monto_vendido")
        ).join(FacturaDetalle, Producto.id == FacturaDetalle.producto_id).join(Factura, FacturaDetalle.factura_id == Factura.id).join(
            Cliente, Factura.cliente_id == Cliente.id
        ).filter(
            Factura.estado == "emitida",
            Factura.tipo_comprobante.in_(TIPOS_VENTA)
        )

        if fd:
            query_facturas = query_facturas.filter(Factura.fecha >= fd)
        if fh:
            query_facturas = query_facturas.filter(Factura.fecha <= fh)

        if cat_id:
            query_facturas = query_facturas.filter(Producto.categoria_id == cat_id)

        if can and can != 'todos':
            if can == 'minorista':
                query_facturas = query_facturas.filter(Cliente.condicion_iva.notin_(['Responsable Inscripto']))
            elif can == 'mayorista':
                query_facturas = query_facturas.filter(Cliente.condicion_iva == 'Responsable Inscripto')

        return query_facturas.group_by(Producto.id).order_by(desc("cantidad_vendida")).limit(limite).all()

    # ============================================
    # PERÍODO ACTUAL
    # ============================================
    resultados_actual = ejecutar_query(fecha_desde, fecha_hasta, categoria_id, canal)

    periodo_actual = [
        {
            "id": r.id,
            "nombre": r.nombre,
            "sku": r.sku,
            "cantidad_vendida": int(r.cantidad_vendida or 0),
            "monto_vendido": float(r.monto_vendido or 0)
        } for r in resultados_actual
    ]

    # ============================================
    # COMPARACIÓN CON AÑO ANTERIOR (Seasonality)
    # ============================================
    if comparar_con_anio_anterior and fecha_desde and fecha_hasta:
        # Calcular fechas del período anterior (restar 1 año)
        fd_prev = fecha_desde.replace(year=fecha_desde.year - 1)
        fh_prev = fecha_hasta.replace(year=fecha_hasta.year - 1)

        resultados_anterior = ejecutar_query(fd_prev, fh_prev, categoria_id, canal)

        periodo_anterior = [
            {
                "id": r.id,
                "nombre": r.nombre,
                "sku": r.sku,
                "cantidad_vendida": int(r.cantidad_vendida or 0),
                "monto_vendido": float(r.monto_vendido or 0)
            } for r in resultados_anterior
        ]

        # Crear mapa de productos anteriores para búsqueda rápida
        mapa_anterior = {p["id"]: p for p in periodo_anterior}
        
        # Calcular variación porcentual por producto
        variacion = []
        for p_actual in periodo_actual:
            p_prev = mapa_anterior.get(p_actual["id"])
            if p_prev and p_prev["cantidad_vendida"] > 0:
                var_pct = ((p_actual["cantidad_vendida"] - p_prev["cantidad_vendida"]) / p_prev["cantidad_vendida"]) * 100
            else:
                var_pct = 100.0 if p_actual["cantidad_vendida"] > 0 else 0.0

            variacion.append({
                "id": p_actual["id"],
                "nombre": p_actual["nombre"],
                "cantidad_actual": p_actual["cantidad_vendida"],
                "cantidad_anterior": p_prev["cantidad_vendida"] if p_prev else 0,
                "variacion_pct": round(var_pct, 1)
            })

        # ✅ Estructura compatible con gráfico Recharts
        datos_grafico = [
            {
                "producto": p_actual["nombre"],
                "actual": p_actual["cantidad_vendida"],
                "anterior": mapa_anterior.get(p_actual["id"], {}).get("cantidad_vendida", 0)
            }
            for p_actual in periodo_actual[:10]  # Top 10 para el gráfico
        ]

        return {
            "periodo_actual": periodo_actual,
            "periodo_anterior": periodo_anterior,
            "variacion_por_producto": variacion,
            "datos_grafico": datos_grafico,
            "comparacion": True
        }

    # ✅ Retorno normal - también compatible con gráfico
    datos_grafico = [
        {
            "producto": p["nombre"],
            "actual": p["cantidad_vendida"],
            "anterior": 0
        }
        for p in periodo_actual[:10]  # Top 10 para el gráfico
    ]

    return {
        "periodo_actual": periodo_actual,
        "datos_grafico": datos_grafico,
        "comparacion": False
    }

# ============================================
# 🆕 NUEVOS REPORTES DE STOCK INTELIGENTE
# ============================================
@router.get("/ventas-por-producto")
def ventas_por_producto(
    fecha_desde: date = None,
    fecha_hasta: date = None,
    categoria_id: Optional[int] = None,
    canal: Optional[str] = Query(None, pattern="^(minorista|mayorista|todos)$"),
    db: Session = Depends(get_db)
):
    """
    Ventas detalladas por producto (solo facturas)
    Útil para saber qué productos se venden más y proyectar compras
    """
    from app.models import Factura, FacturaDetalle, Cliente

    # Facturas - Consulta en una sola línea
    query_facturas = db.query(
        Producto.id, Producto.nombre, Producto.sku,
        func.sum(FacturaDetalle.cantidad).label("cantidad_vendida"),
        func.sum(FacturaDetalle.subtotal).label("monto_vendido"),
        func.avg(FacturaDetalle.precio_unitario).label("precio_promedio")
    ).join(FacturaDetalle, Producto.id == FacturaDetalle.producto_id).join(Factura, FacturaDetalle.factura_id == Factura.id).join(
        Cliente, Factura.cliente_id == Cliente.id
    ).filter(Factura.estado == "emitida", Factura.tipo_comprobante.in_(TIPOS_VENTA))

    if fecha_desde:
        query_facturas = query_facturas.filter(Factura.fecha >= fecha_desde)
    if fecha_hasta:
        query_facturas = query_facturas.filter(Factura.fecha <= fecha_hasta)

    # Filtrar por categoría si se especifica
    if categoria_id:
        query_facturas = query_facturas.filter(Producto.categoria_id == categoria_id)

    # Filtrar por canal según condicion_iva
    if canal and canal != 'todos':
        if canal == 'minorista':
            query_facturas = query_facturas.filter(Cliente.condicion_iva.notin_(['Responsable Inscripto']))
        elif canal == 'mayorista':
            query_facturas = query_facturas.filter(Cliente.condicion_iva == 'Responsable Inscripto')

    facturas = query_facturas.group_by(Producto.id).all()

    # Combinar resultados
    resultado = {}
    for r in facturas:
        if r.id not in resultado:
            resultado[r.id] = {
                "id": r.id,
                "nombre": r.nombre,
                "sku": r.sku,
                "cantidad_vendida": 0,
                "monto_vendido": 0,
                "precio_promedio": 0
            }
        resultado[r.id]["cantidad_vendida"] += int(r.cantidad_vendida or 0)
        resultado[r.id]["monto_vendido"] += float(r.monto_vendido or 0)

    return list(resultado.values())

@router.get("/compras-por-producto")
def compras_por_producto(fecha_desde: date = None, fecha_hasta: date = None, db: Session = Depends(get_db)):
    """
    Compras detalladas por producto
    Útil para saber qué y cuánto se compró, y a qué precio
    """
    # Consulta en una sola línea para evitar errores de sintaxis
    query = db.query(
        Producto.id, Producto.nombre, Producto.sku,
        func.sum(CompraDetalle.cantidad).label("cantidad_comprada"),
        func.sum(CompraDetalle.subtotal).label("monto_comprado"),
        func.avg(CompraDetalle.costo_unitario).label("costo_promedio"),
        func.count(Compra.id).label("veces_comprado")
    ).join(CompraDetalle, Producto.id == CompraDetalle.producto_id).join(Compra, CompraDetalle.compra_id == Compra.id).filter(Compra.estado == "registrada")
    
    if fecha_desde:
        query = query.filter(Compra.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Compra.fecha <= fecha_hasta)
    
    compras = query.group_by(Producto.id).all()
    
    return [
        {
            "id": c.id,
            "nombre": c.nombre,
            "sku": c.sku,
            "cantidad_comprada": int(c.cantidad_comprada or 0),
            "monto_comprado": float(c.monto_comprado or 0),
            "costo_promedio": float(c.costo_promedio or 0),
            "veces_comprado": int(c.veces_comprado or 0)
        } for c in compras
    ]

@router.get("/stock-inteligente")
def stock_inteligente(dias_proyeccion: int = 30, db: Session = Depends(get_db)):
    """
    Reporte de stock inteligente con sugerencias de compra
    Considera:
    - Velocidad de venta (promedio últimos 30 días)
    - Stock actual
    - Stock mínimo
    - Proyección de quiebre de stock
    """
    from app.models import Factura, FacturaDetalle

    productos = db.query(Producto).filter(Producto.activo == True).all()
    fecha_desde = date.today() - timedelta(days=dias_proyeccion)

    resultado = []

    for p in productos:
        # Calcular velocidad de venta (últimos 30 días)
        facturas_cantidad = db.query(func.sum(FacturaDetalle.cantidad)).join(Factura).filter(
            FacturaDetalle.producto_id == p.id, Factura.fecha >= fecha_desde, Factura.estado == "emitida"
        ).scalar() or 0

        total_vendido = facturas_cantidad
        velocidad_diaria = float(total_vendido) / dias_proyeccion if dias_proyeccion > 0 else 0

        # Calcular días de stock restantes
        dias_stock = float(p.stock_actual) / velocidad_diaria if velocidad_diaria > 0 else 999

        # Determinar estado
        if p.stock_actual <= 0:
            estado = "SIN_STOCK"
            prioridad = "CRÍTICA"
        elif p.stock_actual <= p.stock_minimo:
            estado = "STOCK_BAJO"
            prioridad = "ALTA"
        elif dias_stock < dias_proyeccion / 2:
            estado = "POR_AGOTARSE"
            prioridad = "MEDIA"
        else:
            estado = "NORMAL"
            prioridad = "BAJA"

        # Calcular sugerencia de compra
        stock_deseado = velocidad_diaria * dias_proyeccion * 1.5
        sugerencia_compra = max(0, stock_deseado - float(p.stock_actual))

        resultado.append({
            "id": p.id,
            "nombre": p.nombre,
            "sku": p.sku,
            "stock_actual": float(p.stock_actual),
            "stock_minimo": float(p.stock_minimo),
            "ventas_ultimos_30_dias": int(total_vendido),
            "velocidad_diaria": round(velocidad_diaria, 2),
            "dias_stock_restantes": round(dias_stock, 1),
            "estado": estado,
            "prioridad": prioridad,
            "sugerencia_compra": int(sugerencia_compra),
            "proveedor_id": p.proveedor_id
        })

    # Ordenar por prioridad
    prioridad_order = {"CRÍTICA": 0, "ALTA": 1, "MEDIA": 2, "BAJA": 3}
    resultado.sort(key=lambda x: prioridad_order.get(x["prioridad"], 4))

    return {
        "fecha_reporte": str(date.today()),
        "dias_proyeccion": dias_proyeccion,
        "total_productos": len(resultado),
        "productos_criticos": len([p for p in resultado if p["prioridad"] == "CRÍTICA"]),
        "productos_stock_bajo": len([p for p in resultado if p["prioridad"] == "ALTA"]),
        "productos": resultado
    }

@router.get("/sugerencia-compras")
def sugerencia_compras(dias_proyeccion: int = 30, db: Session = Depends(get_db)):
    """
    Lista de compras sugeridas agrupadas por proveedor
    Basado en el stock inteligente
    """
    from app.models import Proveedor
    
    # Obtener stock inteligente
    stock = stock_inteligente(dias_proyeccion, db)
    
    # Filtrar solo productos que necesitan compra
    a_comprar = [p for p in stock["productos"] if p["sugerencia_compra"] > 0]
    
    # Agrupar por proveedor
    por_proveedor = {}
    for p in a_comprar:
        prov_id = p["proveedor_id"]
        if prov_id not in por_proveedor:
            proveedor = db.query(Proveedor).filter(Proveedor.id == prov_id).first()
            por_proveedor[prov_id] = {
                "proveedor_id": prov_id,
                "proveedor_nombre": proveedor.nombre if proveedor else "Sin proveedor",
                "productos": [],
                "monto_estimado": 0
            }
        por_proveedor[prov_id]["productos"].append(p)
    
    return {
        "fecha_sugerencia": str(date.today()),
        "dias_proyeccion": dias_proyeccion,
        "total_proveedores": len(por_proveedor),
        "total_productos_a_comprar": len(a_comprar),
        "por_proveedor": list(por_proveedor.values())
    }

@router.get("/vencimientos")
def reporte_vencimientos(dias_alerta: int = 30, db: Session = Depends(get_db)):
    """
    Reporte de productos por vencer
    """
    return {
        "fecha_reporte": str(date.today()),
        "dias_alerta": dias_alerta,
        "productos_por_vencer": [],
        "mensaje": "Para habilitar este reporte, agregar campo 'fecha_vencimiento' a la tabla productos"
    }


# ============================================
# 🆕 REPORTES FINANCIEROS
# ============================================

@router.get("/ganancia")
def reporte_ganancia(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    canal: Optional[str] = Query(None, pattern="^(minorista|mayorista|todos)$"),
    db: Session = Depends(get_db)
):
    """
    Calcula ganancia bruta segmentada por canal de venta.
    canal: 'minorista', 'mayorista', o 'todos' (default)
    
    Canal se determina por cliente.condicion_iva:
    - 'Responsable Inscripto' = Mayorista
    - Otros (Consumidor Final, Monotributista) = Minorista
    """
    from app.models import Factura, FacturaDetalle, Cliente
    from datetime import date
    
    # ✅ Parsear fechas con try/except (evitar 500 por formato inválido)
    fd, fh = None, None
    if fecha_desde:
        try:
            fd = date.fromisoformat(fecha_desde)
        except:
            pass
    if fecha_hasta:
        try:
            fh = date.fromisoformat(fecha_hasta)
        except:
            pass
    
    # ✅ Query base con JOIN a Cliente
    query = db.query(Factura).join(Cliente).filter(
        Factura.estado == "emitida",
        Factura.tipo_comprobante.in_(TIPOS_VENTA)
    )
    
    # ✅ FILTRAR POR CANAL según condicion_iva del cliente
    if canal == 'minorista':
        # Minorista: Consumidor Final, Monotributista, etc. (NO Responsable Inscripto)
        query = query.filter(Cliente.condicion_iva.notin_(['Responsable Inscripto']))
    elif canal == 'mayorista':
        # Mayorista: Responsable Inscripto
        query = query.filter(Cliente.condicion_iva == 'Responsable Inscripto')
    # si canal == 'todos' o None: sin filtro adicional
    
    if fd:
        query = query.filter(Factura.fecha >= fd)
    if fh:
        query = query.filter(Factura.fecha <= fh)
    
    facturas = query.all()
    
    # ✅ Calcular con validación de None
    monto_ventas = sum(float(f.total or 0) for f in facturas)
    
    costo_ventas = 0.0
    for f in facturas:
        # ✅ USAR 'items' (nombre correcto del relationship en modelo Factura)
        for detalle in (f.items or []):
            if detalle.costo_unitario and detalle.cantidad:
                costo_ventas += float(detalle.costo_unitario) * float(detalle.cantidad)
    
    ganancia_bruta = monto_ventas - costo_ventas
    margen_pct = (ganancia_bruta / monto_ventas * 100) if monto_ventas > 0 else 0.0
    
    return {
        "periodo": {"desde": fecha_desde, "hasta": fecha_hasta},
        "canal": canal or "todos",
        "monto_ventas": round(monto_ventas, 2),
        "costo_ventas": round(costo_ventas, 2),
        "ganancia_bruta": round(ganancia_bruta, 2),
        "margen_porcentaje": round(margen_pct, 2),
        "total_facturas": len(facturas)
    }


# ============================================
# 🆕 ENDPOINTS DE GANANCIA POR CATEGORÍA Y MÉTODO DE PAGO
# ============================================

@router.get("/ganancia-por-categoria")
def reporte_ganancia_por_categoria(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    canal: Optional[str] = Query(None, pattern="^(minorista|mayorista|todos)$"),
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna ganancia agrupada por categoría de producto, segmentada por canal.
    Si se pasa categoria_id, filtra por esa categoría específica.
    """
    from app.models import Factura, FacturaDetalle, Producto, Categoria, Cliente
    from datetime import date
    from sqlalchemy import func

    fd = date.fromisoformat(fecha_desde) if fecha_desde else None
    fh = date.fromisoformat(fecha_hasta) if fecha_hasta else None

    query = db.query(
        Categoria.id,
        Categoria.nombre,
        func.sum(FacturaDetalle.cantidad * FacturaDetalle.precio_unitario).label('ventas'),
        func.sum(FacturaDetalle.cantidad * FacturaDetalle.costo_unitario).label('costo'),
        func.sum(FacturaDetalle.cantidad).label('unidades')
    ).join(
        Producto, FacturaDetalle.producto_id == Producto.id
    ).join(
        Categoria, Producto.categoria_id == Categoria.id
    ).join(
        Factura, FacturaDetalle.factura_id == Factura.id
    ).join(
        Cliente, Factura.cliente_id == Cliente.id
    ).filter(
        Factura.estado == "emitida",
        Factura.tipo_comprobante.in_(TIPOS_VENTA),
        FacturaDetalle.costo_unitario != None
    )

    # Filtrar por categoría si se especifica
    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)

    # Filtrar por canal
    if canal == 'minorista':
        query = query.filter(Cliente.condicion_iva.notin_(['Responsable Inscripto']))
    elif canal == 'mayorista':
        query = query.filter(Cliente.condicion_iva == 'Responsable Inscripto')

    if fd:
        query = query.filter(Factura.fecha >= fd)
    if fh:
        query = query.filter(Factura.fecha <= fh)

    resultados = query.group_by(Categoria.id, Categoria.nombre).all()

    return [{
        "categoria_id": r.id,
        "categoria_nombre": r.nombre,
        "ventas": round(float(r.ventas or 0), 2),
        "costo": round(float(r.costo or 0), 2),
        "ganancia": round(float((r.ventas or 0) - (r.costo or 0)), 2),
        "margen_porcentaje": round(((r.ventas or 0) - (r.costo or 0)) / (r.ventas or 1) * 100, 2),
        "unidades_vendidas": int(r.unidades or 0)
    } for r in resultados]


@router.get("/ganancia-por-metodo-pago")
def reporte_ganancia_por_metodo_pago(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    canal: Optional[str] = Query(None, pattern="^(minorista|mayorista|todos)$"),
    db: Session = Depends(get_db)
):
    """
    Retorna ganancia agrupada por método de pago (efectivo, transferencia, etc.)
    """
    from app.models import Factura, Cliente
    from datetime import date
    from sqlalchemy import func
    
    fd = date.fromisoformat(fecha_desde) if fecha_desde else None
    fh = date.fromisoformat(fecha_hasta) if fecha_hasta else None
    
    query = db.query(
        Factura.medio_pago,
        func.sum(Factura.total).label('ventas'),
        func.count(Factura.id).label('cantidad_facturas')
    ).join(
        Cliente, Factura.cliente_id == Cliente.id
    ).filter(
        Factura.estado == "emitida",
        Factura.tipo_comprobante.in_(TIPOS_VENTA),
        Factura.medio_pago != None
    )
    
    if canal == 'minorista':
        query = query.filter(Cliente.condicion_iva.notin_(['Responsable Inscripto']))
    elif canal == 'mayorista':
        query = query.filter(Cliente.condicion_iva == 'Responsable Inscripto')
    
    if fd:
        query = query.filter(Factura.fecha >= fd)
    if fh:
        query = query.filter(Factura.fecha <= fh)
    
    resultados = query.group_by(Factura.medio_pago).all()
    
    return [{
        "metodo_pago": r.medio_pago,
        "ventas": round(float(r.ventas or 0), 2),
        "cantidad_facturas": int(r.cantidad_facturas or 0)
    } for r in resultados]


# ============================================
# 🆕 EGRESOS OPERATIVOS (Para Resultado Neto)
# ============================================

@router.get("/egresos-operativos")
def reporte_egresos_operativos(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retorna egresos de Caja agrupados por categoría, excluyendo compras de stock.
    Categorías típicas: sueldos, impuestos, alquiler, servicios, extracciones, insumos.
    
    Fórmula: Ganancia Bruta - Egresos Operativos = Resultado Neto
    """
    from app.models import MovimientoCaja, CategoriaCaja
    from datetime import date
    from sqlalchemy import func
    
    fd = date.fromisoformat(fecha_desde) if fecha_desde else None
    fh = date.fromisoformat(fecha_hasta) if fecha_hasta else None
    
    # Query de egresos por categoría
    query = db.query(
        CategoriaCaja.nombre,
        CategoriaCaja.subcategoria,
        func.sum(MovimientoCaja.monto).label('total')
    ).join(
        CategoriaCaja, MovimientoCaja.categoria_caja_id == CategoriaCaja.id
    ).filter(
        MovimientoCaja.tipo == 'egreso',
        # Excluir compras de stock (ya contadas en costo de ventas)
        CategoriaCaja.nombre.notin_(['compra_stock', 'mercaderia', 'compras']),
        CategoriaCaja.subcategoria != 'compra_stock'
    )
    
    if fd:
        query = query.filter(MovimientoCaja.fecha >= fd)
    if fh:
        query = query.filter(MovimientoCaja.fecha <= fh)
    
    resultados = query.group_by(CategoriaCaja.nombre, CategoriaCaja.subcategoria).all()
    
    # Calcular total
    total_egresos = sum(float(r.total or 0) for r in resultados)
    
    # Formatear respuesta
    por_categoria = [{
        "categoria": r.nombre + (f" - {r.subcategoria}" if r.subcategoria else ""),
        "monto": round(float(r.total or 0), 2),
        "porcentaje": round(float(r.total or 0) / total_egresos * 100, 1) if total_egresos > 0 else 0
    } for r in resultados]
    
    # Ordenar por monto (mayor a menor)
    por_categoria.sort(key=lambda x: x["monto"], reverse=True)

    return {
        "periodo": {"desde": fecha_desde, "hasta": fecha_hasta},
        "total_egresos": round(total_egresos, 2),
        "por_categoria": por_categoria
    }


# ============================================
# 🆕 PROYECCIÓN DE VENTAS ESTACIONAL
# ============================================

@router.get("/proyeccion-ventas")
def proyeccion_ventas_estacional(
    mes: int = Query(..., ge=1, le=12),
    anio_actual: int = Query(...),
    anio_anterior: int = Query(...),
    categoria_id: Optional[int] = Query(None),
    canal: Optional[str] = Query(None, pattern="^(minorista|mayorista|todos)$"),
    db: Session = Depends(get_db)
):
    """
    Retorna productos con ventas comparativas para proyección estacional.
    Fórmula de sugerencia:
    - Valor base: ventas del año actual (o promedio si hay 2+ años)
    - Factor ajuste: según variación % vs año anterior
    - Sugerencia = valor_base × factor_ajuste
    """
    from app.models import Factura, FacturaDetalle, Producto, Categoria, Cliente
    from sqlalchemy import case
    
    # Mapeo de variación % a factor de ajuste
    def calcular_factor_ajuste(variacion_pct: float) -> float:
        if variacion_pct >= 20:
            return 1.15  # +15%
        elif variacion_pct >= 5:
            return 1.05   # +5%
        elif variacion_pct >= -9:
            return 1.00  # sin cambio
        elif variacion_pct >= -29:
            return 0.95  # -5%
        else:
            return 0.85   # -15%
    
    # Query base
    query = db.query(
        Producto.id,
        Producto.nombre,
        Producto.sku,
        Categoria.id.label('categoria_id'),
        Categoria.nombre.label('categoria_nombre'),
        func.sum(
            case(
                (func.extract('year', Factura.fecha) == anio_actual, FacturaDetalle.cantidad),
                else_=0
            )
        ).label('ventas_actual'),
        func.sum(
            case(
                (func.extract('year', Factura.fecha) == anio_anterior, FacturaDetalle.cantidad),
                else_=0
            )
        ).label('ventas_anterior')
    ).join(
        FacturaDetalle, FacturaDetalle.producto_id == Producto.id
    ).join(
        Factura, FacturaDetalle.factura_id == Factura.id
    ).join(
        Categoria, Producto.categoria_id == Categoria.id
    ).join(
        Cliente, Factura.cliente_id == Cliente.id
    ).filter(
        Factura.estado == "emitida",
        Factura.tipo_comprobante.in_(TIPOS_VENTA),
        func.extract('month', Factura.fecha) == mes
    )
    
    # Filtros opcionales
    if categoria_id:
        query = query.filter(Categoria.id == categoria_id)
    if canal == 'minorista':
        query = query.filter(Cliente.condicion_iva.notin_(['Responsable Inscripto']))
    elif canal == 'mayorista':
        query = query.filter(Cliente.condicion_iva == 'Responsable Inscripto')
    
    query = query.group_by(
        Producto.id, Producto.nombre, Producto.sku,
        Categoria.id, Categoria.nombre
    )
    resultados = query.all()
    
    # Procesar resultados con fórmula de sugerencia
    proyecciones = []
    for r in resultados:
        actual = int(r.ventas_actual or 0)
        anterior = int(r.ventas_anterior or 0)
        
        # Variación %
        variacion = ((actual - anterior) / anterior * 100) if anterior > 0 else (100 if actual > 0 else 0)
        
        # Tendencia visual
        tendencia = "up" if variacion >= 5 else ("down" if variacion <= -10 else "stable")
        
        # Sugerencia automática
        if actual > 0 or anterior > 0:
            valor_base = actual if actual > 0 else anterior
            factor = calcular_factor_ajuste(variacion)
            sugerencia = round(valor_base * factor)
        else:
            sugerencia = None  # Sin datos históricos
        
        proyecciones.append({
            "producto_id": r.id,
            "producto_nombre": r.nombre,
            "sku": r.sku,
            "categoria_id": r.categoria_id,
            "categoria_nombre": r.categoria_nombre,
            "ventas_actual": actual,
            "ventas_anterior": anterior,
            "variacion_pct": round(variacion, 1),
            "tendencia": tendencia,
            "sugerencia": sugerencia
        })
    
    return {
        "periodo": {"mes": mes, "anio_actual": anio_actual, "anio_anterior": anio_anterior},
        "categoria": categoria_id,
        "canal": canal,
        "productos": proyecciones
    }


# ============================================
# FACTURACION - RESUMEN (Migrado desde facturacion.py)
# ============================================

@router.get("/facturacion/resumen")
def resumen_facturacion(
    fecha_desde: date = None,
    fecha_hasta: date = None,
    db: Session = Depends(get_db)
):
    """Resumen de facturacion"""
    query = db.query(Factura).filter(Factura.estado == "emitida")
    if fecha_desde:
        query = query.filter(Factura.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(Factura.fecha <= fecha_hasta)

    facturas = query.all()

    por_tipo = {}
    for f in facturas:
        por_tipo[f.tipo_comprobante] = por_tipo.get(f.tipo_comprobante, 0) + float(f.total)

    return {
        "total_facturas": len(facturas),
        "monto_total": sum(float(f.total) for f in facturas),
        "por_tipo": por_tipo
    }
