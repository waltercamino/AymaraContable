# ✅ FIX: caja_id en Movimientos de Caja

## Problema

Los movimientos de caja creados desde diferentes módulos (FC Venta, FC Compra, Cuenta Corriente, Recibos) **no se vinculaban** a la sesión de caja abierta (`caja_id = NULL`).

### Consecuencia
- Al cerrar caja, el resumen mostraba movimientos de **todas las sesiones anteriores**
- No se podía calcular correctamente la diferencia teórico vs real
- Los filtros por `caja_id` no funcionaban porque los movimientos no tenían ese campo asignado

---

## Solución Aplicada

Se agregó la búsqueda de la caja abierta antes de crear cada `MovimientoCaja`:

```python
# 🔍 Buscar caja abierta para vincular movimiento
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

movimiento = MovimientoCaja(
    ...
    caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
)
```

---

## Archivos Modificados

| Archivo | Función Afectada | Cambio |
|---------|------------------|--------|
| `Back/app/api/fcventa.py` | `crear_fc_venta()` | + `caja_id` en movimiento de caja |
| `Back/app/api/fccompra.py` | `crear_fc_compra()` | + `caja_id` en movimiento de caja |
| `Back/app/api/cuenta_corriente.py` | `registrar_pago()` | + `caja_id` en movimiento de caja |
| `Back/app/api/cuenta_corriente.py` | `registrar_cobro()` | + `caja_id` en movimiento de caja |
| `Back/app/api/recibos.py` | `crear_recibo()` | + `caja_id` en movimiento de caja |
| `Back/app/api/notas_credito.py` | `crear_nota_credito()` | + `caja_id` en movimiento de caja |
| `Back/app/api/caja.py` | `crear_movimiento()` | ✅ Ya tenía el fix |

---

## Detalle por Archivo

### 1. fcventa.py (línea ~368-392)
```python
from app.models import MovimientoCaja, CategoriaCaja, CajaDia

# 🔍 Buscar caja abierta para vincular movimiento
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

categoria_caja = db.query(CategoriaCaja).filter(
    CategoriaCaja.nombre == ("Devolución de Ventas" if es_nota_credito else "Venta de Mercadería")
).first()

if categoria_caja:
    movimiento = MovimientoCaja(
        fecha=data.fecha,
        tipo_movimiento="devolucion" if es_nota_credito else "venta",
        categoria_caja_id=categoria_caja.id,
        descripcion=f"{'Nota de Crédito' if es_nota_credito else 'Venta'} - Factura ...",
        monto=float(total),
        tipo="egreso" if es_nota_credito else "ingreso",
        cliente_id=data.cliente_id,
        medio_pago=medio_pago,
        caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
    )
```

### 2. fccompra.py (línea ~254-278)
```python
from app.models import CajaDia

# 🔍 Buscar caja abierta para vincular movimiento
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

categoria_caja = db.query(CategoriaCaja).filter(
    CategoriaCaja.nombre == ("Nota de Crédito" if es_nota_credito else "Compra Mercadería")
).first()

if categoria_caja:
    movimiento = MovimientoCaja(
        fecha=compra.fecha,
        tipo_movimiento="ingreso_nc" if es_nota_credito else "gasto",
        categoria_caja_id=categoria_caja.id,
        descripcion=f"{'Nota de Crédito' if es_nota_credito else 'Compra'} a proveedor...",
        monto=float(total),
        tipo="ingreso" if es_nota_credito else "egreso",
        proveedor_id=compra.proveedor_id,
        medio_pago=medio_pago,
        caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
    )
```

### 3. cuenta_corriente.py - registrar_pago (línea ~101-120)
```python
from app.models import CajaDia

# 🔍 Buscar caja abierta para vincular movimiento
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

movimiento_caja = MovimientoCaja(
    fecha=pago.fecha,
    tipo_movimiento="pago",
    categoria_caja_id=None,
    descripcion=f"Pago a proveedor - {pago.descripcion or pago.medio_pago}",
    monto=float(pago.monto),
    tipo="egreso",
    proveedor_id=pago.proveedor_id,
    medio_pago=pago.medio_pago,
    caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
)
```

### 4. cuenta_corriente.py - registrar_cobro (línea ~154-173)
```python
from app.models import CajaDia

# 🔍 Buscar caja abierta para vincular movimiento
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

movimiento_caja = MovimientoCaja(
    fecha=cobro.fecha,
    tipo_movimiento="cobro",
    categoria_caja_id=None,
    descripcion=f"Cobro a cliente - {cobro.descripcion or cobro.medio_pago}",
    monto=float(cobro.monto),
    tipo="ingreso",
    cliente_id=cobro.cliente_id,
    medio_pago=cobro.medio_pago,
    caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
)
```

### 5. recibos.py (línea ~206-226)
```python
# 🔍 Buscar caja abierta para vincular movimiento
from app.models import CajaDia
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

movimiento_caja = MovimientoCaja(
    fecha=data.fecha,
    tipo_movimiento=tipo_movimiento,
    categoria_caja_id=None,
    descripcion=f"Recibo {numero_interno} - {tipo_movimiento.capitalize()}...",
    monto=float(data.monto),
    tipo=tipo_caja,
    proveedor_id=data.proveedor_id if data.tipo == 'pago' else None,
    medio_pago=data.medio_pago,
    comprobante_nro=numero_interno,
    usuario_id=usuario_id,
    caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
)
```

### 6. notas_credito.py (línea ~152-171)
```python
# 🔍 Buscar caja abierta para vincular movimiento
from app.models import CajaDia
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).first()

if categoria_caja:
    movimiento = MovimientoCaja(
        fecha=date.today(),
        tipo_movimiento="devolucion",
        categoria_caja_id=categoria_caja.id,
        descripcion=f"Nota de Crédito NC-{db_nota.numero_nota_credito}...",
        monto=float(total),
        tipo="egreso",
        cliente_id=nota.cliente_id,
        medio_pago=nota.medio_pago,
        caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
    )
```

---

## Comportamiento Esperado

### Antes del Fix
```sql
SELECT id, descripcion, caja_id FROM movimiento_caja;
-- caja_id = NULL para todos los movimientos
```

### Después del Fix
```sql
SELECT id, descripcion, caja_id FROM movimiento_caja;
-- caja_id = 1 (ejemplo) para movimientos de la sesión actual
```

---

## Testing Recomendado

1. **Abrir caja** desde el módulo Caja
2. **Crear FC Venta** con pago en efectivo
3. **Verificar** que el movimiento de caja tenga `caja_id = ID de la caja abierta`
4. **Cerrar caja** y verificar que el resumen muestre SOLO los movimientos de ESA sesión
5. **Repetir** para:
   - FC Compra
   - Cobro desde Cuenta Corriente
   - Pago desde Cuenta Corriente
   - Recibo (si se usa)
   - Nota de Crédito (legacy)

---

## Notas

- Si **no hay caja abierta**, `caja_id = NULL` (permite operaciones sin caja)
- El backend **no lanza error** si no hay caja abierta (permite flexibilidad)
- El frontend **ya filtra por `caja_id`** después del fix en `Caja.tsx`

---

## Fixes Relacionados

| Fix | Archivo | Descripción |
|-----|---------|-------------|
| ✅ Frontend pasa `caja_id` | `Front/src/pages/Caja.tsx` | Secuencial: primero `getHoy()`, luego `getAll()` |
| ✅ Frontend maneja null | `Front/src/pages/Caja.tsx` | Si `!cajaData`, limpiar y mostrar mensaje |
| ✅ Backend asigna `caja_id` | `Back/app/api/*.py` | Busca caja abierta + ORDER BY fecha_apertura |
| ✅ Backend `/hoy` filtra por estado | `Back/app/api/caja.py` | Solo devuelve caja ABIERTA + ORDER BY |
| ✅ Backend `/historial/{id}/movimientos` | `Back/app/api/caja.py` | Filtra por `caja_id`, no por fecha |
| ✅ Backend `/apertura` crea NUEVO ID | `Back/app/api/caja.py` | NO reabre caja cerrada, siempre crea nueva |

---

## Fix Crítico: Apertura de Caja - Siempre Crear Nueva Sesión

### Problema
Al abrir caja, el sistema **REABRE** la caja cerrada del mismo día (ID 2) en lugar de crear una **NUEVA** caja con NUEVO ID (3, 4, 5...). Esto rompe el aislamiento de sesiones.

### Evidencia
```sql
-- Hay 2 cajas, pero la "abierta" es ID 2 (reutilizado)
SELECT id, fecha, estado, fecha_apertura FROM caja_dia ORDER BY id DESC;
-- Resultado: ID 2 = "abierto" (fecha_apertura reciente), ID 1 = "cerrado"
-- Esperado: ID 3 = "abierto" (nuevo registro)
```

### Solución (caja.py línea ~113-142)

**ANTES (❌ Reutiliza ID):**
```python
caja_existente = db.query(CajaDia).filter(CajaDia.fecha == data.fecha).first()
if caja_existente:
    if caja_existente.estado == "abierto":
        return caja_existente
    else:
        # ❌ ESTO REABRE LA MISMA CAJA - ELIMINAR
        caja_existente.estado = "abierto"
        caja_existente.saldo_inicial = Decimal(str(data.saldo_inicial))
        ...
```

**DESPUÉS (✅ Crea NUEVO ID):**
```python
@router.post("/apertura", response_model=CajaDiaResponse, status_code=status.HTTP_201_CREATED)
def abrir_caja(data: CajaDiaCreate, db: Session = Depends(get_db), usuario_id: Optional[int] = None):
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
    caja = CajaDia(
        fecha=data.fecha,
        saldo_inicial=Decimal(str(data.saldo_inicial)),
        estado="abierto",
        usuario_id=usuario_id,
        fecha_apertura=datetime.utcnow()
    )

    db.add(caja)
    db.commit()
    db.refresh(caja)
    return caja
```

### Testing Requerido

```sql
-- 1. Cerrar todas las cajas
UPDATE caja_dia SET estado='cerrado' WHERE estado='abierto';

-- 2. Abrir nueva caja desde frontend

-- 3. Verificar que crea NUEVO ID (debería ser 3, no 2)
SELECT id, fecha, estado, fecha_apertura FROM caja_dia ORDER BY id DESC LIMIT 3;
-- Esperado: ID 3 = "abierto", ID 2 = "cerrado", ID 1 = "cerrado"

-- 4. Crear movimiento y verificar caja_id
SELECT id, descripcion, caja_id FROM movimientos_caja ORDER BY creado_en DESC LIMIT 3;
-- Esperado: caja_id = 3 (el nuevo ID)

-- 5. Cerrar caja y abrir otra → Debe ser ID 4
```

---

## Fix Crítico: ORDER BY para Obtener Caja Más Reciente

### Problema
Si hay múltiples cajas abiertas en el mismo día (ej: reapertura), se debe devolver la **más reciente** (última en abrirse).

### Solución Aplicada en 8 Archivos

Se agregó `.order_by(CajaDia.fecha_apertura.desc())` a todas las consultas de caja abierta:

| Archivo | Función | Línea |
|---------|---------|-------|
| `caja.py` | `obtener_caja_hoy()` | ~110 |
| `caja.py` | `crear_movimiento()` | ~269 |
| `fcventa.py` | `crear_fc_venta()` | ~374 |
| `fccompra.py` | `crear_fc_compra()` | ~261 |
| `cuenta_corriente.py` | `registrar_pago()` | ~106 |
| `cuenta_corriente.py` | `registrar_cobro()` | ~159 |
| `recibos.py` | `crear_recibo()` | ~211 |
| `notas_credito.py` | `crear_nota_credito()` | ~157 |

### Ejemplo de Código

```python
# 🔍 Buscar caja abierta para vincular movimiento (ORDER BY para obtener la más reciente)
caja_abierta = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"
).order_by(CajaDia.fecha_apertura.desc()).first()

movimiento = MovimientoCaja(
    ...
    caja_id=caja_abierta.id if caja_abierta else None  # ✅ FIX
)
```

---

## Fix Frontend: Manejar null en caja.getHoy()

### Problema
Cuando no hay caja abierta, `caja.getHoy()` devuelve `null`, pero el frontend intentaba acceder a `cajaData.id` → Error `Cannot read properties of null`.

### Solución (Caja.tsx línea ~127-140)
```typescript
// ✅ FIX: Primero obtener cajaDelDia
const cajaHoyRes = await caja.getHoy()
if (cajaHoyRes.error) throw new Error(cajaHoyRes.error)
const cajaData = cajaHoyRes.data as unknown as CajaDia
setCajaDelDia(cajaData)

// ✅ Si no hay caja abierta, limpiar y salir
if (!cajaData) {
  console.log("⚠️ No hay caja abierta, limpiar movimientos y resumen")
  setMovimientos([])
  setResumen(null)
  setCategorias([])
  setLoading(false)
  return  // ← No llamar a getAll/getResumen sin caja
}

// Solo si hay caja abierta, continuar con Promise.all...
```

### UI: Mensaje cuando no hay caja abierta (línea ~421-432)
```tsx
{/* Mensaje si no hay caja abierta */}
{tabPrincipal === 'movimientos' && !cajaDelDia && (
  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center gap-2">
    <AlertCircle size={20} />
    <div>
      <p className="font-semibold">⚠️ No hay caja abierta</p>
      <p className="text-sm">
        Debe abrir caja antes de registrar movimientos...
      </p>
    </div>
  </div>
)}
```

### Botón "Nuevo Movimiento" deshabilitado (línea ~334)
```tsx
<button
  disabled={!cajaDelDia || cajaDelDia.estado !== 'abierto'}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  Nuevo Movimiento
</button>
```

---

## Fix Adicional: Endpoint /hoy

### Problema
Si hay 2 cajas hoy (1 cerrada + 1 abierta), `/hoy` devolvía la primera (cerrada).

### Solución (caja.py línea ~103-111)
```python
# ANTES:
caja = db.query(CajaDia).filter(CajaDia.fecha == date.today()).first()

# DESPUÉS:
caja = db.query(CajaDia).filter(
    CajaDia.fecha == date.today(),
    CajaDia.estado == "abierto"  # ← Solo la ABIERTA
).first()
```

---

## Fix Adicional: Endpoint /historial/{caja_id}/movimientos

### Problema
El endpoint obtenía movimientos por fecha (`func.date(MovimientoCaja.fecha) == caja.fecha`), no por `caja_id`.

### Solución (caja.py línea ~67-81)
```python
# ANTES:
query = db.query(MovimientoCaja).filter(
    func.date(MovimientoCaja.fecha) == caja.fecha
)

# DESPUÉS:
query = db.query(MovimientoCaja).filter(
    MovimientoCaja.caja_id == caja_id  # ← Por ID de sesión, no por fecha
)
```

---

**Fecha:** 2026-02-28  
**Versión:** Aymara Contable v4.0  
**Estado:** ✅ Completado
