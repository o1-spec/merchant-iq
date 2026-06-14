import { cookies } from 'next/headers';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

interface AuthUser {
  name: string;
  merchant: {
    businessName: string;
    businessCategory: string;
  } | null;
}

async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('merchantiq_auth');
    if (!cookie) return null;

    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/me`, {
      headers: { Cookie: `merchantiq_auth=${cookie.value}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.user ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <DashboardShell
      merchantName={user?.name}
      businessName={user?.merchant?.businessName}
      businessCategory={user?.merchant?.businessCategory}
    >
      {children}
    </DashboardShell>
  );
}
