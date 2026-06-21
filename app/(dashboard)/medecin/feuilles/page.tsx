'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Calendar, User, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getMesFeuilles, getConsultationsByMedecin, updateFeuille } from '@/lib/api';
import { Consultation, FeuillemMaladie } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate, formatFCFA } from '@/lib/utils';
import Button from '@/components/ui/Button';
import FeuilleMaladieTemplate from '@/components/ui/FeuilleMaladieTemplate';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function MedecinFeuillesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const [loading, setLoading] = useState(true);
  const [feuilles, setFeuilles] = useState<(FeuillemMaladie & { date: string; patient: string; consultation?: Consultation | null })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSheet, setSelectedSheet] = useState<(FeuillemMaladie & { date: string; patient: string; consultation?: Consultation | null }) | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<FeuillemMaladie | null>(null);
  const [editIdFeuille, setEditIdFeuille] = useState('');
  const [editMontantSoin, setEditMontantSoin] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [resFeuilles, resConsults] = await Promise.all([
          getMesFeuilles().catch((err) => {
            console.error('Failed to load sheets:', err);
            return { data: [] };
          }),
          getConsultationsByMedecin(user.id).catch((err) => {
            console.error('Failed to load consultations:', err);
            return { data: [] };
          }),
        ]);
        
        const consultMap = new Map((resConsults?.data || []).map((c) => [c.id, c]));
        const list = (resFeuilles?.data || []).map((f) => {
          const c = consultMap.get(f.consultationId);
          return {
            ...f,
            date: c ? c.date : '',
            patient: c ? c.assure.nom : 'Inconnu',
            consultation: c || null,
          };
        });
        
        setFeuilles(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleOpenEdit = (f: FeuillemMaladie) => {
    setEditingSheet(f);
    setEditIdFeuille(f.idFeuille);
    setEditMontantSoin(f.montantSoin);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSheet) return;
    if (!editIdFeuille.trim()) {
      warning("Vaudrait mieux renseigner la référence de la feuille de maladie.");
      return;
    }
    if (editMontantSoin < 0) {
      warning("Le montant des soins doit être supérieur ou égal à 0.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateFeuille(editingSheet.id, {
        idFeuille: editIdFeuille,
        montantSoin: editMontantSoin,
        consultationId: editingSheet.consultationId,
      });

      setFeuilles((prev) =>
        prev.map((item) =>
          item.id === editingSheet.id
            ? {
                ...item,
                ...res.data,
                date: item.date,
                patient: item.patient,
                consultation: item.consultation,
              }
            : item
        )
      );

      success("Feuille de maladie modifiée avec succès.");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      error("Erreur lors de la modification de la feuille de maladie.");
    } finally {
      setIsSaving(false);
    }
  };

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
                <TableHead className="no-print">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-body">
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
                      {f.statut === 'ANNULE' ? (
                        <Badge variant="danger">ANNULÉ</Badge>
                      ) : (
                        <Badge variant={f.estRembourse ? 'success' : 'warning'}>
                          {f.estRembourse ? t('medecin.feuilles.reimbursed') : t('medecin.feuilles.pending')}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="no-print">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs px-3"
                          onClick={() => setSelectedSheet(f)}
                        >
                          Visualiser
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-3 bg-white"
                          onClick={() => handleOpenEdit(f)}
                          disabled={f.statut === 'ANNULE' || f.estRembourse}
                        >
                          <Edit size={13} className="mr-1 inline" />
                          Modifier
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

      <FeuilleMaladieTemplate
        isOpen={!!selectedSheet}
        onClose={() => setSelectedSheet(null)}
        sheet={selectedSheet}
        consultation={selectedSheet?.consultation}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier la feuille de maladie"
        size="md"
      >
        <div className="space-y-4">
          <Input
            id="input-edit-id-feuille"
            label="Référence de la feuille (ID)"
            value={editIdFeuille}
            onChange={(e) => setEditIdFeuille(e.target.value)}
            leftIcon={<FileText size={16} className="text-slate-400" />}
          />
          <Input
            id="input-edit-montant-soin"
            label="Montant des soins (FCFA)"
            type="number"
            value={editMontantSoin}
            onChange={(e) => setEditMontantSoin(Number(e.target.value))}
            leftIcon={<span className="text-xs font-bold text-slate-400">FCFA</span>}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveEdit}
              isLoading={isSaving}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

