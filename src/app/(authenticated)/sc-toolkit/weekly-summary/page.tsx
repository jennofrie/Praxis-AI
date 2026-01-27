"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { AIProcessingButton } from "@/components/toolkit/AIProcessingButton";
import {
  BarChart3,
  ArrowLeft,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
  Lightbulb,
  X,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  Users,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface ActivityStats {
  totalNotes: number;
  totalHours: number;
  participantsContacted: number;
  meetingsHeld: number;
  reportsCompleted: number;
}

interface WeeklySummaryResult {
  weekRange: string;
  keyAchievements: string[];
  concerns: string[];
  goalProgress: { goal: string; status: string; notes: string }[];
  recommendations: string[];
  activityStats: ActivityStats;
  executiveSummary: string;
  modelUsed: string;
}

function getDefaultDates(): { start: string; end: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return { start: fmt(monday), end: fmt(friday) };
}

export default function WeeklySummary() {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeeklySummaryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError("End date must be after start date.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/sc-weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          additionalNotes: additionalNotes || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Summary generation failed");
      }

      setResult(payload.data as WeeklySummaryResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summary");
    } finally {
      setIsProcessing(false);
    }
  }, [startDate, endDate, additionalNotes]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const text = [
      `WEEKLY SUMMARY: ${result.weekRange}`,
      "",
      "EXECUTIVE SUMMARY:",
      result.executiveSummary,
      "",
      "KEY ACHIEVEMENTS:",
      ...result.keyAchievements.map((a, i) => `${i + 1}. ${a}`),
      "",
      "CONCERNS & CHALLENGES:",
      ...result.concerns.map((c, i) => `${i + 1}. ${c}`),
      "",
      "GOAL PROGRESS:",
      ...result.goalProgress.map((g) => `- ${g.goal}: ${g.status} - ${g.notes}`),
      "",
      "RECOMMENDATIONS:",
      ...result.recommendations.map((r, i) => `${i + 1}. ${r}`),
      "",
      "ACTIVITY STATISTICS:",
      `Total Notes: ${result.activityStats.totalNotes}`,
      `Total Hours: ${result.activityStats.totalHours}`,
      `Participants Contacted: ${result.activityStats.participantsContacted}`,
      `Meetings Held: ${result.activityStats.meetingsHeld}`,
      `Reports Completed: ${result.activityStats.reportsCompleted}`,
    ].join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleExportPDF = useCallback(async () => {
    if (!result) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ml = 20;
    const pw = 170;
    let y = 20;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("Weekly Summary Report", ml, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Period: ${result.weekRange}`, ml, y);
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(ml, y, 190, y);
    y += 8;

    const addSection = (title: string, content: string | string[]) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(title, ml, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      if (typeof content === "string") {
        const lines = doc.splitTextToSize(content, pw);
        doc.text(lines, ml, y);
        y += lines.length * 5 + 5;
      } else {
        content.forEach((item) => {
          if (y > 270) { doc.addPage(); y = 20; }
          const lines = doc.splitTextToSize(`• ${item}`, pw - 5);
          doc.text(lines, ml + 3, y);
          y += lines.length * 5 + 2;
        });
        y += 3;
      }
    };

    addSection("Executive Summary", result.executiveSummary);
    addSection("Key Achievements", result.keyAchievements);
    addSection("Concerns & Challenges", result.concerns);
    addSection("Goal Progress", result.goalProgress.map((g) => `${g.goal}: ${g.status} - ${g.notes}`));
    addSection("Recommendations", result.recommendations);

    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229);
    doc.text("Activity Statistics", ml, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    const stats = [
      `Total Notes: ${result.activityStats.totalNotes}`,
      `Total Hours: ${result.activityStats.totalHours}`,
      `Participants Contacted: ${result.activityStats.participantsContacted}`,
      `Meetings Held: ${result.activityStats.meetingsHeld}`,
      `Reports Completed: ${result.activityStats.reportsCompleted}`,
    ];
    stats.forEach((s) => {
      doc.text(s, ml, y);
      y += 5;
    });

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Generated by Praxis AI - SC Toolkit", ml, 290);
      doc.text(`Page ${i} of ${totalPages}`, 170, 290);
    }

    doc.save(`weekly-summary-${startDate}-to-${endDate}.pdf`);
  }, [result, startDate, endDate]);

  const resetForm = useCallback(() => {
    const d = getDefaultDates();
    setStartDate(d.start);
    setEndDate(d.end);
    setAdditionalNotes("");
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <Header title="Weekly Summary" />

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
                <BarChart3 className="w-6 h-6 text-orange-600" />
                Weekly Summary
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Auto-generate weekly activity summaries with goal tracking and recommendations
              </p>
            </div>

            {/* Input Form */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Add any specific activities, notes, or context for this week's summary..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 text-sm"
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
                  onClick={handleGenerate}
                  disabled={!startDate || !endDate}
                  label="Generate Summary"
                  variant="emerald"
                  type="audit"
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
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600" />
                      <h3 className="font-bold text-orange-800 dark:text-orange-300">
                        Weekly Summary: {result.weekRange}
                      </h3>
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

                  <div className="p-6 space-y-6">
                    {/* Executive Summary */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Executive Summary
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg whitespace-pre-wrap">
                        {result.executiveSummary}
                      </p>
                    </div>

                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <StatCard icon={FileText} label="Total Notes" value={result.activityStats.totalNotes} color="blue" />
                      <StatCard icon={Clock} label="Total Hours" value={result.activityStats.totalHours} color="emerald" />
                      <StatCard icon={Users} label="Participants" value={result.activityStats.participantsContacted} color="purple" />
                      <StatCard icon={Calendar} label="Meetings" value={result.activityStats.meetingsHeld} color="amber" />
                      <StatCard icon={CheckCircle} label="Reports" value={result.activityStats.reportsCompleted} color="teal" />
                    </div>

                    {/* Key Achievements */}
                    {result.keyAchievements.length > 0 && (
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Key Achievements ({result.keyAchievements.length})
                        </h4>
                        <ul className="space-y-1">
                          {result.keyAchievements.map((a, i) => (
                            <li key={i} className="text-sm text-emerald-600 dark:text-emerald-400 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-1 shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Concerns & Challenges */}
                    {result.concerns.length > 0 && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Concerns &amp; Challenges ({result.concerns.length})
                        </h4>
                        <ul className="space-y-1">
                          {result.concerns.map((c, i) => (
                            <li key={i} className="text-sm text-amber-600 dark:text-amber-400 flex items-start gap-2">
                              <AlertTriangle className="w-3 h-3 mt-1 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Goal Progress */}
                    {result.goalProgress.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Goal Progress
                        </h4>
                        <div className="space-y-2">
                          {result.goalProgress.map((g, i) => (
                            <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white">{g.goal}</h5>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  g.status.toLowerCase().includes("on track") || g.status.toLowerCase().includes("achieved")
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    : g.status.toLowerCase().includes("at risk") || g.status.toLowerCase().includes("behind")
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                }`}>
                                  {g.status}
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{g.notes}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4" />
                          Recommendations ({result.recommendations.length})
                        </h4>
                        <ul className="space-y-1">
                          {result.recommendations.map((r, i) => (
                            <li key={i} className="text-sm text-indigo-600 dark:text-indigo-400 flex items-start gap-2">
                              <Lightbulb className="w-3 h-3 mt-1 shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200 dark:border-orange-800 p-4">
              <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-2">Weekly Summary</h3>
              <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                Auto-generate comprehensive weekly summaries with activity tracking and goal progress.
              </p>
              <ul className="text-xs text-orange-600 dark:text-orange-500 space-y-1">
                <li>• Activity auto-detection</li>
                <li>• Goal progress tracking</li>
                <li>• Key achievements highlight</li>
                <li>• Concerns &amp; risk flagging</li>
                <li>• PDF export ready</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Tips</h3>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Defaults to the current work week (Mon-Fri)
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Add notes for more accurate summaries
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Export to PDF for team meetings
                </li>
                <li className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />
                  Review goal progress weekly
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", icon: "text-blue-600" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", icon: "text-emerald-600" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", icon: "text-purple-600" },
    amber: { bg: "bg-amber-50 dark:bg-amber-900/20", icon: "text-amber-600" },
    teal: { bg: "bg-teal-50 dark:bg-teal-900/20", icon: "text-teal-600" },
  };

  const c = colorMap[color] ?? colorMap["blue"];

  return (
    <div className={`${c?.bg} rounded-lg p-3 text-center`}>
      <Icon className={`w-4 h-4 ${c?.icon} mx-auto mb-1`} />
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}
