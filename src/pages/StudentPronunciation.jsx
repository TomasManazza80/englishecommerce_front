import React, { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiFolder } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Add } from '../store/redux/cart/CartAction';
import Swal from 'sweetalert2';
import StickmanCompanion from '../components/StickmanCompanion';
import EditableText from '../components/EditableText/EditableText';
import authContext from '../store/store';
import { jwtDecode } from 'jwt-decode';

const StickmanWithBubble = ({ mood, context, layoutId, className, bubblePosition = 'left', customTransition }) => {
    const getBubbleStyles = () => {
        if (bubblePosition === 'right') return {
            bubble: "absolute -top-24 left-16 w-56",
        };
        if (bubblePosition === 'none') return {
            bubble: "relative w-56",
        };
        // default left
        return {
            bubble: "absolute -top-24 -left-32 w-56",
        };
    };

    const styles = getBubbleStyles();

    return (
        <motion.div 
            layoutId={layoutId}
            className={`absolute z-20 pointer-events-none hidden lg:block ${className}`}
            transition={customTransition || { type: "spring", stiffness: 50, damping: 15 }}
        >
            <AnimatePresence>
                {context && context.message && (
                    <motion.div 
                        className={`${styles.bubble} bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_0_8px_20px_rgba(0,0,0,0.15)] rounded-2xl p-4 text-sm font-bold text-center text-gray-800`}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        {context.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const StudentPronunciation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token } = useContext(authContext);
    const courseActivities = location.state?.speakingActivities || null;
    const courseName = location.state?.courseName || null;

    // Derive userEmail from JWT token
    let userEmail = null;
    try {
        if (token) userEmail = jwtDecode(token).email;
    } catch (_) {}

    const [activities, setActivities] = useState([]);
    const [latestActivity, setLatestActivity] = useState(null);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [selectedPackPreview, setSelectedPackPreview] = useState(null);
    const [accessMap, setAccessMap] = useState({}); // { [activityId]: { hasAccess, accessType, attemptsLeft } }
    
    const [selectedTask, setSelectedTask] = useState(null);
    const [recordingSentenceIndex, setRecordingSentenceIndex] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [loadingResult, setLoadingResult] = useState(false);
    const [listenedSentences, setListenedSentences] = useState({});
    
    // Mascot state
    const [mascotMood, setMascotMood] = useState('waving'); // 'idle', 'happy', 'sad'
    const [activeStickmanLocation, setActiveStickmanLocation] = useState('header');
    const [companionContext, setCompanionContext] = useState({ message: "¡Hola! Selecciona un pack de práctica para comenzar.", animation: "waving" });
    
    const [results, setResults] = useState({});
    const [errorMsg, setErrorMsg] = useState('');
    const [liveTranscript, setLiveTranscript] = useState('');
    
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const selectedTaskRef = useRef(null);
    const sentenceIndexRef = useRef(null);
    const transcriptRef = useRef('');
    const hasSpeechErrorRef = useRef(false);
    const [voices, setVoices] = useState([]);

    const [scrollPosition, setScrollPosition] = useState(0);
    const [taskScrollY, setTaskScrollY] = useState(0);

    const [selectedCategory, setSelectedCategory] = useState(null);

    // Pagination & Stats State
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [activitySteps, setActivitySteps] = useState([]);
    const [activityStartTime, setActivityStartTime] = useState(null);
    const [isActivityFinished, setIsActivityFinished] = useState(false);
    const [activityStats, setActivityStats] = useState(null);

    const handleSelectActivity = (activity) => {
        setSelectedActivity(activity);
        if (activity) {
            const steps = [];
            activity.PronunciationTasks?.forEach((task, tIndex) => {
                const sentences = Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text];
                sentences.forEach((sentence, sIndex) => {
                    steps.push({ task, taskIndex: tIndex, sentence, sentenceIndex: sIndex });
                });
            });
            setActivitySteps(steps);
            setCurrentStepIndex(0);
            setActivityStartTime(Date.now());
            setIsActivityFinished(false);
            setActivityStats(null);
            setResults({});
            setListenedSentences({});

            setTaskScrollY(window.scrollY);
            setActiveStickmanLocation('tutorial-start');
            setMascotMood('waving');
            setCompanionContext(null); // No bubble while dropping
            
            setTimeout(() => {
                setActiveStickmanLocation('tutorial-end');
                setMascotMood('moonwalking_in_place');
                
                setTimeout(() => {
                    setMascotMood('pointing');
                    setCompanionContext({ message: "¡Toca aquí para empezar!", animation: "pointing" });
                }, 2500);
            }, 500);
        } else {
            setMascotMood('waving');
            setActiveStickmanLocation('header');
            setCompanionContext({ message: "¡Hola! Selecciona un pack de práctica para comenzar.", animation: "waving" });
        }
    };

    const fetchActivities = async () => {
        try {
            let fetchedData = [];
            const res = await axios.get(`${API_URL}/api/pronunciation/activities`);
            fetchedData = res.data;
            
            if (courseActivities && Array.isArray(courseActivities)) {
                fetchedData = fetchedData.filter(a => courseActivities.includes(a.id));
            }
            
            setActivities(fetchedData);
            
            if (selectedActivity) {
                const updatedActivity = fetchedData.find(a => a.id === selectedActivity.id);
                setSelectedActivity(updatedActivity || null);
            }

            // Fetch access status for all paid packs
            const paidPacks = fetchedData.filter(a => a.price > 0);
            if (paidPacks.length > 0) {
                const accessResults = await Promise.all(
                    paidPacks.map(a =>
                        axios.get(`${API_URL}/api/pronunciation/activities/${a.id}/access`, {
                            params: { user_email: userEmail }
                        }).then(r => ({ id: a.id, ...r.data })).catch(() => ({ id: a.id, hasAccess: true, accessType: 'trial', attemptsLeft: 2 }))
                    )
                );
                const map = {};
                accessResults.forEach(r => { map[r.id] = r; });
                setAccessMap(map);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLatestActivity = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/pronunciation/activities`);
            let data = res.data;
            if (courseActivities && Array.isArray(courseActivities)) {
                data = data.filter(a => courseActivities.includes(a.id));
            }
            if (data && data.length > 0) {
                const sorted = data.sort((a, b) => new Date(b.createdAt || b.assigned_date) - new Date(a.createdAt || a.assigned_date));
                setLatestActivity(sorted[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleNextStep = async () => {
        if (currentStepIndex < activitySteps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            setMascotMood('idle');
            setCompanionContext(null);
        } else {
            const totalTime = Date.now() - activityStartTime;
            let totalScore = 0;
            let count = 0;
            Object.values(results).forEach(taskRes => {
                Object.values(taskRes).forEach(senRes => {
                    totalScore += senRes.evaluation.score;
                    count++;
                });
            });
            const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
            
            setActivityStats({ time: totalTime, average: avgScore });
            setIsActivityFinished(true);
            setActiveStickmanLocation('floating');
            setMascotMood('dancing');
            setCompanionContext({ message: "¡Excelente! Has terminado la actividad.", animation: "dancing" });

            try {
                await axios.post(`${API_URL}/api/pronunciation/activity-complete`, {
                    activity_id: selectedActivity.id,
                    average_score: avgScore,
                    time_spent: Math.round(totalTime / 1000)
                });
            } catch(e) {
                console.error("Failed to save activity score", e);
            }
        }
    };

    useEffect(() => {
        fetchActivities();
        fetchLatestActivity();
        
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };
        if ('speechSynthesis' in window) {
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        const handleScroll = () => setScrollPosition(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';
            
            recognitionRef.current.onresult = (event) => {
                let currentTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    currentTranscript += event.results[i][0].transcript + ' ';
                }
                const cleanedTranscript = currentTranscript.trim();
                transcriptRef.current = cleanedTranscript;
                setLiveTranscript(cleanedTranscript);
            };
            
            recognitionRef.current.onerror = (event) => {
                hasSpeechErrorRef.current = true;
                // Silently ignore web speech errors since we rely on MediaRecorder now
            };

            recognitionRef.current.onend = () => {
                // Do not evaluate here anymore, MediaRecorder will handle it
                setLiveTranscript('');
            };
        } else {
            setErrorMsg("Tu navegador no soporta la Web Speech API. Por favor, usa Google Chrome o Edge actualizado.");
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // Run once on mount

    useEffect(() => {
        if (isRecording || loadingResult || ['happy', 'sad', 'dancing', 'moonwalking'].includes(mascotMood)) return;

        const isScrolledDown = scrollPosition > 350;

        if (activeStickmanLocation && (activeStickmanLocation.includes('-') || activeStickmanLocation.startsWith('tutorial'))) {
            // Stay attached to the task! Do not float.
        } else {
            // Not attached to task
            if (isScrolledDown && activeStickmanLocation !== 'floating') {
                setActiveStickmanLocation('floating');
                setMascotMood('slide_in_right');
                setCompanionContext({ message: "¡Aquí estoy! Busca los micrófonos para practicar.", animation: "waving" });
                setTimeout(() => {
                    setMascotMood(prev => prev === 'slide_in_right' ? 'waving' : prev);
                }, 1200);
            } else if (!isScrolledDown && !activeStickmanLocation?.startsWith(selectedActivity ? 'tutorial' : 'header')) {
                const target = selectedActivity ? 'tutorial-end' : 'header';
                setActiveStickmanLocation(target);
                if (target === 'header') {
                    setMascotMood('waving');
                    setCompanionContext({ 
                        message: "¡Hola! Selecciona un día en el calendario para ver tus ejercicios.", 
                        animation: "waving" 
                    });
                }
            }
        }
    }, [scrollPosition, isRecording, loadingResult, mascotMood, selectedActivity, activeStickmanLocation, taskScrollY]);

    const startRecording = async (task, sentenceIndex) => {
        setTaskScrollY(window.scrollY);
        setSelectedTask(task);
        selectedTaskRef.current = task;
        setRecordingSentenceIndex(sentenceIndex);
        sentenceIndexRef.current = sentenceIndex;
        transcriptRef.current = '';
        hasSpeechErrorRef.current = false;
        setLiveTranscript('');
        setErrorMsg('');
        setIsRecording(true);
        setCompanionContext(null); // Reset context
        
        // Fetch contextual message
        const sentencesArray = Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text];
        const sentence = sentencesArray[sentenceIndex];
        axios.post(`${API_URL}/api/pronunciation/companion-context`, { text: sentence })
            .then(res => {
                setCompanionContext(res.data);
                if (res.data.animation) {
                    setMascotMood(res.data.animation);
                }
            })
            .catch(err => console.error("Failed to fetch companion context", err));
        
        if (activeStickmanLocation !== `${task.id}-${sentenceIndex}`) {
            setMascotMood('walking');
            setActiveStickmanLocation(`${task.id}-${sentenceIndex}`);
            // Wait for walk to finish, but don't reset to idle if AI already set a mood
            setTimeout(() => {
                setMascotMood(prev => prev === 'walking' ? 'idle' : prev);
            }, 800); 
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result.split(',')[1];
                    evaluateSpeech(transcriptRef.current, base64Audio, mediaRecorder.mimeType || 'audio/webm', selectedTaskRef.current, sentenceIndexRef.current);
                    transcriptRef.current = ''; 
                };
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
        } catch (err) {
            console.error('MediaRecorder error:', err);
            hasSpeechErrorRef.current = true;
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMsg('❌ Permiso denegado: Por favor permite el acceso al micrófono.');
            } else {
                setErrorMsg('❌ Error al acceder al micrófono: ' + err.message);
            }
            setIsRecording(false);
            setRecordingSentenceIndex(null);
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch(e){}
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current && isRecording) {
            try { recognitionRef.current.stop(); } catch(e){}
        }
        setIsRecording(false);
        setRecordingSentenceIndex(null);
    };

    const evaluateSpeech = async (transcript, audioBase64, mimeType, currentTask, sentenceIndex) => {
        setLoadingResult(true);
        try {
            const taskToEvaluate = currentTask || selectedTaskRef.current;
            if (!taskToEvaluate) throw new Error("No task selected");
            
            const hasListened = !!listenedSentences[`${taskToEvaluate.id}-${sentenceIndex}`];

            const res = await axios.post(`${API_URL}/api/pronunciation/evaluate`, {
                task_id: taskToEvaluate.id,
                transcribed_text: transcript || "",
                audio_base64: audioBase64,
                mime_type: mimeType,
                sentence_index: sentenceIndex,
                student_id: null,
                user_email: userEmail,
                has_listened: hasListened
            });
            
            setResults(prev => ({
                ...prev,
                [taskToEvaluate.id]: {
                    ...(prev[taskToEvaluate.id] || {}),
                    [sentenceIndex]: res.data
                }
            }));

            const { score, companionMessage, companionAnimation } = res.data.evaluation || {};

            if (companionMessage && companionAnimation) {
                setMascotMood(companionAnimation);
                setCompanionContext({ message: companionMessage, animation: companionAnimation });
            } else {
                if (score >= 80) setMascotMood('dancing');
                else if (score < 50) setMascotMood('sad');
                else setMascotMood('idle');
            }

            // Revert mood after 5 seconds if not interacting
            setTimeout(() => {
                setMascotMood('idle');
                setCompanionContext(null);
            }, 6000);

        } catch (error) {
            console.error("Evaluation error:", error);
            if (error.response && error.response.status === 402) {
                setErrorMsg(`🔒 ${error.response.data.message || "Debes desbloquear este Pack para continuar."}`);
                setMascotMood('sad');
                setCompanionContext({ message: "¡Oh no! Has alcanzado el límite de prueba gratuita.", animation: "sad" });
            } else {
                setErrorMsg("Ocurrió un error al evaluar tu pronunciación.");
            }
        } finally {
            setLoadingResult(false);
        }
    };

    const playWord = (word) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US';
            utterance.rate = 0.9; 
            
            const femaleVoice = voices.find(voice => 
                voice.lang.includes('en') && 
                (voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Samantha') || voice.name.includes('Victoria') || voice.name.includes('Google US English'))
            );
            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            window.speechSynthesis.speak(utterance);
        } else {
            setErrorMsg("Tu navegador no soporta la lectura en voz alta.");
        }
    };

    const handlePlaySentence = (task, index, sentence) => {
        setListenedSentences(prev => ({ ...prev, [`${task.id}-${index}`]: true }));
        playWord(sentence);
    };

    const handleBuyPack = () => {
        if (!selectedActivity || selectedActivity.price <= 0) return;
        dispatch(Add({
            ProductId: `ai-${selectedActivity.id}`,
            id: `ai-pack-${selectedActivity.id}`,
            title: selectedActivity.title,
            price: Number(selectedActivity.price),
            precioAlPublico: Number(selectedActivity.price),
            precioMayorista: Number(selectedActivity.price),
            image: "https://ik.imagekit.io/yryz026j5/pngtree-ai-artificial-intelligence-icon-png-image_6565152-removebg-preview_H_w4E1c_X.png",
            quantity: 1,
            color: "unico",
            storage: "unico",
            esInfoproducto: true
        }));
        
        Swal.fire({
            title: "¡Pack Agregado!",
            text: "El Pack de IA se ha añadido a tu carrito.",
            icon: "success",
            confirmButtonColor: "#9b59b6"
        }).then(() => {
            navigate('/cart');
        });
    };


    const renderActiveStep = () => {
        if (isActivityFinished) {
            return (
                <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_0_15px_40px_rgba(0,0,0,0.08)] p-10 rounded-[35px] text-center transition-all relative overflow-hidden">
                    <h2 className="text-4xl font-black text-[#1d1d1d] mb-4">¡Actividad Completada! 🎉</h2>
                    <p className="text-lg text-gray-600 mb-10">Has finalizado todos los ejercicios de esta actividad.</p>
                    
                    <div className="flex justify-center gap-8 mb-10">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#f0dff3] w-40">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Tiempo</p>
                            <p className="text-3xl font-black text-[#b273c2]">
                                {Math.floor(activityStats.time / 60000)}:
                                {String(Math.floor((activityStats.time % 60000) / 1000)).padStart(2, '0')}
                            </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#f0dff3] w-40">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Promedio</p>
                            <p className="text-3xl font-black text-[#b273c2]">{activityStats.average}%</p>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleSelectActivity(null)}
                        className="px-8 py-4 bg-[#b273c2] text-white rounded-full font-bold uppercase tracking-widest hover:bg-[#9c63ad] transition-all shadow-lg"
                    >
                        Volver al menú
                    </button>
                </div>
            );
        }

        if (activitySteps.length === 0) {
            return (
                <div className="text-center py-16 bg-white rounded-[30px] shadow-sm border border-[#f0dff3]">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Actividad Vacía</p>
                    <p className="text-[#1d1d1d] font-medium">Aún no hay ejercicios en esta actividad.</p>
                </div>
            );
        }

        const step = activitySteps[currentStepIndex];
        const { task, taskIndex, sentence, sentenceIndex } = step;
        const taskResults = results[task.id] || {};
        const sentenceResult = taskResults[sentenceIndex];
        const isSentenceRecording = isRecording && selectedTask?.id === task.id && recordingSentenceIndex === sentenceIndex;
        const isStickmanHere = activeStickmanLocation === `${task.id}-${sentenceIndex}`;

        return (
            <div key={`${task.id}-${sentenceIndex}`} className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_0_15px_40px_rgba(0,0,0,0.08)] p-8 md:p-10 rounded-[35px] transition-all relative">
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#f0dff3] rounded-t-[35px] overflow-hidden">
                    <div 
                        className="h-full bg-[#b273c2] transition-all duration-500 ease-out"
                        style={{ width: `${((currentStepIndex) / activitySteps.length) * 100}%` }}
                    ></div>
                </div>

                <div className="mt-4 mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-3xl font-black leading-tight uppercase">{task.title}</h3>
                        <span className="text-sm font-bold text-[#b273c2] bg-white px-3 py-1 rounded-full border border-[#f0dff3]">
                            Paso {currentStepIndex + 1} de {activitySteps.length}
                        </span>
                    </div>
                    {task.instruction && <p className="text-sm text-gray-500 font-bold tracking-widest uppercase">{task.instruction}</p>}
                </div>

                <div className="bg-[#faf5fb] border border-[#f0e2f4] rounded-[24px] p-6 group relative overflow-visible mt-6">
                    
                    <AnimatePresence>
                        {(isStickmanHere || (['tutorial-start', 'tutorial-end'].includes(activeStickmanLocation) && currentStepIndex === 0)) && (
                            <StickmanWithBubble 
                                mood={mascotMood} 
                                context={companionContext} 
                                layoutId="stickman" 
                                className={
                                    isStickmanHere ? "right-32 -top-4" : 
                                    activeStickmanLocation === 'tutorial-start' ? "bottom-2 right-4" : 
                                    "bottom-2 -left-16"
                                } 
                                bubblePosition={activeStickmanLocation === 'tutorial-start' ? "right" : "left"}
                                customTransition={activeStickmanLocation === 'tutorial-end' ? { duration: 2.5, ease: "linear" } : null}
                            />
                        )}
                    </AnimatePresence>

                    <p className="text-gray-800 font-medium text-[17px] italic mb-5 leading-relaxed flex items-start gap-3 w-10/12">
                        <span className="text-[#b273c2] opacity-50 font-black">{sentenceIndex + 1}.</span>
                        "{sentence}"
                    </p>

                    {isSentenceRecording && liveTranscript && (
                        <div className="mb-4 bg-[#f8f3f6] border border-[#f0dff3] p-3 rounded-xl">
                            <p className="text-xs font-bold text-[#b273c2] uppercase tracking-widest mb-1">Te estamos escuchando:</p>
                            <p className="text-sm text-gray-700 italic">"{liveTranscript}"</p>
                        </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-4">
                            {isSentenceRecording ? (
                                <button onClick={stopRecording} className="px-6 py-3 bg-red-500 text-white rounded-full font-bold animate-pulse flex items-center gap-2 shadow-lg hover:bg-red-600 transition-colors">
                                    <div className="w-3 h-3 bg-white rounded-full"></div> DETENER
                                </button>
                            ) : (
                                <button onClick={() => startRecording(task, sentenceIndex)} disabled={isRecording} className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md transition-all transform hover:scale-105 ${isRecording ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#b273c2] hover:bg-[#9c63ad]'}`} title="Grabar oración">
                                    🎙️
                                </button>
                            )}
                            <button onClick={() => handlePlaySentence(task, sentenceIndex, sentence)} className="w-12 h-12 rounded-full border border-[#e5d2ea] text-[#b273c2] flex items-center justify-center text-xl shadow-sm hover:bg-gray-50 transition-all" title="Escuchar pronunciación nativa">
                                🔊
                            </button>
                        </div>

                        {sentenceResult && (
                            <div className="text-right">
                                <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">Score</span>
                                <span className="text-2xl font-black text-[#b273c2]">{sentenceResult.evaluation.score}%</span>
                            </div>
                        )}
                    </div>

                    {sentenceResult && (
                        <div className="mt-5 pt-5 border-t border-[#f1e4f5]">
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Lo que la IA escuchó:</p>
                                <p className="text-sm text-gray-700 italic">"{sentenceResult.attempt.transcribed_text}"</p>
                            </div>
                            
                            {sentenceResult.evaluation.errors?.length > 0 ? (
                                <div>
                                    <p className="text-xs font-bold text-[#b273c2] uppercase tracking-widest mb-2">Sugerencias de mejora:</p>
                                    <div className="space-y-2">
                                        {sentenceResult.evaluation.errors.map((err, idx) => (
                                            <div key={idx} className={`flex items-center gap-3 bg-white p-3 rounded-xl border text-sm ${err.reason === 'added' ? 'border-orange-200' : 'border-[#f0dff3]'}`}>
                                                <span onClick={() => playWord(err.word)} className={`font-bold px-3 py-1 rounded-lg cursor-pointer transition-colors ${err.reason === 'added' ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-[#b273c2] bg-[#f8f3f6] hover:bg-[#f0e2f4]'}`}>
                                                    {err.word}
                                                </span>
                                                <span className="text-gray-600">
                                                    {err.reason === 'omitted' ? 'Palabra omitida' : err.reason === 'added' ? 'Palabra de más (no debías decirla)' : `Se escuchó como "${err.reason}"`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                                    <span>✨</span>
                                    <span className="text-sm font-bold">¡Pronunciación perfecta!</span>
                                </div>
                            )}

                            {/* Next Button */}
                            <div className="mt-8 flex justify-end">
                                <button 
                                    onClick={handleNextStep}
                                    className="px-6 py-3 bg-[#1d1d1d] text-white rounded-full font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors shadow-md flex items-center gap-2"
                                >
                                    {currentStepIndex < activitySteps.length - 1 ? 'Siguiente' : 'Finalizar'} <span className="text-lg">→</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#faf5fb] py-12 px-6 relative overflow-hidden font-sans">
            <div className="max-w-6xl mx-auto relative z-10">
                
                <div className="text-center mb-16 relative">
                    <div className="text-[#b273c2] font-black tracking-[0.2em] text-sm mb-3">
                        <EditableText textKey="pronunciation_page_badge" defaultText="AI SPEAKING PRACTICE" section="PRONUNCIATION" />
                    </div>
                    <div className="relative inline-block">
                        <h1 className="text-4xl md:text-5xl font-black leading-tight text-[#1d1d1d]">
                            <EditableText textKey="pronunciation_page_title" defaultText="EVALUACIÓN DE <span class='text-[#b273c2]'>PRONUNCIACIÓN</span>" section="PRONUNCIATION" />
                        </h1>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-[#f5f9f5] border border-[#d9f0da] text-red-700 p-6 rounded-3xl shadow-sm mb-8 flex flex-col items-center text-center">
                        <p className="font-bold text-lg mb-4">{errorMsg}</p>
                        {errorMsg.includes('desbloquear') && (
                            <button 
                                onClick={handleBuyPack}
                                className="px-8 py-4 bg-[#b273c2] text-white rounded-full font-black uppercase tracking-widest hover:bg-[#9c63ad] transition-all shadow-lg flex items-center gap-2"
                            >
                                💳 Comprar Pack por ${selectedActivity?.price}
                            </button>
                        )}
                    </div>
                )}
                
                {/* Categorized Packs View */}

                <div className="flex justify-center mb-10">
                    <button 
                        onClick={async () => {
                            try {
                                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                setErrorMsg('');
                                Swal.fire({
                                    title: "¡Micrófono listo!",
                                    text: "Tu navegador tiene permiso para escucharte. Ya puedes practicar.",
                                    icon: "success",
                                    confirmButtonColor: "#b273c2"
                                });
                                stream.getTracks().forEach(track => track.stop());
                            } catch (err) {
                                console.error('Mic test error:', err);
                                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                                    setErrorMsg('❌ Permiso denegado: Haz clic en el ícono del candado (🔒) en la barra de direcciones de arriba y cambia "Micrófono" a "Permitir", luego recarga la página.');
                                } else if (err.name === 'NotFoundError') {
                                    setErrorMsg('❌ No se encontró ningún micrófono: Conecta un micrófono o revisa la configuración de sonido de Windows.');
                                } else {
                                    setErrorMsg('❌ Error al acceder al micrófono: ' + err.message);
                                }
                            }
                        }}
                        className="px-5 py-2 bg-white border border-[#e5d2ea] text-[#b273c2] rounded-full text-sm font-bold shadow-sm hover:bg-[#faf5fb] transition-colors flex items-center gap-2 cursor-pointer"
                    >
                        🎤 Probar Micrófono (Pedir Permisos)
                    </button>
                </div>

                {!selectedActivity && !selectedPackPreview ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {courseActivities ? (
                            <div className="bg-white border border-[#f0dff3] rounded-[35px] p-8 shadow-sm mb-10 max-w-lg mx-auto text-center">
                                <h2 className="text-xl font-black uppercase text-[#1d1d1d] mb-2">
                                    Packs asignados al curso:
                                </h2>
                                <h3 className="text-[#b273c2] font-black text-2xl uppercase tracking-tighter mb-6">{courseName || 'TU CURSO'}</h3>
                                {activities.length === 0 && (
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">
                                        No hay packs asignados a este curso.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="mb-10">
                                {Object.entries(
                                    activities.reduce((acc, activity) => {
                                        const cat = activity.pack_category || 'SPEAKING PRACTICE';
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(activity);
                                        return acc;
                                    }, {})
                                ).map(([category, packs]) => (
                                    <div key={category} className="mb-12">
                                        <h3 className="text-2xl font-black uppercase tracking-widest text-[#1d1d1d] mb-6 border-b border-[#f0dff3] pb-2">
                                            {category}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {packs.map(activity => {
                                                const access = accessMap[activity.id];
                                                const isLocked = activity.price > 0 && access && access.accessType === 'locked';

                                                const handleCardClick = () => {
                                                    if (isLocked) {
                                                        Swal.fire({
                                                            title: '🔒 Pack Bloqueado',
                                                            html: `Has agotado tu prueba gratuita de este pack.<br/><br/><strong>Desbloquealo por $${activity.price} para acceso ilimitado.</strong>`,
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonText: '💳 Comprar Pack',
                                                            cancelButtonText: 'Cancelar',
                                                            confirmButtonColor: '#b273c2',
                                                            cancelButtonColor: '#6b7280',
                                                            background: '#fff',
                                                        }).then(result => {
                                                            if (result.isConfirmed) {
                                                                dispatch(Add({
                                                                    ProductId: `ai-${activity.id}`,
                                                                    id: `ai-pack-${activity.id}`,
                                                                    title: activity.title,
                                                                    price: Number(activity.price),
                                                                    precioAlPublico: Number(activity.price),
                                                                    precioMayorista: Number(activity.price),
                                                                    image: "https://ik.imagekit.io/yryz026j5/pngtree-ai-artificial-intelligence-icon-png-image_6565152-removebg-preview_H_w4E1c_X.png",
                                                                    quantity: 1,
                                                                    color: "unico",
                                                                    storage: "unico",
                                                                    esInfoproducto: true
                                                                }));
                                                                navigate('/cart');
                                                            }
                                                        });
                                                    } else {
                                                        setSelectedPackPreview(activity);
                                                    }
                                                };

                                                const renderAccessBadge = () => {
                                                    if (!activity.price || activity.price <= 0) return null;
                                                    if (!access) return (
                                                        <span className="ml-auto text-xs font-black uppercase tracking-widest bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                            🔒 Paid (${activity.price})
                                                        </span>
                                                    );
                                                    if (access.accessType === 'course') return (
                                                        <span className="ml-auto text-xs font-black uppercase tracking-widest bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                            ✅ En tu curso
                                                        </span>
                                                    );
                                                    if (access.accessType === 'direct') return (
                                                        <span className="ml-auto text-xs font-black uppercase tracking-widest bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                            ✅ Desbloqueado
                                                        </span>
                                                    );
                                                    if (access.accessType === 'trial') return (
                                                        <span className="ml-auto text-xs font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                            ⚡ Prueba — {access.attemptsLeft ?? 2} restantes
                                                        </span>
                                                    );
                                                    if (access.accessType === 'locked') return (
                                                        <span className="ml-auto text-xs font-black uppercase tracking-widest bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                                            🔒 Bloqueado
                                                        </span>
                                                    );
                                                    return null;
                                                };

                                                return (
                                                <motion.div 
                                                    whileHover={{ y: -5 }}
                                                    key={activity.id} 
                                                    onClick={handleCardClick}
                                                    className={`bg-white/40 backdrop-blur-xl border shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_0_10px_30px_rgba(0,0,0,0.05)] p-8 rounded-[35px] cursor-pointer transition-all flex flex-col justify-between ${
                                                        isLocked
                                                            ? 'border-red-200 opacity-80'
                                                            : 'border-white/50 hover:border-[#b273c2]'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-4 mb-4">
                                                            <div className="bg-[#f8f3f6] p-4 rounded-2xl text-[#b273c2]">
                                                                <FiFolder size={28} />
                                                            </div>
                                                            <h3 className="font-black text-2xl text-[#1d1d1d] tracking-tight">{activity.title}</h3>
                                                            {renderAccessBadge()}
                                                        </div>
                                                        {activity.description && <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{activity.description}</p>}
                                                    </div>
                                                    <div className="mt-6 pt-6 border-t border-[#f8f3f6] flex justify-between items-center gap-3">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-[#b273c2] bg-[#f8f3f6] px-4 py-2 rounded-full shrink-0">
                                                            {activity.PronunciationTasks?.length || 0} Ejercicios
                                                        </span>
                                                        <div className="flex items-center gap-2 justify-end flex-wrap">
                                                            {/* Buy button — visible for ALL users on paid packs */}
                                                            {activity.price > 0 && (access?.accessType !== 'course' && access?.accessType !== 'direct') && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        dispatch(Add({
                                                                            ProductId: `ai-${activity.id}`,
                                                                            id: `ai-pack-${activity.id}`,
                                                                            title: activity.title,
                                                                            price: Number(activity.price),
                                                                            precioAlPublico: Number(activity.price),
                                                                            precioMayorista: Number(activity.price),
                                                                            image: "https://ik.imagekit.io/yryz026j5/pngtree-ai-artificial-intelligence-icon-png-image_6565152-removebg-preview_H_w4E1c_X.png",
                                                                            quantity: 1,
                                                                            color: "unico",
                                                                            storage: "unico",
                                                                            esInfoproducto: true
                                                                        }));
                                                                        Swal.fire({
                                                                            title: "¡Pack Agregado!",
                                                                            text: `${activity.title} se añadió al carrito.`,
                                                                            icon: "success",
                                                                            confirmButtonColor: "#b273c2",
                                                                            confirmButtonText: "Ir al carrito"
                                                                        }).then(r => { if (r.isConfirmed) navigate('/cart'); });
                                                                    }}
                                                                    className="text-xs font-black uppercase tracking-widest bg-[#b273c2] text-white px-3 py-2 rounded-full hover:bg-[#9c63ad] transition-colors shadow-sm flex items-center gap-1 whitespace-nowrap"
                                                                >
                                                                    💳 Comprar ${activity.price}
                                                                </button>
                                                            )}
                                                            <span className={`font-black text-sm uppercase tracking-widest hover:underline ${
                                                                isLocked ? 'text-red-500' : 'text-[#b273c2]'
                                                            }`}>
                                                                {isLocked ? '🔒 Bloqueado' : `Entrar ${activity.price > 0 && access?.accessType === 'trial' ? '(Prueba)' : ''} →`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : selectedPackPreview && !selectedActivity ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex justify-between items-end mb-8 relative">
                            <button 
                                onClick={() => setSelectedPackPreview(null)} 
                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#b273c2] transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-[#f0dff3]"
                            >
                                <FiArrowLeft size={16} /> Volver a Packs
                            </button>
                        </div>
                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-[#f1dff3] mb-10 text-center relative max-w-3xl mx-auto">
                            <div className="bg-[#f8f3f6] w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-[#b273c2] mb-6 shadow-sm">
                                <FiFolder size={40} />
                            </div>
                            <div className="inline-block mb-4">
                                {accessMap[selectedPackPreview.id]?.accessType === 'locked' && (
                                    <span className="text-xs font-black uppercase tracking-widest bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        🔒 Bloqueado
                                    </span>
                                )}
                                {accessMap[selectedPackPreview.id]?.accessType === 'direct' && (
                                    <span className="text-xs font-black uppercase tracking-widest bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        ✅ Desbloqueado
                                    </span>
                                )}
                                {accessMap[selectedPackPreview.id]?.accessType === 'course' && (
                                    <span className="text-xs font-black uppercase tracking-widest bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        ✅ En tu curso
                                    </span>
                                )}
                                {accessMap[selectedPackPreview.id]?.accessType === 'trial' && (
                                    <span className="text-xs font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        ⚡ Prueba
                                    </span>
                                )}
                            </div>
                            <h2 className="text-4xl font-black text-[#1d1d1d] tracking-tight mb-4">{selectedPackPreview.title}</h2>
                            {selectedPackPreview.description && <p className="text-gray-600 text-lg mb-8">{selectedPackPreview.description}</p>}
                            
                            <div className="mb-8 text-left bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Ejercicios Incluidos ({selectedPackPreview.PronunciationTasks?.length || 0})</h3>
                                <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                    {selectedPackPreview.PronunciationTasks?.map((task, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 items-center">
                                            <div className="w-8 h-8 shrink-0 bg-[#f8f3f6] text-[#b273c2] rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                            <div>
                                                <p className="font-bold text-gray-800">{task.title}</p>
                                                {task.instruction && <p className="text-xs text-gray-500">{task.instruction}</p>}
                                            </div>
                                        </div>
                                    ))}
                                    {(!selectedPackPreview.PronunciationTasks || selectedPackPreview.PronunciationTasks.length === 0) && (
                                        <p className="text-sm text-gray-400 italic">No hay ejercicios cargados en este pack.</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                {selectedPackPreview.price > 0 && accessMap[selectedPackPreview.id]?.accessType !== 'course' && accessMap[selectedPackPreview.id]?.accessType !== 'direct' && (
                                    <button
                                        onClick={() => {
                                            dispatch(Add({
                                                ProductId: `ai-${selectedPackPreview.id}`,
                                                id: `ai-pack-${selectedPackPreview.id}`,
                                                title: selectedPackPreview.title,
                                                price: Number(selectedPackPreview.price),
                                                precioAlPublico: Number(selectedPackPreview.price),
                                                precioMayorista: Number(selectedPackPreview.price),
                                                image: "https://ik.imagekit.io/yryz026j5/pngtree-ai-artificial-intelligence-icon-png-image_6565152-removebg-preview_H_w4E1c_X.png",
                                                quantity: 1,
                                                color: "unico",
                                                storage: "unico",
                                                esInfoproducto: true
                                            }));
                                            Swal.fire({
                                                title: "¡Pack Agregado!",
                                                text: `${selectedPackPreview.title} se añadió al carrito.`,
                                                icon: "success",
                                                confirmButtonColor: "#b273c2",
                                                confirmButtonText: "Ir al carrito"
                                            }).then(r => { if (r.isConfirmed) navigate('/cart'); });
                                        }}
                                        className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-[#b273c2] text-[#b273c2] rounded-full font-black uppercase tracking-widest hover:bg-[#faf5fb] transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        💳 Comprar ${selectedPackPreview.price}
                                    </button>
                                )}
                                {(accessMap[selectedPackPreview.id]?.accessType !== 'locked' || selectedPackPreview.price <= 0 || !selectedPackPreview.price) && (
                                    <button
                                        onClick={() => handleSelectActivity(selectedPackPreview)}
                                        className="w-full sm:w-auto px-10 py-4 bg-[#b273c2] text-white rounded-full font-black uppercase tracking-widest hover:bg-[#9c63ad] transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Comenzar Práctica →
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex justify-between items-end mb-8 relative">
                            <button 
                                onClick={() => handleSelectActivity(null)} 
                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#b273c2] transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-[#f0dff3]"
                            >
                                <FiArrowLeft size={16} /> Volver al Detalle
                            </button>
                        </div>

                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-[#f1dff3] mb-10 text-center relative">
                            <h2 className="text-3xl font-black text-[#1d1d1d] tracking-tight mb-3">{selectedActivity.title}</h2>
                            {selectedActivity.description && <p className="text-gray-600 text-lg">{selectedActivity.description}</p>}
                        </div>

                        <div className="space-y-12 mb-10">
                            {renderActiveStep()}
                        </div>
                    </motion.div>
                )}

                {loadingResult && (
                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),_0_20px_40px_rgba(0,0,0,0.15)] px-8 py-4 rounded-full flex items-center gap-4 z-50">
                        <div className="w-6 h-6 border-2 border-[#e8d1ed] border-t-[#b273c2] rounded-full animate-spin"></div>
                        <span className="font-bold text-gray-800">Evaluando con IA...</span>
                    </div>
                )}
            </div>

            {/* Global/Floating Stickman State */}
            <AnimatePresence>
                {activeStickmanLocation === 'floating' && (
                    <StickmanWithBubble 
                        mood={mascotMood} 
                        context={companionContext} 
                        layoutId="stickman" 
                        className={`fixed right-10 md:right-16 z-50 transform -translate-y-1/2 top-[calc(50%+300px)]`} 
                        bubblePosition="left"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentPronunciation;
