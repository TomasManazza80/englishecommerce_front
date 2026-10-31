import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  FiUsers,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
  FiPhone,
  FiMail,
  FiCopy,
  FiRefreshCw,
  FiBookOpen,
  FiShield,
  FiExternalLink,
  FiLock,
  FiUnlock,
  FiAlertTriangle
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

export default function AdminStudentAccess({ onUpdate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'pending_access' | 'granted' | 'paid' | 'pending_payment'
  const [togglingId, setTogglingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/student-access`);
      setStudents(res.data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: 'No se pudo cargar el listado de estudiantes y accesos.',
        background: '#19191B',
        color: '#FFFFFF',
        confirmButtonColor: '#7C3AED'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleAccess = async (student) => {
    const willGrant = !student.accessGranted;
    const actionText = willGrant ? 'Habilitar acceso inmediato' : 'Revocar acceso';
    const confirmColor = willGrant ? '#10B981' : '#EF4444';

    const result = await Swal.fire({
      title: willGrant ? '¿Habilitar acceso al curso?' : '¿Revocar acceso al estudiante?',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.5; color: #D1D5DB;">
          <p><strong>Estudiante:</strong> ${student.name || 'Sin nombre'}</p>
          <p><strong>Email:</strong> ${student.userEmail || 'Sin email'}</p>
          <p><strong>Código de Verificación:</strong> <code style="color: #A78BFA; font-weight: bold;">${student.verificationCode}</code></p>
          <p style="margin-top: 10px; color: ${willGrant ? '#34D399' : '#F87171'};">
            ${willGrant
              ? '✅ El estudiante tendrá acceso completo e inmediato a los cursos y prácticas interactivas en su panel.'
              : '⚠️ El estudiante quedará bloqueado y no podrá ver ni acceder a los contenidos del curso.'}
          </p>
        </div>
      `,
      icon: willGrant ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: actionText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: confirmColor,
      cancelButtonColor: '#374151',
      background: '#19191B',
      color: '#FFFFFF'
    });

    if (!result.isConfirmed) return;

    setTogglingId(student.id);
    try {
      const res = await axios.post(`${API_URL}/api/admin/student-access/${student.id}/toggle`, {
        accessGranted: willGrant
      });

      if (res.data && res.data.success) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  accessGranted: res.data.order.accessGranted,
                  accessGrantedAt: res.data.order.accessGrantedAt
                }
              : s
          )
        );

        Swal.fire({
          icon: 'success',
          title: willGrant ? '¡Acceso Habilitado!' : 'Acceso Revocado',
          text: willGrant
            ? `El alumno ${student.name} ya puede acceder a su curso.`
            : `Se ha retirado el acceso para ${student.name}.`,
          background: '#19191B',
          color: '#FFFFFF',
          confirmButtonColor: '#7C3AED',
          timer: 2500,
          timerProgressBar: true
        });

        onUpdate?.();
      }
    } catch (err) {
      console.error('Error toggling access:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err?.response?.data?.error || 'No se pudo actualizar el permiso de acceso.',
        background: '#19191B',
        color: '#FFFFFF',
        confirmButtonColor: '#7C3AED'
      });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.userEmail && s.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.verificationCode && s.verificationCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.cellphone && s.cellphone.includes(searchTerm));

      if (!matchSearch) return false;

      if (filterTab === 'pending_access') {
        return !s.accessGranted;
      }
      if (filterTab === 'granted') {
        return s.accessGranted;
      }
      if (filterTab === 'paid') {
        return s.status === 'paid' || s.status === 'approved';
      }
      if (filterTab === 'pending_payment') {
        return s.status === 'pending';
      }
      return true;
    });
  }, [students, searchTerm, filterTab]);

  const stats = useMemo(() => {
    const total = students.length;
    const granted = students.filter((s) => s.accessGranted).length;
    const pendingAccess = students.filter((s) => !s.accessGranted).length;
    const paidOrders = students.filter((s) => s.status === 'paid' || s.status === 'approved');
    const totalIncome = paidOrders.reduce((acc, s) => acc + (parseFloat(s.total) || 0), 0);

    return { total, granted, pendingAccess, totalIncome };
  }, [students]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(parseFloat(val || 0));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'S/D';
    try {
      return new Date(dateString).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAEAE6]">
        <div>
          <span className="text-[11px] font-medium text-neutral-400 block mb-1">
            Ventas y Alumnos / Control de Inscripciones
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 flex items-center gap-3">
            Permisos de Acceso a Cursos
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              Control Manual Activo
            </span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Revisá los comprobantes o códigos de verificación de alumnos que intentaron pagar o abonaron, y otorgá acceso individual con un solo clic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Estudiantes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FiUsers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
          <span className="text-[11px] text-neutral-400">Intentos y pagos registrados</span>
        </div>

        <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pendientes de Aprobación</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FiAlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{stats.pendingAccess}</div>
          <span className="text-[11px] text-neutral-400">Esperan permiso del admin</span>
        </div>

        <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Accesos Habilitados</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FiShield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.granted}</div>
          <span className="text-[11px] text-neutral-400">Alumnos cursando actualmente</span>
        </div>

        <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Recaudación Confirmada</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.totalIncome)}</div>
          <span className="text-[11px] text-neutral-400">Órdenes con pago liquidado</span>
        </div>
      </div>

      {/* ── SEARCH & FILTER TABS ── */}
      <div className="bg-white border border-[#ECECE6] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por alumno, email, celular o código (ej. BLOOM-123)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#F8F8F5] border border-[#E2E2DC] rounded-xl text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-[#19191B] text-white shadow-xs'
                : 'bg-[#F8F8F5] text-neutral-600 hover:bg-[#EFEFEA]'
            }`}
          >
            Todos ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending_access')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterTab === 'pending_access'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-[#F8F8F5] text-neutral-600 hover:bg-[#EFEFEA]'
            }`}
          >
            Pendientes ({stats.pendingAccess})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('granted')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterTab === 'granted'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-[#F8F8F5] text-neutral-600 hover:bg-[#EFEFEA]'
            }`}
          >
            Habilitados ({stats.granted})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('paid')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-colors whitespace-nowrap ${
              filterTab === 'paid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-[#F8F8F5] text-neutral-600 hover:bg-[#EFEFEA]'
            }`}
          >
            Pagados
          </button>
        </div>
      </div>

      {/* ── STUDENTS LIST ── */}
      {loading ? (
        <div className="bg-white border border-[#ECECE6] rounded-2xl p-12 text-center text-neutral-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium">Cargando registros de estudiantes...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white border border-[#ECECE6] rounded-2xl p-12 text-center text-neutral-400">
          <FiUsers className="w-10 h-10 mx-auto mb-3 text-neutral-300" />
          <h3 className="text-sm font-semibold text-neutral-700 mb-1">No se encontraron estudiantes</h3>
          <p className="text-xs max-w-sm mx-auto">
            {searchTerm
              ? 'No hay registros que coincidan con tu búsqueda.'
              : 'Aún no se registraron órdenes o intentos de pago.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStudents.map((student) => {
            const isPaid = student.status === 'paid' || student.status === 'approved';
            const isGranted = Boolean(student.accessGranted);
            const isToggling = togglingId === student.id;
            const items = Array.isArray(student.items) ? student.items : [];

            // Formateo de número para WhatsApp
            const cleanPhone = (student.cellphone || '').replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('54')
              ? cleanPhone
              : cleanPhone.length >= 10
              ? `549${cleanPhone}`
              : cleanPhone;

            const waMessage = encodeURIComponent(
              `¡Hola ${student.name}! Te escribo del equipo de English Bloom respecto a tu curso. Tu código de verificación es: ${student.verificationCode}.`
            );

            return (
              <div
                key={student.id}
                className={`bg-white border transition-all rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] ${
                  isGranted ? 'border-emerald-200/80 bg-emerald-50/10' : 'border-[#ECECE6]'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Info Principal del Alumno */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Código de Verificación Destacado */}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(student.verificationCode)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900 text-purple-300 text-xs font-mono font-bold hover:bg-neutral-800 transition-colors"
                        title="Hacer clic para copiar código"
                      >
                        <FiShield className="w-3.5 h-3.5 text-purple-400" />
                        {student.verificationCode}
                        <FiCopy className="w-3 h-3 text-neutral-400" />
                        {copiedCode === student.verificationCode && (
                          <span className="text-[10px] text-emerald-400 ml-1">¡Copiado!</span>
                        )}
                      </button>

                      {/* Estado del Pago */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <FiCheckCircle className="w-3 h-3" /> Pago Acreditado
                          </>
                        ) : (
                          <>
                            <FiClock className="w-3 h-3" /> Pago Pendiente
                          </>
                        )}
                      </span>

                      {/* Estado del Permiso de Acceso */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          isGranted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {isGranted ? (
                          <>
                            <FiUnlock className="w-3 h-3" /> Acceso Permitido
                          </>
                        ) : (
                          <>
                            <FiLock className="w-3 h-3" /> Acceso Bloqueado
                          </>
                        )}
                      </span>

                      <span className="text-[11px] text-neutral-400">
                        {formatDate(student.createdAt)}
                      </span>
                    </div>

                    {/* Nombre y Contacto */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-neutral-600">
                      <div className="font-bold text-neutral-900 text-sm">{student.name}</div>

                      <div className="flex items-center gap-1 text-neutral-500">
                        <FiMail className="w-3.5 h-3.5" />
                        <span>{student.userEmail}</span>
                      </div>

                      {student.cellphone && student.cellphone !== 'N/A' && (
                        <div className="flex items-center gap-1.5">
                          <FiPhone className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{student.cellphone}</span>
                          <a
                            href={`https://wa.me/${waNumber}?text=${waMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold ml-1"
                          >
                            WhatsApp <FiExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Cursos Incluidos en la Orden */}
                    <div className="pt-1 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1">
                        <FiBookOpen className="w-3 h-3" /> Cursos:
                      </span>
                      {items.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] bg-[#F1F1EB] text-neutral-800 px-2 py-0.5 rounded-md font-medium"
                        >
                          {item.title || item.nombre} {item.quantity > 1 ? `(x${item.quantity})` : ''}
                        </span>
                      ))}
                      <span className="text-[11px] font-bold text-neutral-900 ml-1">
                        Total: {formatCurrency(student.total)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Permiso (Botón Principal) */}
                  <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                    <button
                      type="button"
                      disabled={isToggling}
                      onClick={() => handleToggleAccess(student)}
                      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        isGranted
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 shadow-md'
                      }`}
                    >
                      {isToggling ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : isGranted ? (
                        <>
                          <FiLock className="w-3.5 h-3.5" /> Revocar Acceso
                        </>
                      ) : (
                        <>
                          <FiUnlock className="w-3.5 h-3.5" /> Dar Permiso al Curso
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

