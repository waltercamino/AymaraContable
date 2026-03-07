--
-- PostgreSQL database dump
--

\restrict j53YavbOnwcCcLLhvsY6woKIDt3uuk1IWyclgc5Ojl3mK5CT0p1zAa4aW2AlN1c

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibos DROP CONSTRAINT IF EXISTS recibos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibos DROP CONSTRAINT IF EXISTS recibos_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibos DROP CONSTRAINT IF EXISTS recibos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibo_imputaciones DROP CONSTRAINT IF EXISTS recibo_imputaciones_venta_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibo_imputaciones DROP CONSTRAINT IF EXISTS recibo_imputaciones_recibo_id_fkey;
ALTER TABLE IF EXISTS ONLY public.recibo_imputaciones DROP CONSTRAINT IF EXISTS recibo_imputaciones_compra_id_fkey;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_categoria_id_fkey;
ALTER TABLE IF EXISTS ONLY public.producto_proveedor DROP CONSTRAINT IF EXISTS producto_proveedor_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.producto_proveedor DROP CONSTRAINT IF EXISTS producto_proveedor_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pedidos_proveedor DROP CONSTRAINT IF EXISTS pedidos_proveedor_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pedidos_proveedor DROP CONSTRAINT IF EXISTS pedidos_proveedor_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pedido_detalles DROP CONSTRAINT IF EXISTS pedido_detalles_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pedido_detalles DROP CONSTRAINT IF EXISTS pedido_detalles_pedido_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notas_credito DROP CONSTRAINT IF EXISTS notas_credito_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notas_credito DROP CONSTRAINT IF EXISTS notas_credito_factura_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notas_credito DROP CONSTRAINT IF EXISTS notas_credito_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.nota_credito_detalles DROP CONSTRAINT IF EXISTS nota_credito_detalles_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.nota_credito_detalles DROP CONSTRAINT IF EXISTS nota_credito_detalles_nota_credito_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_categoria_caja_id_fkey;
ALTER TABLE IF EXISTS ONLY public.movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_caja_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historial_margenes DROP CONSTRAINT IF EXISTS historial_margenes_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historial_margenes DROP CONSTRAINT IF EXISTS historial_margenes_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historial_costos DROP CONSTRAINT IF EXISTS historial_costos_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.historial_costos DROP CONSTRAINT IF EXISTS historial_costos_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_anulado_por_fkey;
ALTER TABLE IF EXISTS ONLY public.factura_detalles DROP CONSTRAINT IF EXISTS factura_detalles_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.factura_detalles DROP CONSTRAINT IF EXISTS factura_detalles_factura_id_fkey;
ALTER TABLE IF EXISTS ONLY public.detalles_lista_precios DROP CONSTRAINT IF EXISTS detalles_lista_precios_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.detalles_lista_precios DROP CONSTRAINT IF EXISTS detalles_lista_precios_lista_precios_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente_proveedor DROP CONSTRAINT IF EXISTS cuenta_corriente_proveedor_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente_proveedor DROP CONSTRAINT IF EXISTS cuenta_corriente_proveedor_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente DROP CONSTRAINT IF EXISTS cuenta_corriente_factura_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente DROP CONSTRAINT IF EXISTS cuenta_corriente_compra_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente_cliente DROP CONSTRAINT IF EXISTS cuenta_corriente_cliente_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente_cliente DROP CONSTRAINT IF EXISTS cuenta_corriente_cliente_cliente_id_fkey;
ALTER TABLE IF EXISTS ONLY public.compras DROP CONSTRAINT IF EXISTS compras_usuario_id_fkey;
ALTER TABLE IF EXISTS ONLY public.compras DROP CONSTRAINT IF EXISTS compras_proveedor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.compras DROP CONSTRAINT IF EXISTS compras_anulado_por_fkey;
ALTER TABLE IF EXISTS ONLY public.compra_detalles DROP CONSTRAINT IF EXISTS compra_detalles_producto_id_fkey;
ALTER TABLE IF EXISTS ONLY public.compra_detalles DROP CONSTRAINT IF EXISTS compra_detalles_compra_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cajas_dia DROP CONSTRAINT IF EXISTS cajas_dia_usuario_cierre_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cajas_dia DROP CONSTRAINT IF EXISTS cajas_dia_usuario_apertura_id_fkey;
DROP INDEX IF EXISTS public.idx_recibos_tipo;
DROP INDEX IF EXISTS public.idx_recibos_proveedor;
DROP INDEX IF EXISTS public.idx_recibos_fecha;
DROP INDEX IF EXISTS public.idx_recibos_cliente;
DROP INDEX IF EXISTS public.idx_recibo_imputaciones_venta;
DROP INDEX IF EXISTS public.idx_recibo_imputaciones_recibo;
DROP INDEX IF EXISTS public.idx_recibo_imputaciones_compra;
DROP INDEX IF EXISTS public.idx_productos_categoria;
DROP INDEX IF EXISTS public.idx_pedidos_proveedor;
DROP INDEX IF EXISTS public.idx_pedidos_fecha;
DROP INDEX IF EXISTS public.idx_pedidos_estado;
DROP INDEX IF EXISTS public.idx_pedido_detalles_producto;
DROP INDEX IF EXISTS public.idx_pedido_detalles_pedido;
DROP INDEX IF EXISTS public.idx_pagos_proveedor;
DROP INDEX IF EXISTS public.idx_pagos_cliente;
DROP INDEX IF EXISTS public.idx_notas_credito_fecha;
DROP INDEX IF EXISTS public.idx_notas_credito_factura;
DROP INDEX IF EXISTS public.idx_notas_credito_cliente;
DROP INDEX IF EXISTS public.idx_movimientos_fecha;
DROP INDEX IF EXISTS public.idx_movimientos_caja_id;
DROP INDEX IF EXISTS public.idx_listas_precios_activa;
DROP INDEX IF EXISTS public.idx_historial_margenes_producto;
DROP INDEX IF EXISTS public.idx_historial_margenes_fecha;
DROP INDEX IF EXISTS public.idx_facturas_numero;
DROP INDEX IF EXISTS public.idx_facturas_fecha;
DROP INDEX IF EXISTS public.idx_facturas_estado;
DROP INDEX IF EXISTS public.idx_facturas_cliente;
DROP INDEX IF EXISTS public.idx_compras_proveedor;
DROP INDEX IF EXISTS public.idx_compras_fecha;
DROP INDEX IF EXISTS public.idx_clientes_tipo;
DROP INDEX IF EXISTS public.idx_clientes_cuit;
DROP INDEX IF EXISTS public.idx_cc_venta;
DROP INDEX IF EXISTS public.idx_cc_tipo_entidad;
DROP INDEX IF EXISTS public.idx_cc_proveedor;
DROP INDEX IF EXISTS public.idx_cc_fecha;
DROP INDEX IF EXISTS public.idx_cc_compra;
DROP INDEX IF EXISTS public.idx_cc_cliente;
DROP INDEX IF EXISTS public.idx_cajas_dia_fecha;
DROP INDEX IF EXISTS public.idx_cajas_dia_estado;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_username_key;
ALTER TABLE IF EXISTS ONLY public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_pkey;
ALTER TABLE IF EXISTS ONLY public.roles DROP CONSTRAINT IF EXISTS roles_nombre_key;
ALTER TABLE IF EXISTS ONLY public.recibos DROP CONSTRAINT IF EXISTS recibos_pkey;
ALTER TABLE IF EXISTS ONLY public.recibo_imputaciones DROP CONSTRAINT IF EXISTS recibo_imputaciones_pkey;
ALTER TABLE IF EXISTS ONLY public.proveedores DROP CONSTRAINT IF EXISTS proveedores_pkey;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_sku_key;
ALTER TABLE IF EXISTS ONLY public.productos DROP CONSTRAINT IF EXISTS productos_pkey;
ALTER TABLE IF EXISTS ONLY public.producto_proveedor DROP CONSTRAINT IF EXISTS producto_proveedor_producto_id_proveedor_id_key;
ALTER TABLE IF EXISTS ONLY public.producto_proveedor DROP CONSTRAINT IF EXISTS producto_proveedor_pkey;
ALTER TABLE IF EXISTS ONLY public.pedidos_proveedor DROP CONSTRAINT IF EXISTS pedidos_proveedor_pkey;
ALTER TABLE IF EXISTS ONLY public.pedidos_proveedor DROP CONSTRAINT IF EXISTS pedidos_proveedor_numero_interno_key;
ALTER TABLE IF EXISTS ONLY public.pedido_detalles DROP CONSTRAINT IF EXISTS pedido_detalles_pkey;
ALTER TABLE IF EXISTS ONLY public.pagos DROP CONSTRAINT IF EXISTS pagos_pkey;
ALTER TABLE IF EXISTS ONLY public.notas_credito DROP CONSTRAINT IF EXISTS notas_credito_punto_venta_numero_nota_credito_tipo_comproba_key;
ALTER TABLE IF EXISTS ONLY public.notas_credito DROP CONSTRAINT IF EXISTS notas_credito_pkey;
ALTER TABLE IF EXISTS ONLY public.nota_credito_detalles DROP CONSTRAINT IF EXISTS nota_credito_detalles_pkey;
ALTER TABLE IF EXISTS ONLY public.movimientos_caja DROP CONSTRAINT IF EXISTS movimientos_caja_pkey;
ALTER TABLE IF EXISTS ONLY public.listas_precios DROP CONSTRAINT IF EXISTS listas_precios_pkey;
ALTER TABLE IF EXISTS ONLY public.historial_margenes DROP CONSTRAINT IF EXISTS historial_margenes_pkey;
ALTER TABLE IF EXISTS ONLY public.historial_costos DROP CONSTRAINT IF EXISTS historial_costos_pkey;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_punto_venta_numero_factura_tipo_comprobante_key;
ALTER TABLE IF EXISTS ONLY public.facturas DROP CONSTRAINT IF EXISTS facturas_pkey;
ALTER TABLE IF EXISTS ONLY public.factura_detalles DROP CONSTRAINT IF EXISTS factura_detalles_pkey;
ALTER TABLE IF EXISTS ONLY public.detalles_lista_precios DROP CONSTRAINT IF EXISTS detalles_lista_precios_pkey;
ALTER TABLE IF EXISTS ONLY public.detalles_lista_precios DROP CONSTRAINT IF EXISTS detalles_lista_precios_lista_precios_id_producto_id_key;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente_proveedor DROP CONSTRAINT IF EXISTS cuenta_corriente_proveedor_pkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente DROP CONSTRAINT IF EXISTS cuenta_corriente_pkey;
ALTER TABLE IF EXISTS ONLY public.cuenta_corriente_cliente DROP CONSTRAINT IF EXISTS cuenta_corriente_cliente_pkey;
ALTER TABLE IF EXISTS ONLY public.configuracion_empresa DROP CONSTRAINT IF EXISTS configuracion_empresa_pkey;
ALTER TABLE IF EXISTS ONLY public.compras DROP CONSTRAINT IF EXISTS compras_pkey;
ALTER TABLE IF EXISTS ONLY public.compra_detalles DROP CONSTRAINT IF EXISTS compra_detalles_pkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_pkey;
ALTER TABLE IF EXISTS ONLY public.clientes DROP CONSTRAINT IF EXISTS clientes_cuit_key;
ALTER TABLE IF EXISTS ONLY public.categorias DROP CONSTRAINT IF EXISTS categorias_pkey;
ALTER TABLE IF EXISTS ONLY public.categorias DROP CONSTRAINT IF EXISTS categorias_nombre_unique;
ALTER TABLE IF EXISTS ONLY public.categorias_caja DROP CONSTRAINT IF EXISTS categorias_caja_pkey;
ALTER TABLE IF EXISTS ONLY public.categorias_caja DROP CONSTRAINT IF EXISTS categorias_caja_nombre_key;
ALTER TABLE IF EXISTS ONLY public.categoria_caja DROP CONSTRAINT IF EXISTS categoria_caja_pkey;
ALTER TABLE IF EXISTS ONLY public.categoria_caja DROP CONSTRAINT IF EXISTS categoria_caja_nombre_key;
ALTER TABLE IF EXISTS ONLY public.cajas_dia DROP CONSTRAINT IF EXISTS cajas_dia_pkey;
ALTER TABLE IF EXISTS ONLY public.caja_dia DROP CONSTRAINT IF EXISTS caja_dia_pkey;
ALTER TABLE IF EXISTS public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.roles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.proveedores ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.productos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.producto_proveedor ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pedidos_proveedor ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pedido_detalles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.pagos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notas_credito ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.nota_credito_detalles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.movimientos_caja ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.listas_precios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historial_margenes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.historial_costos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.facturas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.factura_detalles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.detalles_lista_precios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cuenta_corriente_proveedor ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cuenta_corriente_cliente ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cuenta_corriente ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.configuracion_empresa ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.compras ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.compra_detalles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.clientes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categorias_caja ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categorias ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categoria_caja ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.caja_dia ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.usuarios_id_seq;
DROP TABLE IF EXISTS public.usuarios;
DROP SEQUENCE IF EXISTS public.roles_id_seq;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.recibos;
DROP TABLE IF EXISTS public.recibo_imputaciones;
DROP SEQUENCE IF EXISTS public.proveedores_id_seq;
DROP TABLE IF EXISTS public.proveedores;
DROP SEQUENCE IF EXISTS public.productos_id_seq;
DROP TABLE IF EXISTS public.productos;
DROP SEQUENCE IF EXISTS public.producto_proveedor_id_seq;
DROP TABLE IF EXISTS public.producto_proveedor;
DROP SEQUENCE IF EXISTS public.pedidos_proveedor_id_seq;
DROP TABLE IF EXISTS public.pedidos_proveedor;
DROP SEQUENCE IF EXISTS public.pedido_detalles_id_seq;
DROP TABLE IF EXISTS public.pedido_detalles;
DROP SEQUENCE IF EXISTS public.pagos_id_seq;
DROP TABLE IF EXISTS public.pagos;
DROP SEQUENCE IF EXISTS public.notas_credito_id_seq;
DROP TABLE IF EXISTS public.notas_credito;
DROP SEQUENCE IF EXISTS public.nota_credito_detalles_id_seq;
DROP TABLE IF EXISTS public.nota_credito_detalles;
DROP SEQUENCE IF EXISTS public.movimientos_caja_id_seq;
DROP TABLE IF EXISTS public.movimientos_caja;
DROP SEQUENCE IF EXISTS public.listas_precios_id_seq;
DROP TABLE IF EXISTS public.listas_precios;
DROP SEQUENCE IF EXISTS public.historial_margenes_id_seq;
DROP TABLE IF EXISTS public.historial_margenes;
DROP SEQUENCE IF EXISTS public.historial_costos_id_seq;
DROP TABLE IF EXISTS public.historial_costos;
DROP SEQUENCE IF EXISTS public.facturas_id_seq;
DROP TABLE IF EXISTS public.facturas;
DROP SEQUENCE IF EXISTS public.factura_detalles_id_seq;
DROP TABLE IF EXISTS public.factura_detalles;
DROP SEQUENCE IF EXISTS public.detalles_lista_precios_id_seq;
DROP TABLE IF EXISTS public.detalles_lista_precios;
DROP SEQUENCE IF EXISTS public.cuenta_corriente_proveedor_id_seq;
DROP TABLE IF EXISTS public.cuenta_corriente_proveedor;
DROP SEQUENCE IF EXISTS public.cuenta_corriente_id_seq;
DROP SEQUENCE IF EXISTS public.cuenta_corriente_cliente_id_seq;
DROP TABLE IF EXISTS public.cuenta_corriente_cliente;
DROP TABLE IF EXISTS public.cuenta_corriente;
DROP SEQUENCE IF EXISTS public.configuracion_empresa_id_seq;
DROP TABLE IF EXISTS public.configuracion_empresa;
DROP SEQUENCE IF EXISTS public.compras_id_seq;
DROP TABLE IF EXISTS public.compras;
DROP SEQUENCE IF EXISTS public.compra_detalles_id_seq;
DROP TABLE IF EXISTS public.compra_detalles;
DROP SEQUENCE IF EXISTS public.clientes_id_seq;
DROP TABLE IF EXISTS public.clientes;
DROP SEQUENCE IF EXISTS public.categorias_id_seq;
DROP SEQUENCE IF EXISTS public.categorias_caja_id_seq;
DROP TABLE IF EXISTS public.categorias_caja;
DROP TABLE IF EXISTS public.categorias;
DROP SEQUENCE IF EXISTS public.categoria_caja_id_seq;
DROP TABLE IF EXISTS public.categoria_caja;
DROP TABLE IF EXISTS public.cajas_dia;
DROP SEQUENCE IF EXISTS public.caja_dia_id_seq;
DROP TABLE IF EXISTS public.caja_dia;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: caja_dia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.caja_dia (
    id integer NOT NULL,
    fecha date NOT NULL,
    saldo_inicial numeric(12,2) DEFAULT 0,
    saldo_final numeric(12,2),
    estado character varying(20) DEFAULT 'abierto'::character varying,
    usuario_id integer,
    fecha_apertura timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre timestamp without time zone,
    observaciones_cierre text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.caja_dia OWNER TO postgres;

--
-- Name: caja_dia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.caja_dia_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.caja_dia_id_seq OWNER TO postgres;

--
-- Name: caja_dia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.caja_dia_id_seq OWNED BY public.caja_dia.id;


--
-- Name: cajas_dia; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cajas_dia (
    id integer NOT NULL,
    numero_interno character varying(20),
    fecha_apertura timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre timestamp without time zone,
    saldo_inicial numeric(12,2) DEFAULT 0,
    saldo_final numeric(12,2),
    estado character varying(20) DEFAULT 'abierta'::character varying,
    usuario_apertura_id integer,
    usuario_cierre_id integer,
    observaciones_cierre text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cajas_dia OWNER TO postgres;

--
-- Name: cajas_dia_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.cajas_dia ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.cajas_dia_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: categoria_caja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria_caja (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    tipo character varying(20) NOT NULL,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT categoria_caja_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('ingreso'::character varying)::text, ('egreso'::character varying)::text])))
);


ALTER TABLE public.categoria_caja OWNER TO postgres;

--
-- Name: categoria_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categoria_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categoria_caja_id_seq OWNER TO postgres;

--
-- Name: categoria_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categoria_caja_id_seq OWNED BY public.categoria_caja.id;


--
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    margen_default_minorista numeric(5,2) DEFAULT 0,
    margen_default_mayorista numeric(5,2) DEFAULT 0,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    descripcion text,
    activo boolean DEFAULT true
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- Name: categorias_caja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias_caja (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(20) NOT NULL,
    subcategoria character varying(50)
);


ALTER TABLE public.categorias_caja OWNER TO postgres;

--
-- Name: categorias_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_caja_id_seq OWNER TO postgres;

--
-- Name: categorias_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_caja_id_seq OWNED BY public.categorias_caja.id;


--
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    cuit character varying(20),
    email character varying(100),
    telefono character varying(20),
    direccion character varying(300),
    ciudad character varying(100),
    codigo_postal character varying(10),
    condicion_iva character varying(50) DEFAULT 'Consumidor Final'::character varying,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    tipo_cliente character varying(20) DEFAULT 'minorista'::character varying,
    ingresos_brutos character varying(50),
    localidad character varying(100),
    CONSTRAINT chk_cuit_formato CHECK (((cuit IS NULL) OR ((cuit)::text ~ '^\d{2}-\d{8}-\d{1}$'::text) OR ((cuit)::text ~ '^\d{11}$'::text)))
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- Name: compra_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compra_detalles (
    id integer NOT NULL,
    compra_id integer,
    producto_id integer,
    cantidad numeric(10,3) NOT NULL,
    costo_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    costo_anterior numeric(12,2)
);


ALTER TABLE public.compra_detalles OWNER TO postgres;

--
-- Name: compra_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compra_detalles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compra_detalles_id_seq OWNER TO postgres;

--
-- Name: compra_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compra_detalles_id_seq OWNED BY public.compra_detalles.id;


--
-- Name: compras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.compras (
    id integer NOT NULL,
    fecha date NOT NULL,
    proveedor_id integer,
    numero_remision character varying(50),
    numero_factura character varying(50),
    subtotal numeric(10,2) NOT NULL,
    iva numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    medio_pago character varying(50),
    estado character varying(20) DEFAULT 'registrada'::character varying,
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    iva_total numeric DEFAULT 0,
    con_iva boolean DEFAULT false,
    numero_interno character varying(20),
    fecha_vencimiento timestamp without time zone,
    anulado_por integer,
    fecha_anulacion timestamp without time zone,
    motivo_anulacion character varying(500),
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    observaciones character varying(500)
);


ALTER TABLE public.compras OWNER TO postgres;

--
-- Name: compras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.compras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.compras_id_seq OWNER TO postgres;

--
-- Name: compras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.compras_id_seq OWNED BY public.compras.id;


--
-- Name: configuracion_empresa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion_empresa (
    id integer NOT NULL,
    nombre_empresa character varying(200) NOT NULL,
    cuit character varying(20),
    direccion character varying(200),
    telefono character varying(20),
    email character varying(100),
    logo_url character varying(500),
    pie_factura text,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    razon_social character varying(200),
    condicion_iva character varying(100),
    ingresos_brutos character varying(50),
    inicio_actividades date,
    localidad character varying(100)
);


ALTER TABLE public.configuracion_empresa OWNER TO postgres;

--
-- Name: configuracion_empresa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.configuracion_empresa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_empresa_id_seq OWNER TO postgres;

--
-- Name: configuracion_empresa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.configuracion_empresa_id_seq OWNED BY public.configuracion_empresa.id;


--
-- Name: cuenta_corriente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuenta_corriente (
    id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    entidad_id integer NOT NULL,
    compra_id integer,
    venta_id integer,
    pago_id integer,
    cobro_id integer,
    debe numeric(12,2) DEFAULT 0,
    haber numeric(12,2) DEFAULT 0,
    saldo numeric(12,2) DEFAULT 0,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    descripcion character varying(200),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento timestamp without time zone,
    medio_pago character varying(50)
);


ALTER TABLE public.cuenta_corriente OWNER TO postgres;

--
-- Name: cuenta_corriente_cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuenta_corriente_cliente (
    id integer NOT NULL,
    cliente_id integer,
    fecha date NOT NULL,
    tipo_movimiento character varying(20) NOT NULL,
    documento_id integer,
    descripcion character varying(200),
    debe numeric(10,2) DEFAULT 0 NOT NULL,
    haber numeric(10,2) DEFAULT 0 NOT NULL,
    saldo numeric(10,2) DEFAULT 0 NOT NULL,
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cuenta_corriente_cliente OWNER TO postgres;

--
-- Name: cuenta_corriente_cliente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuenta_corriente_cliente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuenta_corriente_cliente_id_seq OWNER TO postgres;

--
-- Name: cuenta_corriente_cliente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuenta_corriente_cliente_id_seq OWNED BY public.cuenta_corriente_cliente.id;


--
-- Name: cuenta_corriente_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuenta_corriente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuenta_corriente_id_seq OWNER TO postgres;

--
-- Name: cuenta_corriente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuenta_corriente_id_seq OWNED BY public.cuenta_corriente.id;


--
-- Name: cuenta_corriente_proveedor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cuenta_corriente_proveedor (
    id integer NOT NULL,
    proveedor_id integer,
    fecha date NOT NULL,
    tipo_movimiento character varying(20) NOT NULL,
    documento_id integer,
    descripcion character varying(200),
    debe numeric(10,2) DEFAULT 0 NOT NULL,
    haber numeric(10,2) DEFAULT 0 NOT NULL,
    saldo numeric(10,2) DEFAULT 0 NOT NULL,
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cuenta_corriente_proveedor OWNER TO postgres;

--
-- Name: cuenta_corriente_proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cuenta_corriente_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cuenta_corriente_proveedor_id_seq OWNER TO postgres;

--
-- Name: cuenta_corriente_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cuenta_corriente_proveedor_id_seq OWNED BY public.cuenta_corriente_proveedor.id;


--
-- Name: detalles_lista_precios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalles_lista_precios (
    id integer NOT NULL,
    lista_precios_id integer,
    producto_id integer,
    costo_compra numeric(10,2) NOT NULL,
    margen_porcentaje numeric(5,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    unidad_venta character varying(20) NOT NULL
);


ALTER TABLE public.detalles_lista_precios OWNER TO postgres;

--
-- Name: detalles_lista_precios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalles_lista_precios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalles_lista_precios_id_seq OWNER TO postgres;

--
-- Name: detalles_lista_precios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalles_lista_precios_id_seq OWNED BY public.detalles_lista_precios.id;


--
-- Name: factura_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.factura_detalles (
    id integer NOT NULL,
    factura_id integer,
    producto_id integer,
    cantidad numeric(10,3) NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    iva_porcentaje numeric(5,2) DEFAULT 21,
    subtotal numeric(10,2) NOT NULL,
    costo_unitario numeric(12,2) DEFAULT 0
);


ALTER TABLE public.factura_detalles OWNER TO postgres;

--
-- Name: factura_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.factura_detalles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.factura_detalles_id_seq OWNER TO postgres;

--
-- Name: factura_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.factura_detalles_id_seq OWNED BY public.factura_detalles.id;


--
-- Name: facturas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.facturas (
    id integer NOT NULL,
    punto_venta integer DEFAULT 1 NOT NULL,
    numero_factura integer NOT NULL,
    tipo_comprobante character varying(20) NOT NULL,
    fecha date NOT NULL,
    cliente_id integer,
    subtotal numeric(10,2) NOT NULL,
    iva numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    medio_pago character varying(50),
    estado character varying(20) DEFAULT 'emitida'::character varying,
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    numero_interno character varying(20),
    anulado_por integer,
    fecha_anulacion timestamp without time zone,
    motivo_anulacion character varying(500),
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento timestamp without time zone,
    observaciones character varying(500)
);


ALTER TABLE public.facturas OWNER TO postgres;

--
-- Name: facturas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.facturas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.facturas_id_seq OWNER TO postgres;

--
-- Name: facturas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.facturas_id_seq OWNED BY public.facturas.id;


--
-- Name: historial_costos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_costos (
    id integer NOT NULL,
    producto_id integer,
    costo_compra numeric(10,2) NOT NULL,
    proveedor_id integer,
    fecha_desde date NOT NULL,
    fecha_hasta date,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.historial_costos OWNER TO postgres;

--
-- Name: historial_costos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_costos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_costos_id_seq OWNER TO postgres;

--
-- Name: historial_costos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_costos_id_seq OWNED BY public.historial_costos.id;


--
-- Name: historial_margenes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.historial_margenes (
    id integer NOT NULL,
    producto_id integer,
    margen_anterior numeric(5,2),
    margen_nuevo numeric(5,2),
    precio_costo_anterior numeric(10,2),
    precio_costo_nuevo numeric(10,2),
    precio_venta_anterior numeric(10,2),
    precio_venta_nuevo numeric(10,2),
    usuario_id integer,
    motivo character varying(200),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.historial_margenes OWNER TO postgres;

--
-- Name: historial_margenes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.historial_margenes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_margenes_id_seq OWNER TO postgres;

--
-- Name: historial_margenes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.historial_margenes_id_seq OWNED BY public.historial_margenes.id;


--
-- Name: listas_precios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.listas_precios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    tipo character varying(20),
    vigencia_desde date NOT NULL,
    vigencia_hasta date,
    activa boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    descripcion character varying(300),
    tipo_cliente character varying(20),
    categorias_incluidas jsonb DEFAULT '[]'::jsonb,
    CONSTRAINT listas_precios_tipo_cliente_check CHECK (((tipo_cliente)::text = ANY (ARRAY[('minorista'::character varying)::text, ('mayorista'::character varying)::text, ('todos'::character varying)::text])))
);


ALTER TABLE public.listas_precios OWNER TO postgres;

--
-- Name: listas_precios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.listas_precios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.listas_precios_id_seq OWNER TO postgres;

--
-- Name: listas_precios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.listas_precios_id_seq OWNED BY public.listas_precios.id;


--
-- Name: movimientos_caja; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_caja (
    id integer NOT NULL,
    fecha date NOT NULL,
    tipo_movimiento character varying(20) NOT NULL,
    categoria_caja_id integer,
    descripcion character varying(300),
    monto numeric(10,2) NOT NULL,
    tipo character varying(10) NOT NULL,
    proveedor_id integer,
    medio_pago character varying(50),
    comprobante_nro character varying(50),
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cliente_id integer,
    caja_id integer
);


ALTER TABLE public.movimientos_caja OWNER TO postgres;

--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_caja_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_caja_id_seq OWNER TO postgres;

--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_caja_id_seq OWNED BY public.movimientos_caja.id;


--
-- Name: nota_credito_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nota_credito_detalles (
    id integer NOT NULL,
    nota_credito_id integer,
    producto_id integer,
    cantidad numeric(10,3) NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    iva_porcentaje numeric(5,2) DEFAULT 21,
    subtotal numeric(10,2) NOT NULL
);


ALTER TABLE public.nota_credito_detalles OWNER TO postgres;

--
-- Name: nota_credito_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nota_credito_detalles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nota_credito_detalles_id_seq OWNER TO postgres;

--
-- Name: nota_credito_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nota_credito_detalles_id_seq OWNED BY public.nota_credito_detalles.id;


--
-- Name: notas_credito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notas_credito (
    id integer NOT NULL,
    factura_id integer,
    punto_venta integer DEFAULT 1 NOT NULL,
    numero_nota_credito integer NOT NULL,
    tipo_comprobante character varying(2) NOT NULL,
    fecha date NOT NULL,
    cliente_id integer,
    motivo character varying(200),
    subtotal numeric(10,2) NOT NULL,
    iva numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    medio_pago character varying(50),
    estado character varying(20) DEFAULT 'emitida'::character varying,
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notas_credito OWNER TO postgres;

--
-- Name: notas_credito_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notas_credito_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notas_credito_id_seq OWNER TO postgres;

--
-- Name: notas_credito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notas_credito_id_seq OWNED BY public.notas_credito.id;


--
-- Name: pagos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pagos (
    id integer NOT NULL,
    fecha date NOT NULL,
    cliente_id integer,
    proveedor_id integer,
    monto numeric(10,2) NOT NULL,
    medio_pago character varying(50),
    tipo character varying(20) NOT NULL,
    descripcion character varying(200),
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pagos OWNER TO postgres;

--
-- Name: pagos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pagos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pagos_id_seq OWNER TO postgres;

--
-- Name: pagos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pagos_id_seq OWNED BY public.pagos.id;


--
-- Name: pedido_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedido_detalles (
    id integer NOT NULL,
    pedido_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_costo numeric(12,2),
    subtotal numeric(12,2),
    recibido_cantidad integer DEFAULT 0,
    estado character varying(20) DEFAULT 'pendiente'::character varying
);


ALTER TABLE public.pedido_detalles OWNER TO postgres;

--
-- Name: TABLE pedido_detalles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pedido_detalles IS 'Detalle de productos en cada pedido';


--
-- Name: pedido_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedido_detalles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedido_detalles_id_seq OWNER TO postgres;

--
-- Name: pedido_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedido_detalles_id_seq OWNED BY public.pedido_detalles.id;


--
-- Name: pedidos_proveedor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos_proveedor (
    id integer NOT NULL,
    numero_interno character varying(20) NOT NULL,
    fecha_pedido date DEFAULT CURRENT_DATE,
    proveedor_id integer,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    total_estimado numeric(12,2) DEFAULT 0,
    observaciones text,
    usuario_id integer,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    recibido_en timestamp without time zone,
    fecha_entrega_estimada date
);


ALTER TABLE public.pedidos_proveedor OWNER TO postgres;

--
-- Name: TABLE pedidos_proveedor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pedidos_proveedor IS 'Pedidos/solicitudes a proveedores (no registra deuda)';


--
-- Name: pedidos_proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_proveedor_id_seq OWNER TO postgres;

--
-- Name: pedidos_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_proveedor_id_seq OWNED BY public.pedidos_proveedor.id;


--
-- Name: producto_proveedor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.producto_proveedor (
    id integer NOT NULL,
    producto_id integer,
    proveedor_id integer,
    es_principal boolean DEFAULT false,
    costo_compra numeric(10,2),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.producto_proveedor OWNER TO postgres;

--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.producto_proveedor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.producto_proveedor_id_seq OWNER TO postgres;

--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.producto_proveedor_id_seq OWNED BY public.producto_proveedor.id;


--
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    sku character varying(50),
    nombre character varying(200) NOT NULL,
    categoria_id integer,
    proveedor_id integer,
    unidad_medida character varying(20) NOT NULL,
    stock_actual numeric(10,3) DEFAULT 0,
    stock_minimo numeric(10,3) DEFAULT 0,
    activo boolean DEFAULT true,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    actualizado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    costo_promedio numeric DEFAULT 0,
    precio_venta numeric DEFAULT 0,
    precio_costo numeric DEFAULT 0,
    iva_compra boolean DEFAULT false,
    iva_venta boolean DEFAULT false,
    margen_personalizado numeric(5,2),
    margen_personalizado_mayorista numeric(5,2),
    precio_venta_mayorista numeric(10,2) DEFAULT 0
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    contacto character varying(100),
    telefono character varying(20),
    email character varying(100),
    website character varying(200),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cuit character varying(20),
    condicion_iva character varying(100),
    ingresos_brutos character varying(50),
    localidad character varying(100),
    CONSTRAINT chk_cuit_formato CHECK (((cuit IS NULL) OR ((cuit)::text = ''::text) OR ((cuit)::text ~ '^\d{2}-\d{8}-\d{1}$'::text) OR ((cuit)::text ~ '^\d{11}$'::text)))
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_seq OWNER TO postgres;

--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: recibo_imputaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recibo_imputaciones (
    id integer NOT NULL,
    recibo_id integer,
    venta_id integer,
    compra_id integer,
    monto_imputado numeric(12,2) NOT NULL
);


ALTER TABLE public.recibo_imputaciones OWNER TO postgres;

--
-- Name: recibo_imputaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.recibo_imputaciones ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.recibo_imputaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: recibos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recibos (
    id integer NOT NULL,
    numero_interno character varying(20),
    tipo character varying(20) NOT NULL,
    cliente_id integer,
    proveedor_id integer,
    fecha date NOT NULL,
    monto numeric(12,2) NOT NULL,
    medio_pago character varying(50),
    estado character varying(20) DEFAULT 'registrado'::character varying,
    observaciones character varying(500),
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_id integer,
    anulado_por integer,
    fecha_anulacion timestamp without time zone,
    motivo_anulacion character varying(500)
);


ALTER TABLE public.recibos OWNER TO postgres;

--
-- Name: recibos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.recibos ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.recibos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion character varying(200),
    permisos jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    email character varying(100),
    nombre_completo character varying(200),
    rol_id integer,
    activo boolean DEFAULT true,
    ultimo_acceso timestamp without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: caja_dia id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja_dia ALTER COLUMN id SET DEFAULT nextval('public.caja_dia_id_seq'::regclass);


--
-- Name: categoria_caja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_caja ALTER COLUMN id SET DEFAULT nextval('public.categoria_caja_id_seq'::regclass);


--
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- Name: categorias_caja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_caja ALTER COLUMN id SET DEFAULT nextval('public.categorias_caja_id_seq'::regclass);


--
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- Name: compra_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra_detalles ALTER COLUMN id SET DEFAULT nextval('public.compra_detalles_id_seq'::regclass);


--
-- Name: compras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras ALTER COLUMN id SET DEFAULT nextval('public.compras_id_seq'::regclass);


--
-- Name: configuracion_empresa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_empresa ALTER COLUMN id SET DEFAULT nextval('public.configuracion_empresa_id_seq'::regclass);


--
-- Name: cuenta_corriente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente ALTER COLUMN id SET DEFAULT nextval('public.cuenta_corriente_id_seq'::regclass);


--
-- Name: cuenta_corriente_cliente id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_cliente ALTER COLUMN id SET DEFAULT nextval('public.cuenta_corriente_cliente_id_seq'::regclass);


--
-- Name: cuenta_corriente_proveedor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_proveedor ALTER COLUMN id SET DEFAULT nextval('public.cuenta_corriente_proveedor_id_seq'::regclass);


--
-- Name: detalles_lista_precios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_lista_precios ALTER COLUMN id SET DEFAULT nextval('public.detalles_lista_precios_id_seq'::regclass);


--
-- Name: factura_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles ALTER COLUMN id SET DEFAULT nextval('public.factura_detalles_id_seq'::regclass);


--
-- Name: facturas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas ALTER COLUMN id SET DEFAULT nextval('public.facturas_id_seq'::regclass);


--
-- Name: historial_costos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_costos ALTER COLUMN id SET DEFAULT nextval('public.historial_costos_id_seq'::regclass);


--
-- Name: historial_margenes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_margenes ALTER COLUMN id SET DEFAULT nextval('public.historial_margenes_id_seq'::regclass);


--
-- Name: listas_precios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listas_precios ALTER COLUMN id SET DEFAULT nextval('public.listas_precios_id_seq'::regclass);


--
-- Name: movimientos_caja id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja ALTER COLUMN id SET DEFAULT nextval('public.movimientos_caja_id_seq'::regclass);


--
-- Name: nota_credito_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_credito_detalles ALTER COLUMN id SET DEFAULT nextval('public.nota_credito_detalles_id_seq'::regclass);


--
-- Name: notas_credito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas_credito ALTER COLUMN id SET DEFAULT nextval('public.notas_credito_id_seq'::regclass);


--
-- Name: pagos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos ALTER COLUMN id SET DEFAULT nextval('public.pagos_id_seq'::regclass);


--
-- Name: pedido_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_detalles ALTER COLUMN id SET DEFAULT nextval('public.pedido_detalles_id_seq'::regclass);


--
-- Name: pedidos_proveedor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_proveedor ALTER COLUMN id SET DEFAULT nextval('public.pedidos_proveedor_id_seq'::regclass);


--
-- Name: producto_proveedor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_proveedor ALTER COLUMN id SET DEFAULT nextval('public.producto_proveedor_id_seq'::regclass);


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Data for Name: caja_dia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.caja_dia (id, fecha, saldo_inicial, saldo_final, estado, usuario_id, fecha_apertura, fecha_cierre, observaciones_cierre, creado_en) FROM stdin;
1	2026-02-27	5000.00	5000.00	cerrado	\N	2026-02-28 01:56:46.765086	2026-02-28 01:59:33.022884	 | Diferencia: $0.00	2026-02-27 22:53:49.728522
2	2026-02-28	20000.00	12500.00	cerrado	\N	2026-02-28 14:21:26.100724	2026-02-28 14:30:14.219621	 | Diferencia: $0.00	2026-02-28 07:39:06.44628
4	2026-02-28	10000.00	11000.00	cerrado	\N	2026-02-28 11:32:12.978062	2026-02-28 14:35:47.267602	 | Diferencia: $0.00	2026-02-28 11:32:12.978062
5	2026-02-28	15000.00	10000.00	cerrado	\N	2026-02-28 14:35:59.000005	2026-02-28 14:37:09.715659	 | Diferencia: $0.00	2026-02-28 11:35:58.998349
6	2026-02-28	21000.00	21000.00	cerrado	\N	2026-02-28 14:50:52.872151	2026-02-28 15:02:48.761454	 | Diferencia: $0.00	2026-02-28 11:50:52.869399
7	2026-02-28	20000.00	20000.00	cerrado	\N	2026-02-28 15:45:29.498544	2026-02-28 19:57:54.424963	 | Diferencia: $0.00	2026-02-28 12:45:29.496796
8	2026-02-28	20000.00	31399.00	cerrado	\N	2026-02-28 19:58:06.269426	2026-03-01 00:16:40.910884	 | Diferencia: $0.00	2026-02-28 16:58:06.268651
12	2026-03-04	18990.00	48990.00	cerrado	\N	2026-03-05 00:32:55.774725	2026-03-05 01:17:03.494496	 | Diferencia: $0.00	2026-03-04 21:32:55.77213
11	2026-03-02	50000.00	292615.00	cerrado	\N	2026-03-02 10:51:10.497101	2026-03-05 01:43:44.467144	Cierre manual de emergencia | Saldo teórico: $292615.00	2026-03-02 07:51:10.494328
10	2026-03-01	50000.00	166908.00	cerrado	\N	2026-03-01 03:18:42.997552	2026-03-05 01:43:48.381194	Cierre manual de emergencia | Saldo teórico: $166908.00	2026-03-01 00:18:42.994368
9	2026-02-28	30000.00	36599.00	cerrado	\N	2026-03-01 00:20:54.109119	2026-03-05 01:43:50.939504	Cierre manual de emergencia | Saldo teórico: $36599.00	2026-02-28 21:20:54.108294
13	2026-03-04	5000.00	5000.00	cerrado	\N	2026-03-05 01:44:51.408198	2026-03-06 12:35:55.897183	Cierre manual de emergencia | Saldo teórico: $5000.00	2026-03-04 22:44:51.407127
14	2026-03-05	2500.00	77995.00	cerrado	\N	2026-03-05 11:03:48.057492	2026-03-06 12:35:59.238128	Cierre manual de emergencia | Saldo teórico: $77995.00	2026-03-05 08:03:48.053436
15	2026-03-06	50000.00	107978.00	cerrado	\N	2026-03-06 12:36:20.057142	2026-03-06 15:44:31.516173	 | Diferencia: $0.00	2026-03-06 09:36:20.056148
\.


--
-- Data for Name: cajas_dia; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cajas_dia (id, numero_interno, fecha_apertura, fecha_cierre, saldo_inicial, saldo_final, estado, usuario_apertura_id, usuario_cierre_id, observaciones_cierre, creado_en) FROM stdin;
\.


--
-- Data for Name: categoria_caja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categoria_caja (id, nombre, descripcion, tipo, activo, creado_en) FROM stdin;
1	Venta Mercadería	Ingresos por ventas	ingreso	t	2026-02-20 21:38:13.465739
2	Compra Mercadería	Egresos por compras	egreso	t	2026-02-20 21:38:13.465739
3	Gastos Generales	Gastos operativos	egreso	t	2026-02-20 21:38:13.465739
4	Impuestos	Pagos de impuestos	egreso	t	2026-02-20 21:38:13.465739
5	Servicios	Luz, agua, internet	egreso	t	2026-02-20 21:38:13.465739
6	Alquiler	Alquiler del local	egreso	t	2026-02-20 21:38:13.465739
7	Extracciones	Retiros del dueño/socio	egreso	t	2026-02-20 21:38:13.465739
\.


--
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre, margen_default_minorista, margen_default_mayorista, creado_en, descripcion, activo) FROM stdin;
2	Cereales	25.00	20.00	2026-02-20 21:34:15.558804	Cereales para Desayuno	t
3	Legumbres	25.00	20.00	2026-02-20 21:34:15.558804	Legumbres secas	t
4	Frutos Secos	30.00	25.00	2026-02-20 21:34:15.558804	Frutos secos y Mix	t
5	Especias	35.00	30.00	2026-02-20 21:34:15.558804	Especias y condimentos	t
6	Suplementos	30.00	25.00	2026-02-20 21:34:15.558804	Suplementos dietarios	t
7	Aceites	25.00	20.00	2026-02-20 21:34:15.558804	Aceites y Esencias	t
8	Harinas	20.00	15.00	2026-02-20 21:34:15.558804	Harinas y Harinas integrales	t
9	Otros	25.00	20.00	2026-02-20 21:34:15.558804	Otros productos	t
19	Hierbas Medicinales	120.00	110.00	2026-02-20 22:09:39.379113	\N	t
1	Semillas	50.00	25.00	2026-02-20 21:34:15.558804	Semillas de consumo	t
\.


--
-- Data for Name: categorias_caja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias_caja (id, nombre, tipo, subcategoria) FROM stdin;
1	Venta Minorista	ingreso	ventas
2	Venta Mayorista	ingreso	ventas
3	Compra Mercadería	egreso	compras
4	Alquiler	egreso	fijos
5	Luz	egreso	servicios
6	Impuestos	egreso	impuestos
7	Insumos	egreso	insumos
8	Otros Gastos	egreso	varios
10	Venta Minorista - Transferencia	ingreso	transferencia
11	Cobro Cta. Cte.	ingreso	cta_cte
12	Pago Proveedor	egreso	proveedor
15	Servicios	egreso	servicios
17	Reparaciones	egreso	mantenimiento
18	Retiro Personal	egreso	personal
19	Devolución de Ventas	egreso	\N
20	Venta de Mercadería	ingreso	ventas
\.


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, nombre, cuit, email, telefono, direccion, ciudad, codigo_postal, condicion_iva, activo, creado_en, tipo_cliente, ingresos_brutos, localidad) FROM stdin;
1	Juan	\N	juan@email.com	123456789	Calle Falsa 123	Córdoba	5000	Responsable Inscripto	t	2026-02-18 20:40:57.804203	mayorista	\N	\N
3	Walter	\N	waltercamino@hotmail.com	03525308250	Jesus Maria	Jesús María		Monotributista	t	2026-02-20 08:29:18.957751	minorista	\N	\N
5	Nuevo cliente	\N						Consumidor Final	t	2026-02-27 19:48:33.427423	minorista	\N	\N
6	Cliente con el nuevo modal	\N	waltercamino@hotmail.com	3512740236			5220	monotributista	f	2026-03-01 11:31:12.155225	mayorista	\N	\N
7	prueba de dar de baja con fc emitida	\N	cliente@gmail.com	325100013º	\N	\N	\N	consumidor_final	f	2026-03-01 11:52:39.663285	minorista	\N	\N
8	Nuevo Cliente Modal	\N	cliente@gmail	23223322	\N	\N	\N	monotributista	t	2026-03-01 12:55:24.525742	mayorista	\N	\N
9	nuevo cliente para validar	\N		22565822	calle cespedes	Jusus MAria	5220	consumidor_final	t	2026-03-01 15:18:10.167054	minorista	\N	\N
10	PRUEBA FORMATO CON CUIT	20-12345678-9		445545454	Jesus Maria	Jesús María	5220	consumidor_final	t	2026-03-02 07:58:52.571545	minorista	\N	\N
2	walter	\N	waltercamino@hotmail.com	3525308250	Jesus Maria	Jesús María		consumidor final	f	2026-02-20 08:26:07.82508	minorista	\N	\N
4	Lo de Juana	\N		3525481213				monotributista	t	2026-02-23 16:01:04.892815	mayorista	\N	\N
\.


--
-- Data for Name: compra_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compra_detalles (id, compra_id, producto_id, cantidad, costo_unitario, subtotal, costo_anterior) FROM stdin;
1	4	1	100.000	50.00	5000.00	\N
2	5	2	10.000	1500.00	15000.00	\N
3	6	3	5.000	25.00	125.00	\N
4	7	3	15.000	15000.00	225000.00	\N
5	8	3	10.000	15000.00	150000.00	\N
6	9	2	10.000	1599.00	15990.00	\N
7	9	3	1.000	16000.00	16000.00	\N
8	10	2	5.000	25000.00	125000.00	\N
9	11	2	15.000	25000.00	375000.00	\N
10	12	2	10.000	25000.00	250000.00	\N
11	13	3	25.000	23000.00	575000.00	\N
12	14	3	15.000	25000.00	375000.00	\N
14	15	3	1.000	25000.00	25000.00	\N
16	20	3	5.000	18000.00	90000.00	17000.00
17	23	1	1.000	8000.00	8000.00	15000.00
18	24	1	10.000	100.00	1000.00	8000.00
19	25	2	10.000	8500.00	85000.00	25000.00
20	26	2	5.000	8000.00	40000.00	8500.00
21	27	2	1.000	8000.00	8000.00	8000.00
22	28	2	10.000	8000.00	80000.00	8000.00
23	29	2	10.000	8000.00	80000.00	8000.00
24	30	2	1.000	9000.00	9000.00	8000.00
25	31	2	10.000	9000.00	90000.00	8000.00
26	32	2	100.000	9000.00	900000.00	9000.00
27	33	2	10.000	9000.00	90000.00	9000.00
28	34	2	10.000	9000.00	90000.00	9000.00
29	35	2	5.000	9000.00	45000.00	9000.00
30	36	3	9.000	15000.00	135000.00	17000.00
31	37	2	10.000	9000.00	90000.00	9000.00
32	38	2	5.000	9000.00	45000.00	9000.00
33	39	1	1.000	16000.00	16000.00	15000.00
34	40	3	10.000	15000.00	150000.00	15000.00
35	42	2	1.000	9000.00	9000.00	9000.00
36	43	4	1.000	1500.00	1500.00	1500.00
37	44	3	1.000	1500.00	1500.00	15000.00
38	45	1	1.000	16000.00	16000.00	16000.00
39	46	2	1.000	9000.00	9000.00	9000.00
40	47	2	1.000	1000.00	1000.00	9000.00
41	48	2	2.000	5000.00	10000.00	1000.00
42	49	2	1.000	10000.00	10000.00	5000.00
43	50	1	9.000	16000.00	144000.00	16000.00
44	51	6	1.000	1500.00	1500.00	1500.00
45	52	6	1.000	1500.00	1500.00	1500.00
46	53	6	10.000	1500.00	15000.00	1500.00
47	54	2	1.000	10000.00	10000.00	10000.00
48	55	6	1.000	5000.00	5000.00	1800.00
49	56	8	1.000	3500.00	3500.00	6000.00
50	57	8	1.000	3500.00	3500.00	7500.00
51	58	8	1.000	10000.00	10000.00	3500.00
52	59	8	1.000	7000.00	7000.00	3500.00
53	60	8	1.000	3500.00	3500.00	7000.00
54	61	8	1.000	3500.00	3500.00	3500.00
55	62	8	1.000	5500.00	5500.00	3500.00
\.


--
-- Data for Name: compras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.compras (id, fecha, proveedor_id, numero_remision, numero_factura, subtotal, iva, total, medio_pago, estado, usuario_id, creado_en, iva_total, con_iva, numero_interno, fecha_vencimiento, anulado_por, fecha_anulacion, motivo_anulacion, actualizado_en, observaciones) FROM stdin;
4	2025-02-18	1	REM-001	0001-00000123	5000.00	1050.00	6050.00	transferencia	registrada	\N	2026-02-18 20:19:59.609743	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
5	2026-02-20	2	\N	1-4	15000.00	3150.00	18150.00	efectivo	registrada	\N	2026-02-20 19:31:15.879987	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
6	2026-02-21	2	\N	1-5	125.00	26.25	151.25	efectivo	registrada	\N	2026-02-21 09:33:38.845326	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
7	2026-02-21	3	\N	15912	225000.00	47250.00	272250.00	efectivo	registrada	\N	2026-02-21 11:53:20.296964	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
8	2026-02-21	1	\N	10-10000	150000.00	31500.00	181500.00	efectivo	registrada	\N	2026-02-21 11:56:13.269295	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
10	2026-02-22	2	\N	2-15	125000.00	0.00	125000.00	cuenta_corriente	anulada	\N	2026-02-22 09:34:24.865857	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
9	2026-02-22	1	\N	1-24	31990.00	0.00	31990.00	efectivo	anulada	\N	2026-02-22 09:29:14.70238	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
11	2026-02-22	2	\N	1-26	375000.00	0.00	375000.00	efectivo	anulada	\N	2026-02-22 09:39:46.709305	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
12	2026-02-22	1	\N	1-15	250000.00	0.00	250000.00	efectivo	registrada	\N	2026-02-22 10:09:32.82617	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
13	2026-02-22	3	\N	2-2	575000.00	0.00	575000.00	tarjeta	anulada	\N	2026-02-22 10:13:15.839058	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
14	2026-02-22	1	\N	2-2	375000.00	0.00	375000.00	efectivo	anulada	\N	2026-02-22 10:20:22.196582	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
48	2026-03-01	2	\N	3-2	10000.00	0.00	10000.00	transferencia	registrada	\N	2026-03-01 11:37:53.337445	0	f	FC-0048	2026-02-27 00:00:00	\N	\N	\N	2026-03-01 11:37:53.337445	\N
15	2026-02-22	1	\N	5-5	25000.00	0.00	25000.00	transferencia	anulada	\N	2026-02-22 10:24:28.648961	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
49	2026-03-01	5	\N	5-250	10000.00	0.00	10000.00	cta_cte	registrada	\N	2026-03-01 12:58:31.04703	0	f	FC-0049	2026-02-27 00:00:00	\N	\N	\N	2026-03-01 12:58:31.04703	\N
20	2026-02-22	3	\N	1-1	90000.00	0.00	90000.00	transferencia	anulada	\N	2026-02-22 11:23:12.273069	0	f	\N	\N	\N	\N	\N	2026-02-22 15:22:33.702831	\N
24	2026-02-22	1	\N	TEST-001	1000.00	0.00	1000.00	efectivo	registrada	\N	2026-02-22 16:03:18.103696	0	f	FC-0024	\N	\N	\N	\N	2026-02-22 16:03:18.103696	\N
25	2026-02-22	1	\N	2-20	85000.00	0.00	85000.00	transferencia	registrada	\N	2026-02-22 16:07:46.271557	0	f	FC-0025	2026-02-22 00:00:00	\N	\N	\N	2026-02-22 16:07:46.271557	\N
26	2026-02-22	1	\N	1-25	40000.00	0.00	40000.00	transferencia	registrada	\N	2026-02-22 16:39:32.640053	0	f	FC-0026	2026-02-22 00:00:00	\N	\N	\N	2026-02-22 16:39:32.640053	\N
28	2026-02-23	2	\N	1-12	80000.00	0.00	80000.00	cta_cte	registrada	\N	2026-02-23 15:45:00.337123	0	f	FC-0028	2026-02-23 00:00:00	\N	\N	\N	2026-02-23 15:45:00.337123	\N
30	2026-02-26	1	\N	2-5	9000.00	0.00	9000.00	transferencia	registrada	\N	2026-02-26 12:32:47.369559	0	f	FC-0030	2026-02-26 00:00:00	\N	\N	\N	2026-02-26 12:32:47.369559	\N
29	2026-02-26	1	\N	1-2	80000.00	0.00	80000.00	cta_cte	anulada	\N	2026-02-26 10:57:58.175687	0	f	FC-0029	2026-02-26 00:00:00	\N	2026-02-26 15:48:33.286824	adad	2026-02-26 15:48:33.286846	\N
23	2026-02-22	1	\N	25-29	8000.00	0.00	8000.00	cta_cte	anulada	\N	2026-02-22 15:50:49.428712	0	f	FC-0021	2026-02-25 00:00:00	\N	2026-02-26 15:49:30.075755	dqd	2026-02-26 15:49:30.075771	\N
27	2026-02-23	1	\N	5-10	8000.00	0.00	8000.00	cta_cte	anulada	\N	2026-02-23 00:59:48.915363	0	f	FC-0027	2026-02-23 00:00:00	\N	2026-02-26 15:51:18.012683	sss	2026-02-26 15:51:18.012698	\N
31	2026-02-26	1	\N	2-25	90000.00	0.00	90000.00	transferencia	registrada	\N	2026-02-26 17:04:40.014546	0	f	FC-0031	2026-02-26 00:00:00	\N	\N	\N	2026-02-26 17:04:40.014546	\N
32	2026-02-26	2	\N	2-56	900000.00	0.00	900000.00	cta_cte	anulada	\N	2026-02-26 17:06:28.399335	0	f	FC-0032	2026-02-25 00:00:00	\N	2026-02-26 20:06:49.317038	sas	2026-02-26 20:06:49.317065	\N
33	2026-02-26	1	\N	2-165	90000.00	0.00	90000.00	cta_cte	registrada	\N	2026-02-26 18:06:03.729936	0	f	FC-0033	\N	\N	\N	\N	2026-02-26 18:06:03.729936	\N
34	2026-02-27	2	\N	2-44	90000.00	0.00	90000.00	cta_cte	registrada	\N	2026-02-27 09:03:49.873881	0	f	FC-0034	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 09:03:49.873881	\N
35	2026-02-27	2	\N	2-33	45000.00	0.00	45000.00	transferencia	registrada	\N	2026-02-27 16:28:14.898998	0	f	FC-0035	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 16:28:14.898998	devoluc
36	2026-02-27	3	\N	12-22	135000.00	0.00	135000.00	transferencia	registrada	\N	2026-02-27 16:49:02.220654	0	f	FC-0036	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 16:49:02.220654	sss
37	2026-02-27	1	\N	1-500	90000.00	0.00	90000.00	cta_cte	registrada	\N	2026-02-27 16:57:28.821589	0	f	FC-0037	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 16:57:28.821589	\N
38	2026-02-27	1	\N	2-500	45000.00	0.00	45000.00	transferencia	registrada	\N	2026-02-27 17:02:43.609044	0	f	FC-0038	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 17:02:43.609044	devolucion parcial
39	2026-02-27	1	\N	2-89	16000.00	0.00	16000.00	cta_cte	registrada	\N	2026-02-27 17:18:51.20616	0	f	FC-0039	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 17:18:51.20616	\N
40	2026-02-27	3	\N	2-125	150000.00	0.00	150000.00	transferencia	registrada	\N	2026-02-27 20:04:13.204457	0	f	FC-0040	2026-02-27 00:00:00	\N	\N	\N	2026-02-27 20:04:13.204457	\N
42	2026-02-28	2	\N	2-23	9000.00	0.00	9000.00	efectivo	registrada	\N	2026-02-28 17:40:17.858427	0	f	FC-0041	2026-02-28 00:00:00	\N	\N	\N	2026-02-28 17:40:17.858427	\N
43	2026-02-28	1	\N	3-25	1500.00	0.00	1500.00	transferencia	registrada	\N	2026-02-28 17:40:56.999825	0	f	FC-0043	2026-02-28 00:00:00	\N	\N	\N	2026-02-28 17:40:56.999825	\N
44	2026-02-28	3	\N	1-26	1500.00	0.00	1500.00	cheque	registrada	\N	2026-02-28 17:42:28.370438	0	f	FC-0044	2026-02-28 00:00:00	\N	\N	\N	2026-02-28 17:42:28.370438	\N
45	2026-02-28	2	\N	2-999	16000.00	0.00	16000.00	cta_cte	registrada	\N	2026-02-28 17:43:16.437517	0	f	FC-0045	\N	\N	\N	\N	2026-02-28 17:43:16.437517	\N
46	2026-03-01	1	\N	3-155	9000.00	0.00	9000.00	efectivo	registrada	\N	2026-02-28 23:17:31.911888	0	f	FC-0046	2026-02-28 00:00:00	\N	\N	\N	2026-02-28 23:17:31.911888	\N
47	2026-03-01	1	\N	2-155	1000.00	0.00	1000.00	efectivo	registrada	\N	2026-02-28 23:30:39.029302	0	f	FC-0047	2026-02-28 00:00:00	\N	\N	\N	2026-02-28 23:30:39.029302	\N
50	2026-03-01	1	\N	2-8000	144000.00	0.00	144000.00	cta_cte	registrada	\N	2026-03-01 20:06:04.191028	0	f	FC-0050	2026-03-01 00:00:00	\N	\N	\N	2026-03-01 20:06:04.191028	\N
51	2026-03-01	11	\N	123-12312312	1500.00	0.00	1500.00	transferencia	registrada	\N	2026-03-05 16:15:24.995362	0	f	FC-0051	\N	\N	\N	\N	2026-03-05 16:15:24.995362	\N
52	2026-03-01	11	\N	1222-1212121	1500.00	0.00	1500.00	transferencia	registrada	\N	2026-03-05 16:43:31.572004	0	f	FC-0052	\N	\N	\N	\N	2026-03-05 16:43:31.572004	\N
53	2026-03-04	11	\N	3-2564	15000.00	0.00	15000.00	cta_cte	registrada	\N	2026-03-05 16:47:53.256197	0	f	FC-0053	\N	\N	\N	\N	2026-03-05 16:47:53.256197	\N
54	2026-03-01	2	\N	2-2585	10000.00	0.00	10000.00	cta_cte	registrada	\N	2026-03-06 09:37:08.706878	0	f	FC-0054	\N	\N	\N	\N	2026-03-06 09:37:08.706878	\N
55	2026-03-06	2	\N	2-1265	5000.00	0.00	5000.00	transferencia	registrada	\N	2026-03-06 10:55:53.767139	0	f	FC-0055	\N	\N	\N	\N	2026-03-06 10:55:53.767139	\N
56	2026-03-06	2	\N	2333-5555	3500.00	0.00	3500.00	transferencia	registrada	\N	2026-03-06 10:59:27.487037	0	f	FC-0056	\N	\N	\N	\N	2026-03-06 10:59:27.487037	\N
57	2026-03-02	1	\N	25-333	3500.00	0.00	3500.00	transferencia	registrada	\N	2026-03-06 11:03:35.451052	0	f	FC-0057	\N	\N	\N	\N	2026-03-06 11:03:35.451052	\N
58	2026-03-05	1	\N	25-99992	10000.00	0.00	10000.00	transferencia	registrada	\N	2026-03-06 11:04:22.490238	0	f	FC-0058	\N	\N	\N	\N	2026-03-06 11:04:22.490238	\N
59	2026-03-05	2	\N	1-2225456	7000.00	0.00	7000.00	transferencia	registrada	\N	2026-03-06 11:07:04.830798	0	f	FC-0059	\N	\N	\N	\N	2026-03-06 11:07:04.830798	\N
60	2026-03-06	2	\N	1-2666	3500.00	0.00	3500.00	transferencia	registrada	\N	2026-03-06 11:10:32.3688	0	f	FC-0060	\N	\N	\N	\N	2026-03-06 11:10:32.3688	\N
61	2026-03-04	2	\N	9-999	3500.00	0.00	3500.00	transferencia	registrada	\N	2026-03-06 11:27:49.100758	0	f	FC-0061	\N	\N	\N	\N	2026-03-06 11:27:49.100758	\N
62	2026-03-06	1	\N	2-2323232	5500.00	0.00	5500.00	transferencia	registrada	\N	2026-03-06 12:42:27.887008	0	f	FC-0062	\N	\N	\N	\N	2026-03-06 12:42:27.887008	\N
\.


--
-- Data for Name: configuracion_empresa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracion_empresa (id, nombre_empresa, cuit, direccion, telefono, email, logo_url, pie_factura, creado_en, actualizado_en, razon_social, condicion_iva, ingresos_brutos, inicio_actividades, localidad) FROM stdin;
1	AYMARA Productos Naturales	20-12341678-9	Av. Miguel Juarez 506	3512740236	waltercamino@hotmail.com	/uploads/logo_empresa.png	Comprobante no Valido como Factura	2026-03-01 21:34:56.230131	2026-03-03 19:22:09.316987	Walter Daniel Camino	Monotributista	Exento	2002-01-30	Jesús María
\.


--
-- Data for Name: cuenta_corriente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuenta_corriente (id, tipo, entidad_id, compra_id, venta_id, pago_id, cobro_id, debe, haber, saldo, fecha, descripcion, creado_en, fecha_vencimiento, medio_pago) FROM stdin;
1	proveedor	2	10	\N	\N	\N	125000.00	0.00	125000.00	2026-02-22 00:00:00	Compra - Factura 2-15	2026-02-22 09:34:24.865857	\N	\N
2	proveedor	1	23	\N	\N	\N	8000.00	0.00	8000.00	2026-02-22 00:00:00	FC 25-29 - Cuenta Corriente	2026-02-22 15:50:49.428712	2026-02-25 00:00:00	cta_cte
3	proveedor	1	24	\N	\N	\N	1000.00	1000.00	0.00	2026-02-22 00:00:00	FC TEST-001 - efectivo	2026-02-22 16:03:18.103696	\N	efectivo
4	proveedor	1	25	\N	\N	\N	85000.00	85000.00	0.00	2026-02-22 00:00:00	FC 2-20 - transferencia	2026-02-22 16:07:46.271557	\N	transferencia
5	proveedor	1	26	\N	\N	\N	40000.00	40000.00	0.00	2026-02-22 00:00:00	FC 1-25 - transferencia	2026-02-22 16:39:32.640053	\N	transferencia
7	cliente	1	\N	8	\N	\N	99990.00	99990.00	0.00	2026-02-22 23:43:39.651165	FC 1-00000005 - transferencia	2026-02-22 20:43:39.624065	\N	transferencia
8	cliente	3	\N	9	\N	\N	134990.00	0.00	134990.00	2026-02-22 23:45:55.132329	FC 1-00000006 - cta_cte	2026-02-22 20:45:55.105471	2026-02-23 00:00:00	cta_cte
9	cliente	1	\N	10	\N	\N	10099.00	10099.00	0.00	2026-02-22 23:47:56.471041	FC 1-00000010 - transferencia	2026-02-22 20:47:56.440809	\N	transferencia
10	cliente	1	\N	11	\N	\N	9999.00	9999.00	0.00	2026-02-23 00:10:12.21845	FC 1-00000011 - transferencia	2026-02-22 21:10:12.187881	\N	transferencia
11	cliente	3	\N	12	\N	\N	15000.00	15000.00	0.00	2026-02-23 00:12:18.226179	FC 1-00000012 - efectivo	2026-02-22 21:12:18.214505	\N	efectivo
12	cliente	3	\N	13	\N	\N	11999.00	11999.00	0.00	2026-02-23 00:20:18.514833	FC 2-00000001 - transferencia	2026-02-22 21:20:18.503921	\N	transferencia
13	cliente	3	\N	14	\N	\N	11999.00	0.00	11999.00	2026-02-23 00:55:17.41905	FC 1-00000004 - cta_cte	2026-02-22 21:55:17.393902	\N	cta_cte
14	cliente	3	\N	\N	\N	3	0.00	11999.00	-11999.00	2026-02-23 00:00:00	Recibo R-0001 - efectivo	2026-02-23 00:41:59.629961	\N	efectivo
15	cliente	3	\N	\N	\N	3	0.00	88001.00	-88001.00	2026-02-23 00:00:00	Recibo R-0001 - efectivo	2026-02-23 00:41:59.629961	\N	efectivo
16	proveedor	1	\N	\N	4	\N	0.00	4000.00	-4000.00	2026-02-23 00:00:00	Recibo R-0004 - efectivo	2026-02-23 00:58:44.07265	\N	efectivo
17	proveedor	1	27	\N	\N	\N	8000.00	0.00	8000.00	2026-02-23 00:00:00	FC 5-10 - Cuenta Corriente	2026-02-23 00:59:48.915363	2026-02-23 00:00:00	cta_cte
18	proveedor	1	\N	\N	5	\N	0.00	12000.00	-12000.00	2026-02-23 00:00:00	Recibo R-0005 - Saldo a favor - efectivo	2026-02-23 10:41:32.425589	\N	efectivo
19	cliente	3	\N	\N	\N	6	0.00	40000.00	-40000.00	2026-02-23 00:00:00	Recibo R-0006 - Saldo a favor - efectivo	2026-02-23 10:44:22.542325	\N	efectivo
20	cliente	3	\N	\N	\N	7	0.00	10000.00	-10000.00	2026-02-23 00:00:00	Recibo R-0007 - Saldo a favor - efectivo	2026-02-23 10:53:28.790747	\N	efectivo
21	proveedor	3	\N	\N	8	\N	0.00	10000.00	-10000.00	2026-02-23 00:00:00	Recibo R-0008 - Saldo a favor - efectivo	2026-02-23 11:13:44.98138	\N	efectivo
22	proveedor	2	\N	\N	9	\N	0.00	10000.00	-10000.00	2026-02-23 00:00:00	Recibo R-0009 - Saldo a favor - efectivo	2026-02-23 11:14:27.910187	\N	efectivo
23	proveedor	2	\N	\N	10	\N	0.00	10000.00	-10000.00	2026-02-23 00:00:00	Recibo R-0010 - Saldo a favor - efectivo	2026-02-23 12:00:17.037191	\N	efectivo
24	cliente	3	\N	\N	\N	6	40000.00	0.00	-40000.00	2026-02-23 15:36:45.331754	Anulación Recibo R-0006 - sa	2026-02-23 12:36:45.228414	\N	anulacion
25	proveedor	2	28	\N	\N	\N	80000.00	0.00	80000.00	2026-02-23 00:00:00	FC 1-12 - Cuenta Corriente	2026-02-23 15:45:00.337123	2026-02-23 00:00:00	cta_cte
26	proveedor	2	28	\N	11	\N	0.00	60000.00	-60000.00	2026-02-23 00:00:00	Recibo R-0011 - Imputación - efectivo	2026-02-23 15:55:16.610506	\N	efectivo
27	proveedor	2	28	\N	12	\N	0.00	20000.00	-20000.00	2026-02-23 00:00:00	Recibo R-0012 - Imputación - efectivo	2026-02-23 15:56:35.571841	\N	efectivo
28	proveedor	2	\N	\N	12	\N	0.00	10000.00	-10000.00	2026-02-23 00:00:00	Recibo R-0012 - Saldo a favor - efectivo	2026-02-23 15:56:35.571841	\N	efectivo
29	proveedor	2	\N	\N	13	\N	0.00	100000.00	-100000.00	2026-02-23 00:00:00	Recibo R-0013 - Saldo a favor - efectivo	2026-02-23 15:58:10.056743	\N	efectivo
30	proveedor	2	\N	\N	13	\N	100000.00	0.00	-100000.00	2026-02-23 18:59:14.520311	Anulación Recibo R-0013 - mal cargado	2026-02-23 15:59:14.514869	\N	anulacion
31	cliente	4	\N	16	\N	\N	49995.00	49995.00	0.00	2026-02-23 19:04:32.340403	FC 1-00000005 - transferencia	2026-02-23 16:04:32.282124	\N	transferencia
32	cliente	4	\N	17	\N	\N	17990.00	0.00	17990.00	2026-02-23 19:05:32.847973	FC 1-00000013 - cta_cte	2026-02-23 16:05:32.839271	\N	cta_cte
33	cliente	4	\N	18	\N	\N	17990.00	0.00	17990.00	2026-02-23 19:05:59.726907	FC 1-00000014 - cta_cte	2026-02-23 16:05:59.717787	\N	cta_cte
34	cliente	4	\N	17	\N	14	0.00	17990.00	-17990.00	2026-02-23 00:00:00	Recibo R-0014 - Imputación - efectivo	2026-02-23 16:07:36.299138	\N	efectivo
35	cliente	4	\N	18	\N	14	0.00	2010.00	-2010.00	2026-02-23 00:00:00	Recibo R-0014 - Imputación - efectivo	2026-02-23 16:07:36.299138	\N	efectivo
36	cliente	4	\N	18	\N	15	0.00	15980.00	-15980.00	2026-02-23 00:00:00	Recibo R-0015 - Imputación - efectivo	2026-02-23 16:08:37.082139	\N	efectivo
37	cliente	4	\N	\N	\N	15	0.00	20.00	-20.00	2026-02-23 00:00:00	Recibo R-0015 - Saldo a favor - efectivo	2026-02-23 16:08:37.082139	\N	efectivo
38	cliente	4	\N	18	\N	15	15980.00	0.00	-15980.00	2026-02-23 19:08:56.829486	Anulación Recibo R-0015 - monto mal cargado	2026-02-23 16:08:56.825071	\N	anulacion
39	cliente	4	\N	\N	\N	15	20.00	0.00	-20.00	2026-02-23 19:08:56.829865	Anulación Recibo R-0015 - monto mal cargado	2026-02-23 16:08:56.825071	\N	anulacion
40	cliente	4	\N	\N	\N	16	0.00	50000.00	-50000.00	2026-02-23 00:00:00	Recibo R-0016 - efectivo	2026-02-23 16:46:33.410827	\N	efectivo
41	proveedor	2	\N	\N	17	\N	0.00	100000.00	-100000.00	2026-02-23 00:00:00	Recibo R-0017 - efectivo	2026-02-23 16:47:21.198855	\N	efectivo
42	proveedor	2	\N	\N	10	\N	10000.00	0.00	-10000.00	2026-02-23 19:47:55.456698	Anulación Recibo R-0010 - mal cargado	2026-02-23 16:47:55.452832	\N	anulacion
43	cliente	4	\N	17	\N	14	17990.00	0.00	-17990.00	2026-02-23 19:49:23.065636	Anulación Recibo R-0014 - mal cargado	2026-02-23 16:49:23.063211	\N	anulacion
44	cliente	4	\N	18	\N	14	2010.00	0.00	-2010.00	2026-02-23 19:49:23.065809	Anulación Recibo R-0014 - mal cargado	2026-02-23 16:49:23.063211	\N	anulacion
45	cliente	4	\N	20	\N	\N	179982.00	179982.00	0.00	2026-02-24 12:34:26.154002	FC 1-00000015 - transferencia	2026-02-24 09:34:25.990222	\N	transferencia
46	cliente	1	\N	23	\N	\N	9999.00	0.00	9999.00	2026-02-25 22:58:48.435346	FC 1-00000016 - cta_cte	2026-02-25 19:58:48.421818	\N	cta_cte
47	cliente	1	\N	24	\N	\N	9999.00	9999.00	0.00	2026-02-25 23:10:17.115824	FC 1-00000017 - transferencia	2026-02-25 20:10:17.071398	\N	transferencia
48	cliente	1	\N	\N	\N	18	0.00	10000.00	-10000.00	2026-02-25 00:00:00	Recibo R-0018 - efectivo	2026-02-25 20:12:03.39962	\N	efectivo
49	cliente	4	\N	26	\N	\N	5940.00	0.00	5940.00	2026-02-26 12:34:54.164911	FC 1-00000018 - cta_cte	2026-02-26 09:34:54.127034	\N	cta_cte
50	proveedor	1	29	\N	\N	\N	80000.00	0.00	80000.00	2026-02-26 00:00:00	FC 1-2 - Cuenta Corriente	2026-02-26 10:57:58.175687	2026-02-26 00:00:00	cta_cte
51	proveedor	1	30	\N	\N	\N	9000.00	9000.00	0.00	2026-02-26 00:00:00	FC 2-5 - transferencia	2026-02-26 12:32:47.369559	\N	transferencia
52	cliente	1	\N	27	\N	\N	55995.00	55995.00	0.00	2026-02-26 15:33:47.218326	FC 1-00000019 - transferencia	2026-02-26 12:33:47.206069	\N	transferencia
53	proveedor	1	29	\N	\N	\N	0.00	80000.00	-80000.00	2026-02-26 15:48:33.286566	Anulación FC 1-2 - adad	2026-02-26 12:48:33.029351	\N	anulacion
54	proveedor	1	23	\N	\N	\N	0.00	8000.00	-8000.00	2026-02-26 15:49:30.075519	Anulación FC 25-29 - dqd	2026-02-26 12:49:30.059027	\N	anulacion
55	proveedor	1	27	\N	\N	\N	0.00	8000.00	-8000.00	2026-02-26 15:51:18.012482	Anulación FC 5-10 - sss	2026-02-26 12:51:17.999358	\N	anulacion
56	cliente	3	\N	28	\N	\N	11999.00	11999.00	0.00	2026-02-26 16:27:16.944736	FC 1-00000020 - efectivo	2026-02-26 13:27:16.862668	\N	efectivo
57	proveedor	1	31	\N	\N	\N	90000.00	90000.00	0.00	2026-02-26 00:00:00	FC 2-25 - transferencia	2026-02-26 17:04:40.014546	\N	transferencia
58	proveedor	2	32	\N	\N	\N	900000.00	0.00	900000.00	2026-02-26 00:00:00	FC 2-56 - Cuenta Corriente	2026-02-26 17:06:28.399335	2026-02-25 00:00:00	cta_cte
59	proveedor	2	32	\N	\N	\N	0.00	900000.00	-900000.00	2026-02-26 20:06:49.316496	Anulación FC 2-56 - sas	2026-02-26 17:06:49.304804	\N	anulacion
60	proveedor	1	33	\N	\N	\N	90000.00	0.00	90000.00	2026-02-26 00:00:00	FC 2-165 - Cuenta Corriente	2026-02-26 18:06:03.729936	\N	cta_cte
61	cliente	4	\N	29	\N	\N	55995.00	55995.00	0.00	2026-02-26 21:06:50.087713	FC 1-00000006 - efectivo	2026-02-26 18:06:50.056819	\N	efectivo
62	cliente	4	\N	30	\N	\N	55995.00	0.00	55995.00	2026-02-26 21:08:36.63228	FC 1-00000021 - cta_cte	2026-02-26 18:08:36.607182	\N	cta_cte
63	cliente	4	\N	\N	\N	19	0.00	50000.00	-50000.00	2026-02-26 00:00:00	Recibo R-0019 - efectivo	2026-02-26 18:10:18.187521	\N	efectivo
64	cliente	3	\N	31	\N	\N	424990.00	424990.00	0.00	2026-02-26 21:33:17.51591	FC 1-00000022 - transferencia	2026-02-26 18:33:17.466556	\N	transferencia
65	cliente	3	\N	\N	\N	20	0.00	10000.00	-10000.00	2026-02-26 00:00:00	Recibo R-0020 - efectivo	2026-02-26 18:49:04.220668	\N	efectivo
66	proveedor	1	\N	\N	21	\N	0.00	20000.00	-20000.00	2026-02-26 00:00:00	Recibo R-0021 - efectivo	2026-02-26 18:50:10.657461	\N	efectivo
67	proveedor	1	\N	\N	22	\N	0.00	17500.00	-17500.00	2026-02-26 00:00:00	Recibo R-0022 - efectivo	2026-02-26 18:51:39.944943	\N	efectivo
68	cliente	1	\N	\N	\N	23	0.00	1.00	-1.00	2026-02-26 00:00:00	Recibo R-0023 - transferencia	2026-02-26 19:48:40.104656	\N	transferencia
69	cliente	3	\N	31	\N	\N	0.00	100.00	-100.00	2026-02-27 01:14:43.112389	NC 4 - SSSSS	2026-02-26 22:14:42.958828	\N	\N
70	cliente	1	\N	27	\N	\N	0.00	200.00	-200.00	2026-02-27 10:53:58.301236	NC 5 - sss	2026-02-27 07:53:57.7936	\N	\N
71	cliente	3	\N	9	\N	\N	0.00	47996.00	-47996.00	2026-02-27 11:11:59.661838	NC 6 - aaaa	2026-02-27 08:11:59.621756	\N	\N
72	proveedor	2	34	\N	\N	\N	90000.00	0.00	90000.00	2026-02-27 00:00:00	FC 2-44 - Cuenta Corriente	2026-02-27 09:03:49.873881	2026-02-27 00:00:00	cta_cte
73	proveedor	2	35	\N	\N	\N	0.00	45000.00	0.00	2026-02-27 00:00:00	NC 2-33 - transferencia	2026-02-27 16:28:14.898998	\N	transferencia
74	proveedor	3	36	\N	\N	\N	0.00	135000.00	-135000.00	2026-02-27 00:00:00	NC 12-22 - Cuenta Corriente	2026-02-27 16:49:02.220654	2026-02-27 00:00:00	cta_cte
75	proveedor	1	37	\N	\N	\N	90000.00	0.00	90000.00	2026-02-27 00:00:00	FC 1-500 - Cuenta Corriente	2026-02-27 16:57:28.821589	2026-02-27 00:00:00	cta_cte
76	proveedor	1	38	\N	\N	\N	0.00	45000.00	-45000.00	2026-02-27 00:00:00	NC 2-500 - Cuenta Corriente	2026-02-27 17:02:43.609044	2026-02-27 00:00:00	cta_cte
77	proveedor	1	39	\N	\N	\N	16000.00	0.00	16000.00	2026-02-27 00:00:00	FC 2-89 - Cuenta Corriente	2026-02-27 17:18:51.20616	2026-02-27 00:00:00	cta_cte
78	cliente	1	\N	32	\N	\N	63597.00	63597.00	0.00	2026-02-27 22:12:44.322247	FC 1-00000001 - transferencia	2026-02-27 19:12:44.266185	\N	transferencia
79	cliente	1	\N	33	\N	\N	0.00	26199.00	-26199.00	2026-02-27 22:15:56.188988	NC 1-00000001 - Nota de Crédito	2026-02-27 19:15:56.167926	2026-02-27 00:00:00	cta_cte
80	cliente	1	\N	\N	\N	64	0.00	26401.00	-26401.00	2026-02-27 00:00:00	Cobro: efectivo	2026-02-27 19:25:22.90824	\N	\N
81	cliente	1	\N	\N	\N	65	0.00	52802.00	-52802.00	2026-02-27 00:00:00	Cobro: efectivo	2026-02-27 19:26:13.042071	\N	\N
82	cliente	1	\N	34	\N	\N	261990.00	0.00	261990.00	2026-02-27 22:27:34.870674	FC 1-00000002 - cta_cte	2026-02-27 19:27:34.844148	2026-02-27 00:00:00	cta_cte
83	cliente	1	\N	35	\N	\N	261990.00	261990.00	0.00	2026-02-27 22:37:12.262088	FC 1-00000003 - transferencia	2026-02-27 19:37:12.23078	\N	transferencia
84	cliente	1	\N	36	\N	\N	261990.00	0.00	261990.00	2026-02-27 22:38:15.036008	FC 1-00000004 - cta_cte	2026-02-27 19:38:15.010715	\N	cta_cte
85	cliente	5	\N	37	\N	\N	2999.00	0.00	2999.00	2026-02-27 22:49:34.828209	FC 1-00000005 - cta_cte	2026-02-27 19:49:34.795229	2026-02-27 00:00:00	cta_cte
86	cliente	1	\N	\N	\N	66	0.00	100000.00	0.00	2026-02-27 00:00:00	Cobro: efectivo	2026-02-27 20:02:43.707108	\N	\N
87	proveedor	3	40	\N	\N	\N	150000.00	0.00	0.00	2026-02-27 00:00:00	FC 2-125 - transferencia	2026-02-27 20:04:13.204457	\N	transferencia
88	proveedor	1	\N	\N	68	\N	0.00	100000.00	0.00	2026-02-27 00:00:00	Pago: transferencia	2026-02-27 20:06:32.767388	\N	\N
89	cliente	1	\N	\N	\N	69	0.00	318376.00	0.00	2026-02-27 00:00:00	Cobro: efectivo	2026-02-27 20:07:14.051805	\N	\N
90	cliente	5	\N	\N	\N	70	0.00	2999.00	0.00	2026-02-27 00:00:00	Cobro: transferencia	2026-02-27 20:14:17.817695	\N	\N
91	proveedor	2	\N	\N	71	\N	0.00	10000.00	0.00	2026-02-27 00:00:00	Pago: transferencia	2026-02-27 20:15:40.901552	\N	\N
92	cliente	5	\N	38	\N	\N	374990.00	0.00	0.00	2026-02-27 23:33:13.709357	FC 1-00000006 - cta_cte	2026-02-27 20:33:13.673173	\N	cta_cte
93	cliente	5	\N	\N	\N	72	0.00	100000.00	0.00	2026-02-27 00:00:00	Cobro: cheque	2026-02-27 20:33:47.401587	\N	\N
94	proveedor	2	\N	\N	73	\N	0.00	10000.00	0.00	2026-02-27 00:00:00	Pago: efectivo	2026-02-27 20:35:24.376655	\N	\N
95	cliente	1	\N	39	\N	\N	20000.00	20000.00	0.00	2026-02-28 01:58:11.283739	FC 1-00000007 - efectivo	2026-02-27 22:58:11.231374	\N	efectivo
96	cliente	1	\N	40	\N	\N	5000.00	5000.00	0.00	2026-02-28 14:51:34.36703	FC 1-00000008 - efectivo	2026-02-28 11:51:34.300232	\N	efectivo
97	cliente	1	\N	41	\N	\N	5000.00	5000.00	0.00	2026-02-28 15:46:09.18439	FC 1-00000009 - efectivo	2026-02-28 12:46:09.155864	\N	efectivo
98	cliente	3	\N	42	\N	\N	1000.00	1000.00	0.00	2026-02-28 16:07:38.378436	FC 1-00000010 - efectivo	2026-02-28 13:07:38.355838	\N	efectivo
99	cliente	1	\N	43	\N	\N	5000.00	0.00	0.00	2026-02-28 19:57:34.650161	FC 1-00000011 - cta_cte	2026-02-28 16:57:34.610909	\N	cta_cte
100	cliente	5	\N	44	\N	\N	5000.00	5000.00	0.00	2026-02-28 20:06:53.162466	FC 1-00000012 - efectivo	2026-02-28 17:06:53.126514	\N	efectivo
101	cliente	5	\N	45	\N	\N	6000.00	6000.00	0.00	2026-02-28 20:10:01.88804	FC 1-00000013 - transferencia	2026-02-28 17:10:01.855347	\N	transferencia
102	cliente	5	\N	46	\N	\N	7000.00	7000.00	0.00	2026-02-28 20:12:37.925537	FC 1-00000014 - cheque	2026-02-28 17:12:37.895594	\N	cheque
103	cliente	5	\N	47	\N	\N	2000.00	2000.00	0.00	2026-02-28 20:22:41.26154	FC 1-00000015 - transferencia	2026-02-28 17:22:41.219709	\N	transferencia
104	cliente	5	\N	48	\N	\N	4000.00	4000.00	0.00	2026-02-28 20:23:42.62116	FC 1-00000016 - efectivo	2026-02-28 17:23:42.569409	\N	efectivo
105	cliente	4	\N	49	\N	\N	1200.00	1200.00	0.00	2026-02-28 20:24:46.611277	FC 1-00000017 - cheque	2026-02-28 17:24:46.591678	\N	cheque
106	cliente	3	\N	50	\N	\N	13499.00	0.00	0.00	2026-02-28 20:25:24.067751	FC 1-00000018 - cta_cte	2026-02-28 17:25:24.050994	\N	cta_cte
107	proveedor	2	42	\N	\N	\N	9000.00	0.00	0.00	2026-02-28 00:00:00	FC 2-23 - efectivo	2026-02-28 17:40:17.858427	\N	efectivo
108	proveedor	1	43	\N	\N	\N	1500.00	0.00	0.00	2026-02-28 00:00:00	FC 3-25 - transferencia	2026-02-28 17:40:56.999825	\N	transferencia
109	proveedor	3	44	\N	\N	\N	1500.00	0.00	0.00	2026-02-28 00:00:00	FC 1-26 - cheque	2026-02-28 17:42:28.370438	\N	cheque
110	proveedor	2	45	\N	\N	\N	16000.00	0.00	0.00	2026-02-28 00:00:00	FC 2-999 - Cuenta Corriente	2026-02-28 17:43:16.437517	\N	cta_cte
111	proveedor	2	\N	\N	24	\N	0.00	5000.00	0.00	2026-02-28 00:00:00	Pago: efectivo	2026-02-28 18:23:44.916233	\N	\N
112	cliente	1	\N	\N	\N	25	0.00	5000.00	0.00	2026-02-28 00:00:00	Cobro: transferencia	2026-02-28 18:24:58.120339	\N	\N
113	cliente	1	\N	51	\N	\N	11199.00	11199.00	0.00	2026-02-28 23:51:36.477494	FC 1-00000019 - transferencia	2026-02-28 20:51:36.433257	\N	transferencia
114	cliente	3	\N	52	\N	\N	1000.00	1000.00	0.00	2026-03-01 00:14:29.616724	FC 1-00000020 - transferencia	2026-02-28 21:14:29.584175	\N	transferencia
115	cliente	1	\N	53	\N	\N	19199.00	19199.00	0.00	2026-03-01 00:15:31.308541	FC 1-00000021 - efectivo	2026-02-28 21:15:31.288092	\N	efectivo
116	cliente	5	\N	54	\N	\N	23999.00	23999.00	0.00	2026-03-01 00:16:23.158044	FC 1-00000022 - efectivo	2026-02-28 21:16:23.14285	\N	efectivo
117	cliente	3	\N	55	\N	\N	3799.00	3799.00	0.00	2026-03-01 00:29:10.460949	FC 1-00000023 - efectivo	2026-02-28 21:29:10.416197	\N	efectivo
118	cliente	1	\N	56	\N	\N	1000.00	1000.00	0.00	2026-02-28 00:00:00	FC 1-00000024 - transferencia	2026-02-28 22:22:05.590695	\N	transferencia
119	cliente	1	\N	57	\N	\N	2000.00	2000.00	0.00	2026-02-28 00:00:00	FC 1-00000025 - efectivo	2026-02-28 22:23:01.546126	\N	efectivo
120	cliente	1	\N	58	\N	\N	1000.00	1000.00	0.00	2026-02-28 00:00:00	FC 1-00000026 - efectivo	2026-02-28 22:57:19.066782	\N	efectivo
121	proveedor	1	46	\N	\N	\N	9000.00	0.00	0.00	2026-03-01 00:00:00	FC 3-155 - efectivo	2026-02-28 23:17:31.911888	\N	efectivo
122	cliente	1	\N	59	\N	\N	2599.00	2599.00	0.00	2026-02-28 00:00:00	FC 1-00000027 - efectivo	2026-02-28 23:19:18.25563	\N	efectivo
123	proveedor	1	47	\N	\N	\N	1000.00	0.00	0.00	2026-03-01 00:00:00	FC 2-155 - efectivo	2026-02-28 23:30:39.029302	\N	efectivo
124	proveedor	1	\N	\N	32	\N	0.00	5000.00	0.00	2026-03-01 00:00:00	Pago: efectivo	2026-02-28 23:33:26.056676	\N	\N
125	cliente	5	\N	\N	\N	33	0.00	10000.00	0.00	2026-03-01 00:00:00	Cobro: efectivo	2026-02-28 23:34:29.711535	\N	\N
126	proveedor	1	\N	\N	34	\N	0.00	4000.00	0.00	2026-03-01 00:00:00	Pago: efectivo	2026-02-28 23:36:58.612311	\N	\N
127	cliente	1	\N	60	\N	\N	1199.00	1199.00	0.00	2026-03-01 00:00:00	FC 1-00000028 - efectivo	2026-03-01 00:19:39.757397	\N	efectivo
128	cliente	1	\N	61	\N	\N	0.00	1199.00	0.00	2026-03-01 03:26:51.876647	NC 1-00000002 - Nota de Crédito	2026-03-01 00:26:51.852537	\N	cta_cte
129	cliente	5	\N	62	\N	\N	3799.00	3799.00	0.00	2026-03-01 00:00:00	FC 1-00000029 - efectivo	2026-03-01 00:45:53.597778	\N	efectivo
130	cliente	5	\N	\N	\N	37	0.00	50000.00	0.00	2026-03-01 00:00:00	Cobro: transferencia	2026-03-01 01:47:28.835969	\N	\N
131	cliente	5	\N	\N	\N	38	0.00	10000.00	0.00	2026-03-01 00:00:00	Cobro: efectivo	2026-03-01 01:55:51.140377	\N	\N
132	cliente	5	\N	\N	\N	39	0.00	50000.00	0.00	2026-03-01 00:00:00	Cobro: pago parcial	2026-03-01 02:22:38.386082	\N	\N
133	cliente	5	\N	\N	\N	40	0.00	5512.00	0.00	2026-03-01 00:00:00	Cobro: PRUEBA	2026-03-01 02:50:51.380518	\N	\N
134	cliente	6	\N	63	\N	\N	3799.00	0.00	0.00	2026-03-01 14:32:21.260836	FC 1-00000030 - cta_cte	2026-03-01 11:32:21.213345	\N	cta_cte
135	proveedor	2	48	\N	\N	\N	10000.00	0.00	0.00	2026-03-01 00:00:00	FC 3-2 - transferencia	2026-03-01 11:37:53.337445	\N	transferencia
136	cliente	7	\N	64	\N	\N	3799.00	3799.00	0.00	2026-03-01 00:00:00	FC 1-00000031 - transferencia	2026-03-01 11:52:55.318667	\N	transferencia
137	cliente	8	\N	65	\N	\N	2599.00	2599.00	0.00	2026-03-01 00:00:00	FC 1-00000032 - transferencia	2026-03-01 12:55:56.039578	\N	transferencia
138	proveedor	5	49	\N	\N	\N	10000.00	0.00	0.00	2026-03-01 00:00:00	FC 5-250 - Cuenta Corriente	2026-03-01 12:58:31.04703	2026-02-27 00:00:00	cta_cte
139	proveedor	1	50	\N	\N	\N	144000.00	0.00	0.00	2026-03-01 00:00:00	FC 2-8000 - Cuenta Corriente	2026-03-01 20:06:04.191028	2026-03-01 00:00:00	cta_cte
140	cliente	5	\N	\N	\N	44	0.00	50000.00	0.00	2026-03-02 00:00:00	Cobro: efectivo	2026-03-02 07:55:33.886032	\N	\N
141	cliente	4	\N	66	\N	\N	191990.00	0.00	0.00	2026-03-02 11:07:26.67921	FC 1-00000033 - cta_cte	2026-03-02 08:07:26.630043	\N	cta_cte
142	cliente	4	\N	\N	\N	45	0.00	50000.00	0.00	2026-03-02 00:00:00	Cobro: transferencia	2026-03-02 08:10:04.797973	\N	\N
143	cliente	4	\N	\N	\N	46	0.00	23000.00	0.00	2026-03-02 00:00:00	Cobro: para ver que onda	2026-03-02 09:02:02.681745	\N	\N
144	cliente	4	\N	\N	\N	47	0.00	25000.00	0.00	2026-03-02 00:00:00	Cobro: transferencia	2026-03-02 09:28:16.974036	\N	\N
145	cliente	4	\N	\N	\N	48	0.00	15000.00	0.00	2026-03-02 00:00:00	Cobro: efectivo	2026-03-02 11:51:04.4466	\N	\N
146	cliente	4	\N	\N	\N	49	0.00	10000.00	0.00	2026-03-02 00:00:00	Cobro: cheque	2026-03-02 11:58:56.16972	\N	\N
147	proveedor	1	\N	\N	50	\N	0.00	15000.00	0.00	2026-03-02 00:00:00	Pago: transferencia	2026-03-02 12:00:43.875708	\N	\N
148	cliente	4	\N	\N	\N	51	0.00	14700.00	0.00	2026-03-02 00:00:00	Cobro: transferencia	2026-03-02 12:23:07.26937	\N	\N
149	cliente	4	\N	\N	\N	52	0.00	10500.00	0.00	2026-03-02 00:00:00	Cobro: transferencia	2026-03-02 12:44:01.27492	\N	\N
150	cliente	4	\N	\N	\N	53	0.00	5000.00	0.00	2026-03-02 00:00:00	Cobro: transferencia	2026-03-02 12:58:55.774571	\N	\N
151	proveedor	1	\N	\N	54	\N	0.00	23555.00	0.00	2026-03-02 00:00:00	Pago: transferencia	2026-03-02 13:00:46.681653	\N	\N
152	cliente	1	\N	67	\N	\N	77970.00	77970.00	0.00	2026-03-02 00:00:00	FC 1-00000034 - transferencia	2026-03-02 18:28:50.531839	\N	transferencia
153	cliente	2	\N	68	\N	\N	23999.00	0.00	0.00	2026-03-03 01:23:46.422753	FC 1-00000035 - cta_cte	2026-03-02 22:23:45.913311	2026-03-02 00:00:00	cta_cte
154	cliente	4	\N	69	\N	\N	36096.00	36096.00	0.00	2026-03-03 00:00:00	FC 1-00000036 - transferencia	2026-03-03 11:29:40.156318	\N	transferencia
155	cliente	4	\N	70	\N	\N	0.00	19199.00	0.00	2026-03-03 19:46:50.379692	NC 1-00000003 - Nota de Crédito	2026-03-03 16:46:50.304624	\N	cta_cte
156	cliente	4	\N	71	\N	\N	0.00	19199.00	0.00	2026-03-03 20:53:01.278001	NC 1-00000004 - Nota de Crédito	2026-03-03 17:53:01.24142	\N	cta_cte
157	cliente	4	\N	72	\N	\N	19199.00	0.00	0.00	2026-03-03 20:54:46.874644	FC 1-00000037 - cta_cte	2026-03-03 17:54:46.694481	\N	cta_cte
158	cliente	3	\N	73	\N	\N	2499.90	2499.90	0.00	2026-03-04 00:00:00	FC 1-00000038 - transferencia	2026-03-04 10:31:09.953987	\N	transferencia
159	cliente	1	\N	74	\N	\N	23999.00	0.00	0.00	2026-03-05 11:09:30.642593	FC 1-00000039 - cta_cte	2026-03-05 08:09:30.385314	\N	cta_cte
160	cliente	1	\N	76	\N	\N	23999.00	23999.00	0.00	2026-03-05 00:00:00	FC 1-00000040 - transferencia	2026-03-05 08:14:27.570672	\N	transferencia
161	cliente	6	\N	78	\N	\N	12499.00	12499.00	0.00	2026-03-05 00:00:00	FC 1-00000041 - transferencia	2026-03-05 09:08:48.49922	\N	transferencia
162	cliente	4	\N	80	\N	\N	12499.00	12499.00	0.00	2026-03-05 00:00:00	FC 1-00000042 - transferencia	2026-03-05 10:05:29.004369	\N	transferencia
163	cliente	3	\N	81	\N	\N	2999.00	2999.00	0.00	2026-03-05 00:00:00	FC 1-00000043 - transferencia	2026-03-05 10:15:57.843265	\N	transferencia
164	cliente	3	\N	82	\N	\N	0.00	2999.00	0.00	2026-03-05 14:23:56.584586	NC 1-00000005 - Nota de Crédito	2026-03-05 11:23:56.47085	\N	cta_cte
165	cliente	1	\N	83	\N	\N	0.00	23999.00	0.00	2026-03-05 14:57:11.115446	NC 1-00000006 - Nota de Crédito	2026-03-05 11:57:11.067994	\N	cta_cte
166	cliente	3	\N	84	\N	\N	0.00	2999.00	0.00	2026-03-05 15:04:22.723826	NC 1-00000007 - Nota de Crédito	2026-03-05 12:04:22.655027	\N	cta_cte
167	proveedor	11	51	\N	\N	\N	1500.00	0.00	0.00	2026-03-01 00:00:00	FC 123-12312312 - transferencia	2026-03-05 16:15:24.995362	\N	transferencia
168	proveedor	11	52	\N	\N	\N	0.00	1500.00	0.00	2026-03-01 00:00:00	NC 1222-1212121 - Cuenta Corriente	2026-03-05 16:43:31.572004	\N	cta_cte
169	proveedor	11	53	\N	\N	\N	15000.00	0.00	0.00	2026-03-04 00:00:00	FC 3-2564 - Cuenta Corriente	2026-03-05 16:47:53.256197	\N	cta_cte
170	cliente	3	\N	85	\N	\N	24999.00	24999.00	0.00	2026-03-05 00:00:00	FC 1-00000044 - transferencia	2026-03-05 18:07:36.742547	\N	transferencia
171	proveedor	2	54	\N	\N	\N	10000.00	0.00	0.00	2026-03-01 00:00:00	FC 2-2585 - Cuenta Corriente	2026-03-06 09:37:08.706878	\N	cta_cte
172	proveedor	2	55	\N	\N	\N	5000.00	0.00	0.00	2026-03-06 00:00:00	FC 2-1265 - transferencia	2026-03-06 10:55:53.767139	\N	transferencia
173	proveedor	2	56	\N	\N	\N	3500.00	0.00	0.00	2026-03-06 00:00:00	FC 2333-5555 - transferencia	2026-03-06 10:59:27.487037	\N	transferencia
174	proveedor	1	57	\N	\N	\N	3500.00	0.00	0.00	2026-03-02 00:00:00	FC 25-333 - transferencia	2026-03-06 11:03:35.451052	\N	transferencia
175	proveedor	1	58	\N	\N	\N	10000.00	0.00	0.00	2026-03-05 00:00:00	FC 25-99992 - transferencia	2026-03-06 11:04:22.490238	\N	transferencia
176	proveedor	2	59	\N	\N	\N	7000.00	0.00	0.00	2026-03-05 00:00:00	FC 1-2225456 - transferencia	2026-03-06 11:07:04.830798	\N	transferencia
177	proveedor	2	60	\N	\N	\N	3500.00	0.00	0.00	2026-03-06 00:00:00	FC 1-2666 - transferencia	2026-03-06 11:10:32.3688	\N	transferencia
178	proveedor	2	61	\N	\N	\N	3500.00	0.00	0.00	2026-03-04 00:00:00	FC 9-999 - transferencia	2026-03-06 11:27:49.100758	\N	transferencia
179	proveedor	1	62	\N	\N	\N	5500.00	0.00	0.00	2026-03-06 00:00:00	FC 2-2323232 - transferencia	2026-03-06 12:42:27.887008	\N	transferencia
180	cliente	5	\N	\N	\N	71	0.00	99478.00	0.00	2026-03-06 00:00:00	Cobro: transferencia	2026-03-06 12:43:20.479783	\N	\N
\.


--
-- Data for Name: cuenta_corriente_cliente; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuenta_corriente_cliente (id, cliente_id, fecha, tipo_movimiento, documento_id, descripcion, debe, haber, saldo, usuario_id, creado_en) FROM stdin;
\.


--
-- Data for Name: cuenta_corriente_proveedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cuenta_corriente_proveedor (id, proveedor_id, fecha, tipo_movimiento, documento_id, descripcion, debe, haber, saldo, usuario_id, creado_en) FROM stdin;
\.


--
-- Data for Name: detalles_lista_precios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.detalles_lista_precios (id, lista_precios_id, producto_id, costo_compra, margen_porcentaje, precio_venta, unidad_venta) FROM stdin;
\.


--
-- Data for Name: factura_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.factura_detalles (id, factura_id, producto_id, cantidad, precio_unitario, iva_porcentaje, subtotal, costo_unitario) FROM stdin;
1	2	1	5.000	150.00	21.00	750.00	0.00
2	3	1	10.000	120.00	21.00	1200.00	0.00
3	4	1	1.000	90.00	21.00	90.00	0.00
4	5	1	5.000	100.00	21.00	500.00	0.00
5	6	1	1.000	100.00	21.00	100.00	0.00
6	8	2	10.000	9999.00	21.00	99990.00	8000.00
7	9	2	10.000	11999.00	21.00	119990.00	8000.00
8	9	3	1.000	15000.00	21.00	15000.00	17000.00
9	10	2	1.000	9999.00	21.00	9999.00	8000.00
10	10	3	1.000	100.00	21.00	100.00	17000.00
11	11	2	1.000	9999.00	21.00	9999.00	8000.00
12	12	2	1.000	15000.00	21.00	15000.00	8000.00
13	13	2	1.000	11999.00	21.00	11999.00	8000.00
14	14	2	1.000	11999.00	21.00	11999.00	8000.00
15	16	2	5.000	9999.00	21.00	49995.00	8000.00
16	17	4	10.000	1799.00	21.00	17990.00	1500.00
17	18	4	10.000	1799.00	21.00	17990.00	1500.00
18	20	2	18.000	9999.00	21.00	179982.00	8000.00
19	23	2	1.000	9999.00	21.00	9999.00	8000.00
20	24	2	1.000	9999.00	21.00	9999.00	8000.00
21	26	1	60.000	99.00	21.00	5940.00	100.00
22	27	2	5.000	11199.00	21.00	55995.00	9000.00
23	28	2	1.000	11999.00	21.00	11999.00	8000.00
24	29	2	5.000	11199.00	21.00	55995.00	9000.00
25	30	2	5.000	11199.00	21.00	55995.00	9000.00
26	31	3	10.000	42499.00	21.00	424990.00	17000.00
27	32	2	1.000	11199.00	21.00	11199.00	9000.00
28	32	3	2.000	26199.00	21.00	52398.00	15000.00
29	33	3	1.000	26199.00	21.00	26199.00	15000.00
30	34	3	10.000	26199.00	21.00	261990.00	15000.00
31	35	3	10.000	26199.00	21.00	261990.00	15000.00
32	36	3	10.000	26199.00	21.00	261990.00	15000.00
33	37	4	1.000	2999.00	21.00	2999.00	1500.00
34	38	3	10.000	37499.00	21.00	374990.00	15000.00
35	39	2	1.000	20000.00	21.00	20000.00	9000.00
36	40	3	1.000	5000.00	21.00	5000.00	15000.00
37	41	2	1.000	5000.00	21.00	5000.00	9000.00
38	42	2	1.000	1000.00	21.00	1000.00	9000.00
39	43	2	1.000	5000.00	21.00	5000.00	9000.00
40	44	2	1.000	5000.00	21.00	5000.00	9000.00
41	45	2	1.000	6000.00	21.00	6000.00	9000.00
42	46	2	1.000	7000.00	21.00	7000.00	9000.00
43	47	2	1.000	2000.00	21.00	2000.00	9000.00
44	48	2	1.000	4000.00	21.00	4000.00	9000.00
45	49	2	1.000	1200.00	21.00	1200.00	9000.00
46	50	2	1.000	13499.00	21.00	13499.00	9000.00
47	51	2	1.000	11199.00	21.00	11199.00	9000.00
48	52	2	1.000	1000.00	21.00	1000.00	9000.00
49	53	1	1.000	19199.00	21.00	19199.00	16000.00
50	54	1	1.000	23999.00	21.00	23999.00	16000.00
51	55	3	1.000	3799.00	21.00	3799.00	1500.00
52	56	2	1.000	1000.00	21.00	1000.00	9000.00
53	57	2	1.000	2000.00	21.00	2000.00	9000.00
54	58	2	1.000	1000.00	21.00	1000.00	9000.00
55	59	3	1.000	2599.00	21.00	2599.00	1500.00
56	60	2	1.000	1199.00	21.00	1199.00	1000.00
57	61	2	1.000	1199.00	21.00	1199.00	1000.00
58	62	3	1.000	3799.00	21.00	3799.00	1500.00
59	63	3	1.000	3799.00	21.00	3799.00	1500.00
60	64	3	1.000	3799.00	21.00	3799.00	1500.00
61	65	3	1.000	2599.00	21.00	2599.00	1500.00
62	66	1	10.000	19199.00	21.00	191990.00	16000.00
63	67	3	30.000	2599.00	21.00	77970.00	1500.00
64	68	1	1.000	23999.00	21.00	23999.00	16000.00
65	69	1	1.000	19199.00	21.00	19199.00	16000.00
66	69	3	1.000	2599.00	21.00	2599.00	1500.00
67	69	2	1.000	12499.00	21.00	12499.00	10000.00
68	69	4	1.000	1799.00	21.00	1799.00	1500.00
69	70	1	1.000	19199.00	21.00	19199.00	16000.00
70	71	1	1.000	19199.00	21.00	19199.00	16000.00
71	72	1	1.000	19199.00	21.00	19199.00	16000.00
72	73	5	0.100	24999.00	21.00	2499.90	19230.00
73	74	5	1.000	23999.00	21.00	23999.00	19230.00
74	76	5	1.000	23999.00	21.00	23999.00	19230.00
75	78	2	1.000	12499.00	21.00	12499.00	10000.00
76	80	2	1.000	12499.00	21.00	12499.00	10000.00
77	81	4	1.000	2999.00	21.00	2999.00	1500.00
78	82	4	1.000	2999.00	21.00	2999.00	1500.00
79	83	5	1.000	23999.00	21.00	23999.00	19230.00
80	84	4	1.000	2999.00	21.00	2999.00	1500.00
81	85	5	1.000	24999.00	21.00	24999.00	19230.00
\.


--
-- Data for Name: facturas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.facturas (id, punto_venta, numero_factura, tipo_comprobante, fecha, cliente_id, subtotal, iva, total, medio_pago, estado, usuario_id, creado_en, numero_interno, anulado_por, fecha_anulacion, motivo_anulacion, actualizado_en, fecha_vencimiento, observaciones) FROM stdin;
2	1	1	FB	2026-02-18	1	750.00	157.50	907.50	tarjeta	con_nota_credito	\N	2026-02-18 20:43:13.091336	\N	\N	\N	\N	2026-02-22 19:27:30.629424	\N	\N
3	1	1	TK	2026-02-19	1	1200.00	252.00	1452.00	efectivo	emitida	\N	2026-02-19 19:04:37.963603	\N	\N	\N	\N	2026-02-22 19:27:30.629424	\N	\N
4	1	2	TK	2026-02-19	1	90.00	18.90	108.90	efectivo	emitida	\N	2026-02-19 19:06:58.979365	\N	\N	\N	\N	2026-02-22 19:27:30.629424	\N	\N
5	1	3	TK	2026-02-20	2	500.00	105.00	605.00	efectivo	emitida	\N	2026-02-20 08:27:09.935605	\N	\N	\N	\N	2026-02-22 19:27:30.629424	\N	\N
6	1	1	FC	2026-02-20	3	100.00	21.00	121.00	efectivo	emitida	\N	2026-02-20 09:31:55.475918	\N	\N	\N	\N	2026-02-22 19:27:30.629424	\N	\N
8	1	5	FC	2026-02-22	1	99990.00	0.00	99990.00	transferencia	emitida	\N	2026-02-22 20:43:39.624065	FV-0007	\N	\N	\N	2026-02-22 20:43:39.624065	\N	\N
10	1	10	FC	2026-02-22	1	10099.00	0.00	10099.00	transferencia	emitida	\N	2026-02-22 20:47:56.440809	FV-0010	\N	\N	\N	2026-02-22 20:47:56.440809	\N	\N
11	1	11	FC	2026-02-23	1	9999.00	0.00	9999.00	transferencia	emitida	\N	2026-02-22 21:10:12.187881	FV-0011	\N	\N	\N	2026-02-22 21:10:12.187881	\N	\N
12	1	12	FC	2026-02-23	3	15000.00	0.00	15000.00	efectivo	emitida	\N	2026-02-22 21:12:18.214505	FV-0012	\N	\N	\N	2026-02-22 21:12:18.214505	\N	\N
13	2	1	TK	2026-02-23	3	11999.00	0.00	11999.00	transferencia	emitida	\N	2026-02-22 21:20:18.503921	FV-0013	\N	\N	\N	2026-02-22 21:20:18.503921	\N	\N
14	1	4	TK	2026-02-23	3	11999.00	0.00	11999.00	cta_cte	emitida	\N	2026-02-22 21:55:17.393902	FV-0014	\N	\N	\N	2026-02-22 21:55:17.393902	\N	\N
16	1	5	TK	2026-02-23	4	49995.00	0.00	49995.00	transferencia	emitida	\N	2026-02-23 16:04:32.282124	FV-0015	\N	\N	\N	2026-02-23 16:04:32.282124	\N	\N
17	1	13	FC	2026-02-23	4	17990.00	0.00	17990.00	cta_cte	emitida	\N	2026-02-23 16:05:32.839271	FV-0017	\N	\N	\N	2026-02-23 16:05:32.839271	\N	\N
18	1	14	FC	2026-02-23	4	17990.00	0.00	17990.00	cta_cte	emitida	\N	2026-02-23 16:05:59.717787	FV-0018	\N	\N	\N	2026-02-23 16:05:59.717787	\N	\N
20	1	15	FC	2026-02-24	4	179982.00	0.00	179982.00	transferencia	emitida	\N	2026-02-24 09:34:25.990222	FV-0019	\N	\N	\N	2026-02-24 09:34:25.990222	\N	\N
23	1	16	FC	2026-02-25	1	9999.00	0.00	9999.00	cta_cte	emitida	\N	2026-02-25 19:58:48.421818	FV-0021	\N	\N	\N	2026-02-25 19:58:48.421818	\N	\N
24	1	17	FC	2026-02-25	1	9999.00	0.00	9999.00	transferencia	emitida	\N	2026-02-25 20:10:17.071398	FV-0024	\N	\N	\N	2026-02-25 20:10:17.071398	\N	\N
28	1	20	FC	2026-02-26	3	11999.00	0.00	11999.00	efectivo	emitida	\N	2026-02-26 13:27:16.862668	FV-0028	\N	\N	\N	2026-02-26 13:27:16.862668	\N	\N
29	1	6	TK	2026-02-26	4	55995.00	0.00	55995.00	efectivo	emitida	\N	2026-02-26 18:06:50.056819	FV-0029	\N	\N	\N	2026-02-26 18:06:50.056819	\N	\N
30	1	21	FC	2026-02-26	4	55995.00	0.00	55995.00	cta_cte	emitida	\N	2026-02-26 18:08:36.607182	FV-0030	\N	\N	\N	2026-02-26 18:08:36.607182	\N	\N
26	1	18	FC	2026-02-26	4	5940.00	0.00	5940.00	cta_cte	con_nota_credito	\N	2026-02-26 09:34:54.127034	FV-0025	\N	\N	\N	2026-02-26 18:13:43.896492	\N	\N
31	1	22	FC	2026-02-26	3	424990.00	0.00	424990.00	transferencia	con_nota_credito	\N	2026-02-26 18:33:17.466556	FV-0031	\N	\N	\N	2026-02-26 22:14:42.958828	\N	\N
27	1	19	FC	2026-02-26	1	55995.00	0.00	55995.00	transferencia	con_nota_credito	\N	2026-02-26 12:33:47.206069	FV-0027	\N	\N	\N	2026-02-27 07:53:57.7936	\N	\N
9	1	6	FC	2026-02-22	3	134990.00	0.00	134990.00	cta_cte	con_nota_credito	\N	2026-02-22 20:45:55.105471	FV-0009	\N	\N	\N	2026-02-27 08:11:59.621756	2026-02-23 00:00:00	\N
32	1	1	venta	2026-02-27	1	63597.00	0.00	63597.00	transferencia	emitida	\N	2026-02-27 19:12:44.266185	FV-0032	\N	\N	\N	2026-02-27 19:12:44.266185	2026-02-27 00:00:00	\N
33	1	1	nota_credito	2026-02-27	1	26199.00	0.00	26199.00	cta_cte	emitida	\N	2026-02-27 19:15:56.167926	NC-0033	\N	\N	\N	2026-02-27 19:15:56.167926	2026-02-27 00:00:00	\N
34	1	2	venta	2026-02-27	1	261990.00	0.00	261990.00	cta_cte	emitida	\N	2026-02-27 19:27:34.844148	FV-0034	\N	\N	\N	2026-02-27 19:27:34.844148	2026-02-27 00:00:00	\N
35	1	3	venta	2026-02-27	1	261990.00	0.00	261990.00	transferencia	emitida	\N	2026-02-27 19:37:12.23078	FV-0035	\N	\N	\N	2026-02-27 19:37:12.23078	2026-02-27 00:00:00	\N
36	1	4	venta	2026-02-27	1	261990.00	0.00	261990.00	cta_cte	emitida	\N	2026-02-27 19:38:15.010715	FV-0036	\N	\N	\N	2026-02-27 19:38:15.010715	\N	\N
37	1	5	venta	2026-02-27	5	2999.00	0.00	2999.00	cta_cte	emitida	\N	2026-02-27 19:49:34.795229	FV-0037	\N	\N	\N	2026-02-27 19:49:34.795229	2026-02-27 00:00:00	\N
38	1	6	venta	2026-02-27	5	374990.00	0.00	374990.00	cta_cte	emitida	\N	2026-02-27 20:33:13.673173	FV-0038	\N	\N	\N	2026-02-27 20:33:13.673173	\N	\N
39	1	7	venta	2026-02-28	1	20000.00	0.00	20000.00	efectivo	emitida	\N	2026-02-27 22:58:11.231374	FV-0039	\N	\N	\N	2026-02-27 22:58:11.231374	\N	\N
40	1	8	venta	2026-02-28	1	5000.00	0.00	5000.00	efectivo	emitida	\N	2026-02-28 11:51:34.300232	FV-0040	\N	\N	\N	2026-02-28 11:51:34.300232	2026-02-28 00:00:00	\N
41	1	9	venta	2026-02-28	1	5000.00	0.00	5000.00	efectivo	emitida	\N	2026-02-28 12:46:09.155864	FV-0041	\N	\N	\N	2026-02-28 12:46:09.155864	2026-02-28 00:00:00	\N
42	1	10	venta	2026-02-28	3	1000.00	0.00	1000.00	efectivo	emitida	\N	2026-02-28 13:07:38.355838	FV-0042	\N	\N	\N	2026-02-28 13:07:38.355838	2026-02-28 00:00:00	\N
43	1	11	venta	2026-02-28	1	5000.00	0.00	5000.00	cta_cte	emitida	\N	2026-02-28 16:57:34.610909	FV-0043	\N	\N	\N	2026-02-28 16:57:34.610909	\N	\N
44	1	12	venta	2026-02-28	5	5000.00	0.00	5000.00	efectivo	emitida	\N	2026-02-28 17:06:53.126514	FV-0044	\N	\N	\N	2026-02-28 17:06:53.126514	2026-02-28 00:00:00	\N
45	1	13	venta	2026-02-28	5	6000.00	0.00	6000.00	transferencia	emitida	\N	2026-02-28 17:10:01.855347	FV-0045	\N	\N	\N	2026-02-28 17:10:01.855347	\N	\N
46	1	14	venta	2026-02-28	5	7000.00	0.00	7000.00	cheque	emitida	\N	2026-02-28 17:12:37.895594	FV-0046	\N	\N	\N	2026-02-28 17:12:37.895594	\N	\N
47	1	15	venta	2026-02-28	5	2000.00	0.00	2000.00	transferencia	emitida	\N	2026-02-28 17:22:41.219709	FV-0047	\N	\N	\N	2026-02-28 17:22:41.219709	\N	\N
48	1	16	venta	2026-02-28	5	4000.00	0.00	4000.00	efectivo	emitida	\N	2026-02-28 17:23:42.569409	FV-0048	\N	\N	\N	2026-02-28 17:23:42.569409	\N	\N
49	1	17	venta	2026-02-28	4	1200.00	0.00	1200.00	cheque	emitida	\N	2026-02-28 17:24:46.591678	FV-0049	\N	\N	\N	2026-02-28 17:24:46.591678	\N	\N
50	1	18	venta	2026-02-28	3	13499.00	0.00	13499.00	cta_cte	emitida	\N	2026-02-28 17:25:24.050994	FV-0050	\N	\N	\N	2026-02-28 17:25:24.050994	\N	\N
51	1	19	venta	2026-02-28	1	11199.00	0.00	11199.00	transferencia	emitida	\N	2026-02-28 20:51:36.433257	FV-0051	\N	\N	\N	2026-02-28 20:51:36.433257	\N	\N
52	1	20	venta	2026-03-01	3	1000.00	0.00	1000.00	transferencia	emitida	\N	2026-02-28 21:14:29.584175	FV-0052	\N	\N	\N	2026-02-28 21:14:29.584175	\N	\N
53	1	21	venta	2026-03-01	1	19199.00	0.00	19199.00	efectivo	emitida	\N	2026-02-28 21:15:31.288092	FV-0053	\N	\N	\N	2026-02-28 21:15:31.288092	\N	\N
54	1	22	venta	2026-03-01	5	23999.00	0.00	23999.00	efectivo	emitida	\N	2026-02-28 21:16:23.14285	FV-0054	\N	\N	\N	2026-02-28 21:16:23.14285	\N	\N
55	1	23	venta	2026-03-01	3	3799.00	0.00	3799.00	efectivo	emitida	\N	2026-02-28 21:29:10.416197	FV-0055	\N	\N	\N	2026-02-28 21:29:10.416197	\N	\N
56	1	24	venta	2026-02-28	1	1000.00	0.00	1000.00	transferencia	emitida	\N	2026-02-28 22:22:05.590695	FV-0056	\N	\N	\N	2026-02-28 22:22:05.590695	2026-02-28 00:00:00	\N
57	1	25	venta	2026-02-28	1	2000.00	0.00	2000.00	efectivo	emitida	\N	2026-02-28 22:23:01.546126	FV-0057	\N	\N	\N	2026-02-28 22:23:01.546126	\N	\N
58	1	26	venta	2026-02-28	1	1000.00	0.00	1000.00	efectivo	emitida	\N	2026-02-28 22:57:19.066782	FV-0058	\N	\N	\N	2026-02-28 22:57:19.066782	\N	\N
59	1	27	venta	2026-02-28	1	2599.00	0.00	2599.00	efectivo	emitida	\N	2026-02-28 23:19:18.25563	FV-0059	\N	\N	\N	2026-02-28 23:19:18.25563	\N	\N
60	1	28	venta	2026-03-01	1	1199.00	0.00	1199.00	efectivo	emitida	\N	2026-03-01 00:19:39.757397	FV-0060	\N	\N	\N	2026-03-01 00:19:39.757397	\N	\N
61	1	2	nota_credito	2026-03-01	1	1199.00	0.00	1199.00	cta_cte	emitida	\N	2026-03-01 00:26:51.852537	NC-0061	\N	\N	\N	2026-03-01 00:26:51.852537	\N	\N
62	1	29	venta	2026-03-01	5	3799.00	0.00	3799.00	efectivo	emitida	\N	2026-03-01 00:45:53.597778	FV-0062	\N	\N	\N	2026-03-01 00:45:53.597778	\N	\N
63	1	30	venta	2026-03-01	6	3799.00	0.00	3799.00	cta_cte	emitida	\N	2026-03-01 11:32:21.213345	FV-0063	\N	\N	\N	2026-03-01 11:32:21.213345	\N	\N
64	1	31	venta	2026-03-01	7	3799.00	0.00	3799.00	transferencia	emitida	\N	2026-03-01 11:52:55.318667	FV-0064	\N	\N	\N	2026-03-01 11:52:55.318667	\N	\N
65	1	32	venta	2026-03-01	8	2599.00	0.00	2599.00	transferencia	emitida	\N	2026-03-01 12:55:56.039578	FV-0065	\N	\N	\N	2026-03-01 12:55:56.039578	\N	\N
66	1	33	venta	2026-03-02	4	191990.00	0.00	191990.00	cta_cte	emitida	\N	2026-03-02 08:07:26.630043	FV-0066	\N	\N	\N	2026-03-02 08:07:26.630043	\N	\N
67	1	34	venta	2026-03-02	1	77970.00	0.00	77970.00	transferencia	emitida	\N	2026-03-02 18:28:50.531839	FV-0067	\N	\N	\N	2026-03-02 18:28:50.531839	2026-03-02 00:00:00	\N
68	1	35	venta	2026-03-02	2	23999.00	0.00	23999.00	cta_cte	emitida	\N	2026-03-02 22:23:45.913311	FV-0068	\N	\N	\N	2026-03-02 22:23:45.913311	2026-03-02 00:00:00	\N
69	1	36	venta	2026-03-03	4	36096.00	0.00	36096.00	transferencia	emitida	\N	2026-03-03 11:29:40.156318	FV-0069	\N	\N	\N	2026-03-03 11:29:40.156318	\N	llevar al domicilio
70	1	3	nota_credito	2026-03-03	4	19199.00	0.00	19199.00	cta_cte	emitida	\N	2026-03-03 16:46:50.304624	NC-0070	\N	\N	\N	2026-03-03 16:46:50.304624	\N	\N
71	1	4	nota_credito	2026-03-03	4	19199.00	0.00	19199.00	cta_cte	emitida	\N	2026-03-03 17:53:01.24142	NC-0071	\N	\N	\N	2026-03-03 17:53:01.24142	\N	bonificacion
72	1	37	venta	2026-03-03	4	19199.00	0.00	19199.00	cta_cte	emitida	\N	2026-03-03 17:54:46.694481	FV-0072	\N	\N	\N	2026-03-03 17:54:46.694481	\N	\N
73	1	38	venta	2026-03-04	3	2499.90	0.00	2499.90	transferencia	emitida	1	2026-03-04 10:31:09.953987	FV-0073	\N	\N	\N	2026-03-04 10:31:09.953987	\N	\N
74	1	39	venta	2026-03-05	1	23999.00	0.00	23999.00	cta_cte	emitida	1	2026-03-05 08:09:30.385314	FV-0074	\N	\N	\N	2026-03-05 08:09:30.385314	\N	\N
76	1	40	venta	2026-03-05	1	23999.00	0.00	23999.00	transferencia	emitida	1	2026-03-05 08:14:27.570672	FV-0075	\N	\N	\N	2026-03-05 08:14:27.570672	\N	\N
78	1	41	venta	2026-03-05	6	12499.00	0.00	12499.00	transferencia	emitida	1	2026-03-05 09:08:48.49922	FV-0077	\N	\N	\N	2026-03-05 09:08:48.49922	\N	\N
80	1	42	venta	2026-03-05	4	12499.00	0.00	12499.00	transferencia	emitida	1	2026-03-05 10:05:29.004369	FV-0079	\N	\N	\N	2026-03-05 10:05:29.004369	\N	\N
81	1	43	venta	2026-03-05	3	2999.00	0.00	2999.00	transferencia	emitida	1	2026-03-05 10:15:57.843265	FV-0043	\N	\N	\N	2026-03-05 10:15:57.843265	\N	\N
82	1	5	nota_credito	2026-03-05	3	2999.00	0.00	2999.00	cta_cte	emitida	1	2026-03-05 11:23:56.47085	NC-0005	\N	\N	\N	2026-03-05 11:23:56.47085	\N	\N
83	1	6	nota_credito	2026-03-05	1	23999.00	0.00	23999.00	cta_cte	emitida	1	2026-03-05 11:57:11.067994	NC-0006	\N	\N	\N	2026-03-05 11:57:11.067994	\N	\N
84	1	7	nota_credito	2026-03-05	3	2999.00	0.00	2999.00	cta_cte	emitida	1	2026-03-05 12:04:22.655027	NC-0007	\N	\N	\N	2026-03-05 12:04:22.655027	\N	\N
85	1	44	venta	2026-03-05	3	24999.00	0.00	24999.00	transferencia	emitida	1	2026-03-05 18:07:36.742547	FV-0044	\N	\N	\N	2026-03-05 18:07:36.742547	\N	\N
\.


--
-- Data for Name: historial_costos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_costos (id, producto_id, costo_compra, proveedor_id, fecha_desde, fecha_hasta, creado_en) FROM stdin;
3	3	25.00	2	2026-02-21	2026-02-21	2026-02-21 09:33:38.845326
4	3	15000.00	3	2026-02-21	2026-02-21	2026-02-21 11:53:20.296964
2	2	1500.00	2	2026-02-20	2026-02-22	2026-02-20 19:31:15.879987
5	3	15000.00	1	2026-02-21	2026-02-22	2026-02-21 11:56:13.269295
6	2	1599.00	1	2026-02-22	2026-02-22	2026-02-22 09:29:14.70238
8	2	25000.00	2	2026-02-22	2026-02-22	2026-02-22 09:34:24.865857
9	2	25000.00	2	2026-02-22	2026-02-22	2026-02-22 09:39:46.709305
7	3	16000.00	1	2026-02-22	2026-02-22	2026-02-22 09:29:14.70238
11	3	23000.00	3	2026-02-22	2026-02-22	2026-02-22 10:13:15.839058
12	3	25000.00	1	2026-02-22	2026-02-22	2026-02-22 10:20:22.196582
13	3	18000.00	1	2026-02-22	2026-02-22	2026-02-22 10:24:28.648961
1	1	50.00	1	2025-02-18	2026-02-22	2026-02-18 20:19:59.609743
15	1	8000.00	1	2026-02-22	2026-02-22	2026-02-22 15:50:49.428712
10	2	25000.00	1	2026-02-22	2026-02-22	2026-02-22 10:09:32.82617
17	2	8500.00	1	2026-02-22	2026-02-22	2026-02-22 16:07:46.271557
18	2	8000.00	1	2026-02-22	2026-02-23	2026-02-22 16:39:32.640053
19	2	8000.00	1	2026-02-23	2026-02-23	2026-02-23 00:59:48.915363
20	2	8000.00	2	2026-02-23	2026-02-26	2026-02-23 15:45:00.337123
21	2	8000.00	1	2026-02-26	2026-02-26	2026-02-26 10:57:58.175687
22	2	9000.00	1	2026-02-26	2026-02-26	2026-02-26 12:32:47.369559
23	2	9000.00	1	2026-02-26	2026-02-26	2026-02-26 17:04:40.014546
24	2	9000.00	2	2026-02-26	2026-02-26	2026-02-26 17:06:28.399335
25	2	9000.00	1	2026-02-26	2026-02-27	2026-02-26 18:06:03.729936
26	2	9000.00	2	2026-02-27	2026-02-27	2026-02-27 09:03:49.873881
14	3	17000.00	3	2026-02-22	2026-02-27	2026-02-22 11:23:12.273069
27	2	9000.00	2	2026-02-27	2026-02-27	2026-02-27 16:28:14.898998
29	2	9000.00	1	2026-02-27	2026-02-27	2026-02-27 16:57:28.821589
16	1	100.00	1	2026-02-22	2026-02-27	2026-02-22 16:03:18.103696
28	3	15000.00	3	2026-02-27	2026-02-27	2026-02-27 16:49:02.220654
30	2	9000.00	1	2026-02-27	2026-02-28	2026-02-27 17:02:43.609044
34	4	1500.00	1	2026-02-28	\N	2026-02-28 17:40:56.999825
32	3	15000.00	3	2026-02-27	2026-02-28	2026-02-27 20:04:13.204457
35	3	1500.00	3	2026-02-28	\N	2026-02-28 17:42:28.370438
31	1	16000.00	1	2026-02-27	2026-02-28	2026-02-27 17:18:51.20616
33	2	9000.00	2	2026-02-28	2026-03-01	2026-02-28 17:40:17.858427
37	2	9000.00	1	2026-03-01	2026-03-01	2026-02-28 23:17:31.911888
38	2	1000.00	1	2026-03-01	2026-03-01	2026-02-28 23:30:39.029302
39	2	5000.00	2	2026-03-01	2026-03-01	2026-03-01 11:37:53.337445
36	1	16000.00	2	2026-02-28	2026-03-01	2026-02-28 17:43:16.437517
41	1	16000.00	1	2026-03-01	\N	2026-03-01 20:06:04.191028
42	6	1500.00	11	2026-03-01	2026-03-01	2026-03-05 16:15:24.995362
43	6	1500.00	11	2026-03-01	2026-03-04	2026-03-05 16:43:31.572004
40	2	10000.00	5	2026-03-01	2026-03-01	2026-03-01 12:58:31.04703
45	2	10000.00	2	2026-03-01	\N	2026-03-06 09:37:08.706878
44	6	1500.00	11	2026-03-04	2026-03-06	2026-03-05 16:47:53.256197
46	6	5000.00	2	2026-03-06	\N	2026-03-06 10:55:53.767139
47	8	3500.00	2	2026-03-06	2026-03-02	2026-03-06 10:59:27.487037
48	8	3500.00	1	2026-03-02	2026-03-05	2026-03-06 11:03:35.451052
49	8	10000.00	1	2026-03-05	2026-03-05	2026-03-06 11:04:22.490238
50	8	7000.00	2	2026-03-05	2026-03-06	2026-03-06 11:07:04.830798
51	8	3500.00	2	2026-03-06	2026-03-04	2026-03-06 11:10:32.3688
52	8	3500.00	2	2026-03-04	2026-03-06	2026-03-06 11:27:49.100758
53	8	5500.00	1	2026-03-06	\N	2026-03-06 12:42:27.887008
\.


--
-- Data for Name: historial_margenes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.historial_margenes (id, producto_id, margen_anterior, margen_nuevo, precio_costo_anterior, precio_costo_nuevo, precio_venta_anterior, precio_venta_nuevo, usuario_id, motivo, creado_en) FROM stdin;
1	1	25.00	35.00	1600.00	1600.00	2000.00	2199.00	\N	test_api	2026-02-21 22:24:27.692908
2	1	35.00	30.00	1600.00	1600.00	2199.00	2099.00	\N	test_masivo	2026-02-21 22:24:49.293616
3	2	30.00	30.00	1599.00	1599.00	2078.70	2099.00	\N	test_fix	2026-02-21 22:37:48.471309
4	2	30.00	30.10	1599.00	1599.00	2099.00	2099.00	\N	manual	2026-02-21 22:47:00.164642
5	2	30.10	4.00	1599.00	1599.00	2099.00	1699.00	\N	manual	2026-02-21 22:47:11.645052
6	2	4.00	40.00	1599.00	1599.00	1699.00	2199.00	\N	manual	2026-02-21 22:47:16.129515
7	2	40.00	39.90	1599.00	1599.00	2199.00	2199.00	\N	manual	2026-02-21 22:47:54.751943
8	2	39.90	40.00	1599.00	1599.00	2199.00	2199.00	\N	manual	2026-02-21 22:47:56.649485
9	2	40.00	39.90	1599.00	1599.00	2199.00	2199.00	\N	manual	2026-02-21 22:47:59.366837
10	2	39.90	2.00	1599.00	1599.00	2199.00	1599.00	\N	manual	2026-02-21 22:48:08.200217
11	2	2.00	25.00	1599.00	1599.00	1599.00	1999.00	\N	manual	2026-02-21 22:48:12.874523
12	2	25.00	25.00	1599.00	1599.00	1999.00	1999.00	\N	actualizacion_masiva	2026-02-21 22:55:57.531221
13	2	25.00	50.00	1599.00	1599.00	1999.00	2399.00	\N	manual	2026-02-21 22:56:34.191032
14	3	120.00	25.00	1500.00	1500.00	3300.00	1899.00	\N	manual	2026-02-21 22:57:49.113472
15	2	50.00	35.00	1599.00	1599.00	2399.00	2199.00	\N	test_ux - minorista	2026-02-21 23:27:18.762405
16	2	25.00	20.00	1599.00	1599.00	0.00	1899.00	\N	test_ux - mayorista	2026-02-21 23:27:18.762405
17	2	35.00	45.00	1599.00	1599.00	2199.00	2299.00	\N	manual - minorista	2026-02-21 23:30:56.297488
18	2	20.00	25.00	1599.00	1599.00	1899.00	1999.00	\N	manual - mayorista	2026-02-21 23:30:56.297488
19	2	45.00	60.00	1599.00	1599.00	2299.00	2599.00	\N	manual - minorista	2026-02-22 00:02:42.639666
20	2	25.00	25.00	1599.00	1599.00	1999.00	1999.00	\N	manual - mayorista	2026-02-22 00:02:42.639666
21	2	60.00	30.00	1599.00	1599.00	2599.00	2099.00	\N	manual - minorista	2026-02-22 00:49:41.021394
22	2	25.00	25.00	1599.00	1599.00	1999.00	1999.00	\N	manual - mayorista	2026-02-22 00:49:41.021394
23	1	30.00	50.00	1600.00	1600.00	2099.00	2399.00	\N	manual - minorista	2026-02-22 00:54:18.898419
24	1	20.00	20.00	1600.00	1600.00	0.00	1899.00	\N	manual - mayorista	2026-02-22 00:54:18.898419
25	3	25.00	25.00	1500.00	1500.00	1899.00	1899.00	\N	manual - minorista	2026-02-22 01:09:39.573186
26	3	110.00	50.00	1500.00	1500.00	0.00	2199.00	\N	manual - mayorista	2026-02-22 01:09:39.573186
27	4	25.00	100.00	1500.00	1500.00	1899.00	2999.00	\N	manual - minorista	2026-02-22 01:10:10.891945
28	4	20.00	20.00	1500.00	1500.00	0.00	1799.00	\N	manual - mayorista	2026-02-22 01:10:10.891945
29	3	25.00	50.00	1500.00	1500.00	1899.00	2199.00	\N	manual - minorista	2026-02-22 01:40:54.253312
30	3	50.00	25.00	1500.00	1500.00	2199.00	1899.00	\N	manual - mayorista	2026-02-22 01:40:54.253312
31	3	120.00	150.00	1500.00	1500.00	2199.00	3799.00	\N	manual - minorista	2026-02-22 02:07:50.1028
32	3	50.00	75.00	1500.00	1500.00	1899.00	2599.00	\N	manual - mayorista	2026-02-22 02:07:50.1028
33	2	30.00	50.00	25000.00	25000.00	32499.00	37499.00	\N	manual - minorista	2026-02-22 10:10:09.043549
34	2	25.00	25.00	25000.00	25000.00	1999.00	31199.00	\N	manual - mayorista	2026-02-22 10:10:09.043549
35	1	50.00	55.00	16000.00	16000.00	23999.00	24799.00	\N	manual - minorista	2026-03-04 10:26:33.893157
36	1	20.00	20.00	16000.00	16000.00	1899.00	19199.00	\N	manual - mayorista	2026-03-04 10:26:33.893157
37	6	25.00	55.00	1500.00	1500.00	1899.00	2299.00	\N	manual - minorista	2026-03-05 16:48:24.719853
38	6	20.00	35.00	1500.00	1500.00	0.00	1999.00	\N	manual - mayorista	2026-03-05 16:48:24.719853
\.


--
-- Data for Name: listas_precios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.listas_precios (id, nombre, tipo, vigencia_desde, vigencia_hasta, activa, creado_en, descripcion, tipo_cliente, categorias_incluidas) FROM stdin;
\.


--
-- Data for Name: movimientos_caja; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_caja (id, fecha, tipo_movimiento, categoria_caja_id, descripcion, monto, tipo, proveedor_id, medio_pago, comprobante_nro, usuario_id, creado_en, cliente_id, caja_id) FROM stdin;
1	2026-02-27	ingreso	1	dadad	15000.00	ingreso	\N	efectivo	\N	\N	2026-02-27 22:54:09.416931	\N	1
2	2026-02-27	egreso	18	comida	15000.00	egreso	\N	efectivo	\N	\N	2026-02-27 22:54:35.798409	\N	1
3	2026-02-28	ingreso	1	ventas	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 07:55:24.18214	\N	2
4	2026-02-28	egreso	5	pago luz de febrero	15000.00	egreso	\N	transferencia	\N	\N	2026-02-28 07:55:58.832996	\N	2
5	2026-02-28	ingreso	11	me pago alguien	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 07:57:26.287308	\N	2
6	2026-02-28	egreso	17	le pague a alguien	2000.00	egreso	\N	efectivo	\N	\N	2026-02-28 07:57:58.376914	\N	2
7	2026-02-28	ingreso	2	cobro nuez	10000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 08:04:59.987301	\N	2
8	2026-02-28	egreso	18	GASTOS	20000.00	egreso	\N	efectivo	\N	\N	2026-02-28 08:05:33.226105	\N	2
9	2026-02-28	ingreso	1	ddsa	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 08:44:13.392809	\N	2
10	2026-02-28	egreso	19	212121	2000.00	egreso	\N	efectivo	\N	\N	2026-02-28 08:44:29.240882	\N	2
11	2026-02-28	ingreso	1	pago	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 10:24:06.904003	\N	2
12	2026-02-28	ingreso	2	pago caja b	1500.00	ingreso	\N	efectivo	\N	\N	2026-02-28 10:26:47.685262	\N	2
13	2026-02-28	ingreso	2	prueba	15000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 11:00:36.949958	\N	2
14	2026-02-28	ingreso	1	sss	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 11:16:35.564359	\N	2
15	2026-02-28	ingreso	1	pago	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 11:35:02.537276	\N	4
16	2026-02-28	egreso	18	comida	5000.00	egreso	\N	efectivo	\N	\N	2026-02-28 11:36:27.902747	\N	5
17	2026-02-28	venta	20	Venta - Factura 1-00000012	5000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 17:06:53.126514	5	8
18	2026-02-28	venta	20	Venta - Factura 1-00000015 (transferencia)	2000.00	ingreso	\N	transferencia	\N	\N	2026-02-28 17:22:41.219709	5	8
19	2026-02-28	venta	20	Venta - Factura 1-00000016 (efectivo)	4000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 17:23:42.569409	5	8
20	2026-02-28	venta	20	Venta - Factura 1-00000017 (cheque)	1200.00	ingreso	\N	cheque	\N	\N	2026-02-28 17:24:46.591678	4	8
21	2026-02-28	compra	3	Compra a proveedor - Factura 2-23 (efectivo)	9000.00	egreso	2	efectivo	\N	\N	2026-02-28 17:40:17.858427	\N	8
22	2026-02-28	compra	3	Compra a proveedor - Factura 3-25 (transferencia)	1500.00	egreso	1	transferencia	\N	\N	2026-02-28 17:40:56.999825	\N	8
23	2026-02-28	compra	3	Compra a proveedor - Factura 1-26 (cheque)	1500.00	egreso	3	cheque	\N	\N	2026-02-28 17:42:28.370438	\N	8
24	2026-02-28	pago	3	Pago a proveedor - efectivo	5000.00	egreso	2	efectivo	\N	\N	2026-02-28 18:23:44.916233	\N	8
25	2026-02-28	cobro	1	Cobro a cliente - transferencia	5000.00	ingreso	\N	transferencia	\N	\N	2026-02-28 18:24:58.120339	1	8
26	2026-02-28	venta	20	Venta - Factura 1-00000019 (transferencia)	11199.00	ingreso	\N	transferencia	\N	\N	2026-02-28 20:51:36.433257	1	8
27	2026-02-28	venta	20	Venta - Factura 1-00000024 (transferencia)	1000.00	ingreso	\N	transferencia	\N	\N	2026-02-28 22:22:05.590695	1	9
28	2026-02-28	venta	20	Venta - Factura 1-00000025 (efectivo)	2000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 22:23:01.546126	1	9
29	2026-02-28	venta	20	Venta - Factura 1-00000026 (efectivo)	1000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 22:57:19.066782	1	9
30	2026-02-28	venta	20	Venta - Factura 1-00000027 (efectivo)	2599.00	ingreso	\N	efectivo	\N	\N	2026-02-28 23:19:18.25563	1	9
31	2026-02-28	compra	3	Compra a proveedor - Factura 2-155 (efectivo)	1000.00	egreso	1	efectivo	\N	\N	2026-02-28 23:30:39.029302	\N	9
32	2026-03-01	pago	3	Pago a proveedor - efectivo	5000.00	egreso	1	efectivo	\N	\N	2026-02-28 23:33:26.056676	\N	9
33	2026-03-01	cobro	1	Cobro a cliente - efectivo	10000.00	ingreso	\N	efectivo	\N	\N	2026-02-28 23:34:29.711535	5	9
34	2026-03-01	pago	3	Pago a proveedor - efectivo	4000.00	egreso	1	efectivo	\N	\N	2026-02-28 23:36:58.612311	\N	9
35	2026-03-01	venta	20	Venta - Factura 1-00000028 (efectivo)	1199.00	ingreso	\N	efectivo	\N	\N	2026-03-01 00:19:39.757397	1	10
36	2026-03-01	venta	20	Venta - Factura 1-00000029 (efectivo)	3799.00	ingreso	\N	efectivo	\N	\N	2026-03-01 00:45:53.597778	5	10
37	2026-03-01	cobro	1	Cobro a cliente - transferencia	50000.00	ingreso	\N	transferencia	\N	\N	2026-03-01 01:47:28.835969	5	10
38	2026-03-01	cobro	1	Cobro a cliente - efectivo	10000.00	ingreso	\N	efectivo	\N	\N	2026-03-01 01:55:51.140377	5	10
39	2026-03-01	cobro	1	Cobro a cliente - pago parcial	50000.00	ingreso	\N	transferencia	\N	\N	2026-03-01 02:22:38.386082	5	10
40	2026-03-01	cobro	1	Cobro a cliente - PRUEBA	5512.00	ingreso	\N	transferencia	\N	\N	2026-03-01 02:50:51.380518	5	10
41	2026-03-01	compra	3	Compra a proveedor - Factura 3-2 (transferencia)	10000.00	egreso	2	transferencia	\N	\N	2026-03-01 11:37:53.337445	\N	10
42	2026-03-01	venta	20	Venta - Factura 1-00000031 (transferencia)	3799.00	ingreso	\N	transferencia	\N	\N	2026-03-01 11:52:55.318667	7	10
43	2026-03-01	venta	20	Venta - Factura 1-00000032 (transferencia)	2599.00	ingreso	\N	transferencia	\N	\N	2026-03-01 12:55:56.039578	8	10
44	2026-03-02	cobro	1	Cobro a cliente - efectivo	50000.00	ingreso	\N	efectivo	\N	\N	2026-03-02 07:55:33.886032	5	11
45	2026-03-02	cobro	1	Cobro a cliente - transferencia	50000.00	ingreso	\N	transferencia	\N	\N	2026-03-02 08:10:04.797973	4	11
46	2026-03-02	cobro	1	Cobro a cliente - para ver que onda	23000.00	ingreso	\N	transferencia	\N	\N	2026-03-02 09:02:02.681745	4	11
47	2026-03-02	cobro	1	Cobro a cliente - transferencia	25000.00	ingreso	\N	transferencia	\N	\N	2026-03-02 09:28:16.974036	4	11
48	2026-03-02	cobro	1	Cobro a cliente - efectivo	15000.00	ingreso	\N	efectivo	\N	\N	2026-03-02 11:51:04.4466	4	11
49	2026-03-02	cobro	1	Cobro a cliente - cheque	10000.00	ingreso	\N	cheque	\N	\N	2026-03-02 11:58:56.16972	4	11
50	2026-03-02	pago	3	Pago a proveedor - transferencia	15000.00	egreso	1	transferencia	\N	\N	2026-03-02 12:00:43.875708	\N	11
51	2026-03-02	cobro	1	Cobro a cliente - transferencia	14700.00	ingreso	\N	transferencia	\N	\N	2026-03-02 12:23:07.26937	4	11
52	2026-03-02	cobro	1	Cobro a cliente - transferencia	10500.00	ingreso	\N	transferencia	\N	\N	2026-03-02 12:44:01.27492	4	11
53	2026-03-02	cobro	1	Cobro a cliente - transferencia	5000.00	ingreso	\N	transferencia	\N	\N	2026-03-02 12:58:55.774571	4	11
54	2026-03-02	pago	3	Pago a proveedor - transferencia	23555.00	egreso	1	transferencia	\N	\N	2026-03-02 13:00:46.681653	\N	11
55	2026-03-02	venta	20	Venta - Factura 1-00000034 (transferencia)	77970.00	ingreso	\N	transferencia	\N	\N	2026-03-02 18:28:50.531839	1	11
56	2026-03-04	ingreso	1	cobro en cuta corriente a lo de juana	30000.00	ingreso	\N	transferencia	\N	\N	2026-03-04 21:33:36.28962	\N	12
57	2026-03-05	venta	20	Venta - Factura 1-00000040 (transferencia)	23999.00	ingreso	\N	transferencia	\N	\N	2026-03-05 08:14:27.570672	1	14
58	2026-03-05	venta	20	Venta - Factura 1-00000041 (transferencia)	12499.00	ingreso	\N	transferencia	\N	\N	2026-03-05 09:08:48.49922	6	14
59	2026-03-05	venta	20	Venta - Factura 1-00000042 (transferencia)	12499.00	ingreso	\N	transferencia	\N	\N	2026-03-05 10:05:29.004369	4	14
60	2026-03-05	venta	20	Venta - Factura 1-00000043 (transferencia)	2999.00	ingreso	\N	transferencia	\N	\N	2026-03-05 10:15:57.843265	3	14
61	2026-03-05	compra	3	Compra a proveedor - Factura 123-12312312 (transferencia)	1500.00	egreso	11	transferencia	\N	\N	2026-03-05 16:15:24.995362	\N	14
62	2026-03-05	venta	20	Venta - Factura 1-00000044 (transferencia)	24999.00	ingreso	\N	transferencia	\N	\N	2026-03-05 18:07:36.742547	3	14
63	2026-03-06	compra	3	Compra a proveedor - Factura 2-1265 (transferencia)	5000.00	egreso	2	transferencia	\N	\N	2026-03-06 10:55:53.767139	\N	15
64	2026-03-06	compra	3	Compra a proveedor - Factura 2333-5555 (transferencia)	3500.00	egreso	2	transferencia	\N	\N	2026-03-06 10:59:27.487037	\N	15
65	2026-03-06	compra	3	Compra a proveedor - Factura 25-333 (transferencia)	3500.00	egreso	1	transferencia	\N	\N	2026-03-06 11:03:35.451052	\N	15
66	2026-03-06	compra	3	Compra a proveedor - Factura 25-99992 (transferencia)	10000.00	egreso	1	transferencia	\N	\N	2026-03-06 11:04:22.490238	\N	15
67	2026-03-06	compra	3	Compra a proveedor - Factura 1-2225456 (transferencia)	7000.00	egreso	2	transferencia	\N	\N	2026-03-06 11:07:04.830798	\N	15
68	2026-03-06	compra	3	Compra a proveedor - Factura 1-2666 (transferencia)	3500.00	egreso	2	transferencia	\N	\N	2026-03-06 11:10:32.3688	\N	15
69	2026-03-06	compra	3	Compra a proveedor - Factura 9-999 (transferencia)	3500.00	egreso	2	transferencia	\N	\N	2026-03-06 11:27:49.100758	\N	15
70	2026-03-06	compra	3	Compra a proveedor - Factura 2-2323232 (transferencia)	5500.00	egreso	1	transferencia	\N	\N	2026-03-06 12:42:27.887008	\N	15
71	2026-03-06	cobro	1	Cobro a cliente - transferencia	99478.00	ingreso	\N	transferencia	\N	\N	2026-03-06 12:43:20.479783	5	15
\.


--
-- Data for Name: nota_credito_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nota_credito_detalles (id, nota_credito_id, producto_id, cantidad, precio_unitario, iva_porcentaje, subtotal) FROM stdin;
1	1	1	2.000	150.00	21.00	300.00
2	2	1	1.000	100.00	21.00	100.00
3	3	2	1.000	100.00	21.00	100.00
4	5	3	1.000	100.00	21.00	100.00
5	6	2	2.000	100.00	21.00	200.00
6	7	2	4.000	11999.00	21.00	47996.00
\.


--
-- Data for Name: notas_credito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notas_credito (id, factura_id, punto_venta, numero_nota_credito, tipo_comprobante, fecha, cliente_id, motivo, subtotal, iva, total, medio_pago, estado, usuario_id, creado_en) FROM stdin;
1	2	1	1	NC	2026-02-19	1	Devolución de productos dañados	300.00	63.00	363.00	efectivo	emitida	\N	2026-02-19 08:39:11.404613
2	\N	1	2	NC	2026-02-20	3	devolucion sin motivo	100.00	21.00	121.00	efectivo	emitida	\N	2026-02-20 09:01:54.913864
3	26	1	3	NC	2026-02-26	4	devolucio	100.00	21.00	121.00	efectivo	emitida	\N	2026-02-26 18:13:43.896492
5	31	1	4	NC	2026-02-26	3	SSSSS	100.00	0.00	100.00	transferencia	emitida	\N	2026-02-26 22:14:42.958828
6	27	1	5	NC	2026-02-27	1	sss	200.00	0.00	200.00	transferencia	emitida	\N	2026-02-27 07:53:57.7936
7	9	1	6	NC	2026-02-27	3	aaaa	47996.00	0.00	47996.00	cta_cte	emitida	\N	2026-02-27 08:11:59.621756
\.


--
-- Data for Name: pagos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pagos (id, fecha, cliente_id, proveedor_id, monto, medio_pago, tipo, descripcion, usuario_id, creado_en) FROM stdin;
\.


--
-- Data for Name: pedido_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedido_detalles (id, pedido_id, producto_id, cantidad, precio_costo, subtotal, recibido_cantidad, estado) FROM stdin;
1	1	1	6	100.00	600.00	0	pendiente
2	1	2	5	8000.00	40000.00	0	pendiente
3	2	2	10	8000.00	80000.00	0	pendiente
4	2	3	10	17000.00	170000.00	0	pendiente
5	3	2	10	8000.00	80000.00	0	pendiente
11	6	2	10	8000.00	80000.00	0	pendiente
12	6	3	10	17000.00	170000.00	0	pendiente
13	7	1	10	16000.00	160000.00	0	pendiente
14	8	1	10	16000.00	160000.00	0	pendiente
15	8	3	10	1500.00	15000.00	0	pendiente
17	10	2	10	10000.00	100000.00	0	pendiente
18	10	3	10	1500.00	15000.00	0	pendiente
21	12	2	10	10000.00	100000.00	0	pendiente
22	12	3	10	1500.00	15000.00	0	pendiente
25	14	2	10	10000.00	100000.00	0	pendiente
26	14	1	10	16000.00	160000.00	0	pendiente
27	15	3	10	1500.00	15000.00	0	pendiente
28	15	2	10	10000.00	100000.00	0	pendiente
31	17	2	10	10000.00	100000.00	0	pendiente
32	17	1	10	16000.00	160000.00	0	pendiente
37	20	2	10	10000.00	100000.00	0	pendiente
38	21	2	10	10000.00	100000.00	0	pendiente
\.


--
-- Data for Name: pedidos_proveedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos_proveedor (id, numero_interno, fecha_pedido, proveedor_id, estado, total_estimado, observaciones, usuario_id, creado_en, recibido_en, fecha_entrega_estimada) FROM stdin;
1	PED-0001	2026-02-24	2	recibido	40600.00	\N	\N	2026-02-24 11:07:55.679207	2026-02-24 11:10:44.804937	\N
2	PED-0002	2026-02-24	1	recibido	250000.00	\N	\N	2026-02-24 11:41:28.037551	2026-02-24 11:42:08.018786	\N
3	PED-0003	2026-02-24	2	recibido	80000.00	\N	\N	2026-02-24 11:42:41.005677	2026-02-24 11:42:46.182349	\N
6	PED-0006	2026-02-24	2	recibido	250000.00	\N	\N	2026-02-24 16:15:20.795024	2026-02-24 16:58:16.330902	\N
7	PED-0007	2026-02-27	1	recibido	160000.00	\N	\N	2026-02-27 17:22:32.133108	2026-02-27 17:23:54.568451	\N
10	PED-0010	2026-03-01	2	recibido	115000.00	\N	\N	2026-03-01 16:28:07.130479	2026-03-01 16:32:23.32704	\N
8	PED-0008	2026-03-01	1	recibido	175000.00	\N	\N	2026-03-01 16:05:55.240878	2026-03-01 16:54:56.386724	\N
12	PED-0011	2026-03-01	2	recibido	115000.00	\N	\N	2026-03-01 16:55:12.081118	2026-03-01 17:19:29.178555	\N
15	PED-0015	2026-03-01	2	recibido	115000.00	\N	\N	2026-03-01 17:19:19.731569	2026-03-01 18:19:21.760867	\N
14	PED-0014	2026-03-01	2	recibido	260000.00	\N	\N	2026-03-01 17:09:00.458038	2026-03-03 18:30:56.126981	\N
17	PED-0016	2026-03-03	2	recibido	260000.00	\N	\N	2026-03-03 18:31:09.262139	2026-03-03 19:36:12.111991	\N
20	PED-0018	2026-03-04	4	recibido	100000.00	\N	\N	2026-03-04 11:26:29.486722	2026-03-06 09:41:12.008094	\N
21	PED-0021	2026-03-06	2	recibido	100000.00	\N	\N	2026-03-06 09:37:34.208976	2026-03-06 09:41:14.55765	\N
\.


--
-- Data for Name: producto_proveedor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.producto_proveedor (id, producto_id, proveedor_id, es_principal, costo_compra, creado_en) FROM stdin;
1	1	1	t	\N	2026-03-01 18:16:16.17975
2	3	1	t	\N	2026-03-01 18:16:16.17975
3	2	2	t	\N	2026-03-01 18:16:16.17975
\.


--
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, sku, nombre, categoria_id, proveedor_id, unidad_medida, stock_actual, stock_minimo, activo, creado_en, actualizado_en, costo_promedio, precio_venta, precio_costo, iva_compra, iva_venta, margen_personalizado, margen_personalizado_mayorista, precio_venta_mayorista) FROM stdin;
3	02	Palo Azul	19	1	g	938.000	500.000	t	2026-02-20 22:14:39.865031	2026-03-03 14:29:40.246024	1500.00	3799	0	f	f	150.00	75.00	2599.00
1	TEST001	Producto Test	7	1	unidad	4.000	8.000	t	2026-02-18 19:57:56.828095	2026-03-04 13:26:33.894479	16000.00	24799	0	f	f	55.00	20.00	19199.00
4	\N	Producto Test POST 2	7	\N	unidad	80.000	0.000	t	2026-02-22 00:45:00.236003	2026-03-05 17:26:22.088174	1800	2250.0	0	f	f	100.00	20.00	1799.00
5	2530	ALMENDRAS PELADAS	4	2	g	497.900	100.000	t	2026-03-04 10:29:43.697083	2026-03-05 18:51:12.833187	23076	29998.8	0	f	f	\N	\N	0.00
7	ak222	Nuevo Nombre de producto	6	3	unidad	2.000	10.000	t	2026-03-06 09:53:05.970874	2026-03-06 09:53:05.970874	2500.0	3199	0	f	f	\N	\N	0.00
6	999	PARA PROBAR BACKUP	2	1	l	11.000	9.000	t	2026-03-04 19:39:52.687891	2026-03-06 13:55:53.781338	5000.00	7799	0	f	f	55.00	35.00	1999.00
2	2	Nuez Cobriza	4	2	kg	14.000	19.000	t	2026-02-20 09:04:18.366172	2026-03-06 10:56:52.254456	13300	17290.0	0	f	f	50.00	25.00	31199.00
8	222	AVEA INSTANTANEA	3	1	kg	32.000	15.000	t	2026-03-06 09:57:29.202751	2026-03-06 15:42:27.90903	5500.00	6899	0	f	f	\N	\N	0.00
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id, nombre, contacto, telefono, email, website, creado_en, cuit, condicion_iva, ingresos_brutos, localidad) FROM stdin;
1	Proveedor Test	Juan	123456789	juan@proveedor.com	\N	2026-02-18 19:56:33.598162	\N	\N	\N	\N
2	GP Futas	Ignacio	3517623825	gpfrutas@gmail.com	\N	2026-02-19 19:42:20.714998	\N	\N	\N	\N
3	prueba	almao	03525308250	waltercamino@hotmail.com	\N	2026-02-19 19:45:13.494133	\N	\N	\N	\N
4	Nuevo Proveedor modal	Gabriel	03525308250	waltercamino@hotmail.com	\N	2026-03-01 11:38:53.650019	\N	\N	\N	\N
5	Nuevo Proveedor Modal	Agustin	253356321		\N	2026-03-01 12:57:38.656618	\N	\N	\N	\N
8	proveedor formato cuit	Walter	03525308250	waltercamino@hotmail.com	\N	2026-03-02 08:03:44.279656	23206213809	\N	\N	\N
11	Mariela PN	Mariela			\N	2026-03-05 08:08:18.61535	20123456789	\N	\N	\N
12	Andnuts	nadie			\N	2026-03-05 12:59:19.583334	20123456789	\N	\N	\N
\.


--
-- Data for Name: recibo_imputaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recibo_imputaciones (id, recibo_id, venta_id, compra_id, monto_imputado) FROM stdin;
1	3	14	\N	11999.00
2	3	9	\N	88001.00
3	4	\N	23	4000.00
4	11	\N	28	60000.00
5	12	\N	28	20000.00
6	14	17	\N	17990.00
7	14	18	\N	2010.00
8	15	18	\N	15980.00
\.


--
-- Data for Name: recibos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recibos (id, numero_interno, tipo, cliente_id, proveedor_id, fecha, monto, medio_pago, estado, observaciones, creado_en, usuario_id, anulado_por, fecha_anulacion, motivo_anulacion) FROM stdin;
3	R-0001	cobro	3	\N	2026-02-23	100000.00	efectivo	registrado	\N	2026-02-23 00:41:59.629961	\N	\N	\N	\N
4	R-0004	pago	\N	1	2026-02-23	4000.00	efectivo	registrado	\N	2026-02-23 00:58:44.07265	\N	\N	\N	\N
5	R-0005	pago	\N	1	2026-02-23	12000.00	efectivo	registrado	\N	2026-02-23 10:41:32.425589	\N	\N	\N	\N
8	R-0008	pago	\N	3	2026-02-23	10000.00	efectivo	registrado	\N	2026-02-23 11:13:44.98138	\N	\N	\N	\N
7	R-0007	cobro	3	\N	2026-02-23	10000.00	efectivo	anulado	\N	2026-02-23 10:53:28.790747	\N	\N	\N	\N
9	R-0009	pago	\N	2	2026-02-23	10000.00	efectivo	anulado	\N	2026-02-23 11:14:27.910187	\N	\N	\N	\N
6	R-0006	cobro	3	\N	2026-02-23	40000.00	efectivo	anulado	\N	2026-02-23 10:44:22.542325	\N	\N	\N	\N
11	R-0011	pago	\N	2	2026-02-23	60000.00	efectivo	registrado	\N	2026-02-23 15:55:16.610506	\N	\N	\N	\N
12	R-0012	pago	\N	2	2026-02-23	30000.00	efectivo	registrado	\N	2026-02-23 15:56:35.571841	\N	\N	\N	\N
13	R-0013	pago	\N	2	2026-02-23	100000.00	efectivo	anulado	\N	2026-02-23 15:58:10.056743	\N	\N	2026-02-23 18:59:14.520497	mal cargado
15	R-0015	cobro	4	\N	2026-02-23	16000.00	efectivo	anulado	\N	2026-02-23 16:08:37.082139	\N	\N	2026-02-23 19:08:56.829993	monto mal cargado
16	R-0016	cobro	4	\N	2026-02-23	50000.00	efectivo	registrado	\N	2026-02-23 16:46:33.410827	\N	\N	\N	\N
17	R-0017	pago	\N	2	2026-02-23	100000.00	efectivo	registrado	\N	2026-02-23 16:47:21.198855	\N	\N	\N	\N
10	R-0010	pago	\N	2	2026-02-23	10000.00	efectivo	anulado	\N	2026-02-23 12:00:17.037191	\N	\N	2026-02-23 19:47:55.456869	mal cargado
14	R-0014	cobro	4	\N	2026-02-23	20000.00	efectivo	anulado	\N	2026-02-23 16:07:36.299138	\N	\N	2026-02-23 19:49:23.065923	mal cargado
18	R-0018	cobro	1	\N	2026-02-25	10000.00	efectivo	registrado	\N	2026-02-25 20:12:03.39962	\N	\N	\N	\N
19	R-0019	cobro	4	\N	2026-02-26	50000.00	efectivo	registrado	\N	2026-02-26 18:10:18.187521	\N	\N	\N	\N
20	R-0020	cobro	3	\N	2026-02-26	10000.00	efectivo	registrado	\N	2026-02-26 18:49:04.220668	\N	\N	\N	\N
21	R-0021	pago	\N	1	2026-02-26	20000.00	efectivo	registrado	\N	2026-02-26 18:50:10.657461	\N	\N	\N	\N
22	R-0022	pago	\N	1	2026-02-26	17500.00	efectivo	registrado	\N	2026-02-26 18:51:39.944943	\N	\N	\N	\N
23	R-0023	cobro	1	\N	2026-02-26	1.00	transferencia	registrado	\N	2026-02-26 19:48:40.104656	\N	\N	\N	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, nombre, descripcion, permisos) FROM stdin;
1	admin	Administrador total del sistema	["todos"]
2	vendedor	Solo ventas y consulta de precios	["ver_productos", "crear_venta", "ver_caja"]
3	administrador	Gestión de precios y caja	["ver_productos", "editar_precios", "ver_caja", "editar_caja"]
\.


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, username, password_hash, email, nombre_completo, rol_id, activo, ultimo_acceso, creado_en) FROM stdin;
6	Vendedor	$2b$12$JIgeN83v0jNC.UKnpFwQ7.i2t/fTkGvUrKIu.lLAJwGTyoLd3aM5a	waltercamino@hotmail.com	Walter	2	t	2026-03-04 10:06:04.741042	2026-03-04 10:05:08.397495
5	Administrador	$2b$12$e7X6HANduw03EGd0j.wbQ.YD0FHRVEyve7.hE1lMTL1Bus9JzRoSO	Administrador@gmail.com	Administrador	3	t	2026-02-20 18:34:59.02338	2026-02-20 18:33:40.060839
1	admin	$2b$12$W5jm/DGAwkDvztQrYZjHvO3KWmDRvKFD61qZ9ZF2E.xFN4riaOGY2	\N	Administrador	1	t	2026-03-06 16:41:30.321656	2026-02-17 20:46:05.682645
\.


--
-- Name: caja_dia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.caja_dia_id_seq', 15, true);


--
-- Name: cajas_dia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cajas_dia_id_seq', 1, false);


--
-- Name: categoria_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categoria_caja_id_seq', 7, true);


--
-- Name: categorias_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_caja_id_seq', 20, true);


--
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 25, true);


--
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 10, true);


--
-- Name: compra_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compra_detalles_id_seq', 55, true);


--
-- Name: compras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.compras_id_seq', 62, true);


--
-- Name: configuracion_empresa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.configuracion_empresa_id_seq', 1, true);


--
-- Name: cuenta_corriente_cliente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cuenta_corriente_cliente_id_seq', 1, false);


--
-- Name: cuenta_corriente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cuenta_corriente_id_seq', 180, true);


--
-- Name: cuenta_corriente_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cuenta_corriente_proveedor_id_seq', 1, false);


--
-- Name: detalles_lista_precios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalles_lista_precios_id_seq', 1, false);


--
-- Name: factura_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.factura_detalles_id_seq', 81, true);


--
-- Name: facturas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.facturas_id_seq', 85, true);


--
-- Name: historial_costos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_costos_id_seq', 53, true);


--
-- Name: historial_margenes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.historial_margenes_id_seq', 38, true);


--
-- Name: listas_precios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.listas_precios_id_seq', 47, true);


--
-- Name: movimientos_caja_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_caja_id_seq', 71, true);


--
-- Name: nota_credito_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nota_credito_detalles_id_seq', 6, true);


--
-- Name: notas_credito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notas_credito_id_seq', 7, true);


--
-- Name: pagos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pagos_id_seq', 1, false);


--
-- Name: pedido_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedido_detalles_id_seq', 38, true);


--
-- Name: pedidos_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_proveedor_id_seq', 21, true);


--
-- Name: producto_proveedor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.producto_proveedor_id_seq', 3, true);


--
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 10, true);


--
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 12, true);


--
-- Name: recibo_imputaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recibo_imputaciones_id_seq', 8, true);


--
-- Name: recibos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recibos_id_seq', 23, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- Name: caja_dia caja_dia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.caja_dia
    ADD CONSTRAINT caja_dia_pkey PRIMARY KEY (id);


--
-- Name: cajas_dia cajas_dia_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cajas_dia
    ADD CONSTRAINT cajas_dia_pkey PRIMARY KEY (id);


--
-- Name: categoria_caja categoria_caja_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_caja
    ADD CONSTRAINT categoria_caja_nombre_key UNIQUE (nombre);


--
-- Name: categoria_caja categoria_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria_caja
    ADD CONSTRAINT categoria_caja_pkey PRIMARY KEY (id);


--
-- Name: categorias_caja categorias_caja_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_caja
    ADD CONSTRAINT categorias_caja_nombre_key UNIQUE (nombre);


--
-- Name: categorias_caja categorias_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias_caja
    ADD CONSTRAINT categorias_caja_pkey PRIMARY KEY (id);


--
-- Name: categorias categorias_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_unique UNIQUE (nombre);


--
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- Name: clientes clientes_cuit_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_cuit_key UNIQUE (cuit);


--
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- Name: compra_detalles compra_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra_detalles
    ADD CONSTRAINT compra_detalles_pkey PRIMARY KEY (id);


--
-- Name: compras compras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_pkey PRIMARY KEY (id);


--
-- Name: configuracion_empresa configuracion_empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_empresa
    ADD CONSTRAINT configuracion_empresa_pkey PRIMARY KEY (id);


--
-- Name: cuenta_corriente_cliente cuenta_corriente_cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_cliente
    ADD CONSTRAINT cuenta_corriente_cliente_pkey PRIMARY KEY (id);


--
-- Name: cuenta_corriente cuenta_corriente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente
    ADD CONSTRAINT cuenta_corriente_pkey PRIMARY KEY (id);


--
-- Name: cuenta_corriente_proveedor cuenta_corriente_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_proveedor
    ADD CONSTRAINT cuenta_corriente_proveedor_pkey PRIMARY KEY (id);


--
-- Name: detalles_lista_precios detalles_lista_precios_lista_precios_id_producto_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_lista_precios
    ADD CONSTRAINT detalles_lista_precios_lista_precios_id_producto_id_key UNIQUE (lista_precios_id, producto_id);


--
-- Name: detalles_lista_precios detalles_lista_precios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_lista_precios
    ADD CONSTRAINT detalles_lista_precios_pkey PRIMARY KEY (id);


--
-- Name: factura_detalles factura_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT factura_detalles_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_pkey PRIMARY KEY (id);


--
-- Name: facturas facturas_punto_venta_numero_factura_tipo_comprobante_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_punto_venta_numero_factura_tipo_comprobante_key UNIQUE (punto_venta, numero_factura, tipo_comprobante);


--
-- Name: historial_costos historial_costos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_costos
    ADD CONSTRAINT historial_costos_pkey PRIMARY KEY (id);


--
-- Name: historial_margenes historial_margenes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_margenes
    ADD CONSTRAINT historial_margenes_pkey PRIMARY KEY (id);


--
-- Name: listas_precios listas_precios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.listas_precios
    ADD CONSTRAINT listas_precios_pkey PRIMARY KEY (id);


--
-- Name: movimientos_caja movimientos_caja_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_pkey PRIMARY KEY (id);


--
-- Name: nota_credito_detalles nota_credito_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_credito_detalles
    ADD CONSTRAINT nota_credito_detalles_pkey PRIMARY KEY (id);


--
-- Name: notas_credito notas_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas_credito
    ADD CONSTRAINT notas_credito_pkey PRIMARY KEY (id);


--
-- Name: notas_credito notas_credito_punto_venta_numero_nota_credito_tipo_comproba_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas_credito
    ADD CONSTRAINT notas_credito_punto_venta_numero_nota_credito_tipo_comproba_key UNIQUE (punto_venta, numero_nota_credito, tipo_comprobante);


--
-- Name: pagos pagos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_pkey PRIMARY KEY (id);


--
-- Name: pedido_detalles pedido_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_detalles
    ADD CONSTRAINT pedido_detalles_pkey PRIMARY KEY (id);


--
-- Name: pedidos_proveedor pedidos_proveedor_numero_interno_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_proveedor
    ADD CONSTRAINT pedidos_proveedor_numero_interno_key UNIQUE (numero_interno);


--
-- Name: pedidos_proveedor pedidos_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_proveedor
    ADD CONSTRAINT pedidos_proveedor_pkey PRIMARY KEY (id);


--
-- Name: producto_proveedor producto_proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_proveedor
    ADD CONSTRAINT producto_proveedor_pkey PRIMARY KEY (id);


--
-- Name: producto_proveedor producto_proveedor_producto_id_proveedor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_proveedor
    ADD CONSTRAINT producto_proveedor_producto_id_proveedor_id_key UNIQUE (producto_id, proveedor_id);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: productos productos_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_sku_key UNIQUE (sku);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: recibo_imputaciones recibo_imputaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibo_imputaciones
    ADD CONSTRAINT recibo_imputaciones_pkey PRIMARY KEY (id);


--
-- Name: recibos recibos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_pkey PRIMARY KEY (id);


--
-- Name: roles roles_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_nombre_key UNIQUE (nombre);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_username_key UNIQUE (username);


--
-- Name: idx_cajas_dia_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cajas_dia_estado ON public.cajas_dia USING btree (estado);


--
-- Name: idx_cajas_dia_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cajas_dia_fecha ON public.cajas_dia USING btree (fecha_apertura DESC);


--
-- Name: idx_cc_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cc_cliente ON public.cuenta_corriente_cliente USING btree (cliente_id);


--
-- Name: idx_cc_compra; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cc_compra ON public.cuenta_corriente USING btree (compra_id);


--
-- Name: idx_cc_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cc_fecha ON public.cuenta_corriente USING btree (fecha DESC);


--
-- Name: idx_cc_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cc_proveedor ON public.cuenta_corriente_proveedor USING btree (proveedor_id);


--
-- Name: idx_cc_tipo_entidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cc_tipo_entidad ON public.cuenta_corriente USING btree (tipo, entidad_id);


--
-- Name: idx_cc_venta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cc_venta ON public.cuenta_corriente USING btree (venta_id);


--
-- Name: idx_clientes_cuit; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clientes_cuit ON public.clientes USING btree (cuit);


--
-- Name: idx_clientes_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clientes_tipo ON public.clientes USING btree (tipo_cliente);


--
-- Name: idx_compras_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_compras_fecha ON public.compras USING btree (fecha);


--
-- Name: idx_compras_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_compras_proveedor ON public.compras USING btree (proveedor_id);


--
-- Name: idx_facturas_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facturas_cliente ON public.facturas USING btree (cliente_id);


--
-- Name: idx_facturas_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facturas_estado ON public.facturas USING btree (estado);


--
-- Name: idx_facturas_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facturas_fecha ON public.facturas USING btree (fecha);


--
-- Name: idx_facturas_numero; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_facturas_numero ON public.facturas USING btree (numero_factura);


--
-- Name: idx_historial_margenes_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_margenes_fecha ON public.historial_margenes USING btree (creado_en DESC);


--
-- Name: idx_historial_margenes_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_historial_margenes_producto ON public.historial_margenes USING btree (producto_id);


--
-- Name: idx_listas_precios_activa; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_listas_precios_activa ON public.listas_precios USING btree (activa);


--
-- Name: idx_movimientos_caja_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimientos_caja_id ON public.movimientos_caja USING btree (caja_id);


--
-- Name: idx_movimientos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimientos_fecha ON public.movimientos_caja USING btree (fecha);


--
-- Name: idx_notas_credito_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notas_credito_cliente ON public.notas_credito USING btree (cliente_id);


--
-- Name: idx_notas_credito_factura; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notas_credito_factura ON public.notas_credito USING btree (factura_id);


--
-- Name: idx_notas_credito_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notas_credito_fecha ON public.notas_credito USING btree (fecha);


--
-- Name: idx_pagos_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_cliente ON public.pagos USING btree (cliente_id);


--
-- Name: idx_pagos_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pagos_proveedor ON public.pagos USING btree (proveedor_id);


--
-- Name: idx_pedido_detalles_pedido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_detalles_pedido ON public.pedido_detalles USING btree (pedido_id);


--
-- Name: idx_pedido_detalles_producto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_detalles_producto ON public.pedido_detalles USING btree (producto_id);


--
-- Name: idx_pedidos_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_estado ON public.pedidos_proveedor USING btree (estado);


--
-- Name: idx_pedidos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_fecha ON public.pedidos_proveedor USING btree (fecha_pedido);


--
-- Name: idx_pedidos_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedidos_proveedor ON public.pedidos_proveedor USING btree (proveedor_id);


--
-- Name: idx_productos_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_productos_categoria ON public.productos USING btree (categoria_id);


--
-- Name: idx_recibo_imputaciones_compra; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibo_imputaciones_compra ON public.recibo_imputaciones USING btree (compra_id);


--
-- Name: idx_recibo_imputaciones_recibo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibo_imputaciones_recibo ON public.recibo_imputaciones USING btree (recibo_id);


--
-- Name: idx_recibo_imputaciones_venta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibo_imputaciones_venta ON public.recibo_imputaciones USING btree (venta_id);


--
-- Name: idx_recibos_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_cliente ON public.recibos USING btree (cliente_id);


--
-- Name: idx_recibos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_fecha ON public.recibos USING btree (fecha DESC);


--
-- Name: idx_recibos_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_proveedor ON public.recibos USING btree (proveedor_id);


--
-- Name: idx_recibos_tipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_recibos_tipo ON public.recibos USING btree (tipo);


--
-- Name: cajas_dia cajas_dia_usuario_apertura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cajas_dia
    ADD CONSTRAINT cajas_dia_usuario_apertura_id_fkey FOREIGN KEY (usuario_apertura_id) REFERENCES public.usuarios(id);


--
-- Name: cajas_dia cajas_dia_usuario_cierre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cajas_dia
    ADD CONSTRAINT cajas_dia_usuario_cierre_id_fkey FOREIGN KEY (usuario_cierre_id) REFERENCES public.usuarios(id);


--
-- Name: compra_detalles compra_detalles_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra_detalles
    ADD CONSTRAINT compra_detalles_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id) ON DELETE CASCADE;


--
-- Name: compra_detalles compra_detalles_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compra_detalles
    ADD CONSTRAINT compra_detalles_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: compras compras_anulado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: compras compras_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: compras compras_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.compras
    ADD CONSTRAINT compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: cuenta_corriente_cliente cuenta_corriente_cliente_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_cliente
    ADD CONSTRAINT cuenta_corriente_cliente_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: cuenta_corriente_cliente cuenta_corriente_cliente_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_cliente
    ADD CONSTRAINT cuenta_corriente_cliente_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: cuenta_corriente cuenta_corriente_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente
    ADD CONSTRAINT cuenta_corriente_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id);


--
-- Name: cuenta_corriente cuenta_corriente_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente
    ADD CONSTRAINT cuenta_corriente_factura_id_fkey FOREIGN KEY (venta_id) REFERENCES public.facturas(id);


--
-- Name: cuenta_corriente_proveedor cuenta_corriente_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_proveedor
    ADD CONSTRAINT cuenta_corriente_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: cuenta_corriente_proveedor cuenta_corriente_proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cuenta_corriente_proveedor
    ADD CONSTRAINT cuenta_corriente_proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: detalles_lista_precios detalles_lista_precios_lista_precios_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_lista_precios
    ADD CONSTRAINT detalles_lista_precios_lista_precios_id_fkey FOREIGN KEY (lista_precios_id) REFERENCES public.listas_precios(id);


--
-- Name: detalles_lista_precios detalles_lista_precios_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalles_lista_precios
    ADD CONSTRAINT detalles_lista_precios_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: factura_detalles factura_detalles_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT factura_detalles_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id) ON DELETE CASCADE;


--
-- Name: factura_detalles factura_detalles_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.factura_detalles
    ADD CONSTRAINT factura_detalles_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: facturas facturas_anulado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_anulado_por_fkey FOREIGN KEY (anulado_por) REFERENCES public.usuarios(id);


--
-- Name: facturas facturas_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: facturas facturas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.facturas
    ADD CONSTRAINT facturas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: historial_costos historial_costos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_costos
    ADD CONSTRAINT historial_costos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: historial_costos historial_costos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_costos
    ADD CONSTRAINT historial_costos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: historial_margenes historial_margenes_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_margenes
    ADD CONSTRAINT historial_margenes_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: historial_margenes historial_margenes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.historial_margenes
    ADD CONSTRAINT historial_margenes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: movimientos_caja movimientos_caja_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_caja_id_fkey FOREIGN KEY (caja_id) REFERENCES public.caja_dia(id);


--
-- Name: movimientos_caja movimientos_caja_categoria_caja_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_categoria_caja_id_fkey FOREIGN KEY (categoria_caja_id) REFERENCES public.categorias_caja(id);


--
-- Name: movimientos_caja movimientos_caja_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: movimientos_caja movimientos_caja_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: movimientos_caja movimientos_caja_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_caja
    ADD CONSTRAINT movimientos_caja_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: nota_credito_detalles nota_credito_detalles_nota_credito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_credito_detalles
    ADD CONSTRAINT nota_credito_detalles_nota_credito_id_fkey FOREIGN KEY (nota_credito_id) REFERENCES public.notas_credito(id) ON DELETE CASCADE;


--
-- Name: nota_credito_detalles nota_credito_detalles_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nota_credito_detalles
    ADD CONSTRAINT nota_credito_detalles_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: notas_credito notas_credito_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas_credito
    ADD CONSTRAINT notas_credito_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: notas_credito notas_credito_factura_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas_credito
    ADD CONSTRAINT notas_credito_factura_id_fkey FOREIGN KEY (factura_id) REFERENCES public.facturas(id);


--
-- Name: notas_credito notas_credito_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notas_credito
    ADD CONSTRAINT notas_credito_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pagos pagos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: pagos pagos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: pagos pagos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pagos
    ADD CONSTRAINT pagos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: pedido_detalles pedido_detalles_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_detalles
    ADD CONSTRAINT pedido_detalles_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos_proveedor(id) ON DELETE CASCADE;


--
-- Name: pedido_detalles pedido_detalles_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_detalles
    ADD CONSTRAINT pedido_detalles_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- Name: pedidos_proveedor pedidos_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_proveedor
    ADD CONSTRAINT pedidos_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: pedidos_proveedor pedidos_proveedor_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_proveedor
    ADD CONSTRAINT pedidos_proveedor_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: producto_proveedor producto_proveedor_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_proveedor
    ADD CONSTRAINT producto_proveedor_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- Name: producto_proveedor producto_proveedor_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.producto_proveedor
    ADD CONSTRAINT producto_proveedor_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- Name: productos productos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categorias(id);


--
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: recibo_imputaciones recibo_imputaciones_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibo_imputaciones
    ADD CONSTRAINT recibo_imputaciones_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id);


--
-- Name: recibo_imputaciones recibo_imputaciones_recibo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibo_imputaciones
    ADD CONSTRAINT recibo_imputaciones_recibo_id_fkey FOREIGN KEY (recibo_id) REFERENCES public.recibos(id) ON DELETE CASCADE;


--
-- Name: recibo_imputaciones recibo_imputaciones_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibo_imputaciones
    ADD CONSTRAINT recibo_imputaciones_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.facturas(id);


--
-- Name: recibos recibos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- Name: recibos recibos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: recibos recibos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recibos
    ADD CONSTRAINT recibos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_rol_id_fkey FOREIGN KEY (rol_id) REFERENCES public.roles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict j53YavbOnwcCcLLhvsY6woKIDt3uuk1IWyclgc5Ojl3mK5CT0p1zAa4aW2AlN1c

