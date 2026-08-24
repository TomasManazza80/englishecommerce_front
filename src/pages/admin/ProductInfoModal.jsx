import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX, FiPackage, FiSearch, FiInfo, FiLayers, FiDollarSign,
  FiChevronLeft, FiChevronRight, FiClock, FiTag, FiTruck, FiBox,
  FiCheckCircle, FiFileText, FiVideo, FiMic
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
  overlay: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-['Inter']",
  modal: "bg-white border border-gray-200 w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl",
  header: "p-6 border-b border-gray-200 flex justify-between items-center bg-white shrink-0",
  title: "font-black text-xl uppercase tracking-tighter text-black flex items-center gap-2",
  body: "flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar bg-white",
  sectionTitle: "text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2",
  infoCard: "bg-gray-50 border border-gray-200 p-4 rounded-2xl flex flex-col justify-between",
  infoLabel: "text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5",
  infoValue: "text-sm text-black font-bold truncate",
  variantCard: "border border-gray-200 bg-gray-50 p-4 rounded-2xl hover:border-black transition-all",
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
      setError("NO SE PUDO OBTENER LOS DETALLES DEL PRODUCTO");
    } finally {
      setLoading(false);
    }
  };

  const fetchByTitle = async (title) => {
    setLoading(true);
    try {
      const cleanTitle = title.split(' (')[0].trim();
      const { data } = await axios.get(`${API_BASE}/products`);
      const found = data.find(p => p.nombre.toLowerCase() === cleanTitle.toLowerCase());
      if (found) {
        setProduct(found);
      } else {
        setError("PRODUCTO NO ENCONTRADO EN LA BASE DE DATOS");
      }
    } catch (err) {
      setError("ERROR DE CONEXIÓN AL SERVIDOR");
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
          {/* HEADER */}
          <div className={styles.header}>
            <div className="flex items-center gap-3">
              <div className="bg-black text-white p-3 rounded-xl flex items-center justify-center">
                <FiPackage size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">FICHA TÉCNICA DEL PRODUCTO</span>
                <h2 className={styles.title}>{loading ? 'CARGANDO...' : (product?.nombre || 'DETALLES')}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors bg-gray-100 hover:bg-gray-200 p-2.5 rounded-xl"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* BODY */}
          <div className={styles.body}>
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
                <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-xs uppercase tracking-widest text-gray-400 animate-pulse">CARGANDO DETALLES...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center border border-red-200 bg-red-50 rounded-2xl">
                <FiInfo className="mx-auto text-red-500 mb-3" size={36} />
                <p className="text-red-600 font-bold text-sm uppercase">{error}</p>
                <p className="text-gray-500 text-xs mt-1">INFORMACIÓN CONSULTADA: {productData}</p>
              </div>
            ) : product && (
              <div className="space-y-8">
                {/* VISTA PRINCIPAL E IMÁGENES */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* GALERÍA DE IMÁGENES */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="aspect-square bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden group">
                      {product.imagenes?.length > 0 ? (
                        <>
                          <img
                            src={optimizeImage(product.imagenes[currentImg], 800)}
                            loading="lazy"
                            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                            alt="preview"
                          />
                          {product.imagenes.length > 1 && (
                            <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setCurrentImg(p => p === 0 ? product.imagenes.length - 1 : p - 1)}
                                className="p-2 bg-white/90 shadow-md border border-gray-200 rounded-full text-black hover:bg-black hover:text-white transition-all"
                              >
                                <FiChevronLeft size={18} />
                              </button>
                              <button
                                onClick={() => setCurrentImg(p => p === product.imagenes.length - 1 ? 0 : p + 1)}
                                className="p-2 bg-white/90 shadow-md border border-gray-200 rounded-full text-black hover:bg-black hover:text-white transition-all"
                              >
                                <FiChevronRight size={18} />
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-300">
                          <FiBox size={50} />
                          <span className="text-[10px] font-bold uppercase tracking-widest mt-2 text-gray-400">SIN IMAGEN</span>
                        </div>
                      )}
                    </div>
                    {product.imagenes?.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {product.imagenes.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImg(i)}
                            className={`w-14 h-14 flex-shrink-0 border-2 rounded-xl p-1 bg-gray-50 overflow-hidden transition-all ${currentImg === i ? 'border-black shadow-sm' : 'border-gray-200 opacity-60 hover:opacity-100'}`}
                          >
                            <img src={optimizeImage(img, 200)} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" alt="thumb" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* DATOS GENERALES */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <h3 className={styles.sectionTitle}><FiLayers /> FICHA GENERAL</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={styles.infoCard}>
                          <span className={styles.infoLabel}><FiTag size={12} /> CATEGORÍA</span>
                          <p className={styles.infoValue}>{product.categoria || 'N/A'}</p>
                        </div>
                        <div className={styles.infoCard}>
                          <span className={styles.infoLabel}><FiPackage size={12} /> MARCA</span>
                          <p className={styles.infoValue}>{product.marca || 'N/A'}</p>
                        </div>
                        <div className={styles.infoCard}>
                          <span className={styles.infoLabel}><FiTruck size={12} /> PROVEEDOR / SUBCATEGORÍA</span>
                          <p className={styles.infoValue}>{product.proveedor || 'N/A'}</p>
                        </div>
                        <div className={styles.infoCard}>
                          <span className={styles.infoLabel}><FiClock size={12} /> ALERTA STOCK</span>
                          <p className={styles.infoValue}>{product.alerta ?? 'N/A'} UNIDADES</p>
                        </div>
                      </div>
                    </div>

                    {/* ESPECIFICACIONES / BENEFICIOS */}
                    <div>
                      <h3 className={styles.sectionTitle}><FiCheckCircle /> ESPECIFICACIONES / BENEFICIOS / TEMARIO</h3>
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                        {product.descripcion && product.descripcion.split('\n').filter(item => item.trim() !== '').length > 0 ? (
                          product.descripcion.split('\n').filter(item => item.trim() !== '').map((item, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
                              <FiCheckCircle className="text-green-500 mt-0.5 shrink-0" size={16} />
                              <span className="text-sm font-medium text-gray-800 leading-snug">{item}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic text-center py-4">Sin especificaciones o beneficios cargados.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VARIANTES Y PRECIOS */}
                {product.variantes?.length > 0 && (
                  <div>
                    <h3 className={styles.sectionTitle}><FiDollarSign /> CONFIGURACIÓN DE PRECIOS Y VARIANTES</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {product.variantes.map((v, i) => {
                        const isUrlColor = (v.color || '').includes('http') || (v.color || '').length > 30;
                        const isUrlStorage = (v.almacenamiento || '').includes('http') || (v.almacenamiento || '').length > 30;
                        
                        const displayColor = isUrlColor ? 'Digital' : (v.color || 'Único');
                        const displayStorage = isUrlStorage ? '' : (v.almacenamiento || '');
                        const isInfoproduct = product.esInfoproducto || isUrlColor || isUrlStorage || (displayColor.toLowerCase() === 'unico' && (!displayStorage || displayStorage.toLowerCase() === 'unico'));
                        const isValidColorCode = v.color && (v.color.startsWith('#') || ['rojo','blanco','negro','azul','gris','oro'].includes(v.color.toLowerCase()));

                        return (
                          <div key={i} className={styles.variantCard}>
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isValidColorCode && (
                                  <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: v.color }}></div>
                                )}
                                <span className="text-xs font-black text-black uppercase truncate" title={`${displayColor} ${displayStorage}`}>
                                  {displayColor} {displayStorage ? `- ${displayStorage}` : ''}
                                </span>
                              </div>
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 border ${isInfoproduct ? 'bg-purple-50 text-purple-700 border-purple-200' : (v.stock <= product.alerta ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-black border-gray-200')}`}>
                                {isInfoproduct ? 'DIGITAL' : `STOCK: ${v.stock}`}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              {!isInfoproduct && Number(v.costoDeCompra || 0) > 0 && (
                                <div className="flex justify-between text-gray-500">
                                  <span>COSTO:</span>
                                  <span className="font-bold text-black">${Number(v.costoDeCompra).toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-black font-bold">
                                <span>VENTA PÚBLICO:</span>
                                <span className="text-sm font-black text-black">${Number(v.precioAlPublico || product.precioVenta || product.precioInfoproducto || 0).toLocaleString()}</span>
                              </div>
                              {!isInfoproduct && Number(v.precioMayorista || 0) > 0 && (
                                <div className="flex justify-between text-gray-500">
                                  <span>MAYORISTA:</span>
                                  <span className="font-bold text-black">${Number(v.precioMayorista).toLocaleString()}</span>
                                </div>
                              )}
                              {!isInfoproduct && Number(v.precioRevendedor || 0) > 0 && (
                                <div className="flex justify-between text-gray-500">
                                  <span>REVENDEDOR:</span>
                                  <span className="font-bold text-black">${Number(v.precioRevendedor).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ARCHIVOS INFOPRODUCTO / ACTIVIDADES (SI ES CURSO) */}
                {(product.archivosInfoproducto?.length > 0 || product.speakingActivities?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.archivosInfoproducto?.length > 0 && (
                      <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl">
                        <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest block mb-3">ARCHIVOS Y MATERIALES DEL CURSO ({product.archivosInfoproducto.length})</span>
                        <div className="space-y-2 max-h-[140px] overflow-y-auto no-scrollbar">
                          {product.archivosInfoproducto.map((arch, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-purple-100">
                              {arch.tipo === 'video' ? <FiVideo className="text-purple-600 shrink-0" size={16} /> : <FiFileText className="text-purple-600 shrink-0" size={16} />}
                              <span className="text-xs font-bold text-gray-800 truncate flex-1">{arch.nombre || `Archivo ${idx + 1}`}</span>
                              <a href={arch.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-purple-600 hover:underline">Ver</a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {product.speakingActivities?.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest block mb-3">EVALUACIONES DE PRONUNCIACIÓN ({product.speakingActivities.length})</span>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100">
                          <FiMic className="text-blue-600 shrink-0" size={20} />
                          <span className="text-xs font-bold text-gray-800">{product.speakingActivities.length} Actividad(es) asignada(s)</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t border-gray-200 bg-white flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-8"
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
