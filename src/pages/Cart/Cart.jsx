import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faMinus,
  faTrashAlt,
  faArrowLeft,
  faCheckCircle,
  faShoppingBag,
  faShieldAlt,
  faLock,
  faCreditCard,
  faGraduationCap,
  faBolt
} from "@fortawesome/free-solid-svg-icons";
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
  const [shippingOption, setShippingOption] = useState("digital");
  const [shippingCost, setShippingCost] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [assignedVerificationCode, setAssignedVerificationCode] = useState(null);
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
          axios.get(`${API_URL}/gastos/global-configs`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/gastos/shipping-rates`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/wholesale-config`).catch(() => ({ data: null })),
          axios.get(`${API_URL}/products`).catch(() => ({ data: [] }))
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
    if (!name) return showNotification("Ingrese su nombre.", "warning");
    if (!cellphone) return showNotification("Ingrese su número de celular.", "warning");
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
      }).catch(err => console.warn("[ORDER_DISPATCH_NOTICE]:", err?.response?.data || err.message));

      const response = await axios.post(`${API_URL}/api/create-preference`, {
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

      const redirectUrl = response.data.init_point || response.data.payment_url;
      if (!redirectUrl) {
        throw new Error("No se obtuvo la URL de pago de Mercado Pago");
      }

      if (response.data.verificationCode) {
        setAssignedVerificationCode(response.data.verificationCode);
        localStorage.setItem("bloom_verification_code", response.data.verificationCode);
        localStorage.setItem("bloom_student_email", userEmail || "");
      }

      setPaymentSuccess(true);
      setTimeout(() => {
        dispatch(cartActions.clear());
        window.location.href = redirectUrl;
      }, 1800);

    } catch (err) {
      console.error(err);
      setError("Error al procesar el pago.");
      showNotification("Error al procesar el pago.", "error");
      setIsProcessing(false);
    }
  };

  const { finalTotal, mpCharge } = useMemo(() => {
    let totalFeeAmount = 0;

    effectiveCart.forEach(item => {
      const itemRate = (item.tasaEcommerce !== null && item.tasaEcommerce !== undefined)
        ? parseFloat(item.tasaEcommerce)
        : mpFee;
      totalFeeAmount += (item.effectivePrice * item.quantity) * (itemRate / 100);
    });

    if (shippingCost > 0) {
      totalFeeAmount += shippingCost * (mpFee / 100);
    }

    const final = total + shippingCost + totalFeeAmount;
    return { finalTotal: final, mpCharge: totalFeeAmount };
  }, [effectiveCart, total, shippingCost, mpFee]);

  return (
    <div className="min-h-screen bg-[#151023] text-on-surface pb-72 lg:pb-24 pt-28 sm:pt-32 overflow-x-hidden font-sans relative isolate">
      {/* Luces de ambiente decorativas sincronizadas con el diseño de la Home */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary-container/20 blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-96 right-10 w-[420px] h-[340px] bg-secondary-container/15 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute bottom-40 left-10 w-[500px] h-[350px] bg-primary-container/15 blur-[140px] pointer-events-none rounded-full" />

      {/* Notificaciones estilo Glassmorphism */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-24 left-4 right-4 sm:left-auto sm:right-8 sm:top-24 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              notification.type === "error"
                ? "border-red-500/40 bg-red-950/80 text-red-200"
                : notification.type === "warning"
                ? "border-amber-500/40 bg-amber-950/80 text-amber-200"
                : "border-emerald-500/40 bg-emerald-950/80 text-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <FontAwesomeIcon
                icon={notification.type === "success" ? faCheckCircle : faShoppingBag}
                className={
                  notification.type === "error"
                    ? "text-red-400"
                    : notification.type === "warning"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }
              />
              <p className="text-xs font-semibold tracking-wide">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera Principal de Checkout con Badge de Confianza */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-high/70 backdrop-blur-md shadow-sm border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-secondary tracking-widest uppercase">
                PASARELA SEGURA &bull; ENCRIPTACIÓN SSL 256-BIT
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Tu Carrito &amp;{" "}
              <span className="bg-gradient-to-r from-bloom-300 via-bloom-200 to-white bg-clip-text text-transparent">
                Checkout Seguro
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/products"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-white border border-white/10 transition-all text-xs font-semibold"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
              <span>Seguir Explorando</span>
            </NavLink>
            <div className="px-3.5 py-2 rounded-full bg-primary/20 border border-primary/30 text-secondary text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
              <FontAwesomeIcon icon={faShoppingBag} className="text-xs" />
              <span>{cart.length} {cart.length === 1 ? 'ítem' : 'ítems'}</span>
            </div>
          </div>
        </div>

        {cart.length === 0 ? (
          /* Estado Vacío con Estilo Glass Apple */
          <motion.div
            className="py-24 text-center bg-surface-container-lowest/80 backdrop-blur-xl rounded-[2.5rem] border border-white/5 shadow-2xl max-w-2xl mx-auto px-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-6 text-primary shadow-[0_0_30px_rgba(124,58,237,0.35)] border border-white/5">
              <FontAwesomeIcon icon={faShoppingBag} className="text-3xl" />
            </div>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Tu carrito está vacío</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Explora nuestros programas certificados y paquetes de IA conversacional para comenzar a potenciar tu fluidez en inglés.
            </p>
            <NavLink
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide text-white bg-bloom-600 hover:bg-bloom-700 shadow-pill transition-all transform hover:-translate-y-0.5"
            >
              <span>Explorar Cursos &amp; Packs</span>
            </NavLink>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* ========================================================= */}
            {/* LISTA DE PRODUCTOS - TARJETAS GLASS DARK                 */}
            {/* ========================================================= */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Cursos &amp; Servicios Seleccionados
                </span>
                <span className="text-xs text-secondary font-medium">Acceso Digital Inmediato</span>
              </div>

              <AnimatePresence>
                {effectiveCart.map((item) => (
                  <motion.div
                    key={`${item.id || item.ProductId || item._id}-${item.color}-${item.storage}`}
                    variants={itemAnimation}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative flex flex-row items-center gap-4 p-4 sm:p-5 bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                      item.isWholesale
                        ? "border-secondary/40 bg-secondary-container/10"
                        : "border-white/5 hover:border-primary/40"
                    }`}
                  >
                    {/* Imagen / Miniatura en marco de cristal */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-surface-container-high/60 border border-white/5 flex items-center justify-center p-2 flex-shrink-0 relative overflow-hidden">
                      {item.isWholesale && (
                        <div className="absolute top-0 left-0 bg-primary w-full text-center text-white text-[8px] font-extrabold py-0.5 tracking-wider uppercase z-10 shadow-sm">
                          PROMO PACK
                        </div>
                      )}
                      <img
                        src={item.image}
                        alt={item.title}
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    </div>

                    {/* Contenido Central: Título y Detalles */}
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm sm:text-base text-on-surface leading-snug truncate">
                          {item.title}
                        </h3>
                      </div>

                      {/* Atributos / Modalidad */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {item.color && (
                          <div
                            className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: item.color }}
                            title={`Color: ${item.color}`}
                          />
                        )}
                        {item.storage && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-secondary border border-white/5">
                            {item.storage}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <FontAwesomeIcon icon={faBolt} className="text-[9px]" /> Tutor IA Activado
                        </span>
                      </div>

                      {/* Precio */}
                      <div className="mt-2.5 flex items-center gap-2">
                        {item.isWholesale ? (
                          <>
                            <span className="font-extrabold text-base sm:text-lg text-secondary">
                              {formatPrice(item.effectivePrice)}
                            </span>
                            <span className="text-xs line-through text-on-surface-variant/60">
                              {formatPrice(item.originalPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="font-extrabold text-base sm:text-lg text-primary">
                            {formatPrice(item.effectivePrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Acciones: Basurero y Cantidad */}
                    <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
                      <button
                        onClick={() => dispatch(cartActions.remove(item.id || item.ProductId || item._id))}
                        className="text-on-surface-variant/50 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
                        title="Eliminar producto"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} className="text-sm" />
                      </button>

                      {/* Contador de Cantidad */}
                      <div className="inline-flex items-center justify-between bg-surface-container-high/80 border border-white/5 rounded-full px-2 py-1 gap-2">
                        <span className="text-xs font-bold text-on-surface px-1">
                          x{item.quantity}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Badges de Confianza al Pie de los Cursos */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-on-surface-variant">
                  <FontAwesomeIcon icon={faShieldAlt} className="text-primary text-base" />
                  <span>Garantía de reembolso de 7 días</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-on-surface-variant">
                  <FontAwesomeIcon icon={faLock} className="text-emerald-400 text-base" />
                  <span>Transacción 100% Encriptada</span>
                </div>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-on-surface-variant">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-secondary text-base" />
                  <span>Certificado oficial incluido</span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* ORDER SUMMARY - RESUMEN CON PASARELA MERCADO PAGO        */}
            {/* ========================================================= */}
            <div className="lg:col-span-5">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={slideUp}
                className="bg-surface-container-lowest/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(124,58,237,0.15)] relative overflow-hidden"
              >
                {/* Resplandor interno de la tarjeta */}
                <div className="absolute -top-24 right-0 w-64 h-64 bg-primary-container/20 blur-[90px] pointer-events-none rounded-full" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                    <h2 className="text-lg font-bold text-on-surface">Resumen de Compra</h2>
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Checkout Seguro
                    </span>
                  </div>

                  <div className="space-y-3.5 mb-6 text-sm">
                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Subtotal Cursos</span>
                      <span className="text-on-surface font-semibold">{formatPrice(total)}</span>
                    </div>

                    <div className="flex justify-between items-center text-on-surface-variant">
                      <span>Entrega</span>
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Acceso Digital Inmediato
                      </span>
                    </div>

                    {mpCharge > 0 && (
                      <div className="flex justify-between items-center text-on-surface-variant">
                        <span>Fee Plataforma Segura</span>
                        <span className="text-on-surface font-semibold">{formatPrice(mpCharge)}</span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                      <div>
                        <span className="text-base font-bold text-on-surface">Total Final</span>
                        <p className="text-[11px] text-on-surface-variant">Impuestos y acceso incluidos</p>
                      </div>
                      <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-bloom-300 via-bloom-100 to-white">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Botón Principal de Pago */}
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full py-4 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-bloom-600 via-purple-600 to-bloom-700 hover:from-bloom-500 hover:to-purple-500 shadow-[0_0_25px_rgba(155,89,182,0.45)] hover:shadow-[0_0_35px_rgba(155,89,182,0.65)] transition-all transform active:scale-95 flex items-center justify-center gap-2.5 group"
                  >
                    <FontAwesomeIcon icon={faLock} className="text-xs group-hover:scale-110 transition-transform" />
                    <span>CONTINUAR AL PAGO SEGURO</span>
                  </button>

                  {/* Sellos de Métodos de Pago y Mercado Pago */}
                  <div className="mt-6 pt-5 border-t border-white/5 text-center">
                    <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                      Medios de pago procesados por Mercado Pago
                    </p>
                    <div className="flex items-center justify-center gap-2 flex-wrap opacity-80">
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white tracking-wider">
                        VISA
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white tracking-wider">
                        MASTERCARD
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white tracking-wider">
                        AMEX
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-cyan-300 tracking-wider">
                        MERCADO PAGO
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-white tracking-wider">
                        DÉBITO / EFECTIVO
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL PASARELA DE PAGO - CHECKOUT APPLE GLASS             */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showForm && !paymentSuccess && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md z-[200] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#18112b]/95 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] max-w-lg w-full relative border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(155,89,182,0.25)] text-on-surface overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              {/* Resplandor decorativo interno del modal */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-32 bg-primary-container/25 blur-[70px] pointer-events-none rounded-full" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4 sm:mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-bold tracking-widest uppercase mb-1.5">
                      <FontAwesomeIcon icon={faShieldAlt} className="text-[10px]" />
                      CHECKOUT OFICIAL &bull; MERCADO PAGO
                    </div>
                    <h2 className="font-extrabold text-2xl text-on-surface tracking-tight">
                      Datos para tu Acceso Digital
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Completá tus datos para asociar la compra y conectar con Mercado Pago.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-on-surface-variant hover:text-white border border-white/10 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="bg-red-950/70 border border-red-500/40 text-red-200 p-3 rounded-xl text-xs mb-3 text-center font-medium">
                    {error}
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-3.5">
                  {/* Badge de Entrega Digital Inmediata */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                    <FontAwesomeIcon icon={faBolt} className="text-sm shrink-0" />
                    <div>
                      <p className="font-bold text-[11px] uppercase tracking-wider">Acceso Digital Inmediato</p>
                      <p className="text-[11px] text-emerald-300/80 mt-0.5 leading-snug">
                        Tus programas y el Tutor IA se activan inmediatamente en tu cuenta tras confirmarse el pago.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      Nombre y Apellido
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-white/30 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                      WhatsApp / Celular
                    </label>
                    <input
                      type="tel"
                      value={cellphone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setCellphone(val);
                      }}
                      required
                      className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-white/30 focus:border-primary focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Ej: 3424123456"
                    />
                  </div>

                  {/* Resumen previo al pago */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5 mt-3">
                    <div className="flex justify-between items-center text-xs text-on-surface-variant">
                      <span>Total de la Orden:</span>
                      <span className="text-base font-extrabold text-white">
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant/70 leading-relaxed">
                      Al hacer clic en pagar, serás redirigido de forma encriptada a Mercado Pago para abonar con tarjeta de crédito, débito o dinero en cuenta con total seguridad.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 rounded-full font-bold text-sm tracking-wide text-white bg-gradient-to-r from-[#009EE3] via-bloom-600 to-purple-600 hover:brightness-110 shadow-[0_0_25px_rgba(0,158,227,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {isProcessing ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>CONECTANDO CON MERCADO PAGO...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faLock} />
                          <span>PAGAR CON MERCADO PAGO</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL DE ÉXITO Y REDIRECCIÓN                              */}
      {/* ========================================================= */}
      <AnimatePresence>
        {paymentSuccess && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-[#18112b] rounded-3xl p-8 sm:p-10 text-center max-w-sm border border-emerald-500/30 w-full shadow-[0_0_50px_rgba(16,185,129,0.3)] text-on-surface relative overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-2xl" />
              </div>
              <h3 className="font-extrabold text-xl text-white mb-2">Conexión Segura Lista</h3>
              {assignedVerificationCode && (
                <div className="my-3 px-3 py-2.5 bg-purple-900/40 border border-purple-500/40 rounded-2xl text-center">
                  <span className="text-[10px] text-purple-300 font-semibold block uppercase tracking-wider">Código de Verificación Asignado</span>
                  <span className="text-lg font-mono font-black text-purple-200 tracking-widest">{assignedVerificationCode}</span>
                </div>
              )}
              <p className="text-xs text-on-surface-variant mb-4">
                Redirigiendo a la plataforma oficial de Mercado Pago para concretar tu pago...
              </p>
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Cart;
