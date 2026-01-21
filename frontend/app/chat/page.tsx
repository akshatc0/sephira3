"use client";

import { useState, useEffect, useCallback } from "react";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import { useChatHistory } from "@/lib/useChatHistory";

export default function ChatPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();

  const {
    chats,
    currentChatId,
    isLoaded,
    createNewChat,
    saveChat,
    loadChat,
    deleteChat,
    setCurrentChatId,
  } = useChatHistory();

  // Load messages when current chat changes
  useEffect(() => {
    if (!isLoaded) return;
    
    const currentChat = chats.find((c) => c.id === currentChatId);
    if (currentChat) {
      setMessages(currentChat.messages);
    } else {
      setMessages([]);
    }
  }, [currentChatId, chats, isLoaded]);

  // Save messages when they change
  const handleMessagesChange = useCallback(
    (newMessages: Array<{ role: "user" | "assistant"; content: string }>) => {
      setMessages(newMessages);
      
      // Auto-create chat on first message if none exists
      if (newMessages.length > 0) {
        if (currentChatId) {
          saveChat(currentChatId, newMessages);
        } else {
          const newId = createNewChat();
          saveChat(newId, newMessages);
        }
      }
    },
    [currentChatId, saveChat, createNewChat]
  );

  // Handle new chat
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setCurrentChatId(null);
  }, [setCurrentChatId]);

  // Handle select chat
  const handleSelectChat = useCallback(
    (chatId: string) => {
      loadChat(chatId);
      setSessionId(undefined); // Reset session for loaded chat
    },
    [loadChat]
  );

  // Handle delete chat
  const handleDeleteChat = useCallback(
    (chatId: string) => {
      deleteChat(chatId);
      if (chatId === currentChatId) {
        setMessages([]);
        setSessionId(undefined);
      }
    },
    [deleteChat, currentChatId]
  );

  return (
    <main className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatInterface
          messages={messages}
          onMessagesChange={handleMessagesChange}
          sessionId={sessionId}
          onSessionIdChange={setSessionId}
        />
      </div>
    </main>
  );
}
