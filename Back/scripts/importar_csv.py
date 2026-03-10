"""
Importar productos desde CSV
Validaciones:
1. categoria_id existe
2. proveedor_id existe
3. sku no duplicado en BD
4. unidad_medida válido
"""

import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime

# Configuración
DATABASE_URL = "postgresql://postgres@localhost:5432/sistema_contable"
UNIDADES_VALIDAS = ["GRAMO", "KILO", "BOLSA_XKILO", "UNIDAD", "LITRO", "ML"]

def conectar():
    engine = create_engine(DATABASE_URL)
    return engine

def leer_csv(archivo_csv):
    """Leer CSV y retornar DataFrame"""
    df = pd.read_csv(archivo_csv, encoding='utf-8')
    
    # Normalizar columnas
    df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
    
    return df

def validar_datos(engine, df: pd.DataFrame, categoria_id: int, proveedor_id: int) -> list:
    errores = []
    
    # 1. Verificar categoria existe
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre FROM categorias WHERE id = :id"), {"id": categoria_id})
        categoria = result.fetchone()
        if not categoria:
            errores.append(f"❌ ERROR GENERAL: Categoría ID={categoria_id} no existe")
            return errores
        print(f"✓ Categoría: ID={categoria.id}, Nombre='{categoria.nombre}'")
    
    # 2. Verificar proveedor existe
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre FROM proveedores WHERE id = :id"), {"id": proveedor_id})
        proveedor = result.fetchone()
        if not proveedor:
            errores.append(f"❌ ERROR GENERAL: Proveedor ID={proveedor_id} no existe")
            return errores
        print(f"✓ Proveedor: ID={proveedor.id}, Nombre='{proveedor.nombre}'")
    
    # 3. SKUs duplicados en BD
    skus_excel = df['sku'].dropna().astype(str).str.strip().tolist()
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT sku FROM productos WHERE sku = ANY(:skus)"),
            {"skus": skus_excel}
        )
        skus_existentes = [row[0] for row in result.fetchall()]
        if skus_existentes:
            for sku in skus_existentes:
                filas = df[df['sku'].str.strip() == sku].index.tolist()
                errores.append(f"❌ Filas {filas}: SKU '{sku}' ya existe en BD")
    
    # 4. SKUs duplicados en CSV
    skus_counts = df['sku'].str.strip().value_counts()
    duplicados = skus_counts[skus_counts > 1]
    for sku, count in duplicados.items():
        filas = df[df['sku'].str.strip() == sku].index.tolist()
        errores.append(f"❌ Filas {filas}: SKU '{sku}' duplicado en CSV ({count} veces)")
    
    # 5. unidad_medida válida
    for idx, row in df.iterrows():
        unidad = str(row.get('unidad_medida', '')).upper().strip()
        if unidad not in UNIDADES_VALIDAS:
            errores.append(f"❌ Fila {idx}: unidad_medida '{unidad}' inválida. Válidas: {UNIDADES_VALIDAS}")
    
    # 6. Campos obligatorios
    for idx, row in df.iterrows():
        for campo in ['sku', 'nombre', 'unidad_medida']:
            valor = str(row.get(campo, '')).strip()
            if not valor or valor.upper() == 'NAN':
                errores.append(f"❌ Fila {idx}: Campo '{campo}' vacío")
    
    return errores

def calcular_precio_venta(row):
    try:
        costo = float(row.get('costo_promedio', 0))
        margen = float(row.get('margen_personalizado', 0.70))
        return round(costo * (1 + margen), 2)
    except:
        return 0

def calcular_precio_mayorista(row):
    try:
        costo = float(row.get('costo_promedio', 0))
        margen = float(row.get('margen_personalizado_mayorista', 0.30))
        return round(costo * (1 + margen), 2)
    except:
        return 0

def importar_productos(engine, df: pd.DataFrame, categoria_id: int, proveedor_id: int):
    productos_importados = []
    
    with engine.connect() as conn:
        for idx, row in df.iterrows():
            producto = {
                'sku': str(row.get('sku', '')).strip(),
                'nombre': str(row.get('nombre', '')).strip(),
                'categoria_id': categoria_id,
                'proveedor_id': proveedor_id,
                'unidad_medida': str(row.get('unidad_medida', 'GRAMO')).upper().strip(),
                'stock_actual': 0,
                'stock_minimo': float(row.get('stock_minimo', 1000)) if row.get('stock_minimo') else 1000,
                'costo_promedio': float(row.get('costo_promedio', 0)),
                'margen_personalizado': float(row.get('margen_personalizado', 0.70)),
                'margen_personalizado_mayorista': float(row.get('margen_personalizado_mayorista', 0.30)),
                'precio_venta': calcular_precio_venta(row),
                'precio_venta_mayorista': calcular_precio_mayorista(row),
                'iva_compra': False,
                'iva_venta': False,
                'mostrar_precio_kilo': str(row.get('mostrar_precio_kilo', 'False')).upper() == 'TRUE',
                'activo': True
            }
            
            conn.execute(text("""
                INSERT INTO productos (
                    sku, nombre, categoria_id, proveedor_id, unidad_medida,
                    stock_actual, stock_minimo, costo_promedio,
                    margen_personalizado, margen_personalizado_mayorista,
                    precio_venta, precio_venta_mayorista,
                    iva_compra, iva_venta, mostrar_precio_kilo, activo
                ) VALUES (
                    :sku, :nombre, :categoria_id, :proveedor_id, :unidad_medida,
                    :stock_actual, :stock_minimo, :costo_promedio,
                    :margen_personalizado, :margen_personalizado_mayorista,
                    :precio_venta, :precio_venta_mayorista,
                    :iva_compra, :iva_venta, :mostrar_precio_kilo, :activo
                )
            """), producto)
            
            productos_importados.append(producto)
        
        conn.commit()
    
    return productos_importados

def main(archivo_csv, categoria_id=5, proveedor_id=1):
    print("=" * 70)
    print("IMPORTACIÓN DE PRODUCTOS DESDE CSV")
    print("=" * 70)
    print(f"Archivo: {archivo_csv}")
    print(f"Categoría ID: {categoria_id}")
    print(f"Proveedor ID: {proveedor_id}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Leer CSV
    print("\nLeyendo CSV...")
    try:
        df = leer_csv(archivo_csv)
        print(f"✓ {len(df)} productos encontrados")
    except Exception as e:
        print(f"❌ Error leyendo CSV: {e}")
        return False
    
    print("\n" + "-" * 70)
    print("DATOS A IMPORTAR")
    print("-" * 70)
    print(df.to_string(index=True))
    
    # Conectar
    print("\n" + "-" * 70)
    print("CONEXIÓN A BASE DE DATOS")
    print("-" * 70)
    try:
        engine = conectar()
        print("✓ Conexión exitosa")
    except Exception as e:
        print(f"❌ Error conectando a BD: {e}")
        return False
    
    # Validar
    print("\n" + "-" * 70)
    print("VALIDACIONES")
    print("-" * 70)
    errores = validar_datos(engine, df, categoria_id, proveedor_id)
    
    if errores:
        print("\n" + "=" * 70)
        print("❌ ERRORES ENCONTRADOS - NO SE REALIZA LA IMPORTACIÓN")
        print("=" * 70)
        for error in errores:
            print(error)
        print("=" * 70)
        return False
    
    print("\n✓ Todas las validaciones pasaron")
    
    # Importar
    print("\n" + "-" * 70)
    print("IMPORTANDO PRODUCTOS")
    print("-" * 70)
    
    try:
        productos = importar_productos(engine, df, categoria_id, proveedor_id)
        
        print("\n" + "=" * 70)
        print("✅ IMPORTACIÓN EXITOSA")
        print("=" * 70)
        for p in productos:
            print(f"✓ SKU={p['sku']}, {p['nombre']}, Costo=${p['costo_promedio']}, Margen={p['margen_personalizado']*100:.0f}%, PV=${p['precio_venta']}")
        print("=" * 70)
        print(f"Total: {len(productos)} productos importados")
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante la importación: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Uso: python importar_csv.py <archivo.csv> [categoria_id] [proveedor_id]")
        print("Ejemplo: python importar_csv.py especias_test.csv 5 1")
        sys.exit(1)
    
    archivo = sys.argv[1]
    cat_id = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    prov_id = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    
    success = main(archivo, cat_id, prov_id)
    exit(0 if success else 1)
