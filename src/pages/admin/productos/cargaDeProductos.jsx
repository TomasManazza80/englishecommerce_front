import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
// Iconos
import { FiPlus, FiCheck, FiRefreshCcw, FiLayers, FiImage, FiPackage, FiTrash2, FiEye, FiX, FiAlertTriangle, FiVideo, FiFileText, FiMic, FiPlayCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Importación de módulos externos (Lógica intacta)
import ProductReturnTracker from '../productos/devolucionProductos';
import HistorialDevoluciones from './historial de devoluciones';
import ActivityManagerModal from '../../../components/admin/ActivityManagerModal';
import { IKContext, IKUpload } from 'imagekitio-react';

// --- Datos de Referencia ---
const getTodayDate = () => new Date().toISOString().split('T')[0];
const API_URL = import.meta.env.VITE_API_URL;

const authenticator = async () => {
    try {
        const response = await fetch(`${API_URL}/api/auth/imagekit`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Request failed with status ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        const { signature, expire, token } = data;
        return { signature, expire, token };
    } catch (error) {
        throw new Error(`Authentication request failed: ${error.message}`);
    }
};

const initialProductState = {
    nombre: '',
    marca: '',
    categoria: '',
    fechaActualizacionPrecio: getTodayDate(),
    ultimaFechaCargoStock: getTodayDate(),
    descripcion: '',
    imagenes: [],
    esInfoproducto: true, // Forzamos true ya que es para infoproductos
    precioInfoproducto: '',
    archivosInfoproducto: [],
    speakingActivities: []
};

// --- ESTILOS BRUTALISMO SUAVE ---
const styles = {
    label: "font-black text-[10px] text-black uppercase tracking-widest mb-2 block",
    input: "w-full bg-white border border-black rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
    title: "text-3xl text-black mb-2 font-black tracking-tighter uppercase flex items-center gap-2",
    subtitle: "font-bold tracking-widest uppercase text-gray-500 text-[10px]",
    btnPrimary: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2",
    btnSecondary: "bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-lg transition-all py-3 px-4 flex items-center justify-center gap-2",
    card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
    alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-gray-100 border-gray-300 text-black text-xs font-bold uppercase",
    sectionTitle: "text-xs font-black text-black mb-6 uppercase tracking-widest flex items-center border-l-4 border-black pl-3",
};

// --- COMPONENTE: VISTA PREVIA (MODAL) ---
const PreviewModal = ({ producto, onClose }) => {
    // Helper para íconos
    const getFileIcon = (fileType) => {
        if (!fileType) return <FiFileText />;
        if (fileType.includes('pdf')) return <FiFileText />;
        if (fileType.includes('video') || fileType.includes('mp4')) return <FiVideo />;
        if (fileType.includes('image')) return <FiImage />;
        return <FiFileText />;
    };

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className={`${styles.card} w-full max-w-6xl h-[90vh] overflow-hidden relative flex flex-col md:flex-row p-0 bg-white`}>
                
                {/* Botón Cerrar */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[9999] w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center transition-colors text-white shadow-lg"
                    title="Cerrar vista previa"
                >
                    <FiX size={20} />
                </button>

                {/* Sidebar (Como en MisCursos) */}
                <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-[#f8f3f6] border-r border-[#e8d1ed] flex flex-col shadow-xl z-10 overflow-y-auto">
                    <div className="p-6 pb-2 sticky top-0 bg-[#f8f3f6] z-10 border-b border-[#e8d1ed]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#b273c2] mb-1 block">VISTA PREVIA DE ALUMNO</span>
                        <h2 className="font-black text-xl text-[#1d1d1d] leading-tight uppercase">{producto.nombre || 'NOMBRE DEL CURSO'}</h2>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col gap-6">
                        {producto.imagenes && producto.imagenes.length > 0 && (
                            <img src={producto.imagenes[0]} alt="Cover" className="w-full h-32 object-cover rounded-xl shadow-sm border border-[#f0dff3]" />
                        )}
                        
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            {producto.descripcion || "Descripción del curso..."}
                        </p>

                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b273c2] mb-3 border-b border-[#e8d1ed] pb-2">
                                Archivos del Curso ({producto.archivosInfoproducto?.length || 0})
                            </h3>
                            <div className="space-y-2">
                                {producto.archivosInfoproducto && producto.archivosInfoproducto.length > 0 ? (
                                    producto.archivosInfoproducto.map((archivo, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-[#f0dff3] rounded-xl shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-[#f8f3f6] text-[#b273c2] flex items-center justify-center shrink-0 text-xs">
                                                {getFileIcon(archivo.fileType)}
                                            </div>
                                            <span className="text-xs font-bold text-[#1d1d1d] truncate flex-1">{archivo.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No hay archivos subidos.</p>
                                )}
                            </div>
                        </div>

                        {(producto.speakingActivities && producto.speakingActivities.length > 0) && (
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b273c2] mb-3 border-b border-[#e8d1ed] pb-2">
                                    Evaluación Práctica
                                </h3>
                                <div className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-[#b273c2] to-[#9d5fb0] text-white rounded-xl font-bold text-xs shadow-md">
                                    <FiMic /> Practicar Pronunciación ({producto.speakingActivities.length})
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Viewer Area (Como en MisCursos) */}
                <div className="flex-1 h-full bg-[#111] relative flex flex-col items-center justify-center overflow-hidden p-8">
                    <div className="text-center opacity-50 flex flex-col items-center">
                        <FiPlayCircle className="text-6xl text-white mb-4" />
                        <p className="text-white font-bold tracking-widest uppercase text-sm">EL ALUMNO VERÁ EL MATERIAL AQUÍ</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// --- COMPONENTE: CARGA DE PRODUCTOS ---
const CargaDeProductosContent = () => {
    const [nuevoProducto, setNuevoProducto] = useState(initialProductState);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [categorias, setCategorias] = useState([]);
    const [newCategoryInput, setNewCategoryInput] = useState("");
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [fileError, setFileError] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [pronunciationActivitiesList, setPronunciationActivitiesList] = useState([]);
    const [newActivityTitle, setNewActivityTitle] = useState('');
    const [isCreatingActivity, setIsCreatingActivity] = useState(false);
    const [managingActivity, setManagingActivity] = useState(null);
    const [activityTab, setActivityTab] = useState('select'); // 'select' o 'create'
    const [activitySearchTerm, setActivitySearchTerm] = useState('');

    useEffect(() => {
        fetchCategoriesList();
        fetchPronunciationActivities();
    }, []);

    const fetchPronunciationActivities = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/pronunciation/activities`);
            setPronunciationActivitiesList(res.data);
        } catch (error) {
            console.error("ERROR_FETCH_PRONUNCIATION_ACTIVITIES", error);
        }
    };

    const fetchCategoriesList = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/categories`);
            if (Array.isArray(res.data)) {
                setCategorias(res.data);
            }
        } catch (error) {
            console.error("ERROR_FETCH_CATEGORIES", error);
        }
    };

    const handleAddCategory = async () => {
        const trimmedCategory = newCategoryInput.trim();
        if (!trimmedCategory) return;
        setIsAddingCategory(true);
        try {
            const response = await axios.post(`${API_URL}/api/categories`, { nombre: trimmedCategory });
            await fetchCategoriesList(); 
            setNuevoProducto(prev => ({ ...prev, categoria: response.data.categoryName }));
            setNewCategoryInput("");
        } catch (error) {
            console.error("ERROR_ADD_CATEGORY", error);
            if (error.response && error.response.status === 409) {
                const existingCategory = error.response.data.category;
                setNuevoProducto(prev => ({ ...prev, categoria: existingCategory.categoryName }));
                setNewCategoryInput("");
                alert("SISTEMA: La categoría ya existe, se ha seleccionado.");
            } else {
                alert("SISTEMA: Error al agregar la categoría.");
            }
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleDeleteCategory = async () => {
        const categoryName = nuevoProducto.categoria;
        if (!categoryName) {
            alert("SISTEMA: Por favor, seleccione una categoría para eliminar.");
            return;
        }

        const categoryToDelete = categorias.find(cat => cat.categoryName === categoryName);
        if (!categoryToDelete) {
            alert("SISTEMA: La categoría seleccionada no es válida o ya fue eliminada.");
            return;
        }

        if (window.confirm(`¿Está seguro que desea eliminar la categoría "${categoryName}"? Esta acción no se puede deshacer.`)) {
            setIsDeletingCategory(true);
            try {
                await axios.delete(`${API_URL}/api/categories/${categoryToDelete.categoryId}`);
                setDeleteSuccess(true);
                setNuevoProducto(prev => ({ ...prev, categoria: '' }));
                await fetchCategoriesList();
                setTimeout(() => setDeleteSuccess(false), 2000);
            } catch (error) {
                console.error("ERROR_DELETE_CATEGORY", error);
                alert(error.response?.data?.message || "SISTEMA: Error al eliminar la categoría.");
            } finally {
                setIsDeletingCategory(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevoProducto(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleSpeakingActivity = (activityId) => {
        setNuevoProducto(prev => {
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
            const res = await axios.post(`${API_URL}/api/pronunciation/activities`, {
                title: newActivityTitle.trim(),
                description: 'Actividad creada desde carga de productos.',
                assigned_date: new Date().toISOString().split('T')[0]
            });
            
            await fetchPronunciationActivities();
            
            // Auto-seleccionar la recién creada
            setNuevoProducto(prev => ({
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

    const onError = err => {
        console.error("Error", err);
        alert("SISTEMA: Error al subir imágenes a la nube.");
        setLoading(false);
        setUploadProgress(0);
    };

    const onSuccess = res => {
        setNuevoProducto(prev => ({ ...prev, imagenes: [...prev.imagenes, res.url] }));
        setLoading(false);
        setUploadProgress(0);
    };

    const handleRemoveImage = (indexToRemove) => {
        setNuevoProducto(prev => ({
            ...prev,
            imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove)
        }));
    };

    const onUploadStart = (evt) => {
        setFileError('');
        const file = evt.target.files[0];
        if (file && !file.type.startsWith('image/')) {
            setFileError("SISTEMA: El archivo seleccionado no es una imagen válida (JPG, PNG, WEBP, etc.).");
            setLoading(false);
            return;
        }
        setLoading(true);
        setUploadProgress(50);
    };

    const preventInvalidNumbers = (e) => {
        if (['-', '+', 'e', 'E'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleGuardarProducto = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const productToSave = {
                ...nuevoProducto,
                origenDeVenta: 'admin'
            };

            productToSave.variantes = [{
                color: 'Unico',
                almacenamiento: 'Unico',
                stock: 9999,
                costoDeCompra: 0,
                precioAlPublico: Number(productToSave.precioInfoproducto) || 0,
                precioMayorista: 0,
                precioRevendedor: 0
            }];
            productToSave.alerta = 0;
            productToSave.esInfoproducto = true;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productToSave)
            });

            if (response.ok) {
                alert(`SISTEMA: Infoproducto "${nuevoProducto.nombre || 'Sin nombre'}" creado con éxito.`);
                setNuevoProducto(initialProductState);
                setErrorMsg('');
            } else {
                const errorData = await response.json().catch(() => ({}));
                setErrorMsg(errorData.message || "ERROR: No se pudo crear el infoproducto.");
            }
        } catch (error) {
            console.error(error);
            setErrorMsg("ERROR: Fallo de conexión o del servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${styles.card} relative`} style={{ fontFamily: '"Inter", sans-serif' }}>
            <AnimatePresence>
                {showPreview && (
                    <PreviewModal 
                        producto={nuevoProducto} 
                        onClose={() => setShowPreview(false)} 
                    />
                )}
                {managingActivity && (
                    <ActivityManagerModal 
                        activity={managingActivity} 
                        onClose={() => setManagingActivity(null)} 
                        onUpdate={fetchPronunciationActivities}
                    />
                )}
            </AnimatePresence>

            {/* Cabecera Interna */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8 pb-4 sm:pb-6 border-b border-gray-200">
                <h2 className={`${styles.title} text-xl sm:text-2xl lg:text-3xl mb-0`}>
                    <FiPlus className="text-black" /> REGISTRO DE INFOPRODUCTO
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 whitespace-nowrap">MODO DIGITAL</span>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardarProducto(); }} className="space-y-12">

                {/* I. Identificación */}
                <section>
                    <h3 className={styles.sectionTitle}>01. IDENTIFICACIÓN DEL CURSO/INFOPRODUCTO</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="sm:col-span-2 lg:col-span-3">
                            <label className={styles.label}>NOMBRE DEL INFOPRODUCTO</label>
                            <input type="text" name="nombre" value={nuevoProducto.nombre} onChange={handleInputChange} className={styles.input} placeholder="EJ: CURSO INTENSIVO DE INGLÉS B1" />
                        </div>
                        <div>
                            <label className={styles.label}>CREADOR / ACADEMIA</label>
                            <input type="text" name="marca" value={nuevoProducto.marca} onChange={handleInputChange} className={styles.input} placeholder="EJ: LAURA ACADEMY" />
                        </div>
                        <div>
                            <label className={styles.label}>CATEGORÍA</label>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <select name="categoria" value={nuevoProducto.categoria} onChange={handleInputChange} className={styles.input}>
                                        <option value="">SELECCIONAR...</option>
                                        {categorias.map(cat => <option key={cat.categoryId} value={cat.categoryName}>{cat.categoryName}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleDeleteCategory}
                                        disabled={isDeletingCategory || (!nuevoProducto.categoria && !deleteSuccess) || deleteSuccess}
                                        className={`p-3 font-bold uppercase rounded-xl transition-all duration-300 flex items-center justify-center ${deleteSuccess
                                            ? 'bg-black text-white shadow-md'
                                            : 'bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 hover:border-red-200'
                                            }`}
                                        title="Eliminar categoría seleccionada"
                                    >
                                        {isDeletingCategory ? '...' : deleteSuccess ? <FiCheck size={18} className="animate-bounce" /> : <FiTrash2 size={18} />}
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newCategoryInput}
                                        onChange={(e) => setNewCategoryInput(e.target.value)}
                                        className={`${styles.input} py-2 text-xs`}
                                        placeholder="O CREAR NUEVA CATEGORÍA..."
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        disabled={isAddingCategory || !newCategoryInput.trim()}
                                        className="p-2 bg-black hover:bg-gray-800 text-white font-bold uppercase rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isAddingCategory ? '...' : <FiPlus size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={styles.label}>PRECIO PÚBLICO ($)</label>
                            <input type="number" name="precioInfoproducto" placeholder="0.00" value={nuevoProducto.precioInfoproducto} onChange={handleInputChange} onKeyDown={preventInvalidNumbers} min="0" className={styles.input} />
                        </div>
                    </div>
                </section>

                {/* IV. Detalles Adicionales */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                    <div className="space-y-4 sm:space-y-6">
                        <div>
                            <label className={styles.label}>DESCRIPCIÓN DEL PRODUCTO</label>
                            <textarea name="descripcion" value={nuevoProducto.descripcion} onChange={handleInputChange} rows="8" className={`${styles.input} resize-none w-full`} placeholder="DETALLA QUÉ INCLUYE EL CURSO, TEMARIO, BENEFICIOS..." />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className={styles.label}>PORTADA DEL INFOPRODUCTO (MÁX 1)</label>
                        <div className="flex-grow border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-gray-100 hover:border-black transition-all cursor-pointer relative group">
                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <FiRefreshCcw size={40} className="text-black animate-spin mb-4" />
                                    <div className="w-24 h-2 bg-gray-200 rounded-full mb-2 overflow-hidden">
                                        <div className="h-full bg-black transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-black">SUBIENDO {uploadProgress}%</span>
                                </div>
                            ) : (
                                <>
                                    <FiImage size={40} className="text-gray-400 group-hover:text-black transition-colors mb-4" />
                                    <span className="font-bold text-[10px] uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">SUBIR PORTADA</span>
                                </>
                            )}
                            <IKContext
                                publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY}
                                urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
                                authenticator={authenticator}
                            >
                                <IKUpload
                                    fileName="product_img"
                                    useUniqueFileName={true}
                                    folder="/products"
                                    multiple={false}
                                    onError={onError}
                                    onSuccess={onSuccess}
                                    onUploadStart={onUploadStart}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    disabled={loading}
                                />
                            </IKContext>
                            {fileError && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`absolute top-full left-0 right-0 mt-2 z-50 ${styles.alertNeutral} border-red-200 bg-red-50 text-red-600`}>
                                    <FiAlertTriangle size={18} /> {fileError}
                                </motion.div>
                            )}
                            {nuevoProducto.imagenes.length > 0 && !loading && (
                                <div className="mt-6 w-full grid grid-cols-1 gap-2 relative z-10">
                                    {nuevoProducto.imagenes.map((url, index) => (
                                        <div key={index} className="relative aspect-video group/img border border-gray-200 rounded-xl bg-white overflow-hidden flex items-center justify-center">
                                            <img src={url} alt={`Preview ${index}`} className="max-w-full max-h-full object-cover group-hover/img:scale-105 transition-transform" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveImage(index);
                                                }}
                                                className="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-black rounded-full"
                                                title="Eliminar imagen"
                                            >
                                                <FiTrash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* V. Materiales del Curso */}
                <section>
                    <h3 className={styles.sectionTitle}>02. MATERIALES DEL CURSO (PDF, VIDEO, MP3)</h3>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center relative bg-gray-50 hover:bg-gray-100 hover:border-black transition-colors">
                        <FiLayers size={32} className="text-gray-400 mb-3" />
                        <span className="font-bold text-[10px] uppercase tracking-widest text-gray-500">CLIC AQUÍ PARA SUBIR MATERIALES (PDF, MP4, ETC.)</span>
                        
                        <IKContext
                            publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY}
                            urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
                            authenticator={authenticator}
                        >
                            <IKUpload
                                fileName="course_material"
                                useUniqueFileName={true}
                                folder="/products/materials"
                                multiple={true}
                                onError={(err) => {
                                    console.error("Upload error", err);
                                    alert("SISTEMA: Error al subir el material.");
                                }}
                                onSuccess={(res) => {
                                    const extension = res.name.split('.').pop().toLowerCase();
                                    let fileType = 'application/octet-stream';
                                    if (['pdf'].includes(extension)) fileType = 'application/pdf';
                                    if (['mp4', 'webm'].includes(extension)) fileType = 'video/mp4';
                                    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) fileType = 'image/jpeg';

                                    setNuevoProducto(prev => ({
                                        ...prev,
                                        archivosInfoproducto: [...prev.archivosInfoproducto, {
                                            name: res.name,
                                            url: res.url,
                                            fileType: fileType
                                        }]
                                    }));
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </IKContext>

                        {nuevoProducto.archivosInfoproducto.length > 0 && (
                            <div className="mt-8 w-full space-y-3 relative z-10">
                                {nuevoProducto.archivosInfoproducto.map((archivo, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex flex-col">
                                            <span className="text-black text-sm font-bold truncate uppercase">{archivo.name}</span>
                                            <span className="text-gray-500 text-[10px] uppercase tracking-widest">{archivo.fileType}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setNuevoProducto(prev => ({
                                                    ...prev,
                                                    archivosInfoproducto: prev.archivosInfoproducto.filter((_, i) => i !== index)
                                                }));
                                            }}
                                            className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-3 rounded-lg transition-colors border border-gray-200 hover:border-red-200"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* VI. Actividades de Speaking */}
                <section>
                    <h3 className={styles.sectionTitle}>03. ACTIVIDADES DE SPEAKING (OPCIONAL)</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-6">
                        
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
                                <label className={styles.label}>BUSCAR Y SELECCIONAR ACTIVIDADES DE PRONUNCIACIÓN</label>
                                <input 
                                    type="text" 
                                    placeholder="BUSCAR ACTIVIDAD..." 
                                    value={activitySearchTerm} 
                                    onChange={(e) => setActivitySearchTerm(e.target.value)} 
                                    className={`${styles.input} mb-4 py-2 text-xs`}
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                    {pronunciationActivitiesList
                                        .filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase()))
                                        .map(act => (
                                        <div key={act.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer" onClick={() => handleToggleSpeakingActivity(act.id)}>
                                            <div className="flex items-center gap-3">
                                                <input 
                                                    type="checkbox" 
                                                    checked={(nuevoProducto.speakingActivities || []).includes(act.id)} 
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
                                    {pronunciationActivitiesList.filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase())).length === 0 && (
                                        <p className="text-gray-500 text-xs italic col-span-full">No se encontraron actividades de speaking.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activityTab === 'create' && (
                            <div className="animate-fade-in">
                                <label className={styles.label}>CREAR Y SELECCIONAR UNA NUEVA ACTIVIDAD EN BLANCO</label>
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
                    </div>
                </section>

                {/* Footer de Acciones */}
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`${styles.alertNeutral} border-red-200 bg-red-50 text-red-600 mb-6`}>
                        <FiAlertTriangle size={18} className="flex-shrink-0" /> <span className="flex-1">{errorMsg}</span>
                    </motion.div>
                )}
                <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-6 pt-6 sm:pt-8 border-t border-gray-200 w-full">
                    <button 
                        type="button" 
                        onClick={() => setShowPreview(true)} 
                        className={`${styles.btnSecondary} w-full sm:w-auto`}
                    >
                        <FiEye size={16} /> VISTA PREVIA
                    </button>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className={`${styles.btnPrimary} w-full sm:w-auto sm:px-8`}
                    >
                        {loading ? "PROCESANDO..." : <><FiCheck size={18} /> GUARDAR</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const CargaDeProductos = () => {
    return (
        <div className="bg-white min-h-screen text-black p-4 md:p-8 lg:p-12" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header Principal */}
            <header className="mb-8">
                <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter leading-none">
                    INVENTARIO
                </h1>
                <p className="font-bold text-[10px] text-gray-500 mt-2 uppercase tracking-widest">SISTEMA ONLINE / CONTROL DE PRODUCTOS</p>
            </header>

            {/* Contenido */}
            <div className="transition-opacity duration-500">
                <CargaDeProductosContent />
            </div>
        </div>
    );
};

export default CargaDeProductos;