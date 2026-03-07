"""
Validación de permisos - Single-Tenant
Simple, escalable, no invasivo
"""
from fastapi import Depends, HTTPException, status
from app.models import Usuario
from app.api.usuarios import get_current_user


# === CONFIGURACIÓN CENTRALIZADA ===
# Estructura: "modulo:accion": {"roles_permitidos": [lista de rol_id]}
# rol_id=1 (Admin) siempre tiene acceso total (bypass en código)
PERMISOS_CONFIG = {
    # FC Ventas
    "fc_venta:crear": {"roles": [1, 2, 3]},
    "fc_venta:anular": {"roles": [1]},
    "fc_venta:ver": {"roles": [1, 2, 3]},
    "fc_venta:editar": {"roles": [1]},
    
    # Nota de Crédito
    "nota_credito:crear": {"roles": [1]},
    "nota_credito:ver": {"roles": [1, 2, 3]},
    "nota_credito:anular": {"roles": [1]},
    
    # Caja
    "caja:movimiento": {"roles": [1, 3]},
    "caja:ver": {"roles": [1, 2, 3]},
    "caja:cierre": {"roles": [1]},
    
    # Clientes y Productos
    "clientes:gestionar": {"roles": [1, 2, 3]},
    "productos:gestionar": {"roles": [1, 3]},
    "precios:editar": {"roles": [1, 3]},
    
    # Configuración y Usuarios
    "configuracion:editar": {"roles": [1]},
    "usuarios:gestionar": {"roles": [1]},
    
    # Reportes y Backup
    "reportes:ver": {"roles": [1, 2, 3]},
    "reportes:exportar": {"roles": [1, 3]},
    "backup:exportar": {"roles": [1]},
    "backup:restaurar": {"roles": [1]},
}


def require_permiso(modulo: str, accion: str):
    """
    Decorador para validar permisos en endpoints.
    Admin (rol_id=1) siempre tiene acceso total.
    
    Uso:
    @router.post("/", dependencies=[Depends(require_permiso("fc_venta", "crear"))])
    """
    def _check(usuario: Usuario = Depends(get_current_user)):
        # ✅ Admin Total: bypass (acceso a todo)
        if usuario.rol_id == 1:
            return usuario
        
        # ✅ Buscar configuración del permiso
        clave = f"{modulo}:{accion}"
        config = PERMISOS_CONFIG.get(clave)
        
        # Si no hay config, permitir (no bloquear código existente)
        if not config:
            return usuario
        
        # ✅ Validar rol
        if usuario.rol_id not in config["roles"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso denegado: requiere permiso '{clave}'. Rol actual: {usuario.rol_id}"
            )
        
        return usuario
    
    return _check
