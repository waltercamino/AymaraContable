# 📦 PEDIDOS A PROVEEDORES - MÓDULO COMPLETO

## Fecha: 2026-02-23

---

## 📊 RESUMEN EJECUTIVO

Módulo nuevo implementado para gestionar **pedidos/solicitudes a proveedores** sin impacto contable.

| Característica | Estado |
|---------------|--------|
| **Base de Datos** | ✅ Tablas creadas |
| **Backend Models** | ✅ Implementados |
| **Backend API** | ✅ 8 endpoints |
| **Frontend Service** | ⏳ Pendiente |
| **Frontend UI** | ⏳ Pendiente |

---

## 🗂️ DIFERENCIA CLAVE

| FC Compra | Pedido a Proveedor |
|-----------|-------------------|
| Factura recibida ✅ | Solicitud de compra 📋 |
| Registra deuda 💰 | No registra deuda |
| Impacta en caja/cta.cte. 📊 | Solo operativo |
| Contable 📈 | Operativo 📦 |

---

## 📋 ARCHIVOS CREADOS

### Backend

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `Back/migrations/011_pedidos_proveedor.sql` | Migración de tablas | ✅ |
| `Back/app/models.py` | Modelos PedidoProveedor + PedidoDetalle | ✅ |
| `Back/app/api/pedidos.py` | API completa (8 endpoints) | ✅ |
| `Back/app/main.py` | Router registrado | ✅ |

### Frontend (Pendiente)

| Archivo | Descripción | Estado |
|---------|-------------|--------|
| `Front/src/services/api.ts` | Métodos de pedidos | ⏳ |
| `Front/src/pages/Pedidos.tsx` | UI completa | ⏳ |

---

## 🗄️ BASE DE DATOS

### Tabla: `pedidos_proveedor`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL | Primary Key |
| `numero_interno` | VARCHAR(20) | PED-0001 (auto) |
| `fecha_pedido` | DATE | Fecha del pedido |
| `proveedor_id` | INTEGER | FK a proveedores |
| `estado` | VARCHAR(20) | pendiente, enviado, recibido, cancelado |
| `total_estimado` | NUMERIC(12,2) | Suma de detalles |
| `observaciones` | TEXT | Notas del pedido |
| `usuario_id` | INTEGER | Usuario que creó |
| `creado_en` | TIMESTAMP | Auto |
| `recibido_en` | TIMESTAMP | Cuando se recibió |
| `fecha_entrega_estimada` | DATE | Opcional |

### Tabla: `pedido_detalles`

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL | Primary Key |
| `pedido_id` | INTEGER | FK a pedidos_proveedor |
| `producto_id` | INTEGER | FK a productos |
| `cantidad` | INTEGER | Cantidad pedida |
| `precio_costo` | NUMERIC(12,2) | Precio unitario |
| `subtotal` | NUMERIC(12,2) | cantidad × precio |
| `recibido_cantidad` | INTEGER | Para parcialidades |
| `estado` | VARCHAR(20) | pendiente, recibido, cancelado |

---

## 🔌 ENDPOINTS BACKEND

### 1. GET /api/pedidos/productos-bajo-stock
```python
"""Retorna productos con stock < stock_minimo o stock = 0"""
```

**Respuesta:**
```json
[
  {
    "id": 1,
    "nombre": "Producto A",
    "stock_actual": 5,
    "stock_minimo": 10,
    "precio_costo": 150.00,
    "proveedor_id": 1,
    "proveedor_nombre": "Proveedor SRL"
  }
]
```

### 2. POST /api/pedidos/
```python
"""Crear nuevo pedido a proveedor"""
```

**Request:**
```json
{
  "proveedor_id": 1,
  "fecha_pedido": "2026-02-23",
  "observaciones": "Pedido urgente",
  "detalles": [
    {"producto_id": 1, "cantidad": 50, "precio_costo": 150.00}
  ]
}
```

**Respuesta:**
```json
{
  "id": 1,
  "numero_interno": "PED-0001",
  "mensaje": "Pedido creado correctamente"
}
```

### 3. GET /api/pedidos/
```python
"""Listar pedidos con filtros"""
```

**Parámetros:**
- `fecha_desde`: YYYY-MM-DD
- `fecha_hasta`: YYYY-MM-DD
- `proveedor_id`: int
- `estado`: pendiente | enviado | recibido | cancelado

### 4. GET /api/pedidos/{pedido_id}
```python
"""Obtener detalle completo de un pedido"""
```

### 5. POST /api/pedidos/{pedido_id}/enviar
```python
"""Generar enlace/texto para enviar pedido"""
```

**Parámetros:**
- `medio`: whatsapp | email | texto

**Respuesta (WhatsApp):**
```json
{
  "medio": "whatsapp",
  "link": "https://wa.me/5491112345678?text=PEDIDO...",
  "texto": "*PEDIDO PED-0001*..."
}
```

### 6. POST /api/pedidos/{pedido_id}/recibir
```python
"""Marcar pedido como recibido"""
```

**Request:**
```json
{
  "actualizar_stock": true
}
```

### 7. POST /api/pedidos/{pedido_id}/cancelar
```python
"""Cancelar pedido"""
```

### 8. GET /api/pedidos/resumen/estado
```python
"""Resumen de pedidos por estado"""
```

**Respuesta:**
```json
{
  "pendiente": {"cantidad": 5, "total": 15000.00},
  "enviado": {"cantidad": 2, "total": 8000.00},
  "recibido": {"cantidad": 10, "total": 35000.00}
}
```

---

## 💻 FRONTEND - IMPLEMENTACIÓN PENDIENTE

### Service API (Front/src/services/api.ts)

```typescript
export const pedidos = {
  getProductosBajoStock: () => request('/pedidos/productos-bajo-stock'),
  
  getAll: (params?: { 
    fecha_desde?: string
    fecha_hasta?: string
    proveedor_id?: number
    estado?: string
  }) => {
    const qs = params ? new URLSearchParams(params as Record<string, string>).toString() : ''
    return request(`/pedidos/${qs ? '?' + qs : ''}`)
  },
  
  getById: (id: number) => request(`/pedidos/${id}`),
  
  create: (data: any) => request('/pedidos/', { method: 'POST', body: data }),
  
  enviar: (id: number, medio: string) => 
    request(`/pedidos/${id}/enviar`, { method: 'POST', body: { medio } }),
  
  recibir: (id: number, data: { actualizar_stock?: boolean }) => 
    request(`/pedidos/${id}/recibir`, { method: 'POST', body: data }),
  
  cancelar: (id: number) => 
    request(`/pedidos/${id}/cancelar`, { method: 'POST' }),
  
  getResumen: () => request('/pedidos/resumen/estado'),
}
```

### UI Components (Resumen)

**Pestañas:**
```
┌─────────────────────────────────────────────┐
│ [📦 Armar Pedido] [📋 Historial]            │
└─────────────────────────────────────────────┘
```

**Armar Pedido:**
- Buscador de productos
- Lista de productos con stock bajo
- Check para seleccionar
- Input de cantidad
- Resumen del pedido (total estimado)
- Botón "Generar Pedido"

**Historial:**
- Filtros por estado/proveedor/fecha
- Tabla de pedidos
- Botones: 📱 WhatsApp | ✉️ Email | ✅ Recibir

---

## 🧪 TEST CHECKLIST

| # | Test | Estado |
|---|------|--------|
| 1 | GET /api/pedidos/productos-bajo-stock → 200 OK | ✅ |
| 2 | POST /api/pedidos/ → crea pedido | ✅ |
| 3 | GET /api/pedidos/ → lista pedidos | ✅ |
| 4 | GET /api/pedidos/{id} → detalle completo | ✅ |
| 5 | POST /api/pedidos/{id}/enviar → genera link WhatsApp | ✅ |
| 6 | POST /api/pedidos/{id}/recibir → actualiza estado | ✅ |
| 7 | Backend compila sin errores | ✅ |
| 8 | Frontend service | ⏳ Pendiente |
| 9 | Frontend UI | ⏳ Pendiente |

---

## 📋 PRÓXIMOS PASOS

### Pendientes Frontend

1. **Agregar métodos en api.ts** (15 min)
   - 8 métodos para pedidos

2. **Crear Pedidos.tsx** (2-3 horas)
   - Vista "Armar Pedido"
   - Vista "Historial"
   - Modales de envío

3. **Agregar ruta en App.tsx** (5 min)
   - `<Route path="/pedidos" element={<Pedidos />} />`

4. **Agregar ítem en Sidebar** (5 min)
   - `{ path: '/pedidos', icon: ShoppingCart, label: 'Pedidos' }`

---

## 🎯 FLUJO DE USO

```
1. Usuario navega a "Pedidos"
   ↓
2. Click en "📦 Armar Pedido"
   ↓
3. Sistema muestra productos con stock bajo
   ↓
4. Usuario selecciona productos y cantidades
   ↓
5. Click "Generar Pedido" → PED-0001 creado
   ↓
6. Click "📱 Enviar por WhatsApp" → abre wa.me
   ↓
7. Proveedor recibe pedido
   ↓
8. Cuando llega mercadería: Click "✅ Recibir"
   ↓
9. Opcional: Actualizar stock automáticamente
```

---

## ✅ ESTADO ACTUAL

**Backend:** 100% completo
- ✅ Tablas en BD
- ✅ Modelos SQLAlchemy
- ✅ API con 8 endpoints
- ✅ Router registrado

**Frontend:** 0% completo
- ⏳ Service API
- ⏳ UI Components
- ⏳ Rutas

---

**Módulo Pedidos a Proveedores listo para integración con Frontend.**

El backend está completamente funcional y probado. Solo falta implementar la UI del frontend para tener el módulo completo.
