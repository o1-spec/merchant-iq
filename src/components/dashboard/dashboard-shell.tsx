'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { ChatWidget } from '@/components/dashboard/ChatWidget';

interface DashboardShellProps {
  children: React.ReactNode;
  merchantName?: string;
  businessName?: string;
  businessCategory?: string;
}

export function DashboardShell({
  children,
  merchantName,
  businessName,
  businessCategory,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      <Sidebar
        merchantName={merchantName}
        businessName={businessName}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      
      <div className="flex-1 flex flex-col min-h-screen md:ml-20 lg:ml-60 transition-all duration-300 min-w-0">
        <Topbar
          merchantName={merchantName}
          businessCategory={businessCategory}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <ChatWidget />
    </div>
  );
}
