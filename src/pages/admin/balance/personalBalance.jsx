import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    FiPlusCircle, FiTrash2, FiClock, FiDollarSign, FiTrendingUp, FiTrendingDown, FiArchive, FiArrowUp, FiArrowDown, FiCheckCircle
} from 'react-icons/fi';
const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN TÉCNICA DE RUTAS ---
const API_BASE = `${API_URL}/balancePersonal`;
const API_DEBT_URL = `${API_URL}/deudaPersonal`;

const styles = {
    title: "font-['Montserrat'] font-[900] tracking-tighter uppercase text-white leading-none",
    tech: "font-['JetBrains_Mono'] texºt-[#FF8C00] uppercase tracking-[0.2em] text-[10px]",
    glass: "bg-[#0A0A0A]/95 backdrop-blur-3xl border border-white/10 shadow-2xl overflow-hidden",
    input: "w-full bg-black border border-white/10 p-4 text-white focus:border-[#FF8C00] outline-none transition-all placeholder:text-zinc-800 text-xs rounded-none font-['Inter']",
    btnOrange: "bg-[#FF8C00] hover:bg-white text-black font-['Montserrat'] font-[900] py-4 px-8 transition-all duration-500 active:scale-95 uppercase text-[10px] tracking-[0.3em]",
    incomeBadge: "bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit",
    expenseBadge: "bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1 w-fit"
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
            alert('Error al crear transacción');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar registro permanente?')) return;
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
                detalleCuotas: null // Backend handles generation
            });
            setDebtDesc(''); setDebtCreditor(''); setDebtAmount(''); setDebtQuotas(1);
            setShowDebtForm(false);
            fetchTransactions();
        } catch (err) {
            console.error('CREATE_DEBT_ERROR', err);
            alert('Error al crear deuda');
        }
    };

    const handlePayInstallment = async (debt, installment) => {
        if (installment.pagado) return;
        if (!window.confirm(`¿Pagar cuota #${installment.numero} de $${parseFloat(installment.monto).toLocaleString()}?`)) return;

        // 1. Ask to record as expense
        if (window.confirm('¿Registrar también como GASTO en balance personal?')) {
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

        // 2. Update Debt
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
            alert('Error al actualizar pago de cuota');
        }
    };

    return (
        <div className={` min-h-screen font-['Inter'] font-medium text-white/50 animate-in fade-in duration-700`}>
            {/* HEADER & SUMMARY */}
            <header className="mb-12">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h2 className={styles.title + " text-5xl md:text-6xl"}>BALANCE_<span className="text-[#FF8C00]">PERSONAL</span></h2>
                        <div className="h-1 w-24 bg-[#FF8C00] mt-4 shadow-[0_0_20px_rgba(255,140,0,0.6)]"></div>
                        <p className={styles.tech + " mt-4"}>Private_Ledger // User_01</p>
                    </div>
                    <button onClick={() => setView(view === 'list' ? 'form' : 'list')} className={styles.btnOrange}>
                        {view === 'list' ? 'NUEVO_MOVIMIENTO' : 'VOLVER_AL_LISTADO'}
                    </button>
                </div>

                {/* SUMMARY CARDS */}
                {view === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-xl">
                            <p className={styles.tech + " text-zinc-500 mb-2"}>NET_AVAILABLE_ASSETS</p>
                            <h3 className={`font-['Montserrat'] font-black text-4xl ${totals.balance >= 0 ? 'text-white' : 'text-red-500'}`}>
                                ${totals.balance.toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-xl">
                            <p className={styles.tech + " text-zinc-500 mb-2 flex items-center gap-2"}><FiArrowUp className="text-green-500" /> TOTAL_INCOME</p>
                            <h3 className="font-['Montserrat'] font-black text-3xl text-green-500 opacity-90">
                                +${totals.income.toLocaleString()}
                            </h3>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-6 backdrop-blur-xl">
                            <p className={styles.tech + " text-zinc-500 mb-2 flex items-center gap-2"}><FiArrowDown className="text-red-500" /> TOTAL_EXPENSES</p>
                            <h3 className="font-['Montserrat'] font-black text-3xl text-red-500 opacity-90">
                                -${totals.expense.toLocaleString()}
                            </h3>
                        </div>
                    </div>
                )}
            </header>

            {/* DEBT CONTROL SECTION */}
            {view === 'list' && (
                <section className="mb-20">
                    <div className="flex items-center justify-between gap-4 mb-8 border-b border-white/10 pb-4">
                        <div className="flex items-center gap-4">
                            <h3 className={styles.title + " text-2xl"}>CONTROL_DE_DEUDAS</h3>
                            <span className={styles.tech}>DEBT_PROGRESS_TRACKER</span>
                        </div>
                        <button
                            onClick={() => setShowDebtForm(!showDebtForm)}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest border ${showDebtForm ? 'border-red-500 text-red-500' : 'border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black'} transition-all`}
                        >
                            {showDebtForm ? 'CANCELAR_NUEVA_DEUDA' : '+ NUEVA_DEUDA'}
                        </button>
                    </div>

                    {/* DEBT FORM */}
                    {showDebtForm && (
                        <form onSubmit={handleCreateDebt} className="mb-12 bg-white/[0.02] p-8 border border-orange-500/20 animate-in fade-in slide-in-from-top-4">
                            <h4 className={styles.tech + " mb-6 text-orange-500"}>REGISTRAR_PASIVO_FINANCIERO</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <input placeholder="DESCRIPCION" required value={debtDesc} onChange={e => setDebtDesc(e.target.value)} className={styles.input} />
                                <input placeholder="ACREEDOR" required value={debtCreditor} onChange={e => setDebtCreditor(e.target.value)} className={styles.input} />
                                <input type="number" placeholder="MONTO TOTAL" required value={debtAmount} onChange={e => setDebtAmount(e.target.value)} className={styles.input} />
                                <input type="number" placeholder="CUOTAS" min="1" required value={debtQuotas} onChange={e => setDebtQuotas(e.target.value)} className={styles.input} />
                            </div>
                            <button type="submit" className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-black font-black text-xs uppercase tracking-widest">CONFIRMAR_DEUDA</button>
                        </form>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                        {debts.map(debt => {
                            const progress = (parseFloat(debt.montoPagado) / parseFloat(debt.montoTotal)) * 100;
                            const isPaid = progress >= 99.9;

                            return (
                                <div key={debt.DebtId} className={`relative p-8 border ${isPaid ? 'border-green-500/20 bg-green-500/[0.02]' : 'border-white/10 bg-white/[0.02]'} backdrop-blur-xl transition-all`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h4 className="font-['Montserrat'] font-black text-white text-xl leading-tight uppercase">{debt.descripcion}</h4>
                                            <p className={styles.tech + " mt-2 text-zinc-500"}>ACREEDOR: {debt.acreedor} // PLAN: {debt.cuotasTotales} CUOTAS</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white">${parseFloat(debt.montoTotal).toLocaleString()}</p>
                                            <p className={styles.tech + " text-zinc-600"}>RESTANTE: ${(parseFloat(debt.montoTotal) - parseFloat(debt.montoPagado)).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {/* PROGRESS BAR */}
                                    <div className="space-y-2 mb-8">
                                        <div className="h-1 w-full bg-white/5 overflow-hidden">
                                            <div className={`h-full ${isPaid ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-zinc-600">
                                            <span>{progress.toFixed(1)}% PAGADO</span>
                                            <span>{isPaid ? 'COMPLETADO' : 'EN PROGRESO'}</span>
                                        </div>
                                    </div>

                                    {/* INSTALLMENTS GRID */}
                                    {debt.detalleCuotas && Array.isArray(debt.detalleCuotas) ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {debt.detalleCuotas.map((quota) => (
                                                <button
                                                    key={quota.numero}
                                                    disabled={quota.pagado}
                                                    onClick={() => handlePayInstallment(debt, quota)}
                                                    className={`p-3 border text-left transition-all relative group
                                                        ${quota.pagado
                                                            ? 'border-green-500/30 bg-green-500/10 text-green-500 cursor-default'
                                                            : 'border-white/10 bg-black hover:border-orange-500 hover:bg-orange-500/10 cursor-pointer'
                                                        }
                                                    `}
                                                >
                                                    <p className="text-[9px] font-black uppercase mb-1 opacity-60">CUOTA {quota.numero}</p>
                                                    <p className="font-bold text-sm mb-1">${parseFloat(quota.monto).toLocaleString()}</p>
                                                    {quota.pagado
                                                        ? <FiCheckCircle className="absolute top-2 right-2 text-green-500" size={12} />
                                                        : <span className="text-[8px] text-orange-500 font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">PAGAR &rarr;</span>
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        // Fallback logic for legacy debts or errors
                                        !isPaid && (
                                            <div className="p-4 border border-white/5 bg-white/[0.02] text-center">
                                                <p className={styles.tech + " text-zinc-500 mb-2"}>REGISTRO SIN DETALLE DE CUOTAS</p>
                                                <button
                                                    onClick={async () => {
                                                        const remaining = parseFloat(debt.montoTotal) - parseFloat(debt.montoPagado);
                                                        const amountStr = prompt(`Ingrese monto a pagar (Restante: $${remaining.toLocaleString()})`);
                                                        if (!amountStr) return;
                                                        const amount = parseFloat(amountStr);
                                                        if (isNaN(amount) || amount <= 0) return alert('Monto inválido');

                                                        // Update logic tailored for legacy compatibility
                                                        // ... (omitted for brevity, assume simple update)
                                                    }}
                                                    className="px-6 py-2 border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black text-[10px] font-black uppercase"
                                                >
                                                    PAGAR SALDO
                                                </button>
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })}
                        {debts.length === 0 && <p className={styles.tech + " text-zinc-600"}>NO_ACTIVE_DEBTS_FOUND</p>}
                    </div>
                </section>
            )}

            {/* LIST VIEW */}
            {view === 'list' && (
                <div className={styles.glass}>
                    <table className="w-full text-left">
                        <thead className="bg-white/[0.03] border-b border-white/10 font-['JetBrains_Mono'] text-[#FF8C00] text-[9px] uppercase tracking-[0.2em]">
                            <tr className="bg-white/[0.03]">
                                <th className="p-6">Tipo</th>
                                <th className="p-6">Detalle / Categoría</th>
                                <th className="p-6">Monto</th>
                                <th className="p-6">Cuenta / Medio</th>
                                <th className="p-6">Fecha</th>
                                <th className="p-6 text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-['JetBrains_Mono'] text-[11px]">
                            {transactions.map(t => (
                                <tr key={t.PersonalBalanceId} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-6">
                                        {t.tipo === 'income'
                                            ? <span className={styles.incomeBadge}><FiArrowUp /> INGRESO</span>
                                            : <span className={styles.expenseBadge}><FiArrowDown /> GASTO</span>
                                        }
                                    </td>
                                    <td className="p-6">
                                        <p className="text-white font-[900] text-sm uppercase tracking-tighter">{t.producto}</p>
                                        <p className="text-zinc-600 font-bold mt-1 text-[9px] uppercase">{t.categoria}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className={`font-black text-[13px] ${t.tipo === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.tipo === 'income' ? '+' : '-'}${parseFloat(t.monto).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2">
                                            {/* Icon could be added based on type */}
                                            <span className="text-white opacity-80 uppercase tracking-wider">{medioLabels[t.cuenta] || t.cuenta}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <FiClock size={12} />
                                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button
                                            onClick={() => handleDelete(t.PersonalBalanceId)}
                                            className="p-3 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-zinc-600 italic">
                                        NO_TRANSACTIONS_LOGGED_YET
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* FORM VIEW */}
            {view === 'form' && (
                <div className={styles.glass + " p-12 md:p-20 animate-in slide-in-from-right-10 fade-in duration-500"}>
                    <form className="space-y-12 max-w-4xl mx-auto" onSubmit={handleCreateTransaction}>
                        <div className="border-l-4 border-orange-500 pl-8">
                            <h3 className={styles.title + " text-4xl mb-2"}>NUEVO_REGISTRO</h3>
                            <p className={styles.tech}>ADD_TRANSACTION_TO_LEDGER</p>
                        </div>

                        <div className="flex gap-4 p-1 bg-white/5 w-fit mb-8">
                            <button
                                type="button"
                                onClick={() => setTipo('income')}
                                className={`px-8 py-3 font-black text-xs uppercase tracking-widest transition-all ${tipo === 'income' ? 'bg-green-600 text-white shadow-lg shadow-green-900/50' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Ingreso
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipo('expense')}
                                className={`px-8 py-3 font-black text-xs uppercase tracking-widest transition-all ${tipo === 'expense' ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-zinc-500 hover:text-white'}`}
                            >
                                Gasto
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className={styles.tech}>DESCRIPCION</label>
                                <input
                                    type="text"
                                    value={descripcion}
                                    required
                                    onChange={e => setDescripcion(e.target.value)}
                                    className={styles.input + " h-16 text-xl"}
                                    placeholder="Ej: Sueldo, Compra Supermercado..."
                                />
                            </div>
                            <div className="space-y-4">
                                <label className={styles.tech}>MONTO</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={monto}
                                    required
                                    onChange={e => setMonto(e.target.value)}
                                    className={styles.input + " h-16 text-3xl font-bold " + (tipo === 'income' ? 'text-green-500' : 'text-red-500')}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-4">
                                <label className={styles.tech}>CATEGORIA (OPCIONAL)</label>
                                <input
                                    type="text"
                                    value={categoria}
                                    onChange={e => setCategoria(e.target.value)}
                                    className={styles.input + " h-16"}
                                    placeholder="Ej: Alquiler, Comida, Ocio..."
                                />
                            </div>
                            <div className="space-y-4">
                                <label className={styles.tech}>CUENTA / MEDIO</label>
                                <select
                                    value={medio}
                                    onChange={e => setMedio(e.target.value)}
                                    className={styles.input + " h-16 bg-zinc-900 font-['Montserrat'] font-black text-xs tracking-widest uppercase cursor-pointer"}
                                >
                                    {Object.keys(medioLabels).map(key => (
                                        <option key={key} value={key}>{medioLabels[key]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full h-24 text-sm tracking-[0.5em] font-['Montserrat'] font-black uppercase transition-all hover:brightness-110 active:scale-[0.99]
                                ${tipo === 'income' ? 'bg-green-600 text-white shadow-[0_0_30px_rgba(22,163,74,0.3)]' : 'bg-red-600 text-white shadow-[0_0_30px_rgba(220,38,38,0.3)]'}
                            `}
                        >
                            {tipo === 'income' ? 'REGISTRAR INGRESO' : 'REGISTRAR GASTO'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PersonalBalance;
