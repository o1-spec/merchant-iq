'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { login, demoLogin } from '@/lib/auth-client';
import { AuthLeftPanel } from '@/components/auth/AuthLeftPanel';

function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  error,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-bold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 bg-slate-50 focus:bg-white
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
          focus:border-transparent transition-all duration-200
          disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:border-emerald-500'}`}
      />
      {error && <p className="text-xs text-red-600 mt-0.5 font-medium">{error}</p>}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  function validate() {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email.';
    if (!password) errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.push('/dashboard');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setApiError('');
    setDemoLoading(true);
    try {
      await demoLogin();
      router.push('/dashboard');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Demo login failed. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  }

  const busy = loading || demoLoading;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      
      {/* Left side brand brief section (40% width) */}
      <aside className="hidden lg:flex flex-col justify-between w-full lg:w-[42%] xl:w-[38%] shrink-0 bg-slate-950 border-r border-slate-900 px-12 py-12 relative overflow-hidden">
        {/* Decorative backdrop mesh */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.08)_0%,transparent_70%)]" />
        <div className="relative z-10 h-full flex flex-col justify-between">
          <AuthLeftPanel />
        </div>
      </aside>

      {/* Right side form card section (Centered) */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 bg-white relative overflow-y-auto">
        
        {/* Mobile Header Logo (Top-left, only displayed on mobile/tablet) */}
        <div className="lg:hidden absolute top-6 left-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-bold text-slate-900 text-base">MerchantIQ</span>
          </Link>
        </div>

        <div className="w-full max-w-sm my-auto space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h1>
            <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
              Sign in to view your business dashboard.
            </p>
          </div>

          {/* API Error Notification */}
          {apiError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <Field
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
              disabled={busy}
              error={fieldErrors.email}
            />
            <Field
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={busy}
              error={fieldErrors.password}
            />

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800
                active:bg-slate-950 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
                text-white font-semibold py-2.5 rounded-lg text-sm transition-all mt-2 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo Login Option */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDemo}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50
                active:bg-slate-100 disabled:bg-slate-100 disabled:cursor-not-allowed
                text-slate-700 font-semibold py-2.5 rounded-lg text-sm border border-slate-300
                hover:border-slate-400 transition-all shadow-sm"
            >
              {demoLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
              {demoLoading ? 'Loading demo…' : 'Continue as Demo Merchant'}
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Loads a sample provision store — no account needed.
            </p>
          </div>

          {/* Redirect to registration */}
          <div className="h-px bg-slate-100" />

          <p className="text-sm text-slate-600 text-center">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-emerald-600 font-bold hover:underline transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
