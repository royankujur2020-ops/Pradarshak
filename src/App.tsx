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
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState('English');
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">Pradarshak</h1>
              <p className="text-[10px] uppercase tracking-widest text-amber-600 font-bold">The Visual Mentor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={cn(
                "p-2 rounded-full transition-colors",
                showHistory ? "bg-amber-100 text-amber-600" : "text-stone-400 hover:bg-stone-100"
              )}
            >
              <History className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto p-6 space-y-8">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                  <History className="w-5 h-5 text-amber-500" />
                  Recent Scans
                </h2>
                {history.length > 0 && (
                  <button 
                    onClick={clearHistory}
                    className="text-xs font-medium text-stone-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-stone-100">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-stone-300" />
                  </div>
                  <p className="text-stone-500">No scans yet. Start by scanning a book!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setExplanation(item.explanation);
                        setLanguage(item.language);
                        setShowHistory(false);
                      }}
                      className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all text-left group flex items-center justify-between"
                    >
                      <div>
                        <h3 className="font-bold text-stone-800 group-hover:text-amber-600 transition-colors">
                          {item.subject}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                            {item.language}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-amber-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : explanation ? (
            <ExplanationCard 
              explanation={explanation} 
              language={language} 
              onBack={() => setExplanation(null)} 
            />
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Language Selector */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-stone-100 flex gap-1">
                {['English', 'Bengali', 'Nepali'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                      language === lang 
                        ? "bg-amber-500 text-white shadow-md scale-[1.02]" 
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
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl flex gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Info className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm mb-1">How it works</h4>
                  <p className="text-xs text-emerald-800/70 leading-relaxed">
                    Point your camera at any diagram or math problem. Pradarshak will explain it using things you see around you every day, like mangoes, rivers, and sweets.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center text-stone-400 text-xs">
        <p>© 2026 Pradarshak • Empowering Rural Education</p>
        <p className="mt-2 flex items-center justify-center gap-1">
          Made with <Sparkles className="w-3 h-3 text-amber-400" /> for the future of learning
        </p>
      </footer>
    </div>
  );
}
