'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Stethoscope, FileText } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByAssure } from '@/lib/api';
import { Consultation } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function AssureConsultationsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await getConsultationsByAssure(user.id);
        setConsultations(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = consultations.filter((c) =>
    c.generaliste.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.motif.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-white tracking-tight">Mes Consultations</h1>
        <p className="font-body text-xs text-slate-400 mt-1">
          Historique complet de vos rendez-vous et examens médicaux enregistrés
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
              placeholder="Rechercher par médecin, motif, diagnostic..."
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
                <TableHead>Date</TableHead>
                <TableHead>Médecin</TableHead>
                <TableHead>Type d&apos;Acte</TableHead>
                <TableHead>Motif & Diagnostic</TableHead>
                <TableHead>Feuille de soin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-body">
                    Aucune consultation trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-white text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(c.date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-white">
                      Dr. {c.generaliste.nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.generaliste.type === 'GENERALISTE' ? 'neutral' : 'warning'}>
                        {c.generaliste.type === 'GENERALISTE' ? 'Généraliste' : 'Spécialiste'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-sm truncate" title={c.motif}>
                      {c.motif}
                    </TableCell>
                    <TableCell>
                      {c.feuilleMaladie ? (
                        <Badge variant={c.feuilleMaladie.estRembourse ? 'success' : 'warning'}>
                          {c.feuilleMaladie.idFeuille}
                        </Badge>
                      ) : (
                        <span className="text-slate-500 text-xs italic">Non générée</span>
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
