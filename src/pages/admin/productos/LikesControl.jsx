import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiHeart, FiPackage, FiTrendingUp } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const STYLES = {
    title: "font-black uppercase tracking-tighter text-black",
    label: "font-bold text-[10px] text-gray-500 uppercase tracking-widest",
    tech: "font-bold tracking-widest uppercase",
    card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
    alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-gray-100 border-gray-300 text-black text-xs font-bold uppercase",
};

const LikesControl = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProductsByLikes = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/products?limit=1000`);
                const allProducts = data.products || data || [];
                
                // Ordenar por likes descendente
                const sorted = [...allProducts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
                setProducts(sorted);
            } catch (error) {
                console.error("Error fetching likes data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProductsByLikes();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 bg-white min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-4 md:p-8 lg:p-12 bg-white min-h-screen text-black" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 pb-8">
                <h2 className={`${STYLES.title} text-3xl flex items-center gap-3`}>
                    <FiHeart className="text-black" /> CONTROL DE POPULARIDAD
                </h2>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    TOTAL PRODUCTOS: <span className="text-black font-black">{products.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.slice(0, 6).map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${STYLES.card} flex flex-col gap-5 relative overflow-hidden group hover:border-black transition-all`}
                    >
                        {/* Indicador de Ranking */}
                        <div className="absolute top-4 right-4 bg-gray-50 border border-gray-200 text-black px-3 py-1 font-black text-[10px] rounded-lg shadow-sm">
                            #{index + 1}
                        </div>

                        <div className="flex gap-5 items-center mt-2">
                            <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                                <img 
                                    src={product.imagenes?.[0] || product.image || "https://via.placeholder.com/150"} 
                                    alt={product.nombre} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0 pr-12">
                                <h3 className={`${STYLES.title} text-lg truncate mb-1`}>{product.nombre}</h3>
                                <p className={`${STYLES.label} text-[9px]`}>{product.categoria || 'SIN CATEGORÍA'}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-5 border-t border-gray-100">
                            <div className="flex items-center gap-2">
                                <FiHeart className={product.likes > 0 ? "text-red-500" : "text-gray-400"} size={20} />
                                <span className={`${STYLES.title} text-2xl`}>{product.likes || 0}</span>
                                <span className={`${STYLES.label} text-[9px] ml-1`}>LIKES</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                <FiPackage size={14} />
                                <span className={`${STYLES.tech} text-[10px] font-bold`}>{product.variantes?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} STK</span>
                            </div>
                        </div>

                        {/* Barra de popularidad relativa */}
                        <div className="w-full h-1.5 bg-gray-100 mt-1 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (product.likes / (products[0].likes || 1)) * 100)}%` }}
                                className="h-full bg-black rounded-full"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tabla completa para el resto */}
            {products.length > 6 && (
                <div className={`${STYLES.card} p-0 overflow-hidden mt-8`}>
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h3 className={`${STYLES.label} !mb-0 text-xs`}>LISTADO COMPLETO DE POPULARIDAD</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-white">
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">PRODUCTO</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">CATEGORÍA</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">LIKES</th>
                                    <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.slice(6).map((product) => (
                                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                        <td className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    <img src={product.imagenes?.[0] || product.image} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <span className={`${STYLES.tech} text-xs text-black font-bold truncate max-w-[200px] sm:max-w-xs`}>{product.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.categoria || 'S/C'}</td>
                                        <td className="p-5 text-center">
                                            <span className={`text-sm font-black uppercase tracking-tighter ${product.likes > 0 ? 'text-black' : 'text-gray-400'}`}>
                                                {product.likes || 0}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                                <FiTrendingUp size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LikesControl;
