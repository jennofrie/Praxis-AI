"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  FileText,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Download,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCcw,
  Clock,
  User,
  Briefcase,
  ArrowRight,
  ExternalLink,
  FileCheck,
  AlertCircle,
  Upload,
  X,
  Wand2,
} from "lucide-react";
import { AIProcessingButton } from "./AIProcessingButton";
import { createClient } from "@/lib/supabase/client";
import { generateCoCPDF } from "@/lib/pdf-export";
import { extractTextFromPDF, isPDFFile } from "@/lib/pdf-parser";
import {
  CoCTriggerCategory,
  COC_TRIGGER_CATEGORIES,
  CoCAssessmentResult,
  CoCHistoryItem,
  CoCViewMode,
  getVerdictColor,
  getPathwayLabel,
} from "@/types/senior-planner";
import { useAIProvider } from "@/components/providers/AIProviderContext";
import { useAdmin } from "@/components/providers/AdminContext";

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

// Helper function to detect triggers from text content
function detectTriggersFromContent(text: string): CoCTriggerCategory[] {
  const textLower = text.toLowerCase();
  const detectedTriggers: CoCTriggerCategory[] = [];

  // Health condition keywords
  if (
    textLower.includes("diagnosis") ||
    textLower.includes("deteriorat") ||
    textLower.includes("hospital") ||
    textLower.includes("medical") ||
    textLower.includes("health condition") ||
    textLower.includes("illness") ||
    textLower.includes("disease") ||
    textLower.includes("prognosis") ||
    textLower.includes("symptom")
  ) {
    detectedTriggers.push("health_condition");
  }

  // Living situation keywords
  if (
    textLower.includes("moving") ||
    textLower.includes("relocat") ||
    textLower.includes("new home") ||
    textLower.includes("living arrangement") ||
    textLower.includes("accommodation") ||
    textLower.includes("housing") ||
    textLower.includes("sil") ||
    textLower.includes("supported independent living")
  ) {
    detectedTriggers.push("living_situation");
  }

  // Support needs keywords
  if (
    textLower.includes("support needs") ||
    textLower.includes("increased support") ||
    textLower.includes("additional support") ||
    textLower.includes("more assistance") ||
    textLower.includes("care needs") ||
    textLower.includes("support hours") ||
    textLower.includes("require more")
  ) {
    detectedTriggers.push("support_needs");
  }

  // Goals/aspirations keywords
  if (
    textLower.includes("goal") ||
    textLower.includes("aspiration") ||
    textLower.includes("employment") ||
    textLower.includes("study") ||
    textLower.includes("education") ||
    textLower.includes("career") ||
    textLower.includes("independence") ||
    textLower.includes("community participation")
  ) {
    detectedTriggers.push("goals_aspirations");
  }

  // Informal supports keywords
  if (
    textLower.includes("carer") ||
    textLower.includes("family support") ||
    textLower.includes("informal support") ||
    textLower.includes("parent") ||
    textLower.includes("spouse") ||
    textLower.includes("partner") ||
    textLower.includes("relative") ||
    textLower.includes("caregiver")
  ) {
    detectedTriggers.push("informal_supports");
  }

  // Equipment/AT keywords
  if (
    textLower.includes("equipment") ||
    textLower.includes("assistive technology") ||
    textLower.includes("wheelchair") ||
    textLower.includes("mobility aid") ||
    textLower.includes("communication device") ||
    textLower.includes("home modification") ||
    textLower.includes("ramp") ||
    textLower.includes("hoist")
  ) {
    detectedTriggers.push("equipment_at");
  }

  // Plan utilisation keywords
  if (
    textLower.includes("underspend") ||
    textLower.includes("overspend") ||
    textLower.includes("budget") ||
    textLower.includes("funding") ||
    textLower.includes("utilisation") ||
    textLower.includes("not using") ||
    textLower.includes("ran out")
  ) {
    detectedTriggers.push("plan_utilisation");
  }

  // Crisis/emergency keywords
  if (
    textLower.includes("crisis") ||
    textLower.includes("emergency") ||
    textLower.includes("urgent") ||
    textLower.includes("immediate") ||
    textLower.includes("risk") ||
    textLower.includes("safety") ||
    textLower.includes("harm")
  ) {
    detectedTriggers.push("crisis_emergency");
  }

  return detectedTriggers;
}

// Helper to extract text from TXT files
async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read text file"));
    reader.readAsText(file);
  });
}

// Helper to extract text from DOCX files (basic extraction)
async function extractTextFromDOCX(file: File): Promise<string> {
  // DOCX is a ZIP file containing XML
  // For basic extraction, we'll use JSZip if available, or fallback to mammoth
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Try to dynamically import mammoth for DOCX parsing
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch {
    throw new Error("DOCX parsing requires mammoth library. Please paste the text content directly.");
  }
}

export function CoCMode() {
  const { provider, enableFallback } = useAIProvider();
  const { isAdmin } = useAdmin();
  // Form state
  const [circumstances, setCircumstances] = useState("");
  const [selectedTriggers, setSelectedTriggers] = useState<CoCTriggerCategory[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [autoDetectedTriggers, setAutoDetectedTriggers] = useState<CoCTriggerCategory[]>([]);

  // Processing state
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [assessmentResult, setAssessmentResult] = useState<CoCAssessmentResult | null>(null);
  const [viewMode, setViewMode] = useState<CoCViewMode>("sc");

  // History
  const [history, setHistory] = useState<CoCHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  // Model tier tracking
  const [currentTier, setCurrentTier] = useState<'premium' | 'standard' | null>(null);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAssessment, setViewingAssessment] = useState<CoCAssessmentResult | null>(null);
  const [viewingDescription, setViewingDescription] = useState<string>("");

  const supabase = createClient();
  const MAX_HISTORY_ITEMS = 20;

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setError(null);

    try {
      let extractedText = "";

      if (isPDFFile(file)) {
        const result = await extractTextFromPDF(file);
        if (!result.success) {
          throw new Error(result.error || "Failed to parse PDF");
        }
        extractedText = result.text;
      } else if (file.name.toLowerCase().endsWith(".txt")) {
        extractedText = await extractTextFromTXT(file);
      } else if (
        file.name.toLowerCase().endsWith(".docx") ||
        file.name.toLowerCase().endsWith(".doc")
      ) {
        extractedText = await extractTextFromDOCX(file);
      } else {
        throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT files.");
      }

      if (!extractedText.trim()) {
        throw new Error("No text content found in file");
      }

      setFileName(file.name);
      setFileContent(extractedText);

      // Auto-detect triggers from the content
      const detectedTriggers = detectTriggersFromContent(extractedText);
      setAutoDetectedTriggers(detectedTriggers);

      // Merge with existing selected triggers (don't remove user selections)
      setSelectedTriggers((prev) => {
        const merged = new Set([...prev, ...detectedTriggers]);
        return Array.from(merged) as CoCTriggerCategory[];
      });

      // If circumstances is empty, add a summary note
      if (!circumstances.trim()) {
        setCircumstances(`[Content extracted from: ${file.name}]\n\n${extractedText.slice(0, 2000)}${extractedText.length > 2000 ? "..." : ""}`);
      }
    } catch (err) {
      console.error("File parsing error:", err);
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsParsingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Clear uploaded file
  const clearFile = () => {
    setFileName(null);
    setFileContent(null);
    setAutoDetectedTriggers([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Toggle trigger selection
  const toggleTrigger = (triggerId: CoCTriggerCategory) => {
    setSelectedTriggers((prev) =>
      prev.includes(triggerId) ? prev.filter((t) => t !== triggerId) : [...prev, triggerId]
    );
  };

  // Load history and cleanup old records (keep only 20 most recent)
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      // First, get all assessments to check if cleanup is needed
      const { data: allData, error: countError } = await supabase
        .from("coc_assessments")
        .select("id, created_at")
        .order("created_at", { ascending: false });

      if (countError) throw countError;

      // If more than MAX_HISTORY_ITEMS, delete the oldest ones
      if (allData && allData.length > MAX_HISTORY_ITEMS) {
        const idsToDelete = allData.slice(MAX_HISTORY_ITEMS).map((item: { id: string }) => item.id);
        await supabase.from("coc_assessments").delete().in("id", idsToDelete);
      }

      // Now fetch the remaining history
      const { data, error } = await supabase
        .from("coc_assessments")
        .select("id, description, confidence_score, eligibility_verdict, recommended_pathway, created_at")
        .order("created_at", { ascending: false })
        .limit(MAX_HISTORY_ITEMS);

      if (error) throw error;

      setHistory(
        (data || []).map((item: {
          id: string;
          description: string;
          confidence_score: number;
          eligibility_verdict: string;
          recommended_pathway: string;
          created_at: string;
        }) => ({
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

  // Delete a history item
  const deleteHistoryItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering loadHistoryItem
    try {
      const { error } = await supabase.from("coc_assessments").delete().eq("id", id);
      if (error) throw error;
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  // Export a history item to PDF
  const exportHistoryItemPDF = async (item: CoCHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering loadHistoryItem
    try {
      const { data, error } = await supabase
        .from("coc_assessments")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      const assessmentData: CoCAssessmentResult = {
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
      };

      generateCoCPDF({
        assessmentResult: assessmentData,
        viewMode: "sc",
      });
    } catch (err) {
      console.error("Failed to export history item:", err);
    }
  };

  // View a history item in modal
  const viewHistoryItem = async (item: CoCHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase
        .from("coc_assessments")
        .select("*")
        .eq("id", item.id)
        .single();

      if (error) throw error;

      const assessmentData: CoCAssessmentResult = {
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
      };

      setViewingAssessment(assessmentData);
      setViewingDescription(data.description || "CoC Assessment");
      setViewModalOpen(true);
    } catch (err) {
      console.error("Failed to view history item:", err);
    }
  };

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

    // Check if user is authenticated and refresh if needed
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setError("Please log in to use the assessment feature.");
      return;
    }

    // Proactively refresh if token expires within 60 seconds
    const expiresAt = session.expires_at ? session.expires_at * 1000 : null;
    if (expiresAt && expiresAt < Date.now() + 60_000) {
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        setError("Session expired. Please log in again.");
        return;
      }
    }

    setIsAssessing(true);
    setError(null);

    try {
      // Combine circumstances with file content if available
      const fullContent = fileContent
        ? `${circumstances}\n\n--- Uploaded Document Content ---\n\n${fileContent}`
        : circumstances;

      // Call the server-side API route (handles auth via service role)
      const response = await fetch("/api/ai/coc-eligibility-assessor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          circumstances: fullContent,
          triggers: selectedTriggers,
          documentNames: fileName ? [fileName] : undefined,
          provider,
          enableFallback: isAdmin ? enableFallback : false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Assessment failed");
      }

      if (!data.success) {
        throw new Error(data.error || "Assessment failed");
      }

      const result = data.data as CoCAssessmentResult;
      setAssessmentResult(result);

      // Track the model tier used (premium = Gemini 2.5 Pro, standard = Gemini 2.0 Flash)
      if (data.tier) {
        setCurrentTier(data.tier as 'premium' | 'standard');
      }

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
      if (err instanceof Error && err.message.includes("401")) {
        setError("Unauthorized. Please log out and log back in to refresh your session.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to perform assessment");
      }
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
    } catch (err) {
      console.error("Failed to load history item:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setCircumstances("");
    setSelectedTriggers([]);
    setFileName(null);
    setFileContent(null);
    setAutoDetectedTriggers([]);
    setAssessmentResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Upload Supporting Document (Optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="coc-file-upload"
              />
              <label
                htmlFor="coc-file-upload"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed cursor-pointer transition-colors ${
                  isParsingFile
                    ? "border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {isParsingFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-indigo-600">Parsing file...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Upload PDF, DOCX, or TXT
                    </span>
                  </>
                )}
              </label>

              {fileName && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300 max-w-[200px] truncate">
                    {fileName}
                  </span>
                  <button
                    onClick={clearFile}
                    className="p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-800 rounded"
                  >
                    <X className="w-3 h-3 text-emerald-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Auto-detected triggers notification */}
            {autoDetectedTriggers.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                <Wand2 className="w-3 h-3" />
                <span>
                  Auto-detected {autoDetectedTriggers.length} trigger{autoDetectedTriggers.length > 1 ? "s" : ""} from document
                </span>
              </div>
            )}
          </div>

          {/* Trigger Categories */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select Applicable Triggers {autoDetectedTriggers.length > 0 ? "(Auto-detected highlighted)" : "(Optional)"}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {COC_TRIGGER_CATEGORIES.map((trigger) => {
                const isSelected = selectedTriggers.includes(trigger.id);
                const isAutoDetected = autoDetectedTriggers.includes(trigger.id);

                return (
                  <button
                    key={trigger.id}
                    onClick={() => toggleTrigger(trigger.id)}
                    className={`text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? isAutoDetected
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center ${
                          isSelected
                            ? isAutoDetected
                              ? "bg-emerald-600 border-emerald-600"
                              : "bg-indigo-600 border-indigo-600"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {trigger.label}
                          </span>
                          {isAutoDetected && (
                            <span className="text-xs px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded">
                              Auto
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{trigger.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
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
            <AIProcessingButton
              isProcessing={isAssessing}
              onClick={handleAssess}
              disabled={circumstances.length < 50}
              label="Assess CoC Eligibility"
              variant="indigo"
              type="assess"
            />
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
        {/* Info Card */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4">
          <h3 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2">CoC Assessment</h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 mb-3">
            This tool helps determine if a participant&apos;s circumstances qualify for an unscheduled plan reassessment.
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
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              currentTier === 'standard' ? 'bg-blue-500' : 'bg-emerald-500'
            }`} />
            <span className="text-sm text-slate-600 dark:text-slate-400">Spectra Praxis Online</span>
          </div>
        </div>

        {/* Assessment History - Always Visible */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <button
            onClick={() => setHistoryExpanded(!historyExpanded)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Assessment History
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
                  <RefreshCcw className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No assessment history yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your CoC assessments will appear here
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
                            {item.description}
                          </span>
                          <span className={`text-xs font-bold ${getVerdictColor(item.eligibilityVerdict)}`}>
                            {item.confidenceScore}%
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
                          className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800/50 transition-colors"
                          title="Export to PDF"
                        >
                          <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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
                  Oldest assessments are automatically removed when limit is reached
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* View Assessment Modal */}
      {viewModalOpen && viewingAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              viewingAssessment.eligibilityVerdict === "likely_eligible" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" :
              viewingAssessment.eligibilityVerdict === "possibly_eligible" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
              viewingAssessment.eligibilityVerdict === "not_eligible" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" :
              "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            }`}>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">CoC Assessment Details</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-md">{viewingDescription}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${getVerdictColor(viewingAssessment.eligibilityVerdict)}`}>
                  {viewingAssessment.confidenceScore}% Confidence
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
              {/* Verdict & Pathway */}
              <div className="flex items-center justify-center gap-6">
                <ConfidenceGauge
                  score={viewingAssessment.confidenceScore}
                  verdict={viewingAssessment.eligibilityVerdict}
                />
                <div className="text-center">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Recommended: {getPathwayLabel(viewingAssessment.recommendedPathway)}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Based on the circumstances provided
                  </p>
                </div>
              </div>

              {/* SC Report */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Support Coordinator Report
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {viewingAssessment.scReport}
                  </p>
                </div>
              </div>

              {/* Participant Report */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Participant Report
                </h4>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {viewingAssessment.participantReport}
                  </p>
                </div>
              </div>

              {/* Evidence Suggestions */}
              {viewingAssessment.evidenceSuggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Evidence to Gather ({viewingAssessment.evidenceSuggestions.length})
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {viewingAssessment.evidenceSuggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {suggestion.title}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            suggestion.priority === "essential" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                            suggestion.priority === "recommended" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {suggestion.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{suggestion.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps Timeline */}
              {viewingAssessment.nextSteps.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4" />
                    Action Timeline ({viewingAssessment.nextSteps.length})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {viewingAssessment.nextSteps.map((step) => (
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
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              step.responsible === "participant" ? "bg-blue-100 text-blue-700" :
                              step.responsible === "sc" ? "bg-purple-100 text-purple-700" :
                              step.responsible === "provider" ? "bg-emerald-100 text-emerald-700" :
                              "bg-amber-100 text-amber-700"
                            }`}>
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
              {viewingAssessment.ndisReferences.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    NDIS References ({viewingAssessment.ndisReferences.length})
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {viewingAssessment.ndisReferences.map((ref, i) => (
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

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  generateCoCPDF({
                    assessmentResult: viewingAssessment,
                    viewMode: "sc",
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
