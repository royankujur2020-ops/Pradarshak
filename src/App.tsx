import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  History, 
  Languages, 
  Loader2, 
  Sparkles, 
  Info,
  ChevronRight,
  Trash2
} from 'lucide-react';
import CameraScanner from './components/CameraScanner';
import ExplanationCard from './components/ExplanationCard';
import { cn } from './lib/utils';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ScanHistory {
  id: string;
  timestamp: number;
  explanation: string;
  language: string;
  subject: string;
}

export default function App() {
  const [view, setView] = useState<'landing' | 'tutor' | 'history'>('landing');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('English');
  const [history, setHistory] = useState<ScanHistory[]>([]);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('pradarshak_history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = (newScan: ScanHistory) => {
    const updatedHistory = [newScan, ...history].slice(0, 10); // Keep last 10
    setHistory(updatedHistory);
    localStorage.setItem('pradarshak_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('pradarshak_history');
  };

  const handleCapture = async (imageData: string) => {
    setIsProcessing(true);
    setExplanation(null);

    try {
      const base64Data = imageData.split(',')[1];
      
      const prompt = `
        You are "Pradarshak", a friendly AI tutor for rural students. 
        Analyze the provided image (textbook page, diagram, or handwritten problem).
        
        1. Identify the core concept or problem.
        2. Explain it simply in ${language}.
        3. IMPORTANT: Use local, rural metaphors (e.g., use "falling mangoes" for gravity, "flowing river" for electricity, "sharing sweets" for division).
        4. Keep the explanation concise, encouraging, and clear.
        5. Format using Markdown with clear headings.
        
        If the image is not a textbook or academic problem, politely ask the student to scan a study material.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
            ]
          }
        ]
      });

      const resultText = response.text || "I couldn't understand that. Please try scanning again with better light.";
      setExplanation(resultText);
      
      // Extract a simple subject for history
      const subjectMatch = resultText.match(/# (.*)/);
      const subject = subjectMatch ? subjectMatch[1] : "New Scan";

      saveToHistory({
        id: Date.now().toString(),
        timestamp: Date.now(),
        explanation: resultText,
        language,
        subject
      });

    } catch (error) {
      console.error("AI Error:", error);
      setExplanation("Sorry, I'm having trouble connecting. Please check your internet or try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderLanding = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12 py-12"
    >
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
          Empowering Rural Education
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
          Your Personal Mentor, <br />
          <span className="text-amber-600">Right in Your Pocket.</span>
        </h2>
        <p className="text-stone-600 text-lg max-w-lg mx-auto leading-relaxed">
          Pradarshak turns your textbook into a conversation. Scan any problem and get explanations using metaphors you already know.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button 
            onClick={() => setView('tutor')}
            className="w-full sm:w-auto px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-bold shadow-xl shadow-amber-200 transition-all flex items-center justify-center gap-2 group"
          >
            Start Learning Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('how-it-works');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-8 py-4 bg-white text-stone-700 border-2 border-stone-100 hover:border-amber-200 rounded-2xl font-bold transition-all"
          >
            How it Works
          </button>
        </div>
      </section>

      {/* Stats/Features Grid */}
      <section id="how-it-works" className="grid md:grid-cols-3 gap-6 pt-12">
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
            <Languages className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-3">Local Languages</h3>
          <p className="text-stone-600 text-sm leading-relaxed">
            Learn in English, Bengali, or Nepali. We speak the language you're most comfortable with.
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-3">Familiar Metaphors</h3>
          <p className="text-stone-600 text-sm leading-relaxed">
            We use examples from rural life—like mangoes and rivers—to explain complex science and math.
          </p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <History className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-stone-900 mb-3">Save Progress</h3>
          <p className="text-stone-600 text-sm leading-relaxed">
            Your recent scans are saved locally so you can review them anytime, even without a mentor.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-stone-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-md">
          <h3 className="text-2xl font-bold">Our Mission</h3>
          <p className="text-stone-400 leading-relaxed">
            We believe that every student, regardless of their location, deserves access to high-quality education that resonates with their reality.
          </p>
          <div className="pt-4 flex items-center gap-3 text-amber-400 font-bold">
            <BookOpen className="w-6 h-6" />
            <span>Bridging the Education Gap</span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
      </section>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans selection:bg-amber-200">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => setView('landing')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl font-bold text-stone-900 tracking-tight leading-none">Pradarshak</h1>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold mt-1">The Visual Mentor</p>
            </div>
          </button>
          
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setView('landing')}
              className={cn("text-sm font-bold transition-colors", view === 'landing' ? "text-amber-600" : "text-stone-500 hover:text-stone-900")}
            >
              Home
            </button>
            <button 
              onClick={() => setView('tutor')}
              className={cn("text-sm font-bold transition-colors", view === 'tutor' ? "text-amber-600" : "text-stone-500 hover:text-stone-900")}
            >
              Tutor
            </button>
            <button 
              onClick={() => setView('history')}
              className={cn("text-sm font-bold transition-colors", view === 'history' ? "text-amber-600" : "text-stone-500 hover:text-stone-900")}
            >
              History
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setView(view === 'history' ? 'tutor' : 'history')}
              className={cn(
                "p-2.5 rounded-full transition-all",
                view === 'history' ? "bg-amber-100 text-amber-600" : "text-stone-400 hover:bg-stone-100"
              )}
            >
              <History className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setView('tutor')}
              className="md:hidden p-2.5 bg-amber-500 text-white rounded-full shadow-md active:scale-95 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6">
        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            renderLanding()
          ) : view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto py-12 space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <History className="w-6 h-6 text-amber-600" />
                  </div>
                  Recent Learning
                </h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-xs font-bold text-stone-400 hover:text-red-500 flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-16 text-center border border-stone-100 shadow-sm">
                  <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-10 h-10 text-stone-300" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-800 mb-2">No scans yet</h3>
                  <p className="text-stone-500 max-w-xs mx-auto">Start by scanning a book problem in the Tutor section!</p>
                  <button 
                    onClick={() => setView('tutor')}
                    className="mt-8 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-100"
                  >
                    Go to Tutor
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setExplanation(item.explanation);
                        setLanguage(item.language);
                        setView('tutor');
                      }}
                      className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group flex items-center justify-between"
                    >
                      <div className="space-y-2">
                        <h3 className="font-bold text-stone-900 group-hover:text-amber-600 transition-colors text-lg">
                          {item.subject}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {item.language}
                          </span>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-amber-50 transition-colors">
                        <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="tutor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto py-12 space-y-8"
            >
              {explanation ? (
                <ExplanationCard 
                  explanation={explanation} 
                  language={language} 
                  onBack={() => setExplanation(null)} 
                />
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-stone-900">The Visual Tutor</h2>
                    <p className="text-stone-500">Pick a language and scan your textbook</p>
                  </div>

                  {/* Language Selector */}
                  <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-100 flex gap-1">
                    {['English', 'Bengali', 'Nepali'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={cn(
                          "flex-1 py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                          language === lang 
                            ? "bg-amber-500 text-white shadow-lg scale-[1.02]" 
                            : "text-stone-500 hover:bg-stone-50"
                        )}
                      >
                        <Languages className="w-4 h-4" />
                        {lang}
                      </button>
                    ))}
                  </div>

                  {/* Camera Section */}
                  <div className="relative">
                    <CameraScanner onCapture={handleCapture} isProcessing={isProcessing} />
                    
                    {isProcessing && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white z-10">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="w-12 h-12 text-amber-400" />
                        </motion.div>
                        <motion.p 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 font-bold text-lg flex items-center gap-2"
                        >
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          Mentor is thinking...
                        </motion.p>
                        <p className="text-white/60 text-sm mt-1">Finding the best local metaphor</p>
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex gap-5">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
                      <Info className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1">Quick Tip</h4>
                      <p className="text-sm text-emerald-800/70 leading-relaxed">
                        Point your camera at any diagram or math problem. Pradarshak will explain it using things you see around you every day, like mangoes, rivers, and sweets.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-20">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-stone-900">Pradarshak</span>
            </div>
            <div className="flex gap-8 text-sm font-bold text-stone-500">
              <button onClick={() => setView('landing')} className="hover:text-amber-600">Home</button>
              <button onClick={() => setView('tutor')} className="hover:text-amber-600">Tutor</button>
              <button onClick={() => setView('history')} className="hover:text-amber-600">History</button>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-stone-100 text-center text-stone-400 text-xs">
            <p>© 2026 Pradarshak • Empowering Rural Education</p>
            <p className="mt-2 flex items-center justify-center gap-1">
              Made with <Sparkles className="w-3 h-3 text-amber-400" /> for the future of learning
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
