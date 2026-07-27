import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiSearch, FiAlertTriangle, FiEdit2, FiTrash2, FiX, FiInfo, FiSave, FiLoader, FiPlus, FiTruck, FiActivity, FiFile, FiVideo, FiCheckCircle
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import ProductInfoModal from '../ProductInfoModal';
import ActivityManagerModal from '../../../components/admin/ActivityManagerModal';

// --- CONFIGURACIÓN DE ESTILOS (Brutalismo Suave) ---
const styles = {
  label: "font-black text-[10px] text-black uppercase tracking-widest mb-2 block",
  input: "w-full bg-white border border-black rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
  searchInput: "w-full bg-white border border-black rounded-full p-3 pl-12 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
  title: "text-3xl text-black mb-2 font-black tracking-tighter uppercase flex items-center gap-2",
  subtitle: "font-bold tracking-widest uppercase text-gray-500 text-[10px]",
  btnPrimary: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2",
  btnSecondary: "bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-lg transition-all py-3 px-4 flex items-center justify-center gap-2",
  card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
  listItem: "p-3 rounded-xl border transition-all flex items-center justify-between bg-white border-gray-200 hover:border-gray-300",
  alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-gray-100 border-gray-300 text-black text-xs font-bold uppercase",
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
const FormularioEditarModal = ({ producto, onClose, onSave, proveedores, categorias, pronunciationActivities, fetchPronunciationActivities }) => {
  const [editado, setEditado] = useState({
    ...producto,
    variantes: producto.variantes || [],
    archivosInfoproducto: producto.archivosInfoproducto || [],
    speakingActivities: producto.speakingActivities || [],
    esInfoproducto: producto.esInfoproducto || false
  });
  const [variantInput, setVariantInput] = useState({
    color: '', almacenamiento: '', stock: '', costoDeCompra: '',
    precioAlPublico: '', precioMayorista: '', precioRevendedor: ''
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fileError, setFileError] = useState('');
  const [managingActivity, setManagingActivity] = useState(null);

  const [stockToAdd, setStockToAdd] = useState({});
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [activityTab, setActivityTab] = useState('select'); // 'select' o 'create'
  const [activitySearchTerm, setActivitySearchTerm] = useState('');

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

  const handleRemoveCourseFile = (indexToRemove) => {
    setEditado(prev => ({
      ...prev,
      archivosInfoproducto: prev.archivosInfoproducto.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleExistingVariantChange = (index, field, value) => {
    const newVariantes = [...editado.variantes];
    newVariantes[index] = { ...newVariantes[index], [field]: value };
    setEditado(prev => ({ ...prev, variantes: newVariantes }));
  };

  const handleStockToAddChange = (index, value) => {
    setStockToAdd(prev => ({ ...prev, [index]: value }));
  };

  const handleAddStock = (index) => {
    const amount = Number(stockToAdd[index]) || 0;
    if (amount !== 0) {
      const currentStock = Number(editado.variantes[index].stock) || 0;
      handleExistingVariantChange(index, 'stock', currentStock + amount);
      setStockToAdd(prev => ({ ...prev, [index]: '' }));
    }
  };

  const handleAddCourseFiles = async (e) => {
    const files = Array.from(e.target.files);
    setFileError('');
    if (files.length === 0) return;

    const uploadedUrls = [];
    try {
      for (const file of files) {
        const data = new FormData();
        data.append('file', file);
        data.append('upload_preset', UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
          method: 'POST',
          body: data
        });

        if (response.ok) {
          const fileData = await response.json();
          uploadedUrls.push({
            url: fileData.secure_url,
            nombre: file.name,
            tipo: fileData.resource_type === 'image' ? 'imagen' : 
                  fileData.resource_type === 'video' ? 'video' : 'documento'
          });
        }
      }
      setEditado(prev => ({
        ...prev,
        archivosInfoproducto: [...(prev.archivosInfoproducto || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading course files:', error);
      alert("Error al subir archivos a la nube.");
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

  const handleToggleSpeakingActivity = (activityId) => {
    setEditado(prev => {
        const current = prev.speakingActivities || [];
        if (current.includes(activityId)) {
            return { ...prev, speakingActivities: current.filter(id => id !== activityId) };
        } else {
            return { ...prev, speakingActivities: [...current, activityId] };
        }
    });
  };

  const handleCreateActivity = async () => {
    if (!newActivityTitle.trim()) return;
    setIsCreatingActivity(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pronunciation/activities`, {
        title: newActivityTitle.trim(),
        description: 'Actividad creada desde el inventario de productos.',
        assigned_date: new Date().toISOString().split('T')[0]
      });
      
      // Llamar a la función del padre para recargar la lista
      if (fetchPronunciationActivities) {
         await fetchPronunciationActivities();
      }
      
      // Auto-seleccionar la recién creada
      setEditado(prev => ({
          ...prev,
          speakingActivities: [...(prev.speakingActivities || []), res.data.id]
      }));
      setNewActivityTitle('');
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Error al crear la actividad");
    } finally {
      setIsCreatingActivity(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-['Inter']"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className={`${styles.card} w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] bg-white p-0`}
      >
        {managingActivity && (
          <ActivityManagerModal 
            activity={managingActivity} 
            onClose={() => setManagingActivity(null)} 
            onUpdate={fetchPronunciationActivities}
          />
        )}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className={`${styles.title} text-xl mb-0`}>
            <FiEdit2 className="text-black" /> EDITOR DE PRODUCTO
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors bg-gray-50 p-2 rounded-xl">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">

          {/* CONTENIDO DEL CURSO */}
            <section className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
              <label className={`${styles.label} text-purple-700`}>Contenido del Curso (Módulos, PDFs, Videos)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {editado.archivosInfoproducto?.map((archivo, idx) => (
                  <div key={idx} className="relative p-4 bg-white border border-purple-100 rounded-xl flex flex-col items-center gap-2 group hover:shadow-md transition-all text-center">
                    {archivo.tipo === 'video' ? <FiVideo size={32} className="text-purple-600" /> : <FiFile size={32} className="text-purple-600" />}
                    <span className="text-[10px] font-bold text-gray-700 truncate w-full" title={archivo.nombre}>{archivo.nombre || `Archivo ${idx + 1}`}</span>
                    <a href={archivo.url} target="_blank" rel="noreferrer" className="text-[9px] text-purple-500 hover:underline">Ver Original</a>
                    <button type="button" onClick={() => handleRemoveCourseFile(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-600 hover:bg-white cursor-pointer transition-all text-purple-500 hover:text-purple-600 p-4 aspect-square">
                  <FiPlus size={24} />
                  <span className="text-[10px] font-bold uppercase mt-2 text-center">AÑADIR CONTENIDO</span>
                  <input type="file" multiple onChange={handleAddCourseFiles} className="hidden" />
                </label>
              </div>
            </section>

          {/* ACTIVIDADES DE SPEAKING */}
            <section className="bg-blue-50 p-4 sm:p-6 rounded-2xl border border-blue-200">
              {/* TABS DE SELECCIÓN */}
              <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
                  <button 
                      type="button" 
                      onClick={() => setActivityTab('select')} 
                      className={`pb-3 text-xs font-bold uppercase transition-all whitespace-nowrap ${activityTab === 'select' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
                  >
                      Seleccionar Registros Pasados
                  </button>
                  <button 
                      type="button" 
                      onClick={() => setActivityTab('create')} 
                      className={`pb-3 text-xs font-bold uppercase transition-all whitespace-nowrap ${activityTab === 'create' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
                  >
                      Crear Nueva Actividad / Tareas
                  </button>
              </div>

              {/* CONTENIDO DE TABS */}
              {activityTab === 'select' && (
                  <div className="animate-fade-in">
                      <label className={`${styles.label} text-blue-700`}>BUSCAR Y SELECCIONAR ACTIVIDADES DE PRONUNCIACIÓN</label>
                      <input 
                          type="text" 
                          placeholder="BUSCAR ACTIVIDAD..." 
                          value={activitySearchTerm} 
                          onChange={(e) => setActivitySearchTerm(e.target.value)} 
                          className={`${styles.input} mb-4 py-2 text-xs`}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                          {pronunciationActivities && pronunciationActivities
                              .filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase()))
                              .map(act => (
                              <div key={act.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm cursor-pointer" onClick={() => handleToggleSpeakingActivity(act.id)}>
                                  <div className="flex items-center gap-3">
                                      <input 
                                          type="checkbox" 
                                          checked={(editado.speakingActivities || []).includes(act.id)} 
                                          readOnly
                                          className="w-5 h-5 accent-black cursor-pointer flex-shrink-0"
                                      />
                                      <div className="flex flex-col flex-1">
                                          <span className="text-black font-bold text-sm leading-tight">{act.title}</span>
                                          <span className="text-gray-500 text-[10px] mt-1">{act.PronunciationTasks?.length || 0} Tareas</span>
                                      </div>
                                  </div>
                                  <button 
                                      type="button" 
                                      onClick={(e) => { e.stopPropagation(); setManagingActivity(act); }}
                                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-2 transition-colors sm:ml-auto text-xs font-bold w-full sm:w-auto text-center mt-2 sm:mt-0"
                                      title="Gestionar Tareas"
                                  >
                                      TAREAS
                                  </button>
                              </div>
                          ))}
                          {(!pronunciationActivities || pronunciationActivities.filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase())).length === 0) && (
                              <p className="text-gray-500 text-xs italic col-span-full">No se encontraron actividades de speaking.</p>
                          )}
                      </div>
                  </div>
              )}

              {activityTab === 'create' && (
                  <div className="animate-fade-in">
                      <label className={`${styles.label} text-blue-700`}>CREAR Y SELECCIONAR UNA NUEVA ACTIVIDAD EN BLANCO</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                          <input 
                              type="text" 
                              value={newActivityTitle} 
                              onChange={e => setNewActivityTitle(e.target.value)}
                              placeholder="TÍTULO (EJ: LECCIÓN 1)..."
                              className={`${styles.input} flex-1 py-2 text-xs`}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateActivity(); } }}
                          />
                          <button 
                              type="button" 
                              onClick={handleCreateActivity} 
                              disabled={isCreatingActivity || !newActivityTitle.trim()} 
                              className="bg-black text-white font-bold uppercase text-[10px] rounded-xl transition-all py-3 px-6 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                          >
                              {isCreatingActivity ? 'CREANDO...' : <><FiPlus size={14} /> CREAR Y SELECCIONAR</>}
                          </button>
                      </div>
                      <p className="text-gray-400 text-[10px] italic mt-2 text-center sm:text-left">
                          Una vez creada, aparecerá seleccionada en tus registros y podrás agregarle tareas.
                      </p>
                  </div>
              )}
            </section>

          {/* GALERÍA DE ACTIVOS */}
          <section>
            <label className={styles.label}>Archivos Media ({editado.imagenes?.length || 0}/10)</label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {editado.imagenes?.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden group">
                  <img src={optimizeImage(img, 400)} loading="lazy" alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
              {(!editado.imagenes || editado.imagenes.length < 10) && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer transition-all text-gray-500 hover:text-black">
                  <FiPlus size={24} />
                  <span className="text-[8px] font-bold uppercase mt-1">AÑADIR</span>
                  <input type="file" multiple onChange={handleAddImages} className="hidden" accept="image/*" />
                </label>
              )}
            </div>
            {fileError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 ${styles.alertNeutral}`}>
                <FiAlertTriangle size={18} /> {fileError}
              </motion.div>
            )}
          </section>

          <div><label className={styles.label}>Nombre del Producto</label><input name="nombre" value={editado.nombre} onChange={handleChange} className={styles.input} required /></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div><label className={styles.label}>Marca</label><input name="marca" value={editado.marca} onChange={handleChange} className={styles.input} /></div>
              <div>
                <label className={styles.label}>Categoría</label>
                <select name="categoria" value={editado.categoria} onChange={handleChange} className={styles.input} required>
                  <option value="">SELECCIONAR...</option>
                  {categorias?.map(c => (
                    <option key={c.categoryId} value={c.categoryName}>{c.categoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label}>Proveedor</label>
                <select name="proveedor" value={editado.proveedor} onChange={handleChange} className={styles.input}>
                  <option value="">SELECCIONAR...</option>
                  {proveedores?.map(p => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div><label className={styles.label}>Stock Total Calculado</label><input value={editado.variantes?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || editado.cantidad || 0} readOnly className={`${styles.input} bg-gray-100 text-gray-500`} /></div>
            <div><label className={styles.label}>Alerta de Stock Mínimo</label><input name="alerta" type="number" value={editado.alerta} onChange={handleChange} className={styles.input} /></div>
          </div>

          <div><label className={styles.label}>Especificaciones / Descripción</label><textarea name="descripcion" value={editado.descripcion} onChange={handleChange} rows="4" className={styles.input} /></div>

          <div className="pt-6 flex gap-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className={`flex-1 ${styles.btnSecondary} justify-center`}>DESCARTAR</button>
            <button type="submit" className={`flex-1 ${styles.btnPrimary} justify-center`}>
              <FiSave size={18} /> GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
};



// --- COMPONENTE PRINCIPAL ---
const InventarioProductos = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [pronunciationActivities, setPronunciationActivities] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productoAEditar, setProductoAEditar] = useState(null);

  const handleEliminarProducto = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: '¿ELIMINAR PRODUCTO?',
        text: "Esta acción es irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000000',
        cancelButtonColor: '#f3f4f6',
        confirmButtonText: 'SÍ, ELIMINAR',
        cancelButtonText: 'CANCELAR',
        customClass: {
          confirmButton: 'text-white font-bold uppercase text-xs rounded-xl px-4 py-3',
          cancelButton: 'text-black font-bold uppercase text-xs rounded-xl px-4 py-3 border border-gray-300'
        }
      });

      if (!confirm.isConfirmed) return;

      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);

      if (response.status === 204) {
        setProductos(productos.filter(p => p.id !== id));
        Swal.fire({ title: 'ÉXITO', text: 'Producto eliminado correctamente.', icon: 'success', confirmButtonColor: '#000000' });
      }
    } catch (err) {
      console.error("Error al eliminar:", err);

      if (err.response?.data?.code === 'REQUIRE_ADMIN_PASS' || err.response?.status === 403) {
        const { value: pass } = await Swal.fire({
          title: 'SEGURIDAD',
          text: 'Este producto tiene stock. Ingrese contraseña maestra para forzar eliminación:',
          input: 'password',
          inputPlaceholder: 'CONTRASEÑA...',
          showCancelButton: true,
          confirmButtonColor: '#000000',
          cancelButtonColor: '#f3f4f6'
        });

        if (pass) {
          try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`, {
              data: { adminPassword: pass }
            });
            setProductos(productos.filter(p => p.id !== id));
            Swal.fire({ title: 'ELIMINADO', icon: 'success', confirmButtonColor: '#000000' });
          } catch (e) {
            Swal.fire({ title: 'ERROR', text: 'Contraseña incorrecta o fallo de sistema.', icon: 'error', confirmButtonColor: '#000000' });
          }
        }
      } else {
        Swal.fire({ title: 'ERROR', text: 'No se pudo eliminar el item.', icon: 'error', confirmButtonColor: '#000000' });
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

  const obtenerPronunciationActivities = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pronunciation/activities`);
      setPronunciationActivities(res.data);
    } catch (err) {
      console.error("Error al cargar pronunciation activities", err);
    }
  };

  useEffect(() => { obtenerProductos(); obtenerProveedores(); obtenerCategorias(); obtenerPronunciationActivities(); }, []);

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

    if (searchTerms.length === 0) return productos;

    return productos.filter(p => {
      const productText = [
        p.nombre, p.marca, p.categoria
      ].join(' ').toLowerCase();
      return searchTerms.every(term => productText.includes(term));
    });
  }, [productos, busqueda]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white" style={{ fontFamily: '"Inter", sans-serif' }}>
      <FiLoader className="animate-spin text-black mb-6" size={40} />
      <span className="font-bold text-[10px] text-gray-500 tracking-widest uppercase">CARGANDO INVENTARIO...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 lg:p-12" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* HEADER CONTROL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className={styles.title}>INVENTARIO</h2>
          <p className={styles.subtitle}>SISTEMA ONLINE / {productos.length} PRODUCTOS</p>
        </div>

        <div className="relative w-full max-w-xl group">
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className={styles.searchInput}
            placeholder="BUSCAR PRODUCTOS..."
          />
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors" size={20} />
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-8 ${styles.alertNeutral} border-red-200 bg-red-50 text-red-600`}>
          <FiAlertTriangle size={18} /> {error}
        </motion.div>
      )}

      {/* LISTA DE PRODUCTOS */}
      <div className="space-y-4">
        {productosFiltrados.map(producto => {
          const totalStock = producto.variantes?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || producto.cantidad || 0;
          const precioPublico = producto.variantes?.[0]?.precioAlPublico || producto.precioVenta || 0;
          const isLowStock = totalStock <= producto.alerta;

          return (
            <div
              key={producto.id}
              onClick={() => setSelectedProduct(producto)}
              className={`${styles.listItem} cursor-pointer group`}
            >
              <div className="flex items-center gap-6 w-full lg:w-1/3">
                <div className="w-16 h-16 bg-gray-50 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200">
                  {producto.imagenes?.length > 0 ? (
                    <img src={optimizeImage(producto.imagenes[0], 200)} loading="lazy" alt={producto.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FiPackage className="text-gray-300" size={24} /></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{producto.marca} / {producto.categoria}</span>
                  <h4 className="font-bold text-sm uppercase text-black leading-tight mt-1">{producto.nombre}</h4>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end w-1/4">
                <span className="text-[10px] font-bold text-gray-500 uppercase">PVP</span>
                <span className="text-sm font-black text-black">${Number(precioPublico).toLocaleString()}</span>
              </div>

              <div className="hidden md:flex flex-col items-center w-1/6">
                 <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">STOCK</span>
                 <div className={`px-3 py-1 text-xs font-bold rounded-lg border ${isLowStock ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-black border-gray-200'}`}>
                    {totalStock}
                 </div>
              </div>

              <div className="flex justify-end items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedProduct(producto)} className="p-3 bg-gray-50 border border-gray-200 hover:border-black hover:text-black rounded-xl transition-all text-gray-500" title="Ver Detalles"><FiInfo size={16} /></button>
                <button onClick={() => setProductoAEditar(producto)} className="p-3 bg-gray-50 border border-gray-200 hover:border-black hover:text-black rounded-xl transition-all text-gray-500" title="Editar"><FiEdit2 size={16} /></button>
                <button onClick={() => handleEliminarProducto(producto.id)} className="p-3 bg-gray-50 border border-gray-200 hover:border-red-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-gray-500" title="Eliminar"><FiTrash2 size={16} /></button>
              </div>
            </div>
          );
        })}
        {productosFiltrados.length === 0 && (
           <div className={`${styles.card} flex flex-col items-center justify-center py-12`}>
             <FiSearch size={40} className="text-gray-300 mb-4" />
             <p className="font-bold text-sm uppercase text-gray-500">NO SE ENCONTRARON PRODUCTOS</p>
           </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && <ProductInfoModal productData={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        {productoAEditar && <FormularioEditarModal producto={productoAEditar} proveedores={proveedores} categorias={categorias} pronunciationActivities={pronunciationActivities} fetchPronunciationActivities={obtenerPronunciationActivities} onClose={() => setProductoAEditar(null)} onSave={handleGuardarEdicion} />}
      </AnimatePresence>

    </div>
  );
};

export default InventarioProductos;