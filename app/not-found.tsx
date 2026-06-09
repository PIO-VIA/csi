'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import Button from '@/components/ui/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 text-center space-y-6"
      >
        <div className="mx-auto h-20 w-20 rounded-2xl bg-danger/10 text-danger flex items-center justify-center border border-danger/20">
          <ShieldAlert size={44} strokeWidth={1.5} />
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-5xl tracking-tight text-slate-900">404</h1>
          <h2 className="font-display font-bold text-xl text-slate-850">
            {t('common.not_found_title') || 'Page introuvable'}
          </h2>
          <p className="text-sm text-slate-500 font-body leading-relaxed">
            {t('common.not_found_desc') || "Désolé, la page que vous recherchez n'existe pas ou a été déplacée."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft size={16} />}
            className="w-full sm:w-auto text-xs"
          >
            {t('common.back') || 'Retour'}
          </Button>
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              leftIcon={<Home size={16} />}
              className="w-full sm:w-auto text-xs"
            >
              {t('common.home') || 'Accueil'}
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
