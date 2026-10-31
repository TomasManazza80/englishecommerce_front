import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiPlus, FiCheck, FiUserPlus, FiList,
    FiPhone, FiMapPin, FiActivity, FiUser, FiCreditCard, FiX, FiEdit, FiTrash2,
    FiMessageSquare, FiImage, FiSend, FiSearch
} from 'react-icons/fi';
import { IKContext, IKUpload } from 'imagekitio-react';
import { motion } from 'framer-motion';

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

const initialClientState = {
    nombre: '',
    telefono: '',
    dni: '',
    direccion: ''
};

// --- COMPONENTE: FORMULARIO DE CLIENTES ---
const RegistroClienteContent = ({ fetchClients, editingClient, setEditingClient }) => {
    const [cliente, setCliente] = useState(initialClientState);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: 'success', message: '' });

    useEffect(() => {
        if (editingClient) {
            setCliente(editingClient);
        } else {
            setCliente(initialClientState);
        }
    }, [editingClient]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCliente(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardarCliente = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (cliente.id) {
                await axios.put(`${API_URL}/clientes/${cliente.id}`, cliente);
                setNotification({ show: true, type: 'success', message: 'CLIENTE ACTUALIZADO CORRECTAMENTE' });
            } else {
                await axios.post(`${API_URL}/clientes`, cliente);
                setNotification({ show: true, type: 'success', message: 'CLIENTE INGRESADO AL SISTEMA' });
            }

            setCliente(initialClientState);
            if (setEditingClient) setEditingClient(null);
            if (fetchClients) fetchClients();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.response?.data || "ERROR AL REGISTRAR CLIENTE";
            setNotification({ show: true, type: 'error', message: String(errorMsg).toUpperCase() });
        } finally {
            setLoading(false);
            setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
        }
    };

    return (
        <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl relative overflow-hidden">

            {/* --- NOTIFICACIÓN (OVERLAY) --- */}
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

            {/* Cabecera Interna */}
            <div className="px-6 py-4 border-b border-[#ECECE6] bg-[#F8F8F5]">
                <h2 className={`${STYLES.title} flex items-center gap-2`}>
                    <FiUserPlus className="w-5 h-5 text-neutral-700" /> {editingClient ? 'EDITAR CLIENTE EXISTENTE' : 'REGISTRO DE NUEVO CLIENTE'}
                </h2>
            </div>

            <div className="p-6">
                <form onSubmit={handleGuardarCliente} className="space-y-8">

                    {/* I. Datos Personales */}
                    <section>
                        <h3 className="text-base font-medium text-neutral-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-4 h-4 text-neutral-500" /> 01 DATOS PERSONALES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={STYLES.label}>NOMBRE COMPLETO</label>
                                <div className="relative">
                                    <FiUser className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" name="nombre" value={cliente.nombre} onChange={handleInputChange} className={`${STYLES.input} pl-9`} required placeholder="EJ: JUAN PEREZ" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>DNI / IDENTIFICACIÓN</label>
                                <div className="relative">
                                    <FiCreditCard className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" name="dni" value={cliente.dni} onChange={handleInputChange} className={`${STYLES.input} pl-9`} placeholder="00.000.000" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* II. Contacto y Ubicación */}
                    <section>
                        <h3 className="text-base font-medium text-neutral-800 mb-4 flex items-center gap-2">
                            <FiActivity className="w-4 h-4 text-neutral-500" /> 02 CONTACTO Y UBICACIÓN
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={STYLES.label}>TELÉFONO DE CONTACTO</label>
                                <div className="relative">
                                    <FiPhone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" name="telefono" value={cliente.telefono} onChange={handleInputChange} className={`${STYLES.input} pl-9`} required placeholder="+54 9..." />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>DIRECCIÓN DE DOMICILIO</label>
                                <div className="relative">
                                    <FiMapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input type="text" name="direccion" value={cliente.direccion} onChange={handleInputChange} className={`${STYLES.input} pl-9`} placeholder="CALLE 123" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-[#ECECE6]">
                        <button
                            type="button"
                            onClick={() => {
                                setCliente(initialClientState);
                                if (setEditingClient) setEditingClient(null);
                            }}
                            className={STYLES.buttonSecondary}
                        >
                            {editingClient ? 'CANCELAR EDICIÓN' : 'LIMPIAR FORMULARIO'}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={STYLES.buttonPrimary}
                        >
                            {loading ? <FiActivity className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                            {loading ? 'PROCESANDO...' : (editingClient ? 'ACTUALIZAR DATOS' : 'GUARDAR CLIENTE')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE: LISTA DE CLIENTES ---
const ListaClientes = ({ clientes, onEdit, fetchClients }) => {

    const handleDelete = async (id) => {
        if (window.confirm('¿CONFIRMA ELIMINAR ESTE CLIENTE? ESTA ACCIÓN NO SE PUEDE DESHACER.')) {
            try {
                await axios.delete(`${API_URL}/clientes/${id}`);
                if (fetchClients) fetchClients();
            } catch (error) {
                console.error(error);
                alert("ERROR AL ELIMINAR CLIENTE");
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl px-6 py-4">
                <h2 className={`${STYLES.title} flex items-center gap-2`}>
                    <FiList className="w-5 h-5 text-neutral-700" /> REGISTRO HISTÓRICO DE CLIENTES
                </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#ECECE6] bg-white shadow-xs">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F8F8F5] border-b border-[#ECECE6]">
                        <tr>
                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">ID</th>
                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">NOMBRE</th>
                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">DNI</th>
                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">TELÉFONO</th>
                            <th className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">DIRECCIÓN</th>
                            <th className="px-4 py-3 text-right align-middle text-xs font-medium text-neutral-500 uppercase tracking-wider">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F1EB]">
                        {clientes.length > 0 ? (
                            clientes.map((c) => (
                                <tr key={c.id} className="hover:bg-[#F8F8F5] transition-colors">
                                    <td className="px-4 py-3 text-left align-middle text-xs text-neutral-500">#{c.id}</td>
                                    <td className="px-4 py-3 text-left align-middle text-xs font-medium text-neutral-900">{c.nombre}</td>
                                    <td className="px-4 py-3 text-left align-middle text-xs text-neutral-700">{c.dni || '-'}</td>
                                    <td className="px-4 py-3 text-left align-middle text-xs text-neutral-700">{c.telefono || '-'}</td>
                                    <td className="px-4 py-3 text-left align-middle text-xs text-neutral-700">{c.direccion || '-'}</td>
                                    <td className="px-4 py-3 text-right align-middle">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => onEdit(c)} className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors" title="EDITAR">
                                                <FiEdit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors" title="ELIMINAR">
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-12 text-center align-middle text-xs text-neutral-500">
                                    NO HAY DATOS REGISTRADOS
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- COMPONENTE: MARKETING WHATSAPP ---
const MarketingTab = ({ clientes }) => {
    const [message, setMessage] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendingAll, setSendingAll] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const authenticator = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/imagekit`);
            if (!response.ok) throw new Error('Auth failed');
            return await response.json();
        } catch (error) {
            console.error(error);
            alert("ERROR DE AUTENTICACIÓN IMAGEKIT");
        }
    };

    const handleSendWhatsApp = async (phone, name) => {
        if (!message) return alert("REDACTE UN MENSAJE");

        let finalMessage = `Hola ${name}! ${message}`;
        if (imageUrl) {
            finalMessage += `\n\nVer imagen: ${imageUrl}`;
        }

        try {
            const res = await axios.post(`${API_URL}/qr/send-message`, {
                phone: phone,
                message: finalMessage
            });
            if (res.data.success) {
                console.log(`Mensaje enviado a ${name}`);
            }
        } catch (error) {
            console.error("Error al enviar mensaje:", error);
            alert("ERROR AL ENVIAR MENSAJE. VERIFIQUE QUE WHATSAPP ESTÉ CONECTADO.");

            const encodedMessage = encodeURIComponent(finalMessage);
            const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleSendAll = async () => {
        if (!message) return alert("REDACTE UN MENSAJE PARA LA CAMPAÑA");
        if (filteredClientes.length === 0) return alert("NO HAY CLIENTES EN LA LISTA FILTRADA");

        const confirmMsg = `¿ESTÁ SEGURO DE ENVIAR ESTE MENSAJE A LOS ${filteredClientes.length} CLIENTES FILTRADOS?`;
        if (!window.confirm(confirmMsg)) return;

        setSendingAll(true);
        setProgress({ current: 0, total: filteredClientes.length });

        for (let i = 0; i < filteredClientes.length; i++) {
            const client = filteredClientes[i];

            setProgress(prev => ({ ...prev, current: i + 1 }));

            let finalMessage = `Hola ${client.nombre}! ${message}`;
            if (imageUrl) {
                finalMessage += `\n\nVer imagen: ${imageUrl}`;
            }

            try {
                await axios.post(`${API_URL}/qr/send-message`, {
                    phone: client.telefono,
                    message: finalMessage
                });
                console.log(`Mensaje masivo enviado a ${client.nombre}`);
            } catch (error) {
                console.error(`Error en envío masivo a ${client.nombre}:`, error);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setSendingAll(false);
        alert("CAMPAÑA FINALIZADA");
    };

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono?.includes(searchTerm)
    );

    return (
        <IKContext
            publicKey={import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY}
            urlEndpoint={import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}
            authenticator={authenticator}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel de Redacción */}
                <div className={`${STYLES.card} space-y-6`}>
                    <h2 className={`${STYLES.title} flex items-center gap-2`}>
                        <FiMessageSquare className="w-5 h-5 text-neutral-700" /> CONFIGURACIÓN DE CAMPAÑA
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className={STYLES.label}>MENSAJE PUBLICITARIO</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full min-h-[150px] px-3 py-2 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors resize-none"
                                placeholder="ESCRIBA EL MENSAJE AQUÍ... (EL NOMBRE DEL CLIENTE SE AGREGARÁ AUTOMÁTICAMENTE)"
                            />
                        </div>

                        <div>
                            <label className={STYLES.label}>IMAGEN ADJUNTA (OPCIONAL)</label>
                            <div className={`border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-4 bg-[#FAF9F6] transition-colors ${imageUrl ? 'border-neutral-400' : 'border-[#E2E2DC] hover:bg-[#F3F2EE]/70'}`}>
                                {imageUrl ? (
                                    <div className="relative group overflow-hidden border border-[#ECECE6] rounded-2xl shadow-xs bg-white">
                                        <img src={imageUrl} alt="Preview" className="max-h-40 object-cover" />
                                        <button
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-2 right-2 h-8 w-8 rounded-xl inline-flex items-center justify-center bg-white border border-[#ECECE6] text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors shadow-xs"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <FiImage className="w-5 h-5 text-neutral-400" />
                                        <IKUpload
                                            fileName="marketing_promo"
                                            useUniqueFileName={true}
                                            folder="/marketing"
                                            onUploadStart={() => setUploading(true)}
                                            onSuccess={(res) => { setImageUrl(res.url); setUploading(false); }}
                                            onError={() => { alert("ERROR AL SUBIR"); setUploading(false); }}
                                            className="hidden"
                                            id="file-upload"
                                        />
                                        <label htmlFor="file-upload" className={`${STYLES.buttonSecondary} cursor-pointer`}>
                                            {uploading ? 'SUBIENDO...' : 'SELECCIONAR IMAGEN'}
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botón de Envío Masivo */}
                    <div className="pt-6 border-t border-[#ECECE6]">
                        <button
                            onClick={handleSendAll}
                            disabled={sendingAll || !message || filteredClientes.length === 0}
                            className={`w-full ${STYLES.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {sendingAll ? <FiActivity className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                            {sendingAll ? `ENVIANDO CAMPAÑA [${progress.current}/${progress.total}]` : `ENVIAR A TODOS (${filteredClientes.length} CLIENTES)`}
                        </button>

                        {sendingAll && (
                            <div className="mt-4 w-full bg-[#F3F2EE] h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-[#19191B] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lista de Envío */}
                <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl flex flex-col h-[700px] overflow-hidden">
                    <div className="p-6 bg-[#F8F8F5] border-b border-[#ECECE6]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className={`${STYLES.title} flex items-center gap-2`}>
                                <FiSend className="w-5 h-5 text-neutral-700" /> LISTADO DE ENVÍO
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="FILTRAR..."
                                    className={`${STYLES.input} pl-9`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {filteredClientes.length > 0 ? (
                            filteredClientes.map((c) => (
                                <div key={c.id} className="flex justify-between items-center p-4 bg-white border border-[#ECECE6] rounded-2xl hover:bg-[#F8F8F5] transition-colors shadow-xs">
                                    <div>
                                        <p className="text-xs font-medium text-neutral-900">{c.nombre}</p>
                                        <p className="text-xs text-neutral-500 mt-0.5">{c.telefono}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSendWhatsApp(c.telefono, c.nombre)}
                                        className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
                                        title="ENVIAR VÍA WHATSAPP"
                                    >
                                        <FiSend className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center text-neutral-400">
                                <FiSearch className="w-5 h-5 mb-2" />
                                <p className="text-center text-neutral-500 text-xs">NO SE ENCONTRARON RESULTADOS</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-[#F8F8F5] border-t border-[#ECECE6]">
                        <p className="text-xs text-neutral-500 leading-relaxed">
                            * EL ENVÍO SE REALIZA INDIVIDUALMENTE PARA CUMPLIR CON LAS POLÍTICAS DE WHATSAPP Y EVITAR BLOQUEOS DE CUENTA.
                        </p>
                    </div>
                </div>
            </div>
        </IKContext>
    );
};

// --- COMPONENTE PRINCIPAL ---
const ModuloClientes = () => {
    const [activeTab, setActiveTab] = useState('registro');
    const [clientes, setClientes] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    const handleEdit = (client) => {
        setEditingClient(client);
        setActiveTab('registro');
    };

    const fetchClients = async () => {
        setLoadingList(true);
        try {
            const res = await axios.get(`${API_URL}/clientes`);
            setClientes(res.data);
        } catch (error) {
            console.error("Error fetching clients", error);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'lista' || activeTab === 'marketing') {
            fetchClients();
        }
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-[#FAF9F6] font-['Inter',sans-serif] text-neutral-900">
            <div className="p-6 space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif] text-neutral-900">

                {/* Header Fedecell */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">MÓDULO DE CLIENTES</h1>
                        <p className="text-xs text-neutral-500 mt-1">GESTIÓN DE CLIENTES // BASE DE DATOS</p>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3] text-xs font-medium uppercase tracking-wider self-start sm:self-auto">
                        BASE DE DATOS ACTIVA
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-[#ECECE6] pb-4">
                    <button
                        className={activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}
                        onClick={() => { setActiveTab('registro'); setEditingClient(null); }}
                    >
                        <FiPlus className="w-4 h-4" /> REGISTRAR CLIENTE
                    </button>
                    <button
                        className={activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}
                        onClick={() => setActiveTab('lista')}
                    >
                        <FiList className="w-4 h-4" /> LISTA COMPLETA
                    </button>
                    <button
                        className={activeTab === 'marketing' ? STYLES.tabActive : STYLES.tabInactive}
                        onClick={() => setActiveTab('marketing')}
                    >
                        <FiMessageSquare className="w-4 h-4" /> MARKETING WHATSAPP
                    </button>
                </div>

                {/* Contenido Dinámico */}
                <div className="pb-12">
                    {activeTab === 'registro' && <RegistroClienteContent fetchClients={fetchClients} editingClient={editingClient} setEditingClient={setEditingClient} />}
                    {activeTab === 'lista' && (
                        loadingList ? (
                            <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl flex flex-col items-center justify-center py-20 text-neutral-500">
                                <FiActivity className="w-5 h-5 animate-spin text-neutral-900 mb-3" />
                                <p className="text-xs text-neutral-700">CARGANDO DATOS...</p>
                            </div>
                        ) : <ListaClientes clientes={clientes} onEdit={handleEdit} fetchClients={fetchClients} />
                    )}
                    {activeTab === 'marketing' && <MarketingTab clientes={clientes} />}
                </div>
            </div>
        </div>
    );
};

export default ModuloClientes;
