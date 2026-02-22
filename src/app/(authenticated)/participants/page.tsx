"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { CheckCircle, Clock, BarChart2, User, Loader2 } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";
import { ParticipantPreviewModal, type ParticipantModalData } from "@/components/participants/ParticipantPreviewModal";
import { logAudit } from "@/lib/auditClient";

const PARTICIPANT_PHOTOS: Record<string, string> = {
  "Lena Watkins":  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face&auto=format",
  "Marcus Nguyen": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&auto=format",
  "Amara Osei":    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&crop=face&auto=format",
  "Jordan Price":  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&h=80&fit=crop&crop=face&auto=format",
  "Priya Sharma":  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face&auto=format",
};

interface ParticipantRow {
  id: string;
  ndis_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  primary_diagnosis: string | null;
  status: string;
  planStatus: string;
  nextSession: string | null;
  lastActivity: string | null;
}

interface Stats {
  total: number;
  activePlans: number;
  upcomingReviews: number;
  avgSessions: number;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function Participants() {
  const supabase = createBrowserClient();
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, activePlans: 0, upcomingReviews: 0, avgSessions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModal, setSelectedModal] = useState<ParticipantModalData | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Participants with their latest plan and session data
      const { data: participantsData } = await supabase
        .from("participants")
        .select(`
          id, ndis_number, first_name, last_name, date_of_birth, primary_diagnosis, status,
          ndis_plans(status, end_date),
          sessions(session_date, session_type, status)
        `)
        .order("first_name");

      // Stats queries in parallel
      const [totalRes, activePlansRes, upcomingRes, sessionsRes] = await Promise.all([
        supabase.from("participants").select("*", { count: "exact", head: true }),
        supabase.from("ndis_plans").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("ndis_plans").select("*", { count: "exact", head: true })
          .gte("end_date", new Date().toISOString())
          .lte("end_date", new Date(Date.now() + 30 * 86_400_000).toISOString()),
        supabase.from("sessions").select("*", { count: "exact", head: true })
          .eq("status", "completed")
          .gte("session_date", new Date(Date.now() - 30 * 86_400_000).toISOString()),
      ]);

      const total = totalRes.count ?? 0;
      const activePlans = activePlansRes.count ?? 0;
      const upcomingReviews = upcomingRes.count ?? 0;
      const sessionsLast30 = sessionsRes.count ?? 0;
      const avgSessions = total > 0 ? Math.round((sessionsLast30 / total) * 10) / 10 : 0;

      setStats({ total, activePlans, upcomingReviews, avgSessions });

      if (participantsData) {
        const rows: ParticipantRow[] = participantsData.map((p: any) => {
          const plans: any[] = Array.isArray(p.ndis_plans) ? p.ndis_plans : (p.ndis_plans ? [p.ndis_plans] : []);
          const sessions: any[] = Array.isArray(p.sessions) ? p.sessions : (p.sessions ? [p.sessions] : []);

          const activePlan = plans.find((pl: any) => pl.status === "active");
          const planStatus = activePlan ? "active" : plans.length > 0 ? plans[0].status : "expired";

          const nextSession = sessions
            .filter((s: any) => s.status === "scheduled" && new Date(s.session_date) > new Date())
            .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0]?.session_date ?? null;

          const lastActivity = sessions
            .filter((s: any) => s.status === "completed")
            .sort((a: any, b: any) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]?.session_date ?? null;

          return {
            id: p.id,
            ndis_number: p.ndis_number,
            first_name: p.first_name,
            last_name: p.last_name,
            date_of_birth: p.date_of_birth,
            primary_diagnosis: p.primary_diagnosis,
            status: p.status,
            planStatus,
            nextSession,
            lastActivity,
          };
        });
        setParticipants(rows);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRowClick = (p: ParticipantRow) => {
    const fullName = `${p.first_name} ${p.last_name}`;
    logAudit("read", "participant", p.id, fullName);
    setSelectedModal({
      id: p.id,
      ndis_number: p.ndis_number,
      first_name: p.first_name,
      last_name: p.last_name,
      primary_diagnosis: p.primary_diagnosis,
      planStatus: p.planStatus,
      nextSession: p.nextSession,
      lastActivity: p.lastActivity,
    });
  };

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    "under-review": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    expired: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    inactive: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <>
      <Header title="Participants Management" />

      {/* Metrics Cards */}
      <div className="p-8 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Participants"
            value={isLoading ? "—" : String(stats.total)}
            trend={isLoading ? "" : `${stats.total} registered`}
            icon={User}
            color="indigo"
          />
          <MetricCard
            title="Active NDIS Plans"
            value={isLoading ? "—" : String(stats.activePlans)}
            trend={isLoading ? "" : "plan-managed"}
            icon={CheckCircle}
            color="emerald"
          />
          <MetricCard
            title="Upcoming Reviews"
            value={isLoading ? "—" : String(stats.upcomingReviews)}
            trend={isLoading ? "" : "next 30 days"}
            trendWarning={stats.upcomingReviews > 0}
            icon={Clock}
            color="amber"
          />
          <MetricCard
            title="Avg Sessions/Month"
            value={isLoading ? "—" : String(stats.avgSessions)}
            trend={isLoading ? "" : "per participant"}
            icon={BarChart2}
            color="blue"
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-8 flex gap-6">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
            {/* Tab header */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
              <nav className="flex gap-6">
                <button className="border-b-2 border-indigo-600 py-4 px-1 text-sm font-semibold text-indigo-600">
                  All ({isLoading ? "…" : stats.total})
                </button>
                <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Active
                </button>
                <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Inactive
                </button>
              </nav>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500 dark:text-slate-400">
                  <User className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No participants found</p>
                  <p className="text-xs mt-1">Run the seed.sql or add participants manually</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[240px]">Participant</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NDIS Number</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Diagnosis</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Session</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    {participants.map((p) => {
                      const fullName = `${p.first_name} ${p.last_name}`;
                      const photo = PARTICIPANT_PHOTOS[fullName];
                      const initials = `${p.first_name[0]}${p.last_name[0]}`;
                      const planLabel = p.planStatus.replace("-", " ");

                      return (
                        <tr
                          key={p.id}
                          className="cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
                          onClick={() => handleRowClick(p)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-slate-700">
                                {photo ? (
                                  <Image
                                    src={photo}
                                    alt={fullName}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                                    {initials}
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-white">{fullName}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{p.status}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">
                            {p.ndis_number ?? "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {p.primary_diagnosis ?? "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.planStatus] ?? statusStyles.inactive}`}>
                              {planLabel.charAt(0).toUpperCase() + planLabel.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            {p.nextSession ? formatDate(p.nextSession) : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                            {timeAgo(p.lastActivity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            <div className="bg-white dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-semibold text-slate-900 dark:text-white">1-{participants.length}</span> of{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{stats.total}</span> participants
              </span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {selectedModal && (
        <ParticipantPreviewModal
          participant={selectedModal}
          onClose={() => setSelectedModal(null)}
        />
      )}
    </>
  );
}

function MetricCard({ title, value, trend, trendWarning, icon: Icon, color }: {
  title: string;
  value: string;
  trend: string;
  trendWarning?: boolean;
  icon: React.ElementType;
  color: string;
}) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="flex justify-between items-start">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <div className={`p-1.5 rounded-md ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex items-center mb-1 ${
            trendWarning
              ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30"
              : "text-slate-500 bg-slate-100 dark:bg-slate-800"
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
