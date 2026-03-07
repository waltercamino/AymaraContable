# 📒 AymaraContable v4.0

Sistema de Gestión Contable para PyMEs - Facturación, Caja, Cuenta Corriente y Reportes.

---

## 🏗️ Arquitectura

| Capa | Tecnología |
|------|------------|
| **Backend** | FastAPI + SQLAlchemy + PostgreSQL |
| **Frontend** | React + TypeScript + Tailwind CSS + Vite |
| **Comunicación** | REST API |
| **Notificaciones** | React Toastify |
| **Gráficos** | Recharts |

---

## 📁 Estructura del Proyecto

```
AymaraContable/
├── Back/
│   ├── app/
│   │   ├── api/              # Endpoints de la API
│   │   ├── core/             # Configuración central y permisos
│   │   ├── reportes/         # Generación de PDFs y Excel
│   │   ├── services/         # Servicios auxiliares
│   │   ├── utils/            # Utilitarios
│   │   ├── config.py         # Configuración de la aplicación
│   │   ├── database.py       # Conexión a PostgreSQL
│   │   ├── main.py           # Punto de entrada
│   │   ├── models.py         # Modelos SQLAlchemy
│   │   └── schemas.py        # Esquemas Pydantic
│   ├── migrations/           # Scripts SQL de migración
│   ├── queries/              # Queries de referencia
│   ├── scripts/              # Scripts utilitarios
│   ├── uploads/              # Archivos subidos (no subir a Git)
│   ├── .env                  # Variables de entorno (no subir a Git)
│   └── requirements.txt      # Dependencias de Python
│
├── Front/
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── context/          # Contextos de React
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── services/         # Servicios API
│   │   ├── types/            # Tipos TypeScript
│   │   └── utils/            # Utilitarios
│   ├── .env                  # Variables de entorno (no subir a Git)
│   └── package.json          # Dependencias de Node
│
├── docs/
│   ├── historico/            # Documentación de fixes históricos
│   ├── migraciones/          # Scripts de migración de BD
│   └── PERMISOS_MATRIX.md    # Matriz de permisos del sistema
│
└── README.md                 # Este archivo
```

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Python 3.13+**
- **Node.js 18+**
- **PostgreSQL 14+**

### 1. Backend

```bash
cd Back

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
# Copiar .env.example a .env y ajustar valores
copy .env.example .env

# Ejecutar migraciones de base de datos
# (Ver instrucciones en docs/migraciones/)

# Iniciar servidor
uvicorn app.main:app --reload
```

### 2. Frontend

```bash
cd Front

# Instalar dependencias
npm install

# Configurar variables de entorno
# Copiar .env.example a .env y ajustar valores
copy .env.example .env

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build
```

---

## 📦 Módulos del Sistema

| Módulo | Descripción | Estado |
|--------|-------------|--------|
| **Dashboard** | Panel principal con métricas | ✅ Completo |
| **FC Venta** | Facturación de ventas | ✅ Completo |
| **FC Compra** | Facturación de compras | ✅ Completo |
| **Caja** | Apertura/cierre y movimientos | ✅ Completo |
| **Cta. Cte.** | Cuenta corriente clientes/proveedores | ✅ Completo |
| **Productos** | ABM de productos y categorías | ✅ Completo |
| **Precios** | Actualización masiva de precios | ✅ Completo |
| **Pedidos** | Pedidos a proveedores | ✅ Completo |
| **Usuarios** | Gestión de usuarios y roles | ✅ Completo |
| **Reportes** | Reportes varios | ✅ Completo |
| **Ajustes** | Configuración del sistema | ✅ Completo |
| **Backup** | Copias de seguridad | ✅ Completo |
| **Permisos** | Matriz de permisos | ✅ Completo |

---

## 🔧 Comandos Útiles

### Backend

```bash
# Iniciar servidor de desarrollo
uvicorn app.main:app --reload

# Ejecutar migración
python docs/migraciones/run_migration_XXX.py

# Verificar tipo
# (si está configurado mypy)
```

### Frontend

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Typecheck
npm run typecheck

# Lint
npm run lint

# Preview de producción
npm run preview
```

---

## 📝 Convenciones de Desarrollo

### Backend

- **Rutas API**: `/api/{recurso}/` (plural, kebab-case)
- **Modelos**: SQLAlchemy con tipado Pydantic
- **Respuestas**: Esquemas Pydantic en `schemas.py`
- **Errores**: HTTPException con código y mensaje
- **Logging**: Usar módulo `logging` de Python

### Frontend

- **Componentes**: Funcionales con TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: React Context + React Query
- **Notificaciones**: React Toastify
- **Rutas**: React Router v7

### Base de Datos

- **Tablas**: Snake case plural (`cuenta_corriente`)
- **Columnas**: Snake case (`fecha_emision`)
- **PKs**: `id` (autoincremental)
- **FKs**: `{tabla}_id` (`cliente_id`)

---

## 🔐 Variables de Entorno

### Backend (`.env`)

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/aymara_contable
SECRET_KEY=tu_clave_secreta_para_jwt
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
IVA_PORCENTAJE=0
```

### Frontend (`.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📄 Licencia

Este proyecto es propiedad de **Aymara Sistemas**. Todos los derechos reservados.

---

## 👥 Contacto

- **Empresa**: Aymara Sistemas
- **Versión**: 4.0
- **Fecha**: Marzo 2026

---

## 📚 Documentación Adicional

- [Matriz de Permisos](docs/PERMISOS_MATRIX.md)
- [Historial de Fixes](docs/historico/)
- [Migraciones de BD](docs/migraciones/)
- [Contexto del Proyecto](Back/docs/CONTEXTO.md)

---

**⚠️ IMPORTANTE**: No subir archivos `.env`, `uploads/`, `logs/`, `venv/`, `node_modules/` o `dist/` al repositorio.
