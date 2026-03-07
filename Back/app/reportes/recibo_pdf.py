"""
Generador de PDF para Recibos - Formato Similar a FC Venta
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
import re


def format_currency(value: float) -> str:
    """Formatea un valor como moneda argentina"""
    return f"${value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def generar_pdf_recibo(recibo: dict, empresa: dict = None) -> bytes:
    """
    Genera un PDF con el recibo de cobro o pago - Formato simple.

    Args:
        recibo: Diccionario con los datos del recibo
        empresa: Diccionario con datos de la empresa (nombre, cuit, logo, etc.)

    Returns:
        Bytes del PDF generado
    """
    # Datos de empresa por defecto
    if not empresa:
        empresa = {
            'nombre_empresa': 'AYMARA',
            'cuit': '',
            'direccion': '',
            'telefono': '',
            'email': '',
            'pie_factura': ''
        }
    
    # 🔍 Logging para debug
    print(f"🔍 [RECIBO-PDF] === INICIO ===")
    print(f"🔍 [RECIBO-PDF] recibo_data: {recibo}")

    # ✅ USAR numero_interno DIRECTAMENTE (YA VIENE "R-0023" DE TABLA RECIBOS)
    numero_recibo = recibo.get('numero_interno', 'N/A')
    print(f"🔍 [RECIBO-PDF] numero_recibo: {numero_recibo}")
    print(f"🔍 [RECIBO-PDF] fecha: {recibo.get('fecha', 'N/A')}")

    buffer = BytesIO()
    
    # === MARGEN SUPERIOR REDUCIDO (5mm en lugar de 10mm) ===
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=0.5*cm,  # ← Margen superior reducido
        bottomMargin=2*cm
    )

    elements = []
    styles = getSampleStyleSheet()

    # Estilos personalizados
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e3a5f'),
        spaceAfter=3,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )

    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica'
    )

    bold_style = ParagraphStyle(
        'CustomBold',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2d3748'),
        fontName='Helvetica-Bold'
    )

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#808080'),  # ← Gris
        alignment=TA_LEFT,
        fontName='Helvetica-Oblique'
    )

    # === HEADER: Nombre de empresa dinámico ===
    elements.append(Paragraph(empresa.get('nombre_empresa', 'AYMARA'), title_style))

    # Número de recibo y fecha (alineados a la derecha)
    fecha_raw = recibo.get('fecha', '')

    # Formatear fecha DD/MM/YYYY
    if fecha_raw and 'T' in str(fecha_raw):
        fecha = str(fecha_raw).split('T')[0]
    elif fecha_raw and len(str(fecha_raw)) >= 10:
        fecha = str(fecha_raw)[:10]
    else:
        fecha = 'N/A'

    # Convertir a DD/MM/YYYY
    if len(fecha) >= 10:
        fecha_formateada = f"{fecha[8:10]}/{fecha[5:7]}/{fecha[0:4]}"
    else:
        fecha_formateada = fecha

    header_derecho = f"""<b>RECIBO N°:</b> {numero_recibo}<br/>
                         <b>FECHA:</b> {fecha_formateada}"""
    elements.append(Paragraph(header_derecho, ParagraphStyle(
        'HeaderRight',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2d3748'),
        alignment=TA_RIGHT,
        fontName='Helvetica',
        spaceAfter=8
    )))

    # === TÍTULO ===
    tipo_label = "RECIBO DE COBRO" if recibo.get('tipo') == 'cobro' else "RECIBO DE PAGO"
    elements.append(Paragraph(tipo_label, ParagraphStyle(
        'Subtitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2c5282'),
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold'
    )))

    # === DATOS DE LA ENTIDAD (Cliente/Proveedor) ===
    # Determinar entidad desde cliente o proveedor
    cliente = recibo.get('cliente')
    proveedor = recibo.get('proveedor')

    if cliente:
        # Usar nombre_completo o nombre (ya no existe apellido)
        entidad_nombre = cliente.get('nombre_completo') or cliente.get('nombre', '') or 'N/A'
        entidad_cuit = cliente.get('cuit')
        tipo_entidad = 'CLIENTE'
    elif proveedor:
        entidad_nombre = proveedor.get('nombre', 'N/A')
        entidad_cuit = None  # Los proveedores pueden no tener CUIT en este contexto
        tipo_entidad = 'PROVEEDOR'
    else:
        entidad_nombre = 'N/A'
        entidad_cuit = None
        tipo_entidad = 'OTRO'
    
    elements.append(Paragraph(f"{tipo_entidad}:", bold_style))
    elements.append(Spacer(1, 0.15*cm))

    datos_entidad = [
        ['Nombre:', entidad_nombre],
    ]
    if entidad_cuit:
        datos_entidad.append(['CUIT:', entidad_cuit])

    table_entidad = Table(datos_entidad, colWidths=[3*cm, 12*cm])
    table_entidad.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(table_entidad)

    elements.append(Spacer(1, 0.5*cm))

    # === DETALLE DEL COBRO/PAGO ===
    elements.append(Paragraph("<b>DETALLE:</b>", bold_style))
    elements.append(Spacer(1, 0.2*cm))

    # ✅ FIX: Medio de Pago REAL (no "No especificado")
    medio_pago = recibo.get('medio_pago', 'efectivo')
    if not medio_pago or medio_pago == 'No especificado':
        medio_pago = 'efectivo'  # Fallback

    datos_detalle = [
        ['Medio de Pago:', medio_pago.capitalize()],
        ['Estado:', recibo.get('estado', 'N/A').capitalize()],
    ]

    # ✅ FIX: Observaciones LIMPIAS (sin "Cobro:" o "Pago:")
    observaciones = recibo.get('observaciones', '')
    if observaciones:
        # Eliminar prefijo "Cobro:" o "Pago:"
        descripcion_limpia = re.sub(r'^(Cobro|Pago):\s*', '', observaciones)
        datos_detalle.insert(0, ['Observaciones:', descripcion_limpia])

    table_detalle = Table(datos_detalle, colWidths=[3*cm, 12*cm])
    table_detalle.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(table_detalle)

    elements.append(Spacer(1, 0.5*cm))

    # === MONTO: COBRADO o PAGADO según tipo ===
    monto = float(recibo.get('monto', 0))
    monto_formateado = format_currency(monto)
    
    # ✅ FIX: "TOTAL COBRADO" para cobros, "TOTAL PAGADO" para pagos
    tipo_label = "TOTAL COBRADO:" if recibo.get('tipo') == 'cobro' else "TOTAL PAGADO:"

    elements.append(Paragraph(f"<b>{tipo_label}</b> {monto_formateado}", ParagraphStyle(
        'TotalStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e3a5f'),
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=8
    )))

    # === FOOTER: "DOCUMENTO NO VALIDO COMO RECIBO OFICIAL" ===
    elements.append(Spacer(1, 2*cm))

    elements.append(Paragraph("DOCUMENTO NO VALIDO COMO RECIBO OFICIAL", footer_style))
    
    # === PIE DE PÁGINA: Datos de empresa + pie_factura ===
    if empresa.get('cuit'):
        elements.append(Paragraph(f"CUIT: {empresa['cuit']}", footer_style))
    if empresa.get('direccion'):
        elements.append(Paragraph(f"{empresa['direccion']}", footer_style))
    if empresa.get('telefono') or empresa.get('email'):
        elements.append(Paragraph(f"📞 {empresa.get('telefono', '')} | ✉️ {empresa.get('email', '')}", footer_style))
    if empresa.get('pie_factura'):
        elements.append(Spacer(1, 0.2*cm))
        elements.append(Paragraph(f"<i>{empresa['pie_factura']}</i>", footer_style))

    # Construir PDF
    doc.build(elements)

    # Obtener bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()

    print(f"✅ [RECIBO-PDF] PDF generado exitosamente: {len(pdf_bytes)} bytes")
    return pdf_bytes
