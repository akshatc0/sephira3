"use client";

import { Sparkles, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
}

// Simple markdown-like formatting for AI responses
function formatAIResponse(content: string) {
  // Split by double newlines to get paragraphs
  const paragraphs = content.split(/\n\n+/);
  
  return paragraphs.map((paragraph, pIndex) => {
    // Check if it's a bullet list
    const lines = paragraph.split('\n');
    const isBulletList = lines.every(line => 
      line.trim().startsWith('•') || 
      line.trim().startsWith('-') || 
      line.trim().startsWith('*') ||
      line.trim() === ''
    );
    
    if (isBulletList && lines.some(line => line.trim())) {
      return (
        <ul key={pIndex} className="space-y-2 my-3">
          {lines.filter(line => line.trim()).map((line, lIndex) => (
            <li key={lIndex} className="flex items-start gap-2 text-[15px] leading-relaxed">
              <span className="text-indigo-400 mt-1.5">•</span>
              <span>{line.replace(/^[•\-*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      );
    }
    
    // Check for numbered lists
    const isNumberedList = lines.every(line => 
      /^\d+[\.\)]\s/.test(line.trim()) || line.trim() === ''
    );
    
    if (isNumberedList && lines.some(line => line.trim())) {
      return (
        <ol key={pIndex} className="space-y-2 my-3">
          {lines.filter(line => line.trim()).map((line, lIndex) => (
            <li key={lIndex} className="flex items-start gap-3 text-[15px] leading-relaxed">
              <span className="text-indigo-400 font-medium min-w-[20px]">{lIndex + 1}.</span>
              <span>{line.replace(/^\d+[\.\)]\s*/, '')}</span>
            </li>
          ))}
        </ol>
      );
    }
    
    // Check for headers (lines ending with : that are short)
    if (paragraph.length < 80 && paragraph.endsWith(':')) {
      return (
        <h4 key={pIndex} className="text-sm font-medium text-white/90 mt-4 mb-2 uppercase tracking-wide">
          {paragraph}
        </h4>
      );
    }
    
    // Regular paragraph
    return (
      <p key={pIndex} className="text-[15px] leading-relaxed text-white/80 my-2">
        {paragraph}
      </p>
    );
  });
}

export default function MessageList({ messages, loading }: MessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`flex gap-4 ${
            message.role === "user" ? "justify-end" : "justify-start"
          } animate-fade-in`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {/* Assistant Avatar */}
          {message.role === "assistant" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          )}
          
          {/* Message Bubble */}
          <div
            className={`max-w-[85%] sm:max-w-[80%] ${
              message.role === "user"
                ? "bg-white text-gray-900 rounded-2xl rounded-tr-md px-5 py-3.5"
                : "text-white/90"
            }`}
          >
            {message.role === "user" ? (
              <p className="text-[15px] leading-relaxed">
                {message.content}
              </p>
            ) : (
              <div className="prose-sm">
                {formatAIResponse(message.content)}
              </div>
            )}
          </div>
          
          {/* User Avatar */}
          {message.role === "user" && (
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
              <User className="w-4 h-4 text-white/60" />
            </div>
          )}
        </div>
      ))}
      
      {/* Loading State */}
      {loading && (
        <div className="flex gap-4 justify-start animate-fade-in">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 px-4 py-3">
            <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}
    </div>
  );
}
