"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  Bot,
  Briefcase,
  ShieldCheck,
  ScrollText,
  Settings,
  HelpCircle,
  Search,
  Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIAssistant } from "@/components/providers/AIAssistantContext";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "Clinical Workflow" },
  { name: "Participants", href: "/participants", icon: Users, section: "Clinical Workflow" },
  { name: "Reports & Docs", href: "/reports", icon: FileText, section: "Clinical Workflow" },
  { name: "AI Assistant", href: "#", icon: Bot, section: "Clinical Workflow", badge: "NEW", isAIAssistant: true },
  { name: "Allied Toolkit", href: "/toolkit", icon: Briefcase, section: "Clinical Workflow", badge: "NEW" },
  { name: "SC Toolkit", href: "/sc-toolkit", icon: Briefcase, section: "Clinical Workflow", badge: "WIP" },
  { name: "Audits", href: "/audits", icon: ShieldCheck, section: "Compliance" },
  { name: "NDIS Plans", href: "/ndis-plans", icon: ScrollText, section: "Compliance" },
  { name: "General", href: "/settings/general", icon: Settings, section: "Settings" },
  { name: "Help Center", href: "/help", icon: HelpCircle, section: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen: isAIAssistantOpen, openAssistant } = useAIAssistant();

  const supabase = useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState<string>("Loading...");
  const [roleTitle, setRoleTitle] = useState<string>("Agent User");
  const [avatarUrl, setAvatarUrl] = useState<string>("https://ui-avatars.com/api/?name=User&background=random");

  useEffect(() => {
    const run = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        setDisplayName("Guest");
        setRoleTitle("Agent User");
        setAvatarUrl("https://ui-avatars.com/api/?name=Guest&background=random");
        return;
      }

      const user = userData.user;
      let profile: any = null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, role_title")
          .eq("id", user.id)
          .maybeSingle();

        // If the role_title column isn't migrated yet, PostgREST returns 400.
        if (error && (error as any).status === 400) {
          const fallback = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .maybeSingle();
          profile = fallback.data;
        } else {
          profile = data;
        }
      } catch {
        profile = null;
      }

      const nameFromProfile = (profile as any)?.full_name as string | undefined;
      const nameFromMeta = (user.user_metadata as any)?.full_name as string | undefined;
      const baseName = nameFromProfile || nameFromMeta || user.email || "User";

      setDisplayName(baseName);
      setRoleTitle(((profile as any)?.role_title as string) || "Agent User");
      setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(baseName)}&background=random`);
    };
    void run();
  }, [supabase]);

  // Group items by section
  const sections = ["Clinical Workflow", "Compliance", "Settings"];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full flex-shrink-0 z-20">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 lg:border-none">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/logo.svg" alt="Spectra Praxis" className="w-8 h-8" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Spectra Praxis</span>
        </Link>
      </div>

      {/* Search */}
      <div className="px-5 mt-4 mb-2">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-slate-400 w-4 h-4" />
          </span>
          <input 
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg py-2 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-600 placeholder-slate-400 dark:placeholder-slate-500" 
            placeholder="Search data..." 
            type="text"
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <span className="flex items-center text-slate-400 text-xs border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
              <Command className="w-3 h-3 mr-0.5" />K
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section}>
            <h3 className="px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              {section}
            </h3>
            <ul className="space-y-1">
              {navigation.filter(item => item.section === section).map((item) => {
                const isActive = item.isAIAssistant ? isAIAssistantOpen : pathname === item.href;

                // Render AI Assistant as a button that opens the widget
                if (item.isAIAssistant) {
                  return (
                    <li key={item.name}>
                      <button
                        onClick={openAssistant}
                        className={cn(
                          "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors group text-sm font-medium w-full text-left",
                          isActive
                            ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        <item.icon className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-indigo-600"
                        )} />
                        <span>{item.name}</span>
                        {item.badge && (
                          <span className="ml-auto bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors group text-sm font-medium",
                        isActive
                          ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-indigo-600"
                      )} />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Link href="/profile" className="flex items-center gap-3 w-full hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 overflow-hidden">
             <img src={avatarUrl} alt={displayName} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{roleTitle}</p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
