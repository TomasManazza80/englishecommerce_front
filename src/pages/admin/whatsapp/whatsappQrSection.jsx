import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiRefreshCw, FiCheckCircle, FiAlertTriangle, FiLoader } from 'react-icons/fi';

const URL_BASE = import.meta.env.VITE_API_URL;

const WhatsappQrSection = () => {
    const [qrCode, setQrCode] = useState('');
    const [status, setStatus] = useState('loading');
    const [loadingRetry, setLoadingRetry] = useState(false);
    const [displayCount, setDisplayCount] = useState(0);

    const intervalRef = useRef(null);
    const fetchCountRef = useRef(0);

    const stopPolling = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const checkStatus = async () => {
        if (fetchCountRef.current >= 20) {
            stopPolling();
            if (status !== 'connected') {
                setStatus('timeout');
            }
            return;
        }

        try {
            const response = await fetch(`${URL_BASE}/qr/status`);
            const data = await response.json();

            fetchCountRef.current += 1;
            setDisplayCount(fetchCountRef.current);

            if (data.status === 'connected') {
                setQrCode('');
                setStatus('connected');
                stopPolling();
            } else {
                if (data.qr) setQrCode(data.qr);
                setStatus(data.status);
            }
        } catch (error) {
            console.error("❌ Error:", error);
            setStatus('disconnected');
            stopPolling();
        }
    };

    useEffect(() => {
        checkStatus();
        intervalRef.current = setInterval(checkStatus, 5000);
        return () => stopPolling();
    }, []);

    const handleRetry = async () => {
        setLoadingRetry(true);
        stopPolling();

        fetchCountRef.current = 0;
        setDisplayCount(0);
        setQrCode('');
        setStatus('loading');

        try {
            await fetch(`${URL_BASE}/qr/restart`, { method: 'POST' });

            setTimeout(() => {
                checkStatus();
                if (!intervalRef.current) {
                    intervalRef.current = setInterval(checkStatus, 5000);
                }
                setLoadingRetry(false);
            }, 5000);

        } catch (error) {
            console.error("❌ Error al reiniciar:", error);
            setStatus('disconnected');
            setLoadingRetry(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto font-['Inter']"
        >
            <div className="bg-white/[0.02] backdrop-blur-xl p-6 md:p-10 border border-white/10 shadow-2xl text-center">
                <div className="flex items-center justify-center gap-4 mb-8">
                    <FiMessageSquare className="text-white text-3xl" />
                    <h2 className="font-[900] uppercase tracking-tighter text-2xl text-white">WHATSAPP_BRIDGE</h2>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="py-12 flex flex-col items-center gap-6"
                        >
                            <FiLoader className="text-white text-5xl animate-spin" />
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-white">Iniciando navegador interno...</p>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Preparando sesión segura // [PUPPETEER_INIT]</p>
                            </div>
                        </motion.div>
                    )}

                    {(status === 'qr' || status === 'max_qr_attempts_reached') && qrCode && (
                        <motion.div
                            key="qr"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <div className="bg-white p-4 rounded-none shadow-2xl mb-8 border-4 border-white">
                                <QRCodeSVG value={qrCode} size={240} includeMargin={true} level="H" />
                            </div>

                            <div className="mb-8 space-y-2">
                                <p className="text-xs font-bold text-white uppercase tracking-widest">
                                    Escanea el código con tu celular
                                </p>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">
                                    (Intento {displayCount} de 20)
                                </p>
                            </div>

                            <button
                                onClick={handleRetry}
                                disabled={loadingRetry}
                                className="font-[900] flex items-center justify-center gap-3 px-8 py-4 bg-white text-black text-[10px] tracking-[0.3em] hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase w-full max-w-xs mx-auto"
                            >
                                {loadingRetry ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
                                {loadingRetry ? 'REINICIANDO...' : 'GENERAR_NUEVO_QR'}
                            </button>
                        </motion.div>
                    )}

                    {status === 'connected' && (
                        <motion.div
                            key="connected"
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="py-12 flex flex-col items-center gap-6"
                        >
                            <div className="bg-white/5 p-6 rounded-full border border-white/20">
                                <FiCheckCircle className="text-white text-6xl" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-[900] text-xl text-white uppercase tracking-tighter">¡VÍNCULO_ESTABLECIDO!</p>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">WhatsApp Core System Connected</p>
                            </div>
                        </motion.div>
                    )}

                    {(status === 'disconnected' || status === 'timeout' || status === 'max_attempts_reached' || (status === 'max_qr_attempts_reached' && !qrCode)) && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="py-12 flex flex-col items-center gap-6"
                        >
                            <div className="bg-white/5 p-6 rounded-full border border-white/20">
                                <FiAlertTriangle className="text-white text-6xl" />
                            </div>
                            <div className="space-y-4">
                                <p className="text-xs font-bold text-white uppercase tracking-widest">
                                    {status === 'timeout' ? 'Límite de intentos alcanzado' : 'No se pudo establecer conexión'}
                                </p>
                                <button
                                    onClick={handleRetry}
                                    disabled={loadingRetry}
                                    className="font-[900] flex items-center justify-center gap-3 px-8 py-4 bg-zinc-900 border border-zinc-700 text-white text-[10px] tracking-[0.3em] hover:bg-white hover:text-black transition-all uppercase w-full max-w-xs mx-auto"
                                >
                                    {loadingRetry ? <FiLoader className="animate-spin" /> : <FiRefreshCw />}
                                    {loadingRetry ? 'REINICIANDO...' : 'REINTENTAR_CONEXIÓN'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-12 pt-8 border-t border-white/5">
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.5em]">
                        INTERNAL_PROTOCOL // WHATSAPP_SOCKET_SECURE
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default WhatsappQrSection;