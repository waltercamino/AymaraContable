"""
Generador de PDF para Factura de Venta - Basado en Estructura HTML de Referencia
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
        # Implementación básica en español
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


def generar_pdf_factura(factura: dict, empresa: dict = None) -> bytes:
    """
    Genera un PDF con la factura de venta - Basado en estructura HTML de referencia.
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
    style_cliente_bold = ParagraphStyle('ClienteBold', parent=styles['Normal'],
                                        fontSize=9, leading=11, fontName='Helvetica-Bold')
    style_observaciones = ParagraphStyle('Observaciones', parent=styles['Normal'],
                                         fontSize=9, fontName='Helvetica',
                                         alignment=TA_LEFT, leading=12)
    style_leyenda = ParagraphStyle('Leyenda', parent=styles['Normal'],
                                   fontSize=8, fontName='Helvetica-Oblique',
                                   alignment=TA_LEFT, leading=10)

    # === 1. HEADER PRINCIPAL - 2 COLUMNAS (Empresa | Datos Comprobante) ===
    # Izquierda: Datos de empresa (más espacio para nombre largo)
    empresa_nombre = empresa.get('nombre_empresa', '')
    empresa_datos = f"""Razón Social: {empresa.get('razon_social') or empresa_nombre}
Domicilio: {empresa.get('direccion') or ''}
Condición IVA: {empresa.get('condicion_iva') or ''}
CUIT: {empresa.get('cuit') or ''}"""

    # Derecha: Datos del comprobante (simplificado)
    numero_comprobante = f"{factura.get('punto_venta', '1'):04d}-{int(factura.get('numero_factura', 0)):08d}"
    fecha_raw = factura.get('fecha', '')
    fecha_formateada = fecha_raw[:10] if fecha_raw and len(fecha_raw) >= 10 else 'N/A'
    if len(fecha_formateada) >= 10:
        fecha_formateada = f"{fecha_formateada[8:10]}/{fecha_formateada[5:7]}/{fecha_formateada[0:4]}"

    tipo_comprobante = "FACTURA ORIGINAL"

    comprobante_datos = f"""Num: {numero_comprobante}
Fecha: {fecha_formateada}
CUIT: {empresa.get('cuit') or ''}
I.I.B.B.: {empresa.get('ingresos_brutos') or 'N/A'}"""

    # Tabla header (2 columnas en vez de 3)
    header_principal = Table([
        [empresa_nombre, tipo_comprobante],
        [empresa_datos, comprobante_datos]
    ], colWidths=[110*mm, 80*mm])  # Más espacio para empresa (nombre largo)

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

    # === 3. DATOS DEL CLIENTE (1 Columna - Label + Valor Juntos) ===
    cliente = factura.get('cliente', {})
    cliente_nombre = cliente.get('nombre_completo') or cliente.get('nombre', '') or 'N/A'
    cliente_direccion = cliente.get('direccion', '')
    cliente_condicion_iva = cliente.get('condicion_iva', 'Consumidor Final')
    cliente_cuit = cliente.get('cuit')
    if not cliente_cuit or cliente_cuit.strip() == "":
        cliente_cuit = "N/A"  # ← Placeholder simple para PDF

    # Obtener condición de venta desde la factura
    medio_pago = factura.get('medio_pago', 'Contado')
    if medio_pago and medio_pago.lower() in ['efectivo', 'contado']:
        condicion_venta = "Contado"
    elif medio_pago and medio_pago.lower() in ['transferencia', 'transf']:
        condicion_venta = "Transferencia"
    elif medio_pago and medio_pago.lower() in ['cta cte', 'cta.cte', 'cuenta corriente']:
        condicion_venta = "Cta. Cte."
    elif medio_pago and medio_pago.lower() in ['tarjeta', 'debito', 'credito']:
        condicion_venta = "Tarjeta"
    else:
        condicion_venta = medio_pago or "Contado"

    # 1 COLUMNA - Label y valor juntos en el mismo Paragraph
    cliente_data = [
        [Paragraph('<b>Cliente:</b> ' + (cliente_nombre or 'N/A'), style_cliente)],
        [Paragraph('<b>Domicilio:</b> ' + (cliente_direccion or ''), style_cliente)],
        [Paragraph('<b>I.V.A.:</b> ' + (cliente_condicion_iva or 'Consumidor Final'), style_cliente)],
        [Paragraph('<b>C.U.I.T.:</b> ' + (cliente_cuit or 'N/A'), style_cliente)],
        [Paragraph('<b>Cond. de Venta:</b> ' + condicion_venta, style_cliente)]
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

    # === 4. TABLA DE PRODUCTOS (5 COLUMNAS) ===
    data_table = [[
        Paragraph('<b>Código</b>', style_tabla_header),
        Paragraph('<b>Descripción</b>', style_tabla_header),
        Paragraph('<b>Cantidad</b>', style_tabla_header),
        Paragraph('<b>Precio Unit.</b>', style_tabla_header_importes),
        Paragraph('<b>Total</b>', style_tabla_header_importes)
    ]]

    total_final = 0

    items = factura.get('items', [])
    for item in items:
        cantidad = float(item.get('cantidad', 0))
        precio_unitario = float(item.get('precio_unitario', 0))

        subtotal = cantidad * precio_unitario
        descuento = float(item.get('descuento', 0))
        total_item = subtotal - descuento
        total_final += total_item

        producto_codigo = str(item.get('producto_codigo', item.get('producto_id', '')))
        producto_nombre = item.get('producto_nombre', '')[:40]

        data_table.append([
            Paragraph(producto_codigo, style_tabla_celda_izq),
        Paragraph(producto_nombre, style_tabla_celda_izq),
        Paragraph(f"{cantidad:,.2f}", style_tabla_cantidad),  # ← Centro ✅
        Paragraph(f"{formato_moneda_ar(precio_unitario)}", style_tabla_importes),
        Paragraph(f"{formato_moneda_ar(total_item)}", style_tabla_importes)
        ])

    # Rellenar filas vacías (mínimo 22 filas para ocupar menos página)
    while len(data_table) < 22:
        data_table.append(['', '', '', '', ''])

    # ANCHO TOTAL = 190mm (mismo que header)
    table = Table(data_table, colWidths=[25*mm, 85*mm, 25*mm, 25*mm, 30*mm])
    table.setStyle(TableStyle([
        # Header
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 4),  # Reducir de 6 a 4
        ('TOPPADDING', (0, 0), (-1, 0), 4),     # Reducir de 6 a 4

        # Bordes - Solo columnas
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('LINEBEFORE', (1, 0), (1, -1), 0.5, colors.black),
        ('LINEBEFORE', (2, 0), (2, -1), 0.5, colors.black),
        ('LINEBEFORE', (3, 0), (3, -1), 0.5, colors.black),
        ('LINEBEFORE', (4, 0), (4, -1), 0.5, colors.black),

        # Sin líneas horizontales entre filas
        ('LINEBELOW', (0, 1), (-1, -2), 0, colors.white),

        # ALINEACIÓN - Header centrado, artículos a la izquierda
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),  # Header centrado
        ('ALIGN', (0, 1), (1, -1), 'LEFT'),    # Columnas 0-1 (Código, Descripción) → Izquierda
        ('ALIGN', (2, 1), (2, -1), 'CENTER'),  # Columna 2 (Cantidad) → Centro ✅
        ('ALIGN', (3, 1), (4, -1), 'RIGHT'),   # Columnas 3-4 (Precio Unit, Total) → Derecha

        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 5*mm))

    # === 5. SUB TOTAL (Enmarcado) ===
    # Calcular subtotal y descuento
    subtotal_sin_descuento = sum(
        float(item.get('cantidad', 0)) * float(item.get('precio_unitario', 0))
        for item in items
    )
    total_descuentos = sum(
        (float(item.get('cantidad', 0)) * float(item.get('precio_unitario', 0))) * (float(item.get('descuento', 0)) / 100)
        for item in items
    )

    subtotales_data = [
        [f"Sub Total:", f"{formato_moneda_ar(subtotal_sin_descuento)}"],
        [f"Descuento:", f"{formato_moneda_ar(total_descuentos)}"]
    ]

    subtotales_table = Table(subtotales_data, colWidths=[160*mm, 30*mm])  # Labels ocupan más espacio
    subtotales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),     # Labels a la DERECHA
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),     # Importes a la derecha
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('LEADING', (0, 0), (-1, -1), 14),       # Espacio entre líneas
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),  # Borde completo
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))

    elements.append(subtotales_table)
    elements.append(Spacer(1, 3*mm))  # Espacio después del subtotal

    # === 6. TOTAL FINAL (Ancho completo + Monto en letras) ===
    # Calcular total
    total_final = subtotal_sin_descuento - total_descuentos

    # Monto en letras
    monto_letras = numero_a_letras(total_final)

    # Estilos para el total
    style_total_label = ParagraphStyle('TotalLabel', parent=styles['Normal'],
                                       fontSize=10, fontName='Helvetica',
                                       alignment=TA_LEFT)
    style_total_monto = ParagraphStyle('TotalMonto', parent=styles['Normal'],
                                       fontSize=12, fontName='Helvetica-Bold',
                                       alignment=TA_RIGHT)

    # 2 columnas: Monto en letras | Importe Total
    totales_data = [
        [Paragraph(monto_letras, style_total_label),
         Paragraph(f"Importe Total: {formato_moneda_ar(total_final)}", style_total_monto)]
    ]

    # Ancho 190mm (mismo que header)
    totales_table = Table(totales_data, colWidths=[130*mm, 60*mm])
    totales_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),    # Monto en letras a la izquierda
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),   # Importe Total a la derecha
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, -1), 10),     # Letras más chicas
        ('FONTSIZE', (1, 0), (1, -1), 12),     # Total más grande
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),  # Borde completo
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))

    elements.append(totales_table)
    elements.append(Spacer(1, 3*mm))

    # === 7. OBSERVACIONES ===
    observaciones_texto = factura.get('observaciones', '') or ''

    # SIN IF/ELSE - Siempre muestra "Observaciones:" (con o sin texto)
    observaciones_data = [
        [Paragraph("<b>Observaciones:</b> " + (observaciones_texto if observaciones_texto else ""), style_observaciones)],
        [''],  # 1 sola fila de espacio (reducido)
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
        # Espacio reducido entre observaciones y leyenda
        ('BOTTOMPADDING', (0, 1), (-1, 1), 8),  # Solo 8pt
    ]))

    elements.append(observaciones_table)

    # === 8. GENERAR PDF ===
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
