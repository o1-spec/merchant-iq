'use client';

import { Search, ChevronLeft, ChevronRight, Upload, Plus } from 'lucide-react';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className ?? ''}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-28 h-9 rounded-lg border border-slate-200 bg-white" />
          <div className="w-36 h-9 rounded-lg bg-emerald-50 border border-emerald-100" />
        </div>
      </div>

      
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </div>
      </div>

      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex justify-between">
          {['Date', 'Description', 'Category', 'Type', 'Direction', 'Method', 'Status', 'Amount', ''].map((h, i) => (
            <Skeleton key={i} className={`h-3 w-16 ${h === 'Amount' || h === '' ? 'ml-auto' : ''}`} />
          ))}
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-20 ml-auto" />
            <Skeleton className="h-6 w-12 ml-4 rounded-lg" />
          </div>
        ))}
      </div>

    </div>
  );
}
