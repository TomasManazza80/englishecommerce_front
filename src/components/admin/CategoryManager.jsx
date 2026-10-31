import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FiEdit2, FiTrash2, FiSettings, FiChevronUp } from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

const CategoryManager = ({ categorias = [], onChanged, onRenamed, onDeleted }) => {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const handleEdit = async (cat) => {
    const { value, isConfirmed } = await Swal.fire({
      title: "Editar categoría",
      input: "text",
      inputValue: cat.categoryName,
      showCancelButton: true,
      confirmButtonText: "Guardar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#19191B",
      inputValidator: (v) => (!v || !v.trim() ? "El nombre es obligatorio" : null)
    });
    if (!isConfirmed) return;
    setBusyId(cat.categoryId);
    try {
      const res = await axios.put(`${API_URL}/api/categories/${cat.categoryId}`, {
        nombre: value.trim()
      });
      if (onRenamed) onRenamed(cat.categoryName, res.data?.categoryName || value.trim().toUpperCase());
      if (onChanged) await onChanged();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "No se pudo editar la categoría.",
        icon: "error",
        confirmButtonColor: "#19191B"
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (cat) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar categoría?",
      text: `Se eliminará "${cat.categoryName}". Los cursos existentes conservan su texto de categoría.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar"
    });
    if (!confirm.isConfirmed) return;
    setBusyId(cat.categoryId);
    try {
      await axios.delete(`${API_URL}/api/categories/${cat.categoryId}`);
      if (onDeleted) onDeleted(cat.categoryName);
      if (onChanged) await onChanged();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || "No se pudo eliminar la categoría.",
        icon: "error",
        confirmButtonColor: "#19191B"
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-[#E2E2DC] text-xs font-medium text-neutral-700 rounded-xl hover:bg-neutral-50 transition-colors"
      >
        {open ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiSettings className="w-3.5 h-3.5" />}
        {open ? "Ocultar categorías" : `Gestionar categorías (${categorias.length})`}
      </button>

      {open && (
        <div className="mt-2 bg-[#F8F8F5] border border-[#E4E4DF] rounded-xl p-2 space-y-1.5 max-h-52 overflow-y-auto" data-lenis-prevent>
          {categorias.length === 0 && (
            <p className="text-[11px] text-neutral-400 px-2 py-2">No hay categorías creadas.</p>
          )}
          {categorias.map((c) => (
            <div
              key={c.categoryId}
              className="flex items-center justify-between gap-2 bg-white border border-[#ECECE6] rounded-xl px-3 py-1.5"
            >
              <span className="text-xs font-medium text-neutral-700 truncate">{c.categoryName}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={busyId === c.categoryId}
                  onClick={() => handleEdit(c)}
                  className="w-7 h-7 rounded-full inline-flex items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                  title="Editar"
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={busyId === c.categoryId}
                  onClick={() => handleDelete(c)}
                  className="w-7 h-7 rounded-full inline-flex items-center justify-center text-neutral-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  title="Eliminar"
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

