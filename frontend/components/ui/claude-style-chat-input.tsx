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
        <div className="relative w-full max-w-2xl mx-auto transition-all duration-300 font-sans">
            {/* Main Container */}
            <div className={`
                flex flex-col mx-2 md:mx-0 items-stretch transition-all duration-200 relative z-10 rounded-2xl cursor-text border border-bg-300 
                shadow-[0_0_15px_rgba(0,0,0,0.08)] hover:shadow-[0_0_20px_rgba(0,0,0,0.12)]
                focus-within:shadow-[0_0_25px_rgba(0,0,0,0.15)] focus-within:border-accent/50
                bg-bg-100 font-sans antialiased
            `}>
                <div className="flex flex-col px-3 pt-3 pb-2 gap-2">
                    {/* Input Area */}
                    <div className="relative mb-1">
                        <div className="max-h-96 w-full overflow-y-auto custom-scrollbar font-sans break-words transition-opacity duration-200 min-h-[2.5rem] pl-1">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask Sephira about global sentiment..."
                                className="w-full bg-transparent border-0 outline-none text-text-100 text-[16px] placeholder:text-text-400 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased"
                                rows={1}
                                autoFocus
                                style={{ minHeight: '1.5em' }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-2 w-full items-center justify-between">
                        <div className="text-xs text-text-400 pl-1">
                            {/* Optional: Add hint or status here */}
                        </div>

                        {/* Send Button */}
                        <div>
                            <button
                                onClick={handleSend}
                                disabled={!hasContent || isLoading}
                                className={cn(
                                    "inline-flex items-center justify-center relative shrink-0 transition-all duration-200 h-8 w-8 rounded-lg",
                                    hasContent && !isLoading
                                        ? "bg-accent text-white hover:bg-accent-hover shadow-md scale-100"
                                        : "bg-bg-300 text-text-400 cursor-not-allowed scale-95 opacity-50"
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
                </div>
            </div>

            <div className="text-center mt-4">
                <p className="text-xs text-text-500">
                    AI-generated insights based on 20,362 rows of sentiment data.
                </p>
            </div>
        </div>
    );
};

export default ClaudeChatInput;
