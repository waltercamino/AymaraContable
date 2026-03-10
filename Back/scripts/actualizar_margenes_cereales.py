"""
Script para actualizar márgenes de productos Cereales importados
"""

from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres@localhost:5432/sistema_contable"

def actualizar_margenes():
    engine = create_engine(DATABASE_URL)
    
    print("=" * 70)
    print("ACTUALIZACIÓN DE MÁRGENES - PRODUCTOS CEREALES")
    print("=" * 70)
    
    # Márgenes del Excel
    MARGEN_MINORISTA = 0.70  # 70%
    MARGEN_MAYORISTA = 0.30  # 30%
    
    with engine.connect() as conn:
        # 1. Verificar productos actuales
        result = conn.execute(text("""
            SELECT sku, nombre, costo_promedio, margen_personalizado, 
                   precio_venta, precio_venta_mayorista
            FROM productos
            WHERE categoria_id = 2 AND sku LIKE 'CER-%'
            ORDER BY sku
        """))
        productos = result.fetchall()
        
        print(f"\n📦 Productos a actualizar: {len(productos)}")
        print("\n--- ESTADO ACTUAL ---")
        for p in productos:
            print(f"{p.sku} | Margen: {p.margen_personalizado} | PV: ${p.precio_venta}")
        
        # 2. Actualizar márgenes y recalcular precios
        print("\n--- ACTUALIZANDO ---")
        for p in productos:
            # Calcular nuevos precios
            nuevo_pv = round(float(p.costo_promedio) * (1 + MARGEN_MINORISTA), 2)
            nuevo_pvm = round(float(p.costo_promedio) * (1 + MARGEN_MAYORISTA), 2)
            
            conn.execute(text("""
                UPDATE productos
                SET 
                    margen_personalizado = :margen_minorista,
                    margen_personalizado_mayorista = :margen_mayorista,
                    precio_venta = :precio_venta,
                    precio_venta_mayorista = :precio_venta_mayorista,
                    actualizado_en = NOW()
                WHERE sku = :sku
            """), {
                'margen_minorista': MARGEN_MINORISTA,
                'margen_mayorista': MARGEN_MAYORISTA,
                'precio_venta': nuevo_pv,
                'precio_venta_mayorista': nuevo_pvm,
                'sku': p.sku
            })
            
            print(f"✓ {p.sku}: PV ${p.precio_venta} → ${nuevo_pv}")
        
        conn.commit()
        
        # 3. Verificar actualización
        print("\n--- VERIFICACIÓN ---")
        result = conn.execute(text("""
            SELECT sku, nombre, costo_promedio, margen_personalizado, 
                   precio_venta, precio_venta_mayorista
            FROM productos
            WHERE categoria_id = 2 AND sku LIKE 'CER-%'
            ORDER BY sku
        """))
        productos = result.fetchall()
        
        print("\n✅ ESTADO FINAL:")
        for p in productos:
            print(f"{p.sku} | Margen: {p.margen_personalizado*100:.0f}% | PV: ${p.precio_venta} | PVM: ${p.precio_venta_mayorista}")
        
        print("\n" + "=" * 70)
        print("✅ MÁRGENES ACTUALIZADOS CORRECTAMENTE")
        print("=" * 70)

if __name__ == "__main__":
    actualizar_margenes()
