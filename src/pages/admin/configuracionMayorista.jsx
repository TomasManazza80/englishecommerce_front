import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiSave, FiAlertCircle, FiCheck, FiDollarSign, FiPackage, FiSearch } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const ConfiguracionMayorista = () => {
    const [config, setConfig] = useState({ cartTotalMin: 0, productQtyMin: 0 });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [configRes, productsRes] = await Promise.all([
                axios.get(`${API_URL}/gastos/global-configs`),
                axios.get(`${API_URL}/products`)
            ]);

            const globalConfigs = configRes.data;
            const cartTotalMinConf = globalConfigs.find(c => c.key === 'wholesale_cart_total_min');
            const productQtyMinConf = globalConfigs.find(c => c.key === 'wholesale_product_qty_min');

            setConfig({
                cartTotalMin: cartTotalMinConf ? parseFloat(cartTotalMinConf.value) : 0,
                productQtyMin: productQtyMinConf ? parseFloat(productQtyMinConf.value) : 0,
            });

            setProducts(productsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setMessage({ type: 'error', text: 'Error al cargar datos.' });
        } finally {
            setLoading(false);
        }
    };

    const handleConfigChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const saveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.post(`${API_URL}/gastos/global-configs`, {
                configs: [
                    { key: 'wholesale_cart_total_min', value: config.cartTotalMin, description: 'Monto mínimo de carrito para precio mayorista' },
                    { key: 'wholesale_product_qty_min', value: config.productQtyMin, description: 'Cantidad mínima de producto para precio mayorista' }
                ]
            });
            setMessage({ type: 'success', text: 'Configuración global guardada.' });
        } catch (error) {
            console.error("Error saving config:", error);
            setMessage({ type: 'error', text: 'Error al guardar configuración.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const toggleProductWholesale = async (product) => {
        try {
            const updatedValue = !product.aplicarMayoristaPorCantidad;
            const updatedProducts = products.map(p =>
                p.id === product.id ? { ...p, aplicarMayoristaPorCantidad: updatedValue } : p
            );
            setProducts(updatedProducts);

            await axios.put(`${API_URL}/products/${product.id}`, {
                ...product,
                aplicarMayoristaPorCantidad: updatedValue
            });

        } catch (error) {
            console.error("Error updating product:", error);
            setMessage({ type: 'error', text: 'Error al actualizar producto.' });
            fetchData();
        }
    };

    const getProductThumbnail = (imagenes) => {
        if (!imagenes) return null;

        if (Array.isArray(imagenes)) return imagenes[0];

        try {
            const parsed = JSON.parse(imagenes);
            return Array.isArray(parsed) ? parsed[0] : parsed;
        } catch (e) {
            return imagenes;
        }
    };

    const filteredProducts = products.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="text-black bg-white min-h-screen p-6 max-w-6xl mx-auto pb-32" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="mb-8">
                <h2 className="text-3xl text-black mb-2 font-black tracking-tighter uppercase">CONFIGURACIÓN MAYORISTA</h2>
                <p className="text-gray-500 text-xs tracking-widest uppercase font-medium">DEFINIR REGLAS DE NEGOCIO PARA COMPRAS AL POR MAYOR</p>
            </div>

            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${message.type === 'success' ? 'bg-white border-black text-black' : 'bg-gray-100 border-gray-300 text-black'}`}
                >
                    {message.type === 'success' ? <FiCheck className="text-black" /> : <FiAlertCircle className="text-black" />}
                    <span className="text-xs font-bold uppercase">{message.text}</span>
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* LADO IZQUIERDO: CONFIGURACIÓN GLOBAL */}
                <div className="md:col-span-1 space-y-6">
                    <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <h3 className="text-lg mb-6 flex items-center gap-2 font-black tracking-tighter uppercase text-black">
                            <FiDollarSign className="text-black" />
                            LÍMITES GLOBALES
                        </h3>
                        <form onSubmit={saveConfig} className="space-y-6">
                            <div>
                                <label className="text-[10px] uppercase text-gray-500 block mb-2 font-bold">Monto Mínimo Carrito ($)</label>
                                <input
                                    type="number"
                                    name="cartTotalMin"
                                    value={config.cartTotalMin}
                                    onChange={handleConfigChange}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all"
                                />
                                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                                    Si el total del carrito supera este monto, se aplicará precio mayorista a <strong className="text-black uppercase">todos</strong> los productos.
                                </p>
                            </div>

                            <div>
                                <label className="text-[10px] uppercase text-gray-500 block mb-2 font-bold">Cantidad Mínima por Producto</label>
                                <input
                                    type="number"
                                    name="productQtyMin"
                                    value={config.productQtyMin}
                                    onChange={handleConfigChange}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all"
                                />
                                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                                    Cantidad mínima para activar precio mayorista en productos seleccionados individualmente.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-3 bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? "GUARDANDO..." : <><FiSave /> GUARDAR REGLAS</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* LADO DERECHO: SELECCIÓN DE PRODUCTOS */}
                <div className="md:col-span-2">
                    <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg flex items-center gap-2 font-black tracking-tighter uppercase text-black">
                                <FiPackage className="text-black" />
                                PRODUCTOS HABILITADOS
                            </h3>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="BUSCAR PRODUCTO..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 rounded-full py-2 pl-10 pr-4 text-[10px] text-black focus:border-black focus:ring-1 focus:ring-black outline-none w-48 uppercase transition-all font-bold"
                                />
                            </div>
                        </div>

                        <p className="text-[10px] text-gray-600 mb-4 bg-gray-100 p-3 rounded-lg border border-gray-200 flex items-center">
                            <FiAlertCircle className="inline mr-2 text-black flex-shrink-0" />
                            <span>Selecciona los productos que aplicarán precio mayorista cuando superen las <strong className="text-black">{config.productQtyMin} unidades</strong>.</span>
                        </p>

                        <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            {loading ? (
                                <p className="text-center text-gray-400 py-10 text-xs animate-pulse font-bold tracking-widest uppercase">CARGANDO INVENTARIO...</p>
                            ) : filteredProducts.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredProducts.map(product => {
                                        const mainImg = getProductThumbnail(product.imagenes);
                                        return (
                                            <div
                                                key={product.id}
                                                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${product.aplicarMayoristaPorCantidad ? 'bg-gray-50 border-black' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                                                        {mainImg ? (
                                                            <img src={mainImg} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><FiPackage size={14} /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-black uppercase tracking-tight">{product.nombre}</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">STOCK: {product.cantidad} | PRECIO: ${product.precio}</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleProductWholesale(product)}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${product.aplicarMayoristaPorCantidad ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black'}`}
                                                >
                                                    {product.aplicarMayoristaPorCantidad ? 'HABILITADO' : 'DESHABILITADO'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 py-10 text-[10px] font-bold tracking-widest uppercase">NO SE ENCONTRARON RESULTADOS.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionMayorista;