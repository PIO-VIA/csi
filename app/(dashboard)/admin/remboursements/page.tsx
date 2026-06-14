'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getFeuilles, getConsultations, effectuerRemboursement, getRemboursements } from '@/lib/api';
import { FeuillemMaladie, Consultation, Remboursement } from '@/types';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/ui/Loader';
import { formatFCFA, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function RemboursementsAdminPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [feuilles, setFeuilles] = useState<FeuillemMaladie[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [remboursements, setRemboursements] = useState<Remboursement[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFeuille, setSelectedFeuille] = useState<FeuillemMaladie | null>(null);
  const [paymentMode, setPaymentMode] = useState<'VIREMENT' | 'CASH'>('VIREMENT');
  const [isPaying, setIsPaying] = useState(false);

  const loadData = async () => {
    try {
      const [resFeuilles, resConsultations, resRemboursements] = await Promise.all([
        getFeuilles(),
        getConsultations(),
        getRemboursements()
      ]);
      setFeuilles(resFeuilles.data);
      setConsultations(resConsultations.data);
      setRemboursements(resRemboursements.data);
    } catch (e) {
      console.error('Failed to load reimbursement data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPaymentModal = (f: FeuillemMaladie) => {
    setSelectedFeuille(f);
    setIsModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedFeuille) return;
    setIsPaying(true);
    try {
      await effectuerRemboursement(selectedFeuille.id, paymentMode);
      success(t('admin.remboursements.payment_success') || 'Remboursement effectué avec succès.');
      setIsModalOpen(false);
      setSelectedFeuille(null);
      await loadData(); // Reload all data
    } catch (e) {
      error(t('common.error'));
    } finally {
      setIsPaying(false);
    }
  };

  // Helper: Find consultation for a sheet
  const getConsultationForSheet = (sheet: FeuillemMaladie) => {
    return consultations.find((c) => c.id === sheet.consultationId);
  };

  // Helper: Calculate refund details
  const getRefundDetails = (sheet: FeuillemMaladie) => {
    const cons = getConsultationForSheet(sheet);
    const isSpecialist = cons?.generaliste.type === 'SPECIALISTE';
    const rate = isSpecialist ? 0.8 : 1.0;
    const amount = Math.round(sheet.montantSoin * rate);
    return {
      rateLabel: isSpecialist ? '80% (Spécialiste)' : '100% (Généraliste)',
      amount,
      patientName: cons ? cons.assure.nom : t('common.unknown'),
      doctorName: cons ? cons.generaliste.nom : t('common.unknown'),
      type: cons?.generaliste.type || 'GENERALISTE'
    };
  };

  // Pending sheets (not reimbursed)
  const pendingFeuilles = feuilles.filter((f) => !f.estRembourse);

  // Reimbursed sheets with historical records
  const historicalPayments = remboursements.map((r) => {
    const sheet = feuilles.find((f) => f.id === r.feuilleMaladieId);
    const details = sheet ? getRefundDetails(sheet) : { patientName: t('common.patient'), amount: r.montant, rateLabel: 'Calculé' };
    return {
      ...r,
      refFeuille: sheet?.idFeuille || 'N/A',
      patientName: details.patientName,
      montantSoin: sheet?.montantSoin || 0
    };
  });

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  const now = new Date();
  const totalRembourse = remboursements.reduce((s, r) => s + r.montant, 0);
  const thisMonth = remboursements.filter((r) => {
    const d = new Date(r.dateRemboursement);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, r) => s + r.montant, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('admin.remboursements.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('admin.remboursements.subtitle')}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total remboursé"
          value={formatFCFA(totalRembourse)}
          icon={<DollarSign size={20} />}
          color="success"
        />
        <StatCard
          label="Dossiers en attente"
          value={pendingFeuilles.length}
          icon={<Clock size={20} />}
          color="warning"
        />
        <StatCard
          label="Remboursés ce mois"
          value={formatFCFA(thisMonth)}
          icon={<Calendar size={20} />}
          color="primary"
        />
      </div>

      {/* PENDING REQUESTS SECTION */}
      <Card>
        <CardHeader className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-warning/10 text-warning rounded-lg">
              <Clock size={16} />
            </span>
            <span className="font-display font-semibold text-sm text-slate-800">
              {t('admin.remboursements.pending_title')}
            </span>
          </div>
          <Badge variant="warning">{pendingFeuilles.length} dossiers</Badge>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.remboursements.col_ref')}</TableHead>
                <TableHead>{t('admin.remboursements.col_assure')}</TableHead>
                <TableHead>{t('admin.remboursements.col_doctor')}</TableHead>
                <TableHead>{t('admin.remboursements.col_soin_amount')}</TableHead>
                <TableHead>{t('admin.remboursements.col_rate')}</TableHead>
                <TableHead>{t('admin.remboursements.col_amount')}</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingFeuilles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-body">
                    {t('admin.remboursements.pending_none')}
                  </TableCell>
                </TableRow>
              ) : (
                pendingFeuilles.map((f) => {
                  const details = getRefundDetails(f);
                  return (
                     <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs font-semibold text-slate-800">
                        {f.idFeuille}
                      </TableCell>
                      <TableCell className="font-display font-medium text-slate-850">
                        {details.patientName}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {details.doctorName} <br />
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{details.type.toLowerCase()}</span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-600">
                        {formatFCFA(f.montantSoin)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-slate-500">
                        {details.rateLabel}
                      </TableCell>
                      <TableCell className="font-display font-bold text-success text-sm">
                        {formatFCFA(details.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenPaymentModal(f)}
                          className="px-3.5 py-1.5 text-xs"
                        >
                          {t('admin.remboursements.btn_reimburse')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* HISTORICAL COMPLETED PAYMENTS */}
      <Card>
        <CardHeader className="flex justify-between items-center border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-success/10 text-success rounded-lg">
              <CheckCircle size={16} />
            </span>
            <span className="font-display font-semibold text-sm text-slate-800">
              {t('admin.remboursements.history_title')}
            </span>
          </div>
          <Badge variant="success">
            {t('admin.remboursements.history_total')}: {formatFCFA(remboursements.reduce((sum, r) => sum + r.montant, 0))}
          </Badge>
        </CardHeader>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.remboursements.col_date')}</TableHead>
                  <TableHead>{t('admin.remboursements.col_ref')}</TableHead>
                  <TableHead>{t('admin.remboursements.col_assure')}</TableHead>
                  <TableHead>{t('admin.remboursements.col_soin_amount')}</TableHead>
                  <TableHead>{t('admin.remboursements.col_reimb_amount')}</TableHead>
                  <TableHead>Taux</TableHead>
                  <TableHead>{t('admin.remboursements.col_mode')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {historicalPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-body">
                    {t('admin.remboursements.history_none')}
                  </TableCell>
                </TableRow>
              ) : (
                historicalPayments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-slate-500">{formatDate(r.dateRemboursement)}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{r.refFeuille}</TableCell>
                    <TableCell className="font-display font-medium text-xs text-slate-800">{r.patientName}</TableCell>
                    <TableCell className="text-xs text-slate-600">{formatFCFA(r.montantSoin)}</TableCell>
                    <TableCell className="font-display font-bold text-success text-xs">+{formatFCFA(r.montant)}</TableCell>
                    <TableCell>
                      {(() => {
                        const rate = r.montantSoin > 0 ? Math.round((r.montant / r.montantSoin) * 100) : 0;
                        return <Badge variant={rate >= 100 ? 'success' : 'warning'}>{rate}%</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.modePaiement === 'VIREMENT' ? 'info' : 'warning'}>
                        {r.modePaiement === 'VIREMENT' ? t('admin.remboursements.modal_virement') : t('admin.remboursements.modal_cash')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">{t('admin.remboursements.status_reimbursed')}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* PAYMENT OPTIONS MODAL */}
      {selectedFeuille && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFeuille(null);
          }}
          title={t('admin.remboursements.modal_title') || ''}
          description={`${t('admin.remboursements.col_ref')}: ${selectedFeuille.idFeuille}`}
        >
          {(() => {
            const details = getRefundDetails(selectedFeuille);
            return (
              <div className="space-y-6">
                {/* Summary Table */}
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3 font-body text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>{t('admin.remboursements.col_assure')} :</span>
                    <span className="text-slate-850 font-semibold">{details.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.remboursements.modal_acted_by')} :</span>
                    <span className="text-slate-700">{details.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.remboursements.col_soin_amount')} :</span>
                    <span className="text-slate-700">{formatFCFA(selectedFeuille.montantSoin)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.remboursements.modal_rate')} :</span>
                    <span className="text-slate-850 font-semibold">{details.rateLabel}</span>
                  </div>
                  <div className="h-px bg-slate-200 my-1" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-display font-bold text-slate-700">{t('admin.remboursements.col_reimb_amount')} :</span>
                    <span className="font-display font-extrabold text-success text-base">{formatFCFA(details.amount)}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {details.type === 'SPECIALISTE'
                    ? 'Consultation chez un spécialiste — prise en charge à 80%'
                    : 'Consultation chez un généraliste — prise en charge à 100%'}
                </p>

                {/* Mode Selector */}
                <div className="space-y-2">
                  <label className="font-display font-semibold text-xs text-slate-600 tracking-wide">
                    {t('admin.remboursements.modal_method')}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setPaymentMode('VIREMENT')}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer select-none transition ${
                        paymentMode === 'VIREMENT'
                          ? 'border-primary-600 bg-primary-50/50 text-primary-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-display font-semibold text-xs">{t('admin.remboursements.modal_virement')}</span>
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                        paymentMode === 'VIREMENT' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                      }`}>
                        {paymentMode === 'VIREMENT' && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>

                    <div
                      onClick={() => setPaymentMode('CASH')}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer select-none transition ${
                        paymentMode === 'CASH'
                          ? 'border-primary-600 bg-primary-50/50 text-primary-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-display font-semibold text-xs">{t('admin.remboursements.modal_cash')}</span>
                      <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                        paymentMode === 'CASH' ? 'border-primary-600 bg-primary-600' : 'border-slate-300'
                      }`}>
                        {paymentMode === 'CASH' && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedFeuille(null);
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleConfirmPayment}
                    isLoading={isPaying}
                  >
                    {t('admin.remboursements.modal_confirm')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </motion.div>
  );
}
