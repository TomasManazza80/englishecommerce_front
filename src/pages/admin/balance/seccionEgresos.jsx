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
import Swal from 'sweetalert2';

// --- CONFIGURACIÓN TÉCNICA DE RUTAS ---
const API_URL = import.meta.env.VITE_API_URL;
const API_URL_EG = `${API_URL}/egresos/egress`;
const API_RESPONSABLES = `${API_URL}/egresos/responsables`;
const API_BALANCE_URL = `${API_URL}/balanceMensual/CreaBalanceMensual`;

const styles = {
    title: "font-sans font-bold tracking-tight text-[#191c1e]",
    body: "font-sans font-normal text-[#424754]",
    tech: "font-sans text-[11px] font-semibold uppercase tracking-wider text-[#424754]",
    glass: "bg-white border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden",
    input: "w-full bg-[#f2f4f6] border border-[#c2c6d6] p-3.5 text-[#191c1e] focus:bg-white focus:border-[#0058be] focus:ring-2 focus:ring-[#0058be]/20 outline-none transition-all placeholder-[#727785] text-sm rounded-xl font-medium",
    btnBw: "bg-[#0058be] hover:bg-[#004395] text-white font-semibold py-3.5 px-8 transition-all active:scale-[0.98] uppercase text-xs tracking-wider rounded-xl shadow-sm",
    statCard: "bg-white border border-[#e6e8ea] p-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all group hover:border-[#c2c6d6]"
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

    const [monto, setMonto] = useState('');
    const [detalle, setDetalle] = useState('');
    const [medio, setMedio] = useState('efectivo');
    const [responsable, setResponsable] = useState('');
    const [responsablesList, setResponsablesList] = useState([]);
    const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchEgresses = async () => {
        setLoading(true);
        try {
            const response = await fetch(API_URL_EG);
            const data = await response.json();
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
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDay);
        setEndDate(lastDay);
    }, []);

    const fetchResponsables = async () => {
        try {
            const res = await fetch(API_RESPONSABLES);
            const data = await res.json();
            setResponsablesList(Array.isArray(data) ? data.map(r => r.nombre) : []);
        } catch (e) { console.error("Error fetching responsables:", e); }
    };

    const stats = useMemo(() => {
        const list = Array.isArray(egressList) ? egressList : [];
        const total = list.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
        const hoy = list.filter(e => {
            const f = e.createdAt || e.fecha;
            return f && new Date(f).toDateString() === new Date().toDateString();
        }).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
        return { total, hoy, count: list.length };
    }, [egressList]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
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

            const resBalance = await fetch(API_BALANCE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producto: `EGRESO: ${detalle.toUpperCase()}`,
                    monto: -parseFloat(monto),
                    cantidad: 1,
                    metodo_pago: medio,
                    fecha: new Date().toISOString().split('T')[0]
                })
            });

            if (resEgress.ok && resBalance.ok) {
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
                    fetchResponsables();
                    setView('list');
                    setIsSubmitting(false);
                }, 2000);
            } else {
                let errorMessage = "Error al registrar el egreso. Intente nuevamente.";
                if (resEgress.ok && !resBalance.ok) {
                    errorMessage = "ATENCIÓN: El egreso se guardó, pero falló la actualización del balance. Por favor, revise manualmente para evitar descuadres.";
                }
                Swal.fire({ title: 'ATENCIÓN', text: errorMessage, icon: 'warning', confirmButtonColor: '#0058be' });
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error("FEDECELL_POST_ERROR:", e);
            setIsSubmitting(false);
            Swal.fire({ title: 'ERROR', text: 'Error de conexión al registrar el egreso.', icon: 'error', confirmButtonColor: '#0058be' });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Confirmar eliminación?',
            text: 'Se eliminará el registro de egreso seleccionado',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ba1a1a',
            cancelButtonColor: '#727785'
        });
        if (!result.isConfirmed) return;
        try {
            const response = await fetch(`${API_URL_EG}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchEgresses();
            } else {
                Swal.fire({ title: 'ERROR', text: 'No se pudo eliminar el egreso.', icon: 'error', confirmButtonColor: '#0058be' });
            }
        } catch (error) {
            console.error("FEDECELL_DELETE_ERROR:", error);
            Swal.fire({ title: 'ERROR', text: 'Error de conexión al eliminar el egreso.', icon: 'error', confirmButtonColor: '#0058be' });
        }
    };

    const dataInRange = useMemo(() => {
        const list = Array.isArray(egressList) ? egressList : [];
        if (!startDate && !endDate) return list;

        return list.filter(e => {
            const f = e.createdAt || e.fecha;
            if (!f) return true;
            const date = new Date(f);
            if (startDate && date < new Date(startDate + 'T00:00:00')) return false;
            if (endDate && date > new Date(endDate + 'T23:59:59')) return false;
            return true;
        });
    }, [egressList, startDate, endDate]);

    const filtered = dataInRange.filter(e =>
        e.detalle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.responsable?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`w-full space-y-8 pb-20 ${styles.body} font-sans`}>

            {/* DASHBOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={styles.statCard}>
                    <p className={styles.tech}>TOTAL EGRESOS EN RANGO</p>
                    <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-[#ba1a1a] mt-2">
                        -${stats.total.toLocaleString('es-AR')}
                    </h4>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.tech}>FLUJO SALIENTE HOY</p>
                    <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-[#191c1e] mt-2">
                        -${stats.hoy.toLocaleString('es-AR')}
                    </h4>
                </div>
                <div className={styles.statCard}>
                    <p className={styles.tech}>REGISTROS</p>
                    <h4 className="text-2xl md:text-3xl font-bold tracking-tight text-[#0058be] mt-2">
                        {stats.count} <span className="text-xs text-[#727785] font-semibold">UNIDADES</span>
                    </h4>
                </div>
            </div>

            {/* CONTROLES */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-6 rounded-2xl border border-[#e6e8ea] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <div className="flex bg-[#f2f4f6] p-1.5 rounded-2xl border border-[#e6e8ea] w-full lg:w-auto">
                    <button onClick={() => setView('list')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${view === 'list' ? 'bg-[#0058be] text-white shadow-sm' : 'text-[#424754] hover:text-[#191c1e]'}`}>
                        Listado Egresos
                    </button>
                    <button onClick={() => setView('form')} className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${view === 'form' ? 'bg-[#0058be] text-white shadow-sm' : 'text-[#424754] hover:text-[#191c1e]'}`}>
                        Nuevo Egreso
                    </button>
                </div>
                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-3">
                    <div className="relative w-full lg:w-[350px]">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#727785]" />
                        <input
                            type="text" placeholder="Buscar egreso..."
                            className={`${styles.input} pl-10 text-xs`}
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-[#f2f4f6] border border-[#c2c6d6] rounded-xl p-2 h-11 w-full md:w-auto">
                        <CalendarIcon className="w-4 h-4 text-[#727785] ml-2" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-[#191c1e] focus:outline-none text-xs w-full md:w-28 font-medium"
                            title="Fecha de inicio"
                        />
                        <span className="text-[#727785]">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent text-[#191c1e] focus:outline-none text-xs w-full md:w-28 font-medium"
                            title="Fecha de fin"
                        />
                    </div>
                </div>
            </div>

            {/* VISTAS */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-3">
                        <ArrowPathIcon className="w-8 h-8 text-[#0058be] animate-spin opacity-50" />
                        <p className={styles.tech}>Cargando datos...</p>
                    </div>
                ) : view === 'list' ? (
                    <div className={`${styles.glass} overflow-x-auto custom-scrollbar`}>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#f2f4f6]">
                                    <th className={`px-6 py-4 ${styles.tech}`}>Monto</th>
                                    <th className={`px-6 py-4 ${styles.tech}`}>Origen Fondo</th>
                                    <th className={`px-6 py-4 ${styles.tech}`}>Responsable</th>
                                    <th className={`px-6 py-4 ${styles.tech}`}>Fecha</th>
                                    <th className={`px-6 py-4 ${styles.tech}`}>Detalle</th>
                                    <th className="px-6 py-4 text-right font-semibold text-[11px] text-[#424754] tracking-wider uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e6e8ea]">
                                {filtered.map((eg) => (
                                    <tr key={eg.id || eg.EgressId} className="hover:bg-[#f7f9fb] transition-colors font-sans">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-base font-bold text-[#ba1a1a]">
                                                -${(parseFloat(eg.monto) || 0).toLocaleString('es-AR')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-semibold py-1 px-2.5 bg-[#f2f4f6] border border-[#c2c6d6] text-[#191c1e] rounded-lg uppercase">
                                                {medioLabels[eg.medio] || eg.medio}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-[#191c1e] uppercase">
                                            {eg.responsable || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-[#424754] whitespace-nowrap font-medium">
                                            {new Date(eg.createdAt || eg.fecha).toLocaleString('es-AR', {
                                                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-[#191c1e] max-w-xs truncate">
                                            {eg.detalle}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(eg.id || eg.EgressId)}
                                                className="p-2 text-[#727785] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-xl transition-all"
                                                title="Eliminar egreso"
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
                    <div className="max-w-3xl mx-auto py-6 relative">
                        <AnimatePresence>
                            {showSuccess && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-2xl border border-[#e6e8ea]"
                                >
                                    <CheckCircleIcon className="w-16 h-16 text-[#006947]" />
                                    <h3 className="text-xl font-bold text-[#191c1e] mt-3">Extracción Exitosa</h3>
                                    <p className="text-xs text-[#424754] font-medium">Registro guardado en el sistema</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className={`${styles.glass} p-6 md:p-10`}>
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="border-l-4 border-[#0058be] pl-4">
                                    <h3 className="text-xl font-bold text-[#191c1e]">Cargar Nuevo Egreso</h3>
                                    <p className={styles.tech}>Registro de Salida de Fondos</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={styles.tech}>Monto ARS ($)</label>
                                        <input type="number" step="0.01" value={monto} required onChange={e => setMonto(e.target.value)} className={`${styles.input} text-xl font-bold`} placeholder="0.00" />
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
                                            className={`${styles.input} uppercase`}
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
                                                                onMouseDown={() => {
                                                                    setResponsable(name);
                                                                    setIsSuggestionsVisible(false);
                                                                }}
                                                                className="w-full text-left px-4 py-3 text-xs text-[#191c1e] hover:bg-[#f2f4f6] transition-colors border-b border-[#e6e8ea] last:border-0 font-medium uppercase"
                                                            >
                                                                {name}
                                                            </button>
                                                        ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={styles.tech}>Origen de Fondos</label>
                                        <select className={`${styles.input} cursor-pointer`} value={medio} onChange={e => setMedio(e.target.value)}>
                                            {Object.keys(medioLabels).map(key => (
                                                <option key={key} value={key}>{medioLabels[key]}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={styles.tech}>Descripción del Egreso</label>
                                        <textarea rows="2" className={`${styles.input} resize-none uppercase text-xs`} value={detalle} onChange={e => setDetalle(e.target.value)} required placeholder="Justificación o concepto..."></textarea>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSubmitting} className={`w-full ${styles.btnBw} py-4 disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    {isSubmitting ? 'Procesando...' : 'Registrar Egreso'}
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