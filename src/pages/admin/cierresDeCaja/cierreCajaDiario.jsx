import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiDollarSign, FiShoppingCart, FiCreditCard, FiAlertTriangle,
    FiLoader, FiCalendar, FiArchive, FiTrendingUp, FiActivity, FiPackage
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

// --- ESTILOS CONSTANTES (NEO-BRUTALISMO) ---
const styles = {
    title: "text-gray-900 font-bold text-lg md:text-2xl",
    label: "text-xs font-medium text-gray-700 mb-1 md:mb-2 block",
    tech: "text-[10px] text-gray-400 font-medium tracking-wider",
    glassCard: "bg-white border border-gray-100 shadow-sm rounded-2xl",
    btnPrimary: "bg-[#0A58CA] text-white font-medium text-sm rounded-xl shadow-sm hover:bg-[#084298] transition-all px-4 py-2 flex items-center justify-center gap-2",
};

const CierreCajaDiario = () => {
    const [loading, setLoading] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [ventasEcommerce, setVentasEcommerce] = useState([]);
    const [ventasLocal, setVentasLocal] = useState([]);
    const [egresos, setEgresos] = useState([]);

    // ESTADO PARA TABS EN MÓVILES
    const [mobileTab, setMobileTab] = useState('ecommerce');

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

            // try {
            //     resLocal = await axios.get(`${API_URL}/pagoCaja/pagos`);
            //     console.log("FETCH_LOCAL_SUCCESS:", resLocal.data?.length, "items");
            // } catch (e) {
            //     console.error("FETCH_LOCAL_ERROR:", e.message);
            // }

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
            setVentasLocal([]);

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
                title: 'Caja vacía',
                text: 'No hay movimientos para cerrar.',
                icon: 'info',
                background: '#ffffff',
                color: '#111827',
                confirmButtonColor: '#0A58CA',
                customClass: {
                    popup: 'rounded-2xl border border-gray-100 shadow-sm',
                    confirmButton: 'rounded-xl px-6 py-2'
                }
            });
            return;
        }

        const confirm = opciones?.automatico ? { isConfirmed: true } : await Swal.fire({
            title: '¿Confirmar cierre diario?',
            html: `
                <p style="color: #6b7280; font-size: 14px;">Se archivarán ${ventasEcommerce.length + ventasLocal.length} operaciones por un total de <strong style="color: #111827;">$${totales.global.toLocaleString('es-AR')}</strong>.</p>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #f3f4f6; text-align: center;">
                    <p style="color: #6b7280; font-size: 12px; font-weight: 500;">
                        Reseteo de Billetes: <span style="color: ${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? '#059669' : '#9ca3af'}">${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? 'Habilitado' : 'Deshabilitado'}</span>
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin-top: 4px;">(Configurado en la sección de Balance)</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0A58CA',
            cancelButtonColor: '#f3f4f6',
            confirmButtonText: '<span style="color: #fff; font-weight: 500; font-size: 14px;">Sí, Ejecutar</span>',
            cancelButtonText: '<span style="color: #4b5563; font-weight: 500; font-size: 14px;">Cancelar</span>',
            background: '#ffffff',
            color: '#111827',
            customClass: {
                popup: 'rounded-2xl border border-gray-100 shadow-sm',
                confirmButton: 'rounded-xl px-4 py-2',
                cancelButton: 'rounded-xl px-4 py-2 border border-gray-200'
            }
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
                title: 'Cierre exitoso',
                text: 'La caja ha sido cerrada y los registros archivados correctamente.',
                icon: 'success',
                confirmButtonColor: '#0A58CA',
                confirmButtonText: '<span style="color: #fff; font-weight: 500;">OK</span>',
                background: '#ffffff',
                color: '#111827',
                customClass: {
                    popup: 'rounded-2xl border border-gray-100 shadow-sm',
                    confirmButton: 'rounded-xl px-6 py-2'
                }
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
                background: '#ffffff',
                color: '#111827',
                confirmButtonColor: '#ef4444',
                confirmButtonText: '<span style="color: #fff; font-weight: 500;">Cerrar</span>',
                customClass: {
                    popup: 'rounded-2xl border border-gray-100 shadow-sm',
                    confirmButton: 'rounded-xl px-6 py-2'
                }
            });
        } finally {
            setProcesando(false);
        }
    };

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center min-h-[400px] bg-[#F4F7FE]">
            <FiLoader className="animate-spin text-[#0A58CA] mb-4" size={40} />
            <p className="text-gray-500 text-sm font-medium">Sincronizando operaciones...</p>
        </div>
    );

    return (
        <div className="bg-[#F4F7FE] text-gray-900 min-h-screen max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6 transition-all duration-500">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-10 pb-4 md:pb-6 gap-4">
                <div className="w-full">
                    <h2 className={`${styles.title} flex items-center gap-2 md:gap-3`}>
                        <FiCheck className="text-[#0A58CA] hidden md:block w-6 h-6" /> Cierre de Caja <span className="text-gray-500">Diario</span>
                    </h2>
                    <p className={`${styles.tech} mt-1 md:mt-2 uppercase`}>
                        Panel de Control // {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                    </p>
                </div>

                {/* CONTROLES HEADER MOVILES/PC */}
                <div className="flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto p-4 md:p-0 rounded-2xl md:rounded-none bg-white md:bg-transparent border border-gray-100 md:border-none shadow-sm md:shadow-none">
                    <p className={`${styles.label} hidden md:block mb-2 uppercase`}>Configuración Sistema</p>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <span className="text-xs font-medium text-gray-600 transition-colors">
                                {autoCierre ? 'Auto Activo' : 'Auto Inactivo'}
                            </span>
                            <div onClick={() => setAutoCierre(!autoCierre)} className={`w-10 h-5 md:h-6 md:w-12 rounded-full p-1 transition-all flex items-center ${autoCierre ? 'bg-[#0A58CA]' : 'bg-gray-200'}`}>
                                <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full shadow-sm bg-white transform transition-transform ${autoCierre ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
                            </div>
                        </label>
                        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-gray-100 px-3 py-1.5 rounded-xl">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-gray-700 font-semibold text-xs uppercase tracking-wide">Abierta</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESUMEN DE TOTALES (GRID RESPONSIVE) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mb-6 md:mb-8">
                {/* CARD ECOMMERCE */}
                <div className={`${styles.glassCard} p-5 md:p-6 relative overflow-hidden group`}>
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-[#0A58CA]">
                        <FiShoppingCart className="text-[100px]" />
                    </div>
                    <p className={styles.label}>Ingresos Web</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 truncate">
                        ${totales.ecommerce.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                        {ventasEcommerce.length} operaciones pendientes
                    </p>
                </div>

                {/* CARD TOTAL */}
                <div className={`${styles.glassCard} p-5 md:p-6 relative overflow-hidden bg-white`}>
                    <div className="absolute -top-4 -right-4 p-4 opacity-5 transition-opacity text-[#0A58CA]">
                        <FiActivity className="text-[100px]" />
                    </div>
                    <p className={styles.label}>Recaudación Neta</p>
                    <h3 className="text-3xl md:text-4xl font-bold text-[#0A58CA] mb-2 truncate">
                        ${totales.global.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-500">Lista para cierre</span>
                    </div>
                </div>
            </div>

            {/* DETALLE DE OPERACIONES */}
            <div className="grid grid-cols-1 gap-4 md:gap-5 mb-6 md:mb-12">

                {/* LISTA ECOMMERCE */}
                <div className={`${styles.glassCard} flex-col h-[60vh] md:h-[500px] flex overflow-hidden`}>
                    <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center shrink-0">
                        <h4 className="text-gray-900 font-semibold text-base flex items-center gap-2">
                            <FiShoppingCart className="text-gray-500 w-5 h-5" /> Detalle Ecommerce
                        </h4>
                        <span className="bg-[#F8FAFC] text-gray-600 border border-gray-100 px-3 py-1 text-xs font-semibold rounded-xl">
                            {ventasEcommerce.length} items
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                        {ventasEcommerce.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <FiPackage size={40} className="mb-3 opacity-30" />
                                <p className="text-sm font-medium">No hay operaciones pendientes</p>
                            </div>
                        ) : (
                            ventasEcommerce.map((v, i) => (
                                <div key={i} className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl flex flex-col gap-3 hover:border-gray-200 transition-colors">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-semibold text-gray-900 truncate">{v.nombre || v.nombreProducto}</span>
                                            <span className="text-xs text-gray-500 font-medium truncate mt-0.5">{v.nombreComprador}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 shrink-0">
                                            ${(parseFloat(v.precio) * parseInt(v.cantidad)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-500 font-medium">Cant: <span className="text-gray-900 font-semibold">{v.cantidad}</span></span>
                                            <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-semibold text-[10px]">WEB</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">{new Date(v.fechaCompra || Date.now()).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* ACCIONES (STICKY EN MOVILES) */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 md:static md:bg-transparent md:border-t-0 md:p-0 z-50 flex justify-center md:justify-end shadow-sm md:shadow-none">
                <button
                    onClick={handleCierreCaja}
                    disabled={procesando || totales.global === 0}
                    className={`${styles.btnPrimary} w-full md:w-auto h-12 md:px-8 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {procesando ? (
                        <>
                            <FiLoader className="animate-spin w-5 h-5" /> Procesando...
                        </>
                    ) : (
                        <>
                            <FiArchive className="w-5 h-5" /> <span className="hidden md:inline">Ejecutar Cierre Maestro y Archivar</span><span className="inline md:hidden">Ejecutar Cierre</span>
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