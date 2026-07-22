import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Iconos
import { FiPlus, FiCheck, FiRefreshCcw, FiLayers, FiImage, FiPackage, FiTrash2, FiEye, FiX, FiAlertTriangle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Importación de módulos externos (Lógica intacta)
import ProductReturnTracker from '../productos/devolucionProductos';
import HistorialDevoluciones from './historial de devoluciones';
import IngresoMercaderia from './cargaMercaderiaMasiva';
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
    archivosInfoproducto: []
};

// --- ESTILOS BRUTALISMO SUAVE ---
const styles = {
    label: "font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-2 block",
    input: "w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
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
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className={`${styles.card} w-full max-w-5xl h-[85vh] overflow-y-auto relative flex flex-col md:flex-row p-0 overflow-hidden bg-white`}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-50 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors text-gray-500 hover:text-black"
                >
                    <FiX size={20} />
                </button>

                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-gray-50 flex items-center justify-center p-8 border-r border-gray-200">
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                        <img 
                            src={producto.imagenes[0]} 
                            alt={producto.nombre} 
                            className="w-full h-auto object-cover rounded-xl shadow-sm border border-gray-200"
                        />
                    ) : (
                        <div className="w-full aspect-square bg-white rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                            <FiImage size={48} className="mb-4" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">SIN PORTADA</p>
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                        {producto.categoria || 'CATEGORÍA'}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black leading-tight mb-2 uppercase text-black tracking-tighter">
                        {producto.nombre || 'NOMBRE DEL INFOPRODUCTO'}
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">
                        POR {producto.marca || 'AUTOR / CREADOR'}
                    </p>

                    <div className="text-4xl font-black text-black mb-8">
                        ${producto.precioInfoproducto ? Number(producto.precioInfoproducto).toLocaleString() : '0.00'}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-200">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-black mb-4">DESCRIPCIÓN</h3>
                        <p className="text-gray-600 text-sm font-medium leading-relaxed whitespace-pre-wrap">
                            {producto.descripcion || 'LA DESCRIPCIÓN DEL INFOPRODUCTO APARECERÁ AQUÍ.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button className={`${styles.btnPrimary} w-full py-4 text-sm`}>
                            AÑADIR AL CARRITO
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
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

    useEffect(() => {
        fetchCategoriesList();
    }, []);

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
            </AnimatePresence>

            {/* Cabecera Interna */}
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
                <h2 className={styles.title}>
                    <FiPlus className="text-black" /> REGISTRO DE INFOPRODUCTO
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">MODO DIGITAL</span>
                </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGuardarProducto(); }} className="space-y-12">

                {/* I. Identificación */}
                <section>
                    <h3 className={styles.sectionTitle}>01. IDENTIFICACIÓN DEL CURSO/INFOPRODUCTO</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3">
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
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className={styles.label}>DESCRIPCIÓN DEL PRODUCTO</label>
                            <textarea name="descripcion" value={nuevoProducto.descripcion} onChange={handleInputChange} rows="8" className={`${styles.input} resize-none`} placeholder="DETALLA QUÉ INCLUYE EL CURSO, TEMARIO, BENEFICIOS..." />
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

                {/* Footer de Acciones */}
                {errorMsg && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`${styles.alertNeutral} border-red-200 bg-red-50 text-red-600 mb-6`}>
                        <FiAlertTriangle size={18} /> {errorMsg}
                    </motion.div>
                )}
                <div className="flex justify-end items-center space-x-4 md:space-x-6 pt-8 border-t border-gray-200">
                    <button 
                        type="button" 
                        onClick={() => setShowPreview(true)} 
                        className={styles.btnSecondary}
                    >
                        <FiEye size={16} /> VISTA PREVIA
                    </button>

                    <button 
                        type="submit" 
                        disabled={loading} 
                        className={`${styles.btnPrimary} px-8`}
                    >
                        {loading ? "PROCESANDO..." : <><FiCheck size={18} /> GUARDAR PRODUCTO</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const CargaDeProductos = () => {
    const [activeTab, setActiveTab] = useState('carga');

    const getTabClasses = (tabName) =>
        `px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center rounded-t-xl ${activeTab === tabName
            ? 'text-black bg-white border-t border-l border-r border-gray-200'
            : 'text-gray-500 hover:text-black bg-gray-50 border-b border-gray-200'
        }`;

    return (
        <div className="bg-white min-h-screen text-black p-4 md:p-8 lg:p-12" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header Principal */}
            <header className="mb-10">
                <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tighter leading-none">
                    INVENTARIO
                </h1>
                <p className="font-bold text-[10px] text-gray-500 mt-2 uppercase tracking-widest">SISTEMA ONLINE / CONTROL DE PRODUCTOS</p>
            </header>

            {/* Navegación */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
                <button className={getTabClasses('carga')} onClick={() => setActiveTab('carga')}>
                    <FiPlus className="mr-2" size={16} /> ALTA DE INFOPRODUCTO
                </button>
                <button className={getTabClasses('masiva')} onClick={() => setActiveTab('masiva')}>
                    <FiLayers className="mr-2" size={16} /> IMPORTACIÓN MASIVA
                </button>
                <div className="flex-grow border-b border-gray-200"></div>
            </div>

            {/* Contenido */}
            <div className="transition-opacity duration-500">
                {activeTab === 'carga' && <CargaDeProductosContent />}
                {activeTab === 'masiva' && <IngresoMercaderia />}
            </div>
        </div>
    );
};

export default CargaDeProductos;