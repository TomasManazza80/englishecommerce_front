import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL;

function ProductCard({ products }) {
  const [productsToShow, setProductsToShow] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (price) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericPrice).replace('ARS', '$');
  };

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/products`);
      const sortedData = data.sort(compareName);
      setProductsToShow(sortedData);
    } catch (error) {
      console.error("Error fetching products:", error);
      // Fallback data
      setProductsToShow([
        {
          ProductId: 1,
          nombre: "DIFUSOR LAB MANDARIN ROSE",
          precio: 48500,
          marca: "By Lu Pretruccelli",
          imagenes: [""],
          categoria: "aromatizadores"
        },
        {
          ProductId: 2,
          nombre: "DIFUSOR CLOSSY MANDARIN ROSE",
          precio: 34500,
          marca: "By Lu Pretruccelli",
          imagenes: [""],
          categoria: "aromatizadores"
        },
        {
          ProductId: 3,
          nombre: "DIFUSOR BASE: MANDARIN ROSE",
          precio: 20900,
          marca: "By Lu Pretruccelli",
          imagenes: [""],
          categoria: "aromatizadores"
        },
        {
          ProductId: 4,
          nombre: "REPUESTO PARA DIFUSOR MANDARIN ROSE",
          precio: 32500,
          marca: "By Lu Pretruccelli",
          imagenes: [""],
          categoria: "repuestos"
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function compareName(a, b) {
    return a.nombre.localeCompare(b.nombre);
  }

  useEffect(() => {
    if (!products) {
      fetchProducts();
    } else {
      setProductsToShow(products);
      setLoading(false);
    }
  }, [products]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-[#ff8c00]/20 border-t-[#ff8c00] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(255,140,0,0.3)]"></div>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.5em] animate-pulse" style={{ fontFamily: 'JetBrains Mono' }}>
          INICIALIZANDO_SISTEMAS...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <div className="container mx-auto px-4 py-20">

        {/* HEADER SECTION */}
        {!products && (
          <div className="relative mb-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block"
            >
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-white mb-4 italic"
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
                FEDE_<span className="text-[#ff8c00]">EQUIPOS</span>
              </h1>
              <div className="flex items-center justify-center gap-4">
                <div className="h-[1px] w-12 bg-[#ff8c00]/30"></div>
                <p className="text-[10px] font-bold tracking-[0.6em] uppercase text-white/40"
                  style={{ fontFamily: 'JetBrains Mono' }}>
                  BASE_DATOS_V2.6
                </p>
                <div className="h-[1px] w-12 bg-[#ff8c00]/30"></div>
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productsToShow.length === 0 ? (
            <div className="col-span-full text-center py-24 border border-white/5 bg-white/[0.02] rounded-3xl">
              <p className="text-white/20 text-xs font-bold tracking-[0.4em] uppercase"
                style={{ fontFamily: 'JetBrains Mono' }}>
                RESULTADOS_NULOS_SECTOR_7
              </p>
            </div>
          ) : (
            productsToShow.map((product) => {
              const {
                id = product.ProductId,
                nombre = "EQUIPO_NO_NOMBRADO",
                categoria = "HARDWARE",
                imagenes = [],
                variantes = []
              } = product;

              const safeId = id ? String(id).padStart(4, '0') : "0000";
              const stockVariant = variantes.find(v => Number(v.stock) > 0) || (variantes.length > 0 ? variantes[0] : null);

              // Buscamos precio en variantes, luego en el objeto raíz (precio o precioVenta)
              const price = stockVariant?.precioAlPublico || product.precio || product.precioVenta || 0;

              const totalStock = variantes.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
              const isAvailable = totalStock > 0 || (price > 0 && variantes.length === 0);
              const displayImage = imagenes.length > 0 ? imagenes[0] : null;

              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="group relative bg-[#0a0a0a] min-h-[500px] flex flex-col rounded-2xl overflow-hidden border border-white/5 
                             hover:border-[#ff8c00]/40 transition-all duration-500 shadow-2xl hover:shadow-[#ff8c00]/10 hover:-y-2"
                >
                  <Link to={`/product/${id || product.ProductId}`} className="flex-grow flex flex-col">
                    {/* CARD HEADER */}
                    <div className="p-4 flex justify-between items-start z-10 transition-opacity">
                      <span className="text-[8px] text-white/20 tracking-[0.2em] font-bold uppercase"
                        style={{ fontFamily: 'JetBrains Mono' }}>
                        ID_{safeId}
                      </span>
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-[#ff8c00] rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                      </div>
                    </div>

                    {/* IMAGE CONTAINER */}
                    <div className="relative h-64 w-full flex items-center justify-center p-8">
                      <div className="absolute inset-0 bg-radial-gradient from-[#ff8c00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      {displayImage ? (
                        <motion.img
                          src={displayImage}
                          alt={nombre}
                          className="h-full w-full object-contain relative z-10 drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)]"
                          whileHover={{ scale: 1.08 }}
                        />
                      ) : (
                        <div className="text-white/10 text-[10px] uppercase tracking-widest"
                          style={{ fontFamily: 'JetBrains Mono' }}>
                          SIN_SEÑAL
                        </div>
                      )}
                    </div>

                    {/* PRODUCT INFO */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-[#ff8c00] transition-colors"
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {nombre}
                        </h3>
                      </div>

                      <div className="flex gap-4 mb-2">
                        <div className="flex flex-col">
                          <span className="text-[7px] text-white/30 uppercase tracking-widest mb-1" style={{ fontFamily: 'JetBrains Mono' }}>ESTADO</span>
                          <span className={`text-[9px] font-black uppercase ${isAvailable ? 'text-green-500' : 'text-red-500'}`}>
                            {isAvailable ? 'LISTO' : 'SIN_STOCK'}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-white/5"></div>
                        <div className="flex flex-col">
                          <span className="text-[7px] text-white/30 uppercase tracking-widest mb-1" style={{ fontFamily: 'JetBrains Mono' }}>MODELO</span>
                          <span className="text-[9px] text-white/60 font-black uppercase">{categoria || 'HARDWARE'}</span>
                        </div>
                      </div>

                      <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-[#ff8c00]/60 font-bold uppercase tracking-[0.2em] mb-1" style={{ fontFamily: 'JetBrains Mono' }}>PRECIO_UNIDAD</span>
                          <span className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {formatPrice(price)}
                          </span>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          className="w-10 h-10 bg-[#ff8c00] text-black flex items-center justify-center rounded-sm group-hover:bg-white transition-colors duration-300 shadow-[0_0_20px_rgba(255,140,0,0.2)]"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;