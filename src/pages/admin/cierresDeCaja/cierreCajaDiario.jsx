import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiDollarSign, FiShoppingCart, FiCreditCard, FiAlertTriangle,
    FiLoader, FiCalendar, FiArchive, FiTrendingUp, FiActivity, FiPackage
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

// --- ESTILOS CONSTANTES (MONOCHROME INTER THEME) ---
const styles = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-1 md:mb-2 block",
    tech: "font-['Inter'] font-bold uppercase",
    glassCard: "bg-[#050505] border border-white/10 shadow-2xl rounded-none",
    btnPrimary: "bg-white text-black font-['Inter'] font-black text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-widest py-4 md:py-4 px-4 md:px-8 hover:bg-zinc-200 transition-all duration-500 shadow-none rounded-none",
};

const CierreCajaDiario = () => {
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [ventasEcommerce, setVentasEcommerce] = useState([]);
    const [ventasLocal, setVentasLocal] = useState([]);
    const [egresos, setEgresos] = useState([]);

    // ESTADO PARA TABS EN MÓVILES
    const [mobileTab, setMobileTab] = useState('local');

    // --- CARGA DE DATOS ---
    const fetchData = async () => {
        console.log("CIERRE_CAJA: INICIANDO_FETCH...");
        console.log("CIERRE_CAJA: API_URL =", API_URL);
        setLoading(true);
        try {
            let resEcom = { data: [] };
            let resLocal = { data: [] };

            try {
                resEcom = await axios.get(`${API_URL}/ecommerce/pedidos?unshipped=true`);
                console.log("FETCH_ECOM_SUCCESS:", resEcom.data?.length, "items");
            } catch (e) {
                console.error("FETCH_ECOM_ERROR:", e.message);
            }

            try {
                resLocal = await axios.get(`${API_URL}/pagoCaja/pagos`);
                console.log("FETCH_LOCAL_SUCCESS:", resLocal.data?.length, "items");
            } catch (e) {
                console.error("FETCH_LOCAL_ERROR:", e.message);
            }

            const ecommerceProducts = (resEcom.data || [])
                .filter(order => !order.metadata_ecommerce?.cierreCaja)
                .flatMap(order => {
                    let items = order.items || [];

                    if (typeof items === 'string') {
                        try {
                            items = JSON.parse(items);
                        } catch (e) {
                            console.error(`ERROR_PARSING_ITEMS for Order ${order.id}:`, items);
                            items = [];
                        }
                    }

                    if (!Array.isArray(items)) {
                        console.warn(`ORDER_ITEMS_NOT_ARRAY for Order ${order.id}:`, items);
                        items = [];
                    }

                    return items.map(item => ({
                        ...item,
                        nombre: item.title,
                        precio: parseFloat(item.unit_price),
                        cantidad: parseInt(item.quantity),
                        precioCompra: parseFloat(item.cost_price || item.precioCompra || 0),
                        orderId: order.id,
                        nombreComprador: order.name,
                        fechaCompra: order.createdAt,
                        descuentoGlobalAplicado: 0,
                        originalMetadata: order.metadata_ecommerce || {}
                    }));
                });

            console.log("ECOMMERCE_PRODUCTS_FLATTENED:", ecommerceProducts.length);
            setVentasEcommerce(ecommerceProducts);
            setVentasLocal(resLocal.data || []);

            try {
                const resEgress = await axios.get(`${API_URL}/egresos/egress`);
                setEgresos(resEgress.data || []);
            } catch (e) {
                console.error("FETCH_EGRESS_ERROR:", e.message);
            }
        } catch (error) {
            console.error("CRITICAL_FETCH_ERROR:", error);
            Swal.fire('Error', 'No se pudieron sincronizar los datos de caja.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- CÁLCULOS ---
    const totales = useMemo(() => {
        const totalEcom = ventasEcommerce.reduce((acc, item) => {
            const precio = parseFloat(item.precio || item.price) || 0;
            const cant = parseInt(item.cantidad || item.quantity) || 1;
            const desc = parseFloat(item.descuentoGlobalAplicado) || 0;
            return acc + (precio * cant * (1 - desc / 100));
        }, 0);

        const totalLocal = ventasLocal.reduce((acc, item) => {
            return acc + (parseFloat(item.montoTotal) || 0);
        }, 0);

        return {
            ecommerce: totalEcom,
            local: totalLocal,
            global: totalEcom + totalLocal
        };
    }, [ventasEcommerce, ventasLocal]);

    // --- LÓGICA DE CIERRE AUTOMÁTICO ---
    const [autoCierre, setAutoCierre] = useState(() => {
        const savedAuto = localStorage.getItem('FEDECELL_AUTO_CIERRE');
        return savedAuto !== null ? JSON.parse(savedAuto) : false;
    });

    useEffect(() => {
        localStorage.setItem('FEDECELL_AUTO_CIERRE', JSON.stringify(autoCierre));

        let interval;
        if (autoCierre) {
            interval = setInterval(() => {
                const now = new Date();
                if (now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 0) {
                    if (totales.global > 0 && !procesando) {
                        handleCierreCaja({ automatico: true });
                    }
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [autoCierre, totales.global]);

    // --- MANEJADOR DE CIERRE ---
    const [resetBalanceOnCierre, setResetBalanceOnCierre] = useState(true);

    const handleCierreCaja = async (opciones = {}) => {
        if (totales.global === 0) {
            Swal.fire({
                title: 'Caja Vacía',
                text: 'No hay movimientos para cerrar.',
                icon: 'info',
                background: '#0a0a0a',
                color: '#fff',
                confirmButtonColor: '#fff'
            });
            return;
        }

        const confirm = opciones?.automatico ? { isConfirmed: true } : await Swal.fire({
            title: '¿CONFIRMAR CIERRE DIARIO?',
            html: `
                <p>Se archivarán ${ventasEcommerce.length + ventasLocal.length} operaciones por un total de $${totales.global.toLocaleString('es-AR')}.</p>
                <div style="margin-top: 15px; padding: 10px; border-top: 1px solid #333; text-align: center;">
                    <p style="color: #888; font-size: 10px; text-transform: uppercase; font-family: 'Inter', sans-serif; letter-spacing: 1px;">
                        Reseteo de Billetes: <span style="color: ${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? '#fff' : '#666'}">${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? 'HABILITADO' : 'DESHABILITADO'}</span>
                    </p>
                    <p style="color: #555; font-size: 8px; font-family: 'Inter', sans-serif; margin-top: 5px;">(Configurado en la sección de Balance)</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ffffff',
            cancelButtonColor: '#111111',
            confirmButtonText: '<span style="color: #000; font-weight: 900; font-family: Inter;">SÍ, EJECUTAR</span>',
            cancelButtonText: '<span style="color: #fff; font-family: Inter;">CANCELAR</span>',
            background: '#050505',
            color: '#fff'
        });

        if (!confirm.isConfirmed) return;
        const doReset = localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true';

        setProcesando(true);
        try {
            const billsTotal = { 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 };
            const changeTotal = { 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 };

            ventasLocal.forEach(pago => {
                if (pago.medioPago === 'efectivo' && pago.detalles_pago) {
                    if (pago.detalles_pago.billetes) {
                        Object.entries(pago.detalles_pago.billetes).forEach(([den, cant]) => {
                            if (billsTotal.hasOwnProperty(den)) billsTotal[den] += parseInt(cant) || 0;
                        });
                    }
                    if (pago.detalles_pago.vuelto) {
                        Object.entries(pago.detalles_pago.vuelto).forEach(([den, cant]) => {
                            if (changeTotal.hasOwnProperty(den)) changeTotal[den] += parseInt(cant) || 0;
                        });
                    }
                }
            });

            const productosEcommerceFormatted = ventasEcommerce.map(v => {
                const precio = parseFloat(v.precio) || 0;
                const cantidad = parseInt(v.cantidad) || 1;
                const descP = parseFloat(v.descuentoGlobalAplicado) || 0;
                const montoTotal = (precio * cantidad) * (1 - descP / 100);

                return {
                    nombreProducto: v.nombre || v.nombreProducto || 'Producto Desconocido',
                    cantidadComprada: cantidad,
                    monto: Number(montoTotal.toFixed(2)),
                    idPago: v.orderId,
                    fecha: v.fechaCompra || new Date().toISOString(),
                    canal: 'ECOMMERCE',
                    cliente: v.nombreComprador || 'Cliente Web',
                    medioPago: 'MercadoPago',
                    hora: new Date(v.fechaCompra || Date.now()).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    precioCompra: parseFloat(v.precioCompra) || 0,
                    marca: v.marca || 'GENERICO',
                    categoria: v.categoria || 'ECOMMERCE',
                    proveedor: v.proveedor || 'N/A'
                };
            });

            const productosLocalFormatted = [];
            ventasLocal.forEach(pago => {
                const items = pago.productos || [];

                let canal = 'LOCAL';
                const origen = (pago.origenDeVenta || '').toLowerCase();
                if (origen.includes('revendedor')) canal = 'REVENDEDOR';
                else if (origen.includes('ecommerce') || origen.includes('web')) canal = 'ECOMMERCE';

                const cliente = pago.opcion1 ? pago.opcion1.replace('Cliente: ', '') : 'Consumidor Final';
                const hora = new Date(pago.createdAt || pago.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const montoItem = parseFloat(item.monto) || 0;
                        const cantItem = parseInt(item.cantidad) || 1;

                        productosLocalFormatted.push({
                            nombreProducto: item.nombre || 'Item Venta',
                            cantidadComprada: cantItem,
                            monto: Number((montoItem * cantItem).toFixed(2)),
                            idPago: pago.pagoId || pago.id,
                            fecha: pago.createdAt || pago.fecha,
                            canal: canal,
                            cliente: cliente,
                            medioPago: pago.medioPago || 'Desconocido',
                            hora: hora,
                            precioCompra: parseFloat(item.precioCompra) || 0,
                            marca: item.marca || '',
                            categoria: item.categoria || '',
                            proveedor: item.proveedor || '',
                            tarjeta_digitos: pago.tarjeta_digitos || null,
                            detalles_pago: pago.detalles_pago || null
                        });
                    });
                }
            });

            const payload = {
                mes: new Date().toLocaleString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase(),
                op2: `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
                productosVendidos: [...productosEcommerceFormatted, ...productosLocalFormatted],
                totalFinal: Number(totales.global.toFixed(2)) || 0,
                montoFinalEcommerce: Number(totales.ecommerce.toFixed(2)) || 0,
                montoFinalLocal: Number(totales.local.toFixed(2)) || 0,
                detalles_billetes: billsTotal,
                detalles_vuelto: changeTotal,
                resumen_cierre: (() => {
                    const metodosPago = {
                        efectivo: 0,
                        debito: 0,
                        transferencia: 0,
                        credito_1: 0,
                        credito_2: 0,
                        credito_3: 0,
                        credito_4: 0,
                        credito_5: 0,
                        credito_6: 0,
                        mixto: 0,
                        mercadopago: totales.ecommerce
                    };

                    ventasLocal.forEach(v => {
                        const m = (v.medioPago || '').toLowerCase();
                        const monto = parseFloat(v.montoTotal) || 0;
                        if (m === 'mixto') {
                            metodosPago.mixto += monto;
                            if (v.detalles_pago?.mixto) {
                                const desglose = v.detalles_pago.mixto;
                                if (desglose.efectivo) metodosPago.efectivo += parseFloat(desglose.efectivo);
                                if (desglose.transferencia) metodosPago.transferencia += parseFloat(desglose.transferencia);
                                if (desglose.debito) metodosPago.debito += parseFloat(desglose.debito);
                                if (desglose.credito_info && desglose.credito_info.monto > 0) {
                                    const cuotas = desglose.credito_info.cuotas || 1;
                                    const key = `credito_${cuotas}`;
                                    const montoCredito = parseFloat(desglose.credito_info.monto) || 0;
                                    const montoInteres = parseFloat(desglose.credito_info.interes_monto) || 0;
                                    const totalCreditoParte = montoCredito + montoInteres;

                                    if (metodosPago.hasOwnProperty(key)) {
                                        metodosPago[key] += totalCreditoParte;
                                    } else {
                                        metodosPago.credito_1 += totalCreditoParte;
                                    }
                                }
                            }
                        } else if (metodosPago.hasOwnProperty(m)) {
                            metodosPago[m] += monto;
                        } else if (m.includes('tarjeta_credito') || m.includes('credito')) {
                            if (m.includes('1')) metodosPago.credito_1 += monto;
                            else if (m.includes('2')) metodosPago.credito_2 += monto;
                            else if (m.includes('3')) metodosPago.credito_3 += monto;
                            else if (m.includes('4')) metodosPago.credito_4 += monto;
                            else if (m.includes('5')) metodosPago.credito_5 += monto;
                            else if (m.includes('6')) metodosPago.credito_6 += monto;
                            else metodosPago.credito_1 += monto;
                        }
                    });

                    const totalEgresos = egresos.reduce((acc, e) => acc + (parseFloat(e.monto) || 0), 0);

                    return {
                        Balance_Neto_Rango: totales.global - totalEgresos,
                        Ventas_Registradas_Hoy: totales.global,
                        Extracciones_en_Rango: totalEgresos,
                        Operaciones_en_Rango: ventasEcommerce.length + ventasLocal.length,
                        metodosPago
                    };
                })()
            };

            await axios.post(`${API_URL}/recaudacionFinal/`, payload);

            const deletePromises = [];

            const orderIdsToUpdate = [...new Set(ventasEcommerce.map(v => v.orderId))];
            orderIdsToUpdate.forEach(orderId => {
                const item = ventasEcommerce.find(v => v.orderId === orderId);
                if (item) {
                    const newMeta = { ...item.originalMetadata, cierreCaja: true, fechaCierre: new Date() };
                    deletePromises.push(axios.patch(`${API_URL}/ecommerce/pedidos/${orderId}/estado`, {
                        metadata_ecommerce: newMeta
                    }).catch(e => console.warn(`Fallo al archivar orden e-commerce ${orderId}`, e)));
                }
            });

            ventasLocal.forEach(v => {
                if (v.pagoId || v.id) {
                    deletePromises.push(axios.delete(`${API_URL}/pagoCaja/pagos/${v.pagoId || v.id}`).catch(e => console.warn('Fallo borrar local', v)));
                }
            });

            egresos.forEach(e => {
                if (e.id) {
                    deletePromises.push(axios.delete(`${API_URL}/egresos/egress/${e.id}`).catch(err => console.warn('Fallo borrar egreso', e)));
                }
            });

            if (doReset) {
                deletePromises.push(axios.delete(`${API_URL}/balanceMensual/BorraTodoBalanceMensual`).catch(e => console.warn('Fallo borrar balance total')));
            }

            await Promise.all(deletePromises);

            await Swal.fire({
                title: 'CIERRE EXITOSO',
                text: 'La caja ha sido cerrada y los registros archivados correctamente.',
                icon: 'success',
                confirmButtonColor: '#ffffff',
                confirmButtonText: '<span style="color: #000; font-family: Inter; font-weight: bold;">OK</span>',
                background: '#050505',
                color: '#fff'
            });

            fetchData();

        } catch (error) {
            console.error("Error en cierre:", error);
            const msg = error.response?.data?.message || 'Hubo un problema al procesar el cierre.';
            const details = error.response?.data?.details ? `\n\nDetalles:\n${JSON.stringify(error.response.data.details, null, 2)}` : `\n\nError: ${error.message}`;

            Swal.fire({
                title: 'Error Crítico',
                text: `${msg}${details}`,
                icon: 'error',
                background: '#050505',
                color: '#fff',
                confirmButtonColor: '#fff',
                confirmButtonText: '<span style="color: #000; font-family: Inter; font-weight: bold;">CERRAR</span>',
            });
        } finally {
            setProcesando(false);
        }
    };

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center min-h-[400px]">
            <FiLoader className="animate-spin text-white mb-4" size={40} />
            <p className={`${styles.tech} text-xs text-zinc-500 tracking-widest`}>SINCRONIZANDO_OPERACIONES...</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 md:pb-6 font-['Inter']">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 border-b border-white/10 pb-4 md:pb-6 gap-4">
                <div className="w-full">
                    <h2 className={`${styles.title} text-2xl md:text-4xl flex items-center gap-2 md:gap-4`}>
                        <FiCheck className="text-white hidden md:block" /> CIERRE_DE_CAJA_<span className="text-zinc-500">DIARIO</span>
                    </h2>
                    <p className={`${styles.tech} text-[8px] md:text-[10px] text-zinc-600 mt-1 md:mt-2 tracking-[0.2em] md:tracking-[0.4em]`}>
                        CORE_SYSTEM // {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                    </p>
                </div>

                {/* CONTROLES HEADER MOVILES/PC */}
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto bg-white/5 md:bg-transparent p-3 md:p-0 rounded-none">
                    <p className={`${styles.label} hidden md:block`}>Configuración_Sistema</p>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <span className="text-[8px] md:text-[9px] font-bold text-zinc-400 group-hover:text-zinc-200 uppercase tracking-widest transition-colors">
                                {autoCierre ? 'AUTO_ACTIVO' : 'AUTO_INACTIVO'}
                            </span>
                            <div onClick={() => setAutoCierre(!autoCierre)} className={`w-8 md:w-10 h-4 md:h-5 rounded-full p-0.5 md:p-1 transition-all flex items-center border border-white/20 ${autoCierre ? 'bg-white' : 'bg-[#111]'}`}>
                                <div className={`w-3 h-3 md:w-3 md:h-3 rounded-full shadow-md transform transition-transform ${autoCierre ? 'translate-x-4 md:translate-x-5 bg-black' : 'translate-x-0 bg-white/50'}`} />
                            </div>
                        </label>
                        <div className="h-4 w-px bg-zinc-800 hidden md:block"></div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-pulse"></div>
                            <span className="text-white font-bold text-[8px] md:text-xs tracking-widest uppercase">Abierta</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESUMEN DE TOTALES (GRID RESPONSIVE) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-12">
                {/* CARD ECOMMERCE */}
                <div className={`${styles.glassCard} p-4 md:p-8 relative overflow-hidden group col-span-1`}>
                    <div className="absolute top-2 right-2 md:top-0 md:right-0 md:p-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
                        <FiShoppingCart className="text-2xl md:text-[80px]" />
                    </div>
                    <p className={styles.label}>Ingresos_Web</p>
                    <h3 className="text-lg md:text-3xl font-black text-white font-['Inter'] tracking-tighter mb-1 md:mb-2 truncate">
                        ${totales.ecommerce.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </h3>
                    <p className="text-[7px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {ventasEcommerce.length} OP. PEND.
                    </p>
                </div>

                {/* CARD LOCAL */}
                <div className={`${styles.glassCard} p-4 md:p-8 relative overflow-hidden group col-span-1`}>
                    <div className="absolute top-2 right-2 md:top-0 md:right-0 md:p-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
                        <FiDollarSign className="text-2xl md:text-[80px]" />
                    </div>
                    <p className={styles.label}>Ingresos_Local</p>
                    <h3 className="text-lg md:text-3xl font-black text-white font-['Inter'] tracking-tighter mb-1 md:mb-2 truncate">
                        ${totales.local.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </h3>
                    <p className="text-[7px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {ventasLocal.length} OP. PEND.
                    </p>
                </div>

                {/* CARD TOTAL (OCUPA ANCHO COMPLETO EN MOVIL) */}
                <div className="bg-white p-5 md:p-8 relative overflow-hidden rounded-none col-span-2 lg:col-span-1 border border-white">
                    <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-5 text-black">
                        <FiActivity className="text-5xl md:text-[80px]" />
                    </div>
                    <p className="font-['Inter'] text-[8px] md:text-[10px] font-black text-black/60 uppercase tracking-[0.2em] mb-1 block">
                        Recaudación_Neta
                    </p>
                    <h3 className="text-3xl md:text-4xl font-black text-black font-['Inter'] mb-2 tracking-tighter truncate">
                        ${totales.global.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </h3>
                    <div className="mt-2 md:mt-4 pt-2 md:pt-4 border-t border-black/10 flex justify-between items-center">
                        <span className="text-[8px] md:text-[10px] font-black text-black/40 uppercase tracking-widest">Ready_To_Close</span>
                    </div>
                </div>
            </div>

            {/* TABS NAVEGACIÓN (SÓLO VISIBLES EN MÓVILES) */}
            <div className="flex lg:hidden gap-4 mb-4 border-b border-white/10 overflow-x-auto [&::-webkit-scrollbar]:hidden snap-x pb-2">
                <button
                    onClick={() => setMobileTab('local')}
                    className={`relative font-['Inter'] font-black text-[10px] uppercase tracking-widest pb-3 whitespace-nowrap snap-start transition-all ${mobileTab === 'local' ? 'text-white' : 'text-zinc-600'}`}
                >
                    Local_Físico ({ventasLocal.length})
                    {mobileTab === 'local' && <motion.div layoutId="cierreTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                </button>
                <button
                    onClick={() => setMobileTab('ecommerce')}
                    className={`relative font-['Inter'] font-black text-[10px] uppercase tracking-widest pb-3 whitespace-nowrap snap-start transition-all ${mobileTab === 'ecommerce' ? 'text-white' : 'text-zinc-600'}`}
                >
                    E-Commerce ({ventasEcommerce.length})
                    {mobileTab === 'ecommerce' && <motion.div layoutId="cierreTab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                </button>
            </div>

            {/* DETALLE DE OPERACIONES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-12">

                {/* LISTA ECOMMERCE */}
                <div className={`${styles.glassCard} flex-col h-[60vh] md:h-[500px] ${mobileTab === 'ecommerce' ? 'flex' : 'hidden'} lg:flex`}>
                    <div className="p-4 md:p-6 border-b border-white/5 bg-[#111] flex justify-between items-center shrink-0">
                        <h4 className={`${styles.title} text-xs md:text-sm flex items-center gap-2`}>
                            <FiShoppingCart className="text-white" /> Detalle_Ecommerce
                        </h4>
                        <span className="bg-white/10 text-white px-2 py-1 text-[8px] md:text-[9px] font-bold rounded-none border border-white/20">
                            {ventasEcommerce.length} ITEMS
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 custom-scrollbar">
                        {ventasEcommerce.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                                <FiPackage size={30} className="mb-2 opacity-20" />
                                <p className="text-[9px] uppercase font-bold tracking-widest">Sin operaciones</p>
                            </div>
                        ) : (
                            ventasEcommerce.map((v, i) => (
                                <div key={i} className="p-3 md:p-4 bg-[#0a0a0a] border border-white/5 hover:border-white/30 transition-colors rounded-none flex flex-col gap-2">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col max-w-[70%]">
                                            <span className="text-[9px] md:text-[10px] font-bold text-white uppercase truncate leading-tight">{v.nombre || v.nombreProducto}</span>
                                            <span className="text-[8px] text-zinc-500 uppercase font-bold mt-1 truncate">{v.nombreComprador}</span>
                                        </div>
                                        <span className="text-xs md:text-[10px] font-['Inter'] text-white font-black tracking-tighter">
                                            ${(parseFloat(v.precio) * parseInt(v.cantidad)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] text-zinc-400 font-bold uppercase">Cant: <span className="text-white">{v.cantidad}</span></span>
                                            <span className="bg-white/10 border border-white/20 text-white px-1.5 py-0.5 rounded-none font-black text-[7px] tracking-wider">WEB</span>
                                        </div>
                                        <span className="text-[8px] text-zinc-500 font-['Inter'] font-bold">{new Date(v.fechaCompra || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* LISTA LOCAL */}
                <div className={`${styles.glassCard} flex-col h-[60vh] md:h-[500px] ${mobileTab === 'local' ? 'flex' : 'hidden'} lg:flex`}>
                    <div className="p-4 md:p-6 border-b border-white/5 bg-[#111] flex justify-between items-center shrink-0">
                        <h4 className={`${styles.title} text-xs md:text-sm flex items-center gap-2`}>
                            <FiDollarSign className="text-white" /> Detalle_Local
                        </h4>
                        <span className="bg-white text-black px-2 py-1 text-[8px] md:text-[9px] font-black rounded-none border border-white">
                            {ventasLocal.length} ITEMS
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 custom-scrollbar">
                        {ventasLocal.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                                <FiPackage size={30} className="mb-2 opacity-20" />
                                <p className="text-[9px] uppercase font-bold tracking-widest">Sin operaciones</p>
                            </div>
                        ) : (
                            ventasLocal.map((v, i) => (
                                <div key={i} className="bg-[#0a0a0a] border border-white/5 hover:border-white/30 transition-colors rounded-none">
                                    <div className="p-3 md:p-4 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] md:text-[10px] font-black text-white uppercase flex items-center gap-1.5">
                                                <FiCheck size={10} className="text-white" /> VNT_#{v.pagoId || v.id}
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[8px] text-zinc-500 uppercase font-['Inter'] font-bold">{v.medioPago}</span>
                                                <span className={`px-1.5 py-0.5 rounded-none font-black text-[7px] ${(v.origenDeVenta || '').toLowerCase().includes('revendedor') ? 'bg-zinc-800 text-white border border-zinc-600' : 'bg-white text-black border border-white'}`}>
                                                    {(v.origenDeVenta || 'LOCAL').toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-[8px] text-zinc-400 uppercase mt-1 truncate max-w-[150px]">{v.opcion1 || 'Consumidor Final'}</span>
                                        </div>
                                        <span className="text-sm md:text-[12px] font-['Inter'] text-white font-black tracking-tighter">
                                            ${parseFloat(v.montoTotal).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* DETALLE DE PRODUCTOS */}
                                    <div className="p-2 md:p-3 bg-black/40">
                                        {(v.productos || []).map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[8px] md:text-[9px] text-zinc-400 py-1.5 border-b border-white/5 last:border-0 hover:text-white transition-colors">
                                                <div className="flex items-center gap-2 max-w-[75%]">
                                                    <span className="font-black text-black bg-white px-1 rounded-none">{p.cantidad}x</span>
                                                    <span className="uppercase truncate font-medium">{p.nombre}</span>
                                                </div>
                                                <span className="font-['Inter'] font-bold">
                                                    ${(parseFloat(p.monto || p.precio || p.precioVenta || 0) * parseInt(p.cantidad || 1)).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}

                                        {v.medioPago === 'mixto' && v.detalles_pago?.mixto && (
                                            <div className="mt-2 p-2 bg-[#111] border-t border-white/10 grid grid-cols-2 md:grid-cols-3 gap-2 rounded-none">
                                                {Object.entries(v.detalles_pago.mixto).map(([metodo, valor]) => valor > 0 && (
                                                    <div key={metodo} className="text-left md:text-center flex justify-between md:block bg-black p-1.5 rounded-none border border-white/5">
                                                        <span className="text-[7px] text-zinc-500 uppercase md:block">{metodo}</span>
                                                        <span className="text-[8px] md:text-[9px] text-white font-black font-['Inter']">${parseFloat(valor).toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ACCIONES (STICKY EN MOVILES) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#050505]/95 backdrop-blur-xl border-t border-white/10 md:static md:bg-transparent md:border-t-0 md:p-0 z-50 flex justify-center md:justify-end shadow-[0_-10px_30px_rgba(0,0,0,0.8)] md:shadow-none">
                <button
                    onClick={handleCierreCaja}
                    disabled={procesando || totales.global === 0}
                    className={`${styles.btnPrimary} w-full md:w-auto flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {procesando ? (
                        <>
                            <FiLoader className="animate-spin" size={16} /> PROCESANDO...
                        </>
                    ) : (
                        <>
                            <FiArchive size={16} /> <span className="hidden md:inline">EJECUTAR_CIERRE_MAESTRO_Y_ARCHIVAR</span><span className="inline md:hidden">EJECUTAR_CIERRE_MAESTRO</span>
                        </>
                    )}
                </button>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
            `}</style>
        </div>
    );
};

export default CierreCajaDiario;