import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiCheck, FiDollarSign, FiShoppingCart, FiCreditCard, FiAlertTriangle,
    FiLoader, FiCalendar, FiArchive, FiTrendingUp, FiActivity, FiPackage, FiClock
} from 'react-icons/fi';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

const styles = {
    title: "text-3xl font-bold tracking-tight text-neutral-900",
    label: "text-[10px] text-neutral-400 block",
    tech: "text-[11px] text-neutral-400",
    glassCard: "bg-white border border-[#ECECE6] rounded-2xl shadow-xs hover:border-[#D5D5CF] transition-all",
    btnPrimary: "inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors",
};

const CierreCajaDiario = ({ onVerHistorial }) => {
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

            try {
                resLocal = await axios.get(`${API_URL}/pagoCaja/pagos`);
                console.log("FETCH_LOCAL_SUCCESS:", resLocal.data?.length, "items");
            } catch (e) {
                console.warn("FETCH_LOCAL_NOTICE:", e.message);
            }

            const ecommerceProducts = (resEcom.data || [])
                .filter(order => {
                    let meta = order.metadata_ecommerce;
                    if (typeof meta === 'string') {
                        try {
                            meta = JSON.parse(meta);
                        } catch (e) {
                            meta = {};
                        }
                    }
                    // Excluir si ya fue cerrado
                    return !meta?.cierreCaja;
                })
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

                    let meta = order.metadata_ecommerce || {};
                    if (typeof meta === 'string') {
                        try {
                            meta = JSON.parse(meta);
                        } catch (e) {
                            meta = {};
                        }
                    }

                    return items.map(item => ({
                        ...item,
                        nombre: item.title || item.nombre || 'Producto Ecommerce',
                        precio: parseFloat(item.unit_price || item.precio || 0),
                        cantidad: parseInt(item.quantity || item.cantidad || 1),
                        precioCompra: parseFloat(item.cost_price || item.precioCompra || 0),
                        orderId: order.id,
                        nombreComprador: order.name,
                        fechaCompra: order.createdAt,
                        descuentoGlobalAplicado: 0,
                        originalMetadata: meta
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
            Swal.fire({
                title: 'Error',
                text: 'No se pudieron sincronizar los datos de caja.',
                icon: 'error',
                confirmButtonColor: '#19191B'
            });
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

    // --- LÓGICA DE CIERRE AUTOMÁTICO A LAS 11 DE LA NOCHE (23:00 HS) ---
    const [autoCierre, setAutoCierre] = useState(() => {
        const savedAuto = localStorage.getItem('FEDECELL_AUTO_CIERRE');
        // Por defecto activo para garantizar el cierre a las 11 de la noche
        return savedAuto !== null ? JSON.parse(savedAuto) : true;
    });

    useEffect(() => {
        localStorage.setItem('FEDECELL_AUTO_CIERRE', JSON.stringify(autoCierre));

        let interval;
        if (autoCierre) {
            interval = setInterval(() => {
                const now = new Date();
                // 11 de la noche = 23:00 hs
                if (now.getHours() === 23 && now.getMinutes() === 0) {
                    const todayStr = now.toLocaleDateString('es-AR');
                    const lastCierre = localStorage.getItem('FEDECELL_LAST_CIERRE_FECHA');
                    if (lastCierre !== todayStr && totales.global > 0 && !procesando) {
                        localStorage.setItem('FEDECELL_LAST_CIERRE_FECHA', todayStr);
                        console.log("⏰ [AUTO_CIERRE_FRONT] 11 de la noche detectado. Ejecutando cierre de caja diario...");
                        handleCierreCaja({ automatico: true });
                    }
                }
            }, 5000); // Monitorear cada 5 segundos durante el minuto 23:00
        }
        return () => clearInterval(interval);
    }, [autoCierre, totales.global, procesando]);

    // --- MANEJADOR DE CIERRE ---
    const [resetBalanceOnCierre, setResetBalanceOnCierre] = useState(true);

    const handleCierreCaja = async (opciones = {}) => {
        if (totales.global === 0) {
            Swal.fire({
                title: 'Caja vacía',
                text: 'No hay movimientos para cerrar.',
                icon: 'info',
                background: '#ffffff',
                color: '#222222',
                confirmButtonColor: '#19191B',
                customClass: {
                    popup: 'rounded-2xl border border-[#ECECE6] shadow-xs',
                    confirmButton: 'rounded-xl px-4 py-2'
                }
            });
            return;
        }

        const confirm = opciones?.automatico ? { isConfirmed: true } : await Swal.fire({
            title: '¿Confirmar cierre diario?',
            html: `
                <p style="color: #737373; font-size: 13px;">Se archivarán ${ventasEcommerce.length + ventasLocal.length} operaciones por un total de <strong style="color: #171717;">$${totales.global.toLocaleString('es-AR')}</strong>.</p>
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #F1F1EB; text-align: center;">
                    <p style="color: #737373; font-size: 12px; font-weight: 500;">
                        Reseteo de Billetes: <span style="color: ${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? '#29974D' : '#737373'}">${localStorage.getItem('fedecell_reseteo_billetes_auto') === 'true' ? 'Habilitado' : 'Deshabilitado'}</span>
                    </p>
                    <p style="color: #a3a3a3; font-size: 11px; margin-top: 4px;">(Configurado en la sección de Balance)</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#19191B',
            cancelButtonColor: '#F3F2EE',
            confirmButtonText: '<span style="color: #fff; font-weight: 600; font-size: 12px;">Sí, Ejecutar</span>',
            cancelButtonText: '<span style="color: #262626; font-weight: 600; font-size: 12px;">Cancelar</span>',
            background: '#ffffff',
            color: '#222222',
            customClass: {
                popup: 'rounded-2xl border border-[#ECECE6] shadow-xs',
                confirmButton: 'rounded-xl px-4 py-2',
                cancelButton: 'rounded-xl px-4 py-2 border border-[#DEDEDA]'
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

            const orderIdsToUpdate = [...new Set(ventasEcommerce.map(v => v.orderId).filter(Boolean))];
            const localIds = ventasLocal.map(v => v.pagoId || v.id).filter(Boolean);
            const egresosIds = egresos.map(e => e.id).filter(Boolean);

            let cierreCompletado = false;

            // 1. Intentar cerrar mediante el endpoint unificado del backend
            try {
                await axios.post(`${API_URL}/recaudacionFinal/cierre-diario`, {
                    payload,
                    orderIds: orderIdsToUpdate,
                    ventasLocalIds: localIds,
                    egresosIds: egresosIds,
                    doResetBalance: doReset
                });
                cierreCompletado = true;
            } catch (errCentralizado) {
                console.warn("Fallo endpoint unificado /cierre-diario, ejecutando fallback estándar:", errCentralizado.message);
                
                // Fallback manual
                await axios.post(`${API_URL}/recaudacionFinal/`, payload);

                const deletePromises = [];

                orderIdsToUpdate.forEach(orderId => {
                    const item = ventasEcommerce.find(v => v.orderId === orderId);
                    if (item) {
                        let baseMeta = item.originalMetadata || {};
                        if (typeof baseMeta === 'string') {
                            try { baseMeta = JSON.parse(baseMeta); } catch(e) { baseMeta = {}; }
                        }
                        const newMeta = { ...baseMeta, cierreCaja: true, fechaCierre: new Date().toISOString() };
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
                cierreCompletado = true;
            }

            // 2. INMEDIATAMENTE RESETEAR EL ESTADO A CERO
            setVentasEcommerce([]);
            setVentasLocal([]);
            setEgresos([]);

            await Swal.fire({
                title: 'Cierre exitoso',
                html: `
                    <p style="color: #737373; font-size: 13px; margin-bottom: 8px;">
                        La caja ha sido cerrada y los registros archivados en el <strong>Historial de Recaudación Final</strong>.
                    </p>
                    <div style="background-color: #EDF9F0; border: 1px solid #DCF3E3; padding: 12px; border-radius: 12px; text-align: center;">
                        <span style="color: #29974D; font-weight: 600; font-size: 12px;">✓ CAJA DIARIA QUEDA EN $0</span>
                    </div>
                `,
                icon: 'success',
                confirmButtonColor: '#19191B',
                confirmButtonText: '<span style="color: #fff; font-weight: 600; font-size: 12px;">Entendido</span>',
                background: '#ffffff',
                color: '#222222',
                customClass: {
                    popup: 'rounded-2xl border border-[#ECECE6] shadow-xs',
                    confirmButton: 'rounded-xl px-4 py-2'
                }
            });

            // 3. Re-sincronizar datos para confirmar estado en cero desde el servidor
            await fetchData();

        } catch (error) {
            console.error("Error en cierre:", error);
            const msg = error.response?.data?.message || 'Hubo un problema al procesar el cierre.';
            const details = error.response?.data?.details ? `\n\nDetalles:\n${JSON.stringify(error.response.data.details, null, 2)}` : `\n\nError: ${error.message}`;

            Swal.fire({
                title: 'Error Crítico',
                text: `${msg}${details}`,
                icon: 'error',
                background: '#ffffff',
                color: '#222222',
                confirmButtonColor: '#F36B2B',
                confirmButtonText: '<span style="color: #fff; font-weight: 600; font-size: 12px;">Cerrar</span>',
                customClass: {
                    popup: 'rounded-2xl border border-[#ECECE6] shadow-xs',
                    confirmButton: 'rounded-xl px-4 py-2'
                }
            });
        } finally {
            setProcesando(false);
        }
    };

    if (loading) return (
        <div className="min-h-[400px] bg-[#FAF9F6] text-[#222222] flex flex-col items-center justify-center p-6">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 mb-2">
                <FiLoader className="animate-spin w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-neutral-400">Sincronizando operaciones...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#222222] pb-24 md:pb-6">
            <div className="max-w-7xl mx-auto">
                {/* HEADER DEL MÓDULO */}
                <div className="p-6 pb-2 border-b border-[#EAEAE6]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                        <div>
                            <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                                Operación Diaria
                            </span>
                            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                                Cierre de Caja Diario
                            </h1>
                            <p className="text-[11px] text-neutral-400 mt-1">
                                Panel de control — {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>

                        {/* CONTROLES HEADER */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {onVerHistorial && (
                                <button
                                    onClick={onVerHistorial}
                                    type="button"
                                    className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                                >
                                    <FiArchive className="w-3.5 h-3.5" />
                                    <span>Ver Historial de Cierres</span>
                                </button>
                            )}

                            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white border border-[#ECECE6] shadow-xs">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] text-neutral-400 block">Cierre Auto (23:00 hs)</span>
                                        <span className="text-[11px] font-semibold text-neutral-900">
                                            {autoCierre ? '11 PM Activo' : 'Desactivado'}
                                        </span>
                                    </div>
                                    <div
                                        onClick={() => setAutoCierre(!autoCierre)}
                                        className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center ${autoCierre ? 'bg-[#19191B]' : 'bg-neutral-300'}`}
                                    >
                                        <div className={`w-3 h-3 rounded-full shadow-2xs bg-white transform transition-transform ${autoCierre ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </label>
                                <div className="h-5 w-px bg-[#EAEAE6]" />
                                <span
                                    className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                        totales.global === 0
                                            ? 'bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]'
                                            : 'bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${totales.global === 0 ? 'bg-[#29974D]' : 'bg-[#F36B2B] animate-pulse'}`} />
                                    <span>
                                        {totales.global === 0 ? 'Caja en Cero' : 'Abierta'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECCIONES DE CONTENIDO */}
                <div className="p-6 space-y-4">
                    {/* RESUMEN DE TOTALES (KPI GRID) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* CARD ECOMMERCE */}
                        <div className="sm:col-span-1 lg:col-span-2 bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-bold text-neutral-900">Ingresos Web</h3>
                                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                        <FiShoppingCart className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-neutral-900 mt-2 truncate">
                                    ${totales.ecommerce.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-[#F1F1EB] flex justify-between items-center">
                                <span className="text-[11px] text-neutral-400">
                                    {ventasEcommerce.length} operaciones pendientes
                                </span>
                            </div>
                        </div>

                        {/* CARD TOTAL */}
                        <div className="sm:col-span-1 lg:col-span-2 bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-bold text-neutral-900">Recaudación Neta</h3>
                                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                        <FiActivity className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-neutral-900 mt-2 truncate">
                                    ${totales.global.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div className="mt-3 pt-2.5 border-t border-[#F1F1EB] flex justify-between items-center">
                                <span className="text-[11px] text-neutral-400">Lista para cierre</span>
                            </div>
                        </div>
                    </div>

                    {/* DETALLE DE OPERACIONES */}
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                        <div className="pb-3.5 mb-3.5 border-b border-[#F1F1EB] flex justify-between items-center">
                            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <FiShoppingCart className="w-3.5 h-3.5 text-neutral-500" />
                                Detalle Ecommerce
                            </h2>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">
                                {ventasEcommerce.length} items
                            </span>
                        </div>
                        <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
                            {ventasEcommerce.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center text-neutral-400">
                                    <FiPackage className="w-4 h-4 mb-2" />
                                    <p className="text-[11px] text-neutral-400">No hay operaciones pendientes</p>
                                </div>
                            ) : (
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#F1F1EB]">
                                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Producto</th>
                                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Comprador</th>
                                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Canal</th>
                                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Cantidad</th>
                                            <th className="py-2.5 px-3 text-left text-[10px] text-neutral-400 font-medium uppercase">Fecha</th>
                                            <th className="py-2.5 px-3 text-right text-[10px] text-neutral-400 font-medium uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F1EB]">
                                        {ventasEcommerce.map((v, i) => (
                                            <tr key={i} className="hover:bg-[#FAF9F6] transition-colors">
                                                <td className="py-2.5 px-3 text-xs font-bold text-neutral-900">
                                                    {v.nombre || v.nombreProducto}
                                                </td>
                                                <td className="py-2.5 px-3 text-xs font-medium text-neutral-700">
                                                    {v.nombreComprador}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]">
                                                        WEB
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-xs font-medium text-neutral-700">
                                                    {v.cantidad}
                                                </td>
                                                <td className="py-2.5 px-3 text-[11px] text-neutral-400">
                                                    {new Date(v.fechaCompra || Date.now()).toLocaleDateString()}
                                                </td>
                                                <td className="py-2.5 px-3 text-right text-xs font-bold text-neutral-900">
                                                    ${(parseFloat(v.precio) * parseInt(v.cantidad)).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* ACCIONES (STICKY EN MOVILES) */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#EAEAE6] md:static md:bg-transparent md:border-t-0 md:p-0 z-50 flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-2.5">
                        {onVerHistorial && (
                            <button
                                onClick={onVerHistorial}
                                type="button"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                            >
                                <FiArchive className="w-3.5 h-3.5" />
                                <span>Ver Historial de Cierres</span>
                            </button>
                        )}

                        <button
                            onClick={handleCierreCaja}
                            disabled={procesando || totales.global === 0}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {procesando ? (
                                <>
                                    <FiLoader className="animate-spin w-3.5 h-3.5" /> Procesando Cierre...
                                </>
                            ) : totales.global === 0 ? (
                                <>
                                    <FiCheck className="w-3.5 h-3.5 text-[#29974D]" />
                                    <span className="hidden md:inline">Caja en Cero — Sin Movimientos Pendientes</span>
                                    <span className="inline md:hidden">Caja en Cero ($0)</span>
                                </>
                            ) : (
                                <>
                                    <FiArchive className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">Ejecutar Cierre Maestro y Archivar</span>
                                    <span className="inline md:hidden">Ejecutar Cierre</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CierreCajaDiario;
