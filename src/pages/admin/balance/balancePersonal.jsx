import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    PlusIcon, TrashIcon, ArrowPathIcon, PencilSquareIcon,
    CheckCircleIcon, BanknotesIcon, WalletIcon, ChartBarIcon,
    XMarkIcon, CreditCardIcon, ReceiptPercentIcon
} from '@heroicons/react/24/solid';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

// =================================================================
// CONFIGURACIÓN TÉCNICA - CLINICAL CLARITY
// =================================================================
const API = {
    BALANCE: `${API_URL}/balancePersonal`,
    GASTOS: `${API_URL}/gastosMensuales`,
    DEUDAS: `${API_URL}/deudaPersonal`
};

const styles = {
    title: "font-sans font-bold tracking-tight text-[#191c1e]",
    tech: "font-sans text-[11px] font-semibold uppercase tracking-wider text-[#424754]",
    card: "bg-white border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden",
    input: "w-full bg-[#f2f4f6] border border-[#c2c6d6] p-3.5 text-[#191c1e] focus:bg-white focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 outline-none transition-all rounded-xl text-sm font-medium",
    btnBw: "bg-[#0058be] hover:bg-[#004395] text-white font-semibold py-3 px-6 transition-all active:scale-[0.98] uppercase text-xs tracking-wider rounded-xl shadow-sm",
};

const PersonalBalanceModule = () => {
    const [balanceEntries, setBalanceEntries] = useState([]);
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    const [debtEntries, setDebtEntries] = useState([]);

    const [activeTab, setActiveTab] = useState('balance');
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState({ open: false, type: null, data: null });
    const [formData, setFormData] = useState({});

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

            setBalanceEntries(Array.isArray(dataBal) ? dataBal : []);
            setMonthlyExpenses(Array.isArray(dataGas) ? dataGas : []);
            setDebtEntries(Array.isArray(dataDeu) ? dataDeu : []);

        } catch (e) {
            console.error("SYNC_ERROR", e);
            setBalanceEntries([]); setMonthlyExpenses([]); setDebtEntries([]);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const stats = useMemo(() => {
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

    const handleSave = async (e) => {
        e.preventDefault();
        let url, method;

        if (modal.type === 'balance') {
            method = modal.data ? 'PUT' : 'POST';
            url = modal.data
                ? `${API.BALANCE}/actualizarBalancePersonal/${modal.data.BalancePersonalId}`
                : `${API.BALANCE}/crearBalancePersonal`;
        } else if (modal.type === 'gasto') {
            method = 'POST';
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
        const result = await Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Se eliminará el registro seleccionado',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ba1a1a',
            cancelButtonColor: '#727785'
        });
        if (!result.isConfirmed) return;
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
        const resPay = await Swal.fire({
            title: '¿Registrar pago?',
            text: `¿Pagar CUOTA ${installment.numero} de $${parseFloat(installment.monto).toLocaleString('es-AR')}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, pagar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#0058be',
            cancelButtonColor: '#727785'
        });
        if (!resPay.isConfirmed) return;

        const resExpense = await Swal.fire({
            title: 'Impactar en Balance Personal',
            text: '¿Deseas registrar este pago como GASTO en tu balance personal?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Sí, registrar gasto',
            cancelButtonText: 'No, solo marcar pago',
            confirmButtonColor: '#0058be',
            cancelButtonColor: '#727785'
        });

        if (resExpense.isConfirmed) {
            try {
                await fetch(`${API.BALANCE}/crearBalancePersonal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        producto: `PAGO CUOTA ${installment.numero}/${debt.cuotasTotales}: ${debt.descripcion}`,
                        descripcion: `PAGO DEUDA ${debt.acreedor}`,
                        monto: parseFloat(installment.monto),
                        metodo_pago: 'efectivo',
                        cuenta: 'efectivo',
                        tipo: 'expense',
                        categoria: 'Deudas',
                        userId: 1,
                        fecha: new Date().toISOString().split('T')[0]
                    })
                });
            } catch (e) { console.error("AUTO_EXPENSE_ERROR", e); }
        }

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
            Swal.fire({ title: 'ERROR', text: 'Error al actualizar pago de cuota', icon: 'error', confirmButtonColor: '#0058be' });
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
        <div className="w-full space-y-6 md:space-y-8 pb-20 font-sans text-[#191c1e]">
            {/* KPI DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${styles.card} p-6 border-l-4 border-[#0058be]`}>
                    <p className={styles.tech}>Capital Disponible</p>
                    <h3 className={`${styles.title} text-2xl md:text-3xl mt-2 text-[#006947]`}>${stats.capital.toLocaleString('es-AR')}</h3>
                </div>
                <div className={`${styles.card} p-6 border-l-4 border-[#ba1a1a]`}>
                    <p className={styles.tech}>Gastos Fijos Pendientes</p>
                    <h3 className={`${styles.title} text-2xl md:text-3xl mt-2 text-[#ba1a1a]`}>${stats.gastosPendientes.toLocaleString('es-AR')}</h3>
                </div>
                <div className={`${styles.card} p-6 border-l-4 border-[#4648d4]`}>
                    <p className={styles.tech}>Deuda Total Amortizable</p>
                    <h3 className={`${styles.title} text-2xl md:text-3xl mt-2 text-[#4648d4]`}>${stats.deudaTotal.toLocaleString('es-AR')}</h3>
                </div>
            </div>

            {/* NAVEGACIÓN */}
            <div className="flex bg-[#f2f4f6] p-1.5 rounded-2xl border border-[#e6e8ea] w-full md:w-fit gap-2">
                {['balance', 'deudas'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`flex-1 md:flex-none text-center px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-[#0058be] text-white shadow-sm' : 'text-[#424754] hover:text-[#191c1e]'}`}>
                        {tab === 'balance' ? 'Balance Personal' : 'Deudas'}
                    </button>
                ))}
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="min-h-[400px] pb-20 md:pb-0">
                {activeTab === 'balance' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xl font-bold text-[#191c1e] tracking-tight">Historial de Movimientos</h4>
                            <button onClick={() => openModal('balance')} className={`${styles.btnBw} hidden md:inline-flex`}>Nuevo Movimiento</button>
                        </div>
                        <div className={styles.card}>
                            {/* Mobile List View */}
                            <div className="md:hidden divide-y divide-[#e6e8ea]">
                                {balanceEntries.map(e => (
                                    <div key={e.BalancePersonalId} className="p-4 flex justify-between items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[#191c1e] font-bold uppercase truncate text-sm">{e.descripcion}</p>
                                            <p className="text-[10px] text-[#727785] font-medium">{e.fecha} | {e.cuenta}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <p className={`font-bold text-sm text-right ${e.tipo === 'income' ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
                                                {e.tipo === 'income' ? '+' : '-'}${parseFloat(e.monto).toLocaleString('es-AR')}
                                            </p>
                                            <button onClick={() => openModal('balance', e)} className="p-2 text-[#727785] hover:text-[#191c1e]"><PencilSquareIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete('balance', e.BalancePersonalId)} className="p-2 text-[#727785] hover:text-[#ba1a1a]"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left">
                                    <thead className="bg-[#f2f4f6] text-[11px] font-semibold text-[#424754] uppercase tracking-wider">
                                        <tr><th className="p-4 px-6">Concepto</th><th className="p-4 px-6 text-right">Monto</th><th className="p-4 px-6 text-right">Acciones</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#e6e8ea]">
                                        {balanceEntries.map(e => (
                                            <tr key={e.BalancePersonalId} className="hover:bg-[#f7f9fb] transition-colors font-sans">
                                                <td className="p-4 px-6">
                                                    <div className="text-[#191c1e] font-semibold uppercase">{e.descripcion}</div>
                                                    <div className="text-xs text-[#727785] font-normal">{e.fecha} | {e.cuenta}</div>
                                                </td>
                                                <td className={`p-4 px-6 text-right font-bold ${e.tipo === 'income' ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
                                                    {e.tipo === 'income' ? '+' : '-'}${parseFloat(e.monto).toLocaleString('es-AR')}
                                                </td>
                                                <td className="p-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openModal('balance', e)} className="p-2 text-[#727785] hover:text-[#191c1e]" title="Editar"><PencilSquareIcon className="w-5 h-5" /></button>
                                                        <button onClick={() => handleDelete('balance', e.BalancePersonalId)} className="p-2 text-[#727785] hover:text-[#ba1a1a]" title="Eliminar"><TrashIcon className="w-5 h-5" /></button>
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
                            <h4 className="text-xl font-bold text-[#191c1e] tracking-tight">Control de Pasivos y Deudas</h4>
                            <button onClick={() => openModal('deuda')} className={`${styles.btnBw} hidden md:inline-flex`}>Nueva Deuda</button>
                        </div>
                        {debtEntries.map(d => {
                            const pend = parseFloat(d.montoTotal) - parseFloat(d.montoPagado);
                            const perc = (parseFloat(d.montoPagado) / parseFloat(d.montoTotal)) * 100;
                            return (
                                <div key={d.DebtId} className={`${styles.card} p-6`}>
                                    <p className={styles.tech}>{d.acreedor}</p>
                                    <h5 className="text-lg font-bold text-[#191c1e] uppercase mt-1 tracking-tight">{d.descripcion}</h5>
                                    <div className="my-5">
                                        <div className="flex justify-between text-xs mb-1.5 font-semibold text-[#424754]">
                                            <span>AMORTIZADO</span>
                                            <span className="text-[#0058be] font-bold">{perc.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-[#f2f4f6] rounded-full overflow-hidden border border-[#e6e8ea]">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${perc}%` }} className="h-full bg-[#0058be] rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div><p className="text-[10px] text-[#727785] uppercase font-medium">Pendiente</p><p className="text-xl font-bold text-[#ba1a1a]">${pend.toLocaleString('es-AR')}</p></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => openModal('deuda', d)} className="p-2 text-[#727785] hover:text-[#191c1e]"><PencilSquareIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete('deuda', d.DebtId)} className="p-2 text-[#727785] hover:text-[#ba1a1a]"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    {/* GRID DE CUOTAS */}
                                    {d.detalleCuotas && Array.isArray(d.detalleCuotas) && (
                                        <div className="mt-6 pt-5 border-t border-[#e6e8ea] grid grid-cols-4 gap-2">
                                            {d.detalleCuotas.map(q => (
                                                <button
                                                    key={q.numero}
                                                    onClick={() => handlePayInstallment(d, q)}
                                                    className={`h-9 flex items-center justify-center rounded-xl text-xs font-semibold border transition-all ${q.pagado
                                                        ? 'bg-[#e6f7f0] text-[#006947] border-[#00855b]/30 font-bold'
                                                        : 'bg-[#f2f4f6] text-[#424754] border-[#c2c6d6] hover:bg-[#0058be] hover:text-white hover:border-[#0058be]'
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
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className={`${styles.card} w-full max-w-xl p-6 md:p-8 bg-white border border-[#e6e8ea]`}>
                            <div className="flex justify-between items-center mb-6 border-b border-[#e6e8ea] pb-4">
                                <h3 className="text-xl font-bold text-[#191c1e] tracking-tight">{modal.data ? 'Actualizar Registro' : 'Nueva Entrada'}</h3>
                                <button onClick={closeModal} className="p-1 rounded-full text-[#727785] hover:text-[#191c1e] hover:bg-[#f2f4f6]"><XMarkIcon className="w-6 h-6" /></button>
                            </div>
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <button type="submit" className={`${styles.btnBw} md:col-span-2 mt-4 py-3.5`}>Guardar Cambios</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FLOATING ACTION BUTTON - MOBILE ONLY */}
            <div className="md:hidden fixed bottom-6 right-4 z-[110]">
                <button
                    onClick={() => openModal(activeTab === 'balance' ? 'balance' : 'deuda')}
                    className="bg-[#0058be] text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-transform active:scale-90"
                >
                    <PlusIcon className="h-6 w-6" />
                </button>
            </div>

        </div>
    );
};

export default PersonalBalanceModule;