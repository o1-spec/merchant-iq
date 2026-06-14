'use client';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className ?? ''}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="w-44 h-9 rounded-lg border border-slate-200 bg-white shrink-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center space-y-3">
              <Skeleton className="w-12 h-12 rounded-full" />
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>

        
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
