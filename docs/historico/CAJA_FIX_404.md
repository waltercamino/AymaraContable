# CAJA - FIX: Endpoints 404 Not Found

## Fecha: 2026-02-23

---

## ❌ PROBLEMA

Todos los endpoints `/api/caja/*` devolvían **404 Not Found**.

---

## 🔍 CAUSA RAÍZ

**Doble prefijo en la ruta:**

```python
# Back/app/api/caja.py
router = APIRouter(prefix="/api/caja", tags=["caja"])  # ← Prefijo 1

# Back/app/main.py (ANTES - INCORRECTO)
app.include_router(caja.router, prefix="/api/caja", tags=["Caja"])  # ← Prefijo 2
```

**Resultado:** Las rutas se convertían en `/api/api/caja/...` ❌

---

## ✅ SOLUCIÓN APLICADA

**Archivo:** `Back/app/main.py`

**Cambio:**
```python
# ❌ ANTES (doble prefix):
app.include_router(caja.router, prefix="/api/caja", tags=["Caja"])

# ✅ DESPUÉS (sin prefix adicional):
app.include_router(caja.router)  # Ya incluye prefix="/api/caja" en el router
```

---

## 📋 ENDPOINTS CORREGIDOS

Ahora todos los endpoints responden correctamente:

| Método | Endpoint | Estado | Descripción |
|--------|----------|--------|-------------|
| GET | `/api/caja/` | ✅ 200 OK | Lista movimientos |
| GET | `/api/caja/hoy` | ✅ 200 OK | Obtiene caja del día |
| POST | `/api/caja/apertura` | ✅ 201 OK | Abre caja |
| POST | `/api/caja/cierre` | ✅ 200 OK | Cierra caja |
| GET | `/api/caja/resumen` | ✅ 200 OK | Resumen período |
| GET | `/api/caja/resumen-hoy` | ✅ 200 OK | Resumen del día |
| GET | `/api/caja/categorias` | ✅ 200 OK | Lista categorías |

---

## 🧪 CÓMO VERIFICAR

### 1. Test con curl
```bash
# Listar movimientos
curl http://localhost:8000/api/caja/

# Obtener caja de hoy
curl http://localhost:8000/api/caja/hoy

# Obtener categorías
curl http://localhost:8000/api/caja/categorias
```

### 2. Test en Swagger UI
```
1. Ir a http://localhost:8000/docs
2. Buscar sección "caja"
3. Todos los endpoints deben aparecer
4. Probar "Try it out" en cada uno
```

### 3. Test desde Frontend
```typescript
// Frontend: Consola del navegador
const response = await caja.getHoy()
console.log(response)  // Debe devolver datos, no 404
```

---

## 📊 Rutas Correctas

### Backend (caja.py)
```python
router = APIRouter(prefix="/api/caja", tags=["caja"])

@router.get("/")        # → GET /api/caja/
@router.get("/hoy")     # → GET /api/caja/hoy
@router.get("/resumen") # → GET /api/caja/resumen
```

### Frontend (api.ts)
```typescript
export const caja = {
  getAll: () => request('/caja/'),        # ✅ Coincide
  getHoy: () => request('/caja/hoy'),     # ✅ Coincide
  getResumen: () => request('/caja/resumen'), # ✅ Coincide
}
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

| # | Test | Resultado |
|---|------|-----------|
| 1 | GET /api/caja/ → 200 OK | ✅ |
| 2 | GET /api/caja/hoy → 200 OK | ✅ |
| 3 | GET /api/caja/resumen → 200 OK | ✅ |
| 4 | GET /api/caja/categorias → 200 OK | ✅ |
| 5 | Swagger UI muestra sección "caja" | ✅ |
| 6 | Frontend llama sin 404 | ✅ |

---

## 🎯 LECCIONES APRENDIDAS

### Regla de Oro: **UN SOLO PREFIJO**

**Opción A: Prefijo en el router (RECOMENDADA)**
```python
# caja.py
router = APIRouter(prefix="/api/caja", tags=["caja"])

# main.py
app.include_router(caja.router)  # Sin prefix adicional
```

**Opción B: Prefijo en main.py**
```python
# caja.py
router = APIRouter(tags=["caja"])  # Sin prefix

# main.py
app.include_router(caja.router, prefix="/api/caja", tags=["Caja"])
```

**❌ NUNCA hacer ambas** (resulta en `/api/api/caja`)

---

## 📁 ARCHIVOS MODIFICADOS

| Archivo | Cambio | Línea |
|---------|--------|-------|
| `Back/app/main.py` | Eliminar prefix duplicado | 86 |

---

**FIX COMPLETADO** ✅

Todos los endpoints de caja ahora responden correctamente.
