from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from typing import List
from app.database import get_db
from app.models import Categoria, Producto
from app.schemas import CategoriaCreate, CategoriaUpdate, CategoriaResponse

router = APIRouter()

def calcular_similitud(s1: str, s2: str) -> float:
    """
    Calcula similitud entre dos strings usando Levenshtein ratio simplificado.
    Retorna valor entre 0 (diferentes) y 1 (iguales).
    """
    s1, s2 = s1.lower().strip(), s2.lower().strip()
    if s1 == s2:
        return 1.0
    
    # Distancia de Levenshtein simplificada
    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
    
    # Crear matriz de distancias
    d = [[0] * (len2 + 1) for _ in range(len1 + 1)]
    for i in range(len1 + 1):
        d[i][0] = i
    for j in range(len2 + 1):
        d[0][j] = j
    
    for i in range(1, len1 + 1):
        for j in range(1, len2 + 1):
            cost = 0 if s1[i-1] == s2[j-1] else 1
            d[i][j] = min(
                d[i-1][j] + 1,      # eliminación
                d[i][j-1] + 1,      # inserción
                d[i-1][j-1] + cost  # sustitución
            )
    
    distance = d[len1][len2]
    max_len = max(len1, len2)
    return 1 - (distance / max_len) if max_len > 0 else 0.0

def verificar_categoria_duplicada(nombre: str, db: Session, exclude_id: int = None) -> tuple[bool, str | None]:
    """
    Verifica si existe una categoría con nombre similar (case-insensitive).
    Retorna (es_duplicado, mensaje_de_error).
    """
    nombre_normalizado = nombre.strip().lower()
    
    # Buscar categorías existentes
    query = db.query(Categoria)
    if exclude_id:
        query = query.filter(Categoria.id != exclude_id)
    
    categorias_existentes = query.all()
    
    for cat in categorias_existentes:
        nombre_existente = cat.nombre.strip().lower()
        
        # Case-insensitive exact match
        if nombre_normalizado == nombre_existente:
            return True, f"⚠️ Ya existe una categoría con el nombre '{cat.nombre}'. Verificá el nombre antes de continuar."
        
        # Similitud > 0.85 (posible typo)
        similitud = calcular_similitud(nombre_normalizado, nombre_existente)
        if similitud > 0.85:
            return True, f"⚠️ Ya existe una categoría similar: '{cat.nombre}' (similitud: {int(similitud*100)}%). Verificá si es la misma categoría."
    
    return False, None

@router.get("/", response_model=List[CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db)):
    """Lista todas las categorías de productos"""
    return db.query(Categoria).all()

@router.post("/", response_model=CategoriaResponse, status_code=status.HTTP_201_CREATED)
def crear_categoria(categoria: CategoriaCreate, db: Session = Depends(get_db)):
    """Crea una nueva categoría"""
    # Validación case-insensitive y por similitud
    es_duplicado, mensaje_error = verificar_categoria_duplicada(categoria.nombre, db)
    if es_duplicado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=mensaje_error
        )
    
    try:
        db_categoria = Categoria(**categoria.model_dump())
        db.add(db_categoria)
        db.commit()
        db.refresh(db_categoria)
        return db_categoria
    except IntegrityError as e:
        db.rollback()
        # Manejo de error por categoría duplicada (respaldo)
        if 'nombre_unique' in str(e.orig) or 'unique' in str(e.orig).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"La categoría '{categoria.nombre}' ya existe. Usá otro nombre."
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear la categoría"
        )

@router.get("/{categoria_id}", response_model=CategoriaResponse)
def obtener_categoria(categoria_id: int, db: Session = Depends(get_db)):
    """Obtiene una categoría por ID"""
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria

@router.put("/{categoria_id}", response_model=CategoriaResponse)
def actualizar_categoria(categoria_id: int, categoria: CategoriaUpdate, db: Session = Depends(get_db)):
    """Actualiza una categoría"""
    db_categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    # Validación case-insensitive y por similitud (excluyendo la categoría actual)
    if categoria.nombre:
        es_duplicado, mensaje_error = verificar_categoria_duplicada(categoria.nombre, db, exclude_id=categoria_id)
        if es_duplicado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=mensaje_error
            )

    update_data = categoria.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_categoria, key, value)

    db.commit()
    db.refresh(db_categoria)
    return db_categoria

@router.delete("/{categoria_id}")
def eliminar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    """Elimina una categoría (solo si no tiene productos asignados)"""
    db_categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar si tiene productos asignados
    productos_con_categoria = db.query(Producto).filter(Producto.categoria_id == categoria_id).count()
    if productos_con_categoria > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"No se puede eliminar: hay {productos_con_categoria} producto(s) con esta categoría"
        )
    
    db.delete(db_categoria)
    db.commit()
    return {"message": "Categoría eliminada"}