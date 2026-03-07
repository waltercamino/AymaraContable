# 📦 Backups de Desarrollo - AymaraContable

## Descripción

Este directorio contiene backups de la base de datos para **desarrollo y testing**.

---

## ⚠️ ADVERTENCIA IMPORTANTE

> **Datos ficticios para desarrollo/testing - NO usar en producción**
>
> Los datos contenidos en estos backups son **exclusivamente para pruebas**. No incluyen información real de clientes, proveedores o transacciones comerciales.

---

## Archivos Disponibles

| Archivo | Descripción | Fecha |
|---------|-------------|-------|
| `aymara_backup_20260306.sql` | Backup completo con datos de prueba | 06/03/2026 |

### Contenido del Backup

El backup incluye:
- ✅ Estructura completa de la base de datos
- ✅ Usuarios de prueba (admin, WalterAdmin, Vendedor)
- ✅ Categorías de caja precargadas
- ✅ Datos ficticios de clientes, proveedores y productos
- ✅ Configuración básica del sistema

---

## 📋 Requisitos Previos

1. **PostgreSQL 14+** instalado
2. **Usuario con permisos** para crear bases de datos
3. **psql** disponible en la línea de comandos

---

## 🔧 Instrucciones de Restauración

### Opción 1: Comandos Separados

```bash
# 1. Crear la base de datos
createdb -U postgres aymara_contable

# 2. Restaurar el backup
psql -U postgres -d aymara_contable -f aymara_backup_20260306.sql
```

### Opción 2: Comando Único (Linux/Mac)

```bash
createdb -U postgres aymara_contable && psql -U postgres -d aymara_contable -f aymara_backup_20260306.sql
```

### Opción 3: Windows (PowerShell)

```powershell
# Crear base de datos
& "C:\Program Files\PostgreSQL\14\bin\createdb.exe" -U postgres aymara_contable

# Restaurar backup
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -d aymara_contable -f aymara_backup_20260306.sql
```

### Opción 4: Windows (CMD)

```cmd
createdb -U postgres aymara_contable
psql -U postgres -d aymara_contable -f aymara_backup_20260306.sql
```

---

## 🔍 Verificar Restauración

```bash
# Conectar a la base de datos
psql -U postgres -d aymara_contable

# Listar tablas
\dt

# Verificar usuarios de prueba
SELECT username, rol_id FROM usuarios;

# Salir
\q
```

---

## 👥 Usuarios Incluidos en el Backup

| Usuario | Contraseña | Rol | ID Rol |
|---------|-----------|-----|--------|
| `admin` | `admin123` | Admin Completo | 1 |
| `WalterAdmin` | `Admin123456` | Administrador | 3 |
| `Vendedor` | `vendedor123` | Vendedor | 2 |

---

## 🗑️ Eliminar Base de Datos (si es necesario)

```bash
# Eliminar base de datos existente
dropdb -U postgres aymara_contable

# Forzar eliminación (si hay conexiones activas)
psql -U postgres -c "DROP DATABASE IF EXISTS aymara_contable WITH (FORCE);"
```

---

## 📝 Notas

1. **Ruta de PostgreSQL en Windows:**
   - Agregar al PATH o usar ruta completa:
   - `C:\Program Files\PostgreSQL\14\bin\`

2. **Permisos:**
   - Asegurarse de tener permisos de superusuario para crear BD

3. **Puerto:**
   - Si PostgreSQL usa puerto diferente (ej: 5433):
   - `createdb -U postgres -p 5433 aymara_contable`

4. **Backup de Producción:**
   - Los backups de producción deben guardarse en un directorio **SEPARADO**
   - **NUNCA** subir backups de producción al repositorio

---

## 🔄 Crear Nuevo Backup

```bash
# Crear backup de la base de datos actual
pg_dump -U postgres aymara_contable -f aymara_backup_$(date +%Y%m%d).sql

# Comprimir backup
pg_dump -U postgres aymara_contable | gzip > aymara_backup_$(date +%Y%m%d).sql.gz
```

---

## 📁 Estructura del Directorio

```
backups_dev/
├── README.md                    # Este archivo
└── aymara_backup_20260306.sql   # Backup de prueba
```

---

## 🚫 Lo que NO debe estar aquí

- ❌ Backups de producción
- ❌ Datos reales de clientes
- ❌ Credenciales o contraseñas reales
- ❌ Información financiera sensible

---

**Última actualización:** Marzo 2026  
**Versión del sistema:** 4.0
