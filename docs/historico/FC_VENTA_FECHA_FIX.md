# 🔧 FIX: Fecha Muestra Día Anterior en Panel de Facturación

## PROBLEMA
En el panel de facturación, las facturas muestran la fecha del día anterior en lugar de la fecha real de creación.

**Ejemplo:**
- Fecha real de creación: 05/03/2026
- Fecha mostrada en panel: 04/03/2026 (un día menos)

---

## CAUSA RAÍZ

### Problema de Zona Horaria (Timezone)

1. **Backend:** Guarda la fecha como `DATE` (sin hora) en formato `2026-03-05`
2. **API Response:** Devuelve `fecha: "2026-03-05"` (ISO 8601 sin timezone)
3. **Frontend:** `new Date("2026-03-05")` interpreta como `2026-03-05T00:00:00Z` (UTC)
4. **Conversión:** Al convertir a hora local (Argentina UTC-3), resta 3 horas
5. **Resultado:** `2026-03-04T21:00:00-03:00` → ¡Muestra 04/03/2026!

### Diagrama del Problema:

```
Backend (UTC)          JavaScript (UTC)        Frontend (UTC-3)
2026-03-05      →      2026-03-05T00:00:00Z   →   2026-03-04T21:00:00-03:00
   (fecha)              (interpreta como UTC)       (¡resta 3 horas!)
                                                    ↓
                                            Muestra: 04/03/2026 ❌
```

---

## SOLUCIÓN

### Frontend - `Front/src/utils/format.ts`

Se modificó `formatDate()` para detectar fechas ISO sin hora (`YYYY-MM-DD`) y formatearlas directamente sin conversión de zona horaria.

**Antes:**
```typescript
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  const d = new Date(date)  // ❌ Convierte a UTC, pierde un día
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
```

**Después:**
```typescript
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'

  // ✅ FIX: Si es string ISO sin hora (ej: "2026-03-05"), usar directamente
  // para evitar problema de zona horaria que muestra día anterior
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`  // ✅ 05/03/2026
  }

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
```

---

## EXPLICACIÓN TÉCNICA

### ¿Por Qué Funciona?

| Formato de Fecha | JavaScript `new Date()` | Resultado |
|-----------------|------------------------|-----------|
| `"2026-03-05"` | Interpreta como UTC | ❌ `2026-03-04T21:00:00-03:00` |
| `"2026-03-05T00:00:00"` | Interpreta como local | ✅ `2026-03-05T00:00:00-03:00` |
| `"2026-03-05T00:00:00Z"` | Interpreta como UTC | ❌ `2026-03-04T21:00:00-03:00` |
| `"2026-03-05"` (parseado manual) | Sin conversión | ✅ `05/03/2026` |

### Regex Utilizado

```regex
/^\d{4}-\d{2}-\d{2}$/
```

- `^` - Inicio de string
- `\d{4}` - 4 dígitos (año)
- `-` - Guión
- `\d{2}` - 2 dígitos (mes)
- `-` - Guión
- `\d{2}` - 2 dígitos (día)
- `$` - Fin de string

**Ejemplos que matchean:**
- ✅ `"2026-03-05"`
- ✅ `"2024-12-31"`

**Ejemplos que NO matchean:**
- ❌ `"2026-03-05T10:30:00"` (tiene hora)
- ❌ `"2026-03-05T00:00:00Z"` (tiene hora y timezone)
- ❌ `"05/03/2026"` (otro formato)

---

## TESTING

### 1. Fecha de Factura Nueva
- [x] Crear factura hoy (05/03/2026)
- [x] Ir a FC Ventas → Lista
- [x] Verificar columna "Fecha"
- [x] ¿Muestra `05/03/2026` (hoy)? ✅

### 2. Fechas de Facturas Anteriores
- [x] Verificar facturas de días anteriores
- [x] ¿Las fechas coinciden con las reales? ✅

### 3. Fechas con Otros Formatos
- [x] Verificar que fechas con hora funcionan correctamente
- [x] `formatDateTime()` sigue funcionando ✅

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Front/src/utils/format.ts` | - `formatDate()` detecta fechas ISO `YYYY-MM-DD`<br>- Formatea directamente sin conversión de timezone |

---

## NOTAS ADICIONALES

### ¿Por Qué No Cambiar el Backend?

**Opción 1:** Cambiar `fecha.isoformat()` a `fecha.strftime("%Y-%m-%dT00:00:00")`
- ❌ Requiere cambiar todos los endpoints
- ❌ Puede afectar otros consumos de API
- ❌ Más invasivo

**Opción 2:** Cambiar tipo de columna de `Date` a `DateTime`
- ❌ Requiere migración de base de datos
- ❌ Cambia semántica del campo (fecha vs timestamp)
- ❌ Más complejo

**Opción 3:** Fix en el frontend (elegida)
- ✅ Mínimo impacto
- ✅ Fácil de testear
- ✅ No afecta backend ni BD
- ✅ Solución localizada

### Otros Lugares Afectados

Este fix también corrige fechas en:
- ✅ FC Compras
- ✅ Notas de Crédito
- ✅ Recibos
- ✅ Cualquier otro módulo que use `formatDate()`

### Formatos de Fecha Soportados

| Formato | Ejemplo | Resultado |
|---------|---------|-----------|
| ISO Date | `"2026-03-05"` | ✅ `05/03/2026` |
| ISO DateTime | `"2026-03-05T10:30:00"` | ✅ `05/03/2026, 10:30` |
| Date Object | `new Date()` | ✅ `05/03/2026` |
| Null/Undefined | `null` | ✅ `-` |
| Inválido | `"abc"` | ✅ `-` |

---

## ✅ CONCLUSIÓN

El problema de fecha que mostraba un día menos fue resuelto exitosamente:

1. ✅ **Fecha mostrada es correcta** (05/03/2026 en vez de 04/03/2026)
2. ✅ **Sin cambios en backend** (solo frontend)
3. ✅ **Sin cambios en base de datos** (mantiene tipo `DATE`)
4. ✅ **Sin afectar otras funcionalidades** (formatDateTime, etc.)
