'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Sidebar from '@/components/ui/Sidebar';
import TopBar from '@/components/ui/TopBar';
import Loader from '@/components/ui/Loader';

function getRoleHome(role: string) {
  if (role === 'ADMIN') return '/admin';
  return '/medecin';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
        return;
      }

      // Les assurés n'ont pas d'espace de connexion
      if (user.role === 'ASSURE') {
        logout();
        return;
      }

      const role = user.role;
      if (pathname.startsWith('/admin') && role !== 'ADMIN') {
        router.push(getRoleHome(role));
      } else if (pathname.startsWith('/assure')) {
        router.push(getRoleHome(role));
      } else if (
        pathname.startsWith('/medecin') &&
        role !== 'GENERALISTE' &&
        role !== 'SPECIALISTE'
      ) {
        router.push(getRoleHome(role));
      }
    }
  }, [user, loading, router, pathname, logout]);

  if (loading) {
    return <Loader fullPage size="lg" />;
  }

  if (!user || user.role === 'ASSURE') {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex font-body dashboard-shell">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-[256px] min-h-screen">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
