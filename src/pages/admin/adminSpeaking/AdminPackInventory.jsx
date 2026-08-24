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
        if (!price || Number(price) === 0) return <span className="px-2 py-0.5 rounded-full text-xs font-black bg-green-100 text-green-700">Gratis</span>;
        return <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-700">${price}</span>;
    };

    return (
        <div style={{ fontFamily: '"Inter", sans-serif' }} className="min-h-screen bg-[#F4F7FE] p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#b273c2] rounded-xl flex items-center justify-center text-white"><FiPackage size={20} /></div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Inventario de Packs</h1>
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{activities.length} packs publicados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pack..." className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all w-48" />
                        </div>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="py-2.5 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-[#b273c2] transition-all">
                            {CATEGORIES.map(c => <option key={c} value={c}>{c === "ALL" ? "Todas" : c}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-24"><FiLoader className="animate-spin text-[#b273c2]" size={36} /></div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Sin resultados</p>
                        <p className="text-sm text-gray-500">No se encontraron packs que coincidan con la busqueda.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filtered.map((pack) => (
                                <motion.div key={pack.id} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    {/* Edit form inline */}
                                    {editingPack === pack.id ? (
                                        <div className="p-6 bg-[#faf5fb] border-b border-[#e8d1ed]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Nombre</label>
                                                    <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] focus:ring-1 focus:ring-[#b273c2] transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Categoria</label>
                                                    <select value={editForm.pack_category} onChange={(e) => setEditForm({ ...editForm, pack_category: e.target.value })} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#b273c2] transition-all">
                                                        {CATEGORIES.filter(c => c !== "ALL").map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Precio</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                                                        <input type="number" step="0.01" min="0" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full pl-7 p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all" />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Descripcion</label>
                                                    <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#b273c2] transition-all resize-none" />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 justify-end">
                                                <button onClick={() => setEditingPack(null)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"><FiX size={14} /> Cancelar</button>
                                                <button onClick={handleSaveEdit} disabled={isSaving} className="px-5 py-2.5 bg-[#b273c2] text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#9c63ad] disabled:opacity-50 transition-all flex items-center gap-2">
                                                    {isSaving ? <FiLoader className="animate-spin" size={14} /> : <FiCheck size={14} />} Guardar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-5 flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#f8f3f6] rounded-xl flex items-center justify-center text-[#b273c2] shrink-0"><FiMic size={18} /></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black text-gray-900 text-sm tracking-tight">{pack.title}</h3>
                                                    {accessBadge(pack.price)}
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">{pack.pack_category || "SPEAKING PRACTICE"}</span>
                                                </div>
                                                {pack.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{pack.description}</p>}
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <span className="text-xs font-black text-gray-400">{pack.PronunciationTasks?.length || 0} ejercicios</span>
                                                <button onClick={() => openEdit(pack)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#b273c2] hover:bg-[#f8f3f6] rounded-xl transition-all border border-transparent hover:border-[#e8d1ed]"><FiEdit2 size={15} /></button>
                                                <button onClick={() => handleDelete(pack)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"><FiTrash2 size={15} /></button>
                                                <button onClick={() => setExpandedPack(expandedPack === pack.id ? null : pack.id)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                                                    {expandedPack === pack.id ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tasks expandable */}
                                    <AnimatePresence>
                                        {expandedPack === pack.id && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="border-t border-gray-100 bg-gray-50 p-5">
                                                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Ejercicios del Pack</p>
                                                    {!pack.PronunciationTasks || pack.PronunciationTasks.length === 0 ? (
                                                        <p className="text-xs text-gray-500 font-medium italic">No tiene ejercicios asignados.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {pack.PronunciationTasks.map((task) => (
                                                                <div key={task.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-black text-gray-900">{task.title}</p>
                                                                        {task.instruction && <p className="text-xs text-gray-400 font-medium mt-0.5">{task.instruction}</p>}
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {(Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text]).slice(0, 2).map((s, i) => (
                                                                                <span key={i} className="text-xs bg-[#f8f3f6] text-[#b273c2] px-2 py-0.5 rounded-lg font-medium">"{s}"</span>
                                                                            ))}
                                                                            {(Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text]).length > 2 && (
                                                                                <span className="text-xs text-gray-400 font-medium">+{(Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text]).length - 2} mas</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={() => handleDeleteTask(task.id)} className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"><FiTrash2 size={13} /></button>
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
