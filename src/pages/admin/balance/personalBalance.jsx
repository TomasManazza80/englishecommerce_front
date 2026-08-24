import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FiPlusCircle, FiTrash2, FiClock, FiDollarSign, FiTrendingUp, FiTrendingDown, FiArchive, FiArrowUp, FiArrowDown, FiCheckCircle
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN TÉCNICA DE RUTAS ---
const API_BASE = `${API_URL}/balancePersonal`;
const API_DEBT_URL = `${API_URL}/deudaPersonal`;

const styles = {
    title: "font-sans font-bold tracking-tight text-[#191c1e]",
    tech: "font-sans text-[11px] font-semibold uppercase tracking-wider text-[#424754]",
    glass: "bg-white border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden",
    input: "w-full bg-[#f2f4f6] border border-[#c2c6d6] p-3.5 text-[#191c1e] focus:bg-white focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 outline-none transition-all placeholder-[#727785] text-sm rounded-xl font-medium",
    btnOrange: "bg-[#0058be] hover:bg-[#004395] text-white font-semibold py-3 px-6 transition-all active:scale-[0.98] uppercase text-xs tracking-wider rounded-xl shadow-sm",
    incomeBadge: "bg-[#e6f7f0] text-[#006947] border border-[#00855b]/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit",
    expenseBadge: "bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"
};

// Mismos apartados que el resto del sistema
const medioLabels = {
    efectivo: 'EFECTIVO (CAJA)',
    debito: 'TARJETA DE DÉBITO',
    tarjeta_credito: 'TARJETA DE CRÉDITO',
    transferencia: 'TRANSFERENCIA',
    credito_1: 'CRÉDITO 1 CUOTA',
    credito_2: 'CRÉDITO 2 CUOTAS',
    credito_3: 'CRÉDITO 3 CUOTAS',
    credito_4: 'CRÉDITO 4 CUOTAS',
    credito_5: 'CRÉDITO 5 CUOTAS',
    credito_6: 'CRÉDITO 6 CUOTAS',
    mixto: 'PAGOS MIXTOS'
};

const PersonalBalance = () => {
    const [transactions, setTransactions] = useState([]);
    const [debts, setDebts] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [loading, setLoading] = useState(false);

    // Form fields
    const [tipo, setTipo] = useState('expense'); // 'income' | 'expense'
    const [descripcion, setDescripcion] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [medio, setMedio] = useState('efectivo');

    // Debt Form fields
    const [showDebtForm, setShowDebtForm] = useState(false);
    const [debtDesc, setDebtDesc] = useState('');
    const [debtCreditor, setDebtCreditor] = useState('');
    const [debtAmount, setDebtAmount] = useState('');
    const [debtQuotas, setDebtQuotas] = useState(1);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const [resTrans, resDept] = await Promise.all([
                axios.get(`${API_BASE}/obtenerBalancePersonal`),
                axios.get(`${API_DEBT_URL}/obtenerDeudas`)
            ]);
            setTransactions(resTrans.data);
            setDebts(resDept.data);
        } catch (e) {
            console.error('FETCH_ERROR', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    // Cálculos de totales
    const totals = useMemo(() => {
        return transactions.reduce((acc, t) => {
            const amount = parseFloat(t.monto);
            if (t.tipo === 'income') {
                acc.income += amount;
                acc.balance += amount;
            } else {
                acc.expense += amount;
                acc.balance -= amount;
            }
            return acc;
        }, { income: 0, expense: 0, balance: 0 });
    }, [transactions]);

    const handleCreateTransaction = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/crearBalancePersonal`, {
                producto: descripcion, // El backend usa 'producto' para la descripción/nombre
                descripcion: descripcion,
                monto: parseFloat(monto),
                metodo_pago: medio,
                cuenta: medio, // Mapeamos medio_pago a cuenta tambien para consistencia con modelo
                tipo,
                categoria: categoria || 'General',
                userId: 1 // Hardcoded por ahora, asumimos usuario principal o único
            });

            // Reset form
            setDescripcion('');
            setMonto('');
            setCategoria('');
            setMedio('efectivo');
            setTipo('expense');

            fetchTransactions();
            setView('list');
        } catch (err) {
            console.error('CREATE_TRANSACTION_ERROR', err);
            Swal.fire({ title: 'ERROR', text: 'Error al crear transacción', icon: 'error', confirmButtonColor: '#0058be' });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar registro?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ba1a1a',
            cancelButtonColor: '#727785'
        });
        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${API_BASE}/eliminarBalancePersonal/${id}`);
            fetchTransactions();
        } catch (e) {
            console.error('DELETE_ERROR', e);
        }
    };

    const handleCreateDebt = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_DEBT_URL}/crearDeuda`, {
                descripcion: debtDesc,
                acreedor: debtCreditor,
                montoTotal: parseFloat(debtAmount),
                cuotasTotales: parseInt(debtQuotas),
                detalleCuotas: null
            });
            setDebtDesc(''); setDebtCreditor(''); setDebtAmount(''); setDebtQuotas(1);
            setShowDebtForm(false);
            fetchTransactions();
        } catch (err) {
            console.error('CREATE_DEBT_ERROR', err);
            Swal.fire({ title: 'ERROR', text: 'Error al crear deuda', icon: 'error', confirmButtonColor: '#0058be' });
        }
    };

    const handlePayInstallment = async (debt, installment) => {
        if (installment.pagado) return;
        const resPay = await Swal.fire({
            title: '¿Registrar pago de cuota?',
            text: `¿Pagar cuota #${installment.numero} de $${parseFloat(installment.monto).toLocaleString('es-AR')}?`,
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
            text: '¿Deseas registrar también este pago como GASTO en tu balance personal?',
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Sí, registrar gasto',
            cancelButtonText: 'No, solo marcar pago',
            confirmButtonColor: '#0058be',
            cancelButtonColor: '#727785'
        });

        if (resExpense.isConfirmed) {
            await axios.post(`${API_BASE}/crearBalancePersonal`, {
                producto: `PAGO CUOTA ${installment.numero}/${debt.cuotasTotales}: ${debt.descripcion}`,
                descripcion: `PAGO PARCIAL A ${debt.acreedor}`,
                monto: parseFloat(installment.monto),
                metodo_pago: 'efectivo',
                cuenta: 'efectivo',
                tipo: 'expense',
                categoria: 'Deudas',
                userId: 1
            });
        }

        const updatedDetails = debt.detalleCuotas.map(d =>
            d.numero === installment.numero ? { ...d, pagado: true, fechaPago: new Date().toISOString() } : d
        );

        try {
            await axios.put(`${API_DEBT_URL}/actualizarDeuda/${debt.DebtId}`, {
                montoPagado: parseFloat(debt.montoPagado) + parseFloat(installment.monto),
                estado: (parseFloat(debt.montoPagado) + parseFloat(installment.monto)) >= parseFloat(debt.montoTotal) - 1 ? 'pagado' : 'pendiente',
                detalleCuotas: updatedDetails
            });
            fetchTransactions();
        } catch (e) {
            console.error(e);
            Swal.fire({ title: 'ERROR', text: 'Error al actualizar pago de cuota', icon: 'error', confirmButtonColor: '#0058be' });
        }
    };

    return (
        <div className="min-h-screen font-sans text-[#191c1e] space-y-8">
            {/* HEADER & SUMMARY */}
            <header className="mb-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#191c1e]">Balance Personal</h2>
                        <p className={styles.tech + " text-[#424754] mt-1"}>Gestión Privada de Finanzas y Pasivos</p>
                    </div>
                    <button onClick={() => setView(view === 'list' ? 'form' : 'list')} className={styles.btnOrange}>
                        {view === 'list' ? 'Nuevo Movimiento' : 'Volver al Listado'}
                    </button>
                </div>

                {/* SUMMARY CARDS */}
                {view === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white border border-[#e6e8ea] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl border-l-4 border-l-[#0058be]">
                            <p className={styles.tech + " text-[#424754] mb-1"}>Capital Disponible Neto</p>
                            <h3 className={`font-bold text-3xl tracking-tight ${totals.balance >= 0 ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
                                ${totals.balance.toLocaleString('es-AR')}
                            </h3>
                        </div>
                        <div className="bg-white border border-[#e6e8ea] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl border-l-4 border-l-[#006947]">
                            <p className={styles.tech + " text-[#424754] mb-1 flex items-center gap-1.5"}><FiArrowUp className="text-[#006947]" /> Total Ingresos</p>
                            <h3 className="font-bold text-3xl text-[#006947] tracking-tight">
                                +${totals.income.toLocaleString('es-AR')}
                            </h3>
                        </div>
                        <div className="bg-white border border-[#e6e8ea] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl border-l-4 border-l-[#ba1a1a]">
                            <p className={styles.tech + " text-[#424754] mb-1 flex items-center gap-1.5"}><FiArrowDown className="text-[#ba1a1a]" /> Total Gastos</p>
                            <h3 className="font-bold text-3xl text-[#ba1a1a] tracking-tight">
                                -${totals.expense.toLocaleString('es-AR')}
                            </h3>
                        </div>
                    </div>
                )}
            </header>

            {/* DEBT CONTROL SECTION */}
            {view === 'list' && (
                <section className="mb-10">
                    <div className="flex items-center justify-between gap-4 mb-6 border-b border-[#e6e8ea] pb-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold tracking-tight text-[#191c1e]">Control de Deudas y Pasivos</h3>
                            <span className="text-xs font-semibold text-[#0058be] uppercase tracking-wider bg-[#0058be]/10 px-2.5 py-1 rounded-lg">Seguimiento de Cuotas</span>
                        </div>
                        <button
                            onClick={() => setShowDebtForm(!showDebtForm)}
                            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border transition-all ${showDebtForm ? 'border-[#ba1a1a] text-[#ba1a1a] bg-[#ffdad6]' : 'border-[#0058be] text-[#0058be] bg-[#e8f1ff] hover:bg-[#0058be] hover:text-white'}`}
                        >
                            {showDebtForm ? 'Cancelar' : '+ Nueva Deuda'}
                        </button>
                    </div>

                    {/* DEBT FORM */}
                    {showDebtForm && (
                        <form onSubmit={handleCreateDebt} className="mb-8 bg-white p-6 border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl animate-in fade-in slide-in-from-top-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-[#0058be] mb-4">Registrar Pasivo Financiero</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <input placeholder="DESCRIPCIÓN" required value={debtDesc} onChange={e => setDebtDesc(e.target.value)} className={styles.input} />
                                <input placeholder="ACREEDOR" required value={debtCreditor} onChange={e => setDebtCreditor(e.target.value)} className={styles.input} />
                                <input type="number" placeholder="MONTO TOTAL" required value={debtAmount} onChange={e => setDebtAmount(e.target.value)} className={styles.input} />
                                <input type="number" placeholder="CUOTAS" min="1" required value={debtQuotas} onChange={e => setDebtQuotas(e.target.value)} className={styles.input} />
                            </div>
                            <button type="submit" className="w-full py-3 bg-[#0058be] hover:bg-[#004395] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm">Confirmar Deuda</button>
                        </form>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        {debts.map(debt => {
                            const progress = (parseFloat(debt.montoPagado) / parseFloat(debt.montoTotal)) * 100;
                            const isPaid = progress >= 99.9;

                            return (
                                <div key={debt.DebtId} className={`p-6 border rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all ${isPaid ? 'border-[#00855b]/30 bg-[#e6f7f0]/30' : 'border-[#e6e8ea] bg-white'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-[#191c1e] text-lg leading-tight uppercase tracking-tight">{debt.descripcion}</h4>
                                            <p className={styles.tech + " mt-1 text-[#424754]"}>ACREEDOR: {debt.acreedor} | PLAN: {debt.cuotasTotales} CUOTAS</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-[#191c1e]">${parseFloat(debt.montoTotal).toLocaleString('es-AR')}</p>
                                            <p className="text-xs font-semibold text-[#ba1a1a]">RESTANTE: ${(parseFloat(debt.montoTotal) - parseFloat(debt.montoPagado)).toLocaleString('es-AR')}</p>
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR */}
                                    <div className="space-y-1.5 mb-6">
                                        <div className="h-2 w-full bg-[#f2f4f6] rounded-full overflow-hidden border border-[#e6e8ea]">
                                            <div className={`h-full rounded-full transition-all duration-700 ${isPaid ? 'bg-[#006947]' : 'bg-[#0058be]'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-semibold text-[#424754]">
                                            <span>{progress.toFixed(1)}% AMORTIZADO</span>
                                            <span>{isPaid ? 'COMPLETADO' : 'EN PROGRESO'}</span>
                                        </div>
                                    </div>

                                    {/* INSTALLMENTS GRID */}
                                    {debt.detalleCuotas && Array.isArray(debt.detalleCuotas) && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                                            {debt.detalleCuotas.map((quota) => (
                                                <button
                                                    key={quota.numero}
                                                    disabled={quota.pagado}
                                                    onClick={() => handlePayInstallment(debt, quota)}
                                                    className={`p-3 border rounded-xl text-left transition-all relative group ${quota.pagado
                                                            ? 'border-[#00855b]/30 bg-[#e6f7f0] text-[#006947] cursor-default'
                                                            : 'border-[#c2c6d6] bg-[#f2f4f6] text-[#191c1e] hover:bg-[#0058be] hover:text-white hover:border-[#0058be] cursor-pointer'
                                                        }`}
                                                >
                                                    <p className="text-[10px] font-bold uppercase mb-0.5 opacity-80">CUOTA {quota.numero}</p>
                                                    <p className="font-bold text-sm mb-0.5">${parseFloat(quota.monto).toLocaleString('es-AR')}</p>
                                                    {quota.pagado
                                                        ? <FiCheckCircle className="absolute top-2.5 right-2.5 text-[#006947]" size={14} />
                                                        : <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Pagar &rarr;</span>
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {debts.length === 0 && <p className="text-xs font-semibold text-[#727785] italic">No hay deudas activas registradas</p>}
                    </div>
                </section>
            )}

            {/* LIST VIEW */}
            {view === 'list' && (
                <div className={styles.glass}>
                    <table className="w-full text-left">
                        <thead className="bg-[#f2f4f6] border-b border-[#e6e8ea] text-[#424754] text-[11px] uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="p-4 px-6">Tipo</th>
                                <th className="p-4 px-6">Detalle / Categoría</th>
                                <th className="p-4 px-6">Monto</th>
                                <th className="p-4 px-6">Cuenta / Medio</th>
                                <th className="p-4 px-6">Fecha</th>
                                <th className="p-4 px-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e6e8ea] text-xs">
                            {transactions.map(t => (
                                <tr key={t.PersonalBalanceId} className="hover:bg-[#f7f9fb] transition-colors font-sans">
                                    <td className="p-4 px-6">
                                        {t.tipo === 'income'
                                            ? <span className={styles.incomeBadge}><FiArrowUp /> INGRESO</span>
                                            : <span className={styles.expenseBadge}><FiArrowDown /> GASTO</span>
                                        }
                                    </td>
                                    <td className="p-4 px-6">
                                        <p className="text-[#191c1e] font-bold uppercase text-sm tracking-tight">{t.producto}</p>
                                        <p className="text-[#727785] font-medium text-[11px] uppercase">{t.categoria}</p>
                                    </td>
                                    <td className="p-4 px-6">
                                        <p className={`font-bold text-sm ${t.tipo === 'income' ? 'text-[#006947]' : 'text-[#ba1a1a]'}`}>
                                            {t.tipo === 'income' ? '+' : '-'}${parseFloat(t.monto).toLocaleString('es-AR')}
                                        </p>
                                    </td>
                                    <td className="p-4 px-6">
                                        <span className="text-[#191c1e] font-medium uppercase">{medioLabels[t.cuenta] || t.cuenta}</span>
                                    </td>
                                    <td className="p-4 px-6">
                                        <div className="flex items-center gap-1.5 text-[#727785]">
                                            <FiClock size={14} />
                                            <span>{new Date(t.createdAt).toLocaleDateString('es-AR')}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 px-6 text-right">
                                        <button
                                            onClick={() => handleDelete(t.PersonalBalanceId)}
                                            className="p-2 text-[#727785] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-all"
                                            title="Eliminar registro"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-[#727785] italic font-medium">
                                        No hay movimientos registrados aún
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FORM VIEW */}
            {view === 'form' && (
                <div className={styles.glass + " p-6 md:p-10 animate-in slide-in-from-right-10 fade-in duration-300"}>
                    <form className="space-y-6 max-w-3xl mx-auto" onSubmit={handleCreateTransaction}>
                        <div className="border-l-4 border-[#0058be] pl-4">
                            <h3 className="text-xl font-bold text-[#191c1e]">Nuevo Movimiento Personal</h3>
                            <p className={styles.tech}>Registro de Ingreso o Gasto en Balance Personal</p>
                        </div>

                        <div className="flex gap-2 p-1.5 bg-[#f2f4f6] rounded-2xl border border-[#e6e8ea] w-fit mb-6">
                            <button
                                type="button"
                                onClick={() => setTipo('income')}
                                className={`px-6 py-2.5 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all ${tipo === 'income' ? 'bg-[#006947] text-white shadow-sm' : 'text-[#424754] hover:text-[#191c1e]'}`}
                            >
                                Ingreso
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipo('expense')}
                                className={`px-6 py-2.5 font-semibold text-xs uppercase tracking-wider rounded-xl transition-all ${tipo === 'expense' ? 'bg-[#ba1a1a] text-white shadow-sm' : 'text-[#424754] hover:text-[#191c1e]'}`}
                            >
                                Gasto
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={styles.tech}>Descripción</label>
                                <input
                                    type="text"
                                    value={descripcion}
                                    required
                                    onChange={e => setDescripcion(e.target.value)}
                                    className={styles.input + " font-bold"}
                                    placeholder="Ej: Sueldo, Compra Supermercado..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={styles.tech}>Monto ARS ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={monto}
                                    required
                                    onChange={e => setMonto(e.target.value)}
                                    className={styles.input + " font-bold text-lg " + (tipo === 'income' ? 'text-[#006947]' : 'text-[#ba1a1a]')}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={styles.tech}>Categoría (Opcional)</label>
                                <input
                                    type="text"
                                    value={categoria}
                                    onChange={e => setCategoria(e.target.value)}
                                    className={styles.input}
                                    placeholder="Ej: Alquiler, Comida, Ocio..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={styles.tech}>Cuenta / Medio</label>
                                <select
                                    value={medio}
                                    onChange={e => setMedio(e.target.value)}
                                    className={styles.input + " cursor-pointer"}
                                >
                                    {Object.keys(medioLabels).map(key => (
                                        <option key={key} value={key}>{medioLabels[key]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-4 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] ${tipo === 'income' ? 'bg-[#006947] hover:bg-[#005136] text-white' : 'bg-[#ba1a1a] hover:bg-[#931313] text-white'}`}
                        >
                            {tipo === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PersonalBalance;
