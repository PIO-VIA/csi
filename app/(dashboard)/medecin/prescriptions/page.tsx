'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Search, Calendar, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByMedecin } from '@/lib/api';
import { Consultation, Prescription } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function MedecinPrescriptionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<(Prescription & { date: string; patient: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await getConsultationsByMedecin(user.id);
        const consults: Consultation[] = res.data;
        
        // Extract all prescriptions
        const list = consults.flatMap((c) =>
          (c.prescriptions || []).map((p) => ({
            ...p,
            date: c.date,
            patient: c.assure.nom,
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
    p.patient.toLowerCase().includes(searchTerm.toLowerCase())
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
          {t('medecin.prescriptions.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('medecin.prescriptions.subtitle')}
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
              placeholder={t('medecin.prescriptions.search_placeholder')}
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
                <TableHead>{t('medecin.prescriptions.col_date')}</TableHead>
                <TableHead>{t('medecin.prescriptions.col_patient')}</TableHead>
                <TableHead>{t('medecin.prescriptions.col_type')}</TableHead>
                <TableHead>{t('medecin.prescriptions.col_details')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500 font-body">
                    {t('medecin.prescriptions.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(p.date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="p-1 bg-slate-850 rounded text-slate-400">
                          <User size={12} />
                        </span>
                        <span>{p.patient}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.type === 'MEDICAMENT' ? 'info' : 'warning'}>
                        {p.type === 'MEDICAMENT' ? t('medecin.prescriptions.type_medicament') : t('medecin.prescriptions.type_specialiste')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed">
                      {p.type === 'MEDICAMENT' ? (
                        <div>
                          <span className="font-semibold text-sm">{p.medicament}</span> <br />
                          <span className="text-slate-400 italic text-[11px]">{t('medecin.nouvelle_consultation.posologie')} : {p.posologie}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-sm font-display">{t('medecin.prescriptions.type_specialiste')}</span> <br />
                          <span className="text-slate-400 text-[11px]">
                            {t('medecin.nouvelle_consultation.specialiste_matricule')} : <span className="font-mono text-primary-300 font-medium">{p.matriculeMedecin}</span> <br />
                            {t('medecin.nouvelle_consultation.referral_motif')} : {p.motif}
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
