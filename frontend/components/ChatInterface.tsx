"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage, generateChart } from "@/lib/api";
import type { ChatRequest, ChartRequest } from "@/lib/api";
import MessageList from "./MessageList";
import ChartDisplay from "./ChartDisplay";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { cn } from "@/lib/utils";
import { BarChart3, Globe2, TrendingUp, Activity } from "lucide-react";

export default function ChatInterface() {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChart, setCurrentChart] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return;

    setError(null);
    setLoading(true);

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      // Build conversation history
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

      // Add assistant response
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

      // Handle chart
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

  // Determine Layout State
  const isChatStarted = messages.length > 0;

  return (
    <div className="flex flex-col h-full bg-background-primary/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden relative">
      
      {/* Messages Area */}
      <div className={cn(
          "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent transition-all duration-500",
          isChatStarted ? "p-6 opacity-100" : "p-0 opacity-0 hidden"
      )}>
        <MessageList messages={messages} loading={loading} />
        {currentChart && (
            <div className="mt-6 animate-fade-in">
                <ChartDisplay base64Image={currentChart} />
            </div>
        )}
        {error && (
          <div className="my-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Greeting View (Centered when empty) */}
      {!isChatStarted && (
         <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-fade-in z-0">
            {/* Logo/Greeting */}
            <div className="w-full max-w-3xl mb-8 text-center">
                <h1 className="text-3xl font-medium text-text-primary tracking-tight font-sans">
                    Sephira 0.0.1
                </h1>
            </div>

            {/* Centered Input */}
            <div className="w-full max-w-2xl mb-8">
                <ClaudeChatInput onSendMessage={handleSend} isLoading={loading} />
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto px-4">
                {[
                    { text: "Analyze Sentiment", icon: BarChart3, prompt: "Analyze global sentiment trends" },
                    { text: "Compare Regions", icon: Globe2, prompt: "Compare sentiment between US and China" },
                    { text: "Show Trends", icon: TrendingUp, prompt: "Show me the latest sentiment trends" },
                    { text: "Explain Volatility", icon: Activity, prompt: "Explain recent volatility in sentiment" }
                ].map((item, i) => (
                    <button 
                        key={i}
                        onClick={() => handleSend(item.prompt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary bg-transparent border border-white/10 rounded-full hover:bg-white/10 hover:text-text-primary transition-colors duration-150"
                    >
                        <item.icon className="w-4 h-4" />
                        {item.text}
                    </button>
                ))}
            </div>
         </div>
      )}

      {/* Fixed Input Area (Only when chat started) */}
      {isChatStarted && (
        <div className="p-4 bg-background-card-bottom/90 backdrop-blur-xl border-t border-white/5 z-10">
           <div className="max-w-3xl mx-auto w-full">
               <ClaudeChatInput onSendMessage={handleSend} isLoading={loading} />
           </div>
           <p className="text-center text-xs text-text-secondary/30 mt-3 font-light">
             AI generated responses may vary.
           </p>
        </div>
      )}
    </div>
  );
}
