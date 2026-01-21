"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage, generateChart } from "@/lib/api";
import type { ChatRequest, ChartRequest } from "@/lib/api";
import MessageList from "./MessageList";
import ChartDisplay from "./ChartDisplay";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { BarChart3, Globe2, TrendingUp, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTIONS = [
  { text: "Analyze Sentiment", icon: BarChart3, prompt: "Analyze global sentiment trends for the past 5 years", desc: "Trends & patterns" },
  { text: "Compare Regions", icon: Globe2, prompt: "Compare sentiment between US and China from 2020 to 2024", desc: "Cross-country analysis" },
  { text: "Show Trends", icon: TrendingUp, prompt: "Show me the latest sentiment trends in Europe", desc: "Recent movements" },
  { text: "Explain Volatility", icon: Activity, prompt: "Explain recent volatility in global sentiment", desc: "Market insights" }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChart, setCurrentChart] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return;

    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const conversationHistory: Array<{ user: string; assistant: string }> = [];
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].role === "user" && messages[i + 1]?.role === "assistant") {
          conversationHistory.push({
            user: messages[i].content,
            assistant: messages[i + 1].content,
          });
          i++; 
        }
      }

      const request: ChatRequest = {
        message: message,
        session_id: sessionId,
        conversation_history: conversationHistory,
      };

      const response = await sendChatMessage(request);

      if (response.session_id) {
        setSessionId(response.session_id);
      }

      if (response.response) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "I'm having trouble with that request. Could you try rephrasing your question?" },
        ]);
      }

      if (response.chart_request && response.chart_request.needs_chart) {
        try {
          const chartRequest: ChartRequest = {
            countries: response.chart_request.countries || [],
            date_range: response.chart_request.date_range || {
              start: "2020-01-01",
              end: "2024-12-31",
            },
            chart_type: response.chart_request.chart_type || "time_series",
            title: response.chart_request.title || "Sentiment Trends",
          };

          const chartResponse = await generateChart(chartRequest);
          setCurrentChart(chartResponse.base64_image);
        } catch (chartError) {
          console.error("Chart generation error:", chartError);
        }
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection error";
      
      if (errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("Failed to fetch")) {
        setError("Unable to connect to the server.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm having trouble connecting right now. Please check your internet connection.",
          },
        ]);
      } else {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm having trouble processing that request. Could you try rephrasing?",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const isChatStarted = messages.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      
      {/* Messages Area - Only shows when chat started */}
      {isChatStarted && (
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent px-6 md:px-8 py-8 md:py-10">
          <div className="max-w-3xl mx-auto">
            <MessageList messages={messages} loading={loading} />
            {currentChart && (
                <div className="mt-10 animate-fade-in">
                    <ChartDisplay base64Image={currentChart} />
                </div>
            )}
            {error && (
              <div className="my-8 p-4 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center bg-red-500/5">
                {error}
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Hero View - Centered */}
      {!isChatStarted && (
        <motion.div 
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Background Glow Orb */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none blur-3xl"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(16,185,129,0.05) 40%, transparent 70%)"
            }}
            animate={{ 
              opacity: [0.4, 0.6, 0.4],
              scale: [1, 1.03, 1]
            }}
            transition={{ 
              duration: 6, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Hero Content */}
          <div className="relative z-10 w-full max-w-2xl mx-auto px-6 pb-8 flex flex-col items-center">
            {/* Title */}
            <motion.h1 
              className="text-5xl md:text-6xl font-semibold text-white tracking-tight text-center"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
            >
              Sephira
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="mt-4 text-base md:text-lg text-white/60 max-w-md text-center leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              Track how the world feels — 32 countries, 55 years of data, one question away.
            </motion.p>

            {/* Input */}
            <motion.div 
              className="w-full max-w-xl mt-10 mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.2, 0, 0, 1] }}
            >
              <ClaudeChatInput onSendMessage={handleSend} isLoading={loading} />
            </motion.div>

            {/* Live indicator */}
            <motion.div 
              className="flex items-center justify-center gap-2 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-50" />
              </div>
              <p className="text-xs text-white/45">
                  20,362 data points ready to analyze
              </p>
            </motion.div>

            {/* Suggestion Cards */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {SUGGESTIONS.map((item, i) => (
                  <motion.button 
                      key={i}
                      variants={itemVariants}
                      onClick={() => handleSend(item.prompt)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative p-3 rounded-xl text-left transition-colors duration-200
                                 border border-white/[0.08] hover:border-white/15
                                 bg-gradient-to-b from-white/[0.04] to-transparent
                                 hover:from-white/[0.06] hover:shadow-lg hover:shadow-indigo-500/5"
                  >
                      {/* Icon */}
                      <div className="w-7 h-7 rounded-lg bg-white/[0.08] flex items-center justify-center mb-2
                                      group-hover:bg-indigo-500/20 transition-colors duration-200">
                          <item.icon className="w-3.5 h-3.5 text-white/50 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      
                      {/* Text */}
                      <span className="block text-[13px] font-medium text-white/70 group-hover:text-white transition-colors">
                          {item.text}
                      </span>
                      <span className="block text-[11px] text-white/35 mt-0.5">
                          {item.desc}
                      </span>
                      
                      {/* Arrow on hover */}
                      <ArrowRight className="absolute right-2.5 top-3 w-3.5 h-3.5 text-white/0 group-hover:text-white/25 
                                             transition-all duration-200 translate-x-0 group-hover:translate-x-1" />
                  </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Fixed Input Area (Only when chat started) */}
      {isChatStarted && (
        <div className="px-6 md:px-8 py-6 border-t border-white/5 z-10" style={{ background: 'rgba(9, 13, 32, 0.95)' }}>
           <div className="max-w-3xl mx-auto w-full">
               <ClaudeChatInput onSendMessage={handleSend} isLoading={loading} />
           </div>
           <p className="text-center text-[11px] mt-4 text-white/25">
             Responses are AI-generated and may vary
           </p>
        </div>
      )}
    </div>
  );
}
