import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiX, FiPlus, FiTrash2, FiSave, FiList, FiEdit2 } from 'react-icons/fi';
import Swal from 'sweetalert2';

const styles = {
    label: "font-bold text-[10px] text-gray-500 uppercase tracking-widest mb-2 block",
    input: "w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
    btnPrimary: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2 disabled:opacity-50",
    card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
};

const ActivityManagerModal = ({ activity, onClose, onUpdate }) => {
    const [tasks, setTasks] = useState(activity.PronunciationTasks || []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Form State
    const [title, setTitle] = useState('');
    const [instruction, setInstruction] = useState('');
    const [expectedText, setExpectedText] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);

    const handleSubmitTask = async (e) => {
        e.preventDefault();
        if (!title.trim() || !expectedText.trim()) return;

        setIsSubmitting(true);
        try {
            // Convertir el texto esperado (multilínea) en un array de oraciones
            const sentencesArray = expectedText
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            const payload = {
                title: title.trim(),
                instruction: instruction.trim(),
                expected_text: sentencesArray,
                activity_id: activity.id
            };

            if (editingTaskId) {
                // Update existing task
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/pronunciation/tasks/${editingTaskId}`, payload);
                setTasks(tasks.map(t => t.id === editingTaskId ? res.data : t));
                setEditingTaskId(null);
            } else {
                // Create new task
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pronunciation/tasks`, payload);
                setTasks([...tasks, res.data]);
            }
            setTitle('');
            setInstruction('');
            setExpectedText('');
            
            if (onUpdate) await onUpdate();
        } catch (error) {
            console.error("Error creating task:", error);
            Swal.fire({ title: 'ERROR', text: 'Error al crear la tarea.', icon: 'error', confirmButtonColor: '#000000', customClass: { container: 'z-[100000]' } });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (task) => {
        setEditingTaskId(task.id);
        setTitle(task.title);
        setInstruction(task.instruction || '');
        setExpectedText(Array.isArray(task.expected_text) ? task.expected_text.join('\n') : task.expected_text);
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setTitle('');
        setInstruction('');
        setExpectedText('');
    };

    const handleDeleteTask = async (taskId) => {
        const result = await Swal.fire({
            title: '¿ELIMINAR TAREA?',
            text: '¿Seguro que deseas eliminar esta tarea?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ELIMINAR',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#000000',
            cancelButtonColor: '#f3f4f6',
            customClass: {
                container: 'z-[100000]',
                confirmButton: 'text-white font-bold uppercase text-xs rounded-xl px-4 py-3',
                cancelButton: 'text-black font-bold uppercase text-xs rounded-xl px-4 py-3 border border-gray-300'
            }
        });
        if (!result.isConfirmed) return;
        
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/pronunciation/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.id !== taskId));
            if (onUpdate) await onUpdate();
        } catch (error) {
            console.error("Error deleting task:", error);
            Swal.fire({ title: 'ERROR', text: 'Error al eliminar la tarea.', icon: 'error', confirmButtonColor: '#000000', customClass: { container: 'z-[100000]' } });
        }
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-['Inter']"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className={`${styles.card} w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] bg-white p-0`}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-xl text-black mb-1 font-black tracking-tighter uppercase flex items-center gap-2">
                            <FiList className="text-black" /> GESTOR DE TAREAS
                        </h2>
                        <span className="font-bold tracking-widest uppercase text-gray-500 text-[10px]">
                            ACTIVIDAD: {activity.title}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors bg-white p-2 border border-gray-200 rounded-xl shadow-sm">
                        <FiX size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col md:flex-row overflow-hidden flex-1">
                    
                    {/* Left: Tareas Existentes */}
                    <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto bg-white">
                        <label className={styles.label}>TAREAS ACTUALES ({tasks.length})</label>
                        <div className="space-y-3 mt-4">
                            {tasks.length > 0 ? tasks.map(task => (
                                <div key={task.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex flex-col gap-2 relative group">
                                    <h4 className="font-bold text-sm text-black uppercase">{task.title}</h4>
                                    {task.instruction && <p className="text-[10px] text-gray-500 uppercase">{task.instruction}</p>}
                                    <div className="mt-2 text-xs font-medium text-gray-600 bg-white p-2 rounded border border-gray-100">
                                        {Array.isArray(task.expected_text) 
                                            ? task.expected_text.map((sentence, idx) => <div key={idx}>• {sentence}</div>)
                                            : task.expected_text}
                                    </div>
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <button 
                                            onClick={() => handleEditClick(task)}
                                            className="text-gray-400 hover:text-black transition-colors"
                                            title="Editar tarea"
                                        >
                                            <FiEdit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteTask(task.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors"
                                            title="Eliminar tarea"
                                        >
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-xs italic">No hay tareas en esta actividad aún.</p>
                            )}
                        </div>
                    </div>

                    {/* Right: Formulario */}
                    <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-50">
                        <label className={styles.label}>
                            {editingTaskId ? 'EDITANDO TAREA' : 'NUEVA TAREA PARA ESTA ACTIVIDAD'}
                        </label>
                        <form onSubmit={handleSubmitTask} className="space-y-4 mt-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">TÍTULO (Ej: Warm Up)</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={title} 
                                    onChange={e => setTitle(e.target.value)} 
                                    className={`${styles.input} bg-white`} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">INSTRUCCIÓN (Ej: Lee en voz alta)</label>
                                <input 
                                    type="text" 
                                    value={instruction} 
                                    onChange={e => setInstruction(e.target.value)} 
                                    className={`${styles.input} bg-white`} 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">ORACIONES ESPERADAS (Una por línea)</label>
                                <textarea 
                                    required 
                                    rows="5"
                                    value={expectedText} 
                                    onChange={e => setExpectedText(e.target.value)} 
                                    className={`${styles.input} bg-white resize-none`} 
                                    placeholder={`I always stretch before working out.\nIt is important to warm up.\nI do ten minutes of cardio first.`}
                                />
                            </div>
                            <div className="flex gap-2">
                                {editingTaskId && (
                                    <button 
                                        type="button" 
                                        onClick={handleCancelEdit} 
                                        className="bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-xl transition-all py-3 px-4 flex-1"
                                    >
                                        CANCELAR
                                    </button>
                                )}
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting || !title.trim() || !expectedText.trim()} 
                                    className={`${styles.btnPrimary} flex-[2]`}
                                >
                                    {isSubmitting ? 'GUARDANDO...' : <><FiSave size={16} /> {editingTaskId ? 'ACTUALIZAR TAREA' : 'GUARDAR TAREA'}</>}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

export default ActivityManagerModal;
