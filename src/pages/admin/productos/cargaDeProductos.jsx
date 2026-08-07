import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
// Iconos
import { 
    FiPlus, FiCheck, FiRefreshCcw, FiLayers, FiImage, 
    FiTrash2, FiEye, FiX, FiAlertTriangle, FiVideo, 
    FiFileText, FiMic, FiPlayCircle, FiChevronRight, FiChevronLeft 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

// Importación de módulos externos
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
    esInfoproducto: true,
    precioInfoproducto: '',
    archivosInfoproducto: [],
    speakingActivities: []
};

// --- ESTILOS PREMIUM / GLASSMORPHISM ---
const styles = {
    label: "font-black text-[10px] text-gray-500 uppercase tracking-widest mb-2 block",
    input: "w-full bg-gray-50/50 border border-gray-200 rounded-xl p-4 text-black focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all shadow-sm hover:border-gray-300",
    title: "text-3xl text-black mb-2 font-black tracking-tighter uppercase flex items-center gap-2",
    btnPrimary: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 hover:shadow-lg transition-all py-4 px-6 flex items-center justify-center gap-2",
    btnSecondary: "bg-white border border-gray-200 text-black hover:bg-gray-50 font-bold uppercase text-xs rounded-xl hover:shadow-md transition-all py-4 px-6 flex items-center justify-center gap-2",
    card: "bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-200/50",
    alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-red-50 border-red-200 text-red-600 text-xs font-bold uppercase",
    sectionTitle: "text-lg font-black text-black mb-6 uppercase tracking-tight flex items-center gap-3",
    stepperCircle: "w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300",
    dropzone: "w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 transition-all cursor-pointer relative group",
};

// --- COMPONENTE: VISTA PREVIA (MODAL) ---
const PreviewModal = ({ producto, onClose }) => {
    const [activeFile, setActiveFile] = useState(producto.archivosInfoproducto?.[0] || null);

    const getFileIcon = (fileType) => {
        if (!fileType) return <FiFileText />;
        if (fileType.includes('pdf')) return <FiFileText />;
        if (fileType.includes('video') || fileType.includes('mp4')) return <FiVideo />;
        if (fileType.includes('image')) return <FiImage />;
        return <FiFileText />;
    };

    return createPortal(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 md:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className={`w-full max-w-6xl h-[90vh] overflow-hidden relative flex flex-col md:flex-row p-0 bg-white rounded-3xl shadow-2xl`}>
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[9999] w-12 h-12 bg-white/10 hover:bg-white/30 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center transition-all text-white shadow-2xl hover:scale-105"
                    title="Cerrar vista previa"
                >
                    <FiX size={24} />
                </button>

                {/* Sidebar */}
                <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-[#f8f3f6] border-r border-[#e8d1ed] flex flex-col shadow-xl z-10 overflow-y-auto">
                    <div className="p-8 pb-4 sticky top-0 bg-[#f8f3f6] z-10 border-b border-[#e8d1ed]">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#b273c2] mb-2 block">VISTA PREVIA ALUMNO</span>
                        <h2 className="font-black text-2xl text-[#1d1d1d] leading-tight uppercase">{producto.nombre || 'NOMBRE DEL CURSO'}</h2>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col gap-8">
                        {producto.imagenes && producto.imagenes.length > 0 && (
                            <img src={producto.imagenes[0]} alt="Cover" className="w-full h-40 object-cover rounded-2xl shadow-sm border border-[#f0dff3]" />
                        )}
                        <div className="flex flex-col gap-2">
                            {producto.descripcion ? (
                                producto.descripcion.split('\n').filter(item => item.trim() !== '').map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <FiCheckCircle className="text-[#b273c2] mt-1 shrink-0" size={16} />
                                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{item}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 font-medium leading-relaxed italic">Descripción del curso aparecerá aquí...</p>
                            )}
                        </div>

                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b273c2] mb-4 border-b border-[#e8d1ed] pb-2">
                                Archivos del Curso ({producto.archivosInfoproducto?.length || 0})
                            </h3>
                            <div className="space-y-3">
                                {producto.archivosInfoproducto && producto.archivosInfoproducto.length > 0 ? (
                                    producto.archivosInfoproducto.map((archivo, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => setActiveFile(archivo)}
                                            className={`flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer ${activeFile?.url === archivo.url ? 'border-[#b273c2] ring-1 ring-[#b273c2]' : 'border-[#f0dff3]'}`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-[#f8f3f6] text-[#b273c2] flex items-center justify-center shrink-0">
                                                {getFileIcon(archivo.fileType)}
                                            </div>
                                            <span className="text-sm font-bold text-[#1d1d1d] truncate flex-1">{archivo.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">No hay archivos subidos.</p>
                                )}
                            </div>
                        </div>

                        {(producto.speakingActivities && producto.speakingActivities.length > 0) && (
                            <div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b273c2] mb-4 border-b border-[#e8d1ed] pb-2">
                                    Evaluación Práctica
                                </h3>
                                <div className="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-[#b273c2] to-[#9d5fb0] text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer">
                                    <FiMic size={18}/> Practicar Pronunciación ({producto.speakingActivities.length})
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Viewer Area */}
                <div className="flex-1 h-full bg-[#0a0a0a] relative flex flex-col items-center justify-center overflow-hidden p-0">
                    {activeFile ? (
                        <>
                            {(activeFile.fileType?.includes('pdf') || activeFile.url?.endsWith('.pdf')) && (
                                <iframe src={activeFile.url} className="w-full h-full border-0 bg-white" title="PDF Viewer" />
                            )}
                            {(activeFile.fileType?.includes('video') || activeFile.url?.endsWith('.mp4')) && (
                                <video src={activeFile.url} controls className="w-full h-full object-contain" />
                            )}
                            {(activeFile.fileType?.includes('image') || activeFile.fileType?.includes('jpeg') || activeFile.url?.match(/\.(jpeg|jpg|gif|png)$/)) && (
                                <img src={activeFile.url} className="w-full h-full object-contain" alt={activeFile.name} />
                            )}
                            {!activeFile.fileType?.includes('pdf') && !activeFile.url?.endsWith('.pdf') && 
                             !activeFile.fileType?.includes('video') && !activeFile.url?.endsWith('.mp4') && 
                             !activeFile.fileType?.includes('image') && !activeFile.fileType?.includes('jpeg') && !activeFile.url?.match(/\.(jpeg|jpg|gif|png)$/) && (
                                <div className="text-center opacity-40 flex flex-col items-center p-8">
                                    <FiFileText className="text-7xl text-white mb-6" />
                                    <p className="text-white font-bold tracking-widest uppercase text-sm mb-4">ESTE ARCHIVO NO TIENE VISTA PREVIA DISPONIBLE</p>
                                    <a href={activeFile.url} target="_blank" rel="noreferrer" className="text-blue-400 underline text-xs">Descargar archivo</a>
                                </div>
                            )}
                        </>
                    ) : producto.imagenes && producto.imagenes.length > 0 ? (
                        <img src={producto.imagenes[0]} className="w-full h-full object-contain" alt="Course Cover" />
                    ) : (
                        <div className="text-center opacity-40 flex flex-col items-center">
                            <FiPlayCircle className="text-7xl text-white mb-6" />
                            <p className="text-white font-bold tracking-widest uppercase text-sm">REPRODUCTOR DE CLASE / MATERIAL</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// --- COMPONENTE PRINCIPAL (CARGA DE PRODUCTOS) ---
const CargaDeProductosContent = () => {
    const [step, setStep] = useState(1);
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
    const [activityTab, setActivityTab] = useState('select');
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
            if (Array.isArray(res.data)) setCategorias(res.data);
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
            if (error.response?.status === 409) {
                setNuevoProducto(prev => ({ ...prev, categoria: error.response.data.category.categoryName }));
                setNewCategoryInput("");
            } else {
                alert("SISTEMA: Error al agregar la categoría.");
            }
        } finally {
            setIsAddingCategory(false);
        }
    };

    const handleDeleteCategory = async () => {
        const categoryName = nuevoProducto.categoria;
        if (!categoryName) return;

        const categoryToDelete = categorias.find(cat => cat.categoryName === categoryName);
        if (!categoryToDelete) return;

        if (window.confirm(`¿Eliminar la categoría "${categoryName}"?`)) {
            setIsDeletingCategory(true);
            try {
                await axios.delete(`${API_URL}/api/categories/${categoryToDelete.categoryId}`);
                setDeleteSuccess(true);
                setNuevoProducto(prev => ({ ...prev, categoria: '' }));
                await fetchCategoriesList();
                setTimeout(() => setDeleteSuccess(false), 2000);
            } catch (error) {
                console.error("ERROR_DELETE_CATEGORY", error);
                alert("Error al eliminar la categoría.");
            } finally {
                setIsDeletingCategory(false);
            }
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNuevoProducto(prev => ({ ...prev, [name]: value }));
    };

    // --- NUEVO: UPLOAD DE PDFs y PPTs a IMAGEKIT ---
    // --- NUEVO: UPLOAD DE PDFs y PPTs a IMAGEKIT ---
    const handleAddCourseFiles = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        try {
            const uploadPromises = files.map(async (originalFile) => {
                let fileToUpload = originalFile;
                const originalExtension = originalFile.name.split('.').pop().toLowerCase();

                // Intercept PPTX/PPT and convert to PDF
                if (['ppt', 'pptx'].includes(originalExtension)) {
                    console.log(`Convirtiendo ${originalFile.name} a PDF...`);
                    const convertFormData = new FormData();
                    convertFormData.append('file', originalFile);
                    
                    const convertResponse = await fetch(`${API_URL}/api/convert/pptx-to-pdf`, {
                        method: 'POST',
                        body: convertFormData
                    });

                    if (!convertResponse.ok) {
                        let errStr = "Error desconocido al convertir.";
                        try {
                            const errObj = await convertResponse.json();
                            errStr = errObj.error || errStr;
                        } catch(e) {
                            errStr = await convertResponse.text();
                        }
                        throw new Error(`Error convirtiendo ${originalFile.name}: ${errStr}`);
                    }

                    const pdfBlob = await convertResponse.blob();
                    const newFileName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) + '.pdf';
                    fileToUpload = new File([pdfBlob], newFileName, { type: 'application/pdf' });
                }

                const authData = await authenticator();
                const formData = new FormData();
                formData.append('file', fileToUpload);
                formData.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
                formData.append("signature", authData.signature);
                formData.append("expire", authData.expire);
                formData.append("token", authData.token);
                formData.append("fileName", fileToUpload.name);
                formData.append("folder", "/products/materials");

                const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const fileData = await response.json();
                    
                    const extension = fileToUpload.name.split('.').pop().toLowerCase();
                    let fileType = 'application/octet-stream';
                    if (['pdf'].includes(extension)) fileType = 'application/pdf';
                    if (['mp4', 'webm'].includes(extension)) fileType = 'video/mp4';
                    if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) fileType = 'image/jpeg';
                    if (['ppt', 'pptx'].includes(extension)) fileType = 'application/vnd.ms-powerpoint';
                    if (['doc', 'docx'].includes(extension)) fileType = 'application/msword';
                    if (['xls', 'xlsx'].includes(extension)) fileType = 'application/vnd.ms-excel';

                    return {
                        name: fileToUpload.name,
                        url: fileData.url,
                        fileType: fileType
                    };
                } else {
                    const err = await response.text();
                    console.error('Upload failed:', err);
                    throw new Error(`Error subiendo ${fileToUpload.name}`);
                }
            });

            const uploadedFiles = await Promise.all(uploadPromises);

            setNuevoProducto(prev => ({
                ...prev,
                archivosInfoproducto: [...prev.archivosInfoproducto, ...uploadedFiles]
            }));
        } catch (error) {
            console.error('Error uploading files:', error);
            alert(`SISTEMA: ${error.message || "Error en la conexión al subir los archivos."}`);
        } finally {
            setLoading(false);
            e.target.value = null; // reset input
        }
    };

    // --- SPEAKING ACTIVITIES LOGIC ---
    const handleToggleSpeakingActivity = (activityId) => {
        setNuevoProducto(prev => {
            const current = prev.speakingActivities || [];
            if (current.includes(activityId)) return { ...prev, speakingActivities: current.filter(id => id !== activityId) };
            return { ...prev, speakingActivities: [...current, activityId] };
        });
    };

    const handleCreateActivity = async () => {
        if (!newActivityTitle.trim()) return;
        setIsCreatingActivity(true);
        try {
            const res = await axios.post(`${API_URL}/api/pronunciation/activities`, {
                title: newActivityTitle.trim(),
                description: 'Actividad creada desde carga de productos.',
                assigned_date: getTodayDate()
            });
            await fetchPronunciationActivities();
            setNuevoProducto(prev => ({ ...prev, speakingActivities: [...(prev.speakingActivities || []), res.data.id] }));
            setNewActivityTitle('');
        } catch (error) {
            console.error(error);
            alert("Error al crear la actividad");
        } finally {
            setIsCreatingActivity(false);
        }
    };

    const handleGenerateFromPDF = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsCreatingActivity(true);
        try {
            const pdfBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });

            const aiRes = await axios.post(`${API_URL}/api/pronunciation/generate-from-pdf`, { pdfBase64 });
            await fetchPronunciationActivities();
            
            setNuevoProducto(prev => ({
                ...prev,
                speakingActivities: [...(prev.speakingActivities || []), aiRes.data.id]
            }));

            alert("¡Actividades generadas exitosamente desde el PDF!");
            setActivityTab('select');
        } catch (error) {
            console.error(error);
            alert("Error al procesar el PDF con la IA");
        } finally {
            setIsCreatingActivity(false);
            e.target.value = null;
        }
    };

    // --- IMAGE PORTADA UPLOAD LOGIC ---
    const onErrorImg = err => {
        console.error("Error", err);
        alert("SISTEMA: Error al subir imagen a la nube.");
        setLoading(false);
        setUploadProgress(0);
    };

    const onSuccessImg = res => {
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

    const onUploadStartImg = (evt) => {
        setFileError('');
        const file = evt.target.files[0];
        if (file && !file.type.startsWith('image/')) {
            setFileError("Solo se permiten imágenes (JPG, PNG, WEBP, etc.).");
            setLoading(false);
            return;
        }
        setLoading(true);
        setUploadProgress(50);
    };

    const handleGuardarProducto = async () => {
        // Validate required fields based on current step or globally
        if (!nuevoProducto.nombre || !nuevoProducto.precioInfoproducto) {
            setErrorMsg("Nombre y Precio son obligatorios.");
            return;
        }

        setLoading(true);
        setErrorMsg('');
        try {
            const productToSave = { ...nuevoProducto, origenDeVenta: 'admin' };
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

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productToSave)
            });

            if (response.ok) {
                alert(`¡Infoproducto "${nuevoProducto.nombre}" creado con éxito!`);
                setNuevoProducto(initialProductState);
                setStep(1);
            } else {
                const errorData = await response.json().catch(() => ({}));
                setErrorMsg(errorData.message || "ERROR: No se pudo crear el infoproducto.");
            }
        } catch (error) {
            setErrorMsg("ERROR: Fallo de conexión o del servidor.");
        } finally {
            setLoading(false);
        }
    };

    // ANIMATIONS
    const fadeVariant = {
        hidden: { opacity: 0, x: 20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    };

    return (
        <div className="bg-[#fcfcfc] min-h-screen text-black p-4 md:p-8 lg:p-12 relative" style={{ fontFamily: '"Inter", sans-serif' }}>
            <AnimatePresence>
                {showPreview && <PreviewModal producto={nuevoProducto} onClose={() => setShowPreview(false)} />}
                {managingActivity && <ActivityManagerModal activity={managingActivity} onClose={() => setManagingActivity(null)} onUpdate={fetchPronunciationActivities} />}
            </AnimatePresence>

            <div className="max-w-5xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-black uppercase tracking-tight mb-2">
                        CREAR INFOPRODUCTO
                    </h1>
                    <p className="font-bold text-xs text-gray-500 uppercase tracking-widest">
                        CONFIGURADOR DE CURSOS Y MATERIALES DIGITALES
                    </p>
                </header>

                {/* STEPPER UI */}
                <div className="flex items-center justify-center mb-12 relative z-10">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full">
                        <motion.div 
                            className="h-full bg-black rounded-full" 
                            initial={{ width: "0%" }}
                            animate={{ width: `${((step - 1) / 2) * 100}%` }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex-1 flex justify-center relative">
                            <div className={`${styles.stepperCircle} ${step >= s ? 'bg-black text-white shadow-lg shadow-black/20 scale-110' : 'bg-gray-200 text-gray-400'}`}>
                                {step > s ? <FiCheck size={20} /> : s}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between px-4 sm:px-12 mb-12 text-[10px] font-black tracking-widest uppercase text-gray-400">
                    <span className={step >= 1 ? 'text-black' : ''}>1. Info Básica</span>
                    <span className={step >= 2 ? 'text-black' : ''}>2. Diseño</span>
                    <span className={step >= 3 ? 'text-black' : ''}>3. Materiales</span>
                </div>

                {/* FORM CONTENEDOR */}
                <div className={styles.card}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" variants={fadeVariant} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                                <h3 className={styles.sectionTitle}><FiFileText className="text-black" /> 1. Información General</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className={styles.label}>Nombre del Curso / Infoproducto</label>
                                        <input type="text" name="nombre" value={nuevoProducto.nombre} onChange={handleInputChange} className={styles.input} placeholder="Ej: Masterclass de Inglés" />
                                    </div>
                                    <div>
                                        <label className={styles.label}>Creador o Academia</label>
                                        <input type="text" name="marca" value={nuevoProducto.marca} onChange={handleInputChange} className={styles.input} placeholder="Ej: Laura Academy" />
                                    </div>
                                    <div>
                                        <label className={styles.label}>Precio de Venta ($)</label>
                                        <input type="number" name="precioInfoproducto" value={nuevoProducto.precioInfoproducto} onChange={handleInputChange} className={styles.input} placeholder="0.00" min="0" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={styles.label}>Categoría</label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                <select name="categoria" value={nuevoProducto.categoria} onChange={handleInputChange} className={styles.input}>
                                                    <option value="">Seleccionar Categoría...</option>
                                                    {categorias.map(cat => <option key={cat.categoryId} value={cat.categoryName}>{cat.categoryName}</option>)}
                                                </select>
                                                <button type="button" onClick={handleDeleteCategory} className="p-4 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"><FiTrash2 size={20} /></button>
                                            </div>
                                            <div className="flex items-center gap-2 flex-1">
                                                <input type="text" value={newCategoryInput} onChange={e => setNewCategoryInput(e.target.value)} className={styles.input} placeholder="Nueva Categoría" />
                                                <button type="button" onClick={handleAddCategory} className="p-4 bg-black text-white hover:bg-gray-800 rounded-xl transition-all"><FiPlus size={20} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" variants={fadeVariant} initial="hidden" animate="visible" exit="exit" className="space-y-8">
                                <h3 className={styles.sectionTitle}><FiImage className="text-black" /> 2. Detalles y Portada</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className={styles.label}>Temario / Beneficios del Curso</label>
                                        <div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-2 no-scrollbar">
                                            {nuevoProducto.descripcion && nuevoProducto.descripcion.split('\n').filter(item => item.trim() !== '').map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200 group">
                                                    <FiCheckCircle className="text-green-500 mt-0.5 shrink-0" size={16} />
                                                    <span className="flex-1 text-sm font-medium text-gray-700">{item}</span>
                                                    <button type="button" onClick={() => {
                                                        const newDesc = nuevoProducto.descripcion.split('\n').filter((_, i) => i !== idx).join('\n');
                                                        setNuevoProducto(prev => ({...prev, descripcion: newDesc}));
                                                    }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><FiX size={18} /></button>
                                                </div>
                                            ))}
                                            {(!nuevoProducto.descripcion || nuevoProducto.descripcion.trim() === '') && (
                                                <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed text-center">No hay ítems añadidos. Escribe uno abajo y presiona Enter.</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2 relative">
                                            <input type="text" id="newDescItem" placeholder="Ej: Acceso de por vida a los materiales..." className={styles.input} onKeyDown={(e) => {
                                                if(e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if(e.target.value.trim()) {
                                                        const currentDesc = nuevoProducto.descripcion ? nuevoProducto.descripcion + '\n' : '';
                                                        setNuevoProducto(prev => ({...prev, descripcion: currentDesc + e.target.value.trim()}));
                                                        e.target.value = '';
                                                    }
                                                }
                                            }}/>
                                            <button type="button" onClick={() => {
                                                const input = document.getElementById('newDescItem');
                                                if(input.value.trim()) {
                                                    const currentDesc = nuevoProducto.descripcion ? nuevoProducto.descripcion + '\n' : '';
                                                    setNuevoProducto(prev => ({...prev, descripcion: currentDesc + input.value.trim()}));
                                                    input.value = '';
                                                }
                                            }} className="bg-black text-white px-5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                                                <FiPlus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <label className={styles.label}>Portada del Curso (1 Imagen)</label>
                                        <div className={`${styles.dropzone} ${loading ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 hover:border-black hover:bg-white'} flex-grow`}>
                                            {loading ? (
                                                <div className="flex flex-col items-center">
                                                    <FiRefreshCcw size={32} className="text-black animate-spin mb-4" />
                                                    <span className="font-bold text-[10px] uppercase tracking-widest text-black">Subiendo...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <FiImage size={48} className="text-gray-300 group-hover:text-black transition-colors mb-4" />
                                                    <span className="font-bold text-xs uppercase tracking-widest text-gray-400 group-hover:text-black">Subir Imagen .JPG .PNG</span>
                                                </>
                                            )}
                                            
                                            <IKContext publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY} urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT} authenticator={authenticator}>
                                                <IKUpload
                                                    fileName="course_cover"
                                                    useUniqueFileName={true}
                                                    folder="/products"
                                                    multiple={false}
                                                    onError={onErrorImg}
                                                    onSuccess={onSuccessImg}
                                                    onUploadStart={onUploadStartImg}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    disabled={loading}
                                                />
                                            </IKContext>
                                            
                                            {nuevoProducto.imagenes.length > 0 && !loading && (
                                                <div className="absolute inset-0 z-10 p-2 bg-white rounded-xl">
                                                    <div className="relative w-full h-full rounded-lg overflow-hidden group/img">
                                                        <img src={nuevoProducto.imagenes[0]} alt="Preview" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(0); }}
                                                            className="absolute inset-0 m-auto w-12 h-12 flex items-center justify-center bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover/img:opacity-100 transition-all hover:bg-black rounded-full"
                                                        >
                                                            <FiTrash2 size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {fileError && <p className="text-red-500 text-[10px] uppercase font-bold mt-2">{fileError}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" variants={fadeVariant} initial="hidden" animate="visible" exit="exit" className="space-y-10">
                                <section>
                                    <h3 className={styles.sectionTitle}><FiLayers className="text-black" /> 3. Materiales del Curso (PDF, PPT, MP4)</h3>
                                    <div className={`${styles.dropzone} ${loading ? 'bg-gray-100 border-gray-300' : 'bg-gray-50 border-gray-200 hover:border-black hover:bg-white'} min-h-[200px]`}>
                                        {loading ? (
                                            <div className="flex flex-col items-center">
                                                <FiRefreshCcw size={32} className="text-black animate-spin mb-4" />
                                                <span className="font-bold text-[10px] uppercase tracking-widest text-black">SUBIENDO ARCHIVOS...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <FiFileText size={48} className="text-gray-300 group-hover:text-black transition-colors mb-4" />
                                                <span className="font-bold text-xs uppercase tracking-widest text-gray-400 group-hover:text-black text-center">CLIC AQUÍ PARA SUBIR MATERIALES<br/>(PDF, PPTX, DOCX, MP4)</span>
                                                <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.mp3,.png,.jpg,.jpeg,video/*,image/*,application/pdf" multiple onChange={handleAddCourseFiles} className="absolute inset-0 opacity-0 cursor-pointer" disabled={loading} />
                                            </>
                                        )}
                                    </div>

                                    {nuevoProducto.archivosInfoproducto.length > 0 && (
                                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {nuevoProducto.archivosInfoproducto.map((archivo, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className="w-10 h-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center shrink-0">
                                                            <FiFileText size={18} />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="text-black text-sm font-bold truncate">{archivo.name}</span>
                                                            <span className="text-gray-400 text-[10px] uppercase font-bold">{archivo.fileType.split('/')[1] || 'Archivo'}</span>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => setNuevoProducto(prev => ({...prev, archivosInfoproducto: prev.archivosInfoproducto.filter((_, i) => i !== index)}))} className="text-gray-400 hover:text-red-500 p-2"><FiTrash2 size={18} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <h3 className={styles.sectionTitle}><FiMic className="text-black" /> Actividades de Pronunciación (IA)</h3>
                                    <div className="border border-gray-200 rounded-3xl p-6 bg-gray-50/50">
                                        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
                                            {['select', 'create', 'ai-pdf'].map(tab => (
                                                <button key={tab} type="button" onClick={() => setActivityTab(tab)} className={`px-4 py-2 text-xs font-bold uppercase rounded-xl transition-all ${activityTab === tab ? 'bg-black text-white shadow-md' : 'bg-white text-gray-500 border border-gray-200 hover:border-black hover:text-black'}`}>
                                                    {tab === 'select' ? 'Seleccionar' : tab === 'create' ? 'Nueva Vacia' : 'Generar PDF'}
                                                </button>
                                            ))}
                                        </div>

                                        {activityTab === 'select' && (
                                            <div className="animate-fade-in">
                                                <input type="text" placeholder="Buscar actividad..." value={activitySearchTerm} onChange={(e) => setActivitySearchTerm(e.target.value)} className={`${styles.input} mb-4 bg-white`} />
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                                    {pronunciationActivitiesList.filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase())).map(act => (
                                                        <div key={act.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-sm cursor-pointer hover:border-black transition-all" onClick={() => handleToggleSpeakingActivity(act.id)}>
                                                            <div className="flex items-center gap-4">
                                                                <input type="checkbox" checked={(nuevoProducto.speakingActivities || []).includes(act.id)} readOnly className="w-5 h-5 accent-black rounded-md" />
                                                                <div>
                                                                    <p className="text-black font-bold text-sm">{act.title}</p>
                                                                    <p className="text-gray-400 text-[10px] font-bold uppercase">{act.PronunciationTasks?.length || 0} Tareas</p>
                                                                </div>
                                                            </div>
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setManagingActivity(act); }} className="text-xs font-bold bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors">TAREAS</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activityTab === 'create' && (
                                            <div className="animate-fade-in flex gap-4">
                                                <input type="text" value={newActivityTitle} onChange={e => setNewActivityTitle(e.target.value)} placeholder="Título de la Actividad..." className={`${styles.input} bg-white flex-1`} onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); handleCreateActivity(); } }} />
                                                <button type="button" onClick={handleCreateActivity} disabled={isCreatingActivity || !newActivityTitle.trim()} className={styles.btnPrimary}>{isCreatingActivity ? 'Creando...' : 'Crear'}</button>
                                            </div>
                                        )}

                                        {activityTab === 'ai-pdf' && (
                                            <div className={`${styles.dropzone} bg-white hover:border-purple-500 hover:bg-purple-50 transition-colors`}>
                                                {isCreatingActivity ? (
                                                    <div className="flex flex-col items-center">
                                                        <FiRefreshCcw size={32} className="text-purple-500 animate-spin mb-4" />
                                                        <span className="font-bold text-[10px] uppercase tracking-widest text-purple-600">La IA ESTÁ LEYENDO EL PDF...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <FiFileText size={48} className="text-purple-300 group-hover:text-purple-500 mb-4 transition-colors" />
                                                        <span className="font-bold text-xs uppercase tracking-widest text-purple-400 group-hover:text-purple-600 text-center">SUBIR PDF PARA GENERAR TAREAS DE PRONUNCIACIÓN</span>
                                                        <input type="file" accept="application/pdf" onChange={handleGenerateFromPDF} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isCreatingActivity} />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ERROR Y BOTONES DE NAVEGACION */}
                <div className="mt-8 flex justify-between items-center">
                    <div>
                        {errorMsg && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className={styles.alertNeutral}>
                                <FiAlertTriangle size={18} /> {errorMsg}
                            </motion.div>
                        )}
                    </div>
                    
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setShowPreview(true)} className={`${styles.btnSecondary} mr-4`}>
                            <FiEye size={18} /> Vista Previa
                        </button>

                        {step > 1 && (
                            <button type="button" onClick={() => setStep(step - 1)} className={styles.btnSecondary}>
                                <FiChevronLeft size={18} /> Volver
                            </button>
                        )}

                        {step < 3 ? (
                            <button type="button" onClick={() => setStep(step + 1)} className={styles.btnPrimary}>
                                Siguiente <FiChevronRight size={18} />
                            </button>
                        ) : (
                            <button type="button" onClick={handleGuardarProducto} disabled={loading} className={`${styles.btnPrimary} bg-green-600 hover:bg-green-700`}>
                                {loading ? "PROCESANDO..." : <><FiCheck size={18} /> FINALIZAR CURSO</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CargaDeProductosContent;