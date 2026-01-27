"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { AIProcessingButton } from "@/components/toolkit/AIProcessingButton";
import { extractTextFromPDF, isPDFFile } from "@/lib/pdf-parser";
import {
  Mail,
  Upload,
  Loader2,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  FileText,
  X,
} from "lucide-react";
import Link from "next/link";

type SCLevel = "level2" | "level3";

interface CoverLetterSection {
  heading: string;
  content: string;
}

interface CoverLetterResult {
  participantSummary: string;
  circumstanceChange: string;
  supportImpact: string;
  evidenceOutline: string;
  requestedOutcome: string;
  sections: CoverLetterSection[];
  modelUsed: string;
}

export default function CoCCoverLetter() {
  const [scLevel, setSCLevel] = useState<SCLevel>("level2");
  const [progressReport, setProgressReport] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    if (file.type === "text/plain") {
      const text = await file.text();
      setProgressReport(text);
      return;
    }

    if (isPDFFile(file)) {
      setIsParsing(true);
      try {
        const parsed = await extractTextFromPDF(file);
        if (parsed.success && parsed.text) {
          setProgressReport(parsed.text);
        } else {
          setError(parsed.error || "Failed to extract text from PDF.");
        }
      } catch {
        setError("Failed to parse PDF. Please paste the content manually.");
      } finally {
        setIsParsing(false);
      }
      return;
    }

    if (file.name.endsWith(".docx")) {
      setError("DOCX parsing coming soon. Please paste the text content directly for now.");
      return;
    }

    setError("Unsupported file type. Please upload a PDF, TXT, or DOCX file.");
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!progressReport.trim()) {
      setError("Please enter or upload your SC progress report.");
      return;
    }
    if (progressReport.trim().length < 50) {
      setError("Please provide at least 50 characters for a meaningful cover letter.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/sc-coc-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scLevel,
          progressReport,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Generation failed");
      }

      setResult(payload.data as CoverLetterResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate cover letter");
    } finally {
      setIsProcessing(false);
    }
  }, [scLevel, progressReport]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const sections = result.sections
      .map((s) => `${s.heading}\n${s.content}`)
      .join("\n\n");
    const text = [
      "=== COC COVER LETTER ===",
      "",
      "PARTICIPANT SUMMARY:",
      result.participantSummary,
      "",
      "CHANGE OF CIRCUMSTANCES:",
      result.circumstanceChange,
      "",
      "SUPPORT IMPACT:",
      result.supportImpact,
      "",
      "EVIDENCE OUTLINE:",
      result.evidenceOutline,
      "",
      "REQUESTED OUTCOME:",
      result.requestedOutcome,
      "",
      "--- FULL LETTER ---",
      "",
      sections,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleExportPDF = useCallback(async () => {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const marginLeft = 20;
    const pageWidth = 170;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Change of Circumstances Cover Letter", marginLeft, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`SC Level: ${scLevel === "level2" ? "Level 2" : "Level 3"} | Generated: ${new Date().toLocaleDateString("en-AU")}`, marginLeft, y);
    y += 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(marginLeft, y, 190, y);
    y += 8;

    const addBlock = (title: string, text: string) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(title, marginLeft, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, pageWidth);
      doc.text(lines, marginLeft, y);
      y += lines.length * 5 + 5;
    };

    addBlock("Participant Summary", result.participantSummary);
    addBlock("Change of Circumstances", result.circumstanceChange);
    addBlock("Support Impact", result.supportImpact);
    addBlock("Evidence Outline", result.evidenceOutline);
    addBlock("Requested Outcome", result.requestedOutcome);

    result.sections.forEach((section) => {
      addBlock(section.heading, section.content);
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Generated by Praxis AI - SC Toolkit", marginLeft, 290);
      doc.text(`Page ${i} of ${totalPages}`, 170, 290);
    }

    doc.save(`coc-cover-letter-${Date.now()}.pdf`);
  }, [result, scLevel]);

  const resetForm = useCallback(() => {
    setProgressReport("");
    setFileName(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <Header title="CoC Cover Letter Generator" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link href="/sc-toolkit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-purple-600" />
                CoC Cover Letter Generator
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Generate professional Change of Circumstances cover letters from your SC progress reports
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              {/* SC Level */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  SC Level
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scLevel"
                      value="level2"
                      checked={scLevel === "level2"}
                      onChange={() => setSCLevel("level2")}
                      className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Level 2 - Coordination of Supports</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="scLevel"
                      value="level3"
                      checked={scLevel === "level3"}
                      onChange={() => setSCLevel("level3")}
                      className="w-4 h-4 text-purple-600 border-slate-300 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Level 3 - Specialist SC</span>
                  </label>
                </div>
              </div>

              {/* Progress Report */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  SC Progress Report
                </label>
                <textarea
                  value={progressReport}
                  onChange={(e) => setProgressReport(e.target.value)}
                  placeholder="Paste your SC progress report here, or upload a file below..."
                  rows={12}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    {isParsing ? "Extracting text..." : `${progressReport.length} characters ${progressReport.length < 50 ? "(minimum 50)" : ""}`}
                  </span>
                  <label className={`flex items-center gap-2 text-sm ${isParsing ? "text-slate-400 cursor-wait" : "text-purple-600 hover:text-purple-700 cursor-pointer"}`}>
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isParsing ? "Parsing..." : "Upload File"}</span>
                    <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} disabled={isParsing} className="hidden" />
                  </label>
                </div>
                {fileName && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    <span>{fileName}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3">
                <AIProcessingButton
                  isProcessing={isProcessing}
                  onClick={handleGenerate}
                  disabled={progressReport.length < 50}
                  label="Generate Cover Letter"
                  variant="indigo"
                  type="assess"
                />
                {result && (
                  <button onClick={resetForm} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-200 dark:border-purple-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-800 dark:text-purple-300">Cover Letter Generated</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button onClick={handleExportPDF} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <ResultSection title="Participant Summary" content={result.participantSummary} color="blue" />
                  <ResultSection title="Change of Circumstances" content={result.circumstanceChange} color="purple" />
                  <ResultSection title="Impact on Supports" content={result.supportImpact} color="amber" />
                  <ResultSection title="Evidence Outline" content={result.evidenceOutline} color="emerald" />
                  <ResultSection title="Requested Outcome" content={result.requestedOutcome} color="indigo" />

                  {result.sections.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Additional Sections</h4>
                      <div className="space-y-3">
                        {result.sections.map((section, i) => (
                          <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{section.heading}</h5>
                            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{section.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
              <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">CoC Cover Letter</h3>
              <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
                Generate structured cover letters for Change of Circumstances plan reviews.
              </p>
              <ul className="text-xs text-purple-600 dark:text-purple-500 space-y-1">
                <li>• Auto-extracts from progress reports</li>
                <li>• Structured NDIS format</li>
                <li>• Level 2 &amp; Level 3 templates</li>
                <li>• PDF export ready</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">What to Include</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Participant background and current supports
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Description of the change in circumstances
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Impact on daily living and support needs
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Evidence from allied health professionals
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Specific outcomes being requested
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ResultSection({ title, content, color }: { title: string; content: string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
  };
  const titleClasses: Record<string, string> = {
    blue: "text-blue-700 dark:text-blue-300",
    purple: "text-purple-700 dark:text-purple-300",
    amber: "text-amber-700 dark:text-amber-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    indigo: "text-indigo-700 dark:text-indigo-300",
  };
  const textClasses: Record<string, string> = {
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };

  return (
    <div className={`rounded-lg p-4 border ${colorClasses[color] || colorClasses.blue}`}>
      <h4 className={`text-sm font-bold mb-1 ${titleClasses[color] || titleClasses.blue}`}>{title}</h4>
      <p className={`text-sm whitespace-pre-wrap ${textClasses[color] || textClasses.blue}`}>{content}</p>
    </div>
  );
}
