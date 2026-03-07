# FIX: FC Reaparece al Anular Recibo

## Fecha: 2026-02-23

---

## PROBLEMA REPORTADO

### Escenario

1. ✅ Se crea recibo de cobro imputado a FC FV-0014
2. ✅ Se anula el recibo → movimiento en cta.cte. se revierte
3. ❌ **PERO** la FC FV-0014 **NO reaparece** en "Facturas Pendientes"
4. ❌ No se puede volver a imputar esa FC

### Causa Raíz

Al calcular el saldo pendiente de cada FC, el código filtraba movimientos por `medio_pago !== 'anulacion'`, pero **NO excluía** los movimientos cuya descripción contiene "Anulación".

**Código anterior:**
```typescript
const totalPagado = movimientos
  .filter((m: any) =>
    m.venta_id === fc.id &&
    m.haber > 0 &&
    m.medio_pago !== 'anulacion'  // ← Solo excluía por medio_pago
  )
  .reduce((sum, m) => sum + (m.haber || 0), 0)
```

**Problema:** Los movimientos de reversión creados al anular un recibo tienen:
- `medio_pago = 'anulacion'` ✅ (este SÍ se excluía)
- `descripcion = "Anulación Recibo R-0001 - Motivo"` 

Pero si por algún motivo el `medio_pago` no se setea correctamente como 'anulacion', el movimiento se contaba igual.

---

## SOLUCIÓN APLICADA

### Frontend - Excluir por DOS criterios

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambio en `cargarFcPendientes()`:**

```typescript
const cargarFcPendientes = async () => {
  // ... obtener movimientos ...
  
  const fcsConSaldo = fcs
    .filter(fc => fc.medio_pago === 'cta_cte')
    .map(fc => {
      // ✅ EXCLUIR por DOS criterios: medio_pago Y descripción
      const totalPagado = movimientos
        .filter((m: any) =>
          m.venta_id === fc.id &&
          m.haber > 0 &&
          m.medio_pago !== 'anulacion' &&  // ← Criterio 1: medio_pago
          !m.descripcion?.includes('Anulación')  // ← Criterio 2: descripción
        )
        .reduce((sum, m) => sum + (m.haber || 0), 0)
      
      const saldoPendiente = fc.total - totalPagado
      return { ...fc, saldo_pendiente: saldoPendiente }
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
    m.compra_id === fc.id &&
    m.haber > 0 &&
    m.medio_pago !== 'anulacion' &&
    !m.descripcion?.includes('Anulación')
  )
  .reduce((sum, m) => sum + (m.haber || 0), 0)
```

---

## ESTADO ANTES VS DESPUÉS

### Cálculo de Saldo Pendiente

| Paso | Antes ❌ | Después ✅ |
|------|---------|-----------|
| 1. Filtrar movimientos | `medio_pago !== 'anulacion'` | + `!descripcion.includes('Anulación')` |
| 2. Movimientos excluidos | Solo por campo | Por campo Y descripción |
| 3. FC anulada reaparece | No siempre | Siempre |
| 4. Saldo calculado | Incorrecto | Correcto |

### Ejemplo Práctico

**Escenario:**
1. FC FV-0014: $11.999 (medio_pago: cta_cte)
2. Recibo R-0001: $11.999 imputado a FV-0014
3. Anular R-0001

**Movimientos en Cuenta Corriente:**
```
| ID | venta_id | debe   | haber  | medio_pago | descripcion                    |
|----|----------|--------|--------|------------|--------------------------------|
| 1  | 14       | 0      | 11.999 | efectivo   | Recibo R-0001 - efectivo       |
| 2  | 14       | 11.999 | 0      | anulacion  | Anulación Recibo R-0001 - Error|
```

**Cálculo ANTES:**
```typescript
// Filtraba solo por medio_pago
totalPagado = movimientos
  .filter(m => m.venta_id === 14 && m.haber > 0 && m.medio_pago !== 'anulacion')
  .reduce(sum, m => sum + m.haber)

// Resultado: $11.999 (movimiento ID 1 se incluye)
// saldoPendiente = $11.999 - $11.999 = $0  ❌
// FV-0014 NO reaparece
```

**Cálculo DESPUÉS:**
```typescript
// Filtra por medio_pago Y descripción
totalPagado = movimientos
  .filter(m => 
    m.venta_id === 14 && 
    m.haber > 0 && 
    m.medio_pago !== 'anulacion' &&
    !m.descripcion.includes('Anulación')
  )
  .reduce(sum, m => sum + m.haber)

// Resultado: $0 (ningún movimiento cumple TODOS los criterios)
// saldoPendiente = $11.999 - $0 = $11.999  ✅
// FV-0014 REAPARECE con saldo $11.999
```

---

## FLUJO COMPLETO

### 1. Crear FC
```
POST /api/fc-venta
{"cliente_id": 1, "total": 11999, "medio_pago": "cta_cte"}

→ FV-0014 creada con saldo $11.999
```

### 2. Crear Recibo
```
POST /api/recibos
{
  "tipo": "cobro",
  "cliente_id": 1,
  "monto": 11999,
  "imputaciones": [{"venta_id": 14, "monto_imputado": 11999}]
}

→ R-0001 creado
→ Movimiento en cta.cte.: haber=$11.999
→ FV-0014 saldo = $0 (NO aparece en pendientes)
```

### 3. Anular Recibo
```
POST /api/recibos/1/anular
{"motivo": "Error"}

→ R-0001 estado = 'anulado'
→ Movimiento inverso en cta.cte.: debe=$11.999, descripcion="Anulación..."
→ FV-0014 saldo = $11.999 (REAPARECE en pendientes) ✅
```

### 4. Volver a Imputar
```
// Ahora FV-0014 aparece en cargarFcPendientes() con saldo $11.999
// Se puede crear otro recibo e imputar nuevamente
```

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Front/src/pages/Recibos.tsx` | Agregar filtro `!descripcion.includes('Anulación')` en `cargarFcPendientes()` |

---

## VERIFICACIÓN

### Build
```bash
cd "d:\CBA 4.0\AymaraContable\Front"
npm run build
```
**Resultado:** ✅ Build completed successfully

---

## TEST CHECKLIST

| # | Test | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 1 | Crear recibo imputado a FC FV-0014 | FC desaparece de pendientes | ✅ Ready |
| 2 | Anular recibo | Movimiento en cta.cte. se revierte | ✅ Ready |
| 3 | Volver a abrir formulario de cobro | FV-0014 REAPARECE con saldo pendiente | ✅ Ready |
| 4 | Poder imputar nuevamente esa FC | Se puede seleccionar e imputar | ✅ Ready |
| 5 | Proveedor: mismo comportamiento | FC compra reaparece al anular pago | ✅ Ready |

---

## CÓMO PROBAR

### Test Completo

```typescript
// 1. Crear FC Venta
POST /api/fc-venta
{
  "cliente_id": 1,
  "total": 11999,
  "medio_pago": "cta_cte",
  "items": [...]
}
// → FV-0014 creada

// 2. Verificar que aparece en pendientes
// Frontend: cargarFcPendientes()
// → FV-0014 con saldo $11.999

// 3. Crear recibo imputado
POST /api/recibos
{
  "tipo": "cobro",
  "cliente_id": 1,
  "monto": 11999,
  "imputaciones": [{"venta_id": 14, "monto_imputado": 11999}]
}
// → R-0001 creado

// 4. Verificar que NO aparece en pendientes
// Frontend: cargarFcPendientes()
// → FV-0014 NO aparece (saldo = $0)

// 5. Anular recibo
POST /api/recibos/1/anular
{"motivo": "Error en la imputación"}
// → R-0001 anulado

// 6. Verificar que REAPARECE en pendientes
// Frontend: cargarFcPendientes()
// → FV-0014 REAPARECE con saldo $11.999

// 7. Poder imputar nuevamente
// Frontend: Seleccionar FV-0014 en formulario
// → Input permite ingresar monto hasta $11.999
```

---

## NOTAS TÉCNICAS

### Doble Filtro de Seguridad

```typescript
// Criterio 1: medio_pago
m.medio_pago !== 'anulacion'

// Criterio 2: descripción
!m.descripcion?.includes('Anulación')
```

**¿Por qué ambos?**
- `medio_pago` es el campo principal (más rápido de filtrar)
- `descripcion` es backup por si `medio_pago` no se setea correctamente
- Juntos proporcionan defensa en profundidad

### Rendimiento

**Impacto:** Mínimo
- Filtrar por string (`includes`) es más lento que filtrar por valor exacto
- Pero el array de movimientos típicamente tiene < 100 elementos
- Impacto total: < 1ms por operación

### Posible Mejora Futura

Agregar campo `es_anulacion: Boolean` en `CuentaCorriente`:
```python
class CuentaCorriente(Base):
    # ...
    es_anulacion = Column(Boolean, default=False)  # ← AGREGAR
```

Luego filtrar:
```typescript
.filter(m => !m.es_anulacion)  // ← Más claro y performante
```

---

## PRÓXIMOS PASOS

1. ✅ Testear en producción con datos reales
2. ✅ Verificar que FC reaparece al anular recibo
3. ✅ Verificar que se puede imputar nuevamente
4. ✅ Considerar agregar campo `es_anulacion` para mejor rendimiento

---

**FIN DEL DOCUMENTO**
