import React, { useState } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import {
    FiCalendar, FiSearch, FiTrendingUp, FiDollarSign,
    FiPieChart, FiActivity, FiLoader, FiMinusCircle,
    FiFileText, FiShoppingCart, FiHome
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const ReporteGanancias = () => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState(null);
    const [expensesData, setExpensesData] = useState({ fixed: [], variable: [] });
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!startDate || !endDate) return;
        setLoading(true);
        try {
            // 1. Reporte de Ventas (Ingresos y Costos de Mercadería)
            const reportRes = await axios.get(`${API_URL}/reports/ganancias-netas`, {
                params: { startDate, endDate }
            });

            // 2. Gastos Fijos (Alquileres, Salarios, Servicios)
            const fixedRes = await axios.get(`${API_URL}/gastosMensuales/obtenerGastosMensuales`);

            // 3. Egresos Variables (Caja chica, gastos diarios)
            const variableRes = await axios.get(`${API_URL}/egresos/egress`);

            // Filtrado de Gastos por Fecha
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const filteredFixed = (fixedRes.data || []).filter(item => {
                const date = new Date(item.vencimiento || item.createdAt);
                return date >= start && date <= end;
            });

            const filteredVariable = (variableRes.data || []).filter(item => {
                const date = new Date(item.createdAt || item.fecha);
                return date >= start && date <= end;
            });

            setReportData(reportRes.data);
            setExpensesData({ fixed: filteredFixed, variable: filteredVariable });
        } catch (error) {
            console.error("Error fetching report:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);
    };

    // Cálculos Financieros
    const totalFixedExpenses = expensesData.fixed.reduce((acc, item) => acc + parseFloat(item.monto), 0);
    const totalVariableExpenses = expensesData.variable.reduce((acc, item) => acc + parseFloat(item.monto), 0);
    const totalExpenses = totalFixedExpenses + totalVariableExpenses;

    const grossProfit = reportData?.resumen?.gananciaNetaTotal || 0; // Ganancia por venta de productos
    const netProfit = grossProfit - totalExpenses; // Resultado final

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("FEDE CELL", 15, 20);
        doc.setFontSize(10);
        doc.text("REPORTE FINANCIERO INTEGRAL", 15, 28);
        doc.text(`PERIODO: ${startDate} al ${endDate}`, 15, 34);

        let y = 50;

        // Resumen Ejecutivo
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("ESTADO DE RESULTADOS", 15, y);
        y += 10;

        const addRow = (label, value, isBold = false, color = [0, 0, 0]) => {
            doc.setFont("helvetica", isBold ? "bold" : "normal");
            doc.setTextColor(...color);
            doc.text(label, 15, y);
            doc.text(formatCurrency(value), 190, y, { align: "right" });
            y += 8;
        };

        addRow("Ingresos por Ventas", reportData.resumen.totalIngresos);
        addRow("Costo de Mercadería Vendida (CMV)", -reportData.resumen.totalCostos, false, [100, 100, 100]);
        y += 2;
        doc.setDrawColor(200);
        doc.line(15, y - 6, 195, y - 6);
        addRow("UTILIDAD BRUTA", grossProfit, true);

        y += 5;
        addRow("Gastos Fijos (Alquileres, Salarios)", -totalFixedExpenses, false, [100, 100, 100]);
        addRow("Gastos Variables / Egresos", -totalVariableExpenses, false, [100, 100, 100]);

        y += 2;
        doc.setLineWidth(0.5);
        doc.line(15, y - 6, 195, y - 6);
        y += 2;

        const resultColor = netProfit >= 0 ? [0, 0, 0] : [100, 100, 100];
        doc.setFontSize(16);
        addRow("RESULTADO NETO DEL PERIODO", netProfit, true, resultColor);

        // --- NUEVA PÁGINA: DETALLE DE GASTOS ---
        if (expensesData.fixed.length > 0 || expensesData.variable.length > 0) {
            doc.addPage();

            // Header Página 2
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, 210, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text("DETALLE DE GASTOS Y EGRESOS", 15, 13);

            let y = 30;

            const addExpenseTable = (title, items, nameKey, dateKey) => {
                if (items.length === 0) return;

                if (y > 250) { doc.addPage(); y = 30; }

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(title, 15, y);
                y += 6;

                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(100);
                doc.text("FECHA", 15, y);
                doc.text("CONCEPTO / DETALLE", 40, y);
                doc.text("MONTO", 190, y, { align: "right" });
                y += 4;
                doc.setDrawColor(200);
                doc.line(15, y - 2, 195, y - 2);

                doc.setTextColor(0);
                items.forEach(item => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(new Date(item[dateKey] || item.createdAt).toLocaleDateString(), 15, y);
                    doc.text((item[nameKey] || '').substring(0, 60), 40, y);
                    doc.text(formatCurrency(item.monto), 190, y, { align: "right" });
                    y += 6;
                });
                y += 10;
            };

            addExpenseTable("GASTOS FIJOS (Mensuales)", expensesData.fixed, "nombre", "vencimiento");
            addExpenseTable("EGRESOS VARIABLES (Caja/Operativos)", expensesData.variable, "detalle", "createdAt");
        }

        // --- NUEVA PÁGINA: DETALLE DE PRODUCTOS VENDIDOS ---
        if (reportData.productos.length > 0) {
            doc.addPage();

            // Header Página 3
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, 210, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.text("DESGLOSE DE PRODUCTOS VENDIDOS", 15, 13);

            let y = 30;

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text("FECHA", 15, y);
            doc.text("PRODUCTO", 35, y);
            doc.text("ORIGEN", 100, y);
            doc.text("CANT", 135, y, { align: "right" });
            doc.text("VENTA", 160, y, { align: "right" });
            doc.text("COSTO", 180, y, { align: "right" });
            doc.text("GANANCIA", 200, y, { align: "right" });

            y += 4;
            doc.setDrawColor(200);
            doc.line(15, y - 2, 200, y - 2);

            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            reportData.productos.forEach(prod => {
                if (y > 280) {
                    doc.addPage();
                    y = 20;
                    // Header de tabla en nueva página
                    doc.setFont("helvetica", "bold");
                    doc.text("FECHA", 15, y);
                    doc.text("PRODUCTO", 35, y);
                    doc.text("ORIGEN", 100, y);
                    doc.text("CANT", 135, y, { align: "right" });
                    doc.text("VENTA", 160, y, { align: "right" });
                    doc.text("COSTO", 180, y, { align: "right" });
                    doc.text("GANANCIA", 200, y, { align: "right" });
                    y += 4;
                    doc.line(15, y - 2, 200, y - 2);
                    doc.setFont("helvetica", "normal");
                }

                doc.text(new Date(prod.fecha).toLocaleDateString(), 15, y);
                doc.text(prod.nombre.substring(0, 45), 35, y);
                doc.text(prod.origen, 100, y);
                doc.text(prod.cantidad.toString(), 135, y, { align: "right" });
                doc.text(formatCurrency(prod.precioVentaTotal), 160, y, { align: "right" });
                doc.text(formatCurrency(prod.costoTotal), 180, y, { align: "right" });

                const gan = parseFloat(prod.ganancia) || 0;
                if (gan < 0) doc.setTextColor(100, 100, 100);
                else doc.setTextColor(0, 0, 0);

                doc.text(formatCurrency(gan), 200, y, { align: "right" });
                doc.setTextColor(0);

                y += 6;
            });
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Generado por Sistema de Gestión FedeCell", 15, 280);

        doc.save(`Reporte_Financiero_${startDate}_${endDate}.pdf`);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto p-4 font-['Inter']">
            <style>
                {`
                input[type="date"]::-webkit-calendar-picker-indicator {
                    cursor: pointer;
                    filter: invert(1);
                    opacity: 0.8;
                    transition: opacity 0.2s;
                    position: absolute;
                    right: 10px;
                    width: 100%;
                    height: 100%;
                    opacity: 0;
                    z-index: 10;
                }
                .date-picker-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: #000;
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: all 0.3s;
                    width: 100%;
                }
                .date-picker-wrapper:hover {
                    border-color: #fff;
                }
                `}
            </style>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-white/10 pb-6 gap-6">
                <div>
                    <h2 className="font-['Inter'] font-[900] uppercase tracking-tighter text-white text-3xl md:text-4xl flex items-center gap-4">
                        <FiTrendingUp className="text-white" /> REPORTE DE <span className="text-white">GANANCIAS</span>
                    </h2>
                    <p className="font-['Inter'] font-bold uppercase text-[10px] text-zinc-600 mt-2 tracking-[0.4em]">
                        INTELIGENCIA DE NEGOCIO // ANÁLISIS DE GANANCIA NETA
                    </p>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-zinc-900/50 border border-white/5 p-6 mb-10 flex flex-col md:flex-row gap-6 items-end">
                <div className="w-full md:w-auto flex-1">
                    <label className="font-['Inter'] text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Fecha de Inicio</label>
                    <div className="date-picker-wrapper px-4 py-3">
                        <FiCalendar className="text-zinc-500 mr-3" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-white font-['Inter'] text-xs outline-none uppercase w-full cursor-pointer relative z-0"
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto flex-1">
                    <label className="font-['Inter'] text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Fecha de Fin</label>
                    <div className="date-picker-wrapper px-4 py-3">
                        <FiCalendar className="text-zinc-500 mr-3" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-white font-['Inter'] text-xs outline-none uppercase w-full cursor-pointer relative z-0"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading || !startDate || !endDate}
                    className="bg-white text-black font-['Inter'] font-black text-[11px] uppercase tracking-widest py-[15px] px-8 hover:bg-zinc-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-full shadow-[0_5px_15px_rgba(255,255,255,0.1)]"
                >
                    {loading ? <FiLoader className="animate-spin" /> : <FiSearch />} GENERAR REPORTE
                </button>
            </div>

            {reportData && (
                <>
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                        {/* Utilidad Bruta */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 relative overflow-hidden">
                            <p className="font-['Inter'] text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Utilidad Bruta (Ventas)</p>
                            <h3 className="text-2xl font-black text-white font-['Inter']">{formatCurrency(grossProfit)}</h3>
                            <div className="mt-2 text-[10px] text-zinc-400 flex justify-between">
                                <span>Ingresos: {formatCurrency(reportData.resumen.totalIngresos)}</span>
                                <span>Costos: -{formatCurrency(reportData.resumen.totalCostos)}</span>
                            </div>
                            <FiActivity className="absolute top-4 right-4 text-zinc-800 text-4xl opacity-50" />
                        </div>

                        {/* Gastos Operativos */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 relative overflow-hidden">
                            <p className="font-['Inter'] text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Gastos Operativos</p>
                            <h3 className="text-2xl font-black text-white font-['Inter']">-{formatCurrency(totalExpenses)}</h3>
                            <div className="mt-2 text-[10px] text-zinc-400 flex justify-between">
                                <span>Fijos: {formatCurrency(totalFixedExpenses)}</span>
                                <span>Variables: {formatCurrency(totalVariableExpenses)}</span>
                            </div>
                            <FiMinusCircle className="absolute top-4 right-4 text-zinc-800 text-4xl opacity-50" />
                        </div>

                        {/* Resultado Neto */}
                        <div className={`p-6 relative overflow-hidden shadow-2xl ${netProfit >= 0 ? 'bg-white text-black' : 'bg-zinc-900 text-white border border-zinc-800'}`}>
                            <p className={`font-['Inter'] text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${netProfit >= 0 ? 'text-zinc-500' : 'text-zinc-400'}`}>Resultado Neto Final</p>
                            <h3 className="text-3xl font-black font-['Inter']">{formatCurrency(netProfit)}</h3>
                            <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${netProfit >= 0 ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                {netProfit >= 0 ? 'Rentabilidad Positiva' : 'Déficit del Periodo'}
                            </p>
                            <FiTrendingUp className={`absolute top-4 right-4 text-4xl opacity-10 ${netProfit >= 0 ? 'text-black' : 'text-white'}`} />
                        </div>

                        {/* Margen */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 relative overflow-hidden">
                            <p className="font-['Inter'] text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Margen Promedio</p>
                            <h3 className="text-2xl font-black text-white font-['Inter']">{reportData.resumen.margen.toFixed(2)}%</h3>
                            <FiPieChart className="absolute top-4 right-4 text-zinc-800 text-4xl opacity-50" />
                        </div>
                    </div>

                    {/* TABLAS DE GASTOS Y EGRESOS (VISUALIZACIÓN EN PANTALLA) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                        {/* Gastos Fijos */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/5">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-['Inter'] font-bold text-white uppercase text-sm tracking-wider flex items-center gap-2">
                                    <FiActivity size={14} className="text-white" /> Gastos Fijos Mensuales
                                </h3>
                                <span className="text-zinc-300 font-mono text-xs font-black">-{formatCurrency(totalFixedExpenses)}</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {expensesData.fixed.length === 0 ? <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest text-center py-10 italic">Sin registros en este periodo</p> : (
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="text-zinc-500 uppercase font-black bg-white/[0.02]">
                                            <tr><th className="py-3 pl-4">Fecha</th><th className="py-3">Concepto</th><th className="py-3 text-right pr-4">Monto</th></tr>
                                        </thead>
                                        <tbody className="font-['Inter'] text-zinc-400">
                                            {expensesData.fixed.map((item, i) => (
                                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 pl-4 text-zinc-500">{new Date(item.vencimiento || item.createdAt).toLocaleDateString()}</td>
                                                    <td className="py-3 text-white uppercase font-bold group-hover:text-white transition-colors">{item.nombre}</td>
                                                    <td className="py-3 text-right text-zinc-300 font-black pr-4">-{formatCurrency(item.monto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        {/* Egresos Variables */}
                        <div className="bg-black/40 backdrop-blur-xl border border-white/5">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-['Inter'] font-bold text-white uppercase text-sm tracking-wider flex items-center gap-2">
                                    <FiMinusCircle size={14} className="text-white" /> Egresos Variables de Caja
                                </h3>
                                <span className="text-zinc-300 font-mono text-xs font-black">-{formatCurrency(totalVariableExpenses)}</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {expensesData.variable.length === 0 ? <p className="text-zinc-700 text-[10px] font-black uppercase tracking-widest text-center py-10 italic">Sin registros en este periodo</p> : (
                                    <table className="w-full text-left text-[10px]">
                                        <thead className="text-zinc-500 uppercase font-black bg-white/[0.02]">
                                            <tr><th className="py-3 pl-4">Fecha</th><th className="py-3">Detalle</th><th className="py-3 text-right pr-4">Monto</th></tr>
                                        </thead>
                                        <tbody className="font-['Inter'] text-zinc-400">
                                            {expensesData.variable.map((item, i) => (
                                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                                                    <td className="py-3 pl-4 text-zinc-500">{new Date(item.createdAt || item.fecha).toLocaleDateString()}</td>
                                                    <td className="py-3 text-white uppercase font-bold group-hover:text-white transition-colors">{item.detalle}</td>
                                                    <td className="py-3 text-right text-zinc-300 font-black pr-4">-{formatCurrency(item.monto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PDF Button */}
                    <div className="flex justify-end mb-8">
                        <button onClick={generatePDF} className="bg-white text-black font-['Inter'] font-black text-[10px] uppercase tracking-widest py-4 px-8 hover:bg-zinc-200 transition-all flex items-center gap-2 shadow-[0_10px_30px_rgba(255,255,255,0.1)]">
                            <FiFileText size={16} /> DESCARGAR INFORME FINANCIERO COMPLETO PDF
                        </button>
                    </div>

                    {/* TABLA DE PRODUCTOS */}
                    <div className="bg-black/40 backdrop-blur-xl border border-white/5">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                            <h3 className="font-['Inter'] font-bold text-white uppercase text-sm tracking-wider flex items-center gap-2">
                                <FiActivity size={14} className="text-white" /> Desglose de Productos Vendidos
                            </h3>
                            <span className="bg-white/10 text-white border border-white/20 px-3 py-1 text-[9px] font-black tracking-widest uppercase">{reportData.productos.length} REGISTROS</span>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-white/[0.03]">
                                        <th className="p-4 font-['Inter'] text-[9px] font-black text-zinc-500 uppercase tracking-widest">Fecha</th>
                                        <th className="p-4 font-['Inter'] text-[9px] font-black text-zinc-500 uppercase tracking-widest">Producto</th>
                                        <th className="p-4 font-['Inter'] text-[9px] font-black text-zinc-500 uppercase tracking-widest">Origen</th>
                                        <th className="p-4 font-['Inter'] text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">Monto Venta</th>
                                        <th className="p-4 font-['Inter'] text-[9px] font-black text-zinc-500 uppercase tracking-widest text-right">CMV (Costo)</th>
                                        <th className="p-4 font-['Inter'] text-[9px] font-black text-white uppercase tracking-widest text-right bg-white/5">Utilidad Neta</th>
                                    </tr>
                                </thead>
                                <tbody className="font-['Inter'] text-[10px]">
                                    {reportData.productos.map((prod, idx) => (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-4 text-zinc-500">{new Date(prod.fecha).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <div className="text-white font-black uppercase group-hover:text-white transition-colors">{prod.nombre}</div>
                                                <div className="text-[9px] text-zinc-600 mt-1 font-black flex items-center gap-1">
                                                    UNIDADES: <span className="text-zinc-400 bg-white/5 px-1.5 rounded-sm">{prod.cantidad}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`flex items-center gap-1.5 w-fit px-3 py-1 text-[8px] font-black tracking-widest border ${prod.origen === 'ECOMMERCE'
                                                    ? 'bg-white/10 text-white border-white/20'
                                                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                                    }`}>
                                                    {prod.origen === 'ECOMMERCE' ? <FiShoppingCart size={10} /> : <FiHome size={10} />}
                                                    {prod.origen}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right text-zinc-300 font-bold">{formatCurrency(prod.precioVentaTotal)}</td>
                                            <td className="p-4 text-right text-zinc-500">{formatCurrency(prod.costoTotal)}</td>
                                            <td className="p-4 text-right text-white font-black text-xs bg-white/[0.02]">{formatCurrency(prod.ganancia)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReporteGanancias;