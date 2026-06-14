'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home, ChevronDown, ChevronUp } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('Captured by error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 text-center">
        
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Something went wrong!</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            We encountered an unexpected error while loading this page. Our team has been notified.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
          
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors bg-white"
          >
            <Home className="w-4 h-4 text-slate-500" />
            Go to Dashboard
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1 mx-auto text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showDetails ? (
              <>
                Hide technical details
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Show technical details
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {showDetails && (
            <div className="mt-3 text-left p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 space-y-2 overflow-x-auto max-h-[160px]">
              <p className="font-semibold text-slate-800 break-all">
                Error: {(error.message || 'Unknown runtime error').replace(/[a-zA-Z0-9-]+\.pooler\.supabase\.com/g, 'database-server')}
              </p>
              {error.digest && (
                <p className="text-slate-400 font-medium select-all">
                  Digest ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
