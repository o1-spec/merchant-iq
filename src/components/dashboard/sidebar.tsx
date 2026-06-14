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
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/upload', label: 'Upload Data', icon: Upload },
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
      
      <div className="px-5 py-5 border-b border-card-border flex items-center gap-2.5 justify-start md:px-0 md:justify-center lg:px-5 lg:justify-start">
        <Link href="/" className="flex items-center gap-2.5" onClick={onLinkClick}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">M</span>
          </div>
          <span className="font-bold text-slate-900 text-lg block md:hidden lg:block">MerchantIQ</span>
        </Link>
      </div>

      
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto flex flex-col items-start md:items-center lg:items-start">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onLinkClick}
              className={`flex items-center rounded-xl text-sm font-semibold transition-all border
                w-full px-3 py-2.5 gap-3 justify-start 
                md:w-10 md:h-10 md:p-0 md:justify-center md:gap-0 
                lg:w-full lg:px-3 lg:py-2.5 lg:gap-3 lg:justify-start
                ${isActive
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'text-slate-655 hover:bg-slate-100 border-transparent hover:text-slate-900'
                }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
              />
              <span className="block md:hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      
      <div className="border-t border-card-border px-4 py-4 space-y-2 flex flex-col items-start md:items-center lg:items-start md:px-2 lg:px-4">
        {(merchantName || businessName) && (
          <div className="flex items-center gap-2.5 py-2 px-2 justify-start md:px-0 md:justify-center lg:px-2 lg:justify-start">
            <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary-light">
              {merchantName ? merchantName.charAt(0).toUpperCase() : 'M'}
            </div>
            <div className="min-w-0 block md:hidden lg:block">
              <p className="text-xs font-semibold text-slate-800 truncate">{merchantName ?? 'Merchant'}</p>
              <p className="text-[10px] text-slate-400 truncate">{businessName ?? ''}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 rounded-xl text-xs text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full px-3 py-2 justify-start md:w-10 md:h-10 md:p-0 md:justify-center lg:w-full lg:px-3 lg:py-2.5 lg:justify-start"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="block md:hidden lg:block">Log out</span>
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
      
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 lg:w-60 bg-white border-r border-card-border z-20 transition-all duration-300">
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
          
          <aside className="relative z-50 w-64 bg-white h-full">
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
