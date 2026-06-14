'use client';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-100 rounded animate-pulse ${className ?? ''}`} />;
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
        
        <div className="text-center space-y-3">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        <div className="text-center">
          <Skeleton className="h-3 w-40 mx-auto" />
        </div>

      </div>
    </div>
  );
}
