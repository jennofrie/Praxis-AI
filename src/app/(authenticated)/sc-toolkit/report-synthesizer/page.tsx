"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { AIProcessingButton } from "@/components/toolkit/AIProcessingButton";
import { extractTextFromPDF, isPDFFile } from "@/lib/pdf-parser";
import {
  FileText,
  Upload,
  Loader2,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
  ArrowLeft,
  Lightbulb,
  X,
} from "lucide-react";
import Link from "next/link";

interface SynthesisResult {
  synthesizedText: string;
  keyFindings: string[];
  evidenceSummary: string[];
  recommendations: string[];
  ndisAlignment: string[];
  functionalImpact: string;
  modelUsed: string;
}

export default function ReportSynthesizer() {
  const [reportText, setReportText] = useState("");
  const [coordinatorNotes, setCoordinatorNotes] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError(null);

    if (file.type === "text/plain") {
      const text = await file.text();
      setReportText(text);
      return;
    }

    if (isPDFFile(file)) {
      setIsParsing(true);
      try {
        const parsed = await extractTextFromPDF(file);
        if (parsed.success && parsed.text) {
          setReportText(parsed.text);
        } else {
          setError(parsed.error || "Failed to extract text from PDF. Please paste content manually.");
        }
      } catch {
        setError("Failed to parse PDF. Please paste the content manually.");
      } finally {
        setIsParsing(false);
      }
      return;
    }

    setError("Unsupported file type. Please upload a PDF or TXT file.");
  }, []);

  const handleSynthesize = useCallback(async () => {
    if (!reportText.trim()) {
      setError("Please enter or upload report content to synthesize.");
      return;
    }
    if (reportText.trim().length < 50) {
      setError("Please provide at least 50 characters for meaningful synthesis.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/sc-report-synthesizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportContent: reportText,
          coordinatorNotes: coordinatorNotes || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Synthesis failed");
      }

      setResult(payload.data as SynthesisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to synthesize report");
    } finally {
      setIsProcessing(false);
    }
  }, [reportText, coordinatorNotes]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = [
      "=== REPORT SYNTHESIS ===",
      "",
      "SYNTHESIZED TEXT:",
      result.synthesizedText,
      "",
      "KEY FINDINGS:",
      ...result.keyFindings.map((f, i) => `${i + 1}. ${f}`),
      "",
      "EVIDENCE SUMMARY:",
      ...result.evidenceSummary.map((e, i) => `${i + 1}. ${e}`),
      "",
      "FUNCTIONAL IMPACT:",
      result.functionalImpact,
      "",
      "NDIS ALIGNMENT:",
      ...result.ndisAlignment.map((a, i) => `${i + 1}. ${a}`),
      "",
      "RECOMMENDATIONS:",
      ...result.recommendations.map((r, i) => `${i + 1}. ${r}`),
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
    doc.text("Report Synthesis", marginLeft, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-AU")}`, marginLeft, y);
    y += 10;

    const addSection = (title: string, content: string | string[]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(title, marginLeft, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      if (typeof content === "string") {
        const lines = doc.splitTextToSize(content, pageWidth);
        doc.text(lines, marginLeft, y);
        y += lines.length * 5 + 5;
      } else {
        content.forEach((item) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 5);
          doc.text(lines, marginLeft + 3, y);
          y += lines.length * 5 + 2;
        });
        y += 3;
      }
    };

    addSection("Synthesized Report", result.synthesizedText);
    addSection("Key Findings", result.keyFindings);
    addSection("Evidence Summary", result.evidenceSummary);
    addSection("Functional Impact", result.functionalImpact);
    addSection("NDIS Alignment", result.ndisAlignment);
    addSection("Recommendations", result.recommendations);

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Generated by Praxis AI - SC Toolkit", marginLeft, 290);
      doc.text(`Page ${i} of ${totalPages}`, 170, 290);
    }

    doc.save(`report-synthesis-${Date.now()}.pdf`);
  }, [result]);

  const resetForm = useCallback(() => {
    setReportText("");
    setCoordinatorNotes("");
    setFileName(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <Header title="Report Synthesizer" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link
            href="/sc-toolkit"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Report Synthesizer
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Analyze allied health reports and synthesize NDIS-aligned evidence
                </p>
              </div>
            </div>

            {/* Input Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Report Content
                </label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Paste your allied health report content here for synthesis..."
                  rows={10}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    {isParsing
                      ? "Extracting text from PDF..."
                      : `${reportText.length} characters ${reportText.length < 50 ? "(minimum 50)" : ""}`}
                  </span>
                  <label
                    className={`flex items-center gap-2 text-sm ${
                      isParsing
                        ? "text-slate-400 cursor-wait"
                        : "text-blue-600 hover:text-blue-700 cursor-pointer"
                    }`}
                  >
                    {isParsing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isParsing ? "Parsing PDF..." : "Upload File"}</span>
                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileUpload}
                      disabled={isParsing}
                      className="hidden"
                    />
                  </label>
                </div>
                {fileName && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    {isParsing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>{fileName}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Coordinator Notes / Instructions (Optional)
                </label>
                <textarea
                  value={coordinatorNotes}
                  onChange={(e) => setCoordinatorNotes(e.target.value)}
                  placeholder="Any specific focus areas, participant context, or instructions for the synthesis..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                />
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
                  onClick={handleSynthesize}
                  disabled={reportText.length < 50}
                  label="Synthesize Report"
                  variant="indigo"
                  type="audit"
                />
                {result && (
                  <button
                    onClick={resetForm}
                    className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-blue-800 dark:text-blue-300">Synthesis Complete</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={resetForm}
                      className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Synthesized Text */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Synthesized Report
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap">
                      {result.synthesizedText}
                    </p>
                  </div>

                  {/* Key Findings */}
                  {result.keyFindings.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Key Findings ({result.keyFindings.length})
                      </h4>
                      <ul className="space-y-1">
                        {result.keyFindings.map((f, i) => (
                          <li key={i} className="text-sm text-blue-600 dark:text-blue-400 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-1 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Evidence Summary */}
                  {result.evidenceSummary.length > 0 && (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                        Evidence Summary ({result.evidenceSummary.length})
                      </h4>
                      <ul className="space-y-1">
                        {result.evidenceSummary.map((e, i) => (
                          <li key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-1 shrink-0" />
                            {e}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Functional Impact */}
                  {result.functionalImpact && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Functional Impact
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        {result.functionalImpact}
                      </p>
                    </div>
                  )}

                  {/* NDIS Alignment */}
                  {result.ndisAlignment.length > 0 && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                        NDIS Alignment ({result.ndisAlignment.length})
                      </h4>
                      <ul className="space-y-1">
                        {result.ndisAlignment.map((a, i) => (
                          <li key={i} className="text-sm text-indigo-600 dark:text-indigo-400 flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {result.recommendations.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                        Recommendations ({result.recommendations.length})
                      </h4>
                      <ul className="space-y-1">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                            <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
              <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Report Synthesizer</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                Upload or paste allied health reports to extract key evidence and align findings with NDIS requirements.
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-500 space-y-1">
                <li>• Extracts key clinical findings</li>
                <li>• Maps evidence to NDIS criteria</li>
                <li>• Identifies functional impact</li>
                <li>• Generates recommendations</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Tips</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Include complete reports for best results
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Add coordinator notes for focused synthesis
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  PDF and TXT files are supported
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Export to PDF for plan review packs
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
