import React from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { BookOpen, Lightbulb, Languages, ArrowLeft, Camera } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface ExplanationCardProps {
  explanation: string;
  language: string;
  onBack: () => void;
}

export default function ExplanationCard({ explanation, language, onBack }: ExplanationCardProps) {
  const isBengali = language === 'Bengali';
  const isNepali = language === 'Nepali';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-xl overflow-hidden border border-amber-100"
    >
      <div className="bg-amber-500 p-4 flex items-center justify-between text-white">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 hover:bg-white/10 px-3 py-1 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">{language}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Lightbulb className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className={cn(
            "text-2xl font-bold text-stone-800",
            isBengali && "font-bengali",
            isNepali && "font-nepali"
          )}>
            {isBengali ? "সহজ ব্যাখ্যা" : isNepali ? "सजिलो व्याख्या" : "Simple Explanation"}
          </h2>
        </div>

        <div className={cn(
          "markdown-body",
          isBengali && "font-bengali text-lg",
          isNepali && "font-nepali text-lg"
        )}>
          <ReactMarkdown>{explanation}</ReactMarkdown>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col gap-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <BookOpen className="w-5 h-5 text-amber-600 mt-1 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900 mb-1">Mentor's Tip</p>
              <p className="text-sm text-amber-800/80 leading-relaxed">
                Try to draw this diagram in your notebook. Seeing it with your own hands helps you remember better!
              </p>
            </div>
          </div>
          
          <button
            onClick={onBack}
            className="w-full py-4 bg-stone-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Scan Another Problem
          </button>
        </div>
      </div>
    </motion.div>
  );
}
