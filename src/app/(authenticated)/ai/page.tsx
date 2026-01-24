"use client";

import { Header } from "@/components/layout/Header";
import { Mic, Send, Paperclip, Sparkles, Copy, RefreshCw, FilePlus, Lightbulb, History, MoreHorizontal } from "lucide-react";

export default function AIAssistant() {
  return (
    <>
      <Header title="AI Assistant" />
      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area (Chat) */}
        <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50 dark:bg-slate-950">
          {/* Chat Header */}
          <div className="flex-none px-8 py-5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-slate-900 dark:text-white tracking-tight text-2xl font-bold leading-tight">Quantum AI Assistant</h1>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">Secure Mode</span>
                </div>
                <p className="text-indigo-600 dark:text-slate-400 text-sm font-normal leading-normal">Drafting clinical notes and summaries powered by secure LLMs.</p>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 scroll-smooth">
            <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 pb-4">
              {/* Date Separator */}
              <div className="flex justify-center">
                <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Today, 9:41 AM</span>
              </div>

              {/* AI Welcome Message */}
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-900 dark:text-white text-sm font-bold">Quantum AI</span>
                    <span className="text-slate-400 text-xs">9:41 AM</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                    <p>Hello Dr. Jensen. I'm ready to assist with your documentation today. I can help summarize sessions, draft reports, or analyze assessment data.</p>
                    <p className="mt-2 text-sm text-slate-500">Note: All data processed in this session is encrypted and compliant with NDIS privacy standards.</p>
                  </div>
                </div>
              </div>

              {/* User Message */}
              <div className="flex items-end justify-end gap-3">
                <div className="flex flex-col gap-1 items-end max-w-[85%] sm:max-w-[75%]">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-br-none px-5 py-3 shadow-md text-base leading-relaxed">
                    <p>Draft a Functional Capacity Assessment summary for John Doe based on yesterday's notes. Focus on mobility and self-care goals.</p>
                  </div>
                  <span className="text-slate-400 text-xs pr-1">9:45 AM</span>
                </div>
                <div className="bg-slate-200 rounded-full w-10 h-10 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                   <img src="https://ui-avatars.com/api/?name=Sarah+Chen&background=random" alt="User" />
                </div>
              </div>

              {/* AI Response */}
              <div className="flex items-start gap-4">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-full w-10 h-10 shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-slate-900 dark:text-white text-sm font-bold">Quantum AI</span>
                    <span className="text-slate-400 text-xs">9:45 AM</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl rounded-tl-none p-5 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                    <p className="mb-3">Here is a draft summary based on the session dated Oct 24:</p>
                    <div className="space-y-3 mb-4">
                      <div>
                        <strong className="text-indigo-600 font-semibold block mb-1">Mobility</strong>
                        <p className="text-sm">Participant demonstrated improved range of motion in upper extremities but continues to fatigue quickly after 10 minutes of moderate activity. Used a walking stick for support during transfer assessments.</p>
                      </div>
                      <div>
                        <strong className="text-indigo-600 font-semibold block mb-1">Self-Care</strong>
                        <p className="text-sm">Needs assistance with grooming tasks, specifically fine motor manipulation for buttoning shirts. Independent with feeding but requires adaptive cutlery.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-indigo-600 text-lg">✓</span>
                      <span className="text-xs font-medium text-indigo-600 uppercase tracking-wide">AI Confidence: 94%</span>
                      <span className="text-xs text-slate-400 ml-auto">Sources: Note #4821, Note #4825</span>
                    </div>
                  </div>
                  {/* Action Chips */}
                  <div className="flex gap-2 mt-1 ml-1 overflow-x-auto pb-2">
                    <ActionButton icon={Copy} label="Copy" />
                    <ActionButton icon={RefreshCw} label="Regenerate" />
                    <ActionButton icon={FilePlus} label="Insert to Report" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area (Sticky Bottom) */}
          <div className="flex-none p-4 sm:p-8 pt-2">
            <div className="max-w-4xl mx-auto w-full">
              <div className="relative flex flex-col gap-2 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 transition-shadow focus-within:shadow-xl focus-within:border-indigo-600/50">
                <textarea 
                  className="w-full bg-transparent border-none text-base text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 resize-none py-3 px-4 min-h-[60px]" 
                  placeholder="Type a message or command (e.g. 'Summarize the last session')..." 
                  rows={2}
                ></textarea>
                <div className="flex items-center justify-between px-2 pb-1">
                  <div className="flex items-center gap-1">
                    <IconButton icon={Paperclip} title="Attach file" />
                    <IconButton icon={Mic} title="Voice input" />
                    <IconButton icon={Sparkles} title="Templates" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-xs text-slate-400">Do not input PII unless in Local Mode</span>
                    <button className="flex items-center justify-center w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-colors">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">Quantum AI can make mistakes. Please verify important clinical information.</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Context & Tools) */}
        <aside className="hidden lg:flex w-80 flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex-none z-10 overflow-y-auto">
          <div className="p-5 flex flex-col gap-6">
            {/* AI Status Card */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Models Status</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gemini Pro</span>
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ollama (Local)</span>
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Idle</span>
                </div>
              </div>
            </div>

            {/* Suggested Prompts */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Lightbulb className="text-indigo-600 w-4 h-4" /> Suggested Prompts
              </h3>
              <div className="flex flex-col gap-2">
                <PromptButton title="Generate FCA for [Participant]" desc="Creates a full structure based on recent notes." />
                <PromptButton title="Analyze Sensory Profile" desc="Extracts sensory patterns from observations." />
                <PromptButton title="Draft NDIS Progress Report" desc="Summarizes goal achievement over 6 months." />
              </div>
            </div>

            {/* Recent Generations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="text-indigo-600 w-4 h-4" /> Recent
                </h3>
                <a className="text-xs text-indigo-600 font-medium hover:underline" href="#">View All</a>
              </div>
              <div className="flex flex-col gap-0 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                <RecentItem title="Session Summary: J. Doe" time="2h ago" />
                <RecentItem title="Home Mod Request" time="Yesterday" />
                <RecentItem title="Email Draft: Support Coordinator" time="Oct 23" border={false} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function ActionButton({ icon: Icon, label }: any) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function IconButton({ icon: Icon, title }: any) {
  return (
    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all" title={title}>
      <Icon className="w-5 h-5" />
    </button>
  );
}

function PromptButton({ title, desc }: any) {
  return (
    <button className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-600 hover:shadow-sm bg-white dark:bg-slate-900 transition-all group">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </button>
  );
}

function RecentItem({ title, time, border = true }: any) {
  return (
    <a className={`p-3 ${border ? 'border-b border-slate-200 dark:border-slate-700' : ''} hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`} href="#">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
        <span className="text-[10px] text-slate-400">{time}</span>
      </div>
    </a>
  );
}
