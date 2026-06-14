'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Upload,
  Sparkles,
  MessageSquare,
  FileBarChart2,
  User,
  LogOut,
  Lightbulb,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  active?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/upload', label: 'Upload Data', icon: Upload },
  { href: '/insights', label: 'Financial Insights', icon: Lightbulb },
  { href: '/ai-cfo', label: 'AI CFO', icon: Sparkles },
  { href: '/ask-cfo', label: 'Ask CFO', icon: MessageSquare },
  { href: '/reports', label: 'Reports', icon: FileBarChart2 },
  { href: '/profile', label: 'Profile', icon: User },
];


interface SidebarContentProps {
  pathname: string;
  merchantName?: string;
  businessName?: string;
  onLinkClick?: () => void;
  onLogout?: () => void;
}

function SidebarContent({
  pathname,
  merchantName,
  businessName,
  onLinkClick,
  onLogout,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      
      <div className="px-5 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5" onClick={onLinkClick}>
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-slate-900 text-lg">MerchantIQ</span>
        </Link>
      </div>

      
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      
      <div className="border-t border-slate-100 px-4 py-4 space-y-2">
        {(merchantName || businessName) && (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              {merchantName ? merchantName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{merchantName ?? 'Merchant'}</p>
              <p className="text-xs text-slate-400 truncate">{businessName ?? ''}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

interface SidebarProps {
  merchantName?: string;
  businessName?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ merchantName, businessName, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      router.push('/login');
    }
  }

  return (
    <>
      
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-white border-r border-slate-200 z-20">
        <SidebarContent
          pathname={pathname}
          merchantName={merchantName}
          businessName={businessName}
          onLogout={handleLogout}
        />
      </aside>

      
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          
          <aside className="relative z-50 w-64 bg-white h-full shadow-xl">
            <SidebarContent
              pathname={pathname}
              merchantName={merchantName}
              businessName={businessName}
              onLinkClick={onMobileClose}
              onLogout={async () => { onMobileClose(); await handleLogout(); }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
