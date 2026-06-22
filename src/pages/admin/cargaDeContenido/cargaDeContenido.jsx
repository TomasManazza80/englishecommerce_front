import React, { useState, useEffect } from 'react';
import {
    FiUploadCloud, FiImage, FiMonitor, FiTrash2, FiCheck,
    FiLayers, FiMaximize2, FiActivity, FiGlobe, FiRefreshCw,
    FiAward, FiPlusCircle
} from 'react-icons/fi';
const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ESTILOS BLANCO Y NEGRO (INTER) ---
const STYLES = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] text-[10px] md:text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['Inter'] tracking-widest uppercase",
    glass: "bg-white/[0.02] backdrop-blur-xl border border-white/10",
    input: "bg-black/20 border border-white/10 p-3 w-full text-sm font-['Inter'] placeholder:text-zinc-600 placeholder:uppercase focus:border-white focus:outline-none transition-colors",
    buttonAction: "bg-white text-black font-['Inter'] font-[900] uppercase tracking-widest transition-all hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
    tabActive: "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]",
    tabInactive: "text-zinc-500 hover:text-white border border-white/5"
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

    const API_URL = import.meta.env.VITE_API_URL;

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

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white font-['Inter'] tracking-[0.2em] animate-pulse">SINCRONIZANDO_CORE...</div>;

    return (
        <div className="p-4 md:p-10 bg-black min-h-screen text-white font-['Inter'] space-y-6 md:space-y-12">

            {/* HEADER INTEGRADO */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 border-b border-white/5 pb-6 md:pb-10">
                <div>
                    <h2 className={STYLES.title + " text-2xl md:text-4xl"}><FiGlobe className="inline text-white mr-4" />CMS_<span className="text-white">VISUAL_CORE</span></h2>
                    <p className={STYLES.tech + " text-[8px] md:text-[10px] text-zinc-500 mt-2 md:mt-4 tracking-[0.3em] md:tracking-[0.5em]"}>IMAGEKIT_GATEWAY_ACTIVE</p>
                </div>

                <div className={STYLES.glass + " p-1 flex overflow-x-auto max-w-full no-scrollbar gap-1"}>
                    {Object.keys(SECCIONES).map((key) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSeccionDestino(key);
                                setPreviewUrl(null);
                                setPreviewFile(null);
                                // Sincronizar slider con la posición guardada
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
                            className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-3 text-[9px] md:text-[10px] font-black tracking-widest uppercase transition-all ${seccionDestino === key ? STYLES.tabActive : STYLES.tabInactive}`}
                        >
                            {SECCIONES[key].label}
                        </button>
                    ))}
                    <button
                        key={CASOS_EXITO_CONFIG.id}
                        onClick={() => {
                            setSeccionDestino(CASOS_EXITO_CONFIG.id);
                            setPreviewUrl(null);
                            setPreviewFile(null);
                        }}
                        className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-3 text-[9px] md:text-[10px] font-black tracking-widest uppercase transition-all ${seccionDestino === CASOS_EXITO_CONFIG.id ? STYLES.tabActive : STYLES.tabInactive}`}
                    >
                        {CASOS_EXITO_CONFIG.label}
                    </button>
                    <button
                        key={HERO_SLIDER_CONFIG.id}
                        onClick={() => {
                            setSeccionDestino(HERO_SLIDER_CONFIG.id);
                            setPreviewUrl(null);
                            setPreviewFile(null);
                            setVerticalOffset(50);
                        }}
                        className={`whitespace-nowrap px-4 md:px-6 py-2 md:py-3 text-[9px] md:text-[10px] font-black tracking-widest uppercase transition-all ${seccionDestino === HERO_SLIDER_CONFIG.id ? STYLES.tabActive : STYLES.tabInactive}`}
                    >
                        {HERO_SLIDER_CONFIG.label}
                    </button>
                </div>
            </header>

            {Object.keys(SECCIONES).includes(seccionDestino) && (
                <div className="grid grid-cols-12 gap-6 md:gap-12">
                    {/* PANEL DE CONTROL VISUAL */}
                    <div className="col-span-12 lg:col-span-5 space-y-6 md:space-y-8">
                        <section className="space-y-4">
                            <label className={STYLES.label}>ORIGEN_DE_DATOS_MULTIMEDIA</label>
                            <div className={`relative h-60 md:h-80 border border-dashed transition-all flex flex-col items-center justify-center ${previewUrl ? 'border-white' : 'border-zinc-800 bg-white/[0.01]'}`}>
                                {!previewUrl ? (
                                    <>
                                        <FiUploadCloud size={40} className="text-zinc-600 mb-6" />
                                        <label className={STYLES.buttonAction + " px-8 py-4 text-[10px] cursor-pointer"}>
                                            SELECCIONAR_ARCHIVO
                                            <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    </>
                                ) : (
                                    <div className="relative w-full h-full p-4 animate-in fade-in">
                                        <img src={previewUrl} className="w-full h-full object-cover border border-white" alt="Preview" />
                                        <button onClick={() => { setPreviewUrl(null); setPreviewFile(null); setFileError(''); }} className="absolute top-4 md:top-8 right-4 md:right-8 p-3 bg-black/80 text-white border border-zinc-700 hover:bg-white hover:text-black transition-colors"><FiTrash2 /></button>
                                    </div>
                                )}
                            </div>
                            {fileError && (
                                <div className="bg-zinc-900 border border-zinc-700 text-white text-[10px] font-black p-3 uppercase tracking-widest mt-2 animate-pulse">
                                    {fileError}
                                </div>
                            )}
                        </section>

                        <section className={STYLES.glass + " p-4 md:p-8 space-y-6"}>
                            <div className="space-y-4">
                                <label className={STYLES.label}>POSICIÓN_VERTICAL_DE_IMAGEN</label>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-zinc-500">TOP</span>
                                    <input type="range" min="0" max="100" value={verticalOffset} onChange={(e) => setVerticalOffset(e.target.value)} className="flex-1 accent-white h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] text-zinc-500">BOTTOM</span>
                                </div>
                                <div className="text-center font-['Inter'] font-bold text-[9px] text-white">{verticalOffset}%</div>
                            </div>
                            <div className="flex justify-between items-center bg-black p-4 border border-white/5">
                                <span className={STYLES.label}>ENDPOINT_DESTINO</span>
                                <span className={STYLES.tech + " text-[9px] text-white font-bold"}>ID_{SECCIONES[seccionDestino].id}</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                <button disabled={!previewUrl || subiendo} onClick={handleUpload} className={`w-full py-4 md:py-5 text-sm ${STYLES.buttonAction} flex items-center justify-center gap-4 ${(!previewUrl || subiendo) && 'opacity-20 grayscale'}`}>
                                    {subiendo ? <FiRefreshCw className="animate-spin" /> : <FiCheck />}
                                    {subiendo ? 'SUBIENDO...' : 'SINCRONIZAR_CON_PRODUCCIÓN'}
                                </button>
                                <button onClick={handleDelete} disabled={!dbContent[SECCIONES[seccionDestino].id] || subiendo} className={`w-full py-3 text-[10px] font-black tracking-widest uppercase border border-zinc-600 text-zinc-400 hover:bg-white hover:text-black transition-all ${(!dbContent[SECCIONES[seccionDestino].id] || subiendo) && 'opacity-10 grayscale'}`}>
                                    <FiTrash2 className="inline mr-2" /> ELIMINAR_DE_PRODUCCIÓN
                                </button>
                            </div>
                        </section>
                    </div>
                    {/* VISUALIZADOR DE RENDERING */}
                    <div className="col-span-12 lg:col-span-7 space-y-4 md:space-y-6">
                        <h3 className={STYLES.tech + " text-[10px] md:text-[11px] text-zinc-500 flex items-center gap-3"}><FiMaximize2 /> MONITOR_REAL_TIME</h3>
                        <div className="relative bg-zinc-950 border border-zinc-900 shadow-2xl h-[400px] md:h-[550px] overflow-hidden">
                            <div className="bg-zinc-900 p-3 md:p-4 border-b border-white/5 flex justify-between items-center">
                                <div className={STYLES.tech + " text-[8px] md:text-[9px] text-zinc-400 truncate max-w-[200px] md:max-w-md"}>{previewUrl ? "VISTA_PREVIA_LOCAL" : `PROD_URL: ${dbContent[SECCIONES[seccionDestino].id] || 'SIN_ASIGNAR'}`}</div>
                            </div>
                            <div className="relative w-full h-full bg-[#050505] p-6 md:p-12 flex items-start justify-center">
                                {(previewUrl || dbContent[SECCIONES[seccionDestino].id]) ? (
                                    <div className="w-full relative group">
                                        <img src={previewUrl || dbContent[SECCIONES[seccionDestino].id]} className={`w-full object-cover transition-all duration-700 grayscale ${previewUrl ? 'border-2 border-white scale-[1.01]' : 'border border-white/10 opacity-80'}`} style={{ aspectRatio: SECCIONES[seccionDestino].aspect.replace(':', '/'), objectPosition: previewUrl ? `center ${verticalOffset}%` : (dbPositions[SECCIONES[seccionDestino].id] || 'center center') }} alt="Output" />
                                        {previewUrl && (<div className="absolute top-2 md:top-4 right-2 md:right-4 bg-white text-black text-[8px] md:text-[9px] font-black px-2 md:px-4 py-1 animate-pulse uppercase">PENDIENTE</div>)}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                                        <FiImage size={60} />
                                        <p className={STYLES.tech + " mt-4"}>NO_PRODUCTION_DATA</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {seccionDestino === CASOS_EXITO_CONFIG.id && (
                <div className="grid grid-cols-12 gap-6 md:gap-12">
                    {/* PANEL DE CONTROL - FORMULARIO CASOS DE ÉXITO */}
                    <div className="col-span-12 lg:col-span-5 space-y-6 md:space-y-8">
                        <section className="space-y-4">
                            <label className={STYLES.label}>1. IMAGEN DEL CASO</label>
                            <div className={`relative h-48 md:h-60 border border-dashed transition-all flex flex-col items-center justify-center ${previewUrl ? 'border-white' : 'border-zinc-800 bg-white/[0.01]'}`}>
                                {!previewUrl ? (
                                    <><FiUploadCloud size={30} className="text-zinc-600 mb-4 md:mb-6" /><label className={STYLES.buttonAction + " px-6 py-3 text-[9px] cursor-pointer"}>SELECCIONAR_IMAGEN<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label></>
                                ) : (
                                    <div className="relative w-full h-full p-3 animate-in fade-in"><img src={previewUrl} className="w-full h-full object-cover border border-white" alt="Preview" /><button onClick={() => { setPreviewUrl(null); setPreviewFile(null); setFileError(''); }} className="absolute top-4 right-4 p-2 bg-black/80 border border-zinc-700 text-white hover:bg-white hover:text-black transition-colors"><FiTrash2 size={16} /></button></div>
                                )}
                            </div>
                            {fileError && (
                                <div className="bg-zinc-900 border border-zinc-700 text-white text-[9px] font-black p-2 uppercase tracking-widest mt-2 animate-pulse">
                                    {fileError}
                                </div>
                            )}
                        </section>

                        <section className={STYLES.glass + " p-6 md:p-8 space-y-6"}>
                            <label className={STYLES.label}>2. DETALLES DEL CASO</label>
                            <div className="space-y-4">
                                <input name="equipo" value={newCaseData.equipo} onChange={handleNewCaseChange} placeholder="EJ: IPHONE 12 PRO" className={STYLES.input} />
                                <input name="falla" value={newCaseData.falla} onChange={handleNewCaseChange} placeholder="EJ: NO ENCIENDE" className={STYLES.input} />
                                <textarea name="resultado" value={newCaseData.resultado} onChange={handleNewCaseChange} placeholder="EJ: SE REEMPLAZÓ EL IC DE CARGA..." className={STYLES.input + " h-20 md:h-24"} rows="3"></textarea>
                            </div>
                            <button onClick={handleSuccessCaseUpload} disabled={isSubmittingCase || !previewFile || !newCaseData.equipo} className={`w-full py-4 md:py-5 text-sm ${STYLES.buttonAction} flex items-center justify-center gap-4 ${(isSubmittingCase || !previewFile || !newCaseData.equipo) && 'opacity-20 grayscale'}`}>
                                {isSubmittingCase ? <FiRefreshCw className="animate-spin" /> : <FiPlusCircle />}
                                {isSubmittingCase ? 'GUARDANDO...' : 'GUARDAR CASO'}
                            </button>
                        </section>
                    </div>

                    {/* LISTADO DE CASOS DE ÉXITO */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        <h3 className={STYLES.tech + " text-[10px] md:text-[11px] text-zinc-500 flex items-center gap-3"}><FiAward /> HISTORIAL ({casosExito.length})</h3>
                        <div className="relative bg-zinc-950 border border-zinc-900 shadow-2xl h-[500px] md:h-[700px] overflow-y-auto p-4 space-y-4">
                            {casosExito.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                                    <FiImage size={60} />
                                    <p className={STYLES.tech + " mt-4"}>SIN CASOS</p>
                                </div>
                            ) : (
                                casosExito.map(caso => (
                                    <div key={caso.id} className="flex flex-col md:flex-row items-start gap-4 p-4 bg-black border border-white/5 rounded-lg animate-in fade-in">
                                        <img src={caso.imagen} className="w-full md:w-24 h-48 md:h-24 object-cover grayscale rounded-md border border-white/10" alt={caso.equipo} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-black text-base text-white uppercase tracking-tighter">{caso.equipo}</h4>
                                                <button onClick={() => handleSuccessCaseDelete(caso.id)} className="md:hidden p-2 text-zinc-600 hover:bg-white hover:text-black rounded-lg transition-all"><FiTrash2 size={16} /></button>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-white uppercase mt-1">FALLA: {caso.falla}</p>
                                            <p className="text-xs text-zinc-400 mt-2 md:mt-3 italic">"{caso.resultado}"</p>
                                        </div>
                                        <button onClick={() => handleSuccessCaseDelete(caso.id)} className="hidden md:block p-3 text-zinc-600 hover:bg-white hover:text-black rounded-lg transition-all"><FiTrash2 size={16} /></button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {seccionDestino === HERO_SLIDER_CONFIG.id && (
                <div className="grid grid-cols-12 gap-6 md:gap-12">
                    {/* PANEL DE CONTROL - FORMULARIO HERO SLIDER */}
                    <div className="col-span-12 lg:col-span-5 space-y-6 md:space-y-8">
                        <section className="space-y-4">
                            <label className={STYLES.label}>1. IMAGEN DEL SLIDE</label>
                            <div className={`relative h-48 md:h-60 border border-dashed transition-all flex flex-col items-center justify-center ${previewUrl ? 'border-white' : 'border-zinc-800 bg-white/[0.01]'}`}>
                                {!previewUrl ? (
                                    <><FiUploadCloud size={30} className="text-zinc-600 mb-4 md:mb-6" /><label className={STYLES.buttonAction + " px-6 py-3 text-[9px] cursor-pointer"}>SELECCIONAR_IMAGEN<input type="file" className="hidden" onChange={handleFileChange} accept="image/*" /></label></>
                                ) : (
                                    <div className="relative w-full h-full p-3 animate-in fade-in"><img src={previewUrl} className="w-full h-full object-cover border border-white" style={{ objectPosition: `center ${verticalOffset}%` }} alt="Preview" /><button onClick={() => { setPreviewUrl(null); setPreviewFile(null); setFileError(''); }} className="absolute top-4 right-4 p-2 bg-black/80 border border-zinc-700 text-white hover:bg-white hover:text-black transition-colors"><FiTrash2 size={16} /></button></div>
                                )}
                            </div>
                            {fileError && (
                                <div className="bg-zinc-900 border border-zinc-700 text-white text-[9px] font-black p-2 uppercase tracking-widest mt-2 animate-pulse">
                                    {fileError}
                                </div>
                            )}
                        </section>

                        <section className={STYLES.glass + " p-6 md:p-8 space-y-6"}>
                            <label className={STYLES.label}>2. TEXTOS DEL SLIDE</label>
                            <div className="space-y-4">
                                <input name="label" value={newHeroSlideData.label} onChange={handleNewHeroSlideChange} placeholder="ETIQUETA (Ej: LU PETRUCCELLI)" className={STYLES.input} />
                                <input name="title" value={newHeroSlideData.title} onChange={handleNewHeroSlideChange} placeholder="TÍTULO (Ej: ELEGANCE & STYLE)" className={STYLES.input} />
                                <input name="subtitle" value={newHeroSlideData.subtitle} onChange={handleNewHeroSlideChange} placeholder="SUBTÍTULO (Ej: Handmade collection)" className={STYLES.input} />
                            </div>
                            
                            <div className="space-y-4 mt-6">
                                <label className={STYLES.label}>3. POSICIÓN VERTICAL DE IMAGEN</label>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] text-zinc-500">TOP</span>
                                    <input type="range" min="0" max="100" value={verticalOffset} onChange={(e) => setVerticalOffset(e.target.value)} className="flex-1 accent-white h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                                    <span className="text-[10px] text-zinc-500">BOTTOM</span>
                                </div>
                                <div className="text-center font-['Inter'] font-bold text-[9px] text-white">{verticalOffset}%</div>
                            </div>

                            <button onClick={handleHeroSlideUpload} disabled={isSubmittingSlide || !previewFile || !newHeroSlideData.title || !newHeroSlideData.subtitle || !newHeroSlideData.label} className={`w-full py-4 md:py-5 text-sm ${STYLES.buttonAction} flex items-center justify-center gap-4 ${(isSubmittingSlide || !previewFile || !newHeroSlideData.title || !newHeroSlideData.subtitle || !newHeroSlideData.label) && 'opacity-20 grayscale'}`}>
                                {isSubmittingSlide ? <FiRefreshCw className="animate-spin" /> : <FiPlusCircle />}
                                {isSubmittingSlide ? 'GUARDANDO...' : 'GUARDAR SLIDE'}
                            </button>
                        </section>
                    </div>

                    {/* LISTADO DE SLIDES */}
                    <div className="col-span-12 lg:col-span-7 space-y-6">
                        <h3 className={STYLES.tech + " text-[10px] md:text-[11px] text-zinc-500 flex items-center gap-3"}><FiMonitor /> SLIDES CONFIGURADOS ({heroSlides.length})</h3>
                        <div className="relative bg-zinc-950 border border-zinc-900 shadow-2xl h-[500px] md:h-[700px] overflow-y-auto p-4 space-y-4">
                            {heroSlides.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-10 text-center">
                                    <FiImage size={60} />
                                    <p className={STYLES.tech + " mt-4"}>SIN SLIDES</p>
                                </div>
                            ) : (
                                heroSlides.map(slide => (
                                    <div key={slide.id} className="flex flex-col md:flex-row items-start gap-4 p-4 bg-black border border-white/5 rounded-lg animate-in fade-in">
                                        <img src={slide.image} className="w-full md:w-48 h-48 md:h-32 object-cover rounded-md border border-white/10" style={{ objectPosition: slide.position || 'center' }} alt={slide.title} />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-black text-xl text-white uppercase tracking-tighter">{slide.title}</h4>
                                                <button onClick={() => handleHeroSlideDelete(slide.id)} className="md:hidden p-2 text-zinc-600 hover:bg-white hover:text-black rounded-lg transition-all"><FiTrash2 size={16} /></button>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-white uppercase mt-1">{slide.label}</p>
                                            <p className="text-xs text-zinc-400 mt-2 md:mt-3 italic">"{slide.subtitle}"</p>
                                        </div>
                                        <button onClick={() => handleHeroSlideDelete(slide.id)} className="hidden md:block p-3 text-zinc-600 hover:bg-white hover:text-black rounded-lg transition-all"><FiTrash2 size={16} /></button>
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