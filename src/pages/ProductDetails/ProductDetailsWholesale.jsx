import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import { Add } from "../../store/redux/cart/CartAction";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPlus,
    faMinus,
    faMicrochip,
    faShieldHalved,
    faTruckFast,
    faChevronLeft,
    faChevronRight,
    faCreditCard,
    faCheck,
    faCircleExclamation,
    faInfoCircle
} from "@fortawesome/free-solid-svg-icons";

// CORRECCIÓN: WhatsApp se importa de free-brands-svg-icons
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL;

// CONFIGURACIÓN VISUAL: ESTILOS FEDECELL (PREMIUM DARK TECH)
const fedecellStyles = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Inter:wght@400;500;600&family=JetBrains+Mono&display=swap');

.f-title { font-family: 'Montserrat', sans-serif; font-weight: 900; text-transform: uppercase; }
.f-body { font-family: 'Inter', sans-serif; font-weight: 500; }
.f-tech { font-family: 'JetBrains Mono', monospace; }

.glass-panel { 
    background: rgba(255, 255, 255, 0.03); 
    border: 1px solid rgba(255, 255, 255, 0.08); 
    backdrop-filter: blur(12px); 
    -webkit-backdrop-filter: blur(12px);
}

.orange-glow { 
    box-shadow: 0 0 30px rgba(255, 140, 0, 0.2); 
}

.no-scrollbar::-webkit-scrollbar { display: none; }

.btn-premium {
    text-transform: uppercase;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.safe-area-pb {
    padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
`;

// Mapa de colores para renderizar los círculos (puedes ampliarlo según tu stock)
const COLOR_MAP = {
    "rojo": "#A50011",
    "blanco": "#F5F5F7",
    "negro": "#1C1C1E",
    "azul": "#273746",
    "gris": "#8E8E93",
    "oro": "#F9E5C9"
};

const ProductDetailsWholesale = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [product, setProduct] = useState({ variantes: [], imagenes: [] });
    const [wholesaleConfig, setWholesaleConfig] = useState(null);
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedStorage, setSelectedStorage] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // --- LÓGICA DE VARIANTES (PRECIO Y STOCK INDEPENDIENTE) ---
    const colors = [...new Set((product.variantes || []).map(v => v.color))];

    // Filtramos los almacenamientos disponibles según el color seleccionado
    const availableStorages = (product.variantes || [])
        .filter(v => v.color === selectedColor)
        .map(v => v.almacenamiento);

    // Buscamos la variante exacta para extraer precio y stock
    const currentVariant = (product.variantes || []).find(
        v => v.color === selectedColor && v.almacenamiento === selectedStorage
    );

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        fetchProductAndConfig();
    }, [id]);

    // --- EFECTO: AUTO-SELECCIÓN DE ALMACENAMIENTO ---
    // Asegura que al cambiar de color, se seleccione automáticamente el primer almacenamiento disponible
    useEffect(() => {
        if (product.variantes && selectedColor) {
            const validStorages = product.variantes
                .filter(v => v.color === selectedColor)
                .map(v => v.almacenamiento);

            if (validStorages.length > 0 && !validStorages.includes(selectedStorage)) {
                setSelectedStorage(validStorages[0]);
            }
        }
    }, [selectedColor, product.variantes, selectedStorage]);

    // Configurar cantidad mínima automática si aplica
    useEffect(() => {
        if (product.aplicarMayoristaPorCantidad && wholesaleConfig) {
            setQuantity(wholesaleConfig.productQtyMin || 1);
        } else {
            setQuantity(1);
        }
    }, [product, wholesaleConfig]);


    const fetchProductAndConfig = async () => {
        setLoading(true);
        try {
            const [productRes, configRes] = await Promise.all([
                axios.get(`${API_URL}/products/${id}`),
                axios.get(`${API_URL}/gastos/global-configs`)
            ]);

            setProduct(productRes.data);

            const globalConfigs = configRes.data || [];
            const cartTotalMinConf = globalConfigs.find(c => c.key === 'wholesale_cart_total_min');
            const productQtyMinConf = globalConfigs.find(c => c.key === 'wholesale_product_qty_min');
            setWholesaleConfig({
                cartTotalMin: cartTotalMinConf ? parseFloat(cartTotalMinConf.value) : 0,
                productQtyMin: productQtyMinConf ? parseFloat(productQtyMinConf.value) : 0,
            });

            // Inicialización automática
            if (productRes.data.variantes?.length > 0) {
                setSelectedColor(productRes.data.variantes[0].color);
                setSelectedStorage(productRes.data.variantes[0].almacenamiento);
            }
        } catch (error) { console.error("FETCH_ERROR", error); }
        finally { setLoading(false); }
    };

    // --- LÓGICA DE NEGOCIO MAYORISTA ---
    const minWholesaleQty = (product.aplicarMayoristaPorCantidad && wholesaleConfig)
        ? (wholesaleConfig.productQtyMin || 1)
        : 1;

    const isWholesaleStockAvailable = currentVariant && currentVariant.stock >= minWholesaleQty;

    // --- VALIDACIÓN DE VISUALIZACIÓN DE SELECTORES ---
    const hasColor = colors.length > 1 || (colors.length === 1 && colors[0] && colors[0].toLowerCase() !== 'unico');
    const hasStorage = availableStorages.length > 1 || (availableStorages.length === 1 && availableStorages[0] && availableStorages[0].toLowerCase() !== 'unico');
    const showSelectors = hasColor || hasStorage;

    const handleAddToCart = () => {
        if (!currentVariant || currentVariant.stock < 1) return;

        dispatch(Add({
            ProductId: product.id,
            id: `${product.id}-${selectedColor}-${selectedStorage}`,
            title: `${product.nombre} (${(selectedColor || '').toUpperCase()} / ${(selectedStorage || '').toUpperCase()})`,
            price: currentVariant?.precioMayorista || 0, // PRECIO BASE PARA MAYORISTA
            precioAlPublico: currentVariant?.precioAlPublico || 0,
            precioMayorista: currentVariant?.precioMayorista || 0,
            image: product.imagenes?.[0],
            quantity,
            color: selectedColor,
            storage: selectedStorage,
            origenDeVenta: 'Revendedor'
        }));

        Swal.fire({
            title: "AGREGADO AL PEDIDO MAYORISTA",
            text: "Verifique que se cumplan las condiciones globales en el carrito.",
            icon: "success",
            background: "#000",
            color: "#fff",
            showConfirmButton: false,
            timer: 1500
        });

        setTimeout(() => {
            navigate("/cart-wholesale");
        }, 1600);
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center z-50">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full"
            />
            <motion.p
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
                className="mt-4 font-['JetBrains_Mono'] text-orange-500 text-xs uppercase tracking-[0.3em]"
            >
                Cargando_Sistema...
            </motion.p>
        </div>
    );

    return (
        <div className="bg-black min-h-screen text-white f-body antialiased pb-32 md:pb-20">
            <style dangerouslySetInnerHTML={{ __html: fedecellStyles }} />

            {/* HEADER MAYORISTA (Mobile optimizado) */}
            <div className="bg-zinc-900 border-b border-orange-500/20 py-2">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-1 md:gap-0">
                    <span className="text-[10px] md:text-xs f-tech text-orange-500 uppercase tracking-widest font-bold">
                        <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
                        PORTAL MAYORISTA
                    </span>
                    {wholesaleConfig && (
                        <span className="text-[8px] md:text-[9px] f-tech text-zinc-400 uppercase tracking-widest text-center">
                            MIN COMPRA: ${Number(wholesaleConfig.cartTotalMin).toLocaleString('es-AR')} <span className="hidden md:inline">|</span><br className="md:hidden" /> MIN CANT: {wholesaleConfig.productQtyMin} U
                        </span>
                    )}
                </div>
            </div>

            <div className="container mx-auto max-w-6xl px-4 pt-4 md:pt-10">

                {/* NAVEGACIÓN TÉCNICA */}
                <nav className="flex items-center gap-2 mb-6 md:mb-8 f-tech text-[10px] text-zinc-600 uppercase tracking-[0.3em]">
                    <Link to="/revendedores" className="hover:text-orange-500 truncate">CATÁLOGO</Link>
                    <span>/</span>
                    <span className="text-orange-500/60 truncate">{product.categoria || 'HARDWARE'}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-20">

                    {/* SECCIÓN A: VISUALIZADOR (GALERÍA) */}
                    <div className="w-full lg:w-1/2">
                        <div className="relative aspect-square glass-panel rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentImageIndex}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    src={product.imagenes?.[currentImageIndex]}
                                    className="absolute inset-0 w-full h-full object-cover z-10 drop-shadow-[0_0_60px_rgba(255,140,0,0.15)]"
                                />
                            </AnimatePresence>

                            {/* BADGE MAYORISTA EN FOTO */}
                            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
                                <span className="bg-black border border-orange-500 text-orange-500 text-[8px] md:text-[10px] font-black uppercase px-3 py-1 tracking-widest rounded-full shadow-lg">
                                    MAYORISTA
                                </span>
                            </div>

                            <div className="absolute inset-x-2 md:inset-x-6 top-1/2 -translate-y-1/2 flex justify-between z-20 pointer-events-none">
                                <button onClick={() => setCurrentImageIndex(p => p === 0 ? product.imagenes.length - 1 : p - 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all pointer-events-auto">
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </button>
                                <button onClick={() => setCurrentImageIndex(p => p === product.imagenes.length - 1 ? 0 : p + 1)} className="w-10 h-10 md:w-12 md:h-12 rounded-full glass-panel flex items-center justify-center hover:bg-orange-500 hover:text-black transition-all pointer-events-auto">
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 md:gap-4 mt-4 md:mt-6 overflow-x-auto no-scrollbar pb-2">
                            {product.imagenes?.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl border-2 p-1.5 md:p-2 bg-[#050505] transition-all flex-shrink-0 ${currentImageIndex === idx ? 'border-orange-500 orange-glow' : 'border-white/5 opacity-40'}`}
                                >
                                    <img src={img} className="w-full h-full object-contain" alt="thumbnail" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SECCIÓN B: PANEL DE CONFIGURACIÓN */}
                    <div className="w-full lg:w-1/2 flex flex-col">
                        <header className="mb-6 md:mb-10">
                            <h1 className="f-title text-2xl md:text-3xl lg:text-5xl tracking-tighter leading-tight md:leading-none mb-4 md:mb-6 text-white">
                                {product.nombre}
                            </h1>
                            <div className="flex flex-col gap-1 md:gap-2">
                                <div className="flex items-baseline gap-3 md:gap-4">
                                    <span className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter">
                                        ${new Intl.NumberFormat('es-AR').format(currentVariant?.precioMayorista || 0)}
                                    </span>
                                    <span className="f-tech text-[10px] md:text-xs text-orange-500 uppercase font-bold">PRECIO_MAYORISTA</span>
                                </div>
                                {/* PRECIO PÚBLICO REFERENCIA */}
                                <div className="f-tech text-[9px] md:text-[10px] text-zinc-500 mt-1">
                                    PVP SUGERIDO: <span className="line-through">${new Intl.NumberFormat('es-AR').format(currentVariant?.precioAlPublico || 0)}</span>
                                </div>

                                <div className={`f-tech text-[9px] md:text-[10px] flex items-center gap-2 mt-2 ${currentVariant?.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    <FontAwesomeIcon icon={currentVariant?.stock > 0 ? faCheck : faCircleExclamation} />
                                    {currentVariant?.stock > 0 ? `AVAILABLE_STOCK: ${currentVariant.stock} UNITS` : 'OUT_OF_STOCK_VARIANT'}
                                </div>
                            </div>
                        </header>

                        {/* ALERT BOX CONDICIONES (Responsive) */}
                        {wholesaleConfig && (
                            <div className="mb-6 md:mb-8 bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex gap-3 flex-col sm:flex-row items-start">
                                <div className="flex items-center gap-2 mb-1 sm:mb-0">
                                    <FontAwesomeIcon icon={faCircleExclamation} className="text-orange-500" />
                                    <h4 className="text-orange-500 text-[10px] font-black uppercase tracking-widest sm:hidden">CONDICIÓN_VENTA</h4>
                                </div>
                                <div>
                                    <h4 className="hidden sm:block text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">CONDICIÓN DE VENTA</h4>
                                    <p className="text-[11px] md:text-xs text-zinc-300 leading-relaxed text-pretty">
                                        Este precio aplica si tu total supera <strong>${Number(wholesaleConfig.cartTotalMin).toLocaleString('es-AR')}</strong>
                                        {product.aplicarMayoristaPorCantidad && (
                                            <span>, O si llevas <strong>+{wholesaleConfig.productQtyMin} uds</strong> de este artículo.</span>
                                        )}
                                        . Si no, en el checkout aplicará el precio minorista de forma automática.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* SELECTORES DE VARIANTES */}
                        {showSelectors ? (
                            <div className="space-y-8 md:space-y-10 mb-8 md:mb-12">
                                {/* COLORES */}
                                {hasColor && (
                                    <div className="w-full relative">
                                        <span className="f-tech text-[10px] text-zinc-500 uppercase mb-4 md:mb-5 block tracking-[0.3em]">Select_Finish</span>
                                        {/* Contenedor wrapper con ancho máximo referenciado al viewport en celulares */}
                                        <div className="w-full max-w-[calc(100vw-2rem)] md:max-w-none overflow-x-auto pb-4 no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
                                            <div className="inline-flex gap-4 md:gap-5 min-w-max pr-6">
                                                {colors.map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setSelectedColor(c)}
                                                        className={`flex-none w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all block relative ${selectedColor === c ? 'border-orange-500 scale-110 orange-glow z-10' : 'border-white/10 opacity-30 shadow-md'}`}
                                                        style={{ backgroundColor: COLOR_MAP[c.toLowerCase()] || c }}
                                                        title={c}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ALMACENAMIENTO */}
                                {hasStorage && (
                                    <div>
                                        <span className="f-tech text-[10px] text-zinc-500 uppercase mb-4 md:mb-5 block tracking-[0.3em]">Storage_Module</span>
                                        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3">
                                            {availableStorages?.map(s => {
                                                const variantOption = product.variantes?.find(v => v.color === selectedColor && v.almacenamiento === s);
                                                const stockOption = variantOption?.stock || 0;
                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => setSelectedStorage(s)}
                                                        className={`px-4 py-3 md:px-8 md:py-3 rounded-[1rem] md:rounded-[1.5rem] f-tech text-xs transition-all border btn-premium flex flex-col items-center justify-center gap-1 min-h-[4rem] ${selectedStorage === s ? 'bg-orange-500 text-black border-orange-500 font-bold orange-glow' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                                                    >
                                                        <span className="font-bold">{s}</span>
                                                        <span className="text-[8px] opacity-70 tracking-wider">STOCK: {stockOption}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="mb-8 md:mb-12 p-6 md:p-8 glass-panel rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <FontAwesomeIcon icon={faMicrochip} className="text-6xl md:text-7xl" />
                                </div>
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <FontAwesomeIcon icon={faMicrochip} className="text-orange-500" />
                                    <h3 className="f-tech text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hardware_Technical_Report</h3>
                                </div>
                                <p className="f-body text-xs md:text-sm text-zinc-500 leading-relaxed text-pretty">{product.descripcion}</p>
                            </div>
                        )}

                        {/* BOTÓN SECUNDARIO WHATSAPP FLUJO NORMAL */}
                        <div className="mb-8 md:mb-0 md:mt-0">
                            <button onClick={() => window.open('https://wa.me/+543425937358', '_blank')} className="w-full h-14 glass-panel rounded-[1rem] md:rounded-[1.5rem] f-title text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all border border-white/5">
                                <FontAwesomeIcon icon={faWhatsapp} className="text-green-500 text-xl" /> CONSULTA_WHATSAPP
                            </button>
                        </div>

                        {/* PANEL DE ACCIÓN - FIXED BOTTOM EN MOBILE */}
                        <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#050505]/95 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none border-t border-white/10 md:border-none p-4 safe-area-pb pt-4 md:p-0 md:static md:mt-4">
                            <div className="flex gap-2 md:gap-4 w-full">
                                {/* Selector de cantidad solo si hay stock mayorista disponible o es compra normal */}
                                {isWholesaleStockAvailable ? (
                                    <div className="flex items-center glass-panel rounded-[1rem] md:rounded-[1.5rem] px-3 md:px-5 h-14 md:h-16 border border-white/10 md:border-white/5 bg-black/60 md:bg-transparent shadow-lg md:shadow-none">
                                        <button onClick={() => setQuantity(q => Math.max(minWholesaleQty, q - 1))} className="w-8 md:w-10 text-zinc-400 hover:text-orange-500 flex justify-center"><FontAwesomeIcon icon={faMinus} /></button>
                                        <span className="f-title text-xl md:text-2xl w-8 md:w-12 text-center text-white">{quantity}</span>
                                        <button onClick={() => setQuantity(q => Math.min(currentVariant?.stock || 1, q + 1))} className="w-8 md:w-10 text-zinc-400 hover:text-orange-500 flex justify-center"><FontAwesomeIcon icon={faPlus} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center glass-panel rounded-[1rem] md:rounded-[1.5rem] px-4 h-14 md:h-16 border border-red-500/30 bg-red-500/10">
                                        <span className="f-title text-[9px] md:text-xs text-red-400 text-center w-full font-bold">STOCK INSUFICIENTE<br />PARA MAYORISTA</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleAddToCart}
                                    disabled={!currentVariant || currentVariant.stock < 1}
                                    className={`flex-1 rounded-[1rem] md:rounded-[1.5rem] f-title text-[10px] md:text-sm tracking-[0.05em] md:tracking-[0.2em] btn-premium h-14 md:h-16 flex items-center justify-center leading-tight px-2 text-center shadow-lg md:shadow-none ${!currentVariant || currentVariant.stock < 1
                                        ? 'bg-zinc-900 text-zinc-700'
                                        : !isWholesaleStockAvailable
                                            ? 'bg-zinc-800 text-white border border-zinc-600 hover:bg-zinc-700' // Estilo fallback minorista
                                            : 'bg-orange-500 text-black hover:bg-white orange-glow' // Estilo mayorista
                                        }`}
                                    title={!isWholesaleStockAvailable ? "Solo disponible venta unitaria" : "Agregar al pedido mayorista"}
                                >
                                    {currentVariant?.stock > 0
                                        ? (!isWholesaleStockAvailable
                                            ? `UNITARIO ($${(currentVariant?.precioAlPublico || 0).toLocaleString()})`
                                            : 'AGREGAR MAYORISTA')
                                        : 'SIN STOCK'}
                                </button>
                            </div>
                        </div>

                        {/* REPORTE TÉCNICO (DESCRIPCIÓN) - Mostardo abajo si hay selectores */}
                        {showSelectors && (
                            <div className="mt-8 md:mt-12 p-6 md:p-8 glass-panel rounded-[1.5rem] md:rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <FontAwesomeIcon icon={faMicrochip} className="text-6xl md:text-7xl" />
                                </div>
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <FontAwesomeIcon icon={faMicrochip} className="text-orange-500" />
                                    <h3 className="f-tech text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hardware_Technical_Report</h3>
                                </div>
                                <p className="f-body text-xs md:text-sm text-zinc-500 leading-relaxed text-pretty">
                                    {product.descripcion}
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailsWholesale;
