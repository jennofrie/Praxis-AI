"use client";

import { Header } from "@/components/layout/Header";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Users, Sparkles, Clock, CheckCircle, TrendingUp, AlertTriangle, MoreHorizontal, ArrowUp, Filter, Download } from "lucide-react";

export default function Dashboard() {
  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stat Cards */}
          <StatCard 
            title="Active Participants" 
            value="127" 
            trend="+12%" 
            trendLabel="vs last month" 
            icon={Users} 
            iconColor="text-orange-600" 
            iconBg="bg-orange-100 dark:bg-orange-900/30"
            trendColor="text-green-600"
          />
          <StatCard 
            title="AI Processing Queue" 
            value="12" 
            trend="Optimal" 
            trendLabel="load" 
            icon={Sparkles} 
            iconColor="text-indigo-600" 
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            trendIcon={CheckCircle}
            trendColor="text-green-600"
          />
          <StatCard 
            title="Billable Hours" 
            value="34.5h" 
            trend="-2.1%" 
            trendLabel="vs last week" 
            icon={Clock} 
            iconColor="text-emerald-600" 
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            trendColor="text-red-500"
            trendDown
          />
          <StatCard 
            title="Pending Approvals" 
            value="5" 
            trend="2 urgent" 
            trendLabel="" 
            icon={CheckCircle} 
            iconColor="text-purple-600" 
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            trendIcon={AlertTriangle}
            trendColor="text-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Session Activity</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">124</span>
                  <span className="text-green-500 text-sm font-medium flex items-center">
                    <ArrowUp className="w-4 h-4" /> 15%
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-sm">from last month</span>
                </div>
              </div>
              <select className="bg-slate-50 dark:bg-slate-800 border-none text-sm rounded-md px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-600 cursor-pointer outline-none">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>This Quarter</option>
              </select>
            </div>
            <div className="h-80 w-full rounded-lg">
              <ActivityChart />
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Generation Status</h3>
              <button className="text-slate-400 hover:text-indigo-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">892</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">reports generated</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
              <div className="space-y-4 mt-2">
                <StatusItem label="Session Notes" value="65%" color="bg-indigo-500" />
                <StatusItem label="Assessments" value="25%" color="bg-purple-500" />
                <StatusItem label="NDIS Plans" value="10%" color="bg-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Reports</h3>
              <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                <button className="px-3 py-1 bg-white dark:bg-slate-700 shadow-sm rounded-md text-xs font-medium text-slate-900 dark:text-white">All</button>
                <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Drafts</button>
                <button className="px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">Completed</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 font-semibold">Report Type</th>
                  <th className="px-6 py-4 font-semibold">Participant</th>
                  <th className="px-6 py-4 font-semibold">Date Generated</th>
                  <th className="px-6 py-4 font-semibold text-center">AI Confidence</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                <TableRow type="Functional Capacity" participant="John Doe" date="Oct 24, 10:30 AM" confidence="98%" status="Under Review" statusColor="amber" />
                <TableRow type="Session Note" participant="Mary Smith" date="Oct 23, 04:15 PM" confidence="94%" status="Approved" statusColor="green" />
                <TableRow type="AT Assessment" participant="Alice Li" date="Oct 23, 02:00 PM" confidence="76%" status="Draft" statusColor="gray" />
                <TableRow type="Progress Report" participant="Raj Jones" date="Oct 22, 11:45 AM" confidence="91%" status="Approved" statusColor="green" />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, trend, trendLabel, icon: Icon, iconColor, iconBg, trendColor, trendDown, trendIcon: TrendIcon }: any) {
  const Trend = TrendIcon || (trendDown ? TrendingUp : TrendingUp); // Simplified logic
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendColor}`}>
          <Trend className={`w-4 h-4 ${trendDown ? "rotate-180" : ""}`} />
          <span>{trend}</span>
          <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">{trendLabel}</span>
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

function TableRow({ type, participant, date, confidence, status, statusColor }: any) {
  const colors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    gray: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  };

  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
            <Filter className="w-4 h-4" /> {/* Placeholder icon */}
          </div>
          <span className="font-medium text-slate-900 dark:text-white">{type}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
            {participant.charAt(0)}
          </div>
          {participant}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{date}</td>
      <td className="px-6 py-4">
        <div className="flex justify-center">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            {confidence}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[statusColor]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <button className="text-slate-400 hover:text-indigo-600 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}
