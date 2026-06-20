'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Stethoscope,
  Calendar,
  DollarSign,
  ArrowRight,
  Plus,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getAssures, getMedecins, getConsultations, getRemboursements, getFeuilles, getTotalRemboursements } from '@/lib/api';
import { Assure, Medecin, Consultation, Remboursement, FeuillemMaladie } from '@/types';
import StatCard from '@/components/ui/StatCard';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PageHeader from '@/components/ui/PageHeader';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { formatFCFA, formatDate } from '@/lib/utils';
import Loader from '@/components/ui/Loader';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assures, setAssures] = useState<Assure[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  const [feuilles, setFeuilles] = useState<FeuillemMaladie[]>([]);
  const [totalRemb, setTotalRemb] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchData = async () => {
      try {
        const [resAssures, resMedecins, resConsultations, resRemboursements, resFeuilles, resTotal] =
          await Promise.all([
            getAssures(),
            getMedecins(),
            getConsultations(),
            getRemboursements(),
            getFeuilles(),
            getTotalRemboursements().catch(() => 0),
          ]);
        setAssures(resAssures.data);
        setMedecins(resMedecins.data);
        setConsultations(resConsultations.data);
        setRemboursements(resRemboursements.data);
        setFeuilles(resFeuilles.data);
        setTotalRemb(resTotal);
      } catch (e) {
        console.error('Failed to load admin stats:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  const totalAssures = assures.length;
  const totalMedecins = medecins.length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const consultsCeMois = consultations.filter((c) => {
    const d = new Date(c.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const remboursementsTotaux =
    totalRemb || remboursements.reduce((acc, r) => acc + r.montant, 0);
  const remboursementsCeMois =
    remboursements.filter((r) => {
    const d = new Date(r.dateRemboursement);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, r) => s + r.montant, 0);

  const monthsList = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const chartLineData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date();
    d.setMonth(now.getMonth() - (5 - idx));
    const mLabel = monthsList[d.getMonth()];
    const mVal = d.getMonth();
    const yVal = d.getFullYear();
    const count = consultations.filter((c) => {
      const cd = new Date(c.date);
      return cd.getMonth() === mVal && cd.getFullYear() === yVal;
    }).length;
    return { name: mLabel, Consultations: count };
  });

  let generalistRefund = 0;
  let specialistRefund = 0;

  remboursements.forEach((r) => {
    const sheet = feuilles.find((f) => f.id === r.feuilleMaladieId);
    if (sheet) {
      const cons = consultations.find((c) => c.id === sheet.consultationId);
      if (cons) {
        if (cons.generaliste.type === 'SPECIALISTE') {
          specialistRefund += r.montant;
        } else {
          generalistRefund += r.montant;
        }
      }
    }
  });

  const hasRefundBreakdown = generalistRefund > 0 || specialistRefund > 0;

  const pieData = [
    { name: t('dashboard.stats.generaliste_label'), value: generalistRefund },
    { name: t('dashboard.stats.specialiste_label'), value: specialistRefund },
  ];

  const PIE_COLORS = ['#3b82f6', '#06b6d4'];

  const latestAssures = [...assures].sort((a, b) => b.id - a.id).slice(0, 4);
  const latestRemboursements = [...remboursements].sort((a, b) => b.id - a.id).slice(0, 4);

  const dateLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title={t('dashboard.welcome_admin')}
        description={`${t('dashboard.welcome_desc')} — ${dateLabel}`}
      />

      {/* Quick Actions Bar */}
      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/assures">
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            Nouvel assuré
          </Button>
        </Link>
        <Link href="/admin/medecins">
          <Button variant="secondary" leftIcon={<Stethoscope size={16} />}>
            Enregistrer médecin
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('dashboard.stats.total_assures')}
          value={totalAssures}
          icon={<Users size={20} />}
          color="primary"
          href="/admin/assures"
        />
        <StatCard
          label={t('dashboard.stats.total_medecins')}
          value={totalMedecins}
          icon={<Stethoscope size={20} />}
          color="accent"
          href="/admin/medecins"
        />
        <StatCard
          label={t('dashboard.stats.consults_month')}
          value={consultsCeMois}
          icon={<Calendar size={20} />}
          color="info"
          href="/admin/consultations"
        />
        <StatCard
          label={t('dashboard.stats.total_remb')}
          value={formatFCFA(remboursementsCeMois)}
          icon={<DollarSign size={20} />}
          color="success"
          href="/admin/remboursements"
        />
      </div>

      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <Card variant="solid" className="h-full">
              <CardHeader className="flex justify-between items-center">
                <span className="font-display font-semibold text-sm text-slate-800">
                  {t('dashboard.stats.evolution_consults')}
                </span>
                <Badge variant="neutral">{t('dashboard.stats.last_6_months')}</Badge>
              </CardHeader>
              <CardBody className="h-80 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartLineData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
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
                    <Line
                      type="monotone"
                      dataKey="Consultations"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      activeDot={{ r: 6 }}
                      dot={{ strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <Card variant="solid" className="h-full">
              <CardHeader className="flex justify-between items-center">
                <span className="font-display font-semibold text-sm text-slate-800">
                  {t('dashboard.stats.remb_by_category')}
                </span>
              </CardHeader>
              <CardBody className="h-80 flex flex-col justify-center items-center">
                {!hasRefundBreakdown ? (
                  <div className="flex flex-col items-center justify-center text-center gap-2 text-slate-400">
                    <DollarSign size={28} className="opacity-40" />
                    <span className="text-xs font-body">
                      {t('dashboard.stats.no_refunds')}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              borderColor: '#e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                            formatter={(value) => formatFCFA(Number(value))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-display uppercase tracking-wider text-slate-400">
                          {t('dashboard.stats.total')}
                        </span>
                        <span className="text-sm font-display font-bold text-slate-850">
                          {formatFCFA(generalistRefund + specialistRefund)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-6 mt-2 text-xs font-body">
                      {pieData.map((d, index) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded" style={{ backgroundColor: PIE_COLORS[index] }} />
                          <span className="text-slate-650">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card variant="solid">
          <CardHeader className="flex justify-between items-center">
            <span className="font-display font-semibold text-sm text-slate-800">
              {t('dashboard.recent.latest_assures')}
            </span>
            <Link href="/admin/assures">
              <Button variant="ghost" size="sm" className="text-xs" rightIcon={<ArrowRight size={12} />}>
                {t('dashboard.recent.see_all')}
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.assures.col_nom')}</TableHead>
                  <TableHead>{t('admin.assures.col_id')}</TableHead>
                  <TableHead>{t('admin.assures.col_doctor')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestAssures.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-display font-medium">{a.nom}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{a.idAssure}</TableCell>
                    <TableCell className="text-xs">
                      {a.medecinTraitant ? a.medecinTraitant.nom : t('admin.assures.no_doctor')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{t('admin.assures.status_active')}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/assures/${a.id}`}>
                        <Button variant="ghost" size="sm" leftIcon={<Eye size={13} />}>
                          Voir
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card variant="solid">
          <CardHeader className="flex justify-between items-center">
            <span className="font-display font-semibold text-sm text-slate-800">
              {t('dashboard.recent.latest_remboursements')}
            </span>
            <Link href="/admin/remboursements">
              <Button variant="ghost" size="sm" className="text-xs" rightIcon={<ArrowRight size={12} />}>
                {t('dashboard.recent.see_all')}
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.remboursements.col_assure')}</TableHead>
                  <TableHead>{t('admin.remboursements.col_reimb_amount')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('admin.remboursements.col_mode')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestRemboursements.map((r) => {
                  const sheet = feuilles.find((f) => f.id === r.feuilleMaladieId);
                  const cons = sheet ? consultations.find((c) => c.id === sheet.consultationId) : null;
                  const patientName = cons ? cons.assure.nom : t('common.patient');

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-display font-medium">{patientName}</TableCell>
                      <TableCell className="font-semibold text-success">{formatFCFA(r.montant)}</TableCell>
                      <TableCell className="text-xs">{formatDate(r.dateRemboursement)}</TableCell>
                      <TableCell>
                        <Badge variant={r.modePaiement === 'VIREMENT' ? 'info' : 'warning'}>
                          {r.modePaiement === 'VIREMENT' ? t('admin.remboursements.modal_virement') : t('admin.remboursements.modal_cash')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">{t('admin.remboursements.status_reimbursed')}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
