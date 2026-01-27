"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import {
  Calculator,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  BarChart3,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";

interface CategoryData {
  budget: string;
  spent: string;
}

interface CategoryResult {
  label: string;
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  safeRunRate: number;
  actualRunRate: number;
  isOverspent: boolean;
  projectedDepletion: Date | null;
  color: string;
}

interface ForecastResult {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDays: number;
  safeRunRate: number;
  actualRunRate: number;
  isOverBudget: boolean;
  projectedDepletionDate: Date | null;
  planEndDate: Date;
  categories: CategoryResult[];
}

export default function BudgetForecaster() {
  const [totalBudget, setTotalBudget] = useState("");
  const [totalSpent, setTotalSpent] = useState("");
  const [planStartDate, setPlanStartDate] = useState("");
  const [planEndDate, setPlanEndDate] = useState("");
  const [core, setCore] = useState<CategoryData>({ budget: "", spent: "" });
  const [capacity, setCapacity] = useState<CategoryData>({ budget: "", spent: "" });
  const [capital, setCapital] = useState<CategoryData>({ budget: "", spent: "" });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForecastResult | null>(null);

  const parseNum = (val: string): number => {
    const cleaned = val.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  };

  const handleCalculate = useCallback(() => {
    setError(null);

    const budget = parseNum(totalBudget);
    const spent = parseNum(totalSpent);

    if (budget <= 0) {
      setError("Please enter a valid total budget amount.");
      return;
    }
    if (!planStartDate || !planEndDate) {
      setError("Please enter both plan start and end dates.");
      return;
    }

    const start = new Date(planStartDate);
    const end = new Date(planEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end <= start) {
      setError("Plan end date must be after start date.");
      return;
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    const remaining = budget - spent;
    const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
    const safeRunRate = daysRemaining > 0 ? remaining / daysRemaining : 0;
    const actualRunRate = daysElapsed > 0 ? spent / daysElapsed : 0;
    const isOverBudget = actualRunRate > safeRunRate && safeRunRate > 0;

    let projectedDepletionDate: Date | null = null;
    if (actualRunRate > 0 && remaining > 0) {
      const daysUntilDepleted = remaining / actualRunRate;
      projectedDepletionDate = new Date(today.getTime() + daysUntilDepleted * 1000 * 60 * 60 * 24);
    }

    const buildCategory = (label: string, cat: CategoryData, colorName: string): CategoryResult => {
      const catBudget = parseNum(cat.budget);
      const catSpent = parseNum(cat.spent);
      const catRemaining = catBudget - catSpent;
      const catPercent = catBudget > 0 ? (catSpent / catBudget) * 100 : 0;
      const catSafe = daysRemaining > 0 ? catRemaining / daysRemaining : 0;
      const catActual = daysElapsed > 0 ? catSpent / daysElapsed : 0;
      const catIsOverspent = catSpent > catBudget;

      let catDepletion: Date | null = null;
      if (catActual > 0 && catRemaining > 0) {
        const d = catRemaining / catActual;
        catDepletion = new Date(today.getTime() + d * 1000 * 60 * 60 * 24);
      }

      return {
        label,
        budget: catBudget,
        spent: catSpent,
        remaining: catRemaining,
        percentUsed: catPercent,
        safeRunRate: catSafe,
        actualRunRate: catActual,
        isOverspent: catIsOverspent,
        projectedDepletion: catDepletion,
        color: colorName,
      };
    };

    const categories: CategoryResult[] = [];
    if (parseNum(core.budget) > 0) categories.push(buildCategory("Core Supports", core, "blue"));
    if (parseNum(capacity.budget) > 0) categories.push(buildCategory("Capacity Building", capacity, "purple"));
    if (parseNum(capital.budget) > 0) categories.push(buildCategory("Capital Supports", capital, "emerald"));

    setResult({
      totalBudget: budget,
      totalSpent: spent,
      totalRemaining: remaining,
      percentUsed,
      daysElapsed,
      daysRemaining,
      totalDays,
      safeRunRate,
      actualRunRate,
      isOverBudget,
      projectedDepletionDate,
      planEndDate: end,
      categories,
    });
  }, [totalBudget, totalSpent, planStartDate, planEndDate, core, capacity, capital]);

  const resetForm = useCallback(() => {
    setTotalBudget("");
    setTotalSpent("");
    setPlanStartDate("");
    setPlanEndDate("");
    setCore({ budget: "", spent: "" });
    setCapacity({ budget: "", spent: "" });
    setCapital({ budget: "", spent: "" });
    setResult(null);
    setError(null);
  }, []);

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(val);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
  };

  return (
    <>
      <Header title="Budget Forecaster" />

      <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">
        <div className="mb-6">
          <Link href="/sc-toolkit" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to SC Toolkit
          </Link>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-6 h-6 text-emerald-600" />
              Budget Forecaster
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track NDIS budget run rates and forecast depletion dates. All calculations done locally.
            </p>
          </div>

          {/* Input Form */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            {/* Total Budget & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Budget ($)</label>
                <input
                  type="text"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="e.g., 120000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Total Spent ($)</label>
                <input
                  type="text"
                  value={totalSpent}
                  onChange={(e) => setTotalSpent(e.target.value)}
                  placeholder="e.g., 45000"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan Start Date</label>
                <input
                  type="date"
                  value={planStartDate}
                  onChange={(e) => setPlanStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Plan End Date</label>
                <input
                  type="date"
                  value={planEndDate}
                  onChange={(e) => setPlanEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Category Breakdown */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Category Breakdown (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Core */}
                <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase">Core Supports</h4>
                  <input type="text" value={core.budget} onChange={(e) => setCore((p) => ({ ...p, budget: e.target.value }))} placeholder="Budget $" className="w-full px-2 py-1.5 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
                  <input type="text" value={core.spent} onChange={(e) => setCore((p) => ({ ...p, spent: e.target.value }))} placeholder="Spent $" className="w-full px-2 py-1.5 rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500" />
                </div>
                {/* Capacity */}
                <div className="space-y-2 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">Capacity Building</h4>
                  <input type="text" value={capacity.budget} onChange={(e) => setCapacity((p) => ({ ...p, budget: e.target.value }))} placeholder="Budget $" className="w-full px-2 py-1.5 rounded border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500" />
                  <input type="text" value={capacity.spent} onChange={(e) => setCapacity((p) => ({ ...p, spent: e.target.value }))} placeholder="Spent $" className="w-full px-2 py-1.5 rounded border border-purple-200 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500" />
                </div>
                {/* Capital */}
                <div className="space-y-2 p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">Capital Supports</h4>
                  <input type="text" value={capital.budget} onChange={(e) => setCapital((p) => ({ ...p, budget: e.target.value }))} placeholder="Budget $" className="w-full px-2 py-1.5 rounded border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
                  <input type="text" value={capital.spent} onChange={(e) => setCapital((p) => ({ ...p, spent: e.target.value }))} placeholder="Spent $" className="w-full px-2 py-1.5 rounded border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={handleCalculate}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <Calculator className="w-5 h-5" />
                Calculate Forecast
              </button>
              {result && (
                <button onClick={resetForm} className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Results Dashboard */}
          {result && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard icon={DollarSign} label="Total Budget" value={formatCurrency(result.totalBudget)} color="emerald" />
                <SummaryCard icon={TrendingDown} label="Total Spent" value={formatCurrency(result.totalSpent)} color="amber" />
                <SummaryCard icon={DollarSign} label="Remaining" value={formatCurrency(result.totalRemaining)} color={result.totalRemaining >= 0 ? "blue" : "red"} />
                <SummaryCard icon={BarChart3} label="Used" value={`${result.percentUsed.toFixed(1)}%`} color={result.percentUsed > 100 ? "red" : result.percentUsed > 80 ? "amber" : "emerald"} />
              </div>

              {/* Run Rate & Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Run Rate Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" /> Run Rate Analysis
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Safe Daily Rate</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(result.safeRunRate)}/day</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Actual Daily Rate</span>
                      <span className={`text-sm font-bold ${result.isOverBudget ? "text-red-600" : "text-blue-600"}`}>
                        {formatCurrency(result.actualRunRate)}/day
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg ${result.isOverBudget ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"}`}>
                      <div className="flex items-center gap-2">
                        {result.isOverBudget ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
                        <span className={`text-sm font-medium ${result.isOverBudget ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                          {result.isOverBudget ? "Over Budget - Spending faster than safe rate" : "On Track - Within safe spending rate"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Plan Timeline
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Days Elapsed</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{result.daysElapsed} / {result.totalDays}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-blue-500 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min((result.daysElapsed / result.totalDays) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{result.daysElapsed} elapsed</span>
                      <span>{result.daysRemaining} remaining</span>
                    </div>

                    {result.projectedDepletionDate && (
                      <div className={`p-3 rounded-lg ${result.projectedDepletionDate < result.planEndDate ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800" : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"}`}>
                        <div className="flex items-center gap-2">
                          {result.projectedDepletionDate < result.planEndDate ? (
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <div>
                            <span className={`text-sm font-medium block ${result.projectedDepletionDate < result.planEndDate ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                              Projected Depletion: {formatDate(result.projectedDepletionDate)}
                            </span>
                            {result.projectedDepletionDate < result.planEndDate && (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Budget may run out before plan ends ({formatDate(result.planEndDate)})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              {result.categories.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.categories.map((cat) => (
                      <CategoryCard key={cat.label} category={cat} formatCurrency={formatCurrency} formatDate={formatDate} planEndDate={result.planEndDate} />
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 shrink-0" />
                All calculations are performed locally in your browser. No data is sent to any server.
              </div>

              <div className="flex justify-end">
                <button onClick={resetForm} className="flex items-center gap-1 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                  Clear Results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
    amber: "bg-amber-50 dark:bg-amber-900/20",
    blue: "bg-blue-50 dark:bg-blue-900/20",
    red: "bg-red-50 dark:bg-red-900/20",
  };
  const iconColors: Record<string, string> = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    red: "text-red-600",
  };

  return (
    <div className={`${bgColors[color] || bgColors.blue} rounded-xl p-4 border border-slate-200 dark:border-slate-800`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${iconColors[color] || iconColors.blue}`} />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function CategoryCard({
  category,
  formatCurrency,
  formatDate,
  planEndDate,
}: {
  category: CategoryResult;
  formatCurrency: (v: number) => string;
  formatDate: (d: Date) => string;
  planEndDate: Date;
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; bar: string }> = {
    blue: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", text: "text-blue-700 dark:text-blue-300", bar: "bg-blue-500" },
    purple: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-200 dark:border-purple-800", text: "text-purple-700 dark:text-purple-300", bar: "bg-purple-500" },
    emerald: { bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500" },
  };

  const c = colorMap[category.color] ?? colorMap["blue"];

  return (
    <div className={`${c?.bg} rounded-xl border ${c?.border} p-4 space-y-3`}>
      <h4 className={`text-sm font-bold ${c?.text}`}>{category.label}</h4>
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Budget</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(category.budget)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Spent</span>
          <span className="font-medium text-slate-900 dark:text-white">{formatCurrency(category.spent)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 dark:text-slate-400">Remaining</span>
          <span className={`font-bold ${category.remaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatCurrency(category.remaining)}
          </span>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">{category.percentUsed.toFixed(1)}% used</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`${c?.bar} h-2 rounded-full transition-all ${category.percentUsed > 100 ? "bg-red-500" : ""}`}
            style={{ width: `${Math.min(category.percentUsed, 100)}%` }}
          />
        </div>
      </div>
      {category.isOverspent && (
        <div className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" />
          Overspent
        </div>
      )}
      {category.projectedDepletion && category.projectedDepletion < planEndDate && (
        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          Depletes {formatDate(category.projectedDepletion)}
        </div>
      )}
    </div>
  );
}
