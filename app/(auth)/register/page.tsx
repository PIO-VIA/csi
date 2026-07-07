'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';

export default function RegisterRedirectPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center text-slate-800 font-body">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">{t('auth.redirect_login')}</p>
      </div>
    </div>
  );
}
