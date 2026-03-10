import pandas as pd
import sys

archivo = r'C:\Users\Usuario\Downloads\Nuevo Hoja de cálculo de Microsoft Excel.xlsx'

try:
    df = pd.read_excel(archivo)
    
    print('=== DATOS DEL EXCEL ===')
    print(f'Filas: {len(df)}')
    print(f'Columnas: {list(df.columns)}')
    print()
    print('=== CONTENIDO ===')
    print(df.to_string())
    print()
    print('=== TIPOS DE DATO ===')
    print(df.dtypes)
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
