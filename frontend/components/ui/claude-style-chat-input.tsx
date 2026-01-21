"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaudeChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  floating?: boolean;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ 
  onSendMessage, 
  isLoading,
  floating = false 
}) => {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!message.trim() || isLoading) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasContent = message.trim().length > 0;

  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto",
        floating && "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4"
      )}
    >
      {/* Pill-shaped Input Container */}
      <div
        className={cn(
          "flex items-center gap-3 h-14 px-4 rounded-full",
          "glass-input floating-input-shadow",
          "transition-all duration-200"
        )}
      >
        {/* Plus/Attachment Button */}
        <button
          type="button"
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
          aria-label="Add attachment"
        >
          <Plus className="w-4 h-4 text-white/50" />
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Sephira about global sentiment..."
          className="flex-1 bg-transparent border-0 outline-none text-[15px] text-white placeholder:text-white/40 font-normal"
          disabled={isLoading}
          autoComplete="off"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!hasContent || isLoading}
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
            hasContent && !isLoading
              ? "bg-[#8b5cf6] hover:bg-[#7c3aed] text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 scale-100"
              : "bg-white/[0.08] text-white/30 cursor-not-allowed scale-95"
          )}
          type="button"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ClaudeChatInput;
