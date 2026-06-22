import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faTrashAlt, faArrowLeft, faCheckCircle, faShoppingBag } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import { Add_to_cart, Remove_from_cart, Update_cart, Clear_cart } from "../../store/redux/cart/CartActionType";

const cartActions = {
  add: (item) => ({ type: Add_to_cart, payload: item }),
  remove: (id) => ({ type: Remove_from_cart, payload: id }),
  update: (item) => ({ type: Update_cart, payload: item }),
  clear: () => ({ type: Clear_cart }),
};

const API_URL = import.meta.env.VITE_API_URL;

const slideUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } };
const itemAnimation = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function Cart() {
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
  const [wholesaleConfig, setWholesaleConfig] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [shippingRates, setShippingRates] = useState({ retiroEnLocal: 0, santaFeCapital: 0, alrededores: 0, restoDelPais: 0 });

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const [gastosRes, shipRes, configRes, productsRes] = await Promise.all([
          axios.get(`${API_URL}/gastos/global-configs`),
          axios.get(`${API_URL}/gastos/shipping-rates`),
          axios.get(`${API_URL}/wholesale-config`),
          axios.get(`${API_URL}/products`)
        ]);

        const fee = gastosRes.data.find(c => c.key === 'mp_fee');
        if (fee) setMpFee(parseFloat(fee.value));

        if (shipRes.data && shipRes.data.length > 0) {
          const rates = { ...shippingRates };
          shipRes.data.forEach(r => {
            if (r.zona === 'local') rates.retiroEnLocal = r.costo;
            if (r.zona === 'alrededores') rates.alrededores = r.costo;
            if (r.zona === 'provincia') rates.santaFeCapital = r.costo;
            if (r.zona === 'nacional') rates.restoDelPais = r.costo;
          });
          setShippingRates(rates);
        }

        setWholesaleConfig(configRes.data);
        setAllProducts(productsRes.data || []);
      } catch (err) { console.error("CONFIG_SYNC_ERROR", err); }
    };
    fetchConfigs();
  }, []);

  const showNotification = (message, type = "info") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "" }), 4000);
  };

  const formatPrice = (price) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return "$ 0";
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(numericPrice).replace('ARS', '$');
  };

  const getProductData = (item) => {
    const searchId = item.ProductId || item.id;
    const rawId = (typeof searchId === 'string' && searchId.includes('-')) ? searchId.split('-')[0] : searchId;
    const product = allProducts.find(p => (p.id?.toString() == rawId?.toString()) || (p._id?.toString() == rawId?.toString()));
    if (!product) return null;

    let variantes = [];
    try {
      if (Array.isArray(product.variantes)) variantes = product.variantes;
      else if (typeof product.variantes === 'string') variantes = JSON.parse(product.variantes);
    } catch (e) { console.error("Error parsing variantes", e); }

    const variant = variantes.find(v => (v.color || "").toLowerCase() === (item.color || "").toLowerCase() && (v.almacenamiento || "").toLowerCase() === (item.storage || "").toLowerCase());
    return { product, variant };
  };

  const calculateEffectiveCart = () => {
    if (!wholesaleConfig || allProducts.length === 0) {
      return cart.map(item => {
        const basePrice = parseFloat(item.precioAlPublico || item.precioVenta || item.price) || 0;
        return { ...item, effectivePrice: basePrice, originalPrice: basePrice, isWholesale: false, tasaEcommerce: null };
      });
    }

    const currentRetailTotal = cart.reduce((acc, item) => {
      const p = parseFloat(item.precioAlPublico || item.price) || 0;
      return acc + (p * item.quantity);
    }, 0);
    const isGlobalWholesale = currentRetailTotal >= parseFloat(wholesaleConfig.cartTotalMin);

    return cart.map(item => {
      const data = getProductData(item);
      const product = data?.product;
      const variant = data?.variant;

      const retailPrice = parseFloat(variant?.precioAlPublico || item.precioAlPublico || item.precioVenta || item.price) || 0;
      const wholesalePrice = parseFloat(variant?.precioMayorista || item.precioMayorista || retailPrice) || 0;

      let applyWholesale = false;
      if (isGlobalWholesale) applyWholesale = true;
      if (product?.aplicarMayoristaPorCantidad && item.quantity >= wholesaleConfig.productQtyMin) applyWholesale = true;

      return {
        ...item,
        effectivePrice: applyWholesale ? wholesalePrice : retailPrice,
        originalPrice: retailPrice,
        isWholesale: applyWholesale,
        wholesaleReason: isGlobalWholesale ? 'GLOBAL_TOTAL' : 'QTY_RULE',
        tasaEcommerce: product?.tasaEcommerce
      };
    });
  };

  const effectiveCart = calculateEffectiveCart();
  const total = effectiveCart.reduce((a, c) => a + c.effectivePrice * c.quantity, 0);

  const handleShippingChange = (e) => {
    const option = e.target.value;
    setShippingOption(option);
    switch (option) {
      case "pickup": setShippingCost(shippingRates.retiroEnLocal || 0); break;
      case "capital": setShippingCost(shippingRates.santaFeCapital || 0); break;
      case "surroundings": setShippingCost(shippingRates.alrededores || 0); break;
      case "other": setShippingCost(shippingRates.restoDelPais || 0); break;
      default: setShippingCost(0);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!shippingOption) return showNotification("Seleccione una opción de envío.", "warning");
    if (!name) return showNotification("Ingrese su nombre.", "warning");
    if (!cellphone) return showNotification("Ingrese su número de celular.", "warning");
    if (shippingOption !== "pickup" && (!address || !city || !province)) return showNotification("Complete sus datos de envío.", "warning");
    if (cellphone.length < 10) return showNotification("Ingrese un número de celular válido (10 dígitos).", "warning");

    await createPayment();
  };

  const createPayment = async () => {
    setIsProcessing(true);

    let userEmail = null;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userEmail = decoded.email;
      } catch (err) { console.error("Error decoding token", err); }
    }

    try {
      await axios.post(`${API_URL}/ecommerce/pedidos`, {
        items: effectiveCart.map(item => ({
          productId: item.ProductId || item.id || item._id,
          title: item.title || item.nombre,
          unit_price: item.effectivePrice,
          quantity: item.quantity,
          color: item.color,
          storage: item.storage,
          origenDeVenta: item.origenDeVenta || 'ecommerce'
        })),
        shippingCost: shippingCost, cellphone: cellphone, name: name, address: address, city: city, province: province, postalCode: postalCode, shippingOption: shippingOption, total: finalTotal, userEmail: userEmail
      });

      const response = await axios.post(`${API_URL}/payment/create_payment`, {
        items: effectiveCart.map(item => ({
          id: item.id || item.ProductId || item._id,
          title: item.title || item.nombre,
          unit_price: item.effectivePrice,
          quantity: item.quantity,
          color: item.color,
          storage: item.storage,
          origenDeVenta: item.origenDeVenta || 'ecommerce'
        })),
        shippingCost: shippingCost, cellphone: cellphone, name: name, address: address, city: city, province: province, postalCode: postalCode, shippingOption: shippingOption, userEmail: userEmail
      });

      setTimeout(() => {
        dispatch(cartActions.clear());
        window.location.href = response.data.payment_url;
        setPaymentSuccess(true);
      }, 800);

    } catch (err) {
      console.error(err);
      setError("Error al procesar el pago.");
      showNotification("Error al procesar el pago.", "error");
      setIsProcessing(false);
    }
  };

  const { finalTotal, mpCharge } = useMemo(() => {
    let totalFeeAmount = 0;

    // 1. Calcular fee para productos (buscando tasa individual)
    effectiveCart.forEach(item => {
      // Si el producto tiene una tasa específica (incluso 0), se usa. Si es null/undefined, se usa la global.
      const itemRate = (item.tasaEcommerce !== null && item.tasaEcommerce !== undefined)
        ? parseFloat(item.tasaEcommerce)
        : mpFee;
      totalFeeAmount += (item.effectivePrice * item.quantity) * (itemRate / 100);
    });

    // 2. Calcular fee para el envío (usa siempre la global)
    if (shippingCost > 0) {
      totalFeeAmount += shippingCost * (mpFee / 100);
    }

    const final = total + shippingCost + totalFeeAmount;
    return { finalTotal: final, mpCharge: totalFeeAmount };
  }, [effectiveCart, total, shippingCost, mpFee]);

  return (
    <div className="min-h-screen bg-[#f4f4f4] text-black pb-72 lg:pb-12 overflow-x-hidden font-sans">

      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[100] px-4 py-3 rounded-xl shadow-lg border bg-white ${notification.type === "error" ? "border-red-500 text-red-600" : notification.type === "warning" ? "border-orange-500 text-orange-600" : "border-green-500 text-green-600"}`}
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon icon={notification.type === "success" ? faCheckCircle : faShoppingBag} />
              <p className="text-[10px] uppercase font-bold tracking-widest">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-[10px] max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* Header Superior Minimalista */}
        <div className="flex items-center justify-between mb-6 sm:mb-10">
          <NavLink to="/products" className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 border border-black/10 text-black/60 hover:text-black hover:bg-black/10 transition-all">
            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          </NavLink>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-black/50">Tu Carrito</span>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-orange-50 text-orange-600 border border-orange-200 shadow-inner">
            <span className="text-xs font-bold">{cart.length}</span>
          </div>
        </div>

        {cart.length === 0 ? (
          <motion.div className="py-20 text-center bg-white rounded-[2rem] border border-black/10 shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4 text-black/20">
              <FontAwesomeIcon icon={faShoppingBag} className="text-2xl" />
            </div>
            <p className="font-medium text-black/60 mb-6">El carrito está vacío</p>
            <NavLink to="/products" className="inline-block px-8 py-3 bg-[#0D0D0D] text-white font-bold text-sm hover:bg-orange-500 transition-all rounded-full shadow-md">Ver Productos</NavLink>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">

            {/* ========================================================= */}
            {/* LISTA DE PRODUCTOS - ESTRUCTURA ESTRICTA HORIZONTAL       */}
            {/* ========================================================= */}
            <div className="lg:col-span-7">
              <div className="space-y-4">
                <AnimatePresence>
                  {effectiveCart.map((item) => (
                    <motion.div
                      key={`${item.id || item.ProductId || item._id}-${item.color}-${item.storage}`}
                      variants={itemAnimation} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative flex flex-row items-stretch gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md ${item.isWholesale ? 'border-orange-500/30 bg-orange-50/30' : 'border-black/5 hover:border-orange-500/50'}`}
                    >
                      {/* 1. Columna Izquierda: Imagen */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#f8f8f8] border border-black/5 rounded-xl flex items-center justify-center p-2 flex-shrink-0 relative overflow-hidden">
                        {item.isWholesale && (
                          <div className="absolute top-0 left-0 bg-orange-500 w-full text-center text-white text-[7px] font-bold py-0.5 uppercase z-10">MAYORISTA</div>
                        )}
                        <img src={item.image} alt={item.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                      </div>

                      {/* 2. Columna Central: Textos y Precio */}
                      <div className="flex flex-col flex-1 min-w-0 justify-center pr-2">
                        {/* Título alineado a la izquierda */}
                        <h3 className="font-bold text-[13px] sm:text-sm text-black leading-tight truncate">{item.title}</h3>

                        {/* Contenedor de Atributos */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {item.color && (
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-sm"
                              style={{ backgroundColor: item.color }}
                              title={`Color: ${item.color}`}
                            />
                          )}
                          {item.color && item.storage && <span className="text-black/20 text-[10px]">•</span>}
                          {item.storage && (
                            <span className="text-[10px] sm:text-xs text-black/50 uppercase font-medium">
                              {item.storage}
                            </span>
                          )}
                        </div>

                        {/* Precio */}
                        <div className="mt-2 flex items-center gap-1.5">
                          {item.isWholesale ? (
                            <>
                              <span className="font-bold text-sm sm:text-base text-orange-600">{formatPrice(item.effectivePrice)}</span>
                              <span className="text-[10px] line-through text-black/40 decoration-red-500">{formatPrice(item.originalPrice)}</span>
                            </>
                          ) : (
                            <span className="font-bold text-sm sm:text-base text-black">{formatPrice(item.effectivePrice)}</span>
                          )}
                        </div>
                      </div>

                      {/* 3. Columna Derecha: Basurero y Contador */}
                      <div className="flex flex-col items-end justify-between flex-shrink-0 w-20">
                        {/* Botón Eliminar Arriba */}
                        <button
                          onClick={() => dispatch(cartActions.remove(item.id || item.ProductId || item._id))}
                          className="text-black/30 hover:text-red-500 transition-colors p-1"
                          title="Eliminar producto"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="text-sm" />
                        </button>

                        {/* Contador Abajo (Cápsula estricta horizontal) */}
                        <div className="inline-flex flex-row items-center justify-between bg-[#f0f0f0] rounded-full p-1 flex-shrink-0 flex-nowrap w-[80px]">
                          <button className="w-6 h-6 flex flex-shrink-0 items-center justify-center text-black/50 hover:text-black rounded-full transition-colors" disabled>
                            <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-black flex-shrink-0">{item.quantity}</span>
                          <button className="w-6 h-6 flex flex-shrink-0 items-center justify-center bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm" disabled>
                            <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* ========================================================= */}
            {/* ORDER SUMMARY (Fijo abajo en celular - Horizontal Adaptable)*/}
            {/* ========================================================= */}
            <div className="lg:col-span-5">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="fixed bottom-0 left-0 w-full z-[90] lg:sticky lg:top-24 lg:w-auto lg:z-10 bg-white rounded-t-[2rem] lg:rounded-[2rem] p-4 pb-6 lg:p-8 border-t border-black/5 shadow-[0_-15px_40px_rgba(0,0,0,0.08)] lg:shadow-md"
              >
                {/* Título solo visible en Desktop */}
                <h2 className="hidden lg:block text-lg font-bold text-black mb-6">Order Summary</h2>

                {/* Contenedor Adaptable: Fila en Móvil, Columna en Desktop */}
                <div className="flex flex-row justify-between items-center lg:flex-col lg:items-stretch lg:space-y-3 mb-4 lg:mb-6 divide-x divide-black/10 lg:divide-x-0 w-full">

                  {/* Subtotal */}
                  <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:items-center flex-1 px-1 lg:px-0">
                    <span className="text-black/50 text-[10px] lg:text-[13px] uppercase lg:normal-case font-medium mb-0.5 lg:mb-0">Subtotal</span>
                    <span className="text-black font-bold lg:font-medium text-xs lg:text-base truncate">{formatPrice(total)}</span>
                  </div>

                  {/* Envío */}
                  <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:items-center flex-1 px-1 lg:px-0">
                    <span className="text-black/50 text-[10px] lg:text-[13px] uppercase lg:normal-case font-medium mb-0.5 lg:mb-0">Envío</span>
                    <span className={`text-[11px] lg:text-base font-bold lg:font-medium truncate ${shippingOption ? "text-orange-600" : "text-black"}`}>
                      {shippingOption ? formatPrice(shippingCost) : "a calcular"}
                    </span>
                  </div>

                  {/* Fee MP (Si aplica) */}
                  {mpCharge > 0 && (
                    <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:items-center flex-1 px-1 lg:px-0">
                      <span className="text-black/50 text-[10px] lg:text-[13px] uppercase lg:normal-case font-medium mb-0.5 lg:mb-0">Fee MP</span>
                      <span className="text-black font-bold lg:font-medium text-xs lg:text-base truncate">{formatPrice(mpCharge)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex flex-col lg:flex-row lg:justify-between items-center lg:items-center flex-1 px-1 lg:px-0 lg:pt-4 lg:border-t lg:border-black/5 lg:mt-3">
                    <span className="text-black/80 text-[10px] lg:text-sm uppercase lg:normal-case font-bold mb-0.5 lg:mb-0">Total</span>
                    <span className="font-black text-orange-500 lg:text-black text-sm lg:text-lg truncate">
                      {shippingOption ? formatPrice(finalTotal) : formatPrice(total)}
                    </span>
                  </div>

                </div>

                {/* Botón de pago */}
                <button onClick={() => setShowForm(true)} className="w-full h-12 lg:h-14 bg-[#0D0D0D] hover:bg-orange-500 text-white hover:text-white font-medium text-[15px] rounded-full transition-all flex items-center justify-center shadow-lg active:scale-95">
                  PAGAR AHORA
                </button>
              </motion.div>
            </div>

          </div>
        )}
      </div>

      {/* MODAL DE DATOS DE ENVÍO */}
      <AnimatePresence>
        {showForm && !paymentSuccess && (
          <motion.div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[200] p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-6 sm:p-8 rounded-[2rem] max-w-lg w-full max-h-[90vh] overflow-y-auto relative border border-black/10 shadow-2xl" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>

              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-xl text-black">Datos de Entrega</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black/50 hover:text-black transition-colors">✕</button>
              </div>

              {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-[10px] mb-4 uppercase text-center font-mono">{error}</p>}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#f9f9f9] border border-black/10 text-sm placeholder:text-black/40 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" placeholder="Nombre y Apellido" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input type="tel" value={cellphone} onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 10) setCellphone(val); }} required className="w-full px-5 py-4 rounded-xl bg-[#f9f9f9] border border-black/10 text-sm placeholder:text-black/40 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" placeholder="Celular (ej: 3424...)" />
                  </div>
                  <div>
                    <select value={shippingOption} onChange={handleShippingChange} required className="w-full px-5 py-4 rounded-xl bg-[#f9f9f9] border border-black/10 text-sm text-black appearance-none cursor-pointer focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all">
                      <option value="">Seleccionar Envío</option>
                      <option value="pickup">Retiro Local - {formatPrice(shippingRates.retiroEnLocal)}</option>
                      <option value="capital">Santa Fe Cap - {formatPrice(shippingRates.santaFeCapital)}</option>
                      <option value="surroundings">Alrededores - {formatPrice(shippingRates.alrededores)}</option>
                      <option value="other">Resto del País - {formatPrice(shippingRates.restoDelPais)}</option>
                    </select>
                  </div>
                </div>

                {shippingOption !== "pickup" && shippingOption !== "" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4 pt-2">
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#f9f9f9] border border-black/10 text-sm placeholder:text-black/40 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" placeholder="Dirección Exacta (Calle y Número)" />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#f9f9f9] border border-black/10 text-sm placeholder:text-black/40 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" placeholder="Ciudad" />
                      <input type="text" value={province} onChange={(e) => setProvince(e.target.value)} required className="w-full px-5 py-4 rounded-xl bg-[#f9f9f9] border border-black/10 text-sm placeholder:text-black/40 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all" placeholder="Provincia" />
                    </div>
                  </motion.div>
                )}

                <div className="pt-6 mt-4">
                  <button type="submit" disabled={isProcessing} className="w-full h-14 bg-[#0D0D0D] text-white hover:bg-orange-500 rounded-full font-bold text-[15px] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                    {isProcessing ? "PROCESANDO..." : "IR A MERCADO PAGO"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE ÉXITO */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[300] flex items-center justify-center p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="bg-white rounded-[2rem] p-10 text-center max-w-sm border border-green-200 w-full shadow-2xl" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl" />
              </div>
              <h3 className="font-bold text-xl text-black mb-2">Reserva Exitosa</h3>
              <p className="text-[13px] text-black/50 mb-0">Redirigiendo al pago seguro...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Cart;