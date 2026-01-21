"use client";

import { useState, useRef, useEffect } from "react";
import { sendChatMessage, generateChart } from "@/lib/api";
import type { ChatRequest, ChartRequest, NewsArticle } from "@/lib/api";
import MessageList from "./MessageList";
import ChartDisplay from "./ChartDisplay";
import NewsPanel from "./NewsPanel";
import ClaudeChatInput from "@/components/ui/claude-style-chat-input";
import { cn } from "@/lib/utils";
import { BarChart3, Globe2, TrendingUp, Activity, Newspaper, Sparkles } from "lucide-react";

interface ChatInterfaceProps {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  onMessagesChange: (messages: Array<{ role: "user" | "assistant"; content: string }>) => void;
  sessionId?: string;
  onSessionIdChange: (id: string) => void;
}

export default function ChatInterface({
  messages,
  onMessagesChange,
  sessionId,
  onSessionIdChange,
}: ChatInterfaceProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChart, setCurrentChart] = useState<string | null>(null);
  const [newsOpen, setNewsOpen] = useState(false);
  const [currentNews, setCurrentNews] = useState<NewsArticle[]>([]);
  const [currentCountries, setCurrentCountries] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (message: string) => {
    if (!message.trim() || loading) return;

    setError(null);
    setLoading(true);
    setCurrentChart(null);

    // Add user message to UI
    const newMessages = [...messages, { role: "user" as const, content: message }];
    onMessagesChange(newMessages);

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
        onSessionIdChange(response.session_id);
      }

      // Update news
      if (response.news && response.news.length > 0) {
        setCurrentNews(response.news);
        setCurrentCountries(response.countries_mentioned || []);
      }

      // Add assistant response
      if (response.response) {
        onMessagesChange([
          ...newMessages,
          { role: "assistant", content: response.response },
        ]);
      } else {
        onMessagesChange([
          ...newMessages,
          { role: "assistant", content: "Sephira AI is processing your request. Please try again." },
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

      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("Failed to fetch")
      ) {
        setError("Unable to connect to Sephira AI.");
        onMessagesChange([
          ...newMessages,
          {
            role: "assistant",
            content:
              "Sephira AI is having trouble connecting right now. Please check your internet connection and try again.",
          },
        ]);
      } else {
        console.error("Chat error:", err);
        onMessagesChange([
          ...newMessages,
          {
            role: "assistant",
            content:
              "Sephira AI encountered an issue processing that request. Could you try rephrasing your question?",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Determine Layout State
  const isChatStarted = messages.length > 0;
  const hasNews = currentNews.length > 0;

  const suggestions = [
    { text: "Analyze Sentiment", icon: BarChart3, prompt: "Analyze global sentiment trends for the United States" },
    { text: "Compare Regions", icon: Globe2, prompt: "Compare sentiment between Germany and France" },
    { text: "Show Trends", icon: TrendingUp, prompt: "Show me sentiment trends for China over the last year" },
    { text: "Explain Changes", icon: Activity, prompt: "Explain recent changes in UK sentiment" },
  ];

  return (
    <>
      <div className="flex flex-col h-full relative overflow-hidden">
        {/* Header - Only show when chat is active */}
        {isChatStarted && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-black/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <h1 className="text-sm font-medium text-white">Sephira AI</h1>
                <p className="text-[10px] text-white/40">Sentiment Analysis Assistant</p>
              </div>
            </div>

            {/* News Toggle Button */}
            {hasNews && (
              <button
                onClick={() => setNewsOpen(true)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 transition-all duration-200 group"
              >
                <Newspaper className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-white/60 group-hover:text-white/80 transition-colors">
                  News
                </span>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-[10px] font-medium text-purple-400">
                  {currentNews.length}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Messages Area */}
        <div
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent transition-all duration-500",
            isChatStarted ? "p-6 md:p-8 pb-32 opacity-100" : "p-0 opacity-0 hidden"
          )}
        >
          <div className="max-w-3xl mx-auto">
            <MessageList messages={messages} loading={loading} />
            {currentChart && (
              <div className="mt-6 animate-fade-in">
                <ChartDisplay base64Image={currentChart} />
              </div>
            )}
            {error && (
              <div className="my-4 p-4 border border-red-500/20 rounded-2xl text-red-400 text-sm text-center bg-red-500/5">
                {error}
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Greeting View (Centered when empty) */}
        {!isChatStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-fade-in">
            {/* Logo & Greeting */}
            <div className="text-center mb-auto mt-[15vh]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 mb-6 animate-float">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-medium mb-3">
                <span className="text-white">Hello, </span>
                <span className="gradient-text">Akshat</span>
              </h1>
              <p className="text-lg text-white/40 font-light">
                How can I help you today?
              </p>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Suggestion Chips - Above Input */}
            <div className="flex flex-wrap justify-center gap-2 mb-6 max-w-2xl px-4">
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(item.prompt)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/60 bg-white/[0.03] border border-white/[0.08] rounded-full chip-hover"
                >
                  <item.icon className="w-4 h-4 text-purple-400/70" />
                  {item.text}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="w-full max-w-2xl mb-8">
              <ClaudeChatInput onSendMessage={handleSend} isLoading={loading} />
            </div>

            {/* Footer Text */}
            <p className="text-xs text-white/20 mb-8">
              Analyzing 20,362 data points across 32 countries
            </p>
          </div>
        )}

        {/* Floating Input (Only when chat started) */}
        {isChatStarted && (
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-[#050b14] via-[#050b14]/95 to-transparent">
            <ClaudeChatInput onSendMessage={handleSend} isLoading={loading} />
            <p className="text-center text-[10px] mt-3 text-white/20">
              Sephira AI responses are generated based on sentiment data and current news
            </p>
          </div>
        )}
      </div>

      {/* News Panel */}
      <NewsPanel
        isOpen={newsOpen}
        onClose={() => setNewsOpen(false)}
        news={currentNews}
        countries={currentCountries}
      />
    </>
  );
}
