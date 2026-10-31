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
        <div className="bg-[#FAF9F6] font-['Inter',sans-serif] text-neutral-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif] text-neutral-900"
            >
                <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl p-6 max-w-xl mx-auto text-center">
                    <div className="flex items-center justify-center gap-2.5 mb-6 pb-4 border-b border-[#ECECE6]">
                        <FiMessageSquare className="w-5 h-5 text-neutral-700" />
                        <h2 className="text-base font-medium text-neutral-800">WHATSAPP_BRIDGE</h2>
                    </div>

                    <AnimatePresence mode="wait">
                        {status === 'loading' && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="py-12 flex flex-col items-center gap-4"
                            >
                                <FiLoader className="w-5 h-5 text-neutral-900 animate-spin" />
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-neutral-700">Iniciando navegador interno...</p>
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Preparando sesión segura // [PUPPETEER_INIT]</p>
                                </div>
                            </motion.div>
                        )}

                        {(status === 'qr' || status === 'max_qr_attempts_reached') && qrCode && (
                            <motion.div
                                key="qr"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <div className="bg-white p-4 rounded-2xl border border-[#ECECE6] shadow-xs mb-6">
                                    <QRCodeSVG value={qrCode} size={240} includeMargin={true} level="H" />
                                </div>

                                <div className="mb-6 space-y-1">
                                    <p className="text-xs font-medium text-neutral-700">
                                        Escanea el código con tu celular
                                    </p>
                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                        (Intento {displayCount} de 20)
                                    </p>
                                </div>

                                <button
                                    onClick={handleRetry}
                                    disabled={loadingRetry}
                                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-[#19191B] hover:bg-neutral-800 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs mx-auto"
                                >
                                    {loadingRetry ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiRefreshCw className="w-4 h-4" />}
                                    {loadingRetry ? 'REINICIANDO...' : 'GENERAR_NUEVO_QR'}
                                </button>
                            </motion.div>
                        )}

                        {status === 'connected' && (
                            <motion.div
                                key="connected"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="py-12 flex flex-col items-center gap-4"
                            >
                                <div className="p-3 rounded-2xl bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3] inline-flex items-center justify-center">
                                    <FiCheckCircle className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-base font-medium text-neutral-800">¡VÍNCULO_ESTABLECIDO!</p>
                                    <p className="text-xs text-neutral-500 mt-1">WhatsApp Core System Connected</p>
                                </div>
                            </motion.div>
                        )}

                        {(status === 'disconnected' || status === 'timeout' || status === 'max_attempts_reached' || (status === 'max_qr_attempts_reached' && !qrCode)) && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="py-12 flex flex-col items-center gap-4"
                            >
                                <div className="p-3 rounded-2xl bg-red-50 text-red-700 border border-red-200 inline-flex items-center justify-center">
                                    <FiAlertTriangle className="w-5 h-5" />
                                </div>
                                <div className="space-y-4 w-full">
                                    <p className="text-xs font-medium text-neutral-700">
                                        {status === 'timeout' ? 'Límite de intentos alcanzado' : 'No se pudo establecer conexión'}
                                    </p>
                                    <button
                                        onClick={handleRetry}
                                        disabled={loadingRetry}
                                        className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-[#19191B] hover:bg-neutral-800 text-white disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-xs mx-auto"
                                    >
                                        {loadingRetry ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiRefreshCw className="w-4 h-4" />}
                                        {loadingRetry ? 'REINICIANDO...' : 'REINTENTAR_CONEXIÓN'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 pt-4 border-t border-[#ECECE6]">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                            INTERNAL_PROTOCOL // WHATSAPP_SOCKET_SECURE
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default WhatsappQrSection;
