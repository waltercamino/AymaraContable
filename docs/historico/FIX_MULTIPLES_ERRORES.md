# 🔧 FIX MULTIPLES ERRORES - Resumen de Cambios

**Fecha**: 2026-03-02  
**Prioridad**: 🔴 Crítico

---

## ✅ PROBLEMAS RESUELTOS

### 1️⃣ Logo No Se Guarda en Ajustes

**Archivos modificados:**
- `Back/app/api/configuracion.py`
- `Front/src/pages/Ajustes.tsx`
- `Front/src/components/Layout/Header.tsx`

**Cambios:**
- ✅ Ruta absoluta para guardar logo en `Back/uploads/`
- ✅ Cache-busting con timestamp en la URL
- ✅ Endpoint `/api/configuracion/logo` para servir el archivo
- ✅ Debug logging en frontend
- ✅ Manejo de errores mejorado
- ✅ Soporte para más formatos: PNG, JPG, JPEG, SVG, WEBP

**Testing:**
```
1. Ir a Sistema → Ajustes
2. Subir logo PNG/JPG
3. Guardar configuración
4. Ver console logs: "✅ Logo subido"
5. Recargar página → ¿El logo persiste en header?
```

---

### 2️⃣ Validación de CUIT - Frontend + Backend

**Archivos creados:**
- `Front/src/utils/validaciones.ts` (**NUEVO**)

**Archivos modificados:**
- `Front/src/pages/ClientesProveedores.tsx`
- `Back/app/api/proveedores.py`
- `Back/app/api/clientes.py`

**Cambios Frontend:**
- ✅ Función `validarCUIT()` con algoritmo Módulo 11
- ✅ Función `formatearCUIT()` para formato XX-XXXXXXXX-X
- ✅ Validación en tiempo real (onChange)
- ✅ Validación final (onBlur)
- ✅ Mensajes de error visuales
- ✅ Borde rojo en input inválido
- ✅ Validación antes de guardar

**Cambios Backend:**
- ✅ Import `IntegrityError` de SQLAlchemy
- ✅ Try-catch en `crear_proveedor()` y `crear_cliente()`
- ✅ Mensaje amigable para errores de CUIT (no 500)
- ✅ Detección de CUIT duplicado o inválido

**Testing:**
```
1. Cliente/Proveedor: Escribir "123" → ¿Muestra error?
2. Escribir "20-12345678-9" → ¿Pasa validación?
3. Backend: Enviar CUIT inválido → ¿Error 400 (no 500)?
```

---

### 3️⃣ PDF Factura Venta - Error 'apellido'

**Archivos modificados:**
- `Back/app/api/fcventa.py`
- `Back/app/reportes/factura_venta_pdf.py`
- `Back/app/reportes/recibo_pdf.py`

**Cambios:**
- ✅ Eliminar referencia a `cliente.apellido` (campo eliminado)
- ✅ Reemplazar por `cliente.nombre` o `cliente.nombre_completo`
- ✅ Usar `cliente.get('nombre_completo') or cliente.get('nombre', '')`

**Testing:**
```
1. Imprimir FC con cliente
2. ¿Sin error 'apellido'?
3. ¿Muestra nombre completo del cliente correctamente?
```

---

### 4️⃣ Recibos PDF - Nombre Dinámico de Empresa

**Archivos modificados:**
- `Back/app/reportes/recibo_pdf.py` (ya tenía parámetro `empresa`)
- `Back/app/api/recibos.py` (ya pasa `empresa_data`)

**Estado:** ✅ YA IMPLEMENTADO en sprint anterior

---

### 5️⃣ Nombres de Archivo PDF Descriptivos

**Archivos modificados:**
- `Back/app/api/fcventa.py`
- `Back/app/api/recibos.py`
- `Back/app/api/cuenta_corriente.py`

**Cambios:**
- ✅ Agregar fecha al nombre: `_{YYYYMMDD}.pdf`
- ✅ Nombres descriptivos:
  - `FC_FV-0001-00000123_Juan_Perez_20260302.pdf`
  - `RECIBO_R-0023_Cobro_Juan_Perez_20260302.pdf`
  - `CTACTE_cliente_Juan_Perez_20260302.pdf`

**Testing:**
```
1. Descargar FC → ¿Nombre incluye fecha?
2. Descargar Recibo → ¿Nombre descriptivo?
3. Descargar Estado de Cuenta → ¿Nombre claro?
```

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### Frontend
| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `Front/src/utils/validaciones.ts` | **CREADO** | Validaciones de CUIT, email, teléfono |
| `Front/src/pages/Ajustes.tsx` | MODIFICADO | Debug logging + manejo de errores |
| `Front/src/pages/ClientesProveedores.tsx` | MODIFICADO | Validación CUIT en tiempo real |
| `Front/src/components/Layout/Header.tsx` | MODIFICADO | Error handler para logo |

### Backend
| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `Back/app/api/configuracion.py` | MODIFICADO | Logo upload con ruta absoluta |
| `Back/app/api/proveedores.py` | MODIFICADO | IntegrityError handling |
| `Back/app/api/clientes.py` | MODIFICADO | IntegrityError handling |
| `Back/app/api/fcventa.py` | MODIFICADO | Fix 'apellido' + filename con fecha |
| `Back/app/api/recibos.py` | MODIFICADO | Filename con fecha |
| `Back/app/api/cuenta_corriente.py` | MODIFICADO | Filename con fecha |
| `Back/app/reportes/factura_venta_pdf.py` | MODIFICADO | Fix 'apellido' |
| `Back/app/reportes/recibo_pdf.py` | MODIFICADO | Fix 'apellido' |

---

## 🧪 TESTING COMPLETO

```bash
# 1. Logo en Ajustes
- [ ] Subir logo → ¿Se guarda?
- [ ] Console: "✅ Logo subido"
- [ ] Header: ¿Muestra logo?
- [ ] Recargar: ¿Persiste?

# 2. Validación CUIT
- [ ] "123" → ¿Error "11 dígitos"?
- [ ] "20-12345678-9" → ¿Válido?
- [ ] CUIT duplicado → ¿Error 400?
- [ ] Backend: ¿No tira 500?

# 3. PDF Factura
- [ ] Imprimir FC → ¿Sin error?
- [ ] Cliente nombre → ¿Correcto?

# 4. Nombres de Archivo
- [ ] FC: `FC_FV-0001-00000123_..._20260302.pdf`?
- [ ] Recibo: `RECIBO_R-0023_..._20260302.pdf`?
- [ ] CTACTE: `CTACTE_..._20260302.pdf`?
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Logo Upload**:
   - Carpeta `Back/uploads/` se crea automáticamente
   - Ruta relativa en BD: `/api/configuracion/logo?ts=...`
   - Timestamp evita caché del navegador

2. **CUIT Validation**:
   - Frontend: Validación en tiempo real (UX)
   - Backend: IntegrityError handling (seguridad)
   - Algoritmo Módulo 11 para dígito verificador

3. **Campo 'apellido'**:
   - ELIMINADO en sprint anterior
   - Reemplazar por `nombre` en TODOS lados
   - `nombre_completo` es alias de `nombre`

4. **PDF Filenames**:
   - Formato: `{TIPO}_{numero}_{entidad}_{fecha}.pdf`
   - Sanitizar espacios: `.replace(' ', '_')`
   - Fecha: `YYYYMMDD` para orden cronológico

---

## 🚀 COMANDOS ÚTILES

```bash
# Ver logs de subida de logo
tail -f Back/logs/app.log | grep -i logo

# Ver uploads
ls -la Back/uploads/

# Testear validación CUIT (Python)
python -c "
cuit = '20123456789'
coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
suma = sum(int(d) * c for d, c in zip(cuit[:10], coeficientes))
resto = suma % 11
digito = 11 - resto if resto > 0 else 0
print(f'Dígito verificador: {digito}')
print(f'Válido: {digito == int(cuit[10])}')
"
```

---

## 📝 PRÓXIMOS PASOS (OPCIONALES)

- [ ] Agregar validación de CUIT en Ajustes.tsx (campo CUIT de empresa)
- [ ] Compresión automática de logos al subir
- [ ] Preview de logo antes de guardar
- [ ] Sanitizar nombres de archivo (quitar caracteres especiales)
- [ ] Logging centralizado de errores PDF

---

**Estado**: ✅ Todos los fixes completados  
**Testing**: Pendiente de validar en producción
