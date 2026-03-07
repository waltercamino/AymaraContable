from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, JSON, Numeric, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime, date
from app.database import Base

# ============================================
# 1. TABLAS DE USUARIOS Y SEGURIDAD
# ============================================

class Rol(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(String(200))
    permisos = Column(JSON, default=[])
    
    usuarios = relationship("Usuario", back_populates="rol")

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100))
    nombre_completo = Column(String(200))
    rol_id = Column(Integer, ForeignKey("roles.id"))
    activo = Column(Boolean, default=True)
    ultimo_acceso = Column(DateTime)
    creado_en = Column(DateTime, server_default=func.now())

    rol = relationship("Rol", back_populates="usuarios")
    movimientos = relationship("MovimientoCaja", back_populates="usuario")
    facturas = relationship(
        "Factura",
        back_populates="usuario",
        foreign_keys="[Factura.usuario_id]"
    )
    compras = relationship("Compra", foreign_keys="Compra.usuario_id", back_populates="usuario")
    compras_anuladas = relationship("Compra", foreign_keys="Compra.anulado_por", back_populates="usuario_anulacion")
    facturas_anuladas = relationship(
        "Factura",
        foreign_keys="[Factura.anulado_por]",
        back_populates="usuario_anulacion"
    )

# ============================================
# 2. TABLAS DE PRODUCTOS
# ============================================

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    margen_default_minorista = Column(Numeric(5,2), default=0)
    margen_default_mayorista = Column(Numeric(5,2), default=0)
    creado_en = Column(DateTime, server_default=func.now())

    productos = relationship("Producto", back_populates="categoria")

class Proveedor(Base):
    __tablename__ = "proveedores"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)
    cuit = Column(String(20))  # ← AGREGADO para consistencia con Cliente
    contacto = Column(String(100))
    telefono = Column(String(20))
    email = Column(String(100))
    website = Column(String(200))
    creado_en = Column(DateTime, server_default=func.now())

    productos = relationship("Producto", back_populates="proveedor")
    historial_costos = relationship("HistorialCostos", back_populates="proveedor")
    recibos = relationship("Recibo", back_populates="proveedor")
    movimientos_caja = relationship("MovimientoCaja", back_populates="proveedor")
    productos_asociados = relationship("ProductoProveedor", back_populates="proveedor", cascade="all, delete-orphan")

# ============================================
# TABLA INTERMEDIA M:N PRODUCTO-PROVEEDOR
# ============================================
class ProductoProveedor(Base):
    """Relación M:N entre Producto y Proveedor"""
    __tablename__ = "producto_proveedor"

    id = Column(Integer, primary_key=True)
    producto_id = Column(Integer, ForeignKey("productos.id", ondelete="CASCADE"), nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id", ondelete="CASCADE"), nullable=False)
    costo_compra = Column(Numeric(10,2))  # Precio histórico de compra de este proveedor
    es_principal = Column(Boolean, default=False)  # Proveedor por defecto
    creado_en = Column(DateTime, server_default=func.now())

    # Relaciones
    producto = relationship("Producto", back_populates="proveedores_asociados")
    proveedor = relationship("Proveedor", back_populates="productos_asociados")

    # Constraint único para evitar duplicados
    __table_args__ = (
        # UniqueConstraint('producto_id', 'proveedor_id', name='uq_producto_proveedor'),
    )


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True)
    sku = Column(String(50), unique=True)
    nombre = Column(String(200), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    unidad_medida = Column(String(20), nullable=False)
    stock_actual = Column(Numeric(10,3), default=0)
    stock_minimo = Column(Numeric(10,3), default=0)
    costo_promedio = Column(Numeric(10,2), default=0)  # Costo promedio ponderado
    precio_venta = Column(Numeric(10,2), default=0)  # Precio de venta minorista
    precio_venta_mayorista = Column(Numeric(10,2), default=0)  # Precio de venta mayorista
    margen_personalizado = Column(Numeric(5,2))  # NULL = usa categoría (minorista)
    margen_personalizado_mayorista = Column(Numeric(5,2))  # NULL = usa categoría (mayorista)
    iva_compra = Column(Boolean, default=False)
    iva_venta = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    categoria = relationship("Categoria", back_populates="productos")
    proveedor = relationship("Proveedor", back_populates="productos")  # ← Proveedor principal (legacy)
    proveedores_asociados = relationship("ProductoProveedor", back_populates="producto", cascade="all, delete-orphan")  # ← M:N
    historial_costos = relationship("HistorialCostos", back_populates="producto")
    detalles_lista = relationship("DetalleListaPrecio", back_populates="producto")
    historial_margenes = relationship("HistorialMargenes", back_populates="producto")

class HistorialCostos(Base):
    __tablename__ = "historial_costos"
    
    id = Column(Integer, primary_key=True)
    producto_id = Column(Integer, ForeignKey("productos.id"))
    costo_compra = Column(Numeric(10,2), nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    fecha_desde = Column(Date, nullable=False)
    fecha_hasta = Column(Date)
    creado_en = Column(DateTime, server_default=func.now())
    
    producto = relationship("Producto", back_populates="historial_costos")
    proveedor = relationship("Proveedor", back_populates="historial_costos")

class HistorialMargenes(Base):
    __tablename__ = "historial_margenes"

    id = Column(Integer, primary_key=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    margen_anterior = Column(Numeric(5,2))
    margen_nuevo = Column(Numeric(5,2))
    precio_costo_anterior = Column(Numeric(10,2))
    precio_costo_nuevo = Column(Numeric(10,2))
    precio_venta_anterior = Column(Numeric(10,2))
    precio_venta_nuevo = Column(Numeric(10,2))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    motivo = Column(String(200))  # 'manual', 'actualizacion_masiva', 'oferta', etc.
    creado_en = Column(DateTime, server_default=func.now())

    producto = relationship("Producto", back_populates="historial_margenes")

class ListaPrecio(Base):
    __tablename__ = "listas_precios"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(300))
    tipo_cliente = Column(String(20), nullable=False)  # 'minorista' | 'mayorista' | 'todos'
    categorias_incluidas = Column(JSON, default=[])  # Lista de IDs de categorías [1, 2, 3]
    vigencia_desde = Column(Date, nullable=False)
    vigencia_hasta = Column(Date)
    activa = Column(Boolean, default=True)
    creado_en = Column(DateTime, server_default=func.now())

    detalles = relationship("DetalleListaPrecio", back_populates="lista_precios")

class DetalleListaPrecio(Base):
    __tablename__ = "detalles_lista_precios"
    
    id = Column(Integer, primary_key=True)
    lista_precios_id = Column(Integer, ForeignKey("listas_precios.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    costo_compra = Column(Numeric(10,2), nullable=False)
    margen_porcentaje = Column(Numeric(5,2), nullable=False)
    precio_venta = Column(Numeric(10,2), nullable=False)
    unidad_venta = Column(String(20), nullable=False)
    
    lista_precios = relationship("ListaPrecio", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles_lista")

# ============================================
# 3. TABLAS DE CAJA Y MOVIMIENTOS
# ============================================

class CategoriaCaja(Base):
    __tablename__ = "categorias_caja"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    tipo = Column(String(20), nullable=False)
    subcategoria = Column(String(50))
    
    movimientos = relationship("MovimientoCaja", back_populates="categoria_caja")

class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"

    id = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False)
    tipo_movimiento = Column(String(20), nullable=False)
    categoria_caja_id = Column(Integer, ForeignKey("categorias_caja.id"))
    descripcion = Column(String(300))
    monto = Column(Numeric(10,2), nullable=False)
    tipo = Column(String(10), nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)  # ✅ AGREGADO
    caja_id = Column(Integer, ForeignKey("caja_dia.id"), nullable=True)  # ✅ FIX: Vincula a sesión de caja
    medio_pago = Column(String(50))
    comprobante_nro = Column(String(50))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    creado_en = Column(DateTime, server_default=func.now())

    categoria_caja = relationship("CategoriaCaja", back_populates="movimientos")
    usuario = relationship("Usuario", back_populates="movimientos")
    proveedor = relationship("Proveedor", back_populates="movimientos_caja")
    cliente = relationship("Cliente", back_populates="movimientos_caja")
    caja = relationship("CajaDia", backref="movimientos")

class CajaDia(Base):
    """Apertura/Cierre de caja diaria"""
    __tablename__ = "caja_dia"

    id = Column(Integer, primary_key=True)
    fecha = Column(Date, nullable=False, unique=True)
    saldo_inicial = Column(Numeric(12,2), default=0)
    saldo_final = Column(Numeric(12,2))
    estado = Column(String(20), default="abierto")  # abierto, cerrado
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    fecha_apertura = Column(DateTime, server_default=func.now())
    fecha_cierre = Column(DateTime)
    observaciones_cierre = Column(Text)
    creado_en = Column(DateTime, server_default=func.now())

    usuario = relationship("Usuario", backref="cajas")


# ============================================
# 4. TABLAS DE CLIENTES Y FACTURACIÓN
# ============================================

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String(200), nullable=False)  # Single field: "Juan Perez" o "Razón Social S.A."
    cuit = Column(String(20), unique=True)
    email = Column(String(100))
    telefono = Column(String(20))
    direccion = Column(String(300))
    ciudad = Column(String(100))
    codigo_postal = Column(String(10))
    condicion_iva = Column(String(50), default="Consumidor Final")
    tipo_cliente = Column(String(20), default="minorista")  # 'minorista' o 'mayorista'
    creado_en = Column(DateTime, server_default=func.now())

    facturas = relationship("Factura", back_populates="cliente")
    recibos = relationship("Recibo", back_populates="cliente")
    movimientos_caja = relationship("MovimientoCaja", back_populates="cliente")

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    numero_interno = Column(String(20))  # FV-0001 (auto generado)
    punto_venta = Column(Integer, default=1)
    numero_factura = Column(Integer, nullable=False)
    tipo_comprobante = Column(String(20), nullable=False)  # FC, FB, TK
    fecha = Column(Date, nullable=False)
    fecha_vencimiento = Column(DateTime, nullable=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    subtotal = Column(Numeric(10,2), nullable=False)
    iva = Column(Numeric(10,2), default=0)  # Monotributo: 0
    total = Column(Numeric(10,2), nullable=False)
    medio_pago = Column(String(50))  # efectivo, transferencia, cta_cte, cheque
    estado = Column(String(50), default='emitida')  # emitida, anulada
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, server_default=func.now())
    
    # Auditoría de anulación
    anulado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_anulacion = Column(DateTime, nullable=True)
    motivo_anulacion = Column(String(500), nullable=True)
    actualizado_en = Column(DateTime, default=func.now(), onupdate=func.now())
    observaciones = Column(String(500), nullable=True)

    cliente = relationship("Cliente", back_populates="facturas")
    items = relationship("FacturaDetalle", back_populates="factura", cascade="all, delete-orphan")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="facturas")
    usuario_anulacion = relationship("Usuario", foreign_keys=[anulado_por], back_populates="facturas_anuladas")

class FacturaDetalle(Base):
    __tablename__ = "factura_detalles"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Numeric(10,3), nullable=False)
    precio_unitario = Column(Numeric(10,2), nullable=False)
    costo_unitario = Column(Numeric(10,2), nullable=True)  # Para calcular ganancia
    subtotal = Column(Numeric(10,2), nullable=False)
    
    factura = relationship("Factura", back_populates="items")
    producto = relationship("Producto")
    
# ============================================
# 5. TABLAS DE COMPRAS
# ============================================

class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True)
    numero_interno = Column(String(20), unique=True, nullable=True)  # FC-0001 (auto generado)
    numero_factura = Column(String(50), nullable=False)  # 0001-00001234 (del proveedor)
    fecha = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)  # Para cta. cte.
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    numero_remision = Column(String(50))
    subtotal = Column(Numeric(10,2), nullable=False)
    iva = Column(Numeric(10,2), default=0)
    total = Column(Numeric(10,2), nullable=False)
    medio_pago = Column(String(50))  # efectivo, transferencia, cta_cte, cheque
    estado = Column(String(20), default="registrada")  # registrada, anulada

    # Auditoría de anulación
    anulado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_anulacion = Column(DateTime, nullable=True)
    motivo_anulacion = Column(String(500), nullable=True)

    observaciones = Column(String(500), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, default=func.now(), onupdate=func.now())

    proveedor = relationship("Proveedor")
    detalles = relationship("CompraDetalle", back_populates="compra")
    usuario = relationship("Usuario", foreign_keys=[usuario_id], back_populates="compras")
    usuario_anulacion = relationship("Usuario", foreign_keys=[anulado_por], back_populates="compras_anuladas")

class CompraDetalle(Base):
    __tablename__ = "compra_detalles"

    id = Column(Integer, primary_key=True)
    compra_id = Column(Integer, ForeignKey("compras.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Numeric(10,3), nullable=False)
    costo_unitario = Column(Numeric(10,2), nullable=False)
    costo_anterior = Column(Numeric(10,2), nullable=True)  # ← Costo antes de esta compra (para anulación)
    subtotal = Column(Numeric(10,2), nullable=False)

    compra = relationship("Compra", back_populates="detalles")
    producto = relationship("Producto")

# ============================================
# 6. TABLAS DE CUENTA CORRIENTE
# ============================================

class CuentaCorriente(Base):
    __tablename__ = "cuenta_corriente"

    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20))  # 'proveedor' o 'cliente'
    entidad_id = Column(Integer)  # proveedor_id o cliente_id
    compra_id = Column(Integer, ForeignKey("compras.id"), nullable=True)
    venta_id = Column(Integer, ForeignKey("facturas.id"), nullable=True)  # ✅ Apunta a facturas, no a ventas (legacy)
    pago_id = Column(Integer, ForeignKey("movimientos_caja.id"), nullable=True)
    cobro_id = Column(Integer, ForeignKey("movimientos_caja.id"), nullable=True)

    debe = Column(Numeric(12,2), default=0)  # Lo que debe (aumenta deuda)
    haber = Column(Numeric(12,2), default=0)  # Lo que paga (reduce deuda)
    saldo = Column(Numeric(12,2), default=0)  # Saldo acumulado

    fecha = Column(DateTime, default=datetime.utcnow)
    fecha_vencimiento = Column(DateTime, nullable=True)  # Para cta. cte.
    descripcion = Column(String(200))
    medio_pago = Column(String(50))  # efectivo, transferencia, cheque, cta_cte
    creado_en = Column(DateTime, server_default=func.now())

    # Relaciones
    factura = relationship("Factura", foreign_keys=[venta_id])  # ✅ FC Venta asociada
    compra = relationship("Compra", foreign_keys=[compra_id])  # ✅ Compra asociada

# ============================================
# 7. TABLAS DE NOTAS DE CRÉDITO
# ============================================

class NotaCredito(Base):
    __tablename__ = "notas_credito"
    
    id = Column(Integer, primary_key=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"))
    punto_venta = Column(Integer, nullable=False, default=1)
    numero_nota_credito = Column(Integer, nullable=False)
    tipo_comprobante = Column(String(2), nullable=False, default="NC")
    fecha = Column(Date, nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    motivo = Column(String(200))
    subtotal = Column(Numeric(10,2), nullable=False)
    iva = Column(Numeric(10,2), default=0)
    total = Column(Numeric(10,2), nullable=False)
    medio_pago = Column(String(50))
    estado = Column(String(20), default="emitida")
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    creado_en = Column(DateTime, server_default=func.now())
    
    factura = relationship("Factura")
    cliente = relationship("Cliente")
    detalles = relationship("NotaCreditoDetalle", back_populates="nota_credito")
    usuario = relationship("Usuario")

class NotaCreditoDetalle(Base):
    __tablename__ = "nota_credito_detalles"
    
    id = Column(Integer, primary_key=True)
    nota_credito_id = Column(Integer, ForeignKey("notas_credito.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Numeric(10,3), nullable=False)
    precio_unitario = Column(Numeric(10,2), nullable=False)
    iva_porcentaje = Column(Numeric(5,2), default=21)
    subtotal = Column(Numeric(10,2), nullable=False)
    
    nota_credito = relationship("NotaCredito", back_populates="detalles")
    producto = relationship("Producto")


# ============================================
# 8. TABLAS DE RECIBOS (COBROS Y PAGOS)
# ============================================

class Recibo(Base):
    __tablename__ = "recibos"

    id = Column(Integer, primary_key=True, index=True)
    numero_interno = Column(String(20), unique=True)  # R-0001 (automático)
    tipo = Column(String(20))  # 'cobro' o 'pago'
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)  # Si es cobro
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=True)  # Si es pago
    fecha = Column(Date, nullable=False)
    monto = Column(Numeric(12, 2), nullable=False)
    medio_pago = Column(String(50))  # efectivo, transferencia, cheque, tarjeta
    estado = Column(String(20), default="registrado")  # registrado, anulado
    observaciones = Column(String(500), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    creado_en = Column(DateTime, server_default=func.now())

    # ✅ Auditoría de anulación
    anulado_por = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha_anulacion = Column(DateTime, nullable=True)
    motivo_anulacion = Column(String(500), nullable=True)

    # Relaciones
    cliente = relationship("Cliente", back_populates="recibos")
    proveedor = relationship("Proveedor", back_populates="recibos")
    imputaciones = relationship("ReciboImputacion", back_populates="recibo", cascade="all, delete-orphan")


class ReciboImputacion(Base):
    __tablename__ = "recibo_imputaciones"

    id = Column(Integer, primary_key=True, index=True)
    recibo_id = Column(Integer, ForeignKey("recibos.id"), nullable=False)
    venta_id = Column(Integer, ForeignKey("facturas.id"), nullable=True)  # Si es cobro
    compra_id = Column(Integer, ForeignKey("compras.id"), nullable=True)  # Si es pago
    monto_imputado = Column(Numeric(12, 2), nullable=False)

    # Relaciones
    recibo = relationship("Recibo", back_populates="imputaciones")
    venta = relationship("Factura")
    compra = relationship("Compra")


# ============================================
# 9. TABLAS DE PEDIDOS A PROVEEDORES
# ============================================

class PedidoProveedor(Base):
    """Pedido/solicitud a proveedor (no registra deuda)"""
    __tablename__ = "pedidos_proveedor"

    id = Column(Integer, primary_key=True, index=True)
    numero_interno = Column(String(20), unique=True, nullable=False)
    fecha_pedido = Column(Date, nullable=False, default=date.today)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"))
    estado = Column(String(20), default="pendiente")  # pendiente, enviado, recibido, cancelado
    total_estimado = Column(Numeric(12,2), default=0)
    observaciones = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    creado_en = Column(DateTime, server_default=func.now())
    recibido_en = Column(DateTime)
    fecha_entrega_estimada = Column(Date)

    proveedor = relationship("Proveedor")
    detalles = relationship("PedidoDetalle", back_populates="pedido", cascade="all, delete-orphan")
    usuario = relationship("Usuario")


class PedidoDetalle(Base):
    """Detalle de productos en un pedido"""
    __tablename__ = "pedido_detalles"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos_proveedor.id", ondelete="CASCADE"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    precio_costo = Column(Numeric(12,2))
    subtotal = Column(Numeric(12,2))
    recibido_cantidad = Column(Integer, default=0)
    estado = Column(String(20), default="pendiente")  # pendiente, recibido, cancelado

    pedido = relationship("PedidoProveedor", back_populates="detalles")
    producto = relationship("Producto")


# ============================================
# 10. CONFIGURACIÓN DE EMPRESA
# ============================================

class ConfiguracionEmpresa(Base):
    """Configuración de datos de la empresa (nombre, CUIT, logo, etc.)"""
    __tablename__ = "configuracion_empresa"

    id = Column(Integer, primary_key=True)
    nombre_empresa = Column(String(200), nullable=False)
    razon_social = Column(String(200))  # Razón social legal
    cuit = Column(String(20))
    condicion_iva = Column(String(100))  # Responsable Inscripto, Consumidor Final, etc.
    ingresos_brutos = Column(String(50))  # Número de Inscripción en IIBB
    inicio_actividades = Column(Date)  # Fecha de inicio de actividades
    direccion = Column(String(200))
    localidad = Column(String(100))  # Localidad/Ciudad
    telefono = Column(String(20))
    email = Column(String(100))
    logo_url = Column(String(500))  # Ruta: /uploads/logo.png
    pie_factura = Column(Text)
    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())