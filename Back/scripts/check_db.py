from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres@localhost:5432/sistema_contable')

try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT id, nombre FROM categorias WHERE id = 2'))
        cat = result.fetchone()
        result = conn.execute(text('SELECT id, nombre FROM proveedores WHERE id = 1'))
        prov = result.fetchone()
        
        with open('check_result.txt', 'w') as f:
            f.write(f'Categoria ID=2: {cat if cat else "NO EXISTE"}\n')
            f.write(f'Proveedor ID=1: {prov if prov else "NO EXISTE"}\n')
            print(f'Categoria ID=2: {cat if cat else "NO EXISTE"}')
            print(f'Proveedor ID=1: {prov if prov else "NO EXISTE"}')
except Exception as e:
    with open('check_result.txt', 'w') as f:
        f.write(f'Error: {e}\n')
    print(f'Error: {e}')
