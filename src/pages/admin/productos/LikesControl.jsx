import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiHeart, FiPackage, FiTrendingUp } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const STYLES = {
    title: "text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight",
    label: "text-xs font-medium text-neutral-500 uppercase tracking-wider",
    tech: "text-xs text-neutral-700",
    card: "bg-white border border-[#ECECE6] shadow-xs rounded-2xl p-6",
    alertNeutral: "p-3 rounded-xl flex items-center gap-2 border bg-[#F3F2EE] border-[#ECECE6] text-neutral-700 text-xs font-medium",
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
            <div className="min-h-screen bg-[#FAF9F6] font-['Inter',sans-serif] text-neutral-900 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] font-['Inter',sans-serif] text-neutral-900">
            <div className="p-6 space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif] text-neutral-900">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#ECECE6] pb-6">
                    <div>
                        <h1 className={`${STYLES.title} flex items-center gap-2.5`}>
                            <FiHeart className="w-5 h-5 text-neutral-700" /> CONTROL DE POPULARIDAD
                        </h1>
                        <p className="text-xs text-neutral-500 mt-1">Ranking e indicadores de favoritos por producto</p>
                    </div>
                    <div className="bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] rounded-xl px-3 py-1.5 text-xs font-medium uppercase tracking-wider">
                        TOTAL PRODUCTOS: <span className="text-neutral-900 font-semibold">{products.length}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {products.slice(0, 6).map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`${STYLES.card} flex flex-col gap-4 relative overflow-hidden`}
                        >
                            {/* Indicador de Ranking */}
                            <div className="absolute top-4 right-4 bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] px-2.5 py-0.5 font-medium text-xs rounded-xl">
                                #{index + 1}
                            </div>

                            <div className="flex gap-4 items-center mt-1">
                                <div className="w-16 h-16 bg-[#FAF9F6] border border-[#ECECE6] rounded-xl overflow-hidden flex-shrink-0">
                                    <img 
                                        src={product.imagenes?.[0] || product.image || "https://via.placeholder.com/150"} 
                                        alt={product.nombre} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0 pr-10">
                                    <h3 className="text-base font-medium text-neutral-800 truncate mb-1">{product.nombre}</h3>
                                    <p className={STYLES.label}>{product.categoria || 'SIN CATEGORÍA'}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-[#ECECE6]">
                                <div className="flex items-center gap-2">
                                    <FiHeart className={product.likes > 0 ? "text-red-600 w-5 h-5" : "text-neutral-400 w-5 h-5"} />
                                    <span className="text-xl font-semibold text-neutral-900">{product.likes || 0}</span>
                                    <span className={`${STYLES.label} ml-1`}>LIKES</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] px-2.5 py-1 rounded-xl text-xs font-medium">
                                    <FiPackage className="w-4 h-4" />
                                    <span>{product.variantes?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} STK</span>
                                </div>
                            </div>

                            {/* Barra de popularidad relativa */}
                            <div className="w-full h-1.5 bg-[#F3F2EE] mt-1 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, (product.likes / (products[0].likes || 1)) * 100)}%` }}
                                    className="h-full bg-[#19191B] rounded-full"
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabla completa para el resto */}
                {products.length > 6 && (
                    <div className="space-y-3">
                        <h2 className="text-base font-medium text-neutral-800">LISTADO COMPLETO DE POPULARIDAD</h2>
                        <div className="overflow-x-auto rounded-2xl border border-[#ECECE6] bg-white shadow-xs">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[#F8F8F5] border-b border-[#ECECE6]">
                                    <tr>
                                        <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">PRODUCTO</th>
                                        <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">CATEGORÍA</th>
                                        <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">LIKES</th>
                                        <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F1F1EB]">
                                    {products.slice(6).map((product) => (
                                        <tr key={product.id} className="hover:bg-[#F8F8F5] transition-colors">
                                            <td className="px-4 py-3 text-left align-middle">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-[#F3F2EE] border border-[#ECECE6] rounded-xl overflow-hidden flex-shrink-0">
                                                        <img src={product.imagenes?.[0] || product.image} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-xs text-neutral-700 font-medium truncate max-w-[200px] sm:max-w-xs">{product.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-left align-middle text-xs text-neutral-700">{product.categoria || 'S/C'}</td>
                                            <td className="px-4 py-3 text-left align-middle">
                                                <span className={`text-xs font-medium ${product.likes > 0 ? 'text-neutral-900' : 'text-neutral-400'}`}>
                                                    {product.likes || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-left align-middle">
                                                <button className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors">
                                                    <FiTrendingUp className="w-4 h-4" />
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
        </div>
    );
};

export default LikesControl;
