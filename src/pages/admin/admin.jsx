import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiEdit2,
  FiCheck,
  FiX,
  FiPlus,
  FiDollarSign,
  FiPackage,
  FiCalendar,
  FiClock,
  FiBarChart2,
  FiHome,
  FiLayers,
  FiTrendingUp,
  FiMenu,
  FiMessageSquare,
  FiUser,
  FiActivity,
  FiHeart,
  FiArchive,
  FiUploadCloud,
  FiExternalLink,
  FiLogOut,
  FiChevronLeft,
  FiBookOpen,
  FiCpu,
  FiImage,
  FiShield,
  FiBell,
  FiCheckCircle
} from "react-icons/fi";
import Swal from "sweetalert2";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import authContext from "../../store/store";
import bloomLogo from "../../images/logoingles.png";

// Submódulos de Administración
import HistorialDeVentas from "../admin/historialVentas";
import ModuloCaja from "../admin/caja.jsx";
import ConfiguracionCostos from "./configuracionCostos.jsx";
import Encargos from "./encargos.jsx";
import HistorialDeVentasLocal from "../admin/ventasLocalFisico.jsx";
import HistorialRecaudacionFinal from "../admin/cierresDeCaja/historialRecaudacionFinal.jsx";
import CierreCajaDiario from "../admin/cierresDeCaja/cierreCajaDiario.jsx";
import BalanceModule from "./balance/balance.jsx";
import PersonalBalance from "./balance/personalBalance.jsx";
import CargaDeProductos from "./productos/cargaDeProductos.jsx";
import Facturacion from "./facturacion/facturacion.jsx";
import InventarioProductos from "./productos/inventarioProductos.jsx";
import LikesControl from "./productos/LikesControl.jsx";
import ModuloClientes from "./clientes/clientes.jsx";
import ModuloRevendedores from "./revendedores/revendedoresAdmin.jsx";
import VentasEcommerceOnline from "./ventas/ventasEcommerceOnline.jsx";
import CargaContenidoWeb from "./cargaDeContenido/cargaDeContenido.jsx";
import Gastos from "./gastos.jsx";
import WhatsappQrSection from "./whatsapp/whatsappQrSection.jsx";
import ReporteGanancias from "./reporteGanancias.jsx";
import ConfiguracionMayorista from "./configuracionMayorista.jsx";
import ModuloEmpleados from "./empleados/moduloEmpleados.jsx";
import AdminPronunciation from "../AdminPronunciation.jsx";
import LiveEditor from "./cargaDeContenido/LiveEditor.jsx";
import AdminCreatePack from "./adminSpeaking/AdminCreatePack.jsx";
import AdminPackInventory from "./adminSpeaking/AdminPackInventory.jsx";
import AdminStudentAccess from "./AdminStudentAccess.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

// ── ESTRUCTURA DE NAVEGACIÓN DEL PANEL ADMIN ──
const ADMIN_MENU_GROUPS = [
  {
    title: "Gestión de Cursos",
    items: [
      {
        id: "cargar",
        label: "Crear Nuevo Curso",
        subtitle: "Subir PPT, PDF, Word y Ejercicios IA",
        icon: FiPlus,
        primaryAction: true
      },
      {
        id: "productos",
        label: "Inventario de Cursos",
        subtitle: "Editar cursos, archivos y preguntas",
        icon: FiBookOpen
      }
    ]
  },
  {
    title: "Diseño y Contenido Web",
    items: [
      {
        id: "liveEditor",
        label: "Editor Visual en Vivo",
        subtitle: "Modificar textos tocando la web",
        icon: FiLayers
      },

      {
        id: "likes",
        label: "Popularidad y Likes",
        subtitle: "Valoraciones de cursos",
        icon: FiHeart
      }
    ]
  },
  {
    title: "Ventas y Alumnos",
    items: [
      {
        id: "studentAccess",
        label: "Permisos y Alumnos",
        subtitle: "Aprobar o revocar acceso a cursos",
        icon: FiShield,
        primaryAction: true
      },

      {
        id: "clientes",
        label: "Alumnos Registrados",
        subtitle: "Base de usuarios y cursos activos",
        icon: FiUser
      }
    ]
  },
  {
    title: "Métricas y Finanzas",
    items: [

      {
        id: "Balance",
        label: "Balance Financiero",
        subtitle: "Ingresos y movimientos",
        icon: FiBarChart2
      },
      {
        id: "ganancias",
        label: "Reporte de Ganancias",
        subtitle: "Rentabilidad neta",
        icon: FiTrendingUp
      },
      {
        id: "control",
        label: "Cierre Diario",
        subtitle: "Arqueo de operaciones",
        icon: FiCheck
      },
      {
        id: "historialRecaudacionFinal",
        label: "Historial de Cierres",
        subtitle: "Registro histórico",
        icon: FiArchive
      }
    ]
  },
  {
    title: "Sistema y Soporte",
    items: [
      {
        id: "whatsapp",
        label: "Bot de WhatsApp",
        subtitle: "Conexión QR y notificaciones",
        icon: FiMessageSquare
      },
      {
        id: "empleados",
        label: "Equipo y Tutores",
        subtitle: "Gestión de colaboradores",
        icon: FiUser
      }
    ]
  }
];

const ALL_MENU_ITEMS = ADMIN_MENU_GROUPS.flatMap((g) => g.items);

const Admin = () => {
  const authCtx = useContext(authContext);
  const navigate = useNavigate();

  const [recaudaciones, setRecaudaciones] = useState([]);
  const [todosMisProductos, setTodosMisProductos] = useState([]);
  const [seccionActiva, setSeccionActiva] = useState(
    () => localStorage.getItem("adminSeccionActiva") || "cargar"
  );
  const [loading, setLoading] = useState(false);
  const [ventasPendientesDeCierre, setVentasPendientesDeCierre] = useState([]);
  const [pagosCajaPendientes, setPagosCajaPendientes] = useState([]);
  const [sidebarVisible, setSidebarVisible] = useState(() => window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [pendingSalesCount, setPendingSalesCount] = useState(0);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const dateInicioRef = useRef(null);
  const dateFinRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarVisible(false);
      else setSidebarVisible(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("adminSeccionActiva", seccionActiva);
  }, [seccionActiva]);

  const obtenerDatos = async () => {
    setLoading(true);
    try {
      const [prod, vent, rec, caja, studentAccessRes] = await Promise.all([
        axios.get(`${API_URL}/products`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/boughtProduct/AllboughtProducts`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/recaudacionFinal`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/pagoCaja/pagos`).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/admin/student-access`).catch(() => ({ data: [] }))
      ]);

      const orders = Array.isArray(studentAccessRes?.data) ? studentAccessRes.data : [];
      const pendingApprovalOrders = orders.filter((o) => !o.accessGranted);
      const pendingCount = pendingApprovalOrders.length;
      setPendingSalesCount(pendingCount);

      if (pendingCount > 0) {
        const alreadyNotified = sessionStorage.getItem("bloom_admin_sales_notified");
        if (!alreadyNotified) {
          sessionStorage.setItem("bloom_admin_sales_notified", "true");
          Swal.fire({
            icon: "info",
            title: "¡Ventas Registradas!",
            html: `
              <div style="text-align: left; font-size: 13px; line-height: 1.6; color: #D1D5DB;">
                <p>Se realizaron <strong>${pendingCount} venta(s)</strong> de cursos en la plataforma.</p>
                <p style="margin-top: 8px; color: #F59E0B;">
                  ⚠️ Recordá corroborar los pagos en la sección <strong>Permisos y Alumnos</strong> para otorgar el acceso a los estudiantes.
                </p>
              </div>
            `,
            showCancelButton: true,
            confirmButtonText: "Ver Permisos de Alumnos",
            cancelButtonText: "Entendido",
            confirmButtonColor: "#7C3AED",
            cancelButtonColor: "#374151",
            background: "#19191B",
            color: "#FFFFFF"
          }).then((result) => {
            if (result.isConfirmed) {
              setSeccionActiva("studentAccess");
            }
          });
        }
      }

      setTodosMisProductos(Array.isArray(prod.data) ? prod.data : []);
      setVentasPendientesDeCierre(Array.isArray(vent.data) ? vent.data : []);
      setPagosCajaPendientes(Array.isArray(caja.data) ? caja.data : []);
      setRecaudaciones(
        (Array.isArray(rec.data) ? rec.data : []).map((r) => {
          let fechaExplicita = (r.op2 || "").replace("Fecha: ", "");
          if (!fechaExplicita && r.createdAt) {
            fechaExplicita = new Date(r.createdAt).toLocaleDateString("es-AR");
          }
          return {
            id: r.id,
            mes: fechaExplicita || r.mes || "S/D",
            montoRecaudado: parseFloat(r.totalFinal) || 0,
            productosVendidos: [...(r.pagosEcommerce || []), ...(r.pagosLocal || [])],
            createdAt: r.createdAt
          };
        })
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, []);

  const dataGrafico = useMemo(() => {
    let filtered = [...recaudaciones].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
    if (fechaInicio || fechaFin) {
      if (fechaInicio)
        filtered = filtered.filter(
          (r) => new Date(r.createdAt) >= new Date(fechaInicio + "T00:00:00")
        );
      if (fechaFin)
        filtered = filtered.filter(
          (r) => new Date(r.createdAt) <= new Date(fechaFin + "T23:59:59")
        );
      return filtered.map((r) => ({ mes: r.mes, recaudado: r.montoRecaudado }));
    }
    return filtered.map((r) => ({ mes: r.mes, recaudado: r.montoRecaudado })).slice(-10);
  }, [recaudaciones, fechaInicio, fechaFin]);

  const recaudacionPendienteTotal = useMemo(() => {
    const ecom = ventasPendientesDeCierre.reduce(
      (acc, s) =>
        acc +
        parseFloat(s.precio || 0) *
        parseInt(s.cantidad || 1) *
        (1 - parseFloat(s.descuentoGlobalAplicado || 0) / 100),
      0
    );
    const local = pagosCajaPendientes.reduce(
      (acc, p) => acc + parseFloat(p.montoTotal || 0),
      0
    );
    return ecom + local;
  }, [ventasPendientesDeCierre, pagosCajaPendientes]);

  const desgloseCajaAbierta = useMemo(() => {
    let ecomRev = 0,
      ecomCost = 0,
      localRev = 0,
      localCost = 0;
    ventasPendientesDeCierre.forEach((s) => {
      const precioVenta =
        (parseFloat(s.precio) || 0) *
        (parseInt(s.cantidad) || 1) *
        (1 - parseFloat(s.descuentoGlobalAplicado || 0) / 100);
      const costo = (parseFloat(s.precioCompra) || 0) * (parseInt(s.cantidad) || 1);
      ecomRev += precioVenta;
      ecomCost += costo;
    });
    pagosCajaPendientes.forEach((p) => {
      localRev += parseFloat(p.montoTotal) || 0;
      (p.productos || []).forEach((prod) => {
        localCost += (parseFloat(prod.precioCompra) || 0) * (parseInt(prod.cantidad) || 1);
      });
    });
    const gananciaTotal = ecomRev + localRev - (ecomCost + localCost);
    return {
      ecommerce: { rev: ecomRev, cost: ecomCost, profit: ecomRev - ecomCost },
      local: { rev: localRev, cost: localCost, profit: localRev - localCost },
      total: {
        rev: ecomRev + localRev,
        cost: ecomCost + localCost,
        profit: gananciaTotal
      }
    };
  }, [ventasPendientesDeCierre, pagosCajaPendientes]);

  const gananciaPendienteTotal = desgloseCajaAbierta.total.profit;
  const activeMenuObj =
    ALL_MENU_ITEMS.find((item) => item.id === seccionActiva) || ALL_MENU_ITEMS[0];

  const handleLogout = () => {
    localStorage.removeItem("token");
    if (authCtx?.setToken) authCtx.setToken(null);
    navigate("/login");
  };

  return (
    <div className="h-[125dvh] overflow-hidden bg-[#FAF9F6] text-[#222222] flex flex-col font-['Inter',sans-serif]">
      {/* Backdrop en Móvil/Tablet */}
      <AnimatePresence>
        {isMobile && sidebarVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarVisible(false)}
            className="fixed inset-0 bg-neutral-900/30 backdrop-blur-xs z-[90]"
          />
        )}
      </AnimatePresence>

      {/* ── SIDEBAR LATERAL (WARM MINIMALIST SAAS) ── */}
      <aside
        className={`fixed top-0 left-0 h-[125dvh] bg-[#F9F8F5] text-[#222222] border-r border-[#ECECE8] z-[100] flex flex-col transition-transform duration-200 ease-in-out w-[260px] ${sidebarVisible ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Cabecera del Sidebar */}
        <div className="px-4 py-3.5 border-b border-[#EAEAE6] flex items-center justify-between gap-3 shrink-0 bg-[#F9F8F5]">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#ECECE6] p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img
                src={bloomLogo}
                alt="English Bloom"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-neutral-900 tracking-tight block truncate">
                English Bloom
              </span>
              <span className="text-[11px] text-neutral-400 block truncate">
                Workspace Admin
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarVisible(false)}
            className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-900 hover:text-white transition-all shrink-0"
            title="Ocultar menú lateral"
          >
            {isMobile ? <FiX className="w-3.5 h-3.5" /> : <FiChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-5 [scrollbar-width:thin] [scrollbar-color:#D5D5CF_transparent]">
          {ADMIN_MENU_GROUPS.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-2.5 text-[10px] font-medium text-neutral-400 uppercase tracking-wider mb-1.5 block">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = seccionActiva === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSeccionActiva(item.id);
                        if (isMobile) setSidebarVisible(false);
                      }}
                      className={`w-full text-left px-3 py-2 transition-all flex items-center gap-2.5 text-xs ${isActive
                        ? "bg-white text-neutral-950 font-semibold shadow-sm border border-[#EAEAE6] rounded-xl"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-[#F0EFEA] rounded-xl border border-transparent"
                        }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-neutral-950" : "text-neutral-500"
                          }`}
                      />
                      <div className="min-w-0 flex-1 flex items-center justify-between">
                        <div className="truncate leading-snug">{item.label}</div>
                        {item.id === "studentAccess" && pendingSalesCount > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                              {pendingSalesCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Pie del Sidebar */}
        <div className="p-3 border-t border-[#EAEAE6] bg-[#F9F8F5] space-y-1.5 shrink-0">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-between gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
          >
            <span>Volver a la Web</span>
            <FiExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#FFF1EB] hover:bg-[#FDE0D3] text-[#F36B2B] text-xs font-semibold px-3 py-2 rounded-xl border border-[#FDE0D3] transition-colors"
          >
            <FiLogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ── CONTENEDOR PRINCIPAL DEL ADMIN ── */}
      <div
        className={`flex-1 flex flex-col h-[125dvh] min-h-0 overflow-hidden transition-all duration-200 ${sidebarVisible && !isMobile ? "lg:pl-[260px]" : "pl-0"
          }`}
      >
        {/* Barra Superior Fija del Panel Admin */}
        <header className="shrink-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-xs border-b border-[#EAEAE6] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors shrink-0"
              title={sidebarVisible ? "Ocultar menú" : "Mostrar menú"}
            >
              <FiMenu className="w-3.5 h-3.5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-400">
                <span>Administración</span>
                <span>/</span>
                <span className="text-neutral-700 font-semibold truncate">
                  {activeMenuObj?.label}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acceso Rápido Estandarizados & Notificaciones */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* ── SECCIÓN DE NOTIFICACIONES ── */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
                className={`relative inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all ${pendingSalesCount > 0
                    ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 shadow-xs"
                    : "bg-white hover:bg-[#F3F2EE] text-neutral-700 border-[#DEDEDA] shadow-2xs"
                  }`}
                title="Notificaciones de ventas y accesos"
              >
                <FiBell className="w-4 h-4" />
                {pendingSalesCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-bold items-center justify-center shadow-xs">
                      {pendingSalesCount}
                    </span>
                  </span>
                )}
              </button>

              {/* Popover de Notificaciones */}
              <AnimatePresence>
                {showNotificationMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#ECECE6] rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="p-3.5 border-b border-[#F1F1EB] flex items-center justify-between bg-[#FAF9F6]">
                      <div className="flex items-center gap-2">
                        <FiBell className="w-4 h-4 text-neutral-800" />
                        <span className="text-xs font-bold text-neutral-900">Notificaciones del Sistema</span>
                      </div>
                      {pendingSalesCount > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                          {pendingSalesCount} pendiente{pendingSalesCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="p-3 max-h-72 overflow-y-auto">
                      {pendingSalesCount > 0 ? (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                            <FiShield className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-neutral-900 mb-0.5">
                              Se realizaron ventas de cursos
                            </p>
                            <p className="text-[11px] text-neutral-600 leading-relaxed mb-2.5">
                              Tenés <strong>{pendingSalesCount} venta(s)</strong> registradas. Es necesario corroborar los pagos para otorgar el acceso correspondiente.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSeccionActiva("studentAccess");
                                setShowNotificationMenu(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#19191B] hover:bg-neutral-800 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-colors"
                            >
                              <span>Corroborar Pagos y Accesos</span>
                              <FiChevronLeft className="w-3 h-3 rotate-180" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-neutral-400 space-y-1">
                          <FiCheckCircle className="w-6 h-6 mx-auto text-emerald-500" />
                          <p className="text-xs font-semibold text-neutral-700">Todo al día</p>
                          <p className="text-[11px]">No hay pagos ni accesos pendientes de corroborar.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setSeccionActiva("cargar")}
              className={
                seccionActiva === "cargar"
                  ? "hidden sm:inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  : "hidden sm:inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
              }
            >
              <FiPlus className="w-3.5 h-3.5" /> Nuevo Curso
            </button>

            <button
              type="button"
              onClick={() => setSeccionActiva("productos")}
              className={
                seccionActiva === "productos"
                  ? "hidden md:inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  : "hidden md:inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
              }
            >
              <FiBookOpen className="w-3.5 h-3.5" /> Inventario
            </button>

            <button
              type="button"
              onClick={() => setSeccionActiva("liveEditor")}
              className={
                seccionActiva === "liveEditor"
                  ? "hidden md:inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
                  : "hidden md:inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
              }
            >
              <FiLayers className="w-3.5 h-3.5" /> Editor Web
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition-colors"
            >
              <span className="hidden sm:inline">Ver Web</span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Área de Trabajo del Módulo Activo */}
        <main data-lenis-prevent className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#FAF9F6] text-[#222222]">
          {/* ── DASHBOARD GENERAL ── */}
          {seccionActiva === "dashboard" && (
            <div>
              {/* 1. Header del Módulo */}
              <div className="p-6 pb-2 border-b border-[#EAEAE6]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                  <div>
                    <span className="text-[11px] font-medium text-neutral-400 block mb-1">
                      Métricas y Finanzas / Overview
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                      Resumen General
                    </h1>
                  </div>
                  <div className="flex items-center gap-2.5">
                    {loading && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]">
                        Sincronizando métricas...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={obtenerDatos}
                      className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                    >
                      <FiActivity className="w-3.5 h-3.5" /> Actualizar
                    </button>
                  </div>
                </div>
              </div>

              {/* 2. Secciones de Contenido */}
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-neutral-900">
                    Indicadores Principales
                  </h2>
                  <span className="text-[11px] text-neutral-400">
                    Datos operativos en tiempo real
                  </span>
                </div>

                {/* 3. Grilla de Tarjetas KPI */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    {
                      label: "Cursos Activos",
                      sub: "Catálogo publicado",
                      val: todosMisProductos.length,
                      badge: "Activo",
                      badgeClass: "bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]",
                      icon: FiPackage
                    },
                    {
                      label: "Operaciones del Día",
                      sub: "Pendientes de arqueo",
                      val: ventasPendientesDeCierre.length + pagosCajaPendientes.length,
                      badge: "En curso",
                      badgeClass: "bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]",
                      icon: FiClock
                    },
                    {
                      label: "Recaudación Pendiente",
                      sub: "Caja abierta actual",
                      val: `$${recaudacionPendienteTotal.toLocaleString("es-AR")}`,
                      badge: "Pendiente",
                      badgeClass: "bg-[#FFF1EB] text-[#F36B2B] border-[#FDE0D3]",
                      icon: FiDollarSign
                    },
                    {
                      label: "Ganancia Neta",
                      sub: "Margen operativo",
                      val: `$${gananciaPendienteTotal.toLocaleString("es-AR")}`,
                      badge: "Rentabilidad",
                      badgeClass: "bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]",
                      icon: FiTrendingUp
                    }
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={i}
                        className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col justify-between group"
                      >
                        <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F1F1EB]">
                          <div>
                            <h3 className="text-xs font-bold text-neutral-900">{card.label}</h3>
                            <p className="text-[11px] text-neutral-400">{card.sub}</p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="pt-3 flex items-end justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-neutral-400 block">Total</span>
                            <span className="text-lg font-bold text-neutral-900">{card.val}</span>
                          </div>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${card.badgeClass}`}
                          >
                            {card.badge}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. Bloques de Datos: Gráfico y Balance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 pt-2">
                  <div className="lg:col-span-2 bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F1F1EB]">
                      <div>
                        <h2 className="text-base font-semibold text-neutral-900">
                          Evolución de Ingresos
                        </h2>
                        <p className="text-[11px] text-neutral-400">
                          Histórico de cierres de caja registrados
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={dateInicioRef}
                          type="date"
                          value={fechaInicio}
                          onChange={(e) => setFechaInicio(e.target.value)}
                          className="bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                        <input
                          ref={dateFinRef}
                          type="date"
                          value={fechaFin}
                          onChange={(e) => setFechaFin(e.target.value)}
                          className="bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        />
                        {(fechaInicio || fechaFin) && (
                          <button
                            type="button"
                            onClick={() => {
                              setFechaInicio("");
                              setFechaFin("");
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
                            title="Limpiar fechas"
                          >
                            <FiX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dataGrafico}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F1EB" vertical={false} />
                          <XAxis
                            dataKey="mes"
                            stroke="#a3a3a3"
                            tick={{ fontSize: 11, fill: "#737373" }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="#a3a3a3"
                            tick={{ fontSize: 11, fill: "#737373" }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => `$${val.toLocaleString()}`}
                            width={70}
                          />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="recaudado"
                            stroke="#19191B"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#19191B" }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="pb-3 border-b border-[#F1F1EB]">
                        <h2 className="text-base font-semibold text-neutral-900">
                          Balance Activo
                        </h2>
                        <p className="text-[11px] text-neutral-400">
                          Desglose de caja sin cerrar
                        </p>
                      </div>

                      <div className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Ingresos Brutos</span>
                          <span className="text-xs font-medium text-neutral-700">
                            ${desgloseCajaAbierta.total.rev.toLocaleString("es-AR")}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]">
                          Bruto
                        </span>
                      </div>

                      <div className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-neutral-400 block">Ganancia Neta Actual</span>
                          <span className="text-xs font-bold text-neutral-900">
                            ${desgloseCajaAbierta.total.profit.toLocaleString("es-AR")}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EDF9F0] text-[#29974D] border-[#DCF3E3]">
                          Neto
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] text-neutral-400 block uppercase tracking-wider">
                        Últimos Cierres
                      </span>
                      <div className="space-y-1.5">
                        {recaudaciones.slice(0, 4).map((r) => (
                          <div
                            key={r.id}
                            className="px-3 py-2 flex justify-between items-center bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl text-xs"
                          >
                            <span className="text-[11px] text-neutral-500">{r.mes}</span>
                            <span className="text-xs font-medium text-neutral-700">
                              ${r.montoRecaudado.toLocaleString("es-AR")}
                            </span>
                          </div>
                        ))}
                        {recaudaciones.length === 0 && (
                          <div className="px-3 py-4 text-center text-[11px] text-neutral-400 bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl">
                            Sin cierres registrados
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── RENDERIZADO DE SUBMÓDULOS ── */}
          {seccionActiva === "Balance" && <BalanceModule />}
          {seccionActiva === "personalBalance" && <PersonalBalance />}
          {seccionActiva === "Encargos" && <Encargos />}
          {seccionActiva === "caja" && <ModuloCaja />}
          {seccionActiva === "productos" && <InventarioProductos />}
          {seccionActiva === "cargar" && <CargaDeProductos />}
          {seccionActiva === "likes" && <LikesControl />}
          {seccionActiva === "studentAccess" && <AdminStudentAccess onUpdate={obtenerDatos} />}
          {seccionActiva === "ventasOnline" && <VentasEcommerceOnline />}
          {seccionActiva === "ventasLocal" && <HistorialDeVentasLocal />}
          {seccionActiva === "historialRecaudacionFinal" && <HistorialRecaudacionFinal />}
          {seccionActiva === "facturacion" && <Facturacion />}
          {seccionActiva === "clientes" && <ModuloClientes />}
          {seccionActiva === "revendedores" && <ModuloRevendedores />}
          {seccionActiva === "cargarContenidoWeb" && <CargaContenidoWeb />}
          {seccionActiva === "liveEditor" && <LiveEditor />}
          {seccionActiva === "gastos" && <Gastos />}
          {seccionActiva === "whatsapp" && <WhatsappQrSection />}
          {seccionActiva === "ganancias" && <ReporteGanancias />}
          {seccionActiva === "control" && (
            <CierreCajaDiario
              ventasPendientes={ventasPendientesDeCierre}
              pagosCajaPendientes={pagosCajaPendientes}
              onCierreExitoso={obtenerDatos}
            />
          )}
          {seccionActiva === "costos" && <ConfiguracionCostos />}
          {seccionActiva === "mayorista" && <ConfiguracionMayorista />}
          {seccionActiva === "empleados" && <ModuloEmpleados />}
          {seccionActiva === "pronunciacion" && <AdminPronunciation />}
        </main>
      </div>
    </div>
  );
};

export default Admin;

