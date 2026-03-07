# 📋 CONTEXTO PROYECTO - Aymara Contable v4.0

## 🏗️ Arquitectura
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL (Python)
- **Frontend**: React + TypeScript + Tailwind + Vite
- **Comunicación**: REST API + Toast notifications + Loading hooks

## ✅ Módulos Completos

### FC Venta (Factura de Venta) - UNIFICADO con NC
- [x] Validación fecha no futura
- [x] Unicidad N° Factura por cliente
- [x] Loading indicators + Spinner reutilizable
- [x] Toast notifications éxito/error
- [x] Saldo cliente visible al seleccionar
- [x] **tipo_comprobante**: `'venta'` | `'nota_credito'`
- [x] **NC de Cliente integrada**: selector de factura original, precio original preservado
- [x] **Validaciones NC**: cantidad ≤ facturado, productos filtrados, medio de pago forzado (cta_cte)
- [x] **Inversión lógica**: stock (resta/suma), CC (aumenta/reduce), caja (ingreso/egreso)

### FC Compra (Factura de Compra) + NC Proveedor
- [x] Integración `tipo_comprobante`: `'compra'` | `'nota_credito'`
- [x] NC de Proveedor: stock resta, CC reduce deuda, caja ingresa
- [x] UI dinámica: colores rojo/azul según tipo
- [x] Selector de FC original para NC (con factura o crédito comercial)
- [x] **Fix aplicado**: `proveedor_id` en endpoint GET /api/fc-compra/
- [x] **Fix aplicado**: Comparación flexible string/number en filtro
- [x] Medio de pago forzado a `cta_cte` para NC

### Recibos (Consolidado en Cuenta Corriente)
- [x] Módulo Recibos eliminado de UI (App.tsx + Sidebar.tsx)
- [x] Funcionalidad migrada a Cuenta Corriente
- [x] Botón "🖨️ Imprimir" en movimientos de CC
- [x] Comprobante genérico para todos los medios de pago (incluye transferencia)
- [x] Dashboard mantiene `recibos.getAll()` para cobros/pagos recientes

### Caja - Apertura/Cierre/Movimientos
- [x] Apertura de caja con saldo inicial
- [x] Cierre de caja con cálculo de diferencia (teórico vs real)
- [x] Panel visual de diferencia (verde=cuadra, rojo≠0)
- [x] Movimientos manuales con: tipo, monto, categoría, descripción, medio_pago
- [x] Filtros por fecha, tipo, categoría
- [x] Historial de cajas diarias
- [x] **caja_id** en MovimientoCaja para vincular a sesión específica
- [x] Fix: Movimientos filtran por `caja_id`, no por fecha
- [x] Categorías precargadas (14 básicas: 5 ingresos + 9 egresos)

### Cuenta Corriente
- [x] Saldo unificado: `debe - haber` para clientes y proveedores
- [x] Saldo > 0 = entidad nos debe (activa botón Cobrar/Pagar)
- [x] Botón "🖨️ Imprimir" en cobros/pagos (todos los medios de pago)
- [x] Comprobante genérico desde CC (endpoint `/movimiento/{id}/imprimir`)
- [x] Exportar PDF y Excel

## 🔄 Módulo Eliminado

### Notas de Crédito - Ventas (UNIFICADO en FCVenta.tsx)
- [x] ~~NotasCredito.tsx~~ → Migrado a FCVenta.tsx
- [x] ~~Endpoint /api/notas-credito/~~ → Eliminado de routing
- [x] Funcionalidad preservada: precio original, validaciones, UI dinámica

### Recibos (Página independiente)
- [x] ~~Recibos.tsx~~ → Eliminado (funcionalidad en Cuenta Corriente)
- [x] ~~Ruta /recibos~~ → Eliminada de App.tsx
- [x] ~~Item menú Recibos~~ → Eliminado de Sidebar.tsx
- [x] api.ts mantiene solo `recibos.getAll()` para Dashboard

## 📁 Estructura Actual

### Frontend

```
Front/src/
├── pages/
│   ├── FCVenta.tsx        # Factura de Venta + NC de Cliente (UNIFICADO)
│   ├── FCCompra.tsx       # Factura de Compra + NC Proveedor
│   ├── Productos.tsx      # Gestión de productos
│   ├── Clientes.tsx       # Gestión de clientes
│   ├── Proveedores.tsx    # Gestión de proveedores
│   ├── Caja.tsx           # Apertura/cierre + movimientos (con caja_id)
│   ├── CuentaCorriente.tsx # Cta. Cte. + imprimir comprobantes
│   ├── Precios.tsx        # Actualización de precios
│   ├── Pedidos.tsx        # Pedidos a proveedores
│   └── Dashboard.tsx      # Dashboard principal
├── hooks/
│   └── useLoading.ts      # Hook reutilizable con toasts
├── components/
│   └── Spinner.tsx        # Componente de carga
├── utils/
│   ├── validaciones.ts    # validarFechaNoFutura()
│   └── format.ts          # formatCurrency, formatDate
└── services/api.ts        # Servicios API centralizados
```

### Backend

```
Back/app/
├── api/
│   ├── fcventa.py         # FC Venta + NC Cliente (UNIFICADO)
│   ├── fccompra.py        # FC Compra + NC Proveedor
│   ├── productos.py       # ABM Productos + stock
│   ├── clientes.py        # ABM Clientes
│   ├── proveedores.py     # ABM Proveedores
│   ├── caja.py            # Movimientos + apertura/cierre (con caja_id)
│   ├── cuenta_corriente.py # Cta. Cte. + imprimir comprobantes
│   ├── recibos.py         # Solo para Dashboard (getAll)
│   ├── precios.py         # Actualización masiva
│   └── auth.py            # Autenticación JWT
├── models.py              # SQLAlchemy models (CajaDia con relación usuario)
├── schemas.py             # Pydantic schemas
├── database.py            # Conexión DB
└── main.py                # Punto de entrada
```

## ⚙️ Configuración Clave

### IVA Monotributo
```typescript
// Frontend: const IVA_PORCENTAJE = 0
// Backend: IVA_PORCENTAJE = Decimal("0")
// Cambiar a 0.21 si es Responsable Inscripto
```

### Tipo de Comprobante - Ventas
```typescript
// FCVenta.tsx:
const [tipoComprobante, setTipoComprobante] = useState<'venta' | 'nota_credito'>('venta')

// Si 'nota_credito':
// - Stock: SUMA (reintegra)
// - CC: Reduce deuda (haber)
// - Caja: EGRESO (devolución)
// - Medio de pago: forzado a 'cta_cte'
```

### Tipo de Comprobante - Compras
```typescript
// FCCompra.tsx:
const [tipoComprobante, setTipoComprobante] = useState<'compra' | 'nota_credito'>('compra')

// Si 'nota_credito':
// - Stock: RESTA (desconta)
// - CC: Reduce deuda (haber)
// - Caja: INGRESO (reintegro)
// - Medio de pago: forzado a 'cta_cte'
```

### Cuenta Corriente - Convención de Signos
```python
# Unificado para clientes y proveedores:
saldo = debe - haber

# Interpretación:
# - saldo > 0: entidad nos debe (activa Cobrar/Pagar)
# - saldo < 0: entidad tiene crédito
```

### Caja - Sesiones Múltiples
```python
# Cada movimiento se vincula a una sesión de caja específica
MovimientoCaja.caja_id = CajaDia.id  # FK

# Al cerrar caja, solo suma movimientos de ESA sesión
movimientos = db.query(MovimientoCaja).filter(
    MovimientoCaja.caja_id == caja.id  # NO por fecha
).all()
```

## 🔧 Fixes Aplicados

| Fecha | Módulo | Fix | Estado |
|-------|--------|-----|--------|
| 2026-02-28 | Cuenta Corriente | Lógica contable invertida (saldo = debe - haber) | ✅ |
| 2026-02-28 | Cuenta Corriente | Botón Cobrar/Pagar se activa con saldo > 0 | ✅ |
| 2026-02-28 | Cuenta Corriente | Imprimir comprobantes (todos los medios de pago) | ✅ |
| 2026-02-28 | Recibos | Módulo eliminado de UI (consolidado en CC) | ✅ |
| 2026-02-28 | Caja | Modal de movimiento completado | ✅ |
| 2026-02-28 | Caja | Diferencia visible en cierre (teórico vs real) | ✅ |
| 2026-02-28 | Caja | Categorías precargadas (14 básicas) | ✅ |
| 2026-02-28 | Caja | Relación usuario en CajaDia | ✅ |
| 2026-02-28 | Caja | **FIX CRÍTICO**: Movimientos filtran por `caja_id`, no por fecha | ✅ |
| 2026-02-28 | Caja | Fix: Variables `total_saldo` y `por_categoria` en /resumen | ✅ |
| 2026-02-28 | **Caja - Aislamiento de Sesiones** | **FIX COMPLETO**: 13 cambios para aislamiento de sesiones | ✅ |

### 📦 Fix Caja - Aislamiento de Sesiones (Detalle)

| # | Archivo | Fix | Descripción |
|---|---------|-----|-------------|
| 1 | `Front/src/pages/Caja.tsx` | Secuencial | `getHoy()` antes de `getAll()`/`getResumen()` |
| 2 | `Front/src/pages/Caja.tsx` | Maneja null | Si `!cajaData`, limpiar y mostrar mensaje |
| 3 | `Front/src/pages/Caja.tsx` | UI mensaje | Alerta "No hay caja abierta" |
| 4 | `Back/app/api/caja.py` | `/apertura` | SIEMPRE crea NUEVO ID, no reabre cerrada |
| 5 | `Back/app/api/caja.py` | `/hoy` | Filtra por `estado='abierto'` + ORDER BY |
| 6 | `Back/app/api/caja.py` | `crear_movimiento()` | + ORDER BY fecha_apertura DESC |
| 7 | `Back/app/api/caja.py` | `/` (getAll) | Filtra por `caja_id` (prioridad sobre fecha) |
| 8 | `Back/app/api/caja.py` | `/resumen` | Filtra por `caja_id` + logging debug |
| 9 | `Back/app/api/caja.py` | `/historial/{id}/movimientos` | Filtra por `caja_id`, no por fecha |
| 10 | `Back/app/api/fcventa.py` | Imports | Agregar `CajaDia, MovimientoCaja, CategoriaCaja` |
| 11 | `Back/app/api/fcventa.py` | `caja_id` | Asigna + ORDER BY + fallback categoría |
| 12 | `Back/app/api/fcventa.py` | Medios pago | Registra efectivo, transferencia, cheque, tarjeta |
| 13 | `Back/app/api/fccompra.py` | Imports | Agregar `CajaDia` |
| 14 | `Back/app/api/fccompra.py` | `caja_id` | Asigna + ORDER BY + fallback categoría |
| 15 | `Back/app/api/fccompra.py` | Medios pago | Registra efectivo, transferencia, cheque, tarjeta |
| 16 | `Back/app/api/cuenta_corriente.py` | Imports | Agregar `date, CajaDia, CategoriaCaja` |
| 17 | `Back/app/api/cuenta_corriente.py` | `registrar_pago()` | Solo inmediatos + fallback + Decimal |
| 18 | `Back/app/api/cuenta_corriente.py` | `registrar_cobro()` | Solo inmediatos + fallback + Decimal |
| 19 | `Back/app/api/recibos.py` | `caja_id` | Asigna + ORDER BY |
| 20 | `Back/app/api/notas_credito.py` | `caja_id` | Asigna + ORDER BY |

**Documentación completa:** `CAJA_FIX_CAJA_ID_MOVIMIENTOS.md`

## 🚀 Comandos Útiles

```bash
# Backend
cd Back
.\venv\Scripts\uvicorn.exe app.main:app --reload

# Frontend
cd Front
npm run dev

# Build check
npm run build  # Debe retornar 0 errores TypeScript

# SQL - Cargar categorías de caja
psql -U usuario -d aymara_contable -f Back/categorias_caja_seed.sql

# SQL - Limpiar datos de prueba de caja
psql -U usuario -d aymara_contable -f Back/limpieza_caja_test.sql
```

## 📝 Convenciones

- **Prompts**: Breves, con análisis previo antes de código
- **Modificaciones**: Siempre confirmar antes de aplicar
- **Debug**: Logging temporal + console.log en navegador
- **BD**: No modificar sin SQL explícito y revisión conjunta
- **Unificación**: NC de Ventas/Compras integradas en FC Venta/Compra
- **Caja**: Cada sesión (apertura/cierre) es independiente, usa `caja_id`

## 🎯 Próximas Mejoras (Opcional)

| Módulo | Tarea | Prioridad |
|--------|-------|-----------|
| Sistema | IVA configurable desde UI/Settings | 🟢 Baja |
| Sistema | Checkbox "¿Reintegrar stock?" para NC | 🟢 Baja |
| Global | Extender toasts a Productos/Clientes/Proveedores | 🟢 Baja |
| FC Venta | Imprimir NC con formato específico | 🟡 Media |
| FC Compra | Reporte de NC emitidas por período | 🟡 Media |
| Caja | Botón imprimir reporte diario | 🟢 Baja |

## 📄 Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `Back/categorias_caja_seed.sql` | Categorías precargadas para caja (14 items) |
| `Back/limpieza_caja_test.sql` | SQL para limpiar datos de prueba de caja |
| `TEST_CAJA.md` | Guía completa de testeo (8 tests) |
| `CAJA_FIX_CAJA_ID_MOVIMIENTOS.md` | **Documentación COMPLETA de fixes de caja** (20 cambios) |
| `CAJA_FIX_RELATIONSHIPS.md` | Documentación de fixes en caja |
| `CAJA_FIX_UNDEFINED_PARAMS.md` | Fix parámetros indefinidos |
| `CAJA_FIX_REAPERTURA.md` | Fix reapertura de caja |
| `CAJA_FIX_CLIENTE_ID.md` | Fix cliente_id en caja |
| `CAJA_FIX_404.md` | Fix errores 404 en caja |
| `RECIBOS_FIXES.md` | Fixes en módulo recibos |
| `RECIBOS_SIMPLIFICADO.md` | Simplificación de recibos |
| `RECIBOS_UI_FIX.md` | Fixes de UI en recibos |
| `RECIBOS_FC_REAPARECE_FIX.md` | Fix FC que reaparece |
| `RECIBOS_CTA_CTE_FIX.md` | Fix cuenta corriente en recibos |
| `RECIBOS_ANULAR_FIX.md` | Fix anulación de recibos |
| `COSTO_UNITARIO_FIX.md` | Fix costo unitario |
| `LIMPIEZA_VENTAS_LEGACY.md` | Limpieza de ventas legacy |
| `PEDIDOS_PROVEEDORES_IMPLEMENTACION.md` | Implementación de pedidos |
| `AUDITORIA_PROYECTO.md` | Auditoría del proyecto |
