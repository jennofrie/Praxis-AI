"use client";

import { useState, useCallback } from "react";
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Download,
  History,
  Sparkles,
  RefreshCcw,
  Clock,
  User,
  Briefcase,
  ArrowRight,
  ExternalLink,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateCoCPDF } from "@/lib/pdf-export";
import {
  CoCTriggerCategory,
  COC_TRIGGER_CATEGORIES,
  CoCAssessmentResult,
  CoCHistoryItem,
  CoCViewMode,
  getVerdictColor,
  getPathwayLabel,
} from "@/types/senior-planner";

interface ConfidenceGaugeProps {
  score: number;
  verdict: CoCAssessmentResult["eligibilityVerdict"];
}

function ConfidenceGauge({ score, verdict }: ConfidenceGaugeProps) {
  const getColor = () => {
    if (verdict === "likely_eligible") return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30";
    if (verdict === "possibly_eligible") return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
    if (verdict === "not_eligible") return "text-red-600 bg-red-100 dark:bg-red-900/30";
    return "text-slate-600 bg-slate-100 dark:bg-slate-800";
  };

  const getVerdictLabel = () => {
    if (verdict === "likely_eligible") return "Likely Eligible";
    if (verdict === "possibly_eligible") return "Possibly Eligible";
    if (verdict === "not_eligible") return "Not Eligible";
    return "Content Restricted";
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`w-24 h-24 rounded-full flex flex-col items-center justify-center font-bold ${getColor()}`}>
        <span className="text-2xl">{score}%</span>
        <span className="text-xs">Confidence</span>
      </div>
      <span className={`text-sm font-bold ${getVerdictColor(verdict)}`}>{getVerdictLabel()}</span>
    </div>
  );
}

export function CoCMode() {
  // Form state
  const [circumstances, setCircumstances] = useState("");
  const [selectedTriggers, setSelectedTriggers] = useState<CoCTriggerCategory[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // Processing state
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [assessmentResult, setAssessmentResult] = useState<CoCAssessmentResult | null>(null);
  const [viewMode, setViewMode] = useState<CoCViewMode>("sc");

  // History
  const [history, setHistory] = useState<CoCHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const supabase = createClient();

  // Toggle trigger selection
  const toggleTrigger = (triggerId: CoCTriggerCategory) => {
    setSelectedTriggers((prev) =>
      prev.includes(triggerId) ? prev.filter((t) => t !== triggerId) : [...prev, triggerId]
    );
  };

  // Load history
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("coc_assessments")
        .select("id, description, confidence_score, eligibility_verdict, recommended_pathway, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setHistory(
        (data || []).map((item) => ({
          id: item.id,
          description: item.description.slice(0, 50) + (item.description.length > 50 ? "..." : ""),
          confidenceScore: item.confidence_score,
          eligibilityVerdict: item.eligibility_verdict as CoCAssessmentResult["eligibilityVerdict"],
          recommendedPathway: item.recommended_pathway as CoCAssessmentResult["recommendedPathway"],
          createdAt: new Date(item.created_at),
        }))
      );
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [supabase]);

  // Handle assessment
  const handleAssess = async () => {
    if (!circumstances.trim()) {
      setError("Please describe the change in circumstances.");
      return;
    }

    if (circumstances.trim().length < 50) {
      setError("Please provide at least 50 characters describing the circumstances.");
      return;
    }

    setIsAssessing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("coc-eligibility-assessor", {
        body: {
          circumstances,
          triggers: selectedTriggers,
          documentNames: fileName ? [fileName] : undefined,
        },
      });

      if (fnError) throw fnError;

      if (!data.success) {
        throw new Error(data.error || "Assessment failed");
      }

      const result = data.data as CoCAssessmentResult;
      setAssessmentResult(result);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("coc_assessments").insert({
          user_id: user.id,
          description: circumstances,
          triggers: selectedTriggers,
          document_names: fileName ? [fileName] : [],
          confidence_score: result.confidenceScore,
          eligibility_verdict: result.eligibilityVerdict,
          recommended_pathway: result.recommendedPathway,
          sc_report: result.scReport,
          participant_report: result.participantReport,
          evidence_suggestions: result.evidenceSuggestions,
          ndis_references: result.ndisReferences,
          next_steps: result.nextSteps,
          content_restricted: result.contentRestriction || false,
          model_used: data.model,
          processing_time_ms: result.processingTime,
        });

        loadHistory();
      }
    } catch (err) {
      console.error("Assessment error:", err);
      setError(err instanceof Error ? err.message : "Failed to perform assessment");
    } finally {
      setIsAssessing(false);
    }
  };

  // Load history item
  const loadHistoryItem = async (item: CoCHistoryItem) => {
    try {
      const { data, error } = await supabase
        .from("coc_assessments")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      setCircumstances(data.description);
      setSelectedTriggers(data.triggers || []);
      setAssessmentResult({
        confidenceScore: data.confidence_score,
        eligibilityVerdict: data.eligibility_verdict,
        recommendedPathway: data.recommended_pathway,
        scReport: data.sc_report,
        participantReport: data.participant_report,
        evidenceSuggestions: data.evidence_suggestions || [],
        ndisReferences: data.ndis_references || [],
        nextSteps: data.next_steps || [],
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
    setCircumstances("");
    setSelectedTriggers([]);
    setFileName(null);
    setAssessmentResult(null);
    setError(null);
  };

  // Export PDF
  const handleExportPDF = () => {
    if (!assessmentResult) return;

    generateCoCPDF({
      assessmentResult,
      viewMode,
    });
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "essential") return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    if (priority === "recommended") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  };

  const getResponsibleColor = (responsible: string) => {
    if (responsible === "participant") return "bg-blue-100 text-blue-700";
    if (responsible === "sc") return "bg-purple-100 text-purple-700";
    if (responsible === "provider") return "bg-emerald-100 text-emerald-700";
    return "bg-amber-100 text-amber-700";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <RefreshCcw className="w-6 h-6 text-indigo-600" />
              Change of Circumstances Assessor
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Assess eligibility for NDIS unscheduled plan reassessment
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
          {/* Circumstances Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Describe the Change in Circumstances
            </label>
            <textarea
              value={circumstances}
              onChange={(e) => setCircumstances(e.target.value)}
              placeholder="Describe what has changed for the participant... Include details about the nature of the change, when it occurred, and how it affects their daily life and support needs."
              rows={6}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-500 mt-1">
              {circumstances.length} characters {circumstances.length < 50 && "(minimum 50)"}
            </span>
          </div>

          {/* Trigger Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Applicable Triggers (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {COC_TRIGGER_CATEGORIES.map((trigger) => (
                <button
                  key={trigger.id}
                  onClick={() => toggleTrigger(trigger.id)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedTriggers.includes(trigger.id)
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                        selectedTriggers.includes(trigger.id)
                          ? "bg-indigo-600 border-indigo-600"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {selectedTriggers.includes(trigger.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {trigger.label}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{trigger.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
              onClick={handleAssess}
              disabled={isAssessing || circumstances.length < 50}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAssessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assessing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Assess Eligibility
                </>
              )}
            </button>
            {assessmentResult && (
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
        {assessmentResult && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Status Header */}
            <div className={`p-4 ${
              assessmentResult.eligibilityVerdict === "likely_eligible" ? "bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800" :
              assessmentResult.eligibilityVerdict === "possibly_eligible" ? "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800" :
              assessmentResult.eligibilityVerdict === "not_eligible" ? "bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800" :
              "bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <ConfidenceGauge
                    score={assessmentResult.confidenceScore}
                    verdict={assessmentResult.eligibilityVerdict}
                  />
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                      Recommended: {getPathwayLabel(assessmentResult.recommendedPathway)}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Based on the circumstances provided
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
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Report As:</span>
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    onClick={() => setViewMode("sc")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "sc"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    Support Coordinator
                  </button>
                  <button
                    onClick={() => setViewMode("participant")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "participant"
                        ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Participant
                  </button>
                </div>
              </div>

              {/* Report Content */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {viewMode === "sc" ? "Support Coordinator Report" : "Participant Report"}
                </h4>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {viewMode === "sc" ? assessmentResult.scReport : assessmentResult.participantReport}
                  </p>
                </div>
              </div>

              {/* Evidence Suggestions */}
              {assessmentResult.evidenceSuggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Evidence to Gather ({assessmentResult.evidenceSuggestions.length})
                  </h4>
                  <div className="space-y-2">
                    {assessmentResult.evidenceSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {suggestion.title}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{suggestion.description}</p>
                        {suggestion.examples && suggestion.examples.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-slate-500">Examples:</span>
                            <ul className="text-xs text-slate-500 list-disc list-inside">
                              {suggestion.examples.map((ex, i) => (
                                <li key={i}>{ex}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps Timeline */}
              {assessmentResult.nextSteps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Action Timeline
                  </h4>
                  <div className="space-y-3">
                    {assessmentResult.nextSteps.map((step) => (
                      <div
                        key={step.order}
                        className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg p-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {step.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {step.title}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getResponsibleColor(step.responsible)}`}>
                              {step.responsible.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">{step.description}</p>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {step.timeframe}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NDIS References */}
              {assessmentResult.ndisReferences.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    NDIS References
                  </h4>
                  <div className="space-y-2">
                    {assessmentResult.ndisReferences.map((ref, i) => (
                      <div key={i} className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                        <div className="font-medium text-slate-900 dark:text-white">{ref.title}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">{ref.section}</div>
                        <div className="text-xs text-slate-500 mt-1">{ref.relevance}</div>
                      </div>
                    ))}
                  </div>
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
              Recent Assessments
            </h3>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No assessment history yet</p>
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
                        {item.description}
                      </span>
                      <span className={`text-xs font-bold ${getVerdictColor(item.eligibilityVerdict)}`}>
                        {item.confidenceScore}%
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
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
          <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">CoC Assessment</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
            This tool helps determine if a participant's circumstances qualify for an unscheduled plan reassessment.
          </p>
          <ul className="text-xs text-indigo-600 dark:text-indigo-500 space-y-1">
            <li>• Eligibility analysis</li>
            <li>• SC & Participant reports</li>
            <li>• Evidence recommendations</li>
            <li>• Action timeline</li>
            <li>• NDIS references</li>
          </ul>
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm">Important</h4>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                This assessment is for guidance only. Final eligibility decisions are made by the NDIA.
              </p>
            </div>
          </div>
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
