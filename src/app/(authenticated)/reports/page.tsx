"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  Calendar,
  FileDown,
  Smartphone,
  Home,
  RefreshCcw,
  AlertTriangle,
  Loader2,
  FileSearch,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  AuditDocumentType,
  AuditStatus,
  CoCEligibilityVerdict,
  getDocumentTypeLabel,
} from "@/types/senior-planner";

// Combined report type for display
interface ReportItem {
  id: string;
  type: "audit" | "coc";
  documentType: string;
  documentName: string;
  participantName: string;
  participantInitials: string;
  createdAt: Date;
  confidenceScore: number;
  status: string;
  statusColor: "green" | "yellow" | "gray" | "red";
}

// Helper to extract participant name from document name or description
function extractParticipantName(input: string): string {
  // Try to extract name patterns like "FCA_JohnSmith" or "Report for John Smith"
  const patterns = [
    /for\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
    /(?:FCA|Report|Assessment|Review)[-_]([A-Z][a-z]+[-_]?[A-Z][a-z]+)/i,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:'s|'s)?/,
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match && match[1]) {
      return match[1].replace(/[-_]/g, " ");
    }
  }

  // Default: use first 2 words if they look like a name
  const words = input.split(/[\s_-]+/).filter(w => w.length > 1);
  if (words.length >= 2) {
    const firstName = words[0];
    const lastName = words[1];
    if (firstName && lastName && /^[A-Z]/.test(firstName) && /^[A-Z]/.test(lastName)) {
      return `${firstName} ${lastName}`;
    }
  }

  return "Unknown Participant";
}

// Helper to generate initials from name
function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(p => p.length > 0);
  if (parts.length >= 2) {
    const first = parts[0] ?? "";
    const last = parts[parts.length - 1] ?? "";
    const a = first[0] ?? "";
    const b = last[0] ?? "";
    if (!a || !b) return "N.A.";
    return `${a}.${b}.`.toUpperCase();
  }
  if (parts.length === 1 && (parts[0] ?? "").length >= 2) {
    const only = parts[0] ?? "";
    const a = only[0] ?? "";
    const b = only[1] ?? "";
    if (!a || !b) return "N.A.";
    return `${a}.${b}.`.toUpperCase();
  }
  return "N.A.";
}

// Helper to get status display info
function getStatusInfo(type: "audit" | "coc", status: AuditStatus | CoCEligibilityVerdict): { label: string; color: "green" | "yellow" | "gray" | "red" } {
  if (type === "audit") {
    switch (status) {
      case "excellent":
      case "good":
        return { label: "Final", color: "green" };
      case "needs_improvement":
        return { label: "Review", color: "yellow" };
      case "critical":
        return { label: "Critical", color: "red" };
      case "security_blocked":
        return { label: "Blocked", color: "gray" };
      default:
        return { label: "Final", color: "green" };
    }
  } else {
    // CoC assessments
    switch (status) {
      case "likely_eligible":
      case "possibly_eligible":
        return { label: "Final", color: "green" };
      case "not_eligible":
        return { label: "Final", color: "yellow" };
      case "security_blocked":
        return { label: "Blocked", color: "gray" };
      default:
        return { label: "Final", color: "green" };
    }
  }
}

// Helper to get document type icon info
function getDocumentTypeIcon(type: string): { icon: typeof FileText; color: string } {
  switch (type) {
    case "functional_capacity_assessment":
      return { icon: FileSearch, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" };
    case "progress_report":
      return { icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" };
    case "home_modification_report":
      return { icon: Home, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" };
    case "assistive_technology_assessment":
      return { icon: Smartphone, color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20" };
    case "sil_assessment":
      return { icon: Home, color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" };
    case "therapy_report":
      return { icon: FileText, color: "text-pink-600 bg-pink-50 dark:bg-pink-900/20" };
    case "coc_assessment":
      return { icon: RefreshCcw, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" };
    default:
      return { icon: FileText, color: "text-slate-600 bg-slate-50 dark:bg-slate-900/20" };
  }
}

// Generate initials color based on name hash
function getInitialsColor(name: string): string {
  const colors = [
    "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] ?? colors[0] ?? "bg-slate-100 text-slate-600";
}

export default function Reports() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "audit" | "coc">("all");
  const [metrics, setMetrics] = useState({
    totalReports: 0,
    pendingReview: 0,
    generatedThisWeek: 0,
    avgConfidence: 0,
  });

  const supabase = createClient();

  // Load reports from database
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch audits
      const { data: audits, error: auditError } = await supabase
        .from("report_audits")
        .select("id, document_type, document_name, overall_score, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (auditError) throw auditError;

      // Fetch CoC assessments
      const { data: cocAssessments, error: cocError } = await supabase
        .from("coc_assessments")
        .select("id, description, confidence_score, eligibility_verdict, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (cocError) throw cocError;

      // Transform audits to report items
      const auditItems: ReportItem[] = (audits || []).map((audit) => {
        const participantName = extractParticipantName(audit.document_name || "Unknown");
        const statusInfo = getStatusInfo("audit", audit.status as AuditStatus);
        return {
          id: audit.id,
          type: "audit" as const,
          documentType: audit.document_type,
          documentName: audit.document_name || "Unnamed Document",
          participantName,
          participantInitials: getInitials(participantName),
          createdAt: new Date(audit.created_at),
          confidenceScore: audit.overall_score,
          status: statusInfo.label,
          statusColor: statusInfo.color,
        };
      });

      // Transform CoC assessments to report items
      const cocItems: ReportItem[] = (cocAssessments || []).map((coc) => {
        const participantName = extractParticipantName(coc.description || "Unknown");
        const statusInfo = getStatusInfo("coc", coc.eligibility_verdict as CoCEligibilityVerdict);
        return {
          id: coc.id,
          type: "coc" as const,
          documentType: "coc_assessment",
          documentName: coc.description?.slice(0, 50) + (coc.description?.length > 50 ? "..." : "") || "CoC Assessment",
          participantName,
          participantInitials: getInitials(participantName),
          createdAt: new Date(coc.created_at),
          confidenceScore: coc.confidence_score,
          status: statusInfo.label,
          statusColor: statusInfo.color,
        };
      });

      // Combine and sort by date
      const allReports = [...auditItems, ...cocItems].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      setReports(allReports);

      // Calculate metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const totalReports = allReports.length;
      const pendingReview = allReports.filter(r => r.status === "Review" || r.status === "Critical").length;
      const generatedThisWeek = allReports.filter(r => r.createdAt >= weekAgo).length;
      const avgConfidence = totalReports > 0
        ? Math.round(allReports.reduce((sum, r) => sum + r.confidenceScore, 0) / totalReports)
        : 0;

      setMetrics({
        totalReports,
        pendingReview,
        generatedThisWeek,
        avgConfidence,
      });
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Filter reports based on search and tab
  const filteredReports = reports.filter((report) => {
    const matchesSearch = searchQuery === "" ||
      report.documentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.participantName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "all" ||
      (activeTab === "audit" && report.type === "audit") ||
      (activeTab === "coc" && report.type === "coc");

    return matchesSearch && matchesTab;
  });

  return (
    <>
      <Header title="Reports & Docs" />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Page Header & Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Reports & Docs</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl">
              View and manage AI-generated audit reports and CoC assessments.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-slate-400 w-4 h-4" />
              </span>
              <input
                className="block w-full pl-10 pr-3 py-3 border-none rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-600 shadow-sm text-sm"
                placeholder="Search reports, participants..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Refresh Button */}
            <button
              onClick={loadReports}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <RefreshCcw className="w-5 h-5" />
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Reports"
            value={metrics.totalReports.toString()}
            badge={metrics.totalReports > 0 ? "Active" : undefined}
            badgeColor="green"
            icon={FileText}
          />
          <MetricCard
            title="Pending Review"
            value={metrics.pendingReview.toString()}
            badge={metrics.pendingReview > 0 ? "Action needed" : undefined}
            badgeColor="orange"
            icon={Clock}
          />
          <MetricCard
            title="Generated This Week"
            value={metrics.generatedThisWeek.toString()}
            icon={Calendar}
          />
          <MetricCard
            title="Avg Spectra Confidence"
            value={`${metrics.avgConfidence}%`}
            icon={CheckCircle}
            color="indigo"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="flex gap-8 min-w-max px-2">
            <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")}>
              All Reports
            </TabButton>
            <TabButton active={activeTab === "audit"} onClick={() => setActiveTab("audit")}>
              Section 34 Audits
            </TabButton>
            <TabButton active={activeTab === "coc"} onClick={() => setActiveTab("coc")}>
              CoC Assessments
            </TabButton>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Reports Table */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Reports Found</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                    {searchQuery
                      ? "No reports match your search criteria. Try a different search term."
                      : "Generate reports using the Toolkit tab to see them here."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                          <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Document Type</th>
                          <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</th>
                          <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Generated</th>
                          <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Spectra Confidence</th>
                          <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {filteredReports.map((report) => {
                          const { icon: Icon, color: iconColor } = getDocumentTypeIcon(report.documentType);
                          const typeLabel = report.type === "coc"
                            ? "CoC Assessment"
                            : getDocumentTypeLabel(report.documentType as AuditDocumentType);

                          return (
                            <TableRow
                              key={`${report.type}-${report.id}`}
                              type={typeLabel}
                              refId={`#${report.type === "coc" ? "COC" : "AUD"}-${report.id.slice(0, 4).toUpperCase()}`}
                              participant={report.participantName}
                              initials={report.participantInitials}
                              initialsColor={getInitialsColor(report.participantName)}
                              date={report.createdAt.toLocaleDateString("en-AU", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                              confidence={`${report.confidenceScore}%`}
                              status={report.status}
                              statusColor={report.statusColor}
                              icon={Icon}
                              iconColor={iconColor}
                            />
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Showing <span className="font-medium text-slate-900 dark:text-white">{filteredReports.length}</span> of{" "}
                      <span className="font-medium text-slate-900 dark:text-white">{reports.length}</span> results
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-slate-900 dark:text-white font-bold text-base mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <a
                  href="/toolkit"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <FileSearch className="w-4 h-4" />
                  Run Section 34 Audit
                </a>
                <a
                  href="/toolkit"
                  className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-600 text-slate-900 dark:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCcw className="w-4 h-4" />
                  New CoC Assessment
                </a>
                <button className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-600 text-slate-900 dark:text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  <FileDown className="w-4 h-4" />
                  Bulk Export
                </button>
              </div>
            </div>

            {/* Report Types Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-white font-bold text-base">Report Summary</h3>
              </div>
              <div className="flex flex-col gap-4">
                <SummaryItem
                  title="Section 34 Audits"
                  count={reports.filter(r => r.type === "audit").length}
                  icon={FileSearch}
                  color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                />
                <SummaryItem
                  title="CoC Assessments"
                  count={reports.filter(r => r.type === "coc").length}
                  icon={RefreshCcw}
                  color="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20"
                />
                <SummaryItem
                  title="Final Status"
                  count={reports.filter(r => r.status === "Final").length}
                  icon={CheckCircle}
                  color="text-green-600 bg-green-50 dark:bg-green-900/20"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-slate-900 dark:text-white font-bold text-base mb-4">Recent Activity</h3>
              {reports.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="relative pl-2 space-y-6">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                  {reports.slice(0, 3).map((report, i) => (
                    <ActivityItem
                      key={`${report.type}-${report.id}`}
                      text={report.type === "audit" ? "Audit completed for" : "CoC assessed for"}
                      boldText={report.participantName}
                      time={formatTimeAgo(report.createdAt)}
                      color={i === 0 ? "bg-green-500" : i === 1 ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600"}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function MetricCard({ title, value, badge, badgeColor, icon: Icon }: {
  title: string;
  value: string;
  badge?: string;
  badgeColor?: string;
  icon: typeof FileText;
  color?: string;
}) {
  const badgeColors: Record<string, string> = {
    green: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 group hover:border-indigo-600/30 transition-colors">
      <div className="flex justify-between items-start">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {badge && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium mb-1 ${badgeColors[badgeColor || ""] || "text-slate-500 bg-slate-100"}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 font-medium text-sm transition-colors ${
        active
          ? "border-indigo-600 text-indigo-600 font-bold"
          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function TableRow({
  type,
  refId,
  participant,
  initials,
  initialsColor,
  date,
  confidence,
  status,
  statusColor,
  icon: Icon,
  iconColor,
}: {
  type: string;
  refId: string;
  participant: string;
  initials: string;
  initialsColor: string;
  date: string;
  confidence: string;
  status: string;
  statusColor: "green" | "yellow" | "gray" | "red";
  icon: typeof FileText;
  iconColor: string;
}) {
  const statusColors: Record<string, string> = {
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    gray: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  const confidenceValue = parseInt(confidence);
  const confidenceColor = confidenceValue >= 80
    ? "text-green-600 dark:text-green-400"
    : confidenceValue >= 60
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-red-600 dark:text-red-400";

  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{type}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Ref: {refId}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${initialsColor}`}>
            {initials}
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{participant}</span>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{date}</td>
      <td className="py-4 px-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CheckCircle className={`w-4 h-4 ${confidenceColor}`} />
            <span className={`text-xs font-bold font-mono ${confidenceColor}`}>{confidence}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${statusColors[statusColor]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function SummaryItem({ title, count, icon: Icon, color }: {
  title: string;
  count: number;
  icon: typeof FileText;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded group-hover:bg-opacity-80 transition-colors ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
            {title}
          </p>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">
        {count}
      </span>
    </div>
  );
}

function ActivityItem({ text, boldText, time, color }: {
  text: string;
  boldText: string;
  time: string;
  color: string;
}) {
  return (
    <div className="relative pl-6">
      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${color} box-content -ml-[3px]`}></div>
      <p className="text-sm text-slate-900 dark:text-white">
        {text} <span className="font-medium">{boldText}</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{time}</p>
    </div>
  );
}
