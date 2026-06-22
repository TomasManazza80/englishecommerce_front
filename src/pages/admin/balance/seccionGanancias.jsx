import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FiTrendingUp,
    FiShoppingCart,
    FiUserCheck,
    FiGlobe,
    FiPackage,
    FiDollarSign,
    FiCalendar,
    FiFilter
} from 'react-icons/fi';

const SeccionGanancias = ({ entries }) => {
    // Default: Last 30 days
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Initialize with current month or last 30 days if desired. 
        // For now, let's leave empty to show ALL, or user can set one.
        // Or set default to first and last day of current month:
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDay);
        setEndDate(lastDay);
    }, []);

    const filteredEntries = useMemo(() => {
        if (!entries) return [];
        return entries.filter(entry => {
            if (!entry.fecha) return true;
            // Normalizar fecha del entry (asumiendo ISO o YYYY-MM-DD)
            const entryDate = entry.fecha.split('T')[0];
            const start = startDate;
            const end = endDate;

            if (start && entryDate < start) return false;
            if (end && entryDate > end) return false;
            return true;
        });
    }, [entries, startDate, endDate]);

    const stats = useMemo(() => {
        const dataToProcess = filteredEntries;

        const totals = {
            LocalFisico: { revenue: 0, cost: 0, profit: 0, count: 0 },
            Revendedor: { revenue: 0, cost: 0, profit: 0, count: 0 },
            ecommerce: { revenue: 0, cost: 0, profit: 0, count: 0 },
            total: { revenue: 0, cost: 0, profit: 0, count: 0 }
        };

        dataToProcess.forEach(entry => {
            const origin = entry.origenDeVenta || 'ecommerce';
            const revenue = parseFloat(entry.monto) || 0;
            const cost = (parseFloat(entry.precioCompra) || 0) * (parseInt(entry.cantidad) || 1);
            const profit = revenue - cost;

            if (totals[origin]) {
                totals[origin].revenue += revenue;
                totals[origin].cost += cost;
                totals[origin].profit += profit;
                totals[origin].count += (parseInt(entry.cantidad) || 1);
            }

            totals.total.revenue += revenue;
            totals.total.cost += cost;
            totals.total.profit += profit;
            totals.total.count += (parseInt(entry.cantidad) || 1);
        });

        return totals;
    }, [filteredEntries]);

    if (!entries || entries.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 border border-white/10 font-['Inter']">
                <FiPackage className="mx-auto text-zinc-800 mb-4" size={48} />
                <p className="font-bold text-zinc-500 uppercase tracking-widest text-xs">No hay datos de ventas registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 font-['Inter']">
            {/* Filter Section */}
            <div className="glass-container p-6 border border-white/5 flex flex-wrap items-end gap-6 bg-[#0A0A0A]/80 backdrop-blur-xl rounded-2xl">
                <div>
                    <label className="font-bold text-[10px] text-zinc-500 uppercase mb-2 block tracking-widest">Fecha_Inicio</label>
                    <div className="flex items-center bg-black border border-white/10 px-4 py-2 hover:border-white transition-colors rounded-xl">
                        <FiCalendar className="text-zinc-500 mr-3" />
                        <input
                            type="date"
                            className="bg-transparent text-white text-xs outline-none uppercase font-bold tracking-widest"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="font-bold text-[10px] text-zinc-500 uppercase mb-2 block tracking-widest">Fecha_Fin</label>
                    <div className="flex items-center bg-black border border-white/10 px-4 py-2 hover:border-white transition-colors rounded-xl">
                        <FiCalendar className="text-zinc-500 mr-3" />
                        <input
                            type="date"
                            className="bg-transparent text-white text-xs outline-none uppercase font-bold tracking-widest"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="pb-2">
                    <span className="font-black text-[10px] text-white uppercase tracking-widest bg-white/10 px-3 py-2 rounded-lg">
                        {filteredEntries.length} Registros_Filtrados
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'GANANCIA_TOTAL', val: `$${stats.total.profit.toLocaleString()}`, icon: <FiTrendingUp />, color: 'text-white' },
                    { label: 'VENTAS_LOCAL', val: `$${stats.LocalFisico.profit.toLocaleString()}`, icon: <FiShoppingCart />, color: 'text-zinc-300' },
                    { label: 'REVENDEDORES', val: `$${stats.Revendedor.profit.toLocaleString()}`, icon: <FiUserCheck />, color: 'text-zinc-300' },
                    { label: 'ECOMMERCE', val: `$${stats.ecommerce.profit.toLocaleString()}`, icon: <FiGlobe />, color: 'text-zinc-300' }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="glass-container p-6 border border-white/5 bg-white/[0.02] rounded-2xl"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-[8px] text-zinc-500 uppercase mb-2 tracking-widest">{card.label}</p>
                                <p className={`text-2xl font-black tracking-tighter ${card.color}`}>{card.val}</p>
                            </div>
                            <div className="text-zinc-600">{card.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Listado Detallado */}
            <div className="glass-container border border-white/10 overflow-hidden rounded-2xl bg-[#0A0A0A]/80 backdrop-blur-xl">
                <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-black text-xs text-white tracking-widest uppercase">DETALLE_DE_MÁRGENES_ORDENADO_POR_FECHA</h3>
                    <span className="font-bold text-[9px] text-zinc-500 uppercase tracking-widest">{filteredEntries.length} REGISTROS_SYNC</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/50 border-b border-white/10">
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest">Fecha</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest">Producto</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest">Marca</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest">Categoría</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest">Origen</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest text-right">Monto Venta</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest text-right">Costo Total</th>
                                <th className="p-4 font-bold text-[9px] text-zinc-500 uppercase tracking-widest text-right">Ganancia</th>
                            </tr>
                        </thead>
                        <tbody className="font-medium text-[10px]">
                            {filteredEntries.map((entry, idx) => {
                                const revenue = parseFloat(entry.monto) || 0;
                                const cost = (parseFloat(entry.precioCompra) || 0) * (parseInt(entry.cantidad) || 1);
                                const profit = revenue - cost;

                                return (
                                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4 text-zinc-500">{entry.fecha ? entry.fecha.split('T')[0] : 'S/D'}</td>
                                        <td className="p-4 text-white font-bold uppercase">{entry.producto} <span className="text-zinc-600 ml-2 font-black">x{entry.cantidad}</span></td>
                                        <td className="p-4 text-zinc-400 font-bold uppercase">{entry.marca || '---'}</td>
                                        <td className="p-4 text-zinc-400 uppercase">{entry.categoria || '---'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${entry.origenDeVenta === 'LocalFisico' ? 'bg-white text-black' :
                                                    entry.origenDeVenta === 'Revendedor' ? 'bg-zinc-800 text-white border border-white/10' :
                                                        'bg-white/10 text-white'
                                                }`}>
                                                {entry.origenDeVenta || 'ecommerce'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-zinc-300">${revenue.toLocaleString()}</td>
                                        <td className="p-4 text-right text-zinc-600 font-bold">${cost.toLocaleString()}</td>
                                        <td className={`p-4 text-right font-black text-[11px] ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            ${profit.toLocaleString()}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SeccionGanancias;