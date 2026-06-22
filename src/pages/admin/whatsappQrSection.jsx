import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const URL_BASE = "https://velasback.onrender.com" ; 

const WhatsappQR = () => {
    const [qrCode, setQrCode] = useState('');
    const [status, setStatus] = useState('loading'); 
    const [loadingRetry, setLoadingRetry] = useState(false);
    
    // Usamos un estado solo para forzar que el numerito (Intento X de 2) se actualice en pantalla
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
        // VALIDACIÓN: Usamos el ref para la lógica interna
        if (fetchCountRef.current >= 2) {
            stopPolling();
            if (status !== 'connected') {
                setStatus('timeout');
            }
            return;
        }

        try {
            const response = await fetch(`${URL_BASE}/qr/status`);
            const data = await response.json();
            
            // Actualizamos tanto el REF (lógica) como el STATE (visual)
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
    stopPolling(); // 1. Frenamos cualquier consulta activa
    
    // 2. Limpiamos estados visuales
    fetchCountRef.current = 0; 
    setDisplayCount(0); 
    setQrCode('');
    setStatus('loading');
    
    try {
        // 3. Llamada al servidor para reiniciar
        await fetch(`${URL_BASE}/qr/restart`, { method: 'POST' });
        console.log("Servidor reiniciando...");

        // 4. ESPERA CRÍTICA: Damos 5 segundos al servidor para que levante Puppeteer
        // Si preguntamos muy rápido, el contador llegará a 2 antes de que el QR exista.
        setTimeout(() => {
            console.log("Reiniciando consultas...");
            checkStatus(); // Primera consulta post-reinicio
            
            // Creamos el nuevo intervalo
            if (!intervalRef.current) {
                intervalRef.current = setInterval(checkStatus, 5000);
            }
            setLoadingRetry(false);
        }, 5000); // <--- TIEMPO SUBIDO A 5 SEGUNDOS
        
    } catch (error) {
        console.error("❌ Error al reiniciar:", error);
        setStatus('disconnected');
        setLoadingRetry(false);
    }
};

    return (
        <div style={containerStyle}>
            <h3 style={{ marginBottom: '10px' }}>Conexión WhatsApp</h3>
            
            {status === 'loading' && (
                <div style={statusBoxStyle}>
                    <p>Iniciando navegador interno...</p>
                    <p style={{ fontSize: '11px', color: '#666' }}>Preparando sesión segura</p>
                </div>
            )}
            
            {status === 'qr' && qrCode && (
                <div>
                    <p style={{ fontSize: '14px', marginBottom: '15px' }}>
                        Escanea el código con tu celular <br/>
                        {/* Ahora usamos displayCount para que cambie en tiempo real */}
                        <small>(Intento {displayCount} de 2)</small>
                    </p>
                    <div style={qrContainerStyle}>
                        <QRCodeSVG value={qrCode} size={220} includeMargin={true} />
                    </div>
                    <div style={{ marginTop: '20px' }}>
                         <button 
                            onClick={handleRetry} 
                            disabled={loadingRetry}
                            style={buttonSecondaryStyle}
                         >
                            {loadingRetry ? 'Reiniciando...' : 'Generar nuevo QR'}
                         </button>
                    </div>
                </div>
            )}

            {status === 'connected' && (
                <div style={{ ...statusBoxStyle, color: '#25D366' }}>
                    <div style={{ fontSize: '50px' }}>✅</div>
                    <p style={{ fontWeight: 'bold', fontSize: '18px' }}>¡WhatsApp Vinculado!</p>
                </div>
            )}

            {(status === 'disconnected' || status === 'timeout') && (
                <div style={{ ...statusBoxStyle, color: '#d32f2f' }}>
                    <p>⚠️ {status === 'timeout' ? 'Límite de intentos alcanzado' : 'No se pudo conectar'}</p>
                    <button onClick={handleRetry} disabled={loadingRetry} style={buttonPrimaryStyle}>
                        {loadingRetry ? 'Reiniciando...' : 'Reintentar conexión'}
                    </button>
                </div>
            )}
        </div>
    );
};

// ... (estilos se mantienen igual)
const containerStyle = { textAlign: 'center', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '12px', maxWidth: '420px', margin: '20px auto', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif' };
const qrContainerStyle = { background: 'white', padding: '10px', display: 'inline-block', borderRadius: '8px', border: '1px solid #eee' };
const statusBoxStyle = { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' };
const buttonPrimaryStyle = { padding: '10px 25px', cursor: 'pointer', marginTop: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold' };
const buttonSecondaryStyle = { background: '#25D366', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };

export default WhatsappQR;