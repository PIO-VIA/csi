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
import { getConsultationsByMedecin, getMesAssures, getMedecinById, getMesOrientationsEnriched, type EnrichedOrientation } from '@/lib/api';
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
  const [orientations, setOrientations] = useState<EnrichedOrientation[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resConsults, resAssures, resMedecin, resOrientations] = await Promise.all([
          getConsultationsByMedecin(user.id).catch((err) => {
            console.error('Failed to load consultations:', err);
            return { data: [] as Consultation[] };
          }),
          getMesAssures().catch((err) => {
            console.error('Failed to load assured patients:', err);
            return { data: [] as Assure[] };
          }),
          getMedecinById(user.id).catch((err) => {
            console.error('Failed to load doctor profile:', err);
            return { data: null as Medecin | null };
          }),
          user.role === 'SPECIALISTE'
            ? getMesOrientationsEnriched().catch((err) => {
                console.error('Failed to load orientations:', err);
                return [] as EnrichedOrientation[];
              })
            : Promise.resolve([] as EnrichedOrientation[])
        ]);
        setConsultations(resConsults.data);
        setAllAssures(resAssures.data);
        setMedecinInfo(resMedecin.data);
        setOrientations(resOrientations);
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

  const isSpecialistUser = user.role === 'SPECIALISTE';

  const totalConsults = isSpecialistUser ? orientations.length : consultations.length;
  const uniquePatientIds = isSpecialistUser
    ? new Set(orientations.map((o) => o.patientId))
    : new Set(consultations.map((c) => c.assure.id));
  const patientsCount = uniquePatientIds.size;
  const declaredPatientsCount = allAssures.length;
  const totalPrescriptions = isSpecialistUser
    ? 0
    : consultations.reduce(
        (sum, c) => sum + (c.prescriptions ? c.prescriptions.length : 0),
        0
      );
  const latestConsultations = [...consultations].sort((a, b) => b.id - a.id).slice(0, 4);
  const latestOrientations = [...orientations].sort((a, b) => b.id - a.id).slice(0, 4);

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
  const todayOrientations = orientations.filter((o) => o.date && o.date.startsWith(today));

  // BarChart data — consultations par semaine (4 dernières semaines)
  const barData = Array.from({ length: 4 }).map((_, idx) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - idx) * 7);
    // Find the Monday of that week
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(weekStart.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const count = isSpecialistUser
      ? orientations.filter((o) => {
          if (!o.date) return false;
          const d = new Date(o.date);
          const checkD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const monD = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
          const sunD = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
          return checkD >= monD && checkD <= sunD;
        }).length
      : consultations.filter((c) => {
          const d = new Date(c.date);
          const checkD = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const monD = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
          const sunD = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate());
          return checkD >= monD && checkD <= sunD;
        }).length;

    const label = `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
    return { name: `${label}`, Consultations: count, Orientations: count };
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
          {!isSpecialistUser && (
            <Link href="/medecin/consultations/nouvelle">
              <Button
                variant="primary"
                size="sm"
                className="bg-white text-primary-700 hover:bg-primary-50 border-none animate-pulse-slow"
                leftIcon={<Plus size={16} />}
              >
                {t('medecin.dashboard.new_consultation')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={isSpecialistUser ? "Patients orientés" : t('medecin.patients.title')}
          value={patientsCount}
          icon={<Users size={20} />}
          color="primary"
        />
        <StatCard
          label={isSpecialistUser ? "Orientations reçues" : t('dashboard.stats.consultations')}
          value={totalConsults}
          icon={<Calendar size={20} />}
          color="accent"
        />
        <StatCard
          label={isSpecialistUser ? "Total Soins Recommandés" : t('dashboard.stats.prescriptions')}
          value={isSpecialistUser ? orientations.length : totalPrescriptions}
          icon={<Pill size={20} />}
          color="success"
        />
      </div>

      {declaredPatientsCount > 0 && !isSpecialistUser && (
        <Card variant="solid">
          <CardBody className="p-4 flex items-center gap-3 text-sm text-slate-655">
            <Stethoscope size={18} className="text-primary-600 shrink-0" />
            <span>
              <strong className="text-slate-800">{declaredPatientsCount}</strong> assuré(s) vous ont
              déclaré comme médecin traitant.
            </span>
          </CardBody>
        </Card>
      )}

      {/* Agenda du jour / Orientations reçues */}
      <Card variant="solid">
        <CardHeader className="flex justify-between items-center">
          <div>
            <span className="font-display font-bold text-sm text-slate-800 block">
              {isSpecialistUser ? "Orientations reçues aujourd'hui" : "Consultations d'aujourd'hui"}
            </span>
            <span className="text-[10px] text-slate-450 font-body block mt-0.5">
              {dateLabel}
            </span>
          </div>
          <Badge variant={(isSpecialistUser ? todayOrientations.length : todayConsultations.length) > 0 ? 'warning' : 'neutral'}>
            {isSpecialistUser ? todayOrientations.length : todayConsultations.length} {isSpecialistUser ? (todayOrientations.length > 1 ? 'orientations' : 'orientation') : (todayConsultations.length > 1 ? 'consultations' : 'consultation')}
          </Badge>
        </CardHeader>
        <CardBody>
          {isSpecialistUser ? (
            todayOrientations.length === 0 ? (
              <EmptyState
                title="Pas d'orientation"
                description="Aucune orientation reçue pour aujourd'hui."
              />
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 ml-3 space-y-6 my-2">
                {todayOrientations.map((o) => {
                  const initials = (o.patientName || '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || '?';

                  return (
                    <div key={o.id} className="relative group">
                      <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-amber-500 shadow-sm group-hover:scale-110 duration-250" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-150/50 rounded-2xl duration-250">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center font-display font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-xs text-slate-850">
                                {o.patientName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                                {o.patientIdAssure}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-body">
                              Prescrit par : <strong className="text-slate-700">{o.medecinPrescripteur}</strong> &bull; Motif : {o.motif || 'Non renseigné'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <span className="text-[10px] text-slate-450 font-mono">
                            {o.patientPhone || 'Pas de numéro'}
                          </span>
                          <Badge variant="warning" className="font-mono text-[10px] px-2 py-0.5">
                            En attente
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            todayConsultations.length === 0 ? (
              <EmptyState
                title="Pas de consultation"
                description="Aucune consultation enregistrée pour aujourd'hui."
                actionText="Nouvelle consultation"
                onAction={() => router.push('/medecin/consultations/nouvelle')}
              />
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 ml-3 space-y-6 my-2">
                {todayConsultations.map((c) => {
                  const initials = (c.assure.nom || '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || '?';
                  
                  const timeStr = new Date(c.date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={c.id} className="relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[23px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-primary-500 shadow-sm group-hover:scale-110 duration-250" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-150/50 rounded-2xl duration-250">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary-50 border border-primary-100 text-primary-700 flex items-center justify-center font-display font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-xs text-slate-850">
                                {c.assure.nom}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">
                                {c.assure.idAssure}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-body">
                              Motif : {c.motif || 'Aucun motif renseigné'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <span className="text-[10px] text-slate-450 font-mono">
                            {c.assure.numTelephone}
                          </span>
                          <Badge variant="info" className="font-mono text-[10px] px-2 py-0.5">
                            {timeStr}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <Card variant="solid" className="h-full">
            <CardHeader className="flex justify-between items-center">
              <span className="font-display font-semibold text-sm text-slate-800">
                {isSpecialistUser ? "Orientations récentes reçues" : t('medecin.dashboard.recent_consultations')}
              </span>
              {!isSpecialistUser && (
                <Link href="/medecin/consultations">
                  <Button variant="ghost" size="sm" className="text-xs" rightIcon={<ArrowRight size={12} />}>
                    {t('medecin.dashboard.see_all')}
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isSpecialistUser ? "Date Orientation" : t('common.date')}</TableHead>
                    <TableHead>{t('common.patient')}</TableHead>
                    <TableHead>{isSpecialistUser ? "Motif de l'orientation" : t('medecin.consultations.col_motif')}</TableHead>
                    <TableHead>{isSpecialistUser ? "Médecin Prescripteur" : t('dashboard.stats.prescriptions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSpecialistUser ? (
                    latestOrientations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-slate-400 text-xs">
                          Aucune orientation récente reçue.
                        </TableCell>
                      </TableRow>
                    ) : (
                      latestOrientations.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-semibold text-xs">{o.date ? formatDate(o.date) : '—'}</TableCell>
                          <TableCell className="font-display font-medium text-xs">
                            <div className="flex flex-col">
                              <span className="text-slate-800 font-bold">{o.patientName}</span>
                              <span className="text-[10px] font-mono text-slate-400">{o.patientIdAssure}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-xs truncate" title={o.motif}>
                            {o.motif}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-primary-700">
                            Dr. {o.medecinPrescripteur}
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    latestConsultations.length === 0 ? (
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
                    )
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
                {isSpecialistUser ? "Orientations / semaine" : "Consultations / semaine"}
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
                    itemStyle={{ color: isSpecialistUser ? '#f59e0b' : '#2563eb' }}
                  />
                  <Bar dataKey={isSpecialistUser ? "Orientations" : "Consultations"} fill={isSpecialistUser ? "#f59e0b" : "#2563eb"} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
