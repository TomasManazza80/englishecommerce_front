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

// --- CONFIGURACIÓN DE ESTILOS BLANCO Y NEGRO (SOFT BRUTALISM) ---
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
        <div className={`${STYLES.card} relative overflow-hidden p-0 md:p-0`}>

            {/* --- NOTIFICACIÓN (OVERLAY) --- */}
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

            {/* Cabecera Interna */}
            <div className="px-6 md:px-10 py-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiUserPlus className="text-black" size={18} /> {editingClient ? 'EDITAR CLIENTE EXISTENTE' : 'REGISTRO DE NUEVO CLIENTE'}
                </h2>
            </div>

            <div className="p-6 md:p-10">
                <form onSubmit={handleGuardarCliente} className="space-y-12">

                    {/* I. Datos Personales */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-gray-400 mb-6 flex items-center gap-2`}>
                            <FiActivity size={14} /> 01 DATOS PERSONALES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={STYLES.label}>NOMBRE COMPLETO</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" name="nombre" value={cliente.nombre} onChange={handleInputChange} className={`${STYLES.input} pl-12`} required placeholder="EJ: JUAN PEREZ" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>DNI / IDENTIFICACIÓN</label>
                                <div className="relative">
                                    <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" name="dni" value={cliente.dni} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} placeholder="00.000.000" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* II. Contacto y Ubicación */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-gray-400 mb-6 flex items-center gap-2`}>
                            <FiActivity size={14} /> 02 CONTACTO Y UBICACIÓN
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={STYLES.label}>TELÉFONO DE CONTACTO</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" name="telefono" value={cliente.telefono} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="+54 9..." />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>DIRECCIÓN DE DOMICILIO</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input type="text" name="direccion" value={cliente.direccion} onChange={handleInputChange} className={`${STYLES.input} pl-12`} placeholder="CALLE 123" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Botones */}
                    <div className="flex flex-col md:flex-row justify-end gap-4 pt-8 border-t border-gray-100">
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
                            {loading ? <FiActivity className="animate-spin" /> : <FiCheck size={18} />}
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
        <div className={`${STYLES.card} p-0 overflow-hidden`}>
            <div className="p-6 md:p-8 border-b border-gray-200 bg-gray-50">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiList className="text-black" size={18} /> REGISTRO HISTÓRICO DE CLIENTES
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-200 bg-white">
                            <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">ID</th>
                            <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">NOMBRE</th>
                            <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">DNI</th>
                            <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">TELÉFONO</th>
                            <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">DIRECCIÓN</th>
                            <th className="p-5 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length > 0 ? (
                            clientes.map((c) => (
                                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-5 text-gray-400 text-xs font-bold">#{c.id}</td>
                                    <td className="p-5 text-black font-black text-sm uppercase tracking-tight">{c.nombre}</td>
                                    <td className="p-5 text-gray-500 text-xs font-bold">{c.dni || '-'}</td>
                                    <td className="p-5 text-gray-500 text-xs font-bold">{c.telefono || '-'}</td>
                                    <td className="p-5 text-gray-500 text-xs font-medium">{c.direccion || '-'}</td>
                                    <td className="p-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => onEdit(c)} className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200" title="EDITAR">
                                                <FiEdit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="ELIMINAR">
                                                <FiTrash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-12 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                                    // NO HAY DATOS REGISTRADOS
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel de Redacción */}
                <div className={`${STYLES.card} space-y-8`}>
                    <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                        <FiMessageSquare className="text-black" size={18} /> CONFIGURACIÓN DE CAMPAÑA
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className={STYLES.label}>MENSAJE PUBLICITARIO</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={`${STYLES.input} min-h-[150px] resize-none`}
                                placeholder="ESCRIBA EL MENSAJE AQUÍ... (EL NOMBRE DEL CLIENTE SE AGREGARÁ AUTOMÁTICAMENTE)"
                            />
                        </div>

                        <div>
                            <label className={STYLES.label}>IMAGEN ADJUNTA (OPCIONAL)</label>
                            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-gray-50 transition-colors ${imageUrl ? 'border-black' : 'border-gray-300 hover:bg-gray-100 hover:border-black'}`}>
                                {imageUrl ? (
                                    <div className="relative group overflow-hidden border border-gray-200 rounded-lg shadow-sm">
                                        <img src={imageUrl} alt="Preview" className="max-h-40 object-cover" />
                                        <button
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-2 right-2 bg-white p-2 text-gray-500 border border-gray-200 hover:text-red-500 rounded-lg transition-colors shadow-sm"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <FiImage className="text-gray-400" size={32} />
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
                    <div className="pt-6 border-t border-gray-100">
                        <button
                            onClick={handleSendAll}
                            disabled={sendingAll || !message || filteredClientes.length === 0}
                            className={`w-full ${STYLES.buttonPrimary} py-4 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {sendingAll ? <FiActivity className="animate-spin" /> : <FiSend />}
                            {sendingAll ? `ENVIANDO CAMPAÑA [${progress.current}/${progress.total}]` : `ENVIAR A TODOS (${filteredClientes.length} CLIENTES)`}
                        </button>

                        {sendingAll && (
                            <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-black h-full rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lista de Envío */}
                <div className={`${STYLES.card} flex flex-col h-[700px] p-0`}>
                    <div className="p-6 md:p-8 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                                <FiSend className="text-black" size={18} /> LISTADO DE ENVÍO
                            </h2>
                            <div className="relative w-full md:w-64">
                                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="FILTRAR..."
                                    className={`${STYLES.input} py-2.5 pl-10 text-xs rounded-full bg-white`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3">
                        {filteredClientes.length > 0 ? (
                            filteredClientes.map((c) => (
                                <div key={c.id} className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-black transition-all group shadow-sm">
                                    <div>
                                        <p className="text-sm font-black text-black tracking-tight uppercase">{c.nombre}</p>
                                        <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-1">{c.telefono}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSendWhatsApp(c.telefono, c.nombre)}
                                        className="p-3 bg-gray-50 text-gray-500 border border-gray-200 rounded-lg hover:bg-black hover:text-white transition-all hover:border-black"
                                        title="ENVIAR VÍA WHATSAPP"
                                    >
                                        <FiSend size={16} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col justify-center items-center opacity-30">
                                <FiSearch size={48} className="text-gray-400 mb-4" />
                                <p className="text-center text-gray-500 font-bold text-xs uppercase tracking-widest">NO SE ENCONTRARON RESULTADOS</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                        <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
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
        <div className="bg-white min-h-screen p-4 md:p-8 lg:p-12 text-black" style={{ fontFamily: '"Inter", sans-serif' }}>

            {/* Header Fedecell */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 pb-8 border-b border-gray-200 gap-6">
                <div>
                    <h1 className={`${STYLES.title} text-4xl md:text-5xl leading-none`}>MÓDULO DE <span className="text-gray-400">CLIENTES</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-gray-500 mt-4 tracking-widest`}>GESTIÓN DE CLIENTES // BASE DE DATOS</p>
                </div>
                <div className="bg-gray-50 px-6 py-3 border border-gray-200 rounded-xl text-[10px] text-black uppercase font-black shadow-sm">
                    BASE DE DATOS ACTIVA
                </div>
            </div>

            {/* Tabs Premium */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8">
                <button
                    className={`px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => { setActiveTab('registro'); setEditingClient(null); }}
                >
                    <FiPlus size={16} /> REGISTRAR CLIENTE
                </button>
                <button
                    className={`px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('lista')}
                >
                    <FiList size={16} /> LISTA COMPLETA
                </button>
                <button
                    className={`px-6 py-4 text-[10px] font-bold tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'marketing' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('marketing')}
                >
                    <FiMessageSquare size={16} /> MARKETING WHATSAPP
                </button>
                <div className="flex-grow border-b border-gray-200"></div>
            </div>

            {/* Contenido Dinámico */}
            <div className="animate-in fade-in duration-500 pb-20">
                {activeTab === 'registro' && <RegistroClienteContent fetchClients={fetchClients} editingClient={editingClient} setEditingClient={setEditingClient} />}
                {activeTab === 'lista' && (
                    loadingList ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <FiActivity size={32} className="animate-spin text-black mb-4" />
                            <p className="font-bold text-xs uppercase tracking-widest">CARGANDO DATOS...</p>
                        </div>
                    ) : <ListaClientes clientes={clientes} onEdit={handleEdit} fetchClients={fetchClients} />
                )}
                {activeTab === 'marketing' && <MarketingTab clientes={clientes} />}
            </div>
        </div>
    );
};

export default ModuloClientes;