import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    FiGlobe, FiSearch, FiPackage, FiTruck, FiCheckCircle,
    FiClock, FiUser, FiMapPin, FiShoppingBag, FiTrendingUp,
    FiList, FiRefreshCw, FiAlertCircle, FiPhone, FiTag, FiHash
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL;

const styles = {
    glassCard: "bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 shadow-2xl",
    heading: "font-['Inter'] font-[900] uppercase tracking-tighter leading-none",
    tech: "font-['Inter'] uppercase tracking-widest",
    buttonActive: "bg-white text-black font-['Inter'] font-[900] uppercase text-[10px] tracking-widest",
    buttonInactive: "text-zinc-500 hover:text-white font-['Inter'] font-[900] uppercase text-[10px] tracking-widest",
    label: "text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]",
};

const DISPATCH_ESTADOS = {
    PENDIENTE: { label: 'PENDIENTE', color: 'text-zinc-400', bg: 'bg-zinc-900', border: 'border-zinc-700', icon: FiClock },
    EN_CAMINO: { label: 'EN CAMINO', color: 'text-zinc-300', bg: 'bg-zinc-800', border: 'border-zinc-500', icon: FiTruck },
    RECIBIDO: { label: 'RECIBIDO', color: 'text-white', bg: 'bg-white/10', border: 'border-white/30', icon: FiCheckCircle },
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
        <div className={`${styles.glassCard} p-0 overflow-hidden transition-all hover:border-white font-['Inter']`}>
            {/* Header del paquete */}
            <div className="flex flex-col md:flex-row items-start justify-between p-5 border-b border-zinc-800/60 gap-4 md:gap-2">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-none ${estadoConfig.bg} border ${estadoConfig.border} mt-0.5`}>
                        <EstadoIcon size={16} className={estadoConfig.color} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`${styles.tech} text-[9px] text-white font-bold`}>
                                PEDIDO #{orden.isGrouped ? orden.originalIds.join(', #') : orden.id}
                            </span>
                            {orden.isGrouped && (
                                <span className={`text-[8px] font-bold px-2 py-0.5 rounded-none border text-white bg-white/10 border-white/30`}>
                                    ENCOMIENDA
                                </span>
                            )}
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-none border ${isEcommerceNormal
                                ? 'text-zinc-300 bg-zinc-800 border-zinc-600'
                                : 'text-zinc-500 bg-zinc-900 border-zinc-700'}`}>
                                {isEcommerceNormal ? 'ECOMMERCE' : 'MAYORISTA'}
                            </span>
                        </div>
                        <p className={`${styles.tech} text-xs font-black text-white uppercase`}>{orden.name || 'CLIENTE SIN NOMBRE'}</p>
                        {orden.cellphone && (
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5 font-bold">
                                <FiPhone size={10} /> {orden.cellphone}
                            </p>
                        )}
                    </div>
                </div>
                <div className="text-left md:text-right w-full md:w-auto pl-12 md:pl-0">
                    <p className={`${styles.tech} text-lg font-black text-white`}>{formatearMoneda(orden.total)}</p>
                    <p className="text-[9px] text-zinc-500 font-bold mt-1">{formatearFecha(orden.createdAt)}</p>
                </div>
            </div>

            {/* Dirección de envío */}
            {orden.address && orden.address.trim() !== '' && (
                <div className="px-5 py-3 bg-black/30 border-b border-zinc-800/60 flex items-start gap-2">
                    <FiMapPin size={12} className="text-white mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-zinc-400 uppercase font-medium leading-relaxed">
                        {[orden.address, orden.city, orden.province, orden.postalCode].filter(Boolean).join(', ')}
                    </p>
                </div>
            )}

            {/* Método de envío */}
            {orden.shippingOption && orden.shippingOption.trim() !== '' && (
                <div className="px-5 py-2 border-b border-zinc-800/60 flex items-center gap-2">
                    <FiTruck size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-400 font-bold">{orden.shippingOption}</span>
                    {orden.shippingCost > 0 && (
                        <span className="text-[10px] text-zinc-500 font-bold ml-auto">
                            Envío: {formatearMoneda(orden.shippingCost)}
                        </span>
                    )}
                </div>
            )}

            {/* Productos */}
            <div className="p-5 space-y-2">
                <p className={`${styles.label} mb-3 flex items-center gap-2`}>
                    <FiPackage size={11} /> CONTENIDO DEL PAQUETE
                </p>
                {items.map((item, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between text-[11px] py-1.5 border-b border-zinc-900/80 last:border-0 gap-x-4 gap-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold font-['Inter']">{item.quantity}x</span>
                            <span className="text-white font-medium uppercase">{item.title}</span>
                            {item.color && <span className="text-zinc-500 font-bold">• {item.color}</span>}
                            {(item.storage || item.almacenamiento) && (
                                <span className="text-zinc-500 font-bold">{item.storage || item.almacenamiento}</span>
                            )}
                        </div>
                        <span className="text-zinc-400 font-bold font-['Inter']">{formatearMoneda(item.unit_price)}</span>
                    </div>
                ))}
            </div>

            {/* Selector de estado */}
            <div className="px-5 pb-5">
                <p className={`${styles.label} mb-2`}>ESTADO DE DESPACHO</p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(DISPATCH_ESTADOS).map(([key, cfg], index) => {
                        const Icon = cfg.icon;
                        const isActive = orden.dispatchStatus === key;
                        return (
                            <button
                                key={index}
                                onClick={() => handleEstadoChange(key)}
                                className={`flex items-center justify-center gap-1.5 py-2.5 text-[8px] font-black tracking-widest border transition-all ${styles.tech}
                                    ${isActive
                                        ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                                        : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-white hover:text-white'
                                    }`}
                            >
                                <Icon size={11} /> {cfg.label}
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
        <div className="min-h-screen bg-black text-white p-4 md:p-10 space-y-10 font-['Inter'] selection:bg-white selection:text-black">
            {/* HEADER */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <h1 className={`${styles.heading} text-3xl md:text-5xl`}>
                        VENTAS <span className="text-white">ONLINE</span>
                    </h1>
                    <p className={`${styles.tech} text-[10px] font-bold text-zinc-600 mt-4 tracking-[0.4em]`}>
                        CENTRO DE DESPACHO ECOMMERCE // FEDECELL LABS
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={obtenerPedidos}
                        className="p-3 bg-zinc-900 border border-zinc-800 hover:border-white transition-all text-zinc-500 hover:text-white"
                    >
                        <FiRefreshCw size={16} className={cargando ? 'animate-spin text-white' : ''} />
                    </button>
                    <div className="bg-zinc-900/40 border border-zinc-800 p-1 flex gap-1">
                        {[
                            { id: 'paquetes', label: 'PAQUETES', icon: FiPackage },
                            { id: 'ranking', label: 'RANKING', icon: FiTrendingUp },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setTabActiva(id)}
                                className={`px-6 py-2.5 text-[10px] ${styles.tech} font-black transition-all flex items-center gap-2 ${tabActiva === id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                            >
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* STATS RÁPIDAS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'TOTAL FACTURADO', value: formatearMoneda(stats.total), color: 'text-white' },
                    { label: 'PENDIENTES', value: stats.pendientes, color: 'text-zinc-400' },
                    { label: 'EN CAMINO', value: stats.enCamino, color: 'text-zinc-300' },
                    { label: 'RECIBIDOS', value: stats.recibidos, color: 'text-white' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`${styles.glassCard} p-5`}>
                        <p className={`${styles.label} mb-2`}>{label}</p>
                        <p className={`${styles.tech} text-2xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* CONTENIDO POR TAB */}
            {cargando ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-700">
                    <FiRefreshCw size={48} className="animate-spin text-white mb-4" />
                    <span className={`${styles.tech} text-[11px] font-bold`}>CARGANDO VENTAS...</span>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                    <FiAlertCircle size={48} className="mb-4 text-white" />
                    <span className={`${styles.tech} text-[11px] font-bold text-white`}>{error}</span>
                    <p className="text-xs font-bold text-zinc-600 mt-2 uppercase">Verificá que el backend esté activo.</p>
                </div>
            ) : tabActiva === 'paquetes' ? (
                <div className="space-y-6">
                    {/* Filtros */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-white" size={16} />
                            <input
                                type="text"
                                placeholder="BUSCAR POR CLIENTE, TEL, ID..."
                                className={`${styles.tech} font-bold w-full bg-black border border-zinc-800 py-4 pl-14 pr-6 text-xs text-white focus:border-white outline-none transition-all`}
                                value={filtroBusqueda}
                                onChange={e => setFiltroBusqueda(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'RECIBIDO'].map(est => (
                                <button
                                    key={est}
                                    onClick={() => setFiltroEstado(est)}
                                    className={`px-4 py-2 text-[9px] ${styles.tech} font-black border transition-all ${filtroEstado === est ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-white hover:text-white'}`}
                                >
                                    {est.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid de paquetes */}
                    {pedidosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 opacity-20">
                            <FiShoppingBag size={64} className="mb-4 text-white" />
                            <p className={`${styles.tech} text-[11px] font-bold`}>SIN PEDIDOS CON ESTOS FILTROS</p>
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
                <div className={`${styles.glassCard} p-8`}>
                    <h3 className={`${styles.heading} text-xl mb-8 text-white flex items-center gap-3`}>
                        <FiTrendingUp /> TOP PRODUCTOS VENDIDOS
                    </h3>
                    <div className="space-y-3">
                        {productosMasVendidos.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/60 border border-zinc-800 hover:border-white/30 transition-all group">
                                <div className="flex items-center gap-4">
                                    <span className={`${styles.tech} text-2xl font-black text-zinc-700 group-hover:text-white transition-colors`}>
                                        {String(i + 1).padStart(2, '0')}
                                    </span>
                                    <p className="text-sm font-bold uppercase tracking-tight font-['Inter']">{p.nombre}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`${styles.tech} text-sm font-black text-white`}>{p.cantidad} uds.</p>
                                    <p className={`${styles.tech} text-[10px] font-bold text-zinc-500 mt-1`}>{formatearMoneda(p.total)}</p>
                                </div>
                            </div>
                        ))}
                        {productosMasVendidos.length === 0 && (
                            <p className="text-center font-bold text-zinc-600 py-12 uppercase font-['Inter'] text-sm tracking-widest">SIN DATOS DE PRODUCTOS</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorialVentasOnline;