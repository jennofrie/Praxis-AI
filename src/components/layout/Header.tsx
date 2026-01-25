"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Calendar, ChevronDown } from "lucide-react";

function formatHeaderDate(d: Date) {
  // Use a fixed locale to avoid SSR/CSR mismatches.
  // If you want user-locale formatting, we can still do that but must render
  // a placeholder on the server to avoid hydration issues.
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export function Header({ title }: { title: string }) {
  // Render nothing on the server to prevent hydration mismatches caused by
  // locale/timezone differences. Populate after hydration.
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    let t: number | null = null;

    const schedule = () => {
      setTodayLabel(formatHeaderDate(new Date()));

      // Update shortly after local midnight.
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 1, 0);
      const msUntil = nextMidnight.getTime() - now.getTime();

      t = window.setTimeout(schedule, msUntil);
    };

    schedule();

    return () => {
      if (t) window.clearTimeout(t);
    };
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 lg:px-8">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors lg:hidden">
          <Search className="w-5 h-5" />
        </button>
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden lg:block"></div>
        <button className="hidden lg:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium">
          <Calendar className="w-4 h-4" />
          <span suppressHydrationWarning>{todayLabel}</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
