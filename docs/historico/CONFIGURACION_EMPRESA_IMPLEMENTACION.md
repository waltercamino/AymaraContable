# 🏢 FEATURE: Configuración de Empresa (Multi-Empresa)

## 📋 RESUMEN

Esta feature permite configurar los datos de la empresa (nombre, CUIT, dirección, logo, etc.) de manera dinámica, reemplazando todos los textos hardcodeados "AYMARA CONTABLE" por datos configurables desde el sistema.

---

## ✅ IMPLEMENTADO

### 1️⃣ BACKEND

#### **Models** (`Back/app/models.py`)
- ✅ Nueva tabla `configuracion_empresa` con campos:
  - `id` (PK)
  - `nombre_empresa` (VARCHAR 200, NOT NULL)
  - `cuit` (VARCHAR 20)
  - `direccion` (VARCHAR 200)
  - `telefono` (VARCHAR 20)
  - `email` (VARCHAR 100)
  - `logo_url` (VARCHAR 500) - Ruta del archivo: `/uploads/logo.png`
  - `pie_factura` (TEXT)
  - `creado_en` (DATETIME)
  - `actualizado_en` (DATETIME)

#### **Schemas** (`Back/app/schemas.py`)
- ✅ `ConfiguracionEmpresaBase` - Schema base
- ✅ `ConfiguracionEmpresaCreate` - Para creación
- ✅ `ConfiguracionEmpresaUpdate` - Para actualización (todos opcionales)
- ✅ `ConfiguracionEmpresaResponse` - Para respuestas

#### **API Router** (`Back/app/api/configuracion.py`)
- ✅ `GET /api/configuracion/empresa` - Obtener configuración
- ✅ `PUT /api/configuracion/empresa` - Actualizar configuración
- ✅ `POST /api/configuracion/empresa/logo` - Subir logo
- ✅ `POST /api/configuracion/empresa/inicializar` - Inicializar configuración por defecto

#### **Main** (`Back/app/main.py`)
- ✅ Router registrado: `app.include_router(configuracion.router)`

#### **PDFs Actualizados**
- ✅ `factura_venta_pdf.py` - Ahora acepta parámetro `empresa`
- ✅ `recibo_pdf.py` - Ahora acepta parámetro `empresa`
- ✅ `estado_cuenta_pdf.py` - Ahora acepta parámetro `empresa`

#### **API Endpoints Actualizados**
- ✅ `fcventa.py` - Pasa datos de empresa al PDF
- ✅ `recibos.py` - Pasa datos de empresa al PDF
- ✅ `cuenta_corriente.py` - Pasa datos de empresa al PDF

---

### 2️⃣ FRONTEND

#### **Context** (`Front/src/context/ConfigContext.tsx`)
- ✅ `ConfigProvider` - Proveedor de contexto global
- ✅ `useConfig` - Hook para acceder a la configuración
- ✅ `refreshConfig` - Función para recargar configuración

#### **Services** (`Front/src/services/api.ts`)
- ✅ `configuracion.getEmpresa()` - Obtener datos
- ✅ `configuracion.updateEmpresa()` - Actualizar datos
- ✅ `configuracion.subirLogo()` - Subir logo
- ✅ `configuracion.inicializar()` - Inicializar

#### **Components**
- ✅ `Header.tsx` - Muestra logo + nombre de empresa dinámicamente
- ✅ `Sidebar.tsx` - Link a Ajustes habilitado (antes estaba disabled)

#### **Pages**
- ✅ `Ajustes.tsx` - Página de configuración con:
  - Upload de logo
  - Campos: nombre, CUIT, dirección, teléfono, email, pie de factura
  - Botones Guardar/Cancelar

#### **App** (`Front/src/App.tsx`)
- ✅ `ConfigProvider` envuelve toda la aplicación
- ✅ Ruta `/ajustes` agregada

---

## 🗄️ MIGRACIÓN DE BASE DE DATOS

### Archivo SQL
`Back/migrations/001_create_configuracion_empresa.sql`

### Ejecutar Migración
```sql
-- 1. Crear tabla
CREATE TABLE IF NOT EXISTS configuracion_empresa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_empresa VARCHAR(200) NOT NULL,
    cuit VARCHAR(20),
    direccion VARCHAR(200),
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(500),
    pie_factura TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertar configuración por defecto
INSERT OR IGNORE INTO configuracion_empresa (
    id, nombre_empresa, cuit, direccion, telefono, email, logo_url, pie_factura
) VALUES (
    1, 'AYMARA CONTABLE', '', '', '', '', '', 'Gracias por su compra.'
);
```

---

## 🚀 CÓMO USAR

### 1. Ejecutar Migración
```bash
# En SQLite
sqlite3 database.sqlite < Back/migrations/001_create_configuracion_empresa.sql
```

### 2. Iniciar el Sistema
```bash
# Backend
cd Back
uvicorn app.main:app --reload

# Frontend
cd Front
npm run dev
```

### 3. Configurar Empresa
1. Iniciar sesión
2. Ir a **Sistema → Ajustes**
3. Completar datos de la empresa
4. Subir logo (PNG, JPG, SVG)
5. Click en **Guardar Configuración**

### 4. Verificar Cambios
- **Header**: Debe mostrar logo + nombre de empresa
- **PDFs**: Facturas, recibos y estados de cuenta deben mostrar nombre configurado
- **Navbar**: Logo visible en header

---

## 🧪 TESTING

### Test de Configuración
```
1. Ajustes → Datos de Empresa:
   - [ ] Cargar logo → ¿Se guarda y muestra?
   - [ ] Completar todos los campos → ¿Se guardan?
   - [ ] Recargar página → ¿Los datos persisten?

2. Navbar/Header:
   - [ ] ¿Muestra logo + nombre de empresa?
   - [ ] ¿Es visible (no tapado)?
   - [ ] ¿Usuario y cerrar sesión a la derecha?

3. PDFs:
   - [ ] Imprimir Factura → ¿Muestra nombre configurado?
   - [ ] Imprimir Recibo → ¿Muestra nombre configurado?
   - [ ] Imprimir Estado de Cuenta → ¿Muestra nombre configurado?

4. Multi-Empresa:
   - [ ] Cambiar nombre en Ajustes → ¿Se refleja en todo el sistema?
   - [ ] ¿Se puede "vender" a otra empresa solo cambiando configuración?
```

### Test de API
```bash
# Obtener configuración
curl http://localhost:8000/api/configuracion/empresa

# Actualizar configuración
curl -X PUT http://localhost:8000/api/configuracion/empresa \
  -H "Content-Type: application/json" \
  -d '{"nombre_empresa": "Mi Empresa SA", "cuit": "20-12345678-9"}'

# Subir logo
curl -X POST http://localhost:8000/api/configuracion/empresa/logo \
  -F "file=@/ruta/al/logo.png"

# Inicializar
curl -X POST http://localhost:8000/api/configuracion/empresa/inicializar
```

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### Backend
- ✅ `Back/app/models.py` - Agregada clase `ConfiguracionEmpresa`
- ✅ `Back/app/schemas.py` - Agregados schemas
- ✅ `Back/app/api/configuracion.py` - **NUEVO**
- ✅ `Back/app/main.py` - Router registrado
- ✅ `Back/app/api/fcventa.py` - PDF con empresa
- ✅ `Back/app/api/recibos.py` - PDF con empresa
- ✅ `Back/app/api/cuenta_corriente.py` - PDF con empresa
- ✅ `Back/app/reportes/factura_venta_pdf.py` - Parámetro empresa
- ✅ `Back/app/reportes/recibo_pdf.py` - Parámetro empresa
- ✅ `Back/app/reportes/estado_cuenta_pdf.py` - Parámetro empresa
- ✅ `Back/migrations/001_create_configuracion_empresa.sql` - **NUEVO**

### Frontend
- ✅ `Front/src/context/ConfigContext.tsx` - **NUEVO**
- ✅ `Front/src/services/api.ts` - Endpoints configuracion
- ✅ `Front/src/components/Layout/Header.tsx` - Logo + nombre dinámico
- ✅ `Front/src/components/Layout/Sidebar.tsx` - Ajustes habilitado
- ✅ `Front/src/pages/Ajustes.tsx` - **NUEVO**
- ✅ `Front/src/App.tsx` - ConfigProvider + ruta

---

## 🔧 NOTAS TÉCNICAS

### Logo
- Se guarda en `Back/uploads/logo_empresa.png` (o .jpg, .svg)
- La ruta en BD es relativa: `/uploads/logo_empresa.png`
- El frontend debe poder acceder a `/api/configuracion/logo` (endpoint público)

### Multi-Empresa
- Actualmente hay **1 solo registro** en `configuracion_empresa`
- Para multi-empresa real, se necesitaría:
  - Agregar `empresa_id` en todas las tablas
  - Sistema de usuarios multi-empresa
  - Filtro por empresa en todas las consultas

### PDFs
- Todos los PDFs ahora aceptan parámetro `empresa` (opcional)
- Si no se pasa, usa valores por defecto ("AYMARA")
- Los endpoints de PDF obtienen la configuración de la BD

---

## ⚠️ CONSIDERACIONES

1. **Seguridad**: El endpoint de logo es público (`/api/configuracion/logo`)
2. **Validación**: El backend valida extensiones de archivo (png, jpg, svg)
3. **Performance**: La configuración se carga una vez al iniciar la app (context)
4. **Cache**: El frontend podría cachear la configuración para no consultar siempre

---

## 🎯 PRÓXIMOS PASOS (OPCIONALES)

- [ ] Agregar validación de formato de CUIT en backend
- [ ] Agregar más campos (website, redes sociales, etc.)
- [ ] Soporte multi-empresa real (varios registros)
- [ ] Endpoint para servir logo desde BD (no desde filesystem)
- [ ] Compresión automática de logos al subir
- [ ] Preview de logo antes de guardar
- [ ] Historial de cambios de configuración

---

## 📝 COMANDOS ÚTILES

```bash
# Ver configuración actual (SQLite)
sqlite3 database.sqlite "SELECT * FROM configuracion_empresa;"

# Resetear configuración
sqlite3 database.sqlite "DELETE FROM configuracion_empresa;"

# Logs del backend (ver si carga configuración)
tail -f Back/logs/app.log | grep -i config

# Ver archivos subidos
ls -la Back/uploads/
```

---

**Fecha de implementación**: 2026-03-01  
**Versión**: 1.0.0  
**Estado**: ✅ Completado
