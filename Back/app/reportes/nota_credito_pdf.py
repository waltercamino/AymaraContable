"""
Generador de PDF para Nota de Crédito - Basado en FC Venta
Formato profesional con recuadros y bordes definidos
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from io import BytesIO


def numero_a_letras(numero: float) -> str:
    """Convierte 23999.00 a 'Veintitrés mil novecientos noventa y nueve con cero centavos'"""

    def numero_a_letras_simple(n):
        unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
        decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
        centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

        if n == 0:
            return 'cero'

        if n == 100:
            return 'cien'

        resultado = ''

        # Miles
        if n >= 1000:
            miles = n // 1000
            resto = n % 1000
            if miles == 1:
                resultado = 'mil '
            else:
                resultado = numero_a_letras_simple(miles) + ' mil '
            n = resto

        # Centenas
        if n >= 100:
            centena = n // 100
            resto = n % 100
            if centena == 1 and resto == 0:
                resultado += 'cien '
            else:
                resultado += centenas[centena] + ' '
            n = resto

        # Decenas
        if n >= 10:
            decena = n // 10
            unidad = n % 10
            if decena == 2 and unidad > 0:
                especiales = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']
                resultado += especiales[unidad] + ' '
            elif decena == 1 and unidad > 0:
                especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
                resultado += especiales[unidad] + ' '
            else:
                resultado += decenas[decena] + ' '
                if unidad > 0:
                    resultado += unidades[unidad] + ' '
            n = 0

        # Unidades
        if n > 0:
            resultado += unidades[n] + ' '

        return resultado.strip()

    # Parte entera y decimales
    parte_entera = int(numero)
    parte_decimal = int(round((numero - parte_entera) * 100))

    # Convertir
    letras_enteras = numero_a_letras_simple(parte_entera)
    letras_decimales = numero_a_letras_simple(parte_decimal) if parte_decimal > 0 else 'cero'

    # Capitalizar primera letra
    letras_enteras = letras_enteras[0].upper() + letras_enteras[1:] if letras_enteras else ''

    return f"{letras_enteras} pesos con {letras_decimales} centavos"


def formato_moneda_ar(valor: float) -> str:
    """Convierte 1234567.89 a $ 1.234.567,89 (formato argentino)"""
    return f"${valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def generar_pdf_nota_credito(nota_credito: dict, empresa: dict = None) -> bytes:
    """
    Genera un PDF con la Nota de Crédito - Basado en FC Venta.
    """
    # Datos de empresa por defecto
    if not empresa:
        empresa = {
            'nombre_empresa': 'AYMARA',
            'razon_social': '',
            'cuit': '',
            'condicion_iva': '',
            'ingresos_brutos': '',
            'inicio_actividades': '',
            'direccion': '',
            'localidad': '',
            'telefono': '',
            'email': ''
        }

    buffer = BytesIO()

    # === FORMATO A4 CON MÁRGENES DE 10mm ===
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=10*mm,
        leftMargin=10*mm,
        topMargin=10*mm,
        bottomMargin=10*mm
    )

    elements = []
    styles = getSampleStyleSheet()

    # === ESTILOS ===
    style_tabla_header = ParagraphStyle('TablaHeader', parent=styles['Normal'],
                                        fontSize=9, fontName='Helvetica-Bold',
                                        alignment=TA_CENTER)
    style_tabla_header_importes = ParagraphStyle('TablaHeaderImportes', parent=styles['Normal'],
                                                 fontSize=9, fontName='Helvetica-Bold',
                                                 alignment=TA_RIGHT)
    style_tabla_celda = ParagraphStyle('TablaCelda', parent=styles['Normal'],
                                       fontSize=9, alignment=TA_CENTER)
    style_tabla_celda_izq = ParagraphStyle('TablaCeldaIzq', parent=styles['Normal'],
                                           fontSize=9, alignment=TA_LEFT)
    style_tabla_cantidad = ParagraphStyle('TablaCantidad', parent=styles['Normal'],
                                      fontSize=9, alignment=TA_CENTER)
    style_tabla_importes = ParagraphStyle('TablaImportes', parent=styles['Normal'],
                                          fontSize=9, alignment=TA_RIGHT)
    style_cliente = ParagraphStyle('Cliente', parent=styles['Normal'],
                                   fontSize=9, leading=11, fontName='Helvetica')
    style_observaciones = ParagraphStyle('Observaciones', parent=styles['Normal'],
                                         fontSize=9, fontName='Helvetica',
                                         alignment=TA_LEFT, leading=12)
    style_leyenda = ParagraphStyle('Leyenda', parent=styles['Normal'],
                                   fontSize=8, fontName='Helvetica-Oblique',
                                   alignment=TA_LEFT, leading=10)

    # === 1. HEADER PRINCIPAL - 2 COLUMNAS (Empresa | Datos Comprobante) ===
    empresa_nombre = empresa.get('nombre_empresa', '')
    empresa_datos = f"""Razón Social: {empresa.get('razon_social') or empresa_nombre}
Domicilio: {empresa.get('direccion') or ''}
Condición IVA: {empresa.get('condicion_iva') or ''}
CUIT: {empresa.get('cuit') or ''}"""

    # Derecha: Datos del comprobante (Nota de Crédito)
    numero_comprobante = f"{nota_credito.get('punto_venta', '1'):04d}-{int(nota_credito.get('numero_factura', 0)):08d}"
    fecha_raw = nota_credito.get('fecha', '')
    fecha_formateada = fecha_raw[:10] if fecha_raw and len(fecha_raw) >= 10 else 'N/A'
    if len(fecha_formateada) >= 10:
        fecha_formateada = f"{fecha_formateada[8:10]}/{fecha_formateada[5:7]}/{fecha_formateada[0:4]}"

    tipo_comprobante = "NOTA DE CRÉDITO"

    comprobante_datos = f"""Num: {numero_comprobante}
Fecha: {fecha_formateada}
CUIT: {empresa.get('cuit') or ''}
I.I.B.B.: {empresa.get('ingresos_brutos') or 'N/A'}"""

    # Tabla header (2 columnas)
    header_principal = Table([
        [empresa_nombre, tipo_comprobante],
        [empresa_datos, comprobante_datos]
    ], colWidths=[110*mm, 80*mm])

    header_principal.setStyle(TableStyle([
        # Fila 1: Nombre empresa, Tipo comprobante
        ('VALIGN', (0, 0), (-1, 0), 'BOTTOM'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('FONTSIZE', (0, 0), (0, 0), 14),
        ('FONTSIZE', (1, 0), (1, 0), 14),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('LEFTPADDING', (0, 0), (0, 1), 10),
        ('RIGHTPADDING', (0, 0), (0, 1), 10),
        ('LEFTPADDING', (1, 0), (1, 1), 10),
        ('RIGHTPADDING', (1, 0), (1, 1), 10),

        # Fila 2: Datos
        ('VALIGN', (0, 1), (-1, 1), 'TOP'),
        ('ALIGN', (0, 1), (0, 1), 'LEFT'),
        ('ALIGN', (1, 1), (1, 1), 'RIGHT'),
        ('FONTSIZE', (0, 1), (-1, 1), 8),
        ('LEADING', (0, 1), (-1, 1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 10),
        ('TOPPADDING', (0, 1), (-1, 1), 5),
        ('LEFTPADDING', (0, 1), (0, 1), 10),
        ('RIGHTPADDING', (0, 1), (0, 1), 10),
        ('LEFTPADDING', (1, 1), (1, 1), 10),
        ('RIGHTPADDING', (1, 1), (1, 1), 10),

        # BORDE SIMPLE - Un solo recuadro para todo
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        # Línea vertical separadora entre columnas
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, colors.black),
    ]))

    elements.append(header_principal)
    elements.append(Spacer(1, 3*mm))

    # === 2. DATOS DEL CLIENTE (1 Columna - Label + Valor Juntos) ===
    cliente = nota_credito.get('cliente', {})
    cliente_nombre = cliente.get('nombre_completo') or cliente.get('nombre', '') or 'N/A'
    cliente_direccion = cliente.get('direccion', '')
    cliente_condicion_iva = cliente.get('condicion_iva', 'Consumidor Final')
    cliente_cuit = cliente.get('cuit')
    if not cliente_cuit or cliente_cuit.strip() == "":
        cliente_cuit = "N/A"  # ← Placeholder simple para PDF

    # 1 COLUMNA - Label y valor juntos en el mismo Paragraph
    cliente_data = [
        [Paragraph('<b>Cliente:</b> ' + (cliente_nombre or 'N/A'), style_cliente)],
        [Paragraph('<b>Domicilio:</b> ' + (cliente_direccion or ''), style_cliente)],
        [Paragraph('<b>I.V.A.:</b> ' + (cliente_condicion_iva or 'Consumidor Final'), style_cliente)],
        [Paragraph('<b>C.U.I.T.:</b> ' + (cliente_cuit or 'N/A'), style_cliente)],
        [Paragraph('<b>Cond. de Venta:</b> Contado', style_cliente)]
    ]

    # 1 Columna - Ancho completo 190mm
    cliente_table = Table(cliente_data, colWidths=[190*mm])
    cliente_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEADING', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))

    elements.append(cliente_table)
    elements.append(Spacer(1, 3*mm))

    # === 3. TABLA DE PRODUCTOS (5 COLUMNAS) ===
    # Header en lightblue para diferenciar de FC
    data_table = [[
        Paragraph('<b>Código</b>', style_tabla_header),
        Paragraph('<b>Descripción</b>', style_tabla_header),
        Paragraph('<b>Cantidad</b>', style_tabla_header),
        Paragraph('<b>Precio Unit.</b>', style_tabla_header_importes),
        Paragraph('<b>Total</b>', style_tabla_header_importes)
    ]]

    total_final = 0
    subtotal_sin_descuento = 0
    total_descuentos = 0

    items = nota_credito.get('items', [])
    for item in items:
        cantidad = float(item.get('cantidad', 0))
        precio_unitario = float(item.get('precio_unitario', 0))

        subtotal = cantidad * precio_unitario
        descuento = float(item.get('descuento', 0))
        total_item = subtotal - descuento
        total_final += total_item
        subtotal_sin_descuento += subtotal
        total_descuentos += descuento

        producto_codigo = str(item.get('producto_codigo', item.get('producto_id', '')))
        producto_nombre = item.get('producto_nombre', '')[:40]

        data_table.append([
            Paragraph(producto_codigo, style_tabla_celda_izq),
            Paragraph(producto_nombre, style_tabla_celda_izq),
            Paragraph(f"{cantidad:,.2f}", style_tabla_cantidad),
            Paragraph(f"{formato_moneda_ar(precio_unitario)}", style_tabla_importes),
            Paragraph(f"{formato_moneda_ar(total_item)}", style_tabla_importes)
        ])

    # Rellenar filas vacías (mínimo 15 filas para ocupar menos página)
    while len(data_table) < 16:
        data_table.append(['', '', '', '', ''])

    # ANCHO TOTAL = 190mm (mismo que header)
    table = Table(data_table, colWidths=[25*mm, 85*mm, 25*mm, 25*mm, 30*mm])
    table.setStyle(TableStyle([
        # Header - lightblue para diferenciar de FC
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
        ('TOPPADDING', (0, 0), (-1, 0), 4),

        # Bordes - Solo columnas
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, colors.black),
        ('LINEBEFORE', (2, 0), (2, -1), 0.5, colors.black),
        ('LINEBEFORE', (3, 0), (3, -1), 0.5, colors.black),
        ('LINEBEFORE', (4, 0), (4, -1), 0.5, colors.black),

        # Sin líneas horizontales entre filas
        ('LINEBELOW', (0, 1), (-1, -2), 0, colors.white),

        # ALINEACIÓN - Header centrado, artículos: Código/Desc/Cant izquierda, Importes derecha
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (1, -1), 'LEFT'),
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),
        ('ALIGN', (3, 1), (4, -1), 'RIGHT'),

        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 5*mm))

    # === 4. SUB TOTAL (Enmarcado) ===
    subtotales_data = [
        [Paragraph("<b>Sub Total:</b>", style_cliente), 
         Paragraph(f"{formato_moneda_ar(subtotal_sin_descuento)}", style_tabla_importes)],
        [Paragraph("<b>Descuento:</b>", style_cliente), 
         Paragraph(f"{formato_moneda_ar(total_descuentos)}", style_tabla_importes)]
    ]

    subtotales_table = Table(subtotales_data, colWidths=[60*mm, 130*mm])
    subtotales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEADING', (0, 0), (-1, -1), 14),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))

    elements.append(subtotales_table)
    elements.append(Spacer(1, 3*mm))

    # === 5. TOTAL FINAL (Ancho completo + Monto en letras) ===
    monto_letras = numero_a_letras(total_final)

    style_total_label = ParagraphStyle('TotalLabel', parent=styles['Normal'],
                                       fontSize=10, fontName='Helvetica',
                                       alignment=TA_LEFT)
    style_total_monto = ParagraphStyle('TotalMonto', parent=styles['Normal'],
                                       fontSize=12, fontName='Helvetica-Bold',
                                       alignment=TA_RIGHT)

    # 2 columnas: Monto en letras | Importe Total
    totales_data = [
        [Paragraph(monto_letras, style_total_label),
         Paragraph(f"<b>Importe Total: {formato_moneda_ar(total_final)}</b>", style_total_monto)]
    ]

    # Ancho 190mm (mismo que header)
    totales_table = Table(totales_data, colWidths=[130*mm, 60*mm])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, -1), 10),
        ('FONTSIZE', (1, 0), (1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))

    elements.append(totales_table)
    elements.append(Spacer(1, 3*mm))

    # === 6. OBSERVACIONES ===
    observaciones_texto = nota_credito.get('observaciones', '') or ''

    observaciones_data = [
        [Paragraph("<b>Observaciones:</b> " + (observaciones_texto if observaciones_texto else ""), style_observaciones)],
        [''],  # 1 sola fila de espacio
        [Paragraph("<i>Documento no Válido como Factura</i>", style_leyenda)]
    ]

    observaciones_table = Table(observaciones_data, colWidths=[190*mm])
    observaciones_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, -1), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
    ]))

    elements.append(observaciones_table)

    # === 7. GENERAR PDF ===
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
