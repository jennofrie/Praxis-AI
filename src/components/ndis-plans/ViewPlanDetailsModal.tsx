"use client";

import { useState, useEffect } from "react";
import {
  X,
  Target,
  Calendar,
  DollarSign,
  User,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  ArrowRight,
} from "lucide-react";

interface NDISGoal {
  id: string;
  goalNumber: number;
  title: string;
  description: string;
  category: string;
  currentSituation?: string;
  desiredOutcome?: string;
  strategies?: string[];
  supportCategories?: string[];
  targetDate?: string;
  progress?: 'not-started' | 'in-progress' | 'achieved';
}

interface AIStrategy {
  goalId: string;
  actionSteps: string[];
  timeframe: string;
  measurableOutcome: string;
  resourcesNeeded?: string[];
}

interface FundingBreakdown {
  total: number;
  core: number;
  capacityBuilding: number;
  capital: number;
}

interface NDISPlanData {
  id: string;
  participant_id: string;
  participant_name: string;
  ndis_number: string;
  plan_start_date: string;
  plan_end_date: string;
  plan_management_type: string;
  funding_total: number;
  funding_core: number;
  funding_capacity_building: number;
  funding_capital: number;
  goals: NDISGoal[];
  support_coordinator_name?: string;
  plan_manager_name?: string;
  status: string;
}

interface ViewPlanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: NDISPlanData | null;
}

export function ViewPlanDetailsModal({ isOpen, onClose, plan }: ViewPlanDetailsModalProps) {
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [aiStrategies, setAiStrategies] = useState<Record<string, AIStrategy>>({});
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const [strategiesGenerated, setStrategiesGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with new plan
  useEffect(() => {
    if (isOpen && plan) {
      setExpandedGoals(new Set());
      setAiStrategies({});
      setStrategiesGenerated(false);
      setError(null);
    }
  }, [isOpen, plan?.id]);

  if (!isOpen || !plan) return null;

  const toggleGoal = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const generateAIStrategies = async () => {
    if (!plan.goals || plan.goals.length === 0) {
      setError("No goals available to generate strategies for.");
      return;
    }

    setLoadingStrategies(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/ndis-goal-strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goals: plan.goals,
          participantContext: {
            name: plan.participant_name,
            planDuration: `${plan.plan_start_date} to ${plan.plan_end_date}`,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate strategies");
      }

      const data = await response.json();

      // Map strategies by goal ID
      const strategiesMap: Record<string, AIStrategy> = {};
      if (data.goalsWithStrategies) {
        data.goalsWithStrategies.forEach((gs: { goalId: string } & AIStrategy) => {
          strategiesMap[gs.goalId] = gs;
        });
      }

      setAiStrategies(strategiesMap);
      setStrategiesGenerated(true);

      // Expand all goals to show strategies
      setExpandedGoals(new Set(plan.goals.map((g) => g.id)));
    } catch (err) {
      console.error("Error generating strategies:", err);
      setError(err instanceof Error ? err.message : "Failed to generate strategies");
    } finally {
      setLoadingStrategies(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProgressIcon = (progress?: string) => {
    switch (progress) {
      case "achieved":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  const getProgressLabel = (progress?: string) => {
    switch (progress) {
      case "achieved":
        return "Achieved";
      case "in-progress":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">NDIS Plan Details</h2>
              <p className="text-indigo-100 text-sm">{plan.participant_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Plan Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <User className="w-4 h-4" />
                NDIS Number
              </div>
              <p className="font-mono font-bold text-slate-900 dark:text-white">
                {plan.ndis_number}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <Calendar className="w-4 h-4" />
                Plan Period
              </div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">
                {formatDate(plan.plan_start_date)} - {formatDate(plan.plan_end_date)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Total Funding
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(plan.funding_total)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
                <Target className="w-4 h-4" />
                Goals
              </div>
              <p className="font-bold text-slate-900 dark:text-white">
                {plan.goals?.length || 0} Goals
              </p>
            </div>
          </div>

          {/* Funding Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Funding Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-1">
                  Core Supports
                </p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(plan.funding_core)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">
                  Capacity Building
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(plan.funding_capacity_building)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium mb-1">
                  Capital Supports
                </p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(plan.funding_capital)}
                </p>
              </div>
            </div>
          </div>

          {/* NDIS Goals Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                NDIS Goals & Strategies
              </h3>
              {!strategiesGenerated && (
                <button
                  onClick={generateAIStrategies}
                  disabled={loadingStrategies}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {loadingStrategies ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate AI Strategies
                    </>
                  )}
                </button>
              )}
              {strategiesGenerated && (
                <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  AI Strategies Generated
                </span>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Goals List */}
            <div className="space-y-4">
              {plan.goals && plan.goals.length > 0 ? (
                plan.goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                  >
                    {/* Goal Header */}
                    <button
                      onClick={() => toggleGoal(goal.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {goal.goalNumber}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {goal.title}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {goal.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-sm">
                          {getProgressIcon(goal.progress)}
                          <span className="text-slate-600 dark:text-slate-400">
                            {getProgressLabel(goal.progress)}
                          </span>
                        </div>
                        {expandedGoals.has(goal.id) ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Goal Details (Expanded) */}
                    {expandedGoals.has(goal.id) && (
                      <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
                        {/* Description */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Goal Description
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 text-sm">
                            {goal.description}
                          </p>
                        </div>

                        {/* Current Situation & Desired Outcome */}
                        {(goal.currentSituation || goal.desiredOutcome) && (
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {goal.currentSituation && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                  Current Situation
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {goal.currentSituation}
                                </p>
                              </div>
                            )}
                            {goal.desiredOutcome && (
                              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                  Desired Outcome
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  {goal.desiredOutcome}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Plan Strategies (from document) */}
                        {goal.strategies && goal.strategies.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Strategies from Plan
                            </p>
                            <ul className="space-y-2">
                              {goal.strategies.map((strategy, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400"
                                >
                                  <ArrowRight className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                                  {strategy}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Support Categories */}
                        {goal.supportCategories && goal.supportCategories.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Linked Support Categories
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {goal.supportCategories.map((cat, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium"
                                >
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* AI Generated Strategies */}
                        {aiStrategies[goal.id] && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                AI-Generated Achievable Strategies
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                              {/* Action Steps */}
                              <div className="mb-3">
                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                                  Recommended Action Steps
                                </p>
                                <ul className="space-y-2">
                                  {aiStrategies[goal.id].actionSteps.map((step, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                                    >
                                      <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300 text-xs font-medium shrink-0">
                                        {idx + 1}
                                      </span>
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Timeframe & Outcome */}
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2">
                                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                    Suggested Timeframe
                                  </p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {aiStrategies[goal.id].timeframe}
                                  </p>
                                </div>
                                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-2">
                                  <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                    Measurable Outcome
                                  </p>
                                  <p className="text-sm text-slate-700 dark:text-slate-300">
                                    {aiStrategies[goal.id].measurableOutcome}
                                  </p>
                                </div>
                              </div>

                              {/* Resources Needed */}
                              {aiStrategies[goal.id].resourcesNeeded &&
                                aiStrategies[goal.id].resourcesNeeded!.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                      Resources/Supports Needed
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {aiStrategies[goal.id].resourcesNeeded!.map((res, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 bg-white/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs"
                                        >
                                          {res}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No goals found in this plan.</p>
                </div>
              )}
            </div>
          </div>

          {/* Support Contacts */}
          {(plan.support_coordinator_name || plan.plan_manager_name) && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Support Contacts
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {plan.support_coordinator_name && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Support Coordinator
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {plan.support_coordinator_name}
                    </p>
                  </div>
                )}
                {plan.plan_manager_name && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      Plan Manager
                    </p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {plan.plan_manager_name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
