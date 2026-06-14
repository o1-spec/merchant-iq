'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured by global error boundary:', error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-full bg-slate-50 flex items-center justify-center p-6 font-sans antialiased text-slate-800">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 space-y-6 text-center">
          
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Critical Application Error</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              MerchantIQ encountered a critical system error. Please try reloading the application.
            </p>
          </div>

          <button
            onClick={() => reset()}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
