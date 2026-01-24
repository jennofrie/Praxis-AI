"use client";

import { Header } from "@/components/layout/Header";
import { 
  Calendar, 
  Download, 
  Activity, 
  ClipboardCheck, 
  Key, 
  ShieldCheck, 
  TrendingUp, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  PlusCircle, 
  LogIn, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  AlertTriangle,
  Ban
} from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  subLabel?: string;
  icon: React.ElementType;
}

interface TableRowProps {
  date: string;
  time: string;
  user: string;
  role: string;
  avatar: string;
  actionType: "edit" | "delete" | "view" | "create" | "login";
  participant: string;
  participantId?: string;
  ip: string;
  highlight?: boolean;
}

interface SessionItemProps {
  name: string;
  status: string;
  statusColor: "green" | "amber";
  avatar: string;
}

interface ConsentAlertProps {
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  title: string;
  desc: React.ReactNode;
  action: string;
}

export default function AuditsPage() {
  return (
    <>
      <Header title="Consent & Audit Trail" />
      <div className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
        <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
          {/* Main Content Area */}
          <section className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6 md:p-8 scroll-smooth">
            <div className="space-y-6">
              {/* Page Heading & Controls */}
              <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-end gap-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Audit Log</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-normal max-w-xl">
                    Track system access, user activities, and consent compliance for NDIS participants.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Date Picker Mockup */}
                  <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg h-10 px-3 gap-2 cursor-pointer hover:border-indigo-600 dark:hover:border-indigo-500 transition-colors group shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">Oct 01, 2023 - Oct 31, 2023</span>
                  </div>
                  <button className="flex items-center justify-center rounded-lg h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-600/20 transition-all">
                    <Download className="w-4 h-4 mr-2" />
                    <span>Export Log</span>
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard 
                  title="Total Activities" 
                  value="1,248" 
                  trend="12%" 
                  trendUp 
                  icon={Activity} 
                />
                <MetricCard 
                  title="Consent Forms" 
                  value="856" 
                  subLabel="Active" 
                  icon={ClipboardCheck} 
                />
                <MetricCard 
                  title="Access Logs" 
                  value="342" 
                  trend="5%" 
                  trendUp 
                  icon={Key} 
                />
                <MetricCard 
                  title="Compliance Score" 
                  value="98%" 
                  trend="2%" 
                  trendUp 
                  icon={ShieldCheck} 
                />
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap gap-2 items-center pb-2">
                <FilterButton label="All Events" active />
                <FilterButton label="Consent Updates" />
                <FilterButton label="Security Alerts" />
                <FilterButton label="Errors" />
                <div className="ml-auto">
                  <button className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 text-xs font-medium transition-colors">
                    <Filter className="w-4 h-4" /> Filter
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[200px]">Timestamp</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[220px]">User</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[140px]">Action</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Participant</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">IP Address</th>
                        <th className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      <TableRow 
                        date="2023-10-24" time="14:22:01"
                        user="Sarah Jenkins" role="Senior OT" avatar="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random"
                        actionType="edit"
                        participant="John Doe" participantId="NDIS-123"
                        ip="192.168.1.45"
                      />
                      <TableRow 
                        date="2023-10-24" time="14:20:15"
                        user="Admin User" role="System Admin" avatar="https://ui-avatars.com/api/?name=Admin+User&background=random"
                        actionType="delete"
                        participant="Risk Assessment #442"
                        ip="10.0.0.52"
                        highlight
                      />
                      <TableRow 
                        date="2023-10-24" time="13:45:10"
                        user="Jane Smith" role="OT Assistant" avatar="https://ui-avatars.com/api/?name=Jane+Smith&background=random"
                        actionType="view"
                        participant="Alice Cooper" participantId="NDIS-789"
                        ip="192.168.1.12"
                      />
                      <TableRow 
                        date="2023-10-24" time="11:30:22"
                        user="Dr. Mike Ross" role="Clinician" avatar="https://ui-avatars.com/api/?name=Mike+Ross&background=random"
                        actionType="create"
                        participant="Consent Form V2" participantId="System"
                        ip="192.168.1.45"
                      />
                      <TableRow 
                        date="2023-10-24" time="09:15:05"
                        user="Sarah Jenkins" role="Senior OT" avatar="https://ui-avatars.com/api/?name=Sarah+Jenkins&background=random"
                        actionType="view"
                        participant="Audit Log Settings"
                        ip="10.0.0.10"
                      />
                      <TableRow 
                        date="2023-10-24" time="08:55:00"
                        user="James Lee" role="Auditor" avatar="https://ui-avatars.com/api/?name=James+Lee&background=random"
                        actionType="login"
                        participant="System Access"
                        ip="192.168.1.88"
                      />
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Showing <span className="text-slate-900 dark:text-white font-medium">1-6</span> of <span className="text-slate-900 dark:text-white font-medium">1,248</span> events</span>
                  <div className="flex gap-2">
                    <button className="flex items-center justify-center w-8 h-8 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="flex items-center justify-center w-8 h-8 rounded border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="w-full lg:w-[320px] bg-white/50 dark:bg-slate-900/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col h-auto lg:h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Security Alerts Card */}
              <div className="bg-slate-900 dark:bg-black rounded-xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-white text-sm font-bold">Security Status</h3>
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-3 relative z-10">
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
                  <a className="text-indigo-600 dark:text-indigo-400 text-xs hover:underline" href="#">View All</a>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 overflow-hidden">
                  <SessionItem name="Dr. Emily Chen" status="Online now" statusColor="green" avatar="https://ui-avatars.com/api/?name=Emily+Chen&background=random" />
                  <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3"></div>
                  <SessionItem name="Marcus Johnson" status="Idle for 15m" statusColor="amber" avatar="https://ui-avatars.com/api/?name=Marcus+Johnson&background=random" />
                  <div className="h-px bg-slate-100 dark:bg-slate-800 mx-3"></div>
                  <SessionItem name="Support Team" status="Online now" statusColor="green" avatar="https://ui-avatars.com/api/?name=Support+Team&background=random" />
                </div>
              </div>

              {/* Consent Status */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-900 dark:text-white text-sm font-bold">Consent Status</h3>
                  <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Alerts</span>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                  <ConsentAlert 
                    icon={AlertTriangle} 
                    iconColor="text-amber-500" 
                    bg="bg-amber-100 dark:bg-amber-900/20"
                    title="Expiring Soon"
                    desc={<span>Consent for <span className="text-slate-900 dark:text-white font-medium">Liam K.</span> expires in 2 days.</span>}
                    action="Review Form"
                  />
                  <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>
                  <ConsentAlert 
                    icon={Ban} 
                    iconColor="text-red-500" 
                    bg="bg-red-100 dark:bg-red-900/20"
                    title="Revoked"
                    desc={<span>Participant <span className="text-slate-900 dark:text-white font-medium">Sarah M.</span> revoked consent for data sharing.</span>}
                    action="View Audit"
                  />
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </>
  );
}

function MetricCard({ title, value, trend, trendUp, subLabel, icon: Icon }: MetricCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-16 h-16 text-indigo-600 dark:text-white" />
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

function FilterButton({ label, active }: { label: string, active?: boolean }) {
  return (
    <button className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors border ${
      active 
        ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800" 
        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
    }`}>
      {label}
    </button>
  );
}

function TableRow({ date, time, user, role, avatar, actionType, participant, participantId, ip, highlight }: TableRowProps) {
  const actionStyles = {
    edit: { label: "Modified", icon: Edit2, color: "text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-800" },
    delete: { label: "Deleted", icon: Trash2, color: "text-red-600 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-900/30 dark:border-red-800" },
    view: { label: "Viewed", icon: Eye, color: "text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-800" },
    create: { label: "Created", icon: PlusCircle, color: "text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-800" },
    login: { label: "Login", icon: LogIn, color: "text-purple-600 bg-purple-100 border-purple-200 dark:text-purple-400 dark:bg-purple-900/30 dark:border-purple-800" },
  };

  const style = actionStyles[actionType] || actionStyles.view;
  const Icon = style.icon;

  return (
    <tr className={`group transition-colors ${
      highlight 
        ? "hover:bg-red-50 dark:hover:bg-red-900/10 border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/5" 
        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
    }`}>
      <td className="px-5 py-3 font-mono text-sm text-slate-500 dark:text-slate-400">
        {date} <span className="text-slate-900 dark:text-white">{time}</span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img src={avatar} alt={user} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{user}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{role}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium border ${style.color}`}>
          <Icon className="w-3.5 h-3.5" /> {style.label}
        </span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-900 dark:text-white">{participant}</span>
          {participantId && (
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded border border-slate-200 dark:border-slate-700">{participantId}</span>
          )}
        </div>
      </td>
      <td className="px-5 py-3 text-right text-sm font-mono text-slate-500 dark:text-slate-400">{ip}</td>
      <td className="px-5 py-3 text-right">
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function SessionItem({ name, status, statusColor, avatar }: SessionItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors group">
      <div className="relative">
        <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={name} />
        </div>
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${
          statusColor === "green" ? "bg-green-500" : "bg-amber-500"
        }`}></span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 dark:text-white text-sm font-medium truncate">{name}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs truncate">{status}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
    </div>
  );
}

function ConsentAlert({ icon: Icon, iconColor, bg, title, desc, action }: ConsentAlertProps) {
  return (
    <div className="flex gap-3 items-start">
      <div className={`mt-0.5 p-1.5 rounded-md ${bg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div>
        <p className="text-slate-900 dark:text-white text-sm font-medium">{title}</p>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{desc}</p>
        <button className="text-indigo-600 dark:text-indigo-400 text-xs font-medium mt-2 hover:underline">{action}</button>
      </div>
    </div>
  );
}
