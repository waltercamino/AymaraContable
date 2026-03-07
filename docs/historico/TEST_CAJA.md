# 🧪 Guía de Testeo - Módulo Caja Completo

## 📋 Pre-requisitos

1. **Ejecutar limpieza de datos:**
   ```bash
   psql -U usuario -d aymara_contable -f limpieza_caja_test.sql
   ```

2. **Ejecutar seed de categorías:**
   ```bash
   psql -U usuario -d aymara_contable -f categorias_caja_seed.sql
   ```

3. **Backend corriendo:**
   ```bash
   cd Back
   .\venv\Scripts\uvicorn.exe app.main:app --reload
   ```

4. **Frontend corriendo:**
   ```bash
   cd Front
   npm run dev
   ```

---

## 🔄 Circuito Completo de Testeo

### **TEST 1: Apertura de Caja** ✅

1. **Navegar a:** `Caja` en el menú
2. **Estado inicial:** Debería mostrar "Caja ❌ Cerrada"
3. **Acción:** Click en "📅 Abrir/Cerrar" → "🔓 Abrir Caja"
4. **Completar:**
   - Saldo Inicial: `$ 10,000`
   - Observaciones: "Apertura del día - prueba"
5. **Validar:**
   - [ ] Caja muestra "✅ Abierta"
   - [ ] Saldo Inicial: $ 10,000.00
   - [ ] Botón "Nuevo Movimiento" habilitado

---

### **TEST 2: Crear Movimiento - Ingreso** ✅

1. **Acción:** Click en "➕ Nuevo Movimiento"
2. **Completar formulario:**
   - Tipo: 💰 **Ingreso**
   - Monto: `$ 5,000`
   - Categoría: "Venta de Mercadería"
   - Descripción: "Venta mostrador - prueba"
   - Medio de Pago: "Efectivo"
3. **Guardar:** Click en "Guardar Movimiento"
4. **Validar:**
   - [ ] Toast verde: "Movimiento registrado correctamente"
   - [ ] Movimiento aparece en tabla
   - [ ] Resumen actualiza: Ingresos = $ 5,000
   - [ ] Saldo = $ 15,000 (10,000 inicial + 5,000 ingreso)

---

### **TEST 3: Crear Movimiento - Egreso** ✅

1. **Acción:** Click en "➕ Nuevo Movimiento"
2. **Completar formulario:**
   - Tipo: 💸 **Egreso**
   - Monto: `$ 2,000`
   - Categoría: "Pago a Proveedores"
   - Descripción: "Pago factura #1234"
   - Medio de Pago: "Transferencia"
3. **Guardar:** Click en "Guardar Movimiento"
4. **Validar:**
   - [ ] Toast verde: "Movimiento registrado correctamente"
   - [ ] Movimiento aparece en tabla
   - [ ] Resumen actualiza: Egresos = $ 2,000
   - [ ] Saldo = $ 13,000 (15,000 - 2,000)

---

### **TEST 4: Filtros de Movimientos** ✅

1. **Filtrar por tipo:**
   - [ ] Click en "Ingresos" → Solo muestra ingresos
   - [ ] Click en "Egresos" → Solo muestra egresos
   - [ ] Click en "Todos" → Muestra ambos

2. **Filtrar por fecha:**
   - Fecha desde: Hoy
   - Fecha hasta: Hoy
   - Click en "🔍 Filtrar"
   - [ ] Muestra solo movimientos de hoy

3. **Filtrar por categoría:**
   - Categoría: "Venta de Mercadería"
   - Click en "🔍 Filtrar"
   - [ ] Muestra solo ventas

4. **Limpiar filtros:**
   - Click en "🔄 Limpiar"
   - [ ] Vuelve a mostrar todos

---

### **TEST 5: Cierre de Caja con Diferencia** ✅

1. **Acción:** Click en "📅 Abrir/Cerrar" (con caja abierta)
2. **Completar cierre:**
   - Saldo Final (conteo real): `$ 12,500` (menor que teórico)
3. **Validar panel de diferencia:**
   - [ ] Muestra "⚠️ Hay Diferencia" (fondo rojo)
   - [ ] Saldo Teórico: $ 13,000
   - [ ] Saldo Real: $ 12,500
   - [ ] Diferencia: -$ 500.00 (en rojo)
4. **Completar:**
   - Observaciones: "Faltante - diferencia no justificada"
5. **Cerrar:** Click en "🔒 Cerrar Caja"
6. **Validar:**
   - [ ] Toast verde: "Caja cerrada correctamente"
   - [ ] Caja muestra "❌ Cerrada"
   - [ ] Saldo Final: $ 12,500

---

### **TEST 6: Cierre de Caja que Cuadra** ✅

1. **Re-abrir caja:**
   - Click en "📅 Abrir/Cerrar"
   - Saldo Inicial: $ 10,000
   - Observaciones: "Re-apertura - prueba"
2. **Crear movimiento:**
   - Ingreso: $ 3,000 (Venta de Mercadería)
3. **Cerrar caja:**
   - Saldo Final: $ 13,000 (exactamente el teórico)
4. **Validar panel de diferencia:**
   - [ ] Muestra "✅ Caja Cuadra Perfectamente" (fondo verde)
   - [ ] Diferencia: $ 0.00
5. **Cerrar:** Click en "🔒 Cerrar Caja"
6. **Validar:**
   - [ ] Toast verde: "Caja cerrada correctamente"

---

### **TEST 7: Historial de Cajas** ✅

1. **Navegar a:** Pestaña "Historial de Cajas"
2. **Validar:**
   - [ ] Muestra las cajas creadas (abiertas y cerradas)
   - [ ] Columnas: Fecha, Estado, Saldo Inicial, Saldo Final, Apertura, Cierre
   - [ ] Botón "👁️ Ver movimientos" en cada fila

3. **Ver movimientos:**
   - Click en "👁️ Ver movimientos" de una caja cerrada
   - [ ] Modal abre con lista de movimientos de ese día
   - [ ] Muestra hora, tipo, descripción, categoría, monto

---

### **TEST 8: Validaciones y Errores** ✅

1. **Movimiento sin caja abierta:**
   - Cerrar caja primero
   - Intentar crear movimiento
   - [ ] Error: "No hay caja abierta. Debe abrir caja antes..."

2. **Movimiento con monto negativo:**
   - Abrir caja
   - Intentar crear movimiento con monto = -100
   - [ ] Debería validar (monto > 0)

3. **Movimiento sin descripción:**
   - Dejar descripción vacía
   - [ ] Debería validar campo requerido

4. **Cierre sin saldo final:**
   - Abrir caja, crear movimiento
   - Intentar cerrar con saldo final = 0
   - [ ] Debería validar

---

## 📊 Resumen de Validaciones

| Test | Descripción | Estado |
|------|-------------|--------|
| 1 | Apertura de caja | ⬜ Pendiente |
| 2 | Ingreso manual | ⬜ Pendiente |
| 3 | Egreso manual | ⬜ Pendiente |
| 4 | Filtros | ⬜ Pendiente |
| 5 | Cierre con diferencia | ⬜ Pendiente |
| 6 | Cierre que cuadra | ⬜ Pendiente |
| 7 | Historial | ⬜ Pendiente |
| 8 | Validaciones | ⬜ Pendiente |

---

## 🐛 Reporte de Bugs

Si encontrás algún error, completar:

```markdown
**Test fallido:** #X
**Error:** Mensaje del error
**Pasos para reproducir:**
1. ...
2. ...

**Captura:** (si aplica)
```

---

## ✅ Criterios de Aceptación

- [ ] Todos los tests pasan
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend
- [ ] Diferencia en cierre se muestra correctamente (verde/rojo)
- [ ] Categorías filtradas por tipo (ingreso/egreso)
- [ ] Resúmenes calculan correctamente
