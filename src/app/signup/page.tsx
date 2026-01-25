'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Eye, EyeOff, Check, ArrowRight, Shield, Lock, Mail } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
          },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Show success message or redirect to confirmation page
      alert('Signup successful! Please check your email to confirm your account.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'azure') => {
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
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-white">
      {/* Left Column - Branding (Hidden on small mobile) */}
      <div className="hidden md:flex w-full md:w-[40%] bg-gradient-to-br from-indigo-600 to-violet-700 p-8 lg:p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="absolute top-10 right-10 w-64 h-64 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              clipRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
              fillRule="evenodd"
            ></path>
          </svg>
          <div className="absolute bottom-20 -left-10 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
          <div className="absolute top-20 -right-10 w-80 h-80 bg-violet-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        </div>

        <Link href="/" className="flex items-center gap-3 relative z-10 group">
          <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
            <img src="/logo.svg" alt="Spectra Praxis" className="w-10 h-10" />
          </div>
          <span className="font-bold text-2xl tracking-tight">Spectra Praxis</span>
        </Link>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-50 text-xs font-medium mb-6">
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>AI-Powered Documentation</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
            Start Your <br />
            Free Trial
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-sm">
            Join 500+ NDIS Occupational Therapists saving 15+ hours per week on clinical documentation.
          </p>
          <ul className="space-y-5">
            <li className="flex items-start gap-4">
              <div className="mt-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Automated Reports</h4>
                <p className="text-sm text-blue-100">Generate NDIS-compliant reports from audio.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="mt-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Smart Templates</h4>
                <p className="text-sm text-blue-100">Access library of clinical templates.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="mt-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Secure Storage</h4>
                <p className="text-sm text-blue-100">Australian hosted, ISO 27001 certified.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium text-blue-200 relative z-10">
          <span className="text-white">Step 1 of 3</span>
          <div className="h-1 w-24 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Column - Signup Form */}
      <div className="w-full md:w-[60%] bg-slate-50 flex flex-col h-full overflow-y-auto">
        <div className="max-w-xl w-full mx-auto px-6 py-12 md:py-20 flex-grow flex flex-col justify-center">
          <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src="/logo.svg" alt="Spectra Praxis" className="w-8 h-8" />
              </div>
              <span className="font-bold text-xl text-slate-900">Spectra Praxis</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="h-1.5 w-full bg-slate-100">
              <div className="h-full w-1/3 bg-indigo-600 rounded-r-full"></div>
            </div>

            <div className="p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Create your account</h2>
                <p className="text-slate-500 text-sm">Start your 14-day free trial. No credit card required.</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r">
                  <p className="font-bold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => handleSocialSignup('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  onClick={() => handleSocialSignup('azure')}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 23 23">
                    <path d="M0 0h23v23H0z" fill="#f3f3f3"></path>
                    <path d="M1 1h10v10H1z" fill="#f35325"></path>
                    <path d="M12 1h10v10H12z" fill="#81bc06"></path>
                    <path d="M1 12h10v10H1z" fill="#05a6f0"></path>
                    <path d="M12 12h10v10H12z" fill="#ffba08"></path>
                  </svg>
                  Microsoft
                </button>
              </div>

              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-slate-400">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="first-name">
                      First Name
                    </label>
                    <input
                      className="w-full rounded-lg border-slate-300 border p-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm outline-none"
                      id="first-name"
                      placeholder="Sarah"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="last-name">
                      Last Name
                    </label>
                    <input
                      className="w-full rounded-lg border-slate-300 border p-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm outline-none"
                      id="last-name"
                      placeholder="Wilson"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input
                      className="w-full pl-10 rounded-lg border-slate-300 border p-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm outline-none"
                      id="email"
                      placeholder="sarah@clinic.com.au"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative mb-2">
                    <Lock className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input
                      className="w-full pl-10 pr-10 rounded-lg border-slate-300 border p-2.5 focus:border-blue-500 focus:ring-blue-500 shadow-sm outline-none"
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          password.length === 0
                            ? 'w-0'
                            : password.length < 8
                            ? 'w-1/3 bg-red-400'
                            : password.length < 12
                            ? 'w-2/3 bg-yellow-400'
                            : 'w-full bg-green-400'
                        }`}
                      ></div>
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        password.length === 0
                          ? 'text-slate-400'
                          : password.length < 8
                          ? 'text-red-600'
                          : password.length < 12
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}
                    >
                      {password.length === 0
                        ? 'Empty'
                        : password.length < 8
                        ? 'Weak'
                        : password.length < 12
                        ? 'Medium'
                        : 'Strong'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Continue to Practice Details'}
                    {!isLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Australian Hosted Data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>256-bit Encryption</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-auto py-6 px-6 text-center text-xs text-slate-400 border-t border-slate-200 md:border-none bg-white md:bg-transparent">
          © {new Date().getFullYear()} Spectra Praxis. By signing up, you agree to our{' '}
          <a className="underline hover:text-slate-600" href="#">
            Terms
          </a>{' '}
          and{' '}
          <a className="underline hover:text-slate-600" href="#">
            Privacy Policy
          </a>
          .
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
      <path d="M19 14l-1.5-3.5L14 9l3.5-1.5L19 4l1.5 3.5L24 9l-3.5 1.5z" />
      <path d="M9 20l-2.5-5.5L1 12l5.5-2.5L9 4l2.5 5.5L17 12l-5.5 2.5z" />
    </svg>
  );
}
