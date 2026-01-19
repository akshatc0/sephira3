"use client";

import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-[#0A0D1C] flex flex-col items-center">
      <div className="container mx-auto px-4 py-6 md:py-8 relative z-10 flex flex-col h-screen max-h-[1080px]">
        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col min-h-0">
          <ChatInterface />
        </div>
        
        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-white/30 font-light" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          © {new Date().getFullYear()} Sephira. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
