"use client";

import { useState, useEffect, useCallback } from "react";

export interface ChatSession {
  id: string;
  title: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "sephira_chat_history";

function generateId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getStoredChats(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredChats(chats: ChatSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

export function useChatHistory() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load chats from localStorage on mount
  useEffect(() => {
    const stored = getStoredChats();
    setChats(stored);
    setIsLoaded(true);
  }, []);

  // Get current chat
  const currentChat = chats.find((c) => c.id === currentChatId) || null;

  // Create a new chat
  const createNewChat = useCallback((): string => {
    const newChat: ChatSession = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    setChats((prev) => {
      const updated = [newChat, ...prev];
      saveStoredChats(updated);
      return updated;
    });
    
    setCurrentChatId(newChat.id);
    return newChat.id;
  }, []);

  // Save/update a chat
  const saveChat = useCallback(
    (
      chatId: string,
      messages: Array<{ role: "user" | "assistant"; content: string }>
    ) => {
      setChats((prev) => {
        const existingIndex = prev.findIndex((c) => c.id === chatId);
        
        // Generate title from first user message
        const firstUserMessage = messages.find((m) => m.role === "user");
        const title = firstUserMessage
          ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? "..." : "")
          : "New Chat";

        if (existingIndex >= 0) {
          // Update existing chat
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            title,
            messages,
            updatedAt: Date.now(),
          };
          saveStoredChats(updated);
          return updated;
        } else {
          // Create new chat
          const newChat: ChatSession = {
            id: chatId,
            title,
            messages,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          const updated = [newChat, ...prev];
          saveStoredChats(updated);
          return updated;
        }
      });
    },
    []
  );

  // Load a specific chat
  const loadChat = useCallback((chatId: string) => {
    setCurrentChatId(chatId);
  }, []);

  // Delete a chat
  const deleteChat = useCallback(
    (chatId: string) => {
      setChats((prev) => {
        const updated = prev.filter((c) => c.id !== chatId);
        saveStoredChats(updated);
        return updated;
      });
      
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
    },
    [currentChatId]
  );

  // Clear current chat (start fresh without saving)
  const clearCurrentChat = useCallback(() => {
    setCurrentChatId(null);
  }, []);

  // Get all chats sorted by updatedAt
  const getAllChats = useCallback((): ChatSession[] => {
    return [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [chats]);

  return {
    chats: getAllChats(),
    currentChat,
    currentChatId,
    isLoaded,
    createNewChat,
    saveChat,
    loadChat,
    deleteChat,
    clearCurrentChat,
    setCurrentChatId,
  };
}
