# RECIBOS - SIMPLIFICADO (Sin Imputación a FCs)

## Fecha: 2026-02-23

---

## DECISIÓN DE DISEÑO

El sistema de imputación a FCs específicas era **demasiado complejo** y causaba errores frecuentes:

- FCs que no reaparecían al anular recibos
- Cálculos incorrectos de saldo pendiente
- Bugs en la UI de imputación
- Confusión de usuarios

**SOLUCIÓN:** Simplificar a modelo de **pago/cobro global sin imputación específica**.

---

## NUEVO FLUJO SIMPLIFICADO

### Antes (Complejo) ❌
```
1. Seleccionar Cliente/Proveedor
2. Ingresar monto
3. Seleccionar FCs pendientes (lista con saldo calculado)
4. Imputar monto a cada FC
5. Validar total imputado ≤ monto
6. Crear recibo → Registra imputaciones + cta.cte. + caja
```

### Ahora (Simplificado) ✅
```
1. Seleccionar Cliente/Proveedor
2. Ingresar monto
3. Seleccionar medio de pago
4. (Opcional) Observaciones
5. Crear recibo → Registra en cta.cte. + caja
```

---

## CAMBIOS REALIZADOS

### 1. FRONTEND - Front/src/pages/Recibos.tsx

**ELIMINADO:**
- ❌ Imports de `fcVenta`, `fcCompra`, `cuentaCorriente`
- ❌ Interfaces `FCVentaSimple`, `FCCompraSimple`, `ImputacionLocal`
- ❌ Estado `fcPendientes`, `loadingFc`, `imputaciones`
- ❌ Función `cargarFcPendientes()`
- ❌ Función `actualizarImputacion()`
- ❌ Función `removerImputacion()`
- ❌ Sección UI "Imputar a Facturas Pendientes"
- ❌ Validación de total imputado

**MANTENIDO:**
- ✅ Selector Cliente/Proveedor
- ✅ Campo Monto
- ✅ Campo Medio de Pago
- ✅ Campo Observaciones
- ✅ Botón Crear Recibo
- ✅ Lista de recibos con filtros
- ✅ Botón Imprimir PDF
- ✅ Botón Anular

**Código simplificado:**
```typescript
// Estados principales (sin imputaciones)
const [entidadId, setEntidadId] = useState<number>(0)
const [monto, setMonto] = useState<number>(0)
const [medioPago, setMedioPago] = useState<string>('efectivo')
const [observaciones, setObservaciones] = useState<string>('')

// Crear recibo (sin imputaciones)
const handleCrearRecibo = async () => {
  const data: ReciboCreate = {
    tipo,
    cliente_id: tipo === 'cobro' ? entidadId : undefined,
    proveedor_id: tipo === 'pago' ? entidadId : undefined,
    fecha: new Date().toISOString().split('T')[0],
    monto,
    medio_pago: medioPago,
    observaciones: observaciones || undefined,
    imputaciones: []  // ✅ SIN IMPUTACIÓN
  }
  
  await recibos.create(data)
}
```

---

### 2. BACKEND - Back/app/api/recibos.py

**ELIMINADO:**
- ❌ Procesamiento de imputaciones en `crear_recibo()`
- ❌ Cálculo de saldo a favor (ya no hay imputación)
- ❌ Movimientos de cuenta corriente por imputación específica
- ❌ Referencias a `ReciboImputacion` en creación

**MANTENIDO:**
- ✅ Registro en cuenta_corriente (debe/haber global)
- ✅ Registro en movimientos_caja
- ✅ Generación de PDF
- ✅ Anulación con reversión en cta.cte.

**Código simplificado:**
```python
@router.post("/", status_code=201_CREATED)
def crear_recibo(data: ReciboCreate, db: Session, usuario_id: Optional[int] = None):
    # 1. Generar número interno
    numero_interno = f"R-{...:04d}"
    
    # 2. Crear recibo
    recibo = Recibo(
        numero_interno=numero_interno,
        tipo=data.tipo,
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
    
    # 3. ✅ SIMPLIFICADO: Registrar en Cuenta Corriente (sin imputación)
    entidad_id = data.cliente_id if data.tipo == 'cobro' else data.proveedor_id
    
    movimiento_cc = CuentaCorriente(
        tipo='cliente' if data.tipo == 'cobro' else 'proveedor',
        entidad_id=entidad_id,
        cobro_id=recibo.id if data.tipo == 'cobro' else None,
        pago_id=recibo.id if data.tipo == 'pago' else None,
        # ✅ SIN venta_id/compra_id - no hay imputación a FC específica
        debe=0,
        haber=float(data.monto),  # El monto TOTAL reduce deuda/crédito
        saldo=-float(data.monto),
        fecha=data.fecha,
        descripcion=f"Recibo {numero_interno} - {data.medio_pago}",
        medio_pago=data.medio_pago
    )
    db.add(movimiento_cc)
    
    # 4. Registrar en Caja
    # ... (igual que antes)
    
    db.commit()
```

---

### 3. MODELO DE DATOS

**Tabla `recibo_imputaciones`:**
- ⚠️ **YA NO SE USA** en creación de recibos
- ✅ Se mantiene por compatibilidad con datos históricos
- ❌ No se eliminan para no romper recibos antiguos

**Tabla `cuenta_corriente`:**
- ✅ Ahora los movimientos de recibos NO tienen `venta_id` ni `compra_id`
- ✅ El saldo se calcula global por entidad (no por FC)

---

## CÁLCULO DE SALDO EN CUENTA CORRIENTE

### Antes (por FC específica) ❌
```
Saldo FC FV-0014 = Total FC - SUM(pagos con venta_id=14)
```

### Ahora (global por entidad) ✅
```
Saldo Cliente Walter = SUM(debe) - SUM(haber)

Donde:
- debe: FCs con medio_pago='cta_cte'
- haber: Recibos de cobro
```

**Ejemplo:**
```
Cliente: Walter

DEBE (deuda):
- FV-0009: $134.990 (cta_cte)
- FV-0015: $50.000 (cta_cte)
Total Debe: $184.990

HABER (pagos):
- R-0001: $60.000 (cobro)
- R-0003: $20.000 (cobro)
Total Haber: $80.000

Saldo Pendiente: $184.990 - $80.000 = $104.990
```

---

## VENTAJAS DE LA SIMPLIFICACIÓN

| Aspecto | Antes (Complejo) | Ahora (Simplificado) |
|---------|-----------------|---------------------|
| **UX** | 5-6 pasos | 3-4 pasos |
| **Errores** | FCs no reaparecían | No hay FCs que reaparecer |
| **Rendimiento** | Múltiples queries por FC | 1 query de cuenta corriente |
| **Código** | ~900 líneas | ~640 líneas (-29%) |
| **Mantenimiento** | Complejo | Simple |
| **Contabilidad** | Imputación específica | Pago global |

---

## DESVENTAJAS / COMPROMISOS

| Compromiso | Impacto | Mitigación |
|------------|---------|------------|
| No saber qué FCs se pagaron | Menor trazabilidad | Se puede agregar campo "referencia" en observaciones |
| Saldo global por entidad | No hay detalle por FC | El saldo total es lo que importa contablemente |
| Datos históricos con imputación | Inconsistencia | Los recibos antiguos mantienen sus imputaciones |

---

## TEST CHECKLIST

| # | Test | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 1 | Crear recibo de cobro | Sin sección de imputación | ✅ Ready |
| 2 | Crear recibo de pago | Sin sección de imputación | ✅ Ready |
| 3 | Recibo se registra en cuenta_corriente | Movimiento haber = monto | ✅ Ready |
| 4 | Saldo del cliente/proveedor se reduce | Saldo = debe - haber | ✅ Ready |
| 5 | Anular recibo → revierte en cta.cte. | Movimiento inverso | ✅ Ready |
| 6 | Lista de recibos muestra todos con filtros | Filtros funcionan | ✅ Ready |
| 7 | PDF de recibo se genera correctamente | PDF con datos básicos | ✅ Ready |

---

## CÓMO PROBAR

### Test 1: Crear recibo simplificado

```typescript
// Frontend: Recibos.tsx
1. Click "Nuevo Recibo"
2. Seleccionar "Cobro a Cliente"
3. Seleccionar cliente: "Walter"
4. Ingresar monto: $50.000
5. Seleccionar medio de pago: "Efectivo"
6. (Opcional) Observaciones: "Pago parcial"
7. Click "Registrar Recibo"

// Backend: Expected behavior
POST /api/recibos
{
  "tipo": "cobro",
  "cliente_id": 1,
  "monto": 50000,
  "medio_pago": "efectivo",
  "imputaciones": []  // ← Vacío
}

// Resultado en BD
-- Recibo creado
INSERT INTO recibos (...) VALUES (...)

-- Movimiento en cuenta corriente
INSERT INTO cuenta_corriente (
  tipo, entidad_id, cobro_id,
  debe, haber, saldo,
  descripcion
) VALUES (
  'cliente', 1, 1,  -- tipo, entidad_id, cobro_id
  0, 50000, -50000,  -- debe=0, haber=monto, saldo=-monto
  'Recibo R-0001 - efectivo'
)
```

### Test 2: Verificar saldo en Cuenta Corriente

```typescript
// Frontend: CuentaCorriente.tsx
1. Seleccionar tipo: "Cliente"
2. Seleccionar cliente: "Walter"
3. Ver saldo: Debe ser SUM(debe) - SUM(haber)

// Backend: Query
SELECT 
  SUM(debe) as total_debe,
  SUM(haber) as total_haber,
  SUM(debe) - SUM(haber) as saldo
FROM cuenta_corriente
WHERE tipo = 'cliente' AND entidad_id = 1
```

### Test 3: Anular recibo

```typescript
// Frontend: Lista de recibos
1. Click "Anular" en recibo R-0001
2. Ingresar motivo: "Error"
3. Confirmar

// Backend: Expected behavior
POST /api/recibos/1/anular
{"motivo": "Error"}

-- Movimiento inverso en cuenta corriente
INSERT INTO cuenta_corriente (
  tipo, entidad_id, cobro_id,
  debe, haber, saldo,
  descripcion
) VALUES (
  'cliente', 1, 1,
  50000, 0, 50000,  -- Invertido: debe=haber_anterior
  'Anulación Recibo R-0001 - Error'
)

-- Saldo neto: $0 (se cancelan)
```

---

## MIGRACIÓN DE DATOS

**NO SE REQUIERE MIGRACIÓN**

- Los recibos antiguos mantienen sus imputaciones
- Los nuevos recibos se crean sin imputaciones
- El sistema es compatible hacia atrás

---

## DOCUMENTACIÓN ACTUALIZADA

| Documento | Estado |
|-----------|--------|
| RECIBOS_FIXES.md | ⚠️ Obsoleto (tenía imputación) |
| RECIBOS_CTA_CTE_FIX.md | ⚠️ Obsoleto (tenía imputación) |
| RECIBOS_ANULAR_FIX.md | ✅ Vigente (anulación no cambió) |
| RECIBOS_UI_FIX.md | ✅ Vigente (UI de lista no cambió) |
| **RECIBOS_SIMPLIFICADO.md** | ✅ **NUEVO** (este documento) |

---

## PRÓXIMOS PASOS

1. ✅ Testear en producción con datos reales
2. ✅ Capacitar usuarios en nuevo flujo simplificado
3. ✅ Monitorear errores post-simplificación
4. ⚠️ Considerar eliminar tabla `recibo_imputaciones` en futuro (breaking change)

---

**FIN DEL DOCUMENTO**
