"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  CalendarDays,
  ArrowLeft,
  AlertTriangle,
  Upload,
  Users,
  Clock,
  BarChart3,
  X,
  FileText,
  CheckCircle,
  Info,
} from "lucide-react";
import Link from "next/link";

interface RosterRow {
  workerName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  participant: string;
  role: string;
}

interface WorkerSummary {
  name: string;
  totalShifts: number;
  totalHours: number;
  participants: string[];
  weeklyHours: Record<string, number>;
  overtimeWeeks: string[];
}

interface CoverageGap {
  date: string;
  period: string;
  participant: string;
}

interface AnalysisResult {
  totalWorkers: number;
  totalShifts: number;
  totalHours: number;
  avgHoursPerWorker: number;
  workers: WorkerSummary[];
  coverageGaps: CoverageGap[];
  overtimeRisks: { worker: string; week: string; hours: number }[];
}

export default function RosterAnalyzer() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parseCSV = useCallback((text: string): RosterRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headerLine = lines[0];
    if (!headerLine) return [];
    const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

    const nameIdx = headers.findIndex((h) => h.includes("worker") || h.includes("name") || h.includes("staff"));
    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const startIdx = headers.findIndex((h) => h.includes("start"));
    const endIdx = headers.findIndex((h) => h.includes("end"));
    const hoursIdx = headers.findIndex((h) => h.includes("hour") || h.includes("duration"));
    const participantIdx = headers.findIndex((h) => h.includes("participant") || h.includes("client"));
    const roleIdx = headers.findIndex((h) => h.includes("role") || h.includes("position") || h.includes("type"));

    const rows: RosterRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.trim()) continue;

      const cols = line.split(",").map((c) => c.trim().replace(/['"]/g, ""));

      const hoursStr = hoursIdx >= 0 ? cols[hoursIdx] : undefined;
      let hours = 0;
      if (hoursStr) {
        hours = parseFloat(hoursStr) || 0;
      }

      rows.push({
        workerName: (nameIdx >= 0 ? cols[nameIdx] : `Worker ${i}`) || `Worker ${i}`,
        date: (dateIdx >= 0 ? cols[dateIdx] : "") || "",
        startTime: (startIdx >= 0 ? cols[startIdx] : "") || "",
        endTime: (endIdx >= 0 ? cols[endIdx] : "") || "",
        hours,
        participant: (participantIdx >= 0 ? cols[participantIdx] : "") || "",
        role: (roleIdx >= 0 ? cols[roleIdx] : "") || "",
      });
    }

    return rows;
  }, []);

  const getWeekKey = (dateStr: string): string => {
    try {
      const parts = dateStr.split(/[-/]/);
      if (parts.length < 3) return "Unknown Week";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Unknown Week";
      const startOfWeek = new Date(date);
      startOfWeek.setDate(date.getDate() - date.getDay());
      return `Week of ${startOfWeek.toLocaleDateString("en-AU", { day: "2-digit", month: "short" })}`;
    } catch {
      return "Unknown Week";
    }
  };

  const analyzeRoster = useCallback(
    (rows: RosterRow[]): AnalysisResult => {
      const workerMap = new Map<string, WorkerSummary>();

      for (const row of rows) {
        const existing = workerMap.get(row.workerName);
        const weekKey = getWeekKey(row.date);

        if (existing) {
          existing.totalShifts++;
          existing.totalHours += row.hours;
          if (row.participant && !existing.participants.includes(row.participant)) {
            existing.participants.push(row.participant);
          }
          existing.weeklyHours[weekKey] = (existing.weeklyHours[weekKey] || 0) + row.hours;
        } else {
          workerMap.set(row.workerName, {
            name: row.workerName,
            totalShifts: 1,
            totalHours: row.hours,
            participants: row.participant ? [row.participant] : [],
            weeklyHours: { [weekKey]: row.hours },
            overtimeWeeks: [],
          });
        }
      }

      const workers = Array.from(workerMap.values());
      const overtimeRisks: { worker: string; week: string; hours: number }[] = [];

      for (const worker of workers) {
        for (const [week, hours] of Object.entries(worker.weeklyHours)) {
          if (hours > 38) {
            worker.overtimeWeeks.push(week);
            overtimeRisks.push({ worker: worker.name, week, hours });
          }
        }
      }

      // Detect coverage gaps (simplified: find dates with no shifts)
      const dateSet = new Set(rows.map((r) => r.date).filter(Boolean));
      const sortedDates = Array.from(dateSet).sort();
      const coverageGaps: CoverageGap[] = [];

      if (sortedDates.length > 1) {
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const currentStr = sortedDates[i];
          const nextStr = sortedDates[i + 1];
          if (!currentStr || !nextStr) continue;
          try {
            const current = new Date(currentStr);
            const next = new Date(nextStr);
            const diffDays = Math.round((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > 1) {
              for (let d = 1; d < diffDays; d++) {
                const gapDate = new Date(current.getTime() + d * 1000 * 60 * 60 * 24);
                coverageGaps.push({
                  date: gapDate.toLocaleDateString("en-AU"),
                  period: "Full Day",
                  participant: "All",
                });
              }
            }
          } catch {
            // skip invalid dates
          }
        }
      }

      const totalHours = workers.reduce((sum, w) => sum + w.totalHours, 0);

      return {
        totalWorkers: workers.length,
        totalShifts: rows.length,
        totalHours,
        avgHoursPerWorker: workers.length > 0 ? totalHours / workers.length : 0,
        workers: workers.sort((a, b) => b.totalHours - a.totalHours),
        coverageGaps,
        overtimeRisks,
      };
    },
    [getWeekKey]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);

      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a CSV file.");
        return;
      }

      try {
        const text = await file.text();
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setError("No valid data rows found in the CSV file. Ensure headers include Worker Name, Date, Hours, etc.");
          return;
        }
        const analysis = analyzeRoster(rows);
        setResult(analysis);
      } catch {
        setError("Failed to parse CSV file. Please check the format.");
      }
    },
    [parseCSV, analyzeRoster]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const resetForm = useCallback(() => {
    setFileName(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <>
      <Header title="Roster Analyzer" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link href="/sc-toolkit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-amber-600" />
              Roster Analyzer
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Upload a CSV roster to detect coverage gaps, overtime risks, and worker summaries.
            </p>
          </div>

          {/* Upload Area */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed p-12 text-center transition-all ${
                isDragging
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-amber-300"
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-amber-500" : "text-slate-400"}`} />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {isDragging ? "Drop CSV here" : "Upload Roster CSV"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Drag and drop your CSV file, or click to browse
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                Choose File
                <input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
              </label>
              <p className="text-xs text-slate-400 mt-4">
                Expected headers: Worker Name, Date, Start Time, End Time, Hours, Participant, Role
              </p>
              {fileName && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <FileText className="w-4 h-4" />
                  {fileName}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-medium text-slate-500">Total Workers</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.totalWorkers}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-medium text-slate-500">Total Shifts</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.totalShifts}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-slate-500">Total Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.totalHours.toFixed(1)}</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-slate-500">Avg Hours/Worker</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.avgHoursPerWorker.toFixed(1)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coverage Gaps */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Coverage Gaps ({result.coverageGaps.length})
                  </h3>
                  {result.coverageGaps.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-300">No coverage gaps detected</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.coverageGaps.map((gap, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                          <span className="font-medium text-slate-900 dark:text-white">{gap.date}</span>
                          <span className="text-amber-600 dark:text-amber-400">{gap.period}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Overtime Risks */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Overtime Risks ({result.overtimeRisks.length})
                  </h3>
                  {result.overtimeRisks.length === 0 ? (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm text-emerald-700 dark:text-emerald-300">No overtime risks detected (&gt;38hrs/week)</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {result.overtimeRisks.map((risk, i) => (
                        <div key={i} className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900 dark:text-white">{risk.worker}</span>
                            <span className="text-red-600 dark:text-red-400 font-bold">{risk.hours.toFixed(1)}h</span>
                          </div>
                          <span className="text-xs text-slate-500">{risk.week}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Summary Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-900 dark:text-white">Worker Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Worker</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Shifts</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Hours</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Participants</th>
                        <th className="text-center px-4 py-3 font-medium text-slate-600 dark:text-slate-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {result.workers.map((worker) => (
                        <tr key={worker.name} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{worker.name}</td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{worker.totalShifts}</td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{worker.totalHours.toFixed(1)}</td>
                          <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{worker.participants.length}</td>
                          <td className="px-4 py-3 text-center">
                            {worker.overtimeWeeks.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> OT Risk
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                                <CheckCircle className="w-3 h-3" /> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Info className="w-4 h-4 shrink-0" />
                  All analysis is performed locally in your browser. No data is sent to any server.
                </div>
                <button onClick={resetForm} className="flex items-center gap-1 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                  Clear Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
