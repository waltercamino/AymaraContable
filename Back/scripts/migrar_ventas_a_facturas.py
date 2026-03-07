"""
Script de migración de Ventas Legacy a FC Venta (Facturas)
==========================================================
Migra datos históricos de las tablas ventas/venta_detalles 
hacia facturas/factura_detalles

Fecha: 2026-02-25
"""

import json
import sys
from datetime import datetime
from pathlib import Path

# Agregar ruta al proyecto
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine
from app.models import Factura, FacturaDetalle, Cliente, Producto
from sqlalchemy import text

def migrar_ventas_a_facturas():
    """
    Migra ventas legacy a facturas:
    - ventas → facturas
    - venta_detalles → factura_detalles
    """
    db = SessionLocal()
    migrados = {"facturas": 0, "detalles": 0, "errores": []}
    
    try:
        # Leer backup
        backup_path = Path(__file__).parent / "backup_ventas_legacy.json"
        with open(backup_path, 'r', encoding='utf-8') as f:
            backup = json.load(f)
        
        print("=" * 60)
        print("MIGRACIÓN DE VENTAS LEGACY A FC VENTA")
        print("=" * 60)
        print(f"Backup: {backup_path}")
        print(f"Fecha de exportación: {backup.get('export_date', 'N/A')}")
        print(f"Total ventas a migrar: {len(backup['tables']['ventas'])}")
        print(f"Total detalles a migrar: {len(backup['tables']['venta_detalles'])}")
        print("=" * 60)
        
        # Verificar si ya hay datos migrados (por id)
        ids_existentes = db.query(Factura.id).filter(
            Factura.id.in_([v['id'] for v in backup['tables']['ventas']])
        ).all()
        ids_existentes = [r[0] for r in ids_existentes]
        
        if ids_existentes:
            print(f"\n⚠️  ADVERTENCIA: Las siguientes facturas ya existen: {ids_existentes}")
            print("   Se omitirán en esta migración.\n")
        
        # Mapeo de clientes por nombre
        clientes_cache = {}
        for cliente in db.query(Cliente).all():
            nombre_completo = f"{cliente.nombre} {cliente.apellido or ''}".strip()
            clientes_cache[nombre_completo.lower()] = cliente.id
            clientes_cache[cliente.nombre.lower()] = cliente.id
        
        # Migrar cada venta
        for venta in backup['tables']['ventas']:
            try:
                # Saltar si ya existe
                if venta['id'] in ids_existentes:
                    print(f"⊘ Venta #{venta['id']}: Ya existe, saltando...")
                    continue
                
                # Buscar cliente por nombre
                cliente_nombre = venta.get('cliente_nombre', 'Consumidor Final')
                cliente_id = clientes_cache.get(cliente_nombre.lower())
                
                # Si no existe el cliente, usar None (Consumidor Final)
                if cliente_id is None:
                    print(f"  ⚠️  Cliente '{cliente_nombre}' no encontrado. Usando NULL.")
                
                # Determinar tipo de comprobante según tipo_venta
                tipo_venta = venta.get('tipo_venta', 'minorista')
                if tipo_venta == 'mayorista':
                    tipo_comprobante = 'FB'  # Factura B para mayorista
                else:
                    tipo_comprobante = 'FC'  # Factura C para minorista
                
                # Calcular subtotal e IVA (21% para monotributista = 0)
                total = float(venta['total_venta'])
                subtotal = total  # Monotributista: no discrimina IVA
                iva = 0.0
                
                # Crear factura
                factura = Factura(
                    id=venta['id'],  # Mantener mismo ID para trazabilidad
                    numero_interno=f"FV-{venta['id']:04d}",
                    punto_venta=1,
                    numero_factura=1000 + venta['id'],  # Números ficticios
                    tipo_comprobante=tipo_comprobante,
                    fecha=venta['fecha'],
                    fecha_vencimiento=None,
                    cliente_id=cliente_id,
                    subtotal=subtotal,
                    iva=iva,
                    total=total,
                    medio_pago=venta.get('medio_pago', 'efectivo'),
                    estado='emitida',
                    usuario_id=venta.get('usuario_id'),
                    observaciones=f"Migrado desde legacy ventas.py - Turno: {venta.get('turno', 'N/A')}"
                )
                
                db.add(factura)
                db.flush()  # Para obtener el ID
                
                print(f"✓ Venta #{venta['id']} → Factura #{factura.id} (Cliente: {cliente_nombre})")
                migrados['facturas'] += 1
                
                # Migrar detalles
                detalles_venta = [
                    d for d in backup['tables']['venta_detalles'] 
                    if d['venta_id'] == venta['id']
                ]
                
                for detalle in detalles_venta:
                    # Verificar si el producto existe
                    producto = db.query(Producto).filter(
                        Producto.id == detalle['producto_id']
                    ).first()
                    
                    if not producto:
                        msg = f"  ⚠️  Producto #{detalle['producto_id']} no existe, saltando detalle..."
                        print(msg)
                        migrados['errores'].append(msg)
                        continue
                    
                    factura_detalle = FacturaDetalle(
                        factura_id=factura.id,
                        producto_id=detalle['producto_id'],
                        cantidad=detalle['cantidad'],
                        precio_unitario=detalle['precio_unitario'],
                        costo_unitario=detalle.get('costo_unitario'),
                        subtotal=detalle['subtotal']
                    )
                    
                    db.add(factura_detalle)
                    migrados['detalles'] += 1
                
            except Exception as e:
                error_msg = f"✗ Error migrando venta #{venta['id']}: {str(e)}"
                print(error_msg)
                migrados['errores'].append(error_msg)
                db.rollback()
        
        # Commit final
        db.commit()
        
        # Resumen
        print("\n" + "=" * 60)
        print("RESUMEN DE MIGRACIÓN")
        print("=" * 60)
        print(f"✓ Facturas migradas: {migrados['facturas']}")
        print(f"✓ Detalles migrados: {migrados['detalles']}")
        if migrados['errores']:
            print(f"✗ Errores: {len(migrados['errores'])}")
            for err in migrados['errores']:
                print(f"  - {err}")
        print("=" * 60)
        
        # Verificación final
        total_facturas = db.query(Factura).filter(
            Factura.observaciones.like('%Migrado desde legacy%')
        ).count()
        print(f"\n📊 Total facturas con observación 'migrado': {total_facturas}")
        
        return migrados
        
    except FileNotFoundError:
        print(f"✗ ERROR: No se encontró el archivo de backup en {backup_path}")
        return {"facturas": 0, "detalles": 0, "errores": ["Backup no encontrado"]}
    
    except Exception as e:
        print(f"✗ ERROR CRÍTICO: {str(e)}")
        db.rollback()
        return {"facturas": 0, "detalles": 0, "errores": [str(e)]}
    
    finally:
        db.close()


if __name__ == "__main__":
    resultado = migrar_ventas_a_facturas()
    
    # Código de salida para CI/CD
    if resultado['facturas'] > 0:
        print("\n✅ MIGRACIÓN COMPLETADA CON ÉXITO")
        sys.exit(0)
    else:
        print("\n❌ MIGRACIÓN FALLIDA O SIN DATOS NUEVOS")
        sys.exit(1)
