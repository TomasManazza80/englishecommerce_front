import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiLoader } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AdminPronunciation = () => {
    const [tasks, setTasks] = useState([]);
    const [formData, setFormData] = useState({ title: '', instruction: '', expected_text: '' });
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/pronunciation/tasks`);
            setTasks(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const textArray = formData.expected_text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const taskData = { ...formData, expected_text: textArray };
            
            await axios.post(`${API_URL}/api/pronunciation/tasks`, taskData);
            setFormData({ title: '', instruction: '', expected_text: '' });
            fetchTasks();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
        try {
            await axios.delete(`${API_URL}/api/pronunciation/tasks/${id}`);
            fetchTasks();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif' }} className="min-h-screen bg-white text-black p-8 mt-[80px]">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 border-b border-gray-200 pb-6">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
                        Admin <span className="text-gray-400">Pronunciation</span>
                    </h1>
                    <p className="font-bold uppercase text-[10px] tracking-widest text-gray-500 mt-2">
                        System Configuration / Tasks
                    </p>
                </header>
                
                <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-10">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-black mb-6">Nueva Tarea</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Título de la tarea</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Ej: Lectura de párrafo" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium placeholder:text-gray-400" required />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Instrucción (opcional)</label>
                            <textarea name="instruction" value={formData.instruction} onChange={handleChange} placeholder="Ej: Lee el siguiente texto en voz alta prestando atención a la entonación..." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium resize-none h-24 placeholder:text-gray-400" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Textos esperados (una oración por línea en inglés)</label>
                            <textarea name="expected_text" value={formData.expected_text} onChange={handleChange} placeholder="First sentence.&#10;Second sentence.&#10;Third sentence." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium resize-none h-24 placeholder:text-gray-400" required />
                        </div>
                        <button type="submit" className="w-full md:w-auto px-8 py-4 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <FiPlus size={16} /> CREAR TAREA
                        </button>
                    </div>
                </form>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3">
                        Tareas Existentes
                        <span className="bg-gray-100 text-black px-2 py-1 rounded-md text-[10px] tracking-widest font-bold">
                            {tasks.length}
                        </span>
                    </h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FiLoader className="animate-spin text-black mb-4" size={32} />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cargando...</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Sin tareas registradas</p>
                            <p className="text-sm font-medium text-gray-500">Utiliza el formulario de arriba para crear la primera tarea de pronunciación.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {tasks.map(task => (
                                    <motion.div 
                                        key={task.id} 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between md:items-start gap-6 hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-black text-lg text-black tracking-tight mb-1">{task.title}</h3>
                                            {task.instruction && (
                                                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">{task.instruction}</p>
                                            )}
                                            <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                                                <div className="text-sm font-medium text-gray-800 leading-relaxed">
                                                    {Array.isArray(task.expected_text) ? (
                                                        task.expected_text.map((t, i) => <span key={i} className="block mb-1">• {t}</span>)
                                                    ) : (
                                                        `"${task.expected_text}"`
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(task.id)} 
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold p-3 rounded-xl shrink-0 flex items-center justify-center border border-transparent hover:border-red-100"
                                            title="Eliminar tarea"
                                        >
                                            <FiTrash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPronunciation;
