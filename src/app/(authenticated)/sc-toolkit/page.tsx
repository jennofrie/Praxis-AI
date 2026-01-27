"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  FileText,
  Mail,
  Calculator,
  CalendarDays,
  Scale,
  ShieldCheck,
  MessageSquare,
  Camera,
  BarChart3,
  ChevronRight,
  LucideIcon,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface QuickActionLinkProps {
  icon: LucideIcon;
  label: string;
  color: string;
  href: string;
}

interface WorkflowCardProps {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  features: string[];
  status: "Ready" | "Beta" | "Alpha";
  href: string;
}

interface ActivityItemProps {
  title: string;
  action: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

export default function SCToolkit() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <>
      <Header title="SC Toolkit" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-8 bg-slate-50 dark:bg-slate-950">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">
              SC Toolkit
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
              Support Coordination workflows for NDIS plan management, evidence alignment, and participant advocacy.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-full">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">9 Tools Available</span>
          </div>
        </header>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <QuickActionLink icon={FileText} label="Report Synthesizer" color="text-blue-500" href="/sc-toolkit/report-synthesizer" />
            <QuickActionLink icon={Mail} label="CoC Cover Letter" color="text-purple-500" href="/sc-toolkit/coc-cover-letter" />
            <QuickActionLink icon={Calculator} label="Budget Forecaster" color="text-emerald-500" href="/sc-toolkit/budget-forecaster" />
            <QuickActionLink icon={MessageSquare} label="Plan Management" color="text-rose-500" href="/sc-toolkit/plan-management" />
          </div>
        </section>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Feature Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-teal-600" /> SC Workflows
              </h2>
              <span className="text-xs font-medium px-2 py-1 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 rounded-full">
                AI-Powered
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Report Synthesizer"
                desc="Analyze allied health reports and synthesize NDIS evidence."
                icon={FileText}
                color="bg-blue-500"
                features={["AI Synthesis", "Data Extraction"]}
                status="Ready"
                href="/sc-toolkit/report-synthesizer"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="CoC Cover Letter"
                desc="Generate Change of Circumstances cover letters."
                icon={Mail}
                color="bg-purple-500"
                features={["Auto-Extract", "PDF Export"]}
                status="Ready"
                href="/sc-toolkit/coc-cover-letter"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Budget Forecaster"
                desc="Track NDIS budget run rates and depletion forecasts."
                icon={Calculator}
                color="bg-emerald-500"
                features={["Category Split", "Holiday Adjust"]}
                status="Ready"
                href="/sc-toolkit/budget-forecaster"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Roster Analyzer"
                desc="Analyze support worker rosters for gaps and overtime."
                icon={CalendarDays}
                color="bg-amber-500"
                features={["CSV Upload", "Gap Detection"]}
                status="Ready"
                href="/sc-toolkit/roster-analyzer"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Justification Drafter"
                desc="Generate LC-AT justification documents."
                icon={Scale}
                color="bg-indigo-500"
                features={["R&N Mapping", "Audit-Ready"]}
                status="Ready"
                href="/sc-toolkit/justification-drafter"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Senior Planner"
                desc="Section 34 document audit with 3-pass analysis."
                icon={ShieldCheck}
                color="bg-teal-500"
                features={["Scoring", "Red Flags"]}
                status="Ready"
                href="/sc-toolkit/senior-planner"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Plan Management Expert"
                desc="AI chat for NDIS pricing, claiming, and budgets."
                icon={MessageSquare}
                color="bg-rose-500"
                features={["Price Guide", "Doc Analysis"]}
                status="Ready"
                href="/sc-toolkit/plan-management"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Visual Case Notes"
                desc="Convert text or images into professional case notes."
                icon={Camera}
                color="bg-cyan-500"
                features={["Text & Image", "NDIS Format"]}
                status="Ready"
                href="/sc-toolkit/case-notes"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
              <WorkflowCard
                title="Weekly Summary"
                desc="Auto-generate weekly activity summaries."
                icon={BarChart3}
                color="bg-orange-500"
                features={["Auto-Detect", "Goal Tracking"]}
                status="Ready"
                href="/sc-toolkit/weekly-summary"
                hoveredCard={hoveredCard}
                setHoveredCard={setHoveredCard}
              />
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="space-y-6">
            {/* SC Toolkit Info Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-xl border border-teal-200 dark:border-teal-800 p-4">
              <h3 className="font-bold text-teal-800 dark:text-teal-300 mb-2">SC Toolkit</h3>
              <p className="text-sm text-teal-700 dark:text-teal-400 mb-3">
                Purpose-built tools for Support Coordinators managing NDIS plans, evidence, and participant outcomes.
              </p>
              <ul className="text-xs text-teal-600 dark:text-teal-500 space-y-1">
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Report synthesis &amp; analysis</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Budget tracking &amp; forecasting</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Justification document drafting</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Section 34 compliance audits</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> Plan management expert chat</li>
              </ul>
            </div>

            {/* Recent Activity */}
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2">
              <ActivityItem
                title="Budget Forecast: Jane D."
                action="Calculated"
                time="5m ago"
                icon={Calculator}
                color="text-emerald-500"
              />
              <ActivityItem
                title="CoC Cover Letter"
                action="Generated"
                time="1h ago"
                icon={Mail}
                color="text-purple-500"
              />
              <ActivityItem
                title="Report Synthesis"
                action="Completed"
                time="2h ago"
                icon={FileText}
                color="text-blue-500"
              />
              <ActivityItem
                title="Roster Gap Check"
                action="Analyzed"
                time="4h ago"
                icon={CalendarDays}
                color="text-amber-500"
              />
            </div>

            {/* Weekly Goal */}
            <div className="p-4 bg-teal-600 rounded-xl text-white shadow-lg shadow-teal-600/20">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold">Weekly Goal</h3>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white">6/8 Plans</span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                <div className="bg-white h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <p className="text-xs text-teal-100">You&apos;re on track with plan review submissions this week!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function QuickActionLink({ icon: Icon, label, color, href }: QuickActionLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md hover:border-teal-300 transition-all group"
    >
      <div className={`p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-teal-500 transition-colors" />
    </Link>
  );
}

function WorkflowCard({
  title,
  desc,
  icon: Icon,
  color,
  features,
  status,
  href,
  hoveredCard,
  setHoveredCard,
}: WorkflowCardProps & {
  hoveredCard: string | null;
  setHoveredCard: (card: string | null) => void;
}) {
  return (
    <Link
      href={href}
      onMouseEnter={() => setHoveredCard(title)}
      onMouseLeave={() => setHoveredCard(null)}
    >
      <div
        className={`relative group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-teal-500 dark:hover:border-teal-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-teal-500/10 h-full ${
          hoveredCard === title ? "scale-[1.02]" : ""
        }`}
      >
        <div
          className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
            status === "Ready"
              ? "bg-emerald-100 text-emerald-700"
              : status === "Beta"
              ? "bg-amber-100 text-amber-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {status}
        </div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white mb-4 shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">{desc}</p>
        <div className="flex flex-wrap gap-2">
          {features.map((f: string) => (
            <span
              key={f}
              className="text-[10px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md"
            >
              {f}
            </span>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-teal-500" />
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ title, action, time, icon: Icon, color }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
      <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {action} <span className="mx-1">&bull;</span> {time}
        </p>
      </div>
      <Clock className="w-3.5 h-3.5 text-slate-400" />
    </div>
  );
}
