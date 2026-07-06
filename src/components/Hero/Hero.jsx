import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from 'react-router-dom';
import authContext from "../../store/store";
import { useContext } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Canvas } from "@react-three/fiber";
import { PresentationControls, Float, Html, ContactShadows, Environment, RoundedBox } from "@react-three/drei";
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// --- 3D Phone Model (iPhone 17 Pro Max Structure) ---
// Note: To use a real photorealistic 3D model file (e.g. with a hand), uncomment the useGLTF line below and place your 'iphone.glb' in the public/ folder.
// const { nodes, materials } = useGLTF('/iphone.glb'); 

const PhonePlaceholder = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, delay = 0.2, animateFromY = -10, screenType = 'assistant' }) => {
    const phoneRef = React.useRef();

    useGSAP(() => {
        if (phoneRef.current) {
            // Animación estricta fromTo para evitar bugs con React StrictMode y HMR
            gsap.fromTo(phoneRef.current.position, 
                { y: animateFromY, z: position[2] + 4, x: position[0] }, 
                { y: position[1], z: position[2], x: position[0], duration: 2, ease: "power4.out", delay: delay }
            );
            gsap.fromTo(phoneRef.current.rotation, 
                { x: -1.5, y: 2, z: -0.5 }, 
                { x: rotation[0], y: rotation[1], z: rotation[2], duration: 2.2, ease: "expo.out", delay: delay }
            );
        }
    }, [delay, position, rotation, animateFromY]);

    return (
        <group ref={phoneRef} position={position} rotation={rotation} scale={scale}>
            {/* Titanium Frame */}
            <RoundedBox args={[2.8, 5.8, 0.3]} radius={0.35} smoothness={32} castShadow receiveShadow>
                <meshStandardMaterial color="#9ca3af" roughness={0.15} metalness={0.9} />
            </RoundedBox>
            
            {/* Front Screen Black Bezel */}
            <RoundedBox args={[2.7, 5.7, 0.31]} radius={0.3} smoothness={32} position={[0, 0, 0.01]}>
                <meshBasicMaterial color="#050505" />
            </RoundedBox>

            {/* Dynamic Island */}
            <RoundedBox args={[0.8, 0.22, 0.33]} radius={0.11} smoothness={16} position={[0, 2.5, 0.02]}>
                <meshBasicMaterial color="#000000" />
            </RoundedBox>

            {/* Action Button (Left) */}
            <RoundedBox args={[0.05, 0.3, 0.1]} radius={0.02} position={[-1.41, 1.5, 0]}>
                <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.8} />
            </RoundedBox>
            {/* Volume Up (Left) */}
            <RoundedBox args={[0.05, 0.4, 0.1]} radius={0.02} position={[-1.41, 0.9, 0]}>
                <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.8} />
            </RoundedBox>
            {/* Volume Down (Left) */}
            <RoundedBox args={[0.05, 0.4, 0.1]} radius={0.02} position={[-1.41, 0.3, 0]}>
                <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.8} />
            </RoundedBox>
            {/* Power Button (Right) */}
            <RoundedBox args={[0.05, 0.6, 0.1]} radius={0.02} position={[1.41, 1.0, 0]}>
                <meshStandardMaterial color="#9ca3af" roughness={0.2} metalness={0.8} />
            </RoundedBox>

            {/* Camera Bump (Back) */}
            <RoundedBox args={[1.2, 1.2, 0.34]} radius={0.3} smoothness={16} position={[-0.65, 2.1, -0.05]}>
                <meshStandardMaterial color="#d1d5db" roughness={0.2} metalness={0.7} />
            </RoundedBox>

            {/* HTML Screen Interface */}
            <Html transform distanceFactor={3.8} position={[0, 0, 0.175]} zIndexRange={[100, 0]} occlude="blending">
                <div className="flex flex-col items-center relative" style={{ backgroundColor: '#f8f9fa', width: '270px', height: '570px', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)' }}>
                    
                    {/* Header */}
                    <div className="w-full flex justify-between items-center px-6 pt-8 pb-4 z-20 relative">
                        <span className="text-black font-bold text-sm">10:10</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-4 h-3 bg-black rounded-sm"></div>
                            <div className="w-3 h-3 bg-black rounded-full"></div>
                        </div>
                    </div>

                    {screenType === 'scenarios' && (
                        <div className="w-full px-6 flex-1 flex flex-col z-20 relative pt-2">
                            <h2 className="text-black font-black text-xl mb-4">Travel Scenarios</h2>
                            <div className="flex flex-col gap-3">
                                <div className="bg-white p-3 shadow-sm border border-gray-100 flex items-center gap-3" style={{ borderRadius: '16px' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#f6edf8' }}>✈️</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">At the Airport</h3>
                                        <p className="text-gray-400" style={{ fontSize: '10px' }}>5 phrases</p>
                                    </div>
                                </div>
                                <div className="bg-white p-3 shadow-sm border border-gray-100 flex items-center gap-3 border-l-4" style={{ borderRadius: '16px', borderLeftColor: '#b273c2' }}>
                                    <div className="w-10 h-10 text-white rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#b273c2' }}>🏨</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Checking In</h3>
                                        <p className="text-gray-400" style={{ fontSize: '10px' }}>8 phrases</p>
                                    </div>
                                </div>
                                <div className="bg-white p-3 shadow-sm border border-gray-100 flex items-center gap-3 opacity-50" style={{ borderRadius: '16px' }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#f6edf8' }}>🍝</div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">Restaurant</h3>
                                        <p className="text-gray-400" style={{ fontSize: '10px' }}>Locked</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {screenType === 'speaking' && (
                        <div className="w-full h-full absolute inset-0 pt-16 flex flex-col items-center z-10" style={{ background: 'linear-gradient(to bottom, #f9f1f7, #efe4f2)' }}>
                            <div className="text-white p-3 mb-6 w-10/12 text-center font-black shadow-lg uppercase tracking-widest text-xs mt-4" style={{ backgroundColor: '#b273c2', borderRadius: '16px' }}>
                                AI LISTENING
                            </div>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl shadow-2xl animate-pulse mb-6 relative">
                                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: '#b273c2' }}></div>
                                🎙️
                            </div>
                            <div className="bg-white/60 p-3 border border-white mx-6 text-center shadow-sm" style={{ borderRadius: '16px' }}>
                                <p className="text-gray-800 text-sm font-medium italic">"I would like to book a double room for tonight..."</p>
                            </div>
                            <div className="flex gap-2 w-full justify-center mt-auto mb-20 items-center">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="w-1.5 rounded-full animate-bounce" style={{ backgroundColor: '#b273c2', animationDelay: `${i*0.1}s`, height: `${Math.floor(Math.random() * 20) + 15}px`}}></div>
                                ))}
                            </div>
                        </div>
                    )}

                    {screenType === 'feedback' && (
                        <div className="w-full px-6 flex-1 flex flex-col items-center z-20 relative pt-2">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <span className="text-3xl">🏆</span>
                            </div>
                            <h2 className="text-black font-black text-2xl mb-1 text-center">Great Job!</h2>
                            <p className="text-gray-400 font-bold uppercase tracking-widest mb-4" style={{ fontSize: '10px' }}>Fluency Score: <span className="text-green-500">92%</span></p>
                            
                            <div className="w-full bg-white p-3 shadow-sm border border-gray-100 text-left" style={{ borderRadius: '16px' }}>
                                <p className="font-black uppercase tracking-widest mb-1 flex items-center gap-1" style={{ fontSize: '10px', color: '#b273c2' }}>
                                    <span style={{ color: '#b273c2' }}>✨</span> AI CORRECTION
                                </p>
                                <p className="text-gray-500 line-through mb-1" style={{ fontSize: '11px' }}>"I want go to airport"</p>
                                <p className="text-xs font-bold text-gray-800">"I want <span style={{ color: '#b273c2' }}>to</span> go to <span style={{ color: '#b273c2' }}>the</span> airport."</p>
                            </div>
                            <button className="w-full text-white py-3 text-sm font-bold mt-auto mb-4 shadow-xl" style={{ backgroundColor: '#1d1d1d', borderRadius: '12px' }}>
                                Next Scenario
                            </button>
                        </div>
                    )}

                    <div className="w-full py-6 flex flex-col items-center justify-center mt-auto z-20 relative" style={{ backgroundColor: '#e9ecef' }}>
                        <span className="font-bold text-gray-500 mb-4" style={{ fontSize: '10px' }}>©2024 English AI</span>
                        <div className="w-20 h-1 bg-black rounded-full mt-2"></div>
                    </div>

                    {/* WebGL Masking Fix: CSS Inverted Rounded Corners to perfectly blend with the #050505 Titanium Bezel */}
                    <div className="absolute top-0 left-0 z-50 pointer-events-none" style={{ width: '38px', height: '38px', background: 'radial-gradient(circle at 100% 100%, transparent 37.5px, #050505 38px)' }}></div>
                    <div className="absolute top-0 right-0 z-50 pointer-events-none" style={{ width: '38px', height: '38px', background: 'radial-gradient(circle at 0% 100%, transparent 37.5px, #050505 38px)' }}></div>
                    <div className="absolute bottom-0 left-0 z-50 pointer-events-none" style={{ width: '38px', height: '38px', background: 'radial-gradient(circle at 100% 0%, transparent 37.5px, #050505 38px)' }}></div>
                    <div className="absolute bottom-0 right-0 z-50 pointer-events-none" style={{ width: '38px', height: '38px', background: 'radial-gradient(circle at 0% 0%, transparent 37.5px, #050505 38px)' }}></div>
                </div>
            </Html>
        </group>
    );
};
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const Hero = () => {
    const heroRef = useRef(null);
    const featuresRef = useRef(null);
    const scenariosRef = useRef(null);
    const navigate = useNavigate();
    const authCtx = useContext(authContext);

    const handleStartSpeaking = () => {
        if (authCtx.token) {
            navigate('/pronunciation');
        } else {
            navigate('/login');
        }
    };

    // AI Speaking States
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [recordingSentenceIndex, setRecordingSentenceIndex] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [results, setResults] = useState({});
    const [evaluatingSentence, setEvaluatingSentence] = useState(null);
    
    const recognitionRef = useRef(null);
    const selectedTaskRef = useRef(null);
    const sentenceIndexRef = useRef(null);
    const transcriptRef = useRef('');

    useGSAP(() => {
        gsap.fromTo(".hero-anim", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power3.out", willChange: "transform, opacity" });
        
        gsap.fromTo(".feature-card", { opacity: 0, scale: 0.9 }, {
            opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.7)", willChange: "transform, opacity",
            scrollTrigger: { trigger: featuresRef.current, start: "top 85%", toggleActions: "play none none reverse" }
        });
        
        gsap.fromTo(".scenario-card", { opacity: 0, y: 50 }, {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out", willChange: "transform, opacity",
            scrollTrigger: { trigger: scenariosRef.current, start: "top 80%", toggleActions: "play none none reverse" }
        });

    }, { scope: heroRef, dependencies: [tasks] });

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

            setEvaluatingSentence({ taskId: taskToEvaluate.id, sentenceIndex });

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
        } finally {
            setEvaluatingSentence(null);
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
                            <button onClick={handleStartSpeaking} className="bg-[#b273c2] hover:bg-[#9d5fb0] text-white px-8 py-4 rounded-[20px] text-lg font-bold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                                Start Speaking 🎙️
                            </button>
                            <button onClick={handleStartSpeaking} className="bg-white hover:bg-[#f6edf8] border border-[#f0dff3] text-[#b273c2] px-8 py-4 rounded-[20px] text-lg font-bold shadow-sm transition-all duration-300 hover:-translate-y-1">
                                View Scenarios ✈️
                            </button>
                        </div>
                    </div>

                    <div className="relative h-[600px] hero-anim z-10 w-full flex items-center justify-center order-first md:order-last">
                        <div className="w-full h-full cursor-grab active:cursor-grabbing">
                            <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }} className="w-full h-full pointer-events-auto">
                                <React.Suspense fallback={null}>
                                    <Environment preset="city" />
                                    <ambientLight intensity={0.5} />
                                    <directionalLight position={[10, 10, 5]} intensity={1} />
                                        
                                        <PresentationControls 
                                            global 
                                            rotation={[0, -0.3, 0]} 
                                            polar={[-0.1, 0.2]} 
                                            azimuth={[-0.5, 0.5]} 
                                            config={{ mass: 2, tension: 400 }} 
                                            snap={{ mass: 4, tension: 400 }}
                                        >
                                            <Float rotationIntensity={0.2} floatIntensity={1} speed={1.5}>
                                                {/* Phone 1 (Left) - Cae desde arriba */}
                                                <PhonePlaceholder position={[-1.7, -0.2, -0.5]} rotation={[0, 0.4, -0.05]} scale={0.8} delay={0.2} animateFromY={10} screenType="scenarios" />
                                                
                                                {/* Phone 2 (Center - Main) - Sube desde abajo */}
                                                <PhonePlaceholder position={[0, 0, 0.5]} rotation={[0, 0, 0]} scale={0.9} delay={0.4} animateFromY={-10} screenType="speaking" />
                                                
                                                {/* Phone 3 (Right) - Cae desde arriba */}
                                                <PhonePlaceholder position={[1.7, -0.2, -1.0]} rotation={[0, -0.4, 0.05]} scale={0.75} delay={0.6} animateFromY={10} screenType="feedback" />
                                            </Float>
                                        </PresentationControls>
                                        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
                                </React.Suspense>
                            </Canvas>
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
                            <div key={i} className="feature-card bg-white/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:bg-white/60 transition-all duration-300 ease-out hover:-translate-y-2 group">
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
                                <div key={task.id || taskIdx} className="scenario-card bg-white/60 backdrop-blur-2xl rounded-[35px] overflow-hidden shadow-xl border border-white/50 hover:shadow-2xl hover:bg-white/80 transition-all duration-300 ease-out flex flex-col relative z-10">
                                    <div className="bg-white/40 backdrop-blur-md p-8 border-b border-white/30">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white/80 flex items-center justify-center text-4xl shadow-sm border border-white/60">
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

                                    <div className="p-8 flex-1 bg-transparent">
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
                                                const isEvaluating = evaluatingSentence?.taskId === task.id && evaluatingSentence?.sentenceIndex === index;

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
                                                                <button onClick={() => { if(String(task.id) !== 'fake1') startRecording(task, index); }} className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm shadow-sm transition-all transform hover:scale-105 ${isRecording || isEvaluating || String(task.id).startsWith('fake') ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#b273c2] hover:bg-[#9d5fb0]'}`} title="Grabar tu voz" disabled={isRecording || isEvaluating}>
                                                                    🎙️
                                                                </button>
                                                            )}
                                                        </div>

                                                        <AnimatePresence>
                                                            {isEvaluating && (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, height: 0 }} 
                                                                    animate={{ opacity: 1, height: 'auto' }} 
                                                                    exit={{ opacity: 0, height: 0 }}
                                                                    className="mt-4 pt-4 border-t border-[#f0dff3] flex flex-col items-center justify-center overflow-hidden"
                                                                >
                                                                    <div className="flex space-x-2 my-2">
                                                                        <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-2.5 h-2.5 bg-[#b273c2] rounded-full shadow-[0_0_8px_#b273c2]" />
                                                                        <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2.5 h-2.5 bg-[#b273c2] rounded-full shadow-[0_0_8px_#b273c2]" />
                                                                        <motion.div animate={{ y: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2.5 h-2.5 bg-[#b273c2] rounded-full shadow-[0_0_8px_#b273c2]" />
                                                                    </div>
                                                                    <p className="text-xs text-[#b273c2] font-black uppercase tracking-widest mt-1">ANALIZANDO CON IA...</p>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>

                                                        <AnimatePresence>
                                                            {sentenceResult && !isEvaluating && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                                                    className="mt-4 pt-4 border-t border-[#f1e4f5] overflow-hidden"
                                                                >
                                                                    <div className="flex items-center justify-between mb-3">
                                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Puntuación</span>
                                                                        <div className="relative">
                                                                            <motion.span 
                                                                                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                                                                                className={`text-2xl font-black ${sentenceResult.evaluation.score >= 80 ? 'text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]' : sentenceResult.evaluation.score >= 50 ? 'text-yellow-500 drop-shadow-[0_0_5px_rgba(234,179,8,0.4)]' : 'text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]'}`}
                                                                            >
                                                                                {sentenceResult.evaluation.score}%
                                                                            </motion.span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {sentenceResult.evaluation.errors?.length > 0 ? (
                                                                        <div className="bg-white rounded-xl p-3 border border-red-100 shadow-sm">
                                                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                                                <span className="text-red-400">⚠️</span> OPORTUNIDAD DE MEJORA
                                                                            </p>
                                                                            <ul className="space-y-2">
                                                                                {sentenceResult.evaluation.errors.map((err, i) => (
                                                                                    <motion.li initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i*0.1) }} key={i} className="text-xs text-gray-600 bg-red-50 p-2 rounded-lg border border-red-50">
                                                                                        <span className="font-bold text-red-500 line-through opacity-80 mr-1">{err.word}</span>
                                                                                        <span className="font-medium text-gray-500">({err.reason === 'omitted' ? 'Omitido' : `Pronunciado como: '${err.reason.replace("mispronounced as ", "").replace(/'/g,"")}'`})</span>
                                                                                    </motion.li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    ) : (
                                                                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-green-50 rounded-xl p-3 border border-green-200 flex items-center gap-2 shadow-sm">
                                                                            <span className="text-xl">🌟</span>
                                                                            <p className="text-[11px] font-black text-green-600 uppercase tracking-widest">¡PRONUNCIACIÓN PERFECTA!</p>
                                                                        </motion.div>
                                                                    )}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
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