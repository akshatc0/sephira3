"use client";

import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <main className="min-h-screen h-screen bg-[#0A0D1C] flex flex-col overflow-hidden">
      {/* Header - fixed width, centered */}
      <header className="w-full border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-medium text-white/60 tracking-wide">SEPHIRA</span>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className="relative">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-40" />
            </div>
            <span>Live</span>
          </div>
        </div>
      </header>

      {/* Main Content - Full viewport centering */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <div className="w-full max-w-5xl mx-auto px-6 h-full">
          <ChatInterface />
        </div>
      </div>
      
      {/* Footer - Full width, text centered */}
      <footer className="w-full border-t border-white/5 py-4">
        <p className="text-center text-[11px] text-white/25">
          © {new Date().getFullYear()} Sephira. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
