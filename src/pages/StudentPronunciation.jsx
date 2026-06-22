import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const StudentPronunciation = () => {
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [recordingSentenceIndex, setRecordingSentenceIndex] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [loadingResult, setLoadingResult] = useState(false);
    
    // Store results as { taskId: { sentenceIndex: resultData } }
    const [results, setResults] = useState({});
    const [errorMsg, setErrorMsg] = useState('');
    
    const recognitionRef = useRef(null);
    const selectedTaskRef = useRef(null);
    const sentenceIndexRef = useRef(null);
    const transcriptRef = useRef('');
    const [voices, setVoices] = useState([]);

    useEffect(() => {
        axios.get(`${API_URL}/api/pronunciation/tasks`).then(res => setTasks(res.data)).catch(err => console.error(err));
        
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };
        if ('speechSynthesis' in window) {
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

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
    }, []);

    const startRecording = (task, sentenceIndex) => {
        if (!recognitionRef.current) return;
        setSelectedTask(task);
        selectedTaskRef.current = task;
        setRecordingSentenceIndex(sentenceIndex);
        sentenceIndexRef.current = sentenceIndex;
        transcriptRef.current = '';
        setErrorMsg('');
        setIsRecording(true);
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
            
            const res = await axios.post(`${API_URL}/api/pronunciation/evaluate`, {
                task_id: taskToEvaluate.id,
                transcribed_text: transcript,
                sentence_index: sentenceIndex,
                student_id: null 
            });
            
            setResults(prev => ({
                ...prev,
                [taskToEvaluate.id]: {
                    ...(prev[taskToEvaluate.id] || {}),
                    [sentenceIndex]: res.data
                }
            }));
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

    return (
        <div className="min-h-screen bg-[#f8f3f6] text-[#1d1d1d] font-sans p-8 mt-[80px]">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-block bg-[#cfa6d8] text-black px-5 py-2 rounded-full text-sm font-semibold tracking-wide mb-5 shadow-md">
                        AI SPEAKING PRACTICE
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black leading-tight text-[#1d1d1d]">
                        EVALUACIÓN DE <span className="text-[#b273c2]">PRONUNCIACIÓN</span>
                    </h1>
                </div>

                {errorMsg && (
                    <div className="bg-[#f5f9f5] border border-[#d9f0da] text-red-700 p-4 rounded-2xl shadow-sm mb-8 font-medium">
                        {errorMsg}
                    </div>
                )}

                <div className="space-y-12 mb-10">
                    {tasks.map(task => {
                        const taskResults = results[task.id] || {};
                        const sentences = Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text];
                        const evaluatedCount = Object.keys(taskResults).length;
                        const isComplete = evaluatedCount === sentences.length;
                        const averageScore = isComplete 
                            ? Math.round(Object.values(taskResults).reduce((acc, r) => acc + r.evaluation.score, 0) / sentences.length) 
                            : null;

                        return (
                            <div key={task.id} className="bg-white p-8 md:p-10 rounded-[35px] shadow-2xl border border-[#f1dff3] transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-3xl font-black leading-tight mb-2 uppercase">{task.title}</h3>
                                        {task.instruction && <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-5">{task.instruction}</p>}
                                    </div>
                                    {isComplete && (
                                        <div className="bg-gradient-to-r from-[#efdff3] to-[#f8f1fa] w-24 h-24 rounded-full flex flex-col items-center justify-center text-[#b273c2] shadow-sm border border-[#edd9f2]">
                                            <span className="text-2xl font-black">{averageScore}%</span>
                                            <span className="text-[9px] uppercase tracking-widest font-bold">Promedio</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-6">
                                    {sentences.map((sentence, index) => {
                                        const sentenceResult = taskResults[index];
                                        const isSentenceRecording = isRecording && selectedTask?.id === task.id && recordingSentenceIndex === index;
                                        
                                        return (
                                            <div key={index} className="bg-[#faf5fb] border border-[#f0e2f4] rounded-[24px] p-6 hover:shadow-md transition-all group">
                                                <p className="text-gray-800 font-medium text-[17px] italic mb-5 leading-relaxed flex items-start gap-3">
                                                    <span className="text-[#b273c2] opacity-50 font-black">{index + 1}.</span>
                                                    "{sentence}"
                                                </p>
                                                
                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-4">
                                                        {isSentenceRecording ? (
                                                            <button onClick={stopRecording} className="px-6 py-3 bg-red-500 text-white rounded-full font-bold animate-pulse flex items-center gap-2 shadow-lg hover:bg-red-600 transition-colors">
                                                                <div className="w-3 h-3 bg-white rounded-full"></div> DETENER
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => startRecording(task, index)} disabled={isRecording} className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-md transition-all transform group-hover:scale-105 ${isRecording ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#b273c2] hover:bg-[#9c63ad]'}`} title="Grabar oración">
                                                                🎙️
                                                            </button>
                                                        )}
                                                        <button onClick={() => playWord(sentence)} className="w-12 h-12 rounded-full border border-[#e5d2ea] text-[#b273c2] flex items-center justify-center text-xl shadow-sm hover:bg-gray-50 transition-all" title="Escuchar pronunciación nativa">
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

                                                {/* Progress Display */}
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
                                                                        <div key={idx} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#f0dff3] text-sm">
                                                                            <span onClick={() => playWord(err.word)} className="font-bold text-[#b273c2] bg-[#f8f3f6] px-3 py-1 rounded-lg cursor-pointer hover:bg-[#f0e2f4] transition-colors">
                                                                                {err.word}
                                                                            </span>
                                                                            <span className="text-gray-600">
                                                                                {err.reason === 'omitted' ? 'Palabra omitida' : `Se escuchó como "${err.reason}"`}
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
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {tasks.length === 0 && !loadingResult && (
                        <p className="text-gray-600 text-center py-12 bg-white rounded-[30px] shadow-xl border border-[#f0dff3]">No hay tareas de pronunciación disponibles en este momento.</p>
                    )}
                </div>

                {loadingResult && (
                    <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-8 py-4 rounded-full shadow-2xl border border-[#f1dff3] flex items-center gap-4 z-50">
                        <div className="w-6 h-6 border-2 border-[#e8d1ed] border-t-[#b273c2] rounded-full animate-spin"></div>
                        <span className="font-bold text-gray-800">Evaluando con IA...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentPronunciation;
