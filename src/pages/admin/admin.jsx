import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEdit2, FiTrash2, FiCheck, FiX, FiPlus, FiDollarSign,
  FiPackage, FiShoppingCart, FiCalendar, FiClock, FiBarChart2, FiHome,
  FiTag, FiLayers, FiAlertTriangle, FiSearch, FiTrendingUp, FiArrowLeft, FiArrowRight, FiUploadCloud,
  FiMinusCircle, FiCornerDownRight, FiMenu, FiCreditCard, FiMessageSquare, FiUser, FiTruck, FiActivity, FiHeart
} from 'react-icons/fi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Componentes internos (Submódulos)
import HistorialDeVentas from '../admin/historialVentas';
import ModuloCaja from '../admin/caja.jsx';
import ConfiguracionCostos from './configuracionCostos.jsx';
import Encargos from './encargos.jsx';
import HistorialDeVentasLocal from '../admin/ventasLocalFisico.jsx';
import HistorialRecaudacionFinal from '../admin/cierresDeCaja/historialRecaudacionFinal.jsx';
import CierreCajaDiario from '../admin/cierresDeCaja/cierreCajaDiario.jsx';
import BalanceModule from './balance/balance.jsx';
import PersonalBalance from './balance/personalBalance.jsx';
import CargaDeProductos from './productos/cargaDeProductos.jsx';
import Facturacion from './facturacion/facturacion.jsx';
import InventarioProductos from './productos/inventarioProductos.jsx';
import LikesControl from './productos/LikesControl.jsx';
import ModuloProveedores from './proveedores/proveedores.jsx';
import ModuloClientes from './clientes/clientes.jsx';
import ModuloRevendedores from './revendedores/revendedoresAdmin.jsx';
import EnviosProductos from './envios/enviosProductos.jsx';
import VentasEcommerceOnline from './ventas/ventasEcommerceOnline.jsx';
import CargaContenidoWeb from './cargaDeContenido/cargaDeContenido.jsx';
import Gastos from './gastos.jsx';
import WhatsappQrSection from './whatsapp/whatsappQrSection.jsx';
import ReporteGanancias from './reporteGanancias.jsx';
import ConfiguracionMayorista from './configuracionMayorista.jsx';
import ModuloEmpleados from './empleados/moduloEmpleados.jsx';
import AdminPronunciation from '../AdminPronunciation.jsx';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ANIMACIÓN ---
const springTransition = { type: "spring", stiffness: 300, damping: 30 };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: springTransition }
};

const sectionVariants = {
  initial: { opacity: 0, x: 10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.2 } }
};

const sidebarGroupVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.05, ...springTransition }
  }
};

const sidebarItemVariants = {
  hidden: { opacity: 0, x: -5 },
  visible: { opacity: 1, x: 0 }
};

// =================================================================
// ESTILOS MIGRADOS A TAILWIND UTILS
// =================================================================

const EditarProducto = ({ producto, onGuardarCambios, onCancelar }) => {
  const [formData, setFormData] = useState({ ...producto });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white border border-gray-200 shadow-sm p-6 md:p-8 w-full max-w-xl rounded-2xl"
      >
        <h3 className="text-xl font-black tracking-tighter uppercase text-black mb-6 flex items-center gap-2 border-b border-gray-200 pb-4">
          <div className="w-10 h-10 bg-gray-50 border border-gray-200 text-black flex items-center justify-center mr-2 rounded-xl">
             <FiEdit2 size={18} />
          </div>
          EDIT SCENARIO
        </h3>
        <form onSubmit={(e) => { e.preventDefault(); onGuardarCambios(formData); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase text-gray-500 block mb-2 font-bold">Scenario Name</label>
              <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 block mb-2 font-bold">Price</label>
              <input type="number" value={formData.precio} onChange={(e) => setFormData({ ...formData, precio: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all" />
            </div>
            <div>
              <label className="text-[10px] uppercase text-gray-500 block mb-2 font-bold">Stock / Seats</label>
              <input type="number" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all" />
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end gap-3 pt-8">
            <button type="button" onClick={onCancelar} className="py-3 px-6 bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-lg transition-all">Cancel</button>
            <button type="submit" className="py-3 px-6 bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2">Save Changes</button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const Admin = () => {
  const [recaudaciones, setRecaudaciones] = useState([]);
  const [productoAEditar, setProductoAEditar] = useState(null);
  const [todosMisProductos, setTodosMisProductos] = useState([]);
  const [seccionActiva, setSeccionActiva] = useState(() => localStorage.getItem('adminSeccionActiva') || 'dashboard');
  const [loading, setLoading] = useState(false);
  const [ventasPendientesDeCierre, setVentasPendientesDeCierre] = useState([]);
  const [pagosCajaPendientes, setPagosCajaPendientes] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const dateInicioRef = useRef(null);
  const dateFinRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarVisible(false);
      else setSidebarVisible(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('adminSeccionActiva', seccionActiva);
  }, [seccionActiva]);

  const obtenerDatos = async () => {
    setLoading(true);
    try {
      const [prod, vent, rec, caja] = await Promise.all([
        axios.get(`${API_URL}/products`),
        axios.get(`${API_URL}/boughtProduct/AllboughtProducts`),
        axios.get(`${API_URL}/recaudacionFinal`),
        axios.get(`${API_URL}/pagoCaja/pagos`)
      ]);
      setTodosMisProductos(prod.data);
      setVentasPendientesDeCierre(vent.data);
      setPagosCajaPendientes(caja.data || []);
      setRecaudaciones(rec.data.map(r => {
        let fechaExplicita = (r.op2 || '').replace('Fecha: ', '');
        if (!fechaExplicita && r.createdAt) {
          fechaExplicita = new Date(r.createdAt).toLocaleDateString('es-AR');
        }
        return {
          id: r.id,
          mes: fechaExplicita || r.mes || 'S/D',
          montoRecaudado: parseFloat(r.totalFinal) || 0,
          productosVendidos: [...(r.pagosEcommerce || []), ...(r.pagosLocal || [])],
          createdAt: r.createdAt
        };
      }));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { obtenerDatos(); }, []);

  const dataGrafico = useMemo(() => {
    let filtered = [...recaudaciones].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (fechaInicio || fechaFin) {
      if (fechaInicio) filtered = filtered.filter(r => new Date(r.createdAt) >= new Date(fechaInicio + 'T00:00:00'));
      if (fechaFin) filtered = filtered.filter(r => new Date(r.createdAt) <= new Date(fechaFin + 'T23:59:59'));
      return filtered.map(r => ({ mes: r.mes, recaudado: r.montoRecaudado }));
    }
    return filtered.map(r => ({ mes: r.mes, recaudado: r.montoRecaudado })).slice(-10);
  }, [recaudaciones, fechaInicio, fechaFin]);

  const recaudacionPendienteTotal = useMemo(() => {
    const ecom = ventasPendientesDeCierre.reduce((acc, s) => acc + (parseFloat(s.precio) * parseInt(s.cantidad) * (1 - parseFloat(s.descuentoGlobalAplicado || 0) / 100)), 0);
    const local = pagosCajaPendientes.reduce((acc, p) => acc + parseFloat(p.montoTotal || 0), 0);
    return ecom + local;
  }, [ventasPendientesDeCierre, pagosCajaPendientes]);

  const desgloseCajaAbierta = useMemo(() => {
    let ecomRev = 0, ecomCost = 0, localRev = 0, localCost = 0;
    ventasPendientesDeCierre.forEach(s => {
      const precioVenta = (parseFloat(s.precio) || 0) * (parseInt(s.cantidad) || 1) * (1 - parseFloat(s.descuentoGlobalAplicado || 0) / 100);
      const costo = (parseFloat(s.precioCompra) || 0) * (parseInt(s.cantidad) || 1);
      ecomRev += precioVenta; ecomCost += costo;
    });
    pagosCajaPendientes.forEach(p => {
      localRev += parseFloat(p.montoTotal) || 0;
      (p.productos || []).forEach(prod => {
        localCost += (parseFloat(prod.precioCompra) || 0) * (parseInt(prod.cantidad) || 1);
      });
    });
    const gananciaTotal = (ecomRev + localRev) - (ecomCost + localCost);
    return {
      ecommerce: { rev: ecomRev, cost: ecomCost, profit: ecomRev - ecomCost },
      local: { rev: localRev, cost: localCost, profit: localRev - localCost },
      total: { rev: ecomRev + localRev, cost: ecomCost + localCost, profit: gananciaTotal }
    };
  }, [ventasPendientesDeCierre, pagosCajaPendientes]);

  const gananciaPendienteTotal = desgloseCajaAbierta.total.profit;

  return (
    <div className="text-black bg-white min-h-screen overflow-x-hidden" style={{ fontFamily: '"Inter", sans-serif' }}>

      <AnimatePresence>
        {isMobile && sidebarVisible && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarVisible(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[50]"
          />
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setSidebarVisible(!sidebarVisible)}
        className="fixed h-12 w-12 top-6 left-6 z-[1001] bg-white text-black rounded-xl shadow-sm border border-gray-200 flex items-center justify-center transition-all hover:border-black"
      >
        {sidebarVisible && !isMobile ? <FiArrowLeft size={20} /> : <FiMenu size={20} />}
      </motion.button>

      {/* SIDEBAR BRUTALIST */}
      <motion.div
        initial={false}
        animate={{ x: sidebarVisible ? 0 : (isMobile ? '-100%' : -260) }}
        transition={springTransition}
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-[55] overflow-y-auto pb-24 ${isMobile ? 'w-[85vw]' : 'w-[260px]'} custom-scrollbar`}
      >
        <div className="p-8 pt-24 pb-6 flex justify-between items-center border-b border-gray-100">
          <div className='mb-2'>
            <h1 className="text-xl font-black tracking-tighter uppercase text-black leading-none">AI SPEAKING<br/><span className="text-gray-400 font-bold tracking-widest text-[10px]">ADMIN DASHBOARD</span></h1>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarVisible(false)} className="text-gray-500 bg-gray-50 border border-gray-200 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all hover:text-black">
              <FiX size={14} />
            </button>
          )}
        </div>

        <motion.nav variants={containerVariants} initial="hidden" animate="visible" className="px-4 py-6 space-y-8">
          {[
            {
              title: 'OVERVIEW',
              items: [
                { id: 'dashboard', label: 'DASHBOARD', icon: <FiHome /> },
                { id: 'caja', label: 'OPERATIONS', icon: <FiDollarSign /> },
                { id: 'Encargos', label: 'ORDERS', icon: <FiPackage /> },
                { id: 'control', label: 'DAILY CLOSING', icon: <FiCheck /> },
              ]
            },
            {
              title: 'FINANCE',
              items: [
                { id: 'Balance', label: 'BALANCE', icon: <FiBarChart2 /> },
                { id: 'ganancias', label: 'EARNINGS', icon: <FiTrendingUp /> },
                { id: 'gastos', label: 'EXPENSES', icon: <FiDollarSign /> },
                { id: 'historialRecaudacionFinal', label: 'HISTORY', icon: <FiClock /> },
                { id: 'facturacion', label: 'INVOICES', icon: <FiTag /> },
                { id: 'configMayorista', label: 'B2B SETTINGS', icon: <FiDollarSign /> },
              ]
            },
            {
              title: 'CONTENT',
              items: [
                { id: 'productos', label: 'SCENARIOS', icon: <FiPackage /> },
                { id: 'cargar', label: 'ADD SCENARIO', icon: <FiPlus /> },
                { id: 'likes', label: 'POPULARITY', icon: <FiHeart /> },
                { id: 'cargarContenidoWeb', label: 'WEB CONTENT', icon: <FiEdit2 /> },
                { id: 'proveedores', label: 'AI PROVIDERS', icon: <FiTruck /> },
              ]
            },
            {
              title: 'SALES',
              items: [
                { id: 'ventasLocal', label: 'B2B SUBS', icon: <FiShoppingCart /> },
                { id: 'ventasOnline', label: 'B2C SUBS', icon: <FiUploadCloud /> },
                { id: 'envios', label: 'METRICS', icon: <FiTrendingUp /> },
                { id: 'clientes', label: 'STUDENTS', icon: <FiUser /> },
              ]
            },
            {
              title: 'SYSTEM',
              items: [
                { id: 'whatsapp', label: 'WHATSAPP BOT', icon: <FiMessageSquare /> },
                { id: 'empleados', label: 'TUTORS', icon: <FiUser /> },
                { id: 'pronunciacion', label: 'ENGINE', icon: <FiMessageSquare /> },
              ]
            }
          ].map((group, i) => (
            <motion.div key={i} variants={sidebarGroupVariants} className="space-y-2">
              <motion.p variants={sidebarItemVariants} className="px-3 text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-2">{group.title}</motion.p>
              {group.items.map(item => (
                <motion.button
                  key={item.id}
                  variants={sidebarItemVariants}
                  onClick={() => {
                    setSeccionActiva(item.id);
                    if (isMobile) setSidebarVisible(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 font-bold text-xs uppercase tracking-widest transition-all rounded-xl border
                  ${seccionActiva === item.id 
                    ? 'bg-gray-50 border-black text-black' 
                    : 'bg-white border-transparent text-gray-500 hover:border-gray-300 hover:text-black'}`}
                >
                  <span className="mr-3 text-lg">{item.icon}</span> {item.label}
                </motion.button>
              ))}
            </motion.div>
          ))}
        </motion.nav>
      </motion.div>

      <motion.div
        animate={{ paddingLeft: (sidebarVisible && !isMobile) ? 260 : 0 }}
        transition={springTransition}
        className="pt-24 md:pt-32 md:p-12 min-h-screen w-full bg-white"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={seccionActiva}
            variants={sectionVariants}
            initial="initial" animate="animate" exit="exit"
            className="max-w-7xl mx-auto"
          >
            {seccionActiva === 'dashboard' && (
              <div className="p-6 md:p-0 mt-[-40px] md:mt-[-80px] space-y-8">
                <div className="flex items-center justify-between mb-4">
                  {loading && <span className="text-[10px] font-bold text-black uppercase tracking-widest bg-gray-50 border border-gray-200 px-4 py-2 rounded-full animate-pulse flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-black"></div>SYNCING DATA</span>}
                </div>

                {/* METRICS CARDS BRUTALIST */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'ACTIVE SCENARIOS', val: todosMisProductos.length, icon: <FiPackage /> },
                    { label: 'LIVE SESSIONS', val: ventasPendientesDeCierre.length + pagosCajaPendientes.length, icon: <FiClock /> },
                    { label: 'PENDING REVENUE', val: `$${recaudacionPendienteTotal.toLocaleString()}`, icon: <FiDollarSign /> },
                    { label: 'NET PROFIT', val: `$${gananciaPendienteTotal.toLocaleString()}`, icon: <FiTrendingUp />, highlight: true }
                  ].map((card, i) => (
                    <motion.div
                      key={i} variants={itemVariants}
                      className={`p-6 rounded-2xl border flex justify-between items-start transition-all shadow-sm ${card.highlight ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-black hover:border-gray-300'}`}
                    >
                      <div className="flex flex-col">
                        <p className={`font-bold text-[10px] tracking-widest uppercase mb-2 ${card.highlight ? 'text-gray-300' : 'text-gray-500'}`}>{card.label}</p>
                        <p className={`font-black text-3xl tracking-tighter ${card.highlight ? 'text-white' : 'text-black'}`}>{card.val}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl border
                        ${card.highlight ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}>
                        {card.icon}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* CHART SECTION */}
                  <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                      <h3 className="text-lg font-black tracking-tighter uppercase text-black flex items-center gap-2">
                        <FiBarChart2 />
                        REVENUE ANALYTICS
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 cursor-pointer transition-all hover:border-black" onClick={() => dateInicioRef.current?.showPicker()}>
                          <FiCalendar className="text-black" size={14} />
                          <input
                            ref={dateInicioRef} type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                            className="bg-transparent text-xs font-bold uppercase tracking-widest text-black pl-2 outline-none cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 cursor-pointer transition-all hover:border-black" onClick={() => dateFinRef.current?.showPicker()}>
                          <FiCalendar className="text-black" size={14} />
                          <input
                            ref={dateFinRef} type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                            className="bg-transparent text-xs font-bold uppercase tracking-widest text-black pl-2 outline-none cursor-pointer"
                          />
                        </div>
                        {(fechaInicio || fechaFin) && (
                          <button onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black rounded-xl transition-all">
                            <FiX size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataGrafico}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="mes" stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6b7280' }} axisLine={false} tickLine={false} dy={10} />
                          <YAxis stroke="#6b7280" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val.toLocaleString()}`} width={60} dx={-10} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', color: '#000', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: '#000', fontWeight: 900 }} cursor={{ stroke: '#d1d5db', strokeWidth: 2 }}
                          />
                          <Line type="monotone" dataKey="recaudado" stroke="#000000" strokeWidth={4} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* ACTIVE BALANCES SECTION */}
                  <div className="p-0 rounded-2xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-gray-200 bg-white">
                      <h3 className="text-lg font-black tracking-tighter uppercase text-black flex items-center gap-2 mb-6">
                        <FiDollarSign />
                        ACTIVE BALANCES
                      </h3>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                          <div>
                            <p className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-1">Gross Income</p>
                            <p className="font-black text-lg text-black">${desgloseCajaAbierta.total.rev.toLocaleString()}</p>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-black flex items-center justify-center shadow-sm"><FiTrendingUp size={16}/></div>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                          <div>
                            <p className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-1">Estimated Costs</p>
                            <p className="font-black text-lg text-black">${desgloseCajaAbierta.total.cost.toLocaleString()}</p>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-black flex items-center justify-center shadow-sm"><FiTrendingUp size={16} className="rotate-180"/></div>
                        </div>

                        <div className="pt-2">
                          <div className="p-6 bg-black text-white rounded-xl shadow-md border border-black">
                            <p className="font-bold text-[10px] tracking-widest uppercase text-gray-400 mb-1 flex items-center gap-2"><FiCheck /> CURRENT NET PROFIT</p>
                            <p className="font-black text-3xl tracking-tighter">${desgloseCajaAbierta.total.profit.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 overflow-y-auto flex-1 max-h-64 custom-scrollbar bg-white">
                      <h3 className="font-bold text-[10px] tracking-widest uppercase text-gray-500 mb-4 flex items-center gap-2"><FiClock /> RECENT HISTORY</h3>
                      <div className="space-y-2">
                        {recaudaciones.slice(0, 5).map(r => (
                          <div key={r.id} className="p-3 flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl transition-all hover:border-gray-300">
                            <span className="font-bold text-xs uppercase text-gray-600">
                              {r.mes}
                            </span>
                            <span className="font-black text-sm text-black">${r.montoRecaudado.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN DE RENDERIZADO DE SUBMÓDULOS */}
            <div className="w-full relative z-10 pt-4">
              {seccionActiva === 'Balance' && <BalanceModule />}
              {seccionActiva === 'personalBalance' && <PersonalBalance />}
              {seccionActiva === 'Encargos' && <Encargos />}
              {seccionActiva === 'caja' && <ModuloCaja />}
              {seccionActiva === 'productos' && <InventarioProductos />}
              {seccionActiva === 'cargar' && <CargaDeProductos />}
              {seccionActiva === 'likes' && <LikesControl />}
              {seccionActiva === 'ventasOnline' && <VentasEcommerceOnline />}
              {seccionActiva === 'ventasLocal' && <HistorialDeVentasLocal />}
              {seccionActiva === 'historialRecaudacionFinal' && <HistorialRecaudacionFinal />}
              {seccionActiva === 'facturacion' && <Facturacion />}
              {seccionActiva === 'proveedores' && <ModuloProveedores />}
              {seccionActiva === 'clientes' && <ModuloClientes />}
              {seccionActiva === 'revendedores' && <ModuloRevendedores />}
              {seccionActiva === 'envios' && <EnviosProductos />}
              {seccionActiva === 'cargarContenidoWeb' && <CargaContenidoWeb />}
              {seccionActiva === 'gastos' && <Gastos />}
              {seccionActiva === 'whatsapp' && <WhatsappQrSection />}
              {seccionActiva === 'ganancias' && <ReporteGanancias />}
              {seccionActiva === 'control' && <CierreCajaDiario />}
              {seccionActiva === 'configMayorista' && <ConfiguracionMayorista />}
              {seccionActiva === 'empleados' && <ModuloEmpleados />}
              {seccionActiva === 'pronunciacion' && <AdminPronunciation />}
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {productoAEditar && (
            <EditarProducto
              producto={productoAEditar}
              onCancelar={() => setProductoAEditar(null)}
              onGuardarCambios={() => { }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Admin;