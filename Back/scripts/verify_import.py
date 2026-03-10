from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres@localhost:5432/sistema_contable')
with engine.connect() as conn:
    result = conn.execute(text('''
        SELECT sku, nombre, unidad_medida, costo_promedio, precio_venta, precio_venta_mayorista 
        FROM productos 
        WHERE categoria_id = 2 
        ORDER BY sku
    '''))
    rows = result.fetchall()
    print(f'Productos en categoria Cereales (ID=2): {len(rows)}')
    print()
    for r in rows:
        print(f'{r.sku} | {r.nombre:<25} | {r.unidad_medida:<12} | Costo: ${r.costo_promedio:>8} | PV: ${r.precio_venta:>10} | PVM: ${r.precio_venta_mayorista:>10}')
