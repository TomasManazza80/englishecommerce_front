import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiHeart, FiPackage, FiTrendingUp } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const LikesControl = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProductsByLikes = async () => {
            try {
                setLoading(true);
                // Obtenemos todos los productos (podríamos necesitar un endpoint que ordene por likes en el futuro, 
                // pero por ahora filtramos y ordenamos en el cliente para simplicidad si no son miles)
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
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 md:p-0">
            <div className="flex items-center justify-between">
                <h2 className="fedecell-title text-lg text-white flex items-center gap-3">
                    <FiHeart className="text-red-500" /> CONTROL DE POPULARIDAD
                </h2>
                <div className="glass-card px-4 py-2 text-[10px] fedecell-tech text-zinc-400">
                    TOTAL PRODUCTOS: {products.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden"
                    >
                        {/* Indicador de Ranking */}
                        <div className="absolute top-0 right-0 bg-white text-black px-3 py-1 fedecell-title text-[10px]">
                            #{index + 1}
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="w-16 h-16 bg-zinc-900 rounded overflow-hidden flex-shrink-0">
                                <img 
                                    src={product.imagenes?.[0] || product.image || "https://via.placeholder.com/150"} 
                                    alt={product.nombre} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="fedecell-title text-xs text-white truncate">{product.nombre}</h3>
                                <p className="fedecell-tech text-[9px] text-zinc-500 uppercase">{product.categoria || 'Sin Categoría'}</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <FiHeart className={product.likes > 0 ? "text-red-500" : "text-zinc-600"} />
                                <span className="fedecell-tech text-xl font-black text-white">{product.likes || 0}</span>
                                <span className="fedecell-tech text-[9px] text-zinc-500 uppercase ml-1">Likes</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-400">
                                <FiPackage size={14} />
                                <span className="fedecell-tech text-[10px]">{product.variantes?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} Stk</span>
                            </div>
                        </div>

                        {/* Barra de popularidad relativa */}
                        <div className="w-full h-1 bg-zinc-900 mt-2 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (product.likes / (products[0].likes || 1)) * 100)}%` }}
                                className="h-full bg-red-500"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tabla completa para el resto */}
            {products.length > 6 && (
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h3 className="fedecell-title text-[10px] text-zinc-400 uppercase tracking-widest">Listado Completo de Popularidad</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="p-4 fedecell-tech text-[10px] text-zinc-500 uppercase">Producto</th>
                                    <th className="p-4 fedecell-tech text-[10px] text-zinc-500 uppercase">Categoría</th>
                                    <th className="p-4 fedecell-tech text-[10px] text-zinc-500 uppercase text-center">Likes</th>
                                    <th className="p-4 fedecell-tech text-[10px] text-zinc-500 uppercase text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.slice(6).map((product) => (
                                    <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-zinc-900 rounded overflow-hidden">
                                                    <img src={product.imagenes?.[0] || product.image} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <span className="fedecell-tech text-[11px] text-zinc-300 group-hover:text-white transition-colors">{product.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 fedecell-tech text-[10px] text-zinc-500 uppercase">{product.categoria}</td>
                                        <td className="p-4 text-center">
                                            <span className={`fedecell-tech text-[12px] font-bold ${product.likes > 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                                                {product.likes || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button className="text-zinc-500 hover:text-white transition-colors">
                                                <FiTrendingUp size={14} />
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
