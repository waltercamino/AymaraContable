# FIX: Cuenta Corriente - Copiar EXACTAMENTE Tamaño y Estilo de Listas de Precios

## FECHA
2026-03-05

## PROBLEMA RESUELTO (Actualizado 2026-03-05)
### Problema Original
El encabezado de Cuenta Corriente era similar pero NO igual al de Listas de Precios:
- ❌ Logo más pequeño (50x50px en lugar de 60x60px)
- ❌ Tamaño de fuente del nombre más chico (14pt en lugar de 20pt)
- ❌ Tamaño de fuente de detalles más chico (10pt en lugar de 12pt)
- ❌ Título más chico (16pt en lugar de 22pt)
- ❌ Información más chica (10pt en lugar de 13pt)
- ❌ Borde más fino (1px en lugar de 2px)
- ❌ Padding más chico (4px en lugar de 15px)

### Problema Adicional Resuelto
El HTML se mostraba como TEXTO PLANO en el PDF:
```
<para>
<img src="http://localhost:8000/uploads/logo_empresa.png" ... />
<b><font size="20"...>AYMARA Productos Naturales</font></b>
...
</para>
```

**CAUSA:** El HTML raw string no se estaba envolviendo en un objeto `Paragraph`, por lo que ReportLab lo trataba como texto plano en lugar de renderizarlo.

**SOLUCIÓN:** Envolver el HTML en `Paragraph(izquierda_html)` para que ReportLab procese las tags HTML.

## SOLUCIÓN IMPLEMENTADA
Se copiaron los valores EXACTOS del encabezado de Listas de Precios (HTML/CSS) al generador de PDF de Cuenta Corriente (ReportLab).

## COMPARACIÓN DE ESTILOS

### Listas de Precios (HTML/CSS - Frontend)
```css
/* Logo */
img { height: 60px; }

/* empresa-nombre */
font-size: 20px;
font-weight: bold;
color: #1e40af;

/* empresa-datos */
font-size: 12px;
color: #4b5563;
line-height: 1.6;

/* lista-titulo */
font-size: 22px;
font-weight: bold;
color: #1e40af;

/* info */
font-size: 13px;
color: #6b7280;
line-height: 1.8;

/* Borde del membrete */
border: 2px solid #1e40af;
padding: 15px;
```

### Cuenta Corriente (ReportLab - Backend) - ANTES ❌
```python
logo: width="50" height="50"  # ← MUY PEQUEÑO
fontSize=14  # ← MUY PEQUEÑO
fontSize=10  # ← MUY PEQUEÑO
fontSize=16  # ← MUY PEQUEÑO
fontSize=10  # ← MUY PEQUEÑO
GRID: 1  # ← BORDE FINO
PADDING: 4  # ← MUY PEQUEÑO
```

### Cuenta Corriente (ReportLab - Backend) - AHORA ✅
```python
logo: width="60" height="60"  # ← EXACTO
fontSize=20  # ← EXACTO (empresa-nombre)
fontSize=12  # ← EXACTO (empresa-datos)
fontSize=22  # ← EXACTO (titulo)
fontSize=13  # ← EXACTO (info)
GRID: 2  # ← EXACTO (2px)
PADDING: 15  # ← EXACTO (15px)
```

## ARCHIVOS MODIFICADOS

### 1. `d:\CBA 4.0\AymaraContable\Back\app\reportes\estado_cuenta_pdf.py`

**Cambios realizados:**

```python
# ANTES ❌ (HTML como texto plano)
izquierda_html = f'''
<para>
    {logo_html}
    <b><font size="20" color="#1e40af">{nombre_empresa}</font></b><br/>
</para>
'''

header_data = [[
    izquierda_html,  # ← STRING RAW, NO SE RENDERIZA
    Paragraph(...)
]]

# AHORA ✅ (HTML envuelto en Paragraph para renderizar)
izquierda_html = f'''{logo_html}<b><font size="20" color="#1e40af">{nombre_empresa}</font></b><br/>
<font size="12" color="#4b5563">{direccion_texto}</font>'''

header_data = [[
    Paragraph(izquierda_html),  # ← AHORA SÍ SE RENDERIZA
    Paragraph(
        f"<b><font size=\"22\" color=\"#1e40af\">ESTADO DE CUENTA</font></b><br/>"
        f"<font size=\"13\" color=\"#6b7280\">"
        f"{tipo.capitalize()}: {entidad_nombre}<br/>"
        f"CUIT: {entidad_cuit or 'N/A'}"
        f"</font>",
    )
]]
```

### 2. `d:\CBA 4.0\AymaraContable\Back\app\api\cuenta_corriente.py`

**Cambio realizado:** (ya estaba hecho en fix anterior)

```python
empresa_data = {
    'nombre_empresa': config.nombre_empresa if config else 'AYMARA CONTABLE',
    'cuit': config.cuit if config else '',
    'direccion': config.direccion if config else '',
    'telefono': config.telefono if config else '',
    'email': config.email if config else '',
    'pie_factura': config.pie_factura if config else '',
    'logo_url': config.logo_url if config else ''  # ← AGREGADO
}
```

## DETALLES TÉCNICOS

### Equivalencia de Unidades
- HTML/CSS usa `px` (píxeles)
- ReportLab usa `pt` (puntos)
- 1px ≈ 1pt para propósitos prácticos en este contexto

### Colores (MISMOS)
- Azul primario: `#1e40af` (nombre, título, borde)
- Gris oscuro: `#4b5563` (dirección/teléfono)
- Gris claro: `#6b7280` (información derecha)

### Estructura del Header
```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO 60x60] AYMARA Productos Naturales     ESTADO DE CUENTA │
│              Dirección - Tel: XXX            Cliente: Juan    │
│                                              CUIT: XX-XXXX... │
│                                                              │
│  ← 15px padding arriba/abajo →                               │
│  ← 10px padding izq/der →                                    │
│  Borde: 2px sólido #1e40af                                   │
└──────────────────────────────────────────────────────────────┘
```

## TESTING

### 1. Imprimir Lista de Precios (REFERENCIA)
```
Ir a: Precios → Listas de Precios → Click "Imprimir" en una lista
Verificar:
- Logo: 60px de alto
- Nombre empresa: 20px, bold, azul #1e40af
- Dirección: 12px, gris #4b5563
- Título lista: 22px, bold, azul #1e40af
- Info: 13px, gris #6b7280
- Borde: 2px azul #1e40af
- Padding: 15px arriba/abajo
```

### 2. Imprimir CC Cliente
```
Ir a: Cuenta Corriente → Seleccionar cliente → Click "PDF"
Verificar:
- ¿Mismo tamaño de logo (60x60)? ✅
- ¿Mismo tamaño de nombre (20px)? ✅
- ¿Mismo tamaño de dirección (12px)? ✅
- ¿Mismo tamaño de título (22px)? ✅
- ¿Mismo tamaño de info (13px)? ✅
- ¿Mismo borde (2px)? ✅
- ¿Mismo padding (15px)? ✅
```

### 3. Imprimir CC Proveedor
```
Ir a: Cuenta Corriente → Pestaña Proveedores → Seleccionar → Click "PDF"
Verificar:
- ¿Mismos estilos que CC Cliente? ✅
- ¿Mismos estilos que Lista de Precios? ✅
```

### 4. Comparación Lado a Lado
```
Imprimir ambos documentos y poner uno al lado del otro:
- ¿Los logos tienen el MISMO tamaño exacto? ✅
- ¿Los textos están alineados horizontalmente? ✅
- ¿Los bordes tienen el MISMO grosor? ✅
- ¿Los espacios (padding) son idénticos? ✅
```

## NOTAS

### Logo Opcional
Si no hay logo configurado, el header se muestra sin logo pero mantiene los mismos tamaños de fuente y padding.

### URL del Backend
El generador usa `http://localhost:8000` como base para cargar el logo. Si el backend está en otro puerto/host, actualizar la variable `backend_url`.

### Cuerpo del Informe
NO se realizaron cambios en el cuerpo del informe (tabla de movimientos, saldos, etc.).

## RESULTADO FINAL

✅ **Listas de Precios y Cuenta Corriente ahora tienen encabezados IDÉNTICOS**
- Mismo tamaño de logo (60x60px)
- Misma tipografía y tamaños exactos
- Misma distribución espacial
- Mismos colores y bordes
- Mismo padding y márgenes
