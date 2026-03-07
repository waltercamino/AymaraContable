# FIX: Anular Recibo - 422 Error + React Crash

## Fecha: 2026-02-23

---

## ERRORES REPORTADOS

### ERROR 1: HTTP 422 - Unprocessable Content
```
POST /api/recibos/{id}/anular
Status: 422 Unprocessable Content
```

**Causa:** FastAPI no recibía el parámetro `motivo` correctamente. El endpoint esperaba `motivo` como query parameter pero el frontend lo enviaba en el request body.

### ERROR 2: React "Objects are not valid as a React child"
```
Error: Objects are not valid as a React child (found: object with keys {detail, message})
```

**Causa:** Se estaba renderizando el objeto de error de FastAPI directamente en el JSX sin convertirlo a string.

---

## SOLUCIÓN APLICADA

### FIX 1: Backend - Usar Schema para Anular Recibo

**Archivo:** `Back/app/schemas.py`

**Agregado:**
```python
class ReciboAnular(BaseModel):
    """Schema para anular recibo"""
    motivo: str = Field(..., min_length=1, description="Motivo de la anulación (requerido)")
```

---

**Archivo:** `Back/app/api/recibos.py`

**Cambios:**

1. **Import del schema:**
```python
from app.schemas import ReciboCreate, ReciboResponse, ReciboImputacionCreate, ReciboAnular
```

2. **Endpoint actualizado:**
```python
@router.post("/{recibo_id}/anular")
def anular_recibo(
    recibo_id: int,
    data: ReciboAnular,  # ✅ Usar schema con motivo requerido
    db: Session = Depends(get_db),
    usuario_id: Optional[int] = None
):
    # ... validar recibo ...
    
    # ✅ Validar motivo requerido
    if not data.motivo or len(data.motivo.strip()) < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El motivo de anulación es requerido y no puede estar vacío"
        )

    motivo = data.motivo.strip()
    
    # ... resto de lógica ...
```

**Ventajas:**
- ✅ FastAPI valida automáticamente el request body
- ✅ Retorna error 422 claro si falta `motivo`
- ✅ Documentación automática en Swagger UI
- ✅ Type-safe con Pydantic

---

### FIX 2: Frontend - Manejo Seguro de Errores

**Archivo:** `Front/src/pages/Recibos.tsx`

**Cambios:**

1. **Función `anularRecibo` con error handling seguro:**
```typescript
const anularRecibo = async (reciboId: number) => {
  const motivo = prompt('Ingrese el motivo de la anulación:')
  if (!motivo) return

  try {
    const response = await recibos.anular(reciboId, motivo)
    if (response.error) {
      // ✅ Manejo seguro de errores - puede ser string u objeto
      const errorMsg = typeof response.error === 'object' 
        ? (response.error as any).detail?.message || (response.error as any).detail?.[0]?.msg || JSON.stringify(response.error)
        : String(response.error)
      setError(errorMsg)
    } else {
      setSuccess('Recibo anulado correctamente')
      cargarDatos()
      setTimeout(() => setSuccess(''), 3000)
    }
  } catch (err: unknown) {
    // ✅ Manejo seguro de errores en catch
    const errorMsg = err instanceof Error 
      ? err.message 
      : typeof err === 'object' && err !== null
        ? (err as any).detail?.message || (err as any).detail?.[0]?.msg || JSON.stringify(err)
        : 'Error al anular recibo'
    setError(errorMsg)
  }
}
```

2. **Renderizado seguro de errores en el JSX:**
```tsx
{/* Mensajes */}
{error && (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    {/* ✅ Manejo seguro de errores - puede ser string u objeto */}
    {typeof error === 'object' 
      ? (error as any).detail?.message || (error as any).detail?.[0]?.msg || JSON.stringify(error)
      : String(error)}
  </div>
)}
```

**Ventajas:**
- ✅ No crasha React con objetos
- ✅ Muestra mensajes de error legibles
- ✅ Maneja errores de FastAPI (`detail`, `message`)
- ✅ Fallback a `JSON.stringify` si es otro objeto

---

## ESTADO ANTES VS DESPUÉS

### Antes ❌

| Componente | Comportamiento |
|------------|---------------|
| Backend | Espera `motivo` como query parameter → 422 Error |
| Frontend | Renderiza objeto de error → React crash |
| Usuario | Ve error técnico incomprensible |

### Después ✅

| Componente | Comportamiento |
|------------|---------------|
| Backend | Recibe `motivo` en request body → 200 OK |
| Frontend | Convierte error a string legible → Mensaje claro |
| Usuario | Ve mensaje de error comprensible |

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Back/app/schemas.py` | Agregada clase `ReciboAnular` |
| `Back/app/api/recibos.py` | Endpoint `anular_recibo` usa schema + validación |
| `Front/src/pages/Recibos.tsx` | Error handling seguro en `anularRecibo` + renderizado |

---

## VERIFICACIÓN

### 1. Backend compila sin errores
```bash
cd "d:\CBA 4.0\AymaraContable\Back"
.\venv\Scripts\python.exe -m py_compile app/schemas.py app/api/recibos.py
```
**Resultado:** ✅ Syntax OK

### 2. Frontend compila sin errores
```bash
cd "d:\CBA 4.0\AymaraContable\Front"
npm run build
```
**Resultado:** ✅ Build completed successfully

### 3. Swagger UI actualizado
```
GET /docs
```
**Resultado:** ✅ Endpoint `/api/recibos/{id}/anular` muestra schema `ReciboAnular`

---

## TEST CHECKLIST

| Test | Estado |
|------|--------|
| Anular recibo con motivo válido → 200 OK | ✅ Ready |
| Anular recibo sin motivo → 422 claro | ✅ Ready |
| Error se muestra como texto (no crash) | ✅ Ready |
| Mensaje de éxito después de anular | ✅ Ready |
| Recibo anulado no aparece en lista | ✅ Ready |

---

## CÓMO PROBAR

### 1. Anular recibo exitosamente

```typescript
// Frontend: Click en "Anular" en un recibo
// Prompt: "Ingrese el motivo de la anulación:"
// Input: "Error en la carga"
// Resultado esperado: 
//   - POST /api/recibos/1/anular → 200 OK
//   - Mensaje: "Recibo anulado correctamente"
//   - Recibo desaparece de la lista
```

### 2. Intentar anular sin motivo

```typescript
// Frontend: Click en "Anular" en un recibo
// Prompt: "Ingrese el motivo de la anulación:"
// Input: "" (vacío) o Cancel
// Resultado esperado:
//   - No se envía request (Cancel)
//   - O 422 con mensaje claro (vacío)
```

### 3. Error de validación

```typescript
// Backend: motivo con solo espacios
// Input: "   "
// Resultado esperado:
//   - 422 Unprocessable Entity
//   - detail: "El motivo de anulación es requerido y no puede estar vacío"
//   - Frontend muestra mensaje legible
```

---

## API DOCUMENTATION

### Endpoint: Anular Recibo

```http
POST /api/recibos/{recibo_id}/anular
Content-Type: application/json
Authorization: Bearer {token}

{
  "motivo": "Error en la carga del recibo"
}
```

**Response 200 OK:**
```json
{
  "message": "Recibo anulado correctamente",
  "numero_interno": "R-0001",
  "motivo": "Error en la carga del recibo"
}
```

**Response 422 Unprocessable Entity:**
```json
{
  "detail": "El motivo de anulación es requerido y no puede estar vacío"
}
```

**Response 404 Not Found:**
```json
{
  "detail": "Recibo no encontrado o ya está anulado"
}
```

---

## NOTAS TÉCNICAS

### Schema ReciboAnular

```python
class ReciboAnular(BaseModel):
    motivo: str = Field(..., min_length=1, description="Motivo de la anulación (requerido)")
```

**Validaciones automáticas:**
- `motivo` es requerido (`...`)
- `min_length=1` → No puede ser string vacío
- `description` → Documentación en Swagger

### Error Handling en Frontend

```typescript
// Jerarquía de extracción de mensaje de error:
1. error.detail?.message        // FastAPI standard
2. error.detail?.[0]?.msg       // FastAPI validation errors
3. JSON.stringify(error)        // Fallback para objetos
4. String(error)                // Fallback para primitivos
```

---

## PRÓXIMOS PASOS

1. ✅ Testear en producción con datos reales
2. ✅ Verificar que todos los errores se muestran correctamente
3. ✅ Agregar más validaciones si es necesario (ej: motivo mínimo 10 caracteres)
4. ✅ Considerar agregar auditoría (quién anuló, cuándo, por qué)

---

**FIN DEL DOCUMENTO**
