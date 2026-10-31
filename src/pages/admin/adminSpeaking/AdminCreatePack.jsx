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
        <div style={{ fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif' }} className="min-h-screen bg-[#FAF9F6] text-[#222222]">
            {/* Header del Módulo */}
            <div className="p-6 pb-2 border-b border-[#EAEAE6]">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                    <div>
                        <p className="text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1.5">
                            <FiMic className="w-3.5 h-3.5" /> Nuevo pack de practica de pronunciacion
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Crear AI Speaking Pack</h1>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-4 max-w-5xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Pack Info */}
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#F1F1EB]">
                            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">1</span>
                                Informacion del Pack
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Nombre del Pack *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={packForm.title}
                                    onChange={handlePackChange}
                                    placeholder="Ej: Airport Conversations - Intermediate"
                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Categoria</label>
                                <select
                                    name="pack_category"
                                    value={packForm.pack_category}
                                    onChange={handlePackChange}
                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Precio (0 = gratis)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs font-medium">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        name="price"
                                        value={packForm.price}
                                        onChange={handlePackChange}
                                        className="w-full pl-8 pr-7 py-1.5 bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Descripcion</label>
                                <textarea
                                    name="description"
                                    value={packForm.description}
                                    onChange={handlePackChange}
                                    placeholder="Que aprendera el estudiante? Contexto, nivel, objetivos..."
                                    rows={3}
                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exercises */}
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[#F1F1EB]">
                            <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC]">2</span>
                                Ejercicios
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#EEF5FF] text-[#2F80ED] border-[#DEEBFE]">
                                    {tasks.filter(t => t.title || t.expected_text).length}
                                </span>
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowAiModal(true)}
                                className="inline-flex items-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                            >
                                Generar con IA
                            </button>
                        </div>
                        <div className="space-y-3">
                            <AnimatePresence>
                                {tasks.map((task, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl overflow-hidden group"
                                    >
                                        <div className="flex items-center gap-3 p-3.5 cursor-pointer" onClick={() => toggleTask(i)}>
                                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-white text-neutral-600 border-[#E2E2DC] shrink-0">{i + 1}</span>
                                            <span className="flex-1 text-xs font-bold text-neutral-900 truncate">
                                                {task.title || <span className="text-[11px] text-neutral-400 font-normal italic">Ejercicio sin titulo</span>}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {tasks.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeTask(i); }}
                                                        className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0"
                                                    >
                                                        <FiTrash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                                {task.expanded ? <FiChevronUp className="w-3.5 h-3.5 text-neutral-400" /> : <FiChevronDown className="w-3.5 h-3.5 text-neutral-400" />}
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {task.expanded && (
                                                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                    <div className="px-4 pb-4 space-y-3 border-t border-[#F1F1EB] pt-3">
                                                        <div>
                                                            <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Tipo de Ejercicio</label>
                                                            <select
                                                                value={task.task_type}
                                                                onChange={(e) => updateTask(i, "task_type", e.target.value)}
                                                                className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                            >
                                                                <option value="pronunciation">Práctica de Pronunciación</option>
                                                                <option value="open_question">Pregunta Abierta</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Titulo del Ejercicio *</label>
                                                            <input
                                                                type="text"
                                                                value={task.title}
                                                                onChange={(e) => updateTask(i, "title", e.target.value)}
                                                                placeholder="Ej: Checking In at the Airport"
                                                                className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">
                                                                {task.task_type === 'open_question' ? 'Pregunta / Instrucción *' : 'Instruccion'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={task.instruction}
                                                                onChange={(e) => updateTask(i, "instruction", e.target.value)}
                                                                placeholder="Ej: Read each sentence clearly."
                                                                className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                                            />
                                                        </div>
                                                        
                                                        {task.task_type === 'pronunciation' ? (
                                                            <div>
                                                                <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Oraciones en ingles * (una por linea)</label>
                                                                <textarea
                                                                    value={task.expected_text}
                                                                    onChange={(e) => updateTask(i, "expected_text", e.target.value)}
                                                                    placeholder={"I would like to check in, please.\nMy flight is to New York.\nHere is my passport."}
                                                                    rows={4}
                                                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none font-mono"
                                                                />
                                                                <p className="text-[11px] text-neutral-400 mt-1">
                                                                    {task.expected_text ? task.expected_text.split("\n").filter(Boolean).length : 0} oracione{task.expected_text?.split("\n").filter(Boolean).length !== 1 ? "s" : ""}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Palabras Útiles (Useful Words)</label>
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
                                                                    className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400" 
                                                                />
                                                                <div className="flex flex-wrap gap-2 mt-2.5">
                                                                    {(task.useful_words || []).map((word, wIdx) => (
                                                                        <div key={wIdx} className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-[#F3F2EE] text-neutral-600 border-[#E2E2DC] flex items-center gap-1.5">
                                                                            {word}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateTask(i, "useful_words", task.useful_words.filter((_, idx) => idx !== wIdx))}
                                                                                className="text-neutral-500 hover:text-neutral-900 transition-colors"
                                                                            >
                                                                                ×
                                                                            </button>
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
                            <button
                                type="button"
                                onClick={addTask}
                                className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-[#F3F2EE] text-neutral-800 text-xs font-semibold px-3 py-2 rounded-xl border border-[#DEDEDA] shadow-2xs transition-colors"
                            >
                                <FiPlus className="w-3.5 h-3.5" /> Agregar Ejercicio
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs hover:border-[#D5D5CF] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xs font-bold text-neutral-900">
                                {packForm.title || "Pack sin nombre"} · {tasks.filter(t => t.title || t.expected_text).length} ejercicio{tasks.filter(t => t.title || t.expected_text).length !== 1 ? "s" : ""}{Number(packForm.price) > 0 ? ` · $${packForm.price}` : " · Gratis"}
                            </h3>
                            <p className="text-[11px] text-neutral-400 mt-0.5">{packForm.pack_category}</p>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {isSubmitting ? <FiLoader className="animate-spin w-3.5 h-3.5" /> : <FiCheck className="w-3.5 h-3.5" />}
                            {isSubmitting ? "Publicando..." : "Publicar Pack"}
                        </button>
                    </div>
                </form>
            </div>

            {/* AI Modal */}
            <AnimatePresence>
                {showAiModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 10 }}
                            className="bg-white border border-[#ECECE6] rounded-2xl p-5 shadow-xs max-w-lg w-full group"
                        >
                            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F1F1EB]">
                                <div>
                                    <h2 className="text-base font-semibold text-neutral-900">Generador IA</h2>
                                    <p className="text-[11px] text-neutral-400">Los ejercicios se agregaran al pack</p>
                                </div>
                                <button
                                    onClick={() => setShowAiModal(false)}
                                    className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 group-hover:bg-neutral-900 group-hover:text-white transition-all shrink-0 text-xs"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="space-y-3.5">
                                <div>
                                    <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Tema de los ejercicios</label>
                                    <input
                                        type="text"
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        placeholder="Ej: Ordering food, Hotel check-in, Job interviews..."
                                        disabled={isGenerating}
                                        onKeyDown={(e) => e.key === "Enter" && handleGenerateAi()}
                                        className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Ejercicios</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={aiTaskCount}
                                            onChange={(e) => setAiTaskCount(Number(e.target.value))}
                                            disabled={isGenerating}
                                            className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 text-center"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-neutral-400 block mb-1 uppercase tracking-wider">Oraciones c/u</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={aiSentenceCount}
                                            onChange={(e) => setAiSentenceCount(Number(e.target.value))}
                                            disabled={isGenerating}
                                            className="w-full bg-white hover:bg-neutral-50 focus:bg-white text-xs rounded-xl px-3 py-1.5 border border-[#E2E2DC] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 text-center"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleGenerateAi}
                                    disabled={isGenerating || !aiTopic.trim()}
                                    className="w-full inline-flex items-center justify-center gap-2 bg-[#19191B] hover:bg-neutral-800 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                                >
                                    {isGenerating ? <><FiLoader className="animate-spin w-3.5 h-3.5" /> Generando...</> : "Generar Ahora"}
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
