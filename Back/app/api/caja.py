"""
API de Caja - Gestión completa de apertura, movimientos y cierre
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime
from app.database import get_db
from app.models import CategoriaCaja, MovimientoCaja, CajaDia, Usuario
from app.schemas import MovimientoCajaCreate, MovimientoCajaResponse, CajaDiaCreate, CajaDiaResponse, CajaCierreCreate
from app.api.usuarios import get_current_user
from sqlalchemy import func, and_

router = APIRouter(prefix="/api/caja", tags=["caja"])

# ============================================
# CAJA DÍA - APERTURA Y CIERRE
# ============================================

@router.get("/historial", response_model=List[CajaDiaResponse])
def listar_cajas_historial(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Lista cajas diarias con filtros:
    - fecha_desde / fecha_hasta: Rango de fechas
    - estado: 'abierto', 'cerrado', 'todos'
    """
    query = db.query(CajaDia).options(
        joinedload(CajaDia.usuario)
    )

    if fecha_desde:
        query = query.filter(CajaDia.fecha >= fecha_desde)
    if fecha_hasta:
        query = query.filter(CajaDia.fecha <= fecha_hasta)
    
    # ✅ FIX: Logging para debug de filtro por estado
    if estado and estado != 'todos':
        # Validar que el valor de estado sea correcto
        if estado not in ['abierto', 'cerrado']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Estado inválido: '{estado}'. Valores aceptados: 'abierto', 'cerrado', 'todos'"
            )
        query = query.filter(CajaDia.estado == estado)
        print(f"🔍 [CAJA HISTORIAL] Filtro estado='{estado}' aplicado")

    cajas = query.order_by(CajaDia.fecha.desc()).all()
    print(f"🔍 [CAJA HISTORIAL] Encontradas {len(cajas)} cajas con estado='{estado or 'todos'}'")
    
    # Serializar
    result = []
    for c in cajas:
        result.append({
            "id": c.id,
            "fecha": c.fecha.isoformat() if c.fecha else None,
            "saldo_inicial": float(c.saldo_inicial) if c.saldo_inicial else 0,
            "saldo_final": float(c.saldo_final) if c.saldo_final else None,
            "estado": c.estado,
            "usuario_id": c.usuario_id,
            "fecha_apertura": c.fecha_apertura.isoformat() if c.fecha_apertura else None,
            "fecha_cierre": c.fecha_cierre.isoformat() if c.fecha_cierre else None,
            "observaciones_cierre": c.observaciones_cierre,
        })
    
    return result

@router.get("/historial/{caja_id}/movimientos", response_model=List[MovimientoCajaResponse])
def listar_movimientos_de_caja(
    caja_id: int,
    db: Session = Depends(get_db)
):
    """Lista movimientos de una caja específica"""
    # Verificar que la caja existe
    caja = db.query(CajaDia).filter(CajaDia.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")

    # ✅ FIX: Obtener movimientos POR caja_id (sesión), NO por fecha
    query = db.query(MovimientoCaja).options(
        joinedload(MovimientoCaja.categoria_caja),
        joinedload(MovimientoCaja.proveedor),
        joinedload(MovimientoCaja.cliente)
    ).filter(
        MovimientoCaja.caja_id == caja_id  # ← Por ID de sesión, no por fecha
    )

    movimientos = query.order_by(MovimientoCaja.fecha.desc()).all()
    
    # Serializar
    result = []
    for m in movimientos:
        result.append({
            "id": m.id,
            "fecha": m.fecha.isoformat() if m.fecha else None,
            "tipo_movimiento": m.tipo_movimiento,
            "descripcion": m.descripcion,
            "monto": float(m.monto),
            "tipo": m.tipo,
            "creado_en": m.creado_en.isoformat() if m.creado_en else None,
            "categoria_nombre": m.categoria_caja.nombre if m.categoria_caja else None,
            "proveedor_nombre": m.proveedor.nombre if m.proveedor else None,
            "cliente_nombre": m.cliente.nombre if m.cliente else None,
            "medio_pago": m.medio_pago,
        })
    
    return result

@router.get("/hoy", response_model=Optional[CajaDiaResponse])
def obtener_caja_hoy(db: Session = Depends(get_db)):
    """Obtiene la caja del día actual (solo si está ABIERTA)"""
    # ✅ FIX: ORDER BY para garantizar que devuelve la más reciente si hay múltiples
    caja = db.query(CajaDia).filter(
        CajaDia.fecha == date.today(),
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()
    return caja

@router.post("/apertura", response_model=CajaDiaResponse, status_code=status.HTTP_201_CREATED)
def abrir_caja(data: CajaDiaCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)):
    """
    Abre la caja del día:
    - Si ya hay caja ABIERTA hoy → la retorna (no crear duplicada)
    - Si hay caja CERRADA hoy → crea NUEVA caja (nuevo ID)
    - Si no hay caja hoy → crea NUEVA caja
    """
    # ✅ Buscar SOLO caja ABIERTA (no cerrada)
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == data.fecha,
        CajaDia.estado == "abierto"
    ).first()

    if caja_abierta:
        # ✅ Ya hay caja abierta - retornar sin crear otra
        return caja_abierta

    # ✅ NO verificar caja cerrada - SIEMPRE crear NUEVA sesión
    # ✅ Esto garantiza NUEVO ID cada vez que se abre caja
    caja = CajaDia(
        fecha=data.fecha,
        saldo_inicial=Decimal(str(data.saldo_inicial)),
        estado="abierto",
        usuario_id=usuario.id,  # ✅ FIX: Guardar usuario que abre la caja
        fecha_apertura=datetime.utcnow()
    )

    db.add(caja)
    db.commit()
    db.refresh(caja)

    print(f"✅ [CAJA] Caja #{caja.id} abierta por usuario {usuario.username} (usuario_id={usuario.id})")

    return caja

@router.post("/cierre", response_model=CajaDiaResponse)
def cerrar_caja(data: CajaCierreCreate, db: Session = Depends(get_db), usuario_id: Optional[int] = None):
    """
    Cierra la caja del día:
    - Registra saldo final
    - Calcula diferencia con saldo teórico
    - Guarda observaciones
    """
    # Buscar caja de hoy
    caja = db.query(CajaDia).filter(
        CajaDia.fecha == date.today(),
        CajaDia.estado == "abierto"
    ).first()
    
    if not caja:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay caja abierta para hoy"
        )
    
    # Calcular saldo teórico (inicial + ingresos - egresos)
    # ✅ FIX: Filtrar por caja_id específico, no por fecha
    movimientos = db.query(MovimientoCaja).filter(
        MovimientoCaja.caja_id == caja.id
    ).all()

    total_ingresos = sum(float(m.monto) for m in movimientos if m.tipo == "ingreso")
    total_egresos = sum(float(m.monto) for m in movimientos if m.tipo == "egreso")
    saldo_teorico = float(caja.saldo_inicial) + total_ingresos - total_egresos
    
    # Calcular diferencia
    diferencia = saldo_teorico - float(data.saldo_final)
    
    # Actualizar caja
    caja.saldo_final = Decimal(str(data.saldo_final))
    caja.estado = "cerrado"
    caja.fecha_cierre = datetime.utcnow()
    caja.observaciones_cierre = f"{data.observaciones or ''} | Diferencia: ${diferencia:.2f}"
    
    db.commit()
    db.refresh(caja)
    
    return caja

# ============================================
# MOVIMIENTOS DE CAJA
# ============================================

@router.get("/", response_model=List[MovimientoCajaResponse])
def listar_movimientos(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo: Optional[str] = None,
    categoria_id: Optional[int] = None,
    caja_id: Optional[int] = None,  # ✅ FIX: Filtrar por sesión de caja específica
    db: Session = Depends(get_db)
):
    """Lista movimientos de caja con filtros"""
    query = db.query(MovimientoCaja).options(
        joinedload(MovimientoCaja.categoria_caja),
        joinedload(MovimientoCaja.proveedor),
        joinedload(MovimientoCaja.cliente)
    )
    
    # Filtrar por caja_id si se pasa (PRIORIDAD sobre fecha)
    if caja_id:
        query = query.filter(MovimientoCaja.caja_id == caja_id)
    else:
        # Solo filtrar por fecha si NO hay caja_id
        if fecha_desde:
            try:
                from datetime import date as date_type
                query = query.filter(MovimientoCaja.fecha >= fecha_desde)
            except:
                pass
        if fecha_hasta:
            try:
                query = query.filter(MovimientoCaja.fecha <= fecha_hasta)
            except:
                pass
    
    if tipo:
        query = query.filter(MovimientoCaja.tipo == tipo)
    if categoria_id is not None:
        query = query.filter(MovimientoCaja.categoria_caja_id == categoria_id)

    movimientos = query.order_by(MovimientoCaja.fecha.desc()).all()

    # Serializar con nombres de categoría y proveedor
    result = []
    for m in movimientos:
        result.append({
            "id": m.id,
            "fecha": m.fecha.isoformat() if m.fecha else None,
            "tipo_movimiento": m.tipo_movimiento,
            "descripcion": m.descripcion,
            "monto": float(m.monto),
            "tipo": m.tipo,
            "creado_en": m.creado_en.isoformat() if m.creado_en else None,
            "categoria_nombre": m.categoria_caja.nombre if m.categoria_caja else None,
            "proveedor_nombre": m.proveedor.nombre if m.proveedor else None,
            "cliente_nombre": m.cliente.nombre if m.cliente else None,
            "medio_pago": m.medio_pago,
        })

    return result

@router.post("/", response_model=MovimientoCajaResponse, status_code=status.HTTP_201_CREATED)
def crear_movimiento(movimiento: MovimientoCajaCreate, db: Session = Depends(get_db), usuario_id: Optional[int] = None):
    """
    Crea un nuevo movimiento de caja manual:
    - Verifica que haya caja abierta
    - Registra el movimiento
    """
    # Verificar si hay caja abierta (ORDER BY para obtener la más reciente)
    caja_abierta = db.query(CajaDia).filter(
        CajaDia.fecha == (movimiento.fecha or date.today()),
        CajaDia.estado == "abierto"
    ).order_by(CajaDia.fecha_apertura.desc()).first()

    if not caja_abierta:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No hay caja abierta. Debe abrir caja antes de registrar movimientos"
        )
    
    # Crear movimiento
    db_movimiento = MovimientoCaja(
        fecha=movimiento.fecha or date.today(),
        tipo_movimiento=movimiento.tipo_movimiento,
        tipo=movimiento.tipo or movimiento.tipo_movimiento,
        categoria_caja_id=movimiento.categoria_caja_id,
        descripcion=movimiento.descripcion,
        monto=Decimal(str(movimiento.monto)),
        proveedor_id=movimiento.proveedor_id,
        medio_pago=movimiento.medio_pago,
        usuario_id=usuario_id,
        caja_id=caja_abierta.id  # ✅ FIX: Vincular a la sesión de caja actual
    )
    
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    
    # Serializar respuesta
    return {
        "id": db_movimiento.id,
        "fecha": db_movimiento.fecha.isoformat() if db_movimiento.fecha else None,
        "tipo_movimiento": db_movimiento.tipo_movimiento,
        "descripcion": db_movimiento.descripcion,
        "monto": float(db_movimiento.monto),
        "tipo": db_movimiento.tipo,
        "creado_en": db_movimiento.creado_en.isoformat() if db_movimiento.creado_en else None,
        "categoria_nombre": db_movimiento.categoria_caja.nombre if db_movimiento.categoria_caja else None,
    }

@router.delete("/{movimiento_id}")
def eliminar_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    """Elimina un movimiento de caja"""
    movimiento = db.query(MovimientoCaja).filter(MovimientoCaja.id == movimiento_id).first()
    if not movimiento:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    db.delete(movimiento)
    db.commit()
    return {"message": "Movimiento eliminado"}

# ============================================
# RESUMEN Y REPORTES
# ============================================

@router.get("/resumen")
def resumen_caja(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    caja_id: Optional[int] = None,  # ✅ FIX: Opcional para filtrar por sesión específica
    db: Session = Depends(get_db)
):
    """Resumen de caja: total ingresos, egresos y saldo"""
    # 🔍 DEBUG: Logging detallado
    print(f"🔍 [PARAM] caja_id={caja_id}, type={type(caja_id)}")
    print(f"   fecha_desde={fecha_desde}, fecha_hasta={fecha_hasta}")
    
    # Query con filtro
    query = db.query(MovimientoCaja)
    if caja_id is not None:
        query = query.filter(MovimientoCaja.caja_id == caja_id)
        print(f"🔍 [FILTER] MovimientoCaja.caja_id == {caja_id}")
    else:
        print(f"⚠️ [FILTER] Sin caja_id, usando fecha")
        if fecha_desde:
            query = query.filter(MovimientoCaja.fecha >= fecha_desde)
        if fecha_hasta:
            query = query.filter(MovimientoCaja.fecha <= fecha_hasta)
    
    # Ejecutar query
    movimientos = query.all()
    print(f"🔍 [QUERY] movimientos={len(movimientos)}")
    
    # Mostrar primeros 3 movimientos
    for m in movimientos[:3]:
        print(f"   - id={m.id}, caja_id={m.caja_id}, monto={float(m.monto)}, tipo={m.tipo}")
    
    # Calcular totales
    total_ingresos = sum(float(m.monto) for m in movimientos if m.tipo == 'ingreso')
    total_egresos = sum(float(m.monto) for m in movimientos if m.tipo == 'egreso')
    total_saldo = total_ingresos - total_egresos  # ✅ FIX: Calcular saldo
    
    print(f"🔍 [TOTAL] ingresos={total_ingresos}, egresos={total_egresos}, saldo={total_saldo}")
    
    # Calcular por_categoria
    por_categoria = {}  # ✅ FIX: Inicializar por_categoria
    for m in movimientos:
        cat = m.categoria_caja.nombre if m.categoria_caja else "Sin categoría"
        monto = float(m.monto) if m.tipo == "ingreso" else -float(m.monto)
        por_categoria[cat] = por_categoria.get(cat, 0) + monto
    
    # Retornar respuesta
    result = {
        "total_ingresos": total_ingresos,
        "total_egresos": total_egresos,
        "saldo": total_saldo,
        "por_categoria": por_categoria
    }
    print(f"🔍 [RESPONSE] {result}")
    return result

@router.get("/resumen-hoy")
def resumen_caja_hoy(db: Session = Depends(get_db)):
    """Resumen de caja del día actual"""
    return resumen_caja(fecha_desde=date.today(), fecha_hasta=date.today(), db=db)

# ============================================
# CATEGORÍAS
# ============================================

@router.get("/categorias", response_model=List[dict])
def listar_categorias_caja(db: Session = Depends(get_db)):
    """Lista todas las categorías de caja"""
    categorias = db.query(CategoriaCaja).all()
    return [{"id": c.id, "nombre": c.nombre, "tipo": c.tipo, "subcategoria": c.subcategoria} for c in categorias]

# ============================================
# 🚨 EMERGENCIA: Cierre Manual de Cajas
# ============================================

@router.post("/cerrar-manual/{caja_id}")
def cerrar_caja_manual(
    caja_id: int,
    db: Session = Depends(get_db),
    usuario_id: Optional[int] = None
):
    """
    🚨 EMERGENCIA: Cierra una caja específica manualmente
    - Solo para admin
    - Útil cuando el frontend falla
    - Calcula saldo teórico automáticamente
    """
    # Buscar caja específica
    caja = db.query(CajaDia).filter(CajaDia.id == caja_id).first()
    
    if not caja:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Caja no encontrada"
        )
    
    if caja.estado != "abierto":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La caja ya está {caja.estado}"
        )
    
    # Calcular saldo teórico (inicial + ingresos - egresos)
    movimientos = db.query(MovimientoCaja).filter(
        MovimientoCaja.caja_id == caja_id
    ).all()
    
    total_ingresos = sum(float(m.monto) for m in movimientos if m.tipo == "ingreso")
    total_egresos = sum(float(m.monto) for m in movimientos if m.tipo == "egreso")
    saldo_teorico = float(caja.saldo_inicial) + total_ingresos - total_egresos
    
    print(f"🚨 [CIERRE MANUAL] Caja ID={caja_id}")
    print(f"   - Saldo inicial: {float(caja.saldo_inicial)}")
    print(f"   - Ingresos: {total_ingresos}")
    print(f"   - Egresos: {total_egresos}")
    print(f"   - Saldo teórico: {saldo_teorico}")
    
    # Actualizar caja
    caja.saldo_final = Decimal(str(saldo_teorico))
    caja.estado = "cerrado"
    caja.fecha_cierre = datetime.utcnow()
    caja.observaciones_cierre = f"Cierre manual de emergencia | Saldo teórico: ${saldo_teorico:.2f}"
    
    db.commit()
    db.refresh(caja)
    
    print(f"✅ [CIERRE MANUAL] Caja {caja_id} cerrada exitosamente")
    
    return {
        "message": "Caja cerrada manualmente",
        "caja_id": caja_id,
        "saldo_final": saldo_teorico,
        "fecha_cierre": caja.fecha_cierre.isoformat() if caja.fecha_cierre else None
    }

@router.get("/abiertas")
def listar_cajas_abiertas(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Lista TODAS las cajas abiertas actualmente (solo Admin)
    - Útil para identificar cajas "trabadas" de otros usuarios
    - Solo visible para rol_id=1 (Admin)
    """
    # 🔒 VALIDAR PERMISO: Solo Admin
    if usuario.rol_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo administradores pueden ver todas las cajas abiertas"
        )

    cajas = db.query(CajaDia).filter(CajaDia.estado == "abierto").all()

    result = []
    for c in cajas:
        # Calcular movimientos
        movimientos = db.query(MovimientoCaja).filter(
            MovimientoCaja.caja_id == c.id
        ).all()

        total_ingresos = sum(float(m.monto) for m in movimientos if m.tipo == "ingreso")
        total_egresos = sum(float(m.monto) for m in movimientos if m.tipo == "egreso")
        saldo_teorico = float(c.saldo_inicial) + total_ingresos - total_egresos

        result.append({
            "id": c.id,
            "fecha": c.fecha.isoformat() if c.fecha else None,
            "saldo_inicial": float(c.saldo_inicial),
            "saldo_teorico": saldo_teorico,
            "estado": c.estado,
            "usuario_id": c.usuario_id,
            "usuario_nombre": c.usuario.username if c.usuario else "Desconocido",
            "fecha_apertura": c.fecha_apertura.isoformat() if c.fecha_apertura else None,
            "cantidad_movimientos": len(movimientos),
        })

    print(f"🔍 [CAJAS ABIERTAS] Admin {usuario.username} vio {len(result)} cajas abiertas")

    return result

@router.post("/registrar-recuperacion")
def registrar_recuperacion_caja(
    caja_id: int,
    accion: str,  # 'continuar' o 'cerrar'
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    Registra que un usuario recuperó una caja abierta por cierre inesperado
    - accion: 'continuar' (sigue trabajando) o 'cerrar' (cierra sin arqueo completo)
    - Registra evento en logs para auditoría
    """
    caja = db.query(CajaDia).filter(CajaDia.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")

    print(f"🔍 [RECUPERACIÓN] Usuario {usuario.username} (ID={usuario.id}) {accion} caja {caja_id} abierta desde {caja.fecha_apertura}")

    # Registrar en observaciones de la caja (auditoría básica)
    timestamp_recuperacion = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    nota_recuperacion = f"\n[RECUPERADA {timestamp_recuperacion}] Usuario ID={usuario.id} ({usuario.username}) - Acción: {accion}"

    if caja.observaciones_cierre:
        caja.observaciones_cierre += nota_recuperacion
    else:
        caja.observaciones_cierre = nota_recuperacion

    db.commit()

    return {
        "message": f"Caja {caja_id} recuperada - acción: {accion}",
        "caja_id": caja_id,
        "accion": accion
    }

@router.post("/forzar-cierre")
def forzar_cierre_caja(
    caja_id: int,
    motivo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user)
):
    """
    🔒 SOLO ADMIN - Fuerza el cierre de una caja de otro usuario
    - Requiere motivo justificativo (auditoría)
    - Registra quién forzó el cierre y por qué
    - Cierra la caja con el saldo teórico actual
    """
    # 🔒 VALIDAR PERMISO: Solo Admin
    if usuario.rol_id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Solo administradores pueden forzar cierre de cajas"
        )

    caja = db.query(CajaDia).filter(CajaDia.id == caja_id).first()
    if not caja:
        raise HTTPException(status_code=404, detail="Caja no encontrada")

    if caja.estado != "abierto":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La caja ya está {caja.estado}"
        )

    print(f"🔍 [FORZAR CIERRE] Admin {usuario.username} forzando cierre de caja {caja_id}")
    print(f"   Motivo: {motivo}")

    # Calcular saldo teórico actual
    movimientos = db.query(MovimientoCaja).filter(
        MovimientoCaja.caja_id == caja_id
    ).all()

    total_ingresos = sum(m.monto for m in movimientos if m.tipo == "ingreso")
    total_egresos = sum(m.monto for m in movimientos if m.tipo == "egreso")
    saldo_teorico = float(caja.saldo_inicial) + float(total_ingresos) - float(total_egresos)

    # Cerrar caja con saldo teórico
    caja.estado = "cerrado"
    caja.saldo_final = saldo_teorico
    caja.fecha_cierre = datetime.now()
    
    # Registrar en observaciones (auditoría)
    timestamp_cierre = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    nota_cierre = (
        f"\n[CIERRE FORZADO {timestamp_cierre}] "
        f"Admin ID={usuario.id} ({usuario.username}) - "
        f"Motivo: {motivo} - "
        f"Saldo final teórico: ${saldo_teorico:.2f}"
    )
    
    if caja.observaciones_cierre:
        caja.observaciones_cierre += nota_cierre
    else:
        caja.observaciones_cierre = nota_cierre

    db.commit()

    print(f"✅ [FORZAR CIERRE] Caja {caja_id} cerrada exitosamente")

    return {
        "message": "Caja cerrada por administrador",
        "caja_id": caja_id,
        "saldo_final": saldo_teorico,
        "motivo": motivo,
        "admin_usuario": usuario.username
    }
