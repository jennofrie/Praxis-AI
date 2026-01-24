"use client";

import { Header } from "@/components/layout/Header";
import { Search, Plus, Filter, SortAsc, FolderOpen, AlertTriangle, DollarSign, BarChart2, TrendingUp, MoreHorizontal, ArrowRight, TrendingDown, Bell, Mail, FileText, Edit, Folder } from "lucide-react";

export default function NDISPlans() {
  return (
    <>
      <Header title="NDIS Plans" />
      
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-8">
          {/* Page Header & Metrics */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">NDIS Plans</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage participant funding and track budget utilization.</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-slate-400 w-5 h-5" />
                  </div>
                  <input className="block w-full md:w-64 pl-10 pr-3 py-2.5 border-none rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm text-sm" placeholder="Search by name or NDIS #" type="text"/>
                </div>
                <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-semibold">
                  <Plus className="w-5 h-5" />
                  Link New Plan
                </button>
              </div>
            </div>
            
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Active Plans" 
                value="42" 
                trend="+2" 
                trendUp 
                icon={FolderOpen} 
                iconColor="text-indigo-600" 
              />
              <MetricCard 
                title="Expiring (30 days)" 
                value="3" 
                subtext="require review" 
                icon={AlertTriangle} 
                iconColor="text-amber-500" 
                valueColor="text-amber-600 dark:text-amber-500"
              />
              <MetricCard 
                title="Total Funding Managed" 
                value="$4.2M" 
                icon={DollarSign} 
                iconColor="text-indigo-600" 
              />
              <MetricCard 
                title="Avg. Utilization" 
                value="68%" 
                trend="On Track" 
                trendUp 
                icon={BarChart2} 
                iconColor="text-blue-500" 
              />
            </div>
          </div>

          {/* Split Layout: Main Grid + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
            {/* Left: Plan Cards Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Active Participants</h3>
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                    <SortAsc className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <PlanCard 
                  name="Sarah Jenkins" 
                  ndis="492819221" 
                  dates="12 Jan 2023 - 12 Jan 2024"
                  status="14 Days Left"
                  statusColor="amber"
                  core={{ used: 12, total: 15, percent: 80 }}
                  capacity={{ used: 8, total: 10, percent: 80 }}
                  capital={{ used: 2, total: 15, percent: 13 }}
                  avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuDX7EZWIFfKRAh76i4Vc-9zoCF-oSMP3TzC6hugBt-Epei-ltPawG4JSD8E48fZAuE4sJSMP86EB_1p2KuPuhznp-LvSP87D2UZewT4yl2-mfwHKdkNDjUn5fsr893pBvCAiqbGGf9WXIyrwcy2XSlfcUJBNeTOpbPnJ7uY9jS7XZSpeQRfS-A76f5-ePVx46dWOAmUB9tvBQ6zb87FdZfU_GMFYea8PhDPvE928hkcJ6UqSr6nar6nHF3rJUH4QhJ0QvGBmCTBwzc"
                />
                <PlanCard 
                  name="Michael Chen" 
                  ndis="829103942" 
                  dates="01 Mar 2023 - 01 Mar 2025"
                  status="Active"
                  statusColor="emerald"
                  core={{ used: 5, total: 20, percent: 25 }}
                  capacity={{ used: 12, total: 30, percent: 40 }}
                  capital={{ used: 0, total: 5, percent: 0 }}
                  avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBfdFClHynw_clm8iV0D8zqrbazAhXJ2EZmGYaIARyPL_CpWkQWYfVtHgq0u6TDL71RUhY0cbzZ3Rgj0DvrWkqwf6D9ll-zziYpvXP5QxR5mFd_nGgKZX8jhDa4jZiBxDDjS2m6QcDYyy9OluF_QvXoUFwODmyUx3nTl1xZT3mOJVAwA0pCRs3tKMeSA9me56z7YD7WTT_sq9--k8bPAhrNrKj-vEb70jNX_xdbTZyFjIqsKtuCd2Xw550UWz9ao1Aw3mb-4WT_Zd4"
                />
                <PlanCard 
                  name="David Rossi" 
                  ndis="112938475" 
                  dates="15 Jun 2023 - 15 Jun 2024"
                  status="Depleted"
                  statusColor="red"
                  core={{ used: 9.9, total: 10, percent: 99, critical: true }}
                  capacity={{ used: 15, total: 25, percent: 60 }}
                  capital={{ used: 5, total: 10, percent: 50 }}
                  avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCNXa9dtS6vtAF5pKaveZD9Yi9SxZaraCsEtztzhva9DRjRTt3HinxHOzAjxS7uoLIVU2odYEd3sF35_IVeFfgwPHTu9vz7S6t6YL440IBYlZTncyC2ZUTx5uXYFKPNzAwNSCzCxbrC_SLmXHDQTZEzwveTKio8xsWf-QA5vlZNLIMefjWl-IkavDJCvwAB2RcEjHn7Xs4drpbGbZ1XYAPln9P4wmf-qHM69CG_4R9GTZ14N0uJxcIu1OWiLB9nGaqxr0jC_zcwNm4"
                />
                <PlanCard 
                  name="Emily Wong" 
                  ndis="382710492" 
                  dates="10 Oct 2023 - 10 Oct 2024"
                  status="Active"
                  statusColor="emerald"
                  core={{ used: 2, total: 18, percent: 11 }}
                  capacity={{ used: 4, total: 12, percent: 33 }}
                  capital={{ used: 1, total: 5, percent: 20 }}
                  avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuAERTPqAZSQchRvJB561Rrq26l6i_li-iZWEukZqCrB8K7Quef-Z6yJrisQDSyiNF99yxyK9osy2k9Ax8wVbuWqfYkOxEx4_j3e4hzxw9_gBoxug92kQq_sEF6AfVviEIRa7-lAzTgMlqZEQ81a8vAkQIA45puFjnXe4xoJsXbCRB6eYmzv7W62-n6d4R1lBWkQhkaEEkpo38_qHJVgznzh-vTK_MPMCAUV-N8UObgPdOeG1i6WXkP-V8HmLLqizmeFqEriZMoU0tw"
                />
              </div>
            </div>

            {/* Right Sidebar (30%) */}
            <aside className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0">
              {/* Plan Alerts */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bell className="text-amber-500 w-5 h-5" />
                  Plan Alerts
                </h3>
                <div className="flex flex-col gap-3">
                  <AlertItem 
                    title="Review Sarah J. Budget" 
                    desc="Plan expires in 14 days. Schedule review." 
                    type="warning" 
                  />
                  <AlertItem 
                    title="David R. Funds Low" 
                    desc="Core budget at 99% utilization." 
                    type="critical" 
                  />
                </div>
              </div>

              {/* Funding Overview Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Funding Overview</h3>
                  <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col items-center justify-center py-4 relative">
                  {/* CSS Donut Chart approximation */}
                  <div className="relative w-40 h-40 rounded-full" style={{ background: "conic-gradient(#4F46E5 0% 55%, #60a5fa 55% 85%, #a5b4fc 85% 100%)" }}>
                    <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center flex-col">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">4.2M</span>
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wide">Total</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <LegendItem label="Core Supports" value="55%" color="bg-indigo-600" />
                  <LegendItem label="Capacity Building" value="30%" color="bg-blue-400" />
                  <LegendItem label="Capital" value="15%" color="bg-indigo-300" />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <QuickActionButton icon={FileText} label="Generate Report" />
                  <QuickActionButton icon={Edit} label="Update Budget" />
                  <QuickActionButton icon={Mail} label="Email Participants" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ title, value, subtext, trend, trendUp, icon: Icon, iconColor, valueColor }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className={`w-16 h-16 ${iconColor}`} />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${valueColor || "text-slate-900 dark:text-white"}`}>{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center mb-1 ${trendUp ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-400"}`}>
            {trendUp && <TrendingUp className="w-3 h-3 mr-0.5" />} {trend}
          </span>
        )}
        {subtext && <span className="text-slate-400 text-xs mb-1">{subtext}</span>}
      </div>
    </div>
  );
}

function PlanCard({ name, ndis, dates, status, statusColor, core, capacity, capital, avatar }: any) {
  const statusStyles: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const statusDots: Record<string, string> = {
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">NDIS #{ndis}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${statusStyles[statusColor]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDots[statusColor]}`}></span>
          {status}
        </span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <span>Plan Dates:</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{dates}</span>
      </div>
      <div className="flex flex-col gap-3">
        <FundingBar label="Core" data={core} color="bg-indigo-600" />
        <FundingBar label="Capacity" data={capacity} color="bg-blue-400" />
        <FundingBar label="Capital" data={capital} color="bg-indigo-300" />
      </div>
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1">
          View Details <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function FundingBar({ label, data, color }: any) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`${data.critical ? "text-red-500 font-semibold" : "text-slate-500"}`}>${data.used}k / ${data.total}k</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${data.critical ? "bg-red-500" : color}`} style={{ width: `${data.percent}%` }}></div>
      </div>
    </div>
  );
}

function AlertItem({ title, desc, type }: any) {
  const styles: Record<string, string> = {
    warning: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 text-amber-600 dark:text-amber-500",
    critical: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-500",
  };

  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <div className="mt-0.5">
        {type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function LegendItem({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: any) {
  return (
    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </button>
  );
}
