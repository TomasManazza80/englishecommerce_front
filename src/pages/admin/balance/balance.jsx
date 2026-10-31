import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentsSection from './seccionPagos';
import TotalsSection from './seccionTotales';
import EgressForm from './seccionEgresos';
import PersonalBalanceModule from './balancePersonal';
import MonthlyExpenseTracker from './gastosMensuales';
import SeccionGanancias from './seccionGanancias';
import axios from 'axios';
import Swal from 'sweetalert2';

import {
    ChartBarIcon,
    MinusCircleIcon,
    UserIcon,
    CalendarDaysIcon,
    PlusIcon,
    XMarkIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/solid';
import { FiTrendingUp, FiBriefcase } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';

const mockBalanceData = {
    payments: {
        efectivo: 125000, debito: 85000, tarjeta_credito: 55000, transferencia: 60000,
        credito_1: 45000, credito_2: 20000, credito_3: 15000, credito_4: 10000,
        credito_5: 5000, credito_6: 3000,
    },
    egresos: 30000,
    total_ventas: 423000,
};

const BalanceModule = () => {
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('balance');
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [productsDetail, setProductsDetail] = useState([]);
    const [allEntries, setAllEntries] = useState([]);

    // --- MANEJO AJUSTE ARQUEO DE CAJA ---
    const [isEditingBills, setIsEditingBills] = useState(false);
    const [editedBillTotals, setEditedBillTotals] = useState({});
    const [isAdjusting, setIsAdjusting] = useState(false);

    const [showManualForm, setShowManualForm] = useState(false);
    const [manualEntry, setManualEntry] = useState({
        producto: '', monto: '', cantidad: 1, precioCompra: 0,
        marca: '', categoria: '', proveedor: '',
        metodo_pago: 'transferencia',
        detalles_mixto: { efectivo: '', transferencia: '', debito: '' },
        fecha: new Date().toISOString().split('T')[0]
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchBalanceData();
    }, []);

    const fetchBalanceData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/balanceMensual/ObtenBalanceMensual`);
            const data = response.data || [];
            setAllEntries(data);

            const payments = {
                efectivo: 0, debito: 0, tarjeta_credito: 0, transferencia: 0,
                credito_1: 0, credito_2: 0, credito_3: 0, credito_4: 0,
                credito_5: 0, credito_6: 0, mercadopago: 0
            };

            let totalVentas = 0;
            const billTotals = {
                20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
            };

            data.forEach(entry => {
                const monto = parseFloat(entry.monto) || 0;
                const metodo = entry.metodo_pago;

                if (metodo === 'mixto' && entry.detalles_pago?.mixto) {
                    const mixtoData = entry.detalles_pago.mixto;
                    if (mixtoData.efectivo) payments.efectivo += parseFloat(mixtoData.efectivo) || 0;
                    if (mixtoData.transferencia) payments.transferencia += parseFloat(mixtoData.transferencia) || 0;
                    if (mixtoData.debito) payments.debito += parseFloat(mixtoData.debito) || 0;

                    if (!payments.mixto) payments.mixto = 0;
                    payments.mixto += monto;
                } else if (payments.hasOwnProperty(metodo)) {
                    payments[metodo] += monto;
                }

                totalVentas += monto;

                if (metodo === 'efectivo' && entry.detalles_pago?.billetes) {
                    Object.entries(entry.detalles_pago.billetes).forEach(([den, cant]) => {
                        if (billTotals.hasOwnProperty(den)) {
                            billTotals[den] += parseInt(cant) || 0;
                        }
                    });
                }

                if (metodo === 'efectivo' && entry.detalles_pago?.vuelto) {
                    Object.entries(entry.detalles_pago.vuelto).forEach(([den, cant]) => {
                        if (billTotals.hasOwnProperty(den)) {
                            billTotals[den] -= parseInt(cant) || 0;
                        }
                    });
                }
            });

            setBalance({
                payments,
                egresos: 0,
                total_ventas: totalVentas,
                billTotals
            });
        } catch (error) {
            console.error("Error fetching balance data:", error);
            setBalance(mockBalanceData);
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_URL}/balanceMensual/CreaBalanceMensual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...manualEntry,
                    monto: parseFloat(manualEntry.monto),
                    cantidad: parseInt(manualEntry.cantidad),
                    detalles_pago: manualEntry.metodo_pago === 'mixto' ? { mixto: manualEntry.detalles_mixto } : null
                }),
            });
            if (response.ok) {
                Swal.fire({ title: 'ÉXITO', text: 'Operación registrada correctamente en el balance.', icon: 'success', confirmButtonColor: '#19191B' });
                setManualEntry({
                    producto: '', monto: '', cantidad: 1, precioCompra: 0,
                    marca: '', categoria: '', proveedor: '',
                    metodo_pago: 'transferencia',
                    detalles_mixto: { efectivo: '', transferencia: '', debito: '' },
                    fecha: new Date().toISOString().split('T')[0]
                });
                setShowManualForm(false);
                fetchBalanceData();
            }
        } catch (err) {
            Swal.fire({ title: 'ERROR', text: 'Error de conexión con el servidor.', icon: 'error', confirmButtonColor: '#19191B' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAjusteArqueo = async () => {
        setIsAdjusting(true);
        try {
            const currentTotals = balance.billTotals;
            const differences = {};
            let totalDiffMonto = 0;
            let hasChanges = false;

            Object.entries(editedBillTotals).forEach(([den, newCant]) => {
                const numCant = parseInt(newCant) || 0;
                const oldCant = currentTotals[den] || 0;
                const diff = numCant - oldCant;

                if (diff !== 0) {
                    differences[den] = diff;
                    totalDiffMonto += (diff * parseInt(den));
                    hasChanges = true;
                }
            });

            if (!hasChanges) {
                setIsEditingBills(false);
                setIsAdjusting(false);
                return;
            }

            const billetesParaSumar = {};
            const billetesParaRestar = {};

            Object.entries(differences).forEach(([den, diff]) => {
                if (diff > 0) {
                    billetesParaSumar[den] = diff;
                } else if (diff < 0) {
                    billetesParaRestar[den] = Math.abs(diff);
                }
            });

            const transaccionId = Date.now().toString(36) + Math.random().toString(36).substr(2);

            const response = await fetch(`${API_URL}/balanceMensual/CreaBalanceMensual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producto: "AJUSTE MANUAL ARQUEO DE CAJA",
                    monto: totalDiffMonto,
                    cantidad: 1,
                    precioCompra: 0,
                    marca: "SISTEMA",
                    categoria: "AJUSTE",
                    proveedor: "ADMIN",
                    metodo_pago: 'efectivo',
                    detalles_pago: {
                        efectivo: '',
                        billetes: Object.keys(billetesParaSumar).length > 0 ? billetesParaSumar : null,
                        vuelto: Object.keys(billetesParaRestar).length > 0 ? billetesParaRestar : null
                    },
                    fecha: new Date().toISOString().split('T')[0],
                    id_transaccion: transaccionId,
                    cliente: "Arqueo Interno",
                    origenDeVenta: "Administracion"
                }),
            });

            if (response.ok) {
                Swal.fire({ title: 'ÉXITO', text: 'Ajuste de arqueo aplicado correctamente.', icon: 'success', confirmButtonColor: '#19191B' });
                setIsEditingBills(false);
                fetchBalanceData();
            } else {
                Swal.fire({ title: 'ERROR', text: 'Error al aplicar el ajuste de arqueo.', icon: 'error', confirmButtonColor: '#19191B' });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({ title: 'ERROR', text: 'Error de conexión al guardar el ajuste.', icon: 'error', confirmButtonColor: '#19191B' });
        } finally {
            setIsAdjusting(false);
        }
    };

    const handlePaymentClick = (paymentType) => {
        if (selectedPayment === paymentType) {
            setSelectedPayment(null);
            setProductsDetail([]);
            return;
        }
        setSelectedPayment(paymentType);
        const filteredProducts = allEntries.filter(p => p.metodo_pago === paymentType).map(p => ({
            ...p,
            producto: p.tarjeta_digitos ? `${p.producto} (Tarjeta ****${p.tarjeta_digitos})` : p.producto
        }));
        setProductsDetail(filteredProducts);
    };

    const tabsMenu = [
        { id: 'balance', labelDesktop: 'Balance Diario', labelMobile: 'Balance', icon: ChartBarIcon },
        { id: 'egresos', labelDesktop: 'Cargar Egresos', labelMobile: 'Egresos', icon: MinusCircleIcon },
        { id: 'personal', labelDesktop: 'Personal', labelMobile: 'Personal', icon: UserIcon },
        { id: 'ganancias', labelDesktop: 'Ganancias', labelMobile: 'Ganancias', icon: FiTrendingUp },
        { id: 'monthlyExpenses', labelDesktop: 'Mensuales', labelMobile: 'Mensual', icon: CalendarDaysIcon },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#222222] flex flex-col items-center justify-center p-6">
            <div className="bg-white border border-[#ECECE6] rounded-2xl p-6 shadow-xs flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="text-center">
                    <h3 className="text-xs font-bold text-neutral-900">Cargando Balance</h3>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                        Obteniendo datos del sistema...
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#222222] pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto">
                {/* ── HEADER DEL MÓDULO ── */}
                <div className="p-6 pb-2 border-b border-[#EAEAE6]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                                Administración Financiera
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                                Sistema Balance
                            </h1>
                            <p className="text-[11px] text-neutral-400 mt-1">
                                Panel de administración y control financiero profesional
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5 self-start sm:self-auto">
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#29974D] animate-pulse shrink-0" />
                                En Vivo
                            </span>
                        </div>
                    </div>

                    {/* ── SUB-TABS DE NAVEGACIÓN ── */}
                    <div className="hidden md:flex items-center gap-6 mt-6 border-b border-[#EBEBE6] text-xs overflow-x-auto">
                        {tabsMenu.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center gap-2 pb-3 whitespace-nowrap transition-colors ${
                                    activeTab === tab.id
                                        ? 'text-neutral-900 font-semibold border-b-2 border-neutral-900'
                                        : 'text-neutral-400 hover:text-neutral-700 font-medium'
                                }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.labelDesktop}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── SECCIONES DE CONTENIDO ── */}
                <div className="p-6 space-y-4">
                    {/* ── TAB: BALANCE ── */}
                    {activeTab === 'balance' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* BARRA SUPERIOR DE SECCIÓN */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-neutral-900">
                                        Resumen Operativo
                                    </h2>
                                    <p className="text-[11px] text-neutral-400">
                                        Panel de control de movimientos del día
                                    </p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        onClick={() => setShowManualForm(!showManualForm)}
                                        className={
                                            showManualForm
                                                ? 'inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors'
                                                : 'inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors'
                                        }
                                    >
                                        {showManualForm ? <XMarkIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
                                        {showManualForm ? 'Cancelar' : 'Carga Manual'}
                                    </button>
                                </div>
                            </div>

                            {/* ARQUEO DE CAJA */}
                            {balance.billTotals && Object.values(balance.billTotals).some(c => c > 0) && (
                                <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F1EB]">
                                        <div className="flex items-center gap-2.5">
                                            <span className="w-2 h-2 rounded-full bg-[#29974D] animate-pulse shrink-0" />
                                            <div>
                                                <h3 className="text-xs font-bold text-neutral-900">
                                                    Arqueo de Caja Estimado
                                                </h3>
                                                <p className="text-[11px] text-neutral-400">
                                                    Conteo de billetes en caja
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            {/* Toggle */}
                                            <div className="inline-flex items-center gap-2 bg-[#F2F2EE] px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-neutral-600 border border-[#E9E9E4]">
                                                <span className="text-[11px] font-medium text-neutral-700">Reseteo Auto</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true';
                                                        localStorage.setItem('fedecell_reseteo_billetes_auto', !current);
                                                        window.dispatchEvent(new Event('storage'));
                                                        setBalance(prev => ({ ...prev }));
                                                    }}
                                                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                                                        localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true'
                                                            ? 'bg-[#19191B]'
                                                            : 'bg-neutral-300'
                                                    }`}
                                                >
                                                    <span
                                                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-2xs transition-transform ${
                                                            localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true'
                                                                ? 'left-4'
                                                                : 'left-0.5'
                                                        }`}
                                                    />
                                                </button>
                                            </div>

                                            {isEditingBills ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditingBills(false)}
                                                        disabled={isAdjusting}
                                                        className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors disabled:opacity-50"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleAjusteArqueo}
                                                        disabled={isAdjusting}
                                                        className="inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                                                    >
                                                        {isAdjusting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                        {isAdjusting ? 'Guardando...' : 'Guardar Ajuste'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditedBillTotals({ ...balance.billTotals }); setIsEditingBills(true); }}
                                                    className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                                                >
                                                    Ajustar Arqueo
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bill grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                                        {Object.entries(isEditingBills ? editedBillTotals : balance.billTotals)
                                            .sort((a, b) => b[0] - a[0])
                                            .map(([den, cant]) => (
                                                <div
                                                    key={den}
                                                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                                                        cant > 0 || isEditingBills
                                                            ? 'bg-[#F8F8F5] border-[#E4E4DF] text-neutral-900'
                                                            : 'bg-[#FAF9F6] border-[#ECECE6] text-neutral-400 opacity-60'
                                                    }`}
                                                >
                                                    <span className="text-[10px] text-neutral-400 block">
                                                        ${Number(den).toLocaleString()}
                                                    </span>
                                                    {isEditingBills ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs text-center font-semibold rounded-xl px-2 py-1 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                            value={cant}
                                                            onChange={(e) => setEditedBillTotals({ ...editedBillTotals, [den]: parseInt(e.target.value) || 0 })}
                                                        />
                                                    ) : (
                                                        <span className="text-base font-bold text-neutral-900 leading-none">{cant}</span>
                                                    )}
                                                    <span className="text-[10px] text-neutral-400 block">Billetes</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* FORMULARIO CARGA MANUAL */}
                            <AnimatePresence>
                                {showManualForm && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.22 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                                            {/* Form header */}
                                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[#F1F1EB]">
                                                <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0">
                                                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs font-bold text-neutral-900">
                                                        Registrar Transacción Manual
                                                    </h3>
                                                    <p className="text-[11px] text-neutral-400">
                                                        Ingresá los datos de la operación a registrar
                                                    </p>
                                                </div>
                                            </div>

                                            <form
                                                onSubmit={handleManualSubmit}
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
                                            >
                                                {/* Descripción — full width */}
                                                <div className="sm:col-span-2">
                                                    <label className="text-[10px] text-neutral-400 block mb-1">
                                                        Descripción del Producto
                                                    </label>
                                                    <input
                                                        name="producto"
                                                        value={manualEntry.producto}
                                                        onChange={(e) => setManualEntry({ ...manualEntry, producto: e.target.value })}
                                                        type="text"
                                                        placeholder="Ej. Servicio extra, venta puntual..."
                                                        required
                                                        className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                    />
                                                </div>

                                                {/* Monto */}
                                                <div>
                                                    <label className="text-[10px] text-neutral-400 block mb-1">
                                                        Monto ARS
                                                    </label>
                                                    <input
                                                        name="monto"
                                                        value={manualEntry.monto}
                                                        onChange={(e) => setManualEntry({ ...manualEntry, monto: e.target.value })}
                                                        type="number"
                                                        placeholder="0.00"
                                                        required
                                                        className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                    />
                                                </div>

                                                {/* Método de pago */}
                                                <div>
                                                    <label className="text-[10px] text-neutral-400 block mb-1">
                                                        Método de Pago
                                                    </label>
                                                    <select
                                                        name="metodo_pago"
                                                        value={manualEntry.metodo_pago}
                                                        onChange={(e) => setManualEntry({ ...manualEntry, metodo_pago: e.target.value })}
                                                        className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 cursor-pointer"
                                                    >
                                                        <option value="transferencia">Transferencia</option>
                                                        <option value="efectivo">Efectivo</option>
                                                        <option value="debito">Débito</option>
                                                        <option value="mixto">Mixto (2 Pagos)</option>
                                                    </select>
                                                </div>

                                                {/* PAGO MIXTO */}
                                                {manualEntry.metodo_pago === 'mixto' && (
                                                    <div className="sm:col-span-2 bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                                        {[{ key: 'efectivo', label: 'Efectivo' }, { key: 'transferencia', label: 'Transferencia' }, { key: 'debito', label: 'Débito' }].map(({ key, label }) => (
                                                            <div key={key}>
                                                                <label className="text-[10px] text-neutral-400 block mb-1">
                                                                    {label}
                                                                </label>
                                                                <input
                                                                    type="number"
                                                                    placeholder="$0"
                                                                    value={manualEntry.detalles_mixto?.[key] || ''}
                                                                    onChange={e => setManualEntry({ ...manualEntry, detalles_mixto: { ...manualEntry.detalles_mixto, [key]: e.target.value } })}
                                                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                                />
                                                            </div>
                                                        ))}
                                                        <div className="sm:col-span-3">
                                                            <div className="bg-white border border-[#ECECE6] rounded-xl px-3.5 py-2 flex items-center justify-between">
                                                                <span className="text-[10px] text-neutral-400 block">Total Asignado</span>
                                                                <span className="text-xs font-bold text-neutral-900">
                                                                    ${((parseFloat(manualEntry.detalles_mixto?.efectivo || 0) + parseFloat(manualEntry.detalles_mixto?.transferencia || 0) + parseFloat(manualEntry.detalles_mixto?.debito || 0)) || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Submit */}
                                                <div className="sm:col-span-2 flex justify-end pt-3 border-t border-[#F1F1EB]">
                                                    <button
                                                        type="submit"
                                                        disabled={isSubmitting}
                                                        className="inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isSubmitting
                                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            : <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                                        }
                                                        {isSubmitting ? 'Ejecutando...' : 'Ejecutar Transacción'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <PaymentsSection
                                payments={balance.payments}
                                onPaymentClick={handlePaymentClick}
                                selectedPayment={selectedPayment}
                                productsDetail={productsDetail}
                                allEntries={allEntries}
                                onUpdate={fetchBalanceData}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'egresos' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <EgressForm onSubmit={() => { }} />
                        </motion.div>
                    )}
                    {activeTab === 'personal' && <PersonalBalanceModule />}
                    {activeTab === 'ganancias' && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <SeccionGanancias entries={allEntries} />
                        </motion.div>
                    )}
                    {activeTab === 'monthlyExpenses' && <MonthlyExpenseTracker />}

                    {/* PAGE FOOTER */}
                    <div className="pt-6 border-t border-[#EAEAE6] text-center">
                        <p className="text-[11px] text-neutral-400">
                            Sistema Balance &copy; {new Date().getFullYear()} — Panel Administrativo
                        </p>
                    </div>
                </div>
            </div>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EAEAE6] flex justify-around items-stretch h-16">
                {tabsMenu.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${
                            activeTab === tab.id ? 'text-neutral-900 font-semibold' : 'text-neutral-400 hover:text-neutral-700'
                        }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="mobile-tab-indicator"
                                className="absolute top-0 left-3 right-3 h-0.5 bg-neutral-900 rounded-b"
                            />
                        )}
                        <tab.icon className="w-4 h-4" />
                        <span className="text-[10px]">
                            {tab.labelMobile}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default BalanceModule;
