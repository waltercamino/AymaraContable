# FEATURE: Login - Mostrar Alerta si hay Caja Abierta del Usuario

## ✅ IMPLEMENTACIÓN COMPLETADA

### OBJETIVO
Al loguearse exitosamente, verificar si el usuario tiene cajas abiertas y mostrar alerta para continuar o cerrar.

---

## CAMBIOS REALIZADOS

### 1. **Login.tsx** - Modal de Alerta Mejorado

**Archivo:** `Front/src/pages/Login.tsx`

#### Mejoras implementadas:

- **Mensaje claro con cantidad y tiempo:**
  ```
  ⚠️ Tenés [X] caja(s) abierta(s)
  Desde [DD/MM/AAAA HH:MM] ([tiempo transcurrido])
  ```

- **Función `calcularTiempoTranscurrido()`:** Muestra el tiempo desde la apertura:
  - Ej: "2 día(s) y 3 hora(s)" o "5 hora(s) y 30 minuto(s)" o "45 minuto(s)"

- **Tres botones de acción:**
  1. **🔄 Continuar turno** → Redirige a `/caja` para continuar trabajando
  2. **🛑 Cerrar con arqueo** → Redirige a `/caja` para cerrar con arqueo
  3. **⏰ Ver más tarde** → Cierra modal e ir al dashboard (mantiene alerta en Header)

- **Manejo de múltiples cajas:** Si hay más de una caja abierta, se gestionan una por una

---

### 2. **Header.tsx** - Ícono de Alerta en Header

**Archivo:** `Front/src/components/Layout/Header.tsx`

#### Mejoras implementadas:

- **Ícono de alerta (🔔 AlertTriangle):** Se muestra cuando hay cajas pendientes en `sessionStorage`
- **Badge con cantidad:** Muestra el número de cajas abiertas en un círculo rojo
- **Animación pulse:** Llama la atención del usuario
- **Click para ir a Caja:** Al hacer click, redirige a `/caja`
- **Tooltip informativo:** "Tenés X caja(s) abierta(s) - Click para ir a Caja"

---

### 3. **useAuth.ts** - Ya implementado (sin cambios)

**Archivo:** `Front/src/hooks/useAuth.ts`

El hook ya tenía toda la lógica necesaria:
- ✅ Detecta cajas abiertas en el login
- ✅ Guarda en `sessionStorage` (`cajas_abiertas_login`)
- ✅ Provee `registrarRecuperacionCaja()` para registrar la acción del usuario
- ✅ Provee `limpiarCajasAbiertas()` para limpiar después de gestionar

---

### 4. **Backend API** - Ya implementado (sin cambios)

**Archivo:** `Back/app/api/caja.py`

Endpoints utilizados:
- `POST /api/caja/registrar-recuperacion?caja_id={id}&accion={accion}` - Registra la acción
- `GET /api/caja/abiertas` - Lista cajas abiertas (Admin)

---

## FLUJO DE USO

### Escenario 1: Usuario con Caja Abierta

1. Usuario se loguea → Backend devuelve `cajas_abiertas: [...]`
2. `useAuth` guarda cajas en `sessionStorage`
3. Login muestra **modal de alerta** (NO redirige al dashboard)
4. Usuario ve: "⚠️ Tenés 1 caja(s) abierta(s) desde 06/03/2026 08:30 (2 hora(s) y 15 minuto(s))"
5. Usuario elige una opción:
   - **Continuar turno** → Va a `/caja` para seguir trabajando
   - **Cerrar con arqueo** → Va a `/caja` para cerrar
   - **Ver más tarde** → Va al dashboard, pero ve ícono de alerta en Header

### Escenario 2: Usuario sin Caja Abierta

1. Usuario se loguea → Backend devuelve `cajas_abiertas: []`
2. Login redirige directamente al dashboard
3. **Sin modal, sin alerta** → Flujo normal sin interrupciones

---

## TESTING

### Casos de prueba:

| # | Caso | Resultado Esperado |
|---|------|-------------------|
| 1 | Abrir caja → Cerrar navegador → Reiniciar → Loguearse | ✅ Aparece modal de alerta |
| 2 | Click en "Continuar turno" | ✅ Redirige a `/caja` |
| 3 | Click en "Cerrar con arqueo" | ✅ Redirige a `/caja` |
| 4 | Click en "Ver más tarde" | ✅ Cierra modal, va al dashboard, muestra ícono en Header |
| 5 | Usuario sin cajas abiertas → Login | ✅ Login normal sin modal |
| 6 | Múltiples cajas abiertas | ✅ Se gestionan una por una |

---

## COMPONENTES REUTILIZADOS

- ✅ **Modales:** Se usa el mismo sistema de modal nativo (sin librerías extra)
- ✅ **Toast:** `react-toastify` ya configurado en el proyecto
- ✅ **Estilos:** Tailwind CSS existente
- ✅ **Iconos:** `lucide-react` (AlertTriangle)

---

## PROTECCIÓN DEL FLUJO EXISTENTE

- ✅ **No afecta login sin cajas:** Usuarios sin cajas pendientes ven el login normal
- ✅ **No afecta permisos:** La validación de permisos se mantiene
- ✅ **No afecta dashboard:** Solo muestra alerta si hay cajas pendientes
- ✅ **Backward compatible:** Funciona con versiones anteriores del backend

---

## ARCHIVOS MODIFICADOS

1. `Front/src/pages/Login.tsx` - Modal mejorado + redirección
2. `Front/src/components/Layout/Header.tsx` - Ícono de alerta

---

## PRÓXIMOS PASOS (OPCIONALES)

- [ ] Agregar toast notification cuando el usuario llega a Caja desde el login
- [ ] Permitir cerrar todas las cajas pendientes desde el Header (admin)
- [ ] Agregar sonido de alerta opcional
- [ ] Historial de cajas recuperadas por usuario

---

**Fecha de implementación:** 06/03/2026  
**Estado:** ✅ COMPLETADO Y TESTEADO  
**Build:** ✅ Sin errores
