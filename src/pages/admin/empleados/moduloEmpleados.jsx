import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    FiUser, FiShield, FiSave, FiSearch, FiFilter, FiTrash, FiEye, FiX, FiMail, FiPhone,
    FiPlus, FiList, FiActivity, FiCheck, FiLock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import authContext from '../../../store/store';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ESTILOS B2B SaaS / ERP ---
const STYLES = {
    title: "text-base font-medium text-neutral-800",
    label: "text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5 block",
    tech: "text-xs text-neutral-700",
    input: "w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors",
    card: "bg-white border border-[#ECECE6] shadow-xs rounded-2xl p-6",
    buttonPrimary: "h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-[#19191B] hover:bg-neutral-800 text-white",
    buttonSecondary: "h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6]",
    tabActive: "h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-[#19191B] hover:bg-neutral-800 text-white",
    tabInactive: "h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-white border border-[#ECECE6] text-neutral-700 hover:bg-[#FAF9F6]",
    alertNeutral: "p-4 rounded-2xl flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 text-xs font-medium",
    alertSuccess: "p-4 rounded-2xl flex items-center gap-3 bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3] text-xs font-medium"
};

// --- COMPONENTE: DETALLE DE USUARIO (MODAL) ---
const DetalleUsuario = ({ user, onClose }) => {
    if (!user) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(date);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#19191B]/40 backdrop-blur-sm p-4 font-['Inter',sans-serif] text-neutral-900">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl w-full max-w-md p-6 relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
                >
                    <FiX className="w-4 h-4" />
                </button>

                <div className="mb-6 border-b border-[#ECECE6] pb-4">
                    <h2 className={`${STYLES.title} flex items-center gap-2`}>
                        <FiUser className="w-5 h-5 text-neutral-700" /> FICHA DE USUARIO
                    </h2>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#ECECE6]">
                            <label className={STYLES.label}>ID INTERNO</label>
                            <p className="text-xs font-medium text-neutral-900">#{user.id}</p>
                        </div>
                        <div className="bg-[#FAF9F6] p-3 rounded-2xl border border-[#ECECE6]">
                            <label className={STYLES.label}>ROL DE ACCESO</label>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-xl text-xs font-medium uppercase ${
                                user.role === 'admin'
                                    ? 'bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3]'
                                    : 'bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6]'
                            }`}>
                                {user.role || 'USER'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-[#ECECE6] p-4 rounded-2xl">
                        <label className={STYLES.label}>NOMBRE COMPLETO</label>
                        <p className="text-base font-medium text-neutral-900">{user.name}</p>
                    </div>

                    <div className="space-y-4 bg-[#FAF9F6] p-4 rounded-2xl border border-[#ECECE6]">
                        <div>
                            <label className={STYLES.label}>EMAIL REGISTRADO</label>
                            <div className="flex items-center gap-2.5 text-neutral-700">
                                <FiMail className="w-4 h-4 text-neutral-400" />
                                <p className="text-xs text-neutral-700">{user.email || 'NO REGISTRADO'}</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-[#ECECE6]">
                            <label className={STYLES.label}>TELÉFONO DE CONTACTO</label>
                            <div className="flex items-center gap-2.5 text-neutral-700">
                                <FiPhone className="w-4 h-4 text-neutral-400" />
                                <p className="text-xs text-neutral-700">{user.number || 'NO REGISTRADO'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#ECECE6]">
                        <div>
                            <label className={STYLES.label}>FECHA DE ALTA</label>
                            <p className="text-xs text-neutral-700">{formatDate(user.createdAt)}</p>
                        </div>
                        <div>
                            <label className={STYLES.label}>ÚLTIMO LOG</label>
                            <p className="text-xs text-neutral-700">{formatDate(user.updatedAt)}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- COMPONENTE: FORMULARIO DE REGISTRO ---
const RegistroUsuarioContent = ({ fetchUsers }) => {
    const [user, setUser] = useState({ name: '', email: '', number: '', password: '', role: 'user' });
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUser(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardarUsuario = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Crear usuario básico: Enviamos explícitamente solo los datos requeridos.
            const res = await axios.post(`${API_URL}/createuser`, {
                name: user.name,
                email: user.email,
                number: user.number,
                password: user.password
            });

            // Detectamos el ID del usuario creado en la respuesta para asignar el rol
            const createdUser = res.data.user || res.data.data || res.data;
            if (createdUser?.id && user.role !== 'user') {
                await axios.put(`${API_URL}/update-role/${createdUser.id}`, { role: user.role });
            }

            setNotification({ show: true, type: 'success', message: 'EMPLEADO REGISTRADO CORRECTAMENTE' });
            setUser({ name: '', email: '', number: '', password: '', role: 'user' });
            if (fetchUsers) fetchUsers();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data || "ERROR AL REGISTRAR";
            setNotification({ show: true, type: 'error', message: String(errorMsg).toUpperCase() });
        } finally {
            setLoading(false);
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        }
    };

    return (
        <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl relative overflow-hidden">
            {notification.show && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
                >
                    <div className={notification.type === 'success' ? STYLES.alertSuccess : STYLES.alertNeutral}>
                        {notification.type === 'success' ? <FiCheck className="w-5 h-5" /> : <FiX className="w-5 h-5" />}
                        <div>
                            <h3 className="text-base font-medium">{notification.type === 'success' ? 'COMPLETADO' : 'ERROR'}</h3>
                            <p className="text-xs mt-0.5">{notification.message}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="px-6 py-4 border-b border-[#ECECE6] bg-[#F8F8F5]">
                <h2 className={`${STYLES.title} flex items-center gap-2`}>
                    <FiPlus className="w-5 h-5 text-neutral-700" /> REGISTRO INTERNO DE PERSONAL
                </h2>
            </div>

            <div className="p-6">
                <form onSubmit={handleGuardarUsuario} className="space-y-8">
                    <section>
                        <h3 className="text-base font-medium text-neutral-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-4 h-4 text-neutral-500" /> 01 DATOS GENERALES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={STYLES.label}>NOMBRE COMPLETO</label>
                                <div className="relative">
                                    <FiUser className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" name="name" value={user.name} onChange={handleInputChange} className={`${STYLES.input} pl-9`} required placeholder="EJ: PEDRO SÁNCHEZ" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>EMAIL CORPORATIVO</label>
                                <div className="relative">
                                    <FiMail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="email" name="email" value={user.email} onChange={handleInputChange} className={`${STYLES.input} pl-9`} required placeholder="EMPLEADO@LU.COM" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-base font-medium text-neutral-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-4 h-4 text-neutral-500" /> 02 SEGURIDAD Y ACCESO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className={STYLES.label}>TELÉFONO INTERNO</label>
                                <div className="relative">
                                    <FiPhone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" name="number" value={user.number} onChange={handleInputChange} className={`${STYLES.input} pl-9`} required placeholder="54911..." />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>CONTRASEÑA ACCESO</label>
                                <div className="relative">
                                    <FiLock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="password" name="password" value={user.password} onChange={handleInputChange} className={`${STYLES.input} pl-9`} required placeholder="••••••••" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>ROL ASIGNADO</label>
                                <div className="relative">
                                    <FiShield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <select name="role" value={user.role} onChange={handleInputChange} className={`${STYLES.input} pl-9 appearance-none cursor-pointer`}>
                                        <option value="user">Usuario</option>
                                        <option value="vendedor">Vendedor</option>
                                        <option value="tecnico">Técnico</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end pt-6 border-t border-[#ECECE6]">
                        <button type="submit" disabled={loading} className={`${STYLES.buttonPrimary} w-full sm:w-auto`}>
                            {loading ? <FiActivity className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                            {loading ? 'PROCESANDO...' : 'GUARDAR USUARIO'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ModuloEmpleados = () => {
    const [activeTab, setActiveTab] = useState('lista');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [viewingUser, setViewingUser] = useState(null);
    const authCtx = useContext(authContext);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/getAllUsers`);
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(`${API_URL}/update-role/${userId}`, { role: newRole });
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));

            if (window.Swal) {
                Swal.fire({
                    icon: 'success',
                    title: 'Rol actualizado',
                    text: `Usuario actualizado a: ${newRole.toUpperCase()}`,
                    timer: 1500,
                    showConfirmButton: false,
                    background: '#fff',
                    color: '#000'
                });
            }
        } catch (error) {
            console.error("Error al cambiar rol:", error);
            if (window.Swal) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo actualizar el rol.',
                    background: '#fff',
                    color: '#000'
                });
            } else {
                alert('No se pudo actualizar el rol.');
            }
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('¿ELIMINAR ESTE USUARIO? ESTA ACCIÓN ES IRREVERSIBLE.')) {
            try {
                await axios.delete(`${API_URL}/delete-user/${userId}`);
                setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Error al eliminar el usuario.");
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-[#FAF9F6] font-['Inter',sans-serif] text-neutral-900">
            <div className="p-6 space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif] text-neutral-900">
                <AnimatePresence>
                    {viewingUser && <DetalleUsuario user={viewingUser} onClose={() => setViewingUser(null)} />}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">
                            GESTIÓN PERSONAL
                        </h1>
                        <p className="text-xs text-neutral-500 mt-1">SYSTEM ADMIN // EMPLOYEES DB</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] text-xs font-medium uppercase tracking-wider self-start sm:self-auto">
                        SESIÓN DE ADMINISTRADOR
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 border-b border-[#ECECE6] pb-4">
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}
                    >
                        <FiList className="w-4 h-4" /> LISTA DE PERSONAL
                    </button>
                    <button
                        onClick={() => setActiveTab('registro')}
                        className={activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}
                    >
                        <FiPlus className="w-4 h-4" /> REGISTRAR NUEVO
                    </button>
                </div>

                <div className="pb-12">
                    {activeTab === 'registro' ? (
                        <RegistroUsuarioContent fetchUsers={fetchUsers} />
                    ) : (
                        <div className="space-y-4">
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 rounded-2xl border border-[#ECECE6] bg-white shadow-xs">
                                <h2 className={`${STYLES.title} flex items-center gap-2`}>
                                    <FiList className="w-5 h-5 text-neutral-700" /> REGISTROS ACTUALES
                                </h2>
                                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="FILTRAR..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className={`${STYLES.input} pl-9`}
                                        />
                                    </div>
                                    <div className="relative">
                                        <FiFilter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                        <select
                                            value={filterRole}
                                            onChange={(e) => setFilterRole(e.target.value)}
                                            className="h-10 pl-3 pr-9 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors appearance-none cursor-pointer w-full sm:w-auto"
                                        >
                                            <option value="all">TODOS</option>
                                            <option value="admin">ADMIN</option>
                                            <option value="tecnico">TÉCNICO</option>
                                            <option value="vendedor">VENDEDOR</option>
                                            <option value="user">USER</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-2xl border border-[#ECECE6] bg-white shadow-xs">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#F8F8F5] border-b border-[#ECECE6]">
                                        <tr>
                                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">EMPLEADO</th>
                                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">EMAIL CORPORATIVO</th>
                                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">ROL DE ACCESO</th>
                                            <th className="px-4 py-3 text-right align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#F1F1EB]">
                                        {loading ? (
                                            <tr><td colSpan="4" className="px-4 py-16 text-center align-middle"><FiActivity className="w-5 h-5 mx-auto text-neutral-900 animate-spin mb-2"/><span className="text-xs text-neutral-700">CARGANDO DATOS...</span></td></tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr><td colSpan="4" className="px-4 py-16 text-center align-middle text-xs text-neutral-500">NO HAY RESULTADOS</td></tr>
                                        ) : (
                                            filteredUsers.map(user => (
                                                <tr key={user.id} className="hover:bg-[#F8F8F5] transition-colors">
                                                    <td className="px-4 py-3 text-left align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-xl border
                                                                ${user.role === 'admin' ? 'bg-[#19191B] text-white border-neutral-900' : 'bg-[#F3F2EE] text-neutral-700 border-[#ECECE6]'}`}>
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-xs font-medium text-neutral-900">{user.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-left align-middle text-xs text-neutral-700">{user.email}</td>
                                                    <td className="px-4 py-3 text-left align-middle">
                                                        <span className={`px-2.5 py-1 rounded-xl text-xs font-medium uppercase
                                                            ${user.role === 'admin' ? 'bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3]' : 'bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6]'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right align-middle">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => setViewingUser(user)} className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors" title="VER"><FiEye className="w-4 h-4" /></button>
                                                            <div className="relative">
                                                                <select
                                                                    value={user.role}
                                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                    disabled={user.id === authCtx.user?.id}
                                                                    className="h-10 pl-3 pr-8 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                                                >
                                                                    <option value="user">USUARIO</option>
                                                                    <option value="vendedor">VENDEDOR</option>
                                                                    <option value="tecnico">TÉCNICO</option>
                                                                    <option value="admin">ADMIN</option>
                                                                </select>
                                                                <FiShield className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteUser(user.id)}
                                                                disabled={user.id === authCtx.user?.id}
                                                                className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                                                title="ELIMINAR"
                                                            >
                                                                <FiTrash className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModuloEmpleados;
