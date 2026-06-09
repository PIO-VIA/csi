'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Users,
  Calendar,
  Pill,
  Plus,
  ArrowRight,
  Heart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByMedecin, getAssures, getMedecins } from '@/lib/api';
import { Consultation, Assure, Medecin } from '@/types';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function MedecinDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [allAssures, setAllAssures] = useState<Assure[]>([]);
  const [medecinInfo, setMedecinInfo] = useState<Medecin | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resConsults, resAssures, resMedecins] = await Promise.all([
          getConsultationsByMedecin(user.id),
          getAssures(),
          getMedecins(),
        ]);
        setConsultations(resConsults.data);
        setAllAssures(resAssures.data);
        setMedecinInfo(resMedecins.data.find((m) => m.id === user.id) || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;
  if (!user) return null;

  const totalConsults = consultations.length;
  const uniquePatientIds = new Set(consultations.map((c) => c.assure.id));
  const patientsCount = uniquePatientIds.size;
  const declaredPatientsCount = allAssures.filter(
    (a) => a.medecinTraitant && a.medecinTraitant.id === user.id
  ).length;
  const totalPrescriptions = consultations.reduce(
    (sum, c) => sum + (c.prescriptions ? c.prescriptions.length : 0),
    0
  );
  const latestConsultations = [...consultations].sort((a, b) => b.id - a.id).slice(0, 4);

  const typeLabel =
    medecinInfo?.type === 'SPECIALISTE'
      ? `${t('dashboard.role.specialiste')}${medecinInfo.domaineSpecialisation ? ` — ${medecinInfo.domaineSpecialisation}` : ''}`
      : t('dashboard.role.generaliste');

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  // Agenda du jour
  const today = new Date().toISOString().split('T')[0];
  const todayConsultations = consultations.filter((c) => c.date.startsWith(today));

  // BarChart data — consultations par semaine (4 dernières semaines)
  const barData = Array.from({ length: 4 }).map((_, idx) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - idx) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const count = consultations.filter((c) => {
      const d = new Date(c.date);
      return d >= weekStart && d <= weekEnd;
    }).length;
    return { name: 'S' + (idx + 1), Consultations: count };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="dashboard-hero relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-48 h-48 opacity-25 pointer-events-none hidden md:block">
          <Image
            src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=80"
            alt="Médecin"
            fill
            className="object-cover rounded-2xl"
            sizes="192px"
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display font-bold text-primary-200 tracking-wider uppercase">
                {t('dashboard.welcome_medecin')}
              </span>
              <Badge variant="neutral">{typeLabel}</Badge>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight">
              {t('dashboard.welcome')}, Dr. {user.nom}
            </h1>
            <p className="text-sm text-primary-100/80">{user.email}</p>
          </div>
          <Link href="/medecin/consultations/nouvelle">
            <Button
              variant="primary"
              size="sm"
              className="bg-white text-primary-700 hover:bg-primary-50 border-none"
              leftIcon={<Plus size={16} />}
            >
              {t('medecin.dashboard.new_consultation')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={t('medecin.patients.title')}
          value={patientsCount}
          icon={<Users size={20} />}
          color="primary"
        />
        <StatCard
          label={t('dashboard.stats.consultations')}
          value={totalConsults}
          icon={<Calendar size={20} />}
          color="accent"
        />
        <StatCard
          label={t('dashboard.stats.prescriptions')}
          value={totalPrescriptions}
          icon={<Pill size={20} />}
          color="success"
        />
      </div>

      {declaredPatientsCount > 0 && (
        <Card variant="solid">
          <CardBody className="p-4 flex items-center gap-3 text-sm text-slate-600">
            <Stethoscope size={18} className="text-primary-600 shrink-0" />
            <span>
              <strong className="text-slate-800">{declaredPatientsCount}</strong> assuré(s) vous ont
              déclaré comme médecin traitant.
            </span>
          </CardBody>
        </Card>
      )}

      {/* Agenda du jour */}
      <Card variant="solid">
        <CardHeader className="flex justify-between items-center">
          <span className="font-display font-semibold text-sm text-slate-800">
            Consultations d&apos;aujourd&apos;hui — {dateLabel}
          </span>
          <Badge variant={todayConsultations.length > 0 ? 'info' : 'neutral'}>
            {todayConsultations.length}
          </Badge>
        </CardHeader>
        <CardBody>
          {todayConsultations.length === 0 ? (
            <EmptyState
              title="Pas de consultation"
              description="Aucune consultation enregistrée pour aujourd'hui."
              actionText="Nouvelle consultation"
              onAction={() => router.push('/medecin/consultations/nouvelle')}
            />
          ) : (
            <div className="space-y-3">
              {todayConsultations.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-semibold">{c.assure.nom}</span>
                    <span className="text-slate-400 ml-2">{c.motif}</span>
                  </div>
                  <Badge variant="neutral">{formatDate(c.date)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <Card variant="solid" className="h-full">
            <CardHeader className="flex justify-between items-center">
              <span className="font-display font-semibold text-sm text-slate-800">
                {t('medecin.dashboard.recent_consultations')}
              </span>
              <Link href="/medecin/consultations">
                <Button variant="ghost" size="sm" className="text-xs" rightIcon={<ArrowRight size={12} />}>
                  {t('medecin.dashboard.see_all')}
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.patient')}</TableHead>
                    <TableHead>{t('medecin.consultations.col_motif')}</TableHead>
                    <TableHead>{t('dashboard.stats.prescriptions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                        {t('medecin.dashboard.no_consultation')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    latestConsultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold text-xs">{formatDate(c.date)}</TableCell>
                        <TableCell className="font-display font-medium text-xs">{c.assure.nom}</TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={c.motif}>
                          {c.motif}
                        </TableCell>
                        <TableCell>
                          {c.prescriptions && c.prescriptions.length > 0 ? (
                            <Badge variant="info">{c.prescriptions.length} prescriptions</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs italic">{t('common.none')}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card variant="solid" className="h-full">
            <CardHeader>
              <span className="font-display font-semibold text-sm text-slate-800">
                Consultations / semaine
              </span>
            </CardHeader>
            <CardBody className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                    itemStyle={{ color: '#2563eb' }}
                  />
                  <Bar dataKey="Consultations" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
