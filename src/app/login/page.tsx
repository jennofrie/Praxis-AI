'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Eye, EyeOff, Check, ShieldCheck, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/toolkit');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex font-sans text-slate-900 bg-slate-50">
      {/* Left Column - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-indigo-600 to-violet-800 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Animated Blobs */}
        <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-96 h-96 bg-violet-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10 group">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
            <img src="/logo.svg" alt="Spectra Praxis" className="w-10 h-10" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Spectra Praxis</span>
        </Link>

        {/* Hero Content */}
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">Welcome Back</h1>
          <p className="text-blue-100 text-lg mb-10 font-light leading-relaxed">
            Transforming clinical documentation for NDIS Occupational Therapists.
          </p>

          <ul className="space-y-5">
            <li className="flex items-start gap-4">
              <div className="p-1 rounded-full bg-blue-500/30 text-white flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">NDIS Compliant Reports</h4>
                <p className="text-sm text-blue-200 mt-0.5">Automated mapping to NDIS practice standards.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="p-1 rounded-full bg-blue-500/30 text-white flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">NDIS Audit Agent</h4>
                <p className="text-sm text-blue-200 mt-0.5">Proactively identify and resolve compliance risks.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="p-1 rounded-full bg-blue-500/30 text-white flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Secure & Encrypted</h4>
                <p className="text-sm text-blue-200 mt-0.5">Enterprise-grade security for patient data.</p>
              </div>
            </li>
          </ul>

          {/* Floating Card UI Element */}
          <div className="mt-12 relative">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
                <div className="w-8 h-8 rounded-full bg-blue-400/30 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                  DS
                </div>
                <div className="flex-1">
                  <div className="h-2 w-24 bg-white/40 rounded mb-1.5"></div>
                  <div className="h-1.5 w-16 bg-white/20 rounded"></div>
                </div>
                <div className="px-2 py-1 rounded bg-green-400/20 text-green-300 text-[10px] font-bold uppercase tracking-wide border border-green-400/30">
                  Compliant
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="h-2 w-full bg-white/20 rounded"></div>
                <div className="h-2 w-[90%] bg-white/20 rounded"></div>
                <div className="h-2 w-[95%] bg-white/20 rounded"></div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/40"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-white/20"></div>
                <div className="h-1.5 w-1.5 rounded-full bg-white/20"></div>
              </div>
            </div>
            
            <div className="absolute -right-4 -bottom-4 bg-white text-blue-600 p-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce duration-[3000ms]">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-xs font-bold text-slate-800">Time Saved: 2.5hrs</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-blue-200/60 relative z-10">
          © {new Date().getFullYear()} Spectra Praxis. All rights reserved.
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-[60%] bg-white flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center">
               <img src="/logo.svg" alt="Spectra Praxis" className="w-8 h-8" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Spectra Praxis</span>
          </Link>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Sign in to Spectra Praxis</h2>
            <p className="text-slate-500">Welcome back! Please enter your details to access your workspace.</p>
          </div>

          <div className="bg-white rounded-2xl">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400 text-sm">@</span>
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                    id="email"
                    type="email"
                    placeholder="name@clinic.com.au"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all sm:text-sm"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded cursor-pointer"
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                  />
                  <label className="ml-2 block text-sm text-slate-600 cursor-pointer" htmlFor="remember-me">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-semibold text-blue-600 hover:text-blue-700" href="#">
                    Forgot password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin('google')}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-200 transition-all"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  ></path>
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  ></path>
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  ></path>
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  ></path>
                </svg>
                Google
              </button>
              <button
                onClick={() => handleSocialLogin('azure')}
                className="flex items-center justify-center w-full px-4 py-2.5 border border-slate-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-200 transition-all"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23">
                  <path d="M0 0h23v23H0z" fill="#f3f3f3"></path>
                  <path d="M1 1h10v10H1z" fill="#f35325"></path>
                  <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                  <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                  <path d="M12 12h10v10H12z" fill="#ffba08"></path>
                </svg>
                Microsoft
              </button>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-100">
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2 group cursor-help" title="Service Organization Control 2 Type II Certified">
                <ShieldCheck className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 uppercase tracking-wider">
                  SOC 2 Type II
                </span>
              </div>
              <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-300"></div>
              <div className="flex items-center gap-2 group cursor-help" title="Compliant with National Disability Insurance Scheme standards">
                <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700 uppercase tracking-wider">
                  NDIS Compliant
                </span>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Start 14-day free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
