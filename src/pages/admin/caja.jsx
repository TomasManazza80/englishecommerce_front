import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSearch, FiBox, FiAlertTriangle, FiLoader, FiMinusCircle, FiTool,
    FiUser, FiCheckCircle, FiBookOpen, FiPlusCircle, FiXCircle,
    FiPrinter, FiTrash2, FiCreditCard, FiChevronDown, FiChevronUp, FiInfo, FiTruck, FiCalendar, FiTag, FiImage
} from 'react-icons/fi';
import ProductInfoModal from './ProductInfoModal';

// =================================================================
// CONFIGURACIÓN ESTILOS lu (PREMIUM DARK TECH)
// =================================================================
const COLOR = {
    fondo: '#FFFFFF',
    panel: '#F9F9F9',
    caja: 'rgba(0, 0, 0, 0.02)',
    borde: 'rgba(0, 0, 0, 0.1)',
    naranja: '#FF8C00',
    blanco: '#FFFFFF',
    textoMuted: '#666666',
    success: '#22C55E',
    error: '#EF4444',
    glow: 'rgba(0,0,0,0.05)'
};

const FONTS = {
    titulo: "'Montserrat', sans-serif",
    cuerpo: "'Inter', sans-serif",
    tech: "'JetBrains Mono', monospace"
};

const BANCOS_DISPONIBLES = ['Banco Galicia', 'Banco Santander', 'Banco BBVA', 'Banco Macro', 'Banco Nación', 'Banco Ciudad', 'Otro'];

const PREDEFINED_COLORS_MAP = [
    { name: 'Negro', code: '#1C1C1E' },
    { name: 'Blanco', code: '#F5F5F7' },
    { name: 'Rojo', code: '#E11C2A' },
    { name: 'Azul', code: '#0071E3' },
    { name: 'Verde', code: '#505652' },
    { name: 'Gris', code: '#8E8E93' },
    { name: 'Dorado', code: '#F9E5C9' },
    { name: 'Plateado', code: '#E3E4E5' },
    { name: 'Violeta', code: '#E5DDEA' },
    { name: 'Grafito', code: '#424245' },
    { name: 'Sierra Azul', code: '#9BB5CE' },
    { name: 'Medianoche', code: '#192028' },
    { name: 'Estelar', code: '#FAF7F4' },
    { name: 'Titanio', code: '#BEBDB8' },
    { name: 'Deep Purple', code: '#594F63' }
];

const translateColor = (color) => {
    if (!color) return '';
    const found = PREDEFINED_COLORS_MAP.find(c => c.code.toLowerCase() === color.toLowerCase());
    return found ? found.name : color;
};

// --- UTILIDAD: OPTIMIZACIÓN DE IMÁGENES ---
const optimizeImage = (url, width = 800) => {
    if (!url) return '';
    if (url.includes('ik.imagekit.io')) {
        return `${url}?tr=w-${width},f-webp,q-80`;
    } else if (url.includes('res.cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            return `${parts[0]}/upload/w_${width},f_webp,q_auto/${parts[1]}`;
        }
    }
    return url;
};

// ------------------------------------------------------------------
// --- COMPONENTE: HISTORIAL DE VENTAS ---
// ------------------------------------------------------------------
const HistorialVentasTech = ({ historial, cargando, error }) => {
    const [expandedId, setExpandedId] = useState(null);

    if (cargando) return (
        <div className="flex flex-col items-center justify-center py-20 text-black fedecell-tech animate-pulse">
            <FiLoader className="animate-spin mb-4" size={32} />
            <span className="text-[10px] tracking-[0.3em]">CARGANDO HISTORIAL DE VENTAS...</span>
        </div>
    );

    if (error) return <div className="border border-red-500/30 bg-red-500/5 p-6 text-center text-red-500 fedecell-tech text-xs uppercase">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="glass-container border border-white/10 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-orange-500/50 bg-orange-500/5">
                            <th className="p-4 fedecell-title text-[10px] text-orange-500">REF</th>
                            <th className="p-4 fedecell-title text-[10px] text-orange-500">FECHA Y HORA</th>
                            <th className="p-4 fedecell-title text-[10px] text-orange-500">CLIENTE</th>
                            <th className="p-4 fedecell-title text-[10px] text-orange-500 text-right">TOTAL</th>
                            <th className="p-4 fedecell-title text-[10px] text-orange-500 text-center">DETALLES</th>
                        </tr>
                    </thead>
                    <tbody className="fedecell-tech text-[11px]">
                        {historial.map((v, idx) => (
                            <React.Fragment key={v.id || idx}>
                                <tr onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} className="border-b border-black/5 hover:bg-black/5 cursor-pointer transition-colors">
                                    <td className="p-4 text-black font-bold">#{v.id}</td>
                                    <td className="p-4 text-black">{new Date(v.createdAt).toLocaleString()}</td>
                                    <td className="p-4 uppercase text-black">{v.opcion1?.replace('Cliente: ', '') || 'CONSUMIDOR FINAL'}</td>
                                    <td className="p-4 text-right font-bold text-black">${Number(v.montoTotal).toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">{expandedId === v.id ? <FiChevronUp className="text-black" /> : <FiChevronDown className="text-black" />}</div>
                                    </td>
                                </tr>
                                <AnimatePresence>
                                    {expandedId === v.id && (
                                        <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-black/[0.01]">
                                            <td colSpan="5" className="p-4 md:p-6 border-b border-black/10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                                                    <div>
                                                        <p className="text-black text-[9px] font-black mb-3 tracking-widest uppercase border-b border-black/10 pb-1">Desglose de Artículos</p>
                                                        <div className="space-y-2">
                                                            {v.productos?.map((p, i) => (
                                                                <div key={i} className="flex justify-between text-[10px] border-b border-black/5 pb-1">
                                                                    <span className="text-black">{p.nombre.toUpperCase()} <span className="text-black/40">x{p.cantidad}</span></span>
                                                                    <span className="text-black">${(p.monto * p.cantidad).toLocaleString()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="md:border-l md:border-black/10 md:pl-8 pt-4 md:pt-0 border-t border-black/5">
                                                        <p className="text-black text-[9px] font-black mb-3 tracking-widest uppercase border-b border-black/10 pb-1">Información de Terminal</p>
                                                        <p className="text-black mb-1">MÉTODO: <span className="text-black">{v.medioPago?.toUpperCase()}</span></p>
                                                        <p className="text-black mb-1">LOGS: <span className="text-black text-[10px]">{v.opcion2 || 'SIN METADATOS'}</span></p>
                                                        <p className="text-black">AHORRO: <span className="text-zinc-500">-${Number(v.descuentos).toLocaleString()}</span></p>
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )}
                                </AnimatePresence>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COMPONENTE: MODAL SELECCION VARIANTE ---
const VariantSelectorModal = ({ product, onClose, onSelect }) => {
    if (!product) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white border border-black/10 w-full max-w-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-black/10 pb-4">
                    <h3 className="font-['Montserrat'] font-black uppercase text-black">SELECCIONAR VARIANTE: <span className="text-black/60">{product.nombre}</span></h3>
                    <button onClick={onClose}><FiXCircle size={24} className="text-black/30 hover:text-black" /></button>
                </div>
                <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {product.variantes?.map((v, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect(v)}
                            disabled={v.stock <= 0}
                            className={`flex justify-between items-center p-4 border border-black/10 bg-black/5 text-left group transition-all ${v.stock > 0
                                ? 'hover:border-black hover:bg-black/10 cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: v.color }}></div>
                                <div>
                                    <p className="font-bold text-black text-xs">{v.color.toUpperCase()} - {v.almacenamiento}</p>
                                    <p className={`text-[10px] font-mono ${v.stock > 0 ? 'text-black/40' : 'text-zinc-500 font-bold'}`}>STOCK: {v.stock}</p>
                                </div>
                            </div>
                            <span className="font-['JetBrains_Mono'] font-bold text-black group-hover:scale-110 transition-transform">${Number(v.precioAlPublico).toLocaleString()}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ------------------------------------------------------------------
// --- COMPONENTE: CARRITO Y PAGO ---
// ------------------------------------------------------------------
const CarritoYPago = ({
    carrito, resumenVenta, estadoTransaccion, descuentoGlobal, setDescuentoGlobal,
    tipoDescuento, setTipoDescuento, medioPago, setMedioPago, nombreBanco, setNombreBanco,
    opcionCliente, setOpcionCliente, handleGenerarVenta, handleCantidadChange, handleRemoveItem, mixtoCreditoInfo, setMixtoCreditoInfo, mixtoInteres,
    ultimosCuatro, setUltimosCuatro, mixto, setMixto,
    montoRecibido, setMontoRecibido,
    bankRates, selectedCuotas, setSelectedCuotas, setSelectedInterest, montoFinalManual, setMontoFinalManual,
    balanceTag, setBalanceTag,
    setInspectedProduct
}) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const esTarjeta = ['debito', 'tarjeta_credito', 'mixto'].includes(medioPago) || medioPago.startsWith('credito_');
    const esCredito = medioPago.startsWith('credito_') || medioPago === 'tarjeta_credito';
    const esMixto = medioPago === 'mixto';

    // Cálculo del vuelto
    const vuelto = montoRecibido ? parseFloat(montoRecibido) - parseFloat(resumenVenta.montoTotalRaw) : 0;
    const faltaPago = vuelto < 0;

    const isReadyToSell = resumenVenta.itemsSeleccionados === 0 || estadoTransaccion === 'loading' || (esCredito && (!nombreBanco || !selectedCuotas));

    const inputClasses = "w-full bg-white border border-black/20 p-3 text-black fedecell-tech text-sm focus:border-black outline-none transition-all rounded-sm";
    const labelClasses = "block font-['Montserrat'] text-[11px] md:text-[12px] text-black font-black uppercase tracking-widest mb-1.5 mt-4";

    // --- LOGIC: BANK RATES ---
    const uniqueBanks = React.useMemo(() => [...new Set(bankRates.map(r => r.banco))], [bankRates]);
    const availableQuotas = React.useMemo(() => {
        if (!nombreBanco) return [];
        return bankRates.filter(r => r.banco === nombreBanco).sort((a, b) => a.cuotas - b.cuotas);
    }, [bankRates, nombreBanco]);

    useEffect(() => {
        if (!esCredito) {
            setSelectedInterest(0);
            return;
        }
        if (!nombreBanco) {
            setSelectedInterest(0);
            return;
        }
        const rate = bankRates.find(r => r.banco === nombreBanco && r.cuotas === parseInt(selectedCuotas));
        if (rate) {
            setSelectedInterest(Number(rate.porcentajeInteres));
        } else {
            setSelectedInterest(0);
        }
    }, [nombreBanco, selectedCuotas, bankRates, esCredito, setSelectedInterest]);

    // --- LOGIC: AUTOMATIC CHANGE CALCULATION ---
    useEffect(() => {
        if (medioPago === 'efectivo' && montoRecibido && vuelto > 0) {
            let remainingVuelto = vuelto;
            const newDesglose = { 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 };
            const denominations = [20000, 10000, 5000, 2000, 1000, 500, 200, 100];

            for (const den of denominations) {
                const available = resumenVenta.arqueoCaja[den] || 0;
                if (available > 0 && remainingVuelto >= den) {
                    const countNeeded = Math.floor(remainingVuelto / den);
                    const countToUse = Math.min(countNeeded, available);
                    if (countToUse > 0) {
                        newDesglose[den] = countToUse;
                        remainingVuelto -= (countToUse * den);
                    }
                }
            }

            // Only update if the auto-calculated breakdown is different from current to avoid infinite loops,
            // or if we just want to reset it when montoRecibido changes.
            // A simple JSON.stringify comparison works well here for shallow objects.
            if (JSON.stringify(newDesglose) !== JSON.stringify(resumenVenta.detallesVuelto)) {
                Object.entries(newDesglose).forEach(([den, val]) => {
                    resumenVenta.setDetalleVuelto(den, val);
                });
            }
        } else if (medioPago === 'efectivo' && (!montoRecibido || vuelto <= 0)) {
            // Reset vuelto if no change is needed
            const currentDesglose = resumenVenta.detallesVuelto;
            const isEmpty = Object.values(currentDesglose).every(val => val === 0 || val === '');
            if (!isEmpty) {
                [20000, 10000, 5000, 2000, 1000, 500, 200, 100].forEach(den => {
                    resumenVenta.setDetalleVuelto(den, 0);
                });
            }
        }
    }, [montoRecibido, vuelto, medioPago, resumenVenta.arqueoCaja]); // Intentional: we do NOT include resumenVenta.detallesVuelto

    return (
        <div className="  mt-[-100px] glass-container p-5 border-2 border-black sticky top-5" style={{ backgroundColor: COLOR.panel }}>
            <h3 className="fedecell-title text-black text-lg mb-6 tracking-widest border-b border-black/5 pb-4">NODO DE PAGO [{resumenVenta.itemsSeleccionados}]</h3>
            <div className="max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                {Object.values(carrito).map(({ item, cantidad, tipo, variant }) => {
                    const id = variant ? `${item.id}-${variant.color}-${variant.almacenamiento}` : item.id;
                    const precio = tipo === 'producto'
                        ? (variant ? variant.precioAlPublico : item.precioVenta)
                        : item.montoTotal;
                    const nombreShow = tipo === 'producto' ? item.nombre : `ENC: ${item.descripcionTrabajo}`;

                    return (
                        <div key={id} className="mb-2 pb-2 border-b border-white/5">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span
                                        className="text-[14px] font-black text-black uppercase tracking-tight block cursor-help leading-tight"
                                        onDoubleClick={() => setInspectedProduct(item)}
                                        title="Doble clic para detalles"
                                    >
                                        {nombreShow}
                                    </span>
                                    {variant && <span className="text-[11px] text-zinc-500 font-mono block mt-1 uppercase">{variant.color} / {variant.almacenamiento}</span>}
                                </div>
                                <button onClick={() => handleRemoveItem(id)} className="text-zinc-400 hover:text-black transition-colors"><FiTrash2 size={16} /></button>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center bg-white border border-black/5 p-1">
                                    <button onClick={() => handleCantidadChange(id, cantidad - 1)} className="px-2 text-black hover:bg-black/5"><FiMinusCircle /></button>
                                    <span className="px-3 fedecell-tech text-sm font-bold text-black">{cantidad}</span>
                                    <button onClick={() => handleCantidadChange(id, cantidad + 1)} className="px-2 text-black hover:bg-black/5"><FiPlusCircle /></button>
                                </div>
                                <span className="fedecell-tech text-sm font-black text-black">${(precio * cantidad).toLocaleString()}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                    <label className={labelClasses}>MODO DESCUENTO</label>
                    <div className="flex">
                        <input type="number" value={descuentoGlobal} onChange={(e) => setDescuentoGlobal(e.target.value)} className={`${inputClasses} border-r-0`} placeholder="0" />
                        <select value={tipoDescuento} onChange={(e) => setTipoDescuento(e.target.value)} className="bg-black text-white fedecell-tech text-[10px] font-black border-none px-2 cursor-pointer uppercase">
                            <option value="porcentaje">%</option>
                            <option value="valor">$</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClasses}>MÉTODO DE PAGO</label>
                    <select value={medioPago} onChange={(e) => setMedioPago(e.target.value)} className={inputClasses}>
                        <option value="efectivo">EFECTIVO (CAJA)</option>
                        <option value="debito">TARJETA DE DÉBITO</option>
                        <option value="transferencia">TRANSFERENCIA</option>
                        <option value="credito_1">CRÉDITO 1 CUOTA</option>
                        <option value="credito_2">CRÉDITO 2 CUOTAS</option>
                        <option value="credito_3">CRÉDITO 3 CUOTAS</option>
                        <option value="credito_4">CRÉDITO 4 CUOTAS</option>
                        <option value="credito_5">CRÉDITO 5 CUOTAS</option>
                        <option value="credito_6">CRÉDITO 6 CUOTAS</option>
                        <option value="mixto">PAGOS MIXTOS</option>
                    </select>
                </div>
            </div>

            {/* CALCULADORA DE VUELTO (SOLO EFECTIVO) Y DESGROSE DE BILLETES */}
            {medioPago === 'efectivo' && (
                <div className="space-y-2">
                    <div className="p-4 bg-white border border-black/10 rounded-md">
                        <label className={labelClasses + " mt-0"}>CALCULADORA DE VUELTO</label>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <span className="text-[10px] text-black block mb-1">RECIBO:</span>
                                <div className="relative">

                                    <input
                                        type="number"
                                        value={montoRecibido}
                                        onChange={e => setMontoRecibido(e.target.value)}
                                        className={`${inputClasses} pl-6 text-xl font-bold text-black`}
                                        placeholder="$0"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-right">
                                <span className="text-[10px] text-black block mb-1">VUELTO A DAR:</span>
                                <div className={`text-4xl font-black fedecell-tech ${faltaPago ? 'text-zinc-300' : 'text-black'}`}>
                                    ${vuelto >= 0 ? vuelto.toLocaleString() : '---'}
                                </div>
                            </div>
                        </div>
                        {faltaPago && montoRecibido > 0 && (
                            <p className="text-red-500 text-[11px] mt-2 text-right font-bold uppercase tracking-widest">FALTAN: ${(vuelto * -1).toLocaleString()}</p>
                        )}
                    </div>

                    <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full py-2 border border-black/10 bg-black/5 hover:bg-black/10 text-[10px] fedecell-tech text-black uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2"
                    >
                        {showBreakdown ? <><FiChevronUp /> OCULTAR DESGLOSE DE BILLETES</>  : <><FiChevronDown /> MOSTRAR DESGLOSE DE BILLETES</>}
                    </button>

                    {showBreakdown && (
                        <>
                            <div className="p-2 bg-neutral-50 border border-black/10 rounded-md">
                                <label className={labelClasses + " mt-0 mb-3"}>DESGLOSE DE BILLETES RECIBIDOS (ARS)</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {[20000, 10000, 5000, 2000, 1000, 500, 200, 100].map(den => (
                                        <div key={den} className="flex flex-col">
                                            <span className="text-[8px] text-zinc-500 mb-1">${den.toLocaleString()}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={resumenVenta.detallesBilletes[den] || ''}
                                                onChange={e => resumenVenta.setDetalleBillete(den, e.target.value)}
                                                className="bg-white border border-black/10 p-2 text-black fedecell-tech text-[10px] focus:border-black outline-none"
                                                placeholder="0"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {vuelto > 0 && (
                                <div className="p-2 bg-neutral-50 border border-black/10 rounded-md">
                                    <label className={labelClasses + " mt-0 mb-3 text-blue-600"}>DESGLOSE DE VUELTO ENTREGADO (ARS)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {[20000, 10000, 5000, 2000, 1000, 500, 200, 100].map(den => {
                                            const available = resumenVenta.arqueoCaja[den] || 0;
                                            const isDisabled = available <= 0;
                                            return (
                                                <div key={den} className={`flex flex-col ${isDisabled ? 'opacity-30 grayscale' : ''}`}>
                                                    <span className="text-[8px] text-zinc-500 mb-1">
                                                        ${den.toLocaleString()} {isDisabled ? '(SIN STOCK)' : `(DISP: ${available})`}
                                                    </span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={available}
                                                        disabled={isDisabled}
                                                        value={resumenVenta.detallesVuelto[den] || ''}
                                                        onChange={e => {
                                                            const val = Math.min(available, parseInt(e.target.value) || 0);
                                                            resumenVenta.setDetalleVuelto(den, val);
                                                        }}
                                                        className={`bg-white border border-black/10 p-2 text-black fedecell-tech text-[10px] outline-none focus:border-blue-500`}
                                                        placeholder="0"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-2 border-t border-black/5 flex justify-between items-center">
                                        <span className="text-[9px] text-black uppercase">Total en Vuelto:</span>
                                        <span className={`fedecell-tech text-xs font-bold ${resumenVenta.totalVuelto === vuelto ? 'text-blue-600' : 'text-orange-500'}`}>
                                            ${resumenVenta.totalVuelto.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {esMixto && (
                <div className="p-2 bg-orange-500/5 border border-orange-500/30 rounded-md mb-3 space-y-2">
                    <p className="fedecell-tech text-[9px] text-orange-500 font-black uppercase tracking-widest mb-2">Desglose de Pago Mixto</p>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-24 fedecell-tech text-[10px] text-black">EFECTIVO</div>
                            <input
                                type="number"
                                placeholder="$0"
                                value={mixto.efectivo}
                                onChange={e => setMixto({ ...mixto, efectivo: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 fedecell-tech text-[10px] text-black">TRANSF.</div>
                            <input
                                type="number"
                                placeholder="$0"
                                value={mixto.transferencia}
                                onChange={e => setMixto({ ...mixto, transferencia: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 fedecell-tech text-[10px] text-black">DÉBITO</div>
                            <input
                                type="number"
                                placeholder="$0"
                                value={mixto.debito}
                                onChange={e => setMixto({ ...mixto, debito: e.target.value })}
                                className={inputClasses}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-24 fedecell-tech text-[10px] text-black">CRÉDITO</div>
                            <input
                                type="number"
                                placeholder="$0"
                                value={mixto.credito}
                                onChange={e => setMixto({ ...mixto, credito: e.target.value })}
                                className={inputClasses}
                            />
                        </div>




                    </div>
                    <div className="pt-2 border-t border-orange-500/20 flex justify-between items-center font-['JetBrains_Mono']">
                        <span className="text-[10px] text-orange-600 font-bold">TOTAL ASIGNADO:</span>
                        <span className="text-black text-sm font-black">
                            ${((parseFloat(mixto.efectivo) || 0) + (parseFloat(mixto.transferencia) || 0) + (parseFloat(mixto.debito) || 0)).toLocaleString()}
                        </span>
                    </div>
                    {parseFloat(mixto.credito) > 0 && (
                        <div className="pl-4 mt-3 space-y-3 border-l-2 border-orange-500/20">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClasses}>BANCO</label>
                                    <select value={mixtoCreditoInfo.banco} onChange={e => setMixtoCreditoInfo({ ...mixtoCreditoInfo, banco: e.target.value, cuotas: '' })} className={inputClasses}>
                                        <option value="">SELECCIONAR...</option>
                                        {uniqueBanks.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClasses}>CUOTAS</label>
                                    <select value={mixtoCreditoInfo.cuotas} onChange={e => setMixtoCreditoInfo({ ...mixtoCreditoInfo, cuotas: e.target.value })} className={inputClasses} disabled={!mixtoCreditoInfo.banco}>
                                        <option value="">SELECCIONAR...</option>
                                        {bankRates.filter(r => r.banco === mixtoCreditoInfo.banco).map(rate => (
                                            <option key={rate.id} value={rate.cuotas}>
                                                {rate.cuotas} {rate.cuotas === 1 ? 'PAGO' : 'CUOTAS'} ({rate.porcentajeInteres}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            )}

            {esTarjeta && (
                <div className="p-2 bg-neutral-50 border border-black/10 mb-2 space-y-2">
                    <div>
                        <label className={labelClasses}>ÚLT. 4 DÍGITOS (OPCIONAL)</label>
                        <input type="text" maxLength="4" placeholder="XXXX" value={ultimosCuatro} onChange={e => setUltimosCuatro(e.target.value)} className={inputClasses} />
                    </div>

                    {esCredito && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClasses}>BANCO</label>
                                <select value={nombreBanco} onChange={e => { setNombreBanco(e.target.value); setSelectedCuotas(''); }} className={inputClasses}>
                                    <option value="">SELECCIONAR...</option>
                                    {uniqueBanks.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>CUOTAS</label>
                                <select value={selectedCuotas} onChange={e => setSelectedCuotas(e.target.value)} className={inputClasses} disabled={!nombreBanco}>
                                    <option value="">SELECCIONAR...</option>
                                    {availableQuotas.map(rate => (
                                        <option key={rate.id} value={rate.cuotas}>
                                            {rate.cuotas} {rate.cuotas === 1 ? 'PAGO' : 'CUOTAS'} ({rate.porcentajeInteres}%)
                                        </option>
                                    ))}
                                </select>
                            </div>


                        </div>
                    )}
                </div>
            )}

            {esCredito && selectedCuotas && parseInt(selectedCuotas) > 0 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-500/20 rounded-sm text-center">
                    <p className="fedecell-tech text-[10px] text-orange-600 uppercase tracking-widest mb-1 font-bold">
                        VALOR POR CUOTA ({selectedCuotas})
                    </p>
                    <p className="text-2xl font-black text-black fedecell-tech">
                        ${(resumenVenta.montoTotalRaw / parseInt(selectedCuotas)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            )}

            {esMixto && parseFloat(mixto.credito) > 0 && mixtoCreditoInfo.cuotas > 0 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-500/20 rounded-sm text-center">
                    <p className="fedecell-tech text-[10px] text-orange-600 uppercase tracking-widest mb-1 font-bold">
                        VALOR POR CUOTA (MIXTO - {mixtoCreditoInfo.cuotas})
                    </p>
                    <p className="text-2xl font-black text-black fedecell-tech">
                        ${((parseFloat(mixto.credito) + mixtoInteres.monto) / parseInt(mixtoCreditoInfo.cuotas)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                </div>
            )}




            <div className="mb-4"><label className={labelClasses}>CLIENTE / ENTIDAD</label><input type="text" placeholder="CONSUMIDOR FINAL" value={opcionCliente} onChange={(e) => setOpcionCliente(e.target.value)} className={inputClasses} /></div>

            <div className="bg-neutral-50 p-4 border border-black/10 mb-4 space-y-2 rounded-sm shadow-sm">
                <div className="flex justify-between items-center text-black/60 text-[10px] fedecell-tech">
                    <span>SUBTOTAL</span>
                    <span className="font-bold">${(resumenVenta.montoTotalRaw - resumenVenta.interesRaw).toLocaleString()}</span>
                </div>
                {resumenVenta.interesRaw > 0 && (
                    <div className="flex justify-between items-center text-orange-600 text-[10px] fedecell-tech font-bold">
                        <span>RECARGO FINANCIERO</span>
                        <span>+${resumenVenta.interesRaw.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex flex-col border-t border-black/10 pt-4">
                    <span className="fedecell-title text-black text-[11px] uppercase tracking-[0.2em] mb-1 font-black">TOTAL DEL PEDIDO</span>
                    <div className="flex items-center justify-end">
                        <span className="fedecell-tech text-3xl font-black text-black/60 mr-4 font-mono">$</span>
                        <input
                            type="number"
                            value={montoFinalManual !== null ? montoFinalManual : resumenVenta.montoTotalRaw}
                            onChange={(e) => setMontoFinalManual(e.target.value)}
                            className="fedecell-tech text-4xl font-black text-black bg-transparent text-right w-full outline-none border-none p-0 focus:ring-0"
                        />
                    </div>
                </div>
            </div>

            <button onClick={handleGenerarVenta} disabled={isReadyToSell} className={`w-full py-5 fedecell-title text-sm tracking-[0.3em] font-black transition-all duration-500 ${isReadyToSell ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-black text-white hover:bg-zinc-800'}`}>{estadoTransaccion === 'loading' ? 'EJECUTANDO SINCRONIZACIÓN...' : 'CONFIRMAR VENTA E IMPRIMIR'}</button>
        </div>
    );
};

// ------------------------------------------------------------------
// --- COMPONENTE PRINCIPAL: MODULO VENTAS ---
// ------------------------------------------------------------------
const ModuloVentas = () => {
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [encargosDisponibles, setEncargosDisponibles] = useState([]);
    const [carrito, setCarrito] = useState({});
    const [cargando, setCargando] = useState(true);
    const [vistaActual, setVistaActual] = useState('productos');
    const [medioPago, setMedioPago] = useState('efectivo');
    const [descuentoGlobal, setDescuentoGlobal] = useState(0);
    const [tipoDescuento, setTipoDescuento] = useState('porcentaje');
    const [opcionCliente, setOpcionCliente] = useState('');
    const [nombreBanco, setNombreBanco] = useState('');
    const [selectedCuotas, setSelectedCuotas] = useState(1);
    const [selectedInterest, setSelectedInterest] = useState(0);
    const [bankRates, setBankRates] = useState([]);
    const [mixtoCreditoInfo, setMixtoCreditoInfo] = useState({ banco: '', cuotas: '' });
    const [mixtoInteres, setMixtoInteres] = useState({ porcentaje: 0, monto: 0 });
    const [ultimosCuatro, setUltimosCuatro] = useState('');
    const [mixto, setMixto] = useState({ efectivo: '', transferencia: '', debito: '' });
    const [estadoTransaccion, setEstadoTransaccion] = useState(null);
    const [historialVentas, setHistorialVentas] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [errorHistorial, setErrorHistorial] = useState(null);
    const [montoRecibido, setMontoRecibido] = useState('');
    const [montoFinalManual, setMontoFinalManual] = useState(null);
    const [selectedProductForVariant, setSelectedProductForVariant] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [inspectedProduct, setInspectedProduct] = useState(null);
    const [isInspectingClient, setIsInspectingClient] = useState(false);
    const [inspectedClient, setInspectedClient] = useState(null);
    const [servicePricingItem, setServicePricingItem] = useState(null);
    const [customPrice, setCustomPrice] = useState("");
    const [desgloseBilletes, setDesgloseBilletes] = useState({
        20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    });
    const [desgloseVuelto, setDesgloseVuelto] = useState({
        20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    });
    const [arqueoCaja, setArqueoCaja] = useState({
        20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0
    });
    const [busquedaProductos, setBusquedaProductos] = useState('');
    const [debouncedBusquedaProductos, setDebouncedBusquedaProductos] = useState('');
    const [page, setPage] = useState(1);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
    const [busquedaServicios, setBusquedaServicios] = useState('');
    const [busquedaHistorial, setBusquedaHistorial] = useState('');
    const API_URL = import.meta.env.VITE_API_URL;

    // --- FILTROS DE FECHA ---
    const hoy = new Date().toISOString().split('T')[0];
    const hace30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const [histStartDate, setHistStartDate] = useState(hoy);
    const [histEndDate, setHistEndDate] = useState(hoy);
    const [repStartDate, setRepStartDate] = useState(hace30);
    const [repEndDate, setRepEndDate] = useState(hoy);

    const API_BASE = API_URL;

    const handleCantidadChange = (id, nuevaCantidad) => {
        const itemEnCarrito = carrito[id];
        if (!itemEnCarrito) return;

        if (nuevaCantidad <= 0) {
            const nuevoCarrito = { ...carrito };
            delete nuevoCarrito[id];
            setCarrito(nuevoCarrito);
            return;
        }

        // Check stock only for products
        if (itemEnCarrito.tipo === 'producto' && itemEnCarrito.variant) {
            const stockDisponible = itemEnCarrito.variant.stock;
            if (nuevaCantidad > stockDisponible) {
                console.warn(`Stock insuficiente para ${itemEnCarrito.item.nombre}. Solicitado: ${nuevaCantidad}, Disponible: ${stockDisponible}`);
                return; // Do not update quantity
            }
        }

        setCarrito(prev => ({
            ...prev,
            [id]: { ...prev[id], cantidad: nuevaCantidad }
        }));
    };

    const handleRemoveItem = (id) => {
        const nuevoCarrito = { ...carrito };
        delete nuevoCarrito[id];
        setCarrito(nuevoCarrito);
    };

    useEffect(() => { fetchData(); obtenerHistorialVentas(); }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedBusquedaProductos(busquedaProductos);
            setPage(1); // Reset page on new search
        }, 300);
        return () => clearTimeout(handler);
    }, [busquedaProductos]);

    const fetchProducts = useCallback(async (currentPage, searchQuery) => {
        try {
            if (currentPage === 1) setCargando(true);
            else setIsLoadingMoreProducts(true);

            const { data } = await axios.get(`${API_BASE}/products`, {
                params: {
                    page: currentPage,
                    limit: 20,
                    search: searchQuery
                }
            });

            if (currentPage === 1) {
                setProductosDisponibles(data.products || []);
            } else {
                setProductosDisponibles(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newProducts = (data.products || []).filter(p => !existingIds.has(p.id));
                    return [...prev, ...newProducts];
                });
            }

            setHasMoreProducts(currentPage < data.totalPages);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            if (currentPage === 1) setCargando(false);
            setIsLoadingMoreProducts(false);
        }
    }, [API_BASE]);

    useEffect(() => {
        if (vistaActual === 'productos') {
            fetchProducts(page, debouncedBusquedaProductos);
        }
    }, [page, debouncedBusquedaProductos, fetchProducts, vistaActual]);

    const fetchData = async () => {
        setCargando(true);
        try {
            const [reps, banks, bal] = await Promise.all([
                axios.get(`${API_BASE}/encargos`, { params: { startDate: repStartDate, endDate: repEndDate } }),
                axios.get(`${API_BASE}/gastos/bank-rates`),
                axios.get(`${API_BASE}/balanceMensual/ObtenBalanceMensual`)
            ]);
            setEncargosDisponibles(reps.data);
            setBankRates(banks.data);

            // Calcular Arqueo
            const totals = { 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 };
            bal.data.forEach(entry => {
                if (entry.metodo_pago === 'efectivo' && entry.detalles_pago?.billetes) {
                    Object.entries(entry.detalles_pago.billetes).forEach(([d, c]) => totals[d] += parseInt(c) || 0);
                }
                if (entry.metodo_pago === 'efectivo' && entry.detalles_pago?.vuelto) {
                    Object.entries(entry.detalles_pago.vuelto).forEach(([d, c]) => totals[d] -= parseInt(c) || 0);
                }
            });
            setArqueoCaja(totals);
        } catch (e) { console.error("CRITICAL_NODE_FAILURE", e); } finally { setCargando(false); }
    };

    const obtenerHistorialVentas = async (start = histStartDate, end = histEndDate) => {
        setCargandoHistorial(true);
        try {
            const response = await axios.get(`${API_BASE}/pagoCaja/pagos`, {
                params: { startDate: start, endDate: end }
            });
            setHistorialVentas(response.data || []);
        } catch (error) { setErrorHistorial("ERR_HISTORY_SYNC_FAILED"); } finally { setCargandoHistorial(false); }
    };

    const handleToggleCarrito = (item, tipo, variantSeleccionada = null) => {
        // Lógica de variantes
        if (tipo === 'producto' && item.variantes && item.variantes.length > 0 && !variantSeleccionada) {
            setSelectedProductForVariant(item);
            setShowVariantModal(true);
            return;
        }

        const id = variantSeleccionada
            ? `${item.id}-${variantSeleccionada.color}-${variantSeleccionada.almacenamiento}`
            : item.id;

        let finalItem = { ...item };
        if (tipo === 'servicio') {
            setServicePricingItem(item);
            setCustomPrice(item.montoTotal || "");
            return;
        }

        setCarrito(prev => {
            const itemEnCarrito = prev[id];

            if (itemEnCarrito) {
                // Si es servicio, actualizamos el precio además de incrementar (o simplemente dejamos cantidad 1 pero con nuevo precio)
                if (tipo === 'servicio') {
                    return { ...prev, [id]: { ...itemEnCarrito, item: finalItem, cantidad: 1 } };
                }

                // Item exists, check stock before incrementing
                if (tipo === 'producto' && itemEnCarrito.variant) {
                    const stockDisponible = itemEnCarrito.variant.stock;
                    if (itemEnCarrito.cantidad >= stockDisponible) {
                        console.warn(`Stock máximo alcanzado para ${item.nombre}`);
                        return prev; // Return previous state without changes
                    }
                }
                return { ...prev, [id]: { ...itemEnCarrito, cantidad: itemEnCarrito.cantidad + 1 } };
            }

            // Item does not exist, add it, but check stock first.
            if (tipo === 'producto' && variantSeleccionada && variantSeleccionada.stock <= 0) {
                console.warn(`No se puede agregar ${item.nombre} porque no hay stock.`);
                setShowVariantModal(false);
                setSelectedProductForVariant(null);
                return prev;
            }

            return { ...prev, [id]: { item: finalItem, cantidad: 1, tipo, variant: variantSeleccionada } };
        });

        if (variantSeleccionada) {
            setShowVariantModal(false);
            setSelectedProductForVariant(null);
        }
    };

    useEffect(() => {
        if (medioPago === 'mixto' && parseFloat(mixto.credito) > 0 && mixtoCreditoInfo.banco && mixtoCreditoInfo.cuotas) {
            const rate = bankRates.find(r => r.banco === mixtoCreditoInfo.banco && r.cuotas === parseInt(mixtoCreditoInfo.cuotas));
            if (rate) {
                const porcentaje = Number(rate.porcentajeInteres);
                const montoCredito = parseFloat(mixto.credito) || 0;
                setMixtoInteres({ porcentaje, monto: montoCredito * (porcentaje / 100) });
            } else {
                setMixtoInteres({ porcentaje: 0, monto: 0 });
            }
        } else if (mixtoInteres.monto !== 0) {
            setMixtoInteres({ porcentaje: 0, monto: 0 });
        }
    }, [medioPago, mixto.credito, mixtoCreditoInfo.banco, mixtoCreditoInfo.cuotas, bankRates, mixtoInteres.monto]);


    const generarFacturaPDF = (items, resumen, pago, cliente, transaccionId, fecha) => {
        // Formato térmico: 80mm de ancho. Altura variable, usamos 250 para asegurar espacio.
        const doc = new jsPDF({
            unit: 'mm',
            format: [80, 250]
        });

        const centerX = 40;
        let y = 10;

        // Header (Igual que en Reparaciones)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("FEDE CELL", centerX, y, { align: "center" });
        y += 5;
        doc.setFontSize(8);
        doc.text("Telefonía Celular", centerX, y, { align: "center" });
        y += 5;

        // Info Local
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text("ACCESORIOS TELEFONÍA CELULAR.", centerX, y, { align: "center" });
        y += 3;
        doc.text("SERVICE DE TODAS LAS MARCAS / ACTIVACIONES Y VENTAS.", centerX, y, { align: "center" });
        y += 6;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("GENERAL LOPEZ 3484", centerX, y, { align: "center" });
        y += 4;
        doc.text("Teléfono : 342 5815234", centerX, y, { align: "center" });
        y += 4;
        doc.text("WhatsApp : 342 5454565", centerX, y, { align: "center" });
        y += 5;

        // Separador
        doc.text("-------------------------------------------------------------", centerX, y, { align: "center" });
        y += 6;

        // Datos de la Venta
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("COMPROBANTE DE VENTA", centerX, y, { align: "center" });
        y += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`FECHA: ${fecha}`, 5, y);
        y += 4;
        doc.text(`REF: ${transaccionId.substring(0, 10).toUpperCase()}`, 5, y);
        y += 4;
        doc.text(`CLIENTE: ${(cliente || "Consumidor Final").toUpperCase()}`, 5, y);
        y += 4;
        doc.text(`PAGO: ${pago.toUpperCase()}`, 5, y);
        y += 6;

        // Separador
        doc.setFont("helvetica", "bold");
        doc.text("-------------------------------------------------------------", centerX, y, { align: "center" });
        y += 5;

        // Títulos de tabla
        doc.setFontSize(7);
        doc.text("DESCRIPCIÓN", 5, y);
        doc.text("CANT", 40, y, { align: "right" });
        doc.text("P. UNIT", 60, y, { align: "right" });
        doc.text("TOTAL", 78, y, { align: "right" });
        y += 4;

        // Items
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5); // Reducimos levemente el cuerpo para evitar superposiciones
        items.forEach((elem) => {
            const { item, cantidad, tipo, variant } = elem;
            const esProd = tipo === 'producto';
            let nombre = esProd ? item.nombre : (item.modeloEquipo || item.nombreDispositivo);

            if (variant) {
                const cName = translateColor(variant.color);
                nombre += ` (${cName} ${variant.almacenamiento})`;
            }
            if (!esProd) nombre = `(SERV) ${nombre}`;

            const precio = esProd
                ? (variant ? variant.precioAlPublico : item.precioVenta)
                : item.montoTotal;
            const totalItem = Number(precio) * cantidad;

            // Reducimos el ancho de corte para dar más aire a los precios
            const splitName = doc.splitTextToSize(nombre.toUpperCase(), 30);
            doc.text(splitName, 5, y);

            doc.text(String(cantidad), 40, y, { align: 'right' });
            doc.text(`${Number(precio).toLocaleString()}`, 60, y, { align: 'right' });
            doc.text(`${totalItem.toLocaleString()}`, 78, y, { align: 'right' });

            y += (splitName.length * 3.5) + 1;
        });

        y += 2;
        doc.setFont("helvetica", "bold");
        doc.text("-------------------------------------------------------------", centerX, y, { align: "center" });
        y += 5;

        // Totales
        doc.setFontSize(8);
        const neto = resumen.montoTotalRaw - resumen.interesRaw + resumen.descuentosRaw;

        doc.text("SUBTOTAL:", 45, y, { align: 'right' });
        doc.text(`$${neto.toLocaleString()}`, 78, y, { align: 'right' });
        y += 5;

        if (resumen.interesRaw > 0) {
            doc.text("RECARGO:", 45, y, { align: 'right' });
            doc.text(`$${resumen.interesRaw.toLocaleString()}`, 78, y, { align: 'right' });
            y += 5;
        }

        if (resumen.descuentosRaw > 0) {
            doc.text("DESCUENTO:", 45, y, { align: 'right' });
            doc.text(`-$${resumen.descuentosRaw.toLocaleString()}`, 78, y, { align: 'right' });
            y += 5;
        }

        y += 2;
        doc.setFontSize(11);
        doc.text("TOTAL:", 45, y, { align: 'right' });
        doc.text(`$${resumen.totalFinal}`, 78, y, { align: 'right' });
        y += 10;

        // Footer
        doc.setFontSize(8);
        doc.text("¡ GRACIAS POR ELEGIRNOS !", centerX, y, { align: "center" });
        y += 5;
        doc.setFontSize(6.5);
        doc.text("te esperamos en nuestra web: www.fedecell.com", centerX, y, { align: "center" });

        // --- NUEVO: DESCARGAR PDF AUTOMÁTICAMENTE ---
        const fileName = `Venta_${transaccionId.substring(0, 8).toUpperCase()}.pdf`;
        doc.save(fileName);
        // --------------------------------------------
    };

    const handleGenerarVenta = async () => {
        setEstadoTransaccion('loading');
        let logs = `MODO: ${medioPago.toUpperCase()}`;
        if (ultimosCuatro) logs += ` | TARJETA: ****${ultimosCuatro}`;
        if (ultimosCuatro) logs += ` | TARJETA: ****${ultimosCuatro}`;
        if (nombreBanco) logs += ` | BANCO: ${nombreBanco} (${selectedCuotas} ctas @ ${selectedInterest}%)`;
        if (medioPago === 'mixto') {
            const parts = [];
            if (mixto.efectivo) parts.push(`${mixto.efectivo}(EFECTIVO)`);
            if (mixto.transferencia) parts.push(`${mixto.transferencia}(TRANSF)`);
            if (mixto.debito) parts.push(`${mixto.debito}(DEBITO)`);
            logs = `MIXTO: ${parts.join(' + ')}`;
        }

        const itemsCarrito = Object.values(carrito);

        const payload = {
            productos: itemsCarrito.map(({ item, cantidad, tipo, variant }) => {
                let nombreFinal = tipo === 'producto' ? item.nombre : `ENC: ${item.descripcionTrabajo}`;

                // AJUSTE NOMBRE POR VARIANTE
                if (variant) {
                    const colorName = translateColor(variant.color);
                    nombreFinal += ` (${colorName} ${variant.almacenamiento})`;
                }

                // PRECIOS
                const precioVentaFinal = (tipo === 'producto' && variant) ? variant.precioAlPublico : (tipo === 'producto' ? item.precioVenta : item.montoTotal);
                const costoFinal = (tipo === 'producto' && variant) ? variant.costoDeCompra : (tipo === 'producto' ? item.precioCompra : 0);

                return {
                    id: item.id,
                    nombre: nombreFinal,
                    marca: tipo === 'producto' ? item.marca : 'SERVICIO',
                    categoria: tipo === 'producto' ? item.categoria : 'SERVICIO',
                    proveedor: tipo === 'producto' ? item.proveedor : 'NODO_REPARACION',
                    cantidad,
                    monto: Number(precioVentaFinal),
                    precioCompra: Number(costoFinal),
                    cliente: opcionCliente || 'Consumidor Final',
                    metodo_pago: medioPago,
                    fecha: new Date().toISOString().split('T')[0],
                    // CAMPOS PARA DESCUENTO DE STOCK
                    color: variant ? variant.color : null,
                    almacenamiento: variant ? variant.almacenamiento : null
                };
            }),
            montoTotal: Number(resumenVenta.montoTotalRaw),
            medioPago,
            origenDeVenta: 'LocalFisico',
            descuentos: parseFloat(resumenVenta.descuentosRaw.toFixed(2)),
            opcion1: opcionCliente ? `Cliente: ${opcionCliente}` : 'Consumidor Final',
            opcion2: logs,
            detalles_pago: medioPago === 'efectivo'
                ? { billetes: desgloseBilletes, vuelto: desgloseVuelto } : (medioPago === 'mixto' ? {
                    mixto: {
                        ...mixto,
                        credito_info: {
                            banco: mixtoCreditoInfo.banco, cuotas: mixtoCreditoInfo.cuotas, interes_monto: mixtoInteres.monto, interes_porcentaje: mixtoInteres.porcentaje,
                            tarjeta_digitos: parseFloat(mixto.credito) > 0 ? ultimosCuatro : null
                        }
                    }
                } : null), tarjeta_digitos: ultimosCuatro || null
        };

        try {
            const res = await axios.post(`${API_BASE}/pagoCaja/pagos`, payload);

            if (res.status === 201) {
                const fechaHoy = new Date().toISOString().split('T')[0];
                const idTransaccion = Date.now().toString(36) + Math.random().toString(36).substr(2); // ID ÚNICO

                const promesasBalance = [];

                if (medioPago === 'mixto') {
                    const totalPagadoSinInteres = (parseFloat(mixto.efectivo) || 0) + (parseFloat(mixto.transferencia) || 0) + (parseFloat(mixto.debito) || 0) + (parseFloat(mixto.credito) || 0);
                    const totalCostoProductos = itemsCarrito.reduce((acc, { item, cantidad, tipo, variant }) => {
                        const costo = (tipo === 'producto' && variant) ? variant.costoDeCompra : (tipo === 'producto' ? item.precioCompra : 0);
                        return acc + (Number(costo) * cantidad);
                    }, 0);
                    const productosDesc = itemsCarrito.map(c => {
                        const nombreBase = c.tipo === 'producto' ? c.item.nombre : (c.item.modeloEquipo || c.item.nombreDispositivo);
                        return `${c.cantidad}x ${nombreBase}`;
                    }).join(', ');

                    const crearEntradaBalance = (monto, metodo, detalles = null) => {
                        if (monto > 0) {
                            const ratio = monto / totalPagadoSinInteres;
                            promesasBalance.push(axios.post(`${API_BASE}/balanceMensual/CreaBalanceMensual`, {
                                producto: `VENTA MIXTA: ${productosDesc}`,
                                monto: monto,
                                cantidad: 1,
                                metodo_pago: metodo,
                                detalles_pago: detalles,
                                fecha: fechaHoy,
                                cliente: opcionCliente || 'Consumidor Final',
                                id_transaccion: idTransaccion,
                                precioCompra: totalCostoProductos * ratio,
                                origenDeVenta: 'LocalFisico',
                                marca: 'MIXTO',
                                categoria: 'VENTA',
                                tarjeta_digitos: ['debito', 'tarjeta_credito'].includes(metodo) || metodo.startsWith('credito_') ? ultimosCuatro : null
                            }));
                        }
                    };

                    crearEntradaBalance(parseFloat(mixto.efectivo) || 0, 'efectivo', { billetes: desgloseBilletes, vuelto: desgloseVuelto });
                    crearEntradaBalance(parseFloat(mixto.transferencia) || 0, 'transferencia');
                    crearEntradaBalance(parseFloat(mixto.debito) || 0, 'debito');

                    if (parseFloat(mixto.credito) > 0) {
                        const metodoPagoCredito = `credito_${mixtoCreditoInfo.cuotas}`;
                        crearEntradaBalance(
                            parseFloat(mixto.credito) || 0,
                            metodoPagoCredito,
                            { // Detalles para el balance
                                banco: mixtoCreditoInfo.banco,
                                cuotas: mixtoCreditoInfo.cuotas
                            });

                        if (mixtoInteres.monto > 0) {
                            promesasBalance.push(axios.post(`${API_BASE}/balanceMensual/CreaBalanceMensual`, {
                                producto: `RECARGO FINANCIERO MIXTO (${mixtoCreditoInfo.banco} - ${mixtoCreditoInfo.cuotas} Ctas)`,
                                monto: mixtoInteres.monto,
                                cantidad: 1,
                                metodo_pago: metodoPagoCredito,
                                tarjeta_digitos: ultimosCuatro || null,
                                fecha: fechaHoy,
                                cliente: opcionCliente || 'Consumidor Final',
                                id_transaccion: idTransaccion,
                                precioCompra: 0,
                                origenDeVenta: 'LocalFisico',
                                marca: 'FINANCIERO',
                                categoria: 'INTERES',
                            }));
                        }
                    }
                } else {
                    // Lógica original para pagos no mixtos
                    itemsCarrito.forEach(({ item, cantidad, tipo, variant }) => {
                        let nombreFinal = tipo === 'producto' ? item.nombre : `ENC: ${item.descripcionTrabajo} (Cliente: ${item.nombreCliente || item.cliente || 'S/D'})`;
                        if (variant) {
                            const colorName = translateColor(variant.color);
                            nombreFinal += ` (${colorName} ${variant.almacenamiento})`;
                        }
                        const precioUnitario = Number((tipo === 'producto' && variant) ? variant.precioAlPublico : (tipo === 'producto' ? item.precioVenta : item.montoTotal)) || 0;
                        const precioCosto = Number((tipo === 'producto' && variant) ? variant.costoDeCompra : (tipo === 'producto' ? item.precioCompra : 0)) || 0;

                        promesasBalance.push(axios.post(`${API_BASE}/balanceMensual/CreaBalanceMensual`, {
                            producto: nombreFinal,
                            monto: Number(precioUnitario * cantidad),
                            cantidad: Number(cantidad),
                            metodo_pago: medioPago,
                            detalles_pago: medioPago === 'efectivo' ? { billetes: desgloseBilletes, vuelto: desgloseVuelto } : null,
                            fecha: fechaHoy,
                            cliente: opcionCliente || 'Consumidor Final',
                            id_transaccion: idTransaccion,
                            precioCompra: precioCosto,
                            origenDeVenta: 'LocalFisico',
                            marca: tipo === 'producto' ? item.marca : 'SERVICIO',
                            categoria: tipo === 'producto' ? item.categoria : 'SERVICIO',
                            proveedor: tipo === 'producto' ? item.proveedor : 'NODO_REPARACION',
                            tarjeta_digitos: ultimosCuatro || null
                        }));
                    });

                    if (resumenVenta.interesRaw > 0) {
                        promesasBalance.push(axios.post(`${API_BASE}/balanceMensual/CreaBalanceMensual`, {
                            producto: `RECARGO FINANCIERO (${nombreBanco} - ${selectedCuotas} Ctas)`,
                            monto: Number(resumenVenta.interesRaw),
                            cantidad: 1,
                            metodo_pago: medioPago,
                            fecha: fechaHoy,
                            cliente: opcionCliente || 'Consumidor Final',
                            id_transaccion: idTransaccion,
                            origenDeVenta: 'LocalFisico',
                            precioCompra: 0,
                            tarjeta_digitos: ultimosCuatro || null
                        }));
                    }
                }

                // --- NUEVO: ACTUALIZAR ESTADO DE REPARACIONES A 'ENTREGADO' ---
                const promesasStatus = itemsCarrito
                    .filter(i => i.tipo === 'servicio')
                    .map(i => axios.patch(`${API_BASE}/encargos/${i.item.id}/status`, { 
                        estado: 'Entregado',
                        montoTotal: i.item.montoTotal 
                    }));

                await Promise.all([...promesasBalance, ...promesasStatus]);
                // ------------------------------------------------

                setEstadoTransaccion('success');
                // --- GENERAR PDF ---
                generarFacturaPDF(itemsCarrito, resumenVenta, medioPago, opcionCliente, idTransaccion, fechaHoy);

                setCarrito({});
                setDesgloseBilletes({ 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 });
                setDesgloseVuelto({ 20000: 0, 10000: 0, 5000: 0, 2000: 0, 1000: 0, 500: 0, 200: 0, 100: 0 });
                fetchData();
                obtenerHistorialVentas();
                setTimeout(() => setEstadoTransaccion(null), 3000);
            }
        } catch (e) {
            console.error("ERROR_TRANSACCION_COMPLETA", e);
            setEstadoTransaccion('error');
        }
    };

    useEffect(() => {
        setMontoFinalManual(null);
    }, [carrito, descuentoGlobal, tipoDescuento, selectedInterest]);

    const resumenVenta = useMemo(() => {
        let neto = 0;
        Object.values(carrito).forEach(c => {
            const p = c.tipo === 'producto' ? (c.variant ? c.variant.precioAlPublico : c.item.precioVenta) : c.item.montoTotal;
            neto += (Number(p) || 0) * c.cantidad;
        });
        const montoDescAplicado = tipoDescuento === 'porcentaje' ? neto * (Number(descuentoGlobal) / 100) : Number(descuentoGlobal);
        let subtotal = Math.max(0, neto - montoDescAplicado);

        // Calculate Interest
        const montoInteres = (selectedInterest > 0) ? subtotal * (selectedInterest / 100) : 0;
        const totalCalculado = subtotal + montoInteres;

        const montoInteresMixto = medioPago === 'mixto' ? mixtoInteres.monto : 0;
        const esManual = montoFinalManual !== null;
        const montoTotalFinal = esManual ? parseFloat(montoFinalManual) || 0 : totalCalculado + montoInteresMixto;

        const descuentoFinal = esManual ? (neto + montoInteres + montoInteresMixto) - montoTotalFinal : montoDescAplicado;

        const totalBilletesValue = Object.entries(desgloseBilletes).reduce((acc, [den, cant]) => acc + (Number(den) * (Number(cant) || 0)), 0);
        const totalVueltoValue = Object.entries(desgloseVuelto).reduce((acc, [den, cant]) => acc + (Number(den) * (Number(cant) || 0)), 0);

        return {
            totalFinal: montoTotalFinal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            montoTotalRaw: montoTotalFinal,
            descuentosRaw: descuentoFinal,
            interesRaw: montoInteres + montoInteresMixto,
            itemsSeleccionados: Object.keys(carrito).length,
            detallesBilletes: desgloseBilletes,
            setDetalleBillete: (den, cant) => setDesgloseBilletes(prev => ({ ...prev, [den]: cant })),
            totalBilletes: totalBilletesValue,
            detallesVuelto: desgloseVuelto,
            setDetalleVuelto: (den, cant) => setDesgloseVuelto(prev => ({ ...prev, [den]: cant })),
            totalVuelto: totalVueltoValue,
            arqueoCaja
        };
    }, [carrito, descuentoGlobal, tipoDescuento, selectedInterest, desgloseBilletes, desgloseVuelto, arqueoCaja, montoFinalManual, medioPago, mixtoInteres.monto]);

    const productosFiltrados = productosDisponibles;

    const serviciosFiltrados = useMemo(() => {
        return encargosDisponibles.filter(i => {
            const query = busquedaServicios.toLowerCase();
            const equipoMatch = (i.descripcionTrabajo || '').toLowerCase().includes(query);
            const clienteMatch = (i.nombreCliente || '').toLowerCase().includes(query);
            const idMatch = (i.id || '').toString().includes(query);
            const ordenMatch = (i.numeroOrden || '').toString().includes(query);
            const dniMatch = (i.dni || '').toLowerCase().includes(query);
            return equipoMatch || clienteMatch || idMatch || ordenMatch || dniMatch;
        });
    }, [encargosDisponibles, busquedaServicios]);

    const historialFiltrado = useMemo(() => {
        return (historialVentas || []).filter(i => {
            const query = busquedaHistorial.toLowerCase();
            const clientMatch = (i.opcion1 || '').toLowerCase().includes(query);
            const prodMatch = (i.productos || []).some(p => (p.nombre || '').toLowerCase().includes(query));
            return clientMatch || prodMatch;
        });
    }, [historialVentas, busquedaHistorial]);

    return (
        <div className=" min-h-screen mt-[-100px] bg-white text-black p-2 md:p-10 fedecell-body" style={{ zoom: '0.75' }}>
            <style>{`.fedecell-title { font-family: ${FONTS.titulo}; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; }.fedecell-tech { font-family: ${FONTS.tech}; }.orange-line { width: 80px; height: 4px; background: #000; margin-top: 10px; }.glass-container { background: rgba(0,0,0,0.02); backdrop-filter: blur(15px); }.custom-scrollbar::-webkit-scrollbar { width: 4px; }.custom-scrollbar::-webkit-scrollbar-thumb { background: #000; border-radius: 10px; }`}</style>



            <nav className="ml-[50px] flex gap-6 md:gap-10 mb-10 border-b border-white/5 overflow-x-auto no-scrollbar pb-1">
                {['productos', 'servicios', 'historial'].map(v => (
                    <button key={v} onClick={() => setVistaActual(v)} className={`pb-4 fedecell-title text-xs tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${vistaActual === v ? 'text-black border-b-2 border-black' : 'text-black/40 hover:text-black'}`}>
                        {v === 'historial' ? 'HISTORIAL DE VENTAS RECIENTES' : v.toUpperCase()}
                    </button>
                ))}
            </nav>

            <div className={`grid grid-cols-1 ${vistaActual === 'historial' ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-10`}>
                <div className={vistaActual === 'historial' ? 'h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar pr-2' : 'lg:col-span-8 h-[calc(100vh-60px)] overflow-y-auto custom-scrollbar pr-2'}>
                    {vistaActual === 'productos' && (
                        <div className="sticky top-0 z-20 bg-white pt-2 pb-6 mb-4 group">
                            <FiSearch className="absolute left-4 top-6 text-black/30 group-focus-within:text-black transition-colors" />
                            <input
                                type="text"
                                placeholder="BUSCAR_PRODUCTO..."
                                value={busquedaProductos}
                                onChange={e => setBusquedaProductos(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setDebouncedBusquedaProductos(busquedaProductos);
                                        setPage(1);
                                    }
                                }}
                                className="w-full bg-black/5 border border-black/10 p-4 pl-12 fedecell-tech text-xs outline-none focus:border-black transition-all placeholder:text-black/30 text-black"
                            />
                        </div>
                    )}
                    {vistaActual === 'servicios' && (
                        <div className="sticky top-0 z-20 bg-white pt-2 pb-6 mb-4 group">
                            <FiSearch className="absolute left-4 top-6 text-black/30 group-focus-within:text-black transition-colors" />
                            <input type="text" placeholder="BUSCAR SERVICIO (ID, CLIENTE, EQUIPO)..." value={busquedaServicios} onChange={e => setBusquedaServicios(e.target.value)} className="w-full bg-black/5 border border-black/10 p-4 pl-12 fedecell-tech text-xs outline-none focus:border-black transition-all placeholder:text-black/30 text-black" />
                        </div>
                    )}
                    {vistaActual === 'historial' && (
                        <div className="mb-8 space-y-4">
                            <div className="flex flex-wrap items-end gap-3 p-4 bg-black/5 border border-black/10">
                                <div className="flex flex-col">
                                    <span className="font-['Montserrat'] text-[11px] text-black font-black uppercase tracking-widest mb-1">DESDE</span>
                                    <input
                                        type="date"
                                        value={histStartDate}
                                        onChange={e => setHistStartDate(e.target.value)}
                                        className="bg-white border border-black/10 p-2 fedecell-tech text-xs text-black outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-['Montserrat'] text-[11px] text-black font-black uppercase tracking-widest mb-1">HASTA</span>
                                    <input
                                        type="date"
                                        value={histEndDate}
                                        onChange={e => setHistEndDate(e.target.value)}
                                        className="bg-white border border-black/10 p-2 fedecell-tech text-xs text-black outline-none focus:border-black transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => obtenerHistorialVentas(histStartDate, histEndDate)}
                                    className="px-4 py-2 bg-black text-white fedecell-title text-[10px] tracking-widest hover:bg-neutral-800 transition-colors"
                                >
                                    ACTUALIZAR
                                </button>
                                <span className="fedecell-tech text-[9px] text-black self-end pb-2">{historialVentas.length} registros</span>
                            </div>
                            <div className="relative group">
                                <FiSearch className="absolute left-4 top-4 text-black/30 group-focus-within:text-black transition-colors" />
                                <input type="text" placeholder="BUSCAR EN HISTORIAL (CLIENTE, PRODUCTO)..." value={busquedaHistorial} onChange={e => setBusquedaHistorial(e.target.value)} className="w-full bg-black/5 border border-black/10 p-4 pl-12 fedecell-tech text-xs outline-none focus:border-black transition-all placeholder:text-black/30 text-black" />
                            </div>
                        </div>
                    )}

                    {vistaActual === 'productos' && (
                        <div className="glass-container border-2 border-black overflow-x-auto custom-scrollbar bg-white shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-black/10 bg-black/5">
                                        <th className="p-4 fedecell-title text-[10px] text-black">IMAGEN</th>
                                        <th className="p-4 fedecell-title text-[10px] text-black">PRODUCTO</th>
                                        <th className="p-4 fedecell-title text-[10px] text-black text-right">PRECIO PÚBLICO</th>
                                        <th className="p-4 fedecell-title text-[10px] text-black text-center">STOCK</th>
                                        <th className="p-4 fedecell-title text-[10px] text-black text-center">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="fedecell-tech text-[11px]">
                                    {productosFiltrados.filter(i => i.variantes?.[0]?.precioAlPublico).map(item => {
                                        const totalStock = item.variantes?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || 0;
                                        const isInCart = Object.values(carrito).some(cartItem => cartItem.item.id === item.id);

                                        return (
                                            <tr
                                                key={item.id}
                                                onClick={totalStock > 0 ? () => handleToggleCarrito(item, 'producto') : undefined}
                                                className={`border-b-2 transition-all duration-300 ${totalStock > 0 ? 'hover:bg-neutral-50 cursor-pointer active:scale-[0.99] border-black/5' : 'bg-red-50 opacity-80 cursor-not-allowed border-red-100'} ${isInCart ? 'bg-orange-500/5 border-orange-500/10' : ''}`}
                                                title={totalStock > 0 ? "Clic para agregar al carrito" : "Sin stock"}
                                            >
                                                <td className="p-2 align-middle">
                                                    <div className="w-24 h-24 bg-white flex items-center justify-center overflow-hidden rounded-sm border border-black/5">
                                                        {item.imagenes && item.imagenes.length > 0 ? (
                                                            <img src={optimizeImage(item.imagenes[0], 200)} loading="lazy" alt={item.nombre} className="w-full h-full object-contain" />
                                                        ) : (
                                                            <FiImage className="text-zinc-300" size={32} />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-6 align-middle">
                                                    <span className="text-[12px] text-black/50 uppercase font-black tracking-widest line-clamp-1">{item.marca}</span>
                                                    <h4 className="font-black text-lg md:text-xl uppercase text-black leading-none mb-1">{item.nombre}</h4>
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter">{item.categoria}</span>
                                                </td>
                                                <td className="p-4 text-right font-black text-3xl text-black align-middle">
                                                    ${Number(item.variantes?.[0]?.precioAlPublico).toLocaleString()}
                                                </td>
                                                <td className="p-4 text-center align-middle">
                                                    <div className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${totalStock <= item.alerta ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                        {totalStock}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center align-middle">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row click from firing
                                                            setInspectedProduct(item);
                                                        }}
                                                        className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors"
                                                        title="Ver más detalles"
                                                    >
                                                        <FiInfo className="text-black" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {hasMoreProducts && (
                                <div className="p-4 flex justify-center border-t border-black/10">
                                    <button
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={isLoadingMoreProducts}
                                        className="px-6 py-2 bg-black/5 hover:bg-black/10 text-black fedecell-tech text-[10px] uppercase font-bold tracking-widest transition-all rounded-full"
                                    >
                                        {isLoadingMoreProducts ? 'CARGANDO...' : 'CARGAR MÁS PRODUCTOS'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {vistaActual === 'servicios' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {serviciosFiltrados.map(item => {
                                const isFinalizado = item.estado === 'Finalizado';
                                const ESTADO_COLOR = {
                                    'Recibido': 'text-orange-500',
                                    'En Reparación': 'text-blue-500',
                                    'Finalizado': 'text-green-500',
                                    'Entregado': 'text-zinc-400',
                                };
                                const estadoColorClass = ESTADO_COLOR[item.estado] || 'text-zinc-400';

                                return (
                                    <motion.div
                                        whileHover={{ y: -5 }}
                                        key={item.id}
                                        onClick={() => handleToggleCarrito(item, 'servicio')}
                                        className={`p-6 bg-white border-2 transition-all duration-500 rounded-sm shadow-sm ${carrito[item.id] ? 'border-orange-500 shadow-xl' : 'border-black/10'}`}
                                        title={'Click para agregar al carrito y cobrar'}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-black text-base md:text-lg uppercase text-black leading-tight">{item.descripcionTrabajo}</h4>
                                            <div className={`text-[10px] fedecell-tech font-black px-3 py-1.5 border-2 rounded-sm ${estadoColorClass} ${estadoColorClass.replace('text-', 'bg-').replace('500', '500/10')} ${estadoColorClass.replace('text-', 'border-').replace('500', '500/20')}`}>
                                                {item.estado.toUpperCase()}
                                            </div>
                                        </div>
                                        <p className="text-[12px] text-zinc-600 fedecell-tech mb-8 tracking-tighter uppercase font-bold">CLIENTE: {item.nombreCliente} | DNI: {item.dni || 'N/A'}</p>
                                        <div className="flex justify-between items-end">
                                            <span className="fedecell-tech text-2xl font-black text-black">${item.montoTotal.toLocaleString()}</span>
                                            <span className="text-[11px] text-zinc-500 fedecell-tech tracking-tighter uppercase font-bold">ORDEN: #{item.numeroOrden}</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {vistaActual === 'historial' && <HistorialVentasTech historial={historialFiltrado} cargando={cargandoHistorial} error={errorHistorial} />}
                </div>

                {vistaActual !== 'historial' && (
                    <div className="lg:col-span-4">
                        <CarritoYPago
                            carrito={carrito} resumenVenta={resumenVenta} estadoTransaccion={estadoTransaccion}
                            descuentoGlobal={descuentoGlobal} setDescuentoGlobal={setDescuentoGlobal}
                            tipoDescuento={tipoDescuento} setTipoDescuento={setTipoDescuento}
                            medioPago={medioPago} setMedioPago={setMedioPago}
                            ultimosCuatro={ultimosCuatro} setUltimosCuatro={setUltimosCuatro}
                            nombreBanco={nombreBanco} setNombreBanco={setNombreBanco}
                            mixto={mixto} setMixto={setMixto}
                            opcionCliente={opcionCliente} setOpcionCliente={setOpcionCliente}
                            handleGenerarVenta={handleGenerarVenta}
                            handleCantidadChange={handleCantidadChange}
                            handleRemoveItem={handleRemoveItem}
                            montoRecibido={montoRecibido} setMontoRecibido={setMontoRecibido}
                            bankRates={bankRates}
                            selectedCuotas={selectedCuotas} setSelectedCuotas={setSelectedCuotas}
                            setSelectedInterest={setSelectedInterest} mixtoCreditoInfo={mixtoCreditoInfo}
                            setMixtoCreditoInfo={setMixtoCreditoInfo} mixtoInteres={mixtoInteres}
                            montoFinalManual={montoFinalManual}
                            setMontoFinalManual={setMontoFinalManual}
                            setInspectedProduct={setInspectedProduct}
                        />
                    </div>
                )}
            </div>
            {
                showVariantModal && (
                    <VariantSelectorModal
                        product={selectedProductForVariant}
                        onClose={() => { setShowVariantModal(false); setSelectedProductForVariant(null); }}
                        onSelect={(v) => handleToggleCarrito(selectedProductForVariant, 'producto', v)}
                    />
                )
            }
            {
                inspectedProduct && (
                    <ProductInfoModal
                        productData={inspectedProduct}
                        onClose={() => setInspectedProduct(null)}
                    />
                )
            }
            {/* Modal de Precio de Servicio */}
            <AnimatePresence>
                {servicePricingItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white border-4 border-black p-8 md:p-12 max-w-lg w-full shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]"
                        >
                            <h2 className="font-['Montserrat'] font-[900] text-2xl md:text-3xl uppercase tracking-tighter text-black mb-2">
                                ASIGNAR PRECIO
                            </h2>
                            <p className="font-['JetBrains_Mono'] text-[10px] md:text-xs text-black/50 uppercase tracking-widest mb-8 border-b border-black/10 pb-4">
                                {servicePricingItem.modeloEquipo || servicePricingItem.nombreDispositivo} | ORD: #{servicePricingItem.numeroOrden}
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="font-['Montserrat'] text-[11px] text-black font-black uppercase tracking-widest mb-2 block">MONTO A COBRAR ($)</label>
                                    <input
                                        autoFocus
                                        type="number"
                                        value={customPrice}
                                        onChange={(e) => setCustomPrice(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const finalItem = { ...servicePricingItem, montoAPagar: parseFloat(customPrice) || 0 };
                                                setCarrito(prev => ({ ...prev, [finalItem.id]: { item: finalItem, cantidad: 1, tipo: 'servicio' } }));
                                                setServicePricingItem(null);
                                            }
                                        }}
                                        className="w-full bg-neutral-50 border-2 border-black p-5 text-2xl font-black text-black outline-none focus:bg-white transition-all"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => setServicePricingItem(null)}
                                        className="py-4 bg-white border-2 border-black text-black font-['Montserrat'] font-black uppercase text-xs tracking-widest hover:bg-black/5 transition-all"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        onClick={() => {
                                            const finalItem = { ...servicePricingItem, montoTotal: parseFloat(customPrice) || 0 };
                                            setCarrito(prev => ({ ...prev, [finalItem.id]: { item: finalItem, cantidad: 1, tipo: 'servicio' } }));
                                            setServicePricingItem(null);
                                        }}
                                        className="py-4 bg-black text-white font-['Montserrat'] font-black uppercase text-xs tracking-widest hover:bg-neutral-800 transition-all shadow-lg"
                                    >
                                        CONFIRMAR
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default ModuloVentas;