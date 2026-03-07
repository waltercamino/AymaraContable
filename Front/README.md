# Sistema de Gestión Comercial

Sistema completo de gestión comercial desarrollado en React + TypeScript + Vite.

## Características

### Módulos Implementados

1. **Login** - Autenticación con usuario, contraseña y selección de rol
2. **Dashboard** - Vista general con estadísticas, gráficos de ventas y gastos
3. **Productos** - Gestión completa CRUD con búsqueda, filtros por categoría, control de stock
4. **Precios** - Actualización masiva de precios por categoría con vista previa
5. **Ventas (POS)** - Punto de venta con buscador, carrito, métodos de pago
6. **Caja** - Registro de movimientos organizados por tipo (ventas, compras, gastos, insumos, impuestos, alquiler)
7. **Proveedores** - Gestión de proveedores con documentos y comparador de precios
8. **Reportes** - Análisis con gráficos de productos más vendidos, márgenes, distribución de ventas
9. **Usuarios** - Administración de usuarios y roles

### Características de UI

- Sidebar de navegación colapsable
- Header con información de usuario y logout
- Tablas con búsqueda y filtros
- Modales para crear/editar registros
- Diseño responsive (mobile y desktop)
- Formato argentino: $1.234,56 para moneda y DD/MM/YYYY para fechas
- Interfaz completamente en español

## Stack Tecnológico

- **React 18** - Framework UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **React Router DOM** - Navegación
- **Recharts** - Gráficos y visualizaciones
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas

## Instalación y Uso

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

## Estructura del Proyecto

```
src/
├── components/
│   └── Layout/
│       ├── Layout.tsx      # Layout principal
│       ├── Sidebar.tsx     # Menú lateral
│       └── Header.tsx      # Cabecera con usuario
├── pages/
│   ├── Login.tsx           # Página de login
│   ├── Dashboard.tsx       # Panel principal
│   ├── Productos.tsx       # Gestión de productos
│   ├── Precios.tsx         # Actualización de precios
│   ├── Ventas.tsx          # Punto de venta
│   ├── Caja.tsx            # Movimientos de caja
│   ├── Proveedores.tsx     # Gestión de proveedores
│   ├── Reportes.tsx        # Reportes y análisis
│   └── Usuarios.tsx        # Administración de usuarios
├── types/
│   └── index.ts            # Definiciones TypeScript
├── utils/
│   └── format.ts           # Utilidades de formato
├── data/
│   └── mockData.ts         # Datos de prueba
├── App.tsx                 # Componente principal
└── main.tsx               # Punto de entrada
```

## Datos Mock

El sistema incluye datos de prueba para todas las funcionalidades. Los datos se encuentran en `src/data/mockData.ts` y pueden ser reemplazados por llamadas a API reales cuando esté disponible el backend.

## Endpoints API Sugeridos

Cuando se implemente el backend, los endpoints recomendados son:

- `POST /api/auth/login` - Autenticación
- `GET /api/productos` - Listar productos
- `POST /api/productos` - Crear producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto
- `GET /api/ventas` - Listar ventas
- `POST /api/ventas` - Crear venta
- `GET /api/caja` - Movimientos de caja
- `POST /api/caja` - Registrar movimiento
- `GET /api/proveedores` - Listar proveedores
- `GET /api/reportes` - Obtener reportes
- `GET /api/usuarios` - Listar usuarios

## Acceso al Sistema

Para acceder al sistema:

1. Ir a `/login`
2. Ingresar cualquier usuario y contraseña (sin validación por ahora)
3. Seleccionar un rol: Vendedor, Gerente o Administrador
4. Click en "Iniciar Sesión"

Se redirigirá automáticamente al Dashboard.

## Próximos Pasos

Para conectar con un backend real:

1. Reemplazar los datos mock en `src/data/mockData.ts` con llamadas a API
2. Implementar autenticación real con tokens JWT
3. Agregar validación de formularios
4. Implementar manejo de errores y estados de carga
5. Agregar paginación real en tablas
6. Implementar filtros del lado del servidor
