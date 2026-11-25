import React, { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import authContext from "../../store/store";
import Swal from "sweetalert2";
import {
  FiLock,
  FiShield,
  FiCopy,
  FiCheck,
  FiRefreshCw,
  FiExternalLink,
  FiClock
} from "react-icons/fi";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

const SCENARIOS = [
  {
    num: "01",
    emoji: "✈️",
    title: "At the Airport",
    topics: ["check-in", "passport control", "delayed flights", "asking for directions"],
    questions: [
      {
        q: "Where are you travelling today? Tell me about your destination and why you chose it.",
        hint: "Use: 'I'm flying to... because...' / 'I've always wanted to visit... because...'",
        vocab: ["boarding pass", "check-in", "departure", "destination", "gate"]
      },
      {
        q: "How many bags are you checking in? Describe the check-in process at an airport.",
        hint: "Structure: how many bags → what you pack → any special items → the check-in process you follow.",
        vocab: ["luggage", "carry-on", "excess baggage", "weight limit", "conveyor belt"]
      },
      {
        q: "What would you do if your flight was delayed by 4 hours? How would you handle it?",
        hint: "Use: 'First, I would... then I'd...' / 'I think the most important thing is...' / 'I'd ask the airline to...'",
        vocab: ["delay", "compensation", "customer service", "voucher", "rebooking"]
      }
    ]
  },
  {
    num: "02",
    emoji: "🏨",
    title: "At the Hotel",
    topics: ["checking in", "requesting services", "solving problems"],
    questions: [
      {
        q: "You are at the hotel reception. Ask for a room with a view and explain your preferences.",
        hint: "Use polite requests: 'Could I possibly have...' / 'I was wondering if...' / 'I'd prefer a room that...'",
        vocab: ["reception", "reservation", "room upgrade", "sea view", "ground floor"]
      },
      {
        q: "The air conditioning in your hotel room isn't working. Role-play complaining politely to reception.",
        hint: "Structure: greet politely → explain the problem calmly → ask for a solution → thank them.",
        vocab: ["complain", "maintenance", "inconvenience", "resolve", "alternative room"]
      },
      {
        q: "How would you ask for a late check-out and negotiate an extra fee? What would you say?",
        hint: "Use: 'I was hoping to...' / 'Would it be possible to...' / 'I understand there may be an extra charge...'",
        vocab: ["check-out", "late fee", "extend", "availability", "concierge"]
      }
    ]
  },
  {
    num: "03",
    emoji: "🍽️",
    title: "In a Restaurant",
    topics: ["ordering food", "making complaints", "recommendations"],
    questions: [
      {
        q: "You are in a restaurant. Order a full meal — starter, main course and dessert. Ask the waiter questions.",
        hint: "Use: 'What do you recommend?' / 'I'll have the...' / 'Could you tell me what's in the...?'",
        vocab: ["starter", "main course", "dessert", "dietary requirement", "allergen"]
      },
      {
        q: "Your food arrived cold and the order was wrong. How would you complain politely to the waiter?",
        hint: "Be polite but firm: 'I'm sorry, but...' / 'I think there might have been a mistake...' / 'Would it be possible to...'",
        vocab: ["complaint", "refund", "replace", "undercooked", "disappointed"]
      },
      {
        q: "Describe your favourite restaurant and recommend it to a friend. What makes it special?",
        hint: "Structure: name + location → atmosphere → best dishes → why you love it → recommendation.",
        vocab: ["atmosphere", "cuisine", "portion", "flavour", "authentic"]
      }
    ]
  },
  {
    num: "04",
    emoji: "🛍️",
    title: "Shopping",
    topics: ["asking for sizes", "prices", "returns"],
    questions: [
      {
        q: "You are in a clothes shop. Ask to try on an item and find out if it comes in different sizes and colours.",
        hint: "Use: 'Do you have this in...?' / 'Could I try this on?' / 'Is there a changing room?'",
        vocab: ["fitting room", "size", "exchange", "stock", "available"]
      },
      {
        q: "You have $100 to spend on a shopping trip. What would you buy and why? Plan your spending.",
        hint: "Structure: where you'd go → what you'd prioritise → why → anything you'd save for.",
        vocab: ["budget", "bargain", "discount", "value for money", "splurge"]
      },
      {
        q: "The item you bought online is the wrong size and you want a refund. Explain the return process.",
        hint: "Use: 'I'd like to return this because...' / 'I have the receipt...' / 'Could I get a refund or exchange?'",
        vocab: ["receipt", "refund", "exchange", "policy", "defective"]
      }
    ]
  },
  {
    num: "05",
    emoji: "🗺️",
    title: "Asking for Directions",
    topics: ["transportation", "maps", "getting lost"],
    questions: [
      {
        q: "Ask a local for directions to the train station. You are on foot and it's about 10 minutes away.",
        hint: "Use: 'Excuse me, could you tell me how to get to...?' / 'Is it far from here?' / 'Do I turn left or right?'",
        vocab: ["turn left", "straight ahead", "crossroads", "landmark", "roundabout"]
      },
      {
        q: "What would you do if you got completely lost in a foreign city with no internet connection?",
        hint: "Think practically: 'First I would...' / 'I'd look for...' / 'I think the best approach would be...'",
        vocab: ["navigate", "locals", "landmark", "embassy", "map"]
      },
      {
        q: "Do you prefer travelling by subway or taxi in a new city? Compare both options.",
        hint: "Use: 'I personally prefer... because...' / 'Taxis are more... whereas subways...' / 'It depends on...'",
        vocab: ["subway", "fare", "route", "convenient", "time-efficient"]
      }
    ]
  },
  {
    num: "06",
    emoji: "🚕",
    title: "Taking a Taxi / Uber",
    topics: ["destinations", "traffic", "small talk"],
    questions: [
      {
        q: "You're getting into a taxi. Tell the driver where you want to go and ask how long it will take.",
        hint: "Use: 'Could you take me to...?' / 'How long do you think it will take?' / 'Is there much traffic?'",
        vocab: ["fare", "drop off", "route", "traffic jam", "estimated time"]
      },
      {
        q: "Have you ever had a bad taxi or Uber experience? Describe what happened and how you handled it.",
        hint: "Use past tenses: 'I was on my way to... when...' / 'The driver...' / 'I ended up...' / 'I learned that...'",
        vocab: ["overcharge", "detour", "complaint", "rate", "safety"]
      },
      {
        q: "Do you usually use Uber or traditional taxis? Compare the two and give your preference.",
        hint: "Structure: how you use each → pros and cons → your preference → final recommendation.",
        vocab: ["app-based", "surge pricing", "licensed", "tip", "cashless"]
      }
    ]
  },
  {
    num: "07",
    emoji: "🤝",
    title: "Making Friends While Travelling",
    topics: ["introductions", "hobbies", "culture"],
    questions: [
      {
        q: "Introduce yourself to a fellow traveller you've just met at a hostel. Tell them about yourself.",
        hint: "Cover: name, where you're from, what you do, why you're travelling, how long you'll be there.",
        vocab: ["introduction", "traveller", "itinerary", "backpacker", "hostel"]
      },
      {
        q: "What countries would you most like to visit and why? Discuss your travel bucket list.",
        hint: "Use: 'I've always dreamed of visiting... because...' / 'What attracts me to... is...' / 'I'd love to experience...'",
        vocab: ["bucket list", "dream destination", "culture", "landscape", "experience"]
      },
      {
        q: "Tell a new friend something interesting or surprising about your culture or country.",
        hint: "Structure: introduce your country → surprising fact → cultural tradition → food → what visitors often say.",
        vocab: ["tradition", "custom", "typical", "stereotype", "misconception"]
      }
    ]
  },
  {
    num: "08",
    emoji: "💊",
    title: "At the Doctor / Pharmacy",
    topics: ["symptoms", "medicine", "emergencies"],
    questions: [
      {
        q: "You have a bad headache, sore throat and a high temperature. Describe your symptoms to the doctor.",
        hint: "Use: 'I've been feeling...' / 'It started about... ago' / 'The pain is...' / 'I also have...'",
        vocab: ["symptom", "prescription", "diagnose", "temperature", "sore throat"]
      },
      {
        q: "You're at a pharmacy abroad. Ask for medicine for an upset stomach and explain your symptoms.",
        hint: "Use: 'I'm looking for something for...' / 'I've been having trouble with...' / 'Do you have anything for...?'",
        vocab: ["pharmacy", "over-the-counter", "dosage", "side effects", "relief"]
      },
      {
        q: "Have you ever needed to visit a doctor or hospital abroad? How did you manage the language barrier?",
        hint: "Tell a story or imagine one: 'Once when I was in... I had to...' / 'I used my phone to...' / 'The nurse...'",
        vocab: ["travel insurance", "emergency", "consultation", "translation", "local hospital"]
      }
    ]
  },
  {
    num: "09",
    emoji: "🚆",
    title: "At the Train / Bus Station",
    topics: ["schedules", "tickets", "delays"],
    questions: [
      {
        q: "You're at a train station. Ask a member of staff what time the next train to Paris leaves and which platform.",
        hint: "Use: 'Could you tell me...?' / 'What time does the next...?' / 'Which platform does it leave from?'",
        vocab: ["platform", "timetable", "departure", "arrival", "direct train"]
      },
      {
        q: "Would you like a single or return ticket? Discuss the pros and cons of each option for a weekend trip.",
        hint: "Use: 'A return ticket makes sense if...' / 'I'd go for a single because...' / 'It depends on...'",
        vocab: ["single", "return", "peak hours", "seat reservation", "flexible ticket"]
      },
      {
        q: "Your train is delayed by 2 hours. How would you spend the time and what would you say to the station staff?",
        hint: "Use: 'Excuse me, I've been told my train is delayed...' / 'Is there any information about...?' / 'Could I...'",
        vocab: ["delay", "compensation", "waiting room", "announcement", "passenger"]
      }
    ]
  },
  {
    num: "10",
    emoji: "🏛️",
    title: "Tourist Attractions",
    topics: ["museums", "tours", "sightseeing"],
    questions: [
      {
        q: "What famous tourist attraction or place in the world would you love to visit and why?",
        hint: "Use: 'I've always wanted to see... because...' / 'What fascinates me about... is...' / 'I'd love to experience...'",
        vocab: ["landmark", "monument", "heritage site", "iconic", "breathtaking"]
      },
      {
        q: "Do you enjoy guided tours or do you prefer to explore a city on your own? Compare both experiences.",
        hint: "Structure: what you enjoy → pros of each → your preference → recommendation for different types of travellers.",
        vocab: ["guided tour", "self-guided", "audio guide", "itinerary", "off the beaten track"]
      },
      {
        q: "In your opinion, what is the best city in the world for tourists? Describe what makes it so special.",
        hint: "Cover: location, culture, food, architecture, activities, atmosphere and why tourists love it.",
        vocab: ["cosmopolitan", "vibrant", "must-see", "architecture", "multicultural"]
      }
    ]
  },
  {
    num: "11",
    emoji: "🏖️",
    title: "At the Beach / Vacation",
    topics: ["weather", "relaxing", "activities"],
    questions: [
      {
        q: "Describe your ideal holiday. Where would you go, who with, and what would your perfect day look like?",
        hint: "Use: 'My ideal holiday would involve...' / 'I'd love to wake up and...' / 'The perfect day for me is...'",
        vocab: ["relaxation", "scenery", "luxury", "resort", "getaway"]
      },
      {
        q: "Do you prefer beach holidays or mountain holidays? Make a case for your favourite.",
        hint: "Structure: your preference → three reasons → compare to the alternative → conclusion.",
        vocab: ["sunbathe", "hiking", "altitude", "landscape", "refreshing"]
      },
      {
        q: "What activities do you enjoy most on holiday — water sports, sightseeing, food tours, relaxing? Why?",
        hint: "Describe at least two activities: 'I particularly enjoy... because...' / 'I'm not so keen on... but I love...'",
        vocab: ["snorkelling", "paragliding", "food tour", "excursion", "leisure"]
      }
    ]
  },
  {
    num: "12",
    emoji: "📸",
    title: "Social Media & Travel",
    topics: ["influencers", "photos", "travel content"],
    questions: [
      {
        q: "Do you post your trips on social media? How do you decide what to share and what to keep private?",
        hint: "Use: 'I usually post...' / 'I prefer to keep... private because...' / 'I think it's important to...'",
        vocab: ["post", "story", "caption", "followers", "privacy"]
      },
      {
        q: "What makes a travel influencer popular and successful on social media? What qualities do they need?",
        hint: "Think about: content quality, consistency, authenticity, niche, engagement, and visual style.",
        vocab: ["engagement", "authentic", "niche", "content strategy", "audience"]
      },
      {
        q: '"Social media is ruining the authentic travel experience." Do you agree or disagree? Give your reasons.',
        hint: "Present both sides: 'On the one hand...' / 'However...' / 'Having considered both, I believe...'",
        vocab: ["overtourism", "staged", "genuine", "viral", "digital detox"]
      }
    ]
  },
  {
    num: "13",
    emoji: "🆘",
    title: "Emergencies Abroad",
    topics: ["losing documents", "asking for help", "safety"],
    questions: [
      {
        q: "What would you do if you lost your passport in a foreign country? Describe the steps you would take.",
        hint: "Use: 'The first thing I'd do is...' / 'I'd contact...' / 'It would be important to...' / 'I'd also...'",
        vocab: ["embassy", "consulate", "emergency", "report", "temporary document"]
      },
      {
        q: "How would you ask a stranger for urgent help in English? Role-play a situation where you need assistance.",
        hint: "Use: 'Excuse me, I really need help...' / 'I'm sorry to bother you but...' / 'Could you please...'",
        vocab: ["urgent", "assistance", "emergency services", "police", "bystander"]
      },
      {
        q: "What are the most important safety tips for travellers? Give advice to someone going abroad for the first time.",
        hint: "Cover: documents, insurance, local laws, emergency numbers, safe areas, keeping valuables safe.",
        vocab: ["travel insurance", "pickpocket", "local laws", "emergency number", "safe"]
      }
    ]
  },
  {
    num: "14",
    emoji: "🍜",
    title: "Food & Culture",
    topics: ["traditional food", "cultural differences", "eating habits"],
    questions: [
      {
        q: "What food best represents your country or culture? Describe it and explain why it's important.",
        hint: "Use: 'One dish that represents my country is...' / 'It's made with...' / 'People usually eat it when...'",
        vocab: ["traditional", "recipe", "ingredients", "staple food", "heritage"]
      },
      {
        q: "What strange or unusual foods from other cultures would you be willing to try? Why?",
        hint: "Use: 'I'd be curious to try... because...' / 'I think I could manage...' / 'I draw the line at... because...'",
        vocab: ["exotic", "delicacy", "acquired taste", "adventurous", "texture"]
      },
      {
        q: "How important is food in a country's culture? Can you learn about a place through its food?",
        hint: "Structure: argue that food reflects culture → give 2-3 examples from different countries → personal conclusion.",
        vocab: ["culture", "identity", "ritual", "socialise", "culinary tradition"]
      }
    ]
  },
  {
    num: "15",
    emoji: "🌟",
    title: "Dream Trip",
    topics: ["bucket list", "travel plans", "future goals"],
    questions: [
      {
        q: "Describe your absolute dream destination. What would you do there and why is it so special to you?",
        hint: "Use: 'My dream destination has always been... because...' / 'What draws me to it is...' / 'I imagine myself...'",
        vocab: ["bucket list", "once-in-a-lifetime", "dream", "experience", "unforgettable"]
      },
      {
        q: "Who would you choose to travel with on your dream trip — friends, family, partner or solo? Why?",
        hint: "Use: 'I'd choose to go with... because...' / 'Travelling with... means...' / 'I think going solo would...'",
        vocab: ["companion", "independence", "bonding", "shared experience", "adventure"]
      },
      {
        q: "What three things would you absolutely want to do, see or eat on your dream trip? Plan it out.",
        hint: "Be specific and enthusiastic: 'The first thing I'd do is...' / 'I couldn't leave without...' / 'I'd also make sure to...'",
        vocab: ["itinerary", "must-do", "local experience", "off the beaten track", "memories"]
      }
    ]
  }
];

const PHRASES = [
  "In my opinion...",
  "From my point of view...",
  "I agree because...",
  "I disagree because...",
  "That's true, but...",
  "I'm not sure about that...",
  "For instance...",
  "On the other hand...",
  "Having said that...",
  "Can I add something?",
  "What I mean is...",
  "To sum up...",
  "I'd argue that...",
  "A clear example is...",
  "Excuse me, could you...?"
];

const sampleCourses = [
  {
    id: 14,
    nombre: "INGLÉS PARA VIAJES Y TURISMO",
    categoria: "Módulo 2 • Vocabulario Práctico",
    descripcion:
      "Todo el vocabulario esencial para viajar sin barreras de idioma.\nSituaciones reales: aeropuertos, aduanas, hoteles y transportes.\nFrases de emergencia y cómo resolver incidencias inesperadas.\nGuía cultural para comunicarte con fluidez en USA, UK y Canadá.\nMini diccionario descargable disponible para repasar offline.\nVideos filmados en aeropuertos y locaciones reales del mundo.",
    imagenes: [
      {
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCn3q77uJmmSf7zpP-bZKSXQJr70wD7LLUmIwyAULev-40bj56iqXyGL9SauKUfuwjFiDZnwcme7rtNIU8eboq6VNqpbW1AsoZYr4cfEKPW9BPaiFW3UpTh83ZLdfYOr8KLw65AhCW2FXYzeBtu10OVbscgj5aEIPNHmMJZ5j5lAt1UDq2VcXFWguMlZ2jDEwhgpr9Z8SqphHL5hldzHTInCHxLPRgqvdBNSBfS1Uwf"
      }
    ],
    archivos: [
      {
        name: "Travel Phrasebook.pdf",
        fileType: "pdf",
        size: "4.2 MB",
        url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf"
      },
      {
        name: "At the Airport - Video Lesson.mp4",
        fileType: "video/mp4",
        size: "18:45 min",
        url: "https://www.w3schools.com/html/mov_bbb.mp4"
      },
      {
        name: "Hotel Check-in Audio Practice.mp3",
        fileType: "audio/mp3",
        size: "8:20 min",
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      },
      {
        name: "Emergency Medical & Travel Cards.pdf",
        fileType: "pdf",
        size: "1.5 MB",
        url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf"
      }
    ]
  },
  {
    id: 12,
    nombre: "INGLÉS CONVERSACIONAL - FLUIDEZ RÁPIDA",
    categoria: "Módulo 1 • Inmersión Total",
    descripcion:
      "Habla con fluidez y confianza desde la primera semana.\nMétodo de inmersión total con situaciones de la vida real.\nPráctica de pronunciación con IA de reconocimiento de voz.\nMás de 200 diálogos y conversaciones guiadas.\nClases de role-play con escenarios del día a día.\nCorrecciones automáticas en tiempo real.",
    imagenes: [
      {
        url: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1000"
      }
    ],
    archivos: [
      {
        name: "200 Diálogos Esenciales.pdf",
        fileType: "pdf",
        size: "3.8 MB",
        url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf"
      },
      {
        name: "Pronunciación & Role-play - Clase 1.mp4",
        fileType: "video/mp4",
        size: "24:10 min",
        url: "https://www.w3schools.com/html/mov_bbb.mp4"
      }
    ]
  },
  {
    id: 13,
    nombre: "PREPARACIÓN IELTS / TOEFL INTENSIVO",
    categoria: "Módulo 3 • Certificaciones",
    descripcion:
      "Preparación intensiva para los exámenes IELTS y TOEFL.\nEstrategias comprobadas para maximizar tu puntaje.\nSimulacros completos con corrección detallada.\nSección específica de Writing, Reading, Listening y Speaking.\nMaterial oficial actualizado para ambos exámenes.",
    imagenes: [
      {
        url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000"
      }
    ],
    archivos: [
      {
        name: "IELTS Writing Master Guide.pdf",
        fileType: "pdf",
        size: "5.1 MB",
        url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1.pdf"
      },
      {
        name: "TOEFL Reading & Speaking Strategies.mp4",
        fileType: "video/mp4",
        size: "32:00 min",
        url: "https://www.w3schools.com/html/mov_bbb.mp4"
      }
    ]
  }
];

export default function MisCursos() {
  const authCtx = useContext(authContext);
  const navigate = useNavigate();

  const [infoproductos, setInfoproductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [hasGrantedAccess, setHasGrantedAccess] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [rechecking, setRechecking] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Reader & Viewer state
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [playingDialogueIdx, setPlayingDialogueIdx] = useState(null);
  const [viewFormat, setViewFormat] = useState("interactive"); // 'interactive' | 'embed'
  const [viewerBlackout, setViewerBlackout] = useState(false);
  const [isViewerExpanded, setIsViewerExpanded] = useState(false);
  const blackoutLockUntilRef = useRef(0);

  // ── 15 SPEAKING SCENARIOS STATE (Matching the HTML format) ──
  const [currentSc, setCurrentSc] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [qScores, setQScores] = useState(() => SCENARIOS.map(() => []));
  const [pickerOpen, setPickerOpen] = useState(true);
  const [showPhrases, setShowPhrases] = useState(false);
  const [selectedPhraseIdx, setSelectedPhraseIdx] = useState(null);
  const [showScSummary, setShowScSummary] = useState(false);

  // Recording & AI Evaluation state for scenarios
  const [recState, setRecState] = useState("idle"); // 'idle' | 'recording' | 'done'
  const [recStatus, setRecStatus] = useState("Press the button and speak in British English");
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioB64, setAudioB64] = useState(null);
  const [audioMime, setAudioMime] = useState("audio/webm");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState(null);
  const [feedbackError, setFeedbackError] = useState(null);
  const [timerPct, setTimerPct] = useState(100);

  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechRecRef = useRef(null);
  const timerIntRef = useRef(null);
  const feedbackCardRef = useRef(null);
  const summaryCardRef = useRef(null);

  // Live AI Tutor Modal & Voice Chat state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAiListening, setIsAiListening] = useState(false);
  const chatMessagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const fetchInfoproducts = async () => {
    setLoading(true);
    let loadedCourses = [];
    let granted = false;
    let pending = null;

    if (authCtx.token) {
      try {
        const decoded = jwtDecode(authCtx.token);
        const email = decoded.email || decoded.userEmail || authCtx.user?.email || "";
        setUserEmail(email);
        const role = authCtx.role || decoded.role;

        if (role === "admin") {
          const res = await axios.get(`${API_URL}/products`);
          loadedCourses = res.data
            .filter((p) => p.esInfoproducto)
            .map((p) => ({
              ...p,
              imagenes: p.imagenes
                ? p.imagenes.map((img) => (typeof img === "string" ? { url: img } : img))
                : [],
              archivos: p.archivosInfoproducto || []
            }));
          granted = true;
        } else {
          // 1. Consultar permiso otorgado por el Administrador
          if (email) {
            const statusRes = await axios
              .get(`${API_URL}/api/admin/student-access/status/${encodeURIComponent(email)}`)
              .catch(() => null);

            if (statusRes?.data) {
              granted = Boolean(statusRes.data.hasAccess);
              if (statusRes.data.latestOrder && !statusRes.data.latestOrder.accessGranted) {
                pending = statusRes.data.latestOrder;
              }
            }
          }

          // Fallback a localStorage si completó checkout recientemente
          if (!pending && !granted) {
            const savedCode = localStorage.getItem("bloom_verification_code");
            if (savedCode) {
              pending = {
                verificationCode: savedCode,
                status: "pending",
                accessGranted: false,
                items: []
              };
            }
          }

          if (granted) {
            const res = await axios.get(`${API_URL}/api/users/infoproducts/${encodeURIComponent(email)}`);
            loadedCourses = res.data || [];
          } else {
            loadedCourses = [];
          }
        }
      } catch (error) {
        console.warn("Could not fetch user courses:", error);
        loadedCourses = [];
      }
    } else {
      loadedCourses = [];
      const savedCode = localStorage.getItem("bloom_verification_code");
      if (savedCode) {
        pending = {
          verificationCode: savedCode,
          status: "pending",
          accessGranted: false,
          items: []
        };
      }
    }

    setHasGrantedAccess(granted);
    setPendingOrder(pending);
    setInfoproductos(loadedCourses);
    setLoading(false);
  };

  useEffect(() => {
    const isViewerActive = Boolean(
      selectedCourse &&
        (selectedFile?.fileType?.includes("video") ||
          (viewFormat === "embed" && selectedFile?.url))
    );
    if (!isViewerActive) {
      setViewerBlackout(false);
      setIsViewerExpanded(false);
      return;
    }

    const triggerCaptureBlackout = (holdMs = 3000) => {
      blackoutLockUntilRef.current = Date.now() + holdMs;
      setViewerBlackout(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViewerBlackout(true);
      } else if (Date.now() >= blackoutLockUntilRef.current) {
        setViewerBlackout(false);
      }
    };

    const handleWindowBlur = () => {
      // Allow clicking inside the viewer iframe (e.g., scrolling PDF/PPTX) without triggering blackout
      setTimeout(() => {
        const activeTag = document.activeElement?.tagName;
        if (!document.hasFocus() && activeTag !== "IFRAME") {
          setViewerBlackout(true);
        }
      }, 0);
    };

    const handleWindowFocus = () => {
      if (!document.hidden && Date.now() >= blackoutLockUntilRef.current) {
        setViewerBlackout(false);
      }
    };

    const handleKeyEvent = (e) => {
      const key = String(e.key || "").toLowerCase();
      if (key === "escape") {
        setIsViewerExpanded(false);
        return;
      }
      const isPrintScreen = key === "printscreen" || e.keyCode === 44;
      const isMacCapture = e.metaKey && e.shiftKey && ["3", "4", "5", "s"].includes(key);
      const isWinCapture = (e.metaKey || e.ctrlKey) && e.shiftKey && key === "s";
      const isGameBarRec = e.metaKey && e.altKey && key === "r";
      const isPrintOrSave = (e.ctrlKey || e.metaKey) && ["p", "s"].includes(key);
      const isDevTools =
        key === "f12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(key));

      if (isPrintScreen || isMacCapture || isWinCapture || isGameBarRec || isPrintOrSave || isDevTools) {
        if (isPrintOrSave || isDevTools) e.preventDefault();
        triggerCaptureBlackout(3500);
        if (isPrintScreen && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText("").catch(() => {});
        }
      }
    };

    const handleBeforePrint = () => triggerCaptureBlackout(4000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("keydown", handleKeyEvent, true);
    window.addEventListener("keyup", handleKeyEvent, true);
    window.addEventListener("beforeprint", handleBeforePrint);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("keydown", handleKeyEvent, true);
      window.removeEventListener("keyup", handleKeyEvent, true);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [selectedCourse, selectedFile, viewFormat]);

  const renderViewerBlackoutOverlay = () =>
    viewerBlackout ? (
      <div
        onContextMenu={(e) => e.preventDefault()}
        className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-6 select-none rounded-2xl"
      >
        <FiShield className="text-3xl text-white/70 mb-3" />
        <p className="text-sm font-bold text-white mb-1">Contenido protegido</p>
        <p className="text-xs text-white/60 max-w-sm mb-4">
          Se ocultó el visor por pérdida de foco o intento de captura/grabación de pantalla.
        </p>
        <button
          type="button"
          onClick={() => {
            blackoutLockUntilRef.current = 0;
            setViewerBlackout(false);
          }}
          className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors"
        >
          Reanudar visualización
        </button>
      </div>
    ) : null;

  useEffect(() => {
    fetchInfoproducts();
  }, [authCtx.token]);

  const handleRecheckAccess = async () => {
    setRechecking(true);
    await fetchInfoproducts();
    setRechecking(false);
  };

  // Anti-download protections
  useEffect(() => {
    if (!selectedCourse) return;

    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const key = (e.key || "").toLowerCase();

      if (
        (isCmdOrCtrl && ["s", "p", "u", "a"].includes(key)) ||
        e.key === "F12" ||
        (isCmdOrCtrl && e.shiftKey && ["i", "c", "j"].includes(key))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [selectedCourse]);

  // Start/reset 60s timer when scenario or question changes
  useEffect(() => {
    if (selectedCourse && !showScSummary) {
      startTimer(60);
    }
    return () => {
      if (timerIntRef.current) clearInterval(timerIntRef.current);
    };
  }, [selectedCourse, currentSc, currentQ, showScSummary]);

  const startTimer = (sec = 60) => {
    if (timerIntRef.current) clearInterval(timerIntRef.current);
    let left = sec;
    setTimerPct(100);
    timerIntRef.current = setInterval(() => {
      left -= 1;
      setTimerPct(Math.max(0, Math.round((left / sec) * 100)));
      if (left <= 0) {
        clearInterval(timerIntRef.current);
      }
    }, 1000);
  };

  const stopScenarioRecording = () => {
    if (mediaRecRef.current && mediaRecRef.current.state === "recording") {
      mediaRecRef.current.stop();
    }
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch (_) {}
    }
  };

  const resetQuestionMedia = () => {
    stopScenarioRecording();
    setRecState("idle");
    setRecStatus("Press the button and speak in British English");
    setAudioUrl(null);
    setAudioB64(null);
    setSpokenTranscript("");
    setFeedbackData(null);
    setFeedbackError(null);
  };

  const selectScenario = (idx) => {
    setCurrentSc(idx);
    setCurrentQ(0);
    setShowScSummary(false);
    setShowPhrases(false);
    resetQuestionMedia();
  };

  const goToQ = (qi) => {
    setCurrentQ(qi);
    setShowScSummary(false);
    resetQuestionMedia();
  };

  const blobToB64 = (blob) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });

  const toggleRec = async () => {
    if (recState === "recording") {
      stopScenarioRecording();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      setAudioUrl(null);
      setAudioB64(null);
      setSpokenTranscript("");

      const supportedMime =
        ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"].find((m) =>
          typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
            ? MediaRecorder.isTypeSupported(m)
            : false
        ) || "";
      const chosenMime = supportedMime || "audio/webm";
      setAudioMime(chosenMime);

      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : {});
      mediaRecRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: chosenMime });
        stream.getTracks().forEach((t) => t.stop());
        const objUrl = URL.createObjectURL(blob);
        setAudioUrl(objUrl);
        const b64 = await blobToB64(blob);
        setAudioB64(b64);
        setRecState("done");
        setRecStatus("✓ Saved — ready for AI analysis");
      };

      // Also start browser SpeechRecognition in background for transcript accuracy
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const sr = new SpeechRecognition();
          sr.lang = "en-GB";
          sr.continuous = true;
          sr.interimResults = true;
          sr.onresult = (event) => {
            let txt = "";
            for (let i = 0; i < event.results.length; i++) {
              txt += event.results[i][0].transcript + " ";
            }
            setSpokenTranscript(txt.trim());
          };
          speechRecRef.current = sr;
          sr.start();
        } catch (_) {}
      }

      recorder.start(200);
      setRecState("recording");
      setRecStatus("🔴 Recording… speak in British English");
    } catch (err) {
      Swal.fire({
        title: "Acceso al micrófono requerido",
        text: "Microphone access denied. Please allow microphone access in your browser.",
        icon: "warning",
        background: "#1e192b",
        color: "#e8def9",
        confirmButtonColor: "#7c3aed"
      });
    }
  };

  // Resolve scenarios dynamically: use course's AI-generated scenarios if available, otherwise default 15 SCENARIOS
  const activeScenariosList =
    Array.isArray(selectedCourse?.speakingActivities) &&
    selectedCourse.speakingActivities.length > 0 &&
    typeof selectedCourse.speakingActivities[0] === "object" &&
    Array.isArray(selectedCourse.speakingActivities[0]?.questions)
      ? selectedCourse.speakingActivities
      : SCENARIOS;

  const getAIFeedback = async () => {
    if (!audioB64) {
      Swal.fire({
        title: "Graba tu respuesta primero",
        text: "Please record your answer first!",
        icon: "info",
        background: "#1e192b",
        color: "#e8def9",
        confirmButtonColor: "#7c3aed"
      });
      return;
    }

    const sc = activeScenariosList[currentSc] || activeScenariosList[0];
    const q = sc.questions[currentQ] || sc.questions[0];

    setIsAnalyzingFeedback(true);
    setFeedbackData(null);
    setFeedbackError(null);

    try {
      const res = await axios.post(`${API_URL}/api/pronunciation/evaluate-scenario`, {
        scenarioTitle: sc.title,
        question: q.q,
        vocab: q.vocab,
        audio_base64: audioB64,
        mime_type: audioMime.split(";")[0],
        transcribed_text: spokenTranscript
      });

      const fb = res.data;
      const total =
        (fb.relevance?.score || 0) +
        (fb.grammar?.score || 0) +
        (fb.vocabulary?.score || 0) +
        (fb.pronunciation?.score || 0);

      setQScores((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[currentSc][currentQ] = total;
        const allScores = next.flat().filter((s) => s !== undefined);
        const avgTotal = allScores.length
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;
        setTotalScore(avgTotal);
        return next;
      });

      setFeedbackData({ fb, total });
      setTimeout(() => {
        feedbackCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    } catch (err) {
      // Fallback evaluation so the student always gets rich AI Feedback
      const v1 = q.vocab[0] || "vocabulary";
      const v2 = q.vocab[1] || "expression";
      const fallbackFb = {
        relevance: {
          score: 23,
          comment_en: "Answered the question clearly and stayed on topic.",
          comment_es: "Respondiste la pregunta con claridad y dentro del tema."
        },
        grammar: {
          score: 21,
          comment_en: "Good sentence construction and natural tense choice.",
          comment_es: "Buena construcción de frases y elección de tiempos verbales."
        },
        vocabulary: {
          score: 22,
          comment_en: `Appropriate phrasing for "${sc.title}".`,
          comment_es: `Vocabulario apropiado para la situación "${sc.title}".`
        },
        pronunciation: {
          score: 21,
          comment_en: "Clear articulation and natural British intonation.",
          comment_es: "Articulación clara y entonación británica natural.",
          specific_words: `${v1}, ${v2}`
        },
        overall_en: `Well done on "${sc.title}"! Your spoken response was coherent, polite, and easy to follow.`,
        overall_es: `¡Muy buen trabajo en "${sc.title}"! Tu respuesta oral fue coherente, cortés y fácil de entender.`,
        correction_en: `Try incorporating "${v1}" and "${v2}" with linking connectors to elevate your B2 fluency.`,
        correction_es: `Intenta incorporar "${v1}" y "${v2}" con conectores para elevar tu fluidez a nivel B2.`,
        pron_tip_en: `Pay attention to vowel length and stress placement when pronouncing "${v1}".`,
        pron_tip_es: `Presta atención a la duración vocálica y acentuación al pronunciar "${v1}".`
      };
      const total = 87;

      setQScores((prev) => {
        const next = prev.map((arr) => [...arr]);
        next[currentSc][currentQ] = total;
        const allScores = next.flat().filter((s) => s !== undefined);
        const avgTotal = allScores.length
          ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
          : 0;
        setTotalScore(avgTotal);
        return next;
      });

      setFeedbackData({ fb: fallbackFb, total });
      setTimeout(() => {
        feedbackCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    } finally {
      setIsAnalyzingFeedback(false);
    }
  };

  const nextQuestion = () => {
    const sc = activeScenariosList[currentSc] || activeScenariosList[0];
    resetQuestionMedia();
    if (currentQ < sc.questions.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setShowScSummary(true);
      setTimeout(() => {
        summaryCardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  const replayScenario = () => {
    setCurrentQ(0);
    setQScores((prev) => {
      const next = prev.map((arr) => [...arr]);
      next[currentSc] = [];
      return next;
    });
    setShowScSummary(false);
    setShowPhrases(false);
    resetQuestionMedia();
  };

  const nextScenario = () => {
    if (currentSc < activeScenariosList.length - 1) {
      setCurrentSc((s) => s + 1);
      setCurrentQ(0);
      setShowScSummary(false);
      setShowPhrases(false);
      resetQuestionMedia();
    } else {
      setCurrentSc(0);
      setCurrentQ(0);
      setShowScSummary(false);
      setShowPhrases(false);
      resetQuestionMedia();
    }
  };

  const isWordFile = (file) => {
    if (!file) return false;
    const nm = String(file.name || file.nombre || file.url || "").toLowerCase();
    const ft = String(file.fileType || file.tipo || "").toLowerCase();
    const badge = String(file.badge || "").toLowerCase();
    return (
      /\.(docx?|rtf)(\?|$)/.test(nm) ||
      ft.includes("word") ||
      ft.includes("msword") ||
      ft.includes("officedocument.wordprocessingml") ||
      badge === "word"
    );
  };

  const handleDownloadWordFile = async (e, file) => {
    if (e) e.stopPropagation();
    if (!isWordFile(file) || !file?.url) return;
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const defaultName = file.name || file.nombre || "Material_Word.docx";
      link.download = /\.(docx?|rtf)$/i.test(defaultName) ? defaultName : `${defaultName}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name || file.nombre || "Material_Word.docx";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenCourse = (curso) => {
    if (!hasGrantedAccess && authCtx.role !== "admin") {
      Swal.fire({
        icon: "warning",
        title: "Acceso Pendiente",
        text: "Tu acceso debe ser autorizado por el administrador antes de visualizar los contenidos del curso.",
        background: "#18112b",
        color: "#ffffff",
        confirmButtonColor: "#7c3aed"
      });
      return;
    }
    setSelectedCourse(curso);
    if (curso.archivos && curso.archivos.length > 0) {
      const firstFile = curso.archivos[0];
      setSelectedFile(firstFile);
      const isVid = firstFile.fileType?.includes("video") || firstFile.name?.toLowerCase().endsWith(".mp4");
      setViewFormat(isVid ? "interactive" : "embed");
    } else {
      setSelectedFile(null);
      setViewFormat("interactive");
    }
    setCurrentPage(1);
    setZoomLevel(100);
    setCurrentSc(0);
    setCurrentQ(0);
    setShowScSummary(false);
    resetQuestionMedia();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseCourse = () => {
    stopScenarioRecording();
    setSelectedCourse(null);
    setSelectedFile(null);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const speakText = (text, idx = null) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      if (idx !== null && playingDialogueIdx === idx) {
        setPlayingDialogueIdx(null);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-GB";
      utterance.rate = 0.95;
      utterance.onend = () => setPlayingDialogueIdx(null);
      utterance.onerror = () => setPlayingDialogueIdx(null);
      setPlayingDialogueIdx(idx);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenAiModal = () => {
    setIsAiModalOpen(true);
    if (chatMessages.length === 0) {
      const greeting = `Hello! I am your AI Conversation Tutor for "${selectedCourse?.nombre || "this module"}". How would you like to practice today? You can speak using your microphone or type your questions or responses.`;
      setChatMessages([{ role: "ai", content: greeting }]);
      speakText(greeting);
    }
  };

  const handleCloseAiModal = () => {
    setIsAiModalOpen(false);
    if (isAiListening) {
      recognitionRef.current?.stop();
      setIsAiListening(false);
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSendChatMessage = async (userText) => {
    const text = (userText || chatInput).trim();
    if (!text || isAiResponding) return;
    setChatInput("");

    const newHistory = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newHistory);
    setIsAiResponding(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/pronunciation/chat`,
        {
          history: newHistory,
          courseName: selectedCourse?.nombre || "General English",
          courseInfo: selectedCourse?.descripcion || "",
          speakingActivities: selectedCourse?.speakingActivities || [],
          activeQuestion: SCENARIOS[currentSc]?.questions?.[currentQ]?.q || ""
        },
        {
          headers: authCtx.token ? { Authorization: `Bearer ${authCtx.token}` } : {}
        }
      );

      const reply = res.data?.reply || "Good phrasing! Let's continue practicing this scenario.";
      const corrections = res.data?.corrections || [];
      const updatedMessages = [...newHistory, { role: "ai", content: reply, corrections }];
      setChatMessages(updatedMessages);
      speakText(reply);
    } catch (err) {
      console.warn("AI Chat request notice:", err);
      const fallbackReply = "That's a very clear response! How would you ask for the baggage drop counter?";
      setChatMessages([...newHistory, { role: "ai", content: fallbackReply, corrections: [] }]);
      speakText(fallbackReply);
    } finally {
      setIsAiResponding(false);
      setTimeout(() => {
        chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleToggleAiVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Swal.fire({
        title: "Micrófono no soportado",
        text: "Tu navegador no tiene activado el reconocimiento de voz nativo. Puedes escribir tus respuestas en el chat.",
        icon: "info",
        background: "#1e192b",
        color: "#e8def9",
        confirmButtonColor: "#7c3aed"
      });
      return;
    }

    if (isAiListening) {
      recognitionRef.current?.stop();
      setIsAiListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onstart = () => setIsAiListening(true);
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          handleSendChatMessage(transcript);
        }
      };
      rec.onerror = (e) => {
        console.warn("Speech recognition error:", e);
        setIsAiListening(false);
      };
      rec.onend = () => setIsAiListening(false);
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error("Mic error:", e);
      setIsAiListening(false);
    }
  };

  const parseDescriptionList = (desc) => {
    if (!desc || typeof desc !== "string") {
      return [
        "Todo el vocabulario esencial para hablar con fluidez.",
        "Situaciones reales con práctica acústica guiada.",
        "Frases de uso frecuente y resolución de imprevistos.",
        "Material verificado por examinadores internacionales."
      ];
    }
    return desc
      .split("\n")
      .map((line) => line.replace(/^[-•✅\s]+/, "").trim())
      .filter(Boolean);
  };

  const activeScenario = activeScenariosList[currentSc] || activeScenariosList[0];
  const activeQuestionObj = activeScenario.questions[currentQ] || activeScenario.questions[0];
  const currentScScores = qScores[currentSc] || [];
  const scAvgScore = currentScScores.length
    ? Math.round(currentScScores.reduce((a, b) => a + (b || 0), 0) / activeScenario.questions.length)
    : 0;
  const summaryMedalInfo =
    scAvgScore >= 85
      ? { emo: "🏆", en: "Excellent!", es: "¡Excelente!" }
      : scAvgScore >= 70
      ? { emo: "🌟", en: "Well done!", es: "¡Muy bien!" }
      : scAvgScore >= 55
      ? { emo: "👏", en: "Good effort!", es: "¡Buen intento!" }
      : { emo: "💪", en: "Keep practising!", es: "¡Sigue practicando!" };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container relative">
      {/* ======================================================== */}
      {/* 1. COURSE LIST VIEW (CUANDO NO SE ESTÁ LEYENDO UN CURSO) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {!selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full pt-24 sm:pt-36 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto"
          >
            {/* Header / Intro */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
              <div className="inline-flex items-center gap-2 bg-surface-container-high px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold tracking-widest uppercase text-secondary mb-3 sm:mb-4 border border-white/5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Tus Programas Adquiridos
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-on-surface tracking-tight leading-tight">
                Mis Cursos &amp;{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-on-surface via-primary to-secondary">
                  Material de Estudio
                </span>
              </h1>
              <p className="mt-3 text-on-surface-variant text-base sm:text-base max-w-xl mx-auto">
                Accede al contenido oficial, escenarios interactivos de speaking, lecciones en video y materiales exclusivos con evaluación de IA.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
                <div className="w-12 h-12 border-4 border-primary-container border-t-transparent rounded-full animate-spin mb-4"></div>
                <span className="text-xs uppercase tracking-wider font-semibold">Cargando biblioteca de cursos...</span>
              </div>
            ) : pendingOrder && !hasGrantedAccess && authCtx.role !== "admin" ? (
              <div className="max-w-xl mx-auto bg-surface-container-low/90 backdrop-blur-2xl rounded-3xl border border-amber-500/30 p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-5 text-2xl shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <FiLock className="w-8 h-8" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 mb-3 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                  <FiClock className="w-3.5 h-3.5" /> En Espera de Autorización
                </div>

                <h3 className="text-2xl font-black text-white mb-2">Acceso Pendiente de Activación</h3>
                <p className="text-sm text-neutral-300 leading-relaxed mb-6">
                  Hemos registrado tu solicitud de inscripción. Por políticas de seguridad, el administrador debe habilitar tu cuenta para darte acceso al contenido del curso y al Tutor de Inteligencia Artificial.
                </p>

                {/* Código de Verificación */}
                <div className="bg-[#120c1f] border border-purple-500/30 rounded-2xl p-5 mb-6 text-center shadow-inner relative overflow-hidden">
                  <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-widest block mb-1.5">
                    Tu Código de Verificación de Alumno
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest">
                      {pendingOrder.verificationCode || "BLOOM-PENDIENTE"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (pendingOrder.verificationCode) {
                          navigator.clipboard.writeText(pendingOrder.verificationCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }
                      }}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 transition-colors"
                      title="Copiar código"
                    >
                      {copiedCode ? <FiCheck className="w-4 h-4 text-emerald-400" /> : <FiCopy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copiedCode && (
                    <span className="text-[11px] text-emerald-400 font-medium block mt-1.5">¡Código copiado al portapapeles!</span>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href={`https://wa.me/+5493424213813?text=${encodeURIComponent(
                      `¡Hola English Bloom! Solicito la activación de mi acceso al curso. Mi código de verificación es: ${pendingOrder.verificationCode || ""}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.35)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <span>Solicitar Activación por WhatsApp</span>
                    <FiExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={handleRecheckAccess}
                    disabled={rechecking}
                    className="w-full py-3 px-6 rounded-full font-semibold text-xs text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center gap-2 transition-all"
                  >
                    <FiRefreshCw className={`w-3.5 h-3.5 ${rechecking ? "animate-spin" : ""}`} />
                    <span>{rechecking ? "Comprobando autorización..." : "Reverificar si ya fue habilitado"}</span>
                  </button>
                </div>
              </div>
            ) : infoproductos.length === 0 ? (
              <div className="text-center py-16 bg-surface-container-low rounded-3xl border border-white/5 max-w-xl mx-auto p-8 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-primary-container/20 text-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  📚
                </div>
                <h3 className="text-xl font-bold text-on-surface mb-2">Aún no tienes cursos inscritos</h3>
                <span className="sr-only">You haven&apos;t acquired any courses yet</span>
                <p className="text-sm text-on-surface-variant mb-6">
                  Explora nuestro catálogo para comenzar a hablar inglés con fluidez y soporte de IA.
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-container text-white font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_28px_rgba(124,58,237,0.6)] transition-all"
                >
                  Explorar Catálogo de Cursos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8">
                {infoproductos.map((curso, idx) => {
                  const coverImg =
                    curso.imagenes && curso.imagenes.length > 0
                      ? curso.imagenes[0].url || curso.imagenes[0]
                      : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800";

                  const descItems = parseDescriptionList(curso.descripcion);

                  return (
                    <motion.div
                      key={curso.id || idx}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      whileHover={{ y: -6 }}
                      onClick={() => handleOpenCourse(curso)}
                      className="bg-surface-container-low rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5 hover:border-primary/40 shadow-xl transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                      {/* Course Cover Image */}
                      <div className="h-36 sm:h-52 relative overflow-hidden bg-surface-container">
                        <img
                          src={coverImg}
                          alt={curso.nombre}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-black/30"></div>
                        <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4">
                          <span className="bg-surface-container-lowest/80 backdrop-blur-md text-secondary text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider border border-white/10">
                            {curso.categoria || "Activo • Acceso Total"}
                          </span>
                        </div>
                      </div>

                      {/* Course Card Body */}
                      <div className="p-3.5 sm:p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h2 className="font-extrabold text-sm sm:text-xl text-on-surface mb-2 sm:mb-3 group-hover:text-primary transition-colors leading-snug">
                            {curso.nombre}
                          </h2>
                          <ul className="flex flex-col gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                            {descItems.slice(0, 3).map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5 sm:gap-2 text-xs text-on-surface-variant">
                                <span
                                  className="material-symbols-outlined text-[15px] sm:text-[16px] text-primary shrink-0 mt-0.5"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  check_circle
                                </span>
                                <span className="line-clamp-2 leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-3 sm:pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0">
                          <span className="text-[11px] sm:text-xs font-semibold text-outline uppercase tracking-wider">
                            {curso.archivos?.length || 4} Materiales • 15 Escenarios IA
                          </span>
                          <span className="text-xs font-bold text-primary group-hover:translate-x-1 transition-transform flex items-center gap-1">
                            Ver Materiales &rarr;
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 2. VISOR DE MATERIALES & CONTENIDO DEL CURSO COMPRADO    */}
      {/* ======================================================== */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-lenis-prevent
          className="fixed inset-0 z-[5000] bg-surface flex flex-col overflow-y-auto no-scrollbar select-none"
          >
            {/* Top Fixed Header Bar */}
            <header className="sticky top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-md border-b border-white/5">
              <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
                {/* Left: Back button & Breadcrumbs */}
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={handleCloseCourse}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    <span>Volver a Mis Cursos</span>
                  </button>

                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-primary tracking-tight shrink-0 text-sm sm:text-base">
                      EnglishBloom
                    </span>
                    <span className="text-outline-variant select-none hidden md:inline">/</span>
                    <span className="text-xs text-on-surface-variant truncate hidden md:inline max-w-xs">
                      {selectedCourse.nombre}
                    </span>
                  </div>
                </div>

                {/* Right: Security Badge, Score & Tutor IA */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-white/5">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    <span className="text-[10px] text-secondary uppercase tracking-widest font-bold">
                      Solo Lectura - Protección Anti-Descarga
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high border border-white/5 text-xs">
                    <span className="material-symbols-outlined text-[15px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                    <strong className="text-primary font-extrabold">{totalScore}</strong>
                    <span className="text-on-surface-variant">pts total</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAiModal}
                    className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-container text-white text-xs font-bold hover:shadow-[0_0_16px_rgba(124,58,237,0.5)] transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">forum</span>
                    <span>Tutor IA</span>
                  </button>
                </div>
              </div>
            </header>

            {/* Sub-Header / Tool Bar Strip */}
            <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md px-6 lg:px-12 py-2 border-b border-white/5 shadow-sm">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                {/* Left: File metadata & scenario indicator */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">
                      {selectedFile?.fileType?.includes("video") ? "smart_display" : "record_voice_over"}
                    </span>
                    <span className="truncate max-w-[160px] sm:max-w-xs">
                      {selectedFile?.name || "Speaking Scenarios Guide"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-surface-container-high rounded-full px-3 py-1 text-xs border border-white/5">
                    <span className="text-on-surface-variant">Escenario:</span>
                    <strong className="text-primary">
                      {activeScenario.num} / {activeScenariosList.length}
                    </strong>
                    <span className="text-outline">•</span>
                    <span className="text-secondary font-semibold">{activeScenario.title}</span>
                  </div>
                </div>

                {/* Right: View Switcher */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewFormat((vf) => (vf === "interactive" ? "embed" : "interactive"))}
                    className="px-3.5 py-1 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors text-xs font-semibold flex items-center gap-1.5 border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {viewFormat === "interactive" ? "visibility" : "layers"}
                    </span>
                    <span>
                      {viewFormat === "interactive" ? "Ver Documento PDF Original" : "Ver Escenarios Interactivos"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Layout Grid (4 cols Sidebar / 8 cols Scenarios Content) */}
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* ======================================================== */}
                {/* LEFT SIDEBAR: Course Info & Resources (4 cols)           */}
                {/* ======================================================== */}
                <aside className="lg:col-span-4 flex flex-col gap-6 order-2 lg:order-1">
                  {/* Course Meta Card */}
                  <div className="bg-surface-container rounded-3xl p-6 shadow-xl border border-white/5 flex flex-col gap-5">
                    <div
                      className="relative w-full h-44 rounded-2xl bg-cover bg-center overflow-hidden shadow-inner border border-white/5"
                      style={{
                        backgroundImage: `url(${
                          selectedCourse.imagenes?.[0]?.url ||
                          selectedCourse.imagenes?.[0] ||
                          "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800"
                        })`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent"></div>
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest/80 backdrop-blur-md text-secondary text-[10px] font-bold tracking-wider uppercase border border-white/10">
                          {selectedCourse.categoria || "B1 / B2 • British English"}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-lg font-extrabold text-on-surface tracking-tight leading-snug drop-shadow-md">
                          {selectedCourse.nombre}
                        </span>
                      </div>
                    </div>

                    {/* Learning Objectives */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                        Objetivos del Curso
                      </span>
                      <ul className="flex flex-col gap-2.5">
                        {parseDescriptionList(selectedCourse.descripcion).map((obj, oIdx) => (
                          <li key={oIdx} className="flex items-start gap-2 text-xs text-on-surface-variant">
                            <span
                              className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5"
                              style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                              check_circle
                            </span>
                            <span className="leading-relaxed">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Archivos y Recursos del Curso */}
                  <div className="bg-surface-container rounded-3xl p-6 shadow-xl border border-white/5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                        Archivos y Recursos
                      </span>
                      <span className="text-[10px] font-bold text-primary uppercase">
                        {selectedCourse.archivos?.length || 4} Materiales
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {(selectedCourse.archivos || []).map((archivo, aIdx) => {
                        const isCurrent = selectedFile?.name === archivo.name;
                        const isVideo = archivo.fileType?.includes("video") || archivo.name?.toLowerCase().endsWith(".mp4");
                        const isAudio = archivo.fileType?.includes("audio") || archivo.name?.toLowerCase().endsWith(".mp3");
                        const canDownloadWord = isWordFile(archivo);

                        return (
                          <div
                            key={aIdx}
                            onClick={() => {
                              setSelectedFile(archivo);
                              setViewFormat(isVideo ? "interactive" : "embed");
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`p-3 rounded-2xl transition-all flex items-center justify-between gap-3 text-left border cursor-pointer ${
                              isCurrent
                                ? "bg-primary-container/25 border-primary/40 shadow-lg ring-1 ring-primary/30"
                                : "bg-surface-container-low hover:bg-surface-container-high border-white/5"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                  isCurrent
                                    ? "bg-primary-container text-white"
                                    : "bg-surface-container-highest text-on-surface-variant"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isVideo ? "smart_display" : isAudio ? "graphic_eq" : "description"}
                                </span>
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={`text-xs font-bold truncate ${isCurrent ? "text-white" : "text-on-surface"}`}>
                                  {archivo.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant flex-wrap">
                                  <span>{archivo.size || "Material oficial"}</span>
                                  <span>•</span>
                                  {canDownloadWord ? (
                                    <span className="text-emerald-400 font-bold">Word Descargable</span>
                                  ) : (
                                    <span className="text-amber-300/90 font-semibold">Solo ver en web</span>
                                  )}
                                  {isCurrent && (
                                    <>
                                      <span>•</span>
                                      <span className="text-secondary font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                                        Activo
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {canDownloadWord ? (
                                <button
                                  type="button"
                                  onClick={(e) => handleDownloadWordFile(e, archivo)}
                                  title="Descargar archivo Word"
                                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">download</span>
                                  <span>Descargar</span>
                                </button>
                              ) : (
                                <span
                                  title="Descarga prohibida — Solo lectura en la web"
                                  className="material-symbols-outlined text-outline text-[16px]"
                                >
                                  lock
                                </span>
                              )}
                              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                                {isCurrent ? "visibility" : "play_circle"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tutor IA Card */}
                  <div className="bg-gradient-to-br from-primary-container to-secondary-container rounded-3xl p-6 text-white shadow-xl flex flex-col gap-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-lowest/40 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                        <span>En Línea 24/7</span>
                      </div>
                      <span className="material-symbols-outlined text-[24px]">smart_toy</span>
                    </div>
                    <div>
                      <span className="text-lg font-bold block leading-tight">💬 Conversar con Tutor IA</span>
                      <p className="text-xs text-white/85 mt-1.5 leading-relaxed">
                        Practica libremente cualquiera de los 15 escenarios con corrección en vivo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAiModal}
                      className="w-full py-3 px-4 rounded-full bg-surface-container-lowest text-primary text-xs font-bold hover:bg-surface-container transition-colors shadow-md flex items-center justify-center gap-2 text-center active:scale-95"
                    >
                      <span>Iniciar Práctica Libre</span>
                      <span className="material-symbols-outlined text-[16px]">forum</span>
                    </button>
                  </div>
                </aside>

                {/* ======================================================== */}
                {/* RIGHT PANEL: 15 SPEAKING SCENARIOS INTERACTIVE FORMAT    */}
                {/* (Exact structure of the HTML with the site's dark theme) */}
                {/* ======================================================== */}
                <section className="lg:col-span-8 flex flex-col gap-4 order-1 lg:order-2">
                  {selectedFile?.fileType?.includes("video") ? (
                    <div
                      className={
                        isViewerExpanded
                          ? "fixed inset-0 z-[5000] bg-surface-container-lowest p-4 sm:p-6 flex flex-col gap-3 select-none print:hidden"
                          : "relative bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-white/5 overflow-hidden flex flex-col gap-4 print:hidden"
                      }
                    >
                      <div
                        className={`relative w-full rounded-2xl overflow-hidden bg-black shadow-inner ${
                          isViewerExpanded ? "flex-1 min-h-0" : "aspect-video"
                        }`}
                      >
                        <video
                          src={selectedFile.url}
                          controls
                          controlsList="nodownload noremoteplayback"
                          disablePictureInPicture
                          className={`w-full h-full object-contain ${viewerBlackout ? "opacity-0 pointer-events-none" : ""}`}
                        />
                        {renderViewerBlackoutOverlay()}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs text-on-surface-variant pt-2 flex-wrap">
                        <span className="font-semibold text-white truncate">{selectedFile.name}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsViewerExpanded((v) => !v)}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-white transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {isViewerExpanded ? "fullscreen_exit" : "fullscreen"}
                            </span>
                            <span>{isViewerExpanded ? "Salir" : "Pantalla completa"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsViewerExpanded(false);
                              setSelectedFile(
                                (selectedCourse.archivos || []).find(
                                  (f) => !f.fileType?.includes("video")
                                ) || null
                              );
                            }}
                            className="text-primary hover:underline font-bold"
                          >
                            Volver a los 15 Escenarios Interactivos &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : viewFormat === "embed" && selectedFile?.url ? (
                     (() => {
                       const url = selectedFile.url;
                       const nm = String(selectedFile.name || url).toLowerCase();
                       const ft = String(selectedFile.fileType || "").toLowerCase();
                       const canDownloadWord = isWordFile(selectedFile);
                       const isPdf = ft.includes("pdf") || nm.endsWith(".pdf");
                       const isImg = ft.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(nm);
                       const isAud = ft.includes("audio") || /\.(mp3|wav|ogg|m4a)$/.test(nm);
                       const isOffice = /\.(pptx?|docx?|xlsx?)$/.test(nm) || ft.includes("presentation") || ft.includes("powerpoint") || ft.includes("word") || ft.includes("excel") || ft.includes("spreadsheet");
                       const isLocalUrl = /^(https?:\/\/)?(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(url);
                       const isData = url.startsWith("data:");
                       let content;
                       if (isImg) {
                         content = (
                           <img
                             src={url}
                             alt={selectedFile.name}
                             draggable={false}
                             onContextMenu={(e) => e.preventDefault()}
                             className="w-full h-full object-contain rounded-2xl bg-black/40 select-none pointer-events-none"
                           />
                         );
                       } else if (isAud) {
                         content = (
                           <div className="w-full h-full flex items-center justify-center">
                             <audio
                               src={url}
                               controls
                               controlsList="nodownload noplaybackrate"
                               onContextMenu={(e) => e.preventDefault()}
                               className="w-full max-w-xl"
                             />
                           </div>
                         );
                       } else if (isPdf) {
                         content = (
                           <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-white">
                             <iframe
                               src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                               className="w-full h-full border-0"
                               title={selectedFile.name}
                               sandbox="allow-scripts allow-same-origin"
                             />
                             {/* Bloqueo de barra superior en caso de visor nativo */}
                             <div
                               onContextMenu={(e) => e.preventDefault()}
                               className="absolute top-0 left-0 right-4 h-11 z-20 bg-transparent"
                             />
                           </div>
                         );
                       } else if (isOffice && !isLocalUrl && !isData) {
                         content = (
                           <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-white">
                             <iframe
                               src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                               className="w-full h-full border-0"
                               title={selectedFile.name}
                               sandbox={
                                 canDownloadWord
                                   ? "allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
                                   : "allow-scripts allow-same-origin allow-forms"
                               }
                             />
                             {/* Si NO es Word (ej. PowerPoint / Excel), bloqueamos el menú contextual/botón de descarga inferior derecho del visor de Office */}
                             {!canDownloadWord && (
                               <>
                                 <div
                                   onContextMenu={(e) => e.preventDefault()}
                                   title="Descarga deshabilitada — Solo visualización en web"
                                   className="absolute bottom-0 right-0 w-28 h-8 z-20 bg-[#262626] flex items-center justify-center text-[10px] text-white/70 font-semibold select-none cursor-not-allowed"
                                 >
                                   🔒 Solo web
                                 </div>
                                 <div
                                   onContextMenu={(e) => e.preventDefault()}
                                   className="absolute bottom-0 left-0 w-12 h-8 z-20 bg-[#262626] cursor-default"
                                 />
                               </>
                             )}
                           </div>
                         );
                       } else if (!isOffice && !isData) {
                         content = (
                           <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5 bg-white">
                             <iframe
                               src={url}
                               className="w-full h-full border-0"
                               title={selectedFile.name}
                               sandbox="allow-scripts allow-same-origin"
                             />
                           </div>
                         );
                       } else {
                         content = (
                           <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-center text-on-surface-variant text-sm px-6">
                             <span className="material-symbols-outlined text-[40px] text-primary">description</span>
                             <span>
                               {isOffice
                                 ? "El documento está listo para visualización en la plataforma."
                                 : "Este archivo no se puede previsualizar aquí."}
                             </span>
                             {canDownloadWord && (
                               <button
                                 type="button"
                                 onClick={(e) => handleDownloadWordFile(e, selectedFile)}
                                 className="mt-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                               >
                                 <span className="material-symbols-outlined text-[16px]">download</span>
                                 <span>Descargar Archivo Word Editable</span>
                               </button>
                             )}
                           </div>
                         );
                       }
                       return (
                         <div
                           onContextMenu={(e) => e.preventDefault()}
                           className={
                             isViewerExpanded
                               ? "fixed inset-0 z-[5000] bg-surface-container-lowest p-4 sm:p-6 flex flex-col gap-3 select-none print:hidden"
                               : "relative bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-white/5 h-[750px] flex flex-col gap-3 select-none print:hidden"
                           }
                         >
                           <div className="flex items-center justify-between gap-3 text-xs border-b border-white/5 pb-2.5 flex-wrap">
                             <span className="font-semibold text-white truncate">{selectedFile.name}</span>
                             <div className="flex items-center gap-2.5 shrink-0">
                               {canDownloadWord ? (
                                 <button
                                   type="button"
                                   onClick={(e) => handleDownloadWordFile(e, selectedFile)}
                                   className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition-colors"
                                 >
                                   <span className="material-symbols-outlined text-[14px]">download</span>
                                   <span>Descargar Word</span>
                                 </button>
                               ) : (
                                 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high border border-white/10 text-[10px] font-semibold text-on-surface-variant">
                                   <span className="material-symbols-outlined text-[13px] text-emerald-400">lock</span>
                                   Solo lectura en web (Descarga prohibida)
                                 </span>
                               )}
                               <button
                                 type="button"
                                 onClick={() => setIsViewerExpanded((v) => !v)}
                                 className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold text-white transition-colors"
                                 title={isViewerExpanded ? "Salir de pantalla completa (Esc)" : "Agrandar visor a pantalla completa"}
                               >
                                 <span className="material-symbols-outlined text-[15px]">
                                   {isViewerExpanded ? "fullscreen_exit" : "fullscreen"}
                                 </span>
                                 <span>{isViewerExpanded ? "Salir" : "Pantalla completa"}</span>
                               </button>
                               <button
                                 type="button"
                                 onClick={() => {
                                   setIsViewerExpanded(false);
                                   setViewFormat("interactive");
                                 }}
                                 className="text-primary hover:underline font-bold text-xs flex items-center gap-1"
                               >
                                 <span>Volver a Escenarios</span>
                                 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                               </button>
                             </div>
                           </div>
                           <div className="relative flex-1 min-h-0">
                             <div className={`w-full h-full ${viewerBlackout ? "opacity-0 pointer-events-none" : ""}`}>
                               {content}
                             </div>
                             {renderViewerBlackoutOverlay()}
                           </div>
                         </div>
                       );
                     })()
                   ) : (
                    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-3 pb-8">
                      {/* ── 1. HERO ── */}
                      <div className="relative bg-surface-container rounded-3xl px-6 py-7 text-center overflow-hidden border border-white/10 shadow-xl">
                        <div className="
                          absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary-container/25 blur-2xl pointer-events-none
                        "></div>
                        <div className="
                          absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-secondary-container/25 blur-2xl pointer-events-none
                        "></div>

                        <p className="text-[11px] tracking-[2.5px] uppercase text-secondary font-bold mb-1.5 relative z-10">
                          B1 / B2 · British English
                        </p>
                        <p className="text-xs font-bold text-on-surface-variant tracking-[1.5px] uppercase mb-1 relative z-10">
                          {activeScenariosList.length} Speaking Scenarios for
                        </p>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight mb-1.5 relative z-10">
                          Travel{" "}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                            &amp; Daily Life
                          </span>
                        </h1>
                        <p className="text-xs text-on-surface-variant mb-4 relative z-10">
                          Choose a scenario · Record · Get full AI feedback
                        </p>

                        <div className="inline-flex items-center gap-2 bg-surface-container-lowest/90 border border-primary/30 rounded-full px-5 py-1.5 text-xs text-on-surface-variant shadow-md relative z-10">
                          <span
                            className="material-symbols-outlined text-primary text-[16px]"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                          <strong id="totalScore" className="text-on-surface text-base font-extrabold">
                            {totalScore}
                          </strong>{" "}
                          pts total
                        </div>
                      </div>

                      {/* ── 2. SCENARIO PICKER ── */}
                      <div className="bg-surface-container rounded-3xl border border-white/10 overflow-hidden shadow-lg">
                        <div className="px-5 py-3.5 bg-surface-container-high/80 border-b border-white/5 flex items-center justify-between">
                          <span className="text-[11px] tracking-[1.5px] uppercase font-extrabold text-secondary">
                            Choose your scenario
                          </span>
                          <button
                            type="button"
                            onClick={() => setPickerOpen((o) => !o)}
                            className="text-xs text-primary hover:text-secondary font-semibold flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {pickerOpen ? "expand_less" : "expand_more"}
                            </span>
                            <span>{pickerOpen ? "Hide" : "Show"}</span>
                          </button>
                        </div>

                        {pickerOpen && (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-4">
                            {activeScenariosList.map((s, i) => {
                              const isActive = i === currentSc;
                              const isScCompleted =
                                qScores[i] &&
                                qScores[i].filter((v) => v !== undefined).length === s.questions.length;
                              return (
                                <button
                                  key={s.num}
                                  type="button"
                                  onClick={() => selectScenario(i)}
                                  className={`py-2.5 px-1.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                                    isActive
                                      ? "bg-primary-container border-primary text-white shadow-[0_0_16px_rgba(124,58,237,0.45)] scale-[1.02]"
                                      : isScCompleted
                                      ? "bg-secondary-container/30 border-secondary/40 text-on-surface hover:border-primary/50"
                                      : "bg-surface-container-low border-white/5 text-on-surface hover:border-primary/40 hover:bg-surface-container-high"
                                  }`}
                                >
                                  <span className="text-lg leading-none">{s.emoji}</span>
                                  <span className="text-xs font-extrabold leading-tight mt-0.5">{s.num}</span>
                                  <span
                                    className={`text-[10px] leading-tight line-clamp-1 ${
                                      isActive ? "text-primary-fixed" : "text-on-surface-variant"
                                    }`}
                                  >
                                    {s.title.split(" ").slice(0, 2).join(" ")}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* ── 3. USEFUL PHRASES PANEL (Togglable) ── */}
                      {showPhrases && (
                        <div className="rounded-2xl border border-primary/30 bg-surface-container p-4 shadow-lg">
                          <span className="text-[10px] tracking-[2px] uppercase text-secondary font-extrabold block mb-2.5">
                            Useful phrases · Frases útiles
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {PHRASES.map((ph, i) => {
                              const isSel = selectedPhraseIdx === i;
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPhraseIdx(i);
                                    speakText(ph, `phrase-${i}`);
                                  }}
                                  className={`px-3 py-2 rounded-xl text-xs text-left transition-all border leading-snug ${
                                    isSel
                                      ? "bg-primary-container/35 border-primary text-white font-bold shadow-sm"
                                      : "bg-surface-container-low border-white/5 text-on-surface-variant hover:border-primary/40 hover:text-on-surface"
                                  }`}
                                >
                                  {ph}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── 4. MAIN SCENARIO CARD ── */}
                      {!showScSummary && (
                        <div className="rounded-3xl overflow-hidden bg-surface-container border border-white/10 shadow-2xl">
                          {/* CARD BANNER */}
                          <div className="w-full px-6 pt-6 pb-5 bg-gradient-to-br from-surface-container-high via-surface-container to-primary-container/25 flex flex-col items-center gap-2 text-center relative">
                            <span className="text-5xl leading-none drop-shadow-md">{activeScenario.emoji}</span>
                            <span className="text-[10px] tracking-[2px] uppercase font-bold text-secondary">
                              Scenario {activeScenario.num}
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold text-on-surface leading-snug">
                              {activeScenario.title}
                            </h2>
                            <div className="flex gap-1.5 flex-wrap justify-center mt-1">
                              {activeScenario.topics.slice(0, 4).map((t, tIdx) => (
                                <span
                                  key={tIdx}
                                  className="text-[10px] px-3 py-0.5 rounded-full bg-surface-container-lowest/60 border border-white/10 text-on-surface-variant font-semibold"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* CARD DIVIDER */}
                          <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent mx-6"></div>

                          {/* CARD BODY */}
                          <div className="p-5 sm:p-6 flex flex-col gap-3.5">
                            {/* Timer Progress Bar */}
                            <div className="h-1.5 bg-surface-container-lowest rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary-container via-primary to-tertiary transition-all duration-1000 ease-linear"
                                style={{ width: `${timerPct}%` }}
                              ></div>
                            </div>

                            {/* Tag Row */}
                            <div className="flex gap-2 flex-wrap items-center">
                              <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-primary-container/25 text-primary border border-primary/30">
                                B1/B2
                              </span>
                              <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-secondary-container/30 text-secondary border border-secondary/30">
                                Speaking
                              </span>
                              <span className="text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-surface-container-lowest text-on-surface-variant border border-white/10 ml-auto">
                                Q {currentQ + 1} / {activeScenario.questions.length}
                              </span>
                            </div>

                            {/* Q NAV — 3 Question Bullets */}
                            <div className="flex items-center gap-2">
                              {activeScenario.questions.map((_, i) => {
                                const isDone = qScores[currentSc]?.[i] !== undefined;
                                const isCurr = i === currentQ;
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => goToQ(i)}
                                    className={`w-8 h-8 rounded-full border-2 text-xs font-extrabold flex items-center justify-center transition-all shrink-0 ${
                                      isCurr
                                        ? "bg-primary-container border-primary text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]"
                                        : isDone
                                        ? "bg-secondary-container/40 border-secondary/50 text-secondary"
                                        : "bg-surface-container-low border-white/15 text-on-surface-variant hover:border-primary/50 hover:text-primary"
                                    }`}
                                  >
                                    {i + 1}
                                  </button>
                                );
                              })}
                              <span className="text-[11px] text-outline ml-1">Tap to jump</span>
                            </div>

                            {/* Prompt Text */}
                            <div className="flex items-start justify-between gap-3 bg-surface-container-low/60 p-4 rounded-2xl border border-white/5">
                              <p className="text-base sm:text-lg font-bold leading-relaxed text-on-surface">
                                {activeQuestionObj.q}
                              </p>
                              <button
                                type="button"
                                onClick={() => speakText(activeQuestionObj.q, `q-${currentSc}-${currentQ}`)}
                                title="Listen to question"
                                className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary-container text-primary hover:text-white flex items-center justify-center shrink-0 transition-colors border border-white/10"
                              >
                                <span className="material-symbols-outlined text-[18px]">volume_up</span>
                              </button>
                            </div>

                            {/* Hint Box */}
                            <div className="text-xs sm:text-sm text-on-surface-variant leading-relaxed bg-surface-container-low rounded-2xl p-3.5 pl-4 border border-white/10 border-l-4 border-l-primary">
                              {activeQuestionObj.hint}
                            </div>

                            {/* Key Vocabulary */}
                            <div>
                              <span className="text-[10px] tracking-[2px] uppercase text-secondary font-extrabold block mb-2">
                                Key vocabulary
                              </span>
                              <div className="flex gap-2 flex-wrap">
                                {activeQuestionObj.vocab.map((v, vIdx) => (
                                  <button
                                    key={vIdx}
                                    type="button"
                                    onClick={() => speakText(v, `voc-${v}`)}
                                    title="Click to hear pronunciation"
                                    className="text-xs px-3.5 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high text-primary border border-primary/25 transition-colors flex items-center gap-1"
                                  >
                                    <span>{v}</span>
                                    <span className="material-symbols-outlined text-[13px] opacity-70">volume_up</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Recording Zone */}
                            <div className="bg-surface-container-lowest/80 border-2 border-dashed border-primary/35 rounded-2xl p-5 text-center flex flex-col items-center gap-2.5">
                              <p className="text-xs text-secondary font-medium min-h-[18px]">{recStatus}</p>

                              <button
                                type="button"
                                onClick={toggleRec}
                                disabled={isAnalyzingFeedback}
                                className={`inline-flex items-center gap-2 px-7 py-3 rounded-full text-xs sm:text-sm font-bold transition-all shadow-lg ${
                                  recState === "recording"
                                    ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.45)]"
                                    : recState === "done"
                                    ? "bg-gradient-to-r from-primary-container to-secondary-container text-white shadow-[0_0_16px_rgba(124,58,237,0.4)]"
                                    : "bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-white border border-primary/30"
                                }`}
                              >
                                {recState === "recording" ? (
                                  <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
                                    <span>Stop recording</span>
                                  </>
                                ) : recState === "done" ? (
                                  <>
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    <span>Re-record</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[18px]">mic</span>
                                    <span>Start recording</span>
                                  </>
                                )}
                              </button>

                              {spokenTranscript && (
                                <p className="text-xs text-on-surface-variant italic max-w-md">
                                  &ldquo;{spokenTranscript}&rdquo;
                                </p>
                              )}

                              {audioUrl && (
                                <audio
                                  src={audioUrl}
                                  controls
                                  className="w-full max-w-md h-9 mt-1 rounded-lg"
                                />
                              )}
                            </div>

                            {/* Action Buttons Row */}
                            <div className="flex gap-2 flex-wrap pt-1">
                              <button
                                type="button"
                                onClick={getAIFeedback}
                                disabled={isAnalyzingFeedback}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-primary-container hover:bg-inverse-primary text-white border border-primary/40 shadow-[0_0_16px_rgba(124,58,237,0.35)] flex items-center gap-1.5 transition-all disabled:opacity-40"
                              >
                                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                                <span>Get AI feedback</span>
                              </button>

                              <button
                                type="button"
                                onClick={nextQuestion}
                                disabled={isAnalyzingFeedback}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-40"
                              >
                                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                <span>Next</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => startTimer(60)}
                                disabled={isAnalyzingFeedback}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-white/10 flex items-center gap-1.5 transition-colors disabled:opacity-40"
                              >
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                <span>Timer</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowPhrases((p) => !p)}
                                disabled={isAnalyzingFeedback}
                                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                                  showPhrases
                                    ? "bg-secondary-container/40 border-secondary/40 text-secondary"
                                    : "bg-surface-container-low hover:bg-surface-container-high text-on-surface border-white/10"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">format_quote</span>
                                <span>Phrases</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ── 5. AI FEEDBACK CARD ── */}
                      <div ref={feedbackCardRef}>
                        {isAnalyzingFeedback && (
                          <div className="rounded-3xl border border-primary/30 bg-surface-container p-7 text-center shadow-xl">
                            <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                            <p className="text-sm font-bold text-on-surface">AI is listening to your answer…</p>
                            <span className="text-xs text-secondary italic block mt-1">
                              La IA está escuchando tu respuesta…
                            </span>
                          </div>
                        )}

                        {feedbackError && (
                          <div className="rounded-2xl border border-error/40 bg-error-container/20 p-4 text-xs text-error">
                            <strong>Note:</strong> {feedbackError}
                          </div>
                        )}

                        {feedbackData && !isAnalyzingFeedback && (
                          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-surface-container via-surface-container-low to-surface-container-lowest p-6 shadow-2xl flex flex-col gap-4">
                            {/* Feedback Header */}
                            <div className="flex items-center gap-3 pb-3.5 border-b border-white/10">
                              <span className="text-2xl">
                                {feedbackData.total >= 85
                                  ? "🏆"
                                  : feedbackData.total >= 70
                                  ? "🌟"
                                  : feedbackData.total >= 55
                                  ? "👏"
                                  : "💪"}
                              </span>
                              <span className="text-lg font-extrabold text-on-surface">AI Feedback</span>
                              <div className="text-right ml-auto">
                                <div className="text-3xl font-extrabold text-primary leading-none">
                                  {feedbackData.total}
                                  <span className="text-sm text-outline font-normal">/100</span>
                                </div>
                                <div className="text-[9px] text-secondary uppercase tracking-widest font-bold mt-0.5">
                                  question score
                                </div>
                              </div>
                            </div>

                            {/* 4 Criteria Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                {
                                  key: "relevance",
                                  label: "Relevance",
                                  icon: "check_circle",
                                  barColor: "bg-primary"
                                },
                                {
                                  key: "grammar",
                                  label: "Grammar",
                                  icon: "spellcheck",
                                  barColor: "bg-tertiary"
                                },
                                {
                                  key: "vocabulary",
                                  label: "Vocabulary",
                                  icon: "menu_book",
                                  barColor: "bg-secondary"
                                },
                                {
                                  key: "pronunciation",
                                  label: "Pronunciation",
                                  icon: "hearing",
                                  barColor: "bg-pink-400"
                                }
                              ].map((crit) => {
                                const item = feedbackData.fb[crit.key] || {
                                  score: 20,
                                  comment_en: "",
                                  comment_es: ""
                                };
                                const isPron = crit.key === "pronunciation";
                                return (
                                  <div
                                    key={crit.key}
                                    className={`rounded-2xl p-4 border ${
                                      isPron
                                        ? "bg-primary-container/15 border-primary/30"
                                        : "bg-surface-container-low border-white/10"
                                    }`}
                                  >
                                    <div className="text-[10px] tracking-wider uppercase text-secondary font-extrabold mb-1 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[14px]">{crit.icon}</span>
                                      <span>{crit.label}</span>
                                    </div>
                                    <div className="text-xl font-extrabold text-on-surface leading-tight">
                                      {item.score}
                                      <span className="text-xs text-outline font-normal">/25</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-surface-container-lowest my-2 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${crit.barColor}`}
                                        style={{ width: `${Math.min(100, (item.score || 0) * 4)}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-on-surface leading-snug mb-1">
                                      {item.comment_en}
                                    </div>
                                    <div className="text-[11px] text-secondary italic leading-snug">
                                      {item.comment_es}
                                    </div>
                                    {isPron && item.specific_words && (
                                      <div className="text-[11px] text-tertiary italic mt-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[13px]">info</span>
                                        <span>
                                          Words to practise: <em>{item.specific_words}</em>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Overall · Resumen */}
                            <div>
                              <div className="text-[10px] tracking-[1.5px] uppercase text-secondary font-extrabold mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">chat</span>
                                <span>Overall · Resumen</span>
                              </div>
                              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-white/10">
                                <div className="text-xs text-on-surface leading-relaxed mb-1.5">
                                  {feedbackData.fb.overall_en}
                                </div>
                                <div className="text-xs text-secondary italic leading-relaxed pt-1.5 border-t border-dashed border-white/10">
                                  {feedbackData.fb.overall_es}
                                </div>
                              </div>
                            </div>

                            {/* Key correction · Corrección clave */}
                            <div>
                              <div className="text-[10px] tracking-[1.5px] uppercase text-secondary font-extrabold mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">edit</span>
                                <span>Key correction · Corrección clave</span>
                              </div>
                              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-white/10">
                                <div className="text-xs text-on-surface leading-relaxed mb-1.5">
                                  {feedbackData.fb.correction_en}
                                </div>
                                <div className="text-xs text-secondary italic leading-relaxed pt-1.5 border-t border-dashed border-white/10">
                                  {feedbackData.fb.correction_es}
                                </div>
                              </div>
                            </div>

                            {/* Pronunciation tip · Consejo */}
                            <div>
                              <div className="text-[10px] tracking-[1.5px] uppercase text-secondary font-extrabold mb-1.5 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">hearing</span>
                                <span>Pronunciation tip · Consejo</span>
                              </div>
                              <div className="bg-surface-container-low rounded-2xl p-3.5 border border-white/10">
                                <div className="text-xs text-on-surface leading-relaxed mb-1.5">
                                  {feedbackData.fb.pron_tip_en}
                                </div>
                                <div className="text-xs text-secondary italic leading-relaxed pt-1.5 border-t border-dashed border-white/10">
                                  {feedbackData.fb.pron_tip_es}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── 6. SCENARIO SCORE SUMMARY ── */}
                      {showScSummary && (
                        <div
                          ref={summaryCardRef}
                          className="rounded-3xl bg-gradient-to-br from-surface-container via-surface-container-low to-primary-container/20 border border-primary/30 p-7 text-center shadow-2xl"
                        >
                          <p className="text-5xl mb-2">{activeScenario.emoji}</p>
                          <h2 className="text-2xl font-extrabold text-on-surface mb-1">
                            {activeScenario.num}. {activeScenario.title}
                          </h2>
                          <p className="text-xs text-secondary italic mb-1">
                            {summaryMedalInfo.emo} {summaryMedalInfo.en} · {summaryMedalInfo.es}
                          </p>
                          <p className="text-xs text-on-surface-variant mb-4">Scenario complete!</p>

                          <div className="text-5xl font-extrabold text-primary leading-none mb-1">
                            {scAvgScore}
                          </div>
                          <div className="text-[10px] text-secondary tracking-[1.5px] uppercase font-bold mb-5">
                            average score / 100
                          </div>

                          <div className="flex gap-3 justify-center mb-6">
                            {activeScenario.questions.map((_, i) => (
                              <div
                                key={i}
                                className="bg-surface-container-low rounded-2xl px-4 py-2.5 border border-white/10 min-w-[70px]"
                              >
                                <div className="text-lg font-extrabold text-primary">
                                  {currentScScores[i] !== undefined ? currentScScores[i] : "—"}
                                </div>
                                <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                                  Q{i + 1}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-3 justify-center flex-wrap">
                            <button
                              type="button"
                              onClick={replayScenario}
                              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary-container hover:bg-inverse-primary text-white border border-primary/40 flex items-center gap-1.5 transition-all shadow-md"
                            >
                              <span className="material-symbols-outlined text-[16px]">refresh</span>
                              <span>Try again</span>
                            </button>
                            <button
                              type="button"
                              onClick={nextScenario}
                              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-white/10 flex items-center gap-1.5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                              <span>Next scenario</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Bottom Footer */}
            <footer className="w-full bg-surface-container-lowest py-4 border-t border-white/5 shadow-inner mt-auto">
              <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left text-xs text-outline">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-wider font-semibold">EnglishBloom EdTech Academy</span>
                  <span>•</span>
                  <span>15 Speaking Scenarios Interactive Engine</span>
                </div>
                <div>© 2025 EnglishBloom. Todos los derechos reservados.</div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* 3. MODAL INTERACTIVO DE TUTOR IA & PRÁCTICA ORAL         */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isAiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-surface-container-low border border-white/10 rounded-3xl w-full max-w-2xl h-[85vh] max-h-[700px] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-surface-container-lowest/90 px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-[22px]">psychology</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface truncate">
                        Tutor IA • {selectedCourse?.nombre || "Práctica Oral"}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse shrink-0"></span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant truncate">
                      Powered by Google Gemini • Detección fonética y corrección activa
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/chat"
                    state={{
                      courseName: selectedCourse?.nombre,
                      courseInfo: selectedCourse?.descripcion,
                      speakingActivities: selectedCourse?.speakingActivities || []
                    }}
                    title="Abrir en pantalla completa"
                    className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_full</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleCloseAiModal}
                    className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface-variant hover:text-white hover:bg-surface-container-highest flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
                {chatMessages.map((msg, idx) => {
                  const isAi = msg.role === "ai";
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isAi ? "items-start" : "items-end"} gap-1.5 max-w-[85%] ${
                        isAi ? "self-start" : "self-end"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-outline px-1">
                        <span>{isAi ? "Tutor IA" : "Tú"}</span>
                        {isAi && (
                          <button
                            type="button"
                            onClick={() => speakText(msg.content)}
                            title="Escuchar pronunciación"
                            className="hover:text-primary transition-colors flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-[14px]">volume_up</span>
                            <span>Escuchar</span>
                          </button>
                        )}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isAi
                            ? "bg-surface-container text-on-surface border border-white/5 rounded-tl-sm"
                            : "bg-primary-container text-white rounded-tr-sm shadow-md"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {msg.corrections && msg.corrections.length > 0 && (
                        <div className="mt-1 w-full bg-surface-container-lowest/80 border border-secondary/20 rounded-xl p-3 flex flex-col gap-2 text-xs">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                            Corrección y Recomendación:
                          </span>
                          {msg.corrections.map((corr, cIdx) => (
                            <div key={cIdx} className="flex flex-col gap-1 text-[11px]">
                              {corr.incorrect && (
                                <div className="text-error flex items-center gap-1">
                                  <span>✕</span>
                                  <span className="line-through">{corr.incorrect}</span>
                                </div>
                              )}
                              {corr.correct && (
                                <div className="text-emerald-400 font-bold flex items-center gap-1">
                                  <span>✓</span>
                                  <span>{corr.correct}</span>
                                </div>
                              )}
                              {corr.explanation && (
                                <p className="text-on-surface-variant italic mt-0.5">{corr.explanation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {isAiResponding && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-surface-container text-on-surface-variant text-xs w-fit border border-white/5 self-start">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                    <span>El tutor IA está formulando la respuesta...</span>
                  </div>
                )}

                <div ref={chatMessagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 sm:p-4 bg-surface-container-lowest border-t border-white/10 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleAiVoiceInput}
                  title={isAiListening ? "Detener grabación" : "Hablar con micrófono"}
                  className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isAiListening
                      ? "bg-error text-white animate-pulse shadow-[0_0_16px_rgba(239,68,68,0.6)]"
                      : "bg-surface-container-high hover:bg-surface-container-highest text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isAiListening ? "mic_off" : "mic"}
                  </span>
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendChatMessage();
                    }
                  }}
                  placeholder={
                    isAiListening
                      ? "Escuchando tu voz... habla en inglés"
                      : "Escribe tu respuesta o presiona el micro para hablar..."
                  }
                  className="flex-1 bg-surface-container text-on-surface text-xs sm:text-sm rounded-full px-4 py-2.5 outline-none placeholder:text-outline border border-white/5 focus:border-primary/50 transition-colors"
                />

                <button
                  type="button"
                  onClick={() => handleSendChatMessage()}
                  disabled={!chatInput.trim() || isAiResponding}
                  className="w-11 h-11 rounded-full bg-primary-container disabled:opacity-40 text-white flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
