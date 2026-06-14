'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  ArrowRight,
  Calendar,
  FileText,
  CreditCard,
  Pill,
  Activity,
  Phone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByAssure, getFeuillesByAssure, getAssureById } from '@/lib/api';
import { Consultation, FeuillemMaladie, Assure } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate, formatFCFA } from '@/lib/utils';

export default function AssureDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assureInfo, setAssureInfo] = useState<Assure | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [feuilles, setFeuilles] = useState<FeuillemMaladie[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resAssure, resConsults, resFeuilles] = await Promise.all([
          getAssureById(user.id),
          getConsultationsByAssure(user.id),
          getFeuillesByAssure(user.id),
        ]);
        setAssureInfo(resAssure.data);
        setConsultations(resConsults.data);
        setFeuilles(resFeuilles.data);
      } catch (e) {
        console.error('Failed to load assured space details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getRelativeDate = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffTime = today.getTime() - thatDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('common.today') || "Aujourd'hui";
    if (diffDays === 1) return t('common.yesterday') || 'Hier';
    if (diffDays > 1 && diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    }
    return formatDate(dateStr);
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;
  if (!assureInfo)
    return <div className="text-slate-500 text-sm">{t('common.error')}</div>;

  const timelineEvents: {
    id: string;
    title: string;
    description: string;
    date: string;
    icon: React.ReactNode;
    colorClass: string;
  }[] = [];

  const sortedConsultations = [...consultations].sort((a, b) => b.id - a.id);

  sortedConsultations.forEach((c) => {
    timelineEvents.push({
      id: `c-${c.id}`,
      title: t('assure.dashboard.last_consult'),
      description: `Avec Dr. ${c.generaliste.nom} — "${c.motif}"`,
      date: c.date,
      icon: <Calendar size={13} />,
      colorClass: 'bg-primary-500',
    });

    if (c.prescriptions && c.prescriptions.length > 0) {
      timelineEvents.push({
        id: `p-${c.id}`,
        title: t('dashboard.stats.prescriptions'),
        description: `${c.prescriptions.length} prescription(s) lors de votre consultation.`,
        date: c.date,
        icon: <Pill size={13} />,
        colorClass: 'bg-info',
      });
    }

    if (c.feuilleMaladie) {
      timelineEvents.push({
        id: `f-${c.id}`,
        title: t('admin.remboursements.col_feuille'),
        description: `Réf: ${c.feuilleMaladie.idFeuille} — ${formatFCFA(c.feuilleMaladie.montantSoin)}`,
        date: c.date,
        icon: <FileText size={13} />,
        colorClass: 'bg-warning',
      });

      if (c.feuilleMaladie.estRembourse && c.feuilleMaladie.remboursement) {
        timelineEvents.push({
          id: `r-${c.id}`,
          title: t('admin.remboursements.status_reimbursed'),
          description: `${formatFCFA(c.feuilleMaladie.remboursement.montant)} via ${c.feuilleMaladie.remboursement.modePaiement}`,
          date: c.feuilleMaladie.remboursement.dateRemboursement,
          icon: <CreditCard size={13} />,
          colorClass: 'bg-success',
        });
      }
    }
  });

  const latestEvents = timelineEvents.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Hero */}
      <div className="dashboard-hero relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 w-72 h-72 opacity-20 pointer-events-none hidden sm:block">
          <Image
            src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80"
            alt="Santé"
            fill
            className="object-cover rounded-full"
            sizes="288px"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-display font-semibold text-primary-200 tracking-wider uppercase">
              {t('dashboard.welcome_assure')}
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {t('dashboard.welcome')}, {assureInfo.nom} !
            </h1>
            <p className="text-sm text-primary-100/90 max-w-lg leading-relaxed">
              {t('dashboard.welcome_desc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/assure/consultations">
              <Button
                variant="primary"
                size="sm"
                className="bg-white text-primary-700 hover:bg-primary-50 border-none w-full sm:w-auto"
                rightIcon={<ArrowRight size={14} />}
              >
                {t('assure.dashboard.my_consultations')}
              </Button>
            </Link>
            <Link href="/assure/remboursements">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
              >
                {t('assure.dashboard.my_remboursements')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Médecin traitant */}
        <div className="md:col-span-5">
          <Card variant="solid" className="h-full">
            <div className="p-5 flex flex-col gap-5 h-full">
              <div>
                <span className="text-[10px] font-display font-bold text-slate-400 tracking-wider uppercase">
                  {t('assure.dashboard.doctor_card')}
                </span>
                <div className="h-px bg-slate-100 mt-2" />
              </div>

              {assureInfo.medecinTraitant ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center">
                      <Stethoscope size={26} />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-display font-bold text-slate-900 text-sm">
                        Dr. {assureInfo.medecinTraitant.nom}
                      </p>
                      <p className="text-[10px] text-slate-450 font-mono">
                        Matricule: {assureInfo.medecinTraitant.matricule}
                      </p>
                      <p className="text-[10px] text-slate-500 font-body flex items-center gap-1">
                        <Phone size={10} className="text-slate-400" />
                        {assureInfo.medecinTraitant.numTelephone}
                      </p>
                    </div>
                  </div>
                  <div className="bg-success/5 border border-success/20 p-3.5 rounded-xl text-xs text-slate-650 leading-relaxed">
                    <span className="text-success font-semibold">{t('admin.remboursements.coverage_100')}</span> pour les
                    consultations chez votre médecin traitant.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="h-14 w-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center border border-warning/20">
                    <Activity size={26} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-sm text-slate-800">
                      {t('assure.dashboard.no_doctor')}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Déclarez un médecin traitant pour bénéficier d&apos;un remboursement optimal.
                    </p>
                  </div>
                  <Link href="/assure/medecin" className="w-full">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      {t('assure.dashboard.choose_doctor')}
                    </Button>
                  </Link>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-auto">
                <span className="text-[10px] font-display font-medium text-slate-400 uppercase">
                  {t('auth.blood_group')}
                </span>
                <span className="text-danger font-display font-bold text-sm bg-danger/10 border border-danger/20 px-2.5 py-1 rounded-lg">
                  {assureInfo.groupeSanguin || 'O+'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline */}
        <div className="md:col-span-7">
          <Card variant="solid" className="h-full">
            <div className="p-5 flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-display font-bold text-slate-400 tracking-wider uppercase">
                  Activité récente
                </span>
                <Badge variant="neutral">Fil d&apos;actualité</Badge>
              </div>

              <div className="space-y-5 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {latestEvents.length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-400">
                    Aucune activité enregistrée pour le moment.
                  </p>
                ) : (
                  latestEvents.map((evt) => (
                    <div key={evt.id} className="relative">
                      <span
                        className={`absolute -left-[23px] top-0.5 h-6 w-6 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm ${evt.colorClass}`}
                      >
                        {evt.icon}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="font-display font-semibold text-sm text-slate-800">
                            {evt.title}
                          </h4>
                          <span className="text-[10px] text-slate-450 shrink-0 font-mono">
                            {getRelativeDate(evt.date)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{evt.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
