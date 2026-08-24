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
  const [subcategorias, setSubcategorias] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [editado, setEditado] = useState({
    ...producto,
    variantes: (producto.variantes || []).map(v => ({
      ...v,
      color: (v.color || '').includes('http') || (v.color || '').length > 30 ? 'Unico' : (v.color || 'Unico'),
      almacenamiento: (v.almacenamiento || '').includes('http') || (v.almacenamiento || '').length > 30 ? 'Digital' : (v.almacenamiento || 'Unico')
    })),
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
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskInstruction, setNewTaskInstruction] = useState('');
  const [newTaskExpectedText, setNewTaskExpectedText] = useState('');
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activityTab, setActivityTab] = useState('select'); // 'select' o 'create'
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [newBenefitText, setNewBenefitText] = useState('');

  useEffect(() => {
    if (fetchPronunciationActivities) {
      fetchPronunciationActivities();
    }
  }, []);

  useEffect(() => {
    const fetchSubcategoriesList = async (categoryId) => {
        if (!categoryId) {
            setSubcategorias([]);
            return;
        }
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subcategories?categoryId=${categoryId}`);
            if (Array.isArray(res.data)) setSubcategorias(res.data);
        } catch (error) {
            console.error("ERROR_FETCH_SUBCATEGORIES", error);
        }
    };
    const cat = categorias?.find(c => c.categoryName === editado.categoria);
    if (cat) {
        fetchSubcategoriesList(cat.categoryId);
    } else {
        setSubcategorias([]);
    }
  }, [editado.categoria, categorias]);

  const handleAddBenefit = (e) => {
    if (e) e.preventDefault();
    const val = newBenefitText.trim();
    if (!val) return;
    setEditado(prev => {
      const currentLines = prev.descripcion ? prev.descripcion.split('\n').filter(item => item.trim() !== '') : [];
      return { ...prev, descripcion: [...currentLines, val].join('\n') };
    });
    setNewBenefitText('');
  };

  const handleEditBenefit = (indexToEdit, newValue) => {
    setEditado(prev => {
      const currentLines = prev.descripcion ? prev.descripcion.split('\n').filter(item => item.trim() !== '') : [];
      currentLines[indexToEdit] = newValue;
      return { ...prev, descripcion: currentLines.join('\n') };
    });
  };

  const handleRemoveBenefit = (indexToRemove) => {
    setEditado(prev => {
      const currentLines = prev.descripcion ? prev.descripcion.split('\n').filter(item => item.trim() !== '') : [];
      const updated = currentLines.filter((_, i) => i !== indexToRemove);
      return { ...prev, descripcion: updated.join('\n') };
    });
  };

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
      Swal.fire({ title: 'ERROR', text: error.message || "Error al subir archivos a la nube.", icon: 'error', confirmButtonColor: '#000000' });
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
      Swal.fire({ title: 'ERROR', text: error.message || "Error al subir imágenes a la nube.", icon: 'error', confirmButtonColor: '#000000' });
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
      const current = (prev.speakingActivities || []).map(Number);
      const targetId = Number(activityId);
      if (current.includes(targetId)) {
        return { ...prev, speakingActivities: current.filter(id => id !== targetId) };
      } else {
        return { ...prev, speakingActivities: [...current, targetId] };
      }
    });
  };

  const handleCreateActivity = async () => {
    if (!newActivityTitle.trim()) return;
    setIsCreatingActivity(true);
    try {
      const resActivity = await axios.post(`${import.meta.env.VITE_API_URL}/api/pronunciation/activities`, {
        title: newActivityTitle.trim(),
        description: 'Actividad creada desde el inventario de productos.',
        assigned_date: new Date().toISOString().split('T')[0]
      });

      const activityId = resActivity.data.id;

      if (newTaskExpectedText.trim()) {
        const sentencesArray = newTaskExpectedText
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 0);

        if (sentencesArray.length > 0) {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/pronunciation/tasks`, {
            title: newTaskTitle.trim() || 'Tarea 1',
            instruction: newTaskInstruction.trim() || 'Pronuncia en voz alta las siguientes oraciones',
            expected_text: sentencesArray,
            activity_id: activityId
          });
        }
      }

      if (fetchPronunciationActivities) {
        await fetchPronunciationActivities();
      }

      setEditado(prev => ({
        ...prev,
        speakingActivities: [...(prev.speakingActivities || []), activityId]
      }));

      setNewActivityTitle('');
      setNewTaskTitle('');
      setNewTaskInstruction('');
      setNewTaskExpectedText('');

      Swal.fire({ title: 'ÉXITO', text: '¡Actividad y tareas/oraciones de pronunciación creadas y seleccionadas!', icon: 'success', confirmButtonColor: '#000000' });
      setActivityTab('select');
    } catch (error) {
      console.error("Error creating activity:", error);
      Swal.fire({ title: 'ERROR', text: 'Error al crear la actividad o tareas.', icon: 'error', confirmButtonColor: '#000000' });
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
        Swal.fire({ title: 'ERROR', text: 'Error al renombrar la actividad.', icon: 'error', confirmButtonColor: '#000000' });
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

  const STEPS = [
    { label: 'Info', icon: '📋' },
    { label: 'Precio', icon: '💰' },
    { label: 'Portada', icon: '🖼️' },
    { label: 'Temario', icon: '✅' },
    { label: 'Speaking', icon: '🎤' },
  ];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm font-['Inter'] p-0 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.97, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.97, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-3xl h-[100dvh] sm:h-[92vh] sm:max-h-[860px] overflow-hidden flex flex-col bg-white sm:rounded-3xl shadow-2xl"
      >
        {managingActivity && (
          <ActivityManagerModal
            activity={managingActivity}
            onClose={() => setManagingActivity(null)}
            onUpdate={fetchPronunciationActivities}
          />
        )}

        {/* ── HEADER ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
              <FiEdit2 size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black uppercase tracking-widest text-black leading-none">Editor de Producto</h2>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5 truncate max-w-[180px] sm:max-w-xs">{editado.nombre || 'Sin nombre'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all flex-shrink-0">
            <FiX size={18} />
          </button>
        </div>

        {/* ── STEPPER ── */}
        <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${
                    isActive ? 'bg-black text-white shadow-lg scale-110' :
                    isDone ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-400 group-hover:bg-gray-300'
                  }`}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-wider hidden sm:block transition-all ${
                    isActive ? 'text-black' : isDone ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
            Paso {currentStep + 1} de {STEPS.length} — <span className="font-bold text-gray-600">{STEPS[currentStep].label}</span>
          </p>
        </div>

        {/* ── BODY ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6">
            <AnimatePresence mode="wait">

              {/* ════════════════════════════════════════════════════ */}
              {/* PASO 1 — INFORMACIÓN BÁSICA                          */}
              {/* ════════════════════════════════════════════════════ */}
              {currentStep === 0 && (
                <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                  <div className="mb-2">
                    <h3 className="text-base font-black text-black">Información Básica</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Nombre, categoría y clasificación del producto.</p>
                  </div>
                  <div>
                    <label className={styles.label}>Nombre del Producto *</label>
                    <input name="nombre" value={editado.nombre} onChange={handleChange} className={styles.input} required placeholder="Ej: Reading Book - Level 1..." />
                  </div>
                  <div>
                    <label className={styles.label}>Marca / Autor</label>
                    <input name="marca" value={editado.marca || ''} onChange={handleChange} className={styles.input} placeholder="Ej: Cambridge, Oxford..." />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={styles.label}>Categoría *</label>
                      <select name="categoria" value={editado.categoria} onChange={handleChange} className={styles.input} required>
                        <option value="">Seleccionar...</option>
                        {categorias?.map(c => <option key={c.categoryId} value={c.categoryName}>{c.categoryName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={styles.label}>Pack / Subcategoría</label>
                      <select name="subcategoria" value={editado.subcategoria || ''} onChange={handleChange} className={styles.input} disabled={!editado.categoria}>
                        <option value="">Ninguna...</option>
                        {subcategorias?.map(s => <option key={s.subcategoryId} value={s.subcategoryName}>{s.subcategoryName}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════ */}
              {/* PASO 2 — PRECIO & STOCK                             */}
              {/* ════════════════════════════════════════════════════ */}
              {currentStep === 1 && (
                <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-5">
                  <div className="mb-2">
                    <h3 className="text-base font-black text-black">Precio & Stock</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Define el precio público, stock disponible y la alerta mínima.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={styles.label}>Precio al Público ($)</label>
                      <input
                        type="number"
                        value={editado.variantes?.[0]?.precioAlPublico !== undefined ? editado.variantes[0].precioAlPublico : (editado.precioVenta || '')}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          if (editado.variantes && editado.variantes.length > 0) handleExistingVariantChange(0, 'precioAlPublico', val);
                          setEditado(prev => ({ ...prev, precioVenta: val, precioAlPublico: val }));
                        }}
                        className={styles.input} min="0" placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Stock Disponible</label>
                      <input
                        type="number"
                        value={editado.variantes && editado.variantes.length > 0 ? editado.variantes[0].stock : (editado.cantidad ?? editado.stock ?? '')}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : Number(e.target.value);
                          if (editado.variantes && editado.variantes.length > 0) handleExistingVariantChange(0, 'stock', val);
                          setEditado(prev => ({ ...prev, cantidad: val, stock: val }));
                        }}
                        className={styles.input} min="0" placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={styles.label}>Alerta Mínima de Stock</label>
                      <input name="alerta" type="number" value={editado.alerta || ''} onChange={handleChange} className={styles.input} placeholder="Ej: 5" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Resumen de Precio</p>
                    <p className="text-2xl font-black text-black">
                      ${Number(editado.variantes?.[0]?.precioAlPublico || editado.precioVenta || 0).toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Stock actual: <span className="font-bold text-black">{editado.variantes?.[0]?.stock ?? editado.cantidad ?? 0}</span> unidades</p>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════ */}
              {/* PASO 3 — PORTADA & ARCHIVOS                         */}
              {/* ════════════════════════════════════════════════════ */}
              {currentStep === 2 && (
                <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-6">
                  <div>
                    <h3 className="text-base font-black text-black">Portada & Archivos del Curso</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Imágenes de portada y archivos descargables (PDFs, videos, módulos).</p>
                  </div>

                  {/* Galería */}
                  <div>
                    <label className={styles.label}>Imágenes de Portada ({editado.imagenes?.length || 0}/10)</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {editado.imagenes?.map((img, idx) => (
                        <div key={idx} className="relative aspect-square bg-gray-100 border border-gray-200 rounded-xl overflow-hidden group">
                          <img src={optimizeImage(img, 400)} loading="lazy" alt="preview" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      ))}
                      {(!editado.imagenes || editado.imagenes.length < 10) && (
                        isUploadingImages ? (
                          <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-white">
                            <FiLoader size={18} className="text-black animate-spin" />
                          </div>
                        ) : (
                          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl hover:border-black cursor-pointer transition-all text-gray-400 hover:text-black">
                            <FiPlus size={18} />
                            <span className="text-[8px] font-bold uppercase mt-1">Añadir</span>
                            <input type="file" multiple onChange={handleAddImages} className="hidden" accept="image/*" disabled={isUploadingImages} />
                          </label>
                        )
                      )}
                    </div>
                    {fileError && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-3 ${styles.alertNeutral}`}>
                        <FiAlertTriangle size={14} /> {fileError}
                      </motion.div>
                    )}
                  </div>

                  {/* Archivos del curso */}
                  <div>
                    <label className={`${styles.label} text-purple-700`}>Contenido del Curso (PDFs, Videos, Módulos)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {editado.archivosInfoproducto?.map((archivo, idx) => (
                        <div key={idx} className="relative p-3 bg-purple-50 border border-purple-100 rounded-xl flex flex-col items-center gap-1.5 group hover:shadow-md transition-all text-center">
                          {archivo.tipo === 'video' ? <FiVideo size={24} className="text-purple-500" /> : <FiFile size={24} className="text-purple-500" />}
                          <span className="text-[10px] font-bold text-gray-700 truncate w-full" title={archivo.nombre}>{archivo.nombre || `Archivo ${idx + 1}`}</span>
                          <a href={archivo.url} target="_blank" rel="noreferrer" className="text-[9px] text-purple-400 hover:underline">Ver original</a>
                          <button type="button" onClick={() => handleRemoveCourseFile(idx)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            <FiX size={10} />
                          </button>
                        </div>
                      ))}
                      {isUploadingFiles ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-200 rounded-xl p-4 aspect-square">
                          <FiLoader size={18} className="text-purple-500 animate-spin" />
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-500 cursor-pointer transition-all text-purple-400 hover:text-purple-600 p-4 aspect-square">
                          <FiPlus size={18} />
                          <span className="text-[9px] font-bold uppercase mt-1 text-center">Añadir</span>
                          <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.mp4,.mp3,.png,.jpg,.jpeg,video/*,image/*,application/pdf" multiple onChange={handleAddCourseFiles} className="hidden" disabled={isUploadingFiles} />
                        </label>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════ */}
              {/* PASO 4 — BENEFICIOS / TEMARIO                       */}
              {/* ════════════════════════════════════════════════════ */}
              {currentStep === 3 && (
                <motion.div key="step-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-black">Beneficios / Temario</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Detalla qué aprenderá o recibirá el alumno con este producto.</p>
                  </div>
                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
                    {editado.descripcion && editado.descripcion.split('\n').filter(item => item.trim() !== '').map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 group focus-within:border-black focus-within:bg-white transition-all">
                        <FiCheckCircle className="text-green-500 shrink-0" size={14} />
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleEditBenefit(idx, e.target.value)}
                          className="flex-1 text-sm font-medium text-gray-800 bg-transparent outline-none"
                          placeholder="Texto del beneficio..."
                        />
                        <button type="button" onClick={() => handleRemoveBenefit(idx)} className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all">
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {(!editado.descripcion || editado.descripcion.trim() === '') && (
                      <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-2xl mb-2">📝</p>
                        <p className="text-xs text-gray-400 italic">No hay ítems aún. Escribe uno abajo y presiona Enter.</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBenefitText}
                      onChange={(e) => setNewBenefitText(e.target.value)}
                      placeholder="Ej: Acceso de por vida a los materiales..."
                      className={styles.input}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBenefit(e); } }}
                    />
                    <button type="button" onClick={handleAddBenefit} className="bg-black text-white px-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center flex-shrink-0">
                      <FiPlus size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════ */}
              {/* PASO 5 — SPEAKING / IA                              */}
              {/* ════════════════════════════════════════════════════ */}
              {currentStep === 4 && (
                <motion.div key="step-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-4">
                  <div>
                    <h3 className="text-base font-black text-black">Actividades de Speaking</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Asigna actividades de pronunciación al producto.</p>
                  </div>

                  {/* TABS */}
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    {[
                      { key: 'select', label: '📋 Seleccionar' },
                      { key: 'create', label: '✏️ Crear Nueva' },
                      { key: 'ai-pdf', label: '✨ IA desde PDF' },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActivityTab(tab.key)}
                        className={`flex-1 py-2 px-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all whitespace-nowrap ${
                          activityTab === tab.key ? 'bg-black text-white shadow-sm' : 'text-gray-500 hover:text-black'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activityTab === 'select' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Buscar actividad..."
                        value={activitySearchTerm}
                        onChange={(e) => setActivitySearchTerm(e.target.value)}
                        className={`${styles.input} py-2 text-xs`}
                      />
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                        {pronunciationActivities && pronunciationActivities
                          .filter(act => (act.title || '').toLowerCase().includes(activitySearchTerm.toLowerCase()))
                          .map(act => (
                            <div key={act.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => handleToggleSpeakingActivity(act.id)}>
                              <input type="checkbox" checked={(editado.speakingActivities || []).map(Number).includes(Number(act.id))} onChange={() => {}} className="w-4 h-4 accent-black cursor-pointer flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-black truncate block">{act.title}</span>
                                <span className="text-[10px] text-gray-400">{act.PronunciationTasks?.length || 0} tareas</span>
                              </div>
                              <div className="flex gap-1 flex-shrink-0">
                                <button type="button" onClick={(e) => handleEditActivityTitle(e, act)} className="bg-white hover:bg-gray-100 text-gray-500 rounded-lg p-2 transition-colors border border-gray-200"><FiEdit2 size={12} /></button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); setManagingActivity(act); }} className="bg-white hover:bg-gray-100 text-gray-500 rounded-lg px-3 py-2 transition-colors text-[10px] font-bold uppercase border border-gray-200">Tareas</button>
                              </div>
                            </div>
                          ))}
                        {(!pronunciationActivities || pronunciationActivities.filter(act => (act.title || '').toLowerCase().includes(activitySearchTerm.toLowerCase())).length === 0) && (
                          <p className="text-gray-400 text-xs italic text-center py-6">No se encontraron actividades.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activityTab === 'create' && (
                    <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Título de la Actividad *</label>
                          <input type="text" value={newActivityTitle} onChange={e => setNewActivityTitle(e.target.value)} placeholder="Ej: Módulo 1" className={styles.input} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Nombre de la Tarea</label>
                          <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Ej: Tarea 1" className={styles.input} />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Instrucciones para el Alumno</label>
                        <input type="text" value={newTaskInstruction} onChange={e => setNewTaskInstruction(e.target.value)} placeholder="Ej: Pronuncia las oraciones..." className={styles.input} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Frases a Pronunciar (una por línea) *</label>
                        <textarea rows="4" value={newTaskExpectedText} onChange={e => setNewTaskExpectedText(e.target.value)} placeholder={`Hello, my name is Alex.\nI am glad to meet you.`} className={`${styles.input} resize-none font-mono text-xs`} />
                        <p className="text-[10px] text-gray-400 italic mt-1">Cada línea = una oración individual del speaking.</p>
                      </div>
                      <button type="button" onClick={handleCreateActivity} disabled={isCreatingActivity || !newActivityTitle.trim()} className="w-full bg-black text-white font-bold uppercase text-xs rounded-xl py-3.5 flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-gray-800 transition-all">
                        {isCreatingActivity ? 'Creando...' : <><FiPlus size={14} /> Crear y Asignar</>}
                      </button>
                    </div>
                  )}

                  {activityTab === 'ai-pdf' && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <div className="w-full border-2 border-dashed border-blue-200 rounded-xl p-8 flex flex-col items-center justify-center relative hover:border-blue-400 hover:bg-blue-50 transition-colors">
                        {isCreatingActivity ? (
                          <div className="flex flex-col items-center text-center w-full max-w-xs mx-auto">
                            <FiRefreshCcw size={28} className="text-blue-500 animate-spin mb-3" />
                            <p className="font-bold text-[10px] uppercase tracking-widest text-blue-600 mb-3">Analizando PDF con IA...</p>
                            <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                            </div>
                            <span className="text-[10px] text-blue-400 font-bold mt-2">{Math.round(loadingProgress)}%</span>
                          </div>
                        ) : (
                          <>
                            <FiFileText size={28} className="text-blue-300 mb-3" />
                            <p className="font-bold text-[10px] uppercase tracking-widest text-blue-400 mb-1">Subir PDF para generar actividades</p>
                            <p className="text-[10px] text-gray-400 text-center">La IA extraerá frases clave para crear tareas de pronunciación.</p>
                            <input type="file" accept="application/pdf,.pdf" onChange={handleGenerateFromPDF} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isCreatingActivity} />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </form>

        {/* ── FOOTER ── */}
        <div className="flex-shrink-0 flex gap-3 px-5 py-4 border-t border-gray-100 bg-white">
          {currentStep > 0 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => s - 1)}
              className="flex-1 py-3.5 bg-gray-100 text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              ← Anterior
            </button>
          ) : (
            <button type="button" onClick={onClose} className="flex-1 py-3.5 bg-gray-100 text-black font-bold uppercase text-xs rounded-xl hover:bg-gray-200 transition-all">
              Descartar
            </button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => s + 1)}
              className="flex-1 py-3.5 bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3.5 bg-black text-white font-bold uppercase text-xs rounded-xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
            >
              <FiSave size={14} /> Guardar Cambios
            </button>
          )}
        </div>
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
      const datosLimpios = { ...datos };
      if (datosLimpios.variantes && datosLimpios.variantes.length > 0) {
        datosLimpios.variantes = datosLimpios.variantes.map(v => ({
          ...v,
          color: (v.color || '').includes('http') || (v.color || '').length > 30 ? 'Unico' : (v.color || 'Unico'),
          almacenamiento: (v.almacenamiento || '').includes('http') || (v.almacenamiento || '').length > 30 ? 'Digital' : (v.almacenamiento || 'Unico')
        }));
      }

      await axios.put(`${import.meta.env.VITE_API_URL}/products/${datosLimpios.id}`, datosLimpios);
      setProductos(productos.map(p => p.id === datosLimpios.id ? datosLimpios : p));
      setProductoAEditar(null);
      if (selectedProduct) setSelectedProduct(datosLimpios);
    } catch (err) {
      Swal.fire({ title: 'ERROR', text: 'Fallo al guardar los cambios del producto.', icon: 'error', confirmButtonColor: '#000000' });
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