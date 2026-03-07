"""
Generador de PDF para Estado de Cuenta - Formato limpio (blanco y negro)
"""
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from typing import List, Optional


def format_currency(value: float) -> str:
    """Formatea un valor como moneda argentina"""
    return f"${value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def format_date(date_str: Optional[str]) -> str:
    """Convierte fecha de YYYY-MM-DD a DD/MM/YYYY"""
    if not date_str:
        return ""
    try:
        # Intentar formato ISO (YYYY-MM-DD)
        return datetime.strptime(date_str, "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        # Si ya está en otro formato, devolver como está
        return date_str


def generar_pdf(
    entidad_nombre: str,
    entidad_cuit: Optional[str],
    tipo: str,  # 'cliente' o 'proveedor'
    movimientos: List[dict],
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    saldo_anterior: float = 0,  # ← Saldo antes del período
    total_debe_periodo: float = 0,
    total_haber_periodo: float = 0,
    saldo_final: float = 0,
    empresa: dict = None
) -> bytes:
    """
    Genera un PDF con el estado de cuenta de un cliente o proveedor.
    Formato limpio en blanco y negro, similar a listas de precios.
    """
    # Datos de empresa por defecto
    if not empresa:
        empresa = {
            'nombre_empresa': 'AYMARA CONTABLE',
            'cuit': '',
            'direccion': '',
            'telefono': '',
            'email': '',
            'pie_factura': '',
            'logo_url': ''
        }

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
        bottomMargin=1.5*cm
    )

    elements = []
    styles = getSampleStyleSheet()

    # ============================================
    # HEADER - EXACTAMENTE IGUAL QUE LISTAS DE PRECIOS
    # ============================================

    # Datos de la empresa
    nombre_empresa = empresa.get('nombre_empresa', 'AYMARA Productos Naturales')
    direccion = empresa.get('direccion', '')
    telefono = empresa.get('telefono', '')
    logo_url = empresa.get('logo_url', '')
    backend_url = 'http://localhost:8000'

    # Construir línea de dirección y teléfono
    linea_direccion = []
    if direccion:
        linea_direccion.append(direccion)
    if telefono:
        linea_direccion.append(f"Tel: {telefono}")
    direccion_texto = " - ".join(linea_direccion) if linea_direccion else ""

    # Logo HTML (más pequeño, de 45 a 35)
    logo_html = f'<img src="{backend_url}{logo_url}" width="35" height="35" />' if logo_url else ''

    # Datos empresa (nombre + dirección)
    empresa_html = f'''<b><font size="12" color="#1e40af">{nombre_empresa}</font></b><br/>
    <font size="8" color="#4b5563">{direccion_texto}</font>''' if direccion_texto else f'''<b><font size="12" color="#1e40af">{nombre_empresa}</font></b>'''

    # Tabla interna: Logo izquierda | Texto centrado derecha
    izquierda_data = [[
        Paragraph(logo_html) if logo_url else '',
        Paragraph(empresa_html)
    ]]

    izquierda_table = Table(izquierda_data, colWidths=[40, 200])
    izquierda_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (0, -1), 5),
        ('RIGHTPADDING', (1, 0), (1, -1), 5),
        ('TOPPADDING', (0, 0), (0, 0), 25),      # ← Padding SOLO para celda del logo
        ('BOTTOMPADDING', (0, 0), (0, 0), 8),   # ← Padding SOLO para celda del logo
        ('TOPPADDING', (1, 0), (1, -1), 5),     # ← Padding para celda de texto
        ('BOTTOMPADDING', (1, 0), (1, -1), 5),
    ]))

    # Header principal: Tabla izquierda | Título derecha
    header_data = [[
        izquierda_table,
        Paragraph(
            f"<b><font size=\"10\" color=\"#1e40af\">ESTADO DE CUENTA</font></b><br/>"
            f"<font size=\"8\" color=\"#6b7280\">"
            f"{tipo.capitalize()}: {entidad_nombre}<br/>"
            f"CUIT: {entidad_cuit or ' '}"
            f"</font>",
        )
    ]]

    # Tabla final con borde
    header_table = Table(header_data, colWidths=[9*cm, 9*cm])
    header_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('LEFTPADDING', (0, 0), (0, -1), 10),
        ('RIGHTPADDING', (1, 0), (1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 2, colors.HexColor('#1e40af')),
    ]))

    elements.append(header_table)

    # Período (igual que Listas de Precios muestra info adicional)
    if fecha_desde and fecha_hasta:
        elements.append(Paragraph(f"Período: {format_date(fecha_desde)} al {format_date(fecha_hasta)}", styles['Normal']))
    else:
        elements.append(Paragraph("Período: Todo el histórico", styles['Normal']))
    
    elements.append(Spacer(1, 0.3*cm))

    # ============================================
    # SALDO ANTERIOR (si hay filtro de fechas)
    # ============================================
    if fecha_desde and saldo_anterior != 0:
        saldo_anterior_data = [
            [Paragraph(f"<b>Saldo Anterior (antes del {format_date(fecha_desde)}):</b>", styles['Normal']), 
             Paragraph(f"<b>{format_currency(saldo_anterior)}</b>", styles['Normal'])]
        ]
        table_anterior = Table(saldo_anterior_data, colWidths=[15*cm, 3*cm])
        table_anterior.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, 0), 0.5, colors.black),
        ]))
        elements.append(table_anterior)
        elements.append(Spacer(1, 0.3*cm))

    # ============================================
    # TABLA DE MOVIMIENTOS
    # ============================================
    data = [
        ['Fecha', 'Descripción', 'Debe', 'Haber', 'Saldo']
    ]

    # Calcular saldo acumulado empezando desde saldo_anterior
    saldo_acumulado = saldo_anterior

    # Movimientos del período
    for mov in movimientos:
        fecha_str = format_date(mov['fecha'][:10]) if mov['fecha'] else ''
        descripcion = mov['descripcion'] or ''
        debe = mov['debe'] if mov['debe'] > 0 else 0
        haber = mov['haber'] if mov['haber'] > 0 else 0

        # Acumular desde saldo anterior
        saldo_acumulado += debe - haber

        debe_str = format_currency(debe) if debe > 0 else '-'
        haber_str = format_currency(haber) if haber > 0 else '-'
        saldo_str = format_currency(saldo_acumulado)

        data.append([
            fecha_str,
            descripcion,
            debe_str,
            haber_str,
            saldo_str
        ])

    # Fila vacía separadora
    data.append(['', '', '', '', ''])

    # SALDO FINAL
    data.append([
        '',
        f'SALDO FINAL (al {format_date(fecha_hasta) or datetime.now().strftime("%d/%m/%Y")}):',
        '',
        '',
        format_currency(saldo_final)
    ])

    # Crear tabla
    table = Table(data, colWidths=[2*cm, 8*cm, 2.5*cm, 2.5*cm, 2.5*cm])

    # Estilo de la tabla - Similar a Listas de Precios (GRIS en vez de AZUL)
    table.setStyle(TableStyle([
        # Header - Gris (#4b5563) con texto blanco
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4b5563')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),

        # Descripción alineada a la izquierda
        ('ALIGN', (1, 1), (1, -3), 'LEFT'),
        
        # Columnas numéricas alineadas a la derecha
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (4, -1), 'RIGHT'),

        # Fila de saldo final - Gris (#4b5563) con texto blanco
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#4b5563')),
        ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 9),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, -1), (-1, -1), 8),
        ('ALIGN', (1, -1), (1, -1), 'LEFT'),

        # Fila vacía separadora
        ('TOPPADDING', (0, -2), (-1, -2), 4),
        ('BOTTOMPADDING', (0, -2), (-1, -2), 4),

        # Filas de datos
        ('FONTNAME', (0, 1), (-1, -3), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -3), 8),
        ('TOPPADDING', (0, 1), (-1, -3), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -3), 4),

        # Bordes - solo líneas horizontales
        ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#4b5563')),
        ('LINEBELOW', (0, 1), (-1, -3), 0.5, colors.grey),
        ('LINEABOVE', (0, -1), (-1, -1), 1, colors.HexColor('#4b5563')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),

        # Filas alternadas (zebra striping) - gris muy claro
        ('BACKGROUND', (0, 1), (-1, -3), colors.HexColor('#f9fafb')),
        ('BACKGROUND', (0, 2), (-1, -3), colors.white),
    ]))

    elements.append(table)

    # Footer
    elements.append(Spacer(1, 1*cm))

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.black,
        alignment=TA_CENTER
    )

    fecha_emision = datetime.now().strftime('%d/%m/%Y %H:%M')
    elements.append(Paragraph(f"Documento emitido el {fecha_emision}", footer_style))

    # Construir PDF
    doc.build(elements)

    # Obtener bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes
