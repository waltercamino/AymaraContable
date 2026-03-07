from fastapi import APIRouter, Depends, HTTPException, Response, Body, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import date, timedelta, datetime, timezone
from decimal import Decimal
from app.database import get_db
from app.models import Producto, ListaPrecio, DetalleListaPrecio, Categoria
from app.schemas import ActualizarPreciosBloque, PrecioVistaPrevia, ListaPreciosCreate, ListaPreciosResponse, ActualizacionMasivaRequest, ActualizacionMasivaResponse
from app.services.pdf_generator import generar_etiquetas_productos, generar_lista_precios_mayorista
import tempfile
import os

router = APIRouter()

# =================================================================
# FUNCIÓN DE REDONDEO INTELIGENTE (ARGENTINA)
# =================================================================
def aplicar_redondeo(precio: float, tipo_redondeo: str) -> float:
    """
    Aplica redondeo inteligente para precios en Argentina (sin centavos)
    """
    if tipo_redondeo == 'none' or not tipo_redondeo:
        return round(precio)  # Solo quitar centavos

    elif tipo_redondeo == '50':
        # Redondear al múltiplo de 50 más cercano
        return round(precio / 50) * 50

    elif tipo_redondeo == '99':
        # Redondeo psicológico: $499, $999, $1499
        base = round(precio / 100) * 100
        return base - 1 if base > 0 else 0

    elif tipo_redondeo == '90':
        # Redondeo a 90: $490, $990, $1490
        base = round(precio / 100) * 100
        return base - 10 if base > 0 else 0

    elif tipo_redondeo == '100':
        # Redondear al múltiplo de 100 más cercano
        return round(precio / 100) * 100

    return round(precio)

def aplicar_redondeo_argentino(precio: float) -> float:
    """
    Redondeo estilo Argentina: $499, $990, $1000 (sin centavos)
    - Quita centavos
    - Redondea a la centena inferior - 1 (ej: $499, $999)
    """
    if precio <= 0:
        return 0
    precio = round(precio)  # Quitar centavos
    if precio < 100:
        return precio
    centena = round(precio / 100) * 100
    return centena - 1  # $499, $999, etc.

# ============================================
# VISTA PREVIA DE AUMENTO
# ============================================
@router.get("/vista-previa", response_model=List[PrecioVistaPrevia])
def vista_previa_aumento(actualizar: ActualizarPreciosBloque = Depends(), db: Session = Depends(get_db)):
    """Muestra vista previa de precios antes de aplicar aumento"""
    productos = db.query(Producto).filter(Producto.categoria_id == actualizar.categoria_id).all()
    
    resultado = []
    for prod in productos:
        lista = db.query(ListaPrecio).filter(
            ListaPrecio.tipo == actualizar.tipo_lista,
            ListaPrecio.activa == True
        ).first()
        
        precio_actual = 0
        if lista:
            detalle = db.query(DetalleListaPrecio).filter(
                DetalleListaPrecio.lista_precios_id == lista.id,
                DetalleListaPrecio.producto_id == prod.id
            ).first()
            if detalle:
                precio_actual = float(detalle.precio_venta)
        
        precio_nuevo = precio_actual * (1 + actualizar.porcentaje_aumento / 100)
        
        resultado.append(PrecioVistaPrevia(
            producto_id=prod.id,
            producto_nombre=prod.nombre,
            precio_actual=precio_actual,
            precio_nuevo=round(precio_nuevo, 2),
            variacion=actualizar.porcentaje_aumento
        ))
    
    return resultado

# ============================================
# ACTUALIZAR PRECIOS POR BLOQUE
# ============================================
@router.post("/actualizar-bloque")
def actualizar_precios_por_categoria(actualizar: ActualizarPreciosBloque, db: Session = Depends(get_db)):
    """Aplica aumento de precios a todos los productos de una categoría"""
    lista = ListaPrecio(
        nombre=f"{actualizar.tipo_lista.capitalize()} - {date.today()}",
        tipo=actualizar.tipo_lista,
        vigencia_desde=date.today(),
        vigencia_hasta=date.today() + timedelta(days=30),
        activa=True
    )
    db.add(lista)
    db.flush()
    
    productos = db.query(Producto).filter(Producto.categoria_id == actualizar.categoria_id).all()
    
    for prod in productos:
        costo = 0
        if prod.historial_costos:
            costo = float(prod.historial_costos[0].costo_compra)
        
        precio_nuevo = costo * (1 + actualizar.porcentaje_aumento / 100)
        
        detalle = DetalleListaPrecio(
            lista_precios_id=lista.id,
            producto_id=prod.id,
            costo_compra=costo,
            margen_porcentaje=actualizar.porcentaje_aumento,
            precio_venta=precio_nuevo,
            unidad_venta=prod.unidad_medida
        )
        db.add(detalle)
    
    db.commit()
    return {"message": f"Precios actualizados para {len(productos)} productos"}

# ============================================
# LISTAS DE PRECIOS
# ============================================
@router.get("/listas", response_model=List[ListaPreciosResponse])
def listar_listas_precios(db: Session = Depends(get_db)):
    """Lista todas las listas de precios"""
    return db.query(ListaPrecio).order_by(ListaPrecio.creado_en.desc()).all()


@router.post("/listas", response_model=ListaPreciosResponse, status_code=status.HTTP_201_CREATED)
def crear_lista_precios(lista: ListaPreciosCreate, db: Session = Depends(get_db)):
    """Crea una nueva lista de precios con categorías seleccionadas"""
    db_lista = ListaPrecio(
        nombre=lista.nombre,
        descripcion=lista.descripcion,
        tipo_cliente=lista.tipo_cliente,
        categorias_incluidas=lista.categorias_incluidas,
        activa=True,
        vigencia_desde=date.today()
    )
    db.add(db_lista)
    db.commit()
    db.refresh(db_lista)
    return db_lista


@router.put("/listas/{lista_id}", response_model=ListaPreciosResponse)
def actualizar_lista_precios(lista_id: int, lista: ListaPreciosCreate, db: Session = Depends(get_db)):
    """Actualiza una lista de precios"""
    db_lista = db.query(ListaPrecio).filter(ListaPrecio.id == lista_id).first()
    if not db_lista:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    
    db_lista.nombre = lista.nombre
    db_lista.descripcion = lista.descripcion
    db_lista.tipo_cliente = lista.tipo_cliente
    db_lista.categorias_incluidas = lista.categorias_incluidas
    
    db.commit()
    db.refresh(db_lista)
    return db_lista


@router.delete("/listas/{lista_id}")
def eliminar_lista_precios(lista_id: int, db: Session = Depends(get_db)):
    """Elimina una lista de precios"""
    lista = db.query(ListaPrecio).filter(ListaPrecio.id == lista_id).first()
    if not lista:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    
    db.delete(lista)
    db.commit()
    return {"message": "Lista eliminada"}


@router.get("/listas/{lista_id}/imprimir")
def imprimir_lista_precios(lista_id: int, categoria_id: int = None, db: Session = Depends(get_db)):
    """
    Obtiene productos para imprimir lista de precios:
    - USA tipo_cliente de la lista para decidir qué margen aplicar
    - Si producto tiene margen_personalizado, usa ese
    - Si NO tiene margen_personalizado, usa margen de categoría
    """
    try:
        lista = db.query(ListaPrecio).filter(ListaPrecio.id == lista_id).first()
        if not lista:
            return {"error": "Lista no encontrada", "productos_agrupados": {}}

        # Obtener categorías incluidas
        categorias_ids = lista.categorias_incluidas or []
        if not categorias_ids:
            return {"error": "La lista no tiene categorías seleccionadas", "productos_agrupados": {}}

        # Determinar qué margen usar según tipo_cliente de la lista
        tipo_cliente = lista.tipo_cliente  # 'minorista' o 'mayorista' o 'todos'
        
        print(f"=== DEBUG IMPRESIÓN LISTA ===")
        print(f"Lista: {lista.nombre}, tipo_cliente: {tipo_cliente}")

        # Filtrar productos por categorías de la lista, ordenados por categoría y nombre
        query = db.query(Producto).filter(
            Producto.categoria_id.in_(categorias_ids),
            Producto.activo == True
        ).join(Categoria).order_by(
            Categoria.nombre,
            Producto.nombre
        )

        # Filtro adicional por categoría específica (opcional)
        if categoria_id:
            query = query.filter(Producto.categoria_id == categoria_id)

        productos = query.all()

        # Agrupar por categoría
        productos_por_categoria = {}
        for prod in productos:
            # Obtener categoría para obtener márgenes
            categoria = db.query(Categoria).filter(Categoria.id == prod.categoria_id).first()
            cat_nombre = categoria.nombre if categoria else "Sin categoría"

            # Determinar margen según tipo de cliente
            if tipo_cliente == 'mayorista':
                # MAYORISTA: usar margen_default_mayorista de categoría
                margen_base = float(categoria.margen_default_mayorista) if categoria and categoria.margen_default_mayorista else 35
                print(f"  {prod.nombre}: MARGEN MAYORISTA de categoría = {margen_base}%")
            elif tipo_cliente == 'minorista':
                # MINORISTA: usar margen_default_minorista de categoría
                margen_base = float(categoria.margen_default_minorista) if categoria and categoria.margen_default_minorista else 25
                print(f"  {prod.nombre}: MARGEN MINORISTA de categoría = {margen_base}%")
            else:  # 'todos' - usar el mayor de los dos
                margen_minorista = float(categoria.margen_default_minorista) if categoria and categoria.margen_default_minorista else 25
                margen_mayorista = float(categoria.margen_default_mayorista) if categoria and categoria.margen_default_mayorista else 35
                margen_base = max(margen_minorista, margen_mayorista)
                print(f"  {prod.nombre}: MARGEN MAYOR (todos) = {margen_base}%")

            # Si tiene override personalizado, usar ese (para el tipo correspondiente)
            # Por ahora margen_personalizado aplica a minorista, margen_personalizado_mayorista a mayorista
            if tipo_cliente == 'mayorista' and prod.margen_personalizado_mayorista is not None:
                margen_final = float(prod.margen_personalizado_mayorista)
                print(f"    → Usa margen_personalizado_mayorista: {margen_final}%")
            elif tipo_cliente == 'minorista' and prod.margen_personalizado is not None:
                margen_final = float(prod.margen_personalizado)
                print(f"    → Usa margen_personalizado: {margen_final}%")
            else:
                margen_final = margen_base
            
            # Calcular precio con el margen correcto (redondeo Argentina)
            costo = float(prod.costo_promedio) if prod.costo_promedio else 0
            precio_venta = aplicar_redondeo_argentino(costo * (1 + margen_final / 100))
            
            print(f"    Costo: ${costo} × (1 + {margen_final}/100) = ${precio_venta}")

            if cat_nombre not in productos_por_categoria:
                productos_por_categoria[cat_nombre] = []

            productos_por_categoria[cat_nombre].append({
                "sku": prod.sku or "",
                "nombre": prod.nombre,
                "precio_venta": precio_venta,
                "unidad_medida": prod.unidad_medida or "",
                "margen_aplicado": margen_final,  # Para debug/verificación
                "tipo_lista": tipo_cliente  # Para verificación
            })

        print(f"=== FIN DEBUG ===")

        return {
            "lista_id": lista.id,
            "lista_nombre": lista.nombre,
            "tipo_cliente": tipo_cliente,  # ← IMPORTANTE: devolver qué tipo se usó
            "total_productos": sum(len(prods) for prods in productos_por_categoria.values()),
            "productos_agrupados": productos_por_categoria
        }
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {"error": str(e), "productos_agrupados": {}}


@router.post("/actualizacion-masiva", response_model=ActualizacionMasivaResponse)
def actualizacion_masiva_precios(
    producto_ids: List[int] = Body(...),
    tipo_actualizacion: str = Body(...),
    valor: float = Body(...),
    redondeo: str = Body('none'),
    db: Session = Depends(get_db)
):
    """
    Actualización masiva de COSTO_PROMEDIO:
    - tipo_actualizacion: 'porcentaje', 'monto_fijo', 'nuevo_costo'
    - Actualiza costo_promedio y recalcula precio_venta automáticamente
    - Aplica redondeo inteligente (Argentina)
    - Hace db.commit() para persistir cambios
    """
    print(f"=== DEBUG ACTUALIZACIÓN MASIVA ===")
    print(f"Database URL: {db.bind.url}")  # Verificar BD
    print(f"producto_ids: {producto_ids}")
    print(f"tipo_actualizacion: {tipo_actualizacion}")
    print(f"valor: {valor}")
    print(f"redondeo: {redondeo}")
    
    try:
        actualizados = 0
        productos_actualizados = []
        
        for prod_id in producto_ids:
            producto = db.query(Producto).filter(Producto.id == prod_id).first()
            if producto:
                # CONVERTIR DECIMAL A FLOAT para evitar errores
                costo_anterior = float(producto.costo_promedio) if producto.costo_promedio else 0.0
                precio_venta_anterior = float(producto.precio_venta) if producto.precio_venta else 0.0
                print(f"\nProducto {prod_id} ({producto.nombre}):")
                print(f"  Costo anterior: ${costo_anterior}")
                print(f"  Precio venta anterior: ${precio_venta_anterior}")
                
                # 1. Aplicar actualización al COSTO
                if tipo_actualizacion == 'porcentaje':
                    nuevo_costo = costo_anterior * (1 + valor / 100)
                    print(f"  Cálculo: {costo_anterior} * (1 + {valor}/100) = {nuevo_costo}")
                    
                elif tipo_actualizacion == 'monto_fijo':
                    nuevo_costo = costo_anterior + valor
                    print(f"  Cálculo: {costo_anterior} + {valor} = {nuevo_costo}")
                    
                elif tipo_actualizacion == 'nuevo_costo':
                    nuevo_costo = valor
                    print(f"  Nuevo costo directo: {valor}")
                else:
                    nuevo_costo = costo_anterior
                
                # 2. Aplicar redondeo al costo
                nuevo_costo = aplicar_redondeo(nuevo_costo, redondeo)
                print(f"  Costo después de redondeo ({redondeo}): ${nuevo_costo}")
                
                # 3. Actualizar costo_promedio
                producto.costo_promedio = round(nuevo_costo, 2)
                
                # 4. Recalcular precio_venta automáticamente con margen de categoría
                categoria = db.query(Categoria).filter(Categoria.id == producto.categoria_id).first()
                if categoria:
                    # Usar margen según tipo de cliente (default: minorista)
                    margen = float(categoria.margen_default_minorista) if categoria.margen_default_minorista else 0.0
                    nuevo_precio_venta = nuevo_costo * (1 + margen / 100)
                    print(f"  Margen categoría: {margen}%")
                    print(f"  Precio venta calculado: ${nuevo_precio_venta:.2f}")
                else:
                    # Sin categoría: margen default 25%
                    nuevo_precio_venta = nuevo_costo * 1.25
                    print(f"  Sin categoría - margen default 25%")
                    print(f"  Precio venta calculado: ${nuevo_precio_venta:.2f}")
                
                producto.precio_venta = round(nuevo_precio_venta, 2)
                producto.actualizado_en = datetime.now(timezone.utc)
                
                # 5. FORZAR FLUSH PARA CADA PRODUCTO
                db.flush()
                
                productos_actualizados.append({
                    "id": prod_id,
                    "nombre": producto.nombre,
                    "costo_anterior": costo_anterior,
                    "costo_nuevo": nuevo_costo,
                    "precio_venta_anterior": precio_venta_anterior,
                    "precio_venta_nuevo": float(producto.precio_venta)
                })
                actualizados += 1
                print(f"  ✅ Actualizado (flush realizado)")
            else:
                print(f"  ❌ Producto {prod_id} NO ENCONTRADO")
        
        # 6. COMMIT FINAL
        print(f"\nTotal actualizados: {actualizados}")
        print(f"Haciendo db.commit()...")
        db.commit()
        print(f"✅ Commit realizado!")
        
        # 7. REFRESH PARA VERIFICAR
        if productos_actualizados:
            print(f"✅ ACTUALIZACIÓN COMPLETADA: {productos_actualizados}")
        
        return {"actualizados": actualizados, "error": None}
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        db.rollback()  # ← Revertir en caso de error
        return {"actualizados": 0, "error": str(e)}


# ============================================
# ACTIVAR LISTA
# ============================================
@router.put("/listas/{lista_id}/activar")
def activar_lista(lista_id: int, db: Session = Depends(get_db)):
    """Activa una lista de precios (desactiva las demás)"""
    db.query(ListaPrecio).update({ListaPrecio.activa: False})
    
    lista = db.query(ListaPrecio).filter(ListaPrecio.id == lista_id).first()
    if lista:
        lista.activa = True
        db.commit()
        return {"message": "Lista activada correctamente"}
    
    raise HTTPException(status_code=404, detail="Lista no encontrada")

# ============================================
# EXPORTAR ETIQUETAS (MINORISTA)
# ============================================
@router.post("/exportar-etiquetas")
def exportar_etiquetas_pdf(productos: list, db: Session = Depends(get_db)):
    """
    Genera PDF de etiquetas para impresora común (MINORISTA)
    ⚠️ ETIQUETAS SIEMPRE USAN PRECIO MINORISTA (precio de góndola)
    """
    # Calcular precios correctos (minorista) en el backend
    productos_con_precios = []
    for p in productos:
        prod_id = p.get('id') or p.get('producto_id')
        if prod_id:
            prod = db.query(Producto).filter(Producto.id == prod_id).first()
            if prod:
                cat = prod.categoria
                # MINORISTA SIEMPRE
                margen_base = float(cat.margen_default_minorista) if cat and cat.margen_default_minorista else 25
                if prod.margen_personalizado is not None:
                    margen_base = float(prod.margen_personalizado)
                
                costo = float(prod.costo_promedio) if prod.costo_promedio else 0
                precio_venta = aplicar_redondeo_argentino(costo * (1 + margen_base / 100))
                
                productos_con_precios.append({
                    "nombre": p.get("nombre") or prod.nombre,
                    "precio_venta": precio_venta,  # ← MINORISTA calculado
                    "unidad_venta": p.get("unidad_venta") or prod.unidad_medida,
                    "sku": p.get("sku") or prod.sku or str(prod.id)
                })
        else:
            # Si no hay ID, usar los datos enviados (asumir que ya vienen calculados)
            productos_con_precios.append({
                "nombre": p.get("nombre"),
                "precio_venta": p.get("precio_venta"),
                "unidad_venta": p.get("unidad_venta"),
                "sku": p.get("sku")
            })
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_path = tmp.name

    generar_etiquetas_productos(productos_con_precios, output_path)

    with open(output_path, "rb") as f:
        content = f.read()

    os.unlink(output_path)

    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=etiquetas_minorista.pdf"})

# ============================================
# EXPORTAR LISTA MAYORISTA
# ============================================
@router.post("/exportar-lista-mayorista")
def exportar_lista_mayorista_pdf(nombre_lista: str, productos: list, db: Session = Depends(get_db)):
    """Genera PDF de lista mayorista para WhatsApp/email (MAYORISTA)"""
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        output_path = tmp.name
    
    productos_fmt = [
        {
            "nombre": p["nombre"],
            "precio_venta": p["precio_venta"]
        } for p in productos
    ]
    
    generar_lista_precios_mayorista(productos_fmt, nombre_lista, output_path)
    
    with open(output_path, "rb") as f:
        content = f.read()
    
    os.unlink(output_path)
    
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=lista_mayorista.pdf"})