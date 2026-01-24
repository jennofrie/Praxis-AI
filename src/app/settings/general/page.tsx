"use client";

import { Header } from "@/components/layout/Header";
import { Badge, Settings, Users, CreditCard, Puzzle, ShieldCheck, ChevronRight, Server, Database, Brain, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function GeneralSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Header title="General Settings" />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 flex flex-col">
        <div className="mx-auto max-w-7xl w-full">
          {/* Page Header Content */}
          <div className="flex flex-col gap-2 mb-8">
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">Manage your organization details, NDIS parameters, and system-wide preferences for clinical documentation.</p>
          </div>

          {/* Tabs */}
          <div className="mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <nav className="flex gap-8 min-w-max">
              <TabLink active>General</TabLink>
              <TabLink>Team Members</TabLink>
              <TabLink>Billing & Plans</TabLink>
              <TabLink>Integrations</TabLink>
              <TabLink>Security</TabLink>
            </nav>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12">
            {/* LEFT COLUMN (Main Settings) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card: Theme Settings */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Moon className="text-indigo-600 w-5 h-5" />
                    ) : (
                      <Sun className="text-amber-500 w-5 h-5" />
                    )}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Theme Settings</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize the appearance of the application interface.</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Light Mode Option */}
                    <button
                      onClick={() => setTheme("light")}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        theme === "light"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {theme === "light" && (
                        <div className="absolute top-3 right-3">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                      )}
                      <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shadow-sm">
                        <Sun className="w-6 h-6 text-amber-500" />
                      </div>
                      <div className="text-center">
                        <span className={`text-sm font-semibold ${theme === "light" ? "text-indigo-600" : "text-slate-900 dark:text-white"}`}>
                          Light Mode
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Default appearance</p>
                      </div>
                    </button>

                    {/* Night Mode Option */}
                    <button
                      onClick={() => setTheme("dark")}
                      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        theme === "dark"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {theme === "dark" && (
                        <div className="absolute top-3 right-3">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        </div>
                      )}
                      <div className="w-16 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center shadow-sm">
                        <Moon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="text-center">
                        <span className={`text-sm font-semibold ${theme === "dark" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                          Night Mode
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dark appearance</p>
                      </div>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                    Your preference will be saved automatically and applied across all devices.
                  </p>
                </div>
              </div>

              {/* Card: Organization Details */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Organization Details</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your clinic information for invoices and NDIS reports.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputGroup label="Company Name" value="Praxis Therapy Services" />
                    <InputGroup label="ABN" value="12 345 678 901" />
                  </div>
                  <InputGroup label="Address" value="123 Health Way, Melbourne VIC 3000" />
                  <InputGroup label="Contact Email" value="admin@praxistherapy.com.au" type="email" />
                </div>
              </div>

              {/* Card: NDIS Configuration */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">NDIS Configuration</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage provider numbers and service categories.</p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">Active Provider</span>
                </div>
                <div className="p-6 space-y-5">
                  <InputGroup label="Provider Number" value="405000123" icon={<Badge className="w-5 h-5 text-slate-500" />} />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Registration Groups</label>
                    <div className="flex flex-wrap gap-2 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <Tag>Therapeutic Supports</Tag>
                      <Tag>Early Childhood Supports</Tag>
                      <button className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors">
                        <Plus className="w-4 h-4" /> Add Group
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: AI Settings */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-600 w-5 h-5" />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Documentation Settings</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure how the AI assists with clinical notes and report generation.</p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">AI Model</label>
                      <select className="w-full rounded-lg border-slate-300 dark:border-slate-700 text-sm py-2.5 focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:text-white">
                        <option>Clinical-LLM-v2 (Standard)</option>
                        <option>Clinical-LLM-v2 (Enhanced)</option>
                        <option>GPT-4 (Generic)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Auto-generate goals</span>
                        <span className="text-xs text-slate-500">Suggest GAS goals from notes</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-600/20 dark:peer-focus:ring-indigo-600/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Confidence Threshold</label>
                      <span className="text-sm font-bold text-indigo-600">85%</span>
                    </div>
                    <input className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:bg-slate-700" type="range" min="50" max="100" defaultValue="85" />
                    <p className="text-xs text-slate-500">AI will flag suggestions below this confidence score for manual review.</p>
                  </div>
                </div>
              </div>

              {/* Card: Clinical Workflow */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinical Workflow</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Default Report Template</label>
                    <select className="w-full rounded-lg border-slate-300 dark:border-slate-700 text-sm py-2.5 focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:text-white">
                      <option>NDIS Standard Progress Report</option>
                      <option>Initial Assessment</option>
                      <option>Functional Capacity Assessment</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Review Period</label>
                    <select className="w-full rounded-lg border-slate-300 dark:border-slate-700 text-sm py-2.5 focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:text-white">
                      <option>Quarterly (Every 3 months)</option>
                      <option>Bi-Annual (Every 6 months)</option>
                      <option>Annual (Every 12 months)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end gap-3 pt-2">
                <button className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">
                  Cancel
                </button>
                <button className="px-5 py-2.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2">
                  Save Changes
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN (Widgets) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card: Storage Usage */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Storage Usage</h3>
                <div className="flex items-center gap-6">
                  {/* Simple CSS Donut Chart */}
                  <div className="relative size-24 rounded-full flex items-center justify-center shrink-0" style={{ background: "conic-gradient(#4F46E5 24%, #e5e7eb 0)" }}>
                    <div className="size-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">24%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">2.4 GB</span>
                    <span className="text-sm text-slate-500">of 10 GB used</span>
                    <a className="text-sm font-medium text-indigo-600 hover:underline mt-1" href="#">Upgrade Plan</a>
                  </div>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-md">
                  Your team uploads approx. 150MB of clinical docs per week.
                </div>
              </div>

              {/* Card: System Status */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">System Status</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <StatusRow icon={Server} label="API Gateway" />
                  <StatusRow icon={Brain} label="AI Engine" />
                  <StatusRow icon={Database} label="Database" />
                </div>
              </div>

              {/* Card: Quick Links */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Links</h3>
                </div>
                <div className="flex flex-col">
                  <QuickLink>Manage Users</QuickLink>
                  <QuickLink>View Invoices</QuickLink>
                  <QuickLink>Contact Support</QuickLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { Plus, X, Sparkles } from "lucide-react";

function TabLink({ active, children }: { active?: boolean, children: React.ReactNode }) {
  return (
    <button className={`border-b-2 pb-3 text-sm font-medium transition-colors ${active ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200"}`}>
      {children}
    </button>
  );
}

function InputGroup({ label, value, type = "text", icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">{label}</label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {icon}
          </div>
        )}
        <input 
          className={`block w-full rounded-lg border-slate-300 py-2.5 text-sm focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white ${icon ? "pl-10" : ""}`} 
          type={type} 
          defaultValue={value}
        />
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-white dark:bg-slate-700 px-2 py-1 text-sm font-medium text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600">
      {children}
      <button className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-slate-500/20" type="button">
        <span className="sr-only">Remove</span>
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function StatusRow({ icon: Icon, label }: any) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <Icon className="text-slate-400 w-5 h-5" />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Operational</span>
      </div>
    </div>
  );
}

function QuickLink({ children }: { children: React.ReactNode }) {
  return (
    <a className="flex items-center justify-between px-6 py-3 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0" href="#">
      <span>{children}</span>
      <ChevronRight className="text-lg w-4 h-4" />
    </a>
  );
}
