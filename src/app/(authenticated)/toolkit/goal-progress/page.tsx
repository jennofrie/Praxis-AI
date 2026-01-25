"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { 
  ChevronRight, 
  Target, 
  Plus, 
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Edit2
} from "lucide-react";
import Link from "next/link";

type GoalStatus = "not_started" | "in_progress" | "achieved" | "on_hold";

interface Goal {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: GoalStatus;
  sessions: SessionNote[];
  targetDate: string;
  createdAt: string;
}

interface SessionNote {
  id: string;
  date: string;
  note: string;
  progressIndicator: "positive" | "neutral" | "regression";
}

const DOMAINS = ["Self-Care", "Mobility", "Communication", "Social Participation", "Learning", "Employment"];

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: TrendingUp },
  achieved: { label: "Achieved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertCircle },
};

export default function GoalProgress() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Increase independence in meal preparation",
      description: "Participant will prepare 3 simple hot meals per week without physical assistance",
      domain: "Self-Care",
      status: "in_progress",
      targetDate: "2024-06-30",
      createdAt: "2024-01-15",
      sessions: [
        { id: "s1", date: "2024-02-10", note: "Practiced making toast and tea. Required verbal prompts for sequencing.", progressIndicator: "positive" },
        { id: "s2", date: "2024-02-17", note: "Progressed to heating soup. Managed stove safely with supervision.", progressIndicator: "positive" },
      ]
    },
    {
      id: "2",
      title: "Improve community mobility",
      description: "Participant will independently access local shops using public transport",
      domain: "Mobility",
      status: "not_started",
      targetDate: "2024-08-01",
      createdAt: "2024-01-15",
      sessions: []
    }
  ]);

  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<{ title: string; description: string; domain: string; targetDate: string }>({ title: "", description: "", domain: DOMAINS[0] ?? '', targetDate: "" });
  const [newSession, setNewSession] = useState<{ note: string; progressIndicator: "positive" | "neutral" | "regression" }>({ note: "", progressIndicator: "neutral" });

  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      domain: newGoal.domain ?? DOMAINS[0],
      targetDate: newGoal.targetDate,
      status: "not_started",
      sessions: [],
      createdAt: new Date().toISOString().split("T")[0] ?? ''
    };
    
    setGoals([...goals, goal]);
    setNewGoal({ title: "", description: "", domain: DOMAINS[0] ?? '', targetDate: "" });
    setIsAddingGoal(false);
  };

  const updateGoalStatus = (goalId: string, status: GoalStatus) => {
    setGoals(goals.map(g => g.id === goalId ? { ...g, status } : g));
    if (selectedGoal?.id === goalId) {
      setSelectedGoal({ ...selectedGoal, status });
    }
  };

  const addSessionNote = () => {
    if (!selectedGoal || !newSession.note.trim()) return;
    
    const session: SessionNote = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0] ?? '',
      note: newSession.note,
      progressIndicator: newSession.progressIndicator
    };
    
    const updatedGoal = {
      ...selectedGoal,
      sessions: [...selectedGoal.sessions, session]
    };
    
    setGoals(goals.map(g => g.id === selectedGoal.id ? updatedGoal : g));
    setSelectedGoal(updatedGoal);
    setNewSession({ note: "", progressIndicator: "neutral" });
  };

  const deleteGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
    if (selectedGoal?.id === goalId) {
      setSelectedGoal(null);
    }
  };

  const generateProgressReport = () => {
    let report = `# Goal Progress Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    report += `---\n\n`;
    
    goals.forEach(goal => {
      const statusConfig = STATUS_CONFIG[goal.status];
      report += `## ${goal.title}\n`;
      report += `**Domain:** ${goal.domain}\n`;
      report += `**Status:** ${statusConfig.label}\n`;
      report += `**Target Date:** ${goal.targetDate || "Not set"}\n\n`;
      report += `**Description:** ${goal.description}\n\n`;
      
      if (goal.sessions.length > 0) {
        report += `### Session Notes\n`;
        goal.sessions.forEach(s => {
          const indicator = s.progressIndicator === "positive" ? "📈" : s.progressIndicator === "regression" ? "📉" : "➡️";
          report += `- **${s.date}** ${indicator}: ${s.note}\n`;
        });
      }
      
      report += `\n---\n\n`;
    });
    
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Goal_Progress_${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const achievedCount = goals.filter(g => g.status === "achieved").length;
  const inProgressCount = goals.filter(g => g.status === "in_progress").length;

  return (
    <>
      <Header title="Goal Progress" />
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400">
            <Link href="/toolkit" className="hover:text-indigo-600 transition-colors">Toolkit</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="font-semibold text-slate-900 dark:text-white">Goal Progress Tracker</span>
          </nav>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">NDIS Goal Progress</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Track participant goals and session outcomes aligned with NDIS plan objectives.
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={generateProgressReport}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Download className="w-4 h-4" /> Export Report
              </button>
              <button 
                onClick={() => setIsAddingGoal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Goal
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{goals.length}</div>
              <div className="text-sm text-slate-500">Total Goals</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
              <div className="text-sm text-slate-500">In Progress</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-emerald-600">{achievedCount}</div>
              <div className="text-sm text-slate-500">Achieved</div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-2xl font-bold text-indigo-600">
                {goals.length > 0 ? Math.round((achievedCount / goals.length) * 100) : 0}%
              </div>
              <div className="text-sm text-slate-500">Completion Rate</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Goals List */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" /> Goals
              </h3>
              
              {/* Add Goal Form */}
              {isAddingGoal && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-indigo-200 dark:border-indigo-800 p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Goal title (SMART format)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Description..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm resize-none h-20"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  />
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                    value={newGoal.domain}
                    onChange={(e) => setNewGoal({ ...newGoal, domain: e.target.value })}
                  >
                    {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={addGoal}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
                    >
                      Save Goal
                    </button>
                    <button 
                      onClick={() => setIsAddingGoal(false)}
                      className="px-4 py-2 text-slate-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Goals Cards */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {goals.map((goal) => {
                  return (
                    <div
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedGoal?.id === goal.id 
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700" 
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CONFIG[goal.status].color}`}>
                          {STATUS_CONFIG[goal.status].label}
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteGoal(goal.id); }}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 line-clamp-2">
                        {goal.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{goal.domain}</span>
                        <span>{goal.sessions.length} sessions</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Goal Detail */}
            <div className="lg:col-span-2">
              {!selectedGoal ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 min-h-[500px] flex flex-col items-center justify-center text-slate-400">
                  <Target className="w-12 h-12 mb-4 opacity-50" />
                  <p>Select a goal to view details and add session notes</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                  {/* Goal Header */}
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedGoal.title}</h2>
                      <select
                        value={selectedGoal.status}
                        onChange={(e) => updateGoalStatus(selectedGoal.id, e.target.value as GoalStatus)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_CONFIG[selectedGoal.status].color}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{selectedGoal.description}</p>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500">
                      <span>Domain: <strong>{selectedGoal.domain}</strong></span>
                      <span>Target: <strong>{selectedGoal.targetDate || "Not set"}</strong></span>
                      <span>Created: <strong>{selectedGoal.createdAt}</strong></span>
                    </div>
                  </div>

                  {/* Add Session Note */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Edit2 className="w-4 h-4" /> Add Session Note
                    </h3>
                    <textarea
                      placeholder="Record session observations, progress indicators, and next steps..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm resize-none h-24"
                      value={newSession.note}
                      onChange={(e) => setNewSession({ ...newSession, note: e.target.value })}
                    />
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex gap-2">
                        {(["positive", "neutral", "regression"] as const).map((indicator) => (
                          <button
                            key={indicator}
                            onClick={() => setNewSession({ ...newSession, progressIndicator: indicator })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              newSession.progressIndicator === indicator
                                ? indicator === "positive" ? "bg-emerald-100 text-emerald-700" 
                                  : indicator === "regression" ? "bg-red-100 text-red-700"
                                  : "bg-slate-200 text-slate-700"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            {indicator === "positive" ? "📈 Progress" : indicator === "regression" ? "📉 Regression" : "➡️ Neutral"}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={addSessionNote}
                        disabled={!newSession.note.trim()}
                        className="ml-auto px-4 py-2 bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg text-sm font-medium"
                      >
                        Add Note
                      </button>
                    </div>
                  </div>

                  {/* Session History */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">Session History</h3>
                    {selectedGoal.sessions.length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No session notes yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {selectedGoal.sessions.slice().reverse().map((session) => (
                          <div key={session.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-500">{session.date}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                session.progressIndicator === "positive" ? "bg-emerald-100 text-emerald-700"
                                : session.progressIndicator === "regression" ? "bg-red-100 text-red-700"
                                : "bg-slate-200 text-slate-600"
                              }`}>
                                {session.progressIndicator === "positive" ? "📈 Progress" 
                                 : session.progressIndicator === "regression" ? "📉 Regression" 
                                 : "➡️ Neutral"}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{session.note}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
