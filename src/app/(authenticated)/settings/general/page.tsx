"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Badge, ChevronRight, Server, Database, Brain, Sun, Moon, Cloud, HardDrive, RefreshCw, CheckCircle, XCircle, Loader2, Shield, FileText, Lock, Users, AlertTriangle, Plus, X, Sparkles, LogOut, User } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAIProvider } from "@/components/providers/AIProviderContext";
import { useAdmin } from "@/components/providers/AdminContext";
import { createBrowserClient } from "@/lib/supabase";
import { useProfileSettings } from "@/hooks/useProfileSettings";

// Toast notification
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
      type === "success"
        ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200"
        : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
    }`}>
      {type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function GeneralSettings() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { theme, setTheme } = useTheme();
  const { provider, setProvider, enableFallback, setEnableFallback, ollamaStatus, checkOllamaStatus } = useAIProvider();
  const { isAdmin, isLoading: adminLoading, user } = useAdmin();
  const { profile, isSaving, saveOrganizationDetails, savePreferences } = useProfileSettings();

  const [activePromptTab, setActivePromptTab] = useState<string>("fca-pipeline");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Org form state (initialised from profile when loaded)
  const [orgForm, setOrgForm] = useState({
    company_name: "",
    abn: "",
    address: "",
    contact_email: "",
  });

  const [promptValues, setPromptValues] = useState<Record<string, string>>({});

  // Sync org form when profile loads
  useEffect(() => {
    if (profile?.organization_details) {
      const details = profile.organization_details as Record<string, string>;
      setOrgForm({
        company_name: details.company_name ?? "",
        abn: details.abn ?? "",
        address: details.address ?? "",
        contact_email: details.contact_email ?? "",
      });
    }
  }, [profile]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveOrg = async () => {
    const result = await saveOrganizationDetails(orgForm);
    showToast(result.success ? "Organization details saved." : result.error ?? "Save failed.", result.success ? "success" : "error");
  };

  const handleSavePrompt = async () => {
    const currentPrompt = promptValues[activePromptTab] ?? PROMPT_FEATURES.find(f => f.id === activePromptTab)?.defaultPrompt ?? "";
    const result = await savePreferences({
      custom_prompts: { ...(profile?.preferences?.custom_prompts ?? {}), [activePromptTab]: currentPrompt },
    });
    showToast(result.success ? "Prompt saved." : result.error ?? "Save failed.", result.success ? "success" : "error");
  };

  const handleProviderChange = async (newProvider: "gemini" | "ollama") => {
    setProvider(newProvider);
    const result = await savePreferences({ ai_provider: newProvider });
    if (!result.success) showToast("Failed to save provider preference.", "error");
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  if (adminLoading) {
    return (
      <>
        <Header title="General Settings" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="General Settings" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 flex flex-col">
        <div className="mx-auto max-w-7xl w-full">
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage your organization details, NDIS parameters, and system-wide preferences for clinical documentation.
              </p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Shield className="w-3.5 h-3.5" /> Admin
                </span>
              )}
            </div>
            {user && (
              <p className="text-xs text-slate-400 dark:text-slate-500">Logged in as: {user.email}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            <nav className="flex gap-8 min-w-max">
              <TabLink active>General</TabLink>
              {isAdmin && <TabLink>Team Members</TabLink>}
              <TabLink>Billing & Plans</TabLink>
              {isAdmin && <TabLink>Integrations</TabLink>}
              <TabLink>Security</TabLink>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              {/* Theme Settings */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? <Moon className="text-indigo-600 w-5 h-5" /> : <Sun className="text-amber-500 w-5 h-5" />}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Theme Settings</h3>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize the appearance of the application interface.</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ThemeButton selected={theme === "light"} icon={<Sun className="w-6 h-6 text-amber-500" />} label="Light Mode" desc="Default appearance" bg="bg-slate-100 border-slate-200" onClick={() => setTheme("light")} />
                    <ThemeButton selected={theme === "dark"} icon={<Moon className="w-6 h-6 text-indigo-400" />} label="Night Mode" desc="Dark appearance" bg="bg-slate-900 border-slate-700" onClick={() => setTheme("dark")} />
                  </div>
                </div>
              </div>

              {/* Organization Details */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Organization Details</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Update your clinic information for invoices and NDIS reports.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ControlledInput label="Company Name" value={orgForm.company_name} onChange={v => setOrgForm(f => ({ ...f, company_name: v }))} />
                    <ControlledInput label="ABN" value={orgForm.abn} onChange={v => setOrgForm(f => ({ ...f, abn: v }))} />
                  </div>
                  <ControlledInput label="Address" value={orgForm.address} onChange={v => setOrgForm(f => ({ ...f, address: v }))} />
                  <ControlledInput label="Contact Email" value={orgForm.contact_email} onChange={v => setOrgForm(f => ({ ...f, contact_email: v }))} type="email" />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveOrg}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* NDIS Configuration */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">NDIS Configuration</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage provider numbers and service categories.</p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">Active Provider</span>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Provider Number</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Badge className="w-5 h-5 text-slate-500" />
                      </div>
                      <input
                        className="block w-full rounded-lg border-slate-300 py-2.5 text-sm pl-10 focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                        defaultValue={profile?.preferences?.ndis_provider_number ?? "405000123"}
                        onChange={e => savePreferences({ ndis_provider_number: e.target.value })}
                      />
                    </div>
                  </div>
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

              {/* AI Provider Settings — Admin only */}
              {isAdmin && (
                <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="px-6 py-5 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-indigo-600 w-5 h-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Provider Settings</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <Lock className="w-3 h-3" /> Admin Only
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Primary AI Provider</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ProviderButton
                          selected={provider === "gemini"}
                          icon={<Cloud className="w-6 h-6 text-white" />}
                          bg="from-blue-500 to-purple-600"
                          label="Gemini (Cloud)"
                          desc="Google AI - Fast & Reliable"
                          onClick={() => handleProviderChange("gemini")}
                        />
                        <ProviderButton
                          selected={provider === "ollama"}
                          icon={<HardDrive className="w-6 h-6 text-white" />}
                          bg="from-orange-500 to-red-600"
                          label="Ollama (Local)"
                          desc="Self-hosted - Private & Secure"
                          onClick={() => handleProviderChange("ollama")}
                        />
                      </div>
                    </div>

                    {provider === "ollama" && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {ollamaStatus === "checking" && <><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /><span className="text-sm text-slate-600 dark:text-slate-300">Checking Ollama…</span></>}
                          {ollamaStatus === "online" && <><CheckCircle className="w-5 h-5 text-emerald-500" /><span className="text-sm text-emerald-600 dark:text-emerald-400">Ollama server is online</span></>}
                          {ollamaStatus === "offline" && <><XCircle className="w-5 h-5 text-red-500" /><span className="text-sm text-red-600 dark:text-red-400">Ollama server is offline</span></>}
                          {ollamaStatus === "unconfigured" && <><XCircle className="w-5 h-5 text-amber-500" /><span className="text-sm text-amber-600 dark:text-amber-400">Ollama not configured</span></>}
                        </div>
                        <button onClick={checkOllamaStatus} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                          <RefreshCw className={`w-4 h-4 text-slate-500 ${ollamaStatus === "checking" ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Enable Provider Fallback</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Automatically switch to alternate provider if primary fails</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={enableFallback} onChange={e => setEnableFallback(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-600/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Prompt Editor — Admin only */}
              {isAdmin && (
                <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="px-6 py-5 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="text-indigo-600 w-5 h-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Prompt Editor</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <Lock className="w-3 h-3" /> Admin Only
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {PROMPT_FEATURES.map((feature) => (
                        <button
                          key={feature.id}
                          onClick={() => setActivePromptTab(feature.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            activePromptTab === feature.id
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {feature.name}
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        System Prompt for {PROMPT_FEATURES.find(f => f.id === activePromptTab)?.name}
                      </label>
                      <textarea
                        className="w-full h-48 rounded-lg border-slate-300 dark:border-slate-700 text-sm font-mono focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:text-white resize-none"
                        value={promptValues[activePromptTab] ?? profile?.preferences?.custom_prompts?.[activePromptTab] ?? PROMPT_FEATURES.find(f => f.id === activePromptTab)?.defaultPrompt ?? ""}
                        onChange={e => setPromptValues(prev => ({ ...prev, [activePromptTab]: e.target.value }))}
                        placeholder="Enter the system prompt for this AI feature..."
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setPromptValues(prev => ({ ...prev, [activePromptTab]: PROMPT_FEATURES.find(f => f.id === activePromptTab)?.defaultPrompt ?? "" }))}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Reset to Default
                      </button>
                      <button
                        onClick={handleSavePrompt}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Prompt
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* User Management — Admin only */}
              {isAdmin && (
                <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 shadow-sm">
                  <div className="px-6 py-5 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="text-indigo-600 w-5 h-5" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Management</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <Lock className="w-3 h-3" /> Admin Only
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">User list will be populated from Supabase.</p>
                    </div>
                  </div>
                </div>
              )}

              {!isAdmin && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Limited Access</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        Some settings are restricted to administrators only.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
              {/* Storage Usage */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 flex flex-col gap-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Storage Usage</h3>
                <div className="flex items-center gap-6">
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
              </div>

              {/* System Status */}
              <div className={`rounded-xl border ${isAdmin ? "border-2 border-indigo-200 dark:border-indigo-800" : "border-slate-200 dark:border-slate-800"} bg-white dark:bg-slate-900 shadow-sm`}>
                <div className={`px-6 py-4 border-b ${isAdmin ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800"}`}>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">System Status</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  <StatusRow icon={Server} label="API Gateway" status="operational" />
                  <StatusRow icon={Brain} label="AI Engine" status="operational" />
                  <StatusRow icon={Database} label="Database" status="operational" />
                  {isAdmin && (
                    <>
                      <StatusRow icon={Cloud} label="Gemini API" status="operational" />
                      <StatusRow icon={HardDrive} label="Ollama Server" status={ollamaStatus === "online" ? "operational" : ollamaStatus === "offline" ? "offline" : "unknown"} />
                    </>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Links</h3>
                </div>
                <div className="flex flex-col">
                  {isAdmin && <QuickLink href="/audits">View Logs</QuickLink>}
                  <QuickLink href="#">View Invoices</QuickLink>
                  <QuickLink href="mailto:support@jddigitalsystems.com">Contact Support</QuickLink>
                </div>
              </div>

              {/* Account */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Account</h3>
                </div>
                <div className="p-6 space-y-4">
                  {user && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{isAdmin ? "Administrator" : "Member"}</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                  >
                    {isLoggingOut ? <><Loader2 className="w-4 h-4 animate-spin" /> Logging out…</> : <><LogOut className="w-4 h-4" /> Log Out</>}
                  </button>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">You will be redirected to the landing page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Prompt features config
const PROMPT_FEATURES = [
  { id: "fca-pipeline", name: "FCA Pipeline", defaultPrompt: "You are drafting the 'Functional Performance' section of an NDIS FCA report..." },
  { id: "evidence-matrix", name: "Evidence Matrix", defaultPrompt: "You are analyzing clinical session notes to map evidence against the NDIS Functional Capacity Framework..." },
  { id: "at-justification", name: "AT Justification", defaultPrompt: "Draft an AT Justification comparing the Selected Item vs. the Alternative..." },
  { id: "quality-checker", name: "Quality Checker", defaultPrompt: "You are an NDIS Quality Auditor. Review the following report excerpt for compliance risks..." },
  { id: "goal-progress", name: "Goal Progress", defaultPrompt: "You are generating a goal progress summary for an NDIS participant..." },
  { id: "ai-chat", name: "AI Chat", defaultPrompt: "You are an AI assistant for NDIS clinical documentation..." },
];

// Sub-components
function TabLink({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <button className={`border-b-2 pb-3 text-sm font-medium transition-colors ${active ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200"}`}>
      {children}
    </button>
  );
}

function ControlledInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">{label}</label>
      <input
        className="block w-full rounded-lg border-slate-300 py-2.5 text-sm focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function ThemeButton({ selected, icon, label, desc, bg, onClick }: { selected: boolean; icon: React.ReactNode; label: string; desc: string; bg: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${selected ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </span>
        </div>
      )}
      <div className={`w-16 h-12 rounded-lg ${bg} border flex items-center justify-center shadow-sm`}>{icon}</div>
      <div className="text-center">
        <span className={`text-sm font-semibold ${selected ? "text-indigo-600" : "text-slate-900 dark:text-white"}`}>{label}</span>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
    </button>
  );
}

function ProviderButton({ selected, icon, bg, label, desc, onClick }: { selected: boolean; icon: React.ReactNode; bg: string; label: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${selected ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}
    >
      {selected && (
        <div className="absolute top-3 right-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          </span>
        </div>
      )}
      <div className={`w-16 h-12 rounded-lg bg-gradient-to-br ${bg} flex items-center justify-center shadow-sm`}>{icon}</div>
      <div className="text-center">
        <span className={`text-sm font-semibold ${selected ? "text-indigo-600" : "text-slate-900 dark:text-white"}`}>{label}</span>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
    </button>
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

function StatusRow({ icon: Icon, label, status = "operational" }: { icon: React.ElementType; label: string; status?: "operational" | "offline" | "unknown" }) {
  const statusConfig = {
    operational: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "Operational" },
    offline: { dot: "bg-red-500", text: "text-red-700 dark:text-red-400", label: "Offline" },
    unknown: { dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", label: "Unknown" },
  };
  const config = statusConfig[status];
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <Icon className="text-slate-400 w-5 h-5" />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${config.dot}`}></span>
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
      </div>
    </div>
  );
}

function QuickLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a className="flex items-center justify-between px-6 py-3 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0" href={href}>
      <span>{children}</span>
      <ChevronRight className="text-lg w-4 h-4" />
    </a>
  );
}
