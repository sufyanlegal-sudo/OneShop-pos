'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { AiChatboardView } from './AiChatboardView';
import { useShop } from '@/context/ShopContext';

export const AiChatboardFloatingButton: React.FC = () => {
  const { currentRole } = useShop();
  const [isOpen, setIsOpen] = useState(false);

  // Position state (persisted, draggable anywhere on screen)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const hasMovedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ai_bot_btn_pos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPos({
              x: Math.min(Math.max(10, parsed.x), window.innerWidth - 120),
              y: Math.min(Math.max(10, parsed.y), window.innerHeight - 60),
            });
          }
        }
      } catch {
        // Ignored
      }
    }
  }, []);

  if (currentRole !== 'ADMIN') {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    const currentX = pos ? pos.x : window.innerWidth - 150;
    const currentY = pos ? pos.y : window.innerHeight - 70;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }
    const newX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 140);
    const newY = Math.min(Math.max(10, dragStartRef.current.initialY + dy), window.innerHeight - 50);
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    if (pos) {
      localStorage.setItem('ai_bot_btn_pos', JSON.stringify(pos));
    }
    if (!hasMovedRef.current) {
      setIsOpen(true);
    }
  };

  const style: React.CSSProperties = pos
    ? { left: `${pos.x}px`, top: `${pos.y}px`, position: 'fixed' }
    : { right: '16px', bottom: '60px', position: 'fixed' };

  return (
    <>
      {/* Draggable Floating AI Action Button (User can move it anywhere on the screen) */}
      <div
        style={style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="z-50 no-print select-none touch-none cursor-grab active:cursor-grabbing animate-in fade-in"
        title="اس بٹن کو پکڑ کر سکرین پر جہاں چاہیں گھما سکتے ہیں (Draggable)"
      >
        <button
          type="button"
          className="group flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black rounded-full shadow-2xl shadow-cyan-500/30 border-2 border-cyan-200/50 hover:scale-105 active:scale-95 transition-transform"
        >
          <div className="w-5 h-5 rounded-full bg-slate-950 text-cyan-300 flex items-center justify-center shadow-inner">
            <Bot className="w-3.5 h-3.5 animate-bounce" />
          </div>
          <span className="text-xs font-sans font-bold">
            AI چیٹ بوٹ
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
