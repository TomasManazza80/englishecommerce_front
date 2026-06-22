import React, { useState } from 'react';
import {
    FiPlus,
    FiCheck,
    FiUsers,
    FiTrendingUp,
    FiMap,
    FiMail,
    FiPhone,
    FiCreditCard,
    FiUserCheck,
    FiStar,
    FiX,
    FiActivity
} from 'react-icons/fi';

// --- CONFIGURACIÓN DE ESTILOS BLANCO Y NEGRO (INTER) ---
const STYLES = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] font-medium text-[10px] text-white uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['Inter'] tracking-widest uppercase",
    input: "w-full bg-black border border-zinc-800 rounded-none py-3 px-4 text-sm text-white font-['Inter'] focus:border-white focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-zinc-700",
    glass: "bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl",
    buttonPrimary: "bg-white text-black font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-200 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)]",
    buttonSecondary: "bg-zinc-900 text-white font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-800 transition-all border border-zinc-800",
    tabActive: "text-white border-white bg-white/[0.02] shadow-[inset_0_-2px_0_#ffffff]",
    tabInactive: "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-white/[0.01]"
};

const initialResellerState = {
    nombre: '',
    dniCuit: '',
    telefono: '',
    email: '',
    zonaVenta: '',
    nivel: 'Bronce',
    margenGanancia: '',
    limiteCredito: '',
    direccion: '',
    informacion: '',
    estado: 'Activo'
};

const nivelesRevendedor = ["Bronce", "Plata", "Oro", "Platino", "VIP"];

// --- COMPONENTE: FORMULARIO DE REVENDEDORES ---
const RegistroRevendedorContent = () => {
    const [revendedor, setRevendedor] = useState(initialResellerState);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setRevendedor(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardarRevendedor = (e) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            alert(`SISTEMA: REVENDEDOR "${revendedor.nombre.toUpperCase()}" INDEXADO CORRECTAMENTE.`);
            setRevendedor(initialResellerState);
        }, 1200);
    };

    return (
        <div className={`${STYLES.glass} rounded-none overflow-hidden`}>
            {/* Cabecera Interna */}
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiUserCheck className="text-white" size={18} /> REGISTRO DE NUEVA ENTIDAD COMERCIAL
                </h2>
            </div>

            <div className="p-4 md:p-10">
                <form onSubmit={handleGuardarRevendedor} className="space-y-12">

                    {/* I. Datos Personales */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 01 DATOS PERSONALES DEL SISTEMA
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <label className={STYLES.label}>Nombre Completo Legal</label>
                                <input type="text" name="nombre" value={revendedor.nombre} onChange={handleInputChange} className={STYLES.input} required placeholder="EJ: JUAN PEREZ" />
                            </div>
                            <div>
                                <label className={STYLES.label}>Identificación DNI/CUIT</label>
                                <input type="text" name="dniCuit" value={revendedor.dniCuit} onChange={handleInputChange} className={`${STYLES.input} ${STYLES.tech}`} placeholder="00-00000000-0" />
                            </div>
                            <div>
                                <label className={STYLES.label}>Canal de Contacto Móvil</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="telefono" value={revendedor.telefono} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="+54 9..." />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* II. Perfil Comercial */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white mb-8 flex items-center gap-2`}>
                            <FiTrendingUp size={14} /> 02 MÉTRICAS COMERCIALES Y NIVEL
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <label className={STYLES.label}>Categorización de Nivel</label>
                                <div className="relative">
                                    <FiStar className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={14} />
                                    <select name="nivel" value={revendedor.nivel} onChange={handleInputChange} className={`${STYLES.input} pl-12 appearance-none cursor-pointer`}>
                                        {nivelesRevendedor.map(n => <option key={n} value={n} className="bg-black text-white">{n.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>Margen de Ganancia (%)</label>
                                <input type="number" name="margenGanancia" value={revendedor.margenGanancia} onChange={handleInputChange} className={`${STYLES.input} ${STYLES.tech} text-white`} placeholder="VALOR PORCENTUAL" />
                            </div>
                            <div>
                                <label className={STYLES.label}>Límite de Crédito Asignado ($)</label>
                                <div className="relative">
                                    <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="number" name="limiteCredito" value={revendedor.limiteCredito} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* III. Ubicación */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white mb-8 flex items-center gap-2`}>
                            <FiMap size={14} /> 03 UBICACIÓN GEOGRÁFICA Y CONTACTO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div>
                                <label className={STYLES.label}>Correo Electrónico Sync</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="email" name="email" value={revendedor.email} onChange={handleInputChange} className={`${STYLES.input} pl-12 lowercase`} placeholder="info@ejemplo.com" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>Zona de Venta Asignada</label>
                                <input type="text" name="zonaVenta" value={revendedor.zonaVenta} onChange={handleInputChange} className={STYLES.input} placeholder="EJ: SANTA FE CENTRO" />
                            </div>
                            <div>
                                <label className={STYLES.label}>Dirección Física de Depósito</label>
                                <input type="text" name="direccion" value={revendedor.direccion} onChange={handleInputChange} className={STYLES.input} placeholder="CALLE ALTURA CIUDAD" />
                            </div>
                        </div>
                    </section>

                    {/* Notas */}
                    <div className="pt-4">
                        <label className={STYLES.label}>Notas Técnicas Adicionales del Operador</label>
                        <textarea
                            name="informacion"
                            value={revendedor.informacion}
                            onChange={handleInputChange}
                            rows="4"
                            className={`${STYLES.input} resize-none uppercase text-[11px] leading-relaxed`}
                            placeholder="ESCRIBA OBSERVACIONES RELEVANTES SOBRE EL PERFIL DEL REVENDEDOR..."
                        />
                    </div>

                    {/* Botones Accion */}
                    <div className="flex flex-col md:flex-row justify-end gap-4 pt-10 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setRevendedor(initialResellerState)}
                            className={STYLES.buttonSecondary}
                        >
                            Abortar Registro
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`${STYLES.buttonPrimary} flex items-center justify-center gap-3`}
                        >
                            {loading ? <FiActivity className="animate-spin" /> : <FiCheck size={18} />}
                            {loading ? 'PROCESANDO DATOS...' : 'CONFIRMAR REGISTRO DE REVENDEDOR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ModuloRevendedores = () => {
    const [activeTab, setActiveTab] = useState('registro');

    return (
        <div className="bg-black min-h-screen p-6 md:p-12 text-white font-['Inter'] selection:bg-white selection:text-black animate-in fade-in duration-700">

            {/* Header Fedecell */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className={`${STYLES.title} text-3xl md:text-5xl leading-none`}>GESTIÓN DE <span className="text-white">REVENDEDORES</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-6 tracking-[0.5em]`}>OUTSIDE_SALES_NETWORK // CORE_V1.0</p>
                </div>
                <div className="bg-zinc-900/50 px-6 py-3 border border-white/20 text-[10px] ${STYLES.tech} text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] font-bold">
                    SISTEMA DE VENTAS EXTERNAS ACTIVO
                </div>
            </div>

            {/* Tabs Premium */}
            <div className="flex border-b border-white/5 mb-10 overflow-x-auto custom-scrollbar">
                <button
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('registro')}
                >
                    <FiPlus size={14} /> REGISTRO NUEVO
                </button>
                <button
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('lista')}
                >
                    <FiUsers size={14} /> CARTERA GLOBAL
                </button>
                <button
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'zonas' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('zonas')}
                >
                    <FiMap size={14} /> MAPA DE COBERTURA
                </button>
            </div>

            {/* Contenido Dinámico */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {activeTab === 'registro' && <RegistroRevendedorContent />}
                {activeTab !== 'registro' && (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-800 border border-dashed border-zinc-900">
                        <FiActivity size={60} className="mb-6 opacity-10 text-white" />
                        <p className={`${STYLES.tech} text-[10px] tracking-[0.6em]`}>MÓDULO EN DESARROLLO - SISTEMA PENDIENTE</p>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 2px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
                select { background-image: none; }
            `}</style>
        </div>
    );
};

export default ModuloRevendedores;