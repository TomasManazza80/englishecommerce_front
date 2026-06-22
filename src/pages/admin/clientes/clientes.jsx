import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiPlus, FiCheck, FiUserPlus, FiList,
    FiPhone, FiMapPin, FiActivity, FiUser, FiCreditCard, FiX, FiEdit, FiTrash2,
    FiMessageSquare, FiImage, FiSend, FiSearch
} from 'react-icons/fi';
import { IKContext, IKUpload } from 'imagekitio-react';

const API_URL = import.meta.env.VITE_API_URL;

// --- CONFIGURACIÓN DE ESTILOS BLANCO Y NEGRO ---
const STYLES = {
    title: "font-['Inter'] font-[900] uppercase tracking-tighter text-white",
    label: "font-['Inter'] font-medium text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2 block",
    tech: "font-['Inter'] tracking-widest uppercase",
    input: "w-full bg-black border border-zinc-800 rounded-none py-3 px-4 text-sm text-white font-['Inter'] focus:border-white focus:ring-1 focus:ring-white outline-none transition-all placeholder:text-zinc-700",
    glass: "bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl",
    buttonPrimary: "bg-white text-black font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-200 transition-all shadow-[0_10px_20px_rgba(255,255,255,0.05)]",
    buttonSecondary: "bg-zinc-900 text-white font-['Inter'] font-[900] uppercase tracking-widest py-4 px-8 rounded-none hover:bg-zinc-800 transition-all border border-zinc-800",
    tabActive: "text-white border-white bg-white/[0.05] shadow-[inset_0_-2px_0_#ffffff]",
    tabInactive: "text-zinc-600 border-transparent hover:text-zinc-300 hover:bg-white/[0.01]"
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
        <div className={`${STYLES.glass} rounded-none overflow-hidden relative`}>

            {/* --- NOTIFICACIÓN (OVERLAY) --- */}
            {notification.show && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative">
                        <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full animate-pulse ${notification.type === 'success' ? 'bg-white' : 'bg-zinc-600'}`}></div>

                        <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] bg-black relative z-10 animate-in zoom-in duration-500 ${notification.type === 'success' ? 'border-white' : 'border-zinc-600'}`}>
                            {notification.type === 'success' ? (
                                <FiCheck size={48} className="text-white animate-bounce" />
                            ) : (
                                <FiX size={48} className="text-zinc-500 animate-pulse" />
                            )}
                        </div>
                    </div>
                    <h3 className={`${STYLES.title} text-2xl mb-2 tracking-widest text-center animate-in slide-in-from-bottom-4 duration-500 delay-100 ${notification.type === 'success' ? 'text-white' : 'text-zinc-500'}`}>
                        {notification.type === 'success' ? 'REGISTRO COMPLETADO' : 'ERROR EN EL REGISTRO'}
                    </h3>
                    <p className={`${STYLES.tech} text-zinc-400 text-xs tracking-[0.3em] animate-in slide-in-from-bottom-4 duration-500 delay-200 uppercase`}>
                        {notification.message}
                    </p>
                </div>
            )}

            {/* Cabecera Interna */}
            <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01]">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiUserPlus className="text-white" size={18} /> {editingClient ? 'EDITAR CLIENTE EXISTENTE' : 'REGISTRO DE NUEVO CLIENTE'}
                </h2>
            </div>

            <div className="p-4 md:p-10">
                <form onSubmit={handleGuardarCliente} className="space-y-12">

                    {/* I. Datos Personales */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-zinc-300 mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 01 DATOS PERSONALES
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={STYLES.label}>Nombre Completo</label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="nombre" value={cliente.nombre} onChange={handleInputChange} className={`${STYLES.input} pl-12`} required placeholder="EJ: JUAN PEREZ" />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>DNI / Identificación</label>
                                <div className="relative">
                                    <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="dni" value={cliente.dni} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} placeholder="00.000.000" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* II. Contacto y Ubicación */}
                    <section>
                        <h3 className={`${STYLES.tech} text-[10px] text-zinc-300 mb-8 flex items-center gap-2`}>
                            <FiActivity size={14} /> 02 CONTACTO Y UBICACIÓN
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={STYLES.label}>Teléfono de Contacto</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="telefono" value={cliente.telefono} onChange={handleInputChange} className={`${STYLES.input} pl-12 ${STYLES.tech}`} required placeholder="+54 9..." />
                                </div>
                            </div>
                            <div>
                                <label className={STYLES.label}>Dirección de Domicilio</label>
                                <div className="relative">
                                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
                                    <input type="text" name="direccion" value={cliente.direccion} onChange={handleInputChange} className={`${STYLES.input} pl-12`} placeholder="CALLE 123" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Botones */}
                    <div className="flex flex-col md:flex-row justify-end gap-4 pt-10 border-t border-white/5">
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
                            className={`${STYLES.buttonPrimary} flex items-center justify-center gap-3`}
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
        <div className={`${STYLES.glass} rounded-none overflow-hidden p-8`}>
            <div className="mb-6 border-b border-white/5 pb-4">
                <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                    <FiList className="text-white" size={18} /> REGISTRO HISTÓRICO DE CLIENTES
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>ID</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>NOMBRE</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>DNI</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>TELÉFONO</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2`}>DIRECCIÓN</th>
                            <th className={`${STYLES.tech} text-[10px] text-zinc-500 py-4 px-2 text-right`}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.length > 0 ? (
                            clientes.map((c) => (
                                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-4 px-2 text-white/50 text-xs font-mono">#{c.id}</td>
                                    <td className="py-4 px-2 text-white font-bold text-sm tracking-wide">{c.nombre}</td>
                                    <td className="py-4 px-2 text-zinc-400 text-xs font-mono">{c.dni || '-'}</td>
                                    <td className="py-4 px-2 text-zinc-300 text-xs font-mono">{c.telefono || '-'}</td>
                                    <td className="py-4 px-2 text-zinc-400 text-xs">{c.direccion || '-'}</td>
                                    <td className="py-4 px-2 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button onClick={() => onEdit(c)} className="text-zinc-400 hover:text-white transition-colors" title="EDITAR">
                                                <FiEdit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="text-zinc-400 hover:text-zinc-200 transition-colors" title="ELIMINAR">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-zinc-600 text-xs tracking-widest font-mono">
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
                <div className={`${STYLES.glass} p-8 space-y-8`}>
                    <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                        <FiMessageSquare className="text-white" size={18} /> CONFIGURACIÓN DE CAMPAÑA
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className={STYLES.label}>Mensaje Publicitario</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={`${STYLES.input} min-h-[150px] resize-none`}
                                placeholder="ESCRIBA EL MENSAJE AQUÍ... (EL NOMBRE DEL CLIENTE SE AGREGARÁ AUTOMÁTICAMENTE)"
                            />
                        </div>

                        <div>
                            <label className={STYLES.label}>Imagen Adjunta (Opcional)</label>
                            <div className="border-2 border-dashed border-zinc-800 p-6 flex flex-col items-center justify-center gap-4 bg-black/50">
                                {imageUrl ? (
                                    <div className="relative group overflow-hidden border border-white/30 shadow-lg shadow-white/5">
                                        <img src={imageUrl} alt="Preview" className="max-h-40 grayscale hover:grayscale-0 transition-all duration-500" />
                                        <button
                                            onClick={() => setImageUrl('')}
                                            className="absolute top-2 right-2 bg-black/80 p-2 text-zinc-400 border border-zinc-500/30 hover:bg-zinc-800 hover:text-white transition-all"
                                        >
                                            <FiTrash2 size={14} />
                                        </button>
                                        <div className="absolute inset-0 pointer-events-none border border-white/5"></div>
                                    </div>
                                ) : (
                                    <>
                                        <FiImage className="text-zinc-700" size={32} />
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
                                        <label htmlFor="file-upload" className={`${STYLES.tech} text-[10px] cursor-pointer text-zinc-300 hover:text-white transition-colors py-2 px-4 border border-zinc-600 hover:border-white`}>
                                            {uploading ? 'SUBIENDO...' : 'SELECCIONAR IMAGEN'}
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Botón de Envío Masivo */}
                    <div className="pt-6 border-t border-white/5">
                        <button
                            onClick={handleSendAll}
                            disabled={sendingAll || !message || filteredClientes.length === 0}
                            className={`w-full ${STYLES.buttonPrimary} flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {sendingAll ? <FiActivity className="animate-spin" /> : <FiSend />}
                            {sendingAll ? `ENVIANDO CAMPAÑA [${progress.current}/${progress.total}]` : `ENVIAR A TODOS (${filteredClientes.length} CLIENTES)`}
                        </button>

                        {sendingAll && (
                            <div className="mt-4 w-full bg-zinc-900 h-1 overflow-hidden">
                                <div
                                    className="bg-white h-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Lista de Envío */}
                <div className={`${STYLES.glass} p-8 flex flex-col h-full`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h2 className={`${STYLES.title} text-sm flex items-center gap-3`}>
                            <FiSend className="text-white" size={18} /> LISTADO DE ENVÍO
                        </h2>
                        <div className="relative w-full md:w-48">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="FILTRAR..."
                                className={`${STYLES.input} py-2 pl-9 text-[10px] uppercase font-mono`}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                        {filteredClientes.length > 0 ? (
                            <div className="space-y-2">
                                {filteredClientes.map((c) => (
                                    <div key={c.id} className="flex justify-between items-center p-4 bg-white/[0.01] border border-white/5 hover:border-white/30 transition-all group">
                                        <div>
                                            <p className="text-xs font-bold text-white tracking-wide uppercase">{c.nombre}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest">{c.telefono}</p>
                                        </div>
                                        <button
                                            onClick={() => handleSendWhatsApp(c.telefono, c.nombre)}
                                            className="p-3 bg-white/5 text-white border border-white/10 hover:bg-white hover:text-black transition-all group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                            title="ENVIAR VÍA WHATSAPP"
                                        >
                                            <FiSend size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center py-10 text-zinc-600 font-mono text-xs uppercase tracking-[0.2em]">// NO SE ENCONTRARON RESULTADOS</p>
                        )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5">
                        <p className="text-[10px] text-zinc-600 font-mono leading-relaxed italic">
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
        <div className="bg-black min-h-screen p-6 md:p-12 text-white font-['Inter'] selection:bg-white selection:text-black">

            {/* Header Fedecell */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className={`${STYLES.title} text-3xl md:text-5xl leading-none`}>MÓDULO DE <span className="text-zinc-400">CLIENTES</span></h1>
                    <p className={`${STYLES.tech} text-[10px] text-zinc-600 mt-6 tracking-[0.5em]`}>GESTIÓN DE CLIENTES // BASE DE DATOS</p>
                </div>
                <div className="bg-zinc-900/50 px-6 py-3 border border-zinc-700 text-[10px] ${STYLES.tech} text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] uppercase font-black">
                    Base de Datos Activa
                </div>
            </div>

            {/* Tabs Premium */}
            <div className="flex border-b border-white/5 mb-10 overflow-x-auto custom-scrollbar">
                <button
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'registro' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => { setActiveTab('registro'); setEditingClient(null); }}
                >
                    <FiPlus size={14} /> REGISTRAR CLIENTE
                </button>
                <button
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'lista' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('lista')}
                >
                    <FiList size={14} /> LISTA COMPLETA
                </button>
                <button
                    className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border-b-2 ${activeTab === 'marketing' ? STYLES.tabActive : STYLES.tabInactive}`}
                    onClick={() => setActiveTab('marketing')}
                >
                    <FiMessageSquare size={14} /> MARKETING WHATSAPP
                </button>

            </div>

            {/* Contenido Dinámico */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {activeTab === 'registro' && <RegistroClienteContent fetchClients={fetchClients} editingClient={editingClient} setEditingClient={setEditingClient} />}
                {activeTab === 'lista' && (
                    loadingList ? <p className="text-zinc-400 font-mono text-xs animate-pulse">CARGANDO DATOS...</p> : <ListaClientes clientes={clientes} onEdit={handleEdit} fetchClients={fetchClients} />
                )}
                {activeTab === 'marketing' && <MarketingTab clientes={clientes} />}
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

export default ModuloClientes;