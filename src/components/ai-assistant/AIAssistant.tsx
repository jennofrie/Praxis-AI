"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAdmin } from "@/components/providers/AdminContext";
import { useAIAssistant } from "@/components/providers/AIAssistantContext";
import {
  Send,
  Bot,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    provider?: string;
    cached?: boolean;
    responseTimeMs?: number;
    estimatedTokens?: number;
  };
}

interface Conversation {
  id: string;
  title: string;
  preview: string | null;
  message_count: number;
  updated_at: string;
  created_at: string;
}

interface AIAssistantProps {
  context?: {
    participantName?: string;
    currentPage?: string;
    recentActivity?: string[];
  };
}

export function AIAssistant({ context }: AIAssistantProps) {
  const { user } = useAdmin();
  const { isOpen, openAssistant, closeAssistant } = useAIAssistant();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How do I write an effective FCA?",
    "Explain NDIS funding categories",
    "Help with session documentation",
    "What are NDIS Practice Standards?",
  ]);
  const [mode, setMode] = useState<"general" | "draft-notes" | "explain" | "template">("general");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/ai/conversations?limit=20");
      const data = await response.json();
      if (data.success) {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai/conversations/${conversationId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(
          data.messages.map((m: { id: string; role: string; content: string; created_at: string; metadata?: Record<string, unknown> }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: m.created_at,
            metadata: m.metadata,
          }))
        );
        setActiveConversationId(conversationId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user, loadConversations]);

  // Start new conversation
  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setIsHistoryOpen(false);
    inputRef.current?.focus();
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const response = await fetch("/api/ai/conversations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      if (response.ok) {
        setConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (activeConversationId === conversationId) {
          startNewConversation();
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: activeConversationId,
          mode,
          context,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString(),
          metadata: data.metadata,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.conversationId && !activeConversationId) {
          setActiveConversationId(data.conversationId);
          loadConversations();
        }

        if (data.suggestions && data.suggestions.length > 0) {
          setSuggestions(data.suggestions);
        }
      } else {
        // Error response
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `Sorry, I encountered an error: ${data.error || "Unknown error"}. Please try again.`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={openAssistant}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2">
      {/* History Sidebar */}
      <div
        ref={historyRef}
        className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden ${
          isHistoryOpen ? "w-72 opacity-100" : "w-0 opacity-0"
        }`}
        style={{ height: "600px" }}
      >
        <div className="flex flex-col h-full">
          {/* History Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">History</h3>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                title="New conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No conversations yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors group ${
                      activeConversationId === conv.id
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {conv.title}
                        </p>
                        {conv.preview && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {conv.preview}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-400">
                            {formatDate(conv.updated_at)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {conv.message_count} msgs
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(conv.id, e)}
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col" style={{ height: "600px" }}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                title={isHistoryOpen ? "Close history" : "Open history"}
              >
                {isHistoryOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <div>
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  AI Assistant
                </h3>
                <p className="text-xs text-white/80">Senior OT - NDIS Specialist</p>
              </div>
            </div>
            <button
              onClick={closeAssistant}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-1 mt-3">
            {(["general", "draft-notes", "explain", "template"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  mode === m
                    ? "bg-white text-indigo-600"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                {m === "draft-notes" ? "Notes" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto text-indigo-300 dark:text-indigo-600 mb-4" />
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Hello! I'm your NDIS AI Assistant
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                I specialize in NDIS and Occupational Therapy. Ask me about FCA reports, session notes, funding, and more.
              </p>

              {/* Quick Suggestions */}
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setMessage(s);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white"
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div className={`flex items-center gap-2 mt-1 text-xs ${
                    msg.role === "user" ? "text-indigo-200" : "text-slate-400"
                  }`}>
                    <span>{formatTime(msg.timestamp)}</span>
                    {msg.metadata?.cached && (
                      <span className="flex items-center gap-0.5">
                        <Zap className="w-3 h-3" />
                        Cached
                      </span>
                    )}
                    {msg.metadata?.responseTimeMs && (
                      <span>{msg.metadata.responseTimeMs}ms</span>
                    )}
                  </div>
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length > 0 && suggestions.length > 0 && !isLoading && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-1">
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setMessage(s);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4">
          <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-2">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about NDIS or OT..."
              rows={1}
              className="flex-1 bg-transparent border-0 resize-none text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || isLoading}
              className="flex-shrink-0 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Only NDIS & OT related queries are supported
          </p>
        </div>
      </div>
    </div>
  );
}
