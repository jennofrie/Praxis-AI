"use client";

import { Header } from "@/components/layout/Header";
import { PlannerMode } from "@/components/toolkit/PlannerMode";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SeniorPlanner() {
  return (
    <>
      <Header title="Senior Planner - Document Auditor" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link
            href="/sc-toolkit"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <PlannerMode />
      </div>
    </>
  );
}
