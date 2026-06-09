'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Calendar, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getFeuillesByAssure } from '@/lib/api';
import { FeuillemMaladie } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate, formatFCFA } from '@/lib/utils';

export default function AssureFeuillesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feuilles, setFeuilles] = useState<FeuillemMaladie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const res = await getFeuillesByAssure(user.id);
        setFeuilles(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filtered = feuilles.filter((f) =>
    f.idFeuille.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">Mes Feuilles de Maladie</h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Suivez l&apos;état d&apos;évaluation de vos dossiers de remboursement de soins
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
                <TableHead>Référence Feuille</TableHead>
                <TableHead>Montant de Soin déclaré</TableHead>
                <TableHead>Remboursement évalué</TableHead>
                <TableHead>Statut du dossier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500 font-body">
                    Aucune feuille de maladie enregistrée.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      <span className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-500" />
                        {f.idFeuille}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-700">
                      {formatFCFA(f.montantSoin)}
                    </TableCell>
                    <TableCell className="text-xs">
                      {f.remboursement ? (
                        <span className="text-success font-semibold">+{formatFCFA(f.remboursement.montant)}</span>
                      ) : (
                        <span className="text-slate-500 italic">En attente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.estRembourse ? 'success' : 'warning'}>
                        {f.estRembourse ? 'Traité & Remboursé' : 'En attente d\'évaluation'}
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
