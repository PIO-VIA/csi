'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, DollarSign, Calendar, Search } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getFeuillesByAssure } from '@/lib/api';
import { FeuillemMaladie, Remboursement } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate, formatFCFA } from '@/lib/utils';
import StatCard from '@/components/ui/StatCard';

export default function AssureRemboursementsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [remboursements, setRemboursements] = useState<(Remboursement & { refFeuille: string; montantSoin: number })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await getFeuillesByAssure(user.id);
        const list: FeuillemMaladie[] = res.data;
        
        // Extract all refunds
        const refunds = list
          .filter((f) => f.estRembourse && f.remboursement)
          .map((f) => ({
            ...f.remboursement!,
            refFeuille: f.idFeuille,
            montantSoin: f.montantSoin,
          }));
        
        setRemboursements(refunds);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = remboursements.filter((r) =>
    r.refFeuille.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sums
  const totalRembourse = remboursements.reduce((sum, r) => sum + r.montant, 0);

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">Suivi de mes Remboursements</h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Suivi des virements bancaires et règlements en agence effectués par le CSI
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        <StatCard
          label="Total Remboursé"
          value={formatFCFA(totalRembourse)}
          icon={<DollarSign size={20} />}
          color="success"
        />
        <StatCard
          label="Dossiers Remboursés"
          value={`${remboursements.length} dossiers`}
          icon={<CreditCard size={20} />}
          color="primary"
        />
      </div>

      <Card>
        <CardBody className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Rechercher par référence de feuille..."
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
                <TableHead>Date du Paiement</TableHead>
                <TableHead>Référence Feuille</TableHead>
                <TableHead>Frais Médicaux</TableHead>
                <TableHead>Montant Remboursé</TableHead>
                <TableHead>Mode de Règlement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-body">
                    Aucun remboursement enregistré.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(r.dateRemboursement)}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{r.refFeuille}</TableCell>
                    <TableCell className="text-xs text-slate-600">{formatFCFA(r.montantSoin)}</TableCell>
                    <TableCell className="font-display font-bold text-success text-xs">+{formatFCFA(r.montant)}</TableCell>
                    <TableCell>
                      <Badge variant={r.modePaiement === 'VIREMENT' ? 'info' : 'warning'}>
                        {r.modePaiement}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">Payé / Reçu</Badge>
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
