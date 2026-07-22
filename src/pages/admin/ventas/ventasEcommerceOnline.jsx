import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    FiGlobe, FiSearch, FiPackage, FiTruck, FiCheckCircle,
    FiClock, FiUser, FiMapPin, FiShoppingBag, FiTrendingUp,
    FiList, FiRefreshCw, FiAlertCircle, FiPhone, FiTag, FiHash
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const styles = {
    card: "bg-white border border-gray-200 rounded-2xl shadow-sm",
    heading: "font-black uppercase tracking-tighter leading-none text-black",
    tech: "font-bold tracking-widest uppercase",
    buttonActive: "bg-black text-white font-bold uppercase text-[10px] tracking-widest rounded-xl px-6 py-2.5 transition-all",
    buttonInactive: "text-gray-500 hover:text-black hover:bg-gray-50 bg-white border border-transparent font-bold uppercase text-[10px] tracking-widest rounded-xl px-6 py-2.5 transition-all",
    label: "text-[10px] font-bold text-gray-500 uppercase tracking-widest",
};

const DISPATCH_ESTADOS = {
    PENDIENTE: { label: 'PENDIENTE', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', icon: FiClock },
    EN_CAMINO: { label: 'EN CAMINO', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: FiTruck },
    RECIBIDO: { label: 'RECIBIDO', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: FiCheckCircle },
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
        <div className={`${styles.card} p-0 overflow-hidden transition-all hover:border-black`}>
            {/* Header del paquete */}
            <div className="flex flex-col md:flex-row items-start justify-between p-5 border-b border-gray-100 gap-4 md:gap-2 bg-gray-50">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${estadoConfig.bg} border ${estadoConfig.border} mt-0.5`}>
                        <EstadoIcon size={16} className={estadoConfig.color} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`${styles.tech} text-[9px] text-black font-bold`}>
                                PEDIDO #{orden.isGrouped ? orden.originalIds.join(', #') : orden.id}
                            </span>
                            {orden.isGrouped && (
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border text-black bg-gray-200 border-gray-300`}>
                                    ENCOMIENDA
                                </span>
                            )}
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md border ${isEcommerceNormal
                                ? 'text-gray-600 bg-gray-100 border-gray-200'
                                : 'text-gray-700 bg-gray-200 border-gray-300'}`}>
                                {isEcommerceNormal ? 'ECOMMERCE' : 'MAYORISTA'}
                            </span>
                        </div>
                        <p className={`${styles.tech} text-xs font-black text-black uppercase`}>{orden.name || 'CLIENTE SIN NOMBRE'}</p>
                        {orden.cellphone && (
                            <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5 font-bold">
                                <FiPhone size={10} /> {orden.cellphone}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-left md:text-right w-full md:w-auto pl-12 md:pl-0">
                    <p className={`${styles.tech} text-lg font-black text-black`}>{formatearMoneda(orden.total)}</p>
                    <p className="text-[9px] text-gray-500 font-bold mt-1 uppercase tracking-widest">{formatearFecha(orden.createdAt)}</p>
                </div>
            </div>

            {/* Dirección de envío */}
            {orden.address && orden.address.trim() !== '' && (
                <div className="px-5 py-3 bg-white border-b border-gray-100 flex items-start gap-3">
                    <FiMapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-gray-600 uppercase font-medium leading-relaxed">
                        {[orden.address, orden.city, orden.province, orden.postalCode].filter(Boolean).join(', ')}
                    </p>
                </div>
            )}

            {/* Método de envío */}
            {orden.shippingOption && orden.shippingOption.trim() !== '' && (
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
                    <FiTruck size={14} className="text-gray-400" />
                    <span className="text-[10px] text-gray-600 font-bold uppercase">{orden.shippingOption}</span>
                    {orden.shippingCost > 0 && (
                        <span className="text-[10px] text-black font-black ml-auto">
                            ENVÍO: {formatearMoneda(orden.shippingCost)}
                        </span>
                    )}
                </div>
            )}

            {/* Productos */}
            <div className="p-5 space-y-3 bg-white">
                <p className={`${styles.label} mb-3 flex items-center gap-2`}>
                    <FiPackage size={14} /> CONTENIDO DEL PAQUETE
                </p>
                {items.map((item, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between text-[11px] py-2 border-b border-gray-100 last:border-0 gap-x-4 gap-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-black font-black bg-gray-100 px-2 py-1 rounded-md">{item.quantity}x</span>
                            <span className="text-black font-bold uppercase">{item.title}</span>
                            {item.color && <span className="text-gray-500 font-bold">• {item.color}</span>}
                            {(item.storage || item.almacenamiento) && (
                                <span className="text-gray-500 font-bold">{item.storage || item.almacenamiento}</span>
                            )}
                        </div>
                        <span className="text-black font-black">{formatearMoneda(item.unit_price)}</span>
                    </div>
                ))}
            </div>

            {/* Selector de estado */}
            <div className="px-5 pb-5 bg-white">
                <p className={`${styles.label} mb-3`}>ESTADO DE DESPACHO</p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(DISPATCH_ESTADOS).map(([key, cfg], index) => {
                        const Icon = cfg.icon;
                        const isActive = orden.dispatchStatus === key;
                        return (
                            <button
                                key={index}
                                onClick={() => handleEstadoChange(key)}
                                className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black tracking-widest border transition-all uppercase
                                    ${isActive
                                        ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm scale-[1.02]`
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                                    }`}
                            >
                                <Icon size={14} /> <span className="hidden sm:inline">{cfg.label}</span>
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
        <div className="min-h-screen bg-white text-black p-4 md:p-8 lg:p-12 space-y-10" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10 pb-8 border-b border-gray-200">
                <div>
                    <h1 className={`${styles.heading} text-3xl md:text-5xl`}>
                        VENTAS ONLINE
                    </h1>
                    <p className={`${styles.tech} text-[10px] font-bold text-gray-500 mt-3 tracking-widest uppercase`}>
                        CENTRO DE DESPACHO ECOMMERCE
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={obtenerPedidos}
                        className="p-3 bg-gray-50 border border-gray-200 hover:border-black rounded-xl transition-all text-gray-500 hover:text-black"
                    >
                        <FiRefreshCw size={16} className={cargando ? 'animate-spin text-black' : ''} />
                    </button>
                    <div className="bg-gray-50 border border-gray-200 p-1 rounded-xl flex gap-1">
                        {[
                            { id: 'paquetes', label: 'PAQUETES', icon: FiPackage },
                            { id: 'ranking', label: 'RANKING', icon: FiTrendingUp },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTabActiva(id)}
                                className={tabActiva === id ? styles.buttonActive : styles.buttonInactive}
                            >
                                <Icon size={14} className="inline mr-2" /> {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* STATS RÁPIDAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'TOTAL FACTURADO', value: formatearMoneda(stats.total), color: 'text-black' },
                    { label: 'PENDIENTES', value: stats.pendientes, color: 'text-gray-500' },
                    { label: 'EN CAMINO', value: stats.enCamino, color: 'text-blue-600' },
                    { label: 'RECIBIDOS', value: stats.recibidos, color: 'text-green-600' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`${styles.card} bg-gray-50 !border-gray-200 p-6 shadow-none`}>
                        <p className={`${styles.label} mb-2`}>{label}</p>
                        <p className={`${styles.tech} text-2xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* CONTENIDO POR TAB */}
            {cargando ? (
                <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <FiRefreshCw size={48} className="animate-spin text-black mb-4" />
                    <span className={`${styles.tech} text-[11px] font-bold`}>CARGANDO VENTAS...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 text-red-500">
                    <FiAlertCircle size={48} className="mb-4" />
                    <span className={`${styles.tech} text-[11px] font-bold uppercase`}>{error}</span>
                    <p className="text-xs font-bold text-gray-500 mt-2 uppercase">Verificá que el backend esté activo.</p>
                </div>
            ) : tabActiva === 'paquetes' ? (
                <div className="space-y-8">
                    {/* Filtros */}
                    <div className="flex flex-col lg:flex-row gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="BUSCAR POR CLIENTE, TELÉFONO, ID..."
                                className={`w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm text-black focus:border-black outline-none transition-all font-bold uppercase placeholder:text-gray-400`}
                                value={filtroBusqueda}
                                onChange={e => setFiltroBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'RECIBIDO'].map(est => (
                                <button
                                    key={est}
                                    onClick={() => setFiltroEstado(est)}
                                    className={`px-5 py-3 text-[10px] rounded-xl font-black border transition-all uppercase tracking-widest ${filtroEstado === est ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
                                >
                                    {est.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid de paquetes */}
                    {pedidosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                            <FiShoppingBag size={48} className="mb-4 text-gray-300" />
                            <p className={`${styles.tech} text-[11px] font-bold text-gray-500 uppercase`}>SIN PEDIDOS CON ESTOS FILTROS</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <div className={`${styles.card} p-8 lg:p-10 max-w-4xl mx-auto`}>
                    <h3 className={`${styles.heading} text-xl mb-8 flex items-center gap-3`}>
                        <FiTrendingUp className="text-black" /> TOP PRODUCTOS VENDIDOS
                    </h3>
                    <div className="space-y-4">
                        {productosMasVendidos.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-black transition-all group">
                                <div className="flex items-center gap-6">
                                    <span className={`${styles.tech} text-2xl font-black text-gray-300 group-hover:text-black transition-colors`}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <p className="text-sm font-black uppercase tracking-tight text-black">{p.nombre}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`${styles.tech} text-sm font-black text-black`}>{p.cantidad} UDS.</p>
                                    <p className={`${styles.tech} text-[10px] font-bold text-gray-500 mt-1`}>{formatearMoneda(p.total)}</p>
                                </div>
                            </div>
                        ))}
                        {productosMasVendidos.length === 0 && (
                            <p className="text-center font-bold text-gray-500 py-12 uppercase text-sm tracking-widest">SIN DATOS DE PRODUCTOS</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialVentasOnline;