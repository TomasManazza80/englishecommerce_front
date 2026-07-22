import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiLoader, FiArrowLeft, FiFolder } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const AdminPronunciation = () => {
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    
    // Forms
    const [activityForm, setActivityForm] = useState({ title: '', description: '' });
    const [taskForm, setTaskForm] = useState({ title: '', instruction: '', expected_text: '' });
    
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // AI Generator State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiTaskCount, setAiTaskCount] = useState(3);
    const [aiSentenceCount, setAiSentenceCount] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState([]);

    // Activity Bank State
    const [showBankModal, setShowBankModal] = useState(false);
    const [allActivities, setAllActivities] = useState([]);
    const [isLoadingBank, setIsLoadingBank] = useState(false);

    const fetchActivities = async (date) => {
        setLoading(true);
        try {
            const query = date ? `?date=${date}` : '';
            const res = await axios.get(`${API_URL}/api/pronunciation/activities${query}`);
            setActivities(res.data);
            
            // Update selected activity if it exists
            if (selectedActivity) {
                const updatedActivity = res.data.find(a => a.id === selectedActivity.id);
                setSelectedActivity(updatedActivity || null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(selectedDate);
    }, [selectedDate]);

    // Activity Handlers
    const handleActivityChange = (e) => setActivityForm({ ...activityForm, [e.target.name]: e.target.value });
    
    const handleActivitySubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/pronunciation/activities`, { ...activityForm, assigned_date: selectedDate });
            setActivityForm({ title: '', description: '' });
            fetchActivities(selectedDate);
        } catch (error) {
            console.error(error);
        }
    };

    // Task Handlers
    const handleTaskChange = (e) => setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
    
    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        if (!selectedActivity) return;
        try {
            const textArray = taskForm.expected_text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            const taskData = { ...taskForm, expected_text: textArray, activity_id: selectedActivity.id };
            
            await axios.post(`${API_URL}/api/pronunciation/tasks`, taskData);
            setTaskForm({ title: '', instruction: '', expected_text: '' });
            fetchActivities(selectedDate); // Re-fetch to get updated nested tasks
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
        try {
            await axios.delete(`${API_URL}/api/pronunciation/tasks/${id}`);
            fetchActivities(selectedDate);
        } catch (error) {
            console.error(error);
        }
    };

    // AI Generation Handlers
    const handleGenerateAiTasks = async () => {
        if (!aiTopic.trim()) return;
        setIsGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/api/pronunciation/generate-tasks`, { 
                topic: aiTopic,
                taskCount: aiTaskCount,
                sentenceCount: aiSentenceCount
            });
            setGeneratedTasks(res.data);
        } catch (error) {
            console.error(error);
            if (error.response?.data?.fallback) {
                alert("La IA alcanzó su límite de peticiones gratuitas. Se utilizarán ejercicios de prueba (fallback) generados genéricamente.");
                setGeneratedTasks(error.response.data.fallback);
            } else {
                alert("Error al generar los ejercicios con IA.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveGeneratedTasks = async () => {
        if (!selectedActivity || generatedTasks.length === 0) return;
        try {
            for (const task of generatedTasks) {
                const taskData = { ...task, activity_id: selectedActivity.id };
                await axios.post(`${API_URL}/api/pronunciation/tasks`, taskData);
            }
            setShowAiModal(false);
            setAiTopic('');
            setGeneratedTasks([]);
            fetchActivities(selectedDate);
        } catch (error) {
            console.error(error);
            alert("Error al guardar los ejercicios generados.");
        }
    };

    const handleGeneratedTaskChange = (index, field, value) => {
        const newTasks = [...generatedTasks];
        if (field === 'expected_text') {
            newTasks[index][field] = value.split('\n');
        } else {
            newTasks[index][field] = value;
        }
        setGeneratedTasks(newTasks);
    };

    // Activity Bank Handlers
    const openBankModal = async () => {
        setShowBankModal(true);
        setIsLoadingBank(true);
        try {
            // Fetch all without date filter
            const res = await axios.get(`${API_URL}/api/pronunciation/activities`);
            // Sort by ID desc (newest first)
            setAllActivities(res.data.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error("Error loading activity bank", error);
        } finally {
            setIsLoadingBank(false);
        }
    };

    const handleCloneActivity = async (id) => {
        try {
            await axios.post(`${API_URL}/api/pronunciation/activities/${id}/clone`, {
                target_date: selectedDate
            });
            setShowBankModal(false);
            fetchActivities(selectedDate);
            alert("¡Actividad asignada correctamente a la fecha!");
        } catch (error) {
            console.error(error);
            alert("Error al intentar clonar la actividad.");
        }
    };

    // Calendar logic
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const renderCalendar = () => {
        const days = [];
        const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            days.push(
                <button
                    key={d}
                    type="button"
                    onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedActivity(null);
                    }}
                    className={`p-2 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all mx-auto ${
                        isSelected 
                            ? 'bg-black text-white shadow-md' 
                            : isToday 
                                ? 'bg-gray-200 text-black' 
                                : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    {d}
                </button>
            );
        }
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-black uppercase tracking-tighter text-black capitalize">{monthName}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-bold text-xs uppercase tracking-widest text-gray-500">Ant</button>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-bold text-xs uppercase tracking-widest text-gray-500">Sig</button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
                        <div key={day} className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-y-2">
                    {days}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Día seleccionado: <span className="text-black">{selectedDate}</span>
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif' }} className="min-h-screen bg-white text-black p-8 mt-[80px]">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 border-b border-gray-200 pb-6">
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
                        Admin <span className="text-gray-400">Pronunciation</span>
                    </h1>
                    <p className="font-bold uppercase text-[10px] tracking-widest text-gray-500 mt-2">
                        System Configuration / Activities
                    </p>
                </header>
                
                {!selectedActivity ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {renderCalendar()}
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-black">Nueva Actividad (para {selectedDate})</h2>
                                <button 
                                    type="button"
                                    onClick={openBankModal}
                                    className="px-6 py-3 bg-indigo-100 text-indigo-700 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-200 transition-all flex items-center justify-center shadow-sm whitespace-nowrap border-2 border-black"
                                >
                                    Banco de Actividades
                                </button>
                            </div>
                            <form onSubmit={handleActivitySubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Título de la actividad</label>
                                        <input type="text" name="title" value={activityForm.title} onChange={handleActivityChange} placeholder="Ej: Unidad 1: Vocales" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium placeholder:text-gray-400" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Descripción (opcional)</label>
                                        <textarea name="description" value={activityForm.description} onChange={handleActivityChange} placeholder="Ej: Ejercicios enfocados en sonidos vocálicos..." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium resize-none h-24 placeholder:text-gray-400" />
                                    </div>
                                    <button type="submit" className="w-full md:w-auto px-8 py-4 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <FiPlus size={16} /> CREAR ACTIVIDAD
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3">
                                Actividades del día
                                <span className="bg-gray-100 text-black px-2 py-1 rounded-md text-[10px] tracking-widest font-bold">
                                    {activities.length}
                                </span>
                            </h2>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <FiLoader className="animate-spin text-black mb-4" size={32} />
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Sin actividades</p>
                                    <p className="text-sm font-medium text-gray-500">Crea la primera actividad para este día.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activities.map(activity => (
                                        <div 
                                            key={activity.id} 
                                            onClick={() => setSelectedActivity(activity)}
                                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-black hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-gray-100 p-2 rounded-lg text-black">
                                                        <FiFolder size={20} />
                                                    </div>
                                                    <h3 className="font-black text-lg text-black tracking-tight">{activity.title}</h3>
                                                </div>
                                                {activity.description && <p className="text-sm text-gray-500 line-clamp-2 mt-2">{activity.description}</p>}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                    {activity.PronunciationTasks?.length || 0} Ejercicios
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <button 
                            onClick={() => setSelectedActivity(null)} 
                            className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
                        >
                            <FiArrowLeft size={16} /> Volver a Actividades
                        </button>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-10">
                            <h2 className="text-2xl font-black text-black tracking-tight mb-2">{selectedActivity.title}</h2>
                            {selectedActivity.description && <p className="text-sm text-gray-600">{selectedActivity.description}</p>}
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-10">
                            <form onSubmit={handleTaskSubmit} className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-xl font-black uppercase tracking-tighter text-black mb-6">Nuevo Ejercicio Manual</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Título del ejercicio</label>
                                        <input type="text" name="title" value={taskForm.title} onChange={handleTaskChange} placeholder="Ej: Lectura de párrafo" className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium placeholder:text-gray-400" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Instrucción (opcional)</label>
                                        <textarea name="instruction" value={taskForm.instruction} onChange={handleTaskChange} placeholder="Ej: Lee el siguiente texto en voz alta prestando atención a la entonación..." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium resize-none h-24 placeholder:text-gray-400" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Textos esperados (una oración por línea en inglés)</label>
                                        <textarea name="expected_text" value={taskForm.expected_text} onChange={handleTaskChange} placeholder="First sentence.&#10;Second sentence.&#10;Third sentence." className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all text-sm font-medium resize-none h-24 placeholder:text-gray-400" required />
                                    </div>
                                    <button type="submit" className="w-full px-8 py-4 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                                        <FiPlus size={16} /> CREAR EJERCICIO
                                    </button>
                                </div>
                            </form>

                            <div className="md:w-1/3 bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center">
                                <h3 className="text-lg font-black uppercase tracking-tighter text-[#1d1d1d] mb-3">Generador IA ✨</h3>
                                <p className="text-xs text-gray-500 font-medium mb-6">Genera ejercicios de pronunciación automáticamente usando inteligencia artificial sobre cualquier tema.</p>
                                <button 
                                    onClick={() => setShowAiModal(true)}
                                    className="w-full px-6 py-4 bg-[#b273c2] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#9c63ad] transition-all flex items-center justify-center shadow-md"
                                >
                                    Generar con IA
                                </button>
                            </div>
                        </div>

                        {showAiModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[30px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                                >
                                    <button onClick={() => setShowAiModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black font-bold">X</button>
                                    
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">Generar Ejercicios ✨</h2>
                                    <p className="text-sm text-gray-500 mb-6">Describe el tema y la IA creará 3 ejercicios listos para usar.</p>

                                    {generatedTasks.length === 0 ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Tema de los ejercicios</label>
                                                <input 
                                                    type="text" 
                                                    value={aiTopic}
                                                    onChange={(e) => setAiTopic(e.target.value)}
                                                    placeholder="Ej: Vocabulario de aeropuerto, Saludar a un amigo..." 
                                                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b273c2] focus:border-[#b273c2] transition-all font-medium"
                                                    disabled={isGenerating}
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Cant. de Ejercicios</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" max="10"
                                                        value={aiTaskCount}
                                                        onChange={(e) => setAiTaskCount(Number(e.target.value))}
                                                        className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b273c2] focus:border-[#b273c2] transition-all font-medium"
                                                        disabled={isGenerating}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Oraciones por Ejercicio</label>
                                                    <input 
                                                        type="number" 
                                                        min="1" max="10"
                                                        value={aiSentenceCount}
                                                        onChange={(e) => setAiSentenceCount(Number(e.target.value))}
                                                        className="w-full p-4 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b273c2] focus:border-[#b273c2] transition-all font-medium"
                                                        disabled={isGenerating}
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleGenerateAiTasks}
                                                disabled={isGenerating || !aiTopic.trim()}
                                                className="w-full px-8 py-4 bg-[#b273c2] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-[#9c63ad] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm mt-4"
                                            >
                                                {isGenerating ? <FiLoader className="animate-spin" size={18} /> : "Generar Ahora"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            <div className="space-y-6">
                                                {generatedTasks.map((task, index) => (
                                                    <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                                        <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-4">Ejercicio {index + 1}</h3>
                                                        <div className="space-y-4">
                                                            <input 
                                                                type="text" 
                                                                value={task.title}
                                                                onChange={(e) => handleGeneratedTaskChange(index, 'title', e.target.value)}
                                                                className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm font-bold"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                value={task.instruction}
                                                                onChange={(e) => handleGeneratedTaskChange(index, 'instruction', e.target.value)}
                                                                className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm text-gray-600"
                                                            />
                                                            <textarea 
                                                                value={Array.isArray(task.expected_text) ? task.expected_text.join('\n') : task.expected_text}
                                                                onChange={(e) => handleGeneratedTaskChange(index, 'expected_text', e.target.value)}
                                                                className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium resize-none h-24"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => setGeneratedTasks([])}
                                                    className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button 
                                                    onClick={handleSaveGeneratedTasks}
                                                    className="flex-1 px-8 py-4 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all shadow-sm"
                                                >
                                                    Guardar Todos
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}
                        
                        {/* Activity Bank Modal */}
                        {showBankModal && (
                            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white rounded-[30px] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
                                >
                                    <button onClick={() => setShowBankModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black font-bold">X</button>
                                    
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-black mb-2">Banco de Actividades</h2>
                                    <p className="text-sm text-gray-500 mb-6">Aquí tienes el historial completo de actividades creadas. Puedes reasignar cualquiera de ellas a la fecha seleccionada ({selectedDate}).</p>

                                    {isLoadingBank ? (
                                        <div className="flex justify-center items-center py-12">
                                            <FiLoader className="animate-spin text-4xl text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {allActivities.length === 0 ? (
                                                <p className="text-center text-gray-500 font-medium py-8">Aún no hay actividades en el sistema.</p>
                                            ) : (
                                                allActivities.map(activity => (
                                                    <div key={activity.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 flex justify-between items-center gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h3 className="font-black text-lg text-black">{activity.title}</h3>
                                                                <span className="text-xs font-bold text-gray-400 bg-gray-200 px-2 py-1 rounded-md">
                                                                    Fecha orig: {activity.assigned_date}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-2">{activity.description || 'Sin descripción'}</p>
                                                            <p className="text-xs font-bold text-indigo-500">{activity.PronunciationTasks?.length || 0} Ejercicios</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleCloneActivity(activity.id)}
                                                            className="px-6 py-3 bg-black text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-800 transition-all whitespace-nowrap shadow-sm"
                                                        >
                                                            Asignar a Hoy
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        )}

                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter text-black mb-6 flex items-center gap-3">
                                Ejercicios Asignados
                                <span className="bg-gray-100 text-black px-2 py-1 rounded-md text-[10px] tracking-widest font-bold">
                                    {selectedActivity.PronunciationTasks?.length || 0}
                                </span>
                            </h2>

                            {!selectedActivity.PronunciationTasks || selectedActivity.PronunciationTasks.length === 0 ? (
                                <div className="bg-white border border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Sin ejercicios</p>
                                    <p className="text-sm font-medium text-gray-500">Agrega el primer ejercicio a esta actividad.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {selectedActivity.PronunciationTasks.map(task => (
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
                                                    onClick={() => handleDeleteTask(task.id)} 
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold p-3 rounded-xl shrink-0 flex items-center justify-center border border-transparent hover:border-red-100"
                                                    title="Eliminar ejercicio"
                                                >
                                                    <FiTrash2 size={18} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default AdminPronunciation;
