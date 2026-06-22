import React, { useState, useEffect, useMemo } from 'react';
import {
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  TrashIcon,
  ChartBarIcon,
  CalendarIcon,
  Square3Stack3DIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  BanknotesIcon,
  PencilIcon
} from '@heroicons/react/24/solid';
import ProductInfoModal from '../ProductInfoModal';
import EditBalanceModal from './EditBalanceModal';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN TÉCNICA Y ESTILOS BLANCO Y NEGRO ---

const API_URL = import.meta.env.VITE_API_URL;
const API_BASE_URL = `${API_URL}/balanceMensual`;
const API_ECOMMERCE_URL = `${API_URL}/ecommerce/pedidos`;

const styles = {
  title: "font-['Inter'] font-[900] tracking-tighter uppercase text-black",
  body: "font-['Inter'] font-[500] text-gray-700",
  tech: "font-['Inter'] font-[600] text-black",
  glass: "bg-white border border-gray-200 shadow-2xl rounded-xl overflow-hidden backdrop-blur-md",
  input: "w-full bg-white/40 border border-gray-200 p-4 text-black bw-body focus:border-black outline-none transition-all placeholder:text-zinc-700 text-sm rounded-lg",
  statCard: "bg-gray-50 border border-gray-200 p-6 rounded-xl hover:border-gray-300 transition-all group",
  tableHeader: "px-8 py-5 text-left text-[10px] font-black text-black uppercase tracking-[0.2em] bg-gray-50",
  tableRow: "border-b border-gray-200 hover:bg-white/[0.02] transition-colors"
};

const paymentLabels = {
  efectivo: 'EFECTIVO (CAJA)',
  debito: 'TARJETA DE DÉBITO',
  transferencia: 'TRANSFERENCIA',
  credito_1: 'CRÉDITO 1 CUOTA',
  credito_2: 'CRÉDITO 2 CUOTAS',
  credito_3: 'CRÉDITO 3 CUOTAS',
  credito_4: 'CRÉDITO 4 CUOTAS',
  credito_5: 'CRÉDITO 5 CUOTAS',
  credito_6: 'CRÉDITO 6 CUOTAS',
  mixto: 'PAGOS MIXTOS',
  mercadopago: 'MERCADO PAGO'
};

const PREDEFINED_COLORS = [
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

const getColorName = (input) => {
  if (!input) return '';
  const hexMatch = input.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g);
  if (hexMatch) {
    let result = input;
    hexMatch.forEach(hex => {
      const found = PREDEFINED_COLORS.find(c => c.code.toLowerCase() === hex.toLowerCase());
      if (found) result = result.replace(hex, found.name);
    });
    return result;
  }
  return input;
};

const originLabels = {
  ecommerce: '🛒 E-COMMERCE',
  LocalFisico: '🏪 LOCAL FÍSICO',
  Revendedor: '🤝 REVENDEDOR',
  'n/a': 'S/D'
};

const PaymentsSection = ({ payments, productsDetail, allEntries: propEntries, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceData, setBalanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [inspectedProduct, setInspectedProduct] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalY, setModalY] = useState(window.scrollY);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    // Default to a wider range (3 months back) to catch more data by default
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    return new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1);
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth() + 1, 0);
  });

  // --- Lógica de Conexión ---
  const fetchBalance = async () => {
    if (propEntries && propEntries.length > 0) {
      console.log("SECCION_PAGOS: USING_PROPS_DATA", propEntries.length);
      setBalanceData(propEntries);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Las APIs no soportan rango, traemos todo y filtramos en el front.
      let resBalance = [];
      let resEcommerce = [];

      try {
        const r = await fetch(`${API_BASE_URL}/ObtenBalanceMensual`);
        if (r.ok) {
          resBalance = await r.json();
          console.log("FETCH_BALANCE_SUCCESS:", resBalance.length, "items");
        } else {
          console.error("FETCH_BALANCE_ERROR:", r.status);
        }
      } catch (e) {
        console.error("FETCH_BALANCE_EXCEPTION:", e);
      }

      try {
        const r = await fetch(API_ECOMMERCE_URL);
        if (r.ok) {
          resEcommerce = await r.json();
          console.log("FETCH_ECOMMERCE_SUCCESS:", resEcommerce.length, "items");
        } else {
          console.error("FETCH_ECOMMERCE_ERROR:", r.status);
        }
      } catch (e) {
        console.error("FETCH_ECOMMERCE_EXCEPTION:", e);
      }

      // Mapear ventas de Ecommerce al formato del Balance
      const ecommerceData = (resEcommerce || []).flatMap(order =>
        (order.items || []).map((item, idx) => ({
          id: `ECOM-${order.id}-${idx}`,
          id_transaccion: `ECOM_ORD_${order.id}`,
          cliente: order.name || 'CLIENTE WEB',
          fecha: order.createdAt,
          createdAt: order.createdAt, // Unificamos campo para ordenamiento
          origenDeVenta: 'ECOMMERCE',
          monto: (parseFloat(item.unit_price) || 0) * (parseInt(item.quantity) || 1),
          producto: item.title,
          marca: 'GENERICO',
          categoria: 'ECOMMERCE',
          metodo_pago: 'mercadopago', // Asumimos MercadoPago para online
          cantidad: parseInt(item.quantity) || 1
        }))
      );

      // Unificar y ordenar estrictamente por fecha (más reciente primero)
      const combinedData = [...(Array.isArray(resBalance) ? resBalance : []), ...ecommerceData].sort((a, b) => {
        const dateA = new Date(a.createdAt || a.fecha).getTime() || 0;
        const dateB = new Date(b.createdAt || b.fecha).getTime() || 0;
        return dateB - dateA;
      });

      console.log("COMBINED_DATA_TOTAL:", combinedData.length);
      setBalanceData(combinedData);
    } catch (error) {
      console.error("LOG_ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿ELIMINAR ESTE REGISTRO DEL BALANCE?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/BorraBalanceMensual/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        if (onUpdate) {
          onUpdate();
        } else {
          fetchBalance();
        }
      }
    } catch (error) {
      console.error("DELETE_ERROR:", error);
    }
  };

  const handleEdit = (entry, e) => {
    setModalY(window.scrollY);
    setEditingEntry(entry);
  };

  useEffect(() => { fetchBalance(); }, [propEntries]);

  // --- Filtrado por Rango de Fechas ---
  const dataInRange = useMemo(() => {
    if (!balanceData.length) return [];
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return balanceData.filter(item => {
      const field = item.fecha || item.createdAt;
      if (!field) return true; // Si no hay fecha, lo mostramos para no perder datos
      const itemDate = new Date(field);
      return itemDate >= start && itemDate <= end;
    });
  }, [balanceData, startDate, endDate]);

  useEffect(() => {
    console.log("DATA_IN_RANGE:", dataInRange);
  }, [dataInRange]);

  // --- Procesamiento de Datos (Kpis) ---
  const stats = useMemo(() => {
    const total = dataInRange.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
    // 'hoy' se calcula sobre el total de datos, no sobre el rango.
    const hoy = balanceData.filter(item => {
      const date = item.createdAt ? new Date(item.createdAt) : new Date(item.fecha);
      return date.toDateString() === new Date().toDateString();
    }).reduce((acc, curr) => acc + parseFloat(curr.monto), 0);

    const totalExtracciones = dataInRange
      .filter(item => parseFloat(item.monto) < 0)
      .reduce((acc, curr) => acc + Math.abs(parseFloat(curr.monto)), 0);

    const totalByMethod = dataInRange.reduce((acc, curr) => {
      const method = curr.metodo_pago;
      const amount = parseFloat(curr.monto) || 0;

      if (method === 'mixto' && curr.detalles_pago?.mixto) {
        const mixto = curr.detalles_pago.mixto;
        if (mixto.efectivo) acc['efectivo'] = (acc['efectivo'] || 0) + (parseFloat(mixto.efectivo) || 0);
        if (mixto.transferencia) acc['transferencia'] = (acc['transferencia'] || 0) + (parseFloat(mixto.transferencia) || 0);
        if (mixto.debito) acc['debito'] = (acc['debito'] || 0) + (parseFloat(mixto.debito) || 0);

        // También acumulamos en 'mixto' para ver el volumen total operado de esta forma
        acc['mixto'] = (acc['mixto'] || 0) + amount;
      } else {
        acc[method] = (acc[method] || 0) + amount;
      }

      return acc;
    }, {});

    return { total, hoy, totalByMethod, totalExtracciones };
  }, [balanceData, dataInRange]);

  const filteredEntries = dataInRange.filter(item => {
    const matchesSearch = (item.producto || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch2 = (item.cliente || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'EXTRACCIONES'
      ? parseFloat(item.monto) < 0
      : selectedCategory ? item.metodo_pago === selectedCategory : true;
    return (matchesSearch || matchesSearch2) && matchesCategory;
  });

  return (
    <div className={`w-full space-y-6 md:space-y-10 py-6 px-4 md:px-0 ${styles.body}`}>

      {/* 1. DASHBOARD DE CABECERA (Estético y Claro) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <div className={`${styles.statCard} p-4 md:p-6 overflow-hidden`}>
          <p className="bw-tech text-[9px] md:text-[10px] tracking-widest text-gray-500 uppercase mb-2 break-words">Balance Neto Rango</p>
          <h4 className={`bw-title text-lg md:text-2xl xl:text-3xl break-words ${stats.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>${stats.total.toLocaleString('es-AR')}</h4>
        </div>
        <div className={`${styles.statCard} p-4 md:p-6 overflow-hidden`}>
          <p className="bw-tech text-[9px] md:text-[10px] tracking-widest text-gray-600 uppercase mb-2 break-words">Ventas Registradas Hoy</p>
          <h4 className="bw-title text-lg md:text-2xl xl:text-3xl break-words text-black">${stats.hoy.toLocaleString('es-AR')}</h4>
        </div>
        <div className={`${styles.statCard} border-red-500/20 p-4 md:p-6 overflow-hidden`}>
          <p className="bw-tech text-[9px] md:text-[10px] tracking-widest text-red-500 uppercase mb-2 break-words">Extracciones en Rango</p>
          <h4 className="bw-title text-lg md:text-2xl xl:text-3xl break-words text-red-500">-${stats.totalExtracciones.toLocaleString('es-AR')}</h4>
        </div>
        <div className={`${styles.statCard} p-4 md:p-6 overflow-hidden`}>
          <p className="bw-tech text-[9px] md:text-[10px] tracking-widest text-gray-500 uppercase mb-2 break-words">Operaciones en Rango</p>
          <h4 className="bw-title text-lg md:text-2xl xl:text-3xl break-words text-black">{dataInRange.length} <span className="text-[9px] md:text-xs text-gray-400 font-mono">OP_UNITS</span></h4>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-10">

        {/* 2. PANEL DE CATEGORÍAS (Izquierda) */}
        <div className="w-full xl:w-1/4 space-y-4 md:space-y-6">
          <div className={`${styles.glass} p-4 md:p-6`}>
            <h2 className={`${styles.title} text-xs mb-6 flex items-center`}>
              <Square3Stack3DIcon className="w-4 h-4 mr-2 text-black" />
              Filtrar Por Método
            </h2>
            <div className="flex flex-row md:flex-col gap-2 md:gap-y-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 custom-scroll md:max-h-[500px] md:overflow-y-auto md:pr-2 no-scrollbar-mobile">
              {/* FILTRO ESPECIAL PARA EXTRACCIONES */}
              <button
                onClick={() => setSelectedCategory(selectedCategory === 'EXTRACCIONES' ? null : 'EXTRACCIONES')}
                className={`shrink-0 md:w-full flex justify-between items-center h-10 md:h-12 px-4 md:p-4 rounded-lg text-[10px] transition-all border whitespace-nowrap ${selectedCategory === 'EXTRACCIONES'
                  ? 'bg-red-600 text-black border-red-600 shadow-lg '
                  : 'bg-red-500/10 text-red-500 border-red-500/20 hover:border-red-500'
                  }`}
              >
                <span className="bw-title font-black uppercase tracking-widest">VER EXTRACCIONES</span>
                <span className="font-mono font-bold ml-2 md:ml-0">-${stats.totalExtracciones.toLocaleString('es-AR')}</span>
              </button>

              <div className="hidden md:block h-px bg-gray-50 my-4"></div>

              {Object.keys(paymentLabels).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={`shrink-0 md:w-full flex justify-between items-center h-10 md:h-12 px-4 md:p-4 rounded-lg text-[10px] transition-all border whitespace-nowrap ${selectedCategory === key
                    ? 'bg-white text-black border-black shadow-lg '
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-2000'
                    }`}
                >
                  <span className="bw-title font-black">{paymentLabels[key]}</span>
                  <span className={`${styles.tech} ml-2 md:ml-0 ${selectedCategory === key ? " text-black" : ""}`}>
                    ${(stats.totalByMethod[key] || 0).toLocaleString('es-AR')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. LISTADO DETALLADO (Derecha) */}
        <div className="w-full xl:w-3/4 space-y-6">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
            <div className="relative group flex-1 w-full">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-black" />
              <input
                type="text"
                placeholder="BUSCAR OPERACIÓN POR PRODUCTO..."
                value={searchTerm} // Aseguramos que el valor esté controlado
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${styles.input} pl-12 h-12 md:h-14 bg-gray-50 tracking-widest uppercase`}
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2 h-12 md:h-14 w-full md:w-auto">
              <CalendarIcon className="w-5 h-5 text-gray-500 ml-2" />
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                onChange={(e) => setStartDate(new Date(e.target.value + 'T00:00:00'))}
                className="bg-transparent text-black bw-body focus:outline-none text-sm w-full md:w-32"
                title="Fecha de inicio"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                onChange={(e) => setEndDate(new Date(e.target.value + 'T23:59:59'))} // Aseguramos que la fecha final incluya todo el día
                className="bg-transparent text-black bw-body focus:outline-none text-sm w-full md:w-32"
                title="Fecha de fin"
              />
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory(null);
                const today = new Date();
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(today.getMonth() - 3);
                setStartDate(new Date(threeMonthsAgo.getFullYear(), threeMonthsAgo.getMonth(), 1));
                setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
              }}
              className="w-full md:w-auto p-3 md:p-4 bg-red-500/10 rounded-lg border border-red-500/20 hover:border-red-500 hover:bg-red-500/20 transition-all flex justify-center items-center text-red-500 text-[10px] uppercase font-black tracking-widest"
              title="Resetear Filtros"
            >
              LIMPIAR FILTROS
            </button>
            <button onClick={fetchBalance} className="w-full md:w-auto p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-black transition-all flex justify-center items-center">
              <ArrowPathIcon className={`w-5 h-5 text-black ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className={styles.glass}>
            {/* LISTA AGRUPADA POR TRANSACCIÓN */}
            <div className="space-y-4">
              <AnimatePresence>
                {Object.values(filteredEntries.reduce((acc, item) => {
                  // AGRUPAMIENTO DINÁMICO
                  const id = item.id_transaccion || `LEGACY_${item.BalanceMensualId}`;
                  if (!acc[id]) {
                    const timeSource = item.createdAt || item.fecha;
                    acc[id] = {
                      id,
                      cliente: item.cliente || 'CLIENTE ANÓNIMO',
                      fecha: item.fecha,
                      origen: item.origenDeVenta || 'n/a',
                      hora: timeSource ? new Date(timeSource).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--',
                      items: [],
                      total: 0,
                      timestamp: timeSource ? new Date(timeSource).getTime() : 0
                    };
                  }
                  acc[id].items.push(item);
                  acc[id].total += parseFloat(item.monto);
                  return acc;
                }, {})).sort((a, b) => b.timestamp - a.timestamp).map((group) => {

                  // --- LÓGICA DE CLASIFICACIÓN DE TARJETA ---
                  const isEgress = group.total < 0;
                  const isProductOperation = group.items.some(item => {
                    // Criterios para considerar que es una venta de producto/servicio detallada
                    const isEcommerce = item.categoria === 'ECOMMERCE';
                    const hasBrand = item.marca && item.marca !== 'GENERICO' && item.marca !== 'S/D';
                    const isService = item.categoria === 'SERVICIO' || item.marca === 'SERVICIO';
                    return isEcommerce || hasBrand || isService;
                  });
                  // Si no es egreso y no tiene rasgos de producto, es un ingreso genérico de dinero
                  const isGenericIncome = !isEgress && !isProductOperation;

                  return (
                    <motion.div
                      key={group.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -50, transition: { duration: 0.3 } }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all"
                    >

                      {/* --- CASO 1: EGRESO DE DINERO (Card Roja Simplificada) --- */}
                      {isEgress && (
                        <div className="p-4 flex items-center justify-between bg-red-500/5 border-l-4 border-red-500">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                              <ArrowUpRightIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-red-500 font-bold text-sm uppercase tracking-wider">
                                {group.items[0]?.producto || 'EGRESO DE FONDOS'}
                              </h5>
                              <p className="text-[10px] text-gray-500 font-mono mt-1">
                                {new Date(group.fecha).toLocaleDateString('es-AR')} • {group.hora} • {group.items[0]?.metodo_pago?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-red-500 font-black text-lg tracking-tighter">
                              ${group.total.toLocaleString('es-AR')}
                            </span>
                            <div className="flex items-center gap-2">
                              {group.items[0]?.BalanceMensualId && (
                                <button
                                  onClick={() => setEditingEntry(group.items[0])}
                                  className="p-2 text-gray-400 hover:text-black transition-colors"
                                  title="Editar registro"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => group.items.forEach(i => handleDelete(i.BalanceMensualId || i.id))}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Eliminar registro"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- CASO 2: INGRESO GENÉRICO (Card Verde Simplificada - No Productos) --- */}
                      {isGenericIncome && (
                        <div className="p-4 flex items-center justify-between bg-green-500/5 border-l-4 border-green-500">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                              <BanknotesIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-green-500 font-bold text-sm uppercase tracking-wider">
                                {group.items[0]?.producto || 'INGRESO DE DINERO'}
                              </h5>
                              <p className="text-[10px] text-gray-500 font-mono mt-1">
                                {new Date(group.fecha).toLocaleDateString('es-AR')} • {group.hora} • {group.cliente}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-green-500 font-black text-lg tracking-tighter">
                              +${group.total.toLocaleString('es-AR')}
                            </span>
                            <div className="flex items-center gap-2">
                              {group.items[0]?.BalanceMensualId && (
                                <button
                                  onClick={() => setEditingEntry(group.items[0])}
                                  className="p-2 text-gray-400 hover:text-black transition-colors"
                                  title="Editar registro"
                                >
                                  <PencilIcon className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => group.items.forEach(i => handleDelete(i.BalanceMensualId || i.id))}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Eliminar registro"
                              >
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- CASO 3: VENTA DE PRODUCTOS (Card Completa Original) --- */}
                      {(!isEgress && !isGenericIncome) && (
                        <div className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer group">
                          {(() => {
                            const itemsByProduct = group.items.reduce((acc, item) => {
                              const productName = item.producto || 'Producto sin nombre';
                              if (!acc[productName]) {
                                acc[productName] = { ...item, payments: [], totalAmount: 0, ids: [] };
                              }
                              acc[productName].payments.push({
                                method: item.metodo_pago,
                                amount: parseFloat(item.monto) || 0,
                                details: item.detalles_pago,
                                tarjeta_digitos: item.tarjeta_digitos
                              });
                              acc[productName].totalAmount += parseFloat(item.monto) || 0;
                              acc[productName].ids.push(item.BalanceMensualId);
                              return acc;
                            }, {});

                            const consolidatedItems = Object.values(itemsByProduct);

                            return (
                              <details className="w-full"> {/* Usamos details para el acordeón */}
                                <summary className="flex flex-col md:flex-row items-start md:items-center justify-between w-full list-none py-2 md:py-0">
                                  {/* Mobile View: Stacked Info */}
                                  <div className="flex flex-col md:hidden w-full gap-1">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-black font-black text-sm uppercase truncate max-w-[60%]">{group.cliente}</span>
                                      <span className={`text-lg font-black tracking-tighter ${group.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ${group.total.toLocaleString('es-AR')}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-600 text-xs">
                                      <span className="bw-tech text-[9px]">{new Date(group.fecha).toLocaleDateString('es-AR')} | {group.hora}</span>
                                      <span className="text-black font-black text-[9px] uppercase tracking-tighter">
                                        {originLabels[group.origen] || group.origen.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Desktop View: Horizontal Info */}
                                  <div className="hidden md:flex items-center space-x-6">
                                    <div className="flex flex-col">
                                      <span className="bw-tech text-[10px] text-gray-500">FECHA</span>
                                      <span className="text-black font-bold font-mono text-sm">{new Date(group.fecha).toLocaleDateString('es-AR')}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="bw-tech text-[10px] text-gray-500">HORA</span>
                                      <span className="text-black font-bold font-mono text-sm">{group.hora}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="bw-tech text-[10px] text-gray-600">CLIENTE</span>
                                      <span className="text-black font-bold text-sm uppercase">{group.cliente}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="bw-tech text-[10px] text-gray-500">ORIGEN</span>
                                      <span className="text-black font-black text-[9px] uppercase tracking-tighter">
                                        {originLabels[group.origen] || group.origen.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="bw-tech text-[10px] text-gray-500">ITEMS</span>
                                      <span className="text-gray-700 font-bold text-sm">{group.items.length}</span>
                                    </div>
                                  </div>
                                  <div className="hidden md:flex items-center space-x-4">
                                    <span className={`text-xl font-black tracking-tighter ${group.total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                      ${group.total.toLocaleString('es-AR')}
                                    </span>
                                    <Square3Stack3DIcon className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                                  </div>
                                </summary>

                                {/* DETALLE DE ITEMS (ACORDEÓN) */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  {/* Mobile List View for Items */}
                                  <div className="md:hidden divide-y divide-white/5">
                                    {consolidatedItems.map(item => (
                                      <div
                                        key={item.ids.join('-')}
                                        className="p-3 flex justify-between items-center gap-2 hover:bg-gray-50 transition-colors cursor-help"
                                        onDoubleClick={() => setInspectedProduct(item.producto)}
                                        title="Doble clic para ver detalles del producto"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-gray-700 truncate">{getColorName(item.producto)}</p>
                                          <p className="text-[10px] text-gray-500 uppercase">{item.marca || '---'} | {item.categoria || '---'}</p>
                                          <div className="text-[9px] text-gray-400 uppercase mt-2 space-y-1">
                                            {item.payments.map((p, i) => {
                                              const bankInfo = p.details && p.details.banco ? ` (${p.details.banco})` : '';
                                              const cardInfo = p.tarjeta_digitos ? ` (****${p.tarjeta_digitos})` : '';
                                              return (
                                                <div key={i} className="flex justify-between items-center">
                                                  <span className="truncate">{paymentLabels[p.method] || p.method}{bankInfo}{cardInfo}</span>
                                                  <span className="text-black font-mono whitespace-nowrap">${p.amount.toLocaleString('es-AR')}</span>
                                                </div>
                                              )
                                            })}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {item.BalanceMensualId && (
                                            <button
                                              onClick={(e) => handleEdit(item, e)}
                                              className="p-2 text-gray-400 hover:text-black transition-colors h-10 w-10 flex items-center justify-center"
                                              title="Editar este registro"
                                            >
                                              <PencilIcon className="w-5 h-5" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => item.ids.forEach(id => handleDelete(id))}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors h-10 w-10 flex items-center justify-center"
                                            title="Eliminar todos los items de esta entrada"
                                          >
                                            <TrashIcon className="w-5 h-5" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Desktop Table View for Items */}
                                  <div className="hidden md:block overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left">
                                      <thead className="opacity-50 text-[10px] uppercase text-gray-500">
                                        <tr>
                                          <th className="pb-2">Producto</th>
                                          <th className="pb-2">Marca</th>
                                          <th className="pb-2">Categoría</th>
                                          <th className="pb-2">Origen</th>
                                          <th className="pb-2">Método</th>
                                          <th className="pb-2 text-right">Monto</th>
                                          <th className="pb-2 text-right">Acción</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {consolidatedItems.map(item => (
                                          <tr
                                            key={item.ids.join('-')}
                                            className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors cursor-help"
                                            onDoubleClick={() => setInspectedProduct(item.producto)}
                                            title="Doble clic para ver detalles del producto"
                                          >
                                            <td className="py-3 text-sm font-medium text-gray-700">{getColorName(item.producto)}</td>
                                            <td className="py-3 text-[10px] text-gray-500 uppercase font-bold">{item.marca || '---'}</td>
                                            <td className="py-3 text-[10px] text-gray-400 uppercase">{item.categoria || '---'}</td>
                                            <td className="py-3 text-[9px] text-gray-500 font-black">{originLabels[item.origenDeVenta] || 'S/D'}</td>
                                            <td className="py-3 text-xs text-gray-500 uppercase align-top">
                                              <div className="flex flex-col gap-1 max-w-[250px]">
                                                {item.payments.map((p, i) => {
                                                  const bankInfo = p.details && p.details.banco ? ` (${p.details.banco})` : '';
                                                  const cardInfo = p.tarjeta_digitos ? ` (****${p.tarjeta_digitos})` : '';
                                                  return (
                                                    <span key={i} className="flex justify-between gap-4">
                                                      <span className="truncate">{paymentLabels[p.method] || p.method}{bankInfo}{cardInfo}:</span>
                                                      <span className="text-black font-mono whitespace-nowrap">${p.amount.toLocaleString('es-AR')}</span>
                                                    </span>
                                                  )
                                                })}
                                              </div>
                                            </td>
                                            <td className={`py-3 text-sm font-mono text-right align-top ${item.totalAmount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            </td>
                                            <td className="py-3 text-right">
                                              <div className="flex items-center justify-end gap-2">
                                                {item.BalanceMensualId && (
                                                  <button
                                                    onClick={(e) => handleEdit(item, e)}
                                                    className="p-2 text-gray-400 hover:text-black transition-colors h-10 w-10 flex items-center justify-center"
                                                    title="Editar este registro"
                                                  >
                                                    <PencilIcon className="w-5 h-5" />
                                                  </button>
                                                )}
                                                <button
                                                  onClick={() => item.ids.forEach(id => handleDelete(id))}
                                                  className="p-2 text-gray-400 hover:text-red-500 transition-colors h-10 w-10 flex items-center justify-center"
                                                  title="Eliminar todos los items de esta entrada"
                                                >
                                                  <TrashIcon className="w-5 h-5" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </details>
                            )
                          })()}
                        </div>
                      )}

                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {/* PANEL DE EDICIÓN INLINE (aparece debajo del listado y hace auto-scroll) */}
              {editingEntry && (
                <EditBalanceModal
                  entry={editingEntry}
                  onClose={() => setEditingEntry(null)}
                  onUpdate={onUpdate || fetchBalance}
                />
              )}
            </div>

            {filteredEntries.length === 0 && !loading && (
              <div className="p-24 text-center">
                <ChartBarIcon className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className={`${styles.tech} text-xs uppercase opacity-30 tracking-[0.3em]`}>Sin Sincronizaciones Encontradas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {inspectedProduct && (
        <ProductInfoModal
          productData={inspectedProduct}
          onClose={() => setInspectedProduct(null)}
        />
      )}
    </div>
  );
};

export default PaymentsSection;