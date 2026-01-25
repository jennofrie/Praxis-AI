"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Badge, ChevronRight, Server, Database, Brain, Sun, Moon, Cloud, HardDrive, RefreshCw, CheckCircle, XCircle, Loader2, Shield, FileText, Lock, Users, AlertTriangle, Plus, X, Sparkles } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAIProvider } from "@/components/providers/AIProviderContext";
import { useAdmin } from "@/components/providers/AdminContext";

export default function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const { provider, setProvider, enableFallback, setEnableFallback, ollamaStatus, checkOllamaStatus } = useAIProvider();
  const { isAdmin, isLoading, user } = useAdmin();
  const [activePromptTab, setActivePromptTab] = useState<string>("fca-pipeline");

  // Loading state
  if (isLoading) {
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

      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 flex flex-col">
        <div className="mx-auto max-w-7xl w-full">
          {/* Page Header Content */}
          <div className="flex flex-col gap-2 mb-8">
            <div className="flex items-center gap-3">
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                Manage your organization details, NDIS parameters, and system-wide preferences for clinical documentation.
              </p>
              {isAdmin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </span>
              )}
            </div>
            {user && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Logged in as: {user.email}
              </p>
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

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-12">
            {/* LEFT COLUMN (Main Settings) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card: Theme Settings - Available to all users */}
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

              {/* Card: Organization Details - Available to all users */}
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

              {/* Card: NDIS Configuration - Available to all users */}
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

              {/* ==================== ADMIN ONLY SECTIONS ==================== */}

              {/* Card: AI Provider Settings - ADMIN ONLY */}
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Choose your preferred AI provider for clinical documentation assistance.</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">Primary AI Provider</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Gemini Option */}
                        <button
                          onClick={() => setProvider("gemini")}
                          className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                            provider === "gemini"
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {provider === "gemini" && (
                            <div className="absolute top-3 right-3">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </div>
                          )}
                          <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                            <Cloud className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <span className={`text-sm font-semibold ${provider === "gemini" ? "text-indigo-600" : "text-slate-900 dark:text-white"}`}>
                              Gemini (Cloud)
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Google AI - Fast & Reliable</p>
                          </div>
                        </button>

                        {/* Ollama Option */}
                        <button
                          onClick={() => setProvider("ollama")}
                          className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer ${
                            provider === "ollama"
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          {provider === "ollama" && (
                            <div className="absolute top-3 right-3">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </div>
                          )}
                          <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
                            <HardDrive className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <span className={`text-sm font-semibold ${provider === "ollama" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-900 dark:text-white"}`}>
                              Ollama (Local)
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Self-hosted - Private & Secure</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Ollama Status */}
                    {provider === "ollama" && (
                      <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {ollamaStatus === "checking" && (
                            <>
                              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                              <span className="text-sm text-slate-600 dark:text-slate-300">Checking Ollama connection...</span>
                            </>
                          )}
                          {ollamaStatus === "online" && (
                            <>
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                              <span className="text-sm text-emerald-600 dark:text-emerald-400">Ollama server is online</span>
                            </>
                          )}
                          {ollamaStatus === "offline" && (
                            <>
                              <XCircle className="w-5 h-5 text-red-500" />
                              <span className="text-sm text-red-600 dark:text-red-400">Ollama server is offline</span>
                            </>
                          )}
                          {ollamaStatus === "unconfigured" && (
                            <>
                              <XCircle className="w-5 h-5 text-amber-500" />
                              <span className="text-sm text-amber-600 dark:text-amber-400">Ollama not configured</span>
                            </>
                          )}
                        </div>
                        <button
                          onClick={checkOllamaStatus}
                          className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Refresh status"
                        >
                          <RefreshCw className={`w-4 h-4 text-slate-500 ${ollamaStatus === "checking" ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    )}

                    {/* Fallback Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Enable Provider Fallback</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Automatically switch to alternate provider if primary fails</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={enableFallback}
                          onChange={(e) => setEnableFallback(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-600/20 dark:peer-focus:ring-indigo-600/40 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Card: AI Prompt Editor - ADMIN ONLY */}
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Customize AI prompts for each feature module.</p>
                  </div>
                  <div className="p-6 space-y-4">
                    {/* Prompt Tabs */}
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

                    {/* Active Prompt Editor */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        System Prompt for {PROMPT_FEATURES.find(f => f.id === activePromptTab)?.name}
                      </label>
                      <textarea
                        className="w-full h-48 rounded-lg border-slate-300 dark:border-slate-700 text-sm font-mono focus:border-indigo-600 focus:ring-indigo-600 dark:bg-slate-800 dark:text-white resize-none"
                        placeholder="Enter the system prompt for this AI feature..."
                        defaultValue={PROMPT_FEATURES.find(f => f.id === activePromptTab)?.defaultPrompt}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Changes will affect how the AI responds for this specific feature.
                      </p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Reset to Default
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
                        Save Prompt
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Card: User Management - ADMIN ONLY */}
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">View and manage registered users.</p>
                  </div>
                  <div className="p-6">
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">User list will be populated from Supabase.</p>
                      <p className="text-xs mt-1">Connect to database to manage users.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Non-admin notice */}
              {!isAdmin && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Limited Access</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        Some settings are restricted to administrators only. Contact your administrator if you need access to AI provider settings, prompt editing, or user management.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Card: System Status - ADMIN ONLY gets detailed view */}
              <div className={`rounded-xl border ${isAdmin ? "border-2 border-indigo-200 dark:border-indigo-800" : "border-slate-200 dark:border-slate-800"} bg-white dark:bg-slate-900 shadow-sm`}>
                <div className={`px-6 py-4 border-b ${isAdmin ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800"}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">System Status</h3>
                    {isAdmin && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 dark:bg-indigo-900/50 px-1.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                        <Lock className="w-3 h-3" />
                      </span>
                    )}
                  </div>
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

              {/* Card: Quick Links */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Quick Links</h3>
                </div>
                <div className="flex flex-col">
                  {isAdmin && <QuickLink>Manage Users</QuickLink>}
                  <QuickLink>View Invoices</QuickLink>
                  <QuickLink>Contact Support</QuickLink>
                  {isAdmin && <QuickLink>View Logs</QuickLink>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Prompt features configuration
const PROMPT_FEATURES = [
  { id: "fca-pipeline", name: "FCA Pipeline", defaultPrompt: "You are drafting the 'Functional Performance' section of an NDIS FCA report..." },
  { id: "evidence-matrix", name: "Evidence Matrix", defaultPrompt: "You are analyzing clinical session notes to map evidence against the NDIS Functional Capacity Framework..." },
  { id: "at-justification", name: "AT Justification", defaultPrompt: "Draft an AT Justification comparing the Selected Item vs. the Alternative..." },
  { id: "quality-checker", name: "Quality Checker", defaultPrompt: "You are an NDIS Quality Auditor. Review the following report excerpt for compliance risks..." },
  { id: "goal-progress", name: "Goal Progress", defaultPrompt: "You are generating a goal progress summary for an NDIS participant..." },
  { id: "ai-chat", name: "AI Chat", defaultPrompt: "You are an AI assistant for NDIS clinical documentation..." },
];

function TabLink({ active, children }: { active?: boolean, children: React.ReactNode }) {
  return (
    <button className={`border-b-2 pb-3 text-sm font-medium transition-colors ${active ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200"}`}>
      {children}
    </button>
  );
}

function InputGroup({ label, value, type = "text", icon }: { label: string; value: string; type?: string; icon?: React.ReactNode }) {
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

function StatusRow({ icon: Icon, label, status = "operational" }: { icon: React.ElementType; label: string; status?: "operational" | "offline" | "unknown" }) {
  const statusConfig = {
    operational: { color: "emerald", text: "Operational" },
    offline: { color: "red", text: "Offline" },
    unknown: { color: "amber", text: "Unknown" },
  };
  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <Icon className="text-slate-400 w-5 h-5" />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full bg-${config.color}-500`}></span>
        <span className={`text-xs font-medium text-${config.color}-700 dark:text-${config.color}-400`}>{config.text}</span>
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
