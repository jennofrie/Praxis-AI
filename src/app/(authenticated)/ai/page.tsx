"use client";

import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Send, Sparkles, Copy, FilePlus, Lightbulb, History, Loader2, AlertCircle, X } from "lucide-react";
import { useAIProvider } from "@/components/providers/AIProviderContext";

const MAX_CHARS = 2000;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { title: "Generate FCA for a participant", desc: "Creates a full structure based on recent notes." },
  { title: "Analyze Sensory Profile", desc: "Extracts sensory patterns from observations." },
  { title: "Draft NDIS Progress Report", desc: "Summarizes goal achievement over 6 months." },
];

export default function AIAssistant() {
  const { provider } = useAIProvider();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const charCount = inputValue.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = inputValue.trim().length > 0 && !isLoading && !isOverLimit;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Countdown for rate limit
  useEffect(() => {
    if (retryAfter <= 0) return;
    const interval = setInterval(() => {
      setRetryAfter(prev => {
        if (prev <= 1) {
          setRateLimitError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfter]);

  const sendMessage = async () => {
    if (!canSend) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);
    setRateLimitError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
          provider,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        const retrySeconds = data.retryAfter ?? 3600;
        setRetryAfter(retrySeconds);
        setRateLimitError(`Rate limit reached. You can send another message in ${Math.ceil(retrySeconds / 60)} minutes.`);
        return;
      }

      if (res.status === 400) {
        const data = await res.json();
        setError(data.error ?? "Your message was blocked for security reasons.");
        return;
      }

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response ?? "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Chat error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      <Header title="AI Assistant" />
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50 dark:bg-slate-950">
          {/* Chat Header */}
          <div className="flex-none px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">Quantum AI Assistant</h1>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">Secure Mode</span>
                </div>
                <p className="text-indigo-600 dark:text-slate-400 text-sm">Drafting clinical notes and summaries powered by secure LLMs.</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-4">
              {/* Date separator */}
              <div className="flex justify-center">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </div>

              {/* Welcome message (show when no messages) */}
              {messages.length === 0 && !isLoading && (
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col gap-1 max-w-[85%]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-900 dark:text-white text-sm font-bold">Quantum AI</span>
                      <span className="text-slate-400 text-xs">{formatTime(new Date())}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                      <p>Hello! I&apos;m ready to assist with your documentation today. I can help summarize sessions, draft reports, or analyze assessment data.</p>
                      <p className="mt-2 text-sm text-slate-500">Note: All data processed in this session is encrypted and compliant with NDIS privacy standards.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation messages */}
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === "user" ? (
                    <div className="flex items-end justify-end gap-3">
                      <div className="flex flex-col gap-1 items-end max-w-[85%]">
                        <div className="bg-indigo-600 text-white rounded-2xl rounded-br-none px-5 py-3 shadow-md text-base leading-relaxed">
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-slate-400 text-xs pr-1">{formatTime(msg.timestamp)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-indigo-600">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1 max-w-[85%]">
                        <div className="flex items-baseline gap-2">
                          <span className="text-slate-900 dark:text-white text-sm font-bold">Quantum AI</span>
                          <span className="text-slate-400 text-xs">{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        <div className="flex gap-2 mt-1 ml-1">
                          <ActionButton icon={Copy} label="Copy" onClick={() => navigator.clipboard.writeText(msg.content)} />
                          <ActionButton icon={FilePlus} label="Insert to Report" onClick={() => {}} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 shrink-0 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-slate-500">Thinking…</span>
                  </div>
                </div>
              )}

              {/* Error banners */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                  <button onClick={() => setError(null)}>
                    <X className="w-4 h-4 text-red-400 hover:text-red-600" />
                  </button>
                </div>
              )}

              {rateLimitError && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-700 dark:text-amber-300">{rateLimitError}</p>
                    {retryAfter > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        Retry in: {Math.floor(retryAfter / 60)}:{String(retryAfter % 60).padStart(2, "0")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-none p-4 sm:p-8 pt-2">
            <div className="max-w-4xl mx-auto w-full">
              <div className="relative flex flex-col gap-2 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 transition-shadow focus-within:shadow-xl focus-within:border-indigo-600/50">
                <textarea
                  className="w-full bg-transparent border-none text-base text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 resize-none py-3 px-4 min-h-[60px]"
                  placeholder="Type a message or command (e.g. 'Summarize the last session')…"
                  rows={2}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <span className={`text-xs ${isOverLimit ? "text-red-500 font-semibold" : "text-slate-400"}`}>
                    {charCount}/{MAX_CHARS}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-xs text-slate-400">Do not input PII unless in Local Mode</span>
                    <button
                      onClick={sendMessage}
                      disabled={!canSend}
                      className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-md transition-colors"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">
                Quantum AI can make mistakes. Please verify important clinical information.
              </p>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <aside className="hidden lg:flex w-80 flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-none z-10 overflow-y-auto">
          <div className="p-5 flex flex-col gap-6">
            {/* AI Models Status */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Models Status</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {provider === "gemini" ? "Gemini Pro" : "Ollama (Local)"}
                    </span>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {provider === "gemini" ? "Ollama (Local)" : "Gemini Pro"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Idle</span>
                </div>
              </div>
            </div>

            {/* Suggested Prompts */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="text-indigo-600 w-4 h-4" /> Suggested Prompts
              </h3>
              <div className="flex flex-col gap-2">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:shadow-sm bg-white dark:bg-slate-900 transition-all group"
                    onClick={() => handlePromptClick(p.title)}
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">{p.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent generations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="text-indigo-600 w-4 h-4" /> Recent
                </h3>
              </div>
              <div className="flex flex-col gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                {messages.filter(m => m.role === "user").slice(-3).reverse().map((m, i, arr) => (
                  <div
                    key={m.id}
                    className={`p-3 ${i < arr.length - 1 ? "border-b border-slate-200 dark:border-slate-700" : ""} hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {m.content.substring(0, 40)}{m.content.length > 40 ? "…" : ""}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2 flex-shrink-0">{formatTime(m.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {messages.filter(m => m.role === "user").length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">No messages yet</p>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}
