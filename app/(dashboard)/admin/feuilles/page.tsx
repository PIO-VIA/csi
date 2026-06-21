'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  FileText,
  CheckCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getFeuilles, getConsultations, annulerFeuille } from '@/lib/api';
import { FeuillemMaladie, Consultation } from '@/types';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { formatFCFA, formatDate } from '@/lib/utils';
import FeuilleMaladieTemplate from '@/components/ui/FeuilleMaladieTemplate';
import { useToast } from '@/components/ui/Toast';
import { X } from 'lucide-react';

export default function AdminFeuillesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [feuilles, setFeuilles] = useState<FeuillemMaladie[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<FeuillemMaladie | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  const handleCancelSheet = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette feuille de maladie ? Cette action est irréversible.")) {
      return;
    }
    setCancellingId(id);
    try {
      await annulerFeuille(id);
      success("La feuille de maladie a été annulée avec succès.");
      setFeuilles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, statut: 'ANNULE' } : f))
      );
    } catch (err: any) {
      console.error(err);
      error("Erreur lors de l'annulation de la feuille de maladie.");
    } finally {
      setCancellingId(null);
    }
  };

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REIMBURSED' | 'PENDING' | 'CANCELLED'>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [resFeuilles, resConsults] = await Promise.all([
          getFeuilles(),
          getConsultations(),
        ]);
        setFeuilles(resFeuilles.data);
        setConsultations(resConsults.data);
      } catch (e) {
        console.error('Failed to load sheets:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getConsultationForSheet = (sheet: FeuillemMaladie) => {
    return consultations.find((c) => c.id === sheet.consultationId);
  };

  // Filter sheets
  const filteredFeuilles = feuilles.filter((f) => {
    const cons = getConsultationForSheet(f);
    const patientName = cons?.assure.nom || '';
    const refMatch = f.idFeuille.toLowerCase().includes(searchTerm.toLowerCase());
    const nameMatch = patientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = refMatch || nameMatch;

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'REIMBURSED' && f.estRembourse && f.statut !== 'ANNULE') ||
      (statusFilter === 'PENDING' && !f.estRembourse && f.statut !== 'ANNULE') ||
      (statusFilter === 'CANCELLED' && f.statut === 'ANNULE');

    return matchesSearch && matchesStatus;
  });

  // Pagination calculation
  const totalItems = filteredFeuilles.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedFeuilles = filteredFeuilles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('admin.remboursements.col_feuille') || 'Feuilles de Maladie'}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('admin.feuilles.subtitle') || 'Consultez et suivez toutes les feuilles de maladie émises par les praticiens'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total feuilles"
          value={feuilles.length}
          icon={<FileText size={20} />}
          color="primary"
        />
        <StatCard
          label="Remboursées"
          value={feuilles.filter((f) => f.estRembourse && f.statut !== 'ANNULE').length}
          icon={<CheckCircle size={20} />}
          color="success"
        />
        <StatCard
          label="En attente"
          value={feuilles.filter((f) => !f.estRembourse && f.statut !== 'ANNULE').length}
          icon={<Clock size={20} />}
          color="warning"
        />
        <StatCard
          label="Annulées"
          value={feuilles.filter((f) => f.statut === 'ANNULE').length}
          icon={<X size={20} />}
          color="danger"
        />
      </div>

      {/* FILTER BAR */}
      <Card>
        <CardBody className="p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Search box */}
          <div className="w-full md:flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t('medecin.feuilles.search_placeholder') || 'Rechercher par référence, patient...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="dashboard-search"
            />
          </div>

          {/* Toggle Status */}
          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl w-full md:w-auto">
            {(['ALL', 'REIMBURSED', 'PENDING', 'CANCELLED'] as const).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-display font-medium uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  statusFilter === status
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {status === 'ALL'
                  ? t('admin.medecins.filter_all') || 'Tous'
                  : status === 'REIMBURSED'
                  ? t('admin.remboursements.status_reimbursed') || 'Remboursés'
                  : status === 'PENDING'
                  ? t('admin.remboursements.pending_title') || 'En attente'
                  : 'Annulées'}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* TABLE */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.remboursements.col_ref') || 'Réf. Feuille'}</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>{t('admin.remboursements.col_assure') || 'Assuré'}</TableHead>
                <TableHead>{t('admin.remboursements.col_doctor') || 'Médecin'}</TableHead>
                <TableHead>{t('admin.remboursements.col_soin_amount') || 'Montant Soin'}</TableHead>
                <TableHead>{t('admin.remboursements.col_reimb_amount') || 'Remboursement'}</TableHead>
                <TableHead>{t('common.status') || 'Statut'}</TableHead>
                <TableHead className="no-print">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFeuilles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-body">
                    {t('medecin.feuilles.empty_list') || 'Aucune feuille de maladie trouvée.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFeuilles.map((f) => {
                  const cons = getConsultationForSheet(f);
                  const patientName = cons ? cons.assure.nom : t('common.unknown');
                  const doctorName = cons ? cons.generaliste.nom : t('common.unknown');
                  
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs font-semibold">{f.idFeuille}</TableCell>
                      <TableCell className="text-xs text-slate-500">{cons ? formatDate(cons.date) : '—'}</TableCell>
                      <TableCell className="font-display font-medium text-slate-800">{patientName}</TableCell>
                      <TableCell className="text-xs text-slate-600">{doctorName}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">{formatFCFA(f.montantSoin)}</TableCell>
                      <TableCell className="text-xs">
                        {f.remboursement ? (
                          <span className="text-success font-semibold">+{formatFCFA(f.remboursement.montant)}</span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {f.statut === 'ANNULE' ? (
                          <Badge variant="danger">Annulé</Badge>
                        ) : (
                          <Badge variant={f.estRembourse ? 'success' : 'warning'}>
                            {f.estRembourse ? t('admin.remboursements.status_reimbursed') || 'Remboursé' : t('admin.remboursements.pending_title') || 'En attente'}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="no-print">
                        <div className="flex gap-2 items-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs px-2.5 py-1.5"
                            onClick={() => setSelectedSheet(f)}
                          >
                            Visualiser
                          </Button>
                          {f.statut === 'ANNULE' ? (
                            <span className="text-xs text-slate-400 italic">Annulé</span>
                          ) : f.estRembourse ? (
                            <Badge variant="success">Remboursé</Badge>
                          ) : (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-xs px-2.5 py-1.5"
                                onClick={() => router.push('/admin/remboursements')}
                              >
                                Rembourser
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                className="text-xs px-2.5 py-1.5"
                                onClick={() => handleCancelSheet(f.id)}
                                isLoading={cancellingId === f.id}
                              >
                                Annuler
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </CardBody>
      </Card>

      <FeuilleMaladieTemplate
        isOpen={!!selectedSheet}
        onClose={() => setSelectedSheet(null)}
        sheet={selectedSheet}
        consultation={selectedSheet ? getConsultationForSheet(selectedSheet) : null}
      />
    </motion.div>
  );
}
