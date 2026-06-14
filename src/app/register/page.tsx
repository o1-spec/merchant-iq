'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { register } from '@/lib/auth-client';
import { AuthLeftPanel } from '@/components/auth/AuthLeftPanel';

const BUSINESS_TYPES = ['Retail', 'Food & Drinks', 'Fashion', 'POS Agent', 'Services', 'Other'];
const BUSINESS_CATEGORIES = [
  'Convenience & Groceries',
  'Restaurant / Food Vendor',
  'Clothing & Fashion',
  'POS / Agent Banking',
  'Electronics',
  'Beauty & Personal Care',
  'Other',
];

function Field({
  label, id, type = 'text', value, onChange, placeholder, autoComplete, disabled, error,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
  disabled?: boolean; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <input
        id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete} disabled={disabled}
        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 bg-white
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
          focus:border-transparent transition-shadow
          disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
      />
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

function SelectField({
  label, id, value, onChange, options, placeholder, disabled, error,
}: {
  label: string; id: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder?: string; disabled?: boolean; error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <select
          id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
          className={`w-full appearance-none px-3.5 py-2.5 rounded-lg border text-sm bg-white pr-9
            focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
            transition-shadow disabled:bg-slate-50 disabled:cursor-not-allowed
            ${!value ? 'text-slate-400' : 'text-slate-900'}
            ${error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300'}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}

interface FormState {
  name: string; email: string; password: string;
  businessName: string; businessType: string; businessCategory: string; location: string;
}
type FormErrors = Partial<Record<keyof FormState, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: '', email: '', password: '',
    businessName: '', businessType: '', businessCategory: '', location: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(key: keyof FormState) {
    return (value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = 'Your name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!form.businessName.trim()) errs.businessName = 'Business name is required.';
    if (!form.businessType) errs.businessType = 'Select a business type.';
    if (!form.businessCategory) errs.businessCategory = 'Select a business category.';
    if (!form.location.trim()) errs.location = 'Location is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name.trim(), email: form.email.trim().toLowerCase(),
        password: form.password, businessName: form.businessName.trim(),
        businessType: form.businessType, businessCategory: form.businessCategory,
        location: form.location.trim(),
      });
      router.push('/dashboard');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      
      <header className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
          <span className="font-bold text-slate-900 text-base">MerchantIQ</span>
        </Link>
      </header>

      
      <div className="flex-1 flex items-stretch">

        
        <aside className="hidden lg:flex flex-col justify-center w-[480px] shrink-0 bg-slate-100 border-r border-slate-200 px-10 py-12">
          <AuthLeftPanel />
        </aside>

        
        <main className="flex-1 flex items-start justify-center px-4 sm:px-8 py-10 overflow-y-auto">
          <div className="w-full max-w-md">

            
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-slate-900">Create your MerchantIQ account</h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Tell us about your business so your insights can be personalised.
              </p>
            </div>

            
            {apiError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">

              
              <div className="space-y-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Your details</p>
                <Field label="Full name" id="name" value={form.name} onChange={set('name')}
                  placeholder="Femi Adeyemi" autoComplete="name" disabled={loading} error={fieldErrors.name} />
                <Field label="Email address" id="email" type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" autoComplete="email" disabled={loading} error={fieldErrors.email} />
                <Field label="Password" id="password" type="password" value={form.password} onChange={set('password')}
                  placeholder="At least 6 characters" autoComplete="new-password" disabled={loading} error={fieldErrors.password} />
              </div>

              
              <div className="space-y-4 border-t border-slate-100 pt-5">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Your business</p>
                <Field label="Business name" id="businessName" value={form.businessName} onChange={set('businessName')}
                  placeholder="e.g. Femi's Provisions" disabled={loading} error={fieldErrors.businessName} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField label="Business type" id="businessType" value={form.businessType}
                    onChange={set('businessType')} options={BUSINESS_TYPES} placeholder="Select type"
                    disabled={loading} error={fieldErrors.businessType} />
                  <SelectField label="Business category" id="businessCategory" value={form.businessCategory}
                    onChange={set('businessCategory')} options={BUSINESS_CATEGORIES} placeholder="Select category"
                    disabled={loading} error={fieldErrors.businessCategory} />
                </div>

                <Field label="Location" id="location" value={form.location} onChange={set('location')}
                  placeholder="e.g. Ikeja, Lagos" disabled={loading} error={fieldErrors.location} />
              </div>

              
              <button
                type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700
                  active:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed
                  text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            
            <div className="h-px bg-slate-200 my-6" />
            <p className="text-sm text-slate-600 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-emerald-700 font-semibold hover:underline">Sign in</Link>
            </p>

          </div>
        </main>
      </div>
    </div>
  );
}
