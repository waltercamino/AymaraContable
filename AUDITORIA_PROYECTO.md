# AUDITORÍA COMPLETA - MAPEO DE ARCHIVOS Y MÓDULOS
## AymaraContable v4.0

**Fecha:** 2026-02-23

---

## 1. TABLA COMPLETA DE MÓDULOS

| Módulo | Tablas BD | Endpoints | Páginas UI | Estado | Observaciones |
|--------|-----------|-----------|------------|--------|---------------|
| **FC Compra** | `compras`, `compra_detalles` | `/api/fc-compra/` | `FCCompra.tsx` | ✅ 100% | Funcional |
| **FC Venta** | `facturas`, `factura_detalles` | `/api/fc-venta/` | `FCVenta.tsx` | ✅ 100% | Funcional |
| **Compras (Legacy)** | `compras`, `compra_detalles` | `/api/compras/` | ❌ No existe | ⚠️ Duplicado | Usar FC Compra |
| **Ventas (Legacy)** | `ventas`, `venta_detalles` | `/api/ventas/` | `Ventas.tsx` | ⚠️ 50% | **NO USAR** - Usar FC Venta |
| **Cuenta Corriente** | `cuenta_corriente` | `/api/cuenta-corriente/` | `CuentaCorriente.tsx` | ✅ 100% | Funcional |
| **Recibos** | `recibos`, `recibo_imputaciones` | `/api/recibos/` | `Recibos.tsx` | ✅ 100% | Simplificado (sin imputación) |
| **Caja** | `movimientos_caja`, `categorias_caja` | `/api/caja/` | `Caja.tsx` | ⚠️ 50% | Faltan widgets |
| **Dashboard** | - | `/api/reportes/` | `Dashboard.tsx` | ⚠️ 80% | Widgets cobros/pagos OK |
| **Facturación** | `facturas` | `/api/facturacion/` | `Facturacion.tsx` | ❓ Legacy | Verificar si se usa |
| **Notas Crédito** | `notas_credito`, `nota_credito_detalles` | `/api/notas-credito/` | `NotasCredito.tsx` | ✅ 100% | Funcional |
| **Productos** | `productos`, `categorias`, `historial_costos`, `historial_margenes` | `/api/productos/` | `Productos.tsx` | ✅ 100% | Funcional |
| **Precios** | `listas_precios`, `detalles_lista_precios` | `/api/precios/` | `Precios.tsx` | ✅ 100% | Funcional |
| **Clientes** | `clientes` | `/api/clientes/` | `Clientes.tsx` | ✅ 100% | Funcional |
| **Proveedores** | `proveedores` | `/api/proveedores/` | `Proveedores.tsx` | ✅ 100% | Funcional |
| **Usuarios** | `usuarios`, `roles` | `/api/usuarios/` | `Usuarios.tsx` | ✅ 100% | Funcional |
| **Reportes** | - | `/api/reportes/` | `Reportes.tsx` | ⚠️ 50% | Faltan widgets |

---

## 2. MAPEO DETALLADO DE ENDPOINTS

### BACKEND - Back/app/api/

| Archivo | Endpoint Base | Métodos | Estado |
|---------|---------------|---------|--------|
| `recibos.py` | `/api/recibos/` | GET, POST, POST/{id}/anular, GET/{id}/pdf | ✅ Activo |
| `fcventa.py` | `/api/fc-venta/` | GET, POST, POST/{id}/anular, GET/{id}/pdf | ✅ Activo |
| `fccompra.py` | `/api/fc-compra/` | GET, POST, PUT, POST/{id}/anular | ✅ Activo |
| `cuenta_corriente.py` | `/api/cuenta-corriente/` | GET, POST | ✅ Activo |
| `caja.py` | `/api/caja/` | GET, POST, DELETE | ✅ Activo |
| `ventas.py` | `/api/ventas/` | GET, POST, DELETE | ⚠️ **Legacy** |
| `facturacion.py` | `/api/facturacion/` | GET, POST, DELETE | ⚠️ Legacy |
| `notas_credito.py` | `/api/notas-credito/` | GET, POST, POST/{id}/anular, GET/{id}/pdf | ✅ Activo |
| `productos.py` | `/api/productos/` | GET, POST, PUT, DELETE | ✅ Activo |
| `precios.py` | `/api/precios/` | GET, POST, PUT, DELETE | ✅ Activo |
| `clientes.py` | `/api/clientes/` | GET, POST, PUT, DELETE | ✅ Activo |
| `proveedores.py` | `/api/proveedores/` | GET, POST, PUT, DELETE | ✅ Activo |
| `usuarios.py` | `/api/usuarios/` | GET, POST, PUT, DELETE | ✅ Activo |
| `categorias.py` | `/api/categorias/` | GET, POST, PUT, DELETE | ✅ Activo |
| `reportes.py` | `/api/reportes/` | GET (varios) | ✅ Activo |

---

## 3. MAPEO DE TABLAS DE BASE DE DATOS

### Tablas Principales (23 tablas)

| Tabla | Modelo | Schema | Estado | Uso |
|-------|--------|--------|--------|-----|
| `recibos` | `Recibo` | `ReciboCreate`, `ReciboResponse` | ✅ Activa | Recibos de cobros/pagos |
| `recibo_imputaciones` | `ReciboImputacion` | `ReciboImputacionCreate` | ⚠️ En desuso | Ya no se usa (simplificado) |
| `facturas` | `Factura` | `FacturaCreate`, `FCVentaResponse` | ✅ Activa | FC Ventas |
| `factura_detalles` | `FacturaDetalle` | `FacturaDetalleCreate` | ✅ Activa | Detalles FC Venta |
| `compras` | `Compra` | `FCCompraCreate`, `CompraResponse` | ✅ Activa | FC Compras |
| `compra_detalles` | `CompraDetalle` | `CompraDetalleCreate` | ✅ Activa | Detalles FC Compra |
| `cuenta_corriente` | `CuentaCorriente` | `CuentaCorrienteBase` | ✅ Activa | Deuda clientes/proveedores |
| `ventas` | `Venta` | `VentaCreate`, `VentaResponse` | ⚠️ Legacy | Ventas antiguas |
| `venta_detalles` | `VentaDetalle` | `VentaDetalleCreate` | ⚠️ Legacy | Detalles ventas antiguas |
| `movimientos_caja` | `MovimientoCaja` | `MovimientoCajaCreate` | ✅ Activa | Caja |
| `categorias_caja` | `CategoriaCaja` | - | ✅ Activa | Categorías de caja |
| `productos` | `Producto` | `ProductoBase` | ✅ Activa | Productos |
| `categorias` | `Categoria` | `CategoriaBase` | ✅ Activa | Categorías de productos |
| `clientes` | `Cliente` | `ClienteBase` | ✅ Activa | Clientes |
| `proveedores` | `Proveedor` | `ProveedorBase` | ✅ Activa | Proveedores |
| `usuarios` | `Usuario` | `UsuarioBase` | ✅ Activa | Usuarios |
| `roles` | `Rol` | - | ✅ Activa | Roles de usuarios |
| `listas_precios` | `ListaPrecio` | `ListaPreciosBase` | ✅ Activa | Listas de precios |
| `detalles_lista_precios` | `DetalleListaPrecio` | - | ✅ Activa | Detalles de listas |
| `historial_costos` | `HistorialCostos` | - | ✅ Activa | Historial de costos |
| `historial_margenes` | `HistorialMargenes` | `HistorialMargenesCreate` | ✅ Activa | Historial de márgenes |
| `notas_credito` | `NotaCredito` | `NotaCreditoCreate` | ✅ Activa | Notas de crédito |
| `nota_credito_detalles` | `NotaCreditoDetalle` | `NotaCreditoDetalleCreate` | ✅ Activa | Detalles NC |

---

## 4. IDENTIFICACIÓN DE DUPLICADOS

### ❌ PARA ELIMINAR / DESACTIVAR

| Archivo | Tipo | Justificación | Acción Recomendada |
|---------|------|---------------|-------------------|
| `Back/app/api/ventas.py` | Backend API | **Duplica FC Venta** - Usa tablas `ventas` en lugar de `facturas` | **ELIMINAR** o marcar como deprecated |
| `Front/src/pages/Ventas.tsx` | Frontend Page | **Duplica FCVenta.tsx** - interfaz antigua | **ELIMINAR** |
| `Back/app/api/facturacion.py` | Backend API | Posible duplicado de FC Venta | Verificar uso, posiblemente eliminar |
| `Front/src/pages/Facturacion.tsx` | Frontend Page | Posible duplicado de FCVenta.tsx | Verificar uso, posiblemente eliminar |
| `ReciboImputacion` (modelo) | Database Model | **En desuso** - Recibos simplificados no usan imputación | Mantener por compatibilidad histórica, no usar en nuevo código |
| `recibo_imputaciones` (tabla) | Database Table | **En desuso** - Recibos simplificados no usan imputación | Mantener por compatibilidad histórica |
| Ruta `/ventas` en App.tsx | Frontend Route | Apunta a Ventas.tsx (legacy) | **ELIMINAR** o redirigir a `/fc-venta` |
| Ítem "Ventas" en Sidebar | UI Menu | Apunta a /ventas (legacy) | **ELIMINAR** o cambiar a /fc-venta |

### ✅ PARA MANTENER

| Archivo | Tipo | Justificación |
|---------|------|---------------|
| `Back/app/api/fcventa.py` | Backend API | **Sistema oficial de FC Ventas** |
| `Back/app/api/fccompra.py` | Backend API | **Sistema oficial de FC Compras** |
| `Front/src/pages/FCVenta.tsx` | Frontend Page | **UI oficial de FC Ventas** |
| `Front/src/pages/FCCompra.tsx` | Frontend Page | **UI oficial de FC Compras** |
| `Back/app/api/recibos.py` | Backend API | **Sistema oficial de Recibos (simplificado)** |
| `Front/src/pages/Recibos.tsx` | Frontend Page | **UI oficial de Recibos (simplificado)** |
| `Back/app/api/cuenta_corriente.py` | Backend API | Sistema de cuenta corriente |
| `Front/src/pages/CuentaCorriente.tsx` | Frontend Page | UI de cuenta corriente |
| `Back/app/api/caja.py` | Backend API | Sistema de caja |
| `Front/src/pages/Caja.tsx` | Frontend Page | UI de caja (completar) |
| Todos los demás módulos | Varios | Funcionales y en uso |

---

## 5. CIRCUITOS ACTUALIZADOS (BD → API → UI)

### Circuito FC Venta ✅
```
BD: facturas, factura_detalles
    ↓
API: /api/fc-venta/ (fcventa.py)
    ↓
UI:  /fc-venta (FCVenta.tsx)
```

### Circuito FC Compra ✅
```
BD: compras, compra_detalles
    ↓
API: /api/fc-compra/ (fccompra.py)
    ↓
UI:  /fc-compra (FCCompra.tsx)
```

### Circuito Recibos ✅ (Simplificado)
```
BD: recibos (recibo_imputaciones en desuso)
    ↓
API: /api/recibos/ (recibos.py) - SIN imputación
    ↓
UI:  /recibos (Recibos.tsx) - SIN sección de imputación
```

### Circuito Cuenta Corriente ✅
```
BD: cuenta_corriente
    ↓
API: /api/cuenta-corriente/ (cuenta_corriente.py)
    ↓
UI:  /cuenta-corriente (CuentaCorriente.tsx)
```

### Circuito Caja ⚠️
```
BD: movimientos_caja, categorias_caja
    ↓
API: /api/caja/ (caja.py)
    ↓
UI:  /caja (Caja.tsx) - ⚠️ Faltan widgets
```

### Circuito Ventas (Legacy) ❌
```
BD: ventas, venta_detalles
    ↓
API: /api/ventas/ (ventas.py) ← **NO USAR**
    ↓
UI:  /ventas (Ventas.tsx) ← **NO USAR**
                    ↓
            Usar FC Venta en su lugar
```

---

## 6. CAMBIOS REQUERIDOS

### A. Frontend - App.tsx

**ELIMINAR:**
```tsx
<Route path="/ventas" element={<Ventas />} />  // ← Línea 30
```

**OPCIONAL:** Redirigir /ventas a /fc-venta
```tsx
<Route path="/ventas" element={<Navigate to="/fc-venta" replace />} />
```

### B. Frontend - Sidebar.tsx

**ELIMINAR:**
```typescript
{ path: '/ventas', icon: ShoppingCart, label: 'Ventas' },  // ← Línea 35
```

**OPCIONAL:** Cambiar label a "FC Venta" para consistencia
```typescript
{ path: '/fc-venta', icon: ShoppingCart, label: 'FC Venta' },
```

### C. Frontend - Eliminar Archivos

```bash
# Eliminar página legacy
rm Front/src/pages/Ventas.tsx
```

### D. Backend - Marcar como Deprecated

**Opción A:** Eliminar completamente
```bash
rm Back/app/api/ventas.py
```

**Opción B:** Marcar como deprecated (recomendado)
```python
# Back/app/api/ventas.py - AGREGAR al inicio
"""
⚠️ DEPRECATED: Este módulo está en desuso.
Usar /api/fc-venta/ en su lugar.
Programado para eliminación en v5.0
"""
```

### E. Database - Limpieza (OPCIONAL)

**NO eliminar tablas legacy todavía** - Pueden haber datos históricos.

**En su lugar, ejecutar:**
```sql
-- Marcar tablas legacy como obsoletas
COMMENT ON TABLE ventas IS '⚠️ DEPRECATED: Usar facturas en su lugar';
COMMENT ON TABLE venta_detalles IS '⚠️ DEPRECATED: Usar factura_detalles en su lugar';
```

---

## 7. RECOMENDACIONES PARA CAJA/REPORTES

### Módulo Caja (Completar)

**Falta:**
1. Widgets en Dashboard para:
   - Total ingresos hoy
   - Total egresos hoy
   - Saldo actual de caja
   - Últimos movimientos

2. En `Caja.tsx`:
   - Filtros por fecha
   - Filtros por tipo (ingreso/egreso)
   - Filtros por medio de pago
   - Totalizador de movimientos

**Archivos a modificar:**
- `Front/src/pages/Caja.tsx` - Agregar filtros y totales
- `Front/src/pages/Dashboard.tsx` - Agregar widgets de caja
- `Back/app/api/reportes.py` - Agregar endpoints para widgets

### Módulo Reportes (Completar)

**Falta:**
1. Reporte de ventas por período
2. Reporte de compras por período
3. Reporte de ganancias (ventas - costos)
4. Reporte de IVA (compras/ventas)
5. Balance de caja

**Archivos a crear:**
- `Back/app/reportes/ventas_reporte.py`
- `Back/app/reportes/compras_reporte.py`
- `Back/app/reportes/ganancias_reporte.py`
- `Front/src/pages/Reportes.tsx` - Completar con filtros

---

## 8. RESUMEN DE ACCIONES

### Prioridad ALTA

| # | Acción | Impacto | Dificultad |
|---|--------|---------|------------|
| 1 | Eliminar `/ventas` de App.tsx y Sidebar | Evita confusión | Baja |
| 2 | Eliminar `Ventas.tsx` | Limpia código | Baja |
| 3 | Marcar `ventas.py` como deprecated | Documenta decisión | Baja |
| 4 | Completar widgets de Caja | Mejora UX | Media |

### Prioridad MEDIA

| # | Acción | Impacto | Dificultad |
|---|--------|---------|------------|
| 5 | Completar módulo Reportes | Mejora funcionalidad | Media |
| 6 | Eliminar `recibo_imputaciones` del código | Limpia código | Baja |
| 7 | Actualizar documentación | Claridad | Baja |

### Prioridad BAJA

| # | Acción | Impacto | Dificultad |
|---|--------|---------|------------|
| 8 | Eliminar tablas legacy (ventas, venta_detalles) | Limpia BD | **ALTA** (riesgo) |
| 9 | Eliminar `ventas.py` completamente | Limpia backend | Media |

---

## 9. ESTADÍSTICAS FINALES

| Métrica | Cantidad |
|---------|----------|
| **Módulos Funcionales** | 12 |
| **Módulos Legacy** | 2 (ventas, facturacion) |
| **Tablas en BD** | 23 |
| **Endpoints API** | 16 |
| **Páginas Frontend** | 16 (15 activas + 1 legacy) |
| **Componentes UI** | 3 |
| **Servicios API** | 16 |
| **Rutas Activas** | 18 |
| **Items de Menú** | 15 |
| **Migraciones SQL** | 8 |

---

## 10. CONCLUSIÓN

El proyecto AymaraContable tiene una arquitectura **mayormente consistente** con algunos **módulos legacy duplicados** que deben eliminarse:

### ✅ Puntos Fuertes
- Circuitos FC Compra/Venta bien definidos
- Recibos simplificados (sin imputación compleja)
- Cuenta Corriente funcional
- Dashboard con widgets útiles

### ⚠️ Áreas de Mejora
- **Eliminar módulo Ventas legacy** (duplica FC Venta)
- **Completar módulo Caja** (faltan widgets)
- **Completar módulo Reportes** (faltan filtros)

### 📋 Próximo Sprint
1. Eliminar Ventas legacy (1-2 horas)
2. Completar widgets de Caja (4-6 horas)
3. Completar módulo Reportes (6-8 horas)

---

**FIN DEL DOCUMENTO**
