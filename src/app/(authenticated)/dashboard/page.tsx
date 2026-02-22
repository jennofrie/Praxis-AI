"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { createBrowserClient } from "@/lib/supabase";
import {
  Users, Sparkles, Clock, CheckCircle, TrendingUp, AlertTriangle,
  MoreHorizontal, Filter, Download, Loader2,
} from "lucide-react";

interface DashboardMetrics {
  activeParticipants: number;
  aiTasksToday: number;
  billableHoursWeek: number;
  pendingApprovals: number;
}

interface ChartData {
  labels: string[];
  sessionCounts: number[];
}

interface RecentReport {
  id: string;
  title: string;
  report_type: string;
  status: string;
  created_at: string;
  participantName: string;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Dashboard() {
  const supabase = createBrowserClient();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeParticipants: 0,
    aiTasksToday: 0,
    billableHoursWeek: 0,
    pendingApprovals: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({ labels: [], sessionCounts: [] });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

    try {
      // Parallel metric queries
      const [participantsRes, aiUsageRes, sessionsRes, approvalsRes] = await Promise.all([
        supabase.from("participants").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("ai_usage").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
        supabase.from("sessions")
          .select("duration_minutes")
          .eq("status", "completed")
          .eq("billable", true)
          .gte("session_date", weekStart),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "review"),
      ]);

      const billableMinutes = (sessionsRes.data ?? []).reduce(
        (sum: number, s: any) => sum + (s.duration_minutes ?? 0),
        0
      );

      setMetrics({
        activeParticipants: participantsRes.count ?? 0,
        aiTasksToday: aiUsageRes.count ?? 0,
        billableHoursWeek: Math.round((billableMinutes / 60) * 10) / 10,
        pendingApprovals: approvalsRes.count ?? 0,
      });

      // Chart data — last 7 days
      const { data: sessionDates } = await supabase
        .from("sessions")
        .select("session_date")
        .eq("status", "completed")
        .gte("session_date", sevenDaysAgo.toISOString())
        .lte("session_date", now.toISOString());

      // Build labels for last 7 days
      const dayLabels: string[] = [];
      const dayCounts: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 86_400_000);
        dayLabels.push(day.toLocaleDateString("en-AU", { weekday: "short" }));
        const dayStr = day.toISOString().substring(0, 10);
        const count = (sessionDates ?? []).filter((s: any) =>
          s.session_date.startsWith(dayStr)
        ).length;
        dayCounts.push(count);
      }
      setChartData({ labels: dayLabels, sessionCounts: dayCounts });
      setChartLoading(false);

      // Recent reports
      const { data: reports } = await supabase
        .from("reports")
        .select("id, title, report_type, status, created_at, participants(first_name, last_name)")
        .order("created_at", { ascending: false })
        .limit(5);

      if (reports) {
        const formatted: RecentReport[] = reports.map((r: any) => ({
          id: r.id,
          title: r.title,
          report_type: r.report_type,
          status: r.status,
          created_at: r.created_at,
          participantName: r.participants
            ? `${r.participants.first_name} ${r.participants.last_name}`
            : "Unknown",
        }));
        setRecentReports(formatted);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Participants"
            value={isLoading ? "—" : String(metrics.activeParticipants)}
            trend="vs last month"
            icon={Users}
            iconColor="text-orange-600"
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            isLoading={isLoading}
          />
          <StatCard
            title="AI Tasks Today"
            value={isLoading ? "—" : String(metrics.aiTasksToday)}
            trend="requests processed"
            icon={Sparkles}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            isLoading={isLoading}
          />
          <StatCard
            title="Billable Hours"
            value={isLoading ? "—" : `${metrics.billableHoursWeek}h`}
            trend="this week"
            icon={Clock}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            isLoading={isLoading}
          />
          <StatCard
            title="Pending Approvals"
            value={isLoading ? "—" : String(metrics.pendingApprovals)}
            trend={metrics.pendingApprovals > 0 ? "needs review" : "all clear"}
            icon={CheckCircle}
            iconColor="text-purple-600"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            isLoading={isLoading}
            alert={metrics.pendingApprovals > 0}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Session Activity</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">
                    {chartLoading ? "…" : chartData.sessionCounts.reduce((a, b) => a + b, 0)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">sessions this week</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md">Last 7 days</span>
            </div>
            <div className="h-80 w-full rounded-lg">
              <ActivityChart
                labels={chartData.labels}
                sessionCounts={chartData.sessionCounts}
                isLoading={chartLoading}
              />
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Generation Status</h3>
              <button className="text-slate-400 hover:text-indigo-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    {isLoading ? "—" : metrics.aiTasksToday}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">tasks today</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (metrics.aiTasksToday / 20) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-4 mt-2">
                <StatusItem label="Chat requests" value="AI Chat" color="bg-indigo-500" />
                <StatusItem label="Reports generated" value="Reports" color="bg-purple-500" />
                <StatusItem label="Toolkit tasks" value="Toolkit" color="bg-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Reports</h3>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : recentReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
                <Filter className="w-8 h-8 mb-2 opacity-30" />
                No reports yet
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 font-semibold">Report Type</th>
                    <th className="px-6 py-4 font-semibold">Participant</th>
                    <th className="px-6 py-4 font-semibold">Date Generated</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {recentReports.map((r) => (
                    <ReportRow key={r.id} report={r} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, trend, icon: Icon, iconColor, iconBg, isLoading, alert }: {
  title: string;
  value: string;
  trend: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
  alert?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
        {alert && <AlertTriangle className="w-4 h-4 text-amber-500" />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        {isLoading ? (
          <div className="h-9 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
        )}
        <div className="flex items-center gap-1 mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <TrendingUp className="w-4 h-4" />
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  final: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

function ReportRow({ report }: { report: RecentReport }) {
  const statusLabel = report.status.charAt(0).toUpperCase() + report.status.slice(1);
  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-medium text-slate-900 dark:text-white">{report.report_type}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
            {report.participantName.charAt(0)}
          </div>
          {report.participantName}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDateTime(report.created_at)}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[report.status] ?? STATUS_STYLES.draft}`}>
          {statusLabel}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}
