'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Trash2,
  ArrowLeft,
  AlertCircle,
  User,
  FileText,
  Stethoscope,
  Pill,
  Send,
  Search
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getMesAssures, getMedecins, createConsultation, getApiErrorMessage, getAssureById, choisirMedecinTraitant } from '@/lib/api';
import { AssurSService } from '@/lib2';
import { mapAssure } from '@/lib/mappers';
import { Assure, Medecin } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';

interface ConsultationFormValues {
  assureId: string;
  motif: string;
  creerFeuille: boolean;
  montantSoin: number;
}

interface TempPrescription {
  type: 'MEDICAMENT' | 'SPECIALISTE';
  medicament?: string;
  posologie?: string;
  matriculeMedecin?: string;
  motif?: string;
}

export default function NouvelleConsultationPage() {
  const { t } = useTranslation();
  const { success, error, warning } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryAssureId = searchParams.get('assureId');
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Patient search states
  const [searchIdAssure, setSearchIdAssure] = useState('');
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);

  // Form Validation Schema defined inside the component to use t() dynamically
  const consultationFormSchema = z.object({
    assureId: z.string().min(1, { message: t('medecin.nouvelle_consultation.error_patient') || 'Veuillez sélectionner un patient.' }),
    motif: z.string().min(5, { message: t('medecin.nouvelle_consultation.error_motif') || 'Veuillez saisir un motif de consultation détaillé.' }),
    creerFeuille: z.boolean(),
    montantSoin: z.number().min(0, { message: t('medecin.nouvelle_consultation.error_montant') || 'Le montant doit être supérieur ou égal à 0.' }),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: {
      creerFeuille: false,
      montantSoin: 0,
    }
  });

  const watchCreerFeuille = watch('creerFeuille');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resAssures, resMedecins] = await Promise.all([
          getMesAssures().catch((err) => {
            console.error('Failed to load assured patients:', err);
            return { data: [] };
          }),
          getMedecins().catch((err) => {
            console.error('Failed to load specialists:', err);
            return { data: [] };
          }),
        ]);

        let loadedAssures = [...resAssures.data];

        if (queryAssureId) {
          const assureIdNum = Number(queryAssureId);
          if (!loadedAssures.some((a) => a.id === assureIdNum)) {
            try {
              const resSingle = await getAssureById(assureIdNum);
              if (resSingle.data) {
                loadedAssures.push(resSingle.data);
              }
            } catch (err) {
              console.error('Failed to load patient from query param:', err);
            }
          }
        }

        setAssures(loadedAssures);
        
        // Filter specialists
        setSpecialists(resMedecins.data.filter((m) => m.type === 'SPECIALISTE'));

        if (queryAssureId) {
          setValue('assureId', queryAssureId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [queryAssureId, setValue]);

  if (!user) return null;

  // Seuls les médecins généralistes peuvent créer une consultation (BUG FRONT #1)
  // Un spécialiste n'a pas de médecin traitant en base -> 400 backend
  if (user.role === 'SPECIALISTE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="p-4 bg-warning/10 rounded-2xl">
          <AlertCircle size={32} className="text-warning" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-slate-800">
            Accès restreint
          </h2>
          <p className="font-body text-sm text-slate-500 mt-1 max-w-sm">
            Seul le médecin traitant (généraliste) peut créer une consultation.<br />
            Un spécialiste intervient uniquement via une prescription d&apos;orientation.
          </p>
        </div>
        <button
          onClick={() => router.push('/medecin')}
          className="flex items-center gap-2 text-xs font-display text-primary-600 hover:underline transition"
        >
          <ArrowLeft size={14} />
          Retour au tableau de bord
        </button>
      </div>
    );
  }

  const handleAddPrescription = () => {
    if (prescType === 'MEDICAMENT') {
      if (!medName.trim() || !posology.trim()) {
        warning(t('medecin.nouvelle_consultation.form_error_med') || 'Veuillez renseigner le nom du médicament et sa posologie.');
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
        warning(t('medecin.nouvelle_consultation.form_error_spec') || 'Veuillez sélectionner le spécialiste ciblé et renseigner le motif.');
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

  const handleSearchPatient = async () => {
    if (!searchIdAssure.trim()) {
      warning("Veuillez saisir un identifiant assuré (ex: ASS-12345).");
      return;
    }
    setIsSearchingPatient(true);
    try {
      const raw = await AssurSService.getByIdAssure(searchIdAssure.trim());
      const medecins = await getMedecins().then(res => res.data).catch(() => []);
      const patient = mapAssure(raw as Record<string, unknown>, medecins);
      
      if (patient) {
        setAssures((prev) => {
          if (prev.some((p) => p.id === patient.id)) return prev;
          return [...prev, patient];
        });
        setValue('assureId', String(patient.id));
        success(`Patient trouvé : ${patient.nom}. Sélectionné.`);
      } else {
        error("Aucun patient trouvé avec cet identifiant.");
      }
    } catch (err) {
      console.error(err);
      error("Patient introuvable ou erreur de recherche.");
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const onSubmit = async (data: ConsultationFormValues) => {
    setIsSubmitting(true);
    try {
      const selectedAssureId = Number(data.assureId);
      const selectedAssure = assures.find(a => a.id === selectedAssureId);
      
      if (selectedAssure && (!selectedAssure.medecinTraitant || selectedAssure.medecinTraitant.id !== user.id)) {
        try {
          await choisirMedecinTraitant(selectedAssureId, user.id);
        } catch (assignErr) {
          console.error("Failed to auto-assign doctor:", assignErr);
        }
      }

      const payload = {
        assureId: selectedAssureId,
        generalisteId: user.id,
        motif: data.motif,
        prescriptions: prescriptions,
        creerFeuille: data.creerFeuille,
        montantSoin: data.creerFeuille ? data.montantSoin : undefined,
      };

      await createConsultation(payload);
      success(t('medecin.nouvelle_consultation.create_success') || 'Consultation enregistrée avec succès.');
      router.push('/medecin/consultations');
    } catch (e) {
      // BUG FRONT #4 : afficher le vrai message d'erreur backend
      error(getApiErrorMessage(e));
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
        id="button-back"
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-display text-slate-500 hover:text-slate-800 transition w-fit group cursor-pointer"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
        <span>{t('common.back')}</span>
      </button>

      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('medecin.nouvelle_consultation.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('medecin.nouvelle_consultation.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Patient & Motif (60%) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-slate-200/80 shadow-md bg-white">
              <CardBody className="p-5 space-y-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                    <User size={18} />
                  </div>
                  <h3 className="font-display font-bold text-sm text-slate-800">
                    {t('medecin.nouvelle_consultation.form_title')}
                  </h3>
                </div>
                <div className="h-px bg-slate-200" />

                {/* Search Patient Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 mb-2">
                  <span className="font-display font-semibold text-xs text-slate-850 block">
                    Rechercher un patient par identifiant (ASS-XXXXXXXX)
                  </span>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        placeholder="Ex: ASS-12345678"
                        value={searchIdAssure}
                        onChange={(e) => setSearchIdAssure(e.target.value)}
                        className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl font-body text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleSearchPatient}
                      isLoading={isSearchingPatient}
                      className="text-xs h-10 px-4"
                    >
                      Rechercher
                    </Button>
                  </div>
                </div>

                {/* Patient Select */}
                <div className="form-group">
                  <label className="form-label-inline font-display font-semibold text-[13px] text-slate-700 tracking-wide mb-1 block">
                    {t('common.patient')}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <select
                      id="select-assure"
                      className="w-full h-11 bg-slate-50/80 border border-slate-200 rounded-xl font-body text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 pl-10 pr-10 dashboard-input"
                      {...register('assureId')}
                    >
                      <option value="">-- {t('medecin.nouvelle_consultation.choose_patient')} --</option>
                      {assures.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nom} ({a.idAssure})
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.assureId && (
                    <p className="text-[11px] text-red-500 font-body font-medium flex items-center gap-1 mt-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {String(errors.assureId.message)}
                    </p>
                  )}
                </div>

                {/* Diagnostic motif */}
                <div className="form-group">
                  <label className="form-label-inline font-display font-semibold text-[13px] text-slate-700 tracking-wide mb-1 block">
                    {t('medecin.nouvelle_consultation.motif')}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3 text-slate-400 pointer-events-none flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <textarea
                      id="textarea-motif"
                      rows={4}
                      placeholder={t('medecin.nouvelle_consultation.motif_placeholder')}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-xl font-body text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 pl-10 pr-4 py-2.5 resize-none"
                      {...register('motif')}
                    />
                  </div>
                  {errors.motif && (
                    <p className="text-[11px] text-red-500 font-body font-medium flex items-center gap-1 mt-1">
                      <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
                      {String(errors.motif.message)}
                    </p>
                  )}
                </div>

                {/* Feuille de maladie toggle block */}
                <div className="pt-4 border-t border-slate-200">
                  <div className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col gap-3 select-none ${
                    watchCreerFeuille 
                      ? 'border-primary-500 bg-primary-50/40 shadow-sm ring-1 ring-primary-500/50' 
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                  }`}>
                    <label className="flex items-center gap-3 cursor-pointer w-full" id="label-creer-feuille">
                      <div className="relative flex items-center">
                        <input
                          id="checkbox-creer-feuille"
                          type="checkbox"
                          className="h-4.5 w-4.5 rounded border-slate-350 text-primary-600 focus:ring-primary-500/30 cursor-pointer accent-primary-600"
                          {...register('creerFeuille')}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="font-display font-semibold text-xs text-slate-800 block">
                          {t('medecin.nouvelle_consultation.create_feuille')}
                        </span>
                        <span className="text-[10px] text-slate-500 font-body block mt-0.5">
                          {t('medecin.nouvelle_consultation.step_feuille') + " - " + (t('medecin.consultations.generate_sheet_hint') || 'Permet le remboursement automatique de l\'assuré social')}
                        </span>
                      </div>
                    </label>

                    <AnimatePresence>
                      {watchCreerFeuille && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-1"
                        >
                          <div className="h-px bg-primary-200/50 mb-3" />
                          <Input
                            id="input-montant-soin"
                            label={t('medecin.nouvelle_consultation.feuille_amount')}
                            type="number"
                            placeholder="Ex: 15000"
                            leftIcon={<span className="text-xs font-bold text-slate-400">FCFA</span>}
                            error={errors.montantSoin?.message ? String(errors.montantSoin.message) : undefined}
                            {...register('montantSoin', { valueAsNumber: true })}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* RIGHT COLUMN: Prescriptions Form (40%) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Dynamic Prescriptions Card */}
            <Card className="border-slate-200/80 shadow-md bg-white overflow-visible">
              <CardBody className="p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-sm text-slate-800">
                        {t('medecin.nouvelle_consultation.prescriptions_title') || t('medecin.nouvelle_consultation.prescriptions_label')}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-body">
                        {t('medecin.nouvelle_consultation.step_prescriptions')}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-655 rounded-full font-display font-bold text-[10px]">
                    {prescriptions.length}
                  </span>
                </div>
                <div className="h-px bg-slate-200" />

                {/* Current order list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-display font-bold text-slate-500 tracking-wider uppercase block">
                    {t('medecin.nouvelle_consultation.written_presc')}
                  </span>
                  
                  {prescriptions.length === 0 ? (
                    <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400 font-body bg-slate-50/20">
                      <Pill size={24} className="mx-auto text-slate-300 mb-2 opacity-60" />
                      {t('medecin.nouvelle_consultation.none_added')}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {prescriptions.map((p, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 font-body text-xs text-slate-650"
                          >
                            <div className="flex-1 min-w-0 flex items-start gap-2">
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${p.type === 'MEDICAMENT' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                {p.type === 'MEDICAMENT' ? <Pill size={13} /> : <Stethoscope size={13} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                {p.type === 'MEDICAMENT' ? (
                                  <div>
                                    <span className="font-semibold text-slate-800">{p.medicament}</span> <br />
                                    <span className="text-slate-500 text-[10px] italic">{t('medecin.nouvelle_consultation.posologie')}: {p.posologie}</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="font-semibold text-slate-800">{t('medecin.nouvelle_consultation.type_spec')} ({p.matriculeMedecin})</span> <br />
                                    <span className="text-slate-500 text-[10px] truncate block">{p.motif}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePrescription(idx)}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Add Subform Card */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  {/* Selector type */}
                  <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setPrescType('MEDICAMENT'); }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition cursor-pointer ${
                        prescType === 'MEDICAMENT' ? 'bg-white text-slate-850 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t('medecin.nouvelle_consultation.type_med')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPrescType('SPECIALISTE'); }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-display font-bold uppercase tracking-wider transition cursor-pointer ${
                        prescType === 'SPECIALISTE' ? 'bg-white text-slate-850 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {t('medecin.nouvelle_consultation.type_spec')}
                    </button>
                  </div>

                  {prescType === 'MEDICAMENT' ? (
                    <div className="space-y-3">
                      <Input
                        id="input-medicament-name"
                        label={t('medecin.nouvelle_consultation.medicament')}
                        placeholder={t('medecin.nouvelle_consultation.medicament_placeholder')}
                        value={medName}
                        onChange={(e) => setMedName(e.target.value)}
                        className="py-2.5 text-xs bg-white"
                        leftIcon={<Pill size={14} className="text-slate-400" />}
                      />
                      <Input
                        id="input-posologie"
                        label={t('medecin.nouvelle_consultation.posologie')}
                        placeholder={t('medecin.nouvelle_consultation.posologie_placeholder')}
                        value={posology}
                        onChange={(e) => setPosology(e.target.value)}
                        className="py-2.5 text-xs bg-white"
                        leftIcon={<FileText size={14} className="text-slate-400" />}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="form-group">
                        <label className="font-display font-semibold text-[13px] text-slate-700 tracking-wide mb-1 block">
                          {t('medecin.nouvelle_consultation.target_spec')}
                        </label>
                        <div className="relative flex items-center">
                          <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                            <Stethoscope size={14} />
                          </div>
                          <select
                            id="select-specialist"
                            value={specMatricule}
                            onChange={(e) => setSpecMatricule(e.target.value)}
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl font-body text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 pl-10 pr-10 dashboard-input"
                          >
                            <option value="">-- {t('medecin.nouvelle_consultation.choose_spec')} --</option>
                            {specialists.map((s) => (
                              <option key={s.id} value={s.matricule}>
                                Dr. {s.nom} ({s.domaineSpecialisation})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <Input
                        id="input-referral-reason"
                        label={t('medecin.nouvelle_consultation.referral_reason')}
                        placeholder={t('medecin.nouvelle_consultation.referral_motif_placeholder')}
                        value={specMotif}
                        onChange={(e) => setSpecMotif(e.target.value)}
                        className="py-2.5 text-xs bg-white"
                        leftIcon={<FileText size={14} className="text-slate-400" />}
                      />
                    </div>
                  )}

                  <Button
                    id="button-add-prescription"
                    type="button"
                    variant="outline"
                    onClick={handleAddPrescription}
                    className="w-full text-xs py-2 bg-white flex items-center justify-center gap-1.5 border-dashed border-slate-300 hover:border-primary-400"
                    leftIcon={<Plus size={14} />}
                  >
                    {t('medecin.nouvelle_consultation.add_prescription')}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Submit controls */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <Button
            id="button-cancel"
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            {t('common.cancel')}
          </Button>
          <Button
            id="button-save-consultation"
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Send size={15} />}
          >
            {t('medecin.nouvelle_consultation.submit')}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
