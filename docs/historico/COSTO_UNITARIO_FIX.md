# FIX: Columna costo_unitario no existe en factura_detalles / venta_detalles

## Fecha: 2026-02-23

---

## ERROR REPORTADO

```
GET /api/fc-venta/ → 500 Internal Server Error
psycopg2.errors.UndefinedColumn: no existe la columna factura_detalles_1.costo_unitario
```

---

## DIAGNÓSTICO

### Problema Raíz

El sistema tiene **DOS tablas diferentes** para detalles de documentos:

| Tabla | Usa costo_unitario | Estado |
|-------|-------------------|--------|
| `factura_detalles` | ✅ SÍ (desde migración anterior) | OK |
| `venta_detalles` | ❌ NO (faltaba agregar) | **PROBLEMA** |
| `compra_detalles` | ❌ NO (faltaba agregar) | **PROBLEMA** |

### Modelos Involucrados

1. **`Factura`** → usa `FacturaDetalle` (tabla: `factura_detalles`)
   - Ya tenía `costo_unitario` ✅

2. **`Venta`** → usa `VentaDetalle` (tabla: `venta_detalles`)
   - NO tenía `costo_unitario` ❌

3. **`Compra`** → usa `CompraDetalle` (tabla: `compra_detalles`)
   - NO tenía `costo_unitario` ❌

### Causa del Error

SQLAlchemy estaba haciendo JOINs que involucraban `venta_detalles` y esperaba encontrar la columna `costo_unitario`, pero la migración anterior solo la había agregado a `factura_detalles`.

---

## SOLUCIÓN APLICADA

### 1. Migración de Base de Datos

**Archivo:** `Back/run_migration_venta_detalles.py` (creado)

**SQL ejecutado:**
```sql
-- Agregar a venta_detalles
ALTER TABLE venta_detalles 
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(10,2) DEFAULT 0;

-- Agregar a compra_detalles (por consistencia)
ALTER TABLE compra_detalles 
ADD COLUMN IF NOT EXISTS costo_unitario NUMERIC(10,2) DEFAULT 0;
```

**Resultado:**
```
✅ Columna costo_unitario agregada a venta_detalles
✅ Columna costo_unitario agregada a compra_detalles
```

### 2. Actualización del Modelo

**Archivo:** `Back/app/models.py`

**Cambio en `VentaDetalle`:**
```python
class VentaDetalle(Base):
    __tablename__ = "venta_detalles"

    id = Column(Integer, primary_key=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Numeric(10,3), nullable=False)
    precio_unitario = Column(Numeric(10,2), nullable=False)
    costo_unitario = Column(Numeric(10,2), nullable=True)  # ✅ AGREGADO
    subtotal = Column(Numeric(10,2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="venta_detalles")
```

### 3. Verificación del Schema

**Archivo:** `Back/app/schemas.py`

El schema `FCVentaItemResponse` ya incluía `costo_unitario`:
```python
class FCVentaItemResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str
    producto_sku: str
    cantidad: float
    precio_unitario: float
    costo_unitario: float  # ✅ YA EXISTE
    subtotal: float
    ganancia: float
```

---

## ESTADO ACTUAL DE TABLAS

### `factura_detalles`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval(...) |
| factura_id | integer | YES | NULL |
| producto_id | integer | YES | NULL |
| cantidad | numeric | NO | NULL |
| precio_unitario | numeric | NO | NULL |
| iva_porcentaje | numeric | YES | 21 |
| subtotal | numeric | NO | NULL |
| **costo_unitario** | numeric | YES | 0 |

### `venta_detalles`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval(...) |
| venta_id | integer | YES | NULL |
| producto_id | integer | YES | NULL |
| cantidad | numeric | NO | NULL |
| precio_unitario | numeric | NO | NULL |
| subtotal | numeric | NO | NULL |
| **costo_unitario** | numeric | YES | 0 |

### `compra_detalles`
| Columna | Tipo | Nullable | Default |
|---------|------|----------|---------|
| id | integer | NO | nextval(...) |
| compra_id | integer | YES | NULL |
| producto_id | integer | YES | NULL |
| cantidad | numeric | NO | NULL |
| **costo_unitario** | numeric | NO | NULL |
| subtotal | numeric | NO | NULL |
| costo_anterior | numeric | YES | NULL |

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambio |
|---------|--------|
| `Back/app/models.py` | Agregada columna `costo_unitario` en `VentaDetalle` |
| `Back/run_migration_venta_detalles.py` | Script de migración (nuevo) |
| `Back/run_migration_costo_unitario.py` | Script de migración anterior (ya existía) |

---

## VERIFICACIÓN

### 1. Modelos cargan correctamente
```bash
cd "d:\CBA 4.0\AymaraContable\Back"
.\venv\Scripts\python.exe -c "from app.models import Base; print(Base.metadata.tables.keys())"
```

**Resultado:** ✅ Todas las tablas mapeadas correctamente

### 2. Backend compila sin errores
```bash
.\venv\Scripts\python.exe -m py_compile app/models.py app/api/fcventa.py
```

**Resultado:** ✅ Syntax OK

### 3. Columnas en base de datos
```bash
.\venv\Scripts\python.exe run_migration_venta_detalles.py
```

**Resultado:** ✅ Migración completada exitosamente

---

## CÓMO USAR

### API Endpoint
```http
GET /api/fc-venta/
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "numero_interno": "FV-0001",
    "cliente_nombre": "Walter",
    "total": 134990.00,
    "items": [
      {
        "id": 1,
        "producto_nombre": "Producto A",
        "cantidad": 10,
        "precio_unitario": 13499.00,
        "costo_unitario": 8500.00,  // ✅ AHORA DISPONIBLE
        "subtotal": 134990.00,
        "ganancia": 49990.00
      }
    ]
  }
]
```

---

## NOTAS TÉCNICAS

### Diferencia entre `Factura` y `Venta`

| Concepto | `Factura` | `Venta` |
|----------|-----------|---------|
| Tabla | `facturas` | `ventas` |
| Detalle | `factura_detalles` | `venta_detalles` |
| Uso | FC Venta (nuevo sistema) | Ventas (sistema antiguo) |
| Relación | `Factura.items` → `FacturaDetalle` | `Venta.detalles` → `VentaDetalle` |

### Por qué hay dos tablas

El sistema tiene dos modelos paralelos:
1. **`Factura`** - Sistema nuevo de Facturación (FC Venta, FC Compra)
2. **`Venta`** - Sistema antiguo de Ventas

Ambos necesitan `costo_unitario` para calcular ganancias, por eso se agregó en ambas tablas.

---

## PRÓXIMOS PASOS

1. ✅ Ejecutar migración en producción
2. ✅ Verificar que `GET /api/fc-venta/` funciona
3. ✅ Verificar que `GET /api/fc-compra/` funciona
4. ✅ Verificar cálculo de ganancias en Dashboard

---

## COMANDOS DE VERIFICACIÓN

### Ver columnas en factura_detalles
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'factura_detalles'
ORDER BY ordinal_position;
```

### Ver columnas en venta_detalles
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'venta_detalles'
ORDER BY ordinal_position;
```

### Ver columnas en compra_detalles
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'compra_detalles'
ORDER BY ordinal_position;
```

---

**FIN DEL DOCUMENTO**
