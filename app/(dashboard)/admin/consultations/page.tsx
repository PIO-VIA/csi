'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Search, Activity, User, ShieldAlert, Plus, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getConsultations, createFeuille } from '@/lib/api';
import { Consultation } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Input from '@/components/ui/Input';

export default function ConsultationsAdminPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'GENERALISTE' | 'SPECIALISTE'>('ALL');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  // Créer feuille modal
  const [selectedConsultForFeuille, setSelectedConsultForFeuille] = useState<Consultation | null>(null);
  const [isFeuilleModalOpen, setIsFeuilleModalOpen] = useState(false);
  const [idFeuille, setIdFeuille] = useState('');
  const [montantSoin, setMontantSoin] = useState(0);
  const [isCreatingFeuille, setIsCreatingFeuille] = useState(false);

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      c.assure.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.generaliste.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.motif || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'ALL' || c.generaliste.type === filterCategory;
    const matchesDate =
      (!filterFrom || c.date >= filterFrom) &&
      (!filterTo || c.date <= filterTo);
    return matchesSearch && matchesCategory && matchesDate;
  });

  const handleCreateFeuille = async () => {
    if (!selectedConsultForFeuille) return;
    setIsCreatingFeuille(true);
    try {
      await createFeuille({
        consultationId: selectedConsultForFeuille.id,
        montantSoin,
        idFeuille: idFeuille.trim() || undefined,
      });
      success(t('admin.consultations.create_sheet_success') || 'La feuille de maladie a été créée avec succès.');
      setIsFeuilleModalOpen(false);
      setSelectedConsultForFeuille(null);
      setIdFeuille('');
      setMontantSoin(0);
      loadData();
    } catch (e) {
      console.error(e);
      error(t('admin.consultations.create_sheet_error') || 'Erreur lors de la création de la feuille.');
    } finally {
      setIsCreatingFeuille(false);
    }
  };

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

      {/* FILTER BAR */}
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

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="dashboard-input w-36 text-xs"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="dashboard-input w-36 text-xs"
          />

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

      {/* Result counter */}
      <p className="text-xs text-slate-500 font-body">
        {filteredConsultations.length} {t('admin.consultations.results_count') || 'consultation(s) trouvée(s)'}
      </p>

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
                        <span className="p-1 bg-slate-100 rounded text-slate-500">
                          <User size={12} />
                        </span>
                        <span>{c.assure.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {c.generaliste.nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.generaliste.type === 'GENERALISTE' ? 'info' : 'warning'}>
                        {c.generaliste.type === 'GENERALISTE'
                          ? t('admin.consultations.generaliste')
                          : t('admin.consultations.specialiste')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={c.motif || ''}>
                      {c.motif || t('admin.consultations.not_set')}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 flex flex-col items-start">
                        {c.feuillesMaladie && c.feuillesMaladie.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {c.feuillesMaladie.map((f) => (
                              <Badge key={f.id} variant={f.estRembourse ? 'success' : 'warning'}>
                                {f.idFeuille}
                              </Badge>
                            ))}
                          </div>
                        ) : c.feuilleMaladie ? (
                          <Badge variant={c.feuilleMaladie.estRembourse ? 'success' : 'warning'}>
                            {c.feuilleMaladie.idFeuille}
                          </Badge>
                        ) : null}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] px-2 py-1 h-7"
                          onClick={() => {
                            setSelectedConsultForFeuille(c);
                            setIsFeuilleModalOpen(true);
                          }}
                        >
                          {c.feuilleMaladie || (c.feuillesMaladie && c.feuillesMaladie.length > 0)
                            ? "+ Ajouter feuille"
                            : t('admin.consultations.create_sheet_btn') || '+ Créer feuille'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Créer Feuille Modal */}
      {selectedConsultForFeuille && (
        <Modal
          isOpen={isFeuilleModalOpen}
          onClose={() => {
            setIsFeuilleModalOpen(false);
            setSelectedConsultForFeuille(null);
            setIdFeuille('');
            setMontantSoin(0);
          }}
          title={t('admin.consultations.create_sheet_title') || 'Créer une feuille de maladie'}
          description={`Patient: ${selectedConsultForFeuille.assure.nom}`}
        >
          <div className="space-y-4">
            <Input
              id="input-admin-create-id-feuille"
              label="Référence de la feuille (ID, optionnel)"
              placeholder="Laisser vide pour génération automatique"
              value={idFeuille}
              onChange={(e) => setIdFeuille(e.target.value)}
              leftIcon={<FileText size={16} className="text-slate-400" />}
            />
            <div className="form-group">
              <label className="form-label">{t('admin.consultations.montant_soin_label') || 'Montant des soins (FCFA)'}</label>
              <input
                type="number"
                min={0}
                value={montantSoin}
                onChange={(e) => setMontantSoin(Number(e.target.value))}
                className="dashboard-input"
                placeholder="Ex: 15000"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsFeuilleModalOpen(false);
                  setSelectedConsultForFeuille(null);
                  setIdFeuille('');
                  setMontantSoin(0);
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                isLoading={isCreatingFeuille}
                onClick={handleCreateFeuille}
              >
                {t('admin.consultations.create_sheet_submit') || 'Créer la feuille'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
