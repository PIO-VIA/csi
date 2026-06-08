'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Search, Calendar, Stethoscope } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByAssure } from '@/lib/api';
import { Consultation, Prescription } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function AssurePrescriptionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<(Prescription & { date: string; medecin: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await getConsultationsByAssure(user.id);
        const consults: Consultation[] = res.data;
        
        // Extract all prescriptions
        const list = consults.flatMap((c) =>
          (c.prescriptions || []).map((p) => ({
            ...p,
            date: c.date,
            medecin: c.generaliste.nom,
          }))
        );
        
        setPrescriptions(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = prescriptions.filter((p) =>
    (p.type === 'MEDICAMENT' ? p.medicament || '' : p.motif || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    p.medecin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">Mes Prescriptions & Ordonnances</h1>
        <p className="font-body text-xs text-slate-400 mt-1">
          Visualisez les ordonnances actives prescrites par vos praticiens
        </p>
      </div>

      <Card>
        <CardBody className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher par médicament, médecin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 transition"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date d&apos;émission</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead>Type d&apos;ordonnance</TableHead>
                <TableHead>Détails / Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500 font-body">
                    Aucune ordonnance répertoriée.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-white text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(p.date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-white">
                      Dr. {p.medecin}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.type === 'MEDICAMENT' ? 'info' : 'warning'}>
                        {p.type === 'MEDICAMENT' ? 'Médicaments' : 'Réf. Spécialiste'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed">
                      {p.type === 'MEDICAMENT' ? (
                        <div>
                          <span className="font-semibold text-white text-sm">{p.medicament}</span> <br />
                          <span className="text-slate-400 italic text-[11px]">Posologie : {p.posologie}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-white text-sm">Référence vers Spécialiste</span> <br />
                          <span className="text-slate-400 text-[11px]">
                            Médecin matricule : <span className="font-mono text-[10px] text-primary-300 font-medium">{p.matriculeMedecin}</span> <br />
                            Motif : {p.motif}
                          </span>
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
    </motion.div>
  );
}
