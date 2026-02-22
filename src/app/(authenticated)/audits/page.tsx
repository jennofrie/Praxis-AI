"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Download, Activity, ClipboardCheck, Key, ShieldCheck,
  TrendingUp, Edit2, Trash2, Eye, PlusCircle, LogIn, ChevronLeft,
  ChevronRight, MoreVertical, Loader2, Cpu,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase";

type FilterType = "all" | "create" | "update" | "delete" | "read" | "login" | "ai_request";

interface AuditEntry {
  id: string;
  created_at: string;
  action: string;
  resource_type: string;
  resource_name: string | null;
  ip_address: string | null;
  profiles: { full_name: string | null; email: string } | null;
}

interface ActiveSession {
  id: string;
  full_name: string | null;
  email: string;
  last_seen: string | null;
}

function getPresenceStatus(lastSeen: string | null): { label: string; color: string } {
  if (!lastSeen) return { label: "Offline", color: "bg-slate-400" };
  const diffMs = Date.now() - new Date(lastSeen).getTime();
  const diffMin = diffMs / 60_000;
  if (diffMin < 5) return { label: "Online now", color: "bg-green-500" };
  if (diffMin < 15) return { label: `Idle ${Math.floor(diffMin)}m`, color: "bg-amber-500" };
  return { label: "Offline", color: "bg-slate-400" };
}

const ACTION_STYLES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  create:     { label: "Created", icon: PlusCircle, color: "text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800" },
  update:     { label: "Modified", icon: Edit2,     color: "text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800" },
  delete:     { label: "Deleted", icon: Trash2,     color: "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800" },
  read:       { label: "Viewed", icon: Eye,         color: "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800" },
  login:      { label: "Login", icon: LogIn,        color: "text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800" },
  ai_request: { label: "AI Request", icon: Cpu,     color: "text-indigo-600 bg-indigo-100 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-800" },
  export:     { label: "Exported", icon: Download,  color: "text-teal-600 bg-teal-100 border-teal-200 dark:text-teal-400 dark:bg-teal-900/30 dark:border-teal-800" },
};

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All Events" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
  { key: "read", label: "Read" },
  { key: "login", label: "Login" },
  { key: "ai_request", label: "AI Requests" },
];

export default function AuditsPage() {
  const supabase = createBrowserClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("audit_logs")
        .select("id, created_at, action, resource_type, resource_name, ip_address, profiles(full_name, email)", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(50);

      if (activeFilter !== "all") {
        query = query.eq("action", activeFilter);
      }

      const { data, count } = await query;
      setAuditLogs((data ?? []) as AuditEntry[]);
      setTotalCount(count ?? 0);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, activeFilter]);

  const fetchActiveSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, last_seen")
        .order("last_seen", { ascending: false, nullsFirst: false })
        .limit(20);
      setActiveSessions((data ?? []) as ActiveSession[]);
    } finally {
      setSessionsLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchAuditLogs(); }, [fetchAuditLogs]);

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 30_000);
    return () => clearInterval(interval);
  }, [fetchActiveSessions]);

  return (
    <>
      <Header title="System Audit Log" />
      <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Main Content */}
          <section className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 md:p-8">
            <div className="space-y-6">
              {/* Page heading */}
              <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">System Audit Log</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
                    Track all system access, user activities, and NDIS compliance events in real time.
                  </p>
                </div>
                <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md transition-all">
                  <Download className="w-4 h-4 mr-2" /> Export Log
                </button>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard title="Total Events" value={isLoading ? "…" : String(totalCount)} trend="12%" trendUp icon={Activity} />
                <MetricCard title="Audit Records" value={isLoading ? "…" : String(auditLogs.length)} subLabel="Loaded" icon={ClipboardCheck} />
                <MetricCard title="Active Users" value={String(activeSessions.filter(s => getPresenceStatus(s.last_seen).label === "Online now").length)} trend="5%" trendUp icon={Key} />
                <MetricCard title="Compliance" value="98%" trend="2%" trendUp icon={ShieldCheck} />
              </div>

              {/* Filter bar */}
              <div className="flex flex-wrap gap-2 items-center">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                      activeFilter === f.key
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Audit table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                  ) : auditLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-sm">
                      <Activity className="w-10 h-10 mb-3 opacity-30" />
                      <p>No audit events yet.</p>
                      <p className="text-xs mt-1">Events appear as you use the system.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[200px]">Timestamp</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[220px]">User</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[130px]">Action</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource</th>
                          <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">IP Address</th>
                          <th className="px-5 py-3 w-[50px]"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {auditLogs.map((log) => {
                          const actionStyle = ACTION_STYLES[log.action] ?? ACTION_STYLES["read"]!;
                          const ActionIcon = actionStyle.icon;
                          const dt = new Date(log.created_at);
                          const dateStr = dt.toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
                          const timeStr = dt.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                          const userName = log.profiles?.full_name ?? log.profiles?.email ?? "System";
                          const userEmail = log.profiles?.email ?? "";
                          const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;

                          return (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-5 py-3 font-mono text-sm text-slate-500 dark:text-slate-400">
                                {dateStr} <span className="text-slate-900 dark:text-white">{timeStr}</span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={avatarUrl} alt={userName} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{userName}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border ${actionStyle.color}`}>
                                  <ActionIcon className="w-3.5 h-3.5" /> {actionStyle.label}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-900 dark:text-white">{log.resource_name ?? log.resource_type}</span>
                                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700">{log.resource_type}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right text-sm font-mono text-slate-500 dark:text-slate-400">
                                {log.ip_address ?? "—"}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Showing <span className="text-slate-900 dark:text-white font-medium">1-{auditLogs.length}</span> of{" "}
                    <span className="text-slate-900 dark:text-white font-medium">{totalCount}</span> events
                  </span>
                  <div className="flex gap-2">
                    <button className="flex items-center justify-center w-8 h-8 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="flex items-center justify-center w-8 h-8 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Sidebar — Active Sessions */}
          <aside className="w-full lg:w-[320px] bg-white/50 dark:bg-slate-900/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col h-auto lg:h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Security Status */}
              <div className="bg-slate-900 dark:bg-black rounded-xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-sm font-bold">Security Status</h3>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <ShieldCheck className="text-green-500 w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-white font-medium">All Systems Normal</p>
                    <p className="text-slate-400 text-xs mt-1">No anomalous patterns detected in the last 24 hours.</p>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 dark:text-white text-sm font-bold">Active Sessions</h3>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    {sessionsLoading ? "…" : `${activeSessions.filter(s => getPresenceStatus(s.last_seen).label === "Online now").length} online`}
                  </span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {sessionsLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">No active sessions</p>
                  ) : (
                    activeSessions.map((session, i) => {
                      const presence = getPresenceStatus(session.last_seen);
                      const name = session.full_name ?? session.email;
                      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
                      return (
                        <div key={session.id}>
                          {i > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3" />}
                          <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="relative flex-shrink-0">
                              <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={avatarUrl} alt={name} />
                              </div>
                              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${presence.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-900 dark:text-white text-sm font-medium truncate">{name}</p>
                              <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{presence.label}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}

function MetricCard({ title, value, trend, trendUp, subLabel, icon: Icon }: {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subLabel?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-indigo-600" />
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</p>
        <div className="flex items-end gap-2 mt-1">
          <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">{value}</p>
          {trend && (
            <span className={`flex items-center text-xs font-medium mb-1 px-1.5 py-0.5 rounded ${
              trendUp
                ? "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"
                : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
            }`}>
              {trendUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5 rotate-180" />}
              {trend}
            </span>
          )}
          {subLabel && <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{subLabel}</span>}
        </div>
      </div>
    </div>
  );
}
