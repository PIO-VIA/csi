'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Smartphone, Droplet, Calendar, Heart } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getAssures, getConsultationsByMedecin } from '@/lib/api';
import { Assure, Consultation } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function MedecinPatientsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allAssures, setAllAssures] = useState<Assure[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'suivis' | 'consultes'>('suivis');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resAssures, resConsults] = await Promise.all([
          getAssures(),
          getConsultationsByMedecin(user.id),
        ]);
        setAllAssures(resAssures.data);
        setConsultations(resConsults.data);
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

  const isGeneralist = user.role === 'GENERALISTE';

  // Patients who selected this doctor as their GP
  const suivisPatients = allAssures.filter(
    (a) => a.medecinTraitant && a.medecinTraitant.id === user.id
  );

  // Patients consulted by this doctor (derived from consultations)
  const uniqueConsultedIds = Array.from(new Set(consultations.map((c) => c.assure.id)));
  const consultedPatients = allAssures.filter((a) => uniqueConsultedIds.includes(a.id));

  // Determine active list
  const showSuivis = isGeneralist && activeSubTab === 'suivis';
  const activePatientsList = showSuivis ? suivisPatients : consultedPatients;

  // Filter list
  const filteredPatients = activePatientsList.filter((p) =>
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
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">Suivi des Patients</h1>
        <p className="font-body text-xs text-slate-400 mt-1">
          {isGeneralist
            ? 'Gérez la liste de vos assurés déclarés et l\'historique des patients consultés'
            : 'Consultez la liste des patients reçus en consultation spécialisée'}
        </p>
      </div>

      {/* Sub Tabs (Only for generalist) */}
      {isGeneralist && (
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveSubTab('suivis')}
            className={`pb-3 px-1 border-b-2 font-display font-semibold text-xs uppercase tracking-wider transition cursor-pointer ${
              activeSubTab === 'suivis'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-slate-450 hover:text-white'
            }`}
          >
            Patients déclarés ({suivisPatients.length})
          </button>
          <button
            onClick={() => setActiveSubTab('consultes')}
            className={`pb-3 px-1 border-b-2 font-display font-semibold text-xs uppercase tracking-wider transition cursor-pointer ${
              activeSubTab === 'consultes'
                ? 'border-primary-500 text-white'
                : 'border-transparent text-slate-450 hover:text-white'
            }`}
          >
            Patients consultés ({consultedPatients.length})
          </button>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardBody className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher par nom, ID assuré, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition"
            />
          </div>
        </CardBody>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Assuré</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Date Naissance</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Grp. Sanguin</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-body">
                    Aucun patient répertorié.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs text-primary-400 font-semibold">
                      {p.idAssure}
                    </TableCell>
                    <TableCell className="font-display font-semibold text-white text-xs">
                      {p.nom}
                    </TableCell>
                    <TableCell className="text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Smartphone size={13} className="text-slate-500" />
                        {p.numTelephone}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(p.dateNaissance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{p.sexe}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-danger bg-danger/10 border border-danger/20 font-display font-bold px-1.5 py-0.5 rounded">
                        <Droplet size={10} />
                        {p.groupeSanguin || 'O+'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Actif</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </motion.div>
  );
}
