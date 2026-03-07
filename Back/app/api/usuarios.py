from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import get_db
from app.models import Usuario, Rol, Factura
from app.schemas import UsuarioCreate, UsuarioUpdate, UsuarioResponse, LoginRequest, Token, TokenConUsuario
from app.config import settings

router = APIRouter()

# ============================================
# CONFIGURACIÓN DE SEGURIDAD
# ============================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/usuarios/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña coincide con el hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera hash bcrypt para una contraseña"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea token JWT"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=1440))
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    """Obtiene usuario actual desde token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(Usuario).filter(Usuario.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# ============================================
# LOGIN (Para Swagger OAuth2)
# ============================================
@router.post("/login", response_model=TokenConUsuario)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login de usuario - devuelve token JWT
    Usado por Swagger UI para autorización OAuth2
    """
    try:
        # Buscar usuario
        user = db.query(Usuario).filter(Usuario.username == form_data.username).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verificar contraseña
        if not verify_password(form_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Verificar estado
        if not user.activo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo",
            )
        
        # Generar token
        access_token = create_access_token(data={"sub": user.username})

        # Actualizar último acceso
        user.ultimo_acceso = datetime.now(timezone.utc)
        db.commit()

        # 🔍 DETECTAR CAJAS ABIERTAS - SOLO DEL USUARIO LOGUEADO (no de otros)
        from app.models import CajaDia
        cajas_abiertas = db.query(CajaDia).filter(
            CajaDia.estado == "abierto",
            CajaDia.usuario_id == user.id  # ✅ FIX: Solo cajas de ESTE usuario
        ).all()

        cajas_info = []
        for caja in cajas_abiertas:
            cajas_info.append({
                "id": caja.id,
                "fecha": caja.fecha.isoformat() if caja.fecha else None,
                "fecha_apertura": caja.fecha_apertura.isoformat() if caja.fecha_apertura else None,
                "usuario_id": caja.usuario_id,
                "usuario_nombre": caja.usuario.username if caja.usuario else "Desconocido",
                "saldo_inicial": float(caja.saldo_inicial) if caja.saldo_inicial else 0
            })

        print(f"🔍 [LOGIN] Usuario {user.username} login - {len(cajas_info)} caja(s) abierta(s) DE ESTE USUARIO detectada(s)")
        print(f"🔍 [LOGIN] CAJAS_ABERTAS RESPONSE: {cajas_info}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "usuario": {
                "id": user.id,
                "username": user.username,
                "nombre_completo": user.nombre_completo,
                "email": user.email,
                "rol_id": user.rol_id,
            },
            "cajas_abiertas": cajas_info  # ← Solo cajas del usuario logueado
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR LOGIN: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno: {str(e)}",
        )


# ============================================
# LOGOUT
# ============================================
@router.post("/logout")
def logout_acceso(
    usuario: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout: Registra logout para auditoría.
    En cloud, se puede integrar con lista de tokens revocados.
    """
    # Opcional: Registrar en log de auditoría
    # log_auditoria(usuario_id=usuario.id, accion="logout", ip=...)
    
    return {"mensaje": "Sesión cerrada exitosamente"}

# ============================================
# CRUD USUARIOS
# ============================================
@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    """Lista todos los usuarios"""
    return db.query(Usuario).all()

@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario: UsuarioCreate, 
                  current_user: Usuario = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """Crea un nuevo usuario - Solo permitido para Administrador Total (rol_id=1)"""
    
    # Verificar permisos de administrador
    if current_user.rol_id != 1:
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: Solo el Administrador Total puede crear usuarios."
        )
    
    existing = db.query(Usuario).filter(Usuario.username == usuario.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya existe")

    db_usuario = Usuario(
        username=usuario.username,
        email=usuario.email,
        nombre_completo=usuario.nombre_completo,
        rol_id=usuario.rol_id or 2,
        password_hash=get_password_hash(usuario.password)
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(usuario_id: int, 
                       usuario: UsuarioUpdate,
                       current_user: Usuario = Depends(get_current_user),
                       db: Session = Depends(get_db)):
    """Actualiza un usuario - Solo permitido para Administrador Total (rol_id=1)"""
    
    # Verificar permisos de administrador
    if current_user.rol_id != 1:
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: Solo el Administrador Total puede editar usuarios."
        )
    
    db_usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    update_data = usuario.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "password" and value:
            setattr(db_usuario, "password_hash", get_password_hash(value))
        elif key != "password":
            setattr(db_usuario, key, value)

    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@router.delete("/{usuario_id}")
def eliminar_usuario(usuario_id: int, 
                     current_user: Usuario = Depends(get_current_user),
                     db: Session = Depends(get_db)):
    """Elimina físicamente un usuario - Solo permitido para Administrador Total (rol_id=1)"""
    
    # 1. Verificar que el usuario actual sea Administrador Total (rol_id=1)
    if current_user.rol_id != 1:
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: Solo el Administrador Total puede eliminar usuarios."
        )
    
    # 2. No permitir auto-eliminación
    if usuario_id == current_user.id:
        raise HTTPException(
            status_code=403, 
            detail="No puedes eliminarte a ti mismo. Solicita a otro administrador que lo haga."
        )
    
    # 3. Verificar que no sea el último administrador activo
    admins_activos = db.query(Usuario).filter(
        Usuario.rol_id == 1,  # rol_id=1 es admin
        Usuario.activo == True
    ).count()
    
    usuario_a_eliminar = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario_a_eliminar and usuario_a_eliminar.rol_id == 1 and admins_activos <= 1:
        raise HTTPException(
            status_code=403, 
            detail="No se puede eliminar el último administrador activo. Debe haber al menos uno."
        )
    
    if not usuario_a_eliminar:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # 4. Verificar si tiene facturas asociadas (antes: ventas)
    tiene_facturas = db.query(Factura).filter(Factura.usuario_id == usuario_id).first()
    if tiene_facturas:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: el usuario tiene facturas asociadas. Use desactivar."
        )
    
    # 5. Verificar si tiene movimientos de caja
    from app.models import MovimientoCaja
    tiene_caja = db.query(MovimientoCaja).filter(MovimientoCaja.usuario_id == usuario_id).first()
    if tiene_caja:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar: el usuario tiene movimientos de caja. Use desactivar."
        )
    
    db.delete(usuario_a_eliminar)
    db.commit()
    return {"message": "Usuario eliminado permanentemente"}

@router.get("/me", response_model=UsuarioResponse)
def obtener_usuario_actual(current_user: Usuario = Depends(get_current_user)):
    """Obtiene datos del usuario logueado"""
    return current_user