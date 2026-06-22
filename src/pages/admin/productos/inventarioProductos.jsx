import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiSearch, FiAlertTriangle, FiEdit2, FiTrash2, FiX, FiInfo, FiSave, FiLoader, FiPlus, FiTruck, FiActivity
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import ProductInfoModal from '../ProductInfoModal';

// --- CONFIGURACIÓN DE ESTILOS BLANCO Y NEGRO (INTER) ---
const styles = {
  label: "font-['Inter'] text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 block",
  input: "w-full  bg-black border border-zinc-800 rounded-none py-3 px-4 text-white font-['Inter'] font-medium focus:border-white focus:ring-1 focus:ring-white outline-none transition-all duration-300 placeholder:text-zinc-800",
  title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
  techValue: "font-['Inter'] font-bold text-white",
  btnPrimary: "bg-white text-black font-['Inter'] font-black text-[11px] uppercase tracking-widest py-4 px-8 hover:bg-zinc-200 transition-all duration-500 shadow-[0_10px_25px_rgba(255,255,255,0.05)]",
  btnSecondary: "bg-zinc-900 text-white font-['Inter'] font-black text-[11px] uppercase tracking-widest py-4 px-8 hover:bg-zinc-800 transition-all duration-500 border border-zinc-800",
  glassCard: "bg-[#050505] border border-zinc-900 backdrop-blur-2xl",
};

// --- CREDENCIALES CLOUDINARY ---
const CLOUD_NAME = "dxvkqumpu";
const UPLOAD_PRESET = "ecommerce";

// --- UTILIDAD: OPTIMIZACIÓN DE IMÁGENES ---
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

// --- COMPONENTE: FORMULARIO DE EDICIÓN ---
const FormularioEditarModal = ({ producto, onClose, onSave, proveedores, categorias }) => {
  const [editado, setEditado] = useState({
    ...producto,
    variantes: producto.variantes || []
  });
  const [variantInput, setVariantInput] = useState({
    color: '', almacenamiento: '', stock: '', costoDeCompra: '',
    precioAlPublico: '', precioMayorista: '', precioRevendedor: ''
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fileError, setFileError] = useState('');

  // NUEVO ESTADO: Para manejar el input temporal de "Cargar stock nuevo" por cada variante
  const [stockToAdd, setStockToAdd] = useState({});

  const PREDEFINED_COLORS = [
    { name: 'Negro', code: '#1C1C1E' }, { name: 'Blanco', code: '#F5F5F7' },
    { name: 'Rojo', code: '#E11C2A' }, { name: 'Azul', code: '#0071E3' },
    { name: 'Verde', code: '#505652' }, { name: 'Gris', code: '#8E8E93' },
    { name: 'Dorado', code: '#F9E5C9' }, { name: 'Plateado', code: '#E3E4E5' },
    { name: 'Violeta', code: '#E5DDEA' }, { name: 'Grafito', code: '#424245' },
    { name: 'Sierra Azul', code: '#9BB5CE' }, { name: 'Medianoche', code: '#192028' },
    { name: 'Estelar', code: '#FAF7F4' }, { name: 'Titanio', code: '#BEBDB8' },
    { name: 'Deep Purple', code: '#594F63' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditado(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantInput(prev => ({ ...prev, [name]: value }));
  };

  const addVariant = () => {
    if (!variantInput.stock || !variantInput.color) return alert("Color y Stock son requeridos.");
    setEditado(prev => ({
      ...prev,
      variantes: [...prev.variantes, { ...variantInput, stock: Number(variantInput.stock) }]
    }));
    setVariantInput({ color: '', almacenamiento: '', stock: '', costoDeCompra: '', precioAlPublico: '', precioMayorista: '', precioRevendedor: '' });
  };

  const removeVariant = (idx) => {
    setEditado(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveImage = (indexToRemove) => {
    setEditado(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleExistingVariantChange = (index, field, value) => {
    const newVariantes = [...editado.variantes];
    newVariantes[index] = { ...newVariantes[index], [field]: value };
    setEditado(prev => ({ ...prev, variantes: newVariantes }));
  };

  // NUEVAS FUNCIONES: Manejo del input "Cargar stock nuevo"
  const handleStockToAddChange = (index, value) => {
    setStockToAdd(prev => ({ ...prev, [index]: value }));
  };

  const handleAddStock = (index) => {
    const amount = Number(stockToAdd[index]) || 0;
    if (amount !== 0) {
      const currentStock = Number(editado.variantes[index].stock) || 0;
      handleExistingVariantChange(index, 'stock', currentStock + amount);
      setStockToAdd(prev => ({ ...prev, [index]: '' })); // Limpia el input tras agregar
    }
  };

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    setFileError('');
    if (files.length === 0) return;

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setFileError(`NO VÁLIDO: Se detectaron ${invalidFiles.length} archivos que no son imágenes.`);
      return;
    }

    const uploadedUrls = [];
    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: data
        });

        if (response.ok) {
          const fileData = await response.json();
          uploadedUrls.push(fileData.secure_url);
        }
      }
      setEditado(prev => ({
        ...prev,
        imagenes: [...(prev.imagenes || []), ...uploadedUrls].slice(0, 10)
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert("Error al subir imágenes a la nube.");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...editado,
      fechaActualizacionPrecio: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className={`${styles.glassCard} w-full max-w-5xl border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,1)]`}
      >
        <div className="flex justify-between items-center p-6 border-b border-zinc-900 bg-white/[0.02]">
          <h2 className={`${styles.title} text-sm flex items-center`}>
            <FiEdit2 className="mr-3 text-white" /> EDITOR DE PRODUCTO V2.0
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <FiX size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-10 space-y-10 max-h-[85vh] overflow-y-auto custom-scrollbar">

          {/* GALERÍA DE ACTIVOS */}
          <section>
            <label className={styles.label}>Archivos Media (Cloud) ({editado.imagenes?.length || 0}/10)</label>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {editado.imagenes?.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-black border border-zinc-900 group overflow-hidden">
                  <img src={optimizeImage(img, 400)} loading="lazy" alt="preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-zinc-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
              {(!editado.imagenes || editado.imagenes.length < 10) && (
                <label className="aspect-square flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-white hover:bg-white/5 cursor-pointer transition-all text-zinc-700 hover:text-white">
                  <FiPlus size={20} />
                  <input type="file" multiple onChange={handleAddImages} className="hidden" accept="image/*" />
                </label>
              )}
            </div>
            {fileError && (
              <div className="mt-3 bg-zinc-900 border border-zinc-700 text-white text-[10px] font-black p-2 uppercase tracking-widest animate-pulse">
                {fileError}
              </div>
            )}
          </section>

          <div ><label className={styles.label}>Nombre del Dispositivo</label><input name="nombre" value={editado.nombre} onChange={handleChange} className={styles.input} required /></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div><label className={styles.label}>Marca</label><input name="marca" value={editado.marca} onChange={handleChange} className={styles.input} /></div>
              <div>
                <label className={styles.label}>Categoría</label>
                <select name="categoria" value={editado.categoria} onChange={handleChange} className={styles.input} required>
                  <option value="" className="bg-black text-zinc-500">SELECCIONAR...</option>
                  {categorias?.map(c => (
                    <option key={c.categoryId} value={c.categoryName} className="bg-black text-white">{c.categoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label}>Proveedor</label>
                <select name="proveedor" value={editado.proveedor} onChange={handleChange} className={styles.input}>
                  <option value="" className="bg-black text-zinc-500">SELECCIONAR...</option>
                  {proveedores?.map(p => (
                    <option key={p.id} value={p.nombre} className="bg-black text-white">{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* VARIANTES SECTION */}
            <div className="md:col-span-2 bg-white/[0.02] p-6 border border-zinc-900">
              <label className={styles.label}>ADMINISTRADOR DE VARIANTES</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                <div className="relative">
                  <div className={`${styles.input} flex items-center justify-between cursor-pointer px-2 text-xs`} onClick={() => setShowColorPicker(!showColorPicker)}>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-zinc-600" style={{ backgroundColor: variantInput.color || 'transparent' }}></div><span>{variantInput.color || 'COLOR'}</span></div>
                  </div>
                  {showColorPicker && (
                    <div className="absolute top-full z-50 bg-black border border-white/20 p-2 grid grid-cols-4 gap-1">
                      {PREDEFINED_COLORS.map(c => (
                        <button key={c.code} type="button" onClick={() => { setVariantInput(p => ({ ...p, color: c.code })); setShowColorPicker(false); }} className="w-6 h-6 rounded-full border border-zinc-700" style={{ backgroundColor: c.code }} />
                      ))}
                    </div>
                  )}
                </div>
                <input name="almacenamiento" placeholder="CAPACIDAD" value={variantInput.almacenamiento} onChange={handleVariantChange} className={`${styles.input} text-xs`} />
                <input name="stock" type="number" placeholder="STOCK" value={variantInput.stock} onChange={handleVariantChange} className={`${styles.input} text-xs`} />
                <input name="precioAlPublico" type="number" placeholder="$ PÚBLICO" value={variantInput.precioAlPublico} onChange={handleVariantChange} className={`${styles.input} text-xs`} />
                <input name="precioMayorista" type="number" placeholder="$ MAYORISTA" value={variantInput.precioMayorista} onChange={handleVariantChange} className={`${styles.input} text-xs`} />
                <input name="precioRevendedor" type="number" placeholder="$ REVENDEDOR" value={variantInput.precioRevendedor} onChange={handleVariantChange} className={`${styles.input} text-xs`} />
                <input name="costoDeCompra" type="number" placeholder="$ COSTO" value={variantInput.costoDeCompra} onChange={handleVariantChange} className={`${styles.input} text-xs`} />
              </div>
              <button type="button" onClick={addVariant} className="w-full bg-zinc-900 text-white text-[9px] font-black uppercase py-2 hover:bg-white hover:text-black mb-4 transition-colors border border-zinc-800">AGREGAR VARIANTE</button>

              <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
                {editado.variantes?.map((v, i) => (
                  <div key={i} className="flex flex-col gap-2 bg-black p-3 border-l-2 border-white mb-2 border border-zinc-800">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full inline-block border border-zinc-600" style={{ backgroundColor: v.color }}></span>
                        <span className="font-bold text-white text-[10px] uppercase font-['Inter']">{v.color} - {v.almacenamiento}</span>
                      </div>
                      <button type="button" onClick={() => removeVariant(i)} className="text-zinc-600 hover:text-white transition-colors"><FiTrash2 size={14} /></button>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="text-[8px] font-['Inter'] text-zinc-500 block">STOCK</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => handleExistingVariantChange(i, 'stock', e.target.value)}
                          className="w-full bg-black text-white font-['Inter'] text-[10px] p-1 border border-zinc-800 focus:border-white outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-['Inter'] text-zinc-500 block">PÚBLICO</label>
                        <input
                          type="number"
                          value={v.precioAlPublico}
                          onChange={(e) => handleExistingVariantChange(i, 'precioAlPublico', e.target.value)}
                          className="w-full bg-black text-white font-['Inter'] text-[10px] p-1 border border-zinc-800 focus:border-white outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-['Inter'] text-zinc-500 block">MAYORISTA</label>
                        <input
                          type="number"
                          value={v.precioMayorista}
                          onChange={(e) => handleExistingVariantChange(i, 'precioMayorista', e.target.value)}
                          className="w-full bg-black text-white font-['Inter'] text-[10px] p-1 border border-zinc-800 focus:border-white outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-['Inter'] text-zinc-500 block">REVENDEDOR</label>
                        <input
                          type="number"
                          value={v.precioRevendedor}
                          onChange={(e) => handleExistingVariantChange(i, 'precioRevendedor', e.target.value)}
                          className="w-full bg-black text-white font-['Inter'] text-[10px] p-1 border border-zinc-800 focus:border-white outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-['Inter'] text-zinc-500 block">COSTO</label>
                        <input
                          type="number"
                          value={v.costoDeCompra}
                          onChange={(e) => handleExistingVariantChange(i, 'costoDeCompra', e.target.value)}
                          className="w-full bg-black text-white font-['Inter'] text-[10px] p-1 border border-zinc-800 focus:border-white outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* NUEVO: CARGADOR DE STOCK INDIVIDUAL RÁPIDO */}
                    <div className="flex items-center gap-2 mt-1 pt-2 border-t border-zinc-800">
                      <input
                        type="number"
                        placeholder="CARGAR STOCK NUEVO..."
                        value={stockToAdd[i] || ''}
                        onChange={(e) => handleStockToAddChange(i, e.target.value)}
                        className="flex-1 bg-black text-white font-['Inter'] text-[10px] p-1 border border-zinc-800 focus:border-white outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddStock(i)}
                        className="bg-white text-black font-['Inter'] text-[10px] font-black px-4 py-1.5 hover:bg-zinc-200 transition-colors uppercase whitespace-nowrap"
                      >
                        AGREGAR
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={styles.label}>Stock Total Calculado</label><input value={editado.variantes?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0} readOnly className={`${styles.input} opacity-50`} /></div>
            <div><label className={styles.label}>Alerta de Stock</label><input name="alerta" type="number" value={editado.alerta} onChange={handleChange} className={styles.input} /></div>
          </div>

          <div><label className={styles.label}>Specs</label><textarea name="descripcion" value={editado.descripcion} onChange={handleChange} rows="4" className={styles.input} /></div>

          <div className="pt-10 flex gap-4 border-t border-zinc-900">
            <button type="button" onClick={onClose} className={`flex-1 ${styles.btnSecondary}`}>Descartar Cambios</button>
            <button type="submit" className={`flex-1 ${styles.btnPrimary} flex items-center justify-center gap-3`}>
              <FiSave size={18} /> Sincronizar DB
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};



// --- COMPONENTE PRINCIPAL ---
const InventarioProductos = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productoAEditar, setProductoAEditar] = useState(null);

  const handleEliminarProducto = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: '¿ELIMINAR PRODUCTO?',
        text: "Se borrará de forma permanente del sistema.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffffff',
        cancelButtonColor: '#333333',
        confirmButtonText: 'SÍ, ELIMINAR',
        cancelButtonText: 'CANCELAR',
        background: '#000',
        color: '#fff'
      });

      if (!confirm.isConfirmed) return;

      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);

      if (response.status === 204) {
        setProductos(productos.filter(p => p.id !== id));
        Swal.fire({ title: 'ÉXITO', text: 'Producto eliminado correctamente.', icon: 'success', background: '#000', color: '#fff', confirmButtonColor: '#ffffff' });
      }
    } catch (err) {
      console.error("Error al eliminar:", err);

      // Si el backend responde que necesita password por stock (403 o CODE especifico)
      if (err.response?.data?.code === 'REQUIRE_ADMIN_PASS' || err.response?.status === 403) {
        const { value: pass } = await Swal.fire({
          title: 'SEGURIDAD: STOCK DETECTADO',
          text: 'Este producto tiene unidades disponibles. Ingrese contraseña maestra para forzar eliminación:',
          input: 'password',
          inputPlaceholder: 'Password...',
          showCancelButton: true,
          background: '#0a0a0a',
          color: '#fff',
          confirmButtonColor: '#ffffff',
          cancelButtonColor: '#333333'
        });

        if (pass) {
          try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`, {
              data: { adminPassword: pass }
            });
            setProductos(productos.filter(p => p.id !== id));
            Swal.fire({ title: 'BORRADO FORZADO', icon: 'success', background: '#000', color: '#fff', confirmButtonColor: '#ffffff' });
          } catch (e) {
            Swal.fire({ title: 'ERROR', text: 'Contraseña incorrecta o fallo de sistema.', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#ffffff' });
          }
        }
      } else {
        Swal.fire({ title: 'ERROR', text: 'No se pudo eliminar el item.', icon: 'error', background: '#000', color: '#fff', confirmButtonColor: '#ffffff' });
      }
    }
  };

  const obtenerProductos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      setProductos(response.data);
      setError(null);
    } catch (err) {
      setError("ERROR DE CONEXIÓN");
    } finally {
      setLoading(false);
    }
  };

  const obtenerProveedores = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/providers`);
      setProveedores(res.data);
    } catch (err) {
      console.error("Error al cargar proveedores", err);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      setCategorias(res.data);
    } catch (err) {
      console.error("Error al cargar categorías", err);
    }
  };

  useEffect(() => { obtenerProductos(); obtenerProveedores(); obtenerCategorias(); }, []);

  const handleGuardarEdicion = async (datos) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/products/${datos.id}`, datos);
      setProductos(productos.map(p => p.id === datos.id ? datos : p));
      setProductoAEditar(null);
      if (selectedProduct) setSelectedProduct(datos);
    } catch (err) {
      alert("FALLO EN ACTUALIZACIÓN");
    }
  };

  const productosFiltrados = useMemo(() => {
    const searchTerms = busqueda.toLowerCase().split(' ').filter(term => term.trim() !== '');

    if (searchTerms.length === 0) {
      return productos;
    }

    return productos.filter(p => {
      const productText = [
        p.nombre,
        p.marca,
        p.categoria
      ].join(' ').toLowerCase();
      return searchTerms.every(term => productText.includes(term));
    });
  }, [productos, busqueda]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <FiLoader className="animate-spin text-white mb-6" size={40} />
      <span className="font-['Inter'] text-[10px] text-zinc-500 tracking-[0.6em] uppercase">Sincronizando Base de Datos...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-['Inter'] selection:bg-white selection:text-black animate-in fade-in duration-700">
      {/* HEADER CONTROL */}
      <div className="flex flex-wrap justify-between items-center gap-10 mb-20">
        <div>
          <h2 className={`${styles.title} text-2xl md:text-4xl`}>CONTROL DE <span className="text-white">INVENTARIO</span></h2>
          <p className="font-['Inter'] font-bold text-[9px] text-zinc-600 tracking-[0.5em] mt-2 uppercase">Sistema Online // {productos.length} Productos</p>
        </div>

        <div className="relative w-full max-w-2xl group">
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className={`${styles.input} pl-14 py-5 border-zinc-900 bg-zinc-950/50 group-hover:border-white/40 text-lg`}
            placeholder="CONSULTAR BASE DE DATOS..."
          />
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-hover:text-white transition-colors" size={24} />
        </div>
      </div>

      {/* GRID */}
      <div className={`${styles.glassCard} overflow-x-auto custom-scrollbar`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest">Imagen</th>
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest">Producto</th>
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest text-right">Precios</th>
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest text-center">Stock</th>
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest">Proveedor</th>
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest text-center">Últ. Act.</th>
              <th className="p-4 font-['Inter'] text-[10px] text-zinc-400 uppercase tracking-widest text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="font-['Inter'] text-[11px]">
            {productosFiltrados.map(producto => {
              const totalStock = producto.variantes?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || producto.cantidad || 0;
              const precioPublico = producto.variantes?.[0]?.precioAlPublico || producto.precioVenta || 0;
              const costoCompra = producto.variantes?.[0]?.costoDeCompra || producto.precioCompra || 0;

              return (
                <tr
                  key={producto.id}
                  onClick={() => setSelectedProduct(producto)}
                  className="border-b border-zinc-900 hover:bg-zinc-900/80 cursor-pointer transition-colors"
                  title="Clic para ver detalles"
                >
                  <td className="p-2 align-middle">
                    <div className="w-16 h-16 bg-black flex items-center justify-center overflow-hidden rounded-sm border border-zinc-800">
                      {producto.imagenes?.length > 0 ? (
                        <img src={optimizeImage(producto.imagenes[0], 200)} loading="lazy" alt={producto.nombre} className="w-full h-full object-contain grayscale hover:grayscale-0 transition-all duration-300" />
                      ) : (
                        <FiPackage className="text-zinc-700" size={24} />
                      )}
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="text-[9px] text-zinc-400 uppercase font-black">{producto.marca}</span>
                    <h4 className="font-bold text-sm uppercase text-white leading-tight mt-1">{producto.nombre}</h4>
                    <span className="text-[9px] text-zinc-600 block mt-1">{producto.categoria}</span>
                  </td>
                  <td className="p-4 text-right align-middle font-['Inter']">
                    <div className="text-xs text-zinc-500">Costo: <span className="text-zinc-400">${Number(costoCompra).toLocaleString()}</span></div>
                    <div className="text-sm font-bold text-white mt-1">PVP: <span>${Number(precioPublico).toLocaleString()}</span></div>
                  </td>
                  <td className="p-4 text-center align-middle">
                    <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${totalStock <= producto.alerta ? 'bg-white text-black border-white' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
                      {totalStock}
                    </div>
                  </td>
                  <td className="p-4 text-xs text-zinc-500 uppercase align-middle">{producto.proveedor || 'N/A'}</td>
                  <td className="p-4 text-xs text-zinc-500 uppercase align-middle font-['Inter'] text-center">
                    {new Date(producto.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center align-middle">
                    <div className="flex justify-center items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setSelectedProduct(producto)} className="p-2 bg-black border border-zinc-800 hover:border-white hover:text-white rounded-full transition-all" title="Ver Detalles"><FiInfo size={14} /></button>
                      <button onClick={() => setProductoAEditar(producto)} className="p-2 bg-black border border-zinc-800 hover:border-white hover:text-white rounded-full transition-all" title="Editar"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleEliminarProducto(producto.id)} className="p-2 bg-black border border-zinc-800 hover:border-white hover:text-white rounded-full transition-all" title="Eliminar"><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedProduct && <ProductInfoModal productData={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        {productoAEditar && <FormularioEditarModal producto={productoAEditar} proveedores={proveedores} categorias={categorias} onClose={() => setProductoAEditar(null)} onSave={handleGuardarEdicion} />}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
      `}</style>
    </div>
  );
};

export default InventarioProductos;