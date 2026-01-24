"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { 
  ChevronRight, 
  Upload, 
  FileText, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Download,
  RotateCcw,
  Info
} from "lucide-react";
import Link from "next/link";

const NDIS_DOMAINS = [
  { id: "self-care", name: "Self-Care", description: "Personal hygiene, dressing, eating, toileting" },
  { id: "mobility", name: "Mobility", description: "Walking, transfers, community access, driving" },
  { id: "communication", name: "Communication", description: "Verbal, written, assistive technology use" },
  { id: "social", name: "Social Interaction", description: "Relationships, community participation, social skills" },
  { id: "learning", name: "Learning", description: "Cognitive function, skill acquisition, education" },
  { id: "self-management", name: "Self-Management", description: "Decision making, planning, managing health" },
  { id: "domestic", name: "Domestic Activities", description: "Cooking, cleaning, home maintenance" },
];

interface DomainEvidence {
  domain: string;
  observations: string[];
  confidence: "high" | "medium" | "low";
  gaps: string[];
}

export default function EvidenceMatrix() {
  const [rawNotes, setRawNotes] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evidence, setEvidence] = useState<DomainEvidence[]>([]);
  const [completenessScore, setCompletenessScore] = useState(0);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawNotes(text);
      };
      reader.readAsText(file);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!rawNotes.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/ai/evidence-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rawNotes }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('Evidence matrix analysis failed:', result.error);
        // Fallback to empty state with error message
        setEvidence([]);
        setCompletenessScore(0);
        return;
      }
      
      const data = result.data;
      
      // Map API response to component format
      const mappedEvidence: DomainEvidence[] = NDIS_DOMAINS.map(domain => {
        const domainData = data.domains?.find(
          (d: { domain: string }) => d.domain.toLowerCase() === domain.name.toLowerCase()
        );
        
        return {
          domain: domain.name,
          observations: domainData?.observations || [],
          confidence: (domainData?.confidence || 'low') as 'high' | 'medium' | 'low',
          gaps: domainData?.gaps || (domainData?.observations?.length ? [] : ['No evidence detected']),
        };
      });
      
      setEvidence(mappedEvidence);
      setCompletenessScore(data.completenessScore || 0);
    } catch (error) {
      console.error('Error analyzing evidence:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setRawNotes("");
    setFileName(null);
    setEvidence([]);
    setCompletenessScore(0);
  };

  const handleExport = () => {
    const report = generateMarkdownReport();
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Evidence_Matrix_${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateMarkdownReport = () => {
    let report = `# NDIS Evidence Matrix Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**Completeness Score:** ${completenessScore}%\n\n`;
    report += `---\n\n`;
    
    evidence.forEach(e => {
      report += `## ${e.domain}\n`;
      report += `**Confidence:** ${e.confidence.toUpperCase()}\n\n`;
      
      if (e.observations.length > 0) {
        report += `### Evidence\n`;
        e.observations.forEach(obs => {
          report += `- ${obs}\n`;
        });
        report += `\n`;
      }
      
      if (e.gaps.length > 0) {
        report += `### Gaps Identified\n`;
        e.gaps.forEach(gap => {
          report += `- ⚠️ ${gap}\n`;
        });
        report += `\n`;
      }
      
      report += `---\n\n`;
    });
    
    return report;
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "medium": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "low": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <>
      <Header title="Evidence Matrix" />
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/toolkit" className="hover:text-indigo-600 transition-colors">Toolkit</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-semibold text-slate-900 dark:text-white">Evidence Matrix Builder</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">NDIS Evidence Matrix</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Upload clinical notes to map evidence against NDIS functional domains. Target: 80% coverage.
              </p>
            </div>
            {evidence.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button 
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> Export Report
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" /> Clinical Notes
                </h3>
                
                {/* File Upload */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-indigo-500 transition-colors mb-4">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">
                    {fileName || "Upload .txt, .md, or .docx"}
                  </span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".txt,.md,.docx"
                    onChange={handleFileUpload}
                  />
                </label>

                <div className="relative">
                  <textarea
                    className="w-full h-64 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 resize-none text-sm focus:ring-2 focus:ring-indigo-600 outline-none"
                    placeholder="Or paste your session notes here..."
                    value={rawNotes}
                    onChange={(e) => setRawNotes(e.target.value)}
                  />
                  <span className="absolute bottom-3 right-3 text-xs text-slate-400">
                    {rawNotes.length} chars
                  </span>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !rawNotes.trim()}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold transition-all hover:bg-indigo-700"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> Analyze with AI</>
                  )}
                </button>
              </div>

              {/* Score Card */}
              {evidence.length > 0 && (
                <div className={`p-5 rounded-xl border ${
                  completenessScore >= 80 
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" 
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white">Completeness</h3>
                    <span className={`text-2xl font-black ${
                      completenessScore >= 80 ? "text-emerald-600" : "text-amber-600"
                    }`}>
                      {completenessScore}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        completenessScore >= 80 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${completenessScore}%` }}
                    />
                  </div>
                  <p className="text-xs mt-3 text-slate-600 dark:text-slate-400">
                    {completenessScore >= 80 
                      ? "Evidence coverage meets NDIS requirements." 
                      : "Additional evidence recommended for comprehensive FCA."}
                  </p>
                </div>
              )}
            </div>

            {/* Evidence Heatmap */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 min-h-[600px]">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Domain Evidence Map</h3>
                
                {evidence.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                    <Info className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center">Upload or paste clinical notes and click<br />&quot;Analyze with AI&quot; to generate the evidence matrix.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evidence.map((item) => (
                      <div 
                        key={item.domain}
                        className={`p-4 rounded-xl border transition-all ${
                          item.observations.length > 0 
                            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" 
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {item.observations.length > 0 ? (
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-red-400" />
                            )}
                            <h4 className="font-semibold text-slate-900 dark:text-white">{item.domain}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getConfidenceColor(item.confidence)}`}>
                              {item.confidence} confidence
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {item.observations.length} pts
                            </span>
                          </div>
                        </div>
                        
                        {item.observations.length > 0 && (
                          <ul className="space-y-2 mb-3">
                            {item.observations.map((obs, i) => (
                              <li key={i} className="text-sm text-slate-600 dark:text-slate-300 pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                                {obs}
                              </li>
                            ))}
                          </ul>
                        )}
                        
                        {item.gaps.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">Evidence Gaps:</p>
                            <ul className="space-y-1">
                              {item.gaps.map((gap, i) => (
                                <li key={i} className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> {gap}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
