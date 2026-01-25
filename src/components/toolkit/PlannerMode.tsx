"use client";

import { useState, useCallback, useEffect } from "react";
import {
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Download,
  History,
  Lightbulb,
  ShieldAlert,
  MessageSquare,
  FileSearch,
  Clock,
  TrendingUp,
  TrendingDown,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateSeniorPlannerPDF } from "@/lib/pdf-export";
import { extractTextFromPDF } from "@/lib/pdf-parser";
import {
  AuditDocumentType,
  AuditResult,
  AuditHistoryItem,
  getAuditStatusColor,
  getDocumentTypeLabel,
} from "@/types/senior-planner";
import { useAIProvider } from "@/components/providers/AIProviderContext";
import { useAdmin } from "@/components/providers/AdminContext";
import { AIProcessingButton } from "./AIProcessingButton";

// Document type options
const DOCUMENT_TYPES: { value: AuditDocumentType; label: string }[] = [
  { value: "functional_capacity_assessment", label: "Functional Capacity Assessment (FCA)" },
  { value: "progress_report", label: "Progress Report" },
  { value: "assistive_technology_assessment", label: "Assistive Technology Assessment" },
  { value: "home_modification_report", label: "Home Modification Report" },
  { value: "sil_assessment", label: "SIL Assessment" },
  { value: "therapy_report", label: "Therapy Report" },
  { value: "plan_review_request", label: "Plan Review Request" },
  { value: "other", label: "Other Document" },
];

interface ScoreGaugeProps {
  label: string;
  score: number;
  size?: "sm" | "md" | "lg";
}

function ScoreGauge({ label, score, size = "md" }: ScoreGaugeProps) {
  const getScoreColor = (s: number) => {
    if (s >= 85) return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30";
    if (s >= 70) return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
    if (s >= 50) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  const sizeClasses = {
    sm: "w-12 h-12 text-sm",
    md: "w-16 h-16 text-lg",
    lg: "w-20 h-20 text-xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${getScoreColor(score)}`}>
        {score}
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">{label}</span>
    </div>
  );
}

export function PlannerMode() {
  const { provider, enableFallback } = useAIProvider();
  const { isAdmin } = useAdmin();

  // Form state
  const [documentType, setDocumentType] = useState<AuditDocumentType>("functional_capacity_assessment");
  const [documentName, setDocumentName] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Processing state
  const [isAuditing, setIsAuditing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [currentTier, setCurrentTier] = useState<'premium' | 'standard' | null>(null);

  // History
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAudit, setViewingAudit] = useState<AuditResult | null>(null);
  const [viewingDocName, setViewingDocName] = useState<string>("");
  const [viewingDocType, setViewingDocType] = useState<AuditDocumentType>("other");

  const supabase = createClient();
  const MAX_HISTORY_ITEMS = 20;

  // Load history and cleanup old records (keep only 20 most recent)
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      // First, get all audits to check if cleanup is needed
      const { data: allData, error: countError } = await supabase
        .from("report_audits")
        .select("id, created_at")
        .order("created_at", { ascending: false });

      if (countError) throw countError;

      // If more than MAX_HISTORY_ITEMS, delete the oldest ones
      if (allData && allData.length > MAX_HISTORY_ITEMS) {
        const idsToDelete = allData.slice(MAX_HISTORY_ITEMS).map((item: { id: string }) => item.id);
        await supabase.from("report_audits").delete().in("id", idsToDelete);
      }

      // Now fetch the remaining history
      const { data, error } = await supabase
        .from("report_audits")
        .select("id, document_type, document_name, overall_score, status, created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY_ITEMS);

      if (error) throw error;

      setHistory(
        (data || []).map((item: {
          id: string;
          document_type: string;
          document_name: string;
          overall_score: number;
          status: string;
          created_at: string;
        }) => ({
          id: item.id,
          documentType: item.document_type as AuditDocumentType,
          documentName: item.document_name,
          overallScore: item.overall_score,
          status: item.status as AuditResult["status"],
          createdAt: new Date(item.created_at),
        }))
      );
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [supabase]);

  // Delete a history item
  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering loadHistoryItem
    try {
      const { error } = await supabase.from("report_audits").delete().eq("id", id);
      if (error) throw error;
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  // Export a history item to PDF
  const exportHistoryItemPDF = async (item: AuditHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering loadHistoryItem
    try {
      const { data, error } = await supabase
        .from("report_audits")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      const auditData: AuditResult = {
        overallScore: data.overall_score,
        status: data.status,
        scores: {
          compliance: data.compliance_score,
          nexus: data.nexus_score,
          valueForMoney: data.vfm_score,
          evidence: data.evidence_score,
          significantChange: data.significant_change_score,
        },
        plannerSummary: data.planner_summary,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        redFlags: data.red_flags || [],
        languageFixes: data.language_fixes || [],
        plannerQuestions: data.planner_questions || [],
        contentRestriction: data.content_restricted,
        modelUsed: data.model_used || "unknown",
        processingTime: data.processing_time_ms || 0,
        timestamp: new Date(data.created_at),
      };

      generateSeniorPlannerPDF({
        auditResult: auditData,
        documentName: data.document_name || "Unnamed Document",
        documentTypeLabel: getDocumentTypeLabel(data.document_type),
      });
    } catch (err) {
      console.error("Failed to export history item:", err);
    }
  };

  // View a history item in modal
  const viewHistoryItem = async (item: AuditHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase
        .from("report_audits")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      const auditData: AuditResult = {
        overallScore: data.overall_score,
        status: data.status,
        scores: {
          compliance: data.compliance_score,
          nexus: data.nexus_score,
          valueForMoney: data.vfm_score,
          evidence: data.evidence_score,
          significantChange: data.significant_change_score,
        },
        plannerSummary: data.planner_summary,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        redFlags: data.red_flags || [],
        languageFixes: data.language_fixes || [],
        plannerQuestions: data.planner_questions || [],
        contentRestriction: data.content_restricted,
        modelUsed: data.model_used || "unknown",
        processingTime: data.processing_time_ms || 0,
        timestamp: new Date(data.created_at),
      };

      setViewingAudit(auditData);
      setViewingDocName(data.document_name || "Unnamed Document");
      setViewingDocType(data.document_type as AuditDocumentType);
      setViewModalOpen(true);
    } catch (err) {
      console.error("Failed to view history item:", err);
    }
  };

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDocumentName(file.name.replace(/\.[^/.]+$/, ""));
    setError(null);

    // Handle text files
    if (file.type === "text/plain") {
      const text = await file.text();
      setDocumentContent(text);
      return;
    }

    // Handle PDF files
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      setIsParsing(true);
      try {
        const result = await extractTextFromPDF(file);
        if (result.success && result.text) {
          setDocumentContent(result.text);
        } else {
          setError(result.error || "Failed to extract text from PDF. Please paste the content manually.");
        }
      } catch {
        setError("Failed to parse PDF. Please paste the content manually.");
      } finally {
        setIsParsing(false);
      }
      return;
    }

    // DOCX not yet supported
    if (file.name.endsWith(".docx")) {
      setError("DOCX parsing coming soon. Please paste the text content directly for now.");
    }
  };

  // Handle audit submission
  const handleAudit = async () => {
    if (!documentContent.trim()) {
      setError("Please enter or upload document content to audit.");
      return;
    }

    if (documentContent.trim().length < 100) {
      setError("Please provide at least 100 characters for meaningful analysis.");
      return;
    }

    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      setError("Authentication error. Please log in again.");
      return;
    }

    const expiresAt = session?.expires_at ? session.expires_at * 1000 : null;
    if (expiresAt && expiresAt < Date.now() + 60_000) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setError("Session expired. Please log in again.");
        return;
      }
    }

    setIsAuditing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/senior-planner-audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentType,
          documentName: documentName || "Unnamed Document",
          content: documentContent,
          provider,
          enableFallback: isAdmin ? enableFallback : false,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Audit failed");
      }

      if (!payload.success) {
        throw new Error(payload.error || "Audit failed");
      }

      const result = payload.data as AuditResult;
      setAuditResult(result);

      // Track the model tier used (premium = Gemini 2.5 Pro, standard = Gemini 2.0 Flash)
      if (payload.tier) {
        setCurrentTier(payload.tier as 'premium' | 'standard');
      }

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("report_audits").insert({
          user_id: user.id,
          document_type: documentType,
          document_name: documentName || "Unnamed Document",
          document_content: documentContent.slice(0, 10000), // Truncate for storage
          overall_score: result.overallScore,
          status: result.status,
          compliance_score: result.scores.compliance,
          nexus_score: result.scores.nexus,
          vfm_score: result.scores.valueForMoney,
          evidence_score: result.scores.evidence,
          significant_change_score: result.scores.significantChange,
          planner_summary: result.plannerSummary,
          strengths: result.strengths,
          improvements: result.improvements,
          red_flags: result.redFlags,
          language_fixes: result.languageFixes,
          planner_questions: result.plannerQuestions,
          content_restricted: result.contentRestriction || false,
          model_used: payload.model,
          processing_time_ms: result.processingTime,
        });

        // Refresh history
        loadHistory();
      }
    } catch (err) {
      console.error("Audit error:", err);
      if (err instanceof Error && err.message.includes("401")) {
        setError("Unauthorized. Please log out and log back in to refresh your session.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to perform audit");
      }
    } finally {
      setIsAuditing(false);
    }
  };

  // Load a history item
  const loadHistoryItem = async (item: AuditHistoryItem) => {
    try {
      const { data, error } = await supabase
        .from("report_audits")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      setDocumentType(data.document_type as AuditDocumentType);
      setDocumentName(data.document_name);
      setDocumentContent(data.document_content || "");
      setAuditResult({
        overallScore: data.overall_score,
        status: data.status,
        scores: {
          compliance: data.compliance_score,
          nexus: data.nexus_score,
          valueForMoney: data.vfm_score,
          evidence: data.evidence_score,
          significantChange: data.significant_change_score,
        },
        plannerSummary: data.planner_summary,
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        redFlags: data.red_flags || [],
        languageFixes: data.language_fixes || [],
        plannerQuestions: data.planner_questions || [],
        contentRestriction: data.content_restricted,
        modelUsed: data.model_used || "unknown",
        processingTime: data.processing_time_ms || 0,
        timestamp: new Date(data.created_at),
      });
    } catch (err) {
      console.error("Failed to load history item:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setDocumentContent("");
    setDocumentName("");
    setFileName(null);
    setAuditResult(null);
    setError(null);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!auditResult) return;

    generateSeniorPlannerPDF({
      auditResult,
      documentName: documentName || "Unnamed Document",
      documentTypeLabel: getDocumentTypeLabel(documentType),
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-6 h-6 text-emerald-600" />
              Section 34 Auditor
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              AI-powered compliance audit for NDIS clinical documents
            </p>
          </div>
        </div>

        {/* Input Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          {/* Document Type & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Type
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as AuditDocumentType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Document Name (Optional)
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., FCA_JohnSmith_Jan2026"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Document Content
            </label>
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Paste your clinical document content here for Section 34 compliance audit..."
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {isParsing ? "Extracting text from PDF..." : `${documentContent.length} characters ${documentContent.length < 100 ? "(minimum 100)" : ""}`}
              </span>
              <label className={`flex items-center gap-2 text-sm ${isParsing ? "text-slate-400 cursor-wait" : "text-emerald-600 hover:text-emerald-700 cursor-pointer"}`}>
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>{isParsing ? "Parsing PDF..." : "Upload File"}</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="hidden"
                />
              </label>
            </div>
            {fileName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                <span>{fileName}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <AIProcessingButton
              isProcessing={isAuditing}
              onClick={handleAudit}
              disabled={documentContent.length < 100}
              label="Run Section 34 Audit"
              variant="emerald"
              type="audit"
            />
            {auditResult && (
              <button
                onClick={resetForm}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Results Card */}
        {auditResult && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Status Header */}
            <div className={`p-4 ${
              auditResult.status === "excellent" ? "bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800" :
              auditResult.status === "good" ? "bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800" :
              auditResult.status === "needs_improvement" ? "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800" :
              auditResult.status === "critical" ? "bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800" :
              "bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {auditResult.status === "excellent" && <CheckCircle className="w-6 h-6 text-emerald-600" />}
                  {auditResult.status === "good" && <CheckCircle className="w-6 h-6 text-blue-600" />}
                  {auditResult.status === "needs_improvement" && <AlertTriangle className="w-6 h-6 text-amber-600" />}
                  {auditResult.status === "critical" && <XCircle className="w-6 h-6 text-red-600" />}
                  {auditResult.status === "security_blocked" && <ShieldAlert className="w-6 h-6 text-slate-600" />}
                  <div>
                    <h3 className={`font-bold text-lg ${getAuditStatusColor(auditResult.status)}`}>
                      {auditResult.status === "excellent" && "Excellent - Ready for Submission"}
                      {auditResult.status === "good" && "Good - Minor Improvements Suggested"}
                      {auditResult.status === "needs_improvement" && "Needs Improvement"}
                      {auditResult.status === "critical" && "Critical Issues Found"}
                      {auditResult.status === "security_blocked" && "Content Restricted"}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Overall Score: <span className="font-bold">{auditResult.overallScore}/100</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Score Gauges */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Compliance Scores</h4>
                <div className="flex flex-wrap gap-6 justify-center">
                  <ScoreGauge label="NDIS Compliance" score={auditResult.scores.compliance} />
                  <ScoreGauge label="Nexus" score={auditResult.scores.nexus} />
                  <ScoreGauge label="Value for Money" score={auditResult.scores.valueForMoney} />
                  <ScoreGauge label="Evidence" score={auditResult.scores.evidence} />
                  <ScoreGauge label="Change Doc" score={auditResult.scores.significantChange} />
                </div>
              </div>

              {/* Planner Summary */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Planner Summary
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  {auditResult.plannerSummary}
                </p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Strengths ({auditResult.strengths.length})
                  </h4>
                  <ul className="space-y-1">
                    {auditResult.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 mt-1 shrink-0" />
                        {typeof s === 'string' ? s : (s as { finding?: string }).finding || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Improvements ({auditResult.improvements.length})
                  </h4>
                  <ul className="space-y-1">
                    {auditResult.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                        {typeof s === 'string' ? s : (s as { finding?: string }).finding || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Red Flags */}
              {auditResult.redFlags.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Red Flags ({auditResult.redFlags.length})
                  </h4>
                  <ul className="space-y-1">
                    {auditResult.redFlags.map((s, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-1 shrink-0" />
                        {typeof s === 'string' ? s : (s as { reason?: string; flag?: string }).reason || (s as { reason?: string; flag?: string }).flag || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Language Fixes */}
              {auditResult.languageFixes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language Corrections ({auditResult.languageFixes.length})
                  </h4>
                  <div className="space-y-2">
                    {auditResult.languageFixes.map((fix, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 line-through">{fix.original}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-emerald-600 font-medium">{fix.suggested}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{fix.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planner Questions */}
              {auditResult.plannerQuestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Questions a Planner Might Ask ({auditResult.plannerQuestions.length})
                  </h4>
                  <ul className="space-y-2">
                    {auditResult.plannerQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        {/* Info Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 p-4">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Section 34 Audit</h3>
          <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-3">
            This tool assesses clinical documents against NDIS Act Section 34 compliance requirements.
          </p>
          <ul className="text-xs text-emerald-600 dark:text-emerald-500 space-y-1">
            <li>• NDIS Act & Rules alignment</li>
            <li>• Disability-support nexus</li>
            <li>• Value for money demonstration</li>
            <li>• Clinical evidence quality</li>
            <li>• Change documentation</li>
          </ul>
        </div>

        {/* AI Status */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <h3 className="font-bold text-slate-900 dark:text-white mb-3">AI Status</h3>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              currentTier === 'standard' ? 'bg-blue-500' : 'bg-emerald-500'
            }`} />
            <span className="text-sm text-slate-600 dark:text-slate-400">Spectra Praxis Online</span>
          </div>
        </div>

        {/* Audit History - Always Visible */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Audit History
              <span className="text-xs font-normal text-slate-500">
                ({history.length}/{MAX_HISTORY_ITEMS})
              </span>
            </h3>
            {historyExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {historyExpanded && (
            <>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No audit history yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your audited reports will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="group relative p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <button
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-white truncate pr-16">
                            {item.documentName}
                          </span>
                          <span className={`text-xs font-bold ${getAuditStatusColor(item.status)}`}>
                            {item.overallScore}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {item.createdAt.toLocaleDateString()} at{" "}
                          {item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </button>

                      {/* Action buttons - visible on hover */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => viewHistoryItem(item, e)}
                          className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={(e) => exportHistoryItemPDF(item, e)}
                          className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors"
                          title="Export to PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-1.5 bg-red-100 dark:bg-red-900/30 rounded hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {history.length > 0 && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  Oldest reports are automatically removed when limit is reached
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Audit Modal */}
      {viewModalOpen && viewingAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              viewingAudit.status === "excellent" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" :
              viewingAudit.status === "good" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" :
              viewingAudit.status === "needs_improvement" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
              "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{viewingDocName}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{getDocumentTypeLabel(viewingDocType)}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getAuditStatusColor(viewingAudit.status)}`}>
                  Score: {viewingAudit.overallScore}/100
                </div>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score Gauges */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Compliance Scores</h4>
                <div className="flex flex-wrap gap-6 justify-center">
                  <ScoreGauge label="NDIS Compliance" score={viewingAudit.scores.compliance} />
                  <ScoreGauge label="Nexus" score={viewingAudit.scores.nexus} />
                  <ScoreGauge label="Value for Money" score={viewingAudit.scores.valueForMoney} />
                  <ScoreGauge label="Evidence" score={viewingAudit.scores.evidence} />
                  <ScoreGauge label="Change Doc" score={viewingAudit.scores.significantChange} />
                </div>
              </div>

              {/* Planner Summary */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Planner Summary
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  {viewingAudit.plannerSummary}
                </p>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Strengths ({viewingAudit.strengths.length})
                  </h4>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {viewingAudit.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 mt-1 shrink-0" />
                        {typeof s === 'string' ? s : (s as { finding?: string }).finding || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Improvements ({viewingAudit.improvements.length})
                  </h4>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {viewingAudit.improvements.map((s, i) => (
                      <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                        {typeof s === 'string' ? s : (s as { finding?: string }).finding || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Red Flags */}
              {viewingAudit.redFlags.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Red Flags ({viewingAudit.redFlags.length})
                  </h4>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {viewingAudit.redFlags.map((s, i) => (
                      <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-1 shrink-0" />
                        {typeof s === 'string' ? s : (s as { reason?: string; flag?: string }).reason || (s as { reason?: string; flag?: string }).flag || JSON.stringify(s)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Language Fixes */}
              {viewingAudit.languageFixes.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language Corrections ({viewingAudit.languageFixes.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewingAudit.languageFixes.map((fix, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 line-through">{fix.original}</span>
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-emerald-600 font-medium">{fix.suggested}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{fix.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Planner Questions */}
              {viewingAudit.plannerQuestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Questions a Planner Might Ask ({viewingAudit.plannerQuestions.length})
                  </h4>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {viewingAudit.plannerQuestions.map((q, i) => (
                      <li key={i} className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg flex items-start gap-2">
                        <span className="text-indigo-600 font-bold">{i + 1}.</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  generateSeniorPlannerPDF({
                    auditResult: viewingAudit,
                    documentName: viewingDocName,
                    documentTypeLabel: getDocumentTypeLabel(viewingDocType),
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
