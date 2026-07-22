import React, { useState, useEffect } from 'react';
import {
    FiUploadCloud, FiImage, FiMonitor, FiTrash2, FiCheck,
    FiLayers, FiMaximize2, FiActivity, FiGlobe, FiRefreshCw,
    FiAward, FiPlusCircle
} from 'react-icons/fi';
const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ESTILOS (Brutalismo Suave) ---
const STYLES = {
    title: "font-black uppercase tracking-tighter text-black flex items-center gap-2",
    label: "font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-2 block",
    tech: "font-bold tracking-widest uppercase",
    card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
    input: "w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all placeholder:text-gray-400",
    buttonAction: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2",
    buttonSecondary: "bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-lg transition-all py-3 px-4 flex items-center justify-center gap-2",
    tabActive: "text-black bg-white border-t border-l border-r border-gray-200 rounded-t-xl z-10 relative -mb-[1px]",
    tabInactive: "text-gray-500 hover:text-black bg-gray-50 border-b border-gray-200 rounded-t-xl",
    alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-gray-100 border-gray-300 text-black text-xs font-bold uppercase",
};

// --- CONFIGURACIÓN IMAGEKIT ---
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

const SECCIONES = {
    PROMOS: { id: 2, label: 'PROMOS_MEDIA', aspect: '16:9', icon: FiActivity, putUrl: `${API_URL}/contenido/actualizarContenidoVisual/2` },
    REPARACIONES: { id: 3, label: 'MOD_REPARACIONES', aspect: '4:3', icon: FiLayers, putUrl: `${API_URL}/contenido/actualizarContenidoVisual/3` }
};

const CASOS_EXITO_CONFIG = {
    id: 'CASOS_EXITO',
    label: 'Casos de Éxito',
    icon: FiAward,
    endpoints: {
        get: `${API_URL}/success-cases/get`,
        post: `${API_URL}/success-cases/post`,
        delete: `${API_URL}/success-cases/delete`
    }
};

const HERO_SLIDER_CONFIG = {
    id: 'HERO_SLIDER',
    label: 'Slider Inicio',
    icon: FiMonitor,
    endpoints: {
        get: `${API_URL}/api/hero-slider`,
        post: `${API_URL}/api/hero-slider`,
        delete: `${API_URL}/api/hero-slider`
    }
};

const CargaContenidoWeb = () => {
    const [seccionDestino, setSeccionDestino] = useState('HERO_SLIDER');
    const [dbContent, setDbContent] = useState({}); // Almacena URLs actuales de la DB
    const [dbPositions, setDbPositions] = useState({}); // Almacena posiciones actuales de la DB
    const [previewFile, setPreviewFile] = useState(null); // Archivo crudo para Cloudinary
    const [previewUrl, setPreviewUrl] = useState(null); // URL local para previsualización
    const [verticalOffset, setVerticalOffset] = useState(50); // 0-100%
    const [loading, setLoading] = useState(true);
    const [subiendo, setSubiendo] = useState(false);
    const [fileError, setFileError] = useState('');

    // --- Estados para Casos de Éxito ---
    const [casosExito, setCasosExito] = useState([]);
    const [newCaseData, setNewCaseData] = useState({
        equipo: '',
        falla: '',
        resultado: ''
    });
    const [isSubmittingCase, setIsSubmittingCase] = useState(false);

    // --- Estados para Slider Inicio ---
    const [heroSlides, setHeroSlides] = useState([]);
    const [newHeroSlideData, setNewHeroSlideData] = useState({
        title: '', subtitle: '', label: ''
    });
    const [isSubmittingSlide, setIsSubmittingSlide] = useState(false);

    // 1. HIDRATACIÓN INICIAL (GET)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await fetch(`${API_URL}/contenido/obtenerContenidoVisual`);
                const data = await response.json();
                const map = {};
                const posMap = {};
                data.forEach(item => {
                    map[item.CmsVisualId] = item.imageUrl;
                    posMap[item.CmsVisualId] = item.position || '50% 50%';
                });
                setDbContent(map);
                setDbPositions(posMap);
            } catch (error) { console.error("CMS_INIT_ERROR"); }
            setLoading(false);
        };

        const fetchCasosExito = async () => {
            try {
                const response = await fetch(CASOS_EXITO_CONFIG.endpoints.get);
                if (!response.ok) throw new Error('Failed to fetch success cases');
                const data = await response.json();
                if (Array.isArray(data)) {
                    setCasosExito(data);
                }
            } catch (error) {
                console.error("CASOS_EXITO_FETCH_ERROR", error);
            }
        };

        const fetchHeroSlides = async () => {
            try {
                const response = await fetch(HERO_SLIDER_CONFIG.endpoints.get);
                if (response.ok) {
                    const data = await response.json();
                    setHeroSlides(data);
                }
            } catch (error) { console.error("HERO_SLIDE_FETCH_ERROR", error); }
        };

        fetchInitialData();
        fetchCasosExito();
        fetchHeroSlides();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFileError('');
        if (file) {
            if (!file.type.startsWith('image/')) {
                setFileError("FORMATO NO VÁLIDO: POR FAVOR SUBIR UNA IMAGEN (JPG, PNG, WEBP).");
                return;
            }
            setPreviewFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleNewCaseChange = (e) => {
        const { name, value } = e.target;
        setNewCaseData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewHeroSlideChange = (e) => {
        const { name, value } = e.target;
        setNewHeroSlideData(prev => ({ ...prev, [name]: value }));
    };

    // 2. PROCESO DE CARGA (IMAGEKIT + BACKEND PUT)
    const handleUpload = async () => {
        if (!previewFile) return;
        setSubiendo(true);

        try {
            const section = SECCIONES[seccionDestino];
            // FASE A: SUBIDA A IMAGEKIT
            const authParams = await authenticator();
            const formData = new FormData();
            formData.append('file', previewFile);
            formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
            formData.append('signature', authParams.signature);
            formData.append('expire', authParams.expire);
            formData.append('token', authParams.token);
            formData.append('folder', '/content');
            formData.append('fileName', `${section.label}_${Date.now()}`);

            const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData
            });

            if (!ikRes.ok) {
                const errorData = await ikRes.json();
                throw new Error(`IMAGEKIT_UPLOAD_FAILED: ${errorData.message || ikRes.statusText}`);
            }

            const ikFile = await ikRes.json();
            const secureUrl = ikFile.url;

            if (!secureUrl) {
                throw new Error("IMAGEKIT_ERROR: URL_DE_IMAGEN_NO_GENERADA");
            }

            // FASE B: ACTUALIZAR BACKEND LOCAL (PUT)
            const response = await fetch(section.putUrl, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: secureUrl,
                    seccion: seccionDestino,
                    label: section.label,
                    position: `50% ${verticalOffset}%`
                })
            });

            if (response.ok) {
                setDbContent(prev => ({ ...prev, [section.id]: secureUrl }));
                setDbPositions(prev => ({ ...prev, [section.id]: `50% ${verticalOffset}%` }));
                setPreviewUrl(null);
                setPreviewFile(null);
                alert(`SISTEMA: ASSET_ID_${section.id}_SINCRONIZADO_EXITOSAMENTE`);
            } else {
                const backError = await response.json();
                throw new Error(`BACKEND_SYNC_FAILED: ${backError.message} | ${backError.detail || ''}`);
            }
        } catch (error) {
            alert(`SISTEMA_ERROR: ${error.message}`);
        } finally {
            setSubiendo(false);
        }
    };

    const handleDelete = async () => {
        const section = SECCIONES[seccionDestino];
        const currentUrl = dbContent[section.id];

        if (!currentUrl) {
            alert("SISTEMA: NO_HAY_CONTENIDO_QUE_ELIMINAR");
            return;
        }

        if (!confirm(`¿ESTÁS SEGURO DE ELIMINAR EL ASSET EN ${section.label}? ESTA ACCIÓN NO SE PUEDE DESHACER.`)) return;

        setSubiendo(true);
        try {
            const response = await fetch(`${API_URL}/contenido/eliminarContenidoVisual/${section.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setDbContent(prev => ({ ...prev, [section.id]: null }));
                setDbPositions(prev => ({ ...prev, [section.id]: '50% 50%' }));
                setVerticalOffset(50);
                alert("SISTEMA: ASSET_ELIMINADO_CON_ÉXITO");
            } else {
                throw new Error("FALLO_AL_ELIMINAR_DEL_BACKEND");
            }
        } catch (error) {
            alert(`SISTEMA_ERROR: ${error.message}`);
        } finally {
            setSubiendo(false);
        }
    };

    const handleSuccessCaseUpload = async () => {
        if (!previewFile || !newCaseData.equipo || !newCaseData.falla || !newCaseData.resultado) {
            alert("SISTEMA: Por favor, complete todos los campos y seleccione una imagen.");
            return;
        }
        setIsSubmittingCase(true);

        try {
            // FASE A: SUBIDA A IMAGEKIT
            const authParams = await authenticator();
            const formData = new FormData();
            formData.append('file', previewFile);
            formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
            formData.append('signature', authParams.signature);
            formData.append('expire', authParams.expire);
            formData.append('token', authParams.token);
            formData.append('folder', '/casos-exito');
            formData.append('fileName', `caso_exito_${Date.now()}`);

            const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData
            });

            if (!ikRes.ok) {
                const errorData = await ikRes.json();
                throw new Error(`IMAGEKIT_UPLOAD_FAILED: ${errorData.message || ikRes.statusText}`);
            }

            const ikFile = await ikRes.json();
            const secureUrl = ikFile.url;

            if (!secureUrl) {
                throw new Error("IMAGEKIT_ERROR: URL_DE_IMAGEN_NO_GENERADA");
            }

            // FASE B: POST al backend local
            const casePayload = { ...newCaseData, imagen: secureUrl };

            const response = await fetch(CASOS_EXITO_CONFIG.endpoints.post, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(casePayload)
            });

            if (response.ok) {
                const newCase = await response.json();
                setCasosExito(prev => [newCase, ...prev]);
                setNewCaseData({ equipo: '', falla: '', resultado: '' });
                setPreviewFile(null);
                setPreviewUrl(null);
                alert("SISTEMA: CASO_DE_ÉXITO_CREADO_Y_SINCRONIZADO");
            } else {
                let errorMessage;
                try {
                    const backError = await response.json();
                    errorMessage = backError.message || 'Error desconocido';
                } catch (e) {
                    errorMessage = `Error de servidor (${response.status}). Posiblemente la ruta no existe o devolvió HTML.`;
                }
                throw new Error(`BACKEND_SYNC_FAILED: ${errorMessage}`);
            }
        } catch (error) {
            alert(`SISTEMA_ERROR: ${error.message}`);
        } finally {
            setIsSubmittingCase(false);
        }
    };

    const handleSuccessCaseDelete = async (caseId) => {
        if (!confirm("¿ESTÁS SEGURO DE ELIMINAR ESTE CASO DE ÉXITO? LA ACCIÓN ES IRREVERSIBLE.")) return;

        try {
            const response = await fetch(`${CASOS_EXITO_CONFIG.endpoints.delete}/${caseId}`, { method: 'DELETE' });
            if (response.ok) {
                setCasosExito(prev => prev.filter(c => c.id !== caseId));
                alert("SISTEMA: CASO_DE_ÉXITO_ELIMINADO");
            } else {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || "Error al eliminar el caso.";
                } catch (e) {
                    errorMessage = `Error de servidor (${response.status}).`;
                }
                throw new Error(errorMessage);
            }
        } catch (error) { alert(`SISTEMA_ERROR: ${error.message}`); }
    };

    const handleHeroSlideUpload = async () => {
        if (!previewFile || !newHeroSlideData.title || !newHeroSlideData.subtitle || !newHeroSlideData.label) {
            alert("SISTEMA: Por favor, complete todos los campos y seleccione una imagen.");
            return;
        }
        setIsSubmittingSlide(true);

        try {
            // FASE A: SUBIDA A IMAGEKIT
            const authParams = await authenticator();
            const formData = new FormData();
            formData.append('file', previewFile);
            formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
            formData.append('signature', authParams.signature);
            formData.append('expire', authParams.expire);
            formData.append('token', authParams.token);
            formData.append('folder', '/hero-slides');
            formData.append('fileName', `hero_slide_${Date.now()}`);

            const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
                method: 'POST',
                body: formData
            });

            if (!ikRes.ok) throw new Error(`IMAGEKIT_UPLOAD_FAILED`);

            const ikFile = await ikRes.json();
            const secureUrl = ikFile.url;

            // FASE B: POST al backend local
            const slidePayload = { ...newHeroSlideData, image: secureUrl, position: `center ${verticalOffset}%` };

            const response = await fetch(HERO_SLIDER_CONFIG.endpoints.post, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(slidePayload)
            });

            if (response.ok) {
                const newSlide = await response.json();
                setHeroSlides(prev => [newSlide, ...prev]);
                setNewHeroSlideData({ title: '', subtitle: '', label: '' });
                setPreviewFile(null);
                setPreviewUrl(null);
                alert("SISTEMA: HERO_SLIDE_CREADO");
            } else {
                throw new Error(`BACKEND_SYNC_FAILED`);
            }
        } catch (error) {
            alert(`SISTEMA_ERROR: ${error.message}`);
        } finally {
            setIsSubmittingSlide(false);
        }
    };

    const handleHeroSlideDelete = async (slideId) => {
        if (!confirm("¿ESTÁS SEGURO DE ELIMINAR ESTE SLIDE?")) return;
        try {
            const response = await fetch(`${HERO_SLIDER_CONFIG.endpoints.delete}/${slideId}`, { method: 'DELETE' });
            if (response.ok) {
                setHeroSlides(prev => prev.filter(s => s.id !== slideId));
            }
        } catch (error) { alert(`SISTEMA_ERROR: ${error.message}`); }
    };

    if (loading) return (
        <div className="h-screen bg-white flex items-center justify-center text-gray-500 tracking-widest animate-pulse font-bold text-xs" style={{ fontFamily: '"Inter", sans-serif' }}>
            SINCRONIZANDO CORE...
        </div>
    );

    return (
        <div className="p-4 md:p-8 lg:p-12 bg-white min-h-screen text-black space-y-8" style={{ fontFamily: '"Inter", sans-serif' }}>

            {/* HEADER INTEGRADO */}
            <header className="mb-10 border-b border-gray-200 pb-8">
                <h2 className={`${STYLES.title} text-3xl md:text-5xl`}><FiGlobe className="inline text-black mr-2" /> CMS VISUAL CORE</h2>
                <p className={`${STYLES.tech} text-[10px] text-gray-500 mt-2 tracking-widest`}>IMAGEKIT GATEWAY ACTIVE</p>
                
                <div className="flex mt-8 overflow-x-auto no-scrollbar gap-2">
                    {Object.keys(SECCIONES).map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSeccionDestino(key);
                                setPreviewUrl(null);
                                setPreviewFile(null);
                                const currentPos = dbPositions[SECCIONES[key].id] || '50% 50%';
                                const parts = currentPos.split(' ');
                                if (parts.length === 2) {
                                    const vPercent = parseInt(parts[1]);
                                    if (!isNaN(vPercent)) setVerticalOffset(vPercent);
                                    else setVerticalOffset(50);
                                } else {
                                    setVerticalOffset(50);
                                }
                            }}
                            className={`whitespace-nowrap px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${seccionDestino === key ? STYLES.tabActive : STYLES.tabInactive}`}
                        >
                            <FiImage size={16} /> {SECCIONES[key].label}
                        </button>
                    ))}
                    <button
                        key={CASOS_EXITO_CONFIG.id}
                        onClick={() => {
                            setSeccionDestino(CASOS_EXITO_CONFIG.id);
                            setPreviewUrl(null);
                            setPreviewFile(null);
                        }}
                        className={`whitespace-nowrap px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${seccionDestino === CASOS_EXITO_CONFIG.id ? STYLES.tabActive : STYLES.tabInactive}`}
                    >
                        <FiAward size={16} /> {CASOS_EXITO_CONFIG.label}
                    </button>
                    <button
                        key={HERO_SLIDER_CONFIG.id}
                        onClick={() => {
                            setSeccionDestino(HERO_SLIDER_CONFIG.id);
                            setPreviewUrl(null);
                            setPreviewFile(null);
                            setVerticalOffset(50);
                        }}
                        className={`whitespace-nowrap px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${seccionDestino === HERO_SLIDER_CONFIG.id ? STYLES.tabActive : STYLES.tabInactive}`}
                    >
                        <FiMonitor size={16} /> {HERO_SLIDER_CONFIG.label}
                    </button>
                    <div className="flex-grow border-b border-gray-200"></div>
                </div>
            </header>

            {Object.keys(SECCIONES).includes(seccionDestino) && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* PANEL DE CONTROL VISUAL */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className={STYLES.card}>
                            <label className={STYLES.label}>ORIGEN DE DATOS MULTIMEDIA</label>
                            <div className={`relative h-60 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-black cursor-pointer ${previewUrl ? 'border-black' : 'border-gray-300'}`}>
                                {!previewUrl ? (
                                    <>
                                        <FiUploadCloud size={40} className="text-gray-400 mb-4" />
                                        <label className={`${STYLES.buttonSecondary} cursor-pointer`}>
                                            SELECCIONAR ARCHIVO
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    </>
                                ) : (
                                    <div className="relative w-full h-full p-2">
                                        <img src={previewUrl} className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm" alt="Preview" />
                                        <button onClick={() => { setPreviewUrl(null); setPreviewFile(null); setFileError(''); }} className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-500 rounded-lg transition-colors shadow-sm"><FiTrash2 size={16} /></button>
                                    </div>
                                )}
                            </div>
                            {fileError && (
                                <div className={`mt-4 ${STYLES.alertNeutral} border-red-200 bg-red-50 text-red-600`}>
                                    {fileError}
                                </div>
                            )}
                        </section>

                        <section className={`${STYLES.card} space-y-6`}>
                            <div className="space-y-4">
                                <label className={STYLES.label}>POSICIÓN VERTICAL DE IMAGEN</label>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-500">TOP</span>
                                    <input type="range" min="0" max="100" value={verticalOffset} onChange={(e) => setVerticalOffset(e.target.value)} className="flex-1 accent-black h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] font-bold text-gray-500">BOTTOM</span>
                                </div>
                                <div className="text-center font-bold text-xs text-black">{verticalOffset}%</div>
                            </div>
                            
                            <div className="flex justify-between items-center bg-gray-50 p-4 border border-gray-200 rounded-xl">
                                <span className={STYLES.label + " !mb-0"}>ENDPOINT DESTINO</span>
                                <span className="text-xs text-black font-black bg-white px-3 py-1 rounded-md shadow-sm border border-gray-200">ID_{SECCIONES[seccionDestino].id}</span>
                            </div>

                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
                                <button disabled={!previewUrl || subiendo} onClick={handleUpload} className={`${STYLES.buttonAction} w-full py-4 ${(!previewUrl || subiendo) && 'opacity-50 cursor-not-allowed'}`}>
                                    {subiendo ? <FiRefreshCw className="animate-spin" size={18} /> : <FiCheck size={18} />}
                                    {subiendo ? 'SUBIENDO...' : 'SINCRONIZAR CON PRODUCCIÓN'}
                                </button>
                                <button onClick={handleDelete} disabled={!dbContent[SECCIONES[seccionDestino].id] || subiendo} className={`${STYLES.buttonSecondary} w-full py-4 text-red-500 hover:text-red-600 hover:border-red-600 hover:bg-red-50 ${(!dbContent[SECCIONES[seccionDestino].id] || subiendo) && 'opacity-50 cursor-not-allowed text-gray-400 hover:text-gray-400 hover:border-gray-300 hover:bg-white'}`}>
                                    <FiTrash2 size={16} /> ELIMINAR DE PRODUCCIÓN
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* VISUALIZADOR DE RENDERING */}
                    <div className="lg:col-span-7 space-y-4">
                        <h3 className={`${STYLES.tech} text-xs text-gray-500 flex items-center gap-2`}><FiMaximize2 /> MONITOR EN TIEMPO REAL</h3>
                        <div className="relative bg-gray-50 border border-gray-200 rounded-2xl shadow-sm h-[400px] md:h-[550px] overflow-hidden flex flex-col">
                            <div className="bg-white p-4 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate">{previewUrl ? "VISTA PREVIA LOCAL" : `PROD URL: ${dbContent[SECCIONES[seccionDestino].id] || 'SIN ASIGNAR'}`}</div>
                            </div>
                            <div className="relative w-full flex-grow p-6 flex items-start justify-center overflow-hidden">
                                {(previewUrl || dbContent[SECCIONES[seccionDestino].id]) ? (
                                    <div className="w-full relative shadow-lg rounded-xl overflow-hidden border border-gray-200">
                                        <img src={previewUrl || dbContent[SECCIONES[seccionDestino].id]} className="w-full object-cover" style={{ aspectRatio: SECCIONES[seccionDestino].aspect.replace(':', '/'), objectPosition: previewUrl ? `center ${verticalOffset}%` : (dbPositions[SECCIONES[seccionDestino].id] || 'center center') }} alt="Output" />
                                        {previewUrl && (<div className="absolute top-4 right-4 bg-black text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md">PENDIENTE</div>)}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                        <FiImage size={60} className="mb-4" />
                                        <p className="font-bold text-xs uppercase tracking-widest">SIN CONTENIDO EN PRODUCCIÓN</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {seccionDestino === CASOS_EXITO_CONFIG.id && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* PANEL DE CONTROL - FORMULARIO CASOS DE ÉXITO */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className={STYLES.card}>
                            <label className={STYLES.label}>1. IMAGEN DEL CASO</label>
                            <div className={`relative h-48 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-black cursor-pointer ${previewUrl ? 'border-black' : 'border-gray-300'}`}>
                                {!previewUrl ? (
                                    <><FiUploadCloud size={30} className="text-gray-400 mb-4" /><label className={`${STYLES.buttonSecondary} cursor-pointer`}>SELECCIONAR IMAGEN<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label></>
                                ) : (
                                    <div className="relative w-full h-full p-2"><img src={previewUrl} className="w-full h-full object-cover rounded-lg border border-gray-200" alt="Preview" /><button onClick={() => { setPreviewUrl(null); setPreviewFile(null); setFileError(''); }} className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-lg transition-colors"><FiTrash2 size={16} /></button></div>
                                )}
                            </div>
                            {fileError && (
                                <div className={`mt-4 ${STYLES.alertNeutral} border-red-200 bg-red-50 text-red-600`}>
                                    {fileError}
                                </div>
                            )}
                        </section>

                        <section className={`${STYLES.card} space-y-6`}>
                            <label className={STYLES.label}>2. DETALLES DEL CASO</label>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">EQUIPO</label><input name="equipo" value={newCaseData.equipo} onChange={handleNewCaseChange} placeholder="EJ: IPHONE 12 PRO" className={STYLES.input} /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">FALLA</label><input name="falla" value={newCaseData.falla} onChange={handleNewCaseChange} placeholder="EJ: NO ENCIENDE" className={STYLES.input} /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">RESULTADO</label><textarea name="resultado" value={newCaseData.resultado} onChange={handleNewCaseChange} placeholder="EJ: SE REEMPLAZÓ EL IC DE CARGA..." className={`${STYLES.input} h-24 resize-none`} rows="3"></textarea></div>
                            </div>
                            <div className="pt-4 border-t border-gray-200">
                                <button onClick={handleSuccessCaseUpload} disabled={isSubmittingCase || !previewFile || !newCaseData.equipo} className={`${STYLES.buttonAction} w-full py-4 ${(isSubmittingCase || !previewFile || !newCaseData.equipo) && 'opacity-50 cursor-not-allowed'}`}>
                                    {isSubmittingCase ? <FiRefreshCw className="animate-spin" size={18} /> : <FiPlusCircle size={18} />}
                                    {isSubmittingCase ? 'GUARDANDO...' : 'GUARDAR CASO'}
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* LISTADO DE CASOS DE ÉXITO */}
                    <div className="lg:col-span-7 space-y-4">
                        <h3 className={`${STYLES.tech} text-xs text-gray-500 flex items-center gap-2`}><FiAward /> HISTORIAL ({casosExito.length})</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm h-[600px] overflow-y-auto space-y-4">
                            {casosExito.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                    <FiImage size={60} className="mb-4" />
                                    <p className="font-bold text-xs uppercase tracking-widest text-gray-500">SIN CASOS CARGADOS</p>
                                </div>
                            ) : (
                                casosExito.map(caso => (
                                    <div key={caso.id} className="flex flex-col sm:flex-row items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:border-black">
                                        <img src={caso.imagen} className="w-full sm:w-32 h-48 sm:h-32 object-cover rounded-lg border border-gray-100" alt={caso.equipo} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-black text-lg text-black uppercase tracking-tighter truncate">{caso.equipo}</h4>
                                                <button onClick={() => handleSuccessCaseDelete(caso.id)} className="sm:hidden p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"><FiTrash2 size={16} /></button>
                                            </div>
                                            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mt-1">FALLA: {caso.falla}</p>
                                            <p className="text-sm text-black mt-3 italic line-clamp-3">"{caso.resultado}"</p>
                                        </div>
                                        <button onClick={() => handleSuccessCaseDelete(caso.id)} className="hidden sm:flex p-3 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 flex-shrink-0 self-center"><FiTrash2 size={18} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {seccionDestino === HERO_SLIDER_CONFIG.id && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* PANEL DE CONTROL - FORMULARIO HERO SLIDER */}
                    <div className="lg:col-span-5 space-y-6">
                        <section className={STYLES.card}>
                            <label className={STYLES.label}>1. IMAGEN DEL SLIDE</label>
                            <div className={`relative h-48 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-black cursor-pointer ${previewUrl ? 'border-black' : 'border-gray-300'}`}>
                                {!previewUrl ? (
                                    <><FiUploadCloud size={30} className="text-gray-400 mb-4" /><label className={`${STYLES.buttonSecondary} cursor-pointer`}>SELECCIONAR IMAGEN<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label></>
                                ) : (
                                    <div className="relative w-full h-full p-2"><img src={previewUrl} className="w-full h-full object-cover rounded-lg border border-gray-200" style={{ objectPosition: `center ${verticalOffset}%` }} alt="Preview" /><button onClick={() => { setPreviewUrl(null); setPreviewFile(null); setFileError(''); }} className="absolute top-4 right-4 p-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-lg transition-colors"><FiTrash2 size={16} /></button></div>
                                )}
                            </div>
                            {fileError && (
                                <div className={`mt-4 ${STYLES.alertNeutral} border-red-200 bg-red-50 text-red-600`}>
                                    {fileError}
                                </div>
                            )}
                        </section>

                        <section className={`${STYLES.card} space-y-6`}>
                            <label className={STYLES.label}>2. TEXTOS DEL SLIDE</label>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">ETIQUETA SUPERIOR</label><input name="label" value={newHeroSlideData.label} onChange={handleNewHeroSlideChange} placeholder="EJ: LU PETRUCCELLI" className={STYLES.input} /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">TÍTULO PRINCIPAL</label><input name="title" value={newHeroSlideData.title} onChange={handleNewHeroSlideChange} placeholder="EJ: ELEGANCE & STYLE" className={STYLES.input} /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">SUBTÍTULO</label><input name="subtitle" value={newHeroSlideData.subtitle} onChange={handleNewHeroSlideChange} placeholder="EJ: HANDMADE COLLECTION" className={STYLES.input} /></div>
                            </div>
                            
                            <div className="space-y-4 mt-8 pt-6 border-t border-gray-200">
                                <label className={STYLES.label}>3. POSICIÓN VERTICAL DE IMAGEN</label>
                                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-500">TOP</span>
                                    <input type="range" min="0" max="100" value={verticalOffset} onChange={(e) => setVerticalOffset(e.target.value)} className="flex-1 accent-black h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] font-bold text-gray-500">BOTTOM</span>
                                </div>
                                <div className="text-center font-bold text-xs text-black">{verticalOffset}%</div>
                            </div>

                            <div className="pt-4 mt-4 border-t border-gray-200">
                                <button onClick={handleHeroSlideUpload} disabled={isSubmittingSlide || !previewFile || !newHeroSlideData.title || !newHeroSlideData.subtitle || !newHeroSlideData.label} className={`${STYLES.buttonAction} w-full py-4 ${(isSubmittingSlide || !previewFile || !newHeroSlideData.title || !newHeroSlideData.subtitle || !newHeroSlideData.label) && 'opacity-50 cursor-not-allowed'}`}>
                                    {isSubmittingSlide ? <FiRefreshCw className="animate-spin" size={18} /> : <FiPlusCircle size={18} />}
                                    {isSubmittingSlide ? 'GUARDANDO...' : 'GUARDAR SLIDE'}
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* LISTADO DE SLIDES */}
                    <div className="lg:col-span-7 space-y-4">
                        <h3 className={`${STYLES.tech} text-xs text-gray-500 flex items-center gap-2`}><FiMonitor /> SLIDES CONFIGURADOS ({heroSlides.length})</h3>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 shadow-sm h-[700px] overflow-y-auto space-y-4">
                            {heroSlides.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                                    <FiImage size={60} className="mb-4" />
                                    <p className="font-bold text-xs uppercase tracking-widest text-gray-500">SIN SLIDES CARGADOS</p>
                                </div>
                            ) : (
                                heroSlides.map(slide => (
                                    <div key={slide.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-white border border-gray-200 rounded-xl shadow-sm transition-all hover:border-black">
                                        <img src={slide.image} className="w-full sm:w-48 h-48 sm:h-32 object-cover rounded-lg border border-gray-100 shadow-sm" style={{ objectPosition: slide.position || 'center' }} alt={slide.title} />
                                        <div className="flex-1 w-full text-center sm:text-left">
                                            <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">{slide.label}</p>
                                            <h4 className="font-black text-xl text-black uppercase tracking-tighter mb-2">{slide.title}</h4>
                                            <p className="text-sm text-gray-600 italic">"{slide.subtitle}"</p>
                                        </div>
                                        <button onClick={() => handleHeroSlideDelete(slide.id)} className="w-full sm:w-auto p-4 flex justify-center text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors border border-gray-200"><FiTrash2 size={18} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CargaContenidoWeb;