import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const LiveEditor = () => {
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const iframeRef = useRef(null);

    useEffect(() => {
        const handleIframeMessage = async (event) => {
            // Check message type
            if (event.data && event.data.type === 'UPDATE_TEXT') {
                const { key, value, section } = event.data.payload;
                
                try {
                    await axios.put(`${import.meta.env.VITE_API_URL}/api/cms/texts`, {
                        key,
                        value,
                        section
                    });
                    
                    toast.success(`Texto "${key}" guardado correctamente!`, {
                        position: "bottom-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                    });
                } catch (error) {
                    console.error("Error saving text:", error);
                    toast.error(`Error al guardar el texto "${key}"`);
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);
        return () => window.removeEventListener('message', handleIframeMessage);
    }, []);

    const handleIframeLoad = () => {
        setIframeLoaded(true);
        // We can send a message to ensure it's in edit mode, 
        // though we are passing editMode=true in URL as well.
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'TOGGLE_EDIT_MODE',
                payload: true
            }, '*');
        }
    };

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-gray-100 flex flex-col">
            <ToastContainer />
            
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Editor Visual en Vivo</h2>
                    <p className="text-sm text-gray-500">
                        Haz clic en cualquier texto con borde punteado para editarlo. Los cambios se guardan automáticamente al quitar el foco (hacer clic fuera).
                    </p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => {
                            if(iframeRef.current) iframeRef.current.src = iframeRef.current.src;
                        }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                        Recargar Vista
                    </button>
                    <a 
                        href="/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-4 py-2 bg-[#9b59b6] hover:bg-[#8e44ad] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        Ver Sitio Publicado
                    </a>
                </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 w-full bg-gray-300 relative overflow-hidden flex items-center justify-center p-4">
                {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
                        <div className="w-10 h-10 border-4 border-[#9b59b6] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Cargando editor visual...</p>
                    </div>
                )}
                
                {/* 
                    Assuming the dev server runs on standard port or relative path. 
                    Using window.location.origin as a fallback to avoid hardcoding localhost:5173 
                */}
                <div className="w-full h-full max-w-[1400px] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-400">
                    <iframe
                        ref={iframeRef}
                        title="Live Editor"
                        src={`${window.location.protocol}//${window.location.host}/?editMode=true`}
                        className="w-full h-full border-none"
                        onLoad={handleIframeLoad}
                    />
                </div>
            </div>
        </div>
    );
};

export default LiveEditor;
