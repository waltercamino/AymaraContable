# ✅ FIX: ResponseValidationError en POST /api/fc-compra/

## Problema

```
fastapi.exceptions.ResponseValidationError: 7 validation errors:
{'type': 'missing', 'loc': ('response', 'fecha'), 'msg': 'Field required', ...}
{'type': 'missing', 'loc': ('response', 'proveedor_id'), 'msg': 'Field required', ...}
```

## Causa

El endpoint POST devolvía un dict custom con solo algunos campos:
```python
return {
    "message": "FC registrada correctamente",
    "numero_interno": numero_interno,
    "id": db_compra.id,
    "total": float(db_compra.total),
    ...
}
```

Pero FastAPI esperaba que coincidiera EXACTAMENTE con el schema `CompraResponse`.

## Solución Aplicada

### 1. Backend - `Back/app/api/fccompra.py`

**Endpoint POST actualizado:**
```python
@router.post("/", response_model=CompraResponse, status_code=status.HTTP_201_CREATED)
def crear_fc_compra(compra: FCCompraCreate, db: Session = Depends(get_db), usuario_id: Optional[int] = None):
    # ... lógica de creación ...
    
    db.commit()
    db.refresh(db_compra)
    
    # ⚠️ FIX: Devolver TODOS los campos del schema
    return {
        "id": db_compra.id,
        "numero_interno": db_compra.numero_interno,
        "numero_factura": db_compra.numero_factura,
        "numero_remision": db_compra.numero_remision,
        "fecha": db_compra.fecha.isoformat() if db_compra.fecha else None,
        "fecha_vencimiento": db_compra.fecha_vencimiento.isoformat() if db_compra.fecha_vencimiento else None,
        "proveedor_id": db_compra.proveedor_id,
        "subtotal": float(db_compra.subtotal) if db_compra.subtotal else 0,
        "iva": float(db_compra.iva) if db_compra.iva else 0,
        "total": float(db_compra.total) if db_compra.total else 0,
        "medio_pago": db_compra.medio_pago,
        "estado": db_compra.estado,
        "observaciones": db_compra.observaciones,
        "creado_en": db_compra.creado_en.isoformat() if db_compra.creado_en else None,
        "actualizado_en": db_compra.actualizado_en.isoformat() if db_compra.actualizado_en else None,
        "anulado_por": db_compra.anulado_por,
        "fecha_anulacion": db_compra.fecha_anulacion.isoformat() if db_compra.fecha_anulacion else None,
        "motivo_anulacion": db_compra.motivo_anulacion
    }
```

### 2. Backend - `Back/app/schemas.py`

**Schema actualizado con valores por defecto:**
```python
class CompraResponse(BaseModel):
    id: int
    numero_interno: Optional[str] = None
    numero_factura: str
    fecha: date
    fecha_vencimiento: Optional[date] = None
    proveedor_id: int
    numero_remision: Optional[str] = None
    subtotal: Optional[float] = 0
    iva: Optional[float] = 0
    total: float
    medio_pago: Optional[str] = None
    estado: str  # 'registrada', 'anulada', 'borrador'
    observaciones: Optional[str] = None
    anulado_por: Optional[int] = None
    fecha_anulacion: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None
    creado_en: datetime
    actualizado_en: Optional[datetime] = None

    class Config:
        from_attributes = True  # ← CRÍTICO para SQLAlchemy
```

### 3. Frontend - `Front/src/pages/FCCompra.tsx`

**Manejo de respuesta exitosa:**
```typescript
const confirmarFCCompra = async () => {
  const response = await fcCompra.create(payload)
  
  if (response.error) {
    setError(response.error)
  } else {
    const numeroInterno = (response.data as any)?.numero_interno || 'registrada'
    setSuccess(`FC ${numeroInterno} creada correctamente`)
    setShowPreview(false)
    setShowModal(false)
    resetForm()
    cargarDatos()
    setTimeout(() => setSuccess(''), 3000)
  }
}
```

## Test Checklist

| # | Test | Status |
|---|------|--------|
| 1 | GET /api/fc-compra/ → 200 OK | ✅ |
| 2 | POST /api/fc-compra/ → 201 Created | ✅ |
| 3 | Respuesta incluye TODOS los campos | ✅ |
| 4 | Stock del producto se actualiza | ✅ |
| 5 | costo_promedio = último costo | ✅ |
| 6 | precio_venta se recalcula | ✅ |
| 7 | Cta. Cte. se actualiza (si corresponde) | ✅ |
| 8 | Frontend cierra modal después de éxito | ✅ |
| 9 | Frontend limpia formulario | ✅ |
| 10 | No hay ResponseValidationError | ✅ |

## Output del Test

```bash
# Test GET
GET /api/fc-compra/
Status: 200
Body: [{"id":12,"numero_interno":"FC-0012","numero_factura":"0001-00001234",...}]

# Test POST
POST /api/fc-compra/
{
  "numero_factura": "TEST-001",
  "proveedor_id": 1,
  "fecha": "2026-02-22",
  "medio_pago": "efectivo",
  "detalles": [
    {"producto_id": 1, "cantidad": 10, "costo_unitario": 100}
  ]
}

Status: 201 Created
Body: {
  "id": 24,
  "numero_interno": "FC-0024",
  "numero_factura": "TEST-001",
  "fecha": "2026-02-22",
  "subtotal": 1000.0,
  "iva": 0.0,
  "total": 1000.0,
  "medio_pago": "efectivo",
  "estado": "registrada",
  ...
}

DEBUG [último costo] Producto Test:
  Stock anterior: 51.000
  Compra: 10.0 x 100.0
  Costo anterior guardado: $8000.0
  Nuevo stock: 61.000, Nuevo costo (último): $100.00
  Margen aplicado: 50.0%, Nuevo precio venta: $199
```

## Claves del Fix

1. **`from_attributes = True`** en el schema - Permite que FastAPI convierta objetos SQLAlchemy a JSON
2. **Todos los campos obligatorios** deben estar en el return
3. **Campos Optional** deben tener valor por defecto (None o 0)
4. **Fechas** deben convertirse a ISO string con `.isoformat()`
5. **Numeric** de PostgreSQL debe convertirse a `float`
6. **`db.refresh()`** después de `db.commit()` para obtener todos los campos

## Archivos Modificados

- `Back/app/api/fccompra.py` - Endpoint POST con return completo
- `Back/app/schemas.py` - CompraResponse con campos opcionales y defaults
- `Front/src/pages/FCCompra.tsx` - Manejo de éxito (ya estaba correcto)

## Notas Importantes

⚠️ **Response Model Validation**: FastAPI valida que la respuesta coincida EXACTAMENTE con el schema definido en `response_model`.

⚠️ **from_attributes**: Sin `from_attributes = True`, FastAPI no puede serializar objetos SQLAlchemy.

⚠️ **Campos DateTime**: Siempre usar `.isoformat()` para convertir datetime a string JSON-compatible.

⚠️ **Campos Numeric**: PostgreSQL Numeric → Python Decimal → float para JSON.
