'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Stethoscope,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Pill,
  Activity,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { getAssures, getMedecins, createConsultation } from '@/lib/api';
import { Assure, Medecin } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';

const consultationFormSchema = z.object({
  assureId: z.string().min(1, { message: 'Veuillez sélectionner un patient' }),
  motif: z.string().min(5, { message: 'Veuillez saisir un motif de consultation détaillé' }),
  creerFeuille: z.boolean(),
  montantSoin: z.number().min(0, { message: 'Le montant doit être positif' }),
});

type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

interface TempPrescription {
  type: 'MEDICAMENT' | 'SPECIALISTE';
  medicament?: string;
  posologie?: string;
  matriculeMedecin?: string;
  motif?: string;
}

export default function NouvelleConsultationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assures, setAssures] = useState<Assure[]>([]);
  const [specialists, setSpecialists] = useState<Medecin[]>([]);
  
  // Dynamic Prescriptions list
  const [prescriptions, setPrescriptions] = useState<TempPrescription[]>([]);
  
  // Single Prescription Form State
  const [prescType, setPrescType] = useState<'MEDICAMENT' | 'SPECIALISTE'>('MEDICAMENT');
  const [medName, setMedName] = useState('');
  const [posology, setPosology] = useState('');
  const [specMatricule, setSpecMatricule] = useState('');
  const [specMotif, setSpecMotif] = useState('');
  const [prescError, setPrescError] = useState<string | null>(null);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resAssures, resMedecins] = await Promise.all([getAssures(), getMedecins()]);
        setAssures(resAssures.data);
        
        // Filter specialists
        setSpecialists(resMedecins.data.filter((m) => m.type === 'SPECIALISTE'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      creerFeuille: false,
      montantSoin: 0,
    }
  });

  const watchCreerFeuille = watch('creerFeuille');

  if (!user) return null;

  const handleAddPrescription = () => {
    setPrescError(null);
    if (prescType === 'MEDICAMENT') {
      if (!medName.trim() || !posology.trim()) {
        setPrescError('Veuillez renseigner le nom du médicament et sa posologie.');
        return;
      }
      setPrescriptions([
        ...prescriptions,
        { type: 'MEDICAMENT', medicament: medName, posologie: posology },
      ]);
      setMedName('');
      setPosology('');
    } else {
      if (!specMatricule || !specMotif.trim()) {
        setPrescError('Veuillez sélectionner le spécialiste ciblé et renseigner le motif.');
        return;
      }
      setPrescriptions([
        ...prescriptions,
        { type: 'SPECIALISTE', matriculeMedecin: specMatricule, motif: specMotif },
      ]);
      setSpecMatricule('');
      setSpecMotif('');
    }
  };

  const handleRemovePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ConsultationFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        assureId: Number(data.assureId),
        generalisteId: user.id,
        motif: data.motif,
        prescriptions: prescriptions,
        creerFeuille: data.creerFeuille,
        montantSoin: data.creerFeuille ? data.montantSoin : undefined,
      };

      await createConsultation(payload);
      router.push('/medecin/consultations');
    } catch (e) {
      setSubmitError('Une erreur est survenue lors de l\'enregistrement de la consultation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      {/* Back Link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-display text-slate-500 hover:text-slate-800 transition w-fit group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
        <span>Retour</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">Nouvelle Consultation</h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          Déclarez un acte de soin et préparez les ordonnances associées
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Patient & Motif (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <Card>
              <CardBody className="p-5 space-y-5">
                <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Détails de l&apos;Acte Médical
                </h3>
                <div className="h-px bg-slate-800/80" />

                {/* Patient Select */}
                <div className="form-group">
                  <label className="form-label-inline">Sélectionner l&apos;Assuré</label>
                  <select
                    className="dashboard-input"
                    {...register('assureId')}
                  >
                    <option value="">-- Choisir un patient --</option>
                    {assures.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom} ({a.idAssure})
                      </option>
                    ))}
                  </select>
                  {errors.assureId && <p className="text-xs text-danger font-medium">{errors.assureId.message}</p>}
                </div>

                {/* Diagnostic motif */}
                <div className="form-group">
                  <label className="form-label-inline">Motif & Diagnostic</label>
                  <textarea
                    rows={4}
                    placeholder="Saisissez ici les symptômes observés, le diagnostic final posé ou les actes prodigués..."
                    className="dashboard-input resize-none"
                    {...register('motif')}
                  />
                  {errors.motif && <p className="text-xs text-danger font-medium">{errors.motif.message}</p>}
                </div>

                {/* Feuille de maladie — disponible pour tous les praticiens */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500/30 cursor-pointer"
                      {...register('creerFeuille')}
                    />
                    <span className="font-display font-semibold text-xs text-slate-700 group-hover:text-slate-900 transition">
                      Générer la feuille de maladie numérique
                    </span>
                  </label>

                  <AnimatePresence>
                    {watchCreerFeuille && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-7 overflow-hidden"
                      >
                        <Input
                          label="Montant total des soins (FCFA)"
                          type="number"
                          placeholder="Ex: 15000"
                          error={errors.montantSoin?.message}
                            {...register('montantSoin', { valueAsNumber: true })}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* RIGHT COLUMN: Prescriptions Form (40%) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dynamic Prescriptions List */}
            <Card>
              <CardBody className="p-5 space-y-5">
                <h3 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider">
                  Prescription & Ordonnance
                </h3>
                <div className="h-px bg-slate-800/80" />

                {/* Current order list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-display font-bold text-slate-500 tracking-wider uppercase block">
                    Médicaments & Références écrits ({prescriptions.length})
                  </span>
                  
                  {prescriptions.length === 0 ? (
                    <div className="p-4 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500 font-body">
                      Aucun produit prescrit. Utilisez le sélecteur ci-dessous pour ajouter.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {prescriptions.map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-between gap-3 font-body text-xs text-slate-600">
                          <div className="flex-1 min-w-0">
                            {p.type === 'MEDICAMENT' ? (
                              <div>
                                <span className="font-semibold text-white">{p.medicament}</span> <br />
                                <span className="text-slate-500 text-[10px] italic">Posologie: {p.posologie}</span>
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-white">Réf Specialist ({p.matriculeMedecin})</span> <br />
                                <span className="text-slate-500 text-[10px] truncate block">{p.motif}</span>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePrescription(idx)}
                            className="p-1 text-slate-500 hover:text-danger rounded-lg transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Subform Card */}
                <div className="bg-slate-900/60 border border-slate-200 rounded-2xl p-4 space-y-4">
                  {/* Selector type */}
                  <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setPrescType('MEDICAMENT'); setPrescError(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition ${
                        prescType === 'MEDICAMENT' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Médicament
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrescType('SPECIALISTE'); setPrescError(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition ${
                        prescType === 'SPECIALISTE' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Réf. Spécialiste
                    </button>
                  </div>

                  {prescType === 'MEDICAMENT' ? (
                    <div className="space-y-3">
                      <Input
                        label="Nom du médicament"
                        placeholder="Ex: Paracétamol 500mg"
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="py-2.5 text-xs"
                      />
                      <Input
                        label="Posologie"
                        placeholder="Ex: 1 cp matin et soir pendant 5 jours"
                        value={posology}
                        onChange={(e) => setPosology(e.target.value)}
                        className="py-2.5 text-xs"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="form-group">
                        <label className="font-display font-medium text-[11px] text-slate-350">Médecin spécialiste cible</label>
                        <select
                          value={specMatricule}
                          onChange={(e) => setSpecMatricule(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl font-body text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500/40"
                        >
                          <option value="">-- Choisir un spécialiste --</option>
                          {specialists.map((s) => (
                            <option key={s.id} value={s.matricule}>
                              Dr. {s.nom} ({s.domaineSpecialisation})
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        label="Motif du renvoi"
                        placeholder="Ex: Évaluation cardiaque complémentaire"
                        value={specMotif}
                        onChange={(e) => setSpecMotif(e.target.value)}
                        className="py-2.5 text-xs"
                      />
                    </div>
                  )}

                  {prescError && (
                    <div className="flex items-center gap-1.5 text-[10px] text-danger font-medium leading-relaxed bg-danger/5 p-2 rounded-lg border border-danger/10">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{prescError}</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPrescription}
                    className="w-full text-xs py-2"
                  >
                    Ajouter à l&apos;ordonnance
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-danger/10 border border-danger/20 text-danger rounded-2xl text-xs">
            {submitError}
          </div>
        )}

        {/* Submit controls */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Enregistrer la consultation
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
