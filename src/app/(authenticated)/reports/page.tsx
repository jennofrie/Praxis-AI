"use client";

import { Header } from "@/components/layout/Header";
import { Search, Plus, FileText, CheckCircle, Clock, Calendar, Upload, FileDown, List, Smartphone, Home } from "lucide-react";

export default function Reports() {
  return (
    <>
      <Header title="Reports & Docs" />
      
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8">
        {/* Page Header & Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Reports & Docs</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-xl">Manage and generate clinical documentation for NDIS participants.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            {/* Search Bar */}
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="text-slate-400 w-4 h-4" />
              </span>
              <input className="block w-full pl-10 pr-3 py-3 border-none rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-600 shadow-sm text-sm" placeholder="Search reports, participants..." type="text"/>
            </div>
            {/* Main Action Button */}
            <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-indigo-600/30 transition-all whitespace-nowrap">
              <Plus className="w-5 h-5" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Reports" 
            value="142" 
            badge="↑ 12%" 
            badgeColor="green"
            icon={FileText}
          />
          <MetricCard 
            title="Pending Approval" 
            value="8" 
            badge="Action needed" 
            badgeColor="orange"
            icon={Clock} 
          />
          <MetricCard 
            title="Generated This Week" 
            value="12" 
            icon={Calendar} 
          />
          <MetricCard 
            title="Avg Confidence Score" 
            value="94%" 
            icon={CheckCircle} 
            color="indigo"
          />
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <div className="flex gap-8 min-w-max px-2">
            <TabButton active>All Reports</TabButton>
            <TabButton>Functional Capacity</TabButton>
            <TabButton>Progress Reports</TabButton>
            <TabButton>Home Modifications</TabButton>
            <TabButton>Assistive Tech</TabButton>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Reports Table */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Document Type</th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Participant</th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Generated</th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">AI Confidence</th>
                      <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                    <TableRow 
                      type="FCA - Standard" 
                      refId="#DOC-8921" 
                      participant="John Doe" 
                      date="Oct 24, 2023" 
                      confidence="98%" 
                      status="Final" 
                      statusColor="green"
                      icon={FileText}
                      iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                      avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCfKhB-SLLWeoLNz27gsfQduGb99V_2ixFR29zzL54QfCFHjYtLSdyVGh4D_yJhJLC0fv4ItICp4zqO1vxlXrOXLp5T6Yj4JFnfNEpGad5RzOU08JiW_oGObdHkHC4p1gQvf6bgplfqpr8mbvTbux7-TTnBpiNgHoIyvsmJcoD1vup3C3eRXVrwzReJldWrUMLYX6e7TgZKA8HIEvsDAVn_fuqjPbY32xDNI1iqOUSi9zgTsHxjfOMRV_RShdHv1rvjRZxmIElJ1UE"
                    />
                    <TableRow 
                      type="Progress Report" 
                      refId="#DOC-8922" 
                      participant="Sarah Miller" 
                      date="Oct 23, 2023" 
                      confidence="94%" 
                      status="Review" 
                      statusColor="yellow"
                      icon={Clock}
                      iconColor="text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      initials="SM"
                      initialsColor="bg-orange-100 text-orange-600"
                    />
                    <TableRow 
                      type="Home Mod Request" 
                      refId="#DOC-8923" 
                      participant="Mike Ross" 
                      date="Oct 22, 2023" 
                      confidence="88%" 
                      status="Draft" 
                      statusColor="gray"
                      icon={Home}
                      iconColor="text-purple-600 bg-purple-50 dark:bg-purple-900/20"
                      avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuCDW5c3b5oXcva63BJF4xFtekLbzoxZgAs9OCfw4cDUeXR2Ujh5q3IMaTqE10Bv3DWkKjTMD5eeWfOLaUAKdHBKjH0vvd7111lXLw9VDko68cis5t9pVCIG4cRlMvCLPYxXNu9jVpF8htzW-A3-sd1mjqiLP7U4NyVQYJO1nAWKhcsqis9RdyCOgLUBX3T3Sozk9hO1ZHE26uMG_cy53yQV1ubBbGPimVYdIoZ6yRyHHx6MSu6pk7Jyobh4X05iJazafl0cbwQqD54"
                    />
                    <TableRow 
                      type="Assistive Tech" 
                      refId="#DOC-8925" 
                      participant="Emma Lee" 
                      date="Oct 21, 2023" 
                      confidence="92%" 
                      status="Review" 
                      statusColor="yellow"
                      icon={Smartphone}
                      iconColor="text-teal-600 bg-teal-50 dark:bg-teal-900/20"
                      initials="EL"
                      initialsColor="bg-pink-100 text-pink-600"
                    />
                  </tbody>
                </table>
              </div>
              
              <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">4</span> of <span className="font-medium text-slate-900 dark:text-white">142</span> results</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50" disabled>Previous</button>
                  <button className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Next</button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Widgets */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-slate-900 dark:text-white font-bold text-base mb-4">Quick Actions</h3>
              <div className="flex flex-col gap-3">
                <button className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-600 text-slate-900 dark:text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload External Doc
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-600 text-slate-900 dark:text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                  <FileDown className="w-4 h-4" />
                  Bulk Export
                </button>
              </div>
            </div>

            {/* Popular Templates */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-900 dark:text-white font-bold text-base">Popular Templates</h3>
                <a className="text-indigo-600 text-xs font-semibold hover:underline" href="#">View All</a>
              </div>
              <div className="flex flex-col gap-4">
                <TemplateItem title="Sensory Profile" subtitle="15 questions" count="12x" icon={List} color="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" />
                <TemplateItem title="AT Request" subtitle="Standard form" count="8x" icon={Smartphone} color="text-teal-600 bg-teal-50 dark:bg-teal-900/20" />
                <TemplateItem title="SIL Assessment" subtitle="Complex needs" count="5x" icon={Home} color="text-purple-600 bg-purple-50 dark:bg-purple-900/20" />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-slate-900 dark:text-white font-bold text-base mb-4">Recent Activity</h3>
              <div className="relative pl-2 space-y-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
                <ActivityItem text="Report finalized for" boldText="John Doe" time="2 minutes ago" color="bg-green-500" />
                <ActivityItem text="Draft created for" boldText="Sarah Miller" time="1 hour ago" color="bg-blue-500" />
                <ActivityItem text="Uploaded external docs for" boldText="Mike Ross" time="4 hours ago" color="bg-slate-300 dark:bg-slate-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MetricCard({ title, value, badge, badgeColor, icon: Icon }: any) {
  const badgeColors: Record<string, string> = {
    green: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    orange: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className={`bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between h-32 group hover:border-indigo-600/30 transition-colors`}>
      <div className="flex justify-between items-start">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <Icon className={`w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors`} />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {badge && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium mb-1 ${badgeColors[badgeColor] || "text-slate-500 bg-slate-100"}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, children }: { active?: boolean, children: React.ReactNode }) {
  return (
    <button className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 font-medium text-sm transition-colors ${active ? "border-indigo-600 text-indigo-600 font-bold" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"}`}>
      {children}
    </button>
  );
}

function TableRow({ type, refId, participant, date, confidence, status, statusColor, icon: Icon, iconColor, avatar, initials, initialsColor }: any) {
  const statusColors: Record<string, string> = {
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    gray: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
  };

  const confidenceColor = parseInt(confidence) > 90 ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400";

  return (
    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded ${iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{type}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500">Ref: {refId}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt={participant} className="size-8 rounded-full object-cover" />
          ) : (
            <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs ${initialsColor}`}>
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-slate-900 dark:text-white">{participant}</span>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{date}</td>
      <td className="py-4 px-6">
        <div className="flex justify-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CheckCircle className={`w-4 h-4 ${confidenceColor}`} />
            <span className={`text-xs font-bold font-mono ${confidenceColor}`}>{confidence}</span>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-right">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${statusColors[statusColor]}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

function TemplateItem({ title, subtitle, count, icon: Icon, color }: any) {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded group-hover:bg-opacity-80 transition-colors ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded">{count}</span>
    </div>
  );
}

function ActivityItem({ text, boldText, time, color }: any) {
  return (
    <div className="relative pl-6">
      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${color} box-content -ml-[3px]`}></div>
      <p className="text-sm text-slate-900 dark:text-white">{text} <span className="font-medium">{boldText}</span></p>
      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{time}</p>
    </div>
  );
}
