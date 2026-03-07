# 📒 AymaraContable v1.0

**Sistema de Gestión Contable y Comercial para PyMEs**

Facturación, Caja, Cuenta Corriente, Productos, Pedidos y Reportes - Todo en un solo lugar.

[![Versión](https://img.shields.io/badge/versión-4.0-blue)](https://github.com/waltercamino/AymaraContable)
[![Licencia](https://img.shields.io/badge/licencia-Propietario-red)](LICENSE)

---

## 📋 Tabla de Contenidos

- [Primeros Pasos](#-primeros-pasos)
- [Usuarios de Prueba](#-usuarios-de-prueba)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Características de Seguridad](#-características-de-seguridad)
- [Matriz de Permisos](#-matriz-de-permisos)
- [Características Principales](#-características-principales)
- [Pendientes para Próximo Sprint](#-pendientes-para-próximo-sprint)
- [Contacto y Repositorio](#-contacto-y-repositorio)

---

## 🚀 Primeros Pasos

### 1. Clonar el Repositorio

```bash
git clone https://github.com/waltercamino/AymaraContable.git
cd AymaraContable
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
createdb aymara_contable

# Restaurar backup de prueba (opcional)
psql -d aymara_contable -f Back/backups_dev/aymara_backup_20260306.sql
```

### 3. Configurar Backend

```bash
cd Back

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores locales

# Iniciar servidor
uvicorn app.main:app --reload
```

### 4. Configurar Frontend

```bash
cd Front

# Instalar dependencias
npm install

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus valores locales

# Iniciar servidor de desarrollo
npm run dev
```

### 5. Acceder al Sistema

Abrir navegador en: **http://localhost:5173**

---

## 👥 Usuarios de Prueba

El sistema incluye usuarios preconfigurados para testing:

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| `admin` | `admin123` | Admin Completo | Acceso total a todas las funciones |
| `WalterAdmin` | `Admin123456` | Administrador | Gestión operativa (precios, caja, productos) |
| `Vendedor` | `vendedor123` | Vendedor | Solo ventas y consulta |

> ⚠️ **Importante:** Cambiar estas credenciales en producción.

---

## 📁 Estructura del Proyecto

```
AymaraContable/
├── Back/
│   ├── app/
│   │   ├── api/              # Endpoints de la API REST
│   │   ├── core/             # Configuración central y permisos
│   │   ├── services/         # Servicios auxiliares
│   │   ├── utils/            # Utilitarios
│   │   ├── config.py         # Configuración de la aplicación
│   │   ├── database.py       # Conexión a PostgreSQL
│   │   ├── main.py           # Punto de entrada (FastAPI)
│   │   ├── models.py         # Modelos SQLAlchemy
│   │   └── schemas.py        # Esquemas Pydantic
│   ├── backups_dev/          # Backups de desarrollo/testing
│   ├── migrations/           # Scripts de migración de BD
│   ├── scripts/              # Scripts utilitarios
│   ├── .env.example          # Ejemplo de variables de entorno
│   └── requirements.txt      # Dependencias de Python
│
├── Front/
│   ├── src/
│   │   ├── components/       # Componentes React reutilizables
│   │   ├── context/          # Contextos de React (Auth, Theme)
│   │   ├── hooks/            # Custom hooks (useAuth, useLoading)
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── services/         # Servicios API centralizados
│   │   ├── types/            # Tipos TypeScript
│   │   └── utils/            # Utilitarios (validaciones, formato)
│   ├── .env.example          # Ejemplo de variables de entorno
│   └── package.json          # Dependencias de Node.js
│
├── docs/
│   ├── historico/            # Documentación de fixes históricos
│   ├── migraciones/          # Scripts de migración de BD
│   └── PERMISOS_MATRIX.md    # Matriz detallada de permisos
│
├── .gitignore                # Archivos ignorados por Git
├── README.md                 # Este archivo
└── CONTEXTO.md               # Contexto técnico del proyecto
```

---

## 🔐 Características de Seguridad

### Autenticación y Sesiones

| Característica | Descripción |
|---------------|-------------|
| **Almacenamiento** | `sessionStorage` (se limpia al cerrar navegador) |
| **Token** | JWT (JSON Web Token) con firma HS256 |
| **Expiración** | 8 horas (480 minutos) desde última actividad |
| **Alerta Caja Abierta** | Notificación al login si hay sesión de caja abierta |

### Protección de Datos

- **Contraseñas:** Hasheadas con bcrypt
- **API:** Endpoints protegidos por autenticación JWT
- **Roles:** Validación de permisos en backend y frontend
- **Ambiente:** Variables sensibles en `.env` (no subir a Git)

### Session Timeout

El sistema cierra sesión automáticamente después de **8 horas** de inactividad. El token JWT incluye:
- `exp`: Timestamp de expiración
- `sub`: ID del usuario
- `rol_id`: Rol del usuario para validación de permisos

---

## 📊 Matriz de Permisos

### Roles del Sistema

| Rol ID | Nombre | Icono | Descripción |
|--------|--------|-------|-------------|
| 1 | **Admin** | 👑 | Dueño del negocio - Acceso completo |
| 2 | **Vendedor** | 📦 | Empleado de mostrador - Solo ventas y consulta |
| 3 | **Administrador** | ⚙️ | Encargado operativo - Gestión diaria |

### Permisos por Módulo

| Módulo | Admin | Vendedor | Administrador |
|--------|-------|----------|---------------|
| **FC Ventas** | ✅ Todo | ⚡ Crear/Ver | ⚡ Crear/Ver |
| **Nota de Crédito** | ✅ Todo | ⚡ Ver | ❌ Sin acceso |
| **Caja** | ✅ Todo | ⚡ Ver | ⚡ Movimientos/Cierre |
| **Clientes** | ✅ Todo | ✅ Todo | ❌ Sin acceso |
| **Productos** | ✅ Todo | ⚡ Ver | ✅ Todo |
| **Proveedores** | ✅ Todo | ❌ Sin acceso | ✅ Todo |
| **Pedidos** | ✅ Todo | ⚡ Ver | ✅ Todo |
| **Recibos** | ✅ Todo | ⚡ Ver | ⚡ Crear/Ver |
| **Reportes** | ✅ Todo | ⚡ Ver | ✅ Exportar |
| **Configuración** | ✅ Todo | ❌ Sin acceso | ❌ Sin acceso |
| **Usuarios** | ✅ Todo | ❌ Sin acceso | ❌ Sin acceso |
| **Backup** | ✅ Todo | ❌ Sin acceso | ❌ Sin acceso |

**Leyenda:** ✅ Acceso completo | ⚡ Acceso parcial | ❌ Sin acceso

> 📄 Ver matriz completa en: [docs/PERMISOS_MATRIX.md](docs/PERMISOS_MATRIX.md)

---

## ✨ Características Principales

### Módulos del Sistema

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| **Dashboard** | Panel principal con métricas clave | ✅ Completo |
| **FC Venta** | Facturación de ventas + Notas de Crédito | ✅ Completo |
| **FC Compra** | Facturación de compras + NC Proveedor | ✅ Completo |
| **Caja** | Apertura, cierre, movimientos y categorías | ✅ Completo |
| **Cta. Cte.** | Cuenta corriente clientes/proveedores | ✅ Completo |
| **Productos** | ABM de productos, stock y categorías | ✅ Completo |
| **Precios** | Actualización masiva de precios | ✅ Completo |
| **Pedidos** | Pedidos a proveedores con seguimiento | ✅ Completo |
| **Usuarios** | Gestión de usuarios y roles | ✅ Completo |
| **Reportes** | Reportes varios con exportación PDF/Excel | ✅ Completo |
| **Ajustes** | Configuración general del sistema | ✅ Completo |
| **Backup** | Exportar y restaurar base de datos | ✅ Completo |

### Características Técnicas

- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Comunicación:** REST API con validación de esquemas Pydantic
- **Notificaciones:** React Toastify para feedback visual
- **Gráficos:** Recharts para visualización de datos
- **Loading States:** Hooks reutilizables con spinners
- **Validaciones:** Frontend y backend (fecha no futura, unicidad, etc.)

### Funcionalidades Destacadas

- ✅ **Notas de Crédito integradas** en FC Venta/Compra (no módulo separado)
- ✅ **Cuenta Corriente unificada** para clientes y proveedores
- ✅ **Caja por sesiones** con apertura/cierre y categorías
- ✅ **Imprimir comprobantes** desde cualquier módulo
- ✅ **Exportar a PDF y Excel** en reportes
- ✅ **IVA configurable** (Monotributo 0% o Responsable Inscripto 21%)

---

## 📋 Pendientes para Próximo Sprint

Las siguientes mejoras están planificadas para futuras versiones:

| Prioridad | Módulo | Tarea | Descripción |
|-----------|--------|-------|-------------|
| 🔴 Alta | Permisos | Auditoría de permisos | Revisar consistencia de validaciones en todos los endpoints |
| 🔴 Alta | Usuarios | Roles duplicados | Eliminar roles duplicados y normalizar asignaciones |
| 🟡 Media | Global | `usuario_id` en módulos | Agregar tracking de usuario en todos los movimientos |
| 🟡 Media | Caja | Imprimir reporte diario | Botón para imprimir cierre de caja con detalle |
| 🟢 Baja | Sistema | IVA configurable desde UI | Permitir cambiar IVA desde Settings sin editar código |
| 🟢 Baja | FC Venta | Checkbox "Reintegrar stock" | Opción opcional para NC de ventas |
| 🟢 Baja | Global | Toasts en todos los módulos | Extender notificaciones a Productos/Clientes/Proveedores |

---

## 📞 Contacto y Repositorio

### Repositorio Oficial

🔗 **https://github.com/waltercamino/AymaraContable**

### Contacto

- **Empresa:** Aymara Sistemas
- **Versión:** 4.0
- **Fecha:** Marzo 2026
- **Ubicación:** Argentina

### Documentación Adicional

| Archivo | Descripción |
|---------|-------------|
| [CONTEXTO.md](CONTEXTO.md) | Contexto técnico y fixes aplicados |
| [docs/PERMISOS_MATRIX.md](docs/PERMISOS_MATRIX.md) | Matriz detallada de permisos |
| [docs/historico/](docs/historico/) | Historial de fixes y mejoras |
| [docs/migraciones/](docs/migraciones/) | Scripts de migración de BD |
| [Back/backups_dev/README.md](Back/backups_dev/README.md) | Instrucciones para restaurar backup |

---

## 📄 Licencia

Este proyecto es propiedad de **Aymara Sistemas**. Todos los derechos reservados.

**Uso exclusivo interno.** No distribuir ni compartir sin autorización.

---

## ⚠️ Advertencias Importantes

1. **NO subir archivos `.env`** con credenciales reales a GitHub
2. **NO incluir backups de producción** en el repositorio
3. **Cambiar credenciales de prueba** antes de usar en producción
4. **Mantener actualizado** `requirements.txt` y `package.json`

---

**Hecho con ❤️ por Aymara Sistemas**
