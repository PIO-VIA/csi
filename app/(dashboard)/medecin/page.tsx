'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Users,
  Calendar,
  Pill,
  Plus,
  ArrowRight,
  User,
  Clock,
  Heart
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByMedecin, getAssures } from '@/lib/api';
import { Consultation, Assure } from '@/types';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

export default function MedecinDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [allAssures, setAllAssures] = useState<Assure[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resConsults, resAssures] = await Promise.all([
          getConsultationsByMedecin(user.id),
          getAssures()
        ]);
        setConsultations(resConsults.data);
        setAllAssures(resAssures.data);
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

  // Stats
  const totalConsults = consultations.length;
  
  // Patients count (for generalist: number of assured declaring this doctor as physician traitant)
  const isGeneralist = user.role === 'GENERALISTE';
  const trackedPatientsCount = allAssures.filter(
    (a) => a.medecinTraitant && a.medecinTraitant.id === user.id
  ).length;

  // Prescriptions issued
  const totalPrescriptions = consultations.reduce(
    (sum, c) => sum + (c.prescriptions ? c.prescriptions.length : 0),
    0
  );

  // Latest 4 consultations
  const latestConsultations = [...consultations]
    .sort((a, b) => b.id - a.id)
    .slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* WELCOME HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-850 to-primary-900 border border-primary-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-display font-bold text-accent-400 tracking-wider uppercase">
                Tableau de Bord Praticien
              </span>
              <Badge variant={isGeneralist ? 'neutral' : 'warning'}>
                {isGeneralist ? 'Généraliste' : `Spécialiste: ${user.role}`}
              </Badge>
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
              Bonjour, Dr. {user.nom}
            </h1>
            <p className="font-body text-xs text-primary-200 font-mono">
              Matricule : {user.email.split('@')[0].toUpperCase()}
            </p>
          </div>

          <div>
            <Link href="/medecin/consultations/nouvelle">
              <Button variant="primary" size="sm" className="bg-white text-primary-900 hover:bg-slate-100 border-none justify-between" leftIcon={<Plus size={16} />}>
                Nouvelle consultation
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {isGeneralist ? (
          <StatCard
            label="Patients Suivis (Déclaré)"
            value={trackedPatientsCount}
            icon={<Users size={20} />}
            color="primary"
          />
        ) : (
          <StatCard
            label="Total Consultations"
            value={totalConsults}
            icon={<Stethoscope size={20} />}
            color="warning"
          />
        )}
        <StatCard
          label={isGeneralist ? "Consultations Effectuées" : "Patients Consultés"}
          value={totalConsults}
          icon={<Calendar size={20} />}
          color="accent"
        />
        <StatCard
          label="Prescriptions Émises"
          value={totalPrescriptions}
          icon={<Pill size={20} />}
          color="success"
        />
      </div>

      {/* LATEST PATIENTS AND ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Latest Consultations Table (65%) */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex justify-between items-center border-b border-slate-800 pb-4">
              <span className="font-display font-semibold text-sm text-white">Dernières consultations enregistrées</span>
              <Link href="/medecin/consultations">
                <Button variant="ghost" size="sm" className="text-xs hover:text-white" rightIcon={<ArrowRight size={12} />}>
                  Voir tout
                </Button>
              </Link>
            </CardHeader>
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Motif & Diagnostic</TableHead>
                    <TableHead>Ordonnance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestConsultations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-500 text-xs">
                        Aucune consultation enregistrée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    latestConsultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-semibold text-white text-xs">
                          {formatDate(c.date)}
                        </TableCell>
                        <TableCell className="font-display font-medium text-slate-200 text-xs">
                          {c.assure.nom}
                        </TableCell>
                        <TableCell className="text-xs max-w-xs truncate" title={c.motif}>
                          {c.motif}
                        </TableCell>
                        <TableCell>
                          {c.prescriptions && c.prescriptions.length > 0 ? (
                            <Badge variant="info">{c.prescriptions.length} prescriptions</Badge>
                          ) : (
                            <span className="text-slate-500 text-xs italic">Aucune</span>
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

        {/* Right: Info Box and Quick access (35%) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/50">
            <CardBody className="p-5 space-y-4">
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                Parcours de Soins Coordonné
              </h3>
              <div className="h-px bg-slate-800" />
              
              <div className="space-y-3 text-xs font-body text-slate-400 leading-relaxed">
                <div className="flex gap-2.5 items-start">
                  <span className="h-5 w-5 bg-primary-500/10 text-primary-400 flex items-center justify-center rounded-lg mt-0.5 shrink-0">
                    <Heart size={13} />
                  </span>
                  <p>
                    <span className="text-slate-200 font-semibold">Médecin Généraliste :</span> Déclarez l&apos;acte et générez la feuille de maladie pour un remboursement patient à 100%.
                  </p>
                </div>
                
                <div className="flex gap-2.5 items-start">
                  <span className="h-5 w-5 bg-warning/10 text-warning flex items-center justify-center rounded-lg mt-0.5 shrink-0">
                    <Stethoscope size={13} />
                  </span>
                  <p>
                    <span className="text-slate-200 font-semibold">Médecin Spécialiste :</span> Renseignez le code médecin traitant référent pour autoriser une prise en charge à 80%.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
