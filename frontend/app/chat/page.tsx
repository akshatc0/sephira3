"use client";

import ChatInterface from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-background-primary flex flex-col items-center">
      {/* Background Glow Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 relative z-10 flex flex-col h-screen max-h-[1080px]">
        {/* Main Content Area */}
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col min-h-0">
          <ChatInterface />
        </div>
        
        {/* Footer */}
        <footer className="mt-6 text-center text-xs text-text-secondary/30 font-light">
          © {new Date().getFullYear()} Sephira. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
