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
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
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
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 bg-white
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary
          focus:border-transparent transition-shadow
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
      />
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
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
    <div className="min-h-screen bg-slate-50 flex flex-col">

      
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-slate-900 text-base">MerchantIQ</span>
        </Link>
      </header>

      
      <div className="flex-1 flex items-stretch">

        
        <aside className="hidden lg:flex flex-col justify-center w-[480px] shrink-0 bg-slate-100 border-r border-slate-200 px-10 py-12">
          <AuthLeftPanel />
        </aside>

        
        <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-md">

            
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Sign in to view your business dashboard.
              </p>
            </div>

            
            {apiError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            
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
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover
                  active:bg-slate-950 disabled:bg-slate-300 disabled:cursor-not-allowed
                  text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-1"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            
            <button
              type="button"
              onClick={handleDemo}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50
                active:bg-slate-100 disabled:bg-slate-100 disabled:cursor-not-allowed
                text-slate-700 font-semibold py-2.5 rounded-lg text-sm border border-slate-300
                hover:border-slate-400 transition-all"
            >
              {demoLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
              {demoLoading ? 'Loading demo…' : 'Continue as Demo Merchant'}
            </button>

            <p className="text-[11px] text-slate-400 text-center mt-2">
              Loads a sample provision store — no account needed.
            </p>

            
            <div className="h-px bg-slate-200 my-6" />

            <p className="text-sm text-slate-600 text-center">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Create one
              </Link>
            </p>

          </div>
        </main>
      </div>
    </div>
  );
}
