"use client";

import { useState, useCallback } from "react";
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
  Sparkles,
  FileSearch,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateSeniorPlannerPDF } from "@/lib/pdf-export";
import {
  AuditDocumentType,
  AuditResult,
  AuditHistoryItem,
  getAuditStatusColor,
  getDocumentTypeLabel,
} from "@/types/senior-planner";

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
  // Form state
  const [documentType, setDocumentType] = useState<AuditDocumentType>("functional_capacity_assessment");
  const [documentName, setDocumentName] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  // Processing state
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  // History
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const supabase = createClient();

  // Load history
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("report_audits")
        .select("id, document_type, document_name, overall_score, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setHistory(
        (data || []).map((item) => ({
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

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setDocumentName(file.name.replace(/\.[^/.]+$/, ""));

    // Handle text files
    if (file.type === "text/plain") {
      const text = await file.text();
      setDocumentContent(text);
      return;
    }

    // For PDF/DOCX, we'd need additional parsing libraries
    // For now, show a message
    if (file.type === "application/pdf") {
      setError("PDF parsing coming soon. Please paste the text content directly for now.");
    } else if (file.name.endsWith(".docx")) {
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

    setIsAuditing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("senior-planner-audit", {
        body: {
          documentType,
          documentName: documentName || "Unnamed Document",
          content: documentContent,
        },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || "Audit failed");
      }

      const result = data.data as AuditResult;
      setAuditResult(result);

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
          model_used: data.model,
          processing_time_ms: result.processingTime,
        });

        // Refresh history
        loadHistory();
      }
    } catch (err) {
      console.error("Audit error:", err);
      setError(err instanceof Error ? err.message : "Failed to perform audit");
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
      setShowHistory(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                if (!showHistory && history.length === 0) loadHistory();
              }}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <History className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
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
                {documentContent.length} characters {documentContent.length < 100 && "(minimum 100)"}
              </span>
              <label className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            {fileName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <FileText className="w-4 h-4" />
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
            <button
              onClick={handleAudit}
              disabled={isAuditing || documentContent.length < 100}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAuditing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Audit
                </>
              )}
            </button>
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
                        {s}
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
                        {s}
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
                        {s}
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
        {/* History Panel */}
        {showHistory && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Audits
            </h3>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No audit history yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {item.documentName}
                      </span>
                      <span className={`text-xs font-bold ${getAuditStatusColor(item.status)}`}>
                        {item.overallScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {item.createdAt.toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Gemini Pro Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
