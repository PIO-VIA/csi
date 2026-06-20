'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Activity, User, ShieldAlert, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByMedecin } from '@/lib/api';
import { Consultation } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function MedecinConsultationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await getConsultationsByMedecin(user.id).catch((err) => {
          console.error('Failed to load consultations:', err);
          return { data: [] };
        });
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
    c.assure.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.motif || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            {t('medecin.consultations.title')}
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            {t('medecin.consultations.subtitle')}
          </p>
        </div>
        <Link href="/medecin/consultations/nouvelle">
          <Button variant="primary" leftIcon={<Plus size={16} />}>
            {t('medecin.dashboard.new_consultation')}
          </Button>
        </Link>
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
                <TableHead>{t('medecin.consultations.col_date')}</TableHead>
                <TableHead>{t('medecin.consultations.col_patient')}</TableHead>
                <TableHead>{t('medecin.consultations.col_motif')}</TableHead>
                <TableHead>{t('dashboard.stats.prescriptions')}</TableHead>
                <TableHead>{t('medecin.consultations.col_feuille')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-body">
                    {t('medecin.consultations.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(c.date)}
                      </span>
                    </TableCell>
                    <TableCell className="font-display font-medium text-slate-800 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 bg-slate-850 rounded text-slate-400">
                          <User size={12} />
                        </span>
                        <span>{c.assure.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-sm truncate" title={c.motif || ''}>
                      {c.motif || t('medecin.consultations.not_set')}
                    </TableCell>
                    <TableCell>
                      {c.prescriptions && c.prescriptions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.prescriptions.map((p) => (
                            <Badge key={p.id} variant={p.type === 'MEDICAMENT' ? 'info' : 'warning'} className="scale-90 origin-left">
                              {p.type === 'MEDICAMENT' ? p.medicament : t('medecin.prescriptions.type_specialiste')}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs italic">{t('common.none')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.feuilleMaladie ? (
                        <Badge variant={c.feuilleMaladie.estRembourse ? 'success' : 'warning'}>
                          {c.feuilleMaladie.idFeuille}
                        </Badge>
                      ) : (
                        <span className="text-slate-500 text-xs italic">
                          {t('medecin.consultations.no_feuille')}
                        </span>
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
