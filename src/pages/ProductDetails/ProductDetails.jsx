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
  faChevronLeft,
  faChevronRight,
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

  const cleanVariantText = (text) => {
    if (!text || typeof text !== 'string') return '';
    if (text.toLowerCase().includes('http') || text.length > 30) return 'Unico';
    return text;
  };

  const isInfoproduct = Boolean(
    product.esInfoproducto || 
    (product.variantes && product.variantes.some(v => (v.color || '').includes('http') || (v.almacenamiento || '').includes('http')))
  );

  const colors = [...new Set((product.variantes || []).map(v => cleanVariantText(v.color)))].filter(Boolean);

  const availableStorages = (product.variantes || [])
    .filter(v => cleanVariantText(v.color) === selectedColor)
    .map(v => cleanVariantText(v.almacenamiento)).filter(Boolean);

  const currentVariant = (product.variantes || []).find(
    v => cleanVariantText(v.color) === selectedColor && cleanVariantText(v.almacenamiento) === selectedStorage
  ) || product.variantes?.[0];

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
  const showSelectors = !isInfoproduct && (hasColor || hasStorage);

  const handleAddToCart = () => {
    if (!currentVariant || currentVariant.stock < 1) return;

    const basePrice = Number(currentVariant?.precioAlPublico || product.precioVenta || product.precioInfoproducto) || 0;
    const wholePrice = Number(currentVariant?.precioMayorista) || basePrice;

    dispatch(Add({
      ProductId: product.id,
      id: `${product.id}-${selectedColor || 'unico'}-${selectedStorage || 'unico'}`,
      title: product.nombre,
      price: basePrice,
      precioAlPublico: basePrice,
      precioMayorista: wholePrice,
      image: product.imagenes?.[0],
      quantity,
      color: cleanVariantText(selectedColor),
      storage: cleanVariantText(selectedStorage)
    }));

    Swal.fire({ 
      title: "AGREGADO AL CARRITO", 
      icon: "success", 
      background: "#ffffff", 
      color: "#111827", 
      confirmButtonColor: "#9b59b6", 
      showConfirmButton: false, 
      timer: 1500 
    });
  };

  // Helper para renderizar la descripción como items
  const renderDescriptionItems = (desc) => {
    if (!desc) return <p className="text-sm font-medium text-gray-500">Sin descripción disponible.</p>;
    
    // Dividir por saltos de línea y filtrar líneas vacías
    const items = desc.split('\n').filter(item => item.trim() !== '');
    
    return (
      <ul className="flex flex-col gap-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-left">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#9b59b6] flex-shrink-0"></span>
            <span className="text-sm font-medium text-gray-700 leading-relaxed">
              {item.replace(/^-/, '').trim()}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-gray-900 font-sans pt-20 pb-32 md:pb-20 antialiased">
      <div className="container mt-[-100px] mx-auto max-w-6xl px-4 pt-4 md:pt-10">

        <nav className="flex items-center mt-5 gap-3 mb-8 md:mb-10 text-xs font-medium text-gray-700 tracking-wide uppercase">
          <Link to="/" className="hover:text-[#9b59b6] transition-all truncate">INICIO</Link>
          <span className="text-gray-400">/</span>
          <span className="text-[#9b59b6] truncate">{product.categoria || 'PRODUCTO'}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* SECCIÓN A: VISUALIZADOR (GALERÍA) */}
          <div className="w-full lg:w-1/2">
            <div className="relative aspect-square bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center p-6 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 w-full h-full z-10 p-6"
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
              {product.imagenes?.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex(p => p === 0 ? product.imagenes.length - 1 : p - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#9b59b6] font-medium rounded-xl shadow-sm flex items-center justify-center transition-all z-20"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setCurrentImageIndex(p => p === product.imagenes.length - 1 ? 0 : p + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#9b59b6] font-medium rounded-xl shadow-sm flex items-center justify-center transition-all z-20"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* MINIATURAS */}
            {product.imagenes?.length > 1 && (
              <div className="flex gap-4 mt-4 overflow-x-auto no-scrollbar pb-2 justify-center lg:justify-start">
                {product.imagenes?.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-xl border bg-white transition-all flex-shrink-0 flex items-center justify-center p-2
                      ${currentImageIndex === idx 
                        ? 'border-[#9b59b6] shadow-sm ring-1 ring-[#9b59b6] z-10' 
                        : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'}`}
                  >
                    <img src={img} className="w-full h-full object-contain mix-blend-multiply" alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN B: PANEL DE CONFIGURACIÓN */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            
            {/* TARJETA PRINCIPAL (PRECIO, TITULO Y VARIANTS) */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 lg:p-8">
              <header className="mb-6 border-b border-gray-100 pb-6 text-left">
                <span className="inline-block bg-[#f8f3f6] text-[#9b59b6] border border-[#f0dff3] px-3 py-1 rounded-xl text-[10px] font-semibold tracking-wider uppercase mb-3">
                  {product.categoria || 'PRODUCTO'}
                </span>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                  {product.nombre}
                </h1>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[#9b59b6]">
                      ${new Intl.NumberFormat('es-AR').format(currentVariant?.precioAlPublico || product.precioVenta || product.precioInfoproducto || 0)}
                    </span>
                  </div>
                  <div className={`text-xs font-medium flex items-center gap-1.5 ${isInfoproduct || (currentVariant?.stock > 0) ? 'text-[#9b59b6]' : 'text-gray-500'}`}>
                    <FontAwesomeIcon icon={isInfoproduct || (currentVariant?.stock > 0) ? faCheck : faCircleExclamation} className="w-3.5 h-3.5" />
                    {isInfoproduct ? 'Acceso Digital Inmediato' : (currentVariant?.stock > 0 ? `Stock Disponible: ${currentVariant.stock} unidades` : 'Agotado')}
                  </div>
                </div>
              </header>



              {/* PANEL DE ACCIÓN */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                
                {/* CONTADOR */}
                <div className="flex items-center justify-between w-full sm:w-32 h-12 rounded-xl border border-gray-100 bg-[#f8f3f6]">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#9b59b6] transition-colors"
                  >
                    <FontAwesomeIcon icon={faMinus} className="w-3.5 h-3.5" />
                  </button>

                  <span className="font-semibold text-sm text-gray-900">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.min(currentVariant?.stock || 1, q + 1))}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:text-[#9b59b6] transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* BOTÓN AÑADIR A LA BOLSA */}
                <button
                  onClick={handleAddToCart}
                  disabled={!currentVariant || currentVariant.stock < 1}
                  className={`flex-1 w-full h-12 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    !currentVariant || currentVariant.stock < 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#9b59b6] text-white shadow-sm hover:bg-[#8e44ad]'
                  }`}
                >
                  <FontAwesomeIcon icon={faBagShopping} className="w-5 h-5" />
                  <span>
                    {currentVariant?.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                  </span>
                </button>
              </div>

              {/* BOTÓN WHATSAPP */}
              <div className="mt-4 text-left">
                <button onClick={() => window.open('https://wa.me/+543425937358', '_blank')} className="w-full h-12 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#9b59b6] font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={faWhatsapp} className="w-5 h-5 text-[#9b59b6]" /> Consultar Atención Personalizada
                </button>
              </div>
            </div>

            {/* REPORTE / DETALLES DEL PRODUCTO */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 lg:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Descripción del Producto</h3>
              <div className="text-gray-600 font-medium text-sm">
                {renderDescriptionItems(product.descripcion)}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
