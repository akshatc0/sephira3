"use client";

import { useState } from "react";
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { ChatSession } from "@/lib/useChatHistory";
import { cn } from "@/lib/utils";

interface SidebarProps {
  chats: ChatSession[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function Sidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [hoveredChat, setHoveredChat] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "h-full flex flex-col transition-all duration-300 ease-out relative",
        isCollapsed ? "w-16" : "w-64"
      )}
      style={{ backgroundColor: "#040810" }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/[0.06]">
        <button
          onClick={onNewChat}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
            "bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12]",
            isCollapsed && "justify-center px-0"
          )}
        >
          <Plus className="w-4 h-4 text-white/70" />
          {!isCollapsed && (
            <span className="text-sm text-white/70 font-medium">New Chat</span>
          )}
        </button>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {chats.length === 0 ? (
          !isCollapsed && (
            <div className="px-3 py-8 text-center">
              <MessageSquare className="w-8 h-8 text-white/20 mx-auto mb-3" />
              <p className="text-xs text-white/30">No chat history yet</p>
            </div>
          )
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={cn(
                "group relative rounded-lg transition-all duration-150 cursor-pointer",
                currentChatId === chat.id
                  ? "bg-white/[0.08]"
                  : "hover:bg-white/[0.04]"
              )}
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => setHoveredChat(null)}
              onClick={() => onSelectChat(chat.id)}
            >
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <MessageSquare
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    currentChatId === chat.id
                      ? "text-purple-400"
                      : "text-white/40"
                  )}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{chat.title}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {formatTimeAgo(chat.updatedAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Delete button */}
              {!isCollapsed && hoveredChat === chat.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteChat(chat.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-white/[0.06] hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white/50" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-white/50" />
              <span className="text-xs text-white/40">Collapse</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
