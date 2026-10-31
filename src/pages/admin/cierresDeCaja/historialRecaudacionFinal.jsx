import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiBarChart2, FiSearch, FiPackage, FiTrendingUp, FiShoppingBag,
    FiGlobe, FiHome, FiClock, FiStar, FiChevronRight, FiLoader,
    FiCalendar, FiChevronsDown, FiChevronsUp, FiSmartphone, FiActivity, FiUser,
    FiRefreshCw
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

// --- TOKENS DEL SISTEMA DE DISEÑO (WARM MINIMALIST SAAS) ---
const styles = {
    label: "text-[10px] text-neutral-400 block mb-1",
    title: "text-base font-semibold text-neutral-900",
    techValue: "text-xs font-medium text-neutral-700",
    glassCard: "bg-white border border-[#ECECE6] rounded-2xl shadow-xs hover:border-[#D5D5CF] transition-all",
    tabActive: "px-2.5 py-1 bg-white text-neutral-900 rounded-2xl shadow-2xs font-semibold",
    tabInactive: "px-2.5 py-1 hover:text-neutral-900 transition-colors"
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
        <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F1EB]">
                <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                    <FiSearch className="w-3.5 h-3.5 text-neutral-500" />
                    Rastreador de Productos
                </h2>
                <span className="text-[11px] text-neutral-400">Búsqueda histórica de unidades</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 space-y-2.5">
                    <div className="relative flex items-center">
                        <FiSearch className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Buscar equipo..."
                            className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl pl-8 pr-7 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSelectedProduct(null); }}
                        />
                    </div>
                    {productMatches.length > 0 && !selectedProduct && (
                        <div className="space-y-1.5">
                            {productMatches.map((name, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedProduct(name)}
                                    className="w-full flex justify-between items-center px-3 py-2 bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl hover:bg-white transition-colors text-xs font-medium text-neutral-700 group"
                                >
                                    <span className="truncate">{name}</span>
                                    <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                        <FiChevronRight className="w-3.5 h-3.5" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-8">
                    {productStats ? (
                        <div className="space-y-3.5">
                            <div className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl p-4 space-y-3.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-[10px] text-neutral-400 block">Registro Seleccionado</span>
                                        <h3 className="text-xs font-bold text-neutral-900 mt-0.5">{productStats.name}</h3>
                                    </div>
                                    <div className="flex gap-6 justify-between sm:justify-end border-t border-[#F1F1EB] pt-2.5 sm:border-0 sm:pt-0">
                                        <div className="text-right">
                                            <span className="text-[10px] text-neutral-400 block">Recaudación</span>
                                            <p className="text-xs font-bold text-neutral-900">{formatCurrency(productStats.totalRevenue)}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-neutral-400 block">Ganancia</span>
                                            <p className="text-xs font-bold text-[#29974D]">{formatCurrency(productStats.totalProfit)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className="bg-white border border-[#ECECE6] rounded-xl p-3 text-center">
                                        <span className="text-[10px] text-neutral-400 block">Total</span>
                                        <p className="text-xs font-bold text-neutral-900 mt-0.5">{productStats.totalUnits} u.</p>
                                    </div>
                                    <div className="bg-white border border-[#ECECE6] rounded-xl p-3 text-center">
                                        <span className="text-[10px] text-neutral-400 block">E-commerce</span>
                                        <p className="text-xs font-bold text-neutral-900 mt-0.5">{productStats.ecommUnits} u.</p>
                                    </div>
                                    <div className="bg-white border border-[#ECECE6] rounded-xl p-3 text-center">
                                        <span className="text-[10px] text-neutral-400 block">Local</span>
                                        <p className="text-xs font-bold text-neutral-900 mt-0.5">{productStats.localUnits} u.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-[#ECECE6] rounded-2xl p-3 shadow-xs max-h-60 overflow-y-auto overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#F1F1EB]">
                                            <th className="py-2 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Fecha</th>
                                            <th className="py-2 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Canal</th>
                                            <th className="py-2 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Cantidad</th>
                                            <th className="py-2 px-3 text-right text-[10px] text-neutral-400 font-medium uppercase">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F1EB]">
                                        {productStats.history.map((v, idx) => (
                                            <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                                                <td className="py-2 px-3 text-[11px] font-medium text-neutral-700">{formatDateTime(v.fecha)}</td>
                                                <td className="py-2 px-3">
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                                        {v.canal}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3 text-xs font-medium text-neutral-700">{v.cantidadComprada}</td>
                                                <td className="py-2 px-3 text-right text-xs font-bold text-neutral-900">{formatCurrency(v.monto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="h-44 sm:h-56 flex flex-col items-center justify-center rounded-xl border border-[#E4E4DF] bg-[#F8F8F5] text-neutral-400">
                            <FiActivity className="w-4 h-4 mb-2" />
                            <span className="text-[11px] text-neutral-400">Seleccione un producto para ver estadísticas</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
            <div className="lg:col-span-2 bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all overflow-x-auto">
                <div className="pb-3.5 mb-3.5 border-b border-[#F1F1EB] flex items-center gap-2">
                    <FiTrendingUp className="w-3.5 h-3.5 text-neutral-500" />
                    <h2 className="text-base font-semibold text-neutral-900">Ranking de Rendimiento (Top 10)</h2>
                </div>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-[#F1F1EB]">
                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">#</th>
                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Producto</th>
                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Volumen</th>
                            <th className="py-2.5 px-3 text-right text-[10px] text-neutral-400 font-medium uppercase">Unidades</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F1EB]">
                        {topVendidos.map((prod, i) => (
                            <tr key={i} className="hover:bg-[#FAF9F6] transition-colors">
                                <td className="py-2.5 px-3 text-[11px] text-neutral-400 font-medium">
                                    {(i + 1).toString().padStart(2, '0')}
                                </td>
                                <td className="py-2.5 px-3 text-xs font-bold text-neutral-900">
                                    {prod.nombre}
                                </td>
                                <td className="py-2.5 px-3 text-xs font-medium text-neutral-700">
                                    {formatCurrency(prod.total)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-xs font-bold text-neutral-900">
                                    {prod.cantidad}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col items-center justify-center text-center group order-first lg:order-last">
                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0 mb-3">
                    <FiStar className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-neutral-900">Líder de Ventas</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5 mb-4">Mayor Rendimiento Acumulado</p>
                <div className="p-4 bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl w-full">
                    <p className="text-base font-semibold text-neutral-900">{topVendidos[0]?.nombre || "Sin datos"}</p>
                    <div className="h-px bg-[#F1F1EB] my-3" />
                    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]">
                        Índice de Eficiencia #1
                    </span>
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
        <div className="border-b border-[#F1F1EB] last:border-0">
            <div
                onClick={() => setExpanded(!expanded)}
                className={`flex justify-between items-center px-3.5 py-2.5 cursor-pointer transition-colors group ${expanded ? 'bg-[#FAF9F6]' : 'hover:bg-[#FAF9F6]'}`}
            >
                <div className="flex items-center gap-2 max-w-[70%]">
                    <span className={`w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0 ${expanded ? 'rotate-180' : ''}`}>
                        <FiChevronsDown className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-medium text-neutral-700 truncate">
                        <span className="font-bold text-neutral-900 mr-1.5">[{product.cantidadComprada}]</span>
                        {product.nombreProducto}
                    </span>
                </div>
                <span className="text-xs font-bold text-neutral-900 whitespace-nowrap">{formatCurrency(product.monto)}</span>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-[#F8F8F5] px-3.5 py-3 space-y-2.5 border-t border-[#F1F1EB]"
                    >
                        <div className="flex justify-between items-center border-b border-[#F1F1EB] pb-2">
                            <span className="text-[10px] text-neutral-400 block">Rentabilidad</span>
                            <span className="text-[11px] font-bold text-[#29974D]">{formatCurrency(ganancia)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-[10px] text-neutral-400 block">Seguimiento</span>
                                <div className="flex items-center gap-1.5 text-neutral-700 text-[11px]">
                                    <FiClock className="w-3.5 h-3.5 text-neutral-400" /> {product.hora || '00:00'} hs
                                </div>
                                <div className="flex items-center gap-1.5 text-neutral-700 text-[11px]">
                                    <FiUser className="w-3.5 h-3.5 text-neutral-400" /> <span className="truncate">{product.cliente || 'Consumidor Final'}</span>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <span className="text-[10px] text-neutral-400 block">Canal</span>
                                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                    {product.canal || 'LOCAL'}
                                </span>
                                <p className="text-[11px] font-medium text-neutral-700">{product.medioPago}</p>
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
    const productos = useMemo(() => {
        let prods = cierre.productosVendidos;
        if (typeof prods === 'string') {
            try { prods = JSON.parse(prods); } catch (e) { prods = []; }
        }
        return Array.isArray(prods) ? prods : [];
    }, [cierre.productosVendidos]);

    const filters = useMemo(() => ({
        tienda: productos.filter(p => p.canal === 'LOCAL' || !p.canal),
        ecomm: productos.filter(p => p.canal === 'ECOMMERCE'),
        rev: productos.filter(p => p.canal === 'REVENDEDOR'),
        ganancia: productos.reduce((acc, p) => acc + ((parseFloat(p.monto) || 0) - ((parseFloat(p.precioCompra) || 0) * (parseInt(p.cantidadComprada) || 1))), 0)
    }), [productos]);

    return (
        <div className="bg-white border border-[#ECECE6] rounded-2xl shadow-xs hover:border-[#D5D5CF] transition-all overflow-hidden group">
            <div
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 cursor-pointer"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                        <FiCalendar className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                        <span className="text-[10px] text-neutral-400 block">Registro #{cierre.id}</span>
                        <h3 className="text-xs font-bold text-neutral-900">{formatDateTime(cierre.createdAt)}</h3>
                    </div>
                    <div className="sm:hidden text-right">
                        <p className="text-xs font-bold text-neutral-900">{formatCurrency(cierre.totalFinal)}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t border-[#F1F1EB] sm:border-0 pt-2.5 sm:pt-0">
                    <div className="hidden sm:block text-right">
                        <span className="text-[10px] text-neutral-400 block">Ganancia Neta</span>
                        <p className="text-xs font-bold text-[#29974D]">{formatCurrency(filters.ganancia)}</p>
                    </div>
                    <div className="hidden sm:block text-right">
                        <span className="text-[10px] text-neutral-400 block">Total Bruto</span>
                        <p className="text-xs font-bold text-neutral-900">{formatCurrency(cierre.totalFinal)}</p>
                    </div>
                    <button
                        type="button"
                        className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0"
                    >
                        {open ? <FiChevronsUp className="w-3.5 h-3.5" /> : <FiChevronsDown className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden bg-[#FAF9F6] border-t border-[#F1F1EB]"
                    >
                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                                    <span className="text-[10px] text-neutral-400 block">Margen de Ganancia</span>
                                    <p className="text-xs font-bold text-[#29974D] mt-1">{formatCurrency(filters.ganancia)}</p>
                                </div>
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                                    <span className="text-[10px] text-neutral-400 block">Unidades Vendidas</span>
                                    <p className="text-xs font-bold text-neutral-900 mt-1">{cierre.productosVendidos?.length || 0} u.</p>
                                </div>
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs flex flex-col justify-between sm:col-span-2">
                                    <span className="text-[10px] text-neutral-400 block">Identificador de Cierre</span>
                                    <p className="text-xs font-medium text-neutral-700 truncate mt-1">SRV_DATA_NODE_00{cierre.id}X_STFE</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                {[
                                    { title: 'Ecommerce', items: filters.ecomm, icon: <FiSmartphone className="w-3.5 h-3.5 text-neutral-500" /> },
                                    { title: 'Local', items: filters.tienda, icon: <FiHome className="w-3.5 h-3.5 text-neutral-500" /> },
                                    { title: 'Revendedores', items: filters.rev, icon: <FiUser className="w-3.5 h-3.5 text-neutral-500" /> }
                                ].map((col, idx) => (
                                    <div key={idx} className="bg-white border border-[#ECECE6] rounded-2xl shadow-xs overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[#F1F1EB] flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                                                {col.icon} {col.title}
                                            </h3>
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                                {col.items.length}
                                            </span>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto divide-y divide-[#F1F1EB]">
                                            {col.items.length > 0 ? (
                                                col.items.map((p, i) => <ProductRow key={i} product={p} />)
                                            ) : (
                                                <div className="p-6 text-center text-[11px] text-neutral-400">Sin movimientos</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {cierre.detalles_billetes && (
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs">
                                    <h3 className="text-xs font-bold text-neutral-900 mb-3.5 flex items-center gap-2">
                                        <FiPackage className="w-3.5 h-3.5 text-neutral-500" /> Arqueo de Billetes
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                                        {Object.entries(cierre.detalles_billetes).sort((a, b) => b[0] - a[0]).map(([den, cant]) => (
                                            <div
                                                key={den}
                                                className={`flex flex-col items-center p-2.5 rounded-xl border transition-colors ${
                                                    cant > 0
                                                        ? 'bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]'
                                                        : 'bg-[#F8F8F5] text-neutral-400 border-[#E4E4DF]'
                                                }`}
                                            >
                                                <span className="text-[10px] block mb-0.5">${den}</span>
                                                <span className="font-bold text-xs">{cant}</span>
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
    const [actualizando, setActualizando] = useState(false);
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

    const cargarRecaudaciones = async (esManual = false) => {
        if (esManual) setActualizando(true);
        else setCargando(true);

        try {
            const res = await axios.get(API_URL_RECAUDACION);
            if (res.data) {
                const normalizados = (res.data || []).map(item => {
                    let productosVendidos = item.productosVendidos;
                    if (typeof productosVendidos === 'string') {
                        try { productosVendidos = JSON.parse(productosVendidos); } catch(e) { productosVendidos = []; }
                    }
                    if (!Array.isArray(productosVendidos)) productosVendidos = [];

                    let detalles_billetes = item.detalles_billetes;
                    if (typeof detalles_billetes === 'string') {
                        try { detalles_billetes = JSON.parse(detalles_billetes); } catch(e) { detalles_billetes = null; }
                    }

                    let resumen_cierre = item.resumen_cierre;
                    if (typeof resumen_cierre === 'string') {
                        try { resumen_cierre = JSON.parse(resumen_cierre); } catch(e) { resumen_cierre = null; }
                    }

                    return {
                        ...item,
                        productosVendidos,
                        detalles_billetes,
                        resumen_cierre,
                        totalFinal: parseFloat(item.totalFinal) || 0
                    };
                });

                setRecaudaciones(normalizados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch (error) {
            console.error("Error al sincronizar historial de recaudaciones:", error);
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    };

    useEffect(() => {
        cargarRecaudaciones();
    }, []);

    const totalGlobal = useMemo(() => recaudaciones.reduce((s, c) => s + (Number(c.totalFinal) || 0), 0), [recaudaciones]);

    if (cargando) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6] text-[#222222] p-6">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-2">
                <FiLoader className="animate-spin w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-neutral-400">Sincronizando historial de recaudación...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#222222]">
            <div className="max-w-7xl mx-auto">
                {/* HEADER DEL MÓDULO */}
                <div className="p-6 pb-2 border-b border-[#EAEAE6]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                        <div>
                            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                                Contabilidad & Archivo
                            </span>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                                    Auditoría de Recaudación
                                </h1>
                                <button
                                    onClick={() => cargarRecaudaciones(true)}
                                    disabled={actualizando}
                                    title="Actualizar cierres"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
                                >
                                    <FiRefreshCw className={`w-3.5 h-3.5 ${actualizando ? "animate-spin" : ""}`} />
                                </button>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-1">
                                Interfaz contable y registro histórico de cierres de caja
                            </p>
                        </div>

                        <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex items-center justify-between gap-6 sm:min-w-[260px] group">
                            <div>
                                <span className="text-[10px] text-neutral-400 block">Total Acumulado</span>
                                <p className="text-xl font-bold text-neutral-900 mt-0.5">
                                    ${totalGlobal.toLocaleString('es-AR').replace(',00', '')}
                                </p>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                <FiTrendingUp className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIONES DE CONTENIDO */}
                <div className="p-6 space-y-4">
                    <ProductTrackerAdvanced recaudaciones={recaudaciones} />

                    {/* BARRA SUPERIOR DE SECCIÓN / CONTROLES */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="inline-flex bg-[#F2F2EE] p-1 rounded-xl text-[11px] font-medium text-neutral-600 border border-[#E9E9E4] self-start">
                            <button
                                onClick={() => setTab('historial')}
                                className={tab === 'historial' ? styles.tabActive : styles.tabInactive}
                            >
                                Reportes
                            </button>
                            <button
                                onClick={() => setTab('ranking')}
                                className={tab === 'ranking' ? styles.tabActive : styles.tabInactive}
                            >
                                Métricas
                            </button>
                        </div>
                        {tab === 'historial' && (
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => cargarRecaudaciones(true)}
                                    disabled={actualizando}
                                    className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                                >
                                    <FiRefreshCw className={`w-3.5 h-3.5 ${actualizando ? "animate-spin" : ""}`} />
                                    <span>Actualizar</span>
                                </button>
                                <button
                                    onClick={handleSort}
                                    className="inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors"
                                >
                                    Ordenar Movimientos {sortOrder === 'desc' ? '↓' : '↑'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* CONTENT */}
                    <div className="pb-12">
                        {tab === 'historial' && (
                            <div className="space-y-3">
                                {recaudaciones.length === 0 ? (
                                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-8 shadow-xs text-center">
                                        <h3 className="text-xs font-bold text-neutral-900">No hay cierres de caja archivados aún</h3>
                                        <p className="text-[11px] text-neutral-400 mt-1">Los cierres ejecutados automáticamente a las 23:00 hs se registrarán aquí.</p>
                                    </div>
                                ) : (
                                    recaudaciones.map(c => <CierreItem key={c.id} cierre={c} />)
                                )}
                            </div>
                        )}
                        {tab === 'ranking' && <TopProductosView datos={recaudaciones} />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistorialRecaudacionFinal;
