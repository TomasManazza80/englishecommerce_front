import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiX, FiPackage, FiSearch, FiInfo, FiLayers, FiDollarSign,
    FiChevronLeft, FiChevronRight, FiClock, FiTag, FiTruck, FiBox
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL;

const optimizeImage = (url, width = 800) => {
    if (!url) return '';
    if (url.includes('ik.imagekit.io')) {
        return `${url}?tr=w-${width},f-webp,q-80`;
    } else if (url.includes('res.cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/w_${width},f_webp,q_auto/${parts[1]}`;
        }
    }
    return url;
};

const styles = {
    overlay: "fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4",
    modal: "bg-[#0A0A0A] border border-white/10 w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(255,140,0,0.15)]",
    header: "p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]",
    title: "font-['Montserrat'] font-black text-xl uppercase tracking-tighter text-white",
    body: "flex-1 overflow-y-auto p-8 custom-scrollbar",
    section: "mb-10",
    sectionTitle: "text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mb-6 flex items-center gap-3 border-l-2 border-orange-500 pl-4",
    gridInfo: "grid grid-cols-2 md:grid-cols-4 gap-6",
    infoCard: "bg-white/5 border border-white/5 p-4 rounded-lg",
    infoLabel: "text-[9px] text-zinc-500 uppercase font-bold mb-1",
    infoValue: "text-sm text-zinc-200 font-medium",
    variantCard: "border border-white/5 bg-white/[0.02] p-4 rounded-xl hover:border-orange-500/30 transition-all",
    variantGrid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
};

const ProductInfoModal = ({ productData, onClose }) => {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentImg, setCurrentImg] = useState(0);

    useEffect(() => {
        if (typeof productData === 'string') {
            fetchByTitle(productData);
        } else if (productData?.id) {
            fetchById(productData.id);
        } else if (productData) {
            setProduct(productData);
        }
    }, [productData]);

    const fetchById = async (id) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/products/${id}`);
            setProduct(data);
        } catch (err) {
            setError("NO_SE_PUDO_OBTENER_DETALLES");
        } finally {
            setLoading(false);
        }
    };

    const fetchByTitle = async (title) => {
        setLoading(true);
        try {
            // Intentar limpiar el título si viene con variantes entre paréntesis
            const cleanTitle = title.split(' (')[0].trim();
            const { data } = await axios.get(`${API_BASE}/products`);
            const found = data.find(p => p.nombre.toLowerCase() === cleanTitle.toLowerCase());
            if (found) {
                setProduct(found);
            } else {
                setError("PRODUCTO_NO_ENCONTRADO_EN_DB");
            }
        } catch (err) {
            setError("ERROR_DE_CONEXIÓN");
        } finally {
            setLoading(false);
        }
    };

    if (!productData) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.overlay}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    className={styles.modal}
                    onClick={e => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <div className="flex items-center gap-4">
                            <div className="bg-orange-500 text-black p-2">
                                <FiPackage size={20} />
                            </div>
                            <div>
                                <h2 className={styles.title}>{loading ? 'CARGANDO INFORMACIÓN...' : (product?.nombre || 'DETALLES DEL ARTÍCULO')}</h2>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{product?.id ? `ID: ${product.id}` : 'INFO TERMINAL'}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 text-zinc-500 hover:text-white transition-colors">
                            <FiX size={24} />
                        </button>
                    </div>

                    <div className={styles.body}>
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="font-['JetBrains_Mono'] text-orange-500 text-xs animate-pulse">ACCEDIENDO A LA BASE DE DATOS...</p>
                            </div>
                        ) : error ? (
                            <div className="p-10 text-center border border-red-500/20 bg-red-500/5 rounded-xl">
                                <FiInfo className="mx-auto text-red-500 mb-4" size={40} />
                                <p className="text-red-500 fedecell-tech text-sm uppercase font-black">{error}</p>
                                <p className="text-zinc-500 text-xs mt-2">DATO RECIBIDO: {productData}</p>
                            </div>
                        ) : product && (
                            <div className="space-y-12">
                                {/* 1. VISTA RÁPIDA E IMÁGENES */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                    <div className="lg:col-span-4 space-y-4">
                                        <div className="aspect-square bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center p-8 overflow-hidden relative group">
                                            {product.imagenes?.length > 0 ? (
                                                <>
                                                    <img src={optimizeImage(product.imagenes[currentImg], 800)} loading="lazy" className="max-h-full w-auto object-contain z-10" alt="product" />
                                                    {product.imagenes.length > 1 && (
                                                        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex justify-between z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setCurrentImg(p => p === 0 ? product.imagenes.length - 1 : p - 1)} className="p-2 bg-black/50 rounded-full hover:bg-orange-500 transition-all"><FiChevronLeft /></button>
                                                            <button onClick={() => setCurrentImg(p => p === product.imagenes.length - 1 ? 0 : p + 1)} className="p-2 bg-black/50 rounded-full hover:bg-orange-500 transition-all"><FiChevronRight /></button>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <FiBox size={60} className="text-zinc-800" />
                                            )}
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                            {product.imagenes?.map((img, i) => (
                                                <button key={i} onClick={() => setCurrentImg(i)} className={`w-12 h-12 flex-shrink-0 border-2 rounded-lg p-1 bg-black ${currentImg === i ? 'border-orange-500' : 'border-white/5 opacity-50'}`}>
                                                    <img src={optimizeImage(img, 200)} loading="lazy" className="w-full h-full object-contain" alt="thumb" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lg:col-span-8 space-y-8">
                                        <div>
                                            <h3 className={styles.sectionTitle}>01. Ficha General</h3>
                                            <div className={styles.gridInfo}>
                                                {[
                                                    { label: 'Categoría', value: product.categoria, icon: <FiLayers /> },
                                                    { label: 'Marca', value: product.marca, icon: <FiTag /> },
                                                    { label: 'Proveedor', value: product.proveedor || 'N/A', icon: <FiTruck /> },
                                                    { label: 'Alerta Stock', value: product.alerta, icon: <FiClock /> },
                                                ].map((item, i) => (
                                                    <div key={i} className={styles.infoCard}>
                                                        <div className="flex items-center gap-2 mb-2 text-orange-500/50">
                                                            {item.icon}
                                                            <span className={styles.infoLabel}>{item.label}</span>
                                                        </div>
                                                        <p className={styles.infoValue}>{item.value || '---'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className={styles.sectionTitle}>02. Descripción Técnica</h3>
                                            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{product.descripcion || 'SIN DESCRIPCIÓN DISPONIBLE'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. VARIANTES Y PRECIOS */}
                                {product.variantes?.length > 0 && (
                                    <div>
                                        <h3 className={styles.sectionTitle}>03. Configuración de Lotes y Precios</h3>
                                        <div className={styles.variantGrid}>
                                            {product.variantes.map((v, i) => (
                                                <div key={i} className={styles.variantCard}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: v.color }}></div>
                                                            <span className="text-sm font-bold text-white uppercase">{v.color} - {v.almacenamiento}</span>
                                                        </div>
                                                        <div className={`px-2 py-1 rounded text-[10px] font-black ${v.stock > product.alerta ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                            STOCK: {v.stock}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-4 border-t border-white/5">
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-zinc-500 uppercase">Costo:</span>
                                                            <span className="text-white font-mono">${parseFloat(v.costoDeCompra || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-zinc-500 uppercase">Venta Público:</span>
                                                            <span className="text-orange-500 font-bold">${parseFloat(v.precioAlPublico || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-zinc-500 uppercase">Mayorista:</span>
                                                            <span className="text-zinc-300 font-bold">${parseFloat(v.precioMayorista || 0).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-zinc-500 uppercase">Revendedor:</span>
                                                            <span className="text-zinc-300 font-bold">${parseFloat(v.precioRevendedor || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white/[0.03] border-t border-white/10 text-right">
                        <button
                            onClick={onClose}
                            className="bg-white text-black px-8 py-3 font-['Montserrat'] font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-colors"
                        >
                            CERRAR
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProductInfoModal;
