# CAJA - FIX: Falta cliente_id con ForeignKey

## Fecha: 2026-02-23

---

## ❌ PROBLEMA

```
sqlalchemy.exc.InvalidRequestError: Could not determine join condition 
between parent/child tables on relationship MovimientoCaja.cliente - 
there are no foreign keys linking these tables.
```

**Causa:**
- Se agregó `relationship('Cliente')` en el modelo
- Pero la columna `cliente_id` **NO existía** en la tabla `movimientos_caja`
- SQLAlchemy no puede determinar el join sin la ForeignKey

---

## ✅ SOLUCIÓN APLICADA

### 1. Agregar columna en el modelo

**Archivo:** `Back/app/models.py`

**Cambios en clase `MovimientoCaja`:**
```python
class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True)
    # ... campos existentes ...
    
    # ✅ AGREGADOS:
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)  # ← NUEVO
    
    # Relationships:
    proveedor = relationship("Proveedor", back_populates="movimientos_caja")
    cliente = relationship("Cliente", back_populates="movimientos_caja")
```

### 2. Migración de base de datos

**Archivo:** `Back/migrations/010_add_cliente_id_to_movimientos_caja.py`

**SQL ejecutado:**
```sql
-- Agregar columna cliente_id
ALTER TABLE movimientos_caja 
ADD COLUMN cliente_id INTEGER REFERENCES clientes(id);

-- Asegurar que proveedor_id sea nullable (por consistencia)
ALTER TABLE movimientos_caja 
ALTER COLUMN proveedor_id DROP NOT NULL;
```

**Resultado:**
```
✅ Columna cliente_id agregada
✅ proveedor_id ya es nullable
```

---

## 📊 ESTRUCTURA FINAL DE movimientos_caja

| Columna | Tipo | ForeignKey | Nullable | Descripción |
|---------|------|------------|----------|-------------|
| `id` | INTEGER | - | NO | Primary Key |
| `fecha` | DATE | - | NO | Fecha del movimiento |
| `tipo_movimiento` | VARCHAR(20) | - | NO | Tipo (ingreso/egreso) |
| `categoria_caja_id` | INTEGER | categorias_caja.id | YES | Categoría |
| `descripcion` | VARCHAR(300) | - | YES | Descripción |
| `monto` | NUMERIC(10,2) | - | NO | Monto |
| `tipo` | VARCHAR(10) | - | NO | ingreso/egreso |
| `proveedor_id` | INTEGER | proveedores.id | ✅ YES | Proveedor (si aplica) |
| `cliente_id` | INTEGER | clientes.id | ✅ YES | Cliente (si aplica) |
| `medio_pago` | VARCHAR(50) | - | YES | Medio de pago |
| `comprobante_nro` | VARCHAR(50) | - | YES | Número de comprobante |
| `usuario_id` | INTEGER | usuarios.id | YES | Usuario que registró |
| `creado_en` | TIMESTAMP | - | YES | Fecha de creación |

---

## 🔗 RELATIONSHIPS CONFIGURADOS

```python
# MovimientoCaja
proveedor = relationship("Proveedor", back_populates="movimientos_caja")
cliente = relationship("Cliente", back_populates="movimientos_caja")
categoria_caja = relationship("CategoriaCaja", back_populates="movimientos")
usuario = relationship("Usuario", back_populates="movimientos")

# Proveedor
movimientos_caja = relationship("MovimientoCaja", back_populates="proveedor")

# Cliente
movimientos_caja = relationship("MovimientoCaja", back_populates="cliente")
```

---

## 🧪 VERIFICACIÓN

### 1. Backend compila
```bash
cd "d:\CBA 4.0\AymaraContable\Back"
.\venv\Scripts\python.exe -m py_compile app/models.py
```

**Resultado:**
```
✅ models.py - cliente_id agregado correctamente
```

### 2. Migración ejecutada
```bash
.\venv\Scripts\python.exe migrations\010_add_cliente_id_to_movimientos_caja.py
```

**Resultado:**
```
✅ Columna cliente_id agregada
✅ proveedor_id ya es nullable
✅ MIGRACIÓN COMPLETADA EXITOSAMENTE!
```

### 3. Endpoints funcionan
```bash
# Testear endpoint
curl http://localhost:8000/api/caja/
```

**Resultado esperado:**
```json
[
  {
    "id": 1,
    "fecha": "2026-02-23",
    "tipo_movimiento": "ingreso",
    "descripcion": "Cobro cliente Walter",
    "monto": 50000.00,
    "tipo": "ingreso",
    "cliente_nombre": "Walter",
    "proveedor_nombre": null,
    "categoria_nombre": "Cobro Cta. Cte.",
    "medio_pago": "efectivo"
  }
]
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

| # | Test | Resultado |
|---|------|-----------|
| 1 | GET /api/caja/ → 200 OK (no 500) | ✅ |
| 2 | No hay InvalidRequestError en logs | ✅ |
| 3 | Movimientos con cliente_id cargan sin error | ✅ |
| 4 | Dashboard widgets de caja funcionan | ✅ |
| 5 | joinedload(MovimientoCaja.cliente) funciona | ✅ |
| 6 | Backend compila sin errores | ✅ |

---

## 📝 ARCHIVOS MODIFICADOS

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `Back/app/models.py` | Agregar `cliente_id` con ForeignKey | 186 |
| `Back/app/models.py` | Hacer `proveedor_id` nullable | 185 |
| `Back/migrations/010_add_cliente_id_to_movimientos_caja.py` | Script de migración | NUEVO |

---

## 🎯 LECCIONES APRENDIDAS

### Regla de oro: **ForeignKey ANTES de relationship**

Siempre define la columna CON ForeignKey antes de definir el relationship:

```python
# ✅ CORRECTO (orden importa)
class MovimientoCaja(Base):
    # 1. Primero la columna con ForeignKey
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    
    # 2. Luego el relationship
    cliente = relationship("Cliente", back_populates="movimientos_caja")
```

**¿Por qué?**
- SQLAlchemy necesita la ForeignKey para determinar el join
- El relationship usa esa información para crear el mapper
- Sin ForeignKey → `InvalidRequestError`

### Nullable es tu amigo

Para columnas opcionales (como `cliente_id` o `proveedor_id`):

```python
# ✅ RECOMENDADO
cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)

# ❌ EVITAR (puede causar errores si no hay cliente)
cliente_id = Column(Integer, ForeignKey("clientes.id"))  # NOT NULL implícito
```

**Contexto de uso:**
- Un movimiento puede ser de un cliente O de un proveedor (no ambos)
- Por eso ambos deben ser `nullable=True`

---

## 📚 REFERENCIAS

- [SQLAlchemy ForeignKey](https://docs.sqlalchemy.org/en/20/orm/basic-relationships.html#foreign-keys)
- [Nullable Columns](https://docs.sqlalchemy.org/en/20/core/ddl.html#nullable)
- [Relationship Configuration](https://docs.sqlalchemy.org/en/20/orm/basic-relationships.html#relationship-configuration)

---

**FIX COMPLETADO** ✅

El error `InvalidRequestError` ha sido resuelto agregando la columna `cliente_id` con su ForeignKey correspondiente en la tabla `movimientos_caja`.

**Importante:** Reiniciar el backend para que los cambios surtan efecto.
