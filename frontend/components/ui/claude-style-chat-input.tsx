"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaudeChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading?: boolean;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ onSendMessage, isLoading }) => {
    const [message, setMessage] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px";
        }
    }, [message]);

    const handleSend = () => {
        if (!message.trim() || isLoading) return;
        onSendMessage(message);
        setMessage("");
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim().length > 0;

    return (
        <div className="relative w-full max-w-2xl mx-auto transition-all duration-300" style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
            {/* Main Container */}
            <div className={`
                flex flex-col items-stretch transition-all duration-200 relative z-10 rounded-2xl cursor-text border border-white/[0.08]
                hover:border-white/[0.12] focus-within:border-indigo-500/30 focus-within:shadow-[0_0_0_2px_rgba(99,102,241,0.1)]
            `} style={{ background: 'linear-gradient(180deg, rgba(18, 24, 52, 0.6) 0%, rgba(9, 13, 32, 0.8) 100%)' }}>
                <div className="flex flex-col px-5 pt-5 pb-4 gap-3">
                    {/* Input Area */}
                    <div className="relative mb-2">
                        <div className="max-h-96 w-full overflow-y-auto custom-scrollbar font-sans break-words transition-opacity duration-200 min-h-[3rem] pl-1">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Sephira about global sentiment..."
                                className="w-full bg-transparent border-0 outline-none text-[15px] md:text-[16px] resize-none overflow-hidden py-3 leading-relaxed block font-normal antialiased placeholder:text-white/45"
                                rows={1}
                                autoFocus
                                style={{ 
                                    minHeight: '1.5em',
                                    color: '#FFFFFF',
                                    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
                                }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-3 w-full items-center justify-between pt-1">
                        <div className="text-xs pl-1" style={{ color: 'rgba(255, 255, 255, 0.45)' }}>
                            {/* Optional: Add hint or status here */}
                        </div>

                        {/* Send Button */}
                        <div>
                            <button
                                onClick={handleSend}
                                disabled={!hasContent || isLoading}
                                className={cn(
                                    "inline-flex items-center justify-center relative shrink-0 transition-all duration-200 h-9 w-9",
                                    hasContent && !isLoading
                                        ? "bg-white text-black hover:bg-white/90 shadow-lg hover:shadow-xl scale-100 hover:scale-105"
                                        : "bg-white/20 text-white/40 cursor-not-allowed scale-95 opacity-50"
                                )}
                                style={{ borderRadius: '14px', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
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
                </div>
            </div>

        </div>
    );
};

export default ClaudeChatInput;
