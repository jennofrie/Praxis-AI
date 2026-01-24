"use client";

import { Header } from "@/components/layout/Header";
import { Search, Plus, Bell, Filter, List, TrendingUp, CheckCircle, Clock, BarChart2, MoreHorizontal, X, User } from "lucide-react";
import Image from "next/image";

export default function Participants() {
  return (
    <>
      <Header title="Participants Management" />
      
      {/* Metrics Cards */}
      <div className="p-8 pb-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Participants" 
            value="124" 
            trend="+4%" 
            trendUp 
            icon={User} 
            color="indigo" 
          />
          <MetricCard 
            title="Active This Week" 
            value="42" 
            trend="+2%" 
            trendUp 
            icon={CheckCircle} 
            color="emerald" 
          />
          <MetricCard 
            title="Upcoming Reviews" 
            value="8" 
            trend="Warning" 
            trendWarning 
            icon={Clock} 
            color="amber" 
          />
          <MetricCard 
            title="Avg Sessions/Month" 
            value="3.2" 
            trend="-1%" 
            trendUp={false} 
            icon={BarChart2} 
            color="blue" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-8 flex gap-6">
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
          {/* Main Table Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 pt-2">
              <nav className="flex gap-6">
                <button className="border-b-2 border-indigo-600 py-4 px-1 text-sm font-semibold text-indigo-600">
                  All (124)
                </button>
                <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Active (112)
                </button>
                <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                  Inactive (12)
                </button>
              </nav>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-[250px]">Participant</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">NDIS Number</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Primary Diagnosis</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Plan Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Session</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                  <TableRow 
                    name="Sarah Jenkins" 
                    age="12" 
                    ndis="4302 2219" 
                    diagnosis="Cerebral Palsy" 
                    status="Active" 
                    statusColor="emerald"
                    nextSession="Nov 14, 2:00 PM"
                    lastActivity="2 days ago"
                    avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBoikqEh3TcLiAmQ7p4guZPk955QiAhytmZpbpTd56YdjQKMtWt_mGj6H8BmDzgoCFSBnZCV3gv7cZyDGxINo6beAdfXCpbOSn5BcmcHBHT33w5sfhzjTcYTTPT0XBANopoBoH6lE0aLPZ8Nwj_x4eaQZ9hXOu3UMBPK1Ax8YmRGm9g9pXHUiHx5nco5PjvlxrlwldMeic0VUd_Jd_A0p1MGVQHMuvpqyW_YZEGbq0LkGi0kjiX8fmjJHD3YnAgVsMgzIM_JyLHko4"
                    selected
                  />
                  <TableRow 
                    name="Michael Chen" 
                    age="8" 
                    ndis="8821 3302" 
                    diagnosis="Autism Spectrum" 
                    status="Pending Review" 
                    statusColor="amber"
                    nextSession="Nov 15, 10:00 AM"
                    lastActivity="5 hours ago"
                    initials="MC"
                    initialsColor="bg-amber-100 text-amber-600"
                  />
                  <TableRow 
                    name="Emma Wilson" 
                    age="24" 
                    ndis="1029 3847" 
                    diagnosis="Spinal Injury" 
                    status="Active" 
                    statusColor="emerald"
                    nextSession="Nov 18, 9:00 AM"
                    lastActivity="1 day ago"
                    avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBnt4JmlUgAhRZ_4tAHv-5147Vvj0itrN8iqhc1nZhmlvMknfnUjS49sDLgBHuZjM-CzEy_mQD6E45FJadHxU3kyzH5IOKbiqBa3s5aV9sPHZ6iSjwWyFbkvCnfpi8ieNaRWUH_gKssekwX81Cmw66tknnKpRMwIKCe2b5yvraDsRiDJkRDbKOA5TjLoDaVwtqTBxYPiiFi0LZOaodaSi5OGiMpQaXjyB00x_NtC6stQ17YXbVZ1OUkZRFcW6H-DYDNmyYW1kBH-Gg"
                  />
                  <TableRow 
                    name="Liam Brown" 
                    age="5" 
                    ndis="5564 2291" 
                    diagnosis="Dev. Delay" 
                    status="Inactive" 
                    statusColor="slate"
                    nextSession="-"
                    lastActivity="2 weeks ago"
                    initials="LB"
                    initialsColor="bg-blue-100 text-blue-600"
                  />
                  <TableRow 
                    name="Olivia Davis" 
                    age="19" 
                    ndis="9928 1102" 
                    diagnosis="Stroke Recovery" 
                    status="Active" 
                    statusColor="emerald"
                    nextSession="Nov 16, 11:30 AM"
                    lastActivity="3 days ago"
                    avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuBsoFGE4VZNdiNhN0c_r6GtkA72sXd_2hzjVw7MXZfyj1SqmJfsuIn5s3kOb6Ptva0Pb6ugW4nE6Ie5SEceH1PSYo4qyZvAOWmZo_CcP2k9wOtEoDR9gj2EmEwU5xOVJ9-kXjQfHuExZH62N6NiuE84qjX-fKhi-qYJ-MiVV0ICq1x9Qh22viHRmbiNIaVILvOtDlFS_NlQwiyTHlBnW-hXR1M8icgHT4gU0Gkagej_rIk47JN0qFFp989kp46_7OU0Wc9T7k6BB54"
                  />
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-white dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-sm text-slate-500 dark:text-slate-400">Showing <span className="font-semibold text-slate-900 dark:text-white">1-5</span> of <span className="font-semibold text-slate-900 dark:text-white">124</span> participants</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel (Details) */}
        <aside className="w-[400px] bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="h-16 w-16 rounded-xl bg-slate-200 overflow-hidden shadow-md">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1n5_5HRHsdeGBt85zQRsG3ibdA1VhT-xDdJhFmr0xmFvRiWbf_k13vH9ZB5M2NSM_TFyh0owKuVhcp7yAnpzFLngJIWWHg44I1V7g0Py2CFmfSXAwgAlGwIOF3Oulv5b50tRHrQ0cx7hbMhUuHlWJ6Bma9j2di4l-XNyX70Ap9L8NUnXe-ru5RFc91aDDWtJ-oe6bUd4MuaZ7DGSp8Jq_damraT6MfcYCf_NJV6YaGjfH6lrY6s-650Ca6ePYMBETfERf_Auz560" alt="Sarah" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sarah Jenkins</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono font-medium text-slate-600 dark:text-slate-300">4302 2219</span>
                    <span className="h-1 w-1 rounded-full bg-slate-400"></span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">Female, 12</span>
                  </div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">Message</button>
              <button className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">Edit Profile</button>
            </div>
          </div>

          <div className="border-b border-slate-200 dark:border-slate-800 px-6">
            <div className="flex gap-6">
              <button className="border-b-2 border-indigo-600 py-3 text-sm font-semibold text-indigo-600">Overview</button>
              <button className="border-b-2 border-transparent py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Sessions</button>
              <button className="border-b-2 border-transparent py-3 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">Goals</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">NDIS Plan Details</h4>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium cursor-pointer hover:underline">View Full Plan</span>
              </div>
              <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Core Supports</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">$12,450 / $28,000</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-1">
                  <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: "45%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>45% Used</span>
                  <span>Ends Dec 31, 2024</span>
                </div>
              </div>
            </div>

            {/* Active Goals */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Active Goals</h4>
                <button className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300 transition-colors">+ Add Goal</button>
              </div>
              
              <GoalItem title="Fine Motor Skills" description="Improve handwriting grip strength and button fastening ability." progress={40} color="indigo" />
              <GoalItem title="Sensory Regulation" description="Recognize sensory overload triggers in classroom settings." progress={75} color="amber" />
            </div>

            {/* Next Appointment */}
            <div className="bg-indigo-600 rounded-xl p-4 text-white shadow-md mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs opacity-80 font-medium uppercase tracking-wider">Next Session</p>
                  <p className="text-sm font-bold">Thursday, Nov 14</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs bg-black/20 rounded-lg p-2.5">
                <span>2:00 PM - 3:00 PM</span>
                <span className="font-medium text-indigo-100">School Visit</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function MetricCard({ title, value, trend, trendUp, trendWarning, icon: Icon, color }: any) {
  const colors: Record<string, string> = {
    indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/30",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-[120px]">
      <div className="flex justify-between items-start">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <div className={`p-1.5 rounded-md ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-900 dark:text-white">{value}</span>
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded flex items-center mb-1 ${
          trendWarning 
            ? "text-amber-600 bg-amber-50 dark:bg-amber-900/30"
            : trendUp 
              ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30"
              : "text-rose-600 bg-rose-50 dark:bg-rose-900/30"
        }`}>
          {trendWarning ? null : (trendUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingUp className="w-3 h-3 mr-0.5 rotate-180" />)}
          {trend}
        </span>
      </div>
    </div>
  );
}

function TableRow({ name, age, ndis, diagnosis, status, statusColor, nextSession, lastActivity, avatar, initials, initialsColor, selected }: any) {
  const statusStyles: Record<string, string> = {
    emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };

  return (
    <tr className={`cursor-pointer transition-colors ${selected ? "bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt={name} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${initialsColor}`}>
              {initials}
            </div>
          )}
          <div>
            <div className={`text-sm font-semibold ${selected ? "text-indigo-900 dark:text-indigo-300" : "text-slate-900 dark:text-white"}`}>{name}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Age: {age}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-600 dark:text-slate-300">{ndis}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{diagnosis}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[statusColor]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{nextSession}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{lastActivity}</td>
    </tr>
  );
}

function GoalItem({ title, description, progress, color }: any) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
      <div className="relative size-10 flex-shrink-0 flex items-center justify-center">
        {/* Simple Ring Chart Placeholder */}
        <div className={`w-10 h-10 rounded-full border-4 ${color === 'indigo' ? 'border-indigo-100 dark:border-indigo-900 border-t-indigo-600' : 'border-amber-100 dark:border-amber-900 border-t-amber-500'} rotate-[-45deg]`}></div>
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">{progress}%</div>
      </div>
      <div>
        <h5 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h5>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
