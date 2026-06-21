'use client';

import React from 'react';
import { FileText, Printer, X, Shield, Award, Stethoscope, User, Calendar, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
import { formatDate, formatFCFA } from '@/lib/utils';
import type { FeuillemMaladie, Consultation } from '@/types';
import Button from './Button';
import Badge from './Badge';

interface FeuilleMaladieTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: FeuillemMaladie | null;
  consultation?: Consultation | null;
}

export function FeuilleMaladieTemplate({
  isOpen,
  onClose,
  sheet,
  consultation,
}: FeuilleMaladieTemplateProps) {
  const { t } = useTranslation();

  if (!sheet) return null;

  // Retrieve patient, doctor, and date from consultation if available
  const patient = consultation?.assure;
  const doctor = consultation?.generaliste;
  const date = consultation?.date ?? '';
  const prescriptions = consultation?.prescriptions ?? [];
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
      title={t('admin.remboursements.col_feuille') || 'Feuille de Maladie'}
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
          #printable-sheet, #printable-sheet * {
            visibility: visible;
          }
          #printable-sheet {
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
            Imprimer / PDF
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

      {/* Sheet Document (Printable Area) */}
      <div id="printable-sheet" className="bg-white text-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto font-body">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-primary-600 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-slate-900 tracking-tight leading-tight">
                CSI SÉCURITÉ SOCIALE
              </h2>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                Portail National de Santé
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <h3 className="font-display font-bold text-sm text-primary-700">
              FEUILLE DE MALADIE NUMÉRIQUE
            </h3>
            <p className="font-mono text-xs font-semibold text-slate-500 mt-1">
              Réf: {sheet.idFeuille}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Émis le : {date ? formatDate(date) : 'Non définie'}
            </p>
          </div>
        </div>

        {/* Info Grid (Patient & Doctor) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Patient Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              <User size={14} className="text-primary-600" />
              Informations de l'Assuré
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nom complet:</span>
                <span className="font-semibold text-slate-800">{patient?.nom ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">N° Assuré (ID):</span>
                <span className="font-mono font-semibold text-slate-800">{patient?.idAssure ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date Naissance:</span>
                <span className="font-semibold text-slate-800">
                  {patient?.dateNaissance ? formatDate(patient.dateNaissance) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sexe / Groupe Sanguin:</span>
                <span className="font-semibold text-slate-800">
                  {patient?.sexe === 'M' ? 'Homme' : patient?.sexe === 'F' ? 'Femme' : patient?.sexe ?? '—'} 
                  {patient?.groupeSanguin ? ` (${patient.groupeSanguin})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Profession:</span>
                <span className="font-semibold text-slate-850 truncate max-w-[150px]">{patient?.profession ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Doctor Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-display font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 mb-3">
              <Stethoscope size={14} className="text-primary-600" />
              Médecin Traitant / Praticien
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Nom du médecin:</span>
                <span className="font-semibold text-slate-800">{doctor?.nom ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Matricule professionnel:</span>
                <span className="font-mono font-semibold text-slate-800">{doctor?.matricule ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type de praticien:</span>
                <span className="font-semibold text-slate-800">
                  {doctor?.type === 'SPECIALISTE' ? 'Spécialiste' : 'Médecin Généraliste'}
                </span>
              </div>
              {doctor?.domaineSpecialisation && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Spécialité:</span>
                  <span className="font-semibold text-slate-800">{doctor.domaineSpecialisation}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Contact:</span>
                <span className="font-semibold text-slate-800">
                  {doctor?.numTelephone ? `${doctor.indicatifPays || '+237'}${doctor.numTelephone}` : '—'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Consultation details & Prescriptions (Ordonnance Style) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
            <h4 className="text-xs font-display font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={14} className="text-slate-500" />
              Diagnostic & Prescriptions (Ordonnance)
            </h4>
          </div>
          <div className="p-4 space-y-4">
            
            {/* Consultation Motif */}
            {consultation?.motif && (
              <div className="text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-400 block mb-1">Motif / Diagnostic principal:</span>
                <p className="font-medium text-slate-850 bg-slate-50 p-2 rounded-lg leading-relaxed italic">
                  &ldquo;{consultation.motif}&rdquo;
                </p>
              </div>
            )}

            {/* Prescriptions List */}
            <div>
              <span className="text-slate-400 text-xs block mb-2">Médicaments et Posologies prescrits :</span>
              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucun traitement ou référence médicale prescrit lors de cette consultation.</p>
              ) : (
                <div className="space-y-3">
                  {prescriptions.map((presc, index) => (
                    <div key={presc.id || index} className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <div className="text-xs">
                        {presc.type === 'MEDICAMENT' ? (
                          <>
                            <span className="font-bold text-slate-800 block">{presc.medicament}</span>
                            <span className="text-slate-500 text-[11px] block mt-0.5 font-mono">{presc.posologie}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-slate-800 block">Référence Spécialiste</span>
                            {presc.matriculeMedecin && (
                              <span className="text-slate-500 text-[11px] block mt-0.5">
                                Praticien ciblé (Matricule) : <strong className="font-mono text-slate-700">{presc.matriculeMedecin}</strong>
                              </span>
                            )}
                            {presc.motif && (
                              <span className="text-slate-500 text-[11px] block mt-0.5 italic">
                                Motif de consultation : &ldquo;{presc.motif}&rdquo;
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Financial details & Refund */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          
          {/* Care Cost Details */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-slate-400 text-xs block">Montant Total des Actes / Soins :</span>
              <span className="font-display font-extrabold text-xl text-slate-900 mt-1 block">
                {formatFCFA(sheet.montantSoin)}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Taux de couverture :</span>
              <span className="font-bold text-slate-800">{coverageRate}%</span>
            </div>
          </div>

          {/* Refund Details */}
          <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between bg-gradient-to-br from-slate-50 to-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 text-xs block">Statut de la Caisse :</span>
                <span className="mt-1 block">
                  {sheet.statut === 'ANNULE' ? (
                    <Badge variant="danger">ANNULÉ</Badge>
                  ) : (
                    <Badge variant={sheet.estRembourse ? 'success' : 'warning'}>
                      {sheet.estRembourse ? 'REMBOURSÉ' : 'EN ATTENTE'}
                    </Badge>
                  )}
                </span>
              </div>
              {sheet.estRembourse && (
                <div className="h-8 w-8 rounded-full bg-success-100 flex items-center justify-center text-success-700">
                  <Award size={16} />
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Montant remboursé :</span>
                <span className="font-bold text-success-600">
                  {sheet.statut === 'ANNULE'
                    ? '0 FCFA (Annulé)'
                    : sheet.estRembourse && sheet.remboursement 
                    ? formatFCFA(sheet.remboursement.montant)
                    : sheet.montantRembourse != null 
                    ? formatFCFA(sheet.montantRembourse)
                    : formatFCFA(Math.round(sheet.montantSoin * (coverageRate / 100)))}
                </span>
              </div>
              {sheet.estRembourse && sheet.remboursement && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mode de Paiement :</span>
                    <span className="font-medium text-slate-800">
                      {sheet.remboursement.modePaiement === 'VIREMENT' ? 'Virement Bancaire' : 'Espèces (CASH)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date Virement :</span>
                    <span className="font-medium text-slate-800">
                      {sheet.remboursement.dateRemboursement ? formatDate(sheet.remboursement.dateRemboursement) : '—'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Footer Stamps & Signatures */}
        <div className="border-t border-slate-200 pt-6 mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="text-xs max-w-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-500 mb-0.5">Note administrative :</p>
            <p>Cette feuille de maladie est générée numériquement et certifiée par la plateforme de Caisse de Sécurité Sociale (CSI).</p>
          </div>
          <div className="text-center self-end sm:self-auto pr-4">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-12">
              Signature & Cachet du Médecin
            </span>
            <div className="border-b border-slate-300 w-44 mx-auto mb-1" />
            <span className="text-[11px] font-semibold text-slate-800">{doctor?.nom || 'Praticien'}</span>
          </div>
        </div>

      </div>
    </Modal>
  );
}

export default FeuilleMaladieTemplate;
