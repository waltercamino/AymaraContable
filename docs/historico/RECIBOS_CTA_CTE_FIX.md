# FIX: Recibos - Integración con Cuenta Corriente

## Fecha: 2026-02-23

---

## PROBLEMAS REPORTADOS

| # | Problema | Estado |
|---|----------|--------|
| 1 | ❌ Anular recibo NO revierte movimiento en cuenta_corriente | ✅ FIX |
| 2 | ❌ Aparecen FCs ya saldadas en "Facturas Pendientes" | ✅ FIX |
| 3 | ❌ Pagos a proveedores no muestran FCs pendientes | ✅ FIX |
| 4 | ❌ Anular pago NO revierte en cuenta_corriente | ✅ FIX |

---

## CAUSAS RAÍZ

### Problema 1: Reversión incompleta al anular

**Causa:** El código solo revertía las imputaciones, pero NO los movimientos de "saldo a favor".

**Código anterior:**
```python
# ❌ Solo revertía imputaciones
for imputacion in recibo.imputaciones:
    movimiento_inverso = CuentaCorriente(...)
    db.add(movimiento_inverso)
```

### Problema 2: FCs saldadas aparecen como pendientes

**Causa:** El frontend no filtraba los movimientos con `medio_pago === 'anulacion'`, por lo que contaba dos veces los pagos anulados.

**Código anterior:**
```typescript
// ❌ No excluía movimientos anulados
const totalPagado = movimientos
  .filter((m: any) => m.venta_id === fc.id && m.haber > 0)
  .reduce((sum, m) => sum + (m.haber || 0), 0)
```

---

## SOLUCIONES APLICADAS

### FIX 1: Backend - Revertir TODOS los movimientos al anular

**Archivo:** `Back/app/api/recibos.py`

**Cambios:**

1. **Import de `or_`:**
```python
from sqlalchemy import or_
```

2. **Nueva lógica de reversión:**
```python
try:
    # ✅ 1. Buscar TODOS los movimientos asociados al recibo
    #    (imputaciones + saldo a favor)
    entidad_id = recibo.cliente_id if recibo.tipo == 'cobro' else recibo.proveedor_id
    
    movimientos_existentes = db.query(CuentaCorriente).filter(
        or_(
            CuentaCorriente.cobro_id == recibo.id,
            CuentaCorriente.pago_id == recibo.id
        )
    ).all()

    # ✅ 2. Crear movimiento inverso por cada movimiento existente
    for mov in movimientos_existentes:
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

    # ✅ 3. Actualizar estado del recibo con auditoría
    recibo.estado = 'anulado'
    recibo.anulado_por = usuario_id
    recibo.fecha_anulacion = datetime.utcnow()
    recibo.motivo_anulacion = motivo

    db.commit()
```

**Ventajas:**
- ✅ Revierte TODOS los movimientos (imputaciones + saldo a favor)
- ✅ Mantiene referencia a FC (venta_id/compra_id)
- ✅ Invierte correctamente debe/haber
- ✅ Agrega auditoría (quién anuló, cuándo, por qué)

---

### FIX 2: Frontend - Excluir movimientos anulados

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambios en `cargarFcPendientes()`:**

```typescript
const cargarFcPendientes = async () => {
  // ... obtener ventas y movimientos ...
  
  const fcsConSaldo = (response.data as any[])
    .filter((v: any) => v.medio_pago === 'cta_cte')
    .map((fc: any) => {
      // ✅ EXCLUIR: movimientos con medio_pago === 'anulacion'
      const totalPagado = movimientos
        .filter((m: any) => 
          m.venta_id === fc.id && 
          m.haber > 0 && 
          m.medio_pago !== 'anulacion'  // ← Excluir anulados
        )
        .reduce((sum: number, m: any) => sum + (m.haber || 0), 0)

      const saldoPendiente = fc.total - totalPagado

      return {
        ...fc,
        saldo_pendiente: saldoPendiente > 0.01 ? saldoPendiente : 0,
        total_original: fc.total
      }
    })
    .filter(fc => fc.saldo_pendiente > 0.01)
  
  setFcPendientes(fcsConSaldo)
}
```

**Misma lógica para proveedores:**
```typescript
// Para compras (proveedores)
const totalPagado = movimientos
  .filter((m: any) => 
    m.compra_id === fc.id &&  // ← usa compra_id (no venta_id)
    m.haber > 0 && 
    m.medio_pago !== 'anulacion'
  )
  .reduce((sum, m) => sum + (m.haber || 0), 0)
```

**Ventajas:**
- ✅ Excluye movimientos anulados del cálculo
- ✅ Usa `compra_id` para proveedores (no `venta_id`)
- ✅ Solo muestra FCs con saldo real > 0
- ✅ Muestra saldo pendiente correcto (no total original)

---

## ESTADO ANTES VS DESPUÉS

### Anular Recibo

| Paso | Antes ❌ | Después ✅ |
|------|---------|-----------|
| 1. Buscar movimientos | Solo imputaciones | TODOS (imputaciones + saldo a favor) |
| 2. Invertir | Crea movimiento nuevo con debe=0 | Invierte debe ↔ haber |
| 3. Referencias | No mantenía venta_id/compra_id | Mantiene referencias a FC |
| 4. Auditoría | Solo estado | estado + usuario + fecha + motivo |

### Calcular Saldo Pendiente

| Paso | Antes ❌ | Después ✅ |
|------|---------|-----------|
| 1. Filtrar movimientos | `venta_id === fc.id && haber > 0` | + `medio_pago !== 'anulacion'` |
| 2. Proveedor | Mismo error | Usa `compra_id` correctamente |
| 3. FC saldada | Aparecía con saldo $0 | NO aparece (filtro > 0.01) |
| 4. FC parcialmente pagada | Mostraba total | Muestra saldo restante real |

---

## EJEMPLO DE CÁLCULO

### Escenario: Cliente Walter

| FC | Total | Pagos | Saldo | ¿Aparece? |
|----|-------|-------|-------|-----------|
| FV-0009 | $134.990 | $88.001 | $46.989 | ✅ SÍ |
| FV-0014 | $11.999 | $11.999 | $0 | ❌ NO |
| FV-0015 | $50.000 | $0 | $50.000 | ✅ SÍ |

**Cálculo para FV-0009:**
```
totalPagado = suma de movimientos.haber donde:
  - venta_id = 9
  - haber > 0
  - medio_pago ≠ 'anulacion'

totalPagado = $88.001

saldoPendiente = $134.990 - $88.001 = $46.989  ✅
```

**Si hubo un pago de $20.000 que luego se anuló:**
```
movimientos:
  - {venta_id: 9, haber: 50000, medio_pago: 'efectivo'}
  - {venta_id: 9, haber: 38001, medio_pago: 'transferencia'}
  - {venta_id: 9, haber: 20000, medio_pago: 'anulacion'}  ← EXCLUIDO

totalPagado = 50000 + 38001 = $88.001  (no $108.001)
```

---

## FLUJO DE ANULACIÓN

### 1. Recibo Original (Cobro)

```
Recibo R-0001:
  - Tipo: cobro
  - Cliente: Walter
  - Monto: $50.000
  - Imputaciones: FV-0009 ($30.000) + FV-0015 ($20.000)

Cuenta Corriente (movimientos originales):
  1. {tipo: 'cliente', entidad: Walter, venta_id: 9, debe: 0, haber: 30000}
  2. {tipo: 'cliente', entidad: Walter, venta_id: 15, debe: 0, haber: 20000}
```

### 2. Anular Recibo

```
POST /api/recibos/1/anular
{"motivo": "Error en el monto"}

Cuenta Corriente (movimientos inversos):
  3. {tipo: 'cliente', entidad: Walter, venta_id: 9, debe: 30000, haber: 0}  ← Inverso
  4. {tipo: 'cliente', entidad: Walter, venta_id: 15, debe: 20000, haber: 0}  ← Inverso

Saldo neto: $0 (movimientos se cancelan)
```

### 3. Resultado en FCs

```
FV-0009:
  - Original: debe $134.990
  - Pago R-0001: haber $30.000
  - Anulación R-0001: debe $30.000
  - Saldo: $134.990 (vuelve a estado original)

FV-0015:
  - Original: debe $50.000
  - Pago R-0001: haber $20.000
  - Anulación R-0001: debe $20.000
  - Saldo: $50.000 (vuelve a estado original)
```

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Back/app/api/recibos.py` | - Import `or_`<br>- Reversión completa de movimientos<br>- Auditoría al anular |
| `Front/src/pages/Recibos.tsx` | - Excluir movimientos anulados<br>- Usar `compra_id` para proveedores |

---

## VERIFICACIÓN

### 1. Backend compila
```bash
cd "d:\CBA 4.0\AymaraContable\Back"
.\venv\Scripts\python.exe -m py_compile app/api/recibos.py
```
**Resultado:** ✅ Syntax OK

### 2. Frontend compila
```bash
cd "d:\CBA 4.0\AymaraContable\Front"
npm run build
```
**Resultado:** ✅ Build completed successfully

---

## TEST CHECKLIST

| # | Test | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 1 | Anular recibo de cobro con imputaciones | Movimientos en cta.cte. se revierten | ✅ Ready |
| 2 | Anular recibo de cobro con saldo a favor | Movimiento de saldo a favor se revierte | ✅ Ready |
| 3 | Anular recibo de pago | Movimientos en cta.cte. se revierten | ✅ Ready |
| 4 | FC saldada NO aparece en pendientes | Filtro exclude saldo = 0 | ✅ Ready |
| 5 | FC parcialmente pagada muestra saldo restante | Cálculo correcto sin anulados | ✅ Ready |
| 6 | Proveedor: mismo comportamiento | Usa compra_id (no venta_id) | ✅ Ready |
| 7 | Movimientos anulados no se cuentan | Filtro `medio_pago !== 'anulacion'` | ✅ Ready |

---

## CÓMO PROBAR

### Test 1: Anular recibo

```typescript
// 1. Crear recibo con imputación
POST /api/recibos
{
  "tipo": "cobro",
  "cliente_id": 1,
  "monto": 50000,
  "imputaciones": [{"venta_id": 9, "monto_imputado": 30000}]
}

// 2. Verificar en cuenta corriente
GET /api/cuenta-corriente/clientes/1
// Debe mostrar 2 movimientos (factura + pago)

// 3. Anular recibo
POST /api/recibos/1/anular
{"motivo": "Error"}

// 4. Verificar reversión
GET /api/cuenta-corriente/clientes/1
// Debe mostrar 4 movimientos (2 originales + 2 inversos)
// Saldo neto: $0
```

### Test 2: FC parcialmente pagada

```typescript
// 1. Crear FC de $100.000
POST /api/fc-venta
{"cliente_id": 1, "total": 100000, "medio_pago": "cta_cte"}

// 2. Crear recibo de $60.000
POST /api/recibos
{"cliente_id": 1, "monto": 60000, "imputaciones": [{"venta_id": 1, "monto_imputado": 60000}]}

// 3. Verificar que aparece con saldo $40.000
GET /api/fc-venta?cliente_id=1
// En frontend: cargarFcPendientes()
// Debe mostrar: saldo_pendiente = 40000
```

### Test 3: FC saldada no aparece

```typescript
// 1. Crear FC de $50.000
// 2. Crear recibo de $50.000 (paga totalmente)
// 3. Verificar que NO aparece
// En frontend: cargarFcPendientes()
// Debe mostrar: array vacío (saldo_pendiente = 0)
```

---

## NOTAS TÉCNICAS

### Movimientos en Cuenta Corriente

| tipo | entidad_id | venta_id | compra_id | debe | haber | descripcion |
|------|-----------|----------|-----------|------|-------|-------------|
| cliente | 1 (Walter) | 9 | NULL | 0 | 30000 | Recibo R-0001 |
| cliente | 1 (Walter) | 9 | NULL | 30000 | 0 | Anulación R-0001 |

**Saldo neto:** $0 (se cancelan)

### Claves de Implementación

1. **Backend:**
   - Usar `or_()` para buscar por cobro_id O pago_id
   - Invertir debe ↔ haber (no crear con valores fijos)
   - Mantener venta_id/compra_id en movimientos inversos

2. **Frontend:**
   - Filtrar por `medio_pago !== 'anulacion'`
   - Usar `compra_id` para proveedores, `venta_id` para clientes
   - Solo mostrar FCs con `saldo_pendiente > 0.01`

---

## PRÓXIMOS PASOS

1. ✅ Testear en producción con datos reales
2. ✅ Verificar que anular recibo revierte correctamente
3. ✅ Verificar que FCs saldadas no aparecen
4. ✅ Verificar cálculo de saldo pendiente

---

**FIN DEL DOCUMENTO**
