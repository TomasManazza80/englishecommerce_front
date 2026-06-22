import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrashAlt, faArrowLeft, faCheckCircle, faTruck, faMapMarkerAlt, faChevronRight, faShoppingBag, faLock } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Add_to_cart, Remove_from_cart, Update_cart, Clear_cart } from "../../store/redux/cart/CartActionType";

// Definimos las acciones del carrito
const cartActions = {
    add: (item) => ({ type: Add_to_cart, payload: item }),
    remove: (id) => ({ type: Remove_from_cart, payload: id }),
    update: (item) => ({ type: Update_cart, payload: item }),
    clear: () => ({ type: Clear_cart }),
};

const API_URL = import.meta.env.VITE_API_URL;

const FedecellCartStyle = `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&family=Inter:wght@500&family=JetBrains+Mono&display=swap');

.fedecell-title { font-family: 'Montserrat', sans-serif; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; }
.fedecell-body { font-family: 'Inter', sans-serif; font-weight: 500; }
.fedecell-tech { font-family: 'JetBrains Mono', monospace; }

.solid-card {
    background: #0D0D0D; 
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.solid-card:hover {
    border-color: #ff8c00;
}

.glass-input {
    background: #151515;
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;
    color: white;
}

.glass-input:focus {
    border-color: #ff8c00;
    outline: none;
    box-shadow: 0 0 20px rgba(255, 140, 0, 0.1);
}

.zoom-80 {
    transform-origin: top center;
    transform: scale(0.8);
    width: 125%; 
    margin-left: -12.5%;
}

.bg-grid {
    background-image: radial-gradient(rgba(255, 140, 0, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
}
`;

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

const itemAnimation = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
};

function CartWholesale() {
    const cart = useSelector((state) => state.cart);
    const dispatch = useDispatch();

    const [name, setName] = useState("");
    const [cellphone, setCellphone] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [province, setProvince] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [shippingOption, setShippingOption] = useState("");
    const [shippingCost, setShippingCost] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState("");
    const [notification, setNotification] = useState({ show: false, message: "", type: "" });
    const [mpFee, setMpFee] = useState(0);
    const [allProducts, setAllProducts] = useState([]);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const [gastosRes, productsRes] = await Promise.all([
                    axios.get(`${API_URL}/gastos/global-configs`),
                    axios.get(`${API_URL}/products`)
                ]);

                const fee = gastosRes.data.find(c => c.key === 'mp_fee');
                if (fee) setMpFee(parseFloat(fee.value));

                setAllProducts(productsRes.data || []);
            } catch (err) { console.error("CONFIG_SYNC_ERROR", err); }
        };
        fetchConfigs();
    }, []);

    const formatPrice = (price) => {
        const numericPrice = parseFloat(price);
        if (isNaN(numericPrice)) return "$ 0";
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(numericPrice).replace('ARS', '$');
    };

    const calculateWholesaleCart = () => {
        return cart.map(item => {
            // En modo mayorista, priorizamos precioMayorista
            const wholesalePrice = parseFloat(item.precioMayorista || item.price) || 0;
            const retailPrice = parseFloat(item.precioAlPublico || wholesalePrice) || 0;

            return {
                ...item,
                effectivePrice: wholesalePrice,
                originalPrice: retailPrice,
                isWholesale: true,
                wholesaleReason: 'WHOLESALE_PORTAL'
            };
        });
    };

    const effectiveCart = calculateWholesaleCart();
    const total = effectiveCart.reduce((a, c) => a + c.effectivePrice * c.quantity, 0);

    const handleShippingChange = (e) => {
        const option = e.target.value;
        setShippingOption(option);
        switch (option) {
            case "pickup": setShippingCost(0); break;
            case "capital": setShippingCost(4000); break;
            case "surroundings": setShippingCost(10000); break;
            case "other": setShippingCost(16000); break;
            default: setShippingCost(0);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!shippingOption) return;
        setIsProcessing(true);
        try {
            const response = await axios.post(`${API_URL}/payment/create_payment`, {
                items: effectiveCart.map(item => ({
                    id: item.id || item.ProductId,
                    title: item.title,
                    unit_price: item.effectivePrice,
                    quantity: item.quantity,
                    origenDeVenta: 'Revendedor'
                })),
                shippingCost,
                cellphone,
                name,
                address,
                city,
                province,
                postalCode,
                shippingOption
            });

            dispatch(cartActions.clear());
            window.location.href = response.data.payment_url;
            setPaymentSuccess(true);
        } catch (err) {
            setError("Error al procesar el pago.");
            setIsProcessing(false);
        }
    };

    const finalTotal = total + shippingCost + (mpFee > 0 ? ((total + shippingCost) * (mpFee / 100)) : 0);

    return (
        <div className="min-h-screen bg-black text-white fedecell-body bg-grid pb-20 overflow-x-hidden">
            <style dangerouslySetInnerHTML={{ __html: FedecellCartStyle }} />

            <div className="zoom-80">
                <section className="bg-black py-14 text-center">
                    <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 text-4xl font-black uppercase tracking-tighter text-white md:text-5xl fedecell-title">
                        CARRITO <span className="text-orange-500">MAYORISTA</span>
                    </motion.h1>
                    <p className="mt-2 text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] fedecell-tech">Fede Cell | Portal Revendedores</p>
                    <div className="w-16 h-1 bg-orange-500 mx-auto mt-6 rounded-full"></div>
                </section>

                <div className="container mx-auto px-6">
                    <div className="mb-8">
                        <NavLink to="/revendedores" className="fedecell-tech text-[10px] text-white/40 hover:text-white transition-all uppercase tracking-[0.3em] flex items-center gap-2">
                            <FontAwesomeIcon icon={faArrowLeft} /> VOLVER A REVENDEDORES
                        </NavLink>
                    </div>

                    {cart.length === 0 ? (
                        <div className="py-32 text-center solid-card rounded-3xl border-dashed border-white/10">
                            <p className="fedecell-tech text-white/20 tracking-widest uppercase mb-8 text-sm">Carrito Mayorista Vacío.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-10">
                            <div className="lg:col-span-8 space-y-6">
                                {effectiveCart.map((item) => (
                                    <motion.div key={item.id} variants={itemAnimation} initial="hidden" animate="visible" className="relative solid-card rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 border-orange-500/30 bg-orange-500/5">
                                        <img src={item.image} className="w-32 h-32 object-contain" alt={item.title} />
                                        <div className="flex-1">
                                            <h3 className="fedecell-title text-xl text-white">{item.title}</h3>
                                            <p className="fedecell-tech text-[10px] text-orange-500 uppercase mt-2">PRECIO MAYORISTA ACTIVO</p>
                                        </div>
                                        <div className="text-right flex flex-col gap-2">
                                            <div className="opacity-60 text-[10px]">
                                                <span className="fedecell-tech uppercase block">Unitario Mayorista</span>
                                                <span className="font-bold text-white">{formatPrice(item.effectivePrice)}</span>
                                            </div>
                                            <div>
                                                <p className="fedecell-tech text-[9px] text-white/20 uppercase">Subtotal</p>
                                                <p className="fedecell-title text-2xl text-orange-500">{formatPrice(item.effectivePrice * item.quantity)}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => dispatch(cartActions.remove(item.id))} className="text-red-500/50 hover:text-red-500"><FontAwesomeIcon icon={faTrashAlt} /></button>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="lg:col-span-4">
                                <div className="solid-card rounded-3xl p-8 sticky top-24">
                                    <h2 className="fedecell-title text-2xl mb-8 border-b border-white/5 pb-4">RESUMEN MAYORISTA</h2>
                                    <div className="space-y-4 mb-8">
                                        <div className="flex justify-between items-center"><span className="fedecell-tech text-[10px] text-white/40">SUBTOTAL</span><span className="fedecell-title text-lg">{formatPrice(total)}</span></div>
                                        <div className="flex justify-between items-center"><span className="fedecell-tech text-[10px] text-white/40">ENVÍO</span><span className="fedecell-tech font-bold">{formatPrice(shippingCost)}</span></div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10 mb-8">
                                        <p className="fedecell-tech text-[10px] text-white/30 uppercase">TOTAL FINAL</p>
                                        <p className="fedecell-title text-5xl text-orange-500">{formatPrice(finalTotal)}</p>
                                    </div>
                                    <button onClick={() => setShowForm(true)} className="w-full py-5 bg-orange-500 text-black fedecell-title text-sm rounded-2xl hover:bg-white transition-all uppercase">CHECKOUT MAYORISTA</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="solid-card p-10 rounded-[2.5rem] max-w-lg w-full">
                        <h2 className="fedecell-title text-3xl mb-8 uppercase">Datos de Envío</h2>
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            <input type="text" placeholder="NOMBRE COMPLETO" value={name} onChange={(e) => setName(e.target.value)} required className="glass-input w-full px-6 py-4 rounded-xl fedecell-tech text-[11px]" />
                            <input type="tel" placeholder="CELULAR" value={cellphone} onChange={(e) => setCellphone(e.target.value)} required className="glass-input w-full px-6 py-4 rounded-xl fedecell-tech text-[11px]" />
                            <select value={shippingOption} onChange={handleShippingChange} required className="glass-input w-full px-6 py-4 rounded-xl fedecell-tech text-[11px]">
                                <option value="">ELIJA ENVÍO</option>
                                <option value="pickup">RETIRO LOCAL</option>
                                <option value="capital">SANTA FE CAPITAL</option>
                                <option value="other">RESTO PAÍS</option>
                            </select>
                            <button type="submit" disabled={isProcessing} className="w-full py-5 bg-white text-black fedecell-title text-sm rounded-2xl">{isProcessing ? "PROCESANDO..." : "PAGAR AHORA"}</button>
                            <button type="button" onClick={() => setShowForm(false)} className="w-full text-white/40 text-[10px] uppercase mt-4">Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartWholesale;
