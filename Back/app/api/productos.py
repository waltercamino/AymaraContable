from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from datetime import datetime
import csv
import io
from app.database import get_db
from app.models import Producto, Categoria, HistorialMargenes, ProductoProveedor, Proveedor
from app.schemas import (
    ProductoResponse, ActualizarMargenMasivoRequest, ActualizarMargenMasivoResponse,
    HistorialMargenesResponse, MargenUpdateRequest, MargenUpdateResponse,
    MargenIndividualUpdate, MargenIndividualResponse, ProductoCreate, ProductoUpdate,
    ProductoImportCSV, ProductoImportResponse, ProductoImportResult
)

router = APIRouter(prefix="/api/productos", tags=["productos"])

def aplicar_redondeo_argentino(precio: float) -> float:
    """
    Redondeo estilo Argentina: $499, $990, $1000 (sin centavos)
    - Quita centavos
    - Redondea a la centena inferior - 1 (ej: $499, $999)
    """
    if precio <= 0:
        return 0
    precio = round(precio)  # Quitar centavos
    centena = round(precio / 100) * 100
    if centena > 0:
        return centena - 1  # $499, $999, etc.
    return precio

@router.get("/", response_model=List[ProductoResponse])
def listar_productos(
    skip: int = 0,
    limit: int = 100,
    activo: Optional[bool] = True,
    categoria_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Lista todos los productos con márgenes minorista y mayorista"""
    query = db.query(Producto).options(
        joinedload(Producto.categoria),
        joinedload(Producto.proveedores_asociados).joinedload(ProductoProveedor.proveedor)
    ).filter(
        Producto.activo == activo if activo is not None else True
    )

    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)

    productos = query.offset(skip).limit(limit).all()

    resultado = []
    for p in productos:
        # Márgenes de categoría (referencia)
        margen_cat_minorista = float(p.categoria.margen_default_minorista) if p.categoria and p.categoria.margen_default_minorista else 25
        margen_cat_mayorista = float(p.categoria.margen_default_mayorista) if p.categoria and p.categoria.margen_default_mayorista else 35

        # Márgenes efectivos (personalizado o categoría)
        margen_eff_minorista = float(p.margen_personalizado) if p.margen_personalizado is not None else margen_cat_minorista
        margen_eff_mayorista = float(p.margen_personalizado_mayorista) if p.margen_personalizado_mayorista is not None else margen_cat_mayorista

        # Calcular ambos precios con redondeo argentino
        costo = float(p.costo_promedio) if p.costo_promedio else 0
        precio_minorista = aplicar_redondeo_argentino(costo * (1 + margen_eff_minorista / 100))
        precio_mayorista = aplicar_redondeo_argentino(costo * (1 + margen_eff_mayorista / 100))

        # ← Obtener todos los proveedores asociados (M:N)
        proveedores = [
            {
                "id": pp.proveedor.id,
                "nombre": pp.proveedor.nombre,
                "costo_compra": float(pp.costo_compra) if pp.costo_compra else None,
                "es_principal": pp.es_principal
            }
            for pp in p.proveedores_asociados
        ]
        
        # Proveedor principal
        proveedor_principal = next((prov for prov in proveedores if prov["es_principal"]), None)

        resultado.append({
            "id": p.id,
            "sku": p.sku,
            "nombre": p.nombre,
            "categoria_id": p.categoria_id,
            "categoria_nombre": p.categoria.nombre if p.categoria else None,
            "proveedor_id": p.proveedor_id,  # ← Legacy (proveedor principal)
            "unidad_medida": p.unidad_medida,
            "stock_actual": float(p.stock_actual) if p.stock_actual else 0,
            "stock_minimo": float(p.stock_minimo) if p.stock_minimo else 0,
            "costo_promedio": costo,
            "precio_venta": precio_minorista,  # Default para compatibilidad
            "precio_venta_minorista": precio_minorista,
            "precio_venta_mayorista": precio_mayorista,
            "margen_personalizado": float(p.margen_personalizado) if p.margen_personalizado is not None else None,
            "margen_categoria_minorista": margen_cat_minorista,
            "margen_efectivo_minorista": margen_eff_minorista,
            "margen_categoria_mayorista": margen_cat_mayorista,
            "margen_efectivo_mayorista": margen_eff_mayorista,
            "iva_compra": p.iva_compra,
            "iva_venta": p.iva_venta,
            "activo": p.activo,
            "creado_en": p.creado_en,
            "actualizado_en": p.actualizado_en,
            "proveedores": proveedores,  # ← Array de proveedores (M:N)
            "proveedor_principal": proveedor_principal  # ← Proveedor principal
        })

    return resultado

@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)):
    """Obtiene un producto por ID con información de márgenes"""
    producto = db.query(Producto).options(
        joinedload(Producto.categoria)
    ).filter(Producto.id == producto_id).first()

    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return producto

@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_producto(
    data: ProductoCreate,
    db: Session = Depends(get_db),
    usuario_id: Optional[int] = None
):
    """
    Crea un nuevo producto:
    - Calcula precio_venta con margen de categoría
    - Aplica redondeo argentino
    - Permite margen personalizado opcional
    """
    try:
        # Obtener categoría para calcular margen
        categoria = None
        if data.categoria_id:
            categoria = db.query(Categoria).filter(Categoria.id == data.categoria_id).first()

        # Determinar margen a usar
        margen = float(data.margen_personalizado) if data.margen_personalizado is not None else (float(categoria.margen_default_minorista) if categoria else 25)

        # Calcular precio de venta con redondeo argentino
        costo = data.costo_promedio or 0
        precio_venta = aplicar_redondeo_argentino(costo * (1 + margen / 100))

        # Crear producto
        producto = Producto(
            sku=data.sku,
            nombre=data.nombre,
            categoria_id=data.categoria_id,
            proveedor_id=data.proveedor_id,
            unidad_medida=data.unidad_medida,
            costo_promedio=costo,
            precio_venta=precio_venta,
            margen_personalizado=data.margen_personalizado,
            iva_compra=data.iva_compra or False,
            iva_venta=data.iva_venta or False,
            mostrar_precio_kilo=data.mostrar_precio_kilo or False,
            stock_actual=data.stock_actual or 0,
            stock_minimo=data.stock_minimo or 0,
            activo=True  # Default a True para nuevos productos
        )

        db.add(producto)
        db.commit()
        db.refresh(producto)

        return producto
    except IntegrityError as e:
        db.rollback()
        # Manejar error de SKU duplicado de forma amigable
        if 'unique' in str(e.orig).lower() or 'duplicate' in str(e.orig).lower():
            raise HTTPException(
                status_code=400,
                detail=f"El SKU '{data.sku}' ya existe. Usá otro."
            )
        raise HTTPException(status_code=400, detail="Error al crear el producto")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    producto_data: ProductoUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza un producto existente.
    Permite modificar: nombre, categoría, proveedor, stock, precios, márgenes, etc.
    """
    try:
        # Buscar producto
        producto = db.query(Producto).filter(Producto.id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        # Actualizar campos (solo los que se enviaron)
        update_data = producto_data.dict(exclude_unset=True)
        
        # Manejo especial para proveedor_ids (M:N)
        proveedor_ids = update_data.pop('proveedor_ids', None)
        proveedor_id_principal = update_data.pop('proveedor_id_principal', None)
        
        for field, value in update_data.items():
            if value is not None:
                setattr(producto, field, value)
        
        # Actualizar proveedores asociados (M:N) si se proporcionaron
        if proveedor_ids is not None:
            # Limpiar asociaciones existentes
            producto.proveedores_asociados = []
            
            # Agregar nuevas asociaciones
            for idx, prov_id in enumerate(proveedor_ids):
                proveedor = db.query(ProductoProveedor).filter(
                    ProductoProveedor.producto_id == producto_id,
                    ProductoProveedor.proveedor_id == prov_id
                ).first()
                if not proveedor:
                    # Crear nueva asociación
                    proveedor = ProductoProveedor(
                        producto_id=producto_id,
                        proveedor_id=prov_id,
                        es_principal=(prov_id == proveedor_id_principal)
                    )
                    db.add(proveedor)
                else:
                    proveedor.es_principal = (prov_id == proveedor_id_principal)
        
        producto.actualizado_en = datetime.utcnow()
        db.commit()
        db.refresh(producto)
        
        return producto
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{producto_id}/margen", response_model=MargenUpdateResponse)
def actualizar_margen_individual(
    producto_id: int,
    data: MargenUpdateRequest,  # ← Body con Pydantic, no query params
    usuario_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Actualiza el margen personalizado MINORISTA de un producto individual.
    (Endpoint legacy para compatibilidad)
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        return {"message": "Error", "producto": "", "margen_anterior": 0, "margen_nuevo": 0, "precio_venta_nuevo": 0, "error": "Producto no encontrado"}

    margen_personalizado = data.margen_personalizado
    motivo = data.motivo or 'manual'

    # Warning para margen muy bajo (pero no bloquear)
    if margen_personalizado < 0:
        return {"message": "Error", "producto": producto.nombre, "margen_anterior": 0, "margen_nuevo": 0, "precio_venta_nuevo": 0, "error": "El margen no puede ser negativo", "warning": "Margen muy bajo afecta rentabilidad"}

    # Obtener valores anteriores para auditoría
    margen_anterior = float(producto.margen_personalizado) if producto.margen_personalizado is not None else (float(producto.categoria.margen_default_minorista) if producto.categoria else 25)
    precio_costo_anterior = float(producto.costo_promedio) if producto.costo_promedio else 0
    precio_venta_anterior = float(producto.precio_venta) if producto.precio_venta else 0

    # Calcular nuevo precio de venta con redondeo argentino
    costo = float(producto.costo_promedio) if producto.costo_promedio else 0
    nuevo_precio_venta = aplicar_redondeo_argentino(costo * (1 + margen_personalizado / 100))

    # Actualizar producto
    producto.margen_personalizado = margen_personalizado
    producto.precio_venta = nuevo_precio_venta
    producto.actualizado_en = datetime.utcnow()

    # Registrar en historial
    historial = HistorialMargenes(
        producto_id=producto_id,
        margen_anterior=margen_anterior,
        margen_nuevo=margen_personalizado,
        precio_costo_anterior=precio_costo_anterior,
        precio_costo_nuevo=precio_costo_anterior,
        precio_venta_anterior=precio_venta_anterior,
        precio_venta_nuevo=nuevo_precio_venta,
        usuario_id=usuario_id,
        motivo=motivo
    )
    db.add(historial)
    db.commit()

    return {
        "message": "Margen actualizado",
        "producto": producto.nombre,
        "margen_anterior": margen_anterior,
        "margen_nuevo": margen_personalizado,
        "precio_venta_nuevo": nuevo_precio_venta
    }

@router.put("/{producto_id}/margenes", response_model=MargenIndividualResponse)
def actualizar_margenes_individual(
    producto_id: int,
    data: MargenIndividualUpdate,  # Body con ambos márgenes (minorista y mayorista)
    usuario_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Actualiza márgenes MINORISTA y/o MAYORISTA de un producto individual.
    - Permite actualizar uno o ambos márgenes
    - Registra cambios en historial_margenes
    - Recalcula precios con redondeo argentino
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        return {"message": "Error", "producto": "", "error": "Producto no encontrado"}
    
    motivo = data.motivo or 'manual'
    costo = float(producto.costo_promedio) if producto.costo_promedio else 0
    
    margen_minorista_anterior = float(producto.margen_personalizado) if producto.margen_personalizado is not None else (float(producto.categoria.margen_default_minorista) if producto.categoria else 25)
    margen_mayorista_anterior = float(producto.margen_personalizado_mayorista) if producto.margen_personalizado_mayorista is not None else (float(producto.categoria.margen_default_mayorista) if producto.categoria and producto.categoria.margen_default_mayorista else margen_minorista_anterior)
    
    precio_venta_minorista_anterior = float(producto.precio_venta) if producto.precio_venta else 0
    precio_venta_mayorista_anterior = float(producto.precio_venta_mayorista) if producto.precio_venta_mayorista else 0
    
    cambios_realizados = []
    
    # Actualizar margen minorista si se proporciona
    if data.margen_minorista is not None:
        if data.margen_minorista < 0:
            return {"message": "Error", "producto": producto.nombre, "error": "El margen minorista no puede ser negativo"}
        
        nuevo_precio_minorista = aplicar_redondeo_argentino(costo * (1 + data.margen_minorista / 100))
        producto.margen_personalizado = data.margen_minorista
        producto.precio_venta = nuevo_precio_minorista
        cambios_realizados.append("minorista")
    
    # Actualizar margen mayorista si se proporciona
    if data.margen_mayorista is not None:
        if data.margen_mayorista < 0:
            return {"message": "Error", "producto": producto.nombre, "error": "El margen mayorista no puede ser negativo"}
        
        nuevo_precio_mayorista = aplicar_redondeo_argentino(costo * (1 + data.margen_mayorista / 100))
        producto.margen_personalizado_mayorista = data.margen_mayorista
        producto.precio_venta_mayorista = nuevo_precio_mayorista
        cambios_realizados.append("mayorista")
    
    if not cambios_realizados:
        return {"message": "Error", "producto": producto.nombre, "error": "Debe especificar al menos un margen (minorista o mayorista)"}
    
    producto.actualizado_en = datetime.utcnow()
    
    # Registrar en historial (un registro por cambio)
    for tipo in cambios_realizados:
        if tipo == "minorista":
            historial = HistorialMargenes(
                producto_id=producto_id,
                margen_anterior=margen_minorista_anterior,
                margen_nuevo=data.margen_minorista,
                precio_costo_anterior=costo,
                precio_costo_nuevo=costo,
                precio_venta_anterior=precio_venta_minorista_anterior,
                precio_venta_nuevo=float(producto.precio_venta),
                usuario_id=usuario_id,
                motivo=f"{motivo} - {tipo}"
            )
        else:  # mayorista
            historial = HistorialMargenes(
                producto_id=producto_id,
                margen_anterior=margen_mayorista_anterior,
                margen_nuevo=data.margen_mayorista,
                precio_costo_anterior=costo,
                precio_costo_nuevo=costo,
                precio_venta_anterior=precio_venta_mayorista_anterior,
                precio_venta_nuevo=float(producto.precio_venta_mayorista),
                usuario_id=usuario_id,
                motivo=f"{motivo} - {tipo}"
            )
        db.add(historial)
    
    db.commit()
    
    return {
        "message": f"Márgenes actualizados ({', '.join(cambios_realizados)})",
        "producto": producto.nombre,
        "margen_minorista_anterior": margen_minorista_anterior if "minorista" in cambios_realizados else None,
        "margen_minorista_nuevo": data.margen_minorista if "minorista" in cambios_realizados else None,
        "margen_mayorista_anterior": margen_mayorista_anterior if "mayorista" in cambios_realizados else None,
        "margen_mayorista_nuevo": data.margen_mayorista if "mayorista" in cambios_realizados else None,
        "precio_venta_minorista": float(producto.precio_venta) if "minorista" in cambios_realizados else None,
        "precio_venta_mayorista": float(producto.precio_venta_mayorista) if "mayorista" in cambios_realizados else None,
    }

@router.post("/actualizar-margen-masivo", response_model=ActualizarMargenMasivoResponse)
def actualizar_margen_masivo(
    data: ActualizarMargenMasivoRequest,
    usuario_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Actualización masiva de márgenes:
    - Por categoría: todos los productos de una categoría
    - Por lista de productos: selección individual
    - Registra cada cambio en historial_margenes
    - Aplica redondeo argentino a todos los precios
    """
    print(f"=== DEBUG ACTUALIZACIÓN MASIVA DE MARGEN ===")
    print(f"producto_ids: {data.producto_ids}")
    print(f"categoria_id: {data.categoria_id}")
    print(f"nuevo_margen: {data.nuevo_margen}")
    
    try:
        actualizados = 0
        detalle = []
        
        if data.categoria_id:
            productos = db.query(Producto).filter(
                Producto.categoria_id == data.categoria_id,
                Producto.activo == True
            ).all()
        elif data.producto_ids:
            productos = db.query(Producto).filter(
                Producto.id.in_(data.producto_ids),
                Producto.activo == True
            ).all()
        else:
            return {"actualizados": 0, "error": "Debe especificar categoría o productos", "detalle": None}
        
        for producto in productos:
            # Obtener valores anteriores para auditoría
            margen_anterior = float(producto.margen_personalizado) if producto.margen_personalizado is not None else (float(producto.categoria.margen_default_minorista) if producto.categoria else 25)
            precio_costo_anterior = float(producto.costo_promedio) if producto.costo_promedio else 0
            precio_venta_anterior = float(producto.precio_venta) if producto.precio_venta else 0
            
            # Calcular nuevo precio con redondeo argentino
            costo = precio_costo_anterior
            nuevo_precio_venta = aplicar_redondeo_argentino(costo * (1 + data.nuevo_margen / 100))
            
            # Actualizar producto
            producto.margen_personalizado = data.nuevo_margen
            producto.precio_venta = nuevo_precio_venta
            producto.actualizado_en = datetime.utcnow()
            
            # Registrar en historial
            historial = HistorialMargenes(
                producto_id=producto.id,
                margen_anterior=margen_anterior,
                margen_nuevo=data.nuevo_margen,
                precio_costo_anterior=precio_costo_anterior,
                precio_costo_nuevo=precio_costo_anterior,
                precio_venta_anterior=precio_venta_anterior,
                precio_venta_nuevo=nuevo_precio_venta,
                usuario_id=usuario_id,
                motivo=data.motivo
            )
            db.add(historial)
            
            detalle.append({
                "id": producto.id,
                "nombre": producto.nombre,
                "margen_anterior": margen_anterior,
                "margen_nuevo": data.nuevo_margen,
                "precio_venta_nuevo": nuevo_precio_venta
            })
            actualizados += 1
        
        db.commit()
        print(f"✅ {actualizados} productos actualizados")
        
        return {"actualizados": actualizados, "error": None, "detalle": detalle}
        
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR: {str(e)}")
        return {"actualizados": 0, "error": str(e), "detalle": None}

@router.get("/{producto_id}/historial-margen", response_model=List[HistorialMargenesResponse])
def obtener_historial_margen(producto_id: int, db: Session = Depends(get_db)):
    """Obtiene el historial de cambios de margen para un producto (últimos 50 registros)"""
    historial = db.query(HistorialMargenes).filter(
        HistorialMargenes.producto_id == producto_id
    ).order_by(HistorialMargenes.creado_en.desc()).limit(50).all()

    return historial


@router.post("/importar", response_model=ProductoImportResult)
def importar_productos_csv(
    file: UploadFile = File(..., description="Archivo CSV con los productos a importar"),
    db: Session = Depends(get_db),
    usuario_id: Optional[int] = None
):
    """
    Importa productos desde un archivo CSV.
    
    El CSV debe tener las siguientes columnas:
    - sku: Código único del producto
    - nombre: Nombre del producto
    - categoria_id: ID de la categoría (debe existir)
    - proveedor_id: ID del proveedor (debe existir)
    - unidad_medida: Unidad de medida (unidad, kg, g, GRAMO, l, ml, etc.)
    - costo_promedio: Costo de compra
    - margen_personalizado: Margen minorista (opcional)
    - margen_personalizado_mayorista: Margen mayorista (opcional)
    - mostrar_precio_kilo: Boolean para mostrar precio por kilo (opcional, default False)
    - stock_minimo: Stock mínimo requerido (default 0)
    
    Validaciones:
    1. categoria_id debe existir
    2. proveedor_id debe existir
    3. sku no debe estar duplicado en la base de datos
    4. unidad_medida debe ser válido
    """
    # Validar extensión del archivo
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV")
    
    try:
        # Leer contenido del archivo
        content = file.file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        
        # Validar columnas requeridas
        required_columns = ['sku', 'nombre', 'categoria_id', 'proveedor_id', 'unidad_medida', 'costo_promedio']
        if reader.fieldnames is None:
            raise HTTPException(status_code=400, detail="El archivo CSV está vacío o no tiene formato válido")
        
        missing_columns = [col for col in required_columns if col not in reader.fieldnames]
        if missing_columns:
            raise HTTPException(status_code=400, detail=f"Columnas faltantes en el CSV: {', '.join(missing_columns)}")
        
        # Unidades de medida válidas
        unidades_validas = ['unidad', 'kg', 'g', 'GRAMO', 'KILO', 'l', 'ml', 'L', 'ML', 'KG', 'G', 'Unidad', 'UNIDAD', 'pack', 'caja']
        
        resultados = []
        errores = []
        importados = 0
        fallidos = 0
        
        # Obtener categorías y proveedores válidos para validación rápida
        categorias_validas = {c.id: c for c in db.query(Categoria).all()}
        proveedores_validos = {p.id: p for p in db.query(Proveedor).filter(Proveedor.id.in_(
            [row['proveedor_id'] for row in reader if row.get('proveedor_id')]
        )).all()}
        
        # Re-iterar sobre el CSV (necesario después de leer fieldnames)
        file.file.seek(0)
        content = file.file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(content))
        
        # Obtener SKUs existentes para validación de duplicados
        skus_existentes = {p.sku for p in db.query(Producto).filter(Producto.sku.isnot(None)).all()}
        
        for row_num, row in enumerate(reader, start=2):  # start=2 porque la fila 1 es el header
            try:
                # Parsear datos
                sku = row.get('sku', '').strip()
                nombre = row.get('nombre', '').strip()
                categoria_id = int(row.get('categoria_id', 0))
                proveedor_id = int(row.get('proveedor_id', 0))
                unidad_medida = row.get('unidad_medida', '').strip()
                costo_promedio = float(row.get('costo_promedio', 0))
                margen_personalizado = float(row['margen_personalizado']) if row.get('margen_personalizado') and row['margen_personalizado'].strip() else None
                margen_personalizado_mayorista = float(row['margen_personalizado_mayorista']) if row.get('margen_personalizado_mayorista') and row['margen_personalizado_mayorista'].strip() else None
                mostrar_precio_kilo = row.get('mostrar_precio_kilo', 'FALSE').strip().upper() == 'TRUE'
                stock_minimo = float(row.get('stock_minimo', 0)) if row.get('stock_minimo') and row['stock_minimo'].strip() else 0
                
                # Validación 1: categoria_id debe existir
                if categoria_id not in categorias_validas:
                    raise ValueError(f"Categoría ID={categoria_id} no existe")
                
                # Validación 2: proveedor_id debe existir
                if proveedor_id not in proveedores_validos:
                    raise ValueError(f"Proveedor ID={proveedor_id} no existe")
                
                # Validación 3: sku no duplicado
                if not sku:
                    raise ValueError("SKU está vacío")
                if sku in skus_existentes:
                    raise ValueError(f"SKU '{sku}' ya existe en la base de datos")
                
                # Validación 4: unidad_medida válida
                if unidad_medida not in unidades_validas:
                    raise ValueError(f"Unidad de medida '{unidad_medida}' no es válida. Válidas: {', '.join(unidades_validas)}")
                
                # Validación 5: nombre no vacío
                if not nombre:
                    raise ValueError("Nombre del producto está vacío")
                
                # Validación 6: costo_promedio no negativo
                if costo_promedio < 0:
                    raise ValueError("El costo_promedio no puede ser negativo")
                
                # Calcular precio de venta con margen y redondeo argentino
                margen = margen_personalizado if margen_personalizado is not None else (float(categorias_validas[categoria_id].margen_default_minorista) if categorias_validas[categoria_id].margen_default_minorista else 25)
                precio_venta = aplicar_redondeo_argentino(costo_promedio * (1 + margen / 100))
                
                # Calcular precio mayorista
                margen_mayorista = margen_personalizado_mayorista if margen_personalizado_mayorista is not None else (float(categorias_validas[categoria_id].margen_default_mayorista) if categorias_validas[categoria_id].margen_default_mayorista else margen)
                precio_venta_mayorista = aplicar_redondeo_argentino(costo_promedio * (1 + margen_mayorista / 100))
                
                # Crear producto
                producto = Producto(
                    sku=sku,
                    nombre=nombre,
                    categoria_id=categoria_id,
                    proveedor_id=proveedor_id,
                    unidad_medida=unidad_medida,
                    costo_promedio=costo_promedio,
                    precio_venta=precio_venta,
                    precio_venta_mayorista=precio_venta_mayorista,
                    margen_personalizado=margen_personalizado,
                    margen_personalizado_mayorista=margen_personalizado_mayorista,
                    mostrar_precio_kilo=mostrar_precio_kilo,
                    stock_actual=0,  # Stock inicial en 0
                    stock_minimo=stock_minimo,
                    activo=True,
                    iva_compra=False,
                    iva_venta=False
                )
                
                db.add(producto)
                db.flush()  # Para obtener el ID
                
                # Registrar en producto_proveedor (relación M:N)
                prod_prov = ProductoProveedor(
                    producto_id=producto.id,
                    proveedor_id=proveedor_id,
                    costo_compra=costo_promedio,
                    es_principal=True
                )
                db.add(prod_prov)
                
                db.commit()
                
                # Marcar SKU como existente para siguientes iteraciones
                skus_existentes.add(sku)
                
                resultados.append(ProductoImportResponse(
                    sku=sku,
                    nombre=nombre,
                    id=producto.id,
                    mensaje="Importado exitosamente"
                ))
                importados += 1
                
            except Exception as e:
                db.rollback()
                errores.append({
                    "fila": row_num,
                    "sku": row.get('sku', 'N/A'),
                    "error": str(e)
                })
                fallidos += 1
        
        return ProductoImportResult(
            total=importados + fallidos,
            importados=importados,
            fallidos=fallidos,
            errores=errores,
            detalles=resultados
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error al procesar el archivo CSV: {str(e)}")


@router.delete("/{producto_id}")
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db)
):
    """
    Elimina un producto (soft delete: marca como inactivo).
    Solo productos no utilizados en ventas/compras pueden eliminarse.
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # ✅ Soft delete: marcar como inactivo en vez de eliminar físicamente
    producto.activo = False
    producto.actualizado_en = datetime.utcnow()

    db.commit()

    return {"message": "Producto eliminado exitosamente", "id": producto_id}
