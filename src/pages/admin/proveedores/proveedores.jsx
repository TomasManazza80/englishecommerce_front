import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiPlus, FiCheck, FiUserPlus, FiTruck, FiList,
    FiPhone, FiMapPin, FiActivity, FiGlobe, FiBriefcase, FiCreditCard, FiTrash2
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
    console.error("ALERTA DE CONFIGURACIÓN: La variable de entorno VITE_API_URL no está definida. Las llamadas a la API fallarán. Asegúrate de que tu archivo .env contenga, por ejemplo: VITE_API_URL=http://localhost:4000");
}

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

const initialProviderState = {
    nombre: '',
    telefono: '',
    dni: '', // Used as Identifier/CUIT/RUT
    direccion: ''
};

// --- COMPONENTE: FORMULARIO DE PROVEEDORES ---
const RegistroProveedorContent = ({ fetchProviders }) => {
    const [proveedor, setProveedor] = useState(initialProviderState);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProveedor(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardarProveedor = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = `${API_URL}/providers`;
            await axios.post(url, proveedor);
            alert(`SISTEMA: PROVEEDOR "${proveedor.nombre.toUpperCase()}" INDEXADO CON ÉXITO.`);
            setProveedor(initialProviderState);
            if (fetchProviders) fetchProviders();
        } catch (error) {
            console.error("Error al registrar proveedor:", error);
            let errorMessage = "ERROR AL REGISTRAR PROVEEDOR";
            if (error.response) {
                // El servidor respondió con un código de estado fuera del rango 2xx
                errorMessage = `Error ${error.response.status}: ${error.response.data?.message || 'Error del servidor'}. Revisa la URL de la API: ${error.config.url}`;
                console.error("Respuesta del error:", error.response.data);
            } else if (error.request) {
                // La petición se hizo pero no se recibió respuesta
                errorMessage = "No se pudo conectar con el servidor. ¿Está el backend en funcionamiento?";
            }
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${STYLES.glass} rounded-none overflow-hidden`}>
            {/* Cabecera Interna */}
            <div className="px-6 md:px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiUserPlus className="text-white" size={18} /> REGISTRO DE NUEVA ENTIDAD PROVEEDORA
                </h2>
            </div>

            <div className="p-6 md:p-10">
                <form onSubmit={handleGuardarProveedor} className="space-y-8 md:space-y-12">

                    {/* I. Datos de la Empresa */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 01 IDENTIFICACIÓN FISCAL Y COMERCIAL
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={STYLES.label}>Nombre del Proveedor</label>
                                <input type="text" name="nombre" value={proveedor.nombre} onChange={handleInputChange} className={STYLES.input} required placeholder="EJ: TECH DISTRIBUIDORA" />
                            </div>
                            <div>
                                <label className={STYLES.label}>ID FISCAL (DNI / CUIT)</label>
                                <div className="relative">
                                    <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="dni" value={proveedor.dni} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} placeholder="00-00000000-0" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* II. Contacto y Comunicación */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 02 CANALES DE CONTACTO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={STYLES.label}>Teléfono de Contacto</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="telefono" value={proveedor.telefono} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="+54 9..." />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>Dirección Física</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="direccion" value={proveedor.direccion} onChange={handleInputChange} className={`${STYLES.input} pl-12`} placeholder="CALLE 123" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Botones */}
                    <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pt-8 md:pt-10 border-t border-white/5">
                        <button
                            type="button"
                            onClick={() => setProveedor(initialProviderState)}
                            className={`${STYLES.buttonSecondary} w-full md:w-auto`}
                        >
                            Limpiar Formulario
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`${STYLES.buttonPrimary} flex items-center justify-center gap-3 w-full md:w-auto`}
                        >
                            {loading ? <FiActivity className="animate-spin" /> : <FiCheck size={18} />}
                            {loading ? 'INDEXANDO...' : 'GUARDAR_PROVEEDOR'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE: LISTA DE PROVEEDORES ---
const ListaProveedores = ({ proveedores, fetchProviders }) => {

    const handleDelete = async (id, nombre) => {
        const confirmar = window.confirm(`¿CONFIRMAS LA ELIMINACIÓN DEL REGISTRO "${nombre}"? ESTA ACCIÓN ES IRREVERSIBLE.`);
        if (!confirmar) return;

        try {
            await axios.delete(`${API_URL}/providers/${id}`);
            alert(`SISTEMA: PROVEEDOR #${id} ELIMINADO CORRECTAMENTE.`);
            if (fetchProviders) fetchProviders();
        } catch (error) {
            console.error("Error al eliminar proveedor:", error);
            alert("ERROR CRÍTICO: NO SE PUDO ELIMINAR EL REGISTRO. VERIFIQUE CONEXIÓN O DEPENDENCIAS.");
        }
    };

    return (
        <div className={`${STYLES.glass} rounded-none overflow-hidden p-4 md:p-8`}>
            <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiList className="text-white" size={18} /> REGISTRO HISTÓRICO DE PROVEEDORES
                </h2>
            </div>

            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>ID</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>NOMBRE</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>ID_FISCAL</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>TELÉFONO</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>DIRECCIÓN</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2 text-right`}>ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {proveedores.length > 0 ? (
                            proveedores.map((p) => (
                                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="py-4 px-2 text-white/50 text-xs font-['Inter']">#{p.id}</td>
                                    <td className="py-4 px-2 text-white font-bold text-sm tracking-wide">{p.nombre}</td>
                                    <td className="py-4 px-2 text-zinc-400 text-xs font-['Inter']">{p.dni || '-'}</td>
                                    <td className="py-4 px-2 text-white text-xs font-['Inter']">{p.telefono || '-'}</td>
                                    <td className="py-4 px-2 text-zinc-400 text-xs">{p.direccion || '-'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <button
                                            onClick={() => handleDelete(p.id, p.nombre)}
                                            className="text-zinc-600 hover:text-white bg-black border border-transparent hover:border-white/30 p-2 transition-all opacity-50 group-hover:opacity-100"
                                            title="ELIMINAR REGISTRO"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-zinc-600 text-xs tracking-widest font-['Inter']">
                                    // NO HAY DATOS REGISTRADOS
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* VISTA MÓVIL (CARDS) */}
            <div className="md:hidden space-y-4">
                {proveedores.length > 0 ? (
                    proveedores.map((p) => (
                        <div key={p.id} className="bg-white/5 border border-white/5 p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-bold text-sm tracking-wide">{p.nombre}</h3>
                                    <p className={`${STYLES.tech} text-[10px] text-zinc-500 mt-1`}>ID #{p.id}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`${STYLES.tech} text-[10px] text-zinc-400 bg-white/10 px-2 py-1`}>{p.dni || 'S/ID'}</span>
                                    <button
                                        onClick={() => handleDelete(p.id, p.nombre)}
                                        className="text-zinc-500 hover:text-white p-1 transition-colors"
                                        title="ELIMINAR REGISTRO"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <span className={`${STYLES.tech} text-[9px] text-zinc-600 block mb-1`}>TELÉFONO</span>
                                    <span className="text-white text-xs font-['Inter']">{p.telefono || '-'}</span>
                                </div>
                                <div>
                                    <span className={`${STYLES.tech} text-[9px] text-zinc-600 block mb-1`}>DIRECCIÓN</span>
                                    <span className="text-zinc-300 text-xs truncate block">{p.direccion || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center text-zinc-600 text-xs tracking-widest font-['Inter']">
                        // NO HAY DATOS REGISTRADOS
                    </div>
                )}
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ModuloProveedores = () => {
    const [activeTab, setActiveTab] = useState('registro');
    const [proveedores, setProveedores] = useState([]);
    const [loadingList, setLoadingList] = useState(false);

    const fetchProviders = async () => {
        setLoadingList(true);
        try {
            const url = `${API_URL}/providers`;
            const res = await axios.get(url);
            setProveedores(res.data);
        } catch (error) {
            console.error("Error al obtener proveedores:", error);
            alert("No se pudo cargar la lista de proveedores. Revisa la consola para más detalles y verifica que el backend esté funcionando.");
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'lista') {
            fetchProviders();
        }
    }, [activeTab]);

    return (
        <div className="bg-black min-h-screen p-4 md:p-12 text-white font-['Inter'] selection:bg-white selection:text-black">

            {/* Header Fedecell */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 md:mb-12 gap-6">
                <div>
                    <h1 className={`${STYLES.title} text-3xl md:text-5xl leading-none`}>MÓDULO DE <span className="text-white">PROVEEDORES</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-6 tracking-[0.5em]`}>GESTIÓN DE SUMINISTROS // CORE V1.0</p>
                </div>
                <div className="bg-zinc-900/50 px-6 py-3 border border-white/20 text-[10px] ${STYLES.tech} text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] uppercase font-black">
                    Ecosistema de Suministros Activo
                </div>
            </div>

            {/* Tabs Premium */}
            <div className="flex border-b border-white/5 mb-8 md:mb-10 overflow-x-auto custom-scrollbar pb-1">
                <button
                    className={`px-6 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 whitespace-nowrap ${activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('registro')}
                >
                    <FiPlus size={14} /> REGISTRAR PROVEEDOR
                </button>
                <button
                    className={`px-6 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 whitespace-nowrap ${activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('lista')}
                >
                    <FiList size={14} /> LISTA DE REGISTROS
                </button>
                <button
                    className={`px-6 md:px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 whitespace-nowrap ${activeTab === 'logistica' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('logistica')}
                >
                    <FiTruck size={14} /> LOGÍSTICA / ENTREGAS
                </button>
            </div>

            {/* Contenido Dinámico */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {activeTab === 'registro' && <RegistroProveedorContent fetchProviders={fetchProviders} />}
                {activeTab === 'lista' && (
                    loadingList ? <p className="text-white font-['Inter'] text-xs animate-pulse">CARGANDO DATOS...</p> : <ListaProveedores proveedores={proveedores} fetchProviders={fetchProviders} />
                )}
                {activeTab === 'logistica' && (
                    <div className="flex flex-col items-center justify-center py-32 text-zinc-800 border border-dashed border-zinc-900">
                        <FiBriefcase size={60} className="mb-6 opacity-10 text-white" />
                        <p className={`${STYLES.tech} text-[10px] tracking-[0.6em]`}>MÓDULO DE {activeTab.toUpperCase()} EN DESARROLLO</p>
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

export default ModuloProveedores;