'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Activity, User, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getConsultations } from '@/lib/api';
import { Consultation } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';

export default function ConsultationsAdminPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'GENERALISTE' | 'SPECIALISTE'>('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await getConsultations();
        setConsultations(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      c.assure.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.generaliste.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.motif || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'ALL' || c.generaliste.type === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('admin.consultations.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('admin.consultations.subtitle')}
        </p>
      </div>

      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t('admin.consultations.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>

          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl w-full md:w-auto">
            {(['ALL', 'GENERALISTE', 'SPECIALISTE'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterCategory(type)}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-display font-medium uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  filterCategory === type
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {type === 'ALL'
                  ? t('admin.consultations.filter_all')
                  : type === 'GENERALISTE'
                  ? t('admin.consultations.filter_general')
                  : t('admin.consultations.filter_specialist')}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.consultations.col_date')}</TableHead>
                <TableHead>{t('admin.consultations.col_assure')}</TableHead>
                <TableHead>{t('admin.consultations.col_doctor')}</TableHead>
                <TableHead>{t('admin.consultations.col_type')}</TableHead>
                <TableHead>{t('admin.consultations.col_motif')}</TableHead>
                <TableHead>{t('admin.consultations.col_feuille')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConsultations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-body">
                    {t('admin.consultations.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsultations.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(c.date)}
                      </span>
                    </TableCell>
                    <TableCell className="font-display font-semibold text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-slate-800 rounded text-slate-400">
                          <User size={12} />
                        </span>
                        <span>{c.assure.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {c.generaliste.nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.generaliste.type === 'GENERALISTE' ? 'neutral' : 'warning'}>
                        {c.generaliste.type === 'GENERALISTE'
                          ? t('admin.consultations.generaliste')
                          : t('admin.consultations.specialiste')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={c.motif || ''}>
                      {c.motif || t('admin.consultations.not_set')}
                    </TableCell>
                    <TableCell>
                      {c.feuilleMaladie ? (
                        <Badge variant={c.feuilleMaladie.estRembourse ? 'success' : 'warning'}>
                          {c.feuilleMaladie.idFeuille}
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-warning font-semibold font-display">
                          <ShieldAlert size={12} />
                          {t('admin.consultations.pending_fm')}
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
