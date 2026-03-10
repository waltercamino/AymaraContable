// src/pages/Precios.tsx
// Gestión de Listas de Precios + Etiquetas + Actualización Masiva + Categorías

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { precios, productos, categorias, type Precio, type Producto, type Categoria, type ActualizacionMasiva } from '../services/api'
import { formatCurrency } from '../utils/format'
import { Tag, Upload, Download, Edit, Trash2, Copy, RefreshCw, Printer, AlertCircle, FolderOpen } from 'lucide-react'

// Lista de precios extendida
interface ListaPrecios {
  id: number
  nombre: string
  descripcion?: string | null
  tipo_cliente: 'minorista' | 'mayorista' | 'todos'
  categorias_incluidas?: number[] | null
  activa: boolean
  creado_en: string
}

// Producto con precios
interface ProductoConPrecios extends Producto {
  precio_costo?: number
  precio_venta?: number
  stock_actual?: number
  precios_por_lista?: Record<number, number>
}

export default function Precios() {
  // Estados principales
  const [listasPrecios, setListasPrecios] = useState<ListaPrecios[]>([])
  const [categoriasList, setCategoriasList] = useState<Categoria[]>([])
  const [productosList, setProductosList] = useState<ProductoConPrecios[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'listas' | 'productos' | 'actualizar' | 'etiquetas' | 'categorias'>('listas')

  // Filtros
  const [filtroLista, setFiltroLista] = useState<number | 'all'>('all')
  const [filtroCategoria, setFiltroCategoria] = useState<number | 'all'>('all')
  const [busqueda, setBusqueda] = useState('')

  // Modal Lista de Precios
  const [showModalLista, setShowModalLista] = useState(false)
  const [editandoListaId, setEditandoListaId] = useState<number | null>(null)
  const [formDataLista, setFormDataLista] = useState({
    nombre: '',
    descripcion: '',
    tipo_cliente: 'todos' as 'minorista' | 'mayorista' | 'todos',
    categorias_incluidas: [] as number[],
    activo: true
  })

  // Actualización masiva
  const [actualizacionData, setActualizacionData] = useState<ActualizacionMasiva>({
    producto_ids: [],
    tipo_actualizacion: 'porcentaje',
    valor: 0,
    redondeo: 'none'
  })
  const [redondeo, setRedondeo] = useState<string>('none')
  const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([])

  // Etiquetas para imprimir
  const [productosParaEtiquetas, setProductosParaEtiquetas] = useState<number[]>([])
  
  // Filtro "Solo precios que cambiaron"
  const [soloPreciosQueCambiaron, setSoloPreciosQueCambiaron] = useState(false)
  const [preciosOriginales, setPreciosOriginales] = useState<Record<number, number>>({})

  // Modal Categorías
  const [showModalCategoria, setShowModalCategoria] = useState(false)
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<number | null>(null)
  const [formDataCategoria, setFormDataCategoria] = useState({
    nombre: '',
    margen_default_minorista: 25,
    margen_default_mayorista: 20
  })

  // Cargar datos
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      const timestamp = Date.now()  // Para evitar cache
      const [listasRes, productosRes, categoriasRes] = await Promise.all([
        precios.getListas(),
        productos.getAll({ activo: true, _t: timestamp }),
        categorias.getAll()
      ])

      if (listasRes.error) throw new Error(listasRes.error)
      if (productosRes.error) throw new Error(productosRes.error)
      if (categoriasRes.error) throw new Error(categoriasRes.error)

      const productosData = (productosRes.data as unknown as ProductoConPrecios[]) || []
      console.log('DEBUG [productos carga]:', productosData.length, 'productos')
      console.log('DEBUG [primer producto]:', productosData[0])
      console.log('DEBUG [categorias carga]:', (categoriasRes.data as unknown as Categoria[]).length, 'categorias')

      setListasPrecios((listasRes.data as unknown as ListaPrecios[]) || [])
      setProductosList(productosData)
      setCategoriasList((categoriasRes.data as unknown as Categoria[]) || [])

      // ✅ FIX: Actualizar baseline de precios para el filtro "Solo precios que cambiaron"
      // Estrategia híbrida:
      // 1. Para productos con precios guardados (de Actualización Masiva), mantener esos precios como referencia
      // 2. Para productos con cambios de FC de Compra (en localStorage), usar esos precios anteriores
      // 3. Para los demás, usar precios actuales como baseline (detecta cambios por actualizado_en)
      const preciosActuales: Record<number, number> = {}
      productosData.forEach((prod: ProductoConPrecios) => {
        preciosActuales[prod.id] = prod.precio_venta_minorista || prod.precio_venta || 0
      })

      // Leer cambios de FC de Compra desde localStorage
      const preciosFcCompra: Record<number, number> = JSON.parse(
        localStorage.getItem('fc_compra_precios_cambiados') || '{}'
      )

      setPreciosOriginales(prev => {
        // Prioridad: 1) Precios de FC de Compra, 2) Precios de Actualización Masiva, 3) Precios actuales como baseline
        const nuevosPrecios = { ...prev }
        
        // Primero, aplicar precios de FC de Compra (tienen prioridad)
        Object.entries(preciosFcCompra).forEach(([id, precioAnterior]) => {
          nuevosPrecios[Number(id)] = precioAnterior
        })
        
        // Luego, mantener precios de Actualización Masiva (si no están en FC de Compra)
        Object.entries(prev).forEach(([id, precio]) => {
          if (!(id in preciosFcCompra)) {
            nuevosPrecios[Number(id)] = precio
          }
        })
        
        // Finalmente, para productos sin referencia, usar precio actual como baseline
        Object.entries(preciosActuales).forEach(([id, precio]) => {
          if (!(String(id) in nuevosPrecios)) {
            nuevosPrecios[Number(id)] = precio
          }
        })
        
        return nuevosPrecios
      })
      
      // Limpiar localStorage después de leer (opcional, para evitar acumular datos)
      // localStorage.removeItem('fc_compra_precios_cambiados')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
      console.error('Precios error:', err)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // LISTAS DE PRECIOS
  // ============================================

  const handleCrearLista = () => {
    setEditandoListaId(null)
    setFormDataLista({
      nombre: '',
      descripcion: '',
      tipo_cliente: 'todos',
      categorias_incluidas: [],
      activo: true
    })
    setShowModalLista(true)
  }

  const handleEditarLista = (lista: ListaPrecios) => {
    setEditandoListaId(lista.id)
    setFormDataLista({
      nombre: lista.nombre,
      descripcion: lista.descripcion || '',
      tipo_cliente: lista.tipo_cliente,
      categorias_incluidas: (lista.categorias_incluidas as number[]) || [],
      activo: lista.activo
    })
    setShowModalLista(true)
  }

  const handleGuardarLista = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      setSuccess('')

      if (!formDataLista.nombre.trim()) {
        setError('El nombre es obligatorio')
        return
      }
      if (formDataLista.categorias_incluidas.length === 0) {
        setError('Seleccioná al menos una categoría')
        return
      }

      const payload = {
        nombre: formDataLista.nombre,
        descripcion: formDataLista.descripcion,
        tipo_cliente: formDataLista.tipo_cliente,
        categorias_incluidas: formDataLista.categorias_incluidas
      }

      let response
      if (editandoListaId) {
        response = await precios.updateLista(editandoListaId, payload)
      } else {
        response = await precios.createLista(payload)
      }

      if (response.error) {
        setError(response.error)
      } else {
        setSuccess(editandoListaId ? 'Lista actualizada' : 'Lista creada')
        setShowModalLista(false)
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleEliminarLista = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar lista "${nombre}"?`)) return
    try {
      const response = await precios.deleteLista(id)
      if (response.error) {
        setError(response.error)
      } else {
        setSuccess('Lista eliminada')
        cargarDatos()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleImprimirLista = async (lista: ListaPrecios) => {
    try {
      // Obtener datos de la empresa para el membrete
      const configResponse = await fetch('/api/configuracion/empresa', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        }
      })
      const configData = await configResponse.json()

      const response = await fetch(`/api/precios/listas/${lista.id}/imprimir`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
        }
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Abrir ventana de impresión
      const ventana = window.open('', '_blank')
      if (ventana) {
        const productosAgrupados = data.productos_agrupados || {}
        const tipoClienteDisplay = data.tipo_cliente === 'mayorista' ? '🏢 Mayorista' : data.tipo_cliente === 'minorista' ? '🛒 Minorista' : '🔄 Todos'
        
        // Datos de la empresa para el membrete
        const nombreEmpresa = configData.nombre_empresa || 'AYMARA'
        const direccion = configData.direccion || ''
        const telefono = configData.telefono || ''
        // Construir URL completa del logo usando la URL del backend
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        let logoSrc = ''
        let logoHtml = ''
        if (configData.logo_url) {
          logoSrc = `${backendUrl}${configData.logo_url}`
          // Verificar que el logo existe antes de incluirlo
          logoHtml = `<img src="${logoSrc}" style="height: 60px; margin-right: 15px; object-fit: contain;" alt="Logo" onerror="this.style.display='none'" />`
        }

        ventana.document.write(`
          <html>
            <head>
              <title>${lista.nombre}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .membrete {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  border: 2px solid #1e40af;
                  padding: 15px;
                  margin-bottom: 20px;
                  background-color: #f9fafb;
                }
                .membrete-izq {
                  display: flex;
                  align-items: center;
                  flex: 1;
                }
                .membrete-der {
                  text-align: right;
                  border-left: 2px solid #1e40af;
                  padding-left: 15px;
                  min-width: 200px;
                }
                .empresa-nombre {
                  font-size: 20px;
                  font-weight: bold;
                  color: #1e40af;
                  margin-bottom: 8px;
                }
                .empresa-datos {
                  font-size: 12px;
                  color: #4b5563;
                  line-height: 1.6;
                }
                .lista-titulo {
                  font-size: 22px;
                  font-weight: bold;
                  color: #1e40af;
                  margin-bottom: 8px;
                }
                .info { 
                  color: #6b7280; 
                  font-size: 13px; 
                  line-height: 1.8;
                }
                .tipo-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 4px;
                  font-size: 12px;
                  font-weight: 600;
                  background-color: ${data.tipo_cliente === 'mayorista' ? '#dbeafe' : '#dcfce7'};
                  color: ${data.tipo_cliente === 'mayorista' ? '#1e40af' : '#166534'};
                }
                .categoria-separator {
                  margin-top: 30px;
                  margin-bottom: 15px;
                  border-bottom: 2px solid #1e40af;
                  padding-bottom: 5px;
                }
                .categoria-titulo {
                  font-size: 16px;
                  font-weight: bold;
                  color: #1e40af;
                }
                table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; }
                th { background-color: #1e40af; color: white; font-weight: 600; }
                tr:nth-child(even) { background-color: #f9fafb; }
                .sku { font-family: monospace; color: #666; font-size: 12px; }
                .precio { font-size: 14px; font-weight: bold; color: #1e40af; text-align: right; }
                .nombre { font-size: 13px; }
                .page-break { page-break-inside: avoid; }
                @media print {
                  body { padding: 0; }
                  .membrete { background-color: #f3f4f6; }
                  h1 { font-size: 18px; }
                  .info { font-size: 10px; }
                  .categoria-separator { page-break-after: avoid; }
                }
              </style>
            </head>
            <body>
              <!-- MEMBRETE -->
              <div class="membrete">
                <div class="membrete-izq">
                  ${logoHtml}
                  <div>
                    <div class="empresa-nombre">${nombreEmpresa}</div>
                    <div class="empresa-datos">
                      ${direccion || telefono ? `${direccion || ''}${direccion && telefono ? ' - ' : ''}${telefono ? `Tel: ${telefono}` : ''}` : 'Sin datos de contacto'}
                    </div>
                  </div>
                </div>
                <div class="membrete-der">
                  <div class="lista-titulo">${lista.nombre}</div>
                  <div class="info">
                    <span class="tipo-badge">${tipoClienteDisplay}</span><br />
                    Fecha: ${new Date().toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: 'numeric'})}<br />
                    Total: ${data.total_productos} productos
                  </div>
                </div>
              </div>

              ${Object.entries(productosAgrupados).map(([categoria, productos]) => `
                <div class="page-break">
                  <h2 class="categoria-separator">${categoria}</h2>
                  <table>
                    <thead>
                      <tr>
                        <th style="width: 80px;">SKU</th>
                        <th>Producto</th>
                        <th style="width: 80px;">Unidad</th>
                        <th style="width: 100px;">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(productos as any[]).map((prod: any) => `
                        <tr>
                          <td class="sku">${prod.sku || '-'}</td>
                          <td class="nombre">${prod.nombre}</td>
                          <td class="text-sm text-gray-600">${prod.unidad_medida || '-'}</td>
                          <td class="precio">$${prod.precio_venta.toFixed(0)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              `).join('')}
            </body>
          </html>
        `)
        ventana.document.close()
        ventana.print()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al imprimir')
    }
  }

  // ============================================
  // CATEGORÍAS
  // ============================================

  const handleCrearCategoria = () => {
    setEditandoCategoriaId(null)
    setFormDataCategoria({
      nombre: '',
      margen_default_minorista: 25,
      margen_default_mayorista: 20
    })
    setShowModalCategoria(true)
  }

  const handleEditarCategoria = (categoria: Categoria) => {
    setEditandoCategoriaId(categoria.id)
    setFormDataCategoria({
      nombre: categoria.nombre,
      margen_default_minorista: (categoria.margen_default_minorista as number) || 25,
      margen_default_mayorista: (categoria.margen_default_mayorista as number) || 20
    })
    setShowModalCategoria(true)
  }

  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!formDataCategoria.nombre.trim()) {
        toast.error('El nombre es obligatorio')
        return
      }

      const payload = {
        nombre: formDataCategoria.nombre,
        margen_default_minorista: formDataCategoria.margen_default_minorista,
        margen_default_mayorista: formDataCategoria.margen_default_mayorista
      }

      let response
      if (editandoCategoriaId) {
        response = await categorias.update(editandoCategoriaId, payload)
      } else {
        response = await categorias.create(payload)
      }

      if (response.error) {
        // El backend ya devuelve el mensaje formateado en response.error
        toast.error(response.error)
      } else {
        toast.success(editandoCategoriaId ? 'Categoría actualizada' : 'Categoría creada')
        setShowModalCategoria(false)
        cargarDatos()
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar'
      toast.error(errorMessage)
    }
  }

  const handleEliminarCategoria = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar categoría "${nombre}"?`)) return
    try {
      const response = await categorias.delete(id)
      if (response.error) {
        toast.error(typeof response.error === 'string' ? response.error : JSON.stringify(response.error))
      } else {
        toast.success('Categoría eliminada')
        cargarDatos()
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  // ============================================
  // ACTUALIZACIÓN MASIVA DE PRECIOS
  // ============================================

  const toggleProductoSeleccionado = (productoId: number) => {
    setProductosSeleccionados(prev =>
      prev.includes(productoId)
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId]
    )
  }

  const seleccionarTodos = () => {
    setProductosSeleccionados(productosList.map(p => p.id))
  }

  const deseleccionarTodos = () => {
    setProductosSeleccionados([])
  }

  const handleActualizacionMasiva = async () => {
    if (productosSeleccionados.length === 0) {
      setError('Seleccioná al menos un producto')
      return
    }
    if (actualizacionData.valor <= 0) {
      setError('El valor debe ser mayor a 0')
      return
    }

    try {
      setError('')
      setSuccess('')

      // Capturar precios originales antes de la actualización
      const preciosAntes: Record<number, number> = {}
      productosSeleccionados.forEach(id => {
        const producto = productosList.find(p => p.id === id)
        if (producto) {
          preciosAntes[id] = producto.precio_venta_minorista || producto.precio_venta || 0
        }
      })

      console.log('=== DEBUG ACTUALIZACIÓN ===')
      console.log('productosSeleccionados:', productosSeleccionados)
      console.log('actualizacionData:', actualizacionData)
      console.log('redondeo:', redondeo)
      console.log('Precios antes:', preciosAntes)

      const payload = {
        producto_ids: productosSeleccionados,
        tipo_actualizacion: actualizacionData.tipo_actualizacion,
        valor: actualizacionData.valor,
        redondeo: redondeo
      }

      console.log('Payload enviado:', payload)

      const response = await precios.actualizacionMasiva(payload)
      console.log('Respuesta backend:', response)

      if (response.error) {
        setError(response.error)
      } else {
        // Guardar precios originales para el filtro "Solo precios que cambiaron"
        setPreciosOriginales(prev => ({ ...prev, ...preciosAntes }))
        
        setSuccess(`✅ Costos actualizados para ${productosSeleccionados.length} productos - Precios recalculados automáticamente`)
        setProductosSeleccionados([])
        cargarDatos()  // Recargar con timestamp anti-cache
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err: unknown) {
      console.error('Error en actualización:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar precios')
    }
  }

  // ============================================
  // ETIQUETAS PARA IMPRIMIR
  // ============================================

  // Helper function to format price with Argentine format (points for thousands, no decimals)
  // Uses Math.floor() for odd prices (psychological pricing)
  const formatPriceLabel = (price: number): string => {
    // Use floor to always round down for odd prices (e.g., 2899.9 → 2899)
    const rounded = Math.floor(price)
    // Convert to string and add points as thousand separators
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Helper function to format label content according to unit type
  const getEtiquetaContenido = (producto: ProductoConPrecios) => {
    const unidad = (producto.unidad_medida || 'GRAMO').toUpperCase()
    const precioVenta = producto.precio_venta_minorista || producto.precio_venta || 0

    // Case 1: GRAMO - precio_venta is per KILO, show price per 100g
    if (unidad === 'GRAMO' || unidad === 'G') {
      // precio_venta es por KILO, entonces precio por 100g = precio_venta / 10
      const precio100g = precioVenta / 10
      const precio100gFormatted = formatPriceLabel(precio100g)

      // Check if "mostrar precio por kilo" is enabled (for Granola)
      if (producto.mostrar_precio_kilo) {
        const precioKilo = precioVenta  // Ya es precio por kilo
        const precioKiloFormatted = formatPriceLabel(precioKilo)
        return {
          linea1: `$${precio100gFormatted} x 100g`,
          linea2: `$${precioKiloFormatted} el kilo`,
          showTwoLines: true
        }
      }

      return {
        linea1: `$${precio100gFormatted} x 100g`,
        linea2: '',
        showTwoLines: false
      }
    }

    // Case 2: BOLSA_XKILO - show price per bag with kg
    if (unidad.startsWith('BOLSA_')) {
      // Extract kg from unit name (e.g., BOLSA_2.5KILO -> 2.5kg)
      const kilos = unidad.replace('BOLSA_', '').replace('KILO', 'kg').replace('bolsa_', '').replace('kilo', 'kg')
      const precioBolsa = producto.precio_venta_mayorista || precioVenta
      const precioBolsaFormatted = formatPriceLabel(precioBolsa)

      return {
        linea1: `$${precioBolsaFormatted} la bolsa`,
        linea2: `(${kilos})`,
        showTwoLines: true
      }
    }

    // Case 3: KILO - show price per kilo
    if (unidad === 'KILO' || unidad === 'KG') {
      const precioKilo = producto.precio_venta_mayorista || precioVenta
      const precioKiloFormatted = formatPriceLabel(precioKilo)

      return {
        linea1: `$${precioKiloFormatted} el kilo`,
        linea2: '',
        showTwoLines: false
      }
    }

    // Default: show regular price
    const precioFormatted = formatPriceLabel(precioVenta)
    return {
      linea1: `$${precioFormatted}`,
      linea2: unidad,
      showTwoLines: false
    }
  }

  const toggleProductoEtiqueta = (productoId: number) => {
    setProductosParaEtiquetas(prev =>
      prev.includes(productoId)
        ? prev.filter(id => id !== productoId)
        : [...prev, productoId]
    )
  }

  const handleImprimirEtiquetas = () => {
    if (productosParaEtiquetas.length === 0) {
      setError('Seleccioná al menos un producto para imprimir etiquetas')
      return
    }

    // Abrir ventana de impresión con etiquetas
    const productosParaImprimir = productosList.filter(p => productosParaEtiquetas.includes(p.id))
    const ventana = window.open('', '_blank')

    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Etiquetas de Precios</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 10px; }
              h1 { font-size: 14px; margin-bottom: 8px; }

              /* Grid de 4 etiquetas por línea (más angostas) */
              .etiquetas-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 2mm;
              }

              .etiqueta {
                border: 2px solid #000;
                padding: 2mm;
                text-align: center;
                page-break-inside: avoid;
                min-height: 15mm;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }

              .producto-nombre {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 0.5mm;
                line-height: 1.2;
                word-wrap: break-word;
              }

              /* Fila precio + unidad alineados */
              .precio-unidad-row {
                display: flex;
                justify-content: center;
                align-items: baseline;
                gap: 3mm;
                margin: 0.5mm 0;
              }

              .producto-precio {
                font-size: 16px;
                font-weight: bold;
                color: #000;
                white-space: nowrap;
              }

              .producto-unidad {
                font-size: 10px;
                color: #666;
                text-align: left;
                min-width: 30px;
              }

              .producto-codigo {
                font-size: 8px;
                color: #666;
                margin-top: 0.5mm;
              }

              /* Two-line label support (for Granola and BOLSA) */
              .producto-precio-dos-lineas {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1px;
              }
              .producto-precio-dos-lineas .linea-secundaria {
                font-size: 12px;
                font-weight: normal;
                color: #444;
                white-space: nowrap;
              }

              @media print {
                @page {
                  size: A4;
                  margin: 5mm;
                }
                body { padding: 0; }
                h1 { font-size: 12px; }
                .etiquetas-grid { gap: 1mm; }
                .etiqueta { padding: 1.5mm; min-height: 14mm; }
              }
            </style>
          </head>
          <body>
            <h1>Etiquetas de Precios - ${new Date().toLocaleDateString()}</h1>
            <div class="etiquetas-grid">
              ${productosParaImprimir.map(p => {
                const contenido = getEtiquetaContenido(p)
                const precioDisplay = contenido.showTwoLines
                  ? `<div class="producto-precio-dos-lineas">
                      <span class="producto-precio">${contenido.linea1}</span>
                      <span class="linea-secundaria">${contenido.linea2}</span>
                     </div>`
                  : `<div class="producto-precio">${contenido.linea1}</div>`

                return `
                <div class="etiqueta">
                  <div class="producto-nombre">${p.nombre}</div>
                  ${precioDisplay}
                  <div class="producto-codigo">Cód: ${p.sku || p.id}</div>
                </div>
              `}).join('')}
            </div>
          </body>
        </html>
      `)
      ventana.document.close()
      ventana.print()
    }

    setProductosParaEtiquetas([])
  }

  // ============================================
  // FILTROS Y BÚSQUEDA
  // ============================================

  const productosFiltrados = productosList.filter(p => {
    const matchBusqueda = !busqueda ||
      `${p.nombre} ${p.sku || ''}`.toLowerCase().includes(busqueda.toLowerCase())

    // Filtro por categoría
    const matchCategoria = filtroCategoria === 'all' || (() => {
      const prodCatId = p.categoria_id != null ? Number(p.categoria_id) : null
      const filtroId = typeof filtroCategoria === 'string' ? Number(filtroCategoria) : filtroCategoria
      return prodCatId === filtroId
    })()

    // Filtro "Solo precios que cambiaron"
    const matchPrecioCambiado = !soloPreciosQueCambiaron || (() => {
      const precioOriginal = preciosOriginales[p.id]
      const precioActual = p.precio_venta_minorista || p.precio_venta || 0
      
      // ✅ Si hay precio original registrado, comparar con el actual
      if (precioOriginal !== undefined) {
        // Comparar precios (con tolerancia para decimales)
        return Math.abs(precioActual - precioOriginal) > 0.01
      }
      
      // ✅ FIX: Si no hay precio original, verificar si el producto fue actualizado recientemente
      // Esto permite detectar cambios hechos desde FC de Compra u otros módulos
      if (p.actualizado_en) {
        const fechaActualizacion = new Date(p.actualizado_en)
        const ahora = new Date()
        const diferenciaMinutos = (ahora.getTime() - fechaActualizacion.getTime()) / (1000 * 60)
        
        // Considerar "cambiado" si fue actualizado en los últimos 5 minutos
        // Esto captura cambios de FC de Compra sin necesidad de registrar el precio anterior
        return diferenciaMinutos < 5
      }
      
      // Si no hay precio original ni fecha de actualización reciente, considerar que no cambió
      return false
    })()

    return matchBusqueda && matchCategoria && matchPrecioCambiado
  })

  // Debug del filtro
  useEffect(() => {
    console.log('=== DEBUG FILTRO ===')
    console.log('filtroCategoria:', filtroCategoria, 'tipo:', typeof filtroCategoria)
    console.log('productosList:', productosList.length, 'productos')
    console.log('categoriasList:', categoriasList.length, 'categorias')
    console.log('productosFiltrados:', productosFiltrados.length, 'de', productosList.length)
    if (productosList.length > 0) {
      console.log('ejemplo producto:', {
        nombre: productosList[0].nombre,
        categoria_id: productosList[0].categoria_id,
        tipo: typeof productosList[0].categoria_id,
        valor: String(productosList[0].categoria_id)
      })
    }
    console.log('===================')
  }, [filtroCategoria, productosList, categoriasList, productosFiltrados.length])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Precios</h1>
          <p className="text-sm text-gray-500 mt-1">Gestioná listas de precios, etiquetas y actualizaciones masivas</p>
        </div>
        {activeTab === 'listas' && (
          <button
            onClick={handleCrearLista}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Tag size={18} />
            Nueva Lista de Precios
          </button>
        )}
      </div>

      {/* Mensajes */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

      {/* Pestañas */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {[
              { id: 'listas', label: '📋 Listas de Precios' },
              { id: 'categorias', label: '📁 Categorías' },
              { id: 'productos', label: '📦 Productos y Precios' },
              { id: 'actualizar', label: '🔄 Actualización Masiva' },
              { id: 'etiquetas', label: '🏷️ Imprimir Etiquetas' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ============================================
              PESTAÑA 1: LISTAS DE PRECIOS
              ============================================ */}
          {activeTab === 'listas' && (
            <div className="space-y-4">
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Listas de Precios</p>
                  <p className="mt-1">
                    Creá diferentes listas para minoristas, mayoristas o promociones. 
                    Cada lista puede tener un margen de ganancia diferente.
                  </p>
                </div>
              </div>

              {/* Tabla de Listas */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categorías</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {listasPrecios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          No hay listas de precios creadas
                        </td>
                      </tr>
                    ) : (
                      listasPrecios.map((lista) => (
                        <tr key={lista.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">
                            {lista.nombre}
                            {lista.descripcion && <p className="text-xs text-gray-500">{lista.descripcion}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lista.tipo_cliente === 'mayorista' ? 'bg-purple-100 text-purple-700' :
                              lista.tipo_cliente === 'minorista' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lista.tipo_cliente.charAt(0).toUpperCase() + lista.tipo_cliente.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {(lista.categorias_incluidas?.length || 0)} categorías
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lista.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {lista.activa ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleImprimirLista(lista)}
                              className="text-green-600 hover:text-green-900 font-medium"
                              title="Imprimir lista"
                            >
                              🖨️ Imprimir
                            </button>
                            <button
                              onClick={() => handleEditarLista(lista)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarLista(lista.id, lista.nombre)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================
              PESTAÑA 2: CATEGORÍAS
              ============================================ */}
          {activeTab === 'categorias' && (
            <div className="space-y-4">
              {/* Header con botón crear */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Categorías de Productos</h2>
                  <p className="text-sm text-gray-500">Organizá tus productos por rubro</p>
                </div>
                <button
                  onClick={handleCrearCategoria}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FolderOpen size={18} />
                  Nueva Categoría
                </button>
              </div>

              {/* Info box */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-indigo-600 flex-shrink-0" size={20} />
                <div className="text-sm text-indigo-800">
                  <p className="font-medium">Márgenes por Categoría</p>
                  <p className="mt-1">
                    Los márgenes default se usan para calcular automáticamente el precio de venta minorista y mayorista.
                  </p>
                </div>
              </div>

              {/* Tabla de Categorías */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Margen Minorista</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Margen Mayorista</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categoriasList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-gray-500">
                          No hay categorías creadas
                        </td>
                      </tr>
                    ) : (
                      categoriasList.map((categoria) => (
                        <tr key={categoria.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium">{categoria.nombre}</td>
                          <td className="px-4 py-3 text-sm text-right">{(categoria.margen_default_minorista as number) || 0}%</td>
                          <td className="px-4 py-3 text-sm text-right">{(categoria.margen_default_mayorista as number) || 0}%</td>
                          <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditarCategoria(categoria)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminarCategoria(categoria.id, categoria.nombre)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================
              PESTAÑA 2: PRODUCTOS Y PRECIOS
              ============================================ */}
          {activeTab === 'productos' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="flex flex-wrap gap-4 items-center">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto..."
                  className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={String(filtroCategoria)}
                  onChange={(e) => {
                    const val = e.target.value
                    console.log('DEBUG [select change]:', val, 'tipo:', typeof val)
                    setFiltroCategoria(val === 'all' ? 'all' : Number(val))
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categoriasList.map(cat => (
                    <option key={cat.id} value={String(cat.id)}>{cat.nombre}</option>
                  ))}
                </select>
                <button
                  onClick={cargarDatos}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Actualizar
                </button>
              </div>

              {/* Tabla de Productos */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Producto</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categoría</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Costo</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">🛒 P. Minorista</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">🏢 P. Mayorista</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {productosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          No hay productos
                        </td>
                      </tr>
                    ) : (
                      productosFiltrados.map((producto) => {
                        // Usar costo_promedio del backend
                        const costo = producto.costo_promedio || 0
                        const precioMinorista = producto.precio_venta_minorista || producto.precio_venta || 0
                        const precioMayorista = producto.precio_venta_mayorista || producto.precio_venta || 0
                        const margenMinorista = producto.margen_efectivo_minorista || 0
                        const margenMayorista = producto.margen_efectivo_mayorista || 0
                        return (
                          <tr key={producto.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">
                              {producto.nombre}
                              {producto.sku && <p className="text-xs text-gray-500">SKU: {producto.sku}</p>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {producto.categoria_id ? (
                                (() => {
                                  const categoria = categoriasList.find(c => c.id === producto.categoria_id)
                                  return categoria ? (
                                    <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                                      {categoria.nombre}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 text-xs">ID: {producto.categoria_id}</span>
                                  )
                                })()
                              ) : (
                                <span className="text-gray-400">Sin categoría</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(costo)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="font-semibold text-blue-600">{formatCurrency(precioMinorista)}</div>
                              <div className="text-xs text-gray-400">margen: {margenMinorista.toFixed(1)}%</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <div className="font-semibold text-purple-600">{formatCurrency(precioMayorista)}</div>
                              <div className="text-xs text-gray-400">margen: {margenMayorista.toFixed(1)}%</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <span className={producto.stock_actual && producto.stock_actual < 10 ? 'text-red-600 font-semibold' : ''}>
                                {producto.stock_actual || 0}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================
              PESTAÑA 3: ACTUALIZACIÓN MASIVA
              ============================================ */}
          {activeTab === 'actualizar' && (
            <div className="space-y-4">
              {/* Info box */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="text-orange-600 flex-shrink-0" size={20} />
                <div className="text-sm text-orange-800">
                  <p className="font-medium">Actualización Masiva de Costos</p>
                  <p className="mt-1">
                    Actualizá el costo de múltiples productos a la vez.
                    El precio de venta se recalculará automáticamente según el margen de cada categoría.
                  </p>
                </div>
              </div>

              {/* Selección de productos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">Seleccionar Productos</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={seleccionarTodos}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Seleccionar todos
                    </button>
                    <button
                      onClick={deseleccionarTodos}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {productosSeleccionados.length} producto(s) seleccionado(s)
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {productosList.map(producto => (
                    <label key={producto.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productosSeleccionados.includes(producto.id)}
                        onChange={() => toggleProductoSeleccionado(producto.id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{producto.nombre}</span>
                      <div className="text-xs text-right">
                        <div className="text-gray-500">Costo: {formatCurrency(producto.costo_promedio || 0)}</div>
                        <div className="text-blue-600 font-medium">Minorista: {formatCurrency(producto.precio_venta_minorista || producto.precio_venta || 0)}</div>
                        <div className="text-purple-600 font-medium">Mayorista: {formatCurrency(producto.precio_venta_mayorista || producto.precio_venta || 0)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Info box - precios se recalculan */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Al actualizar el costo, ambos precios de venta (minorista y mayorista) se recalcularán automáticamente según el margen de cada categoría.
                </p>
              </div>

              {/* Tipo de actualización */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Actualización</label>
                  <select
                    value={actualizacionData.tipo_actualizacion}
                    onChange={(e) => setActualizacionData({...actualizacionData, tipo_actualizacion: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="porcentaje">Aumento % (sobre costo)</option>
                    <option value="monto_fijo">Monto Fijo ($) al costo</option>
                    <option value="nuevo_costo">Nuevo Costo Directo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor {actualizacionData.tipo_actualizacion === 'porcentaje' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={actualizacionData.valor}
                    onChange={(e) => setActualizacionData({...actualizacionData, valor: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {actualizacionData.tipo_actualizacion === 'nuevo_costo' 
                      ? 'Nuevo costo del producto' 
                      : 'Se aplica al costo actual'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redondeo (Argentina)</label>
                  <select
                    value={redondeo}
                    onChange={(e) => {
                      setRedondeo(e.target.value)
                      setActualizacionData({...actualizacionData, redondeo: e.target.value as any})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Sin redondeo (solo quitar centavos)</option>
                    <option value="50">Redondear a 50 ($450, $500, $550)</option>
                    <option value="99">Redondeo psicológico ($499, $999, $1499)</option>
                    <option value="90">Redondeo a 90 ($490, $990, $1490)</option>
                    <option value="100">Redondear a 100 ($500, $600, $700)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Ej: $473 → $499 (99), $450 (50), $490 (90), $500 (100)
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleActualizacionMasiva}
                    disabled={productosSeleccionados.length === 0 || actualizacionData.valor <= 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    💾 Actualizar Costos
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              PESTAÑA 4: IMPRIMIR ETIQUETAS
              ============================================ */}
          {activeTab === 'etiquetas' && (
            <div className="space-y-4">
              {/* Info box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Printer className="text-green-600 flex-shrink-0" size={20} />
                <div className="text-sm text-green-800">
                  <p className="font-medium">Imprimir Etiquetas de Precios</p>
                  <p className="mt-1">
                    Seleccioná productos y generá etiquetas para imprimir.
                    Las etiquetas incluyen nombre, precio y código.
                  </p>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-white rounded-lg p-4 border">
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar producto</label>
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Nombre o SKU..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por categoría</label>
                    <select
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">Todas las categorías</option>
                      {categoriasList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={soloPreciosQueCambiaron}
                        onChange={(e) => setSoloPreciosQueCambiaron(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">🔄 Solo precios que cambiaron</span>
                    </label>
                  </div>
                </div>
                {soloPreciosQueCambiaron && (
                  <p className="text-xs text-green-600 mt-2">
                    ℹ️ Mostrando solo productos cuyo precio minorista cambió después de la última actualización
                  </p>
                )}
              </div>

              {/* Selección de productos para etiquetas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">Seleccionar Productos para Etiquetas</h3>
                  <button
                    onClick={handleImprimirEtiquetas}
                    disabled={productosParaEtiquetas.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Printer size={18} />
                    Imprimir {productosParaEtiquetas.length} Etiqueta(s)
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {productosParaEtiquetas.length} producto(s) seleccionado(s)
                </p>
                <div className="max-h-96 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {productosFiltrados.map(producto => {
                    // Usar getEtiquetaContenido para mostrar el precio formateado como en la etiqueta
                    const contenidoEtiqueta = getEtiquetaContenido(producto)
                    const precioDisplay = contenidoEtiqueta.showTwoLines
                      ? `${contenidoEtiqueta.linea1} | ${contenidoEtiqueta.linea2}`
                      : contenidoEtiqueta.linea1

                    return (
                      <label key={producto.id} className="flex items-center gap-2 p-3 bg-white rounded border hover:border-green-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={productosParaEtiquetas.includes(producto.id)}
                          onChange={() => toggleProductoEtiqueta(producto.id)}
                          className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">{producto.nombre}</p>
                          <p className="text-xs text-green-600 font-medium">{precioDisplay}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          MODAL: CREAR/EDITAR LISTA DE PRECIOS
          ============================================ */}
      {showModalLista && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editandoListaId ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
            </h2>
            <form onSubmit={handleGuardarLista} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDataLista.nombre}
                  onChange={(e) => setFormDataLista({...formDataLista, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: Lista Mayorista 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formDataLista.descripcion}
                  onChange={(e) => setFormDataLista({...formDataLista, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción opcional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente</label>
                <select
                  value={formDataLista.tipo_cliente}
                  onChange={(e) => setFormDataLista({...formDataLista, tipo_cliente: e.target.value as 'minorista' | 'mayorista' | 'todos'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="minorista">Minorista</option>
                  <option value="mayorista">Mayorista</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categorías Incluidas <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {categoriasList.length === 0 ? (
                    <p className="text-sm text-gray-500">No hay categorías creadas</p>
                  ) : (
                    <>
                      {/* Checkbox "Seleccionar todas" */}
                      <label className="flex items-center gap-2 py-2 border-b border-gray-200 mb-2 cursor-pointer sticky top-0 bg-white z-10">
                        <input
                          type="checkbox"
                          checked={formDataLista.categorias_incluidas.length === categoriasList.length && categoriasList.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Seleccionar todas las categorías
                              setFormDataLista({
                                ...formDataLista,
                                categorias_incluidas: categoriasList.map(cat => cat.id)
                              })
                            } else {
                              // Deseleccionar todas las categorías
                              setFormDataLista({
                                ...formDataLista,
                                categorias_incluidas: []
                              })
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 font-bold"
                        />
                        <span className="text-sm font-bold text-gray-900">Seleccionar todas ({categoriasList.length})</span>
                      </label>
                      
                      {/* Lista de categorías individuales */}
                      {categoriasList.map(cat => (
                        <label key={cat.id} className="flex items-center gap-2 py-2 hover:bg-gray-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formDataLista.categorias_incluidas.includes(cat.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormDataLista({...formDataLista, categorias_incluidas: [...formDataLista.categorias_incluidas, cat.id]})
                              } else {
                                setFormDataLista({...formDataLista, categorias_incluidas: formDataLista.categorias_incluidas.filter(id => id !== cat.id)})
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{cat.nombre}</span>
                        </label>
                      ))}
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formDataLista.categorias_incluidas.length} categoría(s) seleccionada(s) de {categoriasList.length}
                </p>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalLista(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editandoListaId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          MODAL: CREAR/EDITAR CATEGORÍA
          ============================================ */}
      {showModalCategoria && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editandoCategoriaId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
            <form onSubmit={handleGuardarCategoria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDataCategoria.nombre}
                  onChange={(e) => setFormDataCategoria({...formDataCategoria, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="ej: Semillas"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margen Minorista (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formDataCategoria.margen_default_minorista}
                  onChange={(e) => setFormDataCategoria({...formDataCategoria, margen_default_minorista: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Margen Mayorista (%)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={formDataCategoria.margen_default_mayorista}
                  onChange={(e) => setFormDataCategoria({...formDataCategoria, margen_default_mayorista: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModalCategoria(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editandoCategoriaId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}