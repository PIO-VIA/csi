'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, Smartphone, Droplet, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getAssuresByGeneraliste, getConsultationsByMedecin } from '@/lib/api';
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
  const [activeSubTab, setActiveSubTab] = useState<'consultes' | 'declares'>('consultes');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        // Charge uniquement les patients de ce médecin (GET /api/generalistes/{id}/assures)
        const [resAssures, resConsults] = await Promise.all([
          getAssuresByGeneraliste(user.id),
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

  const declaredPatients = allAssures.filter(
    (a) => a.medecinTraitant && a.medecinTraitant.id === user.id
  );

  const uniqueConsultedIds = Array.from(new Set(consultations.map((c) => c.assure.id)));
  const consultedPatients = allAssures.filter((a) => uniqueConsultedIds.includes(a.id));

  const activePatientsList =
    activeSubTab === 'declares' ? declaredPatients : consultedPatients;

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
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          Mes patients
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Consultez vos patients et ceux qui vous ont déclaré comme médecin traitant
        </p>
      </div>

      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveSubTab('consultes')}
          className={`pb-3 px-1 border-b-2 font-display font-semibold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeSubTab === 'consultes'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Patients consultés ({consultedPatients.length})
        </button>
        <button
          onClick={() => setActiveSubTab('declares')}
          className={`pb-3 px-1 border-b-2 font-display font-semibold text-xs uppercase tracking-wider transition cursor-pointer ${
            activeSubTab === 'declares'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Patients déclarés ({declaredPatients.length})
        </button>
      </div>

      <Card variant="solid">
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
                <TableHead>Assuré</TableHead>
                <TableHead>ID Assuré</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Groupe sanguin</TableHead>
                <TableHead>Dernière consultation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 text-xs">
                    Aucun patient trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((p) => {
                  const lastConsult = consultations
                    .filter((c) => c.assure.id === p.id)
                    .sort((a, b) => b.id - a.id)[0];

                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-display font-semibold text-xs">
                        <span className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          {p.nom}
                        </span>
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
                        {lastConsult ? (
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(lastConsult.date)}
                          </span>
                        ) : (
                          '—'
                        )}
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
