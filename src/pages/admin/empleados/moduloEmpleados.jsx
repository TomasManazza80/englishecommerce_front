import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
    FiUser, FiShield, FiSave, FiSearch, FiFilter, FiTrash, FiEye, FiX, FiMail, FiPhone,
    FiPlus, FiList, FiActivity, FiCheck, FiLock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import authContext from '../../../store/store';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ESTILOS PREMIUM (SOFT BRUTALISM) ---
const STYLES = {
    title: "font-black uppercase tracking-tighter text-black",
    label: "font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-2 block",
    tech: "font-bold tracking-widest uppercase",
    input: "w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all placeholder:text-gray-400",
    card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
    buttonPrimary: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2",
    buttonSecondary: "bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-lg transition-all py-3 px-4 flex items-center justify-center gap-2",
    tabActive: "text-black bg-white border-t border-l border-r border-gray-200 rounded-t-xl z-10 relative -mb-[1px]",
    tabInactive: "text-gray-500 hover:text-black bg-gray-50 border-b border-gray-200 rounded-t-xl",
    alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-gray-100 border-gray-300 text-black text-xs font-bold uppercase",
    alertSuccess: "p-4 rounded-xl flex items-center gap-3 border bg-white border-black text-black text-xs font-bold uppercase"
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`${STYLES.card} w-full max-w-md p-8 relative shadow-xl`}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-gray-50 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiX size={20} />
                </button>

                <div className="mb-8 border-b border-gray-200 pb-4">
                    <h2 className={`${STYLES.title} text-lg flex items-center gap-3`}>
                        <FiUser className="text-black" size={20} /> FICHA DE USUARIO
                    </h2>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <label className={STYLES.label}>ID INTERNO</label>
                            <p className="font-bold text-xs text-black">#{user.id}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <label className={STYLES.label}>ROL DE ACCESO</label>
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-black text-white text-[10px] font-black uppercase tracking-wider">
                                {user.role || 'USER'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-4 rounded-xl">
                        <label className={STYLES.label}>NOMBRE COMPLETO</label>
                        <p className="text-black font-black text-lg tracking-wide uppercase">{user.name}</p>
                    </div>

                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <div>
                            <label className={STYLES.label}>EMAIL REGISTRADO</label>
                            <div className="flex items-center gap-3 text-black">
                                <FiMail className="text-gray-400" />
                                <p className="text-sm font-bold">{user.email || 'NO REGISTRADO'}</p>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                            <label className={STYLES.label}>TELÉFONO DE CONTACTO</label>
                            <div className="flex items-center gap-3 text-black">
                                <FiPhone className="text-gray-400" />
                                <p className="text-sm font-bold">{user.number || 'NO REGISTRADO'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div>
                            <label className={STYLES.label}>FECHA DE ALTA</label>
                            <p className="text-gray-600 font-bold text-[10px]">{formatDate(user.createdAt)}</p>
                        </div>
                        <div>
                            <label className={STYLES.label}>ÚLTIMO LOG</label>
                            <p className="text-gray-600 font-bold text-[10px]">{formatDate(user.updatedAt)}</p>
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
        <div className={`${STYLES.card} relative overflow-hidden p-0 md:p-0`}>
            {notification.show && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
                >
                    <div className={notification.type === 'success' ? STYLES.alertSuccess : STYLES.alertNeutral}>
                        {notification.type === 'success' ? <FiCheck size={24} /> : <FiX size={24} />}
                        <div>
                            <h3 className="font-black text-sm">{notification.type === 'success' ? 'COMPLETADO' : 'ERROR'}</h3>
                            <p className="text-[10px] text-gray-500 font-bold">{notification.message}</p>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="px-6 md:px-10 py-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiPlus size={18} className="text-black" /> REGISTRO INTERNO DE PERSONAL
                </h2>
            </div>

            <div className="p-6 md:p-10">
                <form onSubmit={handleGuardarUsuario} className="space-y-12">
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-gray-400 mb-6 flex items-center gap-2`}>
                            <FiActivity size={14} /> 01 DATOS GENERALES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className={STYLES.label}>NOMBRE COMPLETO</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" name="name" value={user.name} onChange={handleInputChange} className={`${STYLES.input} pl-12`} required placeholder="EJ: PEDRO SÁNCHEZ" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={STYLES.label}>EMAIL CORPORATIVO</label>
                                <div className="relative">
                                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="email" name="email" value={user.email} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="EMPLEADO@LU.COM" />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-gray-400 mb-6 flex items-center gap-2`}>
                            <FiActivity size={14} /> 02 SEGURIDAD Y ACCESO
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className={STYLES.label}>TELÉFONO INTERNO</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" name="number" value={user.number} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="54911..." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={STYLES.label}>CONTRASEÑA ACCESO</label>
                                <div className="relative">
                                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="password" name="password" value={user.password} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={STYLES.label}>ROL ASIGNADO</label>
                                <div className="relative">
                                    <FiShield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
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

                    <div className="flex justify-end pt-8 border-t border-gray-100">
                        <button type="submit" disabled={loading} className={`${STYLES.buttonPrimary} w-full md:w-auto`}>
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
        <div className="bg-white min-h-screen p-4 md:p-8 lg:p-12 text-black" style={{ fontFamily: '"Inter", sans-serif' }}>
            <AnimatePresence>
                {viewingUser && <DetalleUsuario user={viewingUser} onClose={() => setViewingUser(null)} />}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 pb-8 border-b border-gray-200 gap-6">
                <div>
                    <h1 className={`${STYLES.title} text-4xl md:text-5xl leading-none`}>
                        GESTIÓN <span className="text-gray-400">PERSONAL</span>
                    </h1>
                    <p className={`${STYLES.tech} text-[10px] text-gray-500 mt-4 tracking-widest`}>SYSTEM ADMIN // EMPLOYEES DB</p>
                </div>
                <div className="bg-gray-50 px-6 py-3 border border-gray-200 rounded-xl text-[10px] text-black uppercase font-black shadow-sm">
                    SESIÓN DE ADMINISTRADOR
                </div>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8">
                <button
                    onClick={() => setActiveTab('lista')}
                    className={`px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiList size={16} /> LISTA DE PERSONAL
                </button>
                <button
                    onClick={() => setActiveTab('registro')}
                    className={`px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}`}
                >
                    <FiPlus size={16} /> REGISTRAR NUEVO
                </button>
                <div className="flex-grow border-b border-gray-200"></div>
            </div>

            <div className="animate-in fade-in duration-500 pb-20">
                {activeTab === 'registro' ? (
                    <RegistroUsuarioContent fetchUsers={fetchUsers} />
                ) : (
                    <div className={`${STYLES.card} p-0 overflow-hidden`}>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 p-6 md:p-8 border-b border-gray-200 bg-gray-50">
                            <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                                <FiList className="text-black" size={18} /> REGISTROS ACTUALES
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                <div className="relative group flex-1 sm:w-64">
                                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="FILTRAR..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`${STYLES.input} py-2.5 pl-12 text-xs rounded-full bg-white`}
                                    />
                                </div>
                                <div className="relative">
                                    <FiFilter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    <select
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        className="bg-white border border-gray-200 py-2.5 pl-4 pr-10 rounded-full text-xs font-bold uppercase text-black outline-none focus:border-black appearance-none cursor-pointer"
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
                                    <tr className="border-b border-gray-200 bg-white text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <th className="p-5">EMPLEADO</th>
                                        <th className="p-5">EMAIL CORPORATIVO</th>
                                        <th className="p-5">ROL DE ACCESO</th>
                                        <th className="p-5 text-right">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="py-20 text-center"><FiActivity className="mx-auto text-black animate-spin mb-4" size={32}/><span className="text-gray-500 font-bold uppercase tracking-widest text-xs">CARGANDO DATOS...</span></td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="4" className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">// NO HAY RESULTADOS</td></tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 flex items-center justify-center text-xs font-black rounded-lg border
                                                            ${user.role === 'admin' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-black font-black uppercase tracking-tight">{user.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-gray-500 font-bold text-xs">{user.email}</td>
                                                <td className="p-5">
                                                    <span className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border
                                                        ${user.role === 'admin' ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => setViewingUser(user)} className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200" title="VER"><FiEye size={16} /></button>
                                                        <div className="relative group">
                                                            <select
                                                                value={user.role}
                                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                                disabled={user.id === authCtx.user?.id}
                                                                className="bg-white border border-gray-200 text-xs font-bold text-gray-600 py-2 px-3 rounded-lg outline-none hover:border-black hover:text-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 uppercase"
                                                            >
                                                                <option value="user">USUARIO</option>
                                                                <option value="vendedor">VENDEDOR</option>
                                                                <option value="tecnico">TÉCNICO</option>
                                                                <option value="admin">ADMIN</option>
                                                            </select>
                                                            <FiShield className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            disabled={user.id === authCtx.user?.id}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-gray-400"
                                                            title="ELIMINAR"
                                                        >
                                                            <FiTrash size={16} />
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
    );
};

export default ModuloEmpleados;