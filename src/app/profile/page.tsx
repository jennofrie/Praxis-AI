"use client";

import { Header } from "@/components/layout/Header";
import { BadgeCheck, Edit, Mail, Phone, Briefcase, MapPin, ShieldCheck, CheckCircle, TrendingUp, History, Calendar, Settings, Users } from "lucide-react";

export default function Profile() {
  return (
    <>
      <Header title="User Profile" />
      
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                <div className="relative">
                  <div className="bg-slate-200 rounded-full h-24 w-24 border-4 border-white dark:border-slate-900 shadow-md overflow-hidden">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPwFPtrSRqhMnDIEBpqckVKDTVhpSFcpE75Ltp-hVekg955bov_EXHlH1WS83R9ObRAkX0vUxdCjv9mH-fD5BaHjUoZgPZwgyd0YFTt8XHqvVceU0Cnpy2IrTvlF6D5N7uiPoDJfMGQQsdzk1n2u2OYfdwQKCzYDj1xBXJf-zdLKaPXCGYE-RAj1y66plrbKAzfAjcU-SSsZVEAUtQbjcSZt4zLrWIC38oMyNgKUjqlBpyZsDbDLzUc5RxmDAhExPUqWdALPNvfk8" alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-1 right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900" title="Active"></div>
                </div>
                <div className="flex flex-col justify-center space-y-1">
                  <h1 className="text-slate-900 dark:text-white text-3xl font-bold leading-tight tracking-tight">Sarah Chen</h1>
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-lg">
                    <Briefcase className="w-5 h-5" />
                    <span>Senior Occupational Therapist</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 justify-center sm:justify-start">
                    <MapPin className="w-4 h-4" />
                    Melbourne, VIC
                  </p>
                </div>
              </div>
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 h-10 px-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800">
            <nav className="flex gap-8 overflow-x-auto">
              <TabLink active icon={BadgeCheck}>Profile</TabLink>
              <TabLink icon={Settings}>Preferences</TabLink>
              <TabLink icon={History}>Activity</TabLink>
              <TabLink icon={Calendar}>Sessions</TabLink>
            </nav>
          </div>

          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column (Personal & Professional Info) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Personal Information Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BadgeCheck className="text-indigo-600 w-5 h-5" />
                    Personal Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputGroup label="Full Name" value="Sarah Chen" icon={<Users className="w-5 h-5 text-slate-400" />} />
                  <InputGroup label="Email Address" value="sarah.chen@quantum.health" icon={<Mail className="w-5 h-5 text-slate-400" />} />
                  <InputGroup label="Phone Number" value="+61 400 000 000" icon={<Phone className="w-5 h-5 text-slate-400" />} />
                  <InputGroup label="Role Title" value="Senior Occupational Therapist" icon={<Briefcase className="w-5 h-5 text-slate-400" />} disabled />
                </div>
              </div>

              {/* Professional Details Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-indigo-600 w-5 h-5" />
                    Professional Details
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20">Verified</span>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">AHPRA Registration Number</label>
                      <div className="relative">
                        <input className="block w-full h-11 rounded-lg border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-900/10 text-slate-900 dark:text-white focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono tracking-wide pr-10" readOnly defaultValue="OTW000123456" />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <CheckCircle className="text-green-500 w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-500">Valid until 30/11/2024</p>
                    </div>
                    <InputGroup label="Provider Number" value="1234567A" />
                  </div>
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Digital Signature</span>
                      <button className="text-xs text-indigo-600 font-bold hover:underline">Update Signature</button>
                    </div>
                    <div className="h-32 w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-indigo-600 transition-colors">
                      <img alt="Digital signature preview" className="h-16 opacity-60 dark:invert" src="https://lh3.googleusercontent.com/aida-public/AB6AXuABEgK9GT-dnwO7CBB17L4x9pWit7YkJbnSPYCd8s2U7qw2pZ24lC80hrBqZbRlNTZ7oI9kF4YTMwpP-UODbsOMiG_fPLa_GfE4_xXE46dbw8-1FhWU1ARjgnOFOmhc3_ItjTqaRotvBj6TsPFd2TYG3wKMAkSA0_XU93tyNIt4y-pVRfjxpEssnQtMqzRzNeHVenl_y0iwtJuXbSvi-e2I7g1UVae4meTOkRqPgppWFQkUoBCp8LVN-9qRS8aD0aq9RZaWP-tMlx0"/>
                      <div className="absolute inset-0 bg-black/5 hidden group-hover:flex items-center justify-center transition-all">
                        <span className="bg-white dark:bg-slate-800 px-3 py-1 rounded-md text-xs font-bold shadow-sm">Click to upload new</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">This signature will be applied to all finalized NDIS reports.</p>
                  </div>
                </div>
              </div>

              {/* Security Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security to your account.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column (Stats & Activity) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Stats Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Performance Overview</h3>
                <div className="grid grid-cols-1 gap-4">
                  <StatItem title="Reports Generated" value="142" trend="+12%" color="indigo" />
                  <StatItem title="Active Participants" value="28" trend="Stable" color="indigo" stable />
                  <StatItem title="Sessions Logged" value="312" trend="+5%" color="teal" />
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                  <a className="text-xs font-bold text-indigo-600 hover:underline" href="#">View All</a>
                </div>
                <div className="relative pl-4 border-l border-slate-200 dark:border-slate-700 space-y-8">
                  <ActivityItem title="Submitted NDIS Progress Report" sub="For Michael Johnson" time="2 hours ago" active />
                  <ActivityItem title="Updated Client Notes" sub="Session notes for initial assessment" time="Yesterday, 4:30 PM" />
                  <ActivityItem title="Password Changed" sub="Security update via settings" time="Oct 24, 2023" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// import { Settings } from "lucide-react";

function TabLink({ active, children, icon: Icon }: any) {
  return (
    <button className={`border-b-2 pb-3 pt-2 font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${active ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}>
      <Icon className="w-5 h-5" />
      {children}
    </button>
  );
}

function InputGroup({ label, value, icon, disabled }: any) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="relative rounded-md shadow-sm">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input 
          className={`block w-full h-11 rounded-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-indigo-600 focus:border-indigo-600 sm:text-sm ${icon ? "pl-10" : "pl-3"}`} 
          type="text" 
          defaultValue={value}
          disabled={disabled}
        />
      </div>
    </label>
  );
}

function StatItem({ title, value, trend, color, stable }: any) {
  return (
    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
          <h4 className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</h4>
        </div>
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${stable ? "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-slate-500/10" : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-green-600/20"}`}>
          {!stable && <TrendingUp className="w-3 h-3 mr-0.5" />}
          {trend}
        </span>
      </div>
      {/* Sparkline decoration */}
      <div className="mt-4 h-10 w-full flex items-end gap-1 opacity-40">
        <div className={`w-1/6 bg-${color}-400 h-[40%] rounded-t-sm`}></div>
        <div className={`w-1/6 bg-${color}-400 h-[60%] rounded-t-sm`}></div>
        <div className={`w-1/6 bg-${color}-400 h-[30%] rounded-t-sm`}></div>
        <div className={`w-1/6 bg-${color}-400 h-[80%] rounded-t-sm`}></div>
        <div className={`w-1/6 bg-${color}-400 h-[50%] rounded-t-sm`}></div>
        <div className={`w-1/6 bg-${color}-400 h-[90%] rounded-t-sm`}></div>
      </div>
    </div>
  );
}

function ActivityItem({ title, sub, time, active }: any) {
  return (
    <div className="relative group">
      <div className={`absolute -left-[21px] bg-white dark:bg-slate-900 h-4 w-4 rounded-full border-2 flex items-center justify-center ${active ? "border-indigo-600" : "border-slate-300 dark:border-slate-600"}`}>
        {active && <div className="h-2 w-2 rounded-full bg-indigo-600"></div>}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
        <span className="text-xs text-slate-400 mt-2 block">{time}</span>
      </div>
    </div>
  );
}
