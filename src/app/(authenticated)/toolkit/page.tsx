"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import {
  Smartphone,
  PenTool,
  LayoutGrid,
  History,
  ShieldCheck,
  Brain,
  Scale,
  FileSearch,
  Zap,
  ChevronRight,
  LucideIcon,
  FileText,
  CheckCircle,
  RefreshCcw,
  ClipboardCheck,
} from "lucide-react";

import Link from "next/link";
import { PlannerMode } from "@/components/toolkit/PlannerMode";
import { CoCMode } from "@/components/toolkit/CoCMode";

type ToolkitModeType = "clinician" | "planner" | "coc";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  color: string;
}

interface WorkflowCardProps {
  title: string;
  desc: string;
  icon: LucideIcon;
  color: string;
  features: string[];
  status: "Ready" | "Beta" | "Alpha";
  href?: string;
}

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  iconBg: string;
  href?: string;
}

interface QuickActionLinkProps extends QuickActionProps {
  href: string;
}

interface ActivityItemProps {
  title: string;
  action: string;
  time: string;
  icon: LucideIcon;
  color: string;
}

export default function Toolkit() {
  const [mode, setMode] = useState<ToolkitModeType>("clinician");

  return (
    <>
      <Header title="Allied Toolkit" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-8 bg-slate-50 dark:bg-slate-950">
        {/* Page Header & Role Toggle */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">Allied Toolkit</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-2xl">
              Specialized workflows for NDIS documentation, assessment, and compliance.
            </p>
          </div>

          {/* 3-Way Mode Toggle */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setMode("clinician")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "clinician"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <Brain className="w-4 h-4" />
              Clinician
            </button>
            <button
              onClick={() => setMode("planner")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "planner"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Planner
            </button>
            <button
              onClick={() => setMode("coc")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === "coc"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <RefreshCcw className="w-4 h-4" />
              CoC
            </button>
          </div>
        </header>

        {/* Quick Actions - Only show in Clinician mode */}
        {mode === "clinician" && (
          <section>
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <QuickActionLink icon={Zap} label="New FCA" color="text-amber-500" href="/toolkit/fca-pipeline" />
              <QuickActionLink icon={FileSearch} label="Check Compliance" color="text-emerald-500" href="/toolkit/quality-checker" />
              <QuickActionLink icon={Scale} label="Justify AT" color="text-indigo-500" href="/toolkit/at-justification" />
              <QuickActionLink icon={LayoutGrid} label="Evidence Matrix" color="text-violet-500" href="/toolkit/evidence-matrix" />
            </div>
          </section>
        )}

        {/* Main Workflow Area */}
        {mode === "clinician" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Assessment Workflow */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-600" /> Assessment Workflow
                </h2>
                <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full">
                  Gemini Pro Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <WorkflowCard 
                  title="1. Session Intake"
                  desc="Capture raw notes & map to domains."
                  icon={Smartphone}
                  color="bg-blue-500"
                  features={["Voice Dictation", "Domain Mapping"]}
                  status="Ready"
                  href="/toolkit/fca-pipeline"
                />
                <WorkflowCard 
                  title="2. Evidence Matrix"
                  desc="Visualise functional evidence gaps."
                  icon={LayoutGrid}
                  color="bg-indigo-500"
                  features={["Gap Analysis", "Heatmap"]}
                  status="Ready"
                  href="/toolkit/evidence-matrix"
                />
                <WorkflowCard 
                  title="3. FCA Pipeline"
                  desc="Generate clinical reasoning narratives."
                  icon={PenTool}
                  color="bg-violet-500"
                  features={["Auto-Narrative", "Citation"]}
                  status="Ready"
                  href="/toolkit/fca-pipeline"
                />
                <WorkflowCard 
                  title="4. AT Justification"
                  desc="Build cost-benefit analysis."
                  icon={Scale}
                  color="bg-fuchsia-500"
                  features={["Comparison", "Reasonable & Necessary"]}
                  status="Ready"
                  href="/toolkit/at-justification"
                />
              </div>

              {/* Quality & Compliance */}
              <div className="mt-8">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Quality & Compliance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ToolCard 
                    title="Report Quality Checker"
                    description="Real-time risk scoring for NDIS compliance."
                    icon={FileSearch}
                    badge="Essential"
                    iconBg="bg-emerald-100 text-emerald-600"
                    badgeColor="bg-emerald-100 text-emerald-700"
                    href="/toolkit/quality-checker"
                  />
                  <ToolCard 
                    title="Goal Progress Tracker"
                    description="Track SMART goals and session outcomes."
                    icon={CheckCircle}
                    badge="New"
                    iconBg="bg-blue-100 text-blue-600"
                    badgeColor="bg-blue-100 text-blue-700"
                    href="/toolkit/goal-progress"
                  />
                  <ToolCard 
                    title="Consent & Audit Trail"
                    description="Track permissions and version history."
                    icon={History}
                    badge="Secure"
                    iconBg="bg-slate-100 text-slate-600"
                    badgeColor="bg-slate-100 text-slate-700"
                    href="/audits"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Recent Activity & Goals */}
            <div className="space-y-6">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
               <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-2">
                 <ActivityItem 
                    title="FCA Draft: John Doe" 
                    action="Edited" 
                    time="2m ago" 
                    icon={FileText} 
                    color="text-indigo-500" 
                  />
                  <ActivityItem 
                    title="AT Justification" 
                    action="Generated" 
                    time="1h ago" 
                    icon={Scale} 
                    color="text-fuchsia-500" 
                  />
                  <ActivityItem 
                    title="Evidence Gap Check" 
                    action="Completed" 
                    time="3h ago" 
                    icon={CheckCircle} 
                    color="text-emerald-500" 
                  />
               </div>

               <div className="p-4 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                 <div className="flex items-start justify-between mb-2">
                   <h3 className="font-bold">Weekly Goal</h3>
                   <span className="text-xs bg-white/20 px-2 py-0.5 rounded text-white">4/5 Reports</span>
                 </div>
                 <div className="w-full bg-black/20 rounded-full h-2 mb-2">
                   <div className="bg-white h-2 rounded-full" style={{ width: "80%" }}></div>
                 </div>
                 <p className="text-xs text-indigo-100">You&apos;re on track to meet your submission targets!</p>
               </div>
            </div>
          </div>
        )}

        {/* Planner Mode - Section 34 Auditor */}
        {mode === "planner" && <PlannerMode />}

        {/* CoC Mode - Change of Circumstances Assessor */}
        {mode === "coc" && <CoCMode />}
      </div>
    </>
  );
}

function QuickActionLink({ icon: Icon, label, color, href }: QuickActionLinkProps) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group">
      <div className={`p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 ${color} group-hover:scale-110 transition-transform`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    </Link>
  );
}

function WorkflowCard({ title, desc, icon: Icon, color, features, status, href }: WorkflowCardProps) {
  const CardContent = (
    <div className="relative group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer hover:shadow-lg hover:shadow-indigo-500/10 h-full">
      <div className={`absolute top-4 right-4 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        status === "Ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}>
        {status}
      </div>
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white mb-4 shadow-md`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10">{desc}</p>
      <div className="flex flex-wrap gap-2">
        {features.map((f: string) => (
          <span key={f} className="text-[10px] font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
            {f}
          </span>
        ))}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }

  return CardContent;
}

function ToolCard({ title, description, icon: Icon, badge, badgeColor, iconBg, href }: ToolCardProps) {
  const CardContent = (
    <div className="flex p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors cursor-pointer group">
      <div className={`${iconBg} w-12 h-12 rounded-lg flex items-center justify-center shrink-0 mr-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          {badge && <span className={`${badgeColor} text-[10px] font-bold px-1.5 py-0.5 rounded uppercase`}>{badge}</span>}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 ml-auto self-center group-hover:text-indigo-500 transition-colors" />
    </div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }

  return CardContent;
}

function ActivityItem({ title, action, time, icon: Icon, color }: ActivityItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer">
      <div className={`p-2 rounded-full bg-slate-50 dark:bg-slate-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{action} • {time}</p>
      </div>
    </div>
  );
}
