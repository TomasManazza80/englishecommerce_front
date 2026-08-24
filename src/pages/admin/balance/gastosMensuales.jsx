import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiPlusCircle, FiSearch, FiCheckCircle, FiAlertCircle, FiXCircle,
    FiTrash2, FiRefreshCw, FiClock, FiDollarSign, FiCreditCard, FiSmartphone, FiCalendar, FiEdit
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN TÉCNICA DE RUTAS ---
const API_BASE = `${API_URL}/gastosMensuales`;
const API_BALANCE_URL = `${API_URL}/balanceMensual/CreaBalanceMensual`;
const API_RESPONSABLES = `${API_URL}/egresos/responsables`;

const styles = {
    title: "font-sans font-bold tracking-tight text-[#191c1e]",
    tech: "font-sans text-[11px] font-semibold uppercase tracking-wider text-[#424754]",
    glass: "bg-white border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden",
    input: "w-full bg-[#f2f4f6] border border-[#c2c6d6] p-3.5 text-[#191c1e] focus:bg-white focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 outline-none transition-all placeholder-[#727785] text-sm rounded-xl font-medium",
    btnBw: "bg-[#0058be] hover:bg-[#004395] text-white font-semibold py-3 px-6 transition-all active:scale-[0.98] uppercase text-xs tracking-wider rounded-xl shadow-sm",
    sourceBtn: "flex-1 border border-[#c2c6d6] bg-[#f2f4f6] hover:border-[#0058be] hover:bg-[#e8f1ff] text-[#191c1e] p-3 transition-all rounded-xl flex flex-col items-center gap-2 font-medium text-xs",
    btnPaid: "w-full border border-[#00855b]/30 text-[#006947] bg-[#e6f7f0] font-semibold py-2.5 px-4 uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2",
    btnPending: "w-full border border-[#ba1a1a]/30 text-[#ba1a1a] bg-[#ffdad6] hover:bg-[#ffc8c2] font-semibold py-2.5 px-4 transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2"
};

// Mismos apartados que el módulo de egresos
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

const MonthlyExpenseTracker = () => {
    const [expenseList, setExpenseList] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'form'
    const [searchTerm, setSearchTerm] = useState('');
    const [syncingId, setSyncingId] = useState(null);
    const [selectingSourceId, setSelectingSourceId] = useState(null);
    const [overallBalance, setOverallBalance] = useState({});
    const [isResetting, setIsResetting] = useState(false);

    // Form fields for new/edit expense
    const [editingId, setEditingId] = useState(null);
    const [nombre, setNombre] = useState('');
    const [monto, setMonto] = useState('');
    const [medio, setMedio] = useState('efectivo');
    const [vencimiento, setVencimiento] = useState('');
    const [responsable, setResponsable] = useState('');
    const [responsablesList, setResponsablesList] = useState([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(`${API_BASE}/obtenerGastosMensuales`);
            setExpenseList(res.data);
        } catch (e) {
            console.error('FETCH_ERROR', e);
        }
    };

    const fetchBalance = async () => {
        try {
            const res = await axios.get(`${API_URL}/balanceMensual/ObtenBalanceMensual`);
            const data = res.data || [];
            const totals = {
                efectivo: 0, debito: 0, tarjeta_credito: 0, transferencia: 0,
                credito_1: 0, credito_2: 0, credito_3: 0, credito_4: 0,
                credito_5: 0, credito_6: 0, mixtos: 0
            };

            data.forEach(entry => {
                const monto = parseFloat(entry.monto) || 0;
                const metodo = entry.metodo_pago;

                if (metodo === 'mixto' && entry.detalles_pago?.mixto) {
                    const mixtoData = entry.detalles_pago.mixto;
                    if (mixtoData.efectivo) totals.efectivo += parseFloat(mixtoData.efectivo) || 0;
                    if (mixtoData.transferencia) totals.transferencia += parseFloat(mixtoData.transferencia) || 0;
                    if (mixtoData.debito) totals.debito += parseFloat(mixtoData.debito) || 0;
                } else if (totals.hasOwnProperty(metodo)) {
                    totals[metodo] += monto;
                }
            });
            setOverallBalance(totals);
        } catch (e) {
            console.error('FETCH_BALANCE_ERROR', e);
        }
    };

    const fetchResponsables = async () => {
        try {
            const res = await axios.get(API_RESPONSABLES);
            setResponsablesList(Array.isArray(res.data) ? res.data.map(r => r.nombre) : []);
        } catch (e) {
            console.error("Error fetching responsables:", e);
        }
    };

    useEffect(() => {
        fetchExpenses();
        fetchBalance();
        fetchResponsables();
    }, []);

    const confirmPaymentWithSource = async (id, source) => {
        const expense = expenseList.find(ex => ex.MonthlyExpenseId === id);
        if (!expense) return;

        // VERIFICACIÓN DE FONDOS
        const available = overallBalance[source] || 0;
        if (available < expense.monto) {
            alert(`SITUACIÓN_ALERTA: Fondos insuficientes en ${medioLabels[source] || source}.\nSaldo disponible: $${available.toLocaleString()}\nMonto a pagar: $${parseFloat(expense.monto).toLocaleString()}`);
            setSelectingSourceId(null);
            return;
        }

        setSyncingId(id);
        setSelectingSourceId(null);
        try {
            await axios.put(`${API_BASE}/confirmarPago/${id}`, { medio_pago: source });
            // Descontar del balance mensual (monto negativo)
            await axios.post(API_BALANCE_URL, {
                producto: `PAGO_GASTO: ${expense.nombre}`,
                monto: -parseFloat(expense.monto),
                cantidad: 1,
                metodo_pago: source,
                fecha: new Date().toISOString().split('T')[0]
            });

            setTimeout(() => { fetchExpenses(); fetchBalance(); setSyncingId(null); }, 500);
        } catch (e) {
            setSyncingId(null);
        }
    };

    const handleRevertPayment = async (id) => {
        setSyncingId(id);
        try {
            await axios.put(`${API_BASE}/confirmarPago/${id}`);
            fetchExpenses();
            setSyncingId(null);
        } catch (e) {
            setSyncingId(null);
        }
    };

    const handleResetMonth = async () => {
        if (!window.confirm('¿ATENCIÓN: REINICIAR_MES? Esto marcará TODOS los gastos fijos como PENDIENTES de pago para el nuevo mes. ¿Continuar?')) return;
        setIsResetting(true);
        try {
            await axios.put(`${API_BASE}/resetGastos`);
            await fetchExpenses();
            alert('ÉXITO: Todos los gastos han sido reiniciados para el nuevo mes.');
        } catch (e) {
            console.error('ERROR_RESET_MONTH', e);
            alert('ERROR: No se pudieron reiniciar los gastos.');
        } finally {
            setIsResetting(false);
        }
    };

    const handleEditExpense = (expense) => {
        setEditingId(expense.MonthlyExpenseId);
        setNombre(expense.nombre);
        setMonto(expense.monto);
        // Aseguramos que la fecha esté en formato YYYY-MM-DD para el input
        const formattedDate = expense.vencimiento ? new Date(expense.vencimiento).toISOString().split('T')[0] : '';
        setVencimiento(formattedDate);
        setMedio(expense.medio_pago || 'efectivo');
        setResponsable(expense.responsable || '');
        setView('form');
    };

    const handleNotify = async (expense) => {
        const phone = prompt("Ingrese el número de WhatsApp para notificar (ej: 5491166778899):");
        if (!phone) return;
        try {
            await axios.post(`${API_BASE}/notificar/${expense.MonthlyExpenseId}`, { phoneNumber: phone });
            alert("Notificación enviada con éxito.");
        } catch (e) {
            alert(e.response?.data?.error || "Error al enviar notificación.");
        }
    };

    const formatTechDate = (dateString) => {
        if (!dateString) return 'NO_MOD';
        const date = new Date(dateString);
        return date.toLocaleString('es-AR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).replace(',', ' //');
    };

    const formatDeadline = (dateString) => {
        if (!dateString) return 'ST_UNDEFINED';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    // --- CREAR/EDITAR GASTO MENSUAL ---
    const handleCreateExpense = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Modo Edición
                await axios.put(`${API_BASE}/actualizarGasto/${editingId}`, {
                    nombre,
                    monto: parseFloat(monto),
                    vencimiento,
                    medio_pago: medio,
                    responsable: responsable.toUpperCase()
                });
                setEditingId(null);
            } else {
                // Modo Creación
                await axios.post(`${API_BASE}/crearGastoMensual`, {
                    nombre,
                    monto: parseFloat(monto),
                    vencimiento,
                    medio_pago: medio,
                    responsable: responsable.toUpperCase()
                });
            }

            // Limpiar formulario y volver a lista
            setNombre('');
            setMonto('');
            setVencimiento('');
            setMedio('efectivo');
            setResponsable('');
            fetchExpenses();
            setView('list');
        } catch (err) {
            console.error('SAVE_EXPENSE_ERROR', err);
        }
    };

    const filtered = expenseList.filter(ex => ex.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className={`bg-white min-h-screen p-10 font-['Inter'] font-medium text-black/50`}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#191c1e]">Gastos Fijos Mensuales</h2>
                    <p className={styles.tech + " text-[#424754] mt-1"}>Control de Servicios y Pagos Recurrentes</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <button onClick={handleResetMonth} disabled={isResetting} className="bg-[#f2f4f6] text-[#191c1e] hover:bg-[#e6e8ea] border border-[#c2c6d6] font-semibold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-all w-full md:w-auto flex items-center justify-center gap-2">
                        <FiRefreshCw className={isResetting ? "animate-spin text-[#0058be]" : "text-[#0058be]"} />
                        {isResetting ? 'Procesando...' : 'Reiniciar Mes'}
                    </button>
                    <button onClick={() => { setView(view === 'list' ? 'form' : 'list'); setEditingId(null); }} className={`${styles.btnBw} w-full md:w-auto`}>
                        {view === 'list' ? 'Nuevo Registro' : 'Volver'}
                    </button>
                </div>
            </header>

            {view === 'list' && (
                <div className="space-y-6">
                    <div className="bg-[#f2f4f6] border border-[#c2c6d6] rounded-xl p-3 flex items-center gap-3">
                        <FiSearch className="text-[#727785]" />
                        <input
                            type="text"
                            placeholder="Buscar por concepto..."
                            className="bg-transparent border-none outline-none text-[#191c1e] text-xs w-full font-medium"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className={`${styles.glass} overflow-x-auto custom-scrollbar`}>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#f2f4f6] border-b border-[#e6e8ea] text-[#424754] text-[11px] uppercase tracking-wider font-semibold">
                                    <th className="px-6 py-4">Concepto</th>
                                    <th className="px-6 py-4">Responsable</th>
                                    <th className="px-6 py-4">Fecha Límite</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Acción</th>
                                    <th className="px-6 py-4 text-right">Herramientas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e8ea] text-xs">
                                {filtered.map(expense => (
                                    <tr key={expense.MonthlyExpenseId} className={`transition-all ${expense.pagado ? 'bg-[#e6f7f0]/40' : 'hover:bg-[#f7f9fb]'}`}>
                                        <td className="px-6 py-4">
                                            <p className="text-[#191c1e] font-bold text-sm tracking-tight">{expense.nombre}</p>
                                            <p className="text-[#0058be] font-bold text-xs mt-0.5">${parseFloat(expense.monto).toLocaleString('es-AR')}</p>
                                        </td>
                                        <td className="px-6 py-4 uppercase text-[#424754] font-semibold text-xs">
                                            {expense.responsable || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[#191c1e] font-medium">
                                                <FiCalendar className="text-[#0058be]" size={14} />
                                                <span>{formatDeadline(expense.vencimiento)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {expense.pagado ? (
                                                <div className="flex flex-col">
                                                    <span className="text-[#006947] font-bold text-xs">COMPLETADO</span>
                                                    <span className="text-[#727785] text-[10px] uppercase">{medioLabels[expense.medio_pago] || expense.medio_pago}</span>
                                                </div>
                                            ) : (
                                                <span className="text-[#ba1a1a] font-bold text-xs">PENDIENTE</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {syncingId === expense.MonthlyExpenseId ? (
                                                <div className="flex items-center gap-2 text-[#0058be] animate-pulse font-semibold">
                                                    <FiRefreshCw className="animate-spin" /> Procesando...
                                                </div>
                                            ) : selectingSourceId === expense.MonthlyExpenseId ? (
                                                <div className="flex flex-wrap gap-1.5 animate-in fade-in zoom-in duration-300">
                                                    {Object.keys(medioLabels).map(m => (
                                                        <button
                                                            key={m}
                                                            onClick={() => confirmPaymentWithSource(expense.MonthlyExpenseId, m)}
                                                            className="bg-[#f2f4f6] hover:bg-[#0058be] hover:text-white border border-[#c2c6d6] px-2.5 py-1 text-[10px] uppercase font-semibold rounded-lg transition-all"
                                                        >
                                                            {medioLabels[m]}
                                                        </button>
                                                    ))}
                                                    <button onClick={() => setSelectingSourceId(null)} className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg"><FiXCircle /></button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (expense.pagado) {
                                                            handleRevertPayment(expense.MonthlyExpenseId);
                                                        } else {
                                                            setSelectingSourceId(expense.MonthlyExpenseId);
                                                        }
                                                    }}
                                                    className={expense.pagado ? styles.btnPaid : styles.btnPending}
                                                >
                                                    {expense.pagado ? <><FiCheckCircle /> Pagado (Revertir)</> : <><FiDollarSign /> Pagar Ahora</>}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleNotify(expense)}
                                                    className="p-2 text-[#727785] hover:text-[#0058be] hover:bg-[#e8f1ff] rounded-xl transition-all"
                                                    title="Notificar WhatsApp"
                                                >
                                                    <FiSmartphone className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditExpense(expense)}
                                                    className="p-2 text-[#727785] hover:text-[#191c1e] hover:bg-[#f2f4f6] rounded-xl transition-all"
                                                    title="Editar Gasto Fijo"
                                                >
                                                    <FiEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: '¿Eliminar gasto fijo?',
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
                                                            await axios.delete(`${API_BASE}/eliminarGastoMensual/${expense.MonthlyExpenseId}`);
                                                            fetchExpenses();
                                                        } catch (e) {
                                                            console.error('DELETE_ERROR', e);
                                                        }
                                                    }}
                                                    className="p-2 text-[#727785] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-all"
                                                    title="Eliminar registro"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'form' && (
                <div className={styles.glass + " p-6 md:p-10"}>
                    <form className="space-y-6" onSubmit={handleCreateExpense}>
                        <div className="border-l-4 border-[#0058be] pl-4">
                            <h3 className="text-xl font-bold text-[#191c1e]">{editingId ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo Mensual'}</h3>
                            <p className={styles.tech}>{editingId ? `Modificando ID: ${editingId}` : 'Registro de nuevo gasto recurrente'}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={styles.tech}>Concepto</label>
                                <input type="text" value={nombre} required onChange={e => setNombre(e.target.value)} className={styles.input + " font-bold"} placeholder="Ej: Alquiler Local" />
                            </div>
                            <div className="space-y-2 relative">
                                <label className={styles.tech}>Responsable</label>
                                <input
                                    type="text"
                                    value={responsable}
                                    required
                                    onChange={e => setResponsable(e.target.value)}
                                    onFocus={() => setIsSuggestionsVisible(true)}
                                    onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)}
                                    className={styles.input + " uppercase"}
                                    placeholder="Nombre a quien corresponde"
                                    autoComplete="off"
                                />
                                <AnimatePresence>
                                    {isSuggestionsVisible && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute z-50 w-full mt-1 bg-white border border-[#c2c6d6] shadow-lg rounded-xl max-h-48 overflow-y-auto custom-scrollbar"
                                        >
                                            {responsablesList
                                                .filter(r => !responsable || r.toLowerCase().includes(responsable.toLowerCase()))
                                                .map((name, index) => (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onMouseDown={() => { setResponsable(name); setIsSuggestionsVisible(false); }}
                                                        className="w-full text-left px-4 py-3 text-xs text-[#191c1e] hover:bg-[#f2f4f6] transition-colors border-b border-[#e6e8ea] last:border-0 uppercase font-semibold"
                                                    >{name}</button>
                                                ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <div className="space-y-2">
                                <label className={styles.tech}>Monto Mensual ARS ($)</label>
                                <input type="number" step="0.01" value={monto} required onChange={e => setMonto(e.target.value)} className={styles.input + " font-bold text-lg"} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <label className={styles.tech}>Fecha de Vencimiento</label>
                                <input type="date" value={vencimiento} required onChange={e => setVencimiento(e.target.value)} className={styles.input} />
                            </div>
                            <div className="space-y-2">
                                <label className={styles.tech}>Modalidad por Defecto</label>
                                <select value={medio} onChange={e => setMedio(e.target.value)} className={styles.input + " cursor-pointer"}>
                                    {Object.keys(medioLabels).map(key => (
                                        <option key={key} value={key}>{medioLabels[key]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => { setView('list'); setEditingId(null); }} className="flex-1 border border-[#c2c6d6] bg-[#f2f4f6] text-[#191c1e] hover:bg-[#e6e8ea] font-semibold py-3.5 rounded-xl uppercase text-xs tracking-wider transition-all">Cancelar</button>
                            <button type="submit" className={`flex-[2] ${styles.btnBw} py-3.5`}>{editingId ? 'Actualizar Gasto' : 'Registrar Gasto'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MonthlyExpenseTracker;