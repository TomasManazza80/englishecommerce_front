import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
  faBagShopping
} from "@fortawesome/free-solid-svg-icons";

import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { motion, AnimatePresence } from "framer-motion";
import { IKContext, IKImage } from "imagekitio-react";

const API_URL = import.meta.env.VITE_API_URL;

// Mapa de colores para renderizar los círculos
const COLOR_MAP = {
  "rojo": "#A50011",
  "blanco": "#F5F5F7",
  "negro": "#1C1C1E",
  "azul": "#273746",
  "gris": "#8E8E93",
  "oro": "#F9E5C9"
};

function ProductDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [product, setProduct] = useState({ variantes: [], imagenes: [] });
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const colors = [...new Set((product.variantes || []).map(v => v.color))];

  const availableStorages = (product.variantes || [])
    .filter(v => v.color === selectedColor)
    .map(v => v.almacenamiento);

  const currentVariant = (product.variantes || []).find(
    v => v.color === selectedColor && v.almacenamiento === selectedStorage
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchProduct();
  }, [id]);

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

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/products/${id}`);
      setProduct(data);
      if (data.variantes?.length > 0) {
        setSelectedColor(data.variantes[0].color);
        setSelectedStorage(data.variantes[0].almacenamiento);
      }
    } catch (error) { console.error("FETCH_ERROR", error); }
  };

  const hasColor = colors.length > 1 || (colors.length === 1 && colors[0] && colors[0].toLowerCase() !== 'unico');
  const hasStorage = availableStorages.length > 1 || (availableStorages.length === 1 && availableStorages[0] && availableStorages[0].toLowerCase() !== 'unico');
  const showSelectors = hasColor || hasStorage;

  const handleAddToCart = () => {
    if (!currentVariant || currentVariant.stock < 1) return;

    const basePrice = Number(currentVariant?.precioAlPublico) || 0;
    const wholePrice = Number(currentVariant?.precioMayorista) || basePrice;

    dispatch(Add({
      ProductId: product.id,
      id: `${product.id}-${selectedColor}-${selectedStorage}`,
      title: `${product.nombre}${selectedColor || selectedStorage ? ` (${(selectedColor || '').toUpperCase()} / ${(selectedStorage || '').toUpperCase()})` : ''}`,
      price: basePrice,
      precioAlPublico: basePrice,
      precioMayorista: wholePrice,
      image: product.imagenes?.[0],
      quantity,
      color: selectedColor,
      storage: selectedStorage
    }));

    Swal.fire({ title: "ADDED TO CART", icon: "success", background: "#f8f3f6", color: "#1d1d1d", confirmButtonColor: "#b273c2", showConfirmButton: false, timer: 1500 });
  };

  return (
    <div className="min-h-screen bg-[#f8f3f6] text-[#1d1d1d] font-sans pt-20 pb-32 md:pb-20 antialiased">
      <div className="container mt-[-120px] mx-auto max-w-6xl px-4 pt-4 md:pt-10">

        <nav className="flex items-center mt-[20px] gap-3 mb-8 md:mb-12 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Link to="/" className="hover:text-[#b273c2] transition-colors truncate">HOME</Link>
          <span className="text-gray-300">/</span>
          <span className="text-[#b273c2] truncate">{product.categoria || 'COURSES'}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">

          {/* SECCIÓN A: VISUALIZADOR (GALERÍA) */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-square bg-white rounded-[35px] border border-[#f0dff3] shadow-xl overflow-hidden flex items-center justify-center p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-0 w-full h-full z-10 p-8"
                >
                  <IKContext urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}>
                    <IKImage
                      src={product.imagenes?.[currentImageIndex] || ""}
                      transformation={[{ width: "800", height: "800", crop: "fill", focus: "auto" }]}
                      loading="lazy"
                      lqip={{ active: true, quality: 20 }}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </IKContext>
                </motion.div>
              </AnimatePresence>

              {/* BOTONES DE NAVEGACIÓN */}
              <button
                onClick={() => setCurrentImageIndex(p => p === 0 ? product.imagenes.length - 1 : p - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#ffffff]/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#b273c2] hover:bg-[#b273c2] hover:text-white transition-all z-20 shadow-sm"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-sm font-light" />
              </button>

              <button
                onClick={() => setCurrentImageIndex(p => p === product.imagenes.length - 1 ? 0 : p + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#ffffff]/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[#b273c2] hover:bg-[#b273c2] hover:text-white transition-all z-20 shadow-sm"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-sm font-light" />
              </button>
            </div>

            <div className="flex gap-4 mt-6 md:mt-8 overflow-x-auto no-scrollbar pb-2 justify-center">
              {product.imagenes?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl border p-2 bg-white transition-all flex-shrink-0 ${currentImageIndex === idx ? 'border-[#b273c2] scale-105 shadow-md z-10' : 'border-[#f0dff3] opacity-60 hover:opacity-100 hover:scale-105'}`}
                >
                  <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt="thumbnail" />
                </button>
              ))}
            </div>
          </div>

          {/* SECCIÓN B: PANEL DE CONFIGURACIÓN */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <header className="mb-10 md:mb-14 text-center lg:text-left">
              <span className="inline-block bg-[#f6edf8] text-[#b273c2] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-4 shadow-sm border border-[#f0dff3] uppercase">
                COURSE DETAILS
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1d] tracking-tight leading-tight mb-6 uppercase">
                {product.nombre}
              </h1>
              <div className="flex flex-col gap-3 items-center lg:items-start">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-[#b273c2]">
                    ${new Intl.NumberFormat('es-AR').format(currentVariant?.precioAlPublico || 0)}
                  </span>
                </div>
                <div className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${currentVariant?.stock > 0 ? 'text-[#b273c2]' : 'text-gray-400'}`}>
                  <FontAwesomeIcon icon={currentVariant?.stock > 0 ? faCheck : faCircleExclamation} />
                  {currentVariant?.stock > 0 ? `AVAILABLE: ${currentVariant.stock} UNITS` : 'OUT OF STOCK'}
                </div>
              </div>
            </header>

            {/* SELECTORES DE VARIANTES */}
            {showSelectors && (
              <div className="space-y-10 mb-12">
                {/* COLORES */}
                {hasColor && (
                  <div className="w-full relative text-center lg:text-left">
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-6 block">COLOR DE PRESENTACIÓN</span>
                    <div className="w-full max-w-[calc(100vw-2rem)] md:max-w-none overflow-x-auto pb-4 no-scrollbar flex justify-center lg:justify-start" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="inline-flex gap-5 min-w-max">
                        {colors.map(c => (
                          <button
                            key={c}
                            onClick={() => setSelectedColor(c)}
                            className={`flex-none w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all block relative ${selectedColor === c ? 'border-[#b273c2] scale-110 shadow-md z-10' : 'border-[#f0dff3] opacity-70 hover:scale-105'}`}
                            style={{ backgroundColor: COLOR_MAP[c.toLowerCase()] || c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ALMACENAMIENTO / PRESENTACIÓN */}
                {hasStorage && (
                  <div className="text-center lg:text-left">
                    <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-6 block">TAMAÑO / PRESENTACIÓN</span>
                    <div className="grid grid-cols-2 md:flex md:flex-wrap gap-4 justify-center lg:justify-start">
                      {availableStorages?.map(s => {
                        const variantOption = product.variantes?.find(v => v.color === selectedColor && v.almacenamiento === s);
                        const stockOption = variantOption?.stock || 0;
                        return (
                          <button
                            key={s}
                            onClick={() => setSelectedStorage(s)}
                            className={`px-6 py-4 rounded-2xl text-[11px] transition-all border flex flex-col items-center justify-center gap-2 min-h-[4.5rem] font-bold tracking-widest uppercase ${selectedStorage === s ? 'bg-[#b273c2] text-white border-[#b273c2] shadow-lg' : 'bg-white text-gray-500 border-[#f0dff3] hover:border-[#b273c2]'}`}
                          >
                            <span className="font-medium tracking-widest">{s}</span>
                            <span className="text-[8px] opacity-70 tracking-widest">STOCK: {stockOption}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showSelectors && (
              <div className="mb-12 p-8 bg-white rounded-[35px] border border-[#f0dff3] text-center shadow-sm">
                <h3 className="text-xs font-bold text-[#b273c2] uppercase tracking-widest mb-4">PRODUCT DETAILS</h3>
                <p className="text-gray-600 font-medium leading-relaxed">
                  {product.descripcion}
                </p>
              </div>
            )}

            {/* PANEL DE ACCIÓN MAESTRO (MAX-IMPACT MOBILE) */}
            <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-[#f0dff3] px-6 pt-4 pb-8 md:static md:p-0 md:mt-6 md:border-none shadow-[0_-10px_20px_rgba(0,0,0,0.02)] md:shadow-none md:bg-transparent">
              <div className="flex flex-col md:flex-row gap-5 w-full items-center">

                {/* CONTADOR */}
                <div className="flex items-center justify-between w-full md:w-40 h-14 rounded-[20px] border border-[#f0dff3] bg-[#f8f3f6]">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-[#b273c2] transition-colors"
                  >
                    <FontAwesomeIcon icon={faMinus} className="text-xs font-light" />
                  </button>

                  <span className="font-black text-lg text-[#1d1d1d]">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(currentVariant?.stock || 1, q + 1))}
                    className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-[#b273c2] transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs font-light" />
                  </button>
                </div>

                {/* BOTÓN AÑADIR A LA BOLSA */}
                <button
                  onClick={handleAddToCart}
                  disabled={!currentVariant || currentVariant.stock < 1}
                  className={`flex-1 w-full h-14 rounded-[20px] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-3 transition-all shadow-xl
        ${!currentVariant || currentVariant.stock < 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-[#b273c2] hover:bg-[#9d5fb0] hover:-translate-y-1 hover:shadow-2xl text-white'}`}
                >
                  <FontAwesomeIcon icon={faBagShopping} className="text-sm" />
                  <span>
                    {currentVariant?.stock > 0 ? 'AÑADIR A LA BOLSA' : 'AGOTADO'}
                  </span>
                </button>

              </div>
            </div>

            {/* BOTÓN WHATSAPP */}
            <div className="mt-8 mb-8 md:mb-0 text-center lg:text-left">
              <button onClick={() => window.open('https://wa.me/+543425937358', '_blank')} className="w-full h-14 rounded-[20px] text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-[#f6edf8] transition-colors border border-[#f0dff3] text-[#b273c2] shadow-sm">
                <FontAwesomeIcon icon={faWhatsapp} className="text-lg" /> ATENCIÓN PERSONALIZADA
              </button>
            </div>

            {/* REPORTE TÉCNICO INFERIOR */}
            {showSelectors && (
              <div className="mt-12 p-8 bg-white rounded-[35px] border border-[#f0dff3] shadow-sm text-center">
                <h3 className="text-xs font-bold text-[#b273c2] uppercase tracking-widest mb-4">MORE INFORMATION</h3>
                <p className="text-gray-600 font-medium leading-relaxed text-sm">
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

export default ProductDetails;