import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentsSection from './seccionPagos';
import TotalsSection from './seccionTotales';
import EgressForm from './seccionEgresos';
import PersonalBalanceModule from './balancePersonal';
import MonthlyExpenseTracker from './gastosMensuales';
import SeccionGanancias from './seccionGanancias';
import axios from 'axios';

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

// =================================================================
// ESTILOS (MIGRADOS A TAILWIND UTILS)
// =================================================================

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
                alert("OPERACIÓN_EXITOSA: BALANCE ACTUALIZADO");
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
            alert("ERROR_CONEXIÓN_SERVIDOR");
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
                alert("AJUSTE DE ARQUEO APLICADO CORRECTAMENTE.");
                setIsEditingBills(false);
                fetchBalanceData();
            } else {
                alert("ERROR AL APLICAR EL AJUSTE.");
            }
        } catch (err) {
            console.error(err);
            alert("ERROR DE CONEXIÓN AL POSTEAR AJUSTE.");
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
        <div className="min-h-screen bg-[#F4F7FE] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#0A58CA]" size={32} />
            <div className="text-gray-500 text-sm font-medium">
                Inicializando sistema...
            </div>
        </div>
    );

    return (
        <div className="text-gray-900 bg-[#F4F7FE] min-h-screen p-6 max-w-6xl mx-auto pb-32">
            {/* Header Style */}
            <div className="mb-8">
                <h2 className="text-2xl text-gray-900 mb-1 font-bold">
                    Sistema Balance
                </h2>
                <p className="text-gray-500 text-sm">
                    Panel de administración y control financiero
                </p>
            </div>

            {/* 1. NAVEGACIÓN DESKTOP */}
            <div className="hidden md:flex overflow-x-auto border-b border-gray-200 mb-8 custom-scrollbar">
                {tabsMenu.map(tab => (
                    <button
                        key={tab.id}
                        className={`px-6 py-4 text-sm font-medium transition-all duration-300 flex items-center border-b-2 ${activeTab === tab.id
                            ? 'bg-transparent text-[#0A58CA] border-[#0A58CA]'
                            : 'bg-transparent text-gray-500 border-transparent hover:text-gray-900 hover:border-gray-300'
                            }`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon className="w-5 h-5 mr-2" /> {tab.labelDesktop}
                    </button>
                ))}
            </div>

            {/* 2. NAVEGACIÓN MOBILE */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-around items-center h-[72px] pb-safe px-1">
                {tabsMenu.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${activeTab === tab.id ? 'text-[#0A58CA]' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        <tab.icon className={`w-6 h-6 mb-1`} />
                        <span className="text-[10px] font-medium">{tab.labelMobile}</span>
                    </button>
                ))}
            </nav>

            {/* Área de Contenido */}
            <div className="relative">

                {activeTab === 'balance' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">

                        {/* CABECERA DE SECCIÓN + BOTÓN CARGA MANUAL */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div>
                                <h3 className="text-lg text-gray-900 font-bold flex items-center gap-2">
                                    Resumen Operativo
                                </h3>
                                <span className="text-sm text-gray-500">Panel de Control en Vivo</span>
                            </div>

                            <button
                                onClick={() => setShowManualForm(!showManualForm)}
                                className={`w-full md:w-auto px-4 py-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${showManualForm
                                    ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                    : 'bg-[#0A58CA] text-white hover:bg-[#084298]'
                                    }`}
                            >
                                {showManualForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                                <span>{showManualForm ? 'Cancelar' : 'Carga Manual'}</span>
                            </button>
                        </div>

                        {/* DESGLOSE DE BILLETES (RESUMEN DE CAJA) */}
                        {balance.billTotals && Object.values(balance.billTotals).some(c => c > 0) && (
                            <div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm mb-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-gray-50 pb-4">
                                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
                                        Arqueo de Caja Estimado
                                    </h3>

                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                            <span className="text-xs font-medium text-gray-600">Reseteo Auto</span>
                                            <button
                                                onClick={() => {
                                                    const current = localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true';
                                                    localStorage.setItem('fedecell_reseteo_billetes_auto', !current);
                                                    window.dispatchEvent(new Event('storage'));
                                                    setBalance(prev => ({ ...prev }));
                                                }}
                                                className={`relative w-10 h-5 rounded-full transition-all duration-300 border ${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? 'bg-[#0A58CA] border-[#0A58CA]' : 'bg-gray-200 border-gray-300'}`}
                                            >
                                                <div className={`absolute top-[1px] w-4 h-4 rounded-full transition-all duration-300 bg-white shadow-sm ${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? 'left-[22px]' : 'left-[2px]'}`}></div>
                                            </button>
                                        </div>
                                        
                                        {isEditingBills ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setIsEditingBills(false)}
                                                    className="px-4 py-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium text-sm rounded-xl transition-all"
                                                    disabled={isAdjusting}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleAjusteArqueo}
                                                    className="px-4 py-2 bg-[#0A58CA] text-white font-medium text-sm hover:bg-[#084298] shadow-sm rounded-xl transition-all"
                                                    disabled={isAdjusting}
                                                >
                                                    {isAdjusting ? 'Guardando...' : 'Guardar Ajuste'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditedBillTotals({ ...balance.billTotals });
                                                    setIsEditingBills(true);
                                                }}
                                                className="px-4 py-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium text-sm rounded-xl transition-all"
                                            >
                                                Ajustar Arqueo
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
                                    {Object.entries(isEditingBills ? editedBillTotals : balance.billTotals)
                                        .sort((a, b) => b[0] - a[0])
                                        .map(([den, cant]) => (
                                            <div key={den} className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${cant > 0 || isEditingBills ? 'border-[#0A58CA]/20 bg-[#F8FAFC]' : 'border-gray-100 bg-gray-50/50 opacity-60'}`}>
                                                <span className="text-xs text-gray-500 mb-2 font-medium">${Number(den).toLocaleString()}</span>
                                                {isEditingBills ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="w-full bg-white border border-gray-200 rounded-lg text-center text-sm font-semibold text-gray-900 p-1.5 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none transition-all"
                                                        value={cant}
                                                        onChange={(e) => setEditedBillTotals({ ...editedBillTotals, [den]: parseInt(e.target.value) || 0 })}
                                                    />
                                                ) : (
                                                    <span className="text-xl font-bold text-gray-900">{cant}</span>
                                                )}
                                                <span className="text-[10px] text-gray-400 mt-1">Billetes</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* FORMULARIO DESPLEGABLE */}
                        <AnimatePresence>
                            {showManualForm && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mb-6"
                                >
                                    <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-5 bg-white p-6 border border-gray-100 rounded-2xl shadow-sm">
                                        <div className="md:col-span-3">
                                            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Descripción Producto</label>
                                            <input
                                                name="producto" value={manualEntry.producto} onChange={(e) => setManualEntry({ ...manualEntry, producto: e.target.value })}
                                                type="text" placeholder="Ej. Servicio extra" className="w-full bg-white border border-gray-200 rounded-xl p-2.5 px-4 text-gray-900 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none text-sm transition-all" required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Monto ARS</label>
                                            <input
                                                name="monto" value={manualEntry.monto} onChange={(e) => setManualEntry({ ...manualEntry, monto: e.target.value })}
                                                type="number" placeholder="0.00" className="w-full bg-white border border-gray-200 rounded-xl p-2.5 px-4 text-gray-900 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none text-sm transition-all" required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-700 mb-1.5 block">Método de Pago</label>
                                            <select
                                                name="metodo_pago" value={manualEntry.metodo_pago}
                                                onChange={(e) => setManualEntry({ ...manualEntry, metodo_pago: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 px-4 text-gray-900 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none text-sm transition-all cursor-pointer"
                                            >
                                                <option value="transferencia">Transferencia</option>
                                                <option value="efectivo">Efectivo</option>
                                                <option value="debito">Débito</option>
                                                <option value="mixto">Mixto (2 Pagos)</option>
                                            </select>
                                        </div>

                                        {/* CAMPOS DINÁMICOS PARA PAGO MIXTO */}
                                        {manualEntry.metodo_pago === 'mixto' && (
                                            <div className="md:col-span-5 grid grid-cols-1 md:grid-cols-3 gap-4 p-5 border border-gray-100 bg-[#F8FAFC] mt-2 rounded-2xl">
                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Efectivo</label>
                                                    <input
                                                        type="number"
                                                        placeholder="$"
                                                        value={manualEntry.detalles_mixto?.efectivo || ''}
                                                        onChange={e => setManualEntry({ ...manualEntry, detalles_mixto: { ...manualEntry.detalles_mixto, efectivo: e.target.value } })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 px-4 text-gray-900 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none text-sm transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Transferencia</label>
                                                    <input
                                                        type="number"
                                                        placeholder="$"
                                                        value={manualEntry.detalles_mixto?.transferencia || ''}
                                                        onChange={e => setManualEntry({ ...manualEntry, detalles_mixto: { ...manualEntry.detalles_mixto, transferencia: e.target.value } })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 px-4 text-gray-900 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none text-sm transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">Débito</label>
                                                    <input
                                                        type="number"
                                                        placeholder="$"
                                                        value={manualEntry.detalles_mixto?.debito || ''}
                                                        onChange={e => setManualEntry({ ...manualEntry, detalles_mixto: { ...manualEntry.detalles_mixto, debito: e.target.value } })}
                                                        className="w-full bg-white border border-gray-200 rounded-xl p-2.5 px-4 text-gray-900 focus:border-[#0A58CA] focus:ring-1 focus:ring-[#0A58CA] outline-none text-sm transition-all"
                                                    />
                                                </div>
                                                <div className="md:col-span-3 pt-2">
                                                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 border border-blue-100">
                                                        <span>Total Asignado:</span>
                                                        <span className="font-bold">${((parseFloat(manualEntry.detalles_mixto?.efectivo || 0) + parseFloat(manualEntry.detalles_mixto?.transferencia || 0) + parseFloat(manualEntry.detalles_mixto?.debito || 0)) || 0).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="md:col-span-5 flex justify-end pt-4 mt-2 border-t border-gray-100">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="bg-[#0A58CA] text-white font-medium text-sm rounded-xl shadow-sm hover:bg-[#084298] transition-all px-5 py-2.5 flex items-center justify-center gap-2"
                                            >
                                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PaperAirplaneIcon className="w-4 h-4" />}
                                                <span>{isSubmitting ? 'Ejecutando...' : 'Ejecutar Transacción'}</span>
                                            </button>
                                        </div>
                                    </form>
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

                {/* Resto de secciones */}
                {activeTab === 'egresos' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><EgressForm onSubmit={() => { }} /></motion.div>}
                {activeTab === 'personal' && <PersonalBalanceModule />}
                {activeTab === 'ganancias' && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}><SeccionGanancias entries={allEntries} /></motion.div>}
                {activeTab === 'monthlyExpenses' && <MonthlyExpenseTracker />}

            </div>

            <div className="mt-12 text-center pb-8">
                <p className="text-xs text-gray-400">
                    Kinesiología Admin &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default BalanceModule;