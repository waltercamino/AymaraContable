# 🔧 FIX: Nota de Crédito - Superposición Visual de Botón "Nuevo Cliente"

## PROBLEMA
En el formulario de Nota de Crédito (dentro del módulo de Ventas):

1. Al seleccionar un cliente, aparece un selector para elegir la factura a imputar.
2. Este selector se superponía con el botón "Nuevo Cliente" que está al lado del selector de clientes.
3. El resultado era visualmente incorrecto y dificultaba la usabilidad.

---

## CAUSA RAÍZ

El dropdown "Factura de Venta Original" (que solo aparece en Notas de Crédito) se abría debajo del selector de cliente, pero al desplegarse hacia arriba o por su posición, tapaba el botón "Nuevo Cliente" que estaba inline en la misma fila.

---

## SOLUCIÓN

### Frontend - `Front/src/pages/FCVenta.tsx`

#### Selector de Cliente + Botón "Nuevo Cliente"

**Antes (layout común para Venta y Nota de Crédito):**
```tsx
<div className="flex gap-2 items-start">
  <select className="flex-1 px-3 py-2 ...">
    ...
  </select>
  <button className="px-3 py-2 bg-blue-600 ...">
    ➕ Nuevo Cliente
  </button>
</div>
{/* El selector de factura aparece debajo */}
{tipoComprobante === 'nota_credito' && (
  <div>
    <label>Factura de Venta Original</label>
    <select>...</select> {/* Se superpone con el botón */}
  </div>
)}
```

**Después (layout diferenciado por tipo de comprobante):**
```tsx
<div className="flex gap-2 items-start">
  <select className="flex-1 px-3 py-2 ...">
    ...
  </select>
  {/* Botón inline SOLO para Factura de Venta */}
  {tipoComprobante === 'venta' && (
    <button className="px-3 py-2 bg-blue-600 ...">
      ➕ Nuevo Cliente
    </button>
  )}
</div>
{/* Botón debajo SOLO para Nota de Crédito */}
{tipoComprobante === 'nota_credito' && (
  <button className="mt-2 px-3 py-2 bg-blue-600 ...">
    ➕ Nuevo Cliente
  </button>
)}
{/* El selector de factura aparece debajo, sin superposición */}
{tipoComprobante === 'nota_credito' && (
  <div>
    <label>Factura de Venta Original</label>
    <select>...</select>
  </div>
)}
```

### Cambios Realizados:

| Tipo Comprobante | Layout | Propósito |
|-----------------|--------|-----------|
| `venta` | Botón inline al lado del selector | Mantiene el layout original |
| `nota_credito` | Botón debajo del selector | Evita superposición con dropdown de factura |

---

## RESULTADO

### Layout del Formulario - Factura de Venta (sin cambios)

```
┌─────────────────────────────────────┐
│ Cliente *                           │
│ ┌───────────────┐┌───────────────┐  │
│ │ Select Cliente││➕ Nuevo Cliente│  │
│ └───────────────┘└───────────────┘  │
└─────────────────────────────────────┘
```

### Layout del Formulario - Nota de Crédito (FIX)

**Antes:**
```
┌─────────────────────────────────────┐
│ Cliente *                           │
│ ┌───────────────┐┌───────────────┐  │
│ │ Select Cliente││➕ Nuevo Cliente│  │ ← TAPADO
│ └───────────────┘└───────────────┘  │
│ 🔴 Selector de Factura (NC)         │
│ ┌─────────────────────────────────┐ │
│ │ Select Factura (se superpone)   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Después:**
```
┌─────────────────────────────────────┐
│ Cliente *                           │
│ ┌───────────────────────────────┐   │
│ │ Select Cliente                │   │
│ └───────────────────────────────┘   │
│ ➕ Nuevo Cliente (debajo)           │
│ 🔴 Selector de Factura (NC)         │
│ ┌─────────────────────────────────┐ │
│ │ Select Factura (sin superposición)││
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## TESTING

### 1. Nota de Crédito - Selector de Factura
- [x] Ir a Ventas → Nueva Venta
- [x] Seleccionar "Nota de Crédito"
- [x] Seleccionar un cliente
- [x] ¿Aparece el selector de facturas? ✅
- [x] ¿El selector NO se superpone con el botón "Nuevo Cliente"? ✅
- [x] ¿El botón "Nuevo Cliente" es visible y accesible? ✅

### 2. Factura de Venta (sin cambios)
- [x] Ir a Ventas → Nueva Venta
- [x] Seleccionar "Factura de Venta"
- [x] ¿El botón "Nuevo Cliente" funciona correctamente? ✅
- [x] ¿Sin cambios visuales negativos? ✅

### 3. Responsive
- [x] Probar en diferentes tamaños de pantalla
- [x] ¿El botón mantiene su tamaño (no se encoge)? ✅
- [x] ¿La alineación es correcta? ✅

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Front/src/pages/FCVenta.tsx` | - **Venta**: Botón "Nuevo Cliente" inline (sin cambios)<br>- **Nota de Crédito**: Botón movido debajo del selector de cliente<br>- Condicional `tipoComprobante` para diferenciar layouts |

---

## NOTAS ADICIONALES

### Estrategia de Layout Diferenciado

Se implementó un layout condicional según el tipo de comprobante:

**Factura de Venta:**
- Botón "Nuevo Cliente" inline al lado del selector
- Layout compacto y eficiente

**Nota de Crédito:**
- Botón "Nuevo Cliente" debajo del selector de cliente
- El dropdown "Factura de Venta Original" tiene espacio completo para desplegarse
- Sin superposiciones visuales

### ¿Por Qué Esta Solución?

- ✅ **Simple**: Solo mueve el botón de posición según el contexto
- ✅ **Efectiva**: Elimina completamente la superposición
- ✅ **Mantenible**: Código claro y fácil de entender
- ✅ **Segura**: No afecta otros módulos del sistema

### Solo Afecta a Ventas

Este fix solo modifica el formulario de Ventas (que incluye Notas de Crédito de Clientes). No afecta:
- ❌ FC Compras
- ❌ Notas de Crédito de Proveedores
- ❌ Otros módulos del sistema

---

## ✅ CONCLUSIÓN

El problema de superposición visual fue resuelto exitosamente:

1. ✅ **Selector de facturas sin superposición** - El dropdown tiene espacio completo para desplegarse
2. ✅ **Botón "Nuevo Cliente" visible y accesible** - Ubicado debajo del selector en NC
3. ✅ **Layout diferenciado por contexto** - Venta (inline) vs NC (debajo)
4. ✅ **Sin afectar otros módulos** - Solo cambia el formulario de Ventas
