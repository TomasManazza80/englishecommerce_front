import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiEdit2, FiTrash2, FiLoader, FiX, FiMic, FiChevronDown, FiChevronUp, FiCheck, FiPackage } from "react-icons/fi";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
const CATEGORIES = ["ALL", "SPEAKING PRACTICE", "PRONUNCIATION", "VOCABULARY", "CONVERSATION", "BUSINESS ENGLISH", "TRAVEL", "DAILY LIFE"];

const AdminPackInventory = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    const [expandedPack, setExpandedPack] = useState(null);
    const [editingPack, setEditingPack] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/pronunciation/activities`);
            setActivities(res.data.sort((a, b) => b.id - a.id));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchActivities(); }, []);

    const filtered = useMemo(() => {
        return activities.filter(a => {
            const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) || (a.description || "").toLowerCase().includes(search.toLowerCase());
            const matchCat = categoryFilter === "ALL" || a.pack_category === categoryFilter;
            return matchSearch && matchCat;
        });
    }, [activities, search, categoryFilter]);

    const openEdit = (pack) => {
        setEditingPack(pack.id);
        setEditForm({ title: pack.title, description: pack.description || "", pack_category: pack.pack_category || "SPEAKING PRACTICE", price: pack.price || 0 });
    };

    const handleSaveEdit = async () => {
        if (!editForm.title.trim()) return Swal.fire({ title: "Falta el titulo", icon: "warning", confirmButtonColor: "#b273c2" });
        setIsSaving(true);
        try {
            await axios.put(`${API_URL}/api/pronunciation/activities/${editingPack}`, { ...editForm, price: Number(editForm.price) });
            setEditingPack(null);
            fetchActivities();
            Swal.fire({ title: "Guardado", icon: "success", confirmButtonColor: "#b273c2", timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire({ title: "Error", text: "No se pudo guardar.", icon: "error", confirmButtonColor: "#b273c2" });
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (pack) => {
        const result = await Swal.fire({
            title: "Eliminar Pack",
            html: `Vas a eliminar <strong>${pack.title}</strong> y todos sus ejercicios. Esta accion no se puede deshacer.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Si, eliminar",
            cancelButtonText: "Cancelar",
        });
        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${API_URL}/api/pronunciation/activities/${pack.id}`);
            fetchActivities();
            Swal.fire({ title: "Eliminado", icon: "success", confirmButtonColor: "#b273c2", timer: 1500, showConfirmButton: false });
        } catch (err) {
            console.error(err);
            Swal.fire({ title: "Error", text: "No se pudo eliminar.", icon: "error", confirmButtonColor: "#b273c2" });
        }
    };

    const handleDeleteTask = async (taskId) => {
        const result = await Swal.fire({ title: "Eliminar ejercicio?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", cancelButtonColor: "#6b7280", confirmButtonText: "Eliminar", cancelButtonText: "Cancelar" });
        if (!result.isConfirmed) return;
        try {
            await axios.delete(`${API_URL}/api/pronunciation/tasks/${taskId}`);
            fetchActivities();
        } catch (err) { console.error(err); }
    };

    const accessBadge = (price) => {
        if (!price || Number(price) === 0) return <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-[#EDF9F0] text-[#29974D] border border-[#DCF3E3]">Gratis</span>;
        return <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-[#FFF1EB] text-[#F36B2B] border border-[#FDE0D3]">${price}</span>;
    };

    return (
        <div className="min-h-screen bg-[#FAF9F6] font-['Inter',sans-serif] text-neutral-900">
            <div className="p-6 space-y-6 max-w-7xl mx-auto font-['Inter',sans-serif] text-neutral-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#19191B] rounded-2xl flex items-center justify-center text-white">
                            <FiPackage className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 tracking-tight">Inventario de Packs</h1>
                            <p className="text-xs text-neutral-500 mt-1">{activities.length} packs publicados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar pack..."
                                className="pl-9 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors w-48"
                            />
                        </div>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c === "ALL" ? "Todas" : c}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-24">
                        <FiLoader className="animate-spin text-neutral-500 w-5 h-5" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl p-16 text-center">
                        <h2 className="text-base font-medium text-neutral-800">Sin resultados</h2>
                        <p className="text-xs text-neutral-500 mt-1">No se encontraron packs que coincidan con la busqueda.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filtered.map((pack) => (
                                <motion.div
                                    key={pack.id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl overflow-hidden"
                                >
                                    {/* Edit form inline */}
                                    {editingPack === pack.id ? (
                                        <div className="p-6 bg-[#FAF9F6] border-b border-[#ECECE6]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.title}
                                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Categoria</label>
                                                    <select
                                                        value={editForm.pack_category}
                                                        onChange={(e) => setEditForm({ ...editForm, pack_category: e.target.value })}
                                                        className="w-full h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                                    >
                                                        {CATEGORIES.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Precio</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={editForm.price}
                                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                                            className="w-full pl-7 h-10 px-3 py-1.5 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Descripcion</label>
                                                    <textarea
                                                        value={editForm.description}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                        rows={2}
                                                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#E2E2DC] bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors resize-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 justify-end">
                                                <button
                                                    onClick={() => setEditingPack(null)}
                                                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-white border border-[#E2E2DC] text-neutral-700 hover:bg-[#FAF9F6] hover:text-neutral-900"
                                                >
                                                    <FiX className="w-4 h-4" /> Cancelar
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    disabled={isSaving}
                                                    className="h-10 px-4 text-xs font-medium rounded-xl inline-flex items-center justify-center gap-2 transition-colors bg-[#19191B] hover:bg-neutral-800 text-white disabled:opacity-50"
                                                >
                                                    {isSaving ? <FiLoader className="animate-spin w-4 h-4" /> : <FiCheck className="w-4 h-4" />} Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-5 flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] rounded-2xl flex items-center justify-center shrink-0">
                                                <FiMic className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base font-medium text-neutral-800">{pack.title}</h3>
                                                    {accessBadge(pack.price)}
                                                    <span className="px-2 py-0.5 rounded-xl text-xs font-medium bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6]">
                                                        {pack.pack_category || "SPEAKING PRACTICE"}
                                                    </span>
                                                </div>
                                                {pack.description && <p className="text-xs text-neutral-700 mt-0.5 line-clamp-1">{pack.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-neutral-700 mr-2">{pack.PronunciationTasks?.length || 0} ejercicios</span>
                                                <button
                                                    onClick={() => openEdit(pack)}
                                                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pack)}
                                                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setExpandedPack(expandedPack === pack.id ? null : pack.id)}
                                                    className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors"
                                                >
                                                    {expandedPack === pack.id ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tasks expandable */}
                                    <AnimatePresence>
                                        {expandedPack === pack.id && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="border-t border-[#ECECE6] bg-[#FAF9F6] p-5">
                                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Ejercicios del Pack</p>
                                                    {!pack.PronunciationTasks || pack.PronunciationTasks.length === 0 ? (
                                                        <p className="text-xs text-neutral-700 italic">No tiene ejercicios asignados.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {pack.PronunciationTasks.map((task) => (
                                                                <div key={task.id} className="bg-white border border-[#ECECE6] shadow-xs rounded-2xl p-4 flex items-start gap-4">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-base font-medium text-neutral-800">{task.title}</p>
                                                                        {task.instruction && <p className="text-xs text-neutral-700 mt-0.5">{task.instruction}</p>}
                                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                                            {(Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text]).slice(0, 2).map((s, i) => (
                                                                                <span key={i} className="text-xs bg-[#F3F2EE] text-neutral-700 border border-[#ECECE6] px-2 py-0.5 rounded-xl">"{s}"</span>
                                                                            ))}
                                                                            {(Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text]).length > 2 && (
                                                                                <span className="text-xs text-neutral-500 self-center">+{(Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text]).length - 2} mas</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteTask(task.id)}
                                                                        className="h-8 w-8 rounded-xl inline-flex items-center justify-center text-neutral-500 hover:text-neutral-900 hover:bg-[#F3F2EE] transition-colors shrink-0"
                                                                    >
                                                                        <FiTrash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPackInventory;
