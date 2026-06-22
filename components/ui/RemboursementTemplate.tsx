'use client';

import React from 'react';
import { Printer, X, Shield, Stethoscope, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { formatDate, formatFCFA } from '@/lib/utils';
import type { Remboursement, FeuillemMaladie, Consultation } from '@/types';
import Button from './Button';
import Badge from './Badge';

interface RemboursementTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  remboursement: Remboursement | null;
  feuille: FeuillemMaladie | null;
  consultation: Consultation | null;
}

export function RemboursementTemplate({
  isOpen,
  onClose,
  remboursement,
  feuille,
  consultation,
}: RemboursementTemplateProps) {
  const { t } = useTranslation();

  if (!remboursement) return null;

  const patient = consultation?.assure;
  const doctor = consultation?.generaliste;
  const originalCareDate = consultation?.date ?? '';
  const isSpecialist = doctor?.type === 'SPECIALISTE';
  const coverageRate = isSpecialist ? 80 : 100;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.remboursements.modal_title') || 'Reçu de Remboursement'}
      size="xl"
      className="p-0 border-none shadow-none"
    >
      {/* Print CSS Override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything else */
          body * {
            visibility: hidden;
            background: none !important;
          }
          /* Show only the printable container */
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            margin: 0;
            border: none;
            box-shadow: none;
            background: white !important;
            color: black !important;
          }
          /* Hide non-printable elements */
          .no-print {
            display: none !important;
          }
          /* Prevent modal wrapper from clipping the print content */
          div[role="dialog"], 
          div[data-state="open"],
          .fixed {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: transparent !important;
          }
        }
      `}} />

      {/* Top Action Bar (visible on screen only) */}
      <div className="no-print flex justify-between items-center gap-3 p-4 bg-slate-50 border-b border-slate-200/80 -mt-6 -mx-6 mb-6">
        <span className="text-xs font-body text-slate-500">
          Format officiel imprimable / PDF
        </span>
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer size={16} />
            Imprimer le Reçu
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X size={16} />
            Fermer
          </Button>
        </div>
      </div>

      {/* Receipt Document (Printable Area) */}
      <div id="printable-receipt" className="bg-white text-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto font-body">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-emerald-650 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight leading-tight">
                CSI SÉCURITÉ SOCIALE
              </h2>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                République du Cameroun
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h3 className="font-display font-bold text-sm text-emerald-700">
              REÇU DE REMBOURSEMENT
            </h3>
            <p className="font-mono text-xs font-semibold text-slate-500 mt-1">
              Réf: REC-{remboursement.id.toString().padStart(6, '0')}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Date : {formatDate(remboursement.dateRemboursement)}
            </p>
          </div>
        </div>

        {/* Info Grid (Patient & Care Details) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Patient Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              <User size={14} className="text-emerald-600" />
              Bénéficiaire (Assuré)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nom complet:</span>
                <span className="font-semibold text-slate-800">{patient?.nom ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Matricule Assuré:</span>
                <span className="font-mono font-semibold text-slate-800">{patient?.idAssure ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Téléphone:</span>
                <span className="font-semibold text-slate-800">
                  {patient?.numTelephone ? `${patient.indicatifPays || '+237'} ${patient.numTelephone}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Groupe Sanguin:</span>
                <span className="font-semibold text-slate-800">{patient?.groupeSanguin ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Care details Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              <Stethoscope size={14} className="text-emerald-600" />
              Détails des Soins
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Réf. Feuille:</span>
                <span className="font-mono font-semibold text-slate-800">{feuille?.idFeuille ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date Consultation:</span>
                <span className="font-semibold text-slate-800">
                  {originalCareDate ? formatDate(originalCareDate) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Médecin Traitant:</span>
                <span className="font-semibold text-slate-800">{doctor?.nom ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type de praticien:</span>
                <span className="font-semibold text-slate-800">
                  {doctor?.type === 'SPECIALISTE' ? 'Spécialiste' : 'Médecin Généraliste'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-display font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-4 font-medium">
                  Frais de soins médicaux et actes déclarés
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Sur la feuille de maladie Réf: {feuille?.idFeuille}
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-semibold font-mono">
                  {feuille ? formatFCFA(feuille.montantSoin) : '—'}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-500">
                  Taux de prise en charge par la CSI
                </td>
                <td className="py-3 px-4 text-right font-medium text-slate-500">
                  {coverageRate}% {isSpecialist ? '(Spécialiste)' : '(Généraliste)'}
                </td>
              </tr>
              <tr className="bg-emerald-50/30 text-emerald-900 font-semibold border-t border-slate-200">
                <td className="py-3 px-4 font-display text-sm text-emerald-800">
                  Montant Net Remboursé
                </td>
                <td className="py-3 px-4 text-right text-emerald-700 text-sm font-extrabold font-mono">
                  {formatFCFA(remboursement.montant)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment & Status Details */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <span className="text-slate-400">Mode de règlement:</span>
              <Badge variant="info">
                {remboursement.modePaiement === 'VIREMENT' ? 'Virement Bancaire' : 'Espèces (CASH)'}
              </Badge>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-slate-400">Statut de la transaction:</span>
              <Badge variant="success">PAYÉ / REMBOURSÉ</Badge>
            </div>
          </div>
          <div className="text-left sm:text-right font-display font-semibold text-slate-700">
            Caisse de Sécurité Sociale (CSI)
            <span className="text-[10px] text-slate-400 block font-normal font-body mt-0.5">
              Remboursement traité numériquement avec succès.
            </span>
          </div>
        </div>

        {/* Footer Stamps & Signatures */}
        <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
          <div className="text-xs max-w-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-500 mb-0.5">Certification :</p>
            <p>Ce reçu atteste du versement de la somme due au titre de la couverture sociale de l&apos;assuré conformément à la réglementation en vigueur.</p>
          </div>
          <div className="flex gap-10">
            <div className="text-center pr-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-12">
                Le Bénéficiaire
              </span>
              <div className="border-b border-slate-300 w-32 mx-auto mb-1" />
              <span className="text-[10px] font-semibold text-slate-700">{patient?.nom ?? 'Assuré'}</span>
            </div>
            <div className="text-center pr-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-12">
                L&apos;Agent de Caisse
              </span>
              <div className="border-b border-slate-300 w-32 mx-auto mb-1" />
              <span className="text-[10px] font-semibold text-slate-700">Caisse CSI</span>
            </div>
          </div>
        </div>

      </div>
    </Modal>
  );
}

export default RemboursementTemplate;
