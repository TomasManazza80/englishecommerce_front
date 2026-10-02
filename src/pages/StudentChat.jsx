import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faPaperPlane, faRobot, faUser, faGraduationCap, faCheckCircle, faTimesCircle, faMicrophone, faVolumeUp, faVolumeMute, faHeadphones } from "@fortawesome/free-solid-svg-icons";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const StudentChat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { speakingActivities, courseName, courseInfo } = location.state || {};
    
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
    const [isAutoMode, setIsAutoMode] = useState(false);
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);
    const isAutoModeRef = useRef(false);
    const messagesRef = useRef([]);
    const inputRef = useRef("");
    const token = localStorage.getItem("token");

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        inputRef.current = input;
    }, [input]);

    const audioContextRef = useRef(null);
    const activeAudioSourceRef = useRef(null);
    const isVoiceEnabledRef = useRef(isVoiceEnabled);

    useEffect(() => {
        isVoiceEnabledRef.current = isVoiceEnabled;
    }, [isVoiceEnabled]);

    const silenceTimerRef = useRef(null);
    const accumulatedTranscriptRef = useRef("");

    const startVoiceRecording = () => {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.error("Speech recognition not supported");
                return;
            }
            
            if (!recognitionRef.current) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = true;       // stays on while you speak
                recognitionRef.current.interimResults = true;   // shows partial results
                recognitionRef.current.lang = 'en-US';

                recognitionRef.current.onstart = () => {
                    setIsRecording(true);
                    accumulatedTranscriptRef.current = "";
                };

                recognitionRef.current.onresult = (event) => {
                    // Accumulate the full transcript across all results
                    let fullTranscript = "";
                    for (let i = 0; i < event.results.length; i++) {
                        fullTranscript += event.results[i][0].transcript + " ";
                    }
                    accumulatedTranscriptRef.current = fullTranscript.trim();

                    // Reset the silence timer — user is still speaking
                    clearTimeout(silenceTimerRef.current);
                    silenceTimerRef.current = setTimeout(() => {
                        // 2.5 seconds of silence → stop and send
                        recognitionRef.current?.stop();
                        if (accumulatedTranscriptRef.current) {
                            handleSendInternal(accumulatedTranscriptRef.current, messagesRef.current);
                            accumulatedTranscriptRef.current = "";
                        }
                    }, 2500);
                };

                recognitionRef.current.onerror = (event) => {
                    console.error("Speech recognition error", event.error);
                    setIsRecording(false);
                    clearTimeout(silenceTimerRef.current);
                    if (isAutoModeRef.current) {
                        setTimeout(() => startVoiceRecording(), 1000);
                    }
                };

                recognitionRef.current.onend = () => {
                    setIsRecording(false);
                    clearTimeout(silenceTimerRef.current);
                };
            }
            
            recognitionRef.current.start();
        } catch (e) {
            console.error("Mic access denied or already started", e);
            setIsRecording(false);
        }
    };

    const stopVoiceRecording = () => {
        clearTimeout(silenceTimerRef.current);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    };

    const toggleRecording = () => {
        if (isRecording) {
            setIsAutoMode(false);
            isAutoModeRef.current = false;
            stopVoiceRecording();
        } else {
            setIsAutoMode(true);
            isAutoModeRef.current = true;
            startVoiceRecording();
        }
    };

    const playNaturalVoice = async (text, onEndedCallback = null) => {
        if (!isVoiceEnabledRef.current) {
            if (onEndedCallback) onEndedCallback();
            return;
        }
        try {
            if (activeAudioSourceRef.current) {
                try { activeAudioSourceRef.current.stop(); } catch (e) {}
            }
            const response = await axios.post(`${API_URL}/api/tts`, {
                text: text
            }, {
                responseType: 'arraybuffer'
            });

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const audioData = await audioContextRef.current.decodeAudioData(response.data);
            const source = audioContextRef.current.createBufferSource();
            activeAudioSourceRef.current = source;
            source.buffer = audioData;
            source.connect(audioContextRef.current.destination);
            source.onended = () => {
                if (activeAudioSourceRef.current === source) {
                    activeAudioSourceRef.current = null;
                }
                if (onEndedCallback) onEndedCallback();
            };
            source.start(0);
        } catch (e) {
            console.error("Error playing natural voice:", e);
            if (onEndedCallback) onEndedCallback();
        }
    };

    useEffect(() => {
        if (!speakingActivities || !courseName) {
            navigate("/mis-cursos");
            return;
        }

        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/pronunciation/chat-history/${encodeURIComponent(courseName)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.data && res.data.history && res.data.history.length > 0) {
                    setMessages(res.data.history);
                } else {
                    const initialGreeting = `Hi there! We are going to talk about "${courseName}". I will correct your grammar and vocabulary as we chat. Are you ready?`;
                    setMessages([
                        {
                            role: "ai",
                            content: initialGreeting
                        }
                    ]);
                    
                    setTimeout(() => {
                        playNaturalVoice(initialGreeting);
                    }, 500);
                }
            } catch (err) {
                console.error("Failed to load history", err);
                // Fallback to initial greeting
                const initialGreeting = `Hi there! We are going to talk about "${courseName}". I will correct your grammar and vocabulary as we chat. Are you ready?`;
                setMessages([{ role: "ai", content: initialGreeting }]);
            }
        };

        fetchHistory();

    }, [speakingActivities, courseName, navigate, token]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendInternal = async (userMsg, currentMsgs) => {
        if (!userMsg) return;
        setInput("");
        
        const newMessages = [...currentMsgs, { role: "user", content: userMsg }];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            const res = await axios.post(`${API_URL}/api/pronunciation/chat`, {
                history: newMessages,
                courseName,
                courseInfo,
                speakingActivities,
                activeQuestion
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: res.data.reply,
                    corrections: res.data.corrections
                }]);
                
                if (isVoiceEnabledRef.current) {
                    playNaturalVoice(res.data.reply, () => {
                        if (isAutoModeRef.current) {
                            startVoiceRecording();
                        }
                    });
                } else if (isAutoModeRef.current) {
                    startVoiceRecording();
                }
            }
        } catch (err) {
            console.error("Chat error:", err);
            setMessages(prev => [...prev, {
                role: "ai",
                content: "I'm sorry, I'm having trouble connecting right now. Please try again.",
                isError: true
            }]);
            // Restart mic on error if auto mode is on
            if (isAutoModeRef.current) {
                startVoiceRecording();
            }
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (e) => {
        if (e) e.preventDefault();
        if (!input.trim() || isTyping) return;
        handleSendInternal(input.trim(), messagesRef.current);
    };

    if (!speakingActivities || !courseName) return null;

    return (
        <div className="flex flex-col h-screen bg-[#f8f3f6]">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 flex items-center justify-between sticky top-0 z-10 border-b border-[#e8d1ed]">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-500 hover:bg-[#f0e0f5] hover:text-[#b273c2] transition-all">
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>
                    <div>
                        <h1 className="font-black text-gray-800 flex items-center gap-2 text-lg">
                            <FontAwesomeIcon icon={faRobot} className="text-[#b273c2]" /> AI English Tutor
                        </h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{courseName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            const newMode = !isAutoMode;
                            setIsAutoMode(newMode);
                            isAutoModeRef.current = newMode;
                            if (newMode && !isRecording) {
                                startVoiceRecording();
                            } else if (!newMode && isRecording) {
                                stopVoiceRecording();
                            }
                        }} 
                        className={`px-3 h-10 rounded-full flex items-center justify-center gap-2 font-bold text-xs transition-all shadow-sm ${isAutoMode ? 'bg-[#b273c2] text-white border-2 border-white' : 'bg-gray-50 text-gray-400 border border-gray-200'} hover:scale-105`}
                        title={isAutoMode ? "Hands-Free Mode ON" : "Turn ON Hands-Free Mode"}
                    >
                        <FontAwesomeIcon icon={faHeadphones} /> {isAutoMode ? "Auto: ON" : "Auto: OFF"}
                    </button>
                    
                    <button 
                        onClick={() => {
                            const newMode = !isVoiceEnabled;
                            setIsVoiceEnabled(newMode);
                            if (!newMode) {
                                if (activeAudioSourceRef.current) {
                                    try { activeAudioSourceRef.current.stop(); } catch (e) {}
                                    activeAudioSourceRef.current = null;
                                }
                                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                            }
                        }} 
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isVoiceEnabled ? 'bg-[#f0e0f5] text-[#b273c2]' : 'bg-gray-100 text-gray-400'} hover:scale-105`}
                        title={isVoiceEnabled ? "Mute AI Voice" : "Enable AI Voice"}
                    >
                        <FontAwesomeIcon icon={isVoiceEnabled ? faVolumeUp : faVolumeMute} />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                
                {/* Welcome & Objectives Card */}
                <div className="mr-auto max-w-2xl bg-white border border-[#e8d1ed] rounded-2xl rounded-tl-sm p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-[#f0e0f5] text-[#b273c2] flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={faRobot} className="text-xl" />
                        </div>
                        <div>
                            <h3 className="font-black text-[#1d1d1d] text-base">Welcome to your Exam!</h3>
                            <p className="text-xs text-gray-500">I will be your examiner today.</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                        In this session, we will talk about the course material. I will ask you the following questions:
                    </p>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#b273c2] mb-3 flex items-center gap-2">
                            <FontAwesomeIcon icon={faGraduationCap} /> Questions to Answer
                        </h4>
                        <ul className="space-y-2">
                            {speakingActivities.map((activity, idx) => (
                                <li 
                                    key={idx} 
                                    onClick={() => setActiveQuestion(activity)}
                                    className={`flex gap-3 text-sm p-3 rounded-xl cursor-pointer transition-all border ${
                                        activeQuestion === activity 
                                            ? "bg-[#b273c2] text-white border-[#b273c2] shadow-md transform scale-[1.02]" 
                                            : "bg-white text-gray-700 border-gray-200 hover:border-[#b273c2] hover:shadow-sm"
                                    }`}
                                >
                                    <span className={`font-black ${activeQuestion === activity ? "text-white" : "text-[#b273c2]"}`}>{idx + 1}.</span>
                                    <span>{typeof activity === 'object' ? (activity.title || activity.prompt || JSON.stringify(activity)) : activity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {messages.length === 0 && (
                        <div className="mt-4 text-center">
                            <p className="text-xs font-bold text-[#b273c2] animate-pulse">Press the microphone below and say "Hello" to start!</p>
                        </div>
                    )}
                </div>

                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col max-w-2xl ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                        <div className={`p-4 rounded-2xl shadow-sm ${
                            msg.role === "user" 
                                ? "bg-[#b273c2] text-white rounded-tr-sm" 
                                : msg.isError 
                                    ? "bg-red-50 text-red-500 border border-red-100 rounded-tl-sm"
                                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                        }`}>
                            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        
                        {/* Corrections Module */}
                        {msg.role === "ai" && msg.corrections && msg.corrections.length > 0 && (
                            <div className="mt-2 w-full bg-white border border-[#e8d1ed] rounded-xl p-3 shadow-sm">
                                <h4 className="text-xs font-black uppercase tracking-widest text-[#b273c2] mb-2 flex items-center gap-1">
                                    <FontAwesomeIcon icon={faGraduationCap} /> Teacher's Notes
                                </h4>
                                <ul className="space-y-2">
                                    {msg.corrections.map((corr, i) => (
                                        <li key={i} className="text-xs">
                                            <div className="flex items-start gap-2 mb-1">
                                                <FontAwesomeIcon icon={faTimesCircle} className="text-red-400 mt-0.5 shrink-0" />
                                                <span className="text-gray-500 line-through">{corr.incorrect}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mt-0.5 shrink-0" />
                                                <span className="font-bold text-gray-800">{corr.correct}</span>
                                            </div>
                                            {corr.explanation && (
                                                <p className="text-gray-500 mt-1 pl-6 italic">{corr.explanation}</p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
                
                {isTyping && (
                    <div className="mr-auto bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#b273c2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-[#b273c2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-[#b273c2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-100 p-4">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-full p-2 pr-3 focus-within:ring-2 focus-within:ring-[#b273c2]/30 focus-within:border-[#b273c2] transition-all">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 shrink-0 shadow-sm">
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message here..." 
                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none text-gray-800"
                        autoFocus
                    />
                    <button 
                        type="button" 
                        onClick={toggleRecording}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-white text-gray-400 hover:text-[#b273c2]'}`}
                        title="Dictate with voice"
                    >
                        <FontAwesomeIcon icon={faMicrophone} />
                    </button>
                    <button 
                        type="submit" 
                        disabled={!input.trim() || isTyping}
                        className="w-10 h-10 rounded-full bg-[#b273c2] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#9c63ad] transition-all shadow-md transform hover:scale-105"
                    >
                        <FontAwesomeIcon icon={faPaperPlane} className="-ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentChat;
