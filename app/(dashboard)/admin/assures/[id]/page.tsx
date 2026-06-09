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
  Users
} from 'lucide-react';
import { getAssureById, getConsultationsByAssure, getFeuillesByAssure } from '@/lib/api';
import { Assure, Consultation, FeuillemMaladie, Prescription, Remboursement } from '@/types';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { formatFCFA, formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssureDetailPage({ params }: PageProps) {
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
  if (!assure) return <div className="text-center py-12 text-slate-400">Assuré non trouvé</div>;

  // Extract all prescriptions from consultations
  const prescriptions: Prescription[] = consultations.flatMap((c) =>
    (c.prescriptions || []).map((p) => ({ ...p, date: c.date, medecin: c.generaliste.nom }))
  );

  // Extract all refunds from sheets
  const remboursements = feuilles
    .filter((f) => f.estRembourse && f.remboursement)
    .map((f) => ({
      ...f.remboursement!,
      feuilleRef: f.idFeuille,
      montantSoin: f.montantSoin
    }));

  const tabs = [
    { id: 'consultations', label: 'Consultations', count: consultations.length, icon: <Calendar size={15} /> },
    { id: 'prescriptions', label: 'Prescriptions', count: prescriptions.length, icon: <Pill size={15} /> },
    { id: 'feuilles', label: 'Feuilles de Maladie', count: feuilles.length, icon: <FileText size={15} /> },
    { id: 'remboursements', label: 'Remboursements', count: remboursements.length, icon: <CreditCard size={15} /> },
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
          Retour à la liste
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
                  <Badge variant="success">Assuré Social</Badge>
                </div>
              </div>

              {/* Personal Details */}
              <div className="w-full border-t border-slate-200/80 pt-5 space-y-4 text-xs font-body text-left">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Calendar size={13} /> Nais.</span>
                  <span className="text-slate-700 font-medium">{formatDate(assure.dateNaissance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><User size={13} /> Genre / Statut</span>
                  <span className="text-slate-700 font-medium">{assure.sexe} ({assure.statutMatrimoniale})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Smartphone size={13} /> Téléphone</span>
                  <span className="text-slate-700 font-medium">{assure.numTelephone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Briefcase size={13} /> Profession</span>
                  <span className="text-slate-700 font-medium">{assure.profession}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5"><Droplet size={13} /> Grp. Sanguin</span>
                  <span className="text-danger font-display font-bold">{assure.groupeSanguin}</span>
                </div>
              </div>

              {/* Traitement Physician */}
              <div className="w-full border-t border-slate-200/80 pt-5 text-left space-y-2">
                <span className="text-[10px] font-display uppercase tracking-wider text-slate-400">Médecin Traitant</span>
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
                    Aucun médecin traitant assigné
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
                        <TableHead>Date</TableHead>
                        <TableHead>Médecin</TableHead>
                        <TableHead>Prescriptions</TableHead>
                        <TableHead>Feuille de soin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                            Aucune consultation enregistrée
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
                                      {p.type === 'MEDICAMENT' ? p.medicament : 'Spécialiste'}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-slate-500">Aucune</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {c.feuilleMaladie ? (
                                <Badge variant={c.feuilleMaladie.estRembourse ? 'success' : 'warning'}>
                                  {c.feuilleMaladie.idFeuille}
                                </Badge>
                              ) : (
                                <span className="text-slate-500 text-xs">Aucune</span>
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
                        <TableHead>Date</TableHead>
                        <TableHead>Médecin émetteur</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Détails / Posologie / Motif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                            Aucune prescription émise
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
                                {p.type === 'MEDICAMENT' ? 'Médicament' : 'Consult. Spécialiste'}
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
                        <TableHead>Réf. Feuille</TableHead>
                        <TableHead>Montant Soins</TableHead>
                        <TableHead>Remboursement</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feuilles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-slate-500 text-xs">
                            Aucune feuille de maladie enregistrée
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
                                <span className="italic">Non évalué</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={f.estRembourse ? 'success' : 'warning'}>
                                {f.estRembourse ? 'Evalué / Remboursé' : 'En attente traitement'}
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
                        <TableHead>Date remboursement</TableHead>
                        <TableHead>Feuille associée</TableHead>
                        <TableHead>Montant soin</TableHead>
                        <TableHead>Montant remboursé</TableHead>
                        <TableHead>Mode paiement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {remboursements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                            Aucun virement ou paiement effectué
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
                                {r.modePaiement}
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
