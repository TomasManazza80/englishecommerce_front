import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    FiTruck, FiPackage, FiCheckCircle, FiClock, FiSearch,
    FiExternalLink, FiMapPin, FiPlus, FiList,
    FiDownloadCloud, FiShoppingBag, FiFilter, FiLoader,
    FiRefreshCw, FiPhone, FiUser, FiGlobe, FiHash
} from 'react-icons/fi';

// --- CONFIGURACIÓN ---
const API_URL = import.meta.env.VITE_API_URL;

// --- ESTILOS FEDECELL (BLANCO Y NEGRO / INTER) ---
const STYLES = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] text-[11px] font-bold text-white uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['Inter'] tracking-widest uppercase",
    glass: "bg-zinc-900/40 backdrop-blur-md border border-zinc-800",
    buttonAction: "bg-white text-black font-['Inter'] font-black text-[11px] uppercase tracking-widest transition-all hover:bg-zinc-200",
    input: "w-full bg-black border border-zinc-800 py-4 px-6 text-sm text-white font-['Inter'] focus:border-white outline-none transition-all"
};

const ESTADOS = {
    PENDIENTE: { label: 'PENDIENTE', color: 'text-zinc-500', bg: 'bg-zinc-900', border: 'border-zinc-800', icon: FiClock },
    EN_CAMINO: { label: 'EN CAMINO', color: 'text-zinc-300', bg: 'bg-zinc-800', border: 'border-zinc-600', icon: FiTruck },
    RECIBIDO: { label: 'RECIBIDO', color: 'text-white', bg: 'bg-white/10', border: 'border-white/30', icon: FiCheckCircle },
};

const formatMoneda = (valor) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 })
        .format(parseFloat(valor || 0)).replace('ARS', '$');

// Mini tarjeta de paquete para el panel lateral SYNC
const MiniPaqueteCard = ({ orden, onSelect, onEstadoChange }) => {
    const estadoConfig = ESTADOS[orden.dispatchStatus] || ESTADOS.PENDIENTE;
    const EstadoIcon = estadoConfig.icon;
    const items = Array.isArray(orden.items) ? orden.items : [];
    const isMayorista = items[0]?.origenDeVenta === 'Revendedor';

    const handleEstado = async (e, nuevoEstado) => {
        e.stopPropagation();
        try {
            if (orden.originalIds && orden.originalIds.length > 0) {
                await Promise.all(orden.originalIds.map(id =>
                    axios.patch(`${API_URL}/ecommerce/pedidos/${id}/estado`, { dispatchStatus: nuevoEstado })
                ));
            } else {
                await axios.patch(`${API_URL}/ecommerce/pedidos/${orden.id}/estado`, { dispatchStatus: nuevoEstado });
            }
            onEstadoChange(orden.id, nuevoEstado);
        } catch (err) { console.error('Error actualizando estado:', err); }
    };

    return (
        <div
            onClick={() => onSelect(orden)}
            className="bg-black border border-zinc-800 hover:border-white cursor-pointer transition-all group active:scale-[0.98] rounded-none font-['Inter']"
        >
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-zinc-900">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`${STYLES.tech} text-[9px] text-white font-bold`}>
                            #{orden.isGrouped ? orden.originalIds.join(', #') : orden.id}
                        </span>
                        {orden.isGrouped && (
                            <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-none border text-white bg-white/10 border-white/30`}>
                                ENCOMIENDA
                            </span>
                        )}
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-none border ${isMayorista
                            ? 'text-white bg-white/10 border-white/30'
                            : 'text-zinc-400 bg-zinc-900 border-zinc-700'
                            }`}>
                            {isMayorista ? 'MAYOR' : 'ECOM'}
                        </span>
                        <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-none border text-zinc-300 bg-white/5 border-white/10`}>
                            {orden.shippingOption?.toUpperCase() || 'ENVIO'}
                        </span>
                    </div>
                    <p className={`${STYLES.tech} text-[11px] font-black text-white group-hover:text-zinc-300 transition-colors uppercase`}>
                        {orden.name || 'CLIENTE S/N'}
                    </p>
                    {orden.cellphone && (
                        <p className="text-[9px] text-zinc-600 flex items-center gap-1 mt-0.5 font-bold">
                            <FiPhone size={9} /> {orden.cellphone}
                        </p>
                    )}
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <p className={`${STYLES.tech} text-sm font-black text-white`}>{formatMoneda(orden.total)}</p>
                    <div className={`flex items-center gap-1 mt-1 ${estadoConfig.color}`}>
                        <EstadoIcon size={9} />
                        <span className="text-[8px] font-bold uppercase">{estadoConfig.label}</span>
                    </div>
                </div>
            </div>

            {/* Dirección */}
            {orden.address && (
                <div className="px-4 py-2 flex items-center gap-1.5">
                    <FiMapPin size={10} className="text-white flex-shrink-0" />
                    <p className="text-[9px] text-zinc-500 font-bold uppercase truncate">
                        {[orden.address, orden.city, orden.province].filter(Boolean).join(', ')}
                    </p>
                </div>
            )}

            {/* Productos resumidos */}
            <div className="px-4 pb-3">
                <p className="text-[9px] text-zinc-600 font-bold mb-1 leading-relaxed">
                    {items.length > 0
                        ? items.map(i => {
                            let dt = [];
                            if (i.color) dt.push(i.color);
                            if (i.storage || i.almacenamiento) dt.push(i.storage || i.almacenamiento);
                            return `${i.quantity}x ${i.title} ${dt.length > 0 ? `[${dt.join(', ')}]` : ''}`;
                        }).join(', ').substring(0, 80) + (items.length > 2 ? '...' : '')
                        : 'Sin productos'}
                </p>
            </div>

            {/* Controles de estado mini */}
            <div className="flex border-t border-zinc-900">
                {Object.entries(ESTADOS).map(([key, cfg]) => {
                    const isActive = orden.dispatchStatus === key;
                    return (
                        <button
                            key={key}
                            onClick={(e) => handleEstado(e, key)}
                            className={`flex-1 py-2 text-[7px] font-black tracking-widest ${STYLES.tech} border-r border-zinc-900 last:border-r-0 transition-all
                                ${isActive ? `${cfg.bg} ${cfg.color}` : 'text-zinc-600 hover:text-white'}`}
                        >
                            {cfg.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// Tarjeta de registro de envío para GESTIÓN_LOGS con toggle de detalle
const ShipmentLogRow = ({ env, cambiarEstado }) => {
    const [expandido, setExpandido] = useState(false);
    const Config = ESTADOS[env.dispatchStatus] || ESTADOS.PENDIENTE;

    return (
        <div className={`${STYLES.glass} relative flex flex-col transition-all border-l-4 ${Config.border} font-['Inter']`}>
            <div className="flex flex-col md:flex-row items-stretch">

                {/* Imagen del producto — solo visible si está expandido */}
                {expandido && (
                    <div className="w-full md:w-64 bg-zinc-900/50 p-4 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-zinc-800 animate-in slide-in-from-left duration-300">
                        {Array.isArray(env.items) && env.items.length > 0 ? (
                            <div className="relative w-32 h-32">
                                {env.items[0].image ? (
                                    <img src={env.items[0].image} alt="product" className="w-full h-full object-cover filter contrast-125 grayscale hover:grayscale-0 transition-all duration-500 shadow-2xl" />
                                ) : (
                                    <div className="w-full h-full bg-black flex items-center justify-center border border-zinc-800">
                                        <FiPackage size={40} className="text-zinc-600" />
                                    </div>
                                )}
                                {env.items.length > 1 && (
                                    <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-1 shadow-lg">
                                        +{env.items.length - 1}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <FiPackage size={48} className="text-zinc-700" />
                        )}
                    </div>
                )}

                {/* Info Principal */}
                <div className="flex-1 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className={`${STYLES.tech} text-[10px] text-white font-black mb-1 block`}>REF: #ORD_{env.id}</span>
                            <h3 className={`${STYLES.tech} text-lg font-black text-white uppercase`}>{env.name || 'CLIENTE_S_N'}</h3>
                        </div>
                        <div className="text-right">
                            <p className={`${STYLES.tech} text-xl font-black text-white`}>{formatMoneda(env.total)}</p>
                            <span className={`${STYLES.tech} text-[9px] text-zinc-500 font-bold`}>{new Date(env.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Contacto_Entrega</p>
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                <FiPhone className="text-white" size={12} /> {env.cellphone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                                <FiMapPin className="text-white" size={12} /> {env.address || 'N/A'}
                            </div>
                        </div>

                        {expandido ? (
                            <div className="space-y-1 animate-in fade-in duration-500">
                                <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Especificaciones_Package</p>
                                <p className="text-[10px] text-zinc-300 font-bold leading-relaxed uppercase">
                                    {Array.isArray(env.items) && env.items.length > 0
                                        ? env.items.map(i => `${i.quantity}x ${i.title} [${i.color || i.almacenamiento || '—'}]`).join(' | ')
                                        : 'Sin especificaciones detalladas'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <span className={`${STYLES.tech} text-[8px] text-zinc-600 italic font-bold`}>Click en VER_DETALLE para ver productos</span>
                            </div>
                        )}
                    </div>

                    {env.tracking && (
                        <div className="bg-white/5 border border-white/10 p-2 flex items-center justify-between">
                            <span className={`${STYLES.tech} text-[9px] text-zinc-400 font-bold`}>TRACKING_ID:</span>
                            <span className={`${STYLES.tech} text-[10px] text-white font-black`}>{env.tracking}</span>
                        </div>
                    )}
                </div>

                {/* Status y Acciones */}
                <div className="w-full md:w-56 p-6 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-zinc-800 bg-white/[0.01]">
                    <div className="space-y-3">
                        <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-2">Power_Management</p>
                        <div className="relative">
                            <select
                                value={env.dispatchStatus}
                                onChange={(e) => cambiarEstado(env.id, e.target.value)}
                                className={`w-full appearance-none cursor-pointer pl-10 pr-4 py-3 text-[10px] ${STYLES.tech} font-black ${Config.bg} ${Config.color} border border-current/20 outline-none hover:scale-[1.02] transition-transform`}
                            >
                                <option value="PENDIENTE" className="bg-black text-white">PENDIENTE</option>
                                <option value="EN_CAMINO" className="bg-black text-white">EN CAMINO</option>
                                <option value="RECIBIDO" className="bg-black text-white">RECIBIDO</option>
                            </select>
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${Config.color}`}>
                                <Config.icon size={16} />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setExpandido(prev => !prev)}
                        className={`w-full py-4 transition-all flex items-center justify-center gap-3 border ${expandido
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-white'
                            }`}
                    >
                        <FiExternalLink size={18} />
                        <span className={`${STYLES.tech} text-[10px] font-black`}>
                            {expandido ? 'OCULTAR_DETALLE' : 'VER_DETALLE'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const EnviosProductos = () => {
    const [tabActiva, setTabActiva] = useState('nuevo');
    const [filtroEstado, setFiltroEstado] = useState('TODOS');

    // Estado para envíos gestionados (desde el backend)
    const [envios, setEnvios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargandoEnvios, setCargandoEnvios] = useState(false);

    // Estado para pedidos del ecommerce (panel SYNC)
    const [pedidosEcommerce, setPedidosEcommerce] = useState([]);
    const [cargandoEcommerce, setCargandoEcommerce] = useState(false);
    const [filtroEcommerce, setFiltroEcommerce] = useState('TODOS');
    const [busquedaEcommerce, setBusquedaEcommerce] = useState('');

    // Pedido actualmente seleccionado (para edición)
    const [pedidoEnEdicion, setPedidoEnEdicion] = useState(null);

    // Estado de nuevo envío manual (formulario)
    const [nuevoEnvio, setNuevoEnvio] = useState({
        cliente: '', destino: '', metodo: '', productosCount: 1, tracking: '', monto: '', descripcion: '', telefono: '', items: []
    });

    const [guardando, setGuardando] = useState(false);

    // --- FETCH ENVÍOS GESTIONADOS (Logs) ---
    const fetchEnvios = useCallback(async () => {
        setCargandoEnvios(true);
        try {
            // Obtenemos todos los pedidos para la pestaña de gestión
            const { data } = await axios.get(`${API_URL}/ecommerce/pedidos`);
            const processedData = (Array.isArray(data) ? data : []).map(p => {
                let items = p.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { items = []; }
                }
                return { ...p, items: Array.isArray(items) ? items : [] };
            });
            setEnvios(processedData);
        } catch (error) {
            console.error("Error cargando envíos gestionados", error);
        } finally {
            setCargandoEnvios(false);
        }
    }, []);

    // --- FETCH PEDIDOS ECOMMERCE (Nuevos/Pendientes) ---
    const agruparPedidosPorCliente = (pedidos) => {
        const grupos = {};
        pedidos.forEach(pedido => {
            const safePhone = pedido.cellphone?.trim() || 'NO_CEL';
            const safeName = pedido.name?.trim() || 'SIN_CLIENTE';
            const safeAddress = pedido.address?.trim() || 'SIN_DIRECCION';
            const key = `${safePhone}_${safeName}_${safeAddress}_${pedido.dispatchStatus}`;

            let items = pedido.items;
            if (typeof items === 'string') {
                try { items = JSON.parse(items); } catch (e) { items = []; }
            }
            if (!Array.isArray(items)) items = [];

            if (!grupos[key]) {
                grupos[key] = {
                    ...pedido,
                    originalIds: [pedido.id],
                    items: [...items],
                    total: parseFloat(pedido.total || 0),
                };
            } else {
                grupos[key].originalIds.push(pedido.id);
                if (items.length > 0) {
                    grupos[key].items = [...grupos[key].items, ...items];
                }
                grupos[key].total += parseFloat(pedido.total || 0);
            }
        });

        return Object.values(grupos).map(g => {
            if (g.originalIds.length > 1) {
                g.isGrouped = true;
            }
            return g;
        });
    };

    const fetchEcommerce = useCallback(async () => {
        setCargandoEcommerce(true);
        try {
            const { data } = await axios.get(`${API_URL}/ecommerce/pedidos?unshipped=true`);
            const pedidosArray = Array.isArray(data) ? data : [];
            setPedidosEcommerce(agruparPedidosPorCliente(pedidosArray));
        } catch (error) {
            console.error("Error cargando ecommerce", error);
        } finally {
            setCargandoEcommerce(false);
        }
    }, []);

    useEffect(() => {
        fetchEcommerce();
        fetchEnvios();
    }, [fetchEcommerce, fetchEnvios]);

    const handleEcommerceEstadoCambio = (id, nuevoEstado) => {
        setPedidosEcommerce(prev => prev.map(p => p.id === id ? { ...p, dispatchStatus: nuevoEstado } : p));
        fetchEnvios(); // Refrescar lista de gestión
    };

    const pedidosSyncFiltrados = useMemo(() => {
        const busq = busquedaEcommerce.toLowerCase();
        return pedidosEcommerce.filter(p => {
            if (p.shippingOption && p.shippingOption.toLowerCase().includes('retiro')) return false;

            const matchBusq = !busq ||
                (p.name || '').toLowerCase().includes(busq) ||
                String(p.id).includes(busq) ||
                (p.cellphone || '').includes(busq);

            const matchEstado = filtroEcommerce === 'TODOS' || p.dispatchStatus === filtroEcommerce;
            return matchBusq && matchEstado;
        });
    }, [pedidosEcommerce, busquedaEcommerce, filtroEcommerce]);

    const seleccionarPedido = (pedido) => {
        setPedidoEnEdicion(pedido);
        const items = Array.isArray(pedido.items) ? pedido.items : [];
        const descDetallada = items.map(p => {
            let details = [];
            if (p.color) details.push(`Color: ${p.color}`);
            if (p.storage || p.almacenamiento) details.push(`Cap: ${p.storage || p.almacenamiento}`);
            return `${p.quantity}x ${p.title} ${details.length > 0 ? `(${details.join(', ')})` : ''}`;
        }).join(" | ") || "Sin descripción";

        setNuevoEnvio({
            cliente: pedido.name || '',
            destino: [pedido.address, pedido.city, pedido.province, pedido.postalCode].filter(Boolean).join(', '),
            metodo: pedido.shippingOption || 'ECOMMERCE_ONLINE',
            productosCount: items.reduce((acc, p) => acc + (Number(p.quantity) || 1), 0),
            monto: pedido.total || '',
            descripcion: descDetallada,
            telefono: pedido.cellphone || '',
            tracking: pedido.tracking || '',
            items: items
        });
    };

    const cambiarEstado = async (id, nuevoEstado) => {
        try {
            await axios.patch(`${API_URL}/ecommerce/pedidos/${id}/estado`, { dispatchStatus: nuevoEstado });
            setEnvios(prev => prev.map(envio => envio.id === id ? { ...envio, dispatchStatus: nuevoEstado } : envio));
        } catch (err) {
            console.error('Error actualizando estado:', err);
        }
    };

    const autorizarDespacho = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            if (pedidoEnEdicion) {
                // Si viene de un pedido existente, actualizamos sus datos
                await axios.patch(`${API_URL}/ecommerce/pedidos/${pedidoEnEdicion.id}/estado`, {
                    name: nuevoEnvio.cliente,
                    address: nuevoEnvio.destino,
                    cellphone: nuevoEnvio.telefono,
                    tracking: nuevoEnvio.tracking,
                    total: parseFloat(nuevoEnvio.monto),
                    dispatchStatus: 'EN_CAMINO' // Al autorizar pasa a EN CAMINO
                });
            } else {
                // Si es un envío manual nuevo
                await axios.post(`${API_URL}/ecommerce/pedidos`, {
                    name: nuevoEnvio.cliente,
                    address: nuevoEnvio.destino,
                    cellphone: nuevoEnvio.telefono,
                    shippingOption: nuevoEnvio.metodo,
                    shippingCost: 0,
                    items: [],
                    metadata: { manual: true, descripcion: nuevoEnvio.descripcion }
                });
            }

            await fetchEnvios();
            await fetchEcommerce();
            setTabActiva('listado');
            setNuevoEnvio({ cliente: '', destino: '', metodo: '', productosCount: 1, tracking: '', monto: '', descripcion: '', telefono: '', items: [] });
            setPedidoEnEdicion(null);
        } catch (err) {
            console.error('Error al autorizar despacho:', err);
        } finally {
            setGuardando(false);
        }
    };

    const filtrados = useMemo(() => {
        return envios.filter(e => {
            const coincideBusqueda = (e.name || '').toLowerCase().includes(busqueda.toLowerCase()) || String(e.id).includes(busqueda);
            const coincideEstado = filtroEstado === 'TODOS' || e.dispatchStatus === filtroEstado;
            return coincideBusqueda && coincideEstado;
        });
    }, [envios, busqueda, filtroEstado]);

    return (
        <div className="p-4 md:p-10 bg-black min-h-screen text-white rounded-none space-y-12 font-['Inter'] selection:bg-white selection:text-black">

            {/* HEADER MASTER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                <div>
                    <h1 className={`${STYLES.title} text-3xl md:text-5xl leading-none`}>LOGÍSTICA_<span className="text-white">CENTRAL</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-4 tracking-[0.5em] font-bold`}>CORE_DISPATCH_SYSTEM // FEDECELL_LABS</p>
                </div>

                <div className={`${STYLES.glass} p-1 flex gap-1`}>
                    <button onClick={() => setTabActiva('listado')} className={`px-8 py-3 text-[10px] ${STYLES.tech} font-black transition-all ${tabActiva === 'listado' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                        <FiList className="inline mr-2" /> GESTIÓN_LOGS
                    </button>
                    <button onClick={() => setTabActiva('nuevo')} className={`px-8 py-3 text-[10px] ${STYLES.tech} font-black transition-all ${tabActiva === 'nuevo' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
                        <FiGlobe className="inline mr-2" /> VENTAS_ECOMMERCE
                    </button>
                </div>
            </header>

            {tabActiva === 'listado' ? (
                /* --- VISTA: LISTADO DE ENVÍOS MANUALES --- */
                <div className="animate-in fade-in duration-500 space-y-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
                        <div className="lg:col-span-8 relative">
                            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-white" size={20} />
                            <input type="text" placeholder="BUSCAR_CLIENTE_O_ORDEN_ID..." className={`${STYLES.input} pl-16 py-5 ${STYLES.tech} text-xs`} value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                        </div>
                        <div className="lg:col-span-4 flex gap-2">
                            {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'RECIBIDO'].map((est) => (
                                <button key={est} onClick={() => setFiltroEstado(est)} className={`flex-1 py-3 text-[9px] ${STYLES.tech} font-black border transition-all ${filtroEstado === est ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-white'}`}>
                                    {est}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        {cargandoEnvios ? (
                            <div className="py-20 flex flex-col items-center justify-center text-zinc-700">
                                <FiLoader className="animate-spin text-white mb-4" size={48} />
                                <span className={`${STYLES.tech} text-xs font-bold uppercase`}>Sincronizando_Registros...</span>
                            </div>
                        ) : filtrados.length > 0 ? (
                            filtrados.map(env => (
                                <ShipmentLogRow key={env.id} env={env} cambiarEstado={cambiarEstado} />
                            ))
                        ) : (
                            <div className="py-20 text-center opacity-20">
                                <FiList size={64} className="mx-auto mb-4" />
                                <p className={`${STYLES.tech} text-xs font-bold`}>SISTEMA_SIN_REGISTROS_ACTIVOS</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* --- VISTA: PEDIDOS ONLINE (SYNC + FORMULARIO) --- */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in slide-in-from-bottom-8 duration-700">

                    {/* LADO IZQUIERDO: PANEL SYNC ECOMMERCE */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                            <h3 className={`text-[11px] ${STYLES.tech} font-black text-white flex items-center gap-3`}>
                                <FiDownloadCloud size={18} /> SYNC_ECOMMERCE_PEDIDOS
                            </h3>
                            <button onClick={fetchEcommerce} className="bg-zinc-900 border border-zinc-800 text-[9px] p-2 hover:border-white hover:text-white transition-all">
                                <FiRefreshCw size={13} className={cargandoEcommerce ? 'animate-spin text-white' : 'text-zinc-500'} />
                            </button>
                        </div>

                        {/* Filtro rápido en el panel */}
                        <div className="flex gap-1">
                            {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'RECIBIDO'].map(est => (
                                <button
                                    key={est}
                                    onClick={() => setFiltroEcommerce(est)}
                                    className={`flex-1 py-1.5 text-[7px] ${STYLES.tech} font-black border transition-all ${filtroEcommerce === est ? 'bg-white text-black border-white' : 'text-zinc-500 border-zinc-800 hover:border-zinc-500'}`}
                                >
                                    {est.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* Buscador en panel */}
                        <div className="relative">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
                            <input
                                type="text"
                                placeholder="Buscar cliente o ID..."
                                className={`${STYLES.input} pl-10 py-2.5 text-[10px] ${STYLES.tech}`}
                                value={busquedaEcommerce}
                                onChange={e => setBusquedaEcommerce(e.target.value)}
                            />
                        </div>

                        {/* Lista de paquetes */}
                        <div className="h-[600px] overflow-y-auto space-y-3 custom-scrollbar pr-1 border border-zinc-900 bg-white/[0.01]">
                            {cargandoEcommerce ? (
                                <div className="h-full flex flex-col items-center justify-center text-zinc-700">
                                    <FiLoader className="animate-spin text-white mb-4" size={32} />
                                    <span className={`${STYLES.tech} text-[10px] font-bold`}>DESCARGANDO_DATOS...</span>
                                </div>
                            ) : pedidosSyncFiltrados.length > 0 ? (
                                pedidosSyncFiltrados.map(orden => (
                                    <MiniPaqueteCard
                                        key={orden.id}
                                        orden={orden}
                                        onSelect={seleccionarPedido}
                                        onEstadoChange={handleEcommerceEstadoCambio}
                                    />
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                                    <FiShoppingBag size={64} className="mb-4 text-white" />
                                    <p className={`${STYLES.tech} text-[10px] font-bold`}>SIN_PEDIDOS_DISPONIBLES</p>
                                </div>
                            )}
                        </div>

                        {/* Contador */}
                        {pedidosSyncFiltrados.length > 0 && (
                            <p className={`${STYLES.tech} text-[9px] text-zinc-600 font-bold text-center uppercase`}>
                                {pedidosSyncFiltrados.length} Paquetes // CLICK_PARA_IMPORTAR
                            </p>
                        )}
                    </div>

                    {/* LADO DERECHO: FORMULARIO DE CONFIRMACIÓN */}
                    <div className="lg:col-span-8">
                        <div className={`${STYLES.glass} p-6 md:p-12 bg-zinc-900/20 shadow-2xl relative overflow-hidden border-zinc-800`}>
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none text-white">
                                <FiTruck size={200} />
                            </div>

                            <div className="flex justify-between items-start mb-12">
                                <h2 className={`${STYLES.title} text-3xl flex items-center gap-4`}>
                                    <FiPlus className="text-white" /> GENERAR_ORDEN_DESPACHO
                                </h2>
                                {pedidoEnEdicion && (
                                    <span className={`${STYLES.tech} text-[10px] bg-white/10 text-white border border-white/20 px-3 py-1 font-black`}>
                                        EDITANDO_PEDIDO_# {pedidoEnEdicion.id}
                                    </span>
                                )}
                            </div>

                            <form onSubmit={autorizarDespacho} className="grid grid-cols-2 gap-10">
                                <div className="col-span-2 md:col-span-1 space-y-3">
                                    <label className={STYLES.label}>Entidad_Cliente_Destinatario</label>
                                    <input required className={STYLES.input} value={nuevoEnvio.cliente} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, cliente: e.target.value })} />
                                </div>

                                <div className="col-span-2 md:col-span-1 space-y-3">
                                    <label className={STYLES.label}>Enlace_Telefónico</label>
                                    <input className={`${STYLES.input} ${STYLES.tech} font-bold`} value={nuevoEnvio.telefono} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, telefono: e.target.value })} />
                                </div>

                                <div className="col-span-1 space-y-3">
                                    <label className={STYLES.label}>Valor_Declarado ($)</label>
                                    <input required type="number" className={`${STYLES.input} ${STYLES.tech} !text-white font-black text-xl`} value={nuevoEnvio.monto} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, monto: e.target.value })} />
                                </div>

                                <div className="col-span-1 space-y-3">
                                    <label className={STYLES.label}>ID_DE_TRACKING (OPCIONAL)</label>
                                    <input className={`${STYLES.input} ${STYLES.tech} font-bold border-zinc-800 text-white focus:border-white`} placeholder="EJ: AR-99281-X" value={nuevoEnvio.tracking} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, tracking: e.target.value })} />
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <label className={STYLES.label}>Dirección_De_Destino_Geolocalizada</label>
                                    <input required className={`${STYLES.input} uppercase font-bold`} value={nuevoEnvio.destino} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, destino: e.target.value })} />
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <label className={STYLES.label}>Especificación_Hardware_Y_Contenido (DETALLES_DEL_PAQUETE)</label>
                                    <textarea required className={`${STYLES.input} min-h-[120px] resize-none uppercase text-[10px] leading-relaxed font-bold border-zinc-800`} value={nuevoEnvio.descripcion} onChange={(e) => setNuevoEnvio({ ...nuevoEnvio, descripcion: e.target.value })} />
                                </div>

                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className={`${STYLES.buttonAction} col-span-2 py-6 text-sm mt-6 hover:scale-[1.01] flex items-center justify-center gap-4 disabled:opacity-50`}
                                >
                                    {guardando ? <FiLoader className="animate-spin" /> : <FiCheckCircle size={20} />}
                                    {pedidoEnEdicion ? 'ACTUALIZAR_Y_AUTORIZAR_DESPACHO' : 'GENERAR_NUEVO_DESPACHO_MANUAL'}
                                </button>

                                {pedidoEnEdicion && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPedidoEnEdicion(null);
                                            setNuevoEnvio({ cliente: '', destino: '', metodo: '', productosCount: 1, tracking: '', monto: '', descripcion: '', telefono: '', items: [] });
                                        }}
                                        className={`col-span-2 py-3 text-[10px] ${STYLES.tech} text-zinc-500 hover:text-white transition-all uppercase font-bold tracking-widest`}
                                    >
                                        CANCELAR_EDICIÓN_Y_LIMPIAR
                                    </button>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: black; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
                select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
            `}</style>
        </div>
    );
};

export default EnviosProductos;