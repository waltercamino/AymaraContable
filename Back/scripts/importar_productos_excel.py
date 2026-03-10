"""
Script para importar productos desde Excel
Validaciones:
1. categoria_id = 2 existe (Cereales)
2. proveedor_id = 1 existe
3. sku no duplicado
4. unidad_medida válido (GRAMO, KILO, BOLSA_XKILO)
"""

import pandas as pd
import sys
from sqlalchemy import create_engine, text
from datetime import datetime
from decimal import Decimal

# Configuración
DATABASE_URL = "postgresql://postgres@localhost:5432/sistema_contable"
UNIDADES_VALIDAS = ["GRAMO", "KILO", "BOLSA_XKILO"]
CATEGORIA_ID = 2
PROVEEDOR_ID = 1

def conectar():
    """Crear conexión a la BD"""
    engine = create_engine(DATABASE_URL)
    return engine

def validar_datos(engine, df: pd.DataFrame) -> list:
    """Validar datos del Excel y retornar lista de errores"""
    errores = []
    
    # 1. Verificar categoria_id = 2 existe
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre FROM categorias WHERE id = :id"), {"id": CATEGORIA_ID})
        categoria = result.fetchone()
        if not categoria:
            errores.append(f"❌ ERROR GENERAL: La categoría ID={CATEGORIA_ID} no existe en la BD")
            return errores
        print(f"✓ Categoría verificada: ID={categoria.id}, Nombre='{categoria.nombre}'")
    
    # 2. Verificar proveedor_id = 1 existe
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre FROM proveedores WHERE id = :id"), {"id": PROVEEDOR_ID})
        proveedor = result.fetchone()
        if not proveedor:
            errores.append(f"❌ ERROR GENERAL: El proveedor ID={PROVEEDOR_ID} no existe en la BD")
            return errores
        print(f"✓ Proveedor verificado: ID={proveedor.id}, Nombre='{proveedor.nombre}'")
    
    # 3. Verificar SKUs duplicados en la BD
    skus_excel = df['sku'].dropna().astype(str).tolist()
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT sku FROM productos WHERE sku = ANY(:skus)"),
            {"skus": skus_excel}
        )
        skus_existentes = [row[0] for row in result.fetchall()]
        if skus_existentes:
            for sku in skus_existentes:
                filas = df[df['sku'].astype(str) == sku].index.tolist()
                errores.append(f"❌ Filas {filas}: SKU '{sku}' ya existe en la BD")
    
    # 4. Verificar SKUs duplicados en el Excel
    skus_counts = df['sku'].value_counts()
    duplicados = skus_counts[skus_counts > 1]
    for sku, count in duplicados.items():
        filas = df[df['sku'] == sku].index.tolist()
        errores.append(f"❌ Filas {filas}: SKU '{sku}' duplicado en el Excel ({count} veces)")
    
    # 5. Verificar unidad_medida válida
    for idx, row in df.iterrows():
        unidad = str(row.get('unidad_medida', '')).upper().strip()
        if unidad not in UNIDADES_VALIDAS:
            errores.append(f"❌ Fila {idx}: unidad_medida '{row.get('unidad_medida')}' no es válida. Debe ser: {UNIDADES_VALIDAS}")
    
    # 6. Verificar campos obligatorios
    campos_obligatorios = ['sku', 'nombre', 'unidad_medida', 'precio_venta', 'costo_promedio']
    for idx, row in df.iterrows():
        for campo in campos_obligatorios:
            valor = row.get(campo)
            if pd.isna(valor) or str(valor).strip() == '':
                errores.append(f"❌ Fila {idx}: Campo obligatorio '{campo}' está vacío")
    
    return errores

def importar_productos(engine, df: pd.DataFrame):
    """Importar productos validados a la BD"""
    productos_importados = []
    
    with engine.connect() as conn:
        for idx, row in df.iterrows():
            try:
                # Preparar datos
                producto = {
                    'sku': str(row.get('sku', '')).strip(),
                    'nombre': str(row.get('nombre', '')).strip(),
                    'categoria_id': CATEGORIA_ID,
                    'proveedor_id': PROVEEDOR_ID,
                    'unidad_medida': str(row.get('unidad_medida', 'GRAMO')).upper().strip(),
                    'stock_actual': float(row.get('stock_actual', 0)) if not pd.isna(row.get('stock_actual')) else 0,
                    'stock_minimo': float(row.get('stock_minimo', 0)) if not pd.isna(row.get('stock_minimo')) else 0,
                    'costo_promedio': float(row.get('costo_promedio', 0)) if not pd.isna(row.get('costo_promedio')) else 0,
                    'precio_venta': float(row.get('precio_venta', 0)) if not pd.isna(row.get('precio_venta')) else 0,
                    'precio_venta_mayorista': float(row.get('precio_venta_mayorista', 0)) if not pd.isna(row.get('precio_venta_mayorista')) else 0,
                    'iva_compra': bool(row.get('iva_compra', False)),
                    'iva_venta': bool(row.get('iva_venta', False)),
                    'mostrar_precio_kilo': bool(row.get('mostrar_precio_kilo', False)),
                    'activo': True
                }
                
                # Insertar
                conn.execute(text("""
                    INSERT INTO productos (
                        sku, nombre, categoria_id, proveedor_id, unidad_medida,
                        stock_actual, stock_minimo, costo_promedio, precio_venta,
                        precio_venta_mayorista, iva_compra, iva_venta, mostrar_precio_kilo, activo
                    ) VALUES (
                        :sku, :nombre, :categoria_id, :proveedor_id, :unidad_medida,
                        :stock_actual, :stock_minimo, :costo_promedio, :precio_venta,
                        :precio_venta_mayorista, :iva_compra, :iva_venta, :mostrar_precio_kilo, :activo
                    )
                """), producto)
                
                productos_importados.append(f"✓ SKU={producto['sku']}, Nombre={producto['nombre']}")
                
            except Exception as e:
                print(f"❌ Error importando fila {idx}: {e}")
                raise
        
        conn.commit()
    
    return productos_importados

def main():
    if len(sys.argv) < 2:
        print("Uso: python importar_productos_excel.py <ruta_archivo.xlsx>")
        print("Ejemplo: python importar_productos_excel.py uploads/productos_cereales.xlsx")
        sys.exit(1)
    
    archivo_excel = sys.argv[1]
    
    print("=" * 60)
    print("IMPORTACIÓN DE PRODUCTOS - CEREALES")
    print("=" * 60)
    print(f"Archivo: {archivo_excel}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Leer Excel
    try:
        df = pd.read_excel(archivo_excel)
        print(f"✓ Archivo leído: {len(df)} filas encontradas")
    except Exception as e:
        print(f"❌ Error leyendo el archivo: {e}")
        sys.exit(1)
    
    # Normalizar columnas (minúsculas, sin espacios)
    df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
    
    print(f"\nColumnas encontradas: {list(df.columns)}")
    print("\n" + "-" * 60)
    print("VALIDACIONES")
    print("-" * 60)
    
    # Conectar a BD
    try:
        engine = conectar()
        print("✓ Conexión a BD exitosa")
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        sys.exit(1)
    
    # Validar datos
    errores = validar_datos(engine, df)
    
    if errores:
        print("\n" + "=" * 60)
        print("ERRORES ENCONTRADOS - NO SE REALIZA LA IMPORTACIÓN")
        print("=" * 60)
        for error in errores:
            print(error)
        print("=" * 60)
        sys.exit(1)
    
    print("\n✓ Todas las validaciones pasaron correctamente")
    print("\n" + "-" * 60)
    print("IMPORTANDO PRODUCTOS")
    print("-" * 60)
    
    # Importar
    try:
        importados = importar_productos(engine, df)
        print("\n" + "=" * 60)
        print("IMPORTACIÓN EXITOSA")
        print("=" * 60)
        for prod in importados:
            print(prod)
        print("=" * 60)
        print(f"Total: {len(importados)} productos importados")
    except Exception as e:
        print(f"\n❌ Error durante la importación: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
