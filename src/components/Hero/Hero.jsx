import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import axios from 'axios';

gsap.registerPlugin(ScrollTrigger);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Hero = () => {
    const heroRef = useRef(null);
    const floatCardRef = useRef(null);
    const featuresRef = useRef(null);
    const scenariosRef = useRef(null);
    const navigate = useNavigate();

    // AI Speaking States
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [recordingSentenceIndex, setRecordingSentenceIndex] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [results, setResults] = useState({});
    
    const recognitionRef = useRef(null);
    const selectedTaskRef = useRef(null);
    const sentenceIndexRef = useRef(null);
    const transcriptRef = useRef('');

    useEffect(() => {
        let ctx = gsap.context(() => {
            gsap.fromTo(".hero-anim", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: "power3.out" });
            gsap.to(floatCardRef.current, { y: -15, rotation: 2.5, duration: 2.5, repeat: -1, yoyo: true, ease: "sine.inOut" });
            gsap.fromTo(".feature-card", { opacity: 0, y: 40 }, {
                opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out",
                scrollTrigger: { trigger: featuresRef.current, start: "top 80%", toggleActions: "play none none reverse" }
            });
            gsap.fromTo(".scenario-card", { opacity: 0, y: 40 }, {
                opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power2.out",
                scrollTrigger: { trigger: scenariosRef.current, start: "top 75%", toggleActions: "play none none reverse" }
            });
        }, heroRef);
        return () => ctx.revert();
    }, [tasks]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/pronunciation/tasks`);
                setTasks(res.data.slice(0, 3)); // Only first 3 for Home Page
            } catch (err) {
                console.error("Error fetching tasks for hero:", err);
            }
        };
        fetchTasks();

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

            recognitionRef.current.onend = () => {
                setIsRecording(false);
                if (transcriptRef.current && selectedTaskRef.current) {
                    evaluateSpeech(transcriptRef.current, selectedTaskRef.current, sentenceIndexRef.current);
                    transcriptRef.current = '';
                }
                setRecordingSentenceIndex(null);
            };
        }
    }, []);

    const startRecording = (task, sentenceIndex) => {
        if (!recognitionRef.current) return;
        setSelectedTask(task);
        selectedTaskRef.current = task;
        setRecordingSentenceIndex(sentenceIndex);
        sentenceIndexRef.current = sentenceIndex;
        transcriptRef.current = '';
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
        try {
            const taskToEvaluate = currentTask || selectedTaskRef.current;
            if (!taskToEvaluate) return;

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
        }
    };

    const getEmojiForTask = (title) => {
        const t = title.toLowerCase();
        if (t.includes('airport') || t.includes('flight')) return '✈️';
        if (t.includes('hotel') || t.includes('room')) return '🏨';
        if (t.includes('restaurant') || t.includes('food')) return '🍝';
        if (t.includes('direction') || t.includes('map')) return '🗺️';
        return '🗣️';
    };

    // Fallback if no tasks from DB
    const displayTasks = tasks.length > 0 ? tasks : [
        { id: 'fake1', title: 'AT THE AIRPORT', expected_text: ['Where are you travelling today?'] },
        { id: 'fake2', title: 'IN A RESTAURANT', expected_text: ['What would you order?'] },
        { id: 'fake3', title: 'ASKING FOR DIRECTIONS', expected_text: ['How do I get to the train station?'] }
    ];

    return (
        <div ref={heroRef} className="min-h-screen bg-[#f8f3f6] text-[#1d1d1d] font-sans pt-20">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden px-6 py-20 md:px-16 bg-gradient-to-br from-[#f9f1f7] to-[#efe4f2] min-h-[90vh] flex items-center">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-14 items-center">
                    <div className="z-10">
                        <div className="hero-anim inline-block bg-[#f6edf8] text-[#8d5d9a] px-6 py-2 rounded-full text-sm font-bold tracking-widest mb-6 shadow-sm border border-[#f0dff3]">
                            AI SPEAKING PRACTICE
                        </div>
                        <h1 className="hero-anim text-5xl md:text-7xl font-black leading-tight mb-8 text-[#1d1d1d]">
                            15 SPEAKING <br />
                            <span className="text-[#b273c2]">SCENARIOS</span>
                            <br />
                            FOR TRAVEL
                        </h1>
                        <p className="hero-anim text-xl text-gray-600 leading-relaxed mb-10 max-w-xl font-light">
                            Practice real-life English conversations with AI feedback,
                            pronunciation correction, fluency analysis, and speaking support.
                        </p>
                        <div className="hero-anim flex flex-wrap gap-5">
                            <button onClick={() => navigate('/15SpeakingScenatios')} className="bg-[#b273c2] hover:bg-[#9d5fb0] text-white px-8 py-4 rounded-[20px] text-lg font-bold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                Start Speaking 🎙️
                            </button>
                            <button onClick={() => navigate('/15SpeakingScenatios')} className="bg-white hover:bg-[#f6edf8] border border-[#f0dff3] text-[#b273c2] px-8 py-4 rounded-[20px] text-lg font-bold shadow-sm transition-all duration-300 hover:-translate-y-1">
                                View Scenarios ✈️
                            </button>
                        </div>
                    </div>

                    <div className="relative hero-anim">
                        <div ref={floatCardRef} className="bg-white rounded-[35px] shadow-2xl p-8 border border-[#f0dff3] rotate-2 transform origin-bottom-right">
                            <div className="bg-[#f8f3f6] rounded-3xl p-8 border border-[#f0dff3]">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <p className="text-xs uppercase tracking-widest text-[#b273c2] font-bold mb-1">Live AI Feedback</p>
                                        <h3 className="text-2xl font-black text-[#1d1d1d]">Pronunciation</h3>
                                    </div>
                                    <div className="w-16 h-16 rounded-full bg-[#f6edf8] flex items-center justify-center text-3xl shadow-sm border border-[#f0dff3]">🎧</div>
                                </div>
                                <div className="space-y-5">
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#f0dff3]">
                                        <div className="flex justify-between mb-3">
                                            <span className="font-bold text-gray-700">Accuracy</span>
                                            <span className="font-black text-[#b273c2]">92%</span>
                                        </div>
                                        <div className="w-full bg-[#f8f3f6] rounded-full h-4 overflow-hidden">
                                            <div className="bg-[#b273c2] h-4 rounded-full w-[92%] transition-all duration-1000 ease-out"></div>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#f0dff3]">
                                        <p className="text-xs text-[#b273c2] font-bold mb-3 uppercase tracking-widest">AI SUGGESTION</p>
                                        <p className="text-gray-600 leading-relaxed text-sm">
                                            “Excellent! Try using more linking words like <span className="font-bold text-[#b273c2]">however</span> to sound more natural.”
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section ref={featuresRef} className="py-24 px-6 md:px-16 bg-white relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            ['🎤', 'Record Answers', 'Answer questions orally.'],
                            ['🤖', 'AI Corrections', 'Grammar & vocab feedback.'],
                            ['🔊', 'Pronunciation', 'Real-time analysis.'],
                            ['✨', 'Natural English', 'Sound more fluent.']
                        ].map((item, i) => (
                            <div key={i} className="feature-card bg-[#f8f3f6] rounded-3xl p-8 border border-[#f0dff3] hover:shadow-xl transition-all duration-300 ease-out hover:-translate-y-2 hover:bg-white group">
                                <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{item[0]}</div>
                                <h3 className="text-xl font-black mb-3 text-[#1d1d1d]">{item[1]}</h3>
                                <p className="text-gray-600 leading-relaxed text-sm">{item[2]}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SCENARIOS GRID (Interactive) */}
            <section ref={scenariosRef} className="px-6 md:px-16 py-24 bg-[#f8f3f6]">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-[#1d1d1d]">
                            SPEAKING SCENARIOS
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Real-world English practice for travel. Try it now!
                        </p>
                    </div>

                    <div className="grid xl:grid-cols-3 gap-10">
                        {displayTasks.map((task, taskIdx) => {
                            const sentences = Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text];
                            const taskResults = results[task.id] || {};
                            // Take only up to 2 sentences to fit nicely on the home page card
                            const previewSentences = sentences.slice(0, 2);

                            return (
                                <div key={task.id || taskIdx} className="scenario-card bg-white rounded-[35px] overflow-hidden shadow-xl border border-[#f0dff3] hover:shadow-2xl transition-all duration-300 ease-out flex flex-col">
                                    <div className="bg-gradient-to-r from-[#f9f1f7] to-[#efe4f2] p-8 border-b border-[#f0dff3]">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl shadow-sm border border-[#f0dff3]">
                                                {getEmojiForTask(task.title)}
                                            </div>
                                            <div className="bg-[#b273c2] text-white px-5 py-2 rounded-full font-black text-sm shadow-md">
                                                0{taskIdx + 1}
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black leading-tight text-[#1d1d1d]">
                                            {task.title}
                                        </h3>
                                    </div>

                                    <div className="p-8 flex-1 bg-white">
                                        <div className="mb-6">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="bg-[#f6edf8] text-[#b273c2] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                    PRONUNCIATION
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {previewSentences.map((sentence, index) => {
                                                const sentenceResult = taskResults[index];
                                                const isSentenceRecording = isRecording && selectedTask?.id === task.id && recordingSentenceIndex === index;

                                                return (
                                                    <div key={index} className="bg-[#f8f3f6] border border-[#f0dff3] rounded-2xl p-5 text-gray-700 transition-all hover:shadow-md">
                                                        <p className="text-[15px] font-medium italic mb-4">
                                                            "{sentence}"
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            {isSentenceRecording ? (
                                                                <button onClick={stopRecording} className="px-4 py-2 bg-red-500 text-white rounded-full font-bold animate-pulse shadow-md text-xs flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-white rounded-full"></div> DETENER
                                                                </button>
                                                            ) : (
                                                                <button onClick={() => { if(task.id !== 'fake1') startRecording(task, index); }} className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shadow-sm transition-all transform hover:scale-105 ${isRecording || task.id.startsWith('fake') ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#b273c2] hover:bg-[#9d5fb0]'}`} title="Grabar tu voz">
                                                                    🎙️
                                                                </button>
                                                            )}

                                                            {sentenceResult && (
                                                                <div className="text-right">
                                                                    <span className="text-[#b273c2] font-black text-lg">{sentenceResult.evaluation.score}%</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {sentenceResult && (
                                                            <div className="mt-3 pt-3 border-t border-[#f1e4f5]">
                                                                {sentenceResult.evaluation.errors?.length > 0 ? (
                                                                    <p className="text-[10px] text-gray-500">
                                                                        <span className="font-bold text-[#b273c2]">Corrección:</span> Se detectaron {sentenceResult.evaluation.errors.length} errores.
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[10px] font-bold text-green-600">¡Perfecto!</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* DARK FOOTER SECTION */}
            <section className="bg-[#1f1723] text-white px-6 md:px-16 py-24 rounded-t-[50px]">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-block bg-[#d7a7e3] text-[#1f1723] px-6 py-2 rounded-full text-xs font-black tracking-widest mb-6">
                            POWERED BY AI
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black leading-tight mb-8">
                            SMART FEEDBACK <br /> INTEGRATION
                        </h2>
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                            <ul className="space-y-4 text-gray-300 font-light">
                                <li className="flex items-center gap-3"><span className="text-[#d7a7e3]">✨</span> OpenAI Whisper API</li>
                                <li className="flex items-center gap-3"><span className="text-[#d7a7e3]">✨</span> Real-time speech-to-text</li>
                                <li className="flex items-center gap-3"><span className="text-[#d7a7e3]">✨</span> Grammatical corrections</li>
                            </ul>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-[35px] p-8 backdrop-blur-md">
                        <h3 className="text-2xl font-black mb-6 text-[#d7a7e3]">Example Correction</h3>
                        <div className="space-y-4">
                            <div className="bg-[#1f1723] rounded-2xl p-5 border border-white/10">
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">YOU SAID</p>
                                <p className="text-gray-300 italic">“I want go to airport.”</p>
                            </div>
                            <div className="bg-[#d7a7e3]/10 rounded-2xl p-5 border border-[#d7a7e3]/30">
                                <p className="text-xs font-bold text-[#d7a7e3] mb-2 uppercase tracking-widest">AI CORRECTION</p>
                                <p className="text-white">“I want <strong>to</strong> go to <strong>the</strong> airport.”</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Hero;