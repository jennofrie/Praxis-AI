"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { extractTextFromPDF, isPDFFile } from "@/lib/pdf-parser";
import {
  MessageSquare,
  ArrowLeft,
  AlertTriangle,
  Send,
  Upload,
  Loader2,
  FileText,
  Lightbulb,
  CheckCircle,
  X,
  Zap,
  Brain,
  ShieldAlert,
  Copy,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

type ModelMode = "flash" | "pro";

interface PriceGuideRef {
  item: string;
  code: string;
  price: string;
  category: string;
}

interface ChatResponse {
  summary: string;
  mainAnswer: string;
  keyPoints: string[];
  priceGuideRefs: PriceGuideRef[];
  verificationChecklist: string[];
  documentFindings: string[];
  commonMistakes: string[];
  disclaimer: string;
  modelUsed: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
  timestamp: Date;
}

export default function PlanManagement() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [modelMode, setModelMode] = useState<ModelMode>("flash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    if (file.type === "text/plain") {
      const text = await file.text();
      setDocumentText(text);
      return;
    }

    if (isPDFFile(file)) {
      setIsParsing(true);
      try {
        const parsed = await extractTextFromPDF(file);
        if (parsed.success && parsed.text) {
          setDocumentText(parsed.text);
        } else {
          setError(parsed.error || "Failed to extract PDF text.");
        }
      } catch {
        setError("Failed to parse PDF.");
      } finally {
        setIsParsing(false);
      }
      return;
    }

    setError("Please upload a PDF or TXT file.");
  }, []);

  const removeDocument = useCallback(() => {
    setDocumentText(null);
    setFileName(null);
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/sc-plan-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          modelMode,
          documentContent: documentText || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Request failed");
      }

      const data = payload.data as ChatResponse;
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.mainAnswer,
        response: data,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, modelMode, documentText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleCopyResponse = useCallback(async (idx: number, response: ChatResponse) => {
    const text = [
      "SUMMARY:", response.summary,
      "\nMAIN ANSWER:", response.mainAnswer,
      response.keyPoints.length > 0 ? "\nKEY POINTS:\n" + response.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n") : "",
      response.priceGuideRefs.length > 0 ? "\nPRICE GUIDE REFERENCES:\n" + response.priceGuideRefs.map((r) => `${r.item} (${r.code}): ${r.price}`).join("\n") : "",
      response.verificationChecklist.length > 0 ? "\nVERIFICATION:\n" + response.verificationChecklist.map((v) => `- ${v}`).join("\n") : "",
      response.commonMistakes.length > 0 ? "\nCOMMON MISTAKES:\n" + response.commonMistakes.map((m) => `- ${m}`).join("\n") : "",
      "\nDISCLAIMER:", response.disclaimer,
    ].filter(Boolean).join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setDocumentText(null);
    setFileName(null);
    setError(null);
    setInputText("");
  }, []);

  return (
    <>
      <Header title="Plan Management Expert" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link href="/sc-toolkit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chat Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-rose-600" />
                  Plan Management Expert
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  AI-powered NDIS pricing, claiming, and budget expert
                </p>
              </div>
              {messages.length > 0 && (
                <button onClick={resetChat} className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  Clear Chat
                </button>
              )}
            </div>

            {/* Messages Area */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 min-h-[400px] max-h-[600px] overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">Ask a Plan Management Question</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md">
                    Ask about NDIS pricing, claiming rules, budget management, or upload a document for analysis.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4 justify-center">
                    {["What is the hourly rate for Level 2 SC?", "How do I claim travel under NDIS?", "Explain SIL budget categories"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setInputText(q)}
                        className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] ${msg.role === "user" ? "bg-rose-600 text-white rounded-2xl rounded-br-sm px-4 py-3" : "space-y-3 w-full"}`}>
                    {msg.role === "user" ? (
                      <p className="text-sm">{msg.content}</p>
                    ) : msg.response ? (
                      <div className="space-y-3">
                        {/* Summary */}
                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 border border-rose-200 dark:border-rose-800">
                          <h4 className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase mb-1">Summary</h4>
                          <p className="text-sm text-rose-600 dark:text-rose-400">{msg.response.summary}</p>
                        </div>

                        {/* Main Answer */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{msg.response.mainAnswer}</p>
                        </div>

                        {/* Key Points */}
                        {msg.response.keyPoints.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase mb-2">Key Points</h4>
                            <ul className="space-y-1">
                              {msg.response.keyPoints.map((p, i) => (
                                <li key={i} className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 mt-1 shrink-0" /> {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Price Guide References */}
                        {msg.response.priceGuideRefs.length > 0 && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase mb-2 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> Price Guide References
                            </h4>
                            <div className="space-y-1">
                              {msg.response.priceGuideRefs.map((ref, i) => (
                                <div key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                                  <span>{ref.item} <span className="text-xs opacity-75">({ref.code})</span></span>
                                  <span className="font-bold">{ref.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Verification Checklist */}
                        {msg.response.verificationChecklist.length > 0 && (
                          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-2">Verification Checklist</h4>
                            <ul className="space-y-1">
                              {msg.response.verificationChecklist.map((v, i) => (
                                <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                                  <CheckCircle className="w-3 h-3 mt-1 shrink-0" /> {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Document Findings */}
                        {msg.response.documentFindings.length > 0 && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-2 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> Document Findings
                            </h4>
                            <ul className="space-y-1">
                              {msg.response.documentFindings.map((f, i) => (
                                <li key={i} className="text-sm text-indigo-600 dark:text-indigo-400 flex items-start gap-2">
                                  <Lightbulb className="w-3 h-3 mt-1 shrink-0" /> {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Common Mistakes */}
                        {msg.response.commonMistakes.length > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                            <h4 className="text-xs font-bold text-red-700 dark:text-red-300 uppercase mb-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Common Mistakes
                            </h4>
                            <ul className="space-y-1">
                              {msg.response.commonMistakes.map((m, i) => (
                                <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                                  <ShieldAlert className="w-3 h-3 mt-1 shrink-0" /> {m}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Disclaimer */}
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded p-2 italic">
                          {msg.response.disclaimer}
                        </div>

                        {/* Copy Button */}
                        <button
                          onClick={() => handleCopyResponse(idx, msg.response as ChatResponse)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {copied === idx ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          {copied === idx ? "Copied" : "Copy response"}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-300">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing your question...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              {/* Document Attachment */}
              {fileName && (
                <div className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span className="text-slate-600 dark:text-slate-400 flex-1 truncate">{fileName}</span>
                  <button onClick={removeDocument} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about NDIS pricing, claiming, budgets..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 text-sm resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isParsing ? "opacity-50 cursor-wait" : ""}`}>
                    {isParsing ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Upload className="w-5 h-5 text-slate-400" />}
                    <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} disabled={isParsing} className="hidden" />
                  </label>
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() || isProcessing}
                    className="p-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Model Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setModelMode("flash")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                      modelMode === "flash"
                        ? "bg-amber-500 text-white shadow"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Zap className="w-3 h-3" /> Flash
                  </button>
                  <button
                    onClick={() => setModelMode("pro")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold transition-all ${
                      modelMode === "pro"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    <Brain className="w-3 h-3" /> Pro
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">Shift+Enter for new line</span>
              </div>
            </div>
          </div>

          {/* Right: Info Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800 p-4">
              <h3 className="font-bold text-rose-800 dark:text-rose-300 mb-2">Plan Management Expert</h3>
              <p className="text-sm text-rose-700 dark:text-rose-400 mb-3">
                AI-powered assistant for NDIS plan management questions, pricing, and claiming guidance.
              </p>
              <ul className="text-xs text-rose-600 dark:text-rose-500 space-y-1">
                <li>• NDIS Price Guide lookups</li>
                <li>• Claiming rules &amp; eligibility</li>
                <li>• Budget category guidance</li>
                <li>• Document analysis</li>
                <li>• Common mistakes to avoid</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Example Questions</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  &quot;What is the max hourly rate for a Level 3 support worker?&quot;
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  &quot;Can I claim travel time under Core Supports?&quot;
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  &quot;Explain the difference between SIL and SDA&quot;
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Upload a service agreement for analysis
                </li>
              </ul>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
              <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" /> Important
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This AI provides guidance based on NDIS pricing and rules. Always verify information against the current NDIS Price Guide and consult with your plan manager for specific claiming decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
