'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6 text-center">
        
        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto border border-slate-100">
          <FileQuestion className="w-6 h-6 text-slate-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Page Not Found</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors bg-white"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
            Go to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
