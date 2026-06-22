import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiDollarSign, FiCreditCard, FiPlus, FiTrash2, FiSave, FiAlertTriangle,
    FiTruck, FiPercent, FiTrendingUp, FiEdit2, FiX, FiLayers, FiActivity
} from 'react-icons/fi';

// --- CONFIGURACIÓN DE ESTILOS FEDECELL ---
const STYLES = {
    title: "font-['Montserrat'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] font-medium text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['JetBrains_Mono'] tracking-widest uppercase",
    input: "w-full bg-black border border-zinc-800 rounded-none py-3 px-4 text-sm text-white font-['JetBrains_Mono'] focus:border-[#ff8c00] focus:ring-1 focus:ring-[#ff8c00] outline-none transition-all placeholder:text-zinc-700",
    glass: "bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl",
    buttonPrimary: "bg-[#ff8c00] text-black font-['Montserrat'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-white transition-all shadow-[0_10px_30px_rgba(255,140,0,0.2)]",
    buttonSecondary: "bg-zinc-900 text-white font-['Montserrat'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-800 transition-all border border-zinc-800",
};

const ConfiguracionCostos = () => {
    const [errorLocal, setErrorLocal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [aumentosPorTarjeta, setAumentosPorTarjeta] = useState([]);
    const [costosEnvio, setCostosEnvio] = useState({
        santaFeCapital: 0,
        alrededores: 0,
        restoDelPais: 0,
        retiroEnLocal: 0
    });
    const [configGlobal, setConfigGlobal] = useState({
        ivaPorcentaje: 21,
        aumentoGlobalProductos: 0,
        mpFee: 0
    });
    const [nuevoAumento, setNuevoAumento] = useState({ banco: '', cuotas: 1, porcentajeAumento: 0 });
    const [reglaAEditar, setReglaAEditar] = useState(null);

    // Estados para búsqueda y actualización individual
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const API_BASE = import.meta.env.VITE_API_URL;

    // -------------------------------------------------------------------------
    // CARGA DE DATOS DESDE EL SERVIDOR
    // -------------------------------------------------------------------------
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [bankRes, shipRes, globalRes] = await Promise.all([
                    axios.get(`${API_BASE}/gastos/bank-rates`),
                    axios.get(`${API_BASE}/gastos/shipping-rates`),
                    axios.get(`${API_BASE}/gastos/global-configs`)
                ]);

                if (bankRes.data) setAumentosPorTarjeta(bankRes.data);

                if (shipRes.data && shipRes.data.length > 0) {
                    const newShipping = { ...costosEnvio };
                    shipRes.data.forEach(r => {
                        if (newShipping.hasOwnProperty(r.zona)) newShipping[r.zona] = r.costo;
                    });
                    setCostosEnvio(newShipping);
                }

                if (globalRes.data) {
                    const ivaAttr = globalRes.data.find(c => c.key === 'iva');
                    const globalIncAttr = globalRes.data.find(c => c.key === 'global_increase');
                    const mpFeeAttr = globalRes.data.find(c => c.key === 'mp_fee');

                    setConfigGlobal({
                        ivaPorcentaje: parseFloat(ivaAttr?.value || 21),
                        aumentoGlobalProductos: parseFloat(globalIncAttr?.value || 0),
                        mpFee: parseFloat(mpFeeAttr?.value || 0)
                    });
                }
            } catch (err) {
                console.error("FETCH_ERROR:", err);
                setErrorLocal("ERROR_DE_SINCRONIZACIÓN: NO SE PUDO CONECTAR CON EL SERVIDOR");
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // -------------------------------------------------------------------------
    // HANDLERS BÚSQUEDA Y ACTUALIZACIÓN INDIVIDUAL
    // -------------------------------------------------------------------------
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await axios.get(`${API_BASE}/products?search=${searchQuery}`);
            setSearchResults(res.data || []);
            setSelectedProduct(null);
        } catch (err) {
            setErrorLocal("ERROR_EN_BÚSQUEDA_PROD");
        } finally {
            setIsSearching(false);
        }
    };

    const handleUpdateVariantPrice = async (prodId, variantIdx, field, value) => {
        const product = searchResults.find(p => p.id === prodId);
        if (!product) return;

        const updatedVariantes = [...product.variantes];
        updatedVariantes[variantIdx] = { ...updatedVariantes[variantIdx], [field]: parseFloat(value) || 0 };

        try {
            await axios.put(`${API_BASE}/products/${prodId}`, {
                ...product,
                variantes: updatedVariantes
            });
            // Actualizar estado local de búsqueda
            setSearchResults(prev => prev.map(p => p.id === prodId ? { ...p, variantes: updatedVariantes } : p));
        } catch (err) {
            setErrorLocal("ERROR_AL_ACTUALIZAR_VARIANTE");
        }
    };

    // -------------------------------------------------------------------------
    // HANDLERS (Sin cambios funcionales, ahora con persistencia)
    // -------------------------------------------------------------------------
    const handleAumentoChange = (e) => {
        const { name, value } = e.target;
        setNuevoAumento(prev => ({
            ...prev,
            [name]: name === 'cuotas' || name === 'porcentajeAumento' ? parseFloat(value) : value.toUpperCase(),
        }));
    };

    const handleAddAumento = (e) => {
        e.preventDefault();
        setErrorLocal(null);
        if (!nuevoAumento.banco.trim() || nuevoAumento.cuotas <= 0 || nuevoAumento.porcentajeAumento < 0) {
            setErrorLocal('ERROR_LOG: CAMPOS_INVÁLIDOS_EN_RECARGO_TARJETA');
            return;
        }
        setAumentosPorTarjeta(prev => [...prev, { ...nuevoAumento, id: Date.now() }]);
        setNuevoAumento({ banco: '', cuotas: 1, porcentajeAumento: 0 });
    };

    const handleDeleteAumento = async (id) => {
        if (reglaAEditar && reglaAEditar.id === id) {
            setErrorLocal('SISTEMA_BUSY: FINALICE_EDICIÓN_PARA_ELIMINAR');
            return;
        }
        try {
            await axios.delete(`${API_BASE}/gastos/bank-rates/${id}`);
            setAumentosPorTarjeta(prev => prev.filter(a => a.id !== id));
            setErrorLocal(null);
        } catch (err) {
            setErrorLocal("ERROR_AL_ELIMINAR_REGLA");
        }
    };

    const handleEditStart = (regla) => {
        setReglaAEditar({ ...regla });
        setErrorLocal(null);
    };

    const handleEditReglaChange = (e) => {
        const { name, value } = e.target;
        setReglaAEditar(prev => ({
            ...prev,
            [name]: name === 'cuotas' || name === 'porcentajeAumento' ? parseFloat(value) : value.toUpperCase(),
        }));
    };

    const handleEditSave = (e) => {
        e.preventDefault();
        setErrorLocal(null);
        if (!reglaAEditar.banco.trim() || reglaAEditar.cuotas <= 0 || reglaAEditar.porcentajeAumento < 0) {
            setErrorLocal('ERROR_LOG: ACTUALIZACIÓN_FALLIDA_VALORES_NULOS');
            return;
        }
        setAumentosPorTarjeta(prev => prev.map(regla => regla.id === reglaAEditar.id ? reglaAEditar : regla));
        setReglaAEditar(null);
    };

    const handleSaveConfig = async () => {
        if (configGlobal.ivaPorcentaje < 0 || configGlobal.ivaPorcentaje > 100) {
            setErrorLocal('IVA_OUT_OF_RANGE: DEBE_ESTAR_ENTRE_0_Y_100');
            return;
        }
        if (reglaAEditar) {
            setErrorLocal('SAVE_LOCKED: EDICIÓN_EN_CURSO');
            return;
        }

        setLoading(true);
        setErrorLocal(null);

        try {
            // Guardar Configs Globales
            await axios.post(`${API_BASE}/gastos/global-configs`, {
                configs: [
                    { key: 'iva', value: configGlobal.ivaPorcentaje, description: 'Porcentaje de IVA global' },
                    { key: 'global_increase', value: configGlobal.aumentoGlobalProductos, description: 'Aumento global de precios' },
                    { key: 'mp_fee', value: configGlobal.mpFee, description: 'Comisión de Mercado Pago' }
                ]
            });

            // Guardar Costos de Envío
            const shippingPromises = Object.entries(costosEnvio).map(([zona, costo]) =>
                axios.post(`${API_BASE}/gastos/shipping-rates`, { zona, costo })
            );

            // Guardar Reglas de Banco (las nuevas que no tienen ID o refrescar todas si fuera necesario)
            // Aquí matenemos que el backend crea una por una en addAumento
            const bankPromises = aumentosPorTarjeta.filter(a => !a.createdAt).map(a =>
                axios.post(`${API_BASE}/gastos/bank-rates`, a)
            );

            await Promise.all([...shippingPromises, ...bankPromises]);

            alert('SINC_EXITOSA: TODOS LOS PARÁMETROS HAN SIDO ACTUALIZADOS EN LA NUBE');
        } catch (err) {
            console.error(err);
            setErrorLocal("ERROR_CRÍTICO: FALLO AL GUARDAR CONFIGURACIÓN EN EL SERVIDOR");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black min-h-screen p-8 md:p-12 text-white font-['Inter'] selection:bg-[#ff8c00] selection:text-black">

            {/* Header Fedecell */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 border-b border-white/5 pb-10">
                <div>
                    <h1 className={`${STYLES.title} text-5xl leading-none`}>CONFIGURACIÓN DE COSTOS <span className="text-[#ff8c00]">CORE</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-6 tracking-[0.5em]`}>MOTOR DE LOGÍSTICA FINANCIERA // FEDECELL LABS</p>
                </div>
                <div className="bg-zinc-900/50 px-6 py-3 border border-[#ff8c00]/20 text-[10px] ${STYLES.tech} text-[#ff8c00] shadow-[0_0_20px_rgba(255,140,0,0.05)] uppercase font-black">
                    Estado: Listo para actualizar
                </div>
            </header>

            {errorLocal && (
                <div className="p-5 mb-8 bg-red-600/10 border border-red-600 text-red-500 font-['JetBrains_Mono'] text-[11px] flex items-center gap-4">
                    <FiAlertTriangle size={18} /> {errorLocal}
                </div>
            )}

            <div className="space-y-12 pb-24">

                {/* 1. SECCIÓN: CONFIGURACIÓN FISCAL Y AUMENTO GLOBAL */}
                <div className={`${STYLES.glass} p-10`}>
                    <h2 className={`${STYLES.title} text-sm text-[#ff8c00] mb-10 flex items-center gap-4`}>
                        <FiPercent size={20} /> 01 PARÁMETROS FISCALES Y ALGORITMO GLOBAL
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div>
                            <label className={STYLES.label}>Tasa de IVA Vigente (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="ivaPorcentaje"
                                    value={configGlobal.ivaPorcentaje}
                                    onChange={(e) => setConfigGlobal(prev => ({ ...prev, ivaPorcentaje: parseFloat(e.target.value) || 0 }))}
                                    className={`${STYLES.input} !text-2xl text-white`}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black">%</span>
                            </div>
                        </div>

                        <div>
                            <label className={STYLES.label}>Comisión de Mercado Pago (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="mpFee"
                                    value={configGlobal.mpFee}
                                    onChange={(e) => setConfigGlobal(prev => ({ ...prev, mpFee: parseFloat(e.target.value) || 0 }))}
                                    className={`${STYLES.input} !text-2xl text-[#009EE3]`}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black">%</span>
                            </div>
                            <p className={`${STYLES.tech} text-[9px] text-zinc-500 mt-4 uppercase tracking-widest`}>GESTIÓN PLATAFORMA DE PAGOS</p>
                        </div>

                        <div>
                            <label className={STYLES.label}>Aumento de Precios Base Global (%)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="aumentoGlobalProductos"
                                    value={configGlobal.aumentoGlobalProductos}
                                    onChange={(e) => setConfigGlobal(prev => ({ ...prev, aumentoGlobalProductos: parseFloat(e.target.value) || 0 }))}
                                    className={`${STYLES.input} !text-2xl text-[#ff8c00]`}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black">%</span>
                            </div>
                            <p className={`${STYLES.tech} text-[9px] text-red-500 mt-4 flex items-center gap-2 font-bold`}>
                                <FiAlertTriangle size={12} /> CRÍTICO: AFECTARÁ A TODOS LOS PRODUCTOS DEL INVENTARIO.
                            </p>
                        </div>
                    </div>
                </div>

                {/* NUEVA SECCIÓN: BÚSQUEDA Y ACTUALIZACIÓN POR PRODUCTO */}
                <div className={`${STYLES.glass} p-10`}>
                    <h2 className={`${STYLES.title} text-sm text-[#ff8c00] mb-10 flex items-center gap-4`}>
                        <FiSearch size={20} /> 02 BUSCADOR Y ACTUALIZACIÓN INDIVIDUAL
                    </h2>

                    <div className="flex gap-4 mb-10">
                        <input
                            type="text"
                            placeholder="BUSCAR PRODUCTO POR NOMBRE O MARCA..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className={STYLES.input}
                        />
                        <button onClick={handleSearch} disabled={isSearching} className={`${STYLES.buttonSecondary} py-2 !text-[11px]`}>
                            {isSearching ? 'BUSCANDO...' : 'EJECUTAR BÚSQUEDA'}
                        </button>
                    </div>

                    <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                        {searchResults.map(prod => (
                            <div key={prod.id} className="bg-white/5 border border-zinc-900 p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-['Montserrat'] font-black text-white text-lg uppercase tracking-tighter">{prod.nombre}</h3>
                                        <p className="text-[10px] text-zinc-500 font-mono uppercase mt-1">{prod.marca} // SKU_{prod.id}</p>
                                    </div>
                                    <div className="bg-[#ff8c00]/10 text-[#ff8c00] px-4 py-1 text-[9px] font-black uppercase border border-[#ff8c00]/20">
                                        {prod.variantes?.length || 1} VARIANTES DETECTADAS
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {prod.variantes?.map((variant, vIdx) => (
                                        <div key={vIdx} className="bg-black/40 p-4 border border-zinc-800">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: variant.color }}></div>
                                                <span className="text-[10px] font-bold text-white uppercase">{variant.color} - {variant.almacenamiento}</span>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-[8px] text-zinc-600 block mb-1 uppercase">PVP PÚBLICO</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            value={variant.precioAlPublico}
                                                            onChange={(e) => handleUpdateVariantPrice(prod.id, vIdx, 'precioAlPublico', e.target.value)}
                                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-sm p-2 pl-6 text-white outline-none focus:border-[#ff8c00]"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-[8px] text-zinc-600 block mb-1 uppercase">MAYORISTA</label>
                                                        <input
                                                            type="number"
                                                            value={variant.precioMayorista}
                                                            onChange={(e) => handleUpdateVariantPrice(prod.id, vIdx, 'precioMayorista', e.target.value)}
                                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-[11px] p-2 text-white outline-none focus:border-[#ff8c00]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] text-zinc-600 block mb-1 uppercase">REVENDEDOR</label>
                                                        <input
                                                            type="number"
                                                            value={variant.precioRevendedor}
                                                            onChange={(e) => handleUpdateVariantPrice(prod.id, vIdx, 'precioRevendedor', e.target.value)}
                                                            className="w-full bg-zinc-900/50 border border-zinc-800 text-[11px] p-2 text-white outline-none focus:border-[#ff8c00]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. SECCIÓN: COSTOS DE ENVÍO */}
                <div className={`${STYLES.glass} p-10`}>
                    <h2 className={`${STYLES.title} text-sm text-[#ff8c00] mb-10 flex items-center gap-4`}>
                        <FiTruck size={20} /> 03 VALORES DE LOGÍSTICA ZONAL Y NACIONAL
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(costosEnvio).map(([key, value]) => (
                            <div key={key} className="bg-black border border-zinc-900 p-6">
                                <label className={STYLES.label}>{key.replace(/([A-Z])/g, '_$1')}</label>
                                <div className="relative">
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-700 font-bold">$</span>
                                    <input
                                        type="number"
                                        name={key}
                                        value={value}
                                        onChange={(e) => setCostosEnvio(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) || 0 }))}
                                        className="w-full bg-transparent border-none text-xl font-['JetBrains_Mono'] text-white focus:ring-0 pl-6"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. SECCIÓN: RECARGOS POR TARJETA */}
                <div className={`${STYLES.glass} p-10`}>
                    <h2 className={`${STYLES.title} text-sm text-[#ff8c00] mb-10 flex items-center gap-4`}>
                        <FiCreditCard size={20} /> 03 RECARGOS BANCARIOS Y CUOTAS
                    </h2>

                    <form onSubmit={handleAddAumento} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-zinc-900/50 p-6 border border-zinc-800 mb-10">
                        <input
                            type="text"
                            name="banco"
                            value={nuevoAumento.banco}
                            onChange={handleAumentoChange}
                            placeholder="ENTIDAD_BANCARIA"
                            className={STYLES.input}
                        />
                        <input
                            type="number"
                            name="cuotas"
                            value={nuevoAumento.cuotas}
                            onChange={handleAumentoChange}
                            placeholder="CANT. CUOTAS"
                            className={STYLES.input}
                        />
                        <div className="relative">
                            <input
                                type="number"
                                name="porcentajeAumento"
                                value={nuevoAumento.porcentajeAumento}
                                onChange={handleAumentoChange}
                                placeholder="AUMENTO %"
                                className={STYLES.input}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 font-bold">%</span>
                        </div>
                        <button type="submit" disabled={!!reglaAEditar} className={`${STYLES.buttonPrimary} py-2 !text-[10px] flex items-center justify-center gap-2 disabled:opacity-20`}>
                            <FiPlus /> AÑADIR REGLA
                        </button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className={`${STYLES.tech} text-[10px] text-zinc-600 border-b border-zinc-900`}>
                                <tr>
                                    <th className="p-4">ENTIDAD</th>
                                    <th className="p-4">CUOTAS</th>
                                    <th className="p-4">INTERÉS %</th>
                                    <th className="p-4 text-right">OPERACIÓN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {aumentosPorTarjeta.map(regla => {
                                    const isEditing = reglaAEditar && reglaAEditar.id === regla.id;
                                    return (
                                        <tr key={regla.id} className={`transition-colors ${isEditing ? 'bg-[#ff8c00]/5' : 'hover:bg-white/[0.01]'}`}>
                                            {isEditing ? (
                                                <>
                                                    <td className="p-4"><input type="text" name="banco" value={reglaAEditar.banco} onChange={handleEditReglaChange} className={`${STYLES.input} py-1 text-xs`} /></td>
                                                    <td className="p-4"><input type="number" name="cuotas" value={reglaAEditar.cuotas} onChange={handleEditReglaChange} className={`${STYLES.input} py-1 text-xs`} /></td>
                                                    <td className="p-4"><input type="number" name="porcentajeAumento" value={reglaAEditar.porcentajeAumento} onChange={handleEditReglaChange} className={`${STYLES.input} py-1 text-xs`} /></td>
                                                    <td className="p-4 text-right flex justify-end gap-3 mt-1">
                                                        <button onClick={handleEditSave} className="text-green-500 hover:text-white transition-colors"><FiSave size={18} /></button>
                                                        <button onClick={() => setReglaAEditar(null)} className="text-zinc-500 hover:text-white transition-colors"><FiX size={18} /></button>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className={`${STYLES.tech} p-4 text-white font-bold`}>{regla.banco}</td>
                                                    <td className="p-4 text-zinc-400 font-['JetBrains_Mono']">{regla.cuotas} CUOTAS</td>
                                                    <td className="p-4 text-[#ff8c00] font-black font-['JetBrains_Mono']">{regla.porcentajeAumento.toFixed(1)}%</td>
                                                    <td className="p-4 text-right flex justify-end gap-4">
                                                        <button onClick={() => handleEditStart(regla)} disabled={!!reglaAEditar} className="text-zinc-600 hover:text-white transition-colors"><FiEdit2 size={16} /></button>
                                                        <button onClick={() => handleDeleteAumento(regla.id)} disabled={!!reglaAEditar} className="text-zinc-600 hover:text-red-500 transition-colors"><FiTrash2 size={16} /></button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Footer Fijo FEDECELL */}
            <div className="fixed bottom-0 left-0 right-0 p-8 bg-black/80 backdrop-blur-md border-t border-white/5 z-50">
                <button
                    onClick={handleSaveConfig}
                    disabled={!!reglaAEditar}
                    className={`${STYLES.buttonPrimary} w-full flex items-center justify-center gap-4 py-5 text-sm`}
                >
                    <FiSave size={20} />
                    {reglaAEditar ? 'BLOQUEADO: FINALICE EDICIÓN' : 'SINCRONIZAR CONFIGURACIÓN GLOBAL'}
                </button>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ff8c00; }
                input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
            `}</style>
        </div>
    );
};

export default ConfiguracionCostos;