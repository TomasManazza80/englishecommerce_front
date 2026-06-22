import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function TravelSpeakingPractice() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLB, setLoadingLB] = useState(false);

  // States from StudentPronunciation logic
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [recordingSentenceIndex, setRecordingSentenceIndex] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingResult, setLoadingResult] = useState(false);
  const [results, setResults] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef(null);
  const selectedTaskRef = useRef(null);
  const sentenceIndexRef = useRef(null);
  const transcriptRef = useRef('');
  const [voices, setVoices] = useState([]);

  useEffect(() => {
    fetchLeaderboard();
    fetchTasks();

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

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pronunciation/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudieron cargar las tareas.");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoadingLB(true);
      const response = await axios.get(`${API_URL}/api/pronunciation/leaderboard`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLeaderboard([
        { user: { name: 'Maria G.' }, total_score: 4500 },
        { user: { name: 'Juan P.' }, total_score: 4120 },
        { user: { name: 'Sofia T.' }, total_score: 3890 },
      ]);
    } finally {
      setLoadingLB(false);
    }
  };

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

  // Helper para asignar emojis aleatorios o basados en titulo
  const getEmojiForTask = (title) => {
    const t = title.toLowerCase();
    if (t.includes('airport') || t.includes('flight')) return '✈️';
    if (t.includes('hotel') || t.includes('room')) return '🏨';
    if (t.includes('restaurant') || t.includes('food')) return '🍝';
    if (t.includes('shop') || t.includes('buy')) return '🛍️';
    if (t.includes('direction') || t.includes('map')) return '🗺️';
    if (t.includes('taxi') || t.includes('car')) return '🚕';
    if (t.includes('friend') || t.includes('meet')) return '🌎';
    return '🗣️';
  };

  return (
    <div className="min-h-screen bg-[#f8f3f6] text-[#1d1d1d] font-sans">
      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-16 md:px-16 bg-gradient-to-br from-[#f9f1f7] to-[#efe4f2] pt-32">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-block bg-[#cfa6d8] text-black px-5 py-2 rounded-full text-sm font-semibold tracking-wide mb-5 shadow-md">
              AI SPEAKING PRACTICE
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">
              REAL-TIME <br />
              <span className="text-[#b273c2]">PRONUNCIATION</span>
              <br />
              SCENARIOS
            </h1>

            <p className="text-xl text-gray-700 leading-relaxed mb-8 max-w-xl">
              Practice real-life English conversations with the scenarios loaded by your teacher.
              Get instant feedback on your fluency and pronunciation.
            </p>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })} className="bg-[#b273c2] hover:bg-[#9d5fb0] text-white px-7 py-4 rounded-2xl text-lg font-semibold shadow-lg transition-all">
                Start Speaking 🎙️
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-[35px] shadow-2xl p-8 rotate-2 border border-[#f1dff3]">
              <div className="bg-[#f8f3f6] rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-[#b273c2] font-semibold">
                      Live AI Feedback
                    </p>
                    <h3 className="text-2xl font-bold mt-1">
                      Pronunciation Analysis
                    </h3>
                  </div>

                  <div className="w-16 h-16 rounded-full bg-[#e8d1ed] flex items-center justify-center text-3xl">
                    🎧
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Pronunciation</span>
                      <span className="font-bold text-[#b273c2]">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-[#b273c2] h-3 rounded-full w-[92%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEADERBOARD SECTION */}
      <section className="py-12 px-6 md:px-16 bg-white border-y border-[#f0dff3]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black mb-2 flex items-center justify-center gap-3">
              🏆 MONTHLY LEADERBOARD 🏆
            </h2>
            <p className="text-gray-600">
              Practice every day to increase your score and climb the ranks!
            </p>
          </div>

          <div className="bg-[#faf7fb] rounded-[30px] p-6 shadow-sm border border-[#ead4ef]">
            {loadingLB ? (
              <p className="text-center text-gray-500 py-8">Loading rankings...</p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((student, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-[#f1e4f5]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#cfa6d8] flex items-center justify-center font-bold text-black">
                        #{index + 1}
                      </div>
                      <span className="font-bold text-lg text-gray-800">
                        {student.user ? student.user.name : 'Unknown Student'}
                      </span>
                    </div>
                    <div className="bg-[#b273c2] text-white px-4 py-2 rounded-xl font-bold">
                      {student.total_score} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SCENARIOS */}
      <section className="px-6 md:px-16 py-20 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-2">
                SPEAKING SCENARIOS
              </h2>
              <p className="text-gray-600 text-lg">
                Sentence by sentence practice with real-time feedback.
              </p>
            </div>

            <div className="bg-white border border-[#ead4ef] rounded-full px-5 py-3 shadow-sm">
              <span className="font-semibold text-[#b273c2]">B1 • B2 • Self-study</span>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-[#f5f9f5] border border-[#d9f0da] text-red-700 p-4 rounded-2xl shadow-sm mb-8 font-medium">
              {errorMsg}
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[35px] shadow-xl border border-[#f0dff3]">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 font-bold text-lg">No hay escenarios de pronunciación cargados todavía.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
              {tasks.map((task, taskIdx) => {
                const taskResults = results[task.id] || {};
                const sentences = Array.isArray(task.expected_text) ? task.expected_text : [task.expected_text];
                const evaluatedCount = Object.keys(taskResults).length;
                const isComplete = evaluatedCount > 0 && evaluatedCount === sentences.length;
                const averageScore = isComplete
                  ? Math.round(Object.values(taskResults).reduce((acc, r) => acc + r.evaluation.score, 0) / sentences.length)
                  : 0;

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-[30px] overflow-hidden shadow-xl border border-[#f0dff3] hover:scale-[1.01] transition-all flex flex-col"
                  >
                    <div className="bg-gradient-to-r from-[#efdff3] to-[#f8f1fa] p-6 border-b border-[#edd9f2]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm">
                          {getEmojiForTask(task.title)}
                        </div>

                        {isComplete ? (
                          <div className="bg-[#b273c2] text-white px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
                            <span>Score: {averageScore}%</span>
                          </div>
                        ) : (
                          <div className="bg-white text-[#b273c2] px-4 py-2 rounded-full font-bold text-sm border border-[#e8d1ed]">
                            ID: 0{taskIdx + 1}
                          </div>
                        )}
                      </div>

                      <h3 className="text-2xl font-black leading-tight mb-2">
                        {task.title}
                      </h3>
                      {task.instruction && (
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                          {task.instruction}
                        </p>
                      )}
                    </div>

                    <div className="p-6 flex-1 bg-white">
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-[#f6edf8] text-[#8d5d9a] px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                            PRONUNCIATION
                          </span>
                          <span className="bg-[#f6edf8] text-[#8d5d9a] px-3 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                            FLUENCY
                          </span>
                        </div>
                      </div>

                      {/* SENTENCE BY SENTENCE UI */}
                      <div className="space-y-4">
                        {sentences.map((sentence, index) => {
                          const sentenceResult = taskResults[index];
                          const isSentenceRecording = isRecording && selectedTask?.id === task.id && recordingSentenceIndex === index;

                          return (
                            <div
                              key={index}
                              className="bg-[#faf5fb] border border-[#f0e2f4] rounded-[24px] p-5 hover:shadow-md transition-all group"
                            >
                              <p className="text-gray-800 font-medium text-[16px] italic mb-4 leading-relaxed">
                                <span className="text-[#b273c2] font-black mr-2 opacity-50">{index + 1}.</span>
                                "{sentence}"
                              </p>

                              <div className="flex items-center justify-between mt-2">
                                <button
                                  onClick={() => playWord(sentence)}
                                  className="w-10 h-10 rounded-full border border-[#e5d2ea] text-[#b273c2] flex items-center justify-center text-sm shadow-sm hover:bg-gray-50 transition-all"
                                  title="Listen native pronunciation"
                                >
                                  🔊
                                </button>

                                {isSentenceRecording ? (
                                  <button
                                    onClick={stopRecording}
                                    className="px-4 py-2 bg-red-500 text-white rounded-full font-bold animate-pulse shadow-lg text-sm flex items-center gap-2"
                                  >
                                    <div className="w-2 h-2 bg-white rounded-full"></div> DETENER
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => startRecording(task, index)}
                                    disabled={isRecording}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg shadow-md transition-all transform group-hover:scale-105 ${isRecording ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#b273c2] hover:bg-[#9c63ad]'}`}
                                    title="Record your voice"
                                  >
                                    🎙️
                                  </button>
                                )}
                              </div>

                              {/* Results & Progress display */}
                              {sentenceResult ? (
                                <div className="mt-4 pt-4 border-t border-[#f1e4f5]">
                                  <div className="flex justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                                    <span>Score</span>
                                    <span className="text-[#b273c2]">{sentenceResult.evaluation.score}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                    <div className="bg-[#b273c2] h-1.5 rounded-full" style={{ width: `${sentenceResult.evaluation.score}%` }}></div>
                                  </div>

                                  {sentenceResult.evaluation.errors?.length > 0 ? (
                                    <div className="space-y-1">
                                      {sentenceResult.evaluation.errors.map((err, idx) => (
                                        <p key={idx} className="text-[11px] text-gray-600 bg-white p-2 rounded-lg border border-[#f0dff3]">
                                          <span className="font-bold text-[#b273c2] mr-1">{err.word}:</span>
                                          {err.reason === 'omitted' ? 'Omitida' : `Sonó a "${err.reason}"`}
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] font-bold text-green-600 bg-green-50 p-2 rounded-lg border border-green-100 flex items-center gap-1">
                                      <span>✨</span> Perfect pronunciation
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-4 pt-4 border-t border-[#f1e4f5]">
                                  <div className="flex justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 opacity-50">
                                    <span>Pronunciation Progress</span>
                                    <span className="text-[#b273c2]">0%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 opacity-50">
                                    <div className="bg-[#b273c2] h-1.5 rounded-full w-[0%]"></div>
                                  </div>
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
          )}

          {/* Loading overlay for evaluation */}
          {loadingResult && (
            <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-white px-8 py-4 rounded-full shadow-2xl border border-[#f1dff3] flex items-center gap-4 z-50">
              <div className="w-6 h-6 border-2 border-[#e8d1ed] border-t-[#b273c2] rounded-full animate-spin"></div>
              <span className="font-bold text-gray-800">Evaluando con IA...</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
