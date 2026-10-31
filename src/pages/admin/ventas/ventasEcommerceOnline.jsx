import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    FiGlobe, FiSearch, FiPackage, FiTruck, FiCheckCircle,
    FiClock, FiUser, FiMapPin, FiShoppingBag, FiTrendingUp,
    FiList, FiRefreshCw, FiAlertCircle, FiPhone, FiTag, FiHash
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const styles = {
    card: "bg-white border border-[#ECECE6] rounded-2xl shadow-xs hover:border-[#D5D5CF] transition-all",
    heading: "text-3xl font-bold tracking-tight text-neutral-900",
    tech: "text-xs font-medium text-neutral-700",
    buttonActive: "px-2.5 py-1 bg-white text-neutral-900 rounded-2xl shadow-2xs font-semibold inline-flex items-center gap-1.5 transition-colors",
    buttonInactive: "px-2.5 py-1 hover:text-neutral-900 inline-flex items-center gap-1.5 transition-colors",
    label: "text-[10px] text-neutral-400 block uppercase",
};

const DISPATCH_ESTADOS = {
    PENDIENTE: { label: 'PENDIENTE', color: 'text-[#F36B2B]', bg: 'bg-[#FFF1EB]', border: 'border-[#FDE0D3]', icon: FiClock },
    EN_CAMINO: { label: 'EN CAMINO', color: 'text-[#2F80ED]', bg: 'bg-[#EEF5FF]', border: 'border-[#DEEBFE]', icon: FiTruck },
    RECIBIDO: { label: 'RECIBIDO', color: 'text-[#29974D]', bg: 'bg-[#EDF9F0]', border: 'border-[#DCF3E3]', icon: FiCheckCircle },
};

const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
        .format(parseFloat(valor || 0)).replace('ARS', '$');
};

const formatearFecha = (fechaString) => {
    if (!fechaString) return 'S/D';
    try {
        return new Date(fechaString).toLocaleDateString('es-AR', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'ERROR_FECHA'; }
};

// Tarjeta de Paquete (orden agrupada por cliente)
const PaqueteCard = ({ orden, onEstadoChange }) => {
    const estadoConfig = DISPATCH_ESTADOS[orden.dispatchStatus] || DISPATCH_ESTADOS.PENDIENTE;
    const EstadoIcon = estadoConfig.icon;
    const items = Array.isArray(orden.items) ? orden.items : [];
    const isEcommerceNormal = items[0]?.origenDeVenta !== 'Revendedor';

    const handleEstadoChange = async (nuevoEstado) => {
        try {
            if (orden.originalIds && orden.orginalIds.length > 0) {
                await Promise.all(orden.originalIds.map(id =>
                    axios.patch(`${API_URL}/ecommerce/pedidos/${id}/estado`, { dispatchStatus: nuevoEstado })
                ));
            } else {
                await axios.patch(`${API_URL}/ecommerce/pedidos/${orden.id}/estado`, { dispatchStatus: nuevoEstado });
            }
            onEstadoChange(orden.id, nuevoEstado);
        } catch (err) {
            console.error('Error al actualizar estado:', err);
        }
    };

    return (
        <div className={`${styles.card} p-4 flex flex-col justify-between group`}>
            <div>
                {/* Header del paquete */}
                <div className="flex flex-col sm:flex-row items-start justify-between pb-3.5 border-b border-[#F1F1EB] gap-3">
                    <div className="flex items-start gap-2.5">
                        <div className={`w-7 h-7 rounded-xl ${estadoConfig.bg} border ${estadoConfig.border} flex items-center justify-center shrink-0 mt-0.5`}>
                            <EstadoIcon className={`w-3.5 h-3.5 ${estadoConfig.color}`} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-[11px] font-medium text-neutral-400">
                                    PEDIDO #{orden.isGrouped ? orden.originalIds.join(', #') : orden.id}
                                </span>
                                {orden.isGrouped && (
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]">
                                        ENCOMIENDA
                                    </span>
                                )}
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${isEcommerceNormal
                                    ? 'bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]'
                                    : 'bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]'}`}>
                                    {isEcommerceNormal ? 'ECOMMERCE' : 'MAYORISTA'}
                                </span>
                            </div>
                            <h3 className="text-xs font-bold text-neutral-900 uppercase">{orden.name || 'CLIENTE SIN NOMBRE'}</h3>
                            {orden.cellphone && (
                                <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                    <FiPhone className="w-3.5 h-3.5" /> {orden.cellphone}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto pl-9 sm:pl-0">
                        <p className="text-xs font-bold text-neutral-900">{formatearMoneda(orden.total)}</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{formatearFecha(orden.createdAt)}</p>
                    </div>
                </div>

                {/* Dirección de envío */}
                {orden.address && orden.address.trim() !== '' && (
                    <div className="py-2.5 border-b border-[#F1F1EB] flex items-start gap-2">
                        <FiMapPin className="w-3.5 h-3.5 text-neutral-400 mt-0.5 shrink-0" />
                        <p className="text-[11px] font-medium text-neutral-700 leading-relaxed">
                            {[orden.address, orden.city, orden.province, orden.postalCode].filter(Boolean).join(', ')}
                        </p>
                    </div>
                )}

                {/* Método de envío */}
                {orden.shippingOption && orden.shippingOption.trim() !== '' && (
                    <div className="py-2.5 border-b border-[#F1F1EB] flex items-center gap-2">
                        <FiTruck className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-[11px] font-medium text-neutral-700">{orden.shippingOption}</span>
                        {orden.shippingCost > 0 && (
                            <span className="text-[11px] font-semibold text-neutral-900 ml-auto">
                                ENVÍO: {formatearMoneda(orden.shippingCost)}
                            </span>
                        )}
                    </div>
                )}

                {/* Productos */}
                <div className="py-3 space-y-2">
                    <span className={`${styles.label} flex items-center gap-1.5`}>
                        <FiPackage className="w-3.5 h-3.5" /> CONTENIDO DEL PAQUETE
                    </span>
                    <div className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl p-2.5 space-y-1.5">
                        {items.map((item, i) => (
                            <div key={i} className="flex flex-wrap items-center justify-between text-[11px] py-1 border-b border-[#F1F1EB] last:border-0 gap-x-3 gap-y-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">{item.quantity}x</span>
                                    <span className="text-xs font-medium text-neutral-700">{item.title}</span>
                                    {item.color && <span className="text-[11px] text-neutral-400">• {item.color}</span>}
                                    {(item.storage || item.almacenamiento) && (
                                        <span className="text-[11px] text-neutral-400">{item.storage || item.almacenamiento}</span>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-neutral-700">{formatearMoneda(item.unit_price)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selector de estado */}
            <div className="pt-3 border-t border-[#F1F1EB]">
                <span className={`${styles.label} mb-2`}>ESTADO DE DESPACHO</span>
                <div className="grid grid-cols-3 bg-[#F2F2EE] p-1 rounded-xl text-[11px] font-medium text-neutral-600 border border-[#E9E9E4] gap-1">
                    {Object.entries(DISPATCH_ESTADOS).map(([key, cfg], index) => {
                        const Icon = cfg.icon;
                        const isActive = orden.dispatchStatus === key;
                        return (
                            <button
                                key={index}
                                onClick={() => handleEstadoChange(key)}
                                className={`flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-2xl transition-colors
                                    ${isActive
                                        ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                                        : 'hover:text-neutral-900'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{cfg.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// COMPONENTE PRINCIPAL
const HistorialVentasOnline = () => {
    const [tabActiva, setTabActiva] = useState('paquetes');
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [filtroBusqueda, setFiltroBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    const agruparPedidosPorCliente = (pedidos) => {
        const grupos = {};
        pedidos.forEach(pedido => {
            const safePhone = pedido.cellphone?.trim() || 'NO_CEL';
            const safeName = pedido.name?.trim() || 'SIN_CLIENTE';
            const safeAddress = pedido.address?.trim() || 'SIN_DIRECCION';
            const key = `${safePhone}_${safeName}_${safeAddress}_${pedido.dispatchStatus}`;

            if (!grupos[key]) {
                grupos[key] = {
                    ...pedido,
                    originalIds: [pedido.id],
                    items: Array.isArray(pedido.items) ? [...pedido.items] : [],
                    total: parseFloat(pedido.total || 0),
                    shippingCost: parseFloat(pedido.shippingCost || 0)
                };
            } else {
                grupos[key].originalIds.push(pedido.id);
                if (Array.isArray(pedido.items)) {
                    grupos[key].items = [...grupos[key].items, ...pedido.items];
                }
                grupos[key].total += parseFloat(pedido.total || 0);
                grupos[key].shippingCost += parseFloat(pedido.shippingCost || 0);
            }
        });

        return Object.values(grupos).map(g => {
            if (g.originalIds.length > 1) {
                g.isGrouped = true;
            }
            return g;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const obtenerPedidos = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_URL}/ecommerce/pedidos`);
            const pedidosArray = Array.isArray(data) ? data : [];
            setPedidos(agruparPedidosPorCliente(pedidosArray));
        } catch (err) {
            setError(`ERROR_SINC: ${err.message}`);
            setPedidos([]);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { obtenerPedidos(); }, [obtenerPedidos]);

    const handleEstadoCambio = (id, nuevoEstado) => {
        setPedidos(prev => prev.map(p => p.id === id ? { ...p, dispatchStatus: nuevoEstado } : p));
    };

    const pedidosFiltrados = useMemo(() => {
        const busq = filtroBusqueda.toLowerCase();
        return pedidos.filter(p => {
            const matchBusq = !busq ||
                (p.name || '').toLowerCase().includes(busq) ||
                (p.cellphone || '').includes(busq) ||
                String(p.id).includes(busq) ||
                (p.address || '').toLowerCase().includes(busq);
            const matchEstado = filtroEstado === 'TODOS' || p.dispatchStatus === filtroEstado;
            return matchBusq && matchEstado;
        });
    }, [pedidos, filtroBusqueda, filtroEstado]);

    // Stats para ranking
    const productosMasVendidos = useMemo(() => {
        const mapa = {};
        pedidos.forEach(pedido => {
            const items = Array.isArray(pedido.items) ? pedido.items : [];
            items.forEach(item => {
                const key = item.title;
                if (!mapa[key]) mapa[key] = { nombre: key, cantidad: 0, total: 0 };
                mapa[key].cantidad += Number(item.quantity) || 0;
                mapa[key].total += (Number(item.unit_price) || 0) * (Number(item.quantity) || 0);
            });
        });
        return Object.values(mapa).sort((a, b) => b.cantidad - a.cantidad).slice(0, 10);
    }, [pedidos]);

    const stats = useMemo(() => ({
        total: pedidos.reduce((acc, p) => acc + Number(p.total || 0), 0),
        pendientes: pedidos.filter(p => p.dispatchStatus === 'PENDIENTE').length,
        enCamino: pedidos.filter(p => p.dispatchStatus === 'EN_CAMINO').length,
        recibidos: pedidos.filter(p => p.dispatchStatus === 'RECIBIDO').length,
    }), [pedidos]);

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#222222] font-['Inter',sans-serif]">
            {/* HEADER */}
            <header className="p-6 pb-2 border-b border-[#EAEAE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                            CENTRO DE DESPACHO ECOMMERCE
                        </span>
                        <h1 className={styles.heading}>
                            VENTAS ONLINE
                        </h1>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={obtenerPedidos}
                            className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                        >
                            <FiRefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-6 mt-6 border-b border-[#EBEBE6] text-xs">
                    {[
                        { id: 'paquetes', label: 'PAQUETES', icon: FiPackage },
                        { id: 'ranking', label: 'RANKING', icon: FiTrendingUp },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTabActiva(id)}
                            className={`inline-flex items-center gap-1.5 pb-3 transition-colors ${
                                tabActiva === id
                                    ? 'text-neutral-900 font-semibold border-b-2 border-neutral-900'
                                    : 'text-neutral-400 hover:text-neutral-700'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" /> {label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="p-6 space-y-4">
                {/* STATS RÁPIDAS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {[
                        { label: 'TOTAL FACTURADO', value: formatearMoneda(stats.total), badge: 'bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]' },
                        { label: 'PENDIENTES', value: stats.pendientes, badge: 'bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]' },
                        { label: 'EN CAMINO', value: stats.enCamino, badge: 'bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]' },
                        { label: 'RECIBIDOS', value: stats.recibidos, badge: 'bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]' },
                    ].map(({ label, value, badge }) => (
                        <div key={label} className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group">
                            <span className={styles.label}>{label}</span>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-base font-semibold text-neutral-900">{value}</p>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${badge}`}>
                                    KPI
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CONTENIDO POR TAB */}
                {cargando ? (
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center py-20">
                        <FiRefreshCw className="w-4 h-4 animate-spin text-neutral-900 mb-2" />
                        <span className="text-xs font-medium text-neutral-700">CARGANDO VENTAS...</span>
                    </div>
                ) : error ? (
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center py-16">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3] inline-flex items-center gap-1.5 mb-2">
                            <FiAlertCircle className="w-3.5 h-3.5" /> {error}
                        </span>
                        <p className="text-[11px] text-neutral-400">Verificá que el backend esté activo.</p>
                    </div>
                ) : tabActiva === 'paquetes' ? (
                    <div className="space-y-4">
                        {/* Barra superior de sección */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-neutral-900">Listado de Paquetes</h2>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="relative">
                                    <FiSearch className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente, teléfono, ID..."
                                        className="bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl pl-8 pr-7 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                        value={filtroBusqueda}
                                        onChange={e => setFiltroBusqueda(e.target.value)}
                                    />
                                </div>
                                <div className="inline-flex bg-[#F2F2EE] p-1 rounded-xl text-[11px] font-medium text-neutral-600 border border-[#E9E9E4]">
                                    {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'RECIBIDO'].map(est => (
                                        <button
                                            key={est}
                                            onClick={() => setFiltroEstado(est)}
                                            className={filtroEstado === est ? styles.buttonActive : styles.buttonInactive}
                                        >
                                            {est.replace('_', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grid de paquetes */}
                        {pedidosFiltrados.length === 0 ? (
                            <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs flex flex-col items-center justify-center py-16">
                                <FiShoppingBag className="w-4 h-4 mb-2 text-neutral-400" />
                                <p className="text-[11px] text-neutral-400">SIN PEDIDOS CON ESTOS FILTROS</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {pedidosFiltrados.map(orden => (
                                    <PaqueteCard
                                        key={orden.id}
                                        orden={orden}
                                        onEstadoChange={handleEstadoCambio}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* RANKING TAB */
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                        <div className="pb-4 mb-4 border-b border-[#F1F1EB] flex items-center justify-between">
                            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <FiTrendingUp className="w-3.5 h-3.5 text-neutral-700" /> TOP PRODUCTOS VENDIDOS
                            </h2>
                        </div>
                        <div className="space-y-2.5">
                            {productosMasVendidos.map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-3.5 bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl group">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[11px] font-semibold text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <h3 className="text-xs font-bold text-neutral-900">{p.nombre}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-medium text-neutral-700">{p.cantidad} UDS.</p>
                                        <p className="text-[11px] text-neutral-400">{formatearMoneda(p.total)}</p>
                                    </div>
                                </div>
                            ))}
                            {productosMasVendidos.length === 0 && (
                                <p className="text-center text-[11px] text-neutral-400 py-10">SIN DATOS DE PRODUCTOS</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistorialVentasOnline;
