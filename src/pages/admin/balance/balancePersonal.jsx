import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon, TrashIcon, ArrowPathIcon, PencilSquareIcon,
    CheckCircleIcon, BanknotesIcon, WalletIcon, ChartBarIcon,
    XMarkIcon, CreditCardIcon, ReceiptPercentIcon
} from '@heroicons/react/24/solid';
const API_URL = import.meta.env.VITE_API_URL;

// =================================================================
// CONFIGURACIÓN TÉCNICA - RUTAS ACTUALIZADAS
// =================================================================
const API = {
    BALANCE: `${API_URL}/balancePersonal`,
    GASTOS: `${API_URL}/gastosMensuales`,
    DEUDAS: `${API_URL}/deudaPersonal` // <--- RUTA BASE CORREGIDA
};

const styles = {
    title: "font-['Inter'] font-[900] tracking-tighter uppercase text-black leading-none",
    tech: "font-['Inter'] font-[600] text-black uppercase tracking-[0.2em] text-[10px]",
    card: "bg-white/80 border border-gray-200 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-xl",
    input: "w-full bg-white/60 border border-gray-200 p-4 text-black focus:border-black outline-none transition-all rounded-xl text-sm font-['Inter'] uppercase",
    btnBw: "bg-white hover:bg-gray-200 text-black font-['Inter'] font-[900] py-4 px-8 transition-all active:scale-95 uppercase text-[10px] tracking-[0.3em] rounded-xl shadow-lg shadow-white/10",
};

const PersonalBalanceModule = () => {
    // ESTADOS INICIALIZADOS COMO ARRAYS PARA EVITAR ERROR .REDUCE()
    const [balanceEntries, setBalanceEntries] = useState([]);
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    const [debtEntries, setDebtEntries] = useState([]);

    const [activeTab, setActiveTab] = useState('balance');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ open: false, type: null, data: null });
    const [formData, setFormData] = useState({});

    // --- 1. CARGA DE DATOS CON BLINDAJE ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resBal, resGas, resDeu] = await Promise.all([
                fetch(`${API.BALANCE}/obtenerBalancePersonal`),
                fetch(`${API.GASTOS}/obtenerGastosMensuales`),
                fetch(`${API.DEUDAS}/obtenerDeudas`)
            ]);

            const dataBal = await resBal.json();
            const dataGas = await resGas.json();
            const dataDeu = await resDeu.json();

            // Seteo con validación de tipo Array
            setBalanceEntries(Array.isArray(dataBal) ? dataBal : []);
            setMonthlyExpenses(Array.isArray(dataGas) ? dataGas : []);
            setDebtEntries(Array.isArray(dataDeu) ? dataDeu : []);

        } catch (e) {
            console.error("SYNC_ERROR", e);
            setBalanceEntries([]); setMonthlyExpenses([]); setDebtEntries([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- 2. LÓGICA DE TOTALES (SOLUCIÓN AL ERROR .REDUCE) ---
    const stats = useMemo(() => {
        // Nos aseguramos de que siempre operamos sobre arrays
        const safeBalance = Array.isArray(balanceEntries) ? balanceEntries : [];
        const safeExpenses = Array.isArray(monthlyExpenses) ? monthlyExpenses : [];
        const safeDebts = Array.isArray(debtEntries) ? debtEntries : [];

        const capital = safeBalance.reduce((acc, curr) =>
            curr.tipo === 'income' ? acc + parseFloat(curr.monto) : acc - parseFloat(curr.monto), 0);

        const gastosPendientes = safeExpenses
            .filter(e => !e.pagado)
            .reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

        const deudaTotal = safeDebts.reduce((acc, curr) =>
            acc + (parseFloat(curr.montoTotal) - parseFloat(curr.montoPagado)), 0);

        return { capital, gastosPendientes, deudaTotal };
    }, [balanceEntries, monthlyExpenses, debtEntries]);

    // --- 3. ACCIONES CRUD ---
    const handleSave = async (e) => {
        e.preventDefault();
        let url, method;

        if (modal.type === 'balance') {
            method = modal.data ? 'PUT' : 'POST';
            url = modal.data
                ? `${API.BALANCE}/actualizarBalancePersonal/${modal.data.BalancePersonalId}`
                : `${API.BALANCE}/crearBalancePersonal`;
        } else if (modal.type === 'gasto') {
            method = 'POST'; // Endpoint actual solo soporta POST
            url = `${API.GASTOS}/crearGastoMensual`;
        } else if (modal.type === 'deuda') {
            method = modal.data ? 'PUT' : 'POST';
            url = modal.data
                ? `${API.DEUDAS}/actualizarDeuda/${modal.data.DebtId}`
                : `${API.DEUDAS}/crearDeuda`;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) { closeModal(); fetchData(); }
        } catch (e) { console.error("SAVE_ERROR", e); }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm("¿CONFIRMAR ELIMINACIÓN TÉCNICA?")) return;
        let url;
        if (type === 'balance') url = `${API.BALANCE}/eliminarBalancePersonal/${id}`;
        if (type === 'gasto') url = `${API.GASTOS}/eliminarGasto/${id}`;
        if (type === 'deuda') url = `${API.DEUDAS}/eliminarDeuda/${id}`;

        try {
            const res = await fetch(url, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (e) { console.error("DELETE_ERROR", e); }
    };

    const handlePayInstallment = async (debt, installment) => {
        if (installment.pagado) return;
        if (!window.confirm(`¿Pagar CUOTA ${installment.numero} de $${parseFloat(installment.monto).toLocaleString()}?`)) return;

        // Opcional: Registrar como Gasto
        if (window.confirm('¿Registrar también como GASTO en balance personal?')) {
            try {
                await fetch(`${API.BALANCE}/crearBalancePersonal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        producto: `PAGO CUOTA ${installment.numero}/${debt.cuotasTotales}: ${debt.descripcion}`,
                        descripcion: `PAGO DEUDA ${debt.acreedor}`,
                        monto: parseFloat(installment.monto),
                        metodo_pago: 'efectivo', // O pedir al usuario
                        cuenta: 'efectivo',
                        tipo: 'expense',
                        categoria: 'Deudas',
                        userId: 1,
                        fecha: new Date().toISOString().split('T')[0]
                    })
                });
            } catch (e) { console.error("AUTO_EXPENSE_ERROR", e); }
        }

        // Actualizar Deuda
        const updatedDetails = debt.detalleCuotas.map(d =>
            d.numero === installment.numero ? { ...d, pagado: true, fechaPago: new Date().toISOString() } : d
        );

        try {
            await fetch(`${API.DEUDAS}/actualizarDeuda/${debt.DebtId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    montoPagado: parseFloat(debt.montoPagado) + parseFloat(installment.monto),
                    estado: (parseFloat(debt.montoPagado) + parseFloat(installment.monto)) >= parseFloat(debt.montoTotal) - 1 ? 'pagado' : 'pendiente',
                    detalleCuotas: updatedDetails
                })
            });
            fetchData();
        } catch (e) {
            console.error("PAY_QUOTA_ERROR", e);
            alert('Error al actualizar pago de cuota');
        }
    };

    const openModal = (type, data = null) => {
        setModal({ open: true, type, data });
        if (data) {
            setFormData(data);
        } else {
            setFormData(
                type === 'balance' ? { tipo: 'expense', cuenta: 'checking', monto: '', categoria: 'VARIABLE', descripcion: '', fecha: new Date().toISOString().split('T')[0] } :
                    type === 'gasto' ? { nombre: '', monto: '', vencimiento: '', medio_pago: 'banco_principal' } :
                        { descripcion: '', acreedor: '', montoTotal: '', montoPagado: 0, cuotasTotales: 1, estado: 'pendiente' }
            );
        }
    };

    const closeModal = () => setModal({ open: false, type: null, data: null });

    return (
        <div className="w-full space-y-6 md:space-y-10 pb-20 font-['Inter'] text-gray-600 p-4 md:p-0">
            {/* KPI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${styles.card} p-6 md:p-8 border-l-4 border-black`}>
                    <p className={styles.tech}>Capital_Disponible</p>
                    <h3 className={`${styles.title} text-2xl md:text-3xl mt-2`}>${stats.capital.toLocaleString('es-AR')}</h3>
                </div>
                <div className={`${styles.card} p-6 md:p-8 border-l-4 border-red-500`}>
                    <p className={styles.tech}>Gastos_Fijos_Pendientes</p>
                    <h3 className={`${styles.title} text-2xl md:text-3xl mt-2 text-red-500`}>${stats.gastosPendientes.toLocaleString('es-AR')}</h3>
                </div>
                <div className={`${styles.card} p-6 md:p-8 border-l-4 border-zinc-500`}>
                    <p className={styles.tech}>Deuda_Total_Amortizable</p>
                    <h3 className={`${styles.title} text-2xl md:text-3xl mt-2`}>${stats.deudaTotal.toLocaleString('es-AR')}</h3>
                </div>
            </div>

            {/* NAVEGACIÓN */}
            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200 w-full md:w-fit">
                {['balance', 'deudas'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-none text-center px-4 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-white text-black shadow-lg shadow-white/20' : 'hover:text-black'}`}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="min-h-[400px] pb-20 md:pb-0">
                {activeTab === 'balance' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className={styles.title}>Historial_Sincronizado</h4>
                            <button onClick={() => openModal('balance')} className={`${styles.btnBw} hidden md:inline-flex`}>Nuevo_Movimiento</button>
                        </div>
                        <div className={styles.card}>
                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-white/5">
                                {balanceEntries.map(e => (
                                    <div key={e.BalancePersonalId} className="p-4 flex justify-between items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-black font-bold uppercase truncate text-sm">{e.descripcion}</p>
                                            <p className="text-[10px] text-gray-600 uppercase">{e.fecha} | {e.cuenta}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <p className={`font-black text-sm text-right ${e.tipo === 'income' ? 'text-green-500' : 'text-black'}`}>
                                                {e.tipo === 'income' ? '+' : '-'}${parseFloat(e.monto).toLocaleString('es-AR')}
                                            </p>
                                            <button onClick={() => openModal('balance', e)} className="p-2 text-gray-500 hover:text-black"><PencilSquareIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete('balance', e.BalancePersonalId)} className="p-2 text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-[10px] font-black text-black uppercase tracking-widest">
                                        <tr><th className="p-6">Concepto</th><th className="p-6 text-right">Monto</th><th className="p-6">Acciones</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {balanceEntries.map(e => (
                                            <tr key={e.BalancePersonalId} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-6">
                                                    <div className="text-black font-bold uppercase">{e.descripcion}</div>
                                                    <div className="text-[9px] opacity-40 uppercase tracking-tighter">{e.fecha} | {e.cuenta}</div>
                                                </td>
                                                <td className={`p-6 text-right font-black ${e.tipo === 'income' ? 'text-green-500' : 'text-black'}`}>
                                                    {e.tipo === 'income' ? '+' : '-'}${parseFloat(e.monto).toLocaleString('es-AR')}
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => openModal('balance', e)} className="p-2 text-gray-400 hover:text-black"><PencilSquareIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDelete('balance', e.BalancePersonalId)} className="p-2 text-zinc-800 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'deudas' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-full flex justify-between items-center">
                            <h4 className={styles.title}>Control_de_Pasivos</h4>
                            <button onClick={() => openModal('deuda')} className={`${styles.btnBw} hidden md:inline-flex`}>Nueva_Deuda</button>
                        </div>
                        {debtEntries.map(d => {
                            const pend = parseFloat(d.montoTotal) - parseFloat(d.montoPagado);
                            const perc = (parseFloat(d.montoPagado) / parseFloat(d.montoTotal)) * 100;
                            return (
                                <div key={d.DebtId} className={`${styles.card} p-6 md:p-8`}>
                                    <p className={styles.tech}>{d.acreedor}</p>
                                    <h5 className="text-lg font-black text-black uppercase mt-1">{d.descripcion}</h5>
                                    <div className="my-6">
                                        <div className="flex justify-between text-[10px] mb-2 font-black">
                                            <span>AMORTIZADO</span>
                                            <span className="text-black">{perc.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} className="h-full bg-white shadow-[0_0_10px_#ffffff]" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div><p className="text-[9px] opacity-40 uppercase">Pendiente</p><p className="text-xl font-black text-black">${pend.toLocaleString('es-AR')}</p></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openModal('deuda', d)} className="p-2 text-gray-400 hover:text-black"><PencilSquareIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete('deuda', d.DebtId)} className="p-2 text-zinc-800 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    {/* GRID DE CUOTAS */}
                                    {d.detalleCuotas && Array.isArray(d.detalleCuotas) && (
                                        <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-4 gap-2">
                                            {d.detalleCuotas.map(q => (
                                                <button
                                                    key={q.numero}
                                                    onClick={() => handlePayInstallment(d, q)}
                                                    className={`h-10 w-10 flex items-center justify-center rounded-lg text-xs font-black border transition-all ${q.pagado
                                                        ? 'bg-green-500/20 text-green-500 border-green-500/30'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-200 hover:text-black hover:border-gray-2000'
                                                        }`}
                                                >
                                                    C{q.numero}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL UNIFICADO */}
            <AnimatePresence>
                {modal.open && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-2xl flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`${styles.card} w-full max-w-2xl p-6 md:p-12`}>
                            <div className="flex justify-between items-center mb-10">
                                <h3 className={styles.title}>{modal.data ? 'Actualizar_Registro' : 'Nueva_Entrada'} | {modal.type}</h3>
                                <button onClick={closeModal}><XMarkIcon className="w-8 h-8 text-gray-400 hover:text-black" /></button>
                            </div>
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                {modal.type === 'deuda' && (
                                    <>
                                        <input className={`${styles.input} md:col-span-2`} type="text" placeholder="DESCRIPCIÓN" value={formData.descripcion || ''} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} required />
                                        <input className={styles.input} type="text" placeholder="ACREEDOR" value={formData.acreedor || ''} onChange={e => setFormData({ ...formData, acreedor: e.target.value })} required />
                                        <input className={styles.input} type="date" value={formData.fechaLimite || ''} onChange={e => setFormData({ ...formData, fechaLimite: e.target.value })} />
                                        <input className={styles.input} type="number" placeholder="MONTO TOTAL" value={formData.montoTotal || ''} onChange={e => setFormData({ ...formData, montoTotal: e.target.value })} required />
                                        <input className={styles.input} type="number" placeholder="CUOTAS" min="1" value={formData.cuotasTotales || ''} onChange={e => setFormData({ ...formData, cuotasTotales: e.target.value })} required />
                                        <input className={styles.input} type="number" placeholder="MONTO PAGADO" value={formData.montoPagado || ''} onChange={e => setFormData({ ...formData, montoPagado: e.target.value })} />
                                    </>
                                )}
                                {modal.type === 'balance' && (
                                    <>
                                        <select className={styles.input} value={formData.tipo || 'expense'} onChange={e => setFormData({ ...formData, tipo: e.target.value })}>
                                            <option value="expense">GASTO</option><option value="income">INGRESO</option>
                                        </select>
                                        <input className={styles.input} type="number" placeholder="MONTO" value={formData.monto || ''} onChange={e => setFormData({ ...formData, monto: e.target.value })} required />
                                        <input className={`${styles.input} md:col-span-2`} type="text" placeholder="CONCEPTO" value={formData.descripcion || ''} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} required />
                                    </>
                                )}
                                <button type="submit" className={`${styles.btnBw} md:col-span-2 mt-4`}>GUARDAR_EN_BASE_DE_DATOS</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING ACTION BUTTON - MOBILE ONLY */}
            <div className="md:hidden fixed bottom-6 right-4 z-[110]">
                <button
                    onClick={() => openModal(activeTab === 'balance' ? 'balance' : 'deuda')}
                    className="bg-white hover:bg-gray-200 text-black rounded-full p-4 shadow-lg flex items-center justify-center transition-transform active:scale-90"
                >
                    <PlusIcon className="h-7 w-7" />
                </button>
            </div>

        </div>
    );
};

export default PersonalBalanceModule;