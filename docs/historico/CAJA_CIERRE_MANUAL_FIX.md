# 🚨 FIX: Cierre Manual de Cajas Abiertas (Emergencia)

## PROBLEMA
Hay cajas abiertas que no se pueden cerrar desde el frontend debido a errores en el servicio (`getMovimientosDeCaja is not a function`). Esto impide exportar backups.

---

## SOLUCIONES IMPLEMENTADAS

### 1️⃣ Backend: Nuevos Endpoints de Emergencia

**Archivo:** `Back/app/api/caja.py`

#### Endpoint 1: Listar cajas abiertas
```
GET /api/caja/abiertas
```
Devuelve todas las cajas abiertas con su saldo teórico calculado.

**Response:**
```json
[
  {
    "id": 1,
    "fecha": "2024-03-04",
    "saldo_inicial": 1000,
    "saldo_teorico": 1500,
    "estado": "abierto",
    "usuario_id": 1,
    "fecha_apertura": "2024-03-04T10:00:00",
    "cantidad_movimientos": 5
  }
]
```

#### Endpoint 2: Cerrar caja manualmente
```
POST /api/caja/cerrar-manual/{caja_id}
```
Cierra una caja específica calculando automáticamente el saldo teórico.

**Response:**
```json
{
  "message": "Caja cerrada manualmente",
  "caja_id": 1,
  "saldo_final": 1500,
  "fecha_cierre": "2024-03-04T18:00:00"
}
```

---

### 2️⃣ Frontend: Nuevos Métodos en Servicio Caja

**Archivo:** `Front/src/services/api.ts`

```typescript
caja.getCajasAbiertas()      // Lista cajas abiertas
caja.cerrarCajaManual(id)    // Cierra caja manualmente
```

---

### 3️⃣ Frontend: Botón de Emergencia en UI

**Archivo:** `Front/src/pages/Caja.tsx`

Se agregó un botón **"Cerrar manual"** (rojo) en la columna "Acciones" del historial de cajas, que solo aparece para cajas con estado `abierto`.

**Funcionalidad:**
- Muestra confirmación con datos de la caja
- Calcula saldo teórico automáticamente
- Cierra la caja con un click
- Recarga la lista automáticamente

---

### 4️⃣ Script SQL Manual (Opción Alternativa)

**Archivo:** `Back/scripts/cerrar_cajas_manual.sql`

Para casos extremos donde no se pueda usar el frontend:

```sql
-- Ver cajas abiertas
SELECT id, fecha, saldo_inicial, estado FROM caja_dia WHERE estado = 'abierto';

-- Cerrar todas las cajas abiertas (saldo_final = saldo_inicial)
UPDATE caja_dia
SET estado = 'cerrado',
    saldo_final = saldo_inicial,
    fecha_cierre = NOW(),
    observaciones_cierre = 'Cierre manual desde SQL'
WHERE estado = 'abierto';
```

---

## 📋 PASOS PARA CERRAR CAJAS AHORA

### Opción A: Desde el Frontend (Recomendado)

1. **Ir al módulo Caja** en el sistema
2. **Pestaña "Historial de Cajas"**
3. **Identificar cajas con estado "✅ Abierta"**
4. **Click en "Cerrar manual"** (botón rojo con ícono de alerta)
5. **Confirmar** el cierre manual
6. **Verificar** que aparezca el mensaje "✅ Caja cerrada manualmente"
7. **Recargar** página Backup para verificar que dice "Todas las cajas cerradas"

### Opción B: Desde SQL (Solo Admin DB)

1. Abrir pgAdmin o cliente PostgreSQL
2. Conectar a la base de datos
3. Ejecutar script: `Back/scripts/cerrar_cajas_manual.sql`
4. Verificar resultado
5. Recargar página Backup

---

## 🧪 TESTING

```
1. Ir a Caja → Historial de Cajas
2. ¿Hay cajas con estado "✅ Abierta"? 
3. Click en "Cerrar manual" de una caja
4. ¿Confirmación aparece? ✅
5. ¿Caja se cierra sin errores? ✅
6. ¿Estado cambia a "🔒 Cerrada"? ✅
7. Ir a Backup → ¿Banner verde "Todas las cajas cerradas"? ✅
8. Click en "Exportar Backup" → ¿Funciona? ✅
```

---

## 📝 NOTAS TÉCNICAS

### Modelo CajaDia (Backend)
```python
class CajaDia(Base):
    __tablename__ = "caja_dia"
    
    id = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False, unique=True)
    saldo_inicial = Column(Numeric(12,2), default=0)
    saldo_final = Column(Numeric(12,2))
    estado = Column(String(20), default="abierto")  # "abierto" | "cerrado"
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_apertura = Column(DateTime, server_default=func.now())
    fecha_cierre = Column(DateTime)
    observaciones_cierre = Column(Text)
```

### Cálculo del Saldo Teórico
```python
saldo_teorico = saldo_inicial + total_ingresos - total_egresos
```

El cierre manual:
- ✅ Calcula automáticamente el saldo teórico
- ✅ Registra el cierre con observaciones
- ✅ No requiere ingresar el saldo final manualmente
- ✅ Es seguro (valida que la caja esté abierta)

---

## ⚠️ ADVERTENCIAS

1. **Usar solo en emergencias** cuando el cierre normal falla
2. **Verificar movimientos** antes de cerrar (usar "Ver movimientos")
3. **El saldo se calcula automáticamente** - revisar que sea correcto
4. **Queda registrado** en `observaciones_cierre` que fue cierre manual

---

## ARCHIVOS MODIFICADOS

| Archivo | Cambios |
|---------|---------|
| `Back/app/api/caja.py` | +2 endpoints de emergencia |
| `Front/src/services/api.ts` | +2 métodos en servicio `caja` |
| `Front/src/pages/Caja.tsx` | +Función `cerrarCajaManual()` + botón en UI |
| `Back/scripts/cerrar_cajas_manual.sql` | Script SQL alternativo (nuevo) |

---

**Fecha:** 2024-03-04  
**Autor:** Fix de Emergencia - Cierre de Cajas  
**Estado:** ✅ Implementado y listo para usar
