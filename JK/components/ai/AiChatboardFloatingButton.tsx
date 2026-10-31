'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, X, MessageSquare } from 'lucide-react';
import { AiChatboardView } from './AiChatboardView';

export const AiChatboardFloatingButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Pill / Trigger Button */}
      <div className="fixed bottom-14 right-4 z-40 no-print animate-in fade-in zoom-in-95">
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-full shadow-2xl shadow-cyan-500/30 border-2 border-cyan-200/50 hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-6 h-6 rounded-full bg-slate-950 text-cyan-300 flex items-center justify-center shadow-inner">
            <Bot className="w-4 h-4 animate-bounce" />
          </div>
          <span className="text-xs tracking-wide font-sans hidden sm:inline">
            AI رپورٹ چیٹ بورڈ
          </span>
          <span className="text-xs font-sans sm:hidden">
            رپورٹ چیٹ
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>
      </div>

      {/* Floating Chatboard Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-3xl">
            <AiChatboardView isModal onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
};
