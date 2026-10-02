import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiTrash2, FiLoader, FiMic, FiChevronDown, FiChevronUp, FiCheck } from "react-icons/fi";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const CATEGORIES = ["SPEAKING PRACTICE", "PRONUNCIATION", "VOCABULARY", "CONVERSATION", "BUSINESS ENGLISH", "TRAVEL", "DAILY LIFE"];

const emptyTask = () => ({ title: "", instruction: "", expected_text: "", task_type: "pronunciation", useful_words: [], expanded: true });

const AdminCreatePack = ({ onPackCreated }) => {
    const [packForm, setPackForm] = useState({ title: "", description: "", pack_category: "SPEAKING PRACTICE", price: 0 });
    const [tasks, setTasks] = useState([emptyTask()]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiTaskCount, setAiTaskCount] = useState(3);
    const [aiSentenceCount, setAiSentenceCount] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePackChange = (e) => setPackForm({ ...packForm, [e.target.name]: e.target.value });
    const addTask = () => setTasks([...tasks, emptyTask()]);
    const removeTask = (i) => setTasks(tasks.filter((_, idx) => idx !== i));
    const updateTask = (i, field, value) => { const u = [...tasks]; u[i] = { ...u[i], [field]: value }; setTasks(u); };
    const toggleTask = (i) => { const u = [...tasks]; u[i].expanded = !u[i].expanded; setTasks(u); };

    const handleGenerateAi = async () => {
        if (!aiTopic.trim()) return;
        setIsGenerating(true);
        try {
            const res = await axios.post(`${API_URL}/api/pronunciation/generate-tasks`, { topic: aiTopic, taskCount: aiTaskCount, sentenceCount: aiSentenceCount });
            const generated = res.data.map(t => {
                let expected = t.expected_text || t.sentences || t.text || t.oraciones || t.expected || [];
                return { title: t.title || "Ejercicio", instruction: t.instruction || "", expected_text: Array.isArray(expected) ? expected.join("\n") : expected, expanded: true };
            });
            setTasks(prev => [...prev.filter(t => t.title || t.expected_text), ...generated]);
            setShowAiModal(false); setAiTopic("");
        } catch (err) {
            const fallback = err.response?.data?.fallback;
            if (fallback) {
                const generated = fallback.map(t => {
                    let expected = t.expected_text || t.sentences || t.text || t.oraciones || t.expected || [];
                    return { title: t.title || "Ejercicio", instruction: t.instruction || "", expected_text: Array.isArray(expected) ? expected.join("\n") : expected, expanded: true };
                });
                setTasks(prev => [...prev.filter(t => t.title || t.expected_text), ...generated]);
                setShowAiModal(false); setAiTopic("");
            } else { Swal.fire({ title: "Error IA", text: "No se pudo generar con IA.", icon: "error", confirmButtonColor: "#b273c2" }); }
        } finally { setIsGenerating(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validTasks = tasks.filter(t => (t.title || "").trim() && (t.expected_text || "").trim());
        if (!packForm.title.trim()) return Swal.fire({ title: "Falta el nombre", text: "Ingresa un titulo para el pack.", icon: "warning", confirmButtonColor: "#b273c2" });
        if (validTasks.length === 0) return Swal.fire({ title: "Sin ejercicios", text: "Agrega al menos un ejercicio.", icon: "warning", confirmButtonColor: "#b273c2" });
        setIsSubmitting(true);
        try {
            const actRes = await axios.post(`${API_URL}/api/pronunciation/activities`, { ...packForm, price: Number(packForm.price), is_pack: true });
            const activityId = actRes.data.id;
            for (const task of validTasks) {
                const sentences = task.expected_text ? task.expected_text.split("\n").map(s => s.trim()).filter(Boolean) : [];
                await axios.post(`${API_URL}/api/pronunciation/tasks`, { 
                    title: task.title.trim(), 
                    instruction: task.instruction.trim(), 
                    expected_text: sentences, 
                    task_type: task.task_type,
                    useful_words: task.useful_words,
                    activity_id: activityId 
                });
            }
            Swal.fire({ title: "Pack Creado!", html: `<strong>${packForm.title}</strong> se publico con <strong>${validTasks.length}</strong> ejercicio${validTasks.length !== 1 ? "s" : ""}.`, icon: "success", confirmButtonColor: "#b273c2" });
            setPackForm({ title: "", description: "", pack_category: "SPEAKING PRACTICE", price: 0 });
            setTasks([emptyTask()]);
            if (onPackCreated) onPackCreated();
        } catch (err) {
            console.error(err);
            Swal.fire({ title: "Error", text: "No se pudo crear el pack.", icon: "error", confirmButtonColor: "#b273c2" });
        } finally { setIsSubmitting(false); }
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif' }} className="min-h-screen bg-[#F4F7FE] p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#b273c2] rounded-xl flex items-center justify-center text-white"><FiMic size={20} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Crear AI Speaking Pack</h1>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Nuevo pack de practica de pronunciacion</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Pack Info */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                            <span className="w-6 h-6 bg-[#b273c2]/10 text-[#b273c2] rounded-lg flex items-center justify-center text-xs font-black">1</span>
                            Informacion del Pack
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Nombre del Pack *</label>
                                <input type="text" name="title" value={packForm.title} onChange={handlePackChange} placeholder="Ej: Airport Conversations � Intermediate" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all" required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Categoria</label>
                                <select name="pack_category" value={packForm.pack_category} onChange={handlePackChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Precio (0 = gratis)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                                    <input type="number" step="0.01" min="0" name="price" value={packForm.price} onChange={handlePackChange} className="w-full pl-8 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Descripcion</label>
                                <textarea name="description" value={packForm.description} onChange={handlePackChange} placeholder="Que aprendera el estudiante? Contexto, nivel, objetivos..." rows={3} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all resize-none" />
                            </div>
                        </div>
                    </div>

                    {/* Exercises */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <span className="w-6 h-6 bg-[#b273c2]/10 text-[#b273c2] rounded-lg flex items-center justify-center text-xs font-black">2</span>
                                Ejercicios <span className="bg-[#f8f3f6] text-[#b273c2] px-2 py-0.5 rounded-lg text-xs font-black">{tasks.filter(t => t.title || t.expected_text).length}</span>
                            </h2>
                            <button type="button" onClick={() => setShowAiModal(true)} className="px-4 py-2 bg-[#f8f3f6] text-[#b273c2] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#f0e0f5] transition-all flex items-center gap-2 border border-[#e8d1ed]">
                                Generar con IA
                            </button>
                        </div>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {tasks.map((task, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                        <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => toggleTask(i)}>
                                            <span className="w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-xs font-black text-gray-400 shrink-0">{i + 1}</span>
                                            <span className="flex-1 text-sm font-bold text-gray-700 truncate">{task.title || <span className="text-gray-400 font-normal italic">Ejercicio sin titulo</span>}</span>
                                            <div className="flex items-center gap-2">
                                                {tasks.length > 1 && <button type="button" onClick={(e) => { e.stopPropagation(); removeTask(i); }} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><FiTrash2 size={14} /></button>}
                                                {task.expanded ? <FiChevronUp size={16} className="text-gray-400" /> : <FiChevronDown size={16} className="text-gray-400" />}
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {task.expanded && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                    <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Tipo de Ejercicio</label>
                                                            <select value={task.task_type} onChange={(e) => updateTask(i, "task_type", e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all">
                                                                <option value="pronunciation">Práctica de Pronunciación</option>
                                                                <option value="open_question">Pregunta Abierta</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Titulo del Ejercicio *</label>
                                                            <input type="text" value={task.title} onChange={(e) => updateTask(i, "title", e.target.value)} placeholder="Ej: Checking In at the Airport" className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{task.task_type === 'open_question' ? 'Pregunta / Instrucción *' : 'Instruccion'}</label>
                                                            <input type="text" value={task.instruction} onChange={(e) => updateTask(i, "instruction", e.target.value)} placeholder="Ej: Read each sentence clearly." className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all" />
                                                        </div>
                                                        
                                                        {task.task_type === 'pronunciation' ? (
                                                            <div>
                                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Oraciones en ingles * (una por linea)</label>
                                                                <textarea value={task.expected_text} onChange={(e) => updateTask(i, "expected_text", e.target.value)} placeholder={"I would like to check in, please.\nMy flight is to New York.\nHere is my passport."} rows={4} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all resize-none font-mono" />
                                                                <p className="text-xs text-gray-400 mt-1">{task.expected_text ? task.expected_text.split("\n").filter(Boolean).length : 0} oracione{task.expected_text?.split("\n").filter(Boolean).length !== 1 ? "s" : ""}</p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Palabras Útiles (Useful Words)</label>
                                                                <input 
                                                                    type="text" 
                                                                    placeholder="Presiona Enter para agregar palabra" 
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            if (e.target.value.trim()) {
                                                                                updateTask(i, "useful_words", [...(task.useful_words || []), e.target.value.trim()]);
                                                                                e.target.value = "";
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all" 
                                                                />
                                                                <div className="flex flex-wrap gap-2 mt-3">
                                                                    {(task.useful_words || []).map((word, wIdx) => (
                                                                        <div key={wIdx} className="bg-[#f8f3f6] text-[#b273c2] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
                                                                            {word}
                                                                            <button type="button" onClick={() => updateTask(i, "useful_words", task.useful_words.filter((_, idx) => idx !== wIdx))} className="text-[#b273c2] hover:text-red-500">×</button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            <button type="button" onClick={addTask} className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-[#b273c2] hover:text-[#b273c2] transition-all flex items-center justify-center gap-2">
                                <FiPlus size={16} /> Agregar Ejercicio
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-black text-gray-900">{packForm.title || "Pack sin nombre"} � {tasks.filter(t => t.title || t.expected_text).length} ejercicio{tasks.filter(t => t.title || t.expected_text).length !== 1 ? "s" : ""}{Number(packForm.price) > 0 ? ` � $${packForm.price}` : " � Gratis"}</p>
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">{packForm.pack_category}</p>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="px-8 py-4 bg-[#b273c2] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-[#9c63ad] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
                            {isSubmitting ? <FiLoader className="animate-spin" size={18} /> : <FiCheck size={18} />}
                            {isSubmitting ? "Publicando..." : "Publicar Pack"}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Modal */}
            <AnimatePresence>
                {showAiModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white rounded-[28px] p-8 max-w-lg w-full shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">Generador IA</h2>
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Los ejercicios se agregaran al pack</p>
                                </div>
                                <button onClick={() => setShowAiModal(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-bold">X</button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tema de los ejercicios</label>
                                    <input type="text" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="Ej: Ordering food, Hotel check-in, Job interviews..." disabled={isGenerating} onKeyDown={(e) => e.key === "Enter" && handleGenerateAi()} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Ejercicios</label>
                                        <input type="number" min="1" max="8" value={aiTaskCount} onChange={(e) => setAiTaskCount(Number(e.target.value))} disabled={isGenerating} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#b273c2] transition-all text-center" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Oraciones c/u</label>
                                        <input type="number" min="1" max="8" value={aiSentenceCount} onChange={(e) => setAiSentenceCount(Number(e.target.value))} disabled={isGenerating} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#b273c2] transition-all text-center" />
                                    </div>
                                </div>
                                <button onClick={handleGenerateAi} disabled={isGenerating || !aiTopic.trim()} className="w-full px-8 py-4 bg-[#b273c2] text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-[#9c63ad] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                    {isGenerating ? <><FiLoader className="animate-spin" size={18} /> Generando...</> : "Generar Ahora"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCreatePack;
