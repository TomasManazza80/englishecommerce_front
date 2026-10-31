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
        <div className="min-h-screen bg-[#FAF9F6] text-[#222222]">
            <div className="max-w-7xl mx-auto">
                {/* HEADER DEL MÓDULO */}
                <div className="p-6 pb-2 border-b border-[#EAEAE6]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                        <div>
                            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                                Inteligencia de Negocio
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                                Reporte de Ganancias
                            </h1>
                            <p className="text-[11px] text-neutral-400 mt-1">
                                Análisis financiero integral de ingresos, costos y utilidad neta
                            </p>
                        </div>
                        {reportData && (
                            <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                <button
                                    onClick={generatePDF}
                                    className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                                >
                                    <FiFileText className="w-3.5 h-3.5" />
                                    Descargar Informe PDF
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIONES DE CONTENIDO */}
                <div className="p-6 space-y-4">
                    {/* BARRA DE FILTROS */}
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col sm:flex-row gap-3.5 items-end">
                        <div className="w-full sm:flex-1">
                            <label className="text-[10px] text-neutral-400 block mb-1">
                                Fecha de Inicio
                            </label>
                            <div className="relative flex items-center w-full">
                                <FiCalendar className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                />
                            </div>
                        </div>
                        <div className="w-full sm:flex-1">
                            <label className="text-[10px] text-neutral-400 block mb-1">
                                Fecha de Fin
                            </label>
                            <div className="relative flex items-center w-full">
                                <FiCalendar className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading || !startDate || !endDate}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            {loading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSearch className="w-3.5 h-3.5" />}
                            Generar Reporte
                        </button>
                    </div>

                    {reportData && (
                        <>
                            {/* KPI CARDS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {/* Utilidad Bruta */}
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xs font-bold text-neutral-900">Utilidad Bruta (Ventas)</h3>
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                                <FiActivity className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-neutral-900 mt-2">{formatCurrency(grossProfit)}</p>
                                    </div>
                                    <div className="mt-3 pt-2.5 border-t border-[#F1F1EB] flex justify-between text-[11px] text-neutral-400">
                                        <span>Ingresos: {formatCurrency(reportData.resumen.totalIngresos)}</span>
                                        <span>Costos: -{formatCurrency(reportData.resumen.totalCostos)}</span>
                                    </div>
                                </div>

                                {/* Gastos Operativos */}
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xs font-bold text-neutral-900">Gastos Operativos</h3>
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                                <FiMinusCircle className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-neutral-900 mt-2">-{formatCurrency(totalExpenses)}</p>
                                    </div>
                                    <div className="mt-3 pt-2.5 border-t border-[#F1F1EB] flex justify-between text-[11px] text-neutral-400">
                                        <span>Fijos: {formatCurrency(totalFixedExpenses)}</span>
                                        <span>Variables: {formatCurrency(totalVariableExpenses)}</span>
                                    </div>
                                </div>

                                {/* Resultado Neto */}
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xs font-bold text-neutral-900">Resultado Neto Final</h3>
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                                <FiTrendingUp className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-neutral-900 mt-2">{formatCurrency(netProfit)}</p>
                                    </div>
                                    <div className="mt-3 pt-2.5 border-t border-[#F1F1EB]">
                                        <span
                                            className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                                netProfit >= 0
                                                    ? 'bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]'
                                                    : 'bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]'
                                            }`}
                                        >
                                            {netProfit >= 0 ? 'Rentabilidad Positiva' : 'Déficit del Periodo'}
                                        </span>
                                    </div>
                                </div>

                                {/* Margen */}
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="text-xs font-bold text-neutral-900">Margen Promedio</h3>
                                            <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                                <FiPieChart className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-neutral-900 mt-2">{reportData.resumen.margen.toFixed(2)}%</p>
                                    </div>
                                    <div className="mt-3 pt-2.5 border-t border-[#F1F1EB] text-[11px] text-neutral-400">
                                        Rendimiento sobre ventas
                                    </div>
                                </div>
                            </div>

                            {/* TABLAS DE GASTOS Y EGRESOS */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                                {/* Gastos Fijos */}
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                                    <div className="pb-3.5 mb-3.5 border-b border-[#F1F1EB] flex justify-between items-center">
                                        <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                            <FiActivity className="w-3.5 h-3.5 text-neutral-500" />
                                            Gastos Fijos Mensuales
                                        </h2>
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                            -{formatCurrency(totalFixedExpenses)}
                                        </span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {expensesData.fixed.length === 0 ? (
                                            <p className="text-[11px] text-neutral-400 text-center py-8">Sin registros en este periodo</p>
                                        ) : (
                                            expensesData.fixed.map((item, i) => (
                                                <div key={i} className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-bold text-neutral-900 block">{item.nombre}</span>
                                                        <span className="text-[10px] text-neutral-400 block">{new Date(item.vencimiento || item.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-neutral-700">-{formatCurrency(item.monto)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Egresos Variables */}
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                                    <div className="pb-3.5 mb-3.5 border-b border-[#F1F1EB] flex justify-between items-center">
                                        <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                            <FiMinusCircle className="w-3.5 h-3.5 text-neutral-500" />
                                            Egresos Variables de Caja
                                        </h2>
                                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                            -{formatCurrency(totalVariableExpenses)}
                                        </span>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {expensesData.variable.length === 0 ? (
                                            <p className="text-[11px] text-neutral-400 text-center py-8">Sin registros en este periodo</p>
                                        ) : (
                                            expensesData.variable.map((item, i) => (
                                                <div key={i} className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl px-3.5 py-2.5 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-bold text-neutral-900 block">{item.detalle}</span>
                                                        <span className="text-[10px] text-neutral-400 block">{new Date(item.createdAt || item.fecha).toLocaleDateString()}</span>
                                                    </div>
                                                    <span className="text-xs font-medium text-neutral-700">-{formatCurrency(item.monto)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* TABLA DE PRODUCTOS */}
                            <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                                <div className="pb-3.5 mb-3.5 border-b border-[#F1F1EB] flex justify-between items-center">
                                    <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                        <FiActivity className="w-3.5 h-3.5 text-neutral-500" />
                                        Desglose de Productos Vendidos
                                    </h2>
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                        {reportData.productos.length} registros
                                    </span>
                                </div>
                                <div className="max-h-96 overflow-y-auto overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b border-[#F1F1EB]">
                                                <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Producto</th>
                                                <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Origen</th>
                                                <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Fecha</th>
                                                <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Unidades</th>
                                                <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Venta</th>
                                                <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Costo</th>
                                                <th className="py-2.5 px-3 text-right text-[10px] text-neutral-400 font-medium uppercase">Utilidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F1F1EB]">
                                            {reportData.productos.map((prod, idx) => (
                                                <tr key={idx} className="hover:bg-[#FAF9F6] transition-colors">
                                                    <td className="py-2.5 px-3 text-xs font-bold text-neutral-900">{prod.nombre}</td>
                                                    <td className="py-2.5 px-3">
                                                        <span
                                                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                                                prod.origen === 'ECOMMERCE'
                                                                    ? 'bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]'
                                                                    : 'bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]'
                                                            }`}
                                                        >
                                                            {prod.origen === 'ECOMMERCE' ? <FiShoppingCart className="w-3 h-3" /> : <FiHome className="w-3 h-3" />}
                                                            {prod.origen}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-[11px] text-neutral-400">{new Date(prod.fecha).toLocaleDateString()}</td>
                                                    <td className="py-2.5 px-3 text-xs font-medium text-neutral-700">{prod.cantidad}</td>
                                                    <td className="py-2.5 px-3 text-xs font-medium text-neutral-700">{formatCurrency(prod.precioVentaTotal)}</td>
                                                    <td className="py-2.5 px-3 text-[11px] text-neutral-400">{formatCurrency(prod.costoTotal)}</td>
                                                    <td className="py-2.5 px-3 text-right text-xs font-bold text-neutral-900">{formatCurrency(prod.ganancia)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReporteGanancias;
