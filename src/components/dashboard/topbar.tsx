'use client';

import { Bell, Menu } from 'lucide-react';

interface TopbarProps {
  merchantName?: string;
  businessCategory?: string;
  onMobileMenuToggle: () => void;
}

export function Topbar({ merchantName, businessCategory, onMobileMenuToggle }: TopbarProps) {
  const initials = merchantName
    ? merchantName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'MQ';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-5 sticky top-0 z-10">
      
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="md:hidden p-2 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        
        <div className="hidden md:block">
          <p className="text-sm font-semibold text-slate-800">{merchantName ?? 'Dashboard'}</p>
          {businessCategory && (
            <p className="text-xs text-slate-400">{businessCategory}</p>
          )}
        </div>
      </div>

      
      <div className="flex items-center gap-2">
        
        <button
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>

        
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-100 ml-1">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 leading-none">{merchantName ?? 'Merchant'}</p>
            {businessCategory && (
              <p className="text-xs text-slate-400 mt-0.5 leading-none">{businessCategory}</p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
