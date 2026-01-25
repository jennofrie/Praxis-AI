"use client";

import { Header } from "@/components/layout/Header";
import { Clock } from "lucide-react";

export default function SCToolkit() {
  return (
    <>
      <Header title="SC Toolkit" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col gap-8 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                  Work in progress
                </span>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">SC Toolkit</h1>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              We are building Support Coordinator workflows focused on plan review preparation,
              evidence alignment, and participant communication. This space will match the
              Allied Toolkit experience once the first modules are ready.
            </p>

            <div className="mt-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planned modules: plan review pack builder, evidence checklist, and participant-ready summaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
