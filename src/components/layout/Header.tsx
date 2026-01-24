import { Bell, Search, Calendar, ChevronDown } from "lucide-react";

export function Header({ title }: { title: string }) {
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
          <span>Oct 24, 2023</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
