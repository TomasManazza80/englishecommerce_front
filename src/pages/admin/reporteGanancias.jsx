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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto p-8 bg-white min-h-screen text-black" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-gray-200 pb-6 gap-6">
                <div>
                    <h2 className="text-3xl text-black mb-2 font-black tracking-tighter uppercase flex items-center gap-4">
                        <FiTrendingUp className="text-black" /> REPORTE DE GANANCIAS
                    </h2>
                    <p className="font-bold uppercase text-[10px] text-gray-500 tracking-widest mt-2">
                        INTELIGENCIA DE NEGOCIO // ANÁLISIS DE GANANCIA NETA
                    </p>
                </div>
            </div>

            {/* FILTROS */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col md:flex-row gap-8 items-end">
                <div className="w-full md:w-auto flex-1 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Fecha de Inicio</label>
                    <div className="relative flex items-center w-full">
                        <FiCalendar className="absolute left-3 text-gray-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-10 pr-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all uppercase"
                        />
                    </div>
                </div>
                <div className="w-full md:w-auto flex-1 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Fecha de Fin</label>
                    <div className="relative flex items-center w-full">
                        <FiCalendar className="absolute left-3 text-gray-500" />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl py-3 pl-10 pr-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all uppercase"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading || !startDate || !endDate}
                    className="bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-8 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[46px]"
                >
                    {loading ? <FiLoader className="animate-spin" /> : <FiSearch />} GENERAR REPORTE
                </button>
            </div>

            {reportData && (
                <>
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        {/* Utilidad Bruta */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Utilidad Bruta (Ventas)</p>
                            <h3 className="text-2xl font-black text-black">{formatCurrency(grossProfit)}</h3>
                            <div className="mt-2 text-[10px] text-gray-500 flex justify-between font-medium">
                                <span>Ingresos: {formatCurrency(reportData.resumen.totalIngresos)}</span>
                                <span>Costos: -{formatCurrency(reportData.resumen.totalCostos)}</span>
                            </div>
                            <FiActivity className="absolute top-4 right-4 text-gray-100 text-5xl" />
                        </div>

                        {/* Gastos Operativos */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Gastos Operativos</p>
                            <h3 className="text-2xl font-black text-black">-{formatCurrency(totalExpenses)}</h3>
                            <div className="mt-2 text-[10px] text-gray-500 flex justify-between font-medium">
                                <span>Fijos: {formatCurrency(totalFixedExpenses)}</span>
                                <span>Variables: {formatCurrency(totalVariableExpenses)}</span>
                            </div>
                            <FiMinusCircle className="absolute top-4 right-4 text-gray-100 text-5xl" />
                        </div>

                        {/* Resultado Neto */}
                        <div className={`border rounded-2xl p-6 shadow-sm relative overflow-hidden ${netProfit >= 0 ? 'bg-black border-black text-white' : 'bg-gray-100 border-gray-300 text-black'}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${netProfit >= 0 ? 'text-gray-400' : 'text-gray-500'}`}>Resultado Neto Final</p>
                            <h3 className={`text-3xl font-black ${netProfit >= 0 ? 'text-white' : 'text-black'}`}>{formatCurrency(netProfit)}</h3>
                            <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${netProfit >= 0 ? 'text-gray-400' : 'text-gray-600'}`}>
                                {netProfit >= 0 ? 'Rentabilidad Positiva' : 'Déficit del Periodo'}
                            </p>
                            <FiTrendingUp className={`absolute top-4 right-4 text-5xl ${netProfit >= 0 ? 'text-white/10' : 'text-gray-200'}`} />
                        </div>

                        {/* Margen */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Margen Promedio</p>
                            <h3 className="text-2xl font-black text-black">{reportData.resumen.margen.toFixed(2)}%</h3>
                            <FiPieChart className="absolute top-4 right-4 text-gray-100 text-5xl" />
                        </div>
                    </div>

                    {/* TABLAS DE GASTOS Y EGRESOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Gastos Fijos */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                                <h3 className="font-black tracking-tighter uppercase text-black text-lg flex items-center gap-2">
                                    <FiActivity className="text-black" /> Gastos Fijos Mensuales
                                </h3>
                                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">-{formatCurrency(totalFixedExpenses)}</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {expensesData.fixed.length === 0 ? <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center py-10">Sin registros en este periodo</p> : (
                                    <div className="flex flex-col gap-2">
                                        {expensesData.fixed.map((item, i) => (
                                            <div key={i} className="p-3 rounded-xl border bg-white border-gray-200 hover:border-gray-300 transition-all flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-black uppercase">{item.nombre}</span>
                                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{new Date(item.vencimiento || item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-xs font-black text-black pr-2">-{formatCurrency(item.monto)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Egresos Variables */}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                                <h3 className="font-black tracking-tighter uppercase text-black text-lg flex items-center gap-2">
                                    <FiMinusCircle className="text-black" /> Egresos Variables de Caja
                                </h3>
                                <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">-{formatCurrency(totalVariableExpenses)}</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {expensesData.variable.length === 0 ? <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center py-10">Sin registros en este periodo</p> : (
                                    <div className="flex flex-col gap-2">
                                        {expensesData.variable.map((item, i) => (
                                            <div key={i} className="p-3 rounded-xl border bg-white border-gray-200 hover:border-gray-300 transition-all flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-black uppercase">{item.detalle}</span>
                                                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{new Date(item.createdAt || item.fecha).toLocaleDateString()}</span>
                                                </div>
                                                <span className="text-xs font-black text-black pr-2">-{formatCurrency(item.monto)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PDF Button */}
                    <div className="flex justify-end mb-8">
                        <button onClick={generatePDF} className="bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2 shadow-sm">
                            <FiFileText /> DESCARGAR INFORME PDF
                        </button>
                    </div>

                    {/* TABLA DE PRODUCTOS */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-center">
                            <h3 className="font-black tracking-tighter uppercase text-black text-lg flex items-center gap-2">
                                <FiActivity className="text-black" /> Desglose de Productos Vendidos
                            </h3>
                            <span className="bg-gray-100 text-black border border-gray-300 px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase">{reportData.productos.length} REGISTROS</span>
                        </div>
                        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                            {reportData.productos.map((prod, idx) => (
                                <div key={idx} className="p-4 rounded-xl border bg-white border-gray-200 hover:border-gray-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex flex-col gap-1 w-full md:w-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-black uppercase">{prod.nombre}</span>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-bold tracking-widest uppercase ${prod.origen === 'ECOMMERCE' ? 'bg-black text-white' : 'bg-gray-200 text-black'}`}>
                                                {prod.origen === 'ECOMMERCE' ? <FiShoppingCart /> : <FiHome />}
                                                {prod.origen}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500 uppercase tracking-widest">
                                            <span>FECHA: {new Date(prod.fecha).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>UNIDADES: <span className="font-bold text-black">{prod.cantidad}</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Venta</span>
                                            <span className="text-xs font-black text-black">{formatCurrency(prod.precioVentaTotal)}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Costo</span>
                                            <span className="text-xs font-black text-gray-500">{formatCurrency(prod.costoTotal)}</span>
                                        </div>
                                        <div className="flex flex-col items-end border-l pl-4 border-gray-200">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Utilidad</span>
                                            <span className="text-sm font-black text-black">{formatCurrency(prod.ganancia)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReporteGanancias;