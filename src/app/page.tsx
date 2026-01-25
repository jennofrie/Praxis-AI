import Link from "next/link";
import { 
  ArrowRight, 
  PlayCircle, 
  LayoutDashboard, 
  Users, 
  FileText, 
  ShieldCheck, 
  Calendar, 
  TrendingUp, 
  Check, 
  Activity, 
  Stethoscope, 
  Heart, 
  Brain, 
  Database,
  Mic,
  Gavel
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Navigation */}
      <nav className="fixed w-full z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 flex items-center justify-center transition-transform group-hover:scale-105">
                <img src="/logo.svg" alt="Spectra Praxis" className="w-8 h-8" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Spectra Praxis</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex space-x-8">
              <Link href="#features" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Features</Link>
              <Link href="#compliance" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Compliance</Link>
              <Link href="#pricing" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Pricing</Link>
              <Link href="#resources" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors">Resources</Link>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden md:block text-slate-600 dark:text-slate-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-400/20 dark:bg-indigo-600/10 blur-[100px] rounded-full -z-10 animate-pulse-slow"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-8 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            New: NDIS Audit Agent Live
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
            Streamline NDIS OT Sessions <br className="hidden md:block" />
            into FCA Reports in <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Minutes</span>
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Spectra Praxis empowers OTs with an intelligent NDIS Audit Agent.
            Turn functional assessments into compliant reports instantly and ensure 100% audit readiness.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-20">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-all shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2 hover:scale-105">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 hover:scale-105">
              <PlayCircle className="w-5 h-5" />
              Watch Demo
            </Link>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mx-auto max-w-6xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden transform transition-all hover:scale-[1.01] duration-700 group">
            {/* Fake Browser Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 ml-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
              </div>
              <div className="flex-1 max-w-md mx-auto relative hidden sm:block">
                <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-4 text-sm text-slate-400 flex items-center justify-center gap-2 shadow-sm">
                  <ShieldCheck className="w-3 h-3" />
                  spectrapraxis.com/dashboard
                </div>
              </div>
              <div className="flex items-center gap-3 mr-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="flex h-[600px] text-left">
              {/* Sidebar Mockup */}
              <div className="w-20 lg:w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col pt-6 hidden md:flex">
                <div className="space-y-1 px-3">
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium border border-indigo-100 dark:border-indigo-900/30">
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="hidden lg:block">Dashboard</span>
                  </div>
                  {[
                    { icon: Users, label: "Participants" },
                    { icon: FileText, label: "Reports" },
                    { icon: ShieldCheck, label: "Audit Agent" },
                    { icon: Calendar, label: "Schedule" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-70">
                      <item.icon className="w-5 h-5" />
                      <span className="hidden lg:block">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content Mockup */}
              <div className="flex-1 p-6 lg:p-8 bg-white dark:bg-slate-950 overflow-hidden relative">
                {/* Header */}
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, Dr. Sarah!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Here&apos;s your clinical overview for today.</p>
                  </div>
                  <div className="hidden sm:flex gap-3">
                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> New Report
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[
                    { label: "Active Participants", value: "127", trend: "+12%", color: "text-blue-500", icon: Users },
                    { label: "FCAs Generated", value: "892", trend: "+8%", color: "text-indigo-500", icon: FileText },
                    { label: "Pending Audits", value: "5", trend: "Action Req", color: "text-orange-500", icon: ShieldCheck },
                    { label: "Avg Compliance", value: "99%", trend: "High", color: "text-emerald-500", icon: Check },
                  ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{stat.label}</p>
                          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{stat.value}</h3>
                          <p className={`text-xs ${stat.color} font-medium mt-1 flex items-center gap-1`}>
                            <TrendingUp className="w-3 h-3" /> {stat.trend}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${stat.color} opacity-80`}>
                          <stat.icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity List */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Clinical Notes</h3>
                  <div className="space-y-4 opacity-60 pointer-events-none">
                    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold text-sm">JD</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">John Doe - Initial Assessment</p>
                          <p className="text-xs text-slate-500">2 hours ago • NDIS #492023</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-medium">Completed</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 font-bold text-sm">AS</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">Alice Smith - Functional Capacity</p>
                          <p className="text-xs text-slate-500">14 mins ago • Draft saved</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">Draft</span>
                    </div>
                  </div>
                </div>

                {/* Floating "Time Saved" Card */}
                <div className="absolute bottom-8 right-8 w-64 rounded-2xl bg-slate-900 text-white p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500 border border-slate-700">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full filter blur-3xl opacity-20 -mr-10 -mt-10"></div>
                  <h3 className="font-bold mb-4 relative z-10 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" /> Time Saved
                  </h3>
                  <div className="flex items-center justify-center py-2 relative z-10">
                    <div className="text-center">
                      <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">14h</span>
                      <p className="text-xs text-slate-400 mt-1">This Week</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="py-12 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-8">Trusted by NDIS Providers & Allied Health Clinics</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              { icon: ShieldCheck, name: "MedSafe" },
              { icon: Stethoscope, name: "CarePlus" },
              { icon: Heart, name: "TherapEase" },
              { icon: Activity, name: "AlliedNet" },
              { icon: Brain, name: "MindWorks" },
            ].map((partner, i) => (
              <div key={i} className="flex items-center gap-2 text-xl font-bold text-slate-800 dark:text-white">
                <partner.icon className="w-6 h-6 text-indigo-600" /> {partner.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to focus on care</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Stop worrying about audits and formatting. Let Spectra Praxis handle the compliance and workflow.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform">
                <Mic className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">NDIS OT Session to FCA</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Seamlessly convert your OT session recordings into comprehensive Functional Capacity Assessments (FCA). Skip the manual drafting and go straight to review.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 mb-6 group-hover:scale-110 transition-transform">
                <Gavel className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">NDIS Audit Agent</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Your proactive compliance partner. Automatically audits clinical notes against NDIS standards to identify risks and suggest fixes before you submit.</p>
            </div>
            
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Secure CRM Integration</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Syncs seamlessly with Halaxy, Cliniko, and other major practice management systems. No copy-pasting required.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works steps */}
      <div className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">From session to report in 4 steps</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-800 -z-0"></div>
            
            {[
              { step: "1", title: "Record Session", desc: "Use the mobile app or upload audio from your session.", icon: null },
              { step: "2", title: "AI Processing", desc: "Our engine extracts functional data and formats the FCA.", icon: null },
              { step: "3", title: "Review & Edit", desc: "Quickly verify the generated report and add personal touches.", icon: null },
              { step: null, title: "Export & Send", desc: "Export as PDF or sync directly to your PMS.", icon: Check }
            ].map((item, i) => (
              <div key={i} className="text-center bg-white dark:bg-slate-900 relative z-10 px-2">
                <div className={`w-24 h-24 mx-auto rounded-full border-4 border-white dark:border-slate-900 shadow-lg flex items-center justify-center font-bold text-2xl mb-6 transition-transform hover:scale-110 ${item.icon ? 'bg-indigo-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-indigo-600'}`}>
                  {item.icon ? <item.icon className="w-8 h-8" /> : item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6">Ready to reclaim your time?</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">Join 500+ Occupational Therapists using Spectra Praxis to streamline their clinical documentation.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-lg transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-1">
              Start 14-Day Free Trial
            </Link>
            <Link href="#" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:-translate-y-1">
              Schedule Demo
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">No credit card required. HIPAA & GDPR compliant.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 flex items-center justify-center">
                  <img src="/logo.svg" alt="Logo" className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white">Spectra Praxis</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">Intelligent clinical documentation for the modern allied health professional.</p>
            </div>
            
            {[
              { title: "Product", links: ["Features", "Pricing", "Integrations", "Roadmap"] },
              { title: "Resources", links: ["Blog", "Case Studies", "Help Center", "Security"] },
              { title: "Company", links: ["About Us", "Careers", "Contact", "Legal"] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-slate-900 dark:text-white mb-4">{col.title}</h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  {col.links.map((link, j) => (
                    <li key={j}><a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">© {new Date().getFullYear()} Spectra Praxis. All rights reserved.</p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-indigo-500 transition-colors cursor-pointer"></div>
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-indigo-500 transition-colors cursor-pointer"></div>
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-indigo-500 transition-colors cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
