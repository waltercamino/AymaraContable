# 🔧 FIX: WhatsApp/Email Icons + PDF Filename

## PROBLEMAS RESUELTOS

### 1. Iconos de WhatsApp y Email Desaparecieron
**Problema:** Los botones de enviar por WhatsApp y Email solo aparecían para facturas con medio de pago `cta_cte`.

**Causa:** Condición demasiado restrictiva en el frontend.

**Solución:** Se modificó la condición para mostrar los botones para **todas las facturas emitidas**.

### 2. Nombre de Archivo PDF Incorrecto
**Problema:** Al descargar el PDF, el nombre del archivo usaba el formato `punto_venta-numero_factura` (ej: `1-00000072`) en lugar del número de comprobante real (ej: `FV-0077`).

**Causa:** El backend estaba usando `factura.punto_venta` y `factura.numero_factura` por separado en lugar de `factura.numero_interno`.

**Solución:** Se actualizó el backend para usar `factura.numero_interno` que contiene el formato correcto (ej: `FV-0077`).

### 3. Número Interno Usaba ID de BD en Vez de Número de Factura
**Problema:** El campo `numero_interno` se generaba usando el ID de la base de datos (ej: `FV-0079`) en lugar del número de factura real (ej: `FV-0042`).

**Causa:** En la creación de facturas, se usaba `ultimo_id.id + 1` para generar el `numero_interno`.

**Solución:** Se cambió para usar `nuevo_numero_factura` que es el número consecutivo real de la factura.

---

## CAMBIOS REALIZADOS

### Backend - `Back/app/api/fcventa.py`

#### 1. Creación de Facturas (`crear_fc_venta`)

**Antes:**
```python
# Generar numero_interno automático (FV-0001 / NC-0001, etc.)
ultimo_id = db.query(Factura).order_by(Factura.id.desc()).first()
numero_interno = f"{'NC' if es_nota_credito else 'FV'}-{(ultimo_id.id + 1) if ultimo_id else 1:04d}"
```

**Después:**
```python
# ✅ Generar numero_interno basado en numero_factura (NO en el ID de la BD)
# Ej: Si numero_factura = 42, entonces numero_interno = FV-0042
numero_interno = f"{'NC' if es_nota_credito else 'FV'}-{nuevo_numero_factura:04d}"
```

#### 2. Fallback en Responses

**Antes:**
```python
"numero_interno": factura.numero_interno or f"FV-{factura.id:04d}"
```

**Después:**
```python
"numero_interno": factura.numero_interno or f"FV-{factura.numero_factura:04d}"
```

#### 3. Endpoint PDF (`generar_fc_venta_pdf`)

**Antes:**
```python
numero_factura_completo = f"{factura.punto_venta}-{factura.numero_factura:08d}"
nombre_archivo = f"{tipo_archivo}_{numero_factura_completo}_{nombre_cliente}_{fecha_str}.pdf"
```

**Después:**
```python
# ✅ Usar numero_interno (ej: FV-0077) en vez de punto_venta-numero_factura
numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:08d}"
nombre_archivo = f"{tipo_archivo}_{numero_comprobante}_{nombre_cliente}_{fecha_str}.pdf"
```

#### 4. Helper Function (`generar_nombre_archivo`)

**Antes:**
```python
numero_comprobante = f"{factura.punto_venta:04d}-{factura.numero_factura:08d}"
return f"{tipo_archivo}_Venta_FV-{numero_comprobante}_{cliente_nombre_sanitizado}_{fecha_str}.pdf"
```

**Después:**
```python
# ✅ Usar numero_interno (ej: FV-0077) en vez de punto_venta-numero_factura
numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:08d}"
return f"{tipo_archivo}_Venta_{numero_comprobante}_{cliente_nombre_sanitizado}_{fecha_str}.pdf"
```

---

### Frontend - `Front/src/pages/FCVenta.tsx`

#### WhatsApp/Email Buttons

**Antes:**
```tsx
{/* 📱 WhatsApp - solo para cta_cte */}
{venta.estado === 'emitida' && venta.medio_pago === 'cta_cte' && (
  <button>WhatsApp</button>
)}
```

**Después:**
```tsx
{/* 📱 WhatsApp - para todas las facturas emitidas */}
{venta.estado === 'emitida' && (
  <button>WhatsApp</button>
)}
```

---

## RESULTADO

### Números de Comprobante

| Contexto | Antes | Después |
|----------|-------|---------|
| **Creación (numero_interno)** | `FV-0079` (usa ID de BD) | `FV-0042` (usa numero_factura) |
| **PDF Filename** | `FC_1-00000042_Juan_Perez.pdf` | `FC_FV-0042_Juan_Perez.pdf` |
| **Fallback (old records)** | `FV-{id:04d}` | `FV-{numero_factura:04d}` |

### Iconos de Envío

| Medio de Pago | Antes | Después |
|---------------|-------|---------|
| `cta_cte` | ✅ Muestra WhatsApp/Email | ✅ Muestra WhatsApp/Email |
| `efectivo` | ❌ No muestra | ✅ Muestra WhatsApp/Email |
| `transferencia` | ❌ No muestra | ✅ Muestra WhatsApp/Email |
| `cheque` | ❌ No muestra | ✅ Muestra WhatsApp/Email |

---

## TESTING

### 1. Iconos de WhatsApp y Email
- [x] Ir a FC Ventas → Lista de facturas
- [x] Verificar que todas las facturas con estado `emitida` muestran:
  - 📱 Botón "WhatsApp"
  - ✉️ Botón "Email"
  - 📄 Botón "Imprimir"
- [x] Probar click en WhatsApp → ¿Descarga PDF y abre WhatsApp? ✅
- [x] Probar click en Email → ¿Descarga PDF y abre app de correo? ✅

### 2. Número de Comprobante (numero_interno)
- [x] Crear nueva factura de venta
- [x] Verificar en la respuesta de la API:
  - ✅ `numero_interno` es `FV-0042` (usa numero_factura)
  - ✅ NO es `FV-0079` (usa ID de BD)

### 3. Nombre de Archivo PDF
- [x] Crear nueva factura de venta
- [x] Click en "Imprimir"
- [x] Verificar nombre del archivo:
  - ✅ Usa formato: `FC_FV-0042_NombreCliente_YYYYMMDD.pdf`
  - ✅ NO usa formato: `FC_1-00000042_NombreCliente_YYYYMMDD.pdf`
  - ✅ NO usa formato: `FC_FV-0079_NombreCliente_YYYYMMDD.pdf` (ID de BD)

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Front/src/pages/FCVenta.tsx` | - WhatsApp/Email ahora muestran para todas las facturas emitidas |
| `Back/app/api/fcventa.py` | - Creación de facturas: `numero_interno` usa `numero_factura` en vez de ID de BD<br>- Fallback en responses usa `numero_factura` en vez de ID de BD<br>- PDF filename usa `numero_interno`<br>- Helper `generar_nombre_archivo()` actualizado |

---

## NOTAS ADICIONALES

### ¿Por Qué `numero_factura` en Vez de ID de BD?

El campo `numero_factura` es el número consecutivo **real** de la factura:
- Es independiente del ID de la base de datos
- Sigue la numeración fiscal correlativa
- Es el número que se imprime en la factura
- Es consistente con los requisitos de AFIP/SAT/DIAN

El ID de la base de datos es solo un identificador técnico interno, pero no representa la numeración fiscal.

### Relación Entre Campos

| Campo | Propósito | Ejemplo |
|-------|-----------|---------|
| `id` | ID interno de la BD | `79` |
| `numero_factura` | Número consecutivo fiscal | `42` |
| `numero_interno` | Formato legible (FV + numero_factura) | `FV-0042` |
| `punto_venta` | Punto de venta fiscal | `1` |
| Número completo | Formato fiscal completo | `0001-00000042` |

### Backup de Facturas

El nombre del archivo ahora incluye:
1. **Tipo de comprobante:** `FC` o `NC`
2. **Número interno:** `FV-0042` (consecutivo real)
3. **Nombre del cliente:** `Juan_Perez`
4. **Fecha de descarga:** `20260305`

Ejemplo completo: `FC_FV-0042_Juan_Perez_20260305.pdf`

Esto facilita:
- ✅ Búsqueda de facturas específicas
- ✅ Organización por fecha
- ✅ Identificación rápida del cliente
- ✅ Evita nombres duplicados
- ✅ Coherencia con la numeración fiscal

---

## ✅ CONCLUSIÓN

Los tres problemas fueron resueltos exitosamente:
1. ✅ **Iconos de WhatsApp/Email** ahora visibles para todas las facturas emitidas
2. ✅ **Nombre de archivo PDF** usa el número de comprobante correcto (FV-0042)
3. ✅ **numero_interno** se genera usando `numero_factura` en vez del ID de la BD
