"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { FCASessionData, PipelineStep } from "./types";
import { ChevronRight, User, FileText, Brain, CheckCircle } from "lucide-react";
import Link from "next/link";
import { DomainMapper } from "./DomainMapper";
import { NarrativeBuilder } from "./NarrativeBuilder";

export default function FCAPipeline() {
  const [step, setStep] = useState<PipelineStep>("intake");
  const [data, setData] = useState<FCASessionData>({
    participantName: "",
    ndisNumber: "",
    date: new Date().toISOString().split("T")[0],
    diagnosis: "",
    observations: {},
    goals: []
  });

  const steps = [
    { id: "intake", label: "Intake", icon: User },
    { id: "mapping", label: "Domain Map", icon: FileText },
    { id: "narrative", label: "AI Drafting", icon: Brain },
    { id: "review", label: "Review", icon: CheckCircle },
  ];

  return (
    <>
      <Header title="FCA Pipeline" />
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Breadcrumb / Progress */}
          <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Link href="/toolkit" className="hover:text-indigo-600 transition-colors">Toolkit</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-semibold text-slate-900 dark:text-white">Session-to-FCA Pipeline</span>
          </nav>

          {/* Stepper */}
          <div className="flex items-center justify-between relative px-4">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 dark:bg-slate-800 -z-10"></div>
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isPast = steps.findIndex(x => x.id === step) > i;
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive || isPast 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isActive ? "text-indigo-600" : "text-slate-500"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[500px] p-6">
            {step === "intake" && (
              <IntakeStep data={data} updateData={setData} next={() => setStep("mapping")} />
            )}
            {step === "mapping" && (
               <DomainMapper 
                 data={data} 
                 updateData={setData} 
                 next={() => setStep("narrative")} 
                 back={() => setStep("intake")}
               />
            )}
            {step === "narrative" && (
               <NarrativeBuilder 
                 data={data} 
                 updateData={setData} 
                 back={() => setStep("mapping")} 
               />
            )}
             {step === "review" && (
               <div className="text-center py-20 text-slate-500">Review Component Coming Soon</div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

function IntakeStep({ data, updateData, next }: { data: FCASessionData, updateData: (d: FCASessionData) => void, next: () => void }) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Intake</h2>
        <p className="text-slate-500 dark:text-slate-400">Enter participant details to initialize the assessment pipeline.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Participant Name</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-600 outline-none"
            value={data.participantName}
            onChange={(e) => updateData({...data, participantName: e.target.value})}
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">NDIS Number</label>
           <input 
            type="text" 
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-600 outline-none"
            value={data.ndisNumber}
            onChange={(e) => updateData({...data, ndisNumber: e.target.value})}
            placeholder="e.g. 430xxxxx"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
           <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary Diagnosis</label>
           <input 
            type="text" 
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-indigo-600 outline-none"
            value={data.diagnosis}
            onChange={(e) => updateData({...data, diagnosis: e.target.value})}
            placeholder="e.g. Autism Spectrum Disorder (Level 2)"
          />
        </div>
      </div>

      <div className="flex justify-end pt-6">
        <button 
          onClick={next}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Next: Domain Mapping <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
