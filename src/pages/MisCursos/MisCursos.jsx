import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faFilePdf, faFileImage, faFileAlt, faPlayCircle, faXmark, faMicrophone, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import authContext from '../../store/store';
import { jwtDecode } from 'jwt-decode';
import gsap from "gsap";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const MisCursos = () => {
    const authCtx = useContext(authContext);
    const [infoproductos, setInfoproductos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New States for Course Viewer
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const gridRef = useRef(null);

    useEffect(() => {
        const fetchInfoproducts = async () => {
            if (authCtx.token) {
                try {
                    const decoded = jwtDecode(authCtx.token);
                    const email = decoded.email;
                    const role = authCtx.role || decoded.role;
                    
                    if (role === 'admin') {
                        const res = await axios.get(`${API_URL}/products`);
                        const allInfoproducts = res.data
                            .filter(p => p.esInfoproducto)
                            .map(p => ({
                                ...p,
                                imagenes: p.imagenes ? p.imagenes.map(img => typeof img === 'string' ? { url: img } : img) : [],
                                archivos: p.archivosInfoproducto || []
                            }));
                        setInfoproductos(allInfoproducts || []);
                    } else {
                        const res = await axios.get(`${API_URL}/api/users/infoproducts/${email}`);
                        setInfoproductos(res.data || []);
                    }
                } catch (error) {
                    console.error("Error fetching infoproducts", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchInfoproducts();
    }, [authCtx.token]);

    // GSAP Animation for courses
    useEffect(() => {
        if (!loading && !selectedCourse && infoproductos.length > 0 && gridRef.current) {
            let ctx = gsap.context(() => {
                gsap.fromTo(
                    ".gsap-course-card",
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        stagger: 0.15,
                        ease: "power3.out"
                    }
                );
            }, gridRef);
            return () => ctx.revert();
        }
    }, [loading, infoproductos, selectedCourse]);

    const getFileIcon = (fileType) => {
        if (!fileType) return faFileAlt;
        const type = fileType.toLowerCase();
        if (type.includes('pdf')) return faFilePdf;
        if (type.includes('video') || type.includes('mp4') || type.includes('webm')) return faVideo;
        if (type.includes('image') || type.includes('jpg') || type.includes('png')) return faFileImage;
        return faFileAlt;
    };

    const getFileTypeCategory = (file) => {
        if (!file) return 'other';
        const typeStr = (file.fileType || '').toLowerCase();
        const nameStr = (file.name || '').toLowerCase();
        
        if (typeStr.includes('video') || typeStr.includes('mp4') || nameStr.endsWith('.mp4') || nameStr.endsWith('.webm') || nameStr.endsWith('.mov')) return 'video';
        if (typeStr.includes('image') || nameStr.endsWith('.jpg') || nameStr.endsWith('.jpeg') || nameStr.endsWith('.png') || nameStr.endsWith('.gif') || nameStr.endsWith('.webp')) return 'image';
        if (typeStr.includes('pdf') || nameStr.endsWith('.pdf')) return 'pdf';
        if (typeStr.includes('audio') || nameStr.endsWith('.mp3') || nameStr.endsWith('.wav') || nameStr.endsWith('.ogg')) return 'audio';
        
        // Office documents
        if (
            nameStr.endsWith('.doc') || nameStr.endsWith('.docx') || 
            nameStr.endsWith('.xls') || nameStr.endsWith('.xlsx') || 
            nameStr.endsWith('.ppt') || nameStr.endsWith('.pptx')
        ) return 'office';

        return 'other';
    };

    const handleOpenCourse = (curso) => {
        setSelectedCourse(curso);
        if (curso.archivos && curso.archivos.length > 0) {
            setSelectedFile(curso.archivos[0]);
        } else {
            setSelectedFile(null);
        }
    };

    const handleCloseCourse = () => {
        setSelectedCourse(null);
        setSelectedFile(null);
    };

    // No-Download protections
    const disableContextMenu = (e) => e.preventDefault();

    return (
        <div className="min-h-screen bg-[#f8f3f6] text-[#1d1d1d] pt-24 pb-20 px-4 sm:px-8 font-['Inter',sans-serif]">
            
            {/* --- COURSE LIST VIEW --- */}
            <AnimatePresence>
                {!selectedCourse && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="max-w-7xl mx-auto"
                    >
                        <div className="text-center mb-16">
                            <div className="inline-block bg-[#f6edf8] text-[#b273c2] px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mb-4 shadow-sm border border-[#f0dff3] uppercase">
                                YOUR LEARNING HUB
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1d] tracking-tight leading-tight">
                                MY <span className="text-[#b273c2]">COURSES</span>
                            </h1>
                            <p className="mt-4 text-gray-500 font-medium max-w-xl mx-auto">
                                Access your acquired courses, materials, and interactive lessons.
                            </p>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-[#f6edf8] border-t-[#b273c2] rounded-full animate-spin shadow-lg"></div>
                            </div>
                        ) : infoproductos.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-[35px] shadow-xl border border-[#f0dff3] max-w-2xl mx-auto">
                                <div className="text-6xl mb-4">📚</div>
                                <p className="text-gray-500 font-bold text-lg mb-6">You haven't acquired any courses yet.</p>
                                <button onClick={() => window.location.href = '/products'} className="bg-[#b273c2] hover:bg-[#9d5fb0] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                                    Explore Scenarios
                                </button>
                            </div>
                        ) : (
                            <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {infoproductos.map((curso, idx) => (
                                    <div 
                                        key={idx} 
                                        className="gsap-course-card bg-white rounded-[35px] overflow-hidden shadow-xl border border-[#f0dff3] hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 flex flex-col group cursor-pointer"
                                        onClick={() => handleOpenCourse(curso)}
                                    >
                                        {curso.imagenes && curso.imagenes.length > 0 ? (
                                            <div className="h-56 overflow-hidden bg-[#f8f3f6] relative shrink-0 border-b border-[#f0dff3]">
                                                <img src={curso.imagenes[0].url} alt={curso.nombre} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                <div className="absolute top-4 left-4">
                                                    <span className="bg-white/90 backdrop-blur-sm text-[#b273c2] text-xs font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-widest">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-48 bg-gradient-to-r from-[#f9f1f7] to-[#efe4f2] relative border-b border-[#f0dff3] flex items-center justify-center group-hover:bg-[#efe4f2] transition-colors">
                                                <span className="bg-white/90 backdrop-blur-sm text-[#b273c2] text-xs font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-widest absolute top-4 left-4">
                                                        Active
                                                </span>
                                                <FontAwesomeIcon icon={faMicrophone} className="text-5xl text-[#b273c2] opacity-40 group-hover:opacity-60 transition-opacity" />
                                            </div>
                                        )}
                                        
                                        <div className="p-8 flex-1 flex flex-col bg-white">
                                            <h2 className="font-black text-2xl text-[#1d1d1d] mb-3 leading-tight group-hover:text-[#b273c2] transition-colors">{curso.nombre}</h2>
                                            <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-3">{curso.descripcion || "Practice scenario materials."}</p>
                                            
                                            <div className="mt-auto">
                                                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest border-t border-[#f0dff3] pt-4">
                                                    <span>{curso.archivos?.length || 0} Materiales</span>
                                                    <span className="text-[#b273c2] group-hover:translate-x-1 transition-transform">Ver Curso &rarr;</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- COURSE VIEWER (FULL SCREEN) --- */}
            <AnimatePresence>
                {selectedCourse && (
                    <motion.div 
                        initial={{ opacity: 0, y: '100%' }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[4000] bg-white flex flex-col md:flex-row overflow-hidden"
                    >
                        {/* Sidebar */}
                        <div className="w-full md:w-1/3 lg:w-1/4 h-full bg-[#f8f3f6] border-r border-[#e8d1ed] flex flex-col shadow-xl z-10 relative">
                            <div className="p-6 bg-white border-b border-[#e8d1ed] flex items-center justify-between sticky top-0">
                                <button 
                                    onClick={handleCloseCourse} 
                                    className="flex items-center gap-2 text-gray-600 hover:text-[#b273c2] font-bold text-sm uppercase tracking-widest transition-colors"
                                >
                                    <FontAwesomeIcon icon={faArrowLeft} /> Volver
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
                                {/* Course Header in Sidebar */}
                                {selectedCourse.imagenes && selectedCourse.imagenes.length > 0 && (
                                    <img src={selectedCourse.imagenes[0].url} alt="Cover" className="w-full h-40 object-cover rounded-2xl mb-6 shadow-sm border border-[#f0dff3]" />
                                )}
                                <h2 className="font-black text-2xl text-[#1d1d1d] mb-2 leading-tight">{selectedCourse.nombre}</h2>
                                <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
                                    {selectedCourse.descripcion || "Sin descripción proporcionada."}
                                </p>

                                {/* Materials List */}
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b273c2] mb-4 border-b border-[#e8d1ed] pb-2">
                                    Archivos del Curso
                                </h3>
                                
                                {selectedCourse.archivos && selectedCourse.archivos.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedCourse.archivos.map((archivo, aIdx) => {
                                            const isActive = selectedFile === archivo;
                                            return (
                                                <button 
                                                    key={aIdx} 
                                                    onClick={() => setSelectedFile(archivo)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left border shadow-sm group ${
                                                        isActive 
                                                        ? 'bg-[#b273c2] text-white border-[#9d5fb0] shadow-md' 
                                                        : 'bg-white text-gray-700 border-[#f0dff3] hover:border-[#b273c2] hover:shadow-md'
                                                    }`}
                                                >
                                                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                                                        isActive ? 'bg-white/20 text-white' : 'bg-[#f8f3f6] text-[#b273c2]'
                                                    }`}>
                                                        <FontAwesomeIcon icon={getFileIcon(archivo.fileType)} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-[#1d1d1d]'}`}>
                                                            {archivo.name || `Material ${aIdx + 1}`}
                                                        </p>
                                                    </div>
                                                    <FontAwesomeIcon icon={faPlayCircle} className={isActive ? 'text-white' : 'text-gray-300 group-hover:text-[#b273c2]'} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 bg-white rounded-2xl border border-dashed border-[#e8d1ed]">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No hay archivos cargados</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Main Viewer Area */}
                        <div className="flex-1 h-full bg-[#111] relative flex flex-col items-center justify-center overflow-hidden select-none" onContextMenu={disableContextMenu}>
                            {!selectedFile ? (
                                <div className="text-center opacity-50 flex flex-col items-center select-none pointer-events-none">
                                    <FontAwesomeIcon icon={faPlayCircle} className="text-6xl text-white mb-4" />
                                    <p className="text-white font-bold tracking-widest uppercase text-sm">Selecciona un material del menú</p>
                                </div>
                            ) : (
                                <>
                                    {/* Viewer Header */}
                                    <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-center pointer-events-none">
                                        <h3 className="text-white font-bold text-lg drop-shadow-md">{selectedFile.name || "Material"}</h3>
                                        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 text-white text-xs font-black uppercase tracking-widest pointer-events-auto">
                                            Solo Vista
                                        </div>
                                    </div>

                                    {/* Anti-Download overlay specifically for preventing right clicks and dragging on the whole area */}
                                    <div className="absolute inset-0 z-10 pointer-events-none"></div>

                                    {/* Content Render */}
                                    <div className="w-full h-full flex items-center justify-center p-4 md:p-12 relative z-0">
                                        {(() => {
                                            const fileCat = getFileTypeCategory(selectedFile);
                                            switch (fileCat) {
                                                case 'video':
                                                    return (
                                                        <video 
                                                            src={selectedFile.url} 
                                                            controls 
                                                            controlsList="nodownload" 
                                                            disablePictureInPicture
                                                            className="w-full h-full max-h-full rounded-xl shadow-2xl object-contain bg-black"
                                                            onContextMenu={disableContextMenu}
                                                        />
                                                    );
                                                case 'image':
                                                    return (
                                                        <img 
                                                            src={selectedFile.url} 
                                                            alt={selectedFile.name}
                                                            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain pointer-events-none"
                                                            onContextMenu={disableContextMenu}
                                                            draggable="false"
                                                        />
                                                    );
                                                case 'pdf':
                                                    return (
                                                        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white relative">
                                                            <iframe 
                                                                src={`${selectedFile.url}#toolbar=0&navpanes=0&scrollbar=0`} 
                                                                className="w-full h-full border-none"
                                                                title={selectedFile.name}
                                                                onContextMenu={disableContextMenu}
                                                            />
                                                        </div>
                                                    );
                                                case 'office':
                                                    return (
                                                        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white relative">
                                                            <iframe 
                                                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedFile.url)}`} 
                                                                className="w-full h-full border-none"
                                                                title={selectedFile.name}
                                                                onContextMenu={disableContextMenu}
                                                            />
                                                        </div>
                                                    );
                                                case 'audio':
                                                    return (
                                                        <div className="bg-white p-10 rounded-2xl shadow-2xl flex flex-col items-center">
                                                            <FontAwesomeIcon icon={faPlayCircle} className="text-6xl text-[#b273c2] mb-6" />
                                                            <audio src={selectedFile.url} controls controlsList="nodownload" onContextMenu={disableContextMenu} className="w-full" />
                                                        </div>
                                                    );
                                                default:
                                                    return (
                                                        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-white relative">
                                                            <iframe 
                                                                src={`https://docs.google.com/gview?url=${encodeURIComponent(selectedFile.url)}&embedded=true`} 
                                                                className="w-full h-full border-none"
                                                                title={selectedFile.name}
                                                                onContextMenu={disableContextMenu}
                                                            />
                                                        </div>
                                                    );
                                            }
                                        })()}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MisCursos;
