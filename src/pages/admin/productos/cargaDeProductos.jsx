import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Iconos
import { FiPlus, FiCheck, FiRefreshCcw, FiLayers, FiImage, FiPackage, FiTrash2, FiEye, FiX } from 'react-icons/fi';

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

// --- COMPONENTE: VISTA PREVIA (MODAL) ---
const PreviewModal = ({ producto, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
            <div className="bg-white text-black w-full max-w-5xl h-[85vh] overflow-y-auto rounded-3xl shadow-2xl relative flex flex-col md:flex-row">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors"
                >
                    <FiX size={20} />
                </button>

                {/* Left: Image */}
                <div className="w-full md:w-1/2 bg-[#f8f3f6] flex items-center justify-center p-8">
                    {producto.imagenes && producto.imagenes.length > 0 ? (
                        <img 
                            src={producto.imagenes[0]} 
                            alt={producto.nombre} 
                            className="w-full h-auto object-cover rounded-2xl shadow-lg"
                        />
                    ) : (
                        <div className="w-full aspect-square bg-white rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                            <FiImage size={48} className="mb-4" />
                            <p className="text-sm font-semibold uppercase tracking-widest">Sin Imagen</p>
                        </div>
                    )}
                </div>

                {/* Right: Info */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b273c2] mb-3">
                        {producto.categoria || 'Categoría'}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black leading-tight mb-2 uppercase">
                        {producto.nombre || 'Nombre del Infoproducto'}
                    </h1>
                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-8">
                        Por {producto.marca || 'Autor / Creador'}
                    </p>

                    <div className="text-4xl font-black text-black mb-8">
                        ${producto.precioInfoproducto ? Number(producto.precioInfoproducto).toLocaleString() : '0.00'}
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-4">Descripción</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {producto.descripcion || 'La descripción del infoproducto aparecerá aquí. Destaca los beneficios y qué aprenderá el estudiante.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <button className="w-full bg-[#b273c2] hover:bg-[#9d5fb0] text-white py-4 rounded-xl font-black uppercase tracking-widest transition-colors shadow-lg">
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
            </div>
        </div>
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
        // As it's an infoproduct, we might want to upload files or cover images.
        // Assuming cover images go to imagenes.
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

            // Setup default variant for Infoproduct
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

    // --- ESTILOS BLANCO Y NEGRO (INTER) ---
    const inputStyle = "w-full bg-black border border-zinc-800 rounded-none py-3 px-4 text-white font-['Inter'] font-medium focus:border-white focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-zinc-600 text-sm";
    const labelStyle = "block text-[11px] font-bold text-white uppercase tracking-wider mb-2 font-['Inter']";
    const sectionTitle = "text-[10px] font-black text-white mb-8 uppercase tracking-[0.4em] flex items-center border-l-2 border-white pl-4 font-['Inter']";

    return (
        <div className="bg-black border border-zinc-800 shadow-2xl relative">
            {showPreview && (
                <PreviewModal 
                    producto={nuevoProducto} 
                    onClose={() => setShowPreview(false)} 
                />
            )}

            {/* Cabecera Interna */}
            <div className="bg-black p-4 md:p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-lg md:text-xl font-['Inter'] font-[900] text-white uppercase tracking-tighter flex items-center">
                    <FiPlus className="mr-3 text-white" /> Registro de Infoproducto
                </h2>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-zinc-900 px-3 py-1 rounded-full border border-zinc-700">Modo Digital</span>
                </div>
            </div>

            <div className="p-4 md:p-12">
                <form onSubmit={(e) => { e.preventDefault(); handleGuardarProducto(); }} className="space-y-12">

                    {/* I. Identificación */}
                    <section>
                        <h3 className={sectionTitle}>01. Identificación del Curso/Infoproducto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-3">
                                <label className={labelStyle}>Nombre del Infoproducto</label>
                                <input type="text" name="nombre" value={nuevoProducto.nombre} onChange={handleInputChange} className={inputStyle} placeholder="EJ: CURSO INTENSIVO DE INGLÉS B1" />
                            </div>
                            <div>
                                <label className={labelStyle}>Creador / Academia</label>
                                <input type="text" name="marca" value={nuevoProducto.marca} onChange={handleInputChange} className={inputStyle} placeholder="EJ: LAURA ACADEMY" />
                            </div>
                            <div>
                                <label className={labelStyle}>Categoría</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <select name="categoria" value={nuevoProducto.categoria} onChange={handleInputChange} className={inputStyle}>
                                            <option value="" className="bg-black">SELECCIONAR...</option>
                                            {categorias.map(cat => <option key={cat.categoryId} value={cat.categoryName} className="bg-black">{cat.categoryName}</option>)}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={handleDeleteCategory}
                                            disabled={isDeletingCategory || (!nuevoProducto.categoria && !deleteSuccess) || deleteSuccess}
                                            className={`p-3 font-bold uppercase transition-all duration-300 flex items-center justify-center ${deleteSuccess
                                                ? 'bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                                                : 'bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-800'
                                                }`}
                                            title="Eliminar categoría seleccionada"
                                        >
                                            {isDeletingCategory ? '...' : deleteSuccess ? <FiCheck size={20} className="animate-bounce" /> : <FiTrash2 />}
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newCategoryInput}
                                            onChange={(e) => setNewCategoryInput(e.target.value)}
                                            className={`${inputStyle} text-xs h-10`}
                                            placeholder="O crear nueva categoría..."
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            disabled={isAddingCategory || !newCategoryInput.trim()}
                                            className="p-3 bg-zinc-900 hover:bg-white text-white hover:text-black font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border border-zinc-800"
                                        >
                                            {isAddingCategory ? '...' : <FiPlus />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className={labelStyle}>Precio Público ($)</label>
                                <input type="number" name="precioInfoproducto" placeholder="0.00" value={nuevoProducto.precioInfoproducto} onChange={handleInputChange} onKeyDown={preventInvalidNumbers} min="0" className={inputStyle} />
                            </div>
                        </div>
                    </section>

                    {/* IV. Detalles Adicionales */}
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div>
                                <label className={labelStyle}>Descripción del Producto</label>
                                <textarea name="descripcion" value={nuevoProducto.descripcion} onChange={handleInputChange} rows="8" className={`${inputStyle} resize-none normal-case`} placeholder="Detalla qué incluye el curso, temario, beneficios para el estudiante..." />
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className={labelStyle}>Portada del Infoproducto (Máx 1)</label>
                            <div className="flex-grow border border-dashed border-zinc-800 flex flex-col items-center justify-center p-8 bg-black hover:bg-zinc-900 transition-all cursor-pointer relative group">
                                {loading ? (
                                    <div className="flex flex-col items-center">
                                        <FiRefreshCcw size={40} className="text-white animate-spin mb-4" />
                                        <div className="w-16 h-1 bg-zinc-800 mb-2 overflow-hidden">
                                            <div className="h-full bg-white transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <span className="font-['Inter'] font-black text-[9px] uppercase tracking-widest text-white">Subiendo {uploadProgress}%</span>
                                    </div>
                                ) : (
                                    <>
                                        <FiImage size={40} className="text-zinc-700 group-hover:text-white transition-colors mb-4" />
                                        <span className="font-['Inter'] font-black text-[9px] uppercase tracking-widest text-zinc-500">Subir Portada</span>
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
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 text-white text-[10px] font-black p-2 uppercase tracking-widest animate-pulse z-50">
                                        {fileError}
                                    </div>
                                )}
                                {nuevoProducto.imagenes.length > 0 && !loading && (
                                    <div className="mt-6 w-full grid grid-cols-1 gap-2 relative z-10">
                                        {nuevoProducto.imagenes.map((url, index) => (
                                            <div key={index} className="relative aspect-video group/img border border-zinc-800 bg-black overflow-hidden flex items-center justify-center">
                                                <img src={url} alt={`Preview ${index}`} className="max-w-full max-h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage(index);
                                                    }}
                                                    className="absolute top-2 right-2 p-2 bg-black border border-zinc-700 text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-zinc-800 shadow-lg rounded-full"
                                                    title="Eliminar imagen"
                                                >
                                                    <FiTrash2 size={16} />
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
                        <h3 className={sectionTitle}>02. Materiales del Curso (PDF, Video, MP3)</h3>
                        <div className="border border-dashed border-zinc-800 p-8 flex flex-col items-center justify-center relative hover:bg-zinc-900 transition-colors">
                            <FiLayers size={32} className="text-zinc-600 mb-3" />
                            <span className="font-['Inter'] font-black text-[10px] uppercase tracking-widest text-zinc-400">Clic aquí para subir materiales (PDF, MP4, etc.)</span>
                            
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
                                        // ImageKit onSuccess res contains url, name, fileId etc.
                                        // We need to infer type since we don't have the original file object here easily, 
                                        // but we can check the extension from the name or url.
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
                                <div className="mt-8 w-full space-y-2 relative z-10">
                                    {nuevoProducto.archivosInfoproducto.map((archivo, index) => (
                                        <div key={index} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4">
                                            <div className="flex flex-col">
                                                <span className="text-white text-sm font-bold truncate">{archivo.name}</span>
                                                <span className="text-zinc-500 text-[10px] uppercase tracking-widest">{archivo.fileType}</span>
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
                                                className="text-red-500 hover:text-red-400 p-2"
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
                        <div className="bg-zinc-900 border border-zinc-700 text-white p-4 font-['Inter'] text-xs uppercase tracking-widest text-center mb-6">
                            {errorMsg}
                        </div>
                    )}
                    <div className="flex justify-end items-center space-x-4 md:space-x-8 pt-10 border-t border-zinc-800">
                        <button 
                            type="button" 
                            onClick={() => setShowPreview(true)} 
                            className="px-6 py-4 font-['Inter'] font-black text-[11px] uppercase tracking-[0.2em] bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
                        >
                            <FiEye size={16} /> Vista Previa
                        </button>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="px-8 md:px-12 py-4 font-['Inter'] font-black text-[11px] uppercase tracking-[0.2em] bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)] flex items-center"
                        >
                            {loading ? "PROCESANDO..." : <><FiCheck className="mr-3" size={18} /> Guardar Producto</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const CargaDeProductos = () => {
    const [activeTab, setActiveTab] = useState('carga');

    const getTabClasses = (tabName) =>
        `px-8 py-5 text-[10px] font-['Inter'] font-black uppercase tracking-[0.3em] transition-all duration-300 flex items-center border-b-2 ${activeTab === tabName
            ? 'text-black bg-white border-white'
            : 'text-zinc-600 border-transparent hover:text-white bg-black'
        }`;

    return (
        <div className="bg-black min-h-screen p-6 md:p-12 font-['Inter'] selection:bg-white selection:text-black">
            {/* Header Principal */}
            <header className="mb-12">
                <h1 className="text-3xl md:text-5xl font-['Inter'] font-[900] text-white uppercase tracking-tighter leading-none">
                    INVENTARIO<span className="text-white">_</span>
                </h1>
                <p className="font-['Inter'] text-[9px] font-bold text-zinc-500 mt-4 uppercase tracking-[0.6em]">Core Control System / English E-commerce</p>
            </header>

            {/* Navegación */}
            <div className="flex border-b border-zinc-900 mb-10 overflow-x-auto no-scrollbar">
                <button className={getTabClasses('carga')} onClick={() => setActiveTab('carga')}>
                    <FiPlus className="mr-2" /> Alta de Infoproducto
                </button>
                <button className={getTabClasses('masiva')} onClick={() => setActiveTab('masiva')}>
                    <FiLayers className="mr-2" /> Importación Masiva
                </button>
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