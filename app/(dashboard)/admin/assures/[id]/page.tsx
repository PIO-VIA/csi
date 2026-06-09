'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  FileText,
  CreditCard,
  Pill,
  User,
  Heart,
  Droplet,
  Smartphone,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getAssureById, getConsultationsByAssure, getFeuillesByAssure } from '@/lib/api';
import { Assure, Consultation, FeuillemMaladie, Prescription } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { formatFCFA, formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssureDetailPage({ params }: PageProps) {
  const { t } = useTranslation();
  const unwrappedParams = use(params);
  const assureId = Number(unwrappedParams.id);

  const [loading, setLoading] = useState(true);
  const [assure, setAssure] = useState<Assure | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [feuilles, setFeuilles] = useState<FeuillemMaladie[]>([]);
  const [activeTab, setActiveTab] = useState<'consultations' | 'prescriptions' | 'feuilles' | 'remboursements'>('consultations');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resAssure, resConsultations, resFeuilles] = await Promise.all([
          getAssureById(assureId),
          getConsultationsByAssure(assureId),
          getFeuillesByAssure(assureId)
        ]);
        setAssure(resAssure.data);
        setConsultations(resConsultations.data);
        setFeuilles(resFeuilles.data);
      } catch (e) {
        console.error('Failed to load patient details:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [assureId]);

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;
  if (!assure) return <div className="text-center py-12 text-slate-400">{t('admin.assures.not_found')}</div>;

  const prescriptions: Prescription[] = consultations.flatMap((c) =>
    (c.prescriptions || []).map((p) => ({ ...p, date: c.date, medecin: c.generaliste.nom }))
  );

  const remboursements = feuilles
    .filter((f) => f.estRembourse && f.remboursement)
    .map((f) => ({
      ...f.remboursement!,
      feuilleRef: f.idFeuille,
      montantSoin: f.montantSoin
    }));

  const tabs = [
    { id: 'consultations', label: t('medecin.dashboard.consultations'), count: consultations.length, icon: <Calendar size={15} /> },
    { id: 'prescriptions', label: t('dashboard.stats.prescriptions'), count: prescriptions.length, icon: <Pill size={15} /> },
    { id: 'feuilles', label: t('admin.remboursements.col_feuille'), count: feuilles.length, icon: <FileText size={15} /> },
    { id: 'remboursements', label: t('assure.dashboard.my_remboursements'), count: remboursements.length, icon: <CreditCard size={15} /> },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back Link */}
      <Link href="/admin/assures">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />}>
          {t('common.back')}
        </Button>
      </Link>

      {/* Main Grid: Info card left, details tab right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column (Profile Card) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardBody className="flex flex-col items-center text-center p-6 space-y-6">
              {/* Profile Avatar */}
              <div className="h-20 w-20 rounded-full flex items-center justify-center font-display font-extrabold text-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl">
                {assure.nom.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <h2 className="font-display font-bold text-lg text-slate-900">{assure.nom}</h2>
                <span className="font-mono text-xs text-accent-400 font-medium">{assure.idAssure}</span>
                <div className="pt-2">
                  <Badge variant="success">{t('admin.assures.status_active')}</Badge>
                </div>
              </div>

              {/* Personal Details */}
              <div className="w-full border-t border-slate-200/80 pt-5 space-y-4 text-xs font-body text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Calendar size={13} /> {t('admin.assures.form_dob')}</span>
                  <span className="text-slate-700 font-medium">{formatDate(assure.dateNaissance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><User size={13} /> {t('admin.assures.form_sex')} / {t('admin.assures.form_matrimonial')}</span>
                  <span className="text-slate-700 font-medium">{assure.sexe} ({assure.statutMatrimoniale})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Smartphone size={13} /> {t('admin.assures.form_phone')}</span>
                  <span className="text-slate-700 font-medium">{assure.numTelephone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Briefcase size={13} /> {t('admin.assures.form_profession')}</span>
                  <span className="text-slate-700 font-medium">{assure.profession}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Droplet size={13} /> {t('auth.blood_group')}</span>
                  <span className="text-danger font-display font-bold">{assure.groupeSanguin}</span>
                </div>
              </div>

              {/* Traitement Physician */}
              <div className="w-full border-t border-slate-200/80 pt-5 text-left space-y-2">
                <span className="text-[10px] font-display uppercase tracking-wider text-slate-400">{t('admin.assures.form_doctor')}</span>
                {assure.medecinTraitant ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="p-2 bg-primary-500/10 text-primary-400 rounded-lg">
                      <Heart size={16} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-display font-semibold text-xs text-white truncate">{assure.medecinTraitant.nom}</span>
                      <span className="text-[9px] text-slate-500 font-mono truncate">{assure.medecinTraitant.matricule}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 border border-dashed border-slate-800 text-center rounded-xl text-xs text-slate-500">
                    {t('admin.assures.no_doctor')}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Right column (Tabs & Data Tables) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tabs header */}
          <div className="flex border-b border-slate-200 overflow-x-auto gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-display font-medium text-xs tracking-wide uppercase transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-body ${
                  activeTab === tab.id ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-850 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}
          <div>
            {/* Consultations Tab */}
            {activeTab === 'consultations' && (
              <Card>
                <CardBody className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('admin.medecins.col_type')}</TableHead>
                        <TableHead>{t('dashboard.stats.prescriptions')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_ref')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                            {t('medecin.dashboard.no_consultation')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        consultations.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-semibold text-xs">{formatDate(c.date)}</TableCell>
                            <TableCell className="text-xs text-slate-700">
                              <span className="font-semibold">{c.generaliste.nom}</span> <br />
                              <span className="text-[10px] text-slate-400 uppercase tracking-wide">{c.generaliste.type}</span>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex flex-wrap gap-1">
                                {c.prescriptions && c.prescriptions.length > 0 ? (
                                  c.prescriptions.map((p) => (
                                    <Badge key={p.id} variant="neutral" className="scale-90 origin-left">
                                      {p.type === 'MEDICAMENT' ? p.medicament : t('admin.medecins.specialiste')}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-slate-500">{t('common.none')}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {c.feuilleMaladie ? (
                                <Badge variant={c.feuilleMaladie.estRembourse ? 'success' : 'warning'}>
                                  {c.feuilleMaladie.idFeuille}
                                </Badge>
                              ) : (
                                <span className="text-slate-500 text-xs">{t('common.none')}</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            )}

            {/* Prescriptions Tab */}
            {activeTab === 'prescriptions' && (
              <Card>
                <CardBody className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('common.date')}</TableHead>
                        <TableHead>{t('admin.remboursements.modal_acted_by')}</TableHead>
                        <TableHead>{t('admin.medecins.col_type')}</TableHead>
                        <TableHead>{t('admin.remboursements.modal_details')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                            {t('common.none')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        prescriptions.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs font-semibold">
                              {formatDate((p as any).date)}
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">{(p as any).medecin}</TableCell>
                            <TableCell>
                              <Badge variant={p.type === 'MEDICAMENT' ? 'info' : 'warning'}>
                                {p.type === 'MEDICAMENT' ? t('medecin.prescriptions.type_med') : t('medecin.prescriptions.type_spec')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs leading-normal">
                              {p.type === 'MEDICAMENT' ? (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-white">{p.medicament}</span> <br />
                                  <span className="text-slate-400 italic text-[11px]">{p.posologie}</span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-white">Réf. Dr. matricule: {p.matriculeMedecin}</span> <br />
                                  <span className="text-slate-400 text-[11px]">{p.motif}</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            )}

            {/* Sheets Tab */}
            {activeTab === 'feuilles' && (
              <Card>
                <CardBody className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.remboursements.col_ref')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_soin_amount')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_reimb_amount')}</TableHead>
                        <TableHead>{t('common.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feuilles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                            {t('medecin.feuilles.empty_list')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        feuilles.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-mono text-xs font-semibold">{f.idFeuille}</TableCell>
                            <TableCell className="font-semibold text-slate-700 text-xs">{formatFCFA(f.montantSoin)}</TableCell>
                            <TableCell className="text-xs text-slate-400">
                              {f.remboursement ? (
                                <span className="text-success font-semibold">+{formatFCFA(f.remboursement.montant)}</span>
                              ) : (
                                <span className="italic">{t('common.none')}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={f.estRembourse ? 'success' : 'warning'}>
                                {f.estRembourse ? t('admin.remboursements.status_reimbursed') : t('admin.remboursements.pending_title')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            )}

            {/* Remboursements Tab */}
            {activeTab === 'remboursements' && (
              <Card>
                <CardBody className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.remboursements.col_date')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_ref')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_soin_amount')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_reimb_amount')}</TableHead>
                        <TableHead>{t('admin.remboursements.col_mode')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remboursements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                            {t('admin.remboursements.history_none')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        remboursements.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-xs font-semibold">{formatDate(r.dateRemboursement)}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-400">{r.feuilleRef}</TableCell>
                            <TableCell className="text-xs text-slate-600">{formatFCFA(r.montantSoin)}</TableCell>
                            <TableCell className="font-semibold text-success text-xs">+{formatFCFA(r.montant)}</TableCell>
                            <TableCell>
                              <Badge variant={r.modePaiement === 'VIREMENT' ? 'info' : 'warning'}>
                                {r.modePaiement === 'VIREMENT' ? t('admin.remboursements.modal_virement') : t('admin.remboursements.modal_cash')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
