'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByMedecin } from '@/lib/api';
import { Consultation, FeuillemMaladie } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate, formatFCFA } from '@/lib/utils';

export default function MedecinFeuillesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feuilles, setFeuilles] = useState<(FeuillemMaladie & { date: string; patient: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const res = await getConsultationsByMedecin(user.id);
        const consults: Consultation[] = res.data;
        
        // Extract all sheets
        const list = consults
          .filter((c) => c.feuilleMaladie)
          .map((c) => ({
            ...c.feuilleMaladie!,
            date: c.date,
            patient: c.assure.nom,
          }));
        
        setFeuilles(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = feuilles.filter((f) =>
    f.idFeuille.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('medecin.feuilles.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('medecin.feuilles.subtitle')}
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
              placeholder={t('medecin.consultations.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('medecin.feuilles.col_id')}</TableHead>
                <TableHead>{t('medecin.feuilles.col_consultation')}</TableHead>
                <TableHead>{t('common.patient')}</TableHead>
                <TableHead>{t('medecin.feuilles.col_amount')}</TableHead>
                <TableHead>{t('medecin.feuilles.col_status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-body">
                    {t('medecin.feuilles.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(f.date)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-accent-400">
                      <span className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-500" />
                        {f.idFeuille}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="p-1 bg-slate-850 rounded text-slate-400">
                          <User size={12} />
                        </span>
                        <span>{f.patient}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {formatFCFA(f.montantSoin)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.estRembourse ? 'success' : 'warning'}>
                        {f.estRembourse ? t('medecin.feuilles.reimbursed') : t('medecin.feuilles.pending')}
                      </Badge>
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
