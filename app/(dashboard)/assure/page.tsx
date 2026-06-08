'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  User,
  Heart,
  Stethoscope,
  ArrowRight,
  Calendar,
  FileText,
  CreditCard,
  Pill,
  Activity,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByAssure, getFeuillesByAssure, getAssureById } from '@/lib/api';
import { Consultation, FeuillemMaladie, Assure } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate, formatFCFA } from '@/lib/utils';

export default function AssureDashboardPage() {
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
          getFeuillesByAssure(user.id)
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

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;
  if (!assureInfo) return <div className="text-slate-400">Une erreur est survenue lors de la récupération de vos données.</div>;

  // Build the timeline events
  const timelineEvents: {
    id: string;
    title: string;
    description: string;
    date: string;
    type: 'consultation' | 'prescription' | 'feuille' | 'remboursement';
    icon: React.ReactNode;
    colorClass: string;
  }[] = [];

  // Sort consultations by date desc
  const sortedConsultations = [...consultations].sort((a, b) => b.id - a.id);

  sortedConsultations.forEach((c) => {
    // 1. Consultation event
    timelineEvents.push({
      id: `c-${c.id}`,
      title: 'Consultation médicale',
      description: `Avec Dr. ${c.generaliste.nom} (${c.generaliste.type.toLowerCase()}) pour le motif : "${c.motif}"`,
      date: c.date,
      type: 'consultation',
      icon: <Calendar size={14} />,
      colorClass: 'bg-primary-500'
    });

    // 2. Prescription event
    if (c.prescriptions && c.prescriptions.length > 0) {
      const pCount = c.prescriptions.length;
      timelineEvents.push({
        id: `p-${c.id}`,
        title: 'Ordonnance émise',
        description: `${pCount} prescription(s) prescrite(s) lors de votre consultation.`,
        date: c.date,
        type: 'prescription',
        icon: <Pill size={14} />,
        colorClass: 'bg-info'
      });
    }

    // 3. Sheet event
    if (c.feuilleMaladie) {
      timelineEvents.push({
        id: `f-${c.id}`,
        title: 'Feuille de maladie créée',
        description: `Réf: ${c.feuilleMaladie.idFeuille} - Montant de soin : ${formatFCFA(c.feuilleMaladie.montantSoin)}`,
        date: c.date,
        type: 'feuille',
        icon: <FileText size={14} />,
        colorClass: 'bg-warning'
      });

      // 4. Refund event
      if (c.feuilleMaladie.estRembourse && c.feuilleMaladie.remboursement) {
        timelineEvents.push({
          id: `r-${c.id}`,
          title: 'Remboursement validé',
          description: `Virement de ${formatFCFA(c.feuilleMaladie.remboursement.montant)} transmis via ${c.feuilleMaladie.remboursement.modePaiement}`,
          date: c.feuilleMaladie.remboursement.dateRemboursement,
          type: 'remboursement',
          icon: <CreditCard size={14} />,
          colorClass: 'bg-success'
        });
      }
    }
  });

  const latestEvents = timelineEvents.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* WELCOME HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-850 to-primary-900 border border-primary-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-display font-semibold text-accent-400 tracking-wider uppercase">
              Espace Personnel Assuré
            </span>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              Bonjour, {assureInfo.nom} !
            </h1>
            <p className="font-body text-xs text-primary-200 max-w-lg leading-relaxed">
              Bienvenue sur votre portail national de sécurité sociale. Suivez vos remboursements de soins de santé en temps réel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/assure/consultations">
              <Button variant="primary" size="sm" className="bg-white text-primary-900 hover:bg-slate-100 border-none justify-between w-full sm:w-auto">
                <span>Mes consultations</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
            <Link href="/assure/remboursements">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto">
                Suivre mes remboursements
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK INFOS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Card: Doctor Traitant Info */}
        <div className="md:col-span-5">
          <Card className="h-full">
            <div className="p-5 flex flex-col gap-6 h-full justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-display font-bold text-slate-400 tracking-wider uppercase">
                  Médecin Traitant Déclaré
                </span>
                <div className="h-px bg-slate-800/80" />
              </div>

              {assureInfo.medecinTraitant ? (
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-400 flex items-center justify-center">
                      <Stethoscope size={24} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-display font-bold text-sm text-white truncate">
                        Dr. {assureInfo.medecinTraitant.nom}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                        Matricule : {assureInfo.medecinTraitant.matricule}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-[11px] font-body text-slate-455 leading-relaxed">
                    <span className="text-success font-semibold">Taux de remboursement : 100%</span>. <br />
                    Toutes vos consultations chez ce médecin traitant généraliste sont couvertes en totalité.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="h-12 w-12 rounded-full bg-warning/15 text-warning flex items-center justify-center border border-warning/20">
                    <Activity size={24} />
                  </div>
                  <div className="space-y-1 max-w-xs">
                    <h3 className="font-display font-bold text-xs text-white">Médecin Traitant Non Défini</h3>
                    <p className="text-[10px] font-body text-slate-400 leading-normal">
                      Déclarez un médecin traitant généraliste afin de bénéficier d&apos;un remboursement optimal de soins.
                    </p>
                  </div>
                  <Link href="/assure/medecin" className="w-full">
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      Choisir mon médecin traitant
                    </Button>
                  </Link>
                </div>
              )}

              {/* Blood group */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                <span className="text-[10px] font-display font-medium text-slate-400 uppercase tracking-wider">Groupe Sanguin</span>
                <span className="flex items-center gap-1 text-danger font-display font-bold text-xs bg-danger/10 border border-danger/20 px-2 py-0.5 rounded-lg">
                  {assureInfo.groupeSanguin || 'O+'}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Card: Activity Timeline */}
        <div className="md:col-span-7">
          <Card className="h-full">
            <div className="p-5 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-display font-bold text-slate-400 tracking-wider uppercase">
                  Dernières Activités de Soin
                </span>
                <Badge variant="neutral">Fil d&apos;actualité</Badge>
              </div>

              <div className="h-px bg-slate-800/80 -mt-2" />

              {/* Vertical Timeline */}
              <div className="space-y-6 relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                {latestEvents.length === 0 ? (
                  <div className="text-center py-12 text-xs font-body text-slate-500">
                    Aucune activité enregistrée pour le moment.
                  </div>
                ) : (
                  latestEvents.map((evt, idx) => (
                    <div key={evt.id} className="relative group">
                      {/* Timeline dot icon */}
                      <span className={`absolute -left-[23px] top-0.5 h-6.5 w-6.5 rounded-full flex items-center justify-center text-white border-2 border-slate-900 shadow-md ${evt.colorClass}`}>
                        {evt.icon}
                      </span>
                      
                      {/* Content block */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-4">
                          <h4 className="font-display font-bold text-xs text-white">
                            {evt.title}
                          </h4>
                          <span className="text-[9px] font-body text-slate-500">
                            {formatDate(evt.date)}
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-slate-400 leading-normal">
                          {evt.description}
                        </p>
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
