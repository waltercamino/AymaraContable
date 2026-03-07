# Matriz de Permisos - Sistema Aymara Contable

## Vista Rápida

| Módulo | Admin (1) | Vendedor (2) | Administrador (3) |
|--------|-----------|--------------|-------------------|
| FC Ventas | ✅ Todo | ⚡ Parcial | ⚡ Parcial |
| Nota de Crédito | ✅ Todo | ⚡ Parcial | ❌ Nada |
| Caja | ✅ Todo | ⚡ Parcial | ⚡ Parcial |
| Clientes | ✅ Todo | ✅ Todo | ❌ Nada |
| Productos | ✅ Todo | ⚡ Parcial | ✅ Todo |
| Proveedores | ✅ Todo | ❌ Nada | ✅ Todo |
| Pedidos | ✅ Todo | ⚡ Parcial | ✅ Todo |
| Recibos | ✅ Todo | ⚡ Parcial | ⚡ Parcial |
| Reportes | ✅ Todo | ⚡ Parcial | ✅ Todo |
| Configuración | ✅ Todo | ❌ Nada | ❌ Nada |
| Usuarios | ✅ Todo | ❌ Nada | ❌ Nada |
| Backup | ✅ Todo | ❌ Nada | ❌ Nada |

**Leyenda:** ✅ Todo = Acceso completo | ⚡ Parcial = Algunas acciones | ❌ Nada = Sin acceso

---

## Roles Definidos

| rol_id | Icono | Nombre | Descripción |
|--------|-------|--------|-------------|
| 1 | 👑 | Admin | Dueño del negocio, acceso completo |
| 2 | 📦 | Vendedor | Solo ventas y consulta |
| 3 | ⚙️ | Administrador | Gestión operativa (precios, caja, productos) |

---

## Detalle por Módulo

### FC Ventas
- **Crear/Ver:** Todos los roles (1, 2, 3)
- **Anular/Editar:** Solo Admin (1)

### Nota de Crédito
- **Ver:** Todos los roles (1, 2, 3)
- **Crear/Anular:** Solo Admin (1)

### Caja
- **Ver:** Todos los roles (1, 2, 3)
- **Movimientos:** Admin (1) y Administrador (3)
- **Cierre:** Solo Admin (1)

### Clientes
- **ABM:** Todos los roles (1, 2, 3)

### Productos
- **Ver:** Todos los roles (1, 2, 3)
- **ABM/Stock/Precios:** Admin (1) y Administrador (3)

### Proveedores
- **ABM:** Admin (1) y Administrador (3)

### Pedidos
- **Ver:** Todos los roles (1, 2, 3)
- **Crear/Enviar/Recibir/Cancelar:** Admin (1) y Administrador (3)

### Recibos
- **Ver:** Todos los roles (1, 2, 3)
- **Crear:** Admin (1) y Administrador (3)
- **Anular:** Solo Admin (1)

### Reportes
- **Ver:** Todos los roles (1, 2, 3)
- **Exportar:** Admin (1) y Administrador (3)

### Configuración
- **Editar:** Solo Admin (1)

### Usuarios
- **ABM:** Solo Admin (1)

### Backup
- **Exportar/Restaurar:** Solo Admin (1)

---

## Guía de Roles

### Admin Total (rol_id=1)
- **Perfil:** Dueño del negocio o usuario con control total
- **Permisos:** Acceso completo a todas las funcionalidades
- **Puede:**
  - Anular facturas y recibos
  - Gestionar usuarios y configuración
  - Exportar y restaurar backups
  - Editar cualquier dato del sistema

### Vendedor (rol_id=2)
- **Perfil:** Empleado de mostrador o vendedor
- **Permisos:** Solo operación básica de ventas
- **Puede:**
  - Crear facturas de venta
  - Ver clientes y productos
  - Ver caja y reportes (solo lectura)
- **NO puede:**
  - Anular documentos
  - Editar precios o stock
  - Acceder a configuración

### Administrador (rol_id=3)
- **Perfil:** Encargado de la gestión operativa
- **Permisos:** Gestión diaria del negocio
- **Puede:**
  - Gestionar precios, caja y productos
  - Crear pedidos a proveedores
  - Crear recibos de pago
  - Exportar reportes
- **NO puede:**
  - Anular facturas (solo Admin)
  - Gestionar usuarios
  - Restaurar backups

---

## Cómo Asignar Permisos

1. Ir a **Sistema → Usuarios**
2. Crear nuevo usuario o editar existente
3. Seleccionar el rol según las responsabilidades:
   - **Vendedor:** Solo ventas
   - **Administrador:** Gestión operativa
   - **Admin Total:** Dueño/superusuario
4. Guardar y verificar permisos

---

## Notas Técnicas

### Implementación

Los permisos están implementados en dos niveles:

1. **Backend (`Back/app/core/permissions.py`):**
   - Validación en cada endpoint protegido
   - Middleware verifica `rol_id` del usuario

2. **Frontend (`Front/src/hooks/useAuth.ts`):**
   - Ocultamiento de UI según permisos
   - Validación antes de ejecutar acciones

### Agregar Nuevos Permisos

Para agregar un nuevo permiso:

1. **Backend:** Agregar en `permissions.py`
   ```python
   "nuevo_modulo:accion": {"roles": [1, 2, 3]}
   ```

2. **Frontend:** Agregar en `useAuth.ts`
   ```typescript
   'nuevo_modulo:accion': [1, 2, 3]
   ```

3. **Documentación:** Actualizar esta matriz

---

## Visualización en el Sistema

La matriz completa está disponible en:
- **Ruta:** `/permisos-matriz`
- **Acceso:** Solo Admin Total (rol_id=1)
- **Funciones:**
  - Tabla visual con ✅/❌ por rol
  - Imprimir/exportar a PDF
  - Guía de roles integrada

---

**Última actualización:** Marzo 2026  
**Versión del sistema:** 1.0.0
