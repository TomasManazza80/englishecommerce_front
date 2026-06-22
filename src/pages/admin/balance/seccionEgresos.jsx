import React, { useState, useEffect, useMemo } from 'react';
import {
    TableCellsIcon,
    MagnifyingGlassIcon,
    TrashIcon,
    ArrowPathIcon,
    PlusIcon,
    ArrowTrendingDownIcon,
    BanknotesIcon,
    CircleStackIcon,
    CheckCircleIcon,
    CalendarIcon
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN TÉCNICA DE RUTAS ---
// Base: http://localhost:3000/egresos/egress
const API_URL = import.meta.env.VITE_API_URL;
const API_URL_EG = `${API_URL}/egresos/egress`;
const API_RESPONSABLES = `${API_URL}/egresos/responsables`;
const API_BALANCE_URL = `${API_URL}/balanceMensual/CreaBalanceMensual`;

const styles = {
    title: "font-['Inter'] font-[900] tracking-tighter uppercase text-white leading-none",
    body: "font-['Inter'] font-[500] text-zinc-400",
    tech: "font-['Inter'] text-white uppercase tracking-[0.2em] text-[10px] font-bold",
    glass: "bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/5 shadow-2xl rounded-2xl overflow-hidden",
    input: "w-full bg-black/60 border border-white/10 p-5 text-white focus:border-white outline-none transition-all placeholder:text-zinc-800 text-sm rounded-xl font-['Inter']",
    btnBw: "bg-white hover:bg-gray-200 text-black font-['Inter'] font-[900] py-5 px-10 transition-all active:scale-95 uppercase text-xs tracking-[0.2em] rounded-xl shadow-lg shadow-white/10",
    statCard: "bg-white/[0.02] border border-white/5 p-8 rounded-2xl hover:border-white/30 transition-all group"
};

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

const EgressModule = () => {
    const [egressList, setEgressList] = useState([]);
    const [view, setView] = useState('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form states
    const [monto, setMonto] = useState('');
    const [detalle, setDetalle] = useState('');
    const [medio, setMedio] = useState('efectivo');
    const [responsable, setResponsable] = useState('');
    const [responsablesList, setResponsablesList] = useState([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- ACCIÓN: GET /egresos/egress ---
    const fetchEgresses = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL_EG);
            const data = await response.json();
            // Normalización de respuesta para evitar errores de .reduce()
            setEgressList(Array.isArray(data) ? data : (data.egresses || []));
        } catch (error) {
            console.error("FEDECELL_FETCH_ERROR:", error);
            setEgressList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEgresses();
        fetchResponsables();
        // Set default date range to the current month
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDay);
        setEndDate(lastDay);
    }, []);

    // --- LÓGICA DE AUTOCOMPLETADO (CATÁLOGO DB) ---
    const fetchResponsables = async () => {
        try {
            const res = await fetch(API_RESPONSABLES);
            const data = await res.json();
            // data es array de objetos [{id, nombre}, ...]
            setResponsablesList(Array.isArray(data) ? data.map(r => r.nombre) : []);
        } catch (e) { console.error("Error fetching responsables:", e); }
    };

    // --- CÁLCULOS TÉCNICOS ---
    const stats = useMemo(() => {
        const list = Array.isArray(egressList) ? egressList : [];
        const total = list.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
        const hoy = list.filter(e => {
            const f = e.createdAt || e.fecha;
            return f && new Date(f).toDateString() === new Date().toDateString();
        }).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
        return { total, hoy, count: list.length };
    }, [egressList]);

    // --- ACCIÓN: POST /egresos/egress AND /balanceMensual/CreaBalanceMensual ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            // 1. Crear el Egreso Administrativo
            const resEgress = await fetch(API_URL_EG, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    monto: parseFloat(monto),
                    detalle: detalle.toUpperCase(),
                    medio,
                    responsable: responsable.toUpperCase()
                })
            });

            // 2. Descontar del Balance Mensual (Impacto en Caja/Cuentas)
            // Se envía un monto negativo para restar del balance seleccionado
            const resBalance = await fetch(API_BALANCE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producto: `EGRESO: ${detalle.toUpperCase()}`,
                    monto: -parseFloat(monto), // Monto en negativo
                    cantidad: 1,
                    metodo_pago: medio,
                    // La fecha se genera automáticamente en backend o se puede forzar si es necesario
                    fecha: new Date().toISOString().split('T')[0]
                })
            });

            if (resEgress.ok && resBalance.ok) {
                // Solo proceder si ambas operaciones fueron exitosas
                const nuevoResponsable = responsable.toUpperCase();
                if (nuevoResponsable && !responsablesList.includes(nuevoResponsable)) {
                    setResponsablesList(prev => [...prev, nuevoResponsable].sort());
                }

                setMonto('');
                setDetalle('');
                setResponsable('');
                setShowSuccess(true);

                setTimeout(() => {
                    setShowSuccess(false);
                    fetchEgresses();
                    fetchResponsables(); // Sincronizamos con DB (por si hubo otros cambios)
                    setView('list');
                    setIsSubmitting(false);
                }, 2000);
            } else {
                // Manejo de error mejorado para estados inconsistentes
                let errorMessage = "Error al registrar el egreso. Intente nuevamente.";
                if (resEgress.ok && !resBalance.ok) {
                    errorMessage = "ATENCIÓN: El egreso se guardó, pero falló la actualización del balance. Por favor, revise manualmente para evitar descuadres.";
                    console.error("FEDECELL_INCONSISTENCY: Egress created, but Balance update failed.", { egressResponse: resEgress, balanceResponse: resBalance });
                }
                alert(errorMessage);
                setIsSubmitting(false);
            }
        } catch (e) { console.error("FEDECELL_POST_ERROR:", e); setIsSubmitting(false); alert("Error de conexión al registrar el egreso."); }
    };

    // --- ACCIÓN: DELETE /egresos/egress/:id ---
    const handleDelete = async (id) => {
        if (!window.confirm("¿CONFIRMAR ELIMINACIÓN TÉCNICA DEL REGISTRO?")) return;
        try {
            const res = await fetch(`${API_URL_EG}/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchEgresses();
        } catch (e) { console.error("FEDECELL_DELETE_ERROR:", e); }
    };

    const dataInRange = useMemo(() => {
        if (!Array.isArray(egressList) || !egressList.length) return [];
        const start = startDate ? new Date(startDate + 'T00:00:00') : null;
        const end = endDate ? new Date(endDate + 'T23:59:59') : null;

        return egressList.filter(item => {
            const field = item.createdAt || item.fecha;
            if (!field) return true; // Keep items without a date
            const itemDate = new Date(field);
            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
        });
    }, [egressList, startDate, endDate]);

    const filtered = dataInRange.filter(e =>
        e.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`w-full space-y-12 pb-20 ${styles.body} animate-in fade-in duration-1000`}>

            {/* DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className={styles.statCard}>
                    <p className={styles.tech}>TOTAL_EGRESOS_MES</p>
                    <h4 className={`${styles.title} text-3xl md:text-4xl mt-4`}>
                        ${stats.total.toLocaleString('es-AR')}
                    </h4>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.tech}>FLUJO_SALIENTE_HOY</p>
                    <h4 className={`${styles.title} text-3xl md:text-4xl mt-4 text-white`}>
                        ${stats.hoy.toLocaleString('es-AR')}
                    </h4>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.tech}>REGISTROS_DB</p>
                    <h4 className={`${styles.title} text-3xl md:text-4xl mt-4`}>
                        {stats.count} <span className="text-xs text-zinc-600 font-medium font-['Inter']">UNIDADES</span>
                    </h4>
                </div>
            </div>

            {/* CONTROLES */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-8 border-b border-white/5 pb-10">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full lg:w-auto">
                    <button onClick={() => setView('list')} className={`flex-1 lg:flex-none px-10 py-4 rounded-xl text-[11px] font-['Inter'] font-black transition-all ${view === 'list' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-500 hover:text-white'}`}>
                        DATA_LISTADO
                    </button>
                    <button onClick={() => setView('form')} className={`flex-1 lg:flex-none px-10 py-4 rounded-xl text-[11px] font-['Inter'] font-black transition-all ${view === 'form' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-500 hover:text-white'}`}>
                        NUEVA EXTRACCIÓN
                    </button>
                </div>
                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    <div className="relative w-full lg:w-[450px]">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-white" />
                        <input
                            type="text" placeholder="BUSCAR_EGRESO..."
                            className={`${styles.input} pl-14 h-16 bg-white/5 uppercase font-['Inter'] text-xs`}
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 h-16 w-full md:w-auto">
                        <CalendarIcon className="w-5 h-5 text-zinc-500 ml-2" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-white bw-body focus:outline-none text-sm w-full md:w-32"
                            title="Fecha de inicio"
                        />
                        <span className="text-zinc-600">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-white bw-body focus:outline-none text-sm w-full md:w-32"
                            title="Fecha de fin"
                        />
                    </div>
                </div>
            </div>

            {/* VISTAS */}
            <div className="min-h-[500px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <ArrowPathIcon className="w-12 h-12 text-white animate-spin opacity-20" />
                        <p className={styles.tech}>CONECTANDO_AL_SERVIDOR...</p>
                    </div>
                ) : view === 'list' ? (
                    <div className={`${styles.glass} overflow-x-auto custom-scrollbar animate-in fade-in slide-in-from-top-4 duration-700`}>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/[0.03]">
                                    <th className={`px-10 py-7 ${styles.tech}`}>MONTO</th>
                                    <th className={`px-10 py-7 ${styles.tech}`}>ORIGEN_FONDO</th>
                                    <th className={`px-10 py-7 ${styles.tech}`}>RESPONSABLE</th>
                                    <th className={`px-10 py-7 ${styles.tech}`}>DETALLE_OPERATIVO</th>
                                    <th className="px-10 py-7 text-right font-['Inter'] text-[10px] font-bold text-zinc-500 tracking-widest uppercase">ELIMINAR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.map((eg) => (
                                    <tr key={eg.id || eg.EgressId} className="hover:bg-white/[0.02] transition-colors group font-['Inter']">
                                        <td className="px-10 py-8 whitespace-nowrap">
                                            <span className="font-['Inter'] text-2xl font-black text-white">
                                                -${(parseFloat(eg.monto) || 0).toLocaleString('es-AR')}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-[10px] font-black py-2 px-3 bg-white/5 border border-white/10 text-zinc-400 rounded-lg font-['Inter'] uppercase">
                                                {medioLabels[eg.medio] || eg.medio}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-sm font-medium text-zinc-300 uppercase">
                                            {eg.responsable || '-'}
                                        </td>
                                        <td className="px-10 py-8 text-sm text-zinc-500 whitespace-nowrap">
                                            {new Date(eg.createdAt || eg.fecha).toLocaleString('es-AR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-10 py-8 text-sm font-bold text-white uppercase tracking-wider max-w-xs truncate">
                                            {eg.detalle}
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => handleDelete(eg.id || eg.EgressId)}
                                                className="p-3 text-zinc-800 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto py-10 animate-in slide-in-from-bottom-8 duration-500 relative">
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl"
                                >
                                    <CheckCircleIcon className="w-24 h-24 text-white" />
                                    <h3 className={`${styles.title} text-2xl mt-4`}>EXTRACCIÓN EXITOSA</h3>
                                    <p className={styles.tech}>REGISTRO_GUARDADO_EN_DB</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className={`${styles.glass} p-6 md:p-20`}>
                            <form className="space-y-12" onSubmit={handleSubmit}>
                                <div className="border-l-4 border-white pl-8">
                                    <h3 className={`${styles.title} text-5xl mb-2`}>EGRESO_PRINCIPAL</h3>
                                    <p className={styles.tech}>SERVICIO_DE_PERSISTENCIA</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className={styles.tech}>MONTO_VALOR_($)</label>
                                        <input type="number" step="0.01" value={monto} required onChange={e => setMonto(e.target.value)} className={`${styles.input} h-20 text-3xl font-['Inter'] font-black`} placeholder="0.00" />
                                    </div>
                                    <div className="space-y-4 relative">
                                        <label className={styles.tech}>RESPONSABLE_DEL_GASTO</label>
                                        <input
                                            type="text"
                                            value={responsable}
                                            required
                                            onChange={e => setResponsable(e.target.value)}
                                            onFocus={() => setIsSuggestionsVisible(true)}
                                            onBlur={() => setTimeout(() => setIsSuggestionsVisible(false), 200)}
                                            className={`${styles.input} h-20 text-lg uppercase`}
                                            placeholder="NOMBRE A QUIEN CORRESPONDE"
                                            autoComplete="off"
                                        />
                                        <AnimatePresence>
                                            {isSuggestionsVisible && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -5 }}
                                                    className="absolute z-50 w-full mt-1 bg-[#0A0A0A] border border-white/10 shadow-xl rounded-xl max-h-48 overflow-y-auto custom-scrollbar"
                                                >
                                                    {responsablesList
                                                        .filter(r => !responsable || r.toLowerCase().includes(responsable.toLowerCase()))
                                                        .map((name, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onMouseDown={() => {
                                                                    setResponsable(name);
                                                                    setIsSuggestionsVisible(false);
                                                                }}
                                                                className="w-full text-left px-6 py-4 text-sm text-zinc-300 hover:bg-white/10 hover:text-white transition-colors border-b border-white/5 last:border-0 font-['Inter'] uppercase font-bold tracking-wide"
                                                            >
                                                                {name}
                                                            </button>
                                                        ))}
                                                    {responsablesList.filter(r => !responsable || r.toLowerCase().includes(responsable.toLowerCase())).length === 0 && (
                                                        <div className="p-4 text-xs text-zinc-600 text-center uppercase tracking-widest font-['Inter'] font-bold">
                                                            NUEVO REGISTRO
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-4">
                                        <label className={styles.tech}>ORIGEN_DE_FONDOS</label>
                                        <select className={`${styles.input} h-20 bg-zinc-900 font-['Inter'] font-black text-xs tracking-widest uppercase cursor-pointer`} value={medio} onChange={e => setMedio(e.target.value)}>
                                            {/* Renderizado dinámico de las mismas categorías que Balance */}
                                            {Object.keys(medioLabels).map(key => (
                                                <option key={key} value={key}>{medioLabels[key]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className={styles.tech}>DESCRIPCIÓN_DE_OPERACIÓN</label>
                                        <textarea rows="2" className={`${styles.input} h-20 resize-none uppercase text-xs tracking-widest leading-relaxed pt-6`} value={detalle} onChange={e => setDetalle(e.target.value)} required placeholder="JUSTIFICACIÓN TÉCNICA..."></textarea>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting} className={`w-full ${styles.btnBw} h-24 text-sm tracking-[0.5em] disabled:bg-zinc-700 disabled:cursor-not-allowed`}>
                                    {isSubmitting ? 'PROCESANDO...' : 'EJECUTAR_COMMIT_DB'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EgressModule;