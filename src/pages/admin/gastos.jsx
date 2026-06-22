import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiTruck, FiCreditCard, FiTrendingUp, FiSave, FiPlus, FiTrash2,
    FiAlertTriangle, FiSearch, FiCheck, FiDollarSign, FiPercent, FiActivity
} from 'react-icons/fi';
import Swal from 'sweetalert2';

// --- CONFIGURACIÓN DE ESTILOS BLANCO Y NEGRO (INTER) ---
const STYLES = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] font-medium text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['Inter'] tracking-widest uppercase",
    input: "w-full bg-black border border-zinc-800 rounded-none py-3 px-4 text-sm text-white font-['Inter'] focus:border-white focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-zinc-700",
    glass: "bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl",
    buttonPrimary: "bg-white text-black font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.05)]",
    buttonSecondary: "bg-zinc-900 text-white font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-800 transition-all border border-zinc-800",
    tabActive: "bg-white text-black border-white",
    tabInactive: "bg-transparent text-zinc-500 border-transparent hover:text-white hover:border-zinc-700",
};

const Gastos = () => {
    const [activeTab, setActiveTab] = useState('envio'); // envio, bancos, aumentos, ecommerce
    const [shippingRates, setShippingRates] = useState([]);
    const [bankRates, setBankRates] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [mpFee, setMpFee] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form States
    const [newBankRate, setNewBankRate] = useState({ banco: '', cuotas: '', porcentajeInteres: '' });

    // Cost Increase State
    const [increaseConfig, setIncreaseConfig] = useState({
        searchField: 'all', // 'all', 'nombre', 'categoria'
        searchQuery: '',
        targetPrice: 'public', // 'public', 'reseller', 'wholesale'
        increaseType: 'percentage', // 'percentage' or 'fixed'
        value: 0
    });

    const [selectedForIncrease, setSelectedForIncrease] = useState([]);
    const [previewProducts, setPreviewProducts] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);
    // Estado para búsqueda individual en Ecommerce
    const [ecommerceSearch, setEcommerceSearch] = useState('');

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchShippingRates();
        fetchBankRates();
        fetchGlobalConfigs();
        fetchAllProducts();
    }, []);

    // --- REAL-TIME PREVIEW LOGIC ---
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPreview();
        }, 300); // Reduced delay for faster feedback
        return () => clearTimeout(timer);
    }, [increaseConfig.searchQuery, increaseConfig.searchField]);

    const fetchAllProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products`);
            setAllProducts(res.data || []);
        } catch (error) {
            console.error("Error fetching all products", error);
        }
    };

    const fetchPreview = () => {
        if (!increaseConfig.searchQuery) {
            setPreviewProducts([]);
            return;
        }

        setLoadingPreview(true);
        const query = (increaseConfig.searchQuery || "").toLowerCase();
        const field = increaseConfig.searchField;

        const filtered = allProducts.filter(p => {
            const nombre = (p.nombre || "").toLowerCase();
            const marca = (p.marca || "").toLowerCase();
            const categoria = (p.categoria || "").toLowerCase();

            if (field === 'nombre') return nombre.includes(query);
            if (field === 'categoria') return categoria.includes(query);
            return nombre.includes(query) || marca.includes(query) || categoria.includes(query);
        });

        setPreviewProducts(filtered.slice(0, 50));
        setLoadingPreview(false);
    };

    const handleToggleSelectProduct = (productId) => {
        setSelectedForIncrease(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };


    // --- FETCH DATA ---
    const fetchShippingRates = async () => {
        try {
            const res = await axios.get(`${API_URL}/gastos/shipping-rates`);
            // Ensure we have the 4 zones even if empty
            const defaultZones = ['local', 'alrededores', 'provincia', 'nacional'];
            const merged = defaultZones.map(z => {
                const found = res.data.find(r => r.zona === z);
                return found || { zona: z, costo: 0 };
            });
            setShippingRates(merged);
        } catch (error) {
            console.error("Error fetching shipping rates", error);
        }
    };

    const fetchBankRates = async () => {
        try {
            const res = await axios.get(`${API_URL}/gastos/bank-rates`);
            setBankRates(res.data);
        } catch (error) {
            console.error("Error fetching bank rates", error);
        }
    };

    const fetchGlobalConfigs = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/gastos/global-configs`);
            const fee = data.find(c => c.key === 'mp_fee');
            if (fee) setMpFee(parseFloat(fee.value));
        } catch (error) {
            console.error("Error fetching global configs detail:", error.response?.data || error.message);
        }
    };

    // --- HANDLERS ---

    // Shipping
    const handleShippingChange = (zona, value) => {
        const newRates = shippingRates.map(r => r.zona === zona ? { ...r, costo: value } : r);
        setShippingRates(newRates);
    };

    const saveShippingRate = async (rate) => {
        try {
            await axios.post(`${API_URL}/gastos/shipping-rates`, rate);
            Swal.fire({
                icon: 'success',
                title: 'Tarifa Actualizada',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                background: '#000',
                color: '#fff',
                iconColor: '#fff'
            });
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'No se pudo guardar la tarifa', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#fff' });
        }
    };

    // Banks
    const handleAddBank = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/gastos/bank-rates`, newBankRate);
            setNewBankRate({ banco: '', cuotas: '', porcentajeInteres: '' });
            fetchBankRates();
            Swal.fire({
                icon: 'success',
                title: 'Banco Agregado',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                background: '#000',
                color: '#fff',
                iconColor: '#fff'
            });
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'No se pudo agregar el banco', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#fff' });
        }
    };

    const handleDeleteBank = async (id) => {
        try {
            await axios.delete(`${API_URL}/gastos/bank-rates/${id}`);
            fetchBankRates();
        } catch (error) {
            console.error("Error deleting bank rate", error);
        }
    };

    // Increases
    const handleApplyIncrease = async () => {
        if (!increaseConfig.value || selectedForIncrease.length === 0) {
            Swal.fire({ title: 'Atención', text: 'Debe seleccionar al menos un producto y definir un valor de aumento.', icon: 'warning', background: '#000', color: '#fff', confirmButtonColor: '#fff' });
            return;
        }

        const result = await Swal.fire({
            title: 'Confirmar Aumento',
            text: `Se aplicará el aumento a los ${selectedForIncrease.length} productos seleccionados. ¿Continuar?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffffff',
            cancelButtonColor: '#333333',
            confirmButtonText: 'Sí, aplicar',
            background: '#000',
            color: '#fff',
            iconColor: '#fff'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // Se agrega el parámetro 'roundTo' para que el backend sepa cómo redondear.
                const payload = {
                    productIds: selectedForIncrease,
                    targetPrice: increaseConfig.targetPrice,
                    increaseType: increaseConfig.increaseType,
                    value: increaseConfig.value,
                    roundTo: 100
                };

                const res = await axios.post(`${API_URL}/gastos/update-prices`, payload);
                Swal.fire({
                    title: 'Éxito',
                    text: res.data.message,
                    icon: 'success',
                    background: '#000',
                    color: '#fff',
                    confirmButtonColor: '#ffffff',
                    iconColor: '#fff'
                });
                setSelectedForIncrease([]); // Limpiar selección
            } catch (error) {
                Swal.fire({ title: 'Error', text: 'Falló la actualización de precios', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#fff' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSaveMpFee = async () => {
        setLoading(true);
        try {
            await axios.post(`${API_URL}/gastos/global-configs`, {
                configs: [
                    { key: 'mp_fee', value: mpFee, description: 'Comisión de Mercado Pago para Ecommerce' }
                ]
            });
            Swal.fire({
                icon: 'success',
                title: 'Configuración Guardada',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                background: '#000',
                color: '#fff',
                iconColor: '#fff'
            });
        } catch (error) {
            Swal.fire({ title: 'Error', text: 'No se pudo guardar la tarifa de Mercado Pago', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#fff' });
        } finally {
            setLoading(false);
        }
    };

    // Handler para actualizar tasa individual
    const handleUpdateProductFee = async (productId, newFee) => {
        try {
            // null si está vacío para usar global
            const feeValue = newFee === '' ? null : parseFloat(newFee);
            await axios.put(`${API_URL}/products/${productId}`, {
                tasaEcommerce: feeValue
            });

            // Actualizar estado local
            setAllProducts(prev => prev.map(p =>
                p.id === productId ? { ...p, tasaEcommerce: feeValue } : p
            ));

            // Feedback sutil
        } catch (error) {
            console.error("Error updating product fee", error);
            Swal.fire({ title: 'Error', text: 'No se pudo actualizar la tasa', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#fff' });
        }
    };

    return (
        <div className="bg-black min-h-screen p-8 md:p-12 text-white font-['Inter'] selection:bg-white selection:text-black animate-in fade-in duration-700">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8 border-b border-white/5 pb-10">
                <div>
                    <h1 className={`${STYLES.title} text-5xl leading-none`}>GESTIÓN DE <span className="text-white">GASTOS</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-6 tracking-[0.5em]`}>COST_CONTROL_CENTER // FEDECELL_ADMIN</p>
                </div>
            </header>

            {/* TABS */}
            <div className="flex gap-2 mb-8 border-b border-zinc-800">
                <button
                    onClick={() => setActiveTab('envio')}
                    className={`px-6 py-4 font-['Inter'] text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'envio' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiTruck className="inline mr-2 mb-1" /> Tarifas de Envío
                </button>
                <button
                    onClick={() => setActiveTab('bancos')}
                    className={`px-6 py-4 font-['Inter'] text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'bancos' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiCreditCard className="inline mr-2 mb-1" /> Costos Bancarios
                </button>
                <button
                    onClick={() => setActiveTab('aumentos')}
                    className={`px-6 py-4 font-['Inter'] text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'aumentos' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiTrendingUp className="inline mr-2 mb-1" /> Aumento de Costos
                </button>
                <button
                    onClick={() => setActiveTab('ecommerce')}
                    className={`px-6 py-4 font-['Inter'] text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'ecommerce' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiActivity className="inline mr-2 mb-1" /> Costos Ecommerce
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="min-h-[500px]">

                {/* --- TAB: TARIFAS DE ENVIO --- */}
                {activeTab === 'envio' && (
                    <div className={`${STYLES.glass} p-10 fade-in`}>
                        <h2 className={`${STYLES.title} text-sm text-white mb-10 flex items-center gap-4`}>
                            <FiTruck size={20} /> CONFIGURACIÓN DE ZONAS LOGÍSTICAS
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {shippingRates.map((rate) => (
                                <div key={rate.zona} className="bg-black border border-zinc-900 p-6 group hover:border-white/50 transition-colors">
                                    <label className={STYLES.label}>{rate.zona.toUpperCase()}</label>
                                    <div className="relative mb-4">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-700 font-bold">$</span>
                                        <input
                                            type="number"
                                            value={rate.costo}
                                            onChange={(e) => handleShippingChange(rate.zona, e.target.value)}
                                            className="w-full bg-transparent border-none text-2xl font-['Inter'] text-white focus:ring-0 pl-6 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => saveShippingRate(rate)}
                                        className="w-full py-2 bg-zinc-900 hover:bg-white hover:text-black text-zinc-500 text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- TAB: COSTOS BANCARIOS --- */}
                {activeTab === 'bancos' && (
                    <div className={`${STYLES.glass} p-10 fade-in`}>
                        <h2 className={`${STYLES.title} text-sm text-white mb-10 flex items-center gap-4`}>
                            <FiCreditCard size={20} /> TABLA DE INTERESES BANCARIOS
                        </h2>

                        {/* Agregar Banco */}
                        <form onSubmit={handleAddBank} className="mb-12 bg-zinc-900/30 p-6 border border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <input
                                placeholder="NOMBRE DEL BANCO"
                                className={STYLES.input}
                                value={newBankRate.banco}
                                onChange={e => setNewBankRate({ ...newBankRate, banco: e.target.value })}
                                required
                            />
                            <input
                                placeholder="CANTIDAD CUOTAS"
                                type="number"
                                className={STYLES.input}
                                value={newBankRate.cuotas}
                                onChange={e => setNewBankRate({ ...newBankRate, cuotas: e.target.value })}
                                required
                            />
                            <div className="relative">
                                <input
                                    placeholder="% INTERÉS"
                                    type="number"
                                    className={STYLES.input}
                                    value={newBankRate.porcentajeInteres}
                                    onChange={e => setNewBankRate({ ...newBankRate, porcentajeInteres: e.target.value })}
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 font-bold">%</span>
                            </div>
                            <button type="submit" className={STYLES.buttonPrimary}>
                                <FiPlus className="inline mr-2" /> AGREGAR
                            </button>
                        </form>

                        {/* Listado */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className={`${STYLES.tech} text-[10px] text-zinc-600 border-b border-zinc-900`}>
                                    <tr>
                                        <th className="p-4">ENTIDAD</th>
                                        <th className="p-4">CUOTAS</th>
                                        <th className="p-4">INTERÉS</th>
                                        <th className="p-4 text-right">ACCIÓN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900 font-['Inter']">
                                    {bankRates.map(rate => (
                                        <tr key={rate.id} className="hover:bg-white/[0.02]">
                                            <td className="p-4 font-bold">{rate.banco}</td>
                                            <td className="p-4 text-zinc-400">{rate.cuotas}</td>
                                            <td className="p-4 text-white font-bold">{rate.porcentajeInteres}%</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteBank(rate.id)} className="text-zinc-600 hover:text-white transition-colors">
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB: AUMENTO DE COSTOS --- */}
                {activeTab === 'aumentos' && (
                    <div className={`${STYLES.glass} p-10 fade-in`}>
                        <h2 className={`${STYLES.title} text-sm text-white mb-10 flex items-center gap-4`}>
                            <FiTrendingUp size={20} /> ACTUALIZACIÓN MASIVA DE PRECIOS
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                            {/* Panel de Control */}
                            <div className="space-y-8">

                                {/* 1. SCOPE */}
                                <p className="text-zinc-500 text-xs text-center">Busque y seleccione los productos a los que desea aplicar un aumento de precio.</p>


                                {/* Search Input */}
                                <div className="bg-zinc-900/30 p-6 border-l-2 border-white space-y-4">
                                    <label className={STYLES.label}>CRITERIO DE BÚSQUEDA</label>
                                    <div className="flex gap-2">
                                        <select
                                            className={`${STYLES.input} !w-auto cursor-pointer`}
                                            value={increaseConfig.searchField}
                                            onChange={e => setIncreaseConfig({ ...increaseConfig, searchField: e.target.value })}
                                        >
                                            <option value="all" className="bg-black">TODOS LOS CAMPOS</option>
                                            <option value="nombre" className="bg-black">NOMBRE PRODUCTO</option>
                                            <option value="categoria" className="bg-black">CATEGORÍA</option>
                                        </select>
                                        <input
                                            className={STYLES.input}
                                            placeholder={increaseConfig.searchField === 'categoria' ? "Ej: Pantallas, Baterías..." : "Nombre, Marca o Categoría..."}
                                            value={increaseConfig.searchQuery}
                                            onChange={e => setIncreaseConfig({ ...increaseConfig, searchQuery: e.target.value })}
                                        />
                                    </div>
                                </div>


                                {/* 2. TARGET PRICE */}
                                <div>
                                    <label className={STYLES.label}>2. PRECIO OBJETIVO</label>
                                    <select
                                        className={`${STYLES.input} cursor-pointer`}
                                        value={increaseConfig.targetPrice}
                                        onChange={e => setIncreaseConfig({ ...increaseConfig, targetPrice: e.target.value })}
                                    >
                                        <option value="public" className="bg-black">PÚBLICO GENERAL</option>
                                        <option value="reseller" className="bg-black">REVENDEDORES</option>
                                        <option value="wholesale" className="bg-black">MAYORISTAS</option>
                                    </select>
                                </div>

                                {/* 3. INCREASE VALUE */}
                                <div>
                                    <label className={STYLES.label}>3. VALOR DEL AUMENTO</label>
                                    <div className="flex gap-4 mb-4">
                                        <button
                                            onClick={() => setIncreaseConfig({ ...increaseConfig, increaseType: 'percentage' })}
                                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${increaseConfig.increaseType === 'percentage' ? 'bg-white text-black border-white' : 'text-zinc-500 border-zinc-800 hover:border-zinc-500'}`}
                                        >
                                            Porcentaje (%)
                                        </button>
                                        <button
                                            onClick={() => setIncreaseConfig({ ...increaseConfig, increaseType: 'fixed' })}
                                            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${increaseConfig.increaseType === 'fixed' ? 'bg-white text-black border-white' : 'text-zinc-500 border-zinc-800 hover:border-zinc-500'}`}
                                        >
                                            Valor Fijo ($)
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            className={`${STYLES.input} !text-3xl text-white`}
                                            value={increaseConfig.value}
                                            onChange={e => setIncreaseConfig({ ...increaseConfig, value: parseFloat(e.target.value) })}
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 font-black text-xl">
                                            {increaseConfig.increaseType === 'percentage' ? '%' : '$'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleApplyIncrease}
                                    disabled={loading}
                                    className={`${STYLES.buttonPrimary} w-full flex justify-center items-center gap-2`}
                                >
                                    {loading ? 'PROCESANDO...' : `APLICAR AUMENTO (${selectedForIncrease.length})`}
                                </button>

                            </div>

                            {/* Info / Preview Panel */}
                            <div className="bg-zinc-900 p-8 border border-zinc-800 flex flex-col justify-center items-center text-center">
                                <FiTrendingUp size={48} className="text-white mb-6" />
                                <h3 className="text-white font-bold text-xl mb-2">RESUMEN DE OPERACIÓN</h3>
                                <p className="text-zinc-500 text-sm max-w-xs mb-8">
                                    Esta acción modificará permanentemente los precios en la base de datos.
                                </p>

                                <div className="w-full space-y-4 text-left p-6 bg-black border border-zinc-800 font-['Inter']">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500 text-xs font-bold">OBJETIVO:</span>
                                        <span className="text-white text-xs uppercase font-bold">{increaseConfig.targetPrice}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-500 text-xs font-bold">TIPO:</span>
                                        <span className="text-white text-xs uppercase font-bold">{increaseConfig.increaseType}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-zinc-800 pt-4">
                                        <span className="text-zinc-500 text-xs font-bold">SELECCIONADOS:</span>
                                        <span className={`text-xs uppercase font-black text-white`}>
                                            {selectedForIncrease.length} PRODUCTOS
                                        </span>
                                    </div>
                                </div>

                                {/* PRODUCT PREVIEW LIST */}
                                <div className="w-full mt-6 text-left">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className={STYLES.label}>PRODUCTOS AFECTADOS ({previewProducts.length}{previewProducts.length >= 50 ? '+' : ''})</label>
                                        {loadingPreview && <FiActivity className="animate-spin text-white w-4 h-4" />}
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto border border-zinc-900 bg-black/40 custom-scroll">
                                        {previewProducts.length > 0 ? (
                                            <table className="w-full text-[10px] font-['Inter']">
                                                <thead className="bg-zinc-900 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="p-2 text-zinc-500 text-left"></th>
                                                        <th className="p-2 text-zinc-500 text-left">PRODUCTO</th>
                                                        <th className="p-2 text-zinc-500 text-right">PRECIO ACTUAL</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-900">
                                                    {previewProducts.map(p => {
                                                        const precioDisplay = p.variantes?.[0]?.precioAlPublico || p.precioVenta;
                                                        const isSelected = selectedForIncrease.includes(p.id);
                                                        return (
                                                            <tr key={p.id} onClick={() => handleToggleSelectProduct(p.id)} className={`cursor-pointer transition-colors ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                                                                <td className="p-3 text-center">
                                                                    <input type="checkbox" checked={isSelected} readOnly className="form-checkbox h-4 w-4 bg-zinc-800 border-zinc-700 text-white focus:ring-white rounded-none cursor-pointer" />
                                                                </td>
                                                                <td className="p-3">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-zinc-600 text-[8px] uppercase font-black">{p.marca || 'GENERIC'}</span>
                                                                        <span className="text-white font-bold text-xs">{p.nombre}</span>
                                                                        <div className="flex items-center gap-1 mt-1 opacity-40">
                                                                            <FiActivity size={8} className="text-white" />
                                                                            <span className="text-[8px] text-white uppercase tracking-tighter">
                                                                                ACTUALIZADO: {new Date(p.updatedAt).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    <span className="text-white font-black text-xs">
                                                                        ${parseFloat(precioDisplay || 0).toLocaleString('es-AR')}
                                                                    </span>
                                                                    {p.variantes?.length > 1 && (
                                                                        <div className="text-[7px] text-zinc-600 uppercase mt-1 font-bold">
                                                                            +{p.variantes.length - 1} variantes
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className="p-8 text-center text-zinc-700 text-xs uppercase tracking-widest italic font-['Inter']">
                                                No hay productos coincidentes
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* --- TAB: COSTOS ECOMMERCE --- */}
                {activeTab === 'ecommerce' && (
                    <div className={`${STYLES.glass} p-10 fade-in`}>
                        <h2 className={`${STYLES.title} text-sm text-white mb-10 flex items-center gap-4`}>
                            <FiActivity size={20} /> PARÁMETROS OPERATIVOS E-COMMERCE
                        </h2>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="bg-zinc-900/30 p-8 border border-zinc-800">
                                <label className={STYLES.label}>Comisión Mercado Pago (%)</label>
                                <div className="relative mb-6">
                                    <input
                                        type="number"
                                        className={`${STYLES.input} !text-4xl text-white`}
                                        value={mpFee}
                                        onChange={e => setMpFee(parseFloat(e.target.value) || 0)}
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700 font-black text-2xl">%</span>
                                </div>
                                <p className="font-['Inter'] font-bold text-[10px] text-zinc-500 leading-relaxed mb-8 uppercase tracking-tighter">
                                    // Este porcentaje se sumará automáticamente a todas las compras realizadas a través de la web (Ecommerce y Revendedores).
                                </p>
                                <button
                                    onClick={handleSaveMpFee}
                                    disabled={loading}
                                    className={`${STYLES.buttonPrimary} w-full flex justify-center items-center gap-3`}
                                >
                                    {loading ? <FiActivity className="animate-spin" /> : <FiSave />}
                                    {loading ? 'SINCRONIZANDO...' : 'ACTUALIZAR COMISIÓN MERCADO PAGO'}
                                </button>
                            </div>

                            {/* CONFIGURACIÓN INDIVIDUAL POR PRODUCTO */}
                            <div className="bg-zinc-900/30 p-8 border border-zinc-800">
                                <h3 className="text-white font-bold text-sm mb-6 uppercase tracking-widest flex items-center gap-2">
                                    <FiSearch /> Configuración Individual por Producto
                                </h3>
                                <p className="text-[10px] text-zinc-500 mb-4 font-['Inter'] font-bold">
                                    Puede establecer una tasa específica para ciertos productos. Si se deja vacío, se usará la tasa global ({mpFee}%).
                                </p>

                                <input
                                    type="text"
                                    placeholder="BUSCAR POR NOMBRE, MARCA O CATEGORÍA..."
                                    className={STYLES.input}
                                    value={ecommerceSearch}
                                    onChange={e => setEcommerceSearch(e.target.value)}
                                />

                                <div className="mt-4 max-h-[400px] overflow-y-auto custom-scroll space-y-2">
                                    {allProducts
                                        .filter(p => ecommerceSearch && (
                                            p.nombre.toLowerCase().includes(ecommerceSearch.toLowerCase()) ||
                                            (p.marca && p.marca.toLowerCase().includes(ecommerceSearch.toLowerCase())) ||
                                            (p.categoria && p.categoria.toLowerCase().includes(ecommerceSearch.toLowerCase()))
                                        ))
                                        .slice(0, 20)
                                        .map(p => (
                                            <div key={p.id} className="bg-black p-4 border border-zinc-800 flex justify-between items-center group hover:border-zinc-600 transition-colors">
                                                <div className="max-w-[60%] font-['Inter']">
                                                    <p className="text-[10px] text-zinc-500 font-black uppercase">{p.marca} // {p.categoria}</p>
                                                    <p className="text-xs font-bold text-white truncate">{p.nombre}</p>
                                                    <p className="text-[9px] text-zinc-600 mt-1 font-bold">Precio Base: ${parseFloat(p.variantes?.[0]?.precioAlPublico || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-right">
                                                        <label className="text-[8px] text-zinc-600 block uppercase font-bold">Tasa Ecom %</label>
                                                        <input
                                                            type="number"
                                                            placeholder={mpFee.toString()}
                                                            className="w-20 bg-zinc-900 border border-zinc-700 text-white font-['Inter'] text-xs p-2 text-right focus:border-white outline-none transition-colors"
                                                            value={p.tasaEcommerce === null || p.tasaEcommerce === undefined ? '' : p.tasaEcommerce}
                                                            onChange={(e) => {
                                                                // Actualización optimista en UI local antes de enviar
                                                                const val = e.target.value;
                                                                setAllProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, tasaEcommerce: val } : prod));
                                                            }}
                                                            onBlur={(e) => handleUpdateProductFee(p.id, e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    }
                                    {ecommerceSearch && allProducts.filter(p => p.nombre.toLowerCase().includes(ecommerceSearch.toLowerCase())).length === 0 && (
                                        <p className="text-center text-zinc-600 text-xs py-4 font-['Inter'] font-bold uppercase tracking-widest">No se encontraron productos.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: #000; }
                .custom-scroll::-webkit-scrollbar-thumb { background: #333; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: #fff; }
            `}</style>
        </div>
    );
};

export default Gastos;