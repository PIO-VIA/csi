'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Sidebar from '@/components/ui/Sidebar';
import TopBar from '@/components/ui/TopBar';
import Loader from '@/components/ui/Loader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        // Simple role guard checking
        const role = user.role;
        if (pathname.startsWith('/admin') && role !== 'ADMIN') {
          // redirect unauthorized to appropriate page
          if (role === 'ASSURE') router.push('/assure');
          else router.push('/medecin');
        } else if (pathname.startsWith('/assure') && role !== 'ASSURE') {
          if (role === 'ADMIN') router.push('/admin');
          else router.push('/medecin');
        } else if (pathname.startsWith('/medecin') && role !== 'GENERALISTE' && role !== 'SPECIALISTE') {
          if (role === 'ADMIN') router.push('/admin');
          else router.push('/assure');
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <Loader fullPage size="lg" />;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-body">
      {/* Responsive Sidebar */}
      <Sidebar />

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[280px] min-h-screen">
        {/* Sticky Header TopBar */}
        <TopBar />

        {/* Dynamic Main Page Content */}
        <main className="flex-1 p-4 sm:p-6 bg-slate-50 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
