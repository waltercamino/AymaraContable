from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres@localhost:5432/sistema_contable')

with engine.connect() as conn:
    # Verificar categoria ID=5
    result = conn.execute(text('SELECT id, nombre FROM categorias WHERE id = 5'))
    cat = result.fetchone()
    print(f'Categoria ID=5: {cat if cat else "NO EXISTE"}')
    
    # Verificar proveedor ID=1
    result = conn.execute(text('SELECT id, nombre FROM proveedores WHERE id = 1'))
    prov = result.fetchone()
    print(f'Proveedor ID=1: {prov if prov else "NO EXISTE"}')
    
    # Listar todas las categorias
    print('\n=== CATEGORIAS DISPONIBLES ===')
    result = conn.execute(text('SELECT id, nombre FROM categorias ORDER BY id'))
    for row in result.fetchall():
        print(f'  ID={row.id}: {row.nombre}')
    
    # Unidades de medida válidas (de la BD)
    print('\n=== UNIDADES DE MEDIDA (de productos existentes) ===')
    result = conn.execute(text('SELECT DISTINCT unidad_medida FROM productos ORDER BY unidad_medida'))
    for row in result.fetchall():
        print(f'  {row.unidad_medida}')
