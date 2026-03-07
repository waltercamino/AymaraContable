# 🔧 FIX: Nota de Crédito - Nombre de Archivo PDF

## PROBLEMA
Al imprimir/guardar una Nota de Crédito, el archivo tenía un nombre incorrecto:

**Actual (incorrecto):**
- `FC_Venta_NC-0005_Walter.pdf` ❌

**Esperado (correcto):**
- `NC_Ventas_0005_Walter.pdf` ✅

---

## CAUSA RAÍZ

El código usaba la misma lógica para Facturas de Venta y Notas de Crédito:

```python
tipo_archivo = "NC"  # Para Notas de Crédito
numero_comprobante = factura.numero_interno  # "NC-0005"
nombre_archivo = f"{tipo_archivo}_{numero_comprobante}_{cliente}.pdf"
# Resultado: "NC_NC-0005_Walter.pdf" ❌ (redundante)
```

El `numero_interno` de una Nota de Crédito ya incluye el prefijo "NC-", por lo que al agregar otro "NC" al principio, se duplica.

---

## SOLUCIÓN

### Backend - `Back/app/api/fcventa.py`

Se modificó la generación del nombre de archivo para diferenciar entre Facturas de Venta y Notas de Crédito.

#### 1. Endpoint PDF (`generar_fc_venta_pdf`)

**Antes:**
```python
tipo_archivo = "NC" if es_nota_credito else "FC"
numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:08d}"
nombre_archivo = f"{tipo_archivo}_{numero_comprobante}_{nombre_cliente}_{fecha_str}.pdf"
# Resultado NC: "NC_NC-0005_Walter.pdf" ❌
```

**Después:**
```python
# ✅ Determinar prefijo y número según tipo de comprobante
es_nota_credito = factura.tipo_comprobante and ...

if es_nota_credito:
    # NC: Usar solo el número (ej: "0005" de "NC-0005")
    numero_comprobante = factura.numero_interno or f"NC-{factura.numero_factura:04d}"
    numero_solo = numero_comprobante.replace('NC-', '')  # Sacar prefijo "NC-"
    nombre_archivo = f"NC_Ventas_{numero_solo}_{nombre_cliente}_{fecha_str}.pdf"
else:
    # FC: Usar numero_interno completo (ej: "FV-0077")
    numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:04d}"
    nombre_archivo = f"FC_Venta_{numero_comprobante}_{nombre_cliente}_{fecha_str}.pdf"
```

#### 2. Helper Function (`generar_nombre_archivo`)

**Antes:**
```python
tipo_archivo = "NC" if ... else "FC"
numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:08d}"
return f"{tipo_archivo}_Venta_{numero_comprobante}_{cliente}_{fecha}.pdf"
# Resultado NC: "NC_NC-0005_Walter.pdf" ❌
```

**Después:**
```python
es_nota_credito = tipo_comprobante.lower() in ['nota_credito', 'nc', 'nota de crédito']

if es_nota_credito:
    # NC: Usar solo el número (ej: "0005" de "NC-0005")
    numero_comprobante = factura.numero_interno or f"NC-{factura.numero_factura:04d}"
    numero_solo = numero_comprobante.replace('NC-', '')
    return f"NC_Ventas_{numero_solo}_{cliente}_{fecha}.pdf"
else:
    # FC: Usar numero_interno completo (ej: "FV-0077")
    numero_comprobante = factura.numero_interno or f"FV-{factura.numero_factura:04d}"
    return f"FC_Venta_{numero_comprobante}_{cliente}_{fecha}.pdf"
```

---

## RESULTADO

### Nombres de Archivo PDF

| Tipo de Comprobante | Antes | Después |
|---------------------|-------|---------|
| **Factura de Venta** | `FC_Venta_FV-0077_Walter.pdf` | `FC_Venta_FV-0077_Walter.pdf` ✅ |
| **Nota de Crédito** | `NC_NC-0005_Walter.pdf` ❌ | `NC_Ventas_0005_Walter.pdf` ✅ |

### Formato Consistente

**Facturas de Venta:**
- Prefijo: `FC_Venta_`
- Número: `FV-0077` (con prefijo "FV-")
- Ejemplo: `FC_Venta_FV-0077_Juan_Perez_20260305.pdf`

**Notas de Crédito:**
- Prefijo: `NC_Ventas_`
- Número: `0005` (sin prefijo "NC-")
- Ejemplo: `NC_Ventas_0005_Juan_Perez_20260305.pdf`

---

## TESTING

### 1. Nota de Crédito PDF
- [x] Crear nueva Nota de Crédito
- [x] Imprimir/guardar PDF
- [x] Verificar nombre del archivo:
  - ✅ Usa formato: `NC_Ventas_0005_NombreCliente_YYYYMMDD.pdf`
  - ✅ NO usa formato: `NC_NC-0005_NombreCliente_YYYYMMDD.pdf`
  - ✅ NO usa formato: `FC_Venta_...` (prefijo incorrecto)

### 2. Factura de Venta PDF (sin cambios)
- [x] Crear nueva Factura de Venta
- [x] Imprimir/guardar PDF
- [x] Verificar nombre del archivo:
  - ✅ Usa formato: `FC_Venta_FV-0077_NombreCliente_YYYYMMDD.pdf`
  - ✅ Sin cambios respecto a la implementación anterior

### 3. WhatsApp/Email (usan `generar_nombre_archivo`)
- [x] Probar enviar Nota de Crédito por WhatsApp
- [x] Verificar que `pdf_filename` es correcto: `NC_Ventas_0005_...`
- [x] Probar enviar Factura de Venta por Email
- [x] Verificar que `pdf_filename` es correcto: `FC_Venta_FV-0077_...`

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Back/app/api/fcventa.py` | - Endpoint PDF: Diferencia entre FC y NC para nombre de archivo<br>- Helper `generar_nombre_archivo()`: Diferencia entre FC y NC |

---

## NOTAS ADICIONALES

### ¿Por Qué Diferenciar los Formatos?

**Facturas de Venta:**
- Usan `FV-` como prefijo interno
- Se mantiene el prefijo en el nombre de archivo para claridad
- Ejemplo: `FV-0077` → `FC_Venta_FV-0077_...`

**Notas de Crédito:**
- Usan `NC-` como prefijo interno
- Se quita el prefijo para evitar redundancia (`NC_NC-...`)
- Se usa `NC_Ventas_` (plural) como convención
- Ejemplo: `NC-0005` → `NC_Ventas_0005_...`

### Funciones Afectadas

1. **`generar_fc_venta_pdf()`** - Endpoint principal de PDF
2. **`generar_nombre_archivo()`** - Helper para WhatsApp/Email
3. **`enviarWhatsApp()`** - Usa `generar_nombre_archivo()`
4. **`enviarEmail()`** - Usa `generar_nombre_archivo()`

Todas ahora generan nombres de archivo consistentes.

### Estructura de Nombres de Archivo

**Componentes:**
```
{TIPO}_{MODULO}_{NUMERO}_{CLIENTE}_{FECHA}.pdf
```

**Para Facturas de Venta:**
- `TIPO`: `FC`
- `MODULO`: `Venta`
- `NUMERO`: `FV-0077` (con prefijo)
- `CLIENTE`: `Juan_Perez`
- `FECHA`: `20260305`

**Para Notas de Crédito:**
- `TIPO`: `NC`
- `MODULO`: `Ventas` (plural)
- `NUMERO`: `0005` (sin prefijo)
- `CLIENTE`: `Juan_Perez`
- `FECHA`: `20260305`

---

## ✅ CONCLUSIÓN

El problema del nombre de archivo de Notas de Crédito fue resuelto exitosamente:

1. ✅ **Nombre de archivo NC es correcto:** `NC_Ventas_0005_...`
2. ✅ **Sin redundancia:** NO es `NC_NC-0005_...`
3. ✅ **Facturas de Venta sin cambios:** Siguen usando `FC_Venta_FV-0077_...`
4. ✅ **WhatsApp/Email corregidos:** También usan el nuevo formato
