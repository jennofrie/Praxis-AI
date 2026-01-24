"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { 
  ChevronRight, 
  FileSearch, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from "lucide-react";
import Link from "next/link";

interface QualityIssue {
  id: string;
  type: "error" | "warning" | "suggestion";
  category: "terminology" | "evidence" | "reasoning" | "structure";
  text: string;
  location: string;
  explanation: string;
  suggestion: string;
  alternatives?: string[];
}

interface QualityReport {
  overallScore: number;
  terminologyScore: number;
  evidenceScore: number;
  reasoningScore: number;
  issues: QualityIssue[];
}

export default function QualityChecker() {
  const [reportText, setReportText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());

  const handleCheck = async () => {
    if (!reportText.trim()) return;
    
    setIsChecking(true);
    
    try {
      const response = await fetch('/api/ai/quality-checker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportContent: reportText }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('Quality check failed:', result.error);
        return;
      }
      
      const data = result.data;
      
      // Map API response to component format
      const mappedReport: QualityReport = {
        overallScore: data.qualityScore || (100 - data.riskScore),
        terminologyScore: data.terminologyScore || 50,
        evidenceScore: data.evidenceScore || 50,
        reasoningScore: data.reasoningScore || 50,
        issues: (data.issues || []).map((issue: { phrase: string; category: string; explanation: string; suggestion: string; severity?: string }, index: number) => ({
          id: String(index + 1),
          type: issue.severity === 'high' ? 'error' : issue.severity === 'medium' ? 'warning' : 'suggestion',
          category: issue.category as QualityIssue['category'],
          text: issue.phrase,
          location: 'Document',
          explanation: issue.explanation,
          suggestion: issue.suggestion,
          alternatives: [],
        })),
      };
      
      setQualityReport(mappedReport);
    } catch (error) {
      console.error('Error checking quality:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const toggleIssue = (id: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIssues(newExpanded);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning": return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "suggestion": return <Lightbulb className="w-5 h-5 text-blue-500" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getIssueBorder = (type: string) => {
    switch (type) {
      case "error": return "border-l-red-500";
      case "warning": return "border-l-amber-500";
      case "suggestion": return "border-l-blue-500";
      default: return "border-l-slate-300";
    }
  };

  const errorCount = qualityReport?.issues.filter(i => i.type === "error").length || 0;
  const warningCount = qualityReport?.issues.filter(i => i.type === "warning").length || 0;
  const suggestionCount = qualityReport?.issues.filter(i => i.type === "suggestion").length || 0;

  return (
    <>
      <Header title="Quality Checker" />
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/toolkit" className="hover:text-indigo-600 transition-colors">Toolkit</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-semibold text-slate-900 dark:text-white">Report Quality Checker</span>
          </nav>

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">NDIS Report Quality Checker</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Analyze your report for NDIS compliance, terminology, and evidence quality. Minimum submission score: 75%.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-indigo-600" /> Report Content
                </h3>
                
                <textarea
                  className="w-full h-[400px] p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 resize-none text-sm focus:ring-2 focus:ring-indigo-600 outline-none font-mono"
                  placeholder="Paste your FCA, progress report, or AT justification here for quality analysis..."
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                />

                <button
                  onClick={handleCheck}
                  disabled={isChecking || !reportText.trim()}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-emerald-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold transition-all hover:bg-emerald-700"
                >
                  {isChecking ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Checking Quality...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Check Quality</>
                  )}
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {!qualityReport ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 min-h-[500px] flex flex-col items-center justify-center text-slate-400">
                  <Info className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-center">Paste your report content and click<br />&quot;Check Quality&quot; to analyze.</p>
                </div>
              ) : (
                <>
                  {/* Score Overview */}
                  <div className={`p-5 rounded-xl border ${
                    qualityReport.overallScore >= 75 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
                      : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Overall Risk Score</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {qualityReport.overallScore >= 75 
                            ? "Report meets minimum submission requirements" 
                            : "Address critical issues before submission"}
                        </p>
                      </div>
                      <div className={`text-4xl font-black ${getScoreColor(qualityReport.overallScore)}`}>
                        {qualityReport.overallScore}%
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <div className={`text-lg font-bold ${getScoreColor(qualityReport.terminologyScore)}`}>
                          {qualityReport.terminologyScore}%
                        </div>
                        <div className="text-xs text-slate-500">Terminology</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <div className={`text-lg font-bold ${getScoreColor(qualityReport.evidenceScore)}`}>
                          {qualityReport.evidenceScore}%
                        </div>
                        <div className="text-xs text-slate-500">Evidence</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                        <div className={`text-lg font-bold ${getScoreColor(qualityReport.reasoningScore)}`}>
                          {qualityReport.reasoningScore}%
                        </div>
                        <div className="text-xs text-slate-500">Reasoning</div>
                      </div>
                    </div>
                  </div>

                  {/* Issue Summary */}
                  <div className="flex gap-3">
                    <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 text-center">
                      <div className="text-xl font-bold text-red-600">{errorCount}</div>
                      <div className="text-xs text-red-600">Errors</div>
                    </div>
                    <div className="flex-1 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800 text-center">
                      <div className="text-xl font-bold text-amber-600">{warningCount}</div>
                      <div className="text-xs text-amber-600">Warnings</div>
                    </div>
                    <div className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                      <div className="text-xl font-bold text-blue-600">{suggestionCount}</div>
                      <div className="text-xs text-blue-600">Suggestions</div>
                    </div>
                  </div>

                  {/* Issues List */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-slate-900 dark:text-white">Issues Found</h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {qualityReport.issues.map((issue) => (
                        <div 
                          key={issue.id}
                          className={`border-l-4 ${getIssueBorder(issue.type)} border-b border-slate-100 dark:border-slate-800 last:border-b-0`}
                        >
                          <button
                            onClick={() => toggleIssue(issue.id)}
                            className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            {getIssueIcon(issue.type)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                  &quot;{issue.text}&quot;
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                                  {issue.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{issue.location}</p>
                            </div>
                            {expandedIssues.has(issue.id) 
                              ? <ChevronUp className="w-5 h-5 text-slate-400" />
                              : <ChevronDown className="w-5 h-5 text-slate-400" />
                            }
                          </button>
                          
                          {expandedIssues.has(issue.id) && (
                            <div className="px-4 pb-4 pl-12 space-y-3">
                              <div>
                                <p className="text-xs font-semibold text-slate-500 mb-1">WHY THIS MATTERS</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{issue.explanation}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-emerald-600 mb-1">SUGGESTED FIX</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{issue.suggestion}</p>
                              </div>
                              {issue.alternatives && (
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 mb-2">ALTERNATIVES</p>
                                  <div className="flex flex-wrap gap-2">
                                    {issue.alternatives.map((alt, i) => (
                                      <span 
                                        key={i}
                                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                      >
                                        {alt}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
