"""
Generador de PDFs para Aymara Contable
Funciones puras - SIN imports de app/api para evitar circular imports
"""
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from datetime import date

def generar_etiquetas_productos(productos: list, output_path: str) -> str:
    """
    Genera PDF con etiquetas para impresora común (A4)
    productos: lista de dicts con {nombre, precio_venta, unidad_venta, sku}
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    # Configuración de etiqueta: 10cm x 5cm, 2 columnas x 4 filas = 8 etiquetas por página
    label_width = 9 * cm
    label_height = 4.5 * cm
    margin_x = 1.5 * cm
    margin_y = 2 * cm
    
    x = margin_x
    y = height - margin_y - label_height
    
    for prod in productos:
        # Dibujar borde de etiqueta
        c.rect(x, y, label_width, label_height)
        
        # Nombre del producto
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 0.3*cm, y + label_height - 0.8*cm, prod["nombre"][:30])
        
        # Precio
        c.setFont("Helvetica-Bold", 14)
        c.drawString(x + 0.3*cm, y + label_height - 2*cm, f"${prod['precio_venta']:,.2f}")
        
        # Unidad
        c.setFont("Helvetica", 8)
        c.drawString(x + 0.3*cm, y + label_height - 3*cm, f"Por {prod['unidad_venta']}")
        
        # SKU/Código
        c.setFont("Helvetica", 7)
        c.drawString(x + 0.3*cm, y + 0.5*cm, f"SKU: {prod.get('sku') or 'N/A'}")
        
        # Mover a siguiente posición
        x += label_width + 0.5*cm
        if x > width - margin_x - label_width:
            x = margin_x
            y -= label_height + 0.3*cm
            if y < margin_y:
                c.showPage()
                y = height - margin_y - label_height
    
    c.save()
    return output_path

def generar_lista_precios_mayorista(productos: list, nombre_lista: str, output_path: str) -> str:
    """
    Genera PDF con lista de precios mayorista para WhatsApp/email
    productos: lista de dicts con {nombre, precio_venta}
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2*cm, height - 2*cm, f"Lista de Precios - {nombre_lista}")
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, height - 2.5*cm, f"Fecha: {date.today().strftime('%d/%m/%Y')}")
    
    # Tabla header
    y = height - 4*cm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2*cm, y, "Producto")
    c.drawString(12*cm, y, "Precio")
    y -= 0.5*cm
    
    # Productos
    c.setFont("Helvetica", 8)
    for prod in productos:
        if y < 3*cm:  # Nueva página
            c.showPage()
            y = height - 2*cm
        
        nombre = prod["nombre"][:40]
        precio = f"${prod['precio_venta']:,.2f}"
        
        c.drawString(2*cm, y, nombre)
        c.drawString(12*cm, y, precio)
        y -= 0.4*cm
    
    c.save()
    return output_path

def generar_factura_pdf(datos: dict, output_path: str) -> str:
    """
    Genera PDF de factura tipo A4 para imprimir
    datos: dict con {numero, fecha, cliente, cuit, condicion_iva, direccion, items, subtotal, iva, total}
    """
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    # Header - Datos de la empresa
    c.setFont("Helvetica-Bold", 18)
    c.drawString(2*cm, height - 2*cm, "AYMARA CONTABLE")
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, height - 2.5*cm, "Av. Principal 1234 - Córdoba")
    c.drawString(2*cm, height - 2.8*cm, "CUIT: 30-12345678-9")
    
    # Título Factura
    c.setFont("Helvetica-Bold", 14)
    c.drawString(12*cm, height - 2*cm, f"FACTURA {datos['numero']}")
    c.setFont("Helvetica", 10)
    c.drawString(12*cm, height - 2.5*cm, f"Fecha: {datos['fecha']}")
    
    # Datos del Cliente
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, height - 4*cm, "Datos del Cliente:")
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, height - 4.5*cm, f"Nombre: {datos['cliente']}")
    c.drawString(2*cm, height - 4.9*cm, f"CUIT: {datos['cuit']}")
    c.drawString(2*cm, height - 5.3*cm, f"Condición IVA: {datos['condicion_iva']}")
    c.drawString(2*cm, height - 5.7*cm, f"Dirección: {datos['direccion']}")
    
    # Tabla de Items
    y = height - 7*cm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2*cm, y, "Descripción")
    c.drawString(10*cm, y, "Cant.")
    c.drawString(13*cm, y, "Precio Unit.")
    c.drawString(17*cm, y, "Subtotal")
    y -= 0.5*cm
    
    c.setFont("Helvetica", 8)
    for item in datos['items']:
        if y < 5*cm:  # Nueva página
            c.showPage()
            y = height - 2*cm
        
        c.drawString(2*cm, y, item['descripcion'][:35])
        c.drawString(10*cm, y, f"{item['cantidad']:.2f}")
        c.drawString(13*cm, y, f"${item['precio_unitario']:,.2f}")
        c.drawString(17*cm, y, f"${item['subtotal']:,.2f}")
        y -= 0.4*cm
    
    # Totales
    y -= 0.5*cm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(13*cm, y, "Subtotal:")
    c.drawString(17*cm, y, f"${datos['subtotal']:,.2f}")
    y -= 0.5*cm
    c.drawString(13*cm, y, "IVA (21%):")
    c.drawString(17*cm, y, f"${datos['iva']:,.2f}")
    y -= 0.7*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(13*cm, y, "TOTAL:")
    c.drawString(17*cm, y, f"${datos['total']:,.2f}")
    
    # Pie de página
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, 2*cm, "Gracias por su compra!")
    
    c.save()
    return output_path


def generar_nota_credito_pdf(datos: dict, output_path: str) -> str:
    """
    Genera PDF de nota de crédito tipo A4 para imprimir
    datos: dict con {numero, fecha, cliente, cuit, condicion_iva, direccion, factura_original, motivo, items, subtotal, iva, total}
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas
    from reportlab.lib.units import cm
    
    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4
    
    # Header - Datos de la empresa
    c.setFont("Helvetica-Bold", 18)
    c.drawString(2*cm, height - 2*cm, "AYMARA CONTABLE")
    c.setFont("Helvetica", 10)
    c.drawString(2*cm, height - 2.5*cm, "Av. Principal 1234 - Córdoba")
    c.drawString(2*cm, height - 2.8*cm, "CUIT: 30-12345678-9")
    
    # Título Nota de Crédito
    c.setFont("Helvetica-Bold", 14)
    c.drawString(12*cm, height - 2*cm, f"NOTA DE CRÉDITO {datos['numero']}")
    c.setFont("Helvetica", 10)
    c.drawString(12*cm, height - 2.5*cm, f"Fecha: {datos['fecha']}")
    
    # Datos del Cliente
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, height - 4*cm, "Datos del Cliente:")
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, height - 4.5*cm, f"Nombre: {datos['cliente']}")
    c.drawString(2*cm, height - 4.9*cm, f"CUIT: {datos['cuit']}")
    c.drawString(2*cm, height - 5.3*cm, f"Condición IVA: {datos['condicion_iva']}")
    c.drawString(2*cm, height - 5.7*cm, f"Dirección: {datos['direccion']}")
    
    # Factura Original
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2*cm, height - 6.5*cm, "Factura Original:")
    c.setFont("Helvetica", 9)
    c.drawString(2*cm, height - 6.9*cm, f"Número: {datos['factura_original']}")
    c.drawString(2*cm, height - 7.3*cm, f"Motivo: {datos['motivo']}")
    
    # Tabla de Items
    y = height - 9*cm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2*cm, y, "Descripción")
    c.drawString(10*cm, y, "Cant.")
    c.drawString(13*cm, y, "Precio Unit.")
    c.drawString(17*cm, y, "Subtotal")
    y -= 0.5*cm
    
    c.setFont("Helvetica", 8)
    for item in datos['items']:
        if y < 5*cm:  # Nueva página
            c.showPage()
            y = height - 2*cm
        
        c.drawString(2*cm, y, item['descripcion'][:35])
        c.drawString(10*cm, y, f"{item['cantidad']:.2f}")
        c.drawString(13*cm, y, f"${item['precio_unitario']:,.2f}")
        c.drawString(17*cm, y, f"${item['subtotal']:,.2f}")
        y -= 0.4*cm
    
    # Totales
    y -= 0.5*cm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(13*cm, y, "Subtotal:")
    c.drawString(17*cm, y, f"${datos['subtotal']:,.2f}")
    y -= 0.5*cm
    c.drawString(13*cm, y, "IVA (21%):")
    c.drawString(17*cm, y, f"${datos['iva']:,.2f}")
    y -= 0.7*cm
    c.setFont("Helvetica-Bold", 12)
    c.drawString(13*cm, y, "TOTAL:")
    c.drawString(17*cm, y, f"${datos['total']:,.2f}")
    
    # Pie de página
    c.setFont("Helvetica", 8)
    c.drawString(2*cm, 2*cm, "Documento válido como comprobante de devolución.")
    
    c.save()
    return output_path