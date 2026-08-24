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
            <div className="text-center py-16 bg-white border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl font-sans">
                <FiPackage className="mx-auto text-[#727785] mb-3" size={40} />
                <p className="font-semibold text-[#727785] uppercase tracking-wider text-xs">No hay datos de ventas registrados</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans text-[#191c1e]">
            {/* Filter Section */}
            <div className="p-6 border border-[#e6e8ea] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl flex flex-wrap items-end gap-6">
                <div>
                    <label className="font-semibold text-xs text-[#424754] uppercase mb-1.5 block tracking-wider">Fecha Inicio</label>
                    <div className="flex items-center bg-[#f2f4f6] border border-[#c2c6d6] px-3.5 py-2.5 rounded-xl text-[#191c1e] text-xs font-semibold focus-within:border-[#0058be] transition-colors">
                        <FiCalendar className="text-[#0058be] mr-2.5" size={16} />
                        <input
                            type="date"
                            className="bg-transparent text-[#191c1e] text-xs outline-none font-semibold uppercase tracking-wider"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="font-semibold text-xs text-[#424754] uppercase mb-1.5 block tracking-wider">Fecha Fin</label>
                    <div className="flex items-center bg-[#f2f4f6] border border-[#c2c6d6] px-3.5 py-2.5 rounded-xl text-[#191c1e] text-xs font-semibold focus-within:border-[#0058be] transition-colors">
                        <FiCalendar className="text-[#0058be] mr-2.5" size={16} />
                        <input
                            type="date"
                            className="bg-transparent text-[#191c1e] text-xs outline-none font-semibold uppercase tracking-wider"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>
                <div className="pb-1">
                    <span className="font-bold text-xs text-[#0058be] uppercase tracking-wider bg-[#0058be]/10 px-3.5 py-2.5 rounded-xl block">
                        {filteredEntries.length} Registros Filtrados
                    </span>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'GANANCIA TOTAL', val: `$${stats.total.profit.toLocaleString('es-AR')}`, icon: <FiTrendingUp className="text-[#006947]" size={20} />, color: 'text-[#006947]' },
                    { label: 'VENTAS LOCAL', val: `$${stats.LocalFisico.profit.toLocaleString('es-AR')}`, icon: <FiShoppingCart className="text-[#0058be]" size={20} />, color: 'text-[#191c1e]' },
                    { label: 'REVENDEDORES', val: `$${stats.Revendedor.profit.toLocaleString('es-AR')}`, icon: <FiUserCheck className="text-[#4648d4]" size={20} />, color: 'text-[#191c1e]' },
                    { label: 'ECOMMERCE', val: `$${stats.ecommerce.profit.toLocaleString('es-AR')}`, icon: <FiGlobe className="text-[#00855b]" size={20} />, color: 'text-[#191c1e]' }
                ].map((card, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -3 }}
                        className="p-5 border border-[#e6e8ea] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-[11px] text-[#424754] uppercase mb-1 tracking-wider">{card.label}</p>
                                <p className={`text-2xl font-bold tracking-tight ${card.color}`}>{card.val}</p>
                            </div>
                            <div className="p-2.5 bg-[#f2f4f6] rounded-xl">{card.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Listado Detallado */}
            <div className="border border-[#e6e8ea] overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="p-4 bg-[#f2f4f6] border-b border-[#e6e8ea] flex justify-between items-center">
                    <h3 className="font-bold text-sm text-[#191c1e] tracking-tight uppercase">Detalle de Márgenes Ordenado por Fecha</h3>
                    <span className="font-semibold text-xs text-[#727785] uppercase tracking-wider">{filteredEntries.length} Registros</span>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#f2f4f6] border-b border-[#e6e8ea]">
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider">Fecha</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider">Producto</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider">Marca</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider">Categoría</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider">Origen</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider text-right">Monto Venta</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider text-right">Costo Total</th>
                                <th className="p-4 font-semibold text-[11px] text-[#424754] uppercase tracking-wider text-right">Ganancia</th>
                            </tr>
                        </thead>
                        <tbody className="font-medium text-xs divide-y divide-[#e6e8ea]">
                            {filteredEntries.map((entry, idx) => {
                                const revenue = parseFloat(entry.monto) || 0;
                                const cost = (parseFloat(entry.precioCompra) || 0) * (parseInt(entry.cantidad) || 1);
                                const profit = revenue - cost;

                                return (
                                    <tr key={idx} className="hover:bg-[#f7f9fb] transition-colors">
                                        <td className="p-4 text-[#727785] font-normal">{entry.fecha ? entry.fecha.split('T')[0] : 'S/D'}</td>
                                        <td className="p-4 text-[#191c1e] font-semibold uppercase">{entry.producto} <span className="text-[#0058be] ml-1 font-bold">x{entry.cantidad}</span></td>
                                        <td className="p-4 text-[#424754] font-medium uppercase">{entry.marca || '---'}</td>
                                        <td className="p-4 text-[#424754] uppercase">{entry.categoria || '---'}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${entry.origenDeVenta === 'LocalFisico' ? 'bg-[#0058be] text-white' :
                                                    entry.origenDeVenta === 'Revendedor' ? 'bg-[#4648d4] text-white' :
                                                        'bg-[#006947] text-white'
                                                }`}>
                                                {entry.origenDeVenta || 'ecommerce'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-semibold text-[#191c1e]">${revenue.toLocaleString('es-AR')}</td>
                                        <td className="p-4 text-right text-[#727785] font-medium">${cost.toLocaleString('es-AR')}</td>
                                        <td className={`p-4 text-right font-bold ${profit >= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
                                            ${profit.toLocaleString('es-AR')}
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