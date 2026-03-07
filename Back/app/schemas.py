from pydantic import BaseModel, EmailStr, Field, model_validator
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# === USUARIOS ===
class UsuarioBase(BaseModel):
    username: str
    email: Optional[str] = None
    nombre_completo: Optional[str] = None
    rol_id: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(UsuarioBase):
    """Schema para actualización - password opcional"""
    password: Optional[str] = None

class UsuarioLogin(BaseModel):
    username: str
    password: str

class UsuarioResponse(UsuarioBase):
    id: int
    activo: bool
    creado_en: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenConUsuario(Token):
    usuario: dict
    cajas_abiertas: Optional[list] = None  # ← Para detectar cierre inesperado

# === PRODUCTOS ===

# Schema para proveedor asociado a producto (M:N)
class ProveedorAsociado(BaseModel):
    id: int
    nombre: str
    costo_compra: Optional[float] = None
    es_principal: bool = False
    
    class Config:
        from_attributes = True

class ProductoBase(BaseModel):
    sku: Optional[str] = None
    nombre: str
    categoria_id: Optional[int] = None
    proveedor_id: Optional[int] = None  # ← Legacy (proveedor principal)
    unidad_medida: str
    stock_actual: float = 0
    stock_minimo: float = 0
    costo_promedio: float = 0
    precio_venta: float = 0
    margen_personalizado: Optional[float] = None
    iva_compra: Optional[bool] = False
    iva_venta: Optional[bool] = False
    # ← Nuevos campos para M:N
    proveedor_ids: Optional[List[int]] = None  # IDs de proveedores para crear/editar
    proveedor_id_principal: Optional[int] = None  # ID del proveedor principal

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    unidad_medida: Optional[str] = None
    stock_actual: Optional[float] = None
    stock_minimo: Optional[float] = None
    costo_promedio: Optional[float] = None
    precio_venta: Optional[float] = None
    margen_personalizado: Optional[float] = None
    iva_compra: Optional[bool] = None
    iva_venta: Optional[bool] = None
    activo: Optional[bool] = None
    # ← Nuevos campos para M:N
    proveedor_ids: Optional[List[int]] = None
    proveedor_id_principal: Optional[int] = None

class ProductoResponse(ProductoBase):
    id: int
    activo: bool
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    categoria_nombre: Optional[str] = None
    # Margen minorista
    margen_categoria_minorista: Optional[float] = None
    margen_efectivo_minorista: Optional[float] = None
    # Margen mayorista
    margen_categoria_mayorista: Optional[float] = None
    margen_efectivo_mayorista: Optional[float] = None
    # Precios
    precio_venta_minorista: Optional[float] = None
    precio_venta_mayorista: Optional[float] = None
    # ← Nuevos campos para M:N
    proveedores: Optional[List[ProveedorAsociado]] = None  # Todos los proveedores asociados
    proveedor_principal: Optional[ProveedorAsociado] = None  # Proveedor principal

    class Config:
        from_attributes = True

# === HISTORIAL DE MÁRGENES ===
class HistorialMargenesCreate(BaseModel):
    producto_id: int
    margen_anterior: float
    margen_nuevo: float
    precio_costo_anterior: float
    precio_costo_nuevo: float
    precio_venta_anterior: float
    precio_venta_nuevo: float
    usuario_id: Optional[int] = None
    motivo: str

class HistorialMargenesResponse(HistorialMargenesCreate):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# === ACTUALIZACIÓN MASIVA DE MÁRGENES ===
class ActualizarMargenMasivoRequest(BaseModel):
    producto_ids: Optional[List[int]] = None
    categoria_id: Optional[int] = None
    nuevo_margen: float
    tipo_cliente: str = 'minorista'
    motivo: str = 'actualizacion_masiva'

class ActualizarMargenMasivoResponse(BaseModel):
    actualizados: int
    error: Optional[str] = None
    detalle: Optional[List[dict]] = None

# === ACTUALIZACIÓN INDIVIDUAL DE MARGEN ===
class MargenUpdateRequest(BaseModel):
    margen_personalizado: float
    motivo: Optional[str] = 'manual'

class MargenUpdateResponse(BaseModel):
    message: str
    producto: str
    margen_anterior: float
    margen_nuevo: float
    precio_venta_nuevo: float
    error: Optional[str] = None
    warning: Optional[str] = None

class MargenIndividualUpdate(BaseModel):
    """Actualiza márgenes minorista y/o mayorista de un producto"""
    margen_minorista: Optional[float] = None
    margen_mayorista: Optional[float] = None
    motivo: str = 'manual'

class MargenIndividualResponse(BaseModel):
    message: str
    producto: str
    margen_minorista_anterior: Optional[float] = None
    margen_minorista_nuevo: Optional[float] = None
    margen_mayorista_anterior: Optional[float] = None
    margen_mayorista_nuevo: Optional[float] = None
    precio_venta_minorista: Optional[float] = None
    precio_venta_mayorista: Optional[float] = None
    error: Optional[str] = None

# === CATEGORÍAS ===
class CategoriaBase(BaseModel):
    nombre: str
    margen_default_minorista: float = 0
    margen_default_mayorista: float = 0

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(BaseModel):
    nombre: Optional[str] = None
    margen_default_minorista: Optional[float] = None
    margen_default_mayorista: Optional[float] = None

class CategoriaResponse(CategoriaBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# === PROVEEDORES ===
class ProveedorBase(BaseModel):
    nombre: str
    cuit: Optional[str] = None  # ← AGREGADO para consistencia con Cliente
    contacto: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorResponse(ProveedorBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# === CAJA ===
class MovimientoCajaCreate(BaseModel):
    fecha: Optional[date] = Field(default_factory=date.today)
    tipo_movimiento: str
    tipo: Optional[str] = None
    categoria_caja_id: Optional[int] = None
    descripcion: str
    monto: float
    proveedor_id: Optional[int] = None
    medio_pago: Optional[str] = "efectivo"
    
   
    @model_validator(mode='before')
    @classmethod
    def set_tipo_from_tipo_movimiento(cls, values):
        if isinstance(values, dict):
            if values.get('tipo') is None and values.get('tipo_movimiento'):
                values['tipo'] = values['tipo_movimiento']
        return values
    
    class Config:
        from_attributes = True
        populate_by_name = True

class MovimientoCajaResponse(BaseModel):
    id: int
    fecha: date
    tipo_movimiento: str
    descripcion: Optional[str]
    monto: float
    tipo: str
    creado_en: datetime

    class Config:
        from_attributes = True

# === CAJA DIA (APERTURA/CIERRE) ===
class CajaDiaCreate(BaseModel):
    """Schema para apertura de caja"""
    fecha: Optional[date] = Field(default_factory=date.today)
    saldo_inicial: float = 0
    observaciones: Optional[str] = None


class CajaDiaResponse(BaseModel):
    """Schema para caja del día"""
    id: int
    fecha: date
    saldo_inicial: float
    saldo_final: Optional[float] = None
    estado: str
    usuario_id: Optional[int] = None
    fecha_apertura: Optional[datetime] = None
    fecha_cierre: Optional[datetime] = None
    observaciones_cierre: Optional[str] = None

    class Config:
        from_attributes = True


class CajaCierreCreate(BaseModel):
    """Schema para cierre de caja"""
    saldo_final: float
    observaciones: Optional[str] = None

# === PRECIOS ===
class ListaPreciosBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo_cliente: str  # 'minorista' | 'mayorista' | 'todos'
    categorias_incluidas: List[int] = []  # IDs de categorías

class ListaPreciosCreate(ListaPreciosBase):
    pass

class ListaPreciosResponse(ListaPreciosBase):
    id: int
    activa: bool
    creado_en: datetime

    class Config:
        from_attributes = True

class ActualizarPreciosBloque(BaseModel):
    categoria_id: int
    porcentaje_aumento: float
    tipo_lista: str  # 'minorista' o 'mayorista'

class PrecioVistaPrevia(BaseModel):
    producto_id: int
    producto_nombre: str
    precio_actual: float
    precio_nuevo: float
    variacion: float

# Schemas para actualización masiva
class ActualizacionMasivaRequest(BaseModel):
    producto_ids: List[int]
    tipo_actualizacion: str  # 'porcentaje', 'monto_fijo', 'nuevo_precio'
    valor: float

class ActualizacionMasivaResponse(BaseModel):
    actualizados: int
    error: Optional[str] = None

# Schema para impresión de listas agrupada
class ProductoImpresion(BaseModel):
    sku: str
    nombre: str
    precio_venta: float

class ListaPreciosImpresionResponse(BaseModel):
    lista_nombre: str
    tipo_cliente: str
    productos_agrupados: dict  # {categoria: [productos]}
    
# === CLIENTES ===
class ClienteBase(BaseModel):
    nombre: str  # Single field: "Juan Perez" o "Razón Social S.A."
    cuit: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    condicion_iva: str = "Consumidor Final"
    tipo_cliente: str = "minorista"  # 'minorista' o 'mayorista'

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    cuit: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    condicion_iva: Optional[str] = None
    tipo_cliente: Optional[str] = None

class ClienteResponse(ClienteBase):
    id: int
    creado_en: datetime

    class Config:
        from_attributes = True

# === FACTURAS (Para Notas de Crédito) ===
class FacturaResponse(BaseModel):
    id: int
    punto_venta: int
    numero_factura: int
    tipo_comprobante: str
    fecha: date
    cliente_id: Optional[int] = None
    subtotal: float
    iva: float
    total: float
    medio_pago: Optional[str]
    estado: str
    creado_en: datetime

    class Config:
        from_attributes = True

# === COMPRAS (FC COMPRA) ===
class CompraDetalleCreate(BaseModel):
    producto_id: int
    cantidad: float
    costo_unitario: float

class CompraDetalleResponse(CompraDetalleCreate):
    id: int
    costo_anterior: Optional[float] = None
    subtotal: float

    class Config:
        from_attributes = True

class FCCompraCreate(BaseModel):
    """Schema para crear Factura de Compra"""
    numero_factura: str  # Obligatorio (del proveedor)
    proveedor_id: int
    fecha: date
    fecha_vencimiento: Optional[date] = None
    medio_pago: str  # efectivo, transferencia, cta_cte, cheque
    numero_remision: Optional[str] = None
    observaciones: Optional[str] = None
    detalles: List[CompraDetalleCreate]
    tipo_comprobante: str = "compra"  # "compra" o "nota_credito"

class CompraUpdate(BaseModel):
    """Schema para modificar compra existente"""
    numero_remision: Optional[str] = None
    numero_factura: Optional[str] = None
    medio_pago: Optional[str] = None
    detalles: Optional[List[CompraDetalleCreate]] = None

class ProductoPrecioCambiado(BaseModel):
    """Schema para registrar cambios de precio en FC de Compra"""
    id: int
    nombre: str
    costo_anterior: float
    costo_nuevo: float
    precio_venta_anterior: float
    precio_venta_nuevo: float

class CompraResponse(BaseModel):
    id: int
    numero_interno: Optional[str] = None  # FC-0001
    numero_factura: str  # 0001-00001234
    fecha: date
    fecha_vencimiento: Optional[date] = None
    proveedor_id: int
    numero_remision: Optional[str] = None
    subtotal: Optional[float] = 0
    iva: Optional[float] = 0
    total: float
    medio_pago: Optional[str] = None
    estado: str  # 'registrada', 'anulada', 'borrador'
    observaciones: Optional[str] = None
    anulado_por: Optional[int] = None
    fecha_anulacion: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    productos_con_cambios: Optional[List[ProductoPrecioCambiado]] = None

    class Config:
        from_attributes = True

class CompraResponseComplete(CompraResponse):
    proveedor: Optional[ProveedorResponse] = None
    detalles: List[CompraDetalleResponse] = []

    class Config:
        from_attributes = True

# === FC VENTA (Factura de Venta) ===
class FCVentaItemCreate(BaseModel):
    producto_id: int
    cantidad: float
    precio_unitario: float

class FCVentaItemResponse(BaseModel):
    id: int
    producto_id: int
    producto_nombre: str
    producto_sku: str
    cantidad: float
    precio_unitario: float
    costo_unitario: float
    subtotal: float
    ganancia: float
    
    class Config:
        from_attributes = True

class FCVentaCreate(BaseModel):
    tipo_comprobante: str = 'venta'  # 'venta' o 'nota_credito'
    tipo_documento: str = 'FC'  # FC, FB, TK (solo para ventas)
    punto_venta: int = 1
    numero_factura: Optional[int] = None  # ← AUTO GENERADO (opcional)
    cliente_id: int
    fecha: date
    fecha_vencimiento: Optional[datetime] = None
    medio_pago: str
    items: List[FCVentaItemCreate]
    observaciones: Optional[str] = None

class FCVentaResponse(BaseModel):
    id: int
    numero_interno: str
    punto_venta: int
    numero_factura: int
    tipo_comprobante: str
    cliente_id: int
    cliente_nombre: str
    fecha: date
    fecha_vencimiento: Optional[datetime] = None
    subtotal: float
    iva: float
    total: float
    medio_pago: str
    estado: str
    observaciones: Optional[str] = None
    creado_en: datetime
    anulado_por: Optional[int] = None
    fecha_anulacion: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None
    items: List[FCVentaItemResponse]
    
    class Config:
        from_attributes = True

# === NOTAS DE CRÉDITO ===
class NotaCreditoDetalleCreate(BaseModel):
    producto_id: int
    cantidad: float
    precio_unitario: float
    iva_porcentaje: float = 21

class NotaCreditoCreate(BaseModel):
    factura_id: Optional[int] = None
    punto_venta: int = 1
    tipo_comprobante: str = "NC"
    cliente_id: int
    motivo: str
    medio_pago: Optional[str] = None
    detalles: List[NotaCreditoDetalleCreate]

class NotaCreditoResponse(BaseModel):
    id: int
    factura_id: Optional[int]
    punto_venta: int
    numero_nota_credito: int
    tipo_comprobante: str
    fecha: date
    cliente_id: int
    motivo: str
    subtotal: float
    iva: float
    total: float
    medio_pago: Optional[str]
    estado: str
    creado_en: datetime
    
    class Config:
        from_attributes = True

class NotaCreditoResponseComplete(NotaCreditoResponse):
    cliente: Optional[ClienteResponse] = None
    factura: Optional[FacturaResponse] = None
    detalles: List[NotaCreditoDetalleCreate] = []
    
    class Config:
        from_attributes = True

# === LOGIN ===
class LoginRequest(BaseModel):
    username: str
    password: str

# === CUENTA CORRIENTE ===
class CuentaCorrienteBase(BaseModel):
    tipo: str  # 'proveedor' o 'cliente'
    entidad_id: int
    descripcion: Optional[str] = None

class CuentaCorrienteCreate(CuentaCorrienteBase):
    debe: float = 0
    haber: float = 0
    compra_id: Optional[int] = None
    venta_id: Optional[int] = None

class CuentaCorrienteResponse(CuentaCorrienteBase):
    id: int
    debe: float
    haber: float
    saldo: float
    fecha: datetime
    compra_id: Optional[int] = None
    venta_id: Optional[int] = None
    medio_pago: Optional[str] = None
    creado_en: datetime

    class Config:
        from_attributes = True

class PagoCreate(BaseModel):
    proveedor_id: int
    monto: float
    medio_pago: str  # 'efectivo', 'transferencia', 'cheque', etc.
    descripcion: Optional[str] = None
    fecha: date = Field(default_factory=date.today)

class CobroCreate(BaseModel):
    cliente_id: int
    monto: float
    medio_pago: str  # 'efectivo', 'transferencia', 'cheque', etc.
    descripcion: Optional[str] = None
    fecha: date = Field(default_factory=date.today)

class CuentaCorrienteResumen(BaseModel):
    proveedor_id: Optional[int] = None
    cliente_id: Optional[int] = None
    debe: float
    haber: float
    saldo: float


# ============================================
# RECIBOS (COBROS Y PAGOS)
# ============================================

class ReciboImputacionCreate(BaseModel):
    venta_id: Optional[int] = None  # Si es cobro
    compra_id: Optional[int] = None  # Si es pago
    monto_imputado: float


class ReciboCreate(BaseModel):
    tipo: str  # 'cobro' o 'pago'
    cliente_id: Optional[int] = None  # Si es cobro
    proveedor_id: Optional[int] = None  # Si es pago
    fecha: date = Field(default_factory=date.today)
    monto: float
    medio_pago: str  # efectivo, transferencia, cheque, tarjeta
    observaciones: Optional[str] = None
    imputaciones: List[ReciboImputacionCreate] = []


class ReciboAnular(BaseModel):
    """Schema para anular recibo"""
    motivo: str = Field(..., min_length=1, description="Motivo de la anulación (requerido)")


class ReciboImputacionResponse(BaseModel):
    id: int
    recibo_id: int
    venta_id: Optional[int] = None
    compra_id: Optional[int] = None
    monto_imputado: float

    class Config:
        from_attributes = True


class ReciboResponse(BaseModel):
    id: int
    numero_interno: str
    tipo: str
    cliente_id: Optional[int] = None
    proveedor_id: Optional[int] = None
    fecha: date
    monto: float
    medio_pago: str
    estado: str
    observaciones: Optional[str] = None
    creado_en: datetime
    cliente_nombre: Optional[str] = None
    proveedor_nombre: Optional[str] = None
    imputaciones: List[ReciboImputacionResponse] = []
    # ✅ Auditoría de anulación
    anulado_por: Optional[int] = None
    fecha_anulacion: Optional[datetime] = None
    motivo_anulacion: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================
# CONFIGURACIÓN DE EMPRESA
# ============================================

class ConfiguracionEmpresaBase(BaseModel):
    nombre_empresa: str
    razon_social: Optional[str] = None
    cuit: Optional[str] = None
    condicion_iva: Optional[str] = None
    ingresos_brutos: Optional[str] = None
    inicio_actividades: Optional[date] = None
    direccion: Optional[str] = None
    localidad: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    pie_factura: Optional[str] = None

class ConfiguracionEmpresaCreate(ConfiguracionEmpresaBase):
    pass

class ConfiguracionEmpresaUpdate(BaseModel):
    nombre_empresa: Optional[str] = None
    razon_social: Optional[str] = None
    cuit: Optional[str] = None
    condicion_iva: Optional[str] = None
    ingresos_brutos: Optional[str] = None
    inicio_actividades: Optional[date] = None
    direccion: Optional[str] = None
    localidad: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    logo_url: Optional[str] = None
    pie_factura: Optional[str] = None

class ConfiguracionEmpresaResponse(ConfiguracionEmpresaBase):
    id: int
    creado_en: datetime
    actualizado_en: datetime

    class Config:
        from_attributes = True