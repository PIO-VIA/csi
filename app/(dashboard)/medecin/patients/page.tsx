'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, User, Smartphone, Droplet, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getMesAssures, getConsultationsByMedecin, getMesOrientationsEnriched, type EnrichedOrientation } from '@/lib/api';
import { Assure, Consultation } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function MedecinPatientsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allAssures, setAllAssures] = useState<Assure[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'consultes' | 'declares'>('consultes');
  const [orientations, setOrientations] = useState<EnrichedOrientation[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resAssures, resConsults, resOrientations] = await Promise.all([
          getMesAssures().catch((err) => {
            console.error('Failed to load assured patients:', err);
            return { data: [] as Assure[] };
          }),
          getConsultationsByMedecin(user.id).catch((err) => {
            console.error('Failed to load consultations:', err);
            return { data: [] as Consultation[] };
          }),
          user.role === 'SPECIALISTE'
            ? getMesOrientationsEnriched().catch((err) => {
                console.error('Failed to load orientations:', err);
                return [] as EnrichedOrientation[];
              })
            : Promise.resolve([] as EnrichedOrientation[])
        ]);
        setAllAssures(resAssures.data);
        setConsultations(resConsults.data);
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
  const activeSubTabEffective = isSpecialistUser ? 'declares' : activeSubTab;
  const declaredPatients = allAssures;

  // Gather oriented patients from orientations
  const orientedPatientsMap = new Map();
  orientations.forEach((o) => {
    if (!o.patientId) return;
    orientedPatientsMap.set(o.patientId, {
      id: o.patientId,
      idAssure: o.patientIdAssure,
      nom: o.patientName,
      numTelephone: o.patientPhone,
      email: o.consultation?.assure?.email || '',
      groupeSanguin: o.consultation?.assure?.groupeSanguin || '',
      photoUrl: o.consultation?.assure?.photoUrl || undefined,
    });
  });
  const orientedPatients = Array.from(orientedPatientsMap.values()) as Assure[];

  // Gather unique consulted patients directly from consultations so we get them even if not in allAssures (declared)
  const consultedPatientsMap = new Map(consultations.map((c) => [c.assure.id, c.assure]));
  const consultedPatients = Array.from(consultedPatientsMap.values());

  const activePatientsList =
    activeSubTabEffective === 'declares'
      ? (isSpecialistUser ? orientedPatients : declaredPatients)
      : consultedPatients;

  const filteredPatients = activePatientsList.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.idAssure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.numTelephone.includes(searchTerm)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            {t('medecin.patients.title')}
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            {t('medecin.patients.subtitle')}
          </p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 gap-4">
        {!isSpecialistUser && (
          <button
            onClick={() => setActiveSubTab('consultes')}
            className={`pb-3 px-1 border-b-2 font-display font-semibold text-xs tracking-wide uppercase transition cursor-pointer ${
              activeSubTabEffective === 'consultes'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('medecin.patients.tab_consulted')} ({consultedPatients.length})
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('declares')}
          className={`pb-3 px-1 border-b-2 font-display font-semibold text-xs tracking-wide uppercase transition cursor-pointer ${
            activeSubTabEffective === 'declares'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {isSpecialistUser ? "Patients orientés" : t('medecin.patients.tab_declared')} ({isSpecialistUser ? orientedPatients.length : declaredPatients.length})
        </button>
      </div>

      <Card>
        <CardBody className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t('medecin.patients.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>
        </CardBody>
      </Card>

      <Card variant="solid">
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('medecin.patients.col_assure')}</TableHead>
                <TableHead>{t('medecin.patients.col_id')}</TableHead>
                <TableHead>{t('medecin.patients.col_phone')}</TableHead>
                <TableHead>{t('medecin.patients.col_blood')}</TableHead>
                <TableHead>{isSpecialistUser ? "Orientation" : t('medecin.patients.col_last_consult')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 text-xs">
                    {activeSubTab === 'consultes' ? (
                      <EmptyState
                        title="Aucun patient consulté"
                        description="Vous n'avez pas encore enregistré de consultation."
                        actionText="Première consultation"
                        onAction={() => router.push('/medecin/consultations/nouvelle')}
                      />
                    ) : (
                      <EmptyState
                        title={isSpecialistUser ? "Aucun patient orienté" : "Aucun assuré déclaré"}
                        description={isSpecialistUser ? "Aucun médecin généraliste ne vous a encore orienté de patient." : "Aucun assuré ne vous a encore déclaré comme médecin traitant."}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => {
                  const lastConsult = consultations
                    .filter((c) => c.assure.id === p.id)
                    .sort((a, b) => b.id - a.id)[0];

                  const patientOrientation = orientations.find((o) => o.patientId === p.id);

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-display font-semibold text-xs">
                        <div className="flex items-center gap-2.5">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.nom}
                              className="h-7 w-7 rounded-full object-cover shadow-sm"
                            />
                          ) : (
                            <span className="p-1.5 bg-slate-850 rounded text-slate-400">
                              <User size={14} />
                            </span>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-900 font-semibold">{p.nom}</span>
                            {p.email && <span className="text-[10px] text-slate-400 font-normal">{p.email}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">{p.idAssure}</TableCell>
                      <TableCell className="text-xs">
                        <span className="flex items-center gap-1">
                          <Smartphone size={12} className="text-slate-400" />
                          {p.numTelephone}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">
                          <span className="flex items-center gap-1">
                            <Droplet size={10} />
                            {p.groupeSanguin || 'N/A'}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {isSpecialistUser && patientOrientation ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
                              <Calendar size={11} /> Référé le {patientOrientation.date ? formatDate(patientOrientation.date) : '—'}
                            </span>
                            <span
                              className="text-[10px] text-slate-500 truncate max-w-32"
                              title={patientOrientation.motif || ''}
                            >
                              Prescrit par Dr. {patientOrientation.medecinPrescripteur}
                            </span>
                          </div>
                        ) : lastConsult ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1 text-xs">
                              <Calendar size={11} /> {formatDate(lastConsult.date)}
                            </span>
                            <span
                              className="text-[10px] text-slate-400 truncate max-w-32"
                              title={lastConsult.motif || ''}
                            >
                              {lastConsult.motif || 'Motif non renseigné'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {isSpecialistUser ? (
                            <Badge variant="warning" className="px-3 py-1 text-[10px] font-semibold">Dossier Orienté</Badge>
                          ) : (
                            <Link href={`/medecin/consultations/nouvelle?assureId=${p.id}`}>
                              <Button variant="primary" size="sm" className="text-xs px-3">
                                Consulter
                              </Button>
                            </Link>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </motion.div>
  );
}

