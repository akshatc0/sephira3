"use client";

import { X, ExternalLink, Newspaper, Clock, Globe2 } from "lucide-react";
import type { NewsArticle } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NewsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  news: NewsArticle[];
  countries?: string[];
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "";
  }
}

export default function NewsPanel({ isOpen, onClose, news, countries }: NewsPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md z-50 transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div 
          className="h-full flex flex-col border-l border-white/10 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(18, 24, 52, 0.95) 0%, rgba(9, 13, 32, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Related News</h2>
                {countries && countries.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Globe2 className="w-3 h-3 text-white/40" />
                    <p className="text-xs text-white/40">
                      {countries.slice(0, 2).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          
          {/* News List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {news.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <Newspaper className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-sm">No news available</p>
              </div>
            ) : (
              news.map((article, index) => (
                <article
                  key={index}
                  className="group p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-200 hover:bg-white/[0.02]"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Source & Time */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {article.source}
                    </span>
                    {article.published && (
                      <span className="flex items-center gap-1 text-[10px] text-white/30">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(article.published)}
                      </span>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-sm font-medium text-white/90 leading-snug mb-2 line-clamp-2 group-hover:text-white transition-colors">
                    {article.title}
                  </h3>
                  
                  {/* Description */}
                  {article.description && (
                    <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-3">
                      {article.description}
                    </p>
                  )}
                  
                  {/* Link */}
                  {article.url && (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Read more
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </article>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-white/5">
            <p className="text-[10px] text-white/20 text-center">
              News provided for contextual analysis • Updated in real-time
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
