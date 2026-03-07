# MIGRACIÓN VENTAS LEGACY → FC VENTA

**Fecha de Migración:** 2026-02-25  
**Versión del Sistema:** 4.0  
**Estado:** ✅ COMPLETADA

---

## RESUMEN EJECUTIVO

| Ítem | Estado |
|------|--------|
| Backup generado | ✅ `backup_ventas_legacy.json` |
| Script de migración creado | ✅ `migrar_ventas_a_facturas.py` |
| Código legacy eliminado | ✅ `ventas.py` eliminado |
| Modelos eliminados de models.py | ✅ `Venta`, `VentaDetalle` |
| Datos migrados | ⏸️ Pendiente de ejecutar |
| Tablas eliminadas de BD | ⏸️ Pendiente (requiere ejecución manual) |

---

## ARCHIVOS MODIFICADOS

### 1. Backend - Eliminados

| Archivo | Acción | Motivo |
|---------|--------|--------|
| `Back/app/api/ventas.py` | ❌ Eliminado | Legacy duplicado por `fcventa.py` |

### 2. Backend - Modificados

| Archivo | Cambios |
|---------|---------|
| `Back/app/models.py` | - Eliminadas clases `Venta` y `VentaDetalle`<br>- Eliminada relación `ventas` en `Usuario`<br>- Eliminada relación `venta_detalles` en `Producto` |
| `Back/app/main.py` | - Eliminado import `from app.api import ventas`<br>- Eliminado `app.include_router(ventas.router...)` |
| `Back/app/api/usuarios.py` | - Cambiado validación de `Venta` → `Factura` |
| `Back/app/api/clientes.py` | - `historial_ventas_cliente()` ahora usa `Factura`<br>- `resumen_cliente()` eliminó referencia a `Venta` |
| `Back/app/api/reportes.py` | - Todos los reportes ahora usan solo `Factura` |

### 3. Frontend - Eliminados

| Archivo | Acción | Motivo |
|---------|--------|--------|
| `Front/src/pages/Ventas.tsx` | ❌ Eliminado | Legacy duplicado por `FCVenta.tsx` |

### 4. Frontend - Modificados

| Archivo | Cambios |
|---------|---------|
| `Front/src/App.tsx` | - Eliminada ruta `/ventas`<br>- Eliminada ruta `/facturacion` |
| `Front/src/components/Layout/Sidebar.tsx` | - Eliminado ítem "Ventas"<br>- Eliminado ítem "Facturación" |
| `Front/src/services/api.ts` | - Eliminado servicio `ventas` |

---

## MIGRACIÓN DE DATOS

### Backup

**Archivo:** `Back/scripts/backup_ventas_legacy.json`

| Tabla | Registros |
|-------|-----------|
| `ventas` | 4 |
| `venta_detalles` | 4 |
| **Monto total** | $80,800.00 |

### Script de Migración

**Archivo:** `Back/scripts/migrar_ventas_a_facturas.py`

**Ejecución:**
```bash
cd "d:\CBA 4.0\AymaraContable\Back"
python scripts/migrar_ventas_a_facturas.py
```

**Mapeo de Campos:**

| ventas → facturas | Transformación |
|-------------------|----------------|
| `id` | → `id` (mismo ID para trazabilidad) |
| `fecha` | → `fecha` |
| `total_venta` | → `total` |
| `cliente_nombre` | → `cliente_id` (búsqueda por nombre) |
| `medio_pago` | → `medio_pago` |
| `usuario_id` | → `usuario_id` |
| - | → `numero_interno` = "FV-{id:04d}" |
| - | → `numero_factura` = 1000 + id |
| - | → `tipo_comprobante` = "FC" (minorista) / "FB" (mayorista) |
| - | → `observaciones` = "Migrado desde legacy ventas.py" |

| venta_detalles → factura_detalles | Transformación |
|-----------------------------------|----------------|
| `venta_id` | → `factura_id` |
| `producto_id` | → `producto_id` |
| `cantidad` | → `cantidad` |
| `precio_unitario` | → `precio_unitario` |
| `costo_unitario` | → `costo_unitario` |
| `subtotal` | → `subtotal` |

### Resultado Esperado

```
============================================================
MIGRACIÓN DE VENTAS LEGACY A FC VENTA
============================================================
Backup: .../backup_ventas_legacy.json
Fecha de exportación: 2026-02-25T00:00:00
Total ventas a migrar: 4
Total detalles a migrar: 4
============================================================
✓ Venta #1 → Factura #1 (Cliente: Consumidor Final)
✓ Venta #2 → Factura #2 (Cliente: Juan Pérez)
✓ Venta #3 → Factura #3 (Cliente: María González)
✓ Venta #4 → Factura #4 (Cliente: Carlos Rodríguez)

============================================================
RESUMEN DE MIGRACIÓN
============================================================
✓ Facturas migradas: 4
✓ Detalles migrados: 4
============================================================
```

---

## LIMPIEZA DE BASE DE DATOS

### Script SQL

**Archivo:** `Back/scripts/drop_ventas_legacy.sql`

**Ejecución Manual (pgAdmin):**
```bash
# 1. Abrir pgAdmin
# 2. Conectar a la base de datos "sistema_contable"
# 3. Abrir Query Tool
# 4. Copiar y pegar contenido de drop_ventas_legacy.sql
# 5. Ejecutar (F5)
```

**Comandos:**
```sql
DROP TABLE IF EXISTS venta_detalles CASCADE;
DROP TABLE IF EXISTS ventas CASCADE;
```

---

## VERIFICACIÓN POST-MIGRACIÓN

### 1. Verificar Imports de Python

```bash
cd "d:\CBA 4.0\AymaraContable\Back"
python -m py_compile app/main.py
python -m py_compile app/api/usuarios.py
python -m py_compile app/api/clientes.py
python -m py_compile app/api/reportes.py
python -m py_compile app/models.py
```

### 2. Verificar que no queden referencias a `Venta`

```bash
# Buscar en todo el proyecto (excluyendo venv y backups)
grep -r "from.*Venta" --include="*.py" Back/app/
grep -r "db.query(Venta" --include="*.py" Back/app/
```

**Resultado esperado:** 0 coincidencias (excepto en `ventas.py` que fue eliminado)

### 3. Iniciar Backend

```bash
cd "d:\CBA 4.0\AymaraContable\Back"
uvicorn app.main:app --reload
```

**Verificar logs:**
- ✅ Sin errores de import
- ✅ `GET /api/fc-venta/` funciona
- ✅ `GET /api/clientes/1/historial` funciona
- ✅ `GET /api/reportes/ganancia` funciona

### 4. Verificar Frontend

```bash
cd "d:\CBA 4.0\AymaraContable\Front"
npm run dev
```

**Verificar:**
- ✅ Sin errores de compilación
- ✅ `/fc-venta` carga correctamente
- ✅ Sidebar no muestra "Ventas" ni "Facturación"

---

## ROLLBACK (EN CASO DE ERROR)

### 1. Restaurar Código

```bash
# Si se necesita revertir:
git checkout HEAD -- Back/app/api/ventas.py
git checkout HEAD -- Back/app/models.py
git checkout HEAD -- Front/src/pages/Ventas.tsx
# ... etc
```

### 2. Restaurar Datos desde Backup

```python
# Script de rollback (crear si es necesario)
# Back/scripts/rollback_ventas.py
```

---

## PRÓXIMOS PASOS

- [ ] Ejecutar `migrar_ventas_a_facturas.py`
- [ ] Verificar datos migrados en pgAdmin
- [ ] Ejecutar `drop_ventas_legacy.sql`
- [ ] Ejecutar tests de regresión
- [ ] Actualizar documentación de API

---

## HISTORIAL DE CAMBIOS

| Fecha | Versión | Cambio | Autor |
|-------|---------|--------|-------|
| 2026-02-25 | 4.0 | FASE 1: Eliminación de referencias directas | - |
| 2026-02-25 | 4.0 | FASE 2: Refactorización Venta → Factura | - |
| 2026-02-25 | 4.0 | FASE 3: Eliminación código legacy + migración | - |

---

**FIN DEL DOCUMENTO**
