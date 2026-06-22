import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    FiDollarSign, FiSearch, FiShoppingBag, FiPackage, FiCalendar, FiClock, FiUser,
    FiCreditCard, FiTrendingUp, FiList
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;
const API_URL_LOCAL = `${API_URL}/pagoCaja/pagos`;

// --- CONFIGURACIÓN DE ESTILOS MONOCHROME (INTER) ---
const styles = {
    glassCard: "bg-[#050505] border border-white/10 shadow-2xl",
    heading: "font-['Inter'] font-[900] uppercase tracking-tighter leading-none",
    body: "font-['Inter'] font-[400]",
    tech: "font-['Inter'] font-[700] uppercase tracking-widest",
    buttonActive: "bg-white text-black font-['Inter'] font-[900] uppercase text-[10px] tracking-widest",
    buttonInactive: "text-zinc-500 hover:text-white font-['Inter'] font-[900] uppercase text-[10px] tracking-widest",
    label: "text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]"
};

const HistorialVentasLocal = () => {
    const [tabActiva, setTabActiva] = useState('historial');
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    const formatearMoneda = (valor) => {
        const numero = parseFloat(valor || 0);
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
        }).format(numero).replace('ARS', '$');
    };

    const formatearFecha = (fechaString) => {
        if (!fechaString) return 'S/D';
        try {
            const date = new Date(fechaString);
            const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
            return date.toLocaleDateString('es-AR', options);
        } catch (e) { return 'ERR_DATE'; }
    };

    const obtenerVentas = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const respuesta = await fetch(API_URL_LOCAL);
            if (!respuesta.ok) throw new Error(`ERR_${respuesta.status}`);
            const datos = await respuesta.json();
            setVentas(Array.isArray(datos) ? datos.reverse() : []);
        } catch (err) {
            setError(`ERROR_SINC: ${err.message}`);
            setVentas([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        obtenerVentas();
    }, [obtenerVentas]);

    const ventasFiltradas = useMemo(() => {
        const busqueda = filtroBusqueda.toLowerCase();
        return ventas.filter(v => {
            const idMatch = (v.id || '').toString().includes(busqueda);
            const clienteMatch = (v.opcion1 || '').toLowerCase().includes(busqueda);
            const productosMatch = (v.productos || []).some(p => p.nombre.toLowerCase().includes(busqueda));
            return idMatch || clienteMatch || productosMatch;
        });
    }, [ventas, filtroBusqueda]);

    const productosMasVendidos = useMemo(() => {
        const mapa = {};
        ventas.forEach(venta => {
            (venta.productos || []).forEach(prod => {
                const nombre = prod.nombre;
                if (!mapa[nombre]) mapa[nombre] = { nombre: nombre, marca: prod.marca || 'N/A', cantidad: 0, total: 0 };
                mapa[nombre].cantidad += (prod.cantidad || 1);
                mapa[nombre].total += (prod.monto * (prod.cantidad || 1));
            });
        });
        return Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
    }, [ventas]);

    return (
        <div className={`${styles.glassCard} p-4 md:p-8 rounded-none text-white selection:bg-white selection:text-black font-['Inter']`}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div className="flex items-center">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-none mr-5">
                        <FiShoppingBag className="text-white" size={32} />
                    </div>
                    <div>
                        <h1 className={`${styles.heading} text-2xl md:text-4xl`}>VENTAS LOCAL FÍSICO</h1>
                        <p className={`${styles.tech} text-[10px] text-zinc-500 mt-2`}>HISTORIAL TERMINAL POS</p>
                    </div>
                </div>

                <div className="flex bg-[#111] p-1 border border-white/5">
                    <button
                        onClick={() => setTabActiva('historial')}
                        className={`flex items-center px-6 py-2 transition-all ${tabActiva === 'historial' ? styles.buttonActive : styles.buttonInactive}`}
                    >
                        <FiList className="mr-2" /> LISTADO
                    </button>
                    <button
                        onClick={() => setTabActiva('top')}
                        className={`flex items-center px-6 py-2 transition-all ${tabActiva === 'top' ? styles.buttonActive : styles.buttonInactive}`}
                    >
                        <FiTrendingUp className="mr-2" /> RANKING TOP
                    </button>
                </div>
            </header>

            {tabActiva === 'historial' ? (
                <>
                    <div className="flex items-center bg-black border border-white/10 p-4 mb-8 focus-within:border-white transition-colors">
                        <FiSearch className="text-zinc-500 mr-4" size={20} />
                        <input
                            type="text"
                            placeholder="FILTRAR POR ID, CLIENTE O PRODUCTO..."
                            className="bg-transparent w-full outline-none text-[10px] font-bold tracking-widest placeholder:text-zinc-800 text-white"
                            value={filtroBusqueda}
                            onChange={(e) => setFiltroBusqueda(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto border border-white/5 no-scrollbar">
                        <table className="min-w-full divide-y divide-white/5">
                            <thead className="bg-[#0a0a0a]">
                                <tr>
                                    <th className={`px-6 py-5 text-left ${styles.label}`}>ID OPERACIÓN</th>
                                    <th className={`px-6 py-5 text-left ${styles.label}`}>CLIENTE</th>
                                    <th className={`px-6 py-5 text-left ${styles.label}`}>DETALLE DE PRODUCTOS</th>
                                    <th className={`px-6 py-5 text-left ${styles.label}`}>MÉTODO DE PAGO</th>
                                    <th className={`px-6 py-5 text-right ${styles.label}`}>TOTAL</th>
                                    <th className={`px-6 py-5 text-left ${styles.label}`}>FECHA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ventasFiltradas.map((v, i) => (
                                    <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                                        <td className={`px-6 py-5 text-[10px] ${styles.tech} text-white align-top`}>#{v.id}</td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="text-xs font-bold tracking-tight text-white uppercase">
                                                {v.opcion1 ? v.opcion1.replace('Cliente: ', '') : 'CONSUMIDOR FINAL'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 align-top">
                                            <div className="space-y-1">
                                                {(v.productos || []).map((p, idx) => (
                                                    <div key={idx} className="flex items-center text-[11px]">
                                                        <span className="text-zinc-600 font-black mr-2">x{p.cantidad}</span>
                                                        <span className="text-zinc-300 uppercase font-medium">{p.nombre}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-5 text-[10px] ${styles.tech} align-top`}>
                                            <span className="px-2 py-1 border border-white/10 bg-white/5 rounded-sm">
                                                {v.medioPago.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-5 text-xs font-black ${styles.tech} text-white align-top text-right`}>
                                            {formatearMoneda(v.montoTotal)}
                                        </td>
                                        <td className={`px-6 py-5 text-[9px] ${styles.tech} text-zinc-600 align-top`}>
                                            {formatearFecha(v.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className={`${styles.glassCard} col-span-2 p-8 border-white/5 bg-[#080808]`}>
                        <h3 className={`${styles.heading} text-xl mb-8 flex items-center text-white`}>
                            <FiTrendingUp className="mr-3" /> TOP PRODUCTOS LOCAL
                        </h3>
                        <div className="space-y-3">
                            {productosMasVendidos.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-black border border-white/5 hover:border-white/20 transition-all group">
                                    <div className="flex items-center">
                                        <span className={`${styles.tech} text-lg font-black text-zinc-800 mr-5 group-hover:text-white transition-colors tracking-tighter`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-tight text-zinc-200">{p.nombre}</p>
                                            <p className={`${styles.tech} text-[8px] text-zinc-600 mt-1`}>{p.marca}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`${styles.tech} text-xs font-black text-white`}>{p.cantidad} UDS.</p>
                                        <p className={`${styles.tech} text-[9px] text-zinc-500 mt-1`}>{formatearMoneda(p.total)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-8">
                            <FiDollarSign size={40} className="mb-6 text-black" />
                            <h4 className="text-black/40 font-black text-[9px] uppercase tracking-[0.2em] mb-2">VOLUMEN TOTAL LOCAL</h4>
                            <p className="text-3xl font-black text-black leading-none tracking-tighter">
                                {formatearMoneda(ventas.reduce((acc, v) => acc + parseFloat(v.montoTotal || 0), 0)).replace(',00', '')}
                            </p>
                        </div>
                        <div className="p-8 border border-white/10 bg-[#0a0a0a]">
                            <p className="text-zinc-500 text-[9px] font-bold tracking-widest uppercase">Transacciones Totales</p>
                            <p className="text-2xl font-black text-white mt-2">{ventas.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialVentasLocal;