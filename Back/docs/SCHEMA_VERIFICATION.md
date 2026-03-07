# 📋 SISTEMA DE VERIFICACIÓN DE ESQUEMA

## Descripción

Este sistema verifica automáticamente que la base de datos tenga todas las tablas y columnas definidas en los modelos SQLAlchemy al iniciar el backend.

## Componentes

### 1. `app/database.py`

Funciones principales:

- **`verify_schema()`**: Escanea la BD y compara con los modelos
- **`generate_migration_sql(issues)`**: Genera SQL de migración automático

### 2. `app/main.py`

Al startup, el backend:
1. Verifica el esquema de la BD
2. Muestra advertencias si faltan columnas
3. Genera SQL de migración automáticamente
4. **NO crashée** - solo advierte (para desarrollo)

### 3. `scripts/check_db_schema.py`

Script utilitario para verificar manualmente.

## Uso

### Opción 1: Automático (al iniciar backend)

```bash
cd "d:\CBA 4.0\AymaraContable\Back"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verás en la consola:
```
🚀 Iniciando Aymara Contable API...
🔍 Verificando esquema de base de datos...
✅ Esquema de base de datos verificado correctamente
```

O si hay problemas:
```
🚀 Iniciando Aymara Contable API...
🔍 Verificando esquema de base de datos...
⚠️  PROBLEMAS DE ESQUEMA DETECTADOS:
  ❌ Columnas faltantes en compras: anulado_por, fecha_anulacion
💡 SQL de migración generado:
ALTER TABLE compras ADD COLUMN IF NOT EXISTS anulado_por INTEGER REFERENCES usuarios(id);
...
```

### Opción 2: Manual (script utilitario)

```bash
cd "d:\CBA 4.0\AymaraContable\Back"
.\venv\Scripts\Activate
python scripts\check_db_schema.py
```

Salida de ejemplo:
```
======================================================================
 🔍 VERIFICADOR DE ESQUEMA - AYMARA CONTABLE
======================================================================

📊 Base de datos: localhost:5432/sistema_contable

1. VERIFICANDO ESQUEMA...
----------------------------------------------------------------------

2. RESULTADOS:
----------------------------------------------------------------------
❌ COLUMNAS FALTANTES:

   📋 Tabla: compras
      • anulado_por
      • fecha_anulacion
      • motivo_anulacion

3. SQL DE MIGRACIÓN:
----------------------------------------------------------------------
ALTER TABLE compras ADD COLUMN IF NOT EXISTS anulado_por INTEGER REFERENCES usuarios(id);
ALTER TABLE compras ALTER COLUMN anulado_por DROP NOT NULL;
...

4. ARCHIVO GUARDADO:
----------------------------------------------------------------------
💾 SQL guardado en: Back\migrations\auto_generated_migration.sql

💡 Para aplicar las migraciones:
   1. Abrir pgAdmin
   2. Conectar a la base de datos
   3. Abrir Query Tool
   4. Copiar y pegar el contenido
   5. Ejecutar
   6. Reiniciar el backend
```

## Flujo de Trabajo Recomendado

### Al agregar un nuevo campo al modelo:

1. **Agregar columna al modelo** (`app/models.py`):
   ```python
   class Compra(Base):
       nuevo_campo = Column(String(100))
   ```

2. **Reiniciar backend**:
   ```bash
   # Ctrl+C para detener
   python -m uvicorn app.main:app --reload
   ```

3. **Verificar advertencias** en la consola del backend

4. **Ejecutar script manual** (opcional):
   ```bash
   python scripts\check_db_schema.py
   ```

5. **Ejecutar migración** en pgAdmin:
   - Abrir el SQL generado en `migrations/auto_generated_migration.sql`
   - Copiar y pegar en Query Tool
   - Ejecutar

6. **Reiniciar backend** para verificar

7. **Confirmar** que dice "✅ Esquema verificado correctamente"

## Archivos Generados

### `migrations/auto_generated_migration.sql`

SQL auto-generado listo para ejecutar. Incluye:
- Comentarios con fecha de generación
- ALTER TABLE para agregar columnas
- ALTER TABLE para modificar NULL/NOT NULL
- Foreign keys si corresponde

### `migrations/006_add_costo_anterior.sql`
### `migrations/007_add_anulacion_fields.sql`

Migraciones manuales específicas (crear cuando sea necesario).

## Ventajas

✅ **Detección temprana**: Errores se detectan al iniciar, no en producción
✅ **No crashée**: Solo advierte, permite desarrollo ágil
✅ **SQL automático**: Genera migraciones listas para usar
✅ **Documentación**: Logs claros de qué falta y por qué
✅ **Manual + Auto**: Funciona al startup o como script separado

## Consideraciones

⚠️ **Solo para desarrollo**: En producción, usar migraciones formales (Alembic)
⚠️ **No crea tablas**: Solo agrega columnas a tablas existentes
⚠️ **Revisar SQL**: Siempre revisar el SQL generado antes de ejecutar

## Troubleshooting

### Error: "No se pudo conectar a la BD"
- Verificar que PostgreSQL esté corriendo
- Verificar credenciales en `.env`

### Error: "Permission denied"
- Ejecutar pgAdmin como administrador
- Verificar permisos del usuario de BD

### El script no detecta cambios
- Reiniciar Python (puede cachear modelos)
- Verificar que los modelos estén importados en `app/models.py`

## Ejemplo Real

**Problema**: Error 500 en `/api/fc-compra/`

**Solución**:
```bash
# 1. Ver consola del backend
⚠️  PROBLEMAS DE ESQUEMA DETECTADOS:
  ❌ Columnas faltantes en compras: anulado_por

# 2. Ejecutar script
python scripts\check_db_schema.py

# 3. Copiar SQL generado
ALTER TABLE compras ADD COLUMN IF NOT EXISTS anulado_por INTEGER REFERENCES usuarios(id);

# 4. Ejecutar en pgAdmin

# 5. Reiniciar backend
✅ Esquema de base de datos verificado correctamente

# 6. Probar endpoint
GET /api/fc-compra/ → 200 OK ✅
```
