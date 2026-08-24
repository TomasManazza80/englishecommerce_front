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
// ── CLINICAL CLARITY — balance.jsx refactored ──

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
                Swal.fire({ title: 'ÉXITO', text: 'Operación registrada correctamente en el balance.', icon: 'success', confirmButtonColor: '#0058be' });
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
            Swal.fire({ title: 'ERROR', text: 'Error de conexión con el servidor.', icon: 'error', confirmButtonColor: '#0058be' });
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
                Swal.fire({ title: 'ÉXITO', text: 'Ajuste de arqueo aplicado correctamente.', icon: 'success', confirmButtonColor: '#0058be' });
                setIsEditingBills(false);
                fetchBalanceData();
            } else {
                Swal.fire({ title: 'ERROR', text: 'Error al aplicar el ajuste de arqueo.', icon: 'error', confirmButtonColor: '#0058be' });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({ title: 'ERROR', text: 'Error de conexión al guardar el ajuste.', icon: 'error', confirmButtonColor: '#0058be' });
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

    // ─── Clinical Clarity: shared style tokens ────────────────────
    const labelStyle = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: '#424754',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        marginBottom: '6px',
    };
    const inputStyle = {
        width: '100%',
        height: '44px',
        background: '#f2f4f6',
        border: '1.5px solid transparent',
        borderRadius: '8px',
        padding: '0 16px',
        fontSize: '14px',
        fontWeight: 400,
        color: '#191c1e',
        outline: 'none',
        transition: 'all 0.18s ease',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
    };
    const applyFocusStyle = (el) => {
        el.style.background = '#ffffff';
        el.style.borderColor = '#0058be';
        el.style.boxShadow = '0 0 0 3px rgba(0,88,190,0.1)';
    };
    const removeFocusStyle = (el) => {
        el.style.background = '#f2f4f6';
        el.style.borderColor = 'transparent';
        el.style.boxShadow = 'none';
    };

    const tabsMenu = [
        { id: 'balance', labelDesktop: 'Balance Diario', labelMobile: 'Balance', icon: ChartBarIcon },
        { id: 'egresos', labelDesktop: 'Cargar Egresos', labelMobile: 'Egresos', icon: MinusCircleIcon },
        { id: 'personal', labelDesktop: 'Personal', labelMobile: 'Personal', icon: UserIcon },
        { id: 'ganancias', labelDesktop: 'Ganancias', labelMobile: 'Ganancias', icon: FiTrendingUp },
        { id: 'monthlyExpenses', labelDesktop: 'Mensuales', labelMobile: 'Mensual', icon: CalendarDaysIcon },
    ];

    if (loading) return (
        <div
            style={{
                minHeight: '100vh',
                background: '#f7f9fb',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    background: '#ffffff',
                    border: '1px solid #e6e8ea',
                    borderRadius: '24px',
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.08)',
                    padding: '40px 48px',
                }}
            >
                <div style={{ position: 'relative', width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '9999px',
                            border: '3px solid #eceef0',
                            borderTopColor: '#0058be',
                            animation: 'spin 0.9s linear infinite',
                        }}
                    />
                    <ChartBarIcon style={{ width: '22px', height: '22px', color: '#0058be' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#191c1e', margin: 0, lineHeight: '24px' }}>
                        Cargando Balance
                    </p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#727785', margin: '4px 0 0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Obteniendo datos del sistema...
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div
            style={{
                background: '#f7f9fb',
                minHeight: '100vh',
                fontFamily: "'Inter', sans-serif",
                color: '#191c1e',
                paddingBottom: '96px',
            }}
        >
            {/* ── PAGE WRAPPER ── */}
            <div
                style={{
                    maxWidth: '1280px',
                    margin: '0 auto',
                    padding: '32px',
                }}
                className="px-4 md:px-8"
            >
                {/* ── PAGE HEADER ── */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginBottom: '32px',
                        gap: '16px',
                        flexWrap: 'wrap',
                    }}
                >
                    <div>
                        <h1
                            style={{
                                fontSize: '32px',
                                fontWeight: 700,
                                lineHeight: '40px',
                                letterSpacing: '-0.02em',
                                color: '#191c1e',
                                margin: 0,
                            }}
                        >
                            Sistema Balance
                        </h1>
                        <p
                            style={{
                                fontSize: '14px',
                                fontWeight: 400,
                                lineHeight: '20px',
                                color: '#424754',
                                margin: '4px 0 0',
                            }}
                        >
                            Panel de administración y control financiero profesional
                        </p>
                    </div>
                    {/* Live indicator pill */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#ffffff',
                            border: '1px solid #e6e8ea',
                            borderRadius: '9999px',
                            padding: '6px 14px',
                            boxShadow: '0px 4px 20px rgba(0,0,0,0.04)',
                            alignSelf: 'flex-start',
                        }}
                    >
                        <span
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '9999px',
                                background: '#006947',
                                display: 'inline-block',
                                flexShrink: 0,
                            }}
                            className="animate-pulse"
                        />
                        <span style={{ fontSize: '11px', fontWeight: 500, color: '#424754' }}>En Vivo</span>
                    </div>
                </div>

                {/* ── DESKTOP TAB NAVIGATION ── */}
                <div
                    className="hidden md:flex"
                    style={{
                        gap: '4px',
                        padding: '6px',
                        background: '#f2f4f6',
                        borderRadius: '16px',
                        border: '1px solid #e6e8ea',
                        marginBottom: '32px',
                        overflowX: 'auto',
                    }}
                >
                    {tabsMenu.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600,
                                letterSpacing: '0.01em',
                                lineHeight: '18px',
                                transition: 'all 0.18s ease',
                                whiteSpace: 'nowrap',
                                minHeight: '44px',
                                fontFamily: "'Inter', sans-serif",
                                ...(activeTab === tab.id
                                    ? { background: '#0058be', color: '#ffffff', boxShadow: '0px 4px 12px rgba(0,88,190,0.25)' }
                                    : { background: 'transparent', color: '#424754' }),
                            }}
                            onMouseEnter={e => { if (activeTab !== tab.id) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.color = '#191c1e'; } }}
                            onMouseLeave={e => { if (activeTab !== tab.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#424754'; } }}
                        >
                            <tab.icon style={{ width: '16px', height: '16px' }} />
                            {tab.labelDesktop}
                        </button>
                    ))}
                </div>

                {/* ── CONTENT AREA ── */}
                <div style={{ position: 'relative' }}>

                    {/* ── TAB: BALANCE ── */}
                    {activeTab === 'balance' && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                        >
                            {/* SECTION HEADER CARD */}
                            <div
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e6e8ea',
                                    borderRadius: '16px',
                                    boxShadow: '0px 4px 20px rgba(0,0,0,0.04)',
                                    padding: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 600, lineHeight: '28px', color: '#191c1e', margin: 0 }}>
                                        Resumen Operativo
                                    </h2>
                                    <p style={{ fontSize: '13px', fontWeight: 400, color: '#424754', margin: '2px 0 0' }}>
                                        Panel de control de movimientos del día
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowManualForm(!showManualForm)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '0 20px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        border: showManualForm ? '1px solid #c2c6d6' : 'none',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        transition: 'all 0.18s ease',
                                        whiteSpace: 'nowrap',
                                        fontFamily: "'Inter', sans-serif",
                                        ...(showManualForm
                                            ? { background: '#f2f4f6', color: '#191c1e' }
                                            : { background: '#0058be', color: '#ffffff', boxShadow: '0px 4px 12px rgba(0,88,190,0.2)' }),
                                    }}
                                    onMouseEnter={e => {
                                        if (showManualForm) { e.currentTarget.style.background = '#e6e8ea'; }
                                        else { e.currentTarget.style.background = '#2170e4'; e.currentTarget.style.boxShadow = '0px 6px 24px rgba(0,88,190,0.15)'; }
                                    }}
                                    onMouseLeave={e => {
                                        if (showManualForm) { e.currentTarget.style.background = '#f2f4f6'; }
                                        else { e.currentTarget.style.background = '#0058be'; e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0,88,190,0.2)'; }
                                    }}
                                >
                                    {showManualForm ? <XMarkIcon style={{ width: '16px', height: '16px' }} /> : <PlusIcon style={{ width: '16px', height: '16px' }} />}
                                    {showManualForm ? 'Cancelar' : 'Carga Manual'}
                                </button>
                            </div>

                            {/* ARQUEO DE CAJA */}
                            {balance.billTotals && Object.values(balance.billTotals).some(c => c > 0) && (
                                <div
                                    style={{
                                        background: '#ffffff',
                                        border: '1px solid #e6e8ea',
                                        borderRadius: '16px',
                                        boxShadow: '0px 4px 20px rgba(0,0,0,0.04)',
                                        padding: '24px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '20px',
                                            paddingBottom: '20px',
                                            borderBottom: '1px solid #eceef0',
                                            gap: '16px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div
                                                style={{
                                                    width: '10px', height: '10px', borderRadius: '9999px',
                                                    background: '#0058be', flexShrink: 0,
                                                }}
                                                className="animate-pulse"
                                            />
                                            <div>
                                                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#191c1e', margin: 0, lineHeight: '22px' }}>
                                                    Arqueo de Caja Estimado
                                                </h3>
                                                <p style={{ fontSize: '12px', color: '#727785', margin: '2px 0 0', fontWeight: 500 }}>Conteo de billetes en caja</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            {/* Toggle */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f2f4f6', border: '1px solid #e6e8ea', borderRadius: '9999px', padding: '6px 14px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#424754', letterSpacing: '0.02em' }}>Reseteo Auto</span>
                                                <button
                                                    onClick={() => {
                                                        const current = localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true';
                                                        localStorage.setItem('fedecell_reseteo_billetes_auto', !current);
                                                        window.dispatchEvent(new Event('storage'));
                                                        setBalance(prev => ({ ...prev }));
                                                    }}
                                                    style={{
                                                        position: 'relative', width: '40px', height: '22px',
                                                        borderRadius: '9999px', border: 'none', cursor: 'pointer',
                                                        transition: 'all 0.25s ease', padding: 0, flexShrink: 0,
                                                        background: localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? '#0058be' : '#c2c6d6',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            position: 'absolute', top: '3px', width: '16px', height: '16px',
                                                            borderRadius: '9999px', background: '#ffffff',
                                                            boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'all 0.25s ease',
                                                            left: localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? '21px' : '3px',
                                                        }}
                                                    />
                                                </button>
                                            </div>

                                            {isEditingBills ? (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => setIsEditingBills(false)}
                                                        disabled={isAdjusting}
                                                        style={{
                                                            height: '36px', padding: '0 16px', borderRadius: '12px',
                                                            border: '1px solid #c2c6d6', background: '#f2f4f6', color: '#191c1e',
                                                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                            transition: 'all 0.18s ease', fontFamily: "'Inter', sans-serif",
                                                            opacity: isAdjusting ? 0.5 : 1,
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = '#e6e8ea'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = '#f2f4f6'; }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={handleAjusteArqueo}
                                                        disabled={isAdjusting}
                                                        style={{
                                                            height: '36px', padding: '0 16px', borderRadius: '12px',
                                                            border: 'none', background: '#0058be', color: '#ffffff',
                                                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', gap: '6px',
                                                            transition: 'all 0.18s ease', fontFamily: "'Inter', sans-serif",
                                                            boxShadow: '0px 4px 12px rgba(0,88,190,0.2)',
                                                            opacity: isAdjusting ? 0.7 : 1,
                                                        }}
                                                    >
                                                        {isAdjusting && <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />}
                                                        {isAdjusting ? 'Guardando...' : 'Guardar Ajuste'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setEditedBillTotals({ ...balance.billTotals }); setIsEditingBills(true); }}
                                                    style={{
                                                        height: '36px', padding: '0 16px', borderRadius: '12px',
                                                        border: '1px solid #c2c6d6', background: '#f2f4f6', color: '#191c1e',
                                                        fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                        transition: 'all 0.18s ease', fontFamily: "'Inter', sans-serif",
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#e6e8ea'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = '#f2f4f6'; }}
                                                >
                                                    Ajustar Arqueo
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bill grid */}
                                    <div
                                        style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
                                            gap: '12px',
                                        }}
                                    >
                                        {Object.entries(isEditingBills ? editedBillTotals : balance.billTotals)
                                            .sort((a, b) => b[0] - a[0])
                                            .map(([den, cant]) => (
                                                <div
                                                    key={den}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                        justifyContent: 'center', padding: '16px 8px', borderRadius: '12px',
                                                        gap: '6px', transition: 'all 0.18s ease',
                                                        border: cant > 0 || isEditingBills ? '1px solid rgba(0,88,190,0.2)' : '1px solid #e6e8ea',
                                                        background: cant > 0 || isEditingBills ? 'rgba(232,241,255,0.4)' : '#f2f4f6',
                                                        opacity: cant === 0 && !isEditingBills ? 0.55 : 1,
                                                    }}
                                                >
                                                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#424754', letterSpacing: '0.02em' }}>
                                                        ${Number(den).toLocaleString()}
                                                    </span>
                                                    {isEditingBills ? (
                                                        <input
                                                            type="number" min="0"
                                                            style={{
                                                                width: '100%', background: '#ffffff',
                                                                border: '1.5px solid #c2c6d6', borderRadius: '8px',
                                                                textAlign: 'center', fontSize: '14px', fontWeight: 600,
                                                                color: '#191c1e', padding: '6px 4px', outline: 'none',
                                                                transition: 'border-color 0.18s ease',
                                                                fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
                                                            }}
                                                            onFocus={e => { e.target.style.borderColor = '#0058be'; e.target.style.boxShadow = '0 0 0 3px rgba(0,88,190,0.1)'; }}
                                                            onBlur={e => { e.target.style.borderColor = '#c2c6d6'; e.target.style.boxShadow = 'none'; }}
                                                            value={cant}
                                                            onChange={(e) => setEditedBillTotals({ ...editedBillTotals, [den]: parseInt(e.target.value) || 0 })}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '24px', fontWeight: 700, color: '#191c1e', lineHeight: 1 }}>{cant}</span>
                                                    )}
                                                    <span style={{ fontSize: '10px', fontWeight: 500, color: '#727785', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Billetes</span>
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
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div
                                            style={{
                                                background: '#ffffff',
                                                border: '1px solid #e6e8ea',
                                                borderRadius: '16px',
                                                boxShadow: '0px 4px 20px rgba(0,0,0,0.04)',
                                                padding: '24px',
                                            }}
                                        >
                                            {/* Form header */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #eceef0' }}>
                                                <div
                                                    style={{
                                                        width: '36px', height: '36px', borderRadius: '10px',
                                                        background: 'rgba(0,88,190,0.08)', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    }}
                                                >
                                                    <PaperAirplaneIcon style={{ width: '18px', height: '18px', color: '#0058be' }} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#191c1e', margin: 0, lineHeight: '22px' }}>
                                                        Registrar Transacción Manual
                                                    </h3>
                                                    <p style={{ fontSize: '12px', color: '#727785', margin: '2px 0 0' }}>
                                                        Ingresá los datos de la operación a registrar
                                                    </p>
                                                </div>
                                            </div>

                                            <form
                                                onSubmit={handleManualSubmit}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                                    gap: '16px',
                                                }}
                                            >
                                                {/* Descripción — full width */}
                                                <div style={{ gridColumn: '1 / -1' }}>
                                                    <label style={labelStyle}>Descripción del Producto</label>
                                                    <input
                                                        name="producto" value={manualEntry.producto}
                                                        onChange={(e) => setManualEntry({ ...manualEntry, producto: e.target.value })}
                                                        type="text" placeholder="Ej. Servicio extra, venta puntual..." required
                                                        style={inputStyle}
                                                        onFocus={e => applyFocusStyle(e.target)}
                                                        onBlur={e => removeFocusStyle(e.target)}
                                                    />
                                                </div>

                                                {/* Monto */}
                                                <div>
                                                    <label style={labelStyle}>Monto ARS</label>
                                                    <input
                                                        name="monto" value={manualEntry.monto}
                                                        onChange={(e) => setManualEntry({ ...manualEntry, monto: e.target.value })}
                                                        type="number" placeholder="0.00" required
                                                        style={inputStyle}
                                                        onFocus={e => applyFocusStyle(e.target)}
                                                        onBlur={e => removeFocusStyle(e.target)}
                                                    />
                                                </div>

                                                {/* Método de pago */}
                                                <div>
                                                    <label style={labelStyle}>Método de Pago</label>
                                                    <select
                                                        name="metodo_pago" value={manualEntry.metodo_pago}
                                                        onChange={(e) => setManualEntry({ ...manualEntry, metodo_pago: e.target.value })}
                                                        style={{ ...inputStyle, cursor: 'pointer', appearance: 'auto' }}
                                                        onFocus={e => applyFocusStyle(e.target)}
                                                        onBlur={e => removeFocusStyle(e.target)}
                                                    >
                                                        <option value="transferencia">Transferencia</option>
                                                        <option value="efectivo">Efectivo</option>
                                                        <option value="debito">Débito</option>
                                                        <option value="mixto">Mixto (2 Pagos)</option>
                                                    </select>
                                                </div>

                                                {/* PAGO MIXTO */}
                                                {manualEntry.metodo_pago === 'mixto' && (
                                                    <div
                                                        style={{
                                                            gridColumn: '1 / -1',
                                                            background: '#f7f9fb', border: '1px solid #e6e8ea',
                                                            borderRadius: '12px', padding: '20px',
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                                            gap: '16px',
                                                        }}
                                                    >
                                                        {[{ key: 'efectivo', label: 'Efectivo' }, { key: 'transferencia', label: 'Transferencia' }, { key: 'debito', label: 'Débito' }].map(({ key, label }) => (
                                                            <div key={key}>
                                                                <label style={labelStyle}>{label}</label>
                                                                <input
                                                                    type="number" placeholder="$0"
                                                                    value={manualEntry.detalles_mixto?.[key] || ''}
                                                                    onChange={e => setManualEntry({ ...manualEntry, detalles_mixto: { ...manualEntry.detalles_mixto, [key]: e.target.value } })}
                                                                    style={{ ...inputStyle, background: '#ffffff', border: '1.5px solid #c2c6d6' }}
                                                                    onFocus={e => { e.target.style.borderColor = '#0058be'; e.target.style.boxShadow = '0 0 0 3px rgba(0,88,190,0.1)'; }}
                                                                    onBlur={e => { e.target.style.borderColor = '#c2c6d6'; e.target.style.boxShadow = 'none'; }}
                                                                />
                                                            </div>
                                                        ))}
                                                        <div style={{ gridColumn: '1 / -1' }}>
                                                            <div
                                                                style={{
                                                                    background: 'rgba(0,88,190,0.06)',
                                                                    border: '1px solid rgba(0,88,190,0.2)',
                                                                    borderRadius: '10px', padding: '12px 16px',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#424754' }}>Total Asignado</span>
                                                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#0058be' }}>
                                                                    ${((parseFloat(manualEntry.detalles_mixto?.efectivo || 0) + parseFloat(manualEntry.detalles_mixto?.transferencia || 0) + parseFloat(manualEntry.detalles_mixto?.debito || 0)) || 0).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Submit */}
                                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid #eceef0' }}>
                                                    <button
                                                        type="submit" disabled={isSubmitting}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                            height: '44px', padding: '0 24px', borderRadius: '12px',
                                                            border: 'none', background: isSubmitting ? '#4a8cde' : '#0058be',
                                                            color: '#ffffff', fontSize: '14px', fontWeight: 600,
                                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                                            boxShadow: '0px 4px 12px rgba(0,88,190,0.25)',
                                                            transition: 'all 0.18s ease', fontFamily: "'Inter', sans-serif",
                                                        }}
                                                        onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.background = '#2170e4'; e.currentTarget.style.boxShadow = '0px 6px 24px rgba(0,88,190,0.15)'; } }}
                                                        onMouseLeave={e => { if (!isSubmitting) { e.currentTarget.style.background = '#0058be'; e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0,88,190,0.25)'; } }}
                                                    >
                                                        {isSubmitting
                                                            ? <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />
                                                            : <PaperAirplaneIcon style={{ width: '16px', height: '16px' }} />
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

                </div>

                {/* PAGE FOOTER */}
                <div
                    style={{
                        marginTop: '48px', paddingBottom: '32px', textAlign: 'center',
                        borderTop: '1px solid #eceef0', paddingTop: '24px',
                    }}
                >
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#727785', margin: 0, letterSpacing: '0.01em' }}>
                        Clinical Balance &copy; {new Date().getFullYear()} — Panel Administrativo
                    </p>
                </div>
            </div>

            {/* ── MOBILE BOTTOM NAV ── */}
            <nav
                className="md:hidden"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                    background: '#ffffff', borderTop: '1px solid #e6e8ea',
                    boxShadow: '0px -4px 20px rgba(0,0,0,0.06)',
                    display: 'flex', justifyContent: 'space-around',
                    alignItems: 'stretch', height: '72px',
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                {tabsMenu.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', flex: 1, gap: '4px',
                            border: 'none', background: 'transparent', cursor: 'pointer',
                            transition: 'all 0.15s ease', position: 'relative',
                            color: activeTab === tab.id ? '#0058be' : '#727785',
                        }}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="mobile-tab-indicator"
                                style={{
                                    position: 'absolute', top: 0, left: '12px', right: '12px',
                                    height: '3px', background: '#0058be', borderRadius: '0 0 4px 4px',
                                }}
                            />
                        )}
                        <tab.icon style={{ width: '20px', height: '20px' }} />
                        <span style={{ fontSize: '10px', fontWeight: activeTab === tab.id ? 600 : 500, letterSpacing: '0.01em' }}>
                            {tab.labelMobile}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default BalanceModule;