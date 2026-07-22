import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiFolder } from 'react-icons/fi';
import StickmanCompanion from '../components/StickmanCompanion';

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
    const [activities, setActivities] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    
    const [selectedTask, setSelectedTask] = useState(null);
    const [recordingSentenceIndex, setRecordingSentenceIndex] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [loadingResult, setLoadingResult] = useState(false);
    const [listenedSentences, setListenedSentences] = useState({});
    
    // Mascot state
    const [mascotMood, setMascotMood] = useState('waving'); // 'idle', 'happy', 'sad'
    const [activeStickmanLocation, setActiveStickmanLocation] = useState('header');
    const [companionContext, setCompanionContext] = useState({ message: "¡Hola! Selecciona un día en el calendario para ver tus ejercicios.", animation: "waving" });
    
    // Store results as { taskId: { sentenceIndex: resultData } }
    const [results, setResults] = useState({});
    const [errorMsg, setErrorMsg] = useState('');
    
    const recognitionRef = useRef(null);
    const selectedTaskRef = useRef(null);
    const sentenceIndexRef = useRef(null);
    const transcriptRef = useRef('');
    const [voices, setVoices] = useState([]);

    const [scrollPosition, setScrollPosition] = useState(0);
    const [taskScrollY, setTaskScrollY] = useState(0);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

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
            setCompanionContext({ message: "¡Hola! Selecciona un día en el calendario para ver tus ejercicios.", animation: "waving" });
        }
    };

    const fetchActivities = async (date) => {
        try {
            const query = date ? `?date=${date}` : '';
            const res = await axios.get(`${API_URL}/api/pronunciation/activities${query}`);
            setActivities(res.data);
            
            if (selectedActivity) {
                const updatedActivity = res.data.find(a => a.id === selectedActivity.id);
                setSelectedActivity(updatedActivity || null);
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
        fetchActivities(selectedDate);
        
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
                transcriptRef.current = currentTranscript.trim();
            };
            
            recognitionRef.current.onerror = (event) => {
                setErrorMsg('Error en el reconocimiento de voz: ' + event.error);
                setIsRecording(false);
                setRecordingSentenceIndex(null);
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
                if (transcriptRef.current && selectedTaskRef.current) {
                    evaluateSpeech(transcriptRef.current, selectedTaskRef.current, sentenceIndexRef.current);
                    transcriptRef.current = ''; 
                }
                setRecordingSentenceIndex(null);
            };
        } else {
            setErrorMsg("Tu navegador no soporta la Web Speech API. Por favor, usa Google Chrome o Edge actualizado.");
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [selectedDate]); // Re-run effect only when needed

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

    const startRecording = (task, sentenceIndex) => {
        if (!recognitionRef.current) return;
        setTaskScrollY(window.scrollY);
        setSelectedTask(task);
        selectedTaskRef.current = task;
        setRecordingSentenceIndex(sentenceIndex);
        sentenceIndexRef.current = sentenceIndex;
        transcriptRef.current = '';
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
        
        recognitionRef.current.start();
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setRecordingSentenceIndex(null);
        }
    };

    const evaluateSpeech = async (transcript, currentTask, sentenceIndex) => {
        setLoadingResult(true);
        try {
            const taskToEvaluate = currentTask || selectedTaskRef.current;
            if (!taskToEvaluate) throw new Error("No task selected");
            
            const hasListened = !!listenedSentences[`${taskToEvaluate.id}-${sentenceIndex}`];

            const res = await axios.post(`${API_URL}/api/pronunciation/evaluate`, {
                task_id: taskToEvaluate.id,
                transcribed_text: transcript,
                sentence_index: sentenceIndex,
                student_id: null,
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
            setErrorMsg("Ocurrió un error al evaluar tu pronunciación.");
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
                        AI SPEAKING PRACTICE
                    </div>
                    <div className="relative inline-block">
                        <h1 className="text-4xl md:text-5xl font-black leading-tight text-[#1d1d1d]">
                            EVALUACIÓN DE <span className="text-[#b273c2]">PRONUNCIACIÓN</span>
                        </h1>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-[#f5f9f5] border border-[#d9f0da] text-red-700 p-4 rounded-2xl shadow-sm mb-8 font-medium">
                        {errorMsg}
                    </div>
                )}

                {!selectedActivity ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {/* Calendar View */}
                        <div className="bg-white border border-[#f0dff3] rounded-[35px] p-8 shadow-sm mb-10 max-w-lg mx-auto relative">
                            <AnimatePresence>
                                {activeStickmanLocation === 'header' && (
                                    <StickmanWithBubble 
                                        mood={mascotMood} 
                                        context={companionContext} 
                                        layoutId="stickman" 
                                        className="absolute -right-10 md:-right-60 top-1/2 transform -translate-y-1/2 z-50" 
                                        bubblePosition="none"
                                    />
                                )}
                            </AnimatePresence>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1d1d1d] capitalize">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-3 bg-[#f8f3f6] hover:bg-[#f0dff3] rounded-xl transition-colors font-bold text-xs uppercase tracking-widest text-[#b273c2]">Ant</button>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-3 bg-[#f8f3f6] hover:bg-[#f0dff3] rounded-xl transition-colors font-bold text-xs uppercase tracking-widest text-[#b273c2]">Sig</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-4">
                                {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map(day => (
                                    <div key={day} className="text-[11px] font-black uppercase tracking-widest text-[#b273c2]">{day}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-y-3">
                                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} className="p-2"></div>
                                ))}
                                {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                                    const d = i + 1;
                                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                    const isSelected = selectedDate === dateStr;
                                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                                    return (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setSelectedDate(dateStr)}
                                            className={`p-2 w-12 h-12 rounded-full flex items-center justify-center text-sm font-black transition-all mx-auto ${
                                                isSelected 
                                                    ? 'bg-[#b273c2] text-white shadow-md transform scale-110' 
                                                    : isToday 
                                                        ? 'bg-[#f0dff3] text-[#1d1d1d]' 
                                                        : 'text-gray-500 hover:bg-[#f8f3f6]'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-10">
                            {activities.length === 0 ? (
                                <div className="text-center py-16 bg-white rounded-[30px] shadow-sm border border-[#f0dff3]">
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Día libre</p>
                                    <p className="text-[#1d1d1d] font-medium">No hay actividades asignadas para el día <span className="font-bold">{selectedDate}</span>.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {activities.map(activity => (
                                        <motion.div 
                                            whileHover={{ y: -5 }}
                                            key={activity.id} 
                                            onClick={() => handleSelectActivity(activity)}
                                            className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),_0_10px_30px_rgba(0,0,0,0.05)] p-8 rounded-[35px] hover:border-white/80 cursor-pointer transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-4 mb-4">
                                                    <div className="bg-[#f8f3f6] p-4 rounded-2xl text-[#b273c2]">
                                                        <FiFolder size={28} />
                                                    </div>
                                                    <h3 className="font-black text-2xl text-[#1d1d1d] tracking-tight">{activity.title}</h3>
                                                </div>
                                                {activity.description && <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{activity.description}</p>}
                                            </div>
                                            <div className="mt-6 pt-6 border-t border-[#f8f3f6] flex justify-between items-center">
                                                <span className="text-xs font-bold uppercase tracking-widest text-[#b273c2] bg-[#f8f3f6] px-4 py-2 rounded-full">
                                                    {activity.PronunciationTasks?.length || 0} Ejercicios
                                                </span>
                                                <span className="text-[#b273c2] font-black text-sm uppercase tracking-widest hover:underline">
                                                    Entrar →
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex justify-between items-end mb-8 relative">
                            <button 
                                onClick={() => handleSelectActivity(null)} 
                                className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-[#b273c2] transition-colors bg-white px-6 py-3 rounded-full shadow-sm border border-[#f0dff3]"
                            >
                                <FiArrowLeft size={16} /> Volver a Actividades
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
