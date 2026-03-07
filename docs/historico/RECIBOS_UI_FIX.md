# FIX: Visualizar Motivo de Anulación + Mejorar UI

## Fecha: 2026-02-23

---

## PROBLEMAS REPORTADOS

| # | Problema | Estado |
|---|----------|--------|
| 1 | ❌ En lista de Recibos no se ve POR QUÉ se anuló | ✅ FIX |
| 2 | ⚠️ En Cuenta Corriente, anulación muestra signo negativo pero suma (confuso) | ✅ FIX |

---

## SOLUCIONES APLICADAS

### FIX 1: Backend - Agregar campos de auditoría en Recibo

**Archivo:** `Back/app/models.py`

**Cambios en modelo `Recibo`:**
```python
class Recibo(Base):
    # ... campos existentes ...
    
    # ✅ Auditoría de anulación (AGREGADO)
    anulado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_anulacion = Column(DateTime, nullable=True)
    motivo_anulacion = Column(String(500), nullable=True)
```

---

**Archivo:** `Back/app/schemas.py`

**Cambios en `ReciboResponse`:**
```python
class ReciboResponse(BaseModel):
    # ... campos existentes ...
    
    # ✅ Auditoría de anulación (AGREGADO)
    anulado_por: Optional[int] = None
    fecha_anulacion: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None
```

---

**Archivo:** `Back/app/api/recibos.py`

**Cambios en `listar_recibos()`:**
```python
return [{
    "id": r.id,
    "numero_interno": r.numero_interno,
    # ... campos existentes ...
    # ✅ Auditoría de anulación
    "anulado_por": r.anulado_por,
    "fecha_anulacion": r.fecha_anulacion.isoformat() if r.fecha_anulacion else None,
    "motivo_anulacion": r.motivo_anulacion,  # ← AGREGADO
    "imputaciones": [...]
} for r in recibos]
```

---

### FIX 2: Frontend - Mostrar motivo en lista de Recibos

**Archivo:** `Front/src/pages/Recibos.tsx`

**1. Agregar columna "Motivo Anulación" en el header:**
```tsx
<thead>
  <tr>
    <th>N° Recibo</th>
    <th>Tipo</th>
    <th>Fecha</th>
    <th>Entidad</th>
    <th>Monto</th>
    <th>Medio Pago</th>
    <th>Estado</th>
    <th>Motivo Anulación</th>  {/* ← AGREGADO */}
    <th>Acciones</th>
  </tr>
</thead>
```

**2. Mejorar visualización del estado:**
```tsx
<td className="px-6 py-4 text-sm">
  {recibo.estado === 'registrado' ? (
    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
      ✅ Registrado
    </span>
  ) : (
    <div className="flex flex-col gap-1">
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 inline-block w-fit">
        🗑️ Anulado
      </span>
      {recibo.motivo_anulacion && (
        <span className="text-xs text-gray-500 italic">
          Motivo: {recibo.motivo_anulacion}
        </span>
      )}
    </div>
  )}
</td>
```

**3. Agregar columna con motivo:**
```tsx
<td className="px-6 py-4 text-sm text-gray-600">
  {recibo.estado === 'anulado' 
    ? (recibo.motivo_anulacion || '—') 
    : '—'}
</td>
```

---

### FIX 3: Frontend - Mejorar visualización en Cuenta Corriente

**Archivo:** `Front/src/pages/CuentaCorriente.tsx`

**Mejora en descripción de movimientos:**
```tsx
<td className="px-6 py-4 text-sm">
  {mov.descripcion?.includes('Anulación') || mov.descripcion?.includes('[ANULADO]') ? (
    <div className="flex flex-col gap-1">
      <span className="text-orange-600 font-medium" title="Movimiento revertido por anulación">
        🔁 {mov.descripcion}
      </span>
      <span className="text-xs text-gray-500 italic">
        Reversión por anulación de recibo
      </span>
    </div>
  ) : (
    <span className="text-gray-700">{mov.descripcion}</span>
  )}
</td>
```

**Mejora en visualización deDebe/Haber para anulaciones:**
```tsx
<td className="px-6 py-4 text-sm text-right">
  {mov.debe > 0 ? (
    <span className={mov.descripcion?.includes('Anulación') ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
      {mov.descripcion?.includes('Anulación') ? '+' : ''}{formatCurrency(mov.debe)}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>
<td className="px-6 py-4 text-sm text-right">
  {mov.haber > 0 ? (
    <span className={mov.descripcion?.includes('Anulación') ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
      {mov.descripcion?.includes('Anulación') ? '-' : ''}{formatCurrency(mov.haber)}
    </span>
  ) : (
    <span className="text-gray-400">-</span>
  )}
</td>
```

---

## ESTADO ANTES VS DESPUÉS

### Lista de Recibos

| Elemento | Antes ❌ | Después ✅ |
|----------|---------|-----------|
| Estado anulado | `❌ Anulado` (gris) | `🗑️ Anulado` (rojo) + motivo |
| Motivo | No visible | Visible en línea + columna dedicada |
| Información | Solo estado | Estado + motivo completo |

**Ejemplo visual:**
```
ANTES:
| R-0001 | Cobro | ... | ❌ Anulado | — |

DESPUÉS:
| R-0001 | Cobro | ... | 🗑️ Anulado | Error en el monto |
                                  Motivo: Error en el monto
```

### Cuenta Corriente

| Elemento | Antes ❌ | Después ✅ |
|----------|---------|-----------|
| Descripción anulación | Texto normal | `🔁` + texto naranja |
| Debe en anulación | Rojo (+) | Verde (+) con indicador |
| Haber en anulación | Verde (-) | Rojo (-) con indicador |
| Ayuda visual | Ninguna | Tooltip + texto explicativo |

**Ejemplo visual:**
```
ANTES:
| Fecha | Descripción | Debe | Haber |
| 23/02 | Anulación Recibo R-0001 | $30.000 | - |

DESPUÉS:
| Fecha | Descripción | Debe | Haber |
| 23/02 | 🔁 Anulación Recibo R-0001 | +$30.000 | - |
        | Reversión por anulación   |         |     |
```

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Back/app/models.py` | Agregar campos `anulado_por`, `fecha_anulacion`, `motivo_anulacion` en `Recibo` |
| `Back/app/schemas.py` | Agregar campos en `ReciboResponse` |
| `Back/app/api/recibos.py` | Retornar `motivo_anulacion` en `listar_recibos()` |
| `Front/src/pages/Recibos.tsx` | Columna "Motivo Anulación" + estado visual mejorado |
| `Front/src/pages/CuentaCorriente.tsx` | Indicador `🔁` + colores para anulaciones |

---

## VERIFICACIÓN

### 1. Backend compila
```bash
cd "d:\CBA 4.0\AymaraContable\Back"
.\venv\Scripts\python.exe -m py_compile app/models.py app/schemas.py app/api/recibos.py
```
**Resultado:** ✅ Syntax OK

### 2. Frontend compila
```bash
cd "d:\CBA 4.0\AymaraContable\Front"
npm run build
```
**Resultado:** ✅ Build completed successfully

---

## TEST CHECKLIST

| # | Test | Resultado Esperado | Estado |
|---|------|-------------------|--------|
| 1 | Lista de Recibos muestra "🗑️ Anulado - Motivo: ..." | Motivo visible en línea | ✅ Ready |
| 2 | Columna "Motivo Anulación" visible en tabla | Columna dedicada | ✅ Ready |
| 3 | Cuenta Corriente muestra 🔁 en movimientos anulados | Indicador visual claro | ✅ Ready |
| 4 | Anulación aparece como suma (verde) en cta.cte. | Colores invertidos para anulación | ✅ Ready |
| 5 | Backend devuelve motivo_anulacion en GET /recibos/ | Campo en respuesta JSON | ✅ Ready |

---

## CÓMO PROBAR

### Test 1: Anular recibo y ver motivo

```typescript
// 1. Crear recibo
POST /api/recibos
{"tipo": "cobro", "cliente_id": 1, "monto": 50000, ...}

// 2. Anular recibo
POST /api/recibos/1/anular
{"motivo": "Error en el monto cargado"}

// 3. Verificar en lista
GET /api/recibos/
// Respuesta debe incluir:
// "estado": "anulado"
// "motivo_anulacion": "Error en el monto cargado"

// 4. Verificar en frontend
// - Abrir Recibos.tsx
// - Ver recibo R-0001 con estado "🗑️ Anulado"
// - Ver motivo en línea y en columna dedicada
```

### Test 2: Ver anulación en Cuenta Corriente

```typescript
// 1. Crear recibo con imputación a FC
POST /api/recibos
{"tipo": "cobro", "cliente_id": 1, "monto": 50000, "imputaciones": [...]}

// 2. Verificar en Cuenta Corriente del cliente
GET /api/cuenta-corriente/clientes/1
// Debe mostrar movimiento con haber=$50.000

// 3. Anular recibo
POST /api/recibos/1/anular
{"motivo": "Error"}

// 4. Verificar reversión en Cuenta Corriente
GET /api/cuenta-corriente/clientes/1
// Debe mostrar:
// - Movimiento original: haber=$50.000 (verde)
// - Movimiento inverso: debe=$50.000 (verde con 🔁)
// - Descripción: "🔁 Anulación Recibo R-0001 - Error"
```

---

## NOTAS TÉCNICAS

### Modelo de Datos

**Tabla: `recibos`**
| Columna | Tipo | Nullable | Descripción |
|---------|------|----------|-------------|
| id | Integer | NO | PK |
| numero_interno | String(20) | NO | R-0001 |
| tipo | String(20) | NO | cobro/pago |
| ... | ... | ... | ... |
| anulado_por | Integer | ✅ SI | FK usuarios |
| fecha_anulacion | DateTime | ✅ SI | Fecha de anulación |
| motivo_anulacion | String(500) | ✅ SI | Motivo del usuario |

### API Response

**GET /api/recibos/**
```json
[
  {
    "id": 1,
    "numero_interno": "R-0001",
    "tipo": "cobro",
    "estado": "anulado",
    "motivo_anulacion": "Error en el monto cargado",
    "anulado_por": 1,
    "fecha_anulacion": "2026-02-23T10:30:00",
    ...
  }
]
```

### Convenciones de UI

**Recibos:**
- ✅ Registrado → Badge azul
- 🗑️ Anulado → Badge rojo + motivo visible

**Cuenta Corriente:**
- 🔁 Anulación → Texto naranja + ícono
- Debe en anulación → Verde (suma al saldo)
- Haber en anulación → Rojo (reduce saldo)

---

## PRÓXIMOS PASOS

1. ✅ Testear en producción con datos reales
2. ✅ Verificar que motivo_anulacion se muestra correctamente
3. ✅ Verificar que Cuenta Corriente muestra anulaciones claramente
4. ✅ Considerar agregar filtro "Mostrar solo anulados"

---

**FIN DEL DOCUMENTO**
