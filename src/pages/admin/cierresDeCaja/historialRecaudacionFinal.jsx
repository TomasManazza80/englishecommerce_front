import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBarChart2, FiSearch, FiPackage, FiTrendingUp, FiShoppingBag,
    FiGlobe, FiHome, FiClock, FiStar, FiChevronRight, FiLoader,
    FiCalendar, FiChevronsDown, FiChevronsUp, FiSmartphone, FiActivity, FiUser
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;
const API_URL_RECAUDACION = `${API_URL}/recaudacionFinal`;

// --- UTILIDADES ---
const formatCurrency = (amount) => {
    return (Number(amount) || 0).toLocaleString('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2
    });
};

const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
};

// --- ESTILOS MONOCHROME (INTER) ---
const styles = {
    label: "font-['Inter'] text-[10px] md:text-[11px] font-extrabold text-gray-500 uppercase tracking-[0.2em] mb-2 block",
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-black",
    techValue: "font-['Inter'] font-bold text-black tracking-tight",
    glassCard: "bg-[#0a0a0a] border border-gray-200 shadow-2xl",
    tabActive: "bg-white text-black font-['Inter'] font-black text-[10px] tracking-[0.2em] px-4 md:px-8 py-4 md:py-3 flex-1 md:flex-none transition-all duration-300",
    tabInactive: "text-gray-400 hover:text-black font-['Inter'] font-black text-[10px] tracking-[0.2em] px-4 md:px-8 py-4 md:py-3 border border-gray-200 flex-1 md:flex-none transition-all duration-300"
};

// --- 1. COMPONENTE: RASTREADOR AVANZADO ---
const ProductTrackerAdvanced = ({ recaudaciones }) => {
    const [query, setQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);

    const productMatches = useMemo(() => {
        if (!query || query.length < 2) return [];
        const matches = new Set();
        recaudaciones.forEach(cierre => {
            (cierre.productosVendidos || []).forEach(p => {
                if (p.nombreProducto?.toLowerCase().includes(query.toLowerCase())) matches.add(p.nombreProducto);
            });
        });
        return Array.from(matches).slice(0, 5);
    }, [query, recaudaciones]);

    const productStats = useMemo(() => {
        if (!selectedProduct) return null;
        let totalUnits = 0, totalRevenue = 0, totalProfit = 0, history = [], ecommUnits = 0, localUnits = 0;

        recaudaciones.forEach(cierre => {
            (cierre.productosVendidos || []).forEach(p => {
                if (p.nombreProducto === selectedProduct) {
                    const canal = p.canal || 'LOCAL';
                    const costo = (parseFloat(p.precioCompra) || 0) * (parseInt(p.cantidadComprada) || 1);
                    const ganancia = (parseFloat(p.monto) || 0) - costo;

                    history.push({ ...p, fecha: cierre.createdAt, idCierre: cierre.id, canal, ganancia });
                    totalUnits += p.cantidadComprada;
                    totalRevenue += p.monto;
                    totalProfit += ganancia;

                    if (canal === 'ECOMMERCE') ecommUnits += p.cantidadComprada; else localUnits += p.cantidadComprada;
                }
            });
        });
        return { name: selectedProduct, totalUnits, totalRevenue, totalProfit, ecommUnits, localUnits, history: history.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) };
    }, [selectedProduct, recaudaciones]);

    return (
        <div className="mb-8 md:mb-16 p-5 md:p-10 bg-[#050505] border border-gray-200 shadow-2xl relative overflow-hidden rounded-none">
            <h3 className={`${styles.label} text-black flex items-center gap-3 mb-6 md:mb-10`}>
                <FiSearch size={18} /> RASTREADOR_SISTEMA
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12">
                <div className="lg:col-span-4 space-y-4">
                    <input
                        type="text"
                        placeholder="BUSCAR EQUIPO..."
                        className="w-full bg-white border border-gray-200 py-4 px-6 text-xs font-bold tracking-widest focus:border-black outline-none text-black uppercase rounded-none transition-all placeholder:text-zinc-800"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedProduct(null); }}
                    />
                    {productMatches.length > 0 && !selectedProduct && (
                        <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                            {productMatches.map((name, idx) => (
                                <button key={idx} onClick={() => setSelectedProduct(name)} className="w-full flex justify-between items-center p-4 bg-zinc-900/20 border border-gray-200 hover:bg-white hover:text-black transition-all text-[11px] font-black text-gray-600 uppercase">
                                    <span>{name}</span><FiChevronRight />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-8">
                    {productStats ? (
                        <div className="animate-in zoom-in-95 space-y-6">
                            <div className="bg-white p-6 md:p-8 border-l-2 border-black">
                                <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
                                    <div><p className={styles.label}>ID_REGISTRO</p><h4 className={`${styles.title} text-xl md:text-3xl`}>{productStats.name}</h4></div>
                                    <div className="flex gap-6 md:gap-10 w-full md:w-auto justify-between md:justify-end border-t border-gray-200 pt-4 md:border-0 md:pt-0">
                                        <div className="text-right">
                                            <p className={styles.label}>Recaudación</p>
                                            <p className="text-lg md:text-2xl font-black text-black">{formatCurrency(productStats.totalRevenue)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={styles.label}>Ganancia</p>
                                            <p className="text-lg md:text-2xl font-black text-black decoration-white underline underline-offset-4">{formatCurrency(productStats.totalProfit)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 md:gap-6">
                                    <div className="bg-gray-50 p-3 md:p-4 border border-gray-200 text-center"><p className={styles.label}>Total</p><p className="text-sm md:text-xl font-black text-black">{productStats.totalUnits} U</p></div>
                                    <div className="bg-gray-50 p-3 md:p-4 border border-gray-200 text-center"><p className={styles.label}>E-comm</p><p className="text-sm md:text-xl font-black text-black opacity-40">{productStats.ecommUnits} U</p></div>
                                    <div className="bg-white text-black p-3 md:p-4 text-center"><p className="text-[10px] font-black uppercase mb-1">Local</p><p className="text-sm md:text-xl font-black">{productStats.localUnits} U</p></div>
                                </div>
                            </div>
                            <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
                                {productStats.history.map((v, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-900/20 border border-gray-200">
                                        <div className="flex items-center gap-4">
                                            <FiClock className="text-gray-500" />
                                            <div>
                                                <p className="text-[10px] md:text-[11px] font-black text-black">{formatDateTime(v.fecha)}</p>
                                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{v.canal}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs md:text-sm font-black text-black">{formatCurrency(v.monto)}</p>
                                            <p className="text-[8px] text-zinc-700 font-black">CANT: {v.cantidadComprada}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 md:h-[300px] flex flex-col items-center justify-center border border-gray-200 text-zinc-800 bg-white/40">
                            <FiActivity size={30} className="mb-4 opacity-10" />
                            <span className="text-[9px] tracking-[0.4em] font-black uppercase text-zinc-700">Awaiting_Data_Selection</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- 2. COMPONENTE: RANKING TOP 10 ---
const TopProductosView = ({ datos }) => {
    const topVendidos = useMemo(() => {
        const ranking = {};
        datos.forEach(reg => {
            (reg.productosVendidos || []).forEach(p => {
                const n = p.nombreProducto || "S/N";
                if (ranking[n]) { ranking[n].cantidad += p.cantidadComprada; ranking[n].total += p.monto; }
                else ranking[n] = { nombre: n, cantidad: p.cantidadComprada, total: p.monto };
            });
        });
        return Object.values(ranking).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
    }, [datos]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 animate-in slide-in-from-bottom-6 duration-700">
            <div className="space-y-1">
                <h3 className={`${styles.label} text-black flex items-center gap-3 mb-4 md:mb-6`}>
                    <FiTrendingUp /> RANKING_RENDIMIENTO
                </h3>
                {topVendidos.map((prod, i) => (
                    <div key={i} className="relative flex items-center justify-between p-4 md:p-5 bg-[#0a0a0a] border border-gray-200 transition-all hover:bg-gray-50 group">
                        <div className="flex items-center gap-4 md:gap-6">
                            <span className="text-xl md:text-3xl font-black text-zinc-900 group-hover:text-black transition-colors">{(i + 1).toString().padStart(2, '0')}</span>
                            <div>
                                <p className="text-xs md:text-sm font-black text-black uppercase tracking-tight">{prod.nombre}</p>
                                <p className="text-[9px] text-gray-400 font-bold">VOL: {formatCurrency(prod.total)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl md:text-2xl font-black text-black leading-none">{prod.cantidad}</p>
                            <p className="text-[8px] text-zinc-700 font-black uppercase">Units</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white p-6 md:p-10 flex flex-col items-center justify-center text-center order-first lg:order-last">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-black flex items-center justify-center mb-6 shadow-2xl"><FiStar size={32} /></div>
                <h4 className="font-['Inter'] font-black text-black text-xl md:text-2xl mb-2 uppercase tracking-tighter">Market_Leader</h4>
                <p className="text-gray-600 text-[9px] uppercase font-black tracking-widest mb-6 md:mb-10">Peak Performance Analysis</p>
                <div className="p-6 md:p-8 bg-zinc-100 w-full">
                    <p className="text-lg md:text-2xl font-black text-black uppercase tracking-tighter">{topVendidos[0]?.nombre || "NO_DATA"}</p>
                    <div className="h-[2px] bg-white my-4 md:my-6" />
                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.4em]">Efficiency_Index_A1</p>
                </div>
            </div>
        </div>
    );
};

// --- 2.5 COMPONENTE: ROW DE PRODUCTO EXPANDIBLE ---
const ProductRow = ({ product }) => {
    const [expanded, setExpanded] = useState(false);
    const costo = (parseFloat(product.precioCompra) || 0) * (parseInt(product.cantidadComprada) || 1);
    const ganancia = (parseFloat(product.monto) || 0) - costo;

    return (
        <div className="border-b border-gray-200 last:border-0">
            <div
                onClick={() => setExpanded(!expanded)}
                className={`flex justify-between items-center py-4 px-4 cursor-pointer transition-all ${expanded ? 'bg-gray-100' : 'active:bg-gray-50'}`}
            >
                <div className="flex items-center gap-3 max-w-[70%]">
                    <span className={`text-gray-500 transition-transform duration-300 ${expanded ? 'rotate-180 text-black' : ''}`}>
                        <FiChevronsDown size={16} />
                    </span>
                    <span className="text-[11px] font-black text-zinc-200 uppercase truncate">
                        <span className="text-black mr-2">[{product.cantidadComprada}]</span>
                        {product.nombreProducto}
                    </span>
                </div>
                <span className="text-black font-black text-xs whitespace-nowrap">{formatCurrency(product.monto)}</span>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#050505] p-5 space-y-4 border-t border-gray-200 shadow-inner"
                    >
                        <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                            <span className={styles.label + " mb-0"}>Rentabilidad</span>
                            <span className="text-black font-black text-xs decoration-white underline">{formatCurrency(ganancia)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <p className="text-[8px] text-zinc-700 uppercase font-black tracking-widest">Tracking</p>
                                <div className="flex items-center gap-2 text-gray-600 text-[10px] font-bold"><FiClock size={10} /> {product.hora || '00:00'} HS</div>
                                <div className="flex items-center gap-2 text-gray-600 text-[10px] font-bold"><FiUser size={10} /> <span className="truncate">{product.cliente || 'PUBLIC'}</span></div>
                            </div>
                            <div className="text-right space-y-2">
                                <p className="text-[8px] text-zinc-700 uppercase font-black tracking-widest">Canal</p>
                                <span className={`inline-block px-2 py-0.5 font-black text-[8px] text-black uppercase bg-white`}>
                                    {product.canal || 'LOCAL'}
                                </span>
                                <p className="text-black font-black text-[10px] uppercase">{product.medioPago}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- 3. COMPONENTE: ITEM DE CIERRE ---
const CierreItem = ({ cierre }) => {
    const [open, setOpen] = useState(false);
    const filters = useMemo(() => ({
        tienda: (cierre.productosVendidos || []).filter(p => p.canal === 'LOCAL' || !p.canal),
        ecomm: (cierre.productosVendidos || []).filter(p => p.canal === 'ECOMMERCE'),
        rev: (cierre.productosVendidos || []).filter(p => p.canal === 'REVENDEDOR'),
        ganancia: (cierre.productosVendidos || []).reduce((acc, p) => acc + ((parseFloat(p.monto) || 0) - ((parseFloat(p.precioCompra) || 0) * (parseInt(p.cantidadComprada) || 1))), 0)
    }), [cierre]);

    return (
        <div className="mb-2 bg-[#0a0a0a] border border-gray-200 overflow-hidden transition-all">
            <div className="p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 cursor-pointer" onClick={() => setOpen(!open)}>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`p-3 md:p-4 transition-all ${open ? 'bg-white text-black' : 'bg-zinc-900 text-gray-400'}`}>
                        <FiCalendar size={20} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[8px] md:text-[9px] text-zinc-700 uppercase font-black tracking-[0.4em]">LOG_ENTRY_#{cierre.id}</p>
                        <p className="text-xs md:text-sm font-black text-black">{formatDateTime(cierre.createdAt)}</p>
                    </div>
                    <div className="md:hidden text-right">
                        <p className="text-[14px] font-black text-black">{formatCurrency(cierre.totalFinal)}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-10 w-full md:w-auto border-t border-gray-200 md:border-0 pt-4 md:pt-0">
                    <div className="hidden md:block text-right">
                        <p className={styles.label}>Net_Profit</p>
                        <p className="text-xl font-black text-black">{formatCurrency(filters.ganancia)}</p>
                    </div>
                    <div className="hidden md:block text-right">
                        <p className={styles.label}>Gross_Total</p>
                        <p className="text-xl font-black text-black">{formatCurrency(cierre.totalFinal)}</p>
                    </div>
                    <button className={`hidden md:flex p-4 transition-all ${open ? 'bg-white text-black' : 'text-zinc-700'}`}>
                        {open ? <FiChevronsUp size={20} /> : <FiChevronsDown size={20} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-white border-t border-gray-200">
                        <div className="p-5 md:p-8 space-y-8">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-zinc-900/40 p-4 border border-gray-200">
                                    <p className="text-[8px] text-gray-400 uppercase font-black mb-1">Profit_Margin</p>
                                    <p className="text-sm md:text-lg font-black text-black">{formatCurrency(filters.ganancia)}</p>
                                </div>
                                <div className="bg-zinc-900/40 p-4 border border-gray-200">
                                    <p className="text-[8px] text-gray-400 uppercase font-black mb-1">Units_Sold</p>
                                    <p className="text-sm md:text-lg font-black text-black">{cierre.productosVendidos?.length || 0} PCS</p>
                                </div>
                                <div className="bg-white p-4 col-span-2 lg:col-span-2">
                                    <p className="text-[8px] text-black/40 uppercase font-black mb-1">System_Hash</p>
                                    <p className="text-[10px] font-black text-black truncate">SRV_DATA_NODE_00{cierre.id}X_STFE</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { title: 'Ecommerce', items: filters.ecomm, icon: <FiSmartphone /> },
                                    { title: 'Store', items: filters.tienda, icon: <FiHome /> },
                                    { title: 'Resellers', items: filters.rev, icon: <FiUser /> }
                                ].map((col, idx) => (
                                    <div key={idx} className="bg-[#080808] border border-gray-200 shadow-xl">
                                        <div className={`p-4 border-b border-gray-200 bg-zinc-900/50 flex items-center justify-between text-black`}>
                                            <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">{col.icon} {col.title}</span>
                                            <span className="bg-white text-black px-2 py-0.5 text-[9px] font-black">{col.items.length}</span>
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                            {col.items.length > 0 ? col.items.map((p, i) => <ProductRow key={i} product={p} />) : <div className="p-8 text-center text-[9px] text-zinc-800 uppercase font-black italic">No_Movement</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {cierre.detalles_billetes && (
                                <div className="p-6 border border-gray-200 bg-gray-50">
                                    <h5 className={`${styles.label} text-black mb-6 flex items-center gap-2`}><FiPackage /> Cash_Position</h5>
                                    <div className="grid grid-cols-3 md:grid-cols-8 gap-2">
                                        {Object.entries(cierre.detalles_billetes).sort((a, b) => b[0] - a[0]).map(([den, cant]) => (
                                            <div key={den} className={`flex flex-col items-center p-3 border transition-all ${cant > 0 ? 'border-black bg-white text-black' : 'border-gray-200 text-zinc-800'}`}>
                                                <span className="text-[9px] font-black mb-1">${den}</span>
                                                <span className="font-black text-lg">{cant}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const HistorialRecaudacionFinal = () => {
    const [recaudaciones, setRecaudaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [tab, setTab] = useState('historial');
    const [sortOrder, setSortOrder] = useState('desc');

    const handleSort = () => {
        const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
        setSortOrder(newOrder);
        setRecaudaciones([...recaudaciones].sort((a, b) => {
            return newOrder === 'desc' 
                ? new Date(b.createdAt) - new Date(a.createdAt)
                : new Date(a.createdAt) - new Date(b.createdAt);
        }));
    };

    useEffect(() => {
        axios.get(API_URL_RECAUDACION).then(res => {
            if (res.data) setRecaudaciones(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setCargando(false);
        }).catch(() => setCargando(false));
    }, []);

    const totalGlobal = useMemo(() => recaudaciones.reduce((s, c) => s + (Number(c.totalFinal) || 0), 0), [recaudaciones]);

    if (cargando) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white">
            <FiLoader className="animate-spin text-black mb-8" size={50} />
            <p className="text-gray-400 font-black tracking-[1em] text-[10px] uppercase">Syncing_Protocol...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-black font-['Inter'] selection:bg-white selection:text-black">
            <div className="p-4 md:p-10 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-8">
                    <div className="w-full md:w-auto">
                        <h2 className="text-3xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                            REVENUE_<span className="text-gray-400">AUDIT</span>
                        </h2>
                        <div className="h-[4px] w-20 bg-white mt-4" />
                        <p className="text-[9px] md:text-[10px] text-zinc-700 font-black mt-6 tracking-[0.5em] uppercase">Accounting_Interface // Node_Santa_Fe</p>
                    </div>
                    <div className="bg-white p-6 md:p-10 w-full md:min-w-[400px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform text-black"><FiTrendingUp size={60} /></div>
                        <p className="text-[10px] font-black uppercase text-black/40 tracking-widest mb-2">Accumulated_Total</p>
                        <p className="text-3xl md:text-5xl font-black text-black leading-none tracking-tighter">
                            ${totalGlobal.toLocaleString('es-AR').replace(',00', '')}
                        </p>
                    </div>
                </div>

                <ProductTrackerAdvanced recaudaciones={recaudaciones} />

                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg py-4 -mx-4 px-4 md:static md:bg-transparent md:p-0 md:m-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                        <div className="flex bg-zinc-900/50 p-1 md:bg-transparent md:p-0 md:gap-4 border border-gray-200 md:border-none w-full md:w-auto">
                            <button onClick={() => setTab('historial')} className={tab === 'historial' ? styles.tabActive : styles.tabInactive}>REPORTS</button>
                            <button onClick={() => setTab('ranking')} className={tab === 'ranking' ? styles.tabActive : styles.tabInactive}>METRICS</button>
                        </div>
                        {tab === 'historial' && (
                            <button 
                                onClick={handleSort}
                                className="bg-black text-white font-['Inter'] font-black text-[10px] tracking-[0.2em] px-4 md:px-8 py-4 md:py-3 border border-black hover:bg-white hover:text-black transition-all duration-300 w-full md:w-auto uppercase"
                            >
                                ORDENAR MOVIMIENTOS {sortOrder === 'desc' ? '↓' : '↑'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="pb-32">
                    {tab === 'historial' && (
                        <div className="space-y-1 animate-in slide-in-from-bottom-6 duration-700">
                            {recaudaciones.map(c => <CierreItem key={c.id} cierre={c} />)}
                        </div>
                    )}
                    {tab === 'ranking' && <TopProductosView datos={recaudaciones} />}
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
                * { touch-action: manipulation; }
            `}</style>
        </div>
    );
};

export default HistorialRecaudacionFinal;