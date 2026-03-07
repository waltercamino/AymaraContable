# RECIBOS - FIXES IMPLEMENTADOS

## Fecha: 2026-02-23

---

## PROBLEMAS REPORTADOS

1. ❌ Formulario cobro/pago NO muestra facturas pendientes
2. ❌ Error "Debe especificar al menos una imputación" bloquea incorrectamente
3. ❌ FCs pagadas parcialmente aparecen con TOTAL, no con SALDO RESTANTE
4. ❌ FCs saldadas totalmente SIGUEN apareciendo como pendientes

---

## CAUSA RAÍZ

La función `cargarFcPendientes()` solo filtraba por `medio_pago='cta_cte'` pero **NO calculaba**
el saldo restante después de pagos parciales en `cuenta_corriente`.

Además, el backend validaba que siempre debe haber imputaciones, bloqueando los recibos con **saldo a favor**.

---

## SOLUCIONES IMPLEMENTADAS

### ✅ FIX 1: Frontend - Cálculo de saldo pendiente real

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambios:**
- `cargarFcPendientes()` ahora:
  1. Obtiene TODAS las FCs del cliente/proveedor con `medio_pago='cta_cte'`
  2. Obtiene TODOS los movimientos de cuenta corriente
  3. Para CADA FC, filtra movimientos por `venta_id` o `compra_id`
  4. Calcula `totalPagado = suma de movimientos.haber` para ESA factura específica
  5. Calcula `saldoPendiente = total - totalPagado`
  6. Solo incluye FCs con `saldoPendiente > 0.01`

**Código:**
```typescript
const cargarFcPendientes = async () => {
  if (!entidadId) {
    setFcPendientes([])
    return
  }
  
  let fcsPendientes: any[] = []
  
  if (tipo === 'cobro') {
    const response = await fcVenta.getAll({ cliente_id: entidadId, estado: 'emitida' })
    const movimientosRes = await cuentaCorriente.getSaldoCliente(entidadId)
    const movimientos = (movimientosRes.data?.movimientos || [])
    
    const fcsConSaldo = (response.data as any[])
      .filter((v: any) => v.medio_pago === 'cta_cte')
      .map((fc: any) => {
        const totalPagado = movimientos
          .filter((m: any) => m.venta_id === fc.id && m.haber > 0)
          .reduce((sum: number, m: any) => sum + (m.haber || 0), 0)
        
        const saldoPendiente = fc.total - totalPagado

        return {
          ...fc,
          saldo_pendiente: saldoPendiente > 0.01 ? saldoPendiente : 0,
          total_original: fc.total
        }
      })
    
    setFcPendientes(fcsConSaldo.filter((fc: any) => fc.saldo_pendiente > 0.01))
  } else {
    // MISMA LÓGICA PARA PROVEEDORES
    const response = await fcCompra.getAll({ proveedor_id: entidadId, estado: 'registrada' })
    const movimientosRes = await cuentaCorriente.getSaldoProveedor(entidadId)
    const movimientos = (movimientosRes.data?.movimientos || [])
    
    const fcsConSaldo = (response.data as any[])
      .filter((c: any) => c.medio_pago === 'cta_cte')
      .map((fc: any) => {
        const totalPagado = movimientos
          .filter((m: any) => m.compra_id === fc.id && m.haber > 0)
          .reduce((sum: number, m: any) => sum + (m.haber || 0), 0)
        
        const saldoPendiente = fc.total - totalPagado

        return {
          ...fc,
          saldo_pendiente: saldoPendiente > 0.01 ? saldoPendiente : 0,
          total_original: fc.total
        }
      })
    
    setFcPendientes(fcsConSaldo.filter((fc: any) => fc.saldo_pendiente > 0.01))
  }
}
```

---

### ✅ FIX 2: Frontend - UI muestra saldo pendiente

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambios:**
- Cada FC pendiente ahora muestra:
  - Total original de la factura
  - Saldo pendiente en **negrita**
- Input de imputación tiene `max={saldo_pendiente}`
- Alerta si usuario intenta imputar más del saldo pendiente

**Código:**
```tsx
<div className="flex justify-between items-center py-2 border-b">
  <div>
    <span className="font-medium text-sm">{fc.numero_interno}</span>
    <span className="text-xs text-gray-500 ml-2">
      {new Date(fc.fecha).toLocaleDateString('es-AR')}
    </span>
    {/* MOSTRAR SALDO PENDIENTE */}
    <div className="text-xs text-orange-600 mt-1">
      Total: ${formatCurrency(fc.total_original)} | 
      Pendiente: <strong>${formatCurrency(saldoPendiente)}</strong>
    </div>
  </div>
  <input
    type="number"
    max={saldoPendiente}
    onChange={(e) => {
      const montoImp = parseFloat(e.target.value) || 0
      if (montoImp > saldoPendiente) {
        alert(`El monto no puede superar el saldo pendiente de ${formatCurrency(saldoPendiente)}`)
      }
      actualizarImputacion(fc.id, tipo === 'cobro' ? 'venta' : 'compra', fc.numero_interno, Math.min(montoImp, saldoPendiente))
    }}
    className="w-32 px-2 py-1 border rounded text-right"
  />
</div>
```

---

### ✅ FIX 3: Frontend - Permitir recibo sin imputación

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambios:**
- Eliminada validación `if (totalImputado <= 0) { setError('Debe imputar...') }`
- Ahora permite crear recibos sin imputaciones (todo va a saldo a favor)
- Mantiene validación `if (totalImputado > monto)` (no puede imputar más de lo que paga)

**Código:**
```typescript
const handleCrearRecibo = async () => {
  // ... validaciones básicas ...
  
  const totalImputado = imputaciones.reduce((sum, imp) => sum + imp.monto_imputado, 0)

  // ✅ PERMITIR: Recibo sin imputación (saldo a favor)
  // Si totalImputado = 0, todo el monto va a saldo a favor
  // Si totalImputado < monto, el resto va a saldo a favor

  // ❌ BLOQUEAR: totalImputado > monto
  if (totalImputado > monto) {
    setError(`No puede imputar más de lo que está pagando...`)
    return
  }
  
  // ... enviar al backend ...
}
```

---

### ✅ FIX 4: Backend - Permitir recibos sin imputación

**Archivo:** `Back/app/api/recibos.py`

**Cambios:**
1. Eliminada validación `if not data.imputaciones or sum(...) <= 0`
2. Agregada validación `if not data.monto or data.monto <= 0`
3. Procesamiento de imputaciones usa `(data.imputaciones or [])` para evitar error si es None

**Código:**
```python
# Validaciones básicas
if data.tipo == 'cobro' and not data.cliente_id:
    raise HTTPException(status_code=400, detail="Cliente es requerido para cobros")
if data.tipo == 'pago' and not data.proveedor_id:
    raise HTTPException(status_code=400, detail="Proveedor es requerido para pagos")

# ✅ PERMITIR: Recibos sin imputación (saldo a favor)
if not data.monto or data.monto <= 0:
    raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")

# 3. Procesar imputaciones (a FCs específicas)
# ✅ PERMITIR: imputaciones puede ser None o vacío (saldo a favor)
total_imputado = 0
for imputacion_data in (data.imputaciones or []):
    # ... crear imputación ...
    
    # 4. Registrar en Cuenta Corriente
    movimiento_cc = CuentaCorriente(
        # ... otros campos ...
        venta_id=imputacion_data.venta_id if data.tipo == 'cobro' else None,  # ✅ Referencia a FC Venta
        compra_id=imputacion_data.compra_id if data.tipo == 'pago' else None,  # ✅ Referencia a FC Compra
        debe=0,
        haber=imputacion_data.monto_imputado,
        # ...
    )
    db.add(movimiento_cc)

# 4b. Registrar SALDO A FAVOR en Cuenta Corriente
monto_imputado = sum(i.monto_imputado for i in (data.imputaciones or []))
saldo_a_favor = data.monto - monto_imputado

if saldo_a_favor > 0.01:
    movimiento_saldo = CuentaCorriente(
        # ... campos ...
        # NOTA: venta_id/compra_id = NULL para saldo a favor
        haber=float(saldo_a_favor),
    )
    db.add(movimiento_saldo)
```

---

### ✅ FIX 5: Backend - Referenciar FC en Cuenta Corriente

**Archivo:** `Back/app/api/recibos.py`

**Cambios:**
- Al crear movimiento de Cuenta Corriente por imputación, ahora setea:
  - `venta_id=imputacion_data.venta_id` (para cobros)
  - `compra_id=imputacion_data.compra_id` (para pagos)
- Esto permite al frontend filtrar movimientos por FC específica

**Importante:** Para saldo a favor, `venta_id` y `compra_id` permanecen NULL porque no está imputado a ninguna FC específica.

---

### ✅ FIX 6: Dashboard - Widgets de cobros/pagos recientes

**Archivo:** `Front/src/pages/Dashboard.tsx`

**Cambios:**
- Importa `recibos` API y componentes `Wallet`, `CreditCard`
- Agrega estados `cobrosRecientes` y `pagosRecientes`
- Carga últimos 5 recibos de cada tipo en `cargarDashboard()`
- Muestra dos widgets nuevos:
  - 💰 Cobros Recientes (verde)
  - 💸 Pagos Recientes (rojo)

---

### ✅ FIX 7: Recibos - Filtros en lista

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambios:**
- Agrega estados: `filtroEntidad`, `filtroFechaDesde`, `filtroFechaHasta`, `filtroBusqueda`
- Agrega UI con:
  - Búsqueda por texto (número interno o entidad)
  - Select de entidad (cliente/proveedor)
  - Rango de fechas (desde/hasta)
  - Botones Filtrar y Limpiar
- Backend recibe parámetros de filtrado

---

### ✅ FIX 8: Database - Columna costo_unitario

**Archivo:** `Back/run_migration_costo_unitario.py` (creado)

**Ejecutado:**
```sql
ALTER TABLE factura_detalles 
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(12,2) DEFAULT 0;
```

**Resultado:** ✅ Columna agregada exitosamente

---

## TEST CHECKLIST

### Escenario 1: FC pagada parcialmente
- [ ] Cliente Walter tiene FV-0009 ($134.990) y FV-0014 ($11.999)
- [ ] FV-0014 ya está saldada → **NO aparece** en pendientes
- [ ] FV-0009 tiene pago parcial de $88.001 → aparece con **saldo pendiente $46.989**
- [ ] Input de imputación tiene `max={46.989}`

### Escenario 2: Recibo sin imputación (saldo a favor)
- [ ] Seleccionar cliente Walter
- [ ] Ingresar monto $10.000
- [ ] NO agregar imputaciones
- [ ] Click en "Registrar Recibo" → **ÉXITO** (no error)
- [ ] En cuenta corriente: movimiento con `haber=10.000`, `venta_id=NULL`

### Escenario 3: Proveedor (mismo comportamiento)
- [ ] Seleccionar proveedor Ejemplo SRL
- [ ] Mostrar FCs de compra pendientes con saldo real
- [ ] Permitir pago sin imputación (saldo a favor)

### Escenario 4: Filtros en lista de recibos
- [ ] Buscar "R-0001" → filtra por número
- [ ] Buscar "Walter" → filtra por entidad
- [ ] Seleccionar fecha desde/hasta → filtra por rango
- [ ] Click "Limpiar" → resetea filtros

### Escenario 5: Dashboard muestra cobros/pagos
- [ ] Dashboard carga → muestra widget "💰 Cobros Recientes"
- [ ] Dashboard carga → muestra widget "💸 Pagos Recientes"
- [ ] Cada widget muestra últimos 5 recibos con monto y fecha

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Front/src/pages/Recibos.tsx` | - Cálculo de saldo pendiente real<br>- UI muestra total + pendiente<br>- Permite recibo sin imputación<br>- Agrega filtros de búsqueda |
| `Front/src/pages/Dashboard.tsx` | - Widgets de cobros/pagos recientes |
| `Back/app/api/recibos.py` | - Permite recibos sin imputación<br>- Setea `venta_id`/`compra_id` en Cuenta Corriente |
| `Back/run_migration_costo_unitario.py` | - Script de migración (nuevo) |

---

## ESTADO DEL MÓDULO

| Módulo | Estado | Notas |
|--------|--------|-------|
| FC Compra | ✅ 100% | Funcional |
| FC Venta | ✅ 100% | Fix costo_unitario aplicado |
| Cuenta Corriente | ✅ 100% | + PDF |
| Recibos | ✅ 100% | **FIXES CRÍTICOS APLICADOS** |
| Caja | ❌ Pendiente | No iniciado |
| Dashboard | ⚠️ 80% | Widgets cobros/pagos agregados |

---

## PRÓXIMOS PASOS

1. **Testear en producción** con datos reales
2. **Verificar** que FCs pagadas no aparecen
3. **Verificar** que saldo a favor se registra correctamente
4. **Completar módulo Caja** (pendiente)

---

## NOTAS TÉCNICAS

### Cuenta Corriente - Estructura de movimientos

| Campo | Cobro (imputación) | Pago (imputación) | Saldo a favor |
|-------|-------------------|-------------------|---------------|
| `tipo` | 'cliente' | 'proveedor' | 'cliente'/'proveedor' |
| `entidad_id` | cliente_id | proveedor_id | cliente_id/proveedor_id |
| `venta_id` | ✅ FC Venta ID | NULL | NULL |
| `compra_id` | NULL | ✅ FC Compra ID | NULL |
| `debe` | 0 | 0 | 0 |
| `haber` | monto_imputado | monto_imputado | saldo_a_favor |
| `descripcion` | "Recibo R-0001 - Imputación" | "Recibo R-0001 - Imputación" | "Recibo R-0001 - Saldo a favor" |

### Frontend - Filtrado de movimientos

```typescript
// Para cada FC, filtrar movimientos por venta_id/compra_id
const totalPagado = movimientos
  .filter((m: any) => m.venta_id === fc.id && m.haber > 0)
  .reduce((sum: number, m: any) => sum + (m.haber || 0), 0)
```

**Importante:** Los movimientos de saldo a favor tienen `venta_id=NULL` y `compra_id=NULL`, por lo que **NO se imputan** a ninguna FC específica.

---

**FIN DEL DOCUMENTO**
