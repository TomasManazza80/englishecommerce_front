import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiSearch, FiAlertTriangle, FiEdit2, FiTrash2, FiX, FiInfo, FiSave, FiLoader, FiPlus, FiTruck, FiActivity, FiFile, FiVideo, FiCheckCircle, FiRefreshCcw, FiFileText
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import ProductInfoModal from '../ProductInfoModal';
import ActivityManagerModal from '../../../components/admin/ActivityManagerModal';

// --- CONFIGURACIÓN DE ESTILOS (Brutalismo Suave) ---
const styles = {
  label: "font-black text-[10px] text-black uppercase tracking-widest mb-2 block",
  input: "w-full bg-white border border-black rounded-xl p-3 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
  searchInput: "w-full bg-white border border-black rounded-full p-3 pl-12 text-black focus:border-black focus:ring-1 focus:ring-black outline-none text-sm font-medium transition-all",
  title: "text-3xl text-black mb-2 font-black tracking-tighter uppercase flex items-center gap-2",
  subtitle: "font-bold tracking-widest uppercase text-gray-500 text-[10px]",
  btnPrimary: "bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all py-3 px-4 flex items-center justify-center gap-2",
  btnSecondary: "bg-white border border-gray-300 text-gray-500 hover:text-black hover:border-black font-bold uppercase text-[10px] rounded-lg transition-all py-3 px-4 flex items-center justify-center gap-2",
  card: "bg-white border border-gray-200 rounded-2xl p-6 shadow-sm",
  listItem: "p-3 rounded-xl border transition-all flex items-center justify-between bg-white border-gray-200 hover:border-gray-300",
  alertNeutral: "p-4 rounded-xl flex items-center gap-3 border bg-gray-100 border-gray-300 text-black text-xs font-bold uppercase",
};

// --- CREDENCIALES CLOUDINARY ---
const CLOUD_NAME = "dxvkqumpu";
const UPLOAD_PRESET = "ecommerce";

const authenticator = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/imagekit`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Request failed with status ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    const { signature, expire, token } = data;
    return { signature, expire, token };
  } catch (error) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

// --- UTILIDAD: OPTIMIZACIÓN DE IMÁGENES ---
const optimizeImage = (url, width = 800) => {
  if (!url) return '';
  if (url.includes('ik.imagekit.io')) {
    return `${url}?tr=w-${width},f-webp,q-80`;
  } else if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},f_webp,q_auto/${parts[1]}`;
    }
  }
  return url;
};

// --- COMPONENTE: FORMULARIO DE EDICIÓN ---
const FormularioEditarModal = ({ producto, onClose, onSave, proveedores, categorias, pronunciationActivities, fetchPronunciationActivities }) => {
  const [editado, setEditado] = useState({
    ...producto,
    variantes: producto.variantes || [],
    archivosInfoproducto: producto.archivosInfoproducto || [],
    speakingActivities: producto.speakingActivities || [],
    esInfoproducto: producto.esInfoproducto || false
  });
  const [variantInput, setVariantInput] = useState({
    color: '', almacenamiento: '', stock: '', costoDeCompra: '',
    precioAlPublico: '', precioMayorista: '', precioRevendedor: ''
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [fileError, setFileError] = useState('');
  const [managingActivity, setManagingActivity] = useState(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [stockToAdd, setStockToAdd] = useState({});
  const [newActivityTitle, setNewActivityTitle] = useState('');
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activityTab, setActivityTab] = useState('select'); // 'select' o 'create'
  const [activitySearchTerm, setActivitySearchTerm] = useState('');

  const PREDEFINED_COLORS = [
    { name: 'Negro', code: '#1C1C1E' }, { name: 'Blanco', code: '#F5F5F7' },
    { name: 'Rojo', code: '#E11C2A' }, { name: 'Azul', code: '#0071E3' },
    { name: 'Verde', code: '#505652' }, { name: 'Gris', code: '#8E8E93' },
    { name: 'Dorado', code: '#F9E5C9' }, { name: 'Plateado', code: '#E3E4E5' },
    { name: 'Violeta', code: '#E5DDEA' }, { name: 'Grafito', code: '#424245' },
    { name: 'Sierra Azul', code: '#9BB5CE' }, { name: 'Medianoche', code: '#192028' },
    { name: 'Estelar', code: '#FAF7F4' }, { name: 'Titanio', code: '#BEBDB8' },
    { name: 'Deep Purple', code: '#594F63' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditado(prev => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (e) => {
    const { name, value } = e.target;
    setVariantInput(prev => ({ ...prev, [name]: value }));
  };

  const addVariant = () => {
    if (!variantInput.stock || !variantInput.color) return alert("Color y Stock son requeridos.");
    setEditado(prev => ({
      ...prev,
      variantes: [...prev.variantes, { ...variantInput, stock: Number(variantInput.stock) }]
    }));
    setVariantInput({ color: '', almacenamiento: '', stock: '', costoDeCompra: '', precioAlPublico: '', precioMayorista: '', precioRevendedor: '' });
  };

  const removeVariant = (idx) => {
    setEditado(prev => ({
      ...prev,
      variantes: prev.variantes.filter((_, i) => i !== idx)
    }));
  };

  const handleRemoveImage = (indexToRemove) => {
    setEditado(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleRemoveCourseFile = (indexToRemove) => {
    setEditado(prev => ({
      ...prev,
      archivosInfoproducto: prev.archivosInfoproducto.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleExistingVariantChange = (index, field, value) => {
    const newVariantes = [...editado.variantes];
    newVariantes[index] = { ...newVariantes[index], [field]: value };
    setEditado(prev => ({ ...prev, variantes: newVariantes }));
  };

  const handleStockToAddChange = (index, value) => {
    setStockToAdd(prev => ({ ...prev, [index]: value }));
  };

  const handleAddStock = (index) => {
    const amount = Number(stockToAdd[index]) || 0;
    if (amount !== 0) {
      const currentStock = Number(editado.variantes[index].stock) || 0;
      handleExistingVariantChange(index, 'stock', currentStock + amount);
      setStockToAdd(prev => ({ ...prev, [index]: '' }));
    }
  };

  const handleAddCourseFiles = async (e) => {
    const files = Array.from(e.target.files);
    setFileError('');
    if (files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      const uploadPromises = files.map(async (originalFile) => {
        let fileToUpload = originalFile;
        const originalExtension = originalFile.name.split('.').pop().toLowerCase();

        // Intercept PPTX/PPT and convert to PDF
        if (['ppt', 'pptx'].includes(originalExtension)) {
          console.log(`Convirtiendo ${originalFile.name} a PDF...`);
          const convertFormData = new FormData();
          convertFormData.append('file', originalFile);

          const convertResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/convert/pptx-to-pdf`, {
            method: 'POST',
            body: convertFormData
          });

          if (!convertResponse.ok) {
            let errStr = "Error desconocido al convertir.";
            try {
              const errObj = await convertResponse.json();
              errStr = errObj.error || errStr;
            } catch (e) {
              errStr = await convertResponse.text();
            }
            throw new Error(`Error convirtiendo ${originalFile.name}: ${errStr}`);
          }

          const pdfBlob = await convertResponse.blob();
          const newFileName = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) + '.pdf';
          fileToUpload = new File([pdfBlob], newFileName, { type: 'application/pdf' });
        }

        const authData = await authenticator();
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
        formData.append("signature", authData.signature);
        formData.append("expire", authData.expire);
        formData.append("token", authData.token);
        formData.append("fileName", fileToUpload.name);
        formData.append("folder", "/products/materials");

        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const fileData = await response.json();
          const extension = fileToUpload.name.split('.').pop().toLowerCase();
          let fileType = 'application/octet-stream';
          if (['pdf'].includes(extension)) fileType = 'application/pdf';
          if (['mp4', 'webm'].includes(extension)) fileType = 'video/mp4';
          if (['jpg', 'jpeg', 'png', 'webp'].includes(extension)) fileType = 'image/jpeg';
          if (['ppt', 'pptx'].includes(extension)) fileType = 'application/vnd.ms-powerpoint';
          if (['doc', 'docx'].includes(extension)) fileType = 'application/msword';
          if (['xls', 'xlsx'].includes(extension)) fileType = 'application/vnd.ms-excel';

          return {
            url: fileData.url,
            nombre: fileToUpload.name,
            tipo: fileType.includes('video') ? 'video' : fileType.includes('image') ? 'imagen' : 'documento',
            fileType: fileType
          };
        } else {
          console.error('Upload failed:', await response.text());
          throw new Error(`Error al subir el archivo ${fileToUpload.name}.`);
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      setEditado(prev => ({
        ...prev,
        archivosInfoproducto: [...(prev.archivosInfoproducto || []), ...uploadedFiles]
      }));
    } catch (error) {
      console.error('Error uploading course files:', error);
      alert(`SISTEMA: ${error.message || "Error al subir archivos a la nube."}`);
    } finally {
      setIsUploadingFiles(false);
      e.target.value = null;
    }
  };

  const handleAddImages = async (e) => {
    const files = Array.from(e.target.files);
    setFileError('');
    if (files.length === 0) return;

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      setFileError(`NO VÁLIDO: Se detectaron ${invalidFiles.length} archivos que no son imágenes.`);
      return;
    }

    setIsUploadingImages(true);
    const uploadedUrls = [];
    try {
      const uploadPromises = files.map(async (file) => {
        const authData = await authenticator();
        const formData = new FormData();
        formData.append('file', file);
        formData.append("publicKey", import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY);
        formData.append("signature", authData.signature);
        formData.append("expire", authData.expire);
        formData.append("token", authData.token);
        formData.append("fileName", file.name);
        formData.append("folder", "/products");

        const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const fileData = await response.json();
          return fileData.url;
        } else {
          throw new Error(`Error al subir la imagen ${file.name}.`);
        }
      });

      const urls = await Promise.all(uploadPromises);

      setEditado(prev => ({
        ...prev,
        imagenes: [...(prev.imagenes || []), ...urls].slice(0, 10)
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(`SISTEMA: ${error.message || "Error al subir imágenes a la nube."}`);
    } finally {
      setIsUploadingImages(false);
      e.target.value = null;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...editado,
      fechaActualizacionPrecio: new Date().toISOString().split('T')[0]
    });
  };

  const handleToggleSpeakingActivity = (activityId) => {
    setEditado(prev => {
      const current = prev.speakingActivities || [];
      if (current.includes(activityId)) {
        return { ...prev, speakingActivities: current.filter(id => id !== activityId) };
      } else {
        return { ...prev, speakingActivities: [...current, activityId] };
      }
    });
  };

  const handleCreateActivity = async () => {
    if (!newActivityTitle.trim()) return;
    setIsCreatingActivity(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pronunciation/activities`, {
        title: newActivityTitle.trim(),
        description: 'Actividad creada desde el inventario de productos.',
        assigned_date: new Date().toISOString().split('T')[0]
      });

      if (fetchPronunciationActivities) {
        await fetchPronunciationActivities();
      }

      setEditado(prev => ({
        ...prev,
        speakingActivities: [...(prev.speakingActivities || []), res.data.id]
      }));
      setNewActivityTitle('');
    } catch (error) {
      console.error("Error creating activity:", error);
      alert("Error al crear la actividad");
    } finally {
      setIsCreatingActivity(false);
    }
  };

  const handleEditActivityTitle = async (e, act) => {
    e.stopPropagation();
    const { value: newTitle } = await Swal.fire({
      title: 'RENOMBRAR ACTIVIDAD',
      input: 'text',
      inputValue: act.title,
      showCancelButton: true,
      confirmButtonText: 'GUARDAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#f3f4f6',
      customClass: {
        container: 'z-[10000]',
        confirmButton: 'text-white font-bold uppercase text-xs rounded-xl px-4 py-3',
        cancelButton: 'text-black font-bold uppercase text-xs rounded-xl px-4 py-3 border border-gray-300'
      }
    });

    if (newTitle && newTitle.trim() !== act.title) {
      try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/pronunciation/activities/${act.id}`, {
          title: newTitle.trim()
        });
        if (fetchPronunciationActivities) {
          await fetchPronunciationActivities();
        }
      } catch (err) {
        console.error("Error renaming activity", err);
        alert("SISTEMA: Error al renombrar la actividad.");
      }
    }
  };

  const handleGenerateFromPDF = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const result = await Swal.fire({
      title: 'GENERAR CON IA',
      text: '¿Cuántas preguntas deseas generar a partir de este PDF?',
      input: 'number',
      inputAttributes: {
        min: 1,
        max: 50,
        step: 1
      },
      inputValue: 5,
      showCancelButton: true,
      confirmButtonText: 'GENERAR',
      cancelButtonText: 'CANCELAR',
      confirmButtonColor: '#000000',
      cancelButtonColor: '#f3f4f6',
      customClass: {
        container: 'z-[10000]',
        confirmButton: 'text-white font-bold uppercase text-xs rounded-xl px-4 py-3',
        cancelButton: 'text-black font-bold uppercase text-xs rounded-xl px-4 py-3 border border-gray-300'
      }
    });

    if (!result.isConfirmed || !result.value) {
      e.target.value = null;
      return;
    }

    const numQuestions = parseInt(result.value);

    setIsCreatingActivity(true);
    setLoadingProgress(10); // Inicio simulado

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return 90;
        return prev + (Math.random() * 10);
      });
    }, 1500);

    try {
      // 1. Read PDF as Base64
      const pdfBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
      });

      // 2. Generate tasks via AI backend
      const aiRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/pronunciation/generate-from-pdf`, {
        pdfBase64,
        numQuestions: numQuestions
      });

      clearInterval(progressInterval);
      setLoadingProgress(100);

      const newActivityId = aiRes.data.id;
      const completeActivity = {
        ...aiRes.data.activity,
        PronunciationTasks: aiRes.data.tasks
      };

      // 3. Update state
      if (fetchPronunciationActivities) {
        await fetchPronunciationActivities();
      }

      setEditado(prev => ({
        ...prev,
        speakingActivities: [...(prev.speakingActivities || []), newActivityId]
      }));

      setTimeout(() => {
        alert("SISTEMA: ¡Actividades generadas exitosamente desde el PDF!");
        setActivityTab('select'); // Volver a la lista de seleccionados
        setIsCreatingActivity(false);
        setLoadingProgress(0);
        setManagingActivity(completeActivity);
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setLoadingProgress(0);
      console.error("Error generating from PDF:", error);
      alert("SISTEMA: Error al procesar el PDF con la IA");
      setIsCreatingActivity(false);
    } finally {
      e.target.value = null; // Reset input
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm font-['Inter']"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="w-full h-full overflow-hidden flex flex-col bg-white"
      >
        {managingActivity && (
          <ActivityManagerModal
            activity={managingActivity}
            onClose={() => setManagingActivity(null)}
            onUpdate={fetchPronunciationActivities}
          />
        )}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className={`${styles.title} text-xl mb-0`}>
            <FiEdit2 className="text-black" /> EDITOR DE PRODUCTO
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors bg-gray-50 p-2 rounded-xl">
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8">

          {/* CONTENIDO DEL CURSO */}
          <section className="bg-purple-50 p-6 rounded-2xl border border-purple-200">
            <label className={`${styles.label} text-purple-700`}>Contenido del Curso (Módulos, PDFs, Videos)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {editado.archivosInfoproducto?.map((archivo, idx) => (
                <div key={idx} className="relative p-4 bg-white border border-purple-100 rounded-xl flex flex-col items-center gap-2 group hover:shadow-md transition-all text-center">
                  {archivo.tipo === 'video' ? <FiVideo size={32} className="text-purple-600" /> : <FiFile size={32} className="text-purple-600" />}
                  <span className="text-[10px] font-bold text-gray-700 truncate w-full" title={archivo.nombre}>{archivo.nombre || `Archivo ${idx + 1}`}</span>
                  <a href={archivo.url} target="_blank" rel="noreferrer" className="text-[9px] text-purple-500 hover:underline">Ver Original</a>
                  <button type="button" onClick={() => handleRemoveCourseFile(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                    <FiX size={12} />
                  </button>
                </div>
              ))}

              {isUploadingFiles ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl p-4 aspect-square bg-purple-50">
                  <FiLoader size={24} className="text-purple-600 animate-spin mb-2" />
                  <span className="text-[10px] font-bold uppercase text-purple-600 text-center">SUBIENDO<br />ARCHIVOS...</span>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-xl hover:border-purple-600 hover:bg-white cursor-pointer transition-all text-purple-500 hover:text-purple-600 p-4 aspect-square">
                  <FiPlus size={24} />
                  <span className="text-[10px] font-bold uppercase mt-2 text-center">AÑADIR CONTENIDO</span>
                  <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.mp3,.png,.jpg,.jpeg,video/*,image/*,application/pdf" multiple onChange={handleAddCourseFiles} className="hidden" disabled={isUploadingFiles} />
                </label>
              )}
            </div>
          </section>

          {/* ACTIVIDADES DE SPEAKING */}
          <section className="bg-blue-50 p-4 sm:p-6 rounded-2xl border border-blue-200">
            {/* TABS DE SELECCIÓN */}
            <div className="flex gap-4 mb-6 border-b border-gray-200 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActivityTab('select')}
                className={`pb-3 text-xs font-bold uppercase transition-all whitespace-nowrap ${activityTab === 'select' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
              >
                Seleccionar Registros Pasados
              </button>
              <button
                type="button"
                onClick={() => setActivityTab('create')}
                className={`pb-3 text-xs font-bold uppercase transition-all whitespace-nowrap ${activityTab === 'create' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
              >
                Crear Nueva Actividad / Tareas
              </button>
              <button
                type="button"
                onClick={() => setActivityTab('ai-pdf')}
                className={`pb-3 text-xs font-bold uppercase transition-all whitespace-nowrap ${activityTab === 'ai-pdf' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-black'}`}
              >
                Generar con IA (PDF)
              </button>
            </div>

            {/* CONTENIDO DE TABS */}
            {activityTab === 'select' && (
              <div className="animate-fade-in">
                <label className={`${styles.label} text-blue-700`}>BUSCAR Y SELECCIONAR ACTIVIDADES DE PRONUNCIACIÓN</label>
                <input
                  type="text"
                  placeholder="BUSCAR ACTIVIDAD..."
                  value={activitySearchTerm}
                  onChange={(e) => setActivitySearchTerm(e.target.value)}
                  className={`${styles.input} mb-4 py-2 text-xs`}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {pronunciationActivities && pronunciationActivities
                    .filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase()))
                    .map(act => (
                      <div key={act.id} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm cursor-pointer" onClick={() => handleToggleSpeakingActivity(act.id)}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={(editado.speakingActivities || []).includes(act.id)}
                            readOnly
                            className="w-5 h-5 accent-black cursor-pointer flex-shrink-0"
                          />
                          <div className="flex flex-col flex-1">
                            <span className="text-black font-bold text-sm leading-tight">{act.title}</span>
                            <span className="text-gray-500 text-[10px] mt-1">{act.PronunciationTasks?.length || 0} Tareas</span>
                          </div>
                        </div>
                        <div className="flex gap-2 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0">
                          <button
                            type="button"
                            onClick={(e) => handleEditActivityTitle(e, act)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg p-2 transition-colors flex items-center justify-center w-full sm:w-auto"
                            title="Renombrar Actividad"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setManagingActivity(act); }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 transition-colors text-xs font-bold w-full sm:w-auto text-center flex-1"
                            title="Gestionar Tareas"
                          >
                            TAREAS
                          </button>
                        </div>
                      </div>
                    ))}
                  {(!pronunciationActivities || pronunciationActivities.filter(act => act.title.toLowerCase().includes(activitySearchTerm.toLowerCase())).length === 0) && (
                    <p className="text-gray-500 text-xs italic col-span-full">No se encontraron actividades de speaking.</p>
                  )}
                </div>
              </div>
            )}

            {activityTab === 'create' && (
              <div className="animate-fade-in">
                <label className={`${styles.label} text-blue-700`}>CREAR Y SELECCIONAR UNA NUEVA ACTIVIDAD EN BLANCO</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newActivityTitle}
                    onChange={e => setNewActivityTitle(e.target.value)}
                    placeholder="TÍTULO (EJ: LECCIÓN 1)..."
                    className={`${styles.input} flex-1 py-2 text-xs`}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateActivity(); } }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateActivity}
                    disabled={isCreatingActivity || !newActivityTitle.trim()}
                    className="bg-black text-white font-bold uppercase text-[10px] rounded-xl transition-all py-3 px-6 flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isCreatingActivity ? 'CREANDO...' : <><FiPlus size={14} /> CREAR Y SELECCIONAR</>}
                  </button>
                </div>
                <p className="text-gray-400 text-[10px] italic mt-2 text-center sm:text-left">
                  Una vez creada, aparecerá seleccionada en tus registros y podrás agregarle tareas.
                </p>
              </div>
            )}

            {activityTab === 'ai-pdf' && (
              <div className="animate-fade-in flex flex-col items-center mt-4">
                <label className={`${styles.label} text-blue-700`}>SUBIR PDF PARA GENERAR ACTIVIDADES DE PRONUNCIACIÓN</label>
                <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 flex flex-col items-center justify-center relative bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors w-full">
                  {isCreatingActivity ? (
                    <div className="flex flex-col items-center text-center w-full max-w-md mx-auto">
                      <FiRefreshCcw size={40} className="text-blue-500 animate-spin mb-4 mx-auto" />
                      <span className="font-bold text-[10px] uppercase tracking-widest text-blue-600 mb-2">ANALIZANDO PDF CON IA... ESTO PUEDE TOMAR UNOS SEGUNDOS</span>
                      <div className="w-full bg-blue-100 rounded-full h-2 mt-2 overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${loadingProgress}%` }}></div>
                      </div>
                      <span className="text-[10px] text-blue-500 font-bold mt-2">{Math.round(loadingProgress)}%</span>
                    </div>
                  ) : (
                    <>
                      <FiFileText size={32} className="text-blue-300 mb-3" />
                      <span className="font-bold text-[10px] uppercase tracking-widest text-blue-500">CLIC AQUÍ PARA SUBIR UN ARCHIVO PDF</span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleGenerateFromPDF}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={isCreatingActivity}
                      />
                    </>
                  )}
                </div>
                <p className="text-blue-400 text-[10px] italic mt-2 text-center w-full">
                  La IA leerá el contenido del PDF y extraerá conceptos clave para crear tareas de pronunciación.
                </p>
              </div>
            )}
          </section>

          {/* GALERÍA DE ACTIVOS */}
          <section>
            <label className={styles.label}>Portada ({editado.imagenes?.length || 0}/10)</label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {editado.imagenes?.map((img, idx) => (
                <div key={idx} className="relative aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden group">
                  <img src={optimizeImage(img, 400)} loading="lazy" alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiTrash2 size={18} />
                  </button>
                </div>
              ))}
              {(!editado.imagenes || editado.imagenes.length < 10) && (
                isUploadingImages ? (
                  <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                    <FiLoader size={24} className="text-black animate-spin mb-1" />
                    <span className="text-[8px] font-bold uppercase">SUBIENDO</span>
                  </div>
                ) : (
                  <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-black hover:bg-gray-50 cursor-pointer transition-all text-gray-500 hover:text-black">
                    <FiPlus size={24} />
                    <span className="text-[8px] font-bold uppercase mt-1">AÑADIR</span>
                    <input type="file" multiple onChange={handleAddImages} className="hidden" accept="image/*" disabled={isUploadingImages} />
                  </label>
                )
              )}
            </div>
            {fileError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 ${styles.alertNeutral}`}>
                <FiAlertTriangle size={18} /> {fileError}
              </motion.div>
            )}
          </section>

          <div><label className={styles.label}>Nombre del Producto</label><input name="nombre" value={editado.nombre} onChange={handleChange} className={styles.input} required /></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div><label className={styles.label}>Marca</label><input name="marca" value={editado.marca} onChange={handleChange} className={styles.input} /></div>
              <div>
                <label className={styles.label}>Categoría</label>
                <select name="categoria" value={editado.categoria} onChange={handleChange} className={styles.input} required>
                  <option value="">SELECCIONAR...</option>
                  {categorias?.map(c => (
                    <option key={c.categoryId} value={c.categoryName}>{c.categoryName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label}>Subcategoría</label>
                <input
                  type="text"
                  name="proveedor"
                  value={editado.proveedor || ''}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="EJ: GRAMMAR, VOCABULARY..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className={styles.label}>Precio al Público ($)</label>
                <input
                  type="number"
                  value={editado.variantes?.[0]?.precioAlPublico !== undefined ? editado.variantes[0].precioAlPublico : (editado.precioVenta || '')}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    if (editado.variantes && editado.variantes.length > 0) {
                      handleExistingVariantChange(0, 'precioAlPublico', val);
                    }
                    setEditado(prev => ({ ...prev, precioVenta: val, precioAlPublico: val }));
                  }}
                  className={styles.input}
                  min="0"
                />
              </div>
            </div>

          </div>

          <div className="grid grid-cols-2 gap-6 mt-6">
            <div>
              <label className={styles.label}>Stock Disponible</label>
              <input
                type="number"
                value={editado.variantes && editado.variantes.length > 0 ? editado.variantes[0].stock : (editado.cantidad ?? editado.stock ?? '')}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : Number(e.target.value);
                  if (editado.variantes && editado.variantes.length > 0) {
                    handleExistingVariantChange(0, 'stock', val);
                  }
                  setEditado(prev => ({ ...prev, cantidad: val, stock: val }));
                }}
                className={styles.input}
                min="0"
              />
            </div>
            <div><label className={styles.label}>Alerta de Stock Mínimo</label><input name="alerta" type="number" value={editado.alerta} onChange={handleChange} className={styles.input} /></div>
          </div>

          <div>
            <label className={styles.label}>Especificaciones / Beneficios / Temario</label>
            <div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-2 no-scrollbar">
                {editado.descripcion && editado.descripcion.split('\n').filter(item => item.trim() !== '').map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200 group">
                        <FiCheckCircle className="text-green-500 mt-0.5 shrink-0" size={16} />
                        <span className="flex-1 text-sm font-medium text-gray-700">{item}</span>
                        <button type="button" onClick={() => {
                            const newDesc = editado.descripcion.split('\n').filter((_, i) => i !== idx).join('\n');
                            setEditado(prev => ({...prev, descripcion: newDesc}));
                        }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><FiX size={18} /></button>
                    </div>
                ))}
                {(!editado.descripcion || editado.descripcion.trim() === '') && (
                    <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-xl border border-dashed text-center">No hay ítems añadidos. Escribe uno abajo y presiona Enter.</p>
                )}
            </div>
            <div className="flex gap-2 relative">
                <input type="text" id="newDescItemInv" placeholder="Ej: Acceso de por vida a los materiales..." className={styles.input} onKeyDown={(e) => {
                    if(e.key === 'Enter') {
                        e.preventDefault();
                        if(e.target.value.trim()) {
                            const currentDesc = editado.descripcion ? editado.descripcion + '\n' : '';
                            setEditado(prev => ({...prev, descripcion: currentDesc + e.target.value.trim()}));
                            e.target.value = '';
                        }
                    }
                }}/>
                <button type="button" onClick={() => {
                    const input = document.getElementById('newDescItemInv');
                    if(input.value.trim()) {
                        const currentDesc = editado.descripcion ? editado.descripcion + '\n' : '';
                        setEditado(prev => ({...prev, descripcion: currentDesc + input.value.trim()}));
                        input.value = '';
                    }
                }} className="bg-black text-white px-5 rounded-xl hover:bg-gray-800 transition-colors shadow-sm">
                    <FiPlus size={20} />
                </button>
            </div>
          </div>

          <div className="pt-6 flex gap-4 border-t border-gray-200">
            <button type="button" onClick={onClose} className={`flex-1 ${styles.btnSecondary} justify-center`}>DESCARTAR</button>
            <button type="submit" className={`flex-1 ${styles.btnPrimary} justify-center`}>
              <FiSave size={18} /> GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
};



// --- COMPONENTE PRINCIPAL ---
const InventarioProductos = () => {
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [pronunciationActivities, setPronunciationActivities] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productoAEditar, setProductoAEditar] = useState(null);

  const handleEliminarProducto = async (id) => {
    try {
      const confirm = await Swal.fire({
        title: '¿ELIMINAR PRODUCTO?',
        text: "Esta acción es irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000000',
        cancelButtonColor: '#f3f4f6',
        confirmButtonText: 'SÍ, ELIMINAR',
        cancelButtonText: 'CANCELAR',
        customClass: {
          confirmButton: 'text-white font-bold uppercase text-xs rounded-xl px-4 py-3',
          cancelButton: 'text-black font-bold uppercase text-xs rounded-xl px-4 py-3 border border-gray-300'
        }
      });

      if (!confirm.isConfirmed) return;

      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);

      if (response.status === 204) {
        setProductos(productos.filter(p => p.id !== id));
        Swal.fire({ title: 'ÉXITO', text: 'Producto eliminado correctamente.', icon: 'success', confirmButtonColor: '#000000' });
      }
    } catch (err) {
      console.error("Error al eliminar:", err);

      if (err.response?.data?.code === 'REQUIRE_ADMIN_PASS' || err.response?.status === 403) {
        const { value: pass } = await Swal.fire({
          title: 'SEGURIDAD',
          text: 'Este producto tiene stock. Ingrese contraseña maestra para forzar eliminación:',
          input: 'password',
          inputPlaceholder: 'CONTRASEÑA...',
          showCancelButton: true,
          confirmButtonColor: '#000000',
          cancelButtonColor: '#f3f4f6'
        });

        if (pass) {
          try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`, {
              data: { adminPassword: pass }
            });
            setProductos(productos.filter(p => p.id !== id));
            Swal.fire({ title: 'ELIMINADO', icon: 'success', confirmButtonColor: '#000000' });
          } catch (e) {
            Swal.fire({ title: 'ERROR', text: 'Contraseña incorrecta o fallo de sistema.', icon: 'error', confirmButtonColor: '#000000' });
          }
        }
      } else {
        Swal.fire({ title: 'ERROR', text: 'No se pudo eliminar el item.', icon: 'error', confirmButtonColor: '#000000' });
      }
    }
  };

  const obtenerProductos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/products`);
      setProductos(response.data);
      setError(null);
    } catch (err) {
      setError("ERROR DE CONEXIÓN");
    } finally {
      setLoading(false);
    }
  };

  const obtenerProveedores = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/providers`);
      setProveedores(res.data);
    } catch (err) {
      console.error("Error al cargar proveedores", err);
    }
  };

  const obtenerCategorias = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories`);
      setCategorias(res.data);
    } catch (err) {
      console.error("Error al cargar categorías", err);
    }
  };

  const obtenerPronunciationActivities = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pronunciation/activities`);
      setPronunciationActivities(res.data);
    } catch (err) {
      console.error("Error al cargar pronunciation activities", err);
    }
  };

  useEffect(() => { obtenerProductos(); obtenerProveedores(); obtenerCategorias(); obtenerPronunciationActivities(); }, []);

  const handleGuardarEdicion = async (datos) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/products/${datos.id}`, datos);
      setProductos(productos.map(p => p.id === datos.id ? datos : p));
      setProductoAEditar(null);
      if (selectedProduct) setSelectedProduct(datos);
    } catch (err) {
      alert("FALLO EN ACTUALIZACIÓN");
    }
  };

  const productosFiltrados = useMemo(() => {
    const searchTerms = busqueda.toLowerCase().split(' ').filter(term => term.trim() !== '');

    if (searchTerms.length === 0) return productos;

    return productos.filter(p => {
      const productText = [
        p.nombre, p.marca, p.categoria
      ].join(' ').toLowerCase();
      return searchTerms.every(term => productText.includes(term));
    });
  }, [productos, busqueda]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white" style={{ fontFamily: '"Inter", sans-serif' }}>
      <FiLoader className="animate-spin text-black mb-6" size={40} />
      <span className="font-bold text-[10px] text-gray-500 tracking-widest uppercase">CARGANDO INVENTARIO...</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8 lg:p-12" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* HEADER CONTROL */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
        <div>
          <h2 className={styles.title}>INVENTARIO</h2>
          <p className={styles.subtitle}>SISTEMA ONLINE / {productos.length} PRODUCTOS</p>
        </div>

        <div className="relative w-full max-w-xl group">
          <input
            type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className={styles.searchInput}
            placeholder="BUSCAR PRODUCTOS..."
          />
          <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-black transition-colors" size={20} />
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`mb-8 ${styles.alertNeutral} border-red-200 bg-red-50 text-red-600`}>
          <FiAlertTriangle size={18} /> {error}
        </motion.div>
      )}

      {/* LISTA DE PRODUCTOS */}
      <div className="space-y-4">
        {productosFiltrados.map(producto => {
          const totalStock = producto.variantes?.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) || producto.cantidad || 0;
          const precioPublico = producto.variantes?.[0]?.precioAlPublico || producto.precioVenta || 0;
          const isLowStock = totalStock <= producto.alerta;

          return (
            <div
              key={producto.id}
              onClick={() => setSelectedProduct(producto)}
              className={`${styles.listItem} cursor-pointer group`}
            >
              <div className="flex items-center gap-6 w-full lg:w-1/3">
                <div className="w-16 h-16 bg-gray-50 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200">
                  {producto.imagenes?.length > 0 ? (
                    <img src={optimizeImage(producto.imagenes[0], 200)} loading="lazy" alt={producto.nombre} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><FiPackage className="text-gray-300" size={24} /></div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{producto.marca} / {producto.categoria}</span>
                  <h4 className="font-bold text-sm uppercase text-black leading-tight mt-1">{producto.nombre}</h4>
                </div>
              </div>

              <div className="hidden lg:flex flex-col items-end w-1/4">
                <span className="text-[10px] font-bold text-gray-500 uppercase">PVP</span>
                <span className="text-sm font-black text-black">${Number(precioPublico).toLocaleString()}</span>
              </div>

              <div className="hidden md:flex flex-col items-center w-1/6">
                <span className="text-[10px] font-bold text-gray-500 uppercase mb-1">STOCK</span>
                <div className={`px-3 py-1 text-xs font-bold rounded-lg border ${isLowStock ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-black border-gray-200'}`}>
                  {totalStock}
                </div>
              </div>

              <div className="flex justify-end items-center gap-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedProduct(producto)} className="p-3 bg-gray-50 border border-gray-200 hover:border-black hover:text-black rounded-xl transition-all text-gray-500" title="Ver Detalles"><FiInfo size={16} /></button>
                <button onClick={() => setProductoAEditar(producto)} className="p-3 bg-gray-50 border border-gray-200 hover:border-black hover:text-black rounded-xl transition-all text-gray-500" title="Editar"><FiEdit2 size={16} /></button>
                <button onClick={() => handleEliminarProducto(producto.id)} className="p-3 bg-gray-50 border border-gray-200 hover:border-red-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-gray-500" title="Eliminar"><FiTrash2 size={16} /></button>
              </div>
            </div>
          );
        })}
        {productosFiltrados.length === 0 && (
          <div className={`${styles.card} flex flex-col items-center justify-center py-12`}>
            <FiSearch size={40} className="text-gray-300 mb-4" />
            <p className="font-bold text-sm uppercase text-gray-500">NO SE ENCONTRARON PRODUCTOS</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedProduct && <ProductInfoModal productData={selectedProduct} onClose={() => setSelectedProduct(null)} />}
        {productoAEditar && <FormularioEditarModal producto={productoAEditar} proveedores={proveedores} categorias={categorias} pronunciationActivities={pronunciationActivities} fetchPronunciationActivities={obtenerPronunciationActivities} onClose={() => setProductoAEditar(null)} onSave={handleGuardarEdicion} />}
      </AnimatePresence>

    </div>
  );
};

export default InventarioProductos;