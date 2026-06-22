import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    FiUser, FiShield, FiSave, FiSearch, FiFilter, FiTrash, FiEye, FiX, FiMail, FiPhone,
    FiPlus, FiList, FiActivity, FiCheck, FiLock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import authContext from '../../../store/store';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ESTILOS PREMIUM (BLANCO Y NEGRO / INTER) ---
const STYLES = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] font-medium text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['Inter'] tracking-widest uppercase",
    input: "w-full bg-black border border-zinc-800 rounded-none py-3 px-4 text-sm text-white font-['Inter'] focus:border-white focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-zinc-700",
    glass: "bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl",
    buttonPrimary: "bg-white text-black font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-200 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)]",
    buttonSecondary: "bg-zinc-900 text-white font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-800 transition-all border border-zinc-800",
    tabActive: "text-white border-white bg-white/[0.02] shadow-[inset_0_-2px_0_#ffffff]",
    tabInactive: "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-white/[0.01]"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-300 font-['Inter']">
            <div className={`${STYLES.glass} w-full max-w-md p-8 relative shadow-2xl`}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
                >
                    <FiX size={24} />
                </button>

                <div className="mb-8 border-b border-white/10 pb-4">
                    <h2 className={`${STYLES.title} text-lg flex items-center gap-3`}>
                        <FiUser className="text-white" size={20} /> FICHA DE USUARIO
                    </h2>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={STYLES.label}>ID INTERNO</label>
                            <p className="font-['Inter'] text-xs text-zinc-500">#{user.id}</p>
                        </div>
                        <div>
                            <label className={STYLES.label}>ROL DE ACCESO</label>
                            <span className="inline-flex items-center px-2 py-1 rounded-none bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider border border-white/20">
                                {user.role || 'USER'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className={STYLES.label}>NOMBRE COMPLETO</label>
                        <p className="text-white font-bold text-lg tracking-wide uppercase">{user.name}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className={STYLES.label}>EMAIL REGISTRADO</label>
                            <div className="flex items-center gap-3 text-zinc-300">
                                <FiMail className="text-zinc-600" />
                                <p className="font-['Inter'] text-sm">{user.email || 'NO REGISTRADO'}</p>
                            </div>
                        </div>

                        <div>
                            <label className={STYLES.label}>TELÉFONO DE CONTACTO</label>
                            <div className="flex items-center gap-3 text-zinc-300">
                                <FiPhone className="text-zinc-600" />
                                <p className="font-['Inter'] text-sm">{user.number || 'NO REGISTRADO'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                        <div>
                            <label className={STYLES.label}>FECHA DE ALTA</label>
                            <p className="text-zinc-400 font-['Inter'] text-[10px]">{formatDate(user.createdAt)}</p>
                        </div>
                        <div>
                            <label className={STYLES.label}>ÚLTIMO LOG</label>
                            <p className="text-zinc-400 font-['Inter'] text-[10px]">{formatDate(user.updatedAt)}</p>
                        </div>
                    </div>
                </div>
            </div>
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
        <div className={`${STYLES.glass} rounded-none overflow-hidden relative font-['Inter']`}>
            {notification.show && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-full border-2 flex items-center justify-center mb-4 bg-black border-white text-white">
                        {notification.type === 'success' ? <FiCheck size={40} /> : <FiX size={40} />}
                    </div>
                    <p className={`${STYLES.tech} text-xs tracking-widest text-white uppercase`}>{notification.message}</p>
                </div>
            )}

            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiPlus size={18} className="text-white" /> REGISTRO INTERNO DE PERSONAL
                </h2>
            </div>

            <div className="p-10">
                <form onSubmit={handleGuardarUsuario} className="space-y-12">
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white font-bold mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 01 DATOS GENERALES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className={STYLES.label}>Nombre Completo</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="name" value={user.name} onChange={handleInputChange} className={`${STYLES.input} pl-12`} required placeholder="EJ: PEDRO SÁNCHEZ" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={STYLES.label}>Email_Corporativo</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="email" name="email" value={user.email} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="empleado@lu.com" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-white font-bold mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 02 SEGURIDAD Y ACCESO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className={STYLES.label}>Teléfono Interno</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="number" value={user.number} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="54911..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={STYLES.label}>Contraseña_Acceso</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="password" name="password" value={user.password} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={STYLES.label}>Rol_Asignado</label>
                                <div className="relative">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <select name="role" value={user.role} onChange={handleInputChange} className={`${STYLES.input} pl-12 appearance-none cursor-pointer uppercase`}>
                                        <option value="user">Usuario</option>
                                        <option value="vendedor">Vendedor</option>
                                        <option value="tecnico">Técnico</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end pt-6 border-t border-white/5">
                        <button type="submit" disabled={loading} className={`${STYLES.buttonPrimary} flex items-center justify-center gap-3 w-full md:w-auto`}>
                            {loading ? <FiActivity className="animate-spin" /> : <FiCheck size={18} />}
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
                    background: '#000',
                    color: '#fff'
                });
            }
        } catch (error) {
            console.error("Error al cambiar rol:", error);
            if (window.Swal) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo actualizar el rol.',
                    background: '#000',
                    color: '#fff'
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
        <div className="bg-black min-h-screen p-6 md:p-12 text-white font-['Inter'] selection:bg-white selection:text-black">
            <AnimatePresence>
                {viewingUser && <DetalleUsuario user={viewingUser} onClose={() => setViewingUser(null)} />}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className={`${STYLES.title} text-3xl md:text-5xl leading-none`}>
                        Gestión <span className="text-white">Personal</span>
                    </h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-6 tracking-[0.5em]`}>SYSTEM_ADMIN // EMPLOYEES_DB</p>
                </div>
                <div className={`bg-white/5 px-6 py-3 border border-white/20 text-[10px] ${STYLES.tech} text-white uppercase font-black`}>
                    Sesión de Administrador
                </div>
            </div>

            <div className="flex border-b border-white/5 mb-10 overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab('lista')}
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiList size={14} /> LISTA DE PERSONAL
                </button>
                <button
                    onClick={() => setActiveTab('registro')}
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiPlus size={14} /> REGISTRAR NUEVO
                </button>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                {activeTab === 'registro' ? (
                    <RegistroUsuarioContent fetchUsers={fetchUsers} />
                ) : (
                    <div className={`${STYLES.glass} p-8`}>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                            <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                                <FiList className="text-white" size={18} /> REGISTROS ACTUALES
                            </h2>
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative group flex-1 md:w-64">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-white transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="FILTRAR..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`${STYLES.input} py-2 pl-10 text-[10px] uppercase font-['Inter']`}
                                    />
                                </div>
                                <div className="relative">
                                    <FiFilter className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" />
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="bg-black border border-zinc-800 py-2 pl-4 pr-10 text-[10px] font-['Inter'] outline-none focus:border-white appearance-none cursor-pointer uppercase text-zinc-400"
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

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-[10px] font-['Inter'] text-zinc-600 uppercase font-bold">
                                        <th className="py-4 px-2">Empleado</th>
                                        <th className="py-4 px-2">Email Corporativo</th>
                                        <th className="py-4 px-2">Rol de Acceso</th>
                                        <th className="py-4 px-2 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className={`${STYLES.tech} text-xs`}>
                                    {loading ? (
                                        <tr><td colSpan="4" className="py-10 text-center text-white animate-pulse tracking-[0.5em]">CARGANDO DATOS...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="py-10 text-center text-zinc-700 tracking-widest font-['Inter']">// NO HAY RESULTADOS</td></tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors group">
                                                <td className="py-4 px-2">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-8 h-8 flex items-center justify-center text-[10px] font-black
                                                            ${user.role === 'admin' ? 'bg-white/10 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-white font-bold tracking-wide font-['Inter']">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-2 text-zinc-500 font-['Inter']">{user.email}</td>
                                                <td className="py-4 px-2">
                                                    <span className={`px-2 py-0.5 border text-[9px] font-black font-['Inter']
                                                        ${user.role === 'admin' ? 'border-white/30 text-white' : 'border-zinc-800 text-zinc-600'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-2 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setViewingUser(user)} className="p-2 text-zinc-700 hover:text-white transition-colors" title="VER"><FiEye size={14} /></button>
                                                        <select
                                                            value={user.role}
                                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                            disabled={user.id === authCtx.user?.id}
                                                            className="bg-black border border-zinc-900 text-[10px] font-['Inter'] py-1 px-2 outline-none hover:border-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="user">USUARIO</option>
                                                            <option value="vendedor">VENDEDOR</option>
                                                            <option value="tecnico">TÉCNICO</option>
                                                            <option value="admin">ADMIN</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            disabled={user.id === authCtx.user?.id}
                                                            className="p-2 text-zinc-700 hover:text-white transition-colors disabled:opacity-30"
                                                            title="ELIMINAR"
                                                        >
                                                            <FiTrash size={14} />
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

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 2px; width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #fff; }
            `}</style>
        </div>
    );
};

export default ModuloEmpleados;