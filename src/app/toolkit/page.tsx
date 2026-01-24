"use client";

import { Header } from "@/components/layout/Header";
import { Search, Plus, Filter, Download, Briefcase, FileText, Settings, Users, ArrowUp, BarChart2, CheckCircle, Smartphone, PenTool, LayoutGrid, History } from "lucide-react";

export default function Toolkit() {
  return (
    <>
      <Header title="Clinical Tools" />
      
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">Clinical Tools</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
              Access AI-powered utilities to streamline your NDIS documentation and enhance client outcomes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Filter className="w-4 h-4" />
              Recent Activity
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all">
              <Plus className="w-4 h-4" />
              Request Tool
            </button>
          </div>
        </header>

        {/* Metrics Overview */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Tools Active" 
            value="12" 
            subtext="All systems operational" 
            icon={LayoutGrid} 
            trendIcon={ArrowUp}
            trendColor="text-green-600"
          />
          <MetricCard 
            title="AI Generations Today" 
            value="143" 
            subtext="+12% vs yesterday" 
            icon={FileText} 
            trendIcon={ArrowUp}
            trendColor="text-green-600"
            color="text-purple-500"
          />
          <MetricCard 
            title="Avg Processing Time" 
            value="1.2s" 
            subtext="Stable performance" 
            icon={BarChart2} 
            color="text-amber-500"
          />
          <MetricCard 
            title="Success Rate" 
            value="99.8%" 
            subtext="Last 24 hours" 
            icon={CheckCircle} 
            color="text-green-500"
          />
        </section>

        {/* Tools Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ToolCard 
            title="Session Notes & Enhancement"
            description="Convert shorthand observations into compliant SOAP notes instantly. Features voice-to-text integration and template matching."
            icon={Smartphone}
            badge="AI-Powered"
            badgeColor="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
            iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
            stat1="45 generated this week"
            stat2="~30s saved/note"
            features={["SOAP & DAP Formats", "Voice Dictation"]}
          />
          <ToolCard 
            title="NDIS Goals & Progress Tracking"
            description="Track client goals against NDIS outcomes framework. Visualize progress with automated charts and milestone predictions."
            icon={Filter}
            badge="Tracking"
            badgeColor="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            iconBg="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            stat1="12 Active Clients"
            stat2="98% Completion"
            features={["Outcome Mapping", "Progress Visuals"]}
          />
          <ToolCard 
            title="Evidence Matrix & Domain Mapping"
            description="Automatically map clinical observations to functional capacity domains. Identify gaps in evidence for plan reviews."
            icon={LayoutGrid}
            badge="Analysis"
            badgeColor="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            stat1="6 Domains Covered"
            features={["Gap Analysis", "FCA Support"]}
          />
          <ToolCard 
            title="Assistive Technology Trial Tracker"
            description="Manage equipment trials, vendor quotes, and client feedback forms. Generate AT comparison tables instantly."
            icon={Smartphone}
            badge="Beta"
            badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            stat1="3 Active Trials"
            features={["Quote Comparison", "Feedback Forms"]}
          />
          <ToolCard 
            title="Team Collaboration & Approvals"
            description="Streamline the report approval process with supervisors. Track edits, comments, and final sign-offs."
            icon={Users}
            badge="Admin"
            badgeColor="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            iconBg="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
            stat1="2 Pending Review"
            features={["Version Control", "Supervisor Sign-off"]}
          />
          <ToolCard 
            title="AI Report Generator"
            description="Draft comprehensive FCA and Plan Review reports by synthesizing session notes, assessments, and goal data."
            icon={FileText}
            badge="Popular"
            badgeColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            stat1="15 Drafted"
            stat2="High Speed"
            features={["FCA Templates", "Auto-Citation"]}
          />
        </section>

        {/* Status Footer */}
        <footer className="mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Settings className="text-slate-400 w-5 h-5" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Models Status</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Gemini Pro: Operational</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-300 dark:bg-slate-600"></div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Ollama (Local): Idle</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">System Health: 99%</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500">
              Latency: 45ms
            </div>
          </div>
        </footer>
        <div className="h-4"></div>
      </div>
    </>
  );
}

function MetricCard({ title, value, subtext, icon: Icon, trendIcon: TrendIcon, trendColor, color = "text-indigo-600" }: any) {
  return (
    <div className="flex flex-col gap-1 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <Icon className={`text-xl ${color} w-5 h-5`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      <p className={`text-xs flex items-center gap-1 mt-1 ${trendColor || "text-slate-500 dark:text-slate-400"}`}>
        {TrendIcon && <TrendIcon className="w-3 h-3" />} {subtext}
      </p>
    </div>
  );
}

function ToolCard({ title, description, icon: Icon, badge, badgeColor, iconBg, stat1, stat2, features }: any) {
  return (
    <div className="group flex flex-col bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} size-14 rounded-xl flex items-center justify-center`}>
          <Icon className="w-8 h-8" />
        </div>
        <span className={`${badgeColor} text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide`}>{badge}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 line-clamp-2">{description}</p>
      
      <div className="mt-4 flex items-center gap-4 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <History className="w-4 h-4" /> {stat1}
        </div>
        {stat2 && (
          <>
            <div className="w-px h-3 bg-slate-300 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1">
              <BarChart2 className="w-4 h-4" /> {stat2}
            </div>
          </>
        )}
      </div>

      <ul className="mt-5 space-y-2 mb-6 flex-1">
        {features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <CheckCircle className="text-green-500 w-4 h-4" /> {feature}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 mt-auto">
        <button className="flex-1 bg-indigo-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">Launch Tool</button>
        <button className="size-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
