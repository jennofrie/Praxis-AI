"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { LinkPlanModal } from "@/components/ndis-plans/LinkPlanModal";
import { ViewPlanDetailsModal } from "@/components/ndis-plans/ViewPlanDetailsModal";
import { createClient } from "@/lib/supabase/client";
import {
  Search, Plus, Filter, SortAsc, FolderOpen, AlertTriangle, DollarSign,
  BarChart2, TrendingUp, MoreHorizontal, ArrowRight, TrendingDown, Bell,
  Mail, FileText, Edit, Loader2, RefreshCw
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

interface NDISPlanDB {
  id: string;
  participant_id: string;
  plan_number: string;
  start_date: string;
  end_date: string;
  plan_type: string;
  total_budget: number;
  core_budget: number;
  capacity_building_budget: number;
  capital_budget: number;
  goals: NDISGoal[];
  status: string;
  created_at: string;
  participants?: {
    id: string;
    first_name: string;
    last_name: string;
    ndis_number: string;
  };
}

interface PlanCardData {
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
  status: string;
  daysRemaining: number;
  core_percent: number;
  capacity_percent: number;
  capital_percent: number;
}

export default function NDISPlans() {
  const [plans, setPlans] = useState<PlanCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCardData | null>(null);

  const supabase = createClient();

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: plansData, error: plansError } = await supabase
        .from('ndis_plans')
        .select(`
          id,
          participant_id,
          plan_number,
          start_date,
          end_date,
          plan_type,
          total_budget,
          core_budget,
          capacity_building_budget,
          capital_budget,
          goals,
          status,
          created_at,
          participants (
            id,
            first_name,
            last_name,
            ndis_number
          )
        `)
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;

      // Transform data for display
      const transformedPlans: PlanCardData[] = (plansData || []).map((plan: NDISPlanDB) => {
        const today = new Date();
        const endDate = new Date(plan.end_date);
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        const totalBudget = plan.total_budget || 0;
        const coreUsed = 0; // TODO: Calculate from claims/sessions
        const capacityUsed = 0;
        const capitalUsed = 0;

        return {
          id: plan.id,
          participant_id: plan.participant_id,
          participant_name: plan.participants
            ? `${plan.participants.first_name} ${plan.participants.last_name}`.trim()
            : 'Unknown',
          ndis_number: plan.participants?.ndis_number || plan.plan_number,
          plan_start_date: plan.start_date,
          plan_end_date: plan.end_date,
          plan_management_type: plan.plan_type,
          funding_total: totalBudget,
          funding_core: plan.core_budget || 0,
          funding_capacity_building: plan.capacity_building_budget || 0,
          funding_capital: plan.capital_budget || 0,
          goals: plan.goals || [],
          status: plan.status,
          daysRemaining,
          core_percent: plan.core_budget ? Math.round((coreUsed / plan.core_budget) * 100) : 0,
          capacity_percent: plan.capacity_building_budget ? Math.round((capacityUsed / plan.capacity_building_budget) * 100) : 0,
          capital_percent: plan.capital_budget ? Math.round((capitalUsed / plan.capital_budget) * 100) : 0,
        };
      });

      setPlans(transformedPlans);
    } catch (err) {
      console.error('Error loading plans:', JSON.stringify(err), err);
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to load plans';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleViewDetails = (plan: PlanCardData) => {
    setSelectedPlan(plan);
    setIsViewModalOpen(true);
  };

  const handleLinkSuccess = () => {
    loadPlans();
  };

  // Filter plans based on search
  const filteredPlans = plans.filter(plan =>
    plan.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.ndis_number.includes(searchQuery)
  );

  // Calculate metrics
  const activePlans = plans.filter(p => p.status === 'active').length;
  const expiringPlans = plans.filter(p => p.daysRemaining > 0 && p.daysRemaining <= 30).length;
  const totalFunding = plans.reduce((sum, p) => sum + p.funding_total, 0);
  const avgUtilization = plans.length > 0
    ? Math.round(plans.reduce((sum, p) => sum + ((p.core_percent + p.capacity_percent + p.capital_percent) / 3), 0) / plans.length)
    : 0;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}k`;
    }
    return `$${amount}`;
  };

  return (
    <>
      <Header title="NDIS Plans" />

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-[1600px] mx-auto h-full flex flex-col gap-8">
          {/* Page Header & Metrics */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">NDIS Plans</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage participant funding and track budget utilization.</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-slate-400 w-5 h-5" />
                  </div>
                  <input
                    className="block w-full md:w-64 pl-10 pr-3 py-2.5 border-none rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 shadow-sm text-sm"
                    placeholder="Search by name or NDIS #"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsLinkModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Link New Plan
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Active Plans"
                value={activePlans.toString()}
                trend={plans.length > 0 ? `of ${plans.length}` : undefined}
                icon={FolderOpen}
                iconColor="text-indigo-600"
              />
              <MetricCard
                title="Expiring (30 days)"
                value={expiringPlans.toString()}
                subtext="require review"
                icon={AlertTriangle}
                iconColor="text-amber-500"
                valueColor={expiringPlans > 0 ? "text-amber-600 dark:text-amber-500" : undefined}
              />
              <MetricCard
                title="Total Funding Managed"
                value={formatCurrency(totalFunding)}
                icon={DollarSign}
                iconColor="text-indigo-600"
              />
              <MetricCard
                title="Avg. Utilization"
                value={`${avgUtilization}%`}
                trend={avgUtilization > 50 ? "On Track" : undefined}
                trendUp={avgUtilization > 50}
                icon={BarChart2}
                iconColor="text-blue-500"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <button
                onClick={loadPlans}
                className="ml-auto flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {/* Split Layout: Main Grid + Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6 h-full pb-8">
            {/* Left: Plan Cards Grid */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery ? `Search Results (${filteredPlans.length})` : 'Active Participants'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadPlans}
                    disabled={loading}
                    className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                    <Filter className="w-5 h-5" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                    <SortAsc className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">Loading plans...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && filteredPlans.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <FolderOpen className="w-12 h-12 text-slate-400 mb-4" />
                  <h4 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {searchQuery ? 'No matching plans found' : 'No NDIS plans yet'}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 text-center max-w-md">
                    {searchQuery
                      ? 'Try adjusting your search terms'
                      : 'Upload an NDIS plan PDF to get started. AI will automatically extract participant details, funding, and goals.'}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={() => setIsLinkModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Link Your First Plan
                    </button>
                  )}
                </div>
              )}

              {/* Plans Grid */}
              {!loading && filteredPlans.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredPlans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      name={plan.participant_name}
                      ndis={plan.ndis_number}
                      dates={`${formatDate(plan.plan_start_date)} - ${formatDate(plan.plan_end_date)}`}
                      status={getStatusLabel(plan.daysRemaining, plan.status)}
                      statusColor={getStatusColor(plan.daysRemaining, plan.status)}
                      core={{
                        used: Math.round((plan.funding_core * plan.core_percent) / 100 / 1000),
                        total: Math.round(plan.funding_core / 1000),
                        percent: plan.core_percent
                      }}
                      capacity={{
                        used: Math.round((plan.funding_capacity_building * plan.capacity_percent) / 100 / 1000),
                        total: Math.round(plan.funding_capacity_building / 1000),
                        percent: plan.capacity_percent
                      }}
                      capital={{
                        used: Math.round((plan.funding_capital * plan.capital_percent) / 100 / 1000),
                        total: Math.round(plan.funding_capital / 1000),
                        percent: plan.capital_percent
                      }}
                      goalsCount={plan.goals?.length || 0}
                      onViewDetails={() => handleViewDetails(plan)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar (30%) */}
            <aside className="w-full lg:w-[360px] flex flex-col gap-6 shrink-0">
              {/* Plan Alerts */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Bell className="text-amber-500 w-5 h-5" />
                  Plan Alerts
                </h3>
                <div className="flex flex-col gap-3">
                  {plans
                    .filter(p => p.daysRemaining > 0 && p.daysRemaining <= 30)
                    .slice(0, 3)
                    .map((plan) => (
                      <AlertItem
                        key={plan.id}
                        title={`Review ${plan.participant_name.split(' ')[0]}'s Plan`}
                        desc={`Plan expires in ${plan.daysRemaining} days. Schedule review.`}
                        type="warning"
                      />
                    ))}
                  {plans.filter(p => p.core_percent >= 90).slice(0, 2).map((plan) => (
                    <AlertItem
                      key={`low-${plan.id}`}
                      title={`${plan.participant_name.split(' ')[0]}'s Funds Low`}
                      desc={`Core budget at ${plan.core_percent}% utilization.`}
                      type="critical"
                    />
                  ))}
                  {plans.filter(p => p.daysRemaining > 0 && p.daysRemaining <= 30).length === 0 &&
                   plans.filter(p => p.core_percent >= 90).length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      No alerts at this time
                    </p>
                  )}
                </div>
              </div>

              {/* Funding Overview Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Funding Overview</h3>
                  <button className="text-slate-400 hover:text-indigo-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-col items-center justify-center py-4 relative">
                  {/* CSS Donut Chart */}
                  {totalFunding > 0 ? (
                    <>
                      <div
                        className="relative w-40 h-40 rounded-full"
                        style={{
                          background: `conic-gradient(
                            #4F46E5 0% ${Math.round(plans.reduce((s, p) => s + p.funding_core, 0) / totalFunding * 100)}%,
                            #60a5fa ${Math.round(plans.reduce((s, p) => s + p.funding_core, 0) / totalFunding * 100)}% ${Math.round((plans.reduce((s, p) => s + p.funding_core, 0) + plans.reduce((s, p) => s + p.funding_capacity_building, 0)) / totalFunding * 100)}%,
                            #a5b4fc ${Math.round((plans.reduce((s, p) => s + p.funding_core, 0) + plans.reduce((s, p) => s + p.funding_capacity_building, 0)) / totalFunding * 100)}% 100%
                          )`
                        }}
                      >
                        <div className="absolute inset-4 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(totalFunding)}</span>
                          <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wide">Total</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-40 h-40 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-slate-400 text-sm">No data</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <LegendItem
                    label="Core Supports"
                    value={totalFunding > 0 ? `${Math.round(plans.reduce((s, p) => s + p.funding_core, 0) / totalFunding * 100)}%` : '0%'}
                    color="bg-indigo-600"
                  />
                  <LegendItem
                    label="Capacity Building"
                    value={totalFunding > 0 ? `${Math.round(plans.reduce((s, p) => s + p.funding_capacity_building, 0) / totalFunding * 100)}%` : '0%'}
                    color="bg-blue-400"
                  />
                  <LegendItem
                    label="Capital"
                    value={totalFunding > 0 ? `${Math.round(plans.reduce((s, p) => s + p.funding_capital, 0) / totalFunding * 100)}%` : '0%'}
                    color="bg-indigo-300"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <QuickActionButton icon={FileText} label="Generate Report" />
                  <QuickActionButton icon={Edit} label="Update Budget" />
                  <QuickActionButton icon={Mail} label="Email Participants" />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Modals */}
      <LinkPlanModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={handleLinkSuccess}
      />
      <ViewPlanDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
      />
    </>
  );
}

// Helper functions
function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

function getStatusLabel(daysRemaining: number, status: string): string {
  if (status !== 'active') return status.charAt(0).toUpperCase() + status.slice(1);
  if (daysRemaining <= 0) return 'Expired';
  if (daysRemaining <= 14) return `${daysRemaining} Days Left`;
  if (daysRemaining <= 30) return `${daysRemaining} Days Left`;
  return 'Active';
}

function getStatusColor(daysRemaining: number, status: string): 'amber' | 'emerald' | 'red' {
  if (status !== 'active') return 'red';
  if (daysRemaining <= 0) return 'red';
  if (daysRemaining <= 30) return 'amber';
  return 'emerald';
}

// Components
function MetricCard({ title, value, subtext, trend, trendUp, icon: Icon, iconColor, valueColor }: {
  title: string;
  value: string;
  subtext?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className={`w-16 h-16 ${iconColor}`} />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${valueColor || "text-slate-900 dark:text-white"}`}>{value}</span>
        {trend && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center mb-1 ${trendUp ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-400"}`}>
            {trendUp && <TrendingUp className="w-3 h-3 mr-0.5" />} {trend}
          </span>
        )}
        {subtext && <span className="text-slate-400 text-xs mb-1">{subtext}</span>}
      </div>
    </div>
  );
}

function PlanCard({ name, ndis, dates, status, statusColor, core, capacity, capital, goalsCount, onViewDetails }: {
  name: string;
  ndis: string;
  dates: string;
  status: string;
  statusColor: 'amber' | 'emerald' | 'red';
  core: { used: number; total: number; percent: number; critical?: boolean };
  capacity: { used: number; total: number; percent: number };
  capital: { used: number; total: number; percent: number };
  goalsCount: number;
  onViewDetails: () => void;
}) {
  const statusStyles: Record<string, string> = {
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    red: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  };

  const statusDots: Record<string, string> = {
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
  };

  // Generate initials for avatar
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['bg-indigo-500', 'bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-pink-500'];
  const avatarColor = avatarColors[name.charCodeAt(0) % avatarColors.length];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold`}>
            {initials}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">NDIS #{ndis}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${statusStyles[statusColor]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDots[statusColor]}`}></span>
          {status}
        </span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <span>Plan Dates:</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{dates}</span>
      </div>
      <div className="flex flex-col gap-3">
        <FundingBar label="Core" data={core} color="bg-indigo-600" />
        <FundingBar label="Capacity" data={capacity} color="bg-blue-400" />
        <FundingBar label="Capital" data={capital} color="bg-indigo-300" />
      </div>
      {goalsCount > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {goalsCount} goal{goalsCount !== 1 ? 's' : ''} linked
        </div>
      )}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <button
          onClick={onViewDetails}
          className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1"
        >
          View Details <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function FundingBar({ label, data, color }: {
  label: string;
  data: { used: number; total: number; percent: number; critical?: boolean };
  color: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`${data.critical ? "text-red-500 font-semibold" : "text-slate-500"}`}>
          ${data.used}k / ${data.total}k
        </span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${data.critical ? "bg-red-500" : color}`}
          style={{ width: `${Math.min(data.percent, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

function AlertItem({ title, desc, type }: {
  title: string;
  desc: string;
  type: 'warning' | 'critical';
}) {
  const styles: Record<string, string> = {
    warning: "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20 text-amber-600 dark:text-amber-500",
    critical: "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-500",
  };

  return (
    <div className={`flex gap-3 p-3 rounded-lg border ${styles[type]}`}>
      <div className="mt-0.5">
        {type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function LegendItem({ label, value, color }: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group">
      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
    </button>
  );
}
