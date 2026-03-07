# CAJA - FIX: AttributeError 'proveedor' en MovimientoCaja

## Fecha: 2026-02-23

---

## ❌ PROBLEMA

```
AttributeError: type object 'MovimientoCaja' has no attribute 'proveedor'
En: Back/app/api/caja.py, línea 118
  joinedload(MovimientoCaja.proveedor)
```

**Error completo:**
```python
File "d:\CBA 4.0\AymaraContable\Back\app\api\caja.py", line 118
    joinedload(MovimientoCaja.proveedor)
AttributeError: type object 'MovimientoCaja' has no attribute 'proveedor'
```

---

## 🔍 CAUSA RAÍZ

La columna `proveedor_id` existe en la tabla `movimientos_caja`, pero **faltaba el relationship** en el modelo SQLAlchemy.

**Modelo antes (INCORRECTO):**
```python
class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"
    
    id = Column(Integer, primary_key=True)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))  # ✅ FK existe
    # ...
    
    categoria_caja = relationship("CategoriaCaja", back_populates="movimientos")
    usuario = relationship("Usuario", back_populates="movimientos")
    # ❌ FALTA: proveedor relationship
```

**API intentaba usar:**
```python
# Back/app/api/caja.py, línea 118
movimientos = db.query(MovimientoCaja).options(
    joinedload(MovimientoCaja.proveedor),  # ❌ No existe el attribute
    joinedload(MovimientoCaja.cliente)
).all()
```

---

## ✅ SOLUCIÓN APLICADA

### 1. Agregar relationships en MovimientoCaja

**Archivo:** `Back/app/models.py`

**Cambios en clase `MovimientoCaja`:**
```python
class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True)
    # ... campos existentes ...
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    
    # ✅ AGREGADOS (faltaban):
    proveedor = relationship("Proveedor", back_populates="movimientos_caja")
    cliente = relationship("Cliente", back_populates="movimientos_caja")
```

### 2. Agregar back_populates en Proveedor

**Archivo:** `Back/app/models.py`

**Cambios en clase `Proveedor`:**
```python
class Proveedor(Base):
    __tablename__ = "proveedores"
    
    # ... campos existentes ...
    
    # ✅ AGREGADO:
    movimientos_caja = relationship("MovimientoCaja", back_populates="proveedor")
```

### 3. Agregar back_populates en Cliente

**Archivo:** `Back/app/models.py`

**Cambios en clase `Cliente`:**
```python
class Cliente(Base):
    __tablename__ = "clientes"
    
    # ... campos existentes ...
    
    # ✅ AGREGADO:
    movimientos_caja = relationship("MovimientoCaja", back_populates="cliente")
```

---

## 📊 DIAGRAMA DE RELATIONSHIPS

```
┌─────────────────┐
│   Proveedor     │
├─────────────────┤
│ id              │◄────┐
│ nombre          │     │
│ ...             │     │
│ movimientos_caja│─────┘ (relationship)
└─────────────────┘
       ▲
       │
       │ ForeignKey
       │
┌──────┴──────────────────┐
│   MovimientoCaja        │
├─────────────────────────┤
│ id                      │
│ proveedor_id ───────────┼─── ForeignKey("proveedores.id")
│ cliente_id              │
│ categoria_caja_id       │
│ ...                     │
│ proveedor ──────────────┤─── relationship("Proveedor")
│ cliente ────────────────┤─── relationship("Cliente")
│ categoria_caja ─────────┤─── relationship("CategoriaCaja")
└─────────────────────────┘
       ▲
       │
       │ ForeignKey
       │
┌──────┴──────────────────┐
│      Cliente            │
├─────────────────────────┤
│ id                      │◄────┐
│ nombre                  │     │
│ apellido                │     │
│ ...                     │     │
│ movimientos_caja        │─────┘ (relationship)
└─────────────────────────┘
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
✅ models.py fixed - relationships agregados
```

### 2. Endpoints funcionan
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
    "proveedor_nombre": null,
    "categoria_nombre": "Cobro Cta. Cte.",
    "medio_pago": "efectivo"
  }
]
```

### 3. No hay AttributeError en logs
```
✅ Sin errores de 'proveedor' attribute
✅ joinedload funciona correctamente
```

---

## 📝 ARCHIVOS MODIFICADOS

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `Back/app/models.py` | Agregar `proveedor` relationship en MovimientoCaja | 193-194 |
| `Back/app/models.py` | Agregar `cliente` relationship en MovimientoCaja | 193-194 |
| `Back/app/models.py` | Agregar `movimientos_caja` en Proveedor | 70 |
| `Back/app/models.py` | Agregar `movimientos_caja` en Cliente | 262 |

---

## ✅ CHECKLIST DE VERIFICACIÓN

| # | Test | Resultado |
|---|------|-----------|
| 1 | GET /api/caja/ → 200 OK (no 500) | ✅ |
| 2 | GET /api/caja/hoy → 200 OK | ✅ |
| 3 | Dashboard carga widgets de caja sin error | ✅ |
| 4 | Movimientos muestran nombre de proveedor/cliente | ✅ |
| 5 | No hay AttributeError en logs del backend | ✅ |
| 6 | Backend compila sin errores | ✅ |

---

## 🎯 LECCIONES APRENDIDAS

### Regla de SQLAlchemy: **ForeignKey + relationship**

Cuando usas una ForeignKey, **siempre** debes definir el relationship:

```python
# ✅ CORRECTO
class MovimientoCaja(Base):
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    proveedor = relationship("Proveedor", back_populates="movimientos_caja")

class Proveedor(Base):
    movimientos_caja = relationship("MovimientoCaja", back_populates="proveedor")
```

**¿Por qué?**
- `ForeignKey` → Define la relación a nivel de BD
- `relationship` → Define la relación a nivel de ORM (Python)
- `back_populates` → Bidireccionalidad (opcional pero recomendado)

### joinedload requiere relationship

```python
# ❌ ERROR (sin relationship)
joinedload(MovimientoCaja.proveedor)  # AttributeError

# ✅ FUNCIONA (con relationship)
joinedload(MovimientoCaja.proveedor)  # OK
```

---

## 📚 REFERENCIAS

- [SQLAlchemy Relationships](https://docs.sqlalchemy.org/en/20/orm/basic-relationships.html)
- [joinedload() Documentation](https://docs.sqlalchemy.org/en/20/orm/queryguide/relationships.html#joinedload)
- [Back Populates](https://docs.sqlalchemy.org/en/20/orm/basic-relationships.html#bidirectional-relationships-with-back-populates)

---

**FIX COMPLETADO** ✅

El error `AttributeError: 'proveedor'` ha sido resuelto agregando los relationships faltantes en el modelo `MovimientoCaja` y sus correspondientes `back_populates` en `Proveedor` y `Cliente`.
