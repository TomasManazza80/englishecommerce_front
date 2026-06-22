import React, { useState, useEffect } from 'react';
import {
    FiClock, FiSearch, FiFilter, FiChevronDown, FiChevronUp,
    FiRotateCcw, FiCheckCircle, FiAlertCircle, FiCalendar,
    FiTruck, FiActivity, FiPackage, FiSearch as FiMagnifier
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;




// --- CONFIGURACIÓN DE ESTILOS FEDECELL ---
const STYLES = {
    container: "min-h-screen bg-black text-white p-6 md:p-12 font-['Inter'] selection:bg-[#ff8c00] selection:text-black",
    glassCard: "bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-none p-6 shadow-2xl",
    title: "font-['Montserrat'] font-[900] text-3xl uppercase tracking-tighter mb-8",
    sectionTitle: "font-['Montserrat'] font-[900] text-[10px] uppercase tracking-[0.4em] text-[#ff8c00] flex items-center gap-2",
    techText: "font-['JetBrains_Mono'] text-[11px] text-zinc-500",
    input: "w-full bg-black border border-white/10 rounded-none py-3 px-10 text-white font-['JetBrains_Mono'] text-[10px] tracking-widest focus:border-[#ff8c00] outline-none transition-all placeholder:text-zinc-800",
    badge: "px-3 py-1 text-[9px] font-black uppercase tracking-tighter border",
    orangeShadow: "shadow-[0_0_20px_rgba(255,140,0,0.1)]"
};

const BASE_URL = `${API_URL}/devolucionProductos`;

const HistorialDevoluciones = () => {
    const [datos, setDatos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    // --- 1. SINCRONIZACIÓN INICIAL CON EL CORE ---
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await fetch(`${BASE_URL}/historialDevoluciones`);
                const data = await response.json();
                setDatos(data);
            } catch (error) {
                console.error("FEDECELL_SYSTEM_ERROR: FALLO_FETCH_HISTORIAL");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // --- 2. LÓGICA DE FILTRADO INTELIGENTE (PROVEEDOR + PRODUCTO) ---
    const devolucionesFiltradas = datos.filter(item => {
        const query = busqueda.toLowerCase();
        // Coincidencia por Proveedor/Cliente o ID
        const coincideCabecera =
            item.clientName.toLowerCase().includes(query) ||
            item.DevolucionId.toString().includes(query);

        // Coincidencia profunda por nombre de Producto dentro de los paquetes
        const coincideProducto = item.returnPackages?.some(pkg =>
            pkg.products?.some(prod => prod.name.toLowerCase().includes(query))
        );

        return coincideCabecera || coincideProducto;
    });

    if (loading) return (
        <div className="h-screen bg-black flex items-center justify-center">
            <FiActivity className="text-[#ff8c00] animate-spin" size={30} />
            <span className="ml-4 font-['JetBrains_Mono'] text-[10px] tracking-[0.5em]">CARGANDO HISTORIAL...</span>
        </div>
    );

    return (
        <div className={STYLES.container}>
            {/* HEADER TÉCNICO */}
            <header className="mb-10">
                <h2 className={STYLES.title}>ÍNDICE <span className="text-[#ff8c00]">LOGÍSTICA INVERSA</span></h2>
                <p className={STYLES.techText + " tracking-[0.4em]"}>FEDECELL_LABS // HISTORIAL MAESTRO SINCRONIZADO</p>
            </header>

            {/* SECCIÓN 1: MÉTRICAS EN TIEMPO REAL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[
                    { label: 'Registros Totales', value: datos.length, icon: FiRotateCcw, color: 'text-[#ff8c00]' },
                    { label: 'Entidades Indexadas', value: new Set(datos.map(d => d.clientName)).size, icon: FiTruck, color: 'text-white' },
                    { label: 'Volumen Productos', value: datos.reduce((acc, curr) => acc + (curr.returnPackages?.reduce((a, c) => a + c.products?.length, 0) || 0), 0), icon: FiPackage, color: 'text-zinc-500' },
                ].map((stat, i) => (
                    <div key={i} className={STYLES.glassCard + " flex items-center justify-between group hover:border-[#ff8c00]/30 transition-all cursor-default"}>
                        <div>
                            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black mt-1">{stat.value}</p>
                        </div>
                        <stat.icon className={`${stat.color} opacity-40 group-hover:opacity-100 transition-all`} size={24} />
                    </div>
                ))}
            </div>

            {/* SECCIÓN 2: BUSCADOR MAESTRO */}
            <div className="relative mb-8">
                <FiMagnifier className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                <input
                    type="text"
                    placeholder="BUSCAR POR ID, ENTIDAD O NOMBRE DE PRODUCTO (BÚSQUEDA PROFUNDA)..."
                    className={STYLES.input}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            {/* SECCIÓN 3: TABLA TÉCNICA EXPANDIBLE */}
            <div className={STYLES.glassCard + " !p-0 overflow-hidden"}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/[0.02] text-zinc-600 uppercase text-[9px] font-black tracking-[0.2em] border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4">ID TRANSACCIÓN</th>
                                <th className="px-6 py-4">CLIENTE / PROVEEDOR</th>
                                <th className="px-6 py-4 text-center">LOTES</th>
                                <th className="px-6 py-4">CATEGORÍA / MOTIVO</th>
                                <th className="px-6 py-4 text-right">FECHA INDEXADO</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {devolucionesFiltradas.length > 0 ? (
                                devolucionesFiltradas.map((item) => (
                                    <React.Fragment key={item.DevolucionId}>
                                        <tr
                                            className={`hover:bg-white/[0.01] transition-all cursor-pointer ${expandedId === item.DevolucionId ? 'bg-[#ff8c00]/5' : ''}`}
                                            onClick={() => setExpandedId(expandedId === item.DevolucionId ? null : item.DevolucionId)}
                                        >
                                            <td className="px-6 py-5">
                                                <span className="font-['JetBrains_Mono'] text-[#ff8c00] font-black">#{item.DevolucionId}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="text-xs font-black uppercase tracking-tighter">{item.clientName}</div>
                                                <div className="text-[9px] text-zinc-600">AUTH_FEDECELL_VERIFIED</div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-[10px] bg-zinc-900 px-2 py-1 border border-white/5 text-zinc-400">
                                                    {item.returnPackages?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`${STYLES.badge} border-zinc-800 text-zinc-500`}>
                                                    {item.generalReason}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-right text-[10px] font-bold text-zinc-400">
                                                {item.returnDate}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                {expandedId === item.DevolucionId ? <FiChevronUp className="text-[#ff8c00]" /> : <FiChevronDown className="text-zinc-700" />}
                                            </td>
                                        </tr>

                                        {/* DESGLOSE DE PRODUCTOS (SEARCH_MATCH_DISPLAY) */}
                                        {expandedId === item.DevolucionId && (
                                            <tr>
                                                <td colSpan="6" className="bg-black/60 p-8 animate-in slide-in-from-top-2">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {item.returnPackages?.map(pkg => (
                                                            <div key={pkg.LoteId} className="border border-white/5 p-4 bg-zinc-900/20">
                                                                <p className="text-[9px] font-black text-[#ff8c00] mb-3 border-b border-[#ff8c00]/20 pb-1 uppercase tracking-widest flex items-center gap-2">
                                                                    <FiPackage /> {pkg.packageName}
                                                                </p>
                                                                <div className="space-y-3">
                                                                    {pkg.products?.map(prod => (
                                                                        <div key={prod.ProductoId} className="border-l border-zinc-800 pl-3">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-[10px] font-bold uppercase">{prod.name}</span>
                                                                                <span className="text-[9px] bg-[#ff8c00] text-black px-1 font-black">X{prod.quantity}</span>
                                                                            </div>
                                                                            <p className="text-[9px] text-zinc-600 italic mt-1 leading-tight">"{prod.reason}"</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-zinc-800 font-['JetBrains_Mono'] text-xs tracking-[0.5em] italic uppercase">
                                        Sin coincidencias encontradas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <footer className="mt-6 flex justify-between items-center px-2">
                <span className={STYLES.techText + " text-[9px]"}>SISTEMA DE INDEXACIÓN V2.6 // FEDECELL_LABS</span>
                <span className={STYLES.techText + " text-[9px]"}>MOSTRANDO: {devolucionesFiltradas.length} REGISTROS</span>
            </footer>
        </div>
    );
};

export default HistorialDevoluciones;