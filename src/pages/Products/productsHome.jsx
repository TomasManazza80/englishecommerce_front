import axios from "axios";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { FiFilter, FiArrowRight } from "react-icons/fi";
import { Outlet, Link } from "react-router-dom";
import ProductCart from "../../components/ProductCart";

const API_URL = import.meta.env.VITE_API_URL;
const ACCENT_ORANGE = "#FF8C00";

// --- CONFIGURACIÓN DE ESTILOS FEDECELL ---
const springSetting = { type: "spring", stiffness: 120, damping: 20 };

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: springSetting }
};

const fedecellStyles = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Inter:wght@500&family=JetBrains+Mono&display=swap');
.fedecell-title { font-family: 'Montserrat', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.03em; }
.fedecell-body { font-family: 'Inter', sans-serif; font-weight: 500; }
.fedecell-tech { font-family: 'JetBrains Mono', monospace; }
.no-scrollbar::-webkit-scrollbar { display: none; }
`;

const ProductsHome = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: "", name: "ÚLTIMAS_UNIDADES" },
        { id: "Celulares", name: "CELULARES" },
        { id: "Accesorios", name: "ACCESORIOS" }
    ];

    async function fetchProducts() {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/products`);
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("FETCH_ERROR:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchProducts(); }, []);

    useEffect(() => {
        const filtered = category === ""
            ? products
            : products.filter(item => item.categoria === category);
        setFilteredProducts(filtered.slice(0, 15));
    }, [category, products]);

    return (
        <div className="bg-black min-h-screen text-white fedecell-body antialiased">
            <style dangerouslySetInnerHTML={{ __html: fedecellStyles }} />
            <Outlet />

            {/* --- SECCIÓN 1: GRID DE BANNERS (MÁS COMPACTO) --- */}
            <section className="container mx-auto px-4 pt-6 pb-12">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 h-auto md:h-[450px]"
                >
                    <motion.div
                        variants={itemVariants}
                        whileHover={{ borderColor: ACCENT_ORANGE }}
                        className="md:col-span-1 bg-zinc-900 border border-white/5 relative overflow-hidden group p-6 flex flex-col justify-end"
                    >
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.6 }}
                            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000"
                            className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all"
                            alt="Hardware"
                        />
                        <div className="relative z-10">
                            <h3 className="fedecell-title text-xl leading-none mb-1">SISTEMA DE <span style={{ color: ACCENT_ORANGE }}>SONIDO</span></h3>
                            <p className="fedecell-tech text-[8px] uppercase tracking-[0.2em] text-gray-500 mb-4 font-bold">// DESCUENTO_30%</p>
                            <button className="fedecell-title text-[9px] tracking-widest border-b border-orange-500 pb-0.5 hover:text-white transition-colors">
                                COMPRAR_AHORA_
                            </button>
                        </div>
                    </motion.div>

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { title: "RELOJ INTELIGENTE", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400", off: "20% DESC" },
                            { title: "TABLET PRO", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=400" },
                            { title: "ALTAVOZ INTELIGENTE", img: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?q=80&w=400", tech: "CORE_AUDIO_V2" },
                            { title: "MANDO JUEGOS", img: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?q=80&w=400", accent: true }
                        ].map((b, i) => (
                            <motion.div
                                key={i}
                                variants={itemVariants}
                                whileHover={{ y: -3, borderColor: ACCENT_ORANGE }}
                                className={`relative border border-white/5 p-5 flex items-center justify-between overflow-hidden group ${b.accent ? 'bg-zinc-900/50' : 'bg-black'}`}
                            >
                                <div className="z-10">
                                    {b.off && <p style={{ color: ACCENT_ORANGE }} className="fedecell-tech text-[8px] font-black mb-0.5">{b.off}</p>}
                                    <h3 className="fedecell-title text-lg leading-tight">{b.title}</h3>
                                    {b.tech && <p className="fedecell-tech text-[7px] text-gray-600 mt-1">{b.tech}</p>}
                                </div>
                                <motion.img
                                    whileHover={{ rotate: -5, scale: 1.1 }}
                                    src={b.img}
                                    className="w-20 h-20 object-contain z-10"
                                    alt={b.title}
                                />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>


        </div>
    );
};

export default ProductsHome;