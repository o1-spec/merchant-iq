'use client';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className ?? ''}`} />;
}

export default function Loading() {
  return (
    <div className="space-y-6 max-w-[1200px]">
      
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-32" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>

        
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-4 w-28" />
            </div>
            
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>

          
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-full rounded-lg mt-2" />
          </div>

        </div>

      </div>

    </div>
  );
}
