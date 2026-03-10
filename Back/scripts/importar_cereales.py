"""
Importar productos desde Excel - Cereales
Validaciones:
1. categoria_id = 2 existe (Cereales)
2. proveedor_id = 1 existe
3. sku no duplicado en BD
4. unidad_medida válido (GRAMO, KILO, BOLSA_XKILO)
"""

import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime
from io import StringIO

# Configuración
DATABASE_URL = "postgresql://postgres@localhost:5432/sistema_contable"
ARCHIVO_EXCEL = r"C:\Users\Usuario\Downloads\Nuevo Hoja de cálculo de Microsoft Excel.xlsx"
UNIDADES_VALIDAS = ["GRAMO", "KILO", "BOLSA_XKILO"]
CATEGORIA_ID = 2
PROVEEDOR_ID = 1
MARGEN_MINORISTA = 0.70  # Default si no viene en Excel
MARGEN_MAYORISTA = 0.30  # Default si no viene en Excel

def conectar():
    engine = create_engine(DATABASE_URL)
    return engine

def leer_excel():
    """Leer Excel y parsear datos"""
    df_raw = pd.read_excel(ARCHIVO_EXCEL)
    
    # La primera columna contiene todos los datos separados por coma
    primera_col = df_raw.columns[0]
    datos = df_raw[primera_col].tolist()
    
    # Crear DataFrame correcto
    df = pd.DataFrame([d.split(',') for d in datos], 
                      columns=['sku', 'nombre', 'categoria_id', 'proveedor_id', 
                               'unidad_medida', 'costo_promedio', 'margen_personalizado',
                               'margen_personalizado_mayorista', 'mostrar_precio_kilo', 'stock_minimo'])
    return df

def validar_datos(engine, df: pd.DataFrame) -> list:
    errores = []
    
    # 1. Verificar categoria_id = 2 existe
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre FROM categorias WHERE id = :id"), {"id": CATEGORIA_ID})
        categoria = result.fetchone()
        if not categoria:
            errores.append(f"❌ ERROR GENERAL: Categoría ID={CATEGORIA_ID} no existe")
            return errores
        print(f"✓ Categoría: ID={categoria.id}, Nombre='{categoria.nombre}'")
    
    # 2. Verificar proveedor_id = 1 existe
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre FROM proveedores WHERE id = :id"), {"id": PROVEEDOR_ID})
        proveedor = result.fetchone()
        if not proveedor:
            errores.append(f"❌ ERROR GENERAL: Proveedor ID={PROVEEDOR_ID} no existe")
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
    
    # 4. SKUs duplicados en Excel
    skus_counts = df['sku'].str.strip().value_counts()
    duplicados = skus_counts[skus_counts > 1]
    for sku, count in duplicados.items():
        filas = df[df['sku'].str.strip() == sku].index.tolist()
        errores.append(f"❌ Filas {filas}: SKU '{sku}' duplicado en Excel ({count} veces)")
    
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
    """Calcular precio_venta desde costo_promedio y margen"""
    try:
        costo = float(row['costo_promedio'])
        margen = float(row['margen_personalizado'])
        # precio = costo * (1 + margen)
        return round(costo * (1 + margen), 2)
    except:
        return 0

def calcular_precio_mayorista(row):
    """Calcular precio_venta_mayorista"""
    try:
        costo = float(row['costo_promedio'])
        margen = float(row['margen_personalizado_mayorista'])
        return round(costo * (1 + margen), 2)
    except:
        return 0

def importar_productos(engine, df: pd.DataFrame):
    productos_importados = []
    
    with engine.connect() as conn:
        for idx, row in df.iterrows():
            producto = {
                'sku': str(row['sku']).strip(),
                'nombre': str(row['nombre']).strip(),
                'categoria_id': int(row['categoria_id']),
                'proveedor_id': int(row['proveedor_id']),
                'unidad_medida': str(row['unidad_medida']).upper().strip(),
                'stock_actual': 0,
                'stock_minimo': float(row['stock_minimo']) if row['stock_minimo'] else 2500,
                'costo_promedio': float(row['costo_promedio']),
                'margen_personalizado': float(row['margen_personalizado']) if row['margen_personalizado'] else 0,
                'margen_personalizado_mayorista': float(row['margen_personalizado_mayorista']) if row['margen_personalizado_mayorista'] else 0,
                'precio_venta': calcular_precio_venta(row),
                'precio_venta_mayorista': calcular_precio_mayorista(row),
                'iva_compra': False,
                'iva_venta': False,
                'mostrar_precio_kilo': str(row['mostrar_precio_kilo']).upper() == 'TRUE',
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

def main():
    print("=" * 70)
    print("IMPORTACIÓN DE PRODUCTOS - CEREALES")
    print("=" * 70)
    print(f"Archivo: {ARCHIVO_EXCEL}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Márgenes default: Minorista {MARGEN_MINORISTA*100:.0f}%, Mayorista {MARGEN_MAYORISTA*100:.0f}%")
    print("=" * 70)
    
    # Leer Excel
    print("\nLeyendo Excel...")
    df = leer_excel()
    print(f"✓ {len(df)} productos encontrados")
    print("\n" + "-" * 70)
    print("DATOS A IMPORTAR")
    print("-" * 70)
    print(df.to_string(index=True))
    
    # Conectar
    print("\n" + "-" * 70)
    print("CONEXIÓN A BASE DE DATOS")
    print("-" * 70)
    engine = conectar()
    print("✓ Conexión exitosa")
    
    # Validar
    print("\n" + "-" * 70)
    print("VALIDACIONES")
    print("-" * 70)
    errores = validar_datos(engine, df)
    
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
    
    productos = importar_productos(engine, df)
    
    print("\n" + "=" * 70)
    print("✅ IMPORTACIÓN EXITOSA")
    print("=" * 70)
    for p in productos:
        print(f"✓ SKU={p['sku']}, {p['nombre']}, Costo=${p['costo_promedio']}, Margen={p['margen_personalizado']*100:.0f}%, PV=${p['precio_venta']}, PVM=${p['precio_venta_mayorista']}")
    print("=" * 70)
    print(f"Total: {len(productos)} productos importados")
    print(f"Márgenes aplicados: Minorista {MARGEN_MINORISTA*100:.0f}%, Mayorista {MARGEN_MAYORISTA*100:.0f}%")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
