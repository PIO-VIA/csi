'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Stethoscope,
  Search,
  Plus,
  Trash2,
  Phone,
  Bookmark,
  Mail,
  Download,
  KeyRound,
  Pencil,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getMedecins, getAssures, createMedecin, updateMedecin, deleteMedecin, getApiErrorMessage } from '@/lib/api';
import { Medecin, Assure, CreateMedecinInput } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';

// ─── Schemas ────────────────────────────────────────────────
const medecinFormSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  indicatifPays: z.string().min(1, { message: "L'indicatif pays est requis" }),
  numTelephone: z.string().min(6, { message: 'Le numéro de téléphone est requis' }),
  type: z.enum(['GENERALISTE', 'SPECIALISTE']),
  domaineSpecialisation: z.string().optional(),
  matricule: z.string().optional(),
  estAssure: z.boolean().optional(),
  medecinTraitantId: z.string().optional(),
});

const editMedecinSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  indicatifPays: z.string().min(1, { message: "L'indicatif pays est requis" }),
  numTelephone: z.string().min(6, { message: 'Le numéro de téléphone est requis' }),
  sexe: z.string().optional(),
  dateNaissance: z.string().optional(),
  domaineSpecialisation: z.string().optional(),
  matricule: z.string().optional(),
  estAssure: z.boolean().optional(),
  medecinTraitantId: z.string().optional(),
});

type MedecinFormValues = z.infer<typeof medecinFormSchema>;
type EditMedecinFormValues = z.infer<typeof editMedecinSchema>;

// ─── Component ──────────────────────────────────────────────
export default function MedecinsAdminPage() {
  const { t } = useTranslation();
  const { success, error, warning } = useToast();
  const [loading, setLoading] = useState(true);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [assures, setAssures] = useState<Assure[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resettingId, setResettingId] = useState<number | null>(null);

  // Edit state
  const [editingMedecin, setEditingMedecin] = useState<Medecin | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GENERALISTE' | 'SPECIALISTE'>('ALL');
  const [filterDomain, setFilterDomain] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const [resMed, resAssures] = await Promise.all([getMedecins(), getAssures()]);
      setMedecins(resMed.data);
      setAssures(resAssures.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ─── Create Form ───────────────────────────────────────────
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<MedecinFormValues>({
    resolver: zodResolver(medecinFormSchema),
    defaultValues: {
      type: 'GENERALISTE',
      indicatifPays: '+237',
    },
  });

  const watchType = watch('type');
  const watchEstAssure = watch('estAssure');

  const onSubmit = async (data: MedecinFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: CreateMedecinInput = {
        nom: data.nom,
        email: data.email,
        indicatifPays: data.indicatifPays,
        numTelephone: data.numTelephone,
        type: data.type,
        domaineSpecialisation: data.type === 'SPECIALISTE' ? data.domaineSpecialisation : undefined,
        matricule: data.matricule || undefined,
        estAssure: data.estAssure,
        medecinTraitantId: data.estAssure ? (data.medecinTraitantId ? Number(data.medecinTraitantId) : -1) : -1,
      };

      await createMedecin(payload);
      success(t('admin.medecins.form_success', { email: data.email }) || `Enregistré.`);
      reset();
      loadData();
      setIsModalOpen(false);
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Edit Form ─────────────────────────────────────────────
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
    formState: { errors: editErrors },
  } = useForm<EditMedecinFormValues>({
    resolver: zodResolver(editMedecinSchema),
  });

  const watchEstAssureEdit = watchEdit('estAssure');

  const openEditModal = (m: Medecin) => {
    setEditingMedecin(m);
    resetEdit({
      nom: m.nom,
      email: m.email,
      indicatifPays: m.indicatifPays ?? '+237',
      numTelephone: m.numTelephone,
      sexe: m.sexe ?? '',
      dateNaissance: m.dateNaissance ?? '',
      domaineSpecialisation: m.domaineSpecialisation ?? '',
      matricule: m.matricule ?? '',
      estAssure: m.estAssure,
      medecinTraitantId: m.medecinTraitantId ? String(m.medecinTraitantId) : '',
    });
    setIsEditModalOpen(true);
  };

  const onEditSubmit = async (data: EditMedecinFormValues) => {
    if (!editingMedecin) return;
    setIsEditSubmitting(true);
    try {
      await updateMedecin(editingMedecin.id, {
        nom: data.nom,
        email: data.email,
        indicatifPays: data.indicatifPays,
        numTelephone: data.numTelephone,
        sexe: data.sexe || undefined,
        dateNaissance: data.dateNaissance || undefined,
        domaineSpecialisation:
          editingMedecin.type === 'SPECIALISTE' ? (data.domaineSpecialisation || undefined) : undefined,
        type: editingMedecin.type,
        matricule: data.matricule || undefined,
        estAssure: data.estAssure,
        medecinTraitantId: data.estAssure ? (data.medecinTraitantId ? Number(data.medecinTraitantId) : -1) : -1,
      });
      success('Informations du médecin mises à jour avec succès.');
      setIsEditModalOpen(false);
      setEditingMedecin(null);
      loadData();
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    const medecin = medecins.find((m) => m.id === id);
    if (!medecin) return;
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le médecin',
      description: `Êtes-vous sûr de vouloir supprimer définitivement le médecin ${medecin.nom} ? Cette action est irréversible.`,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          await deleteMedecin(id);
          success('Le médecin a été supprimé avec succès.');
          loadData();
        } catch (e) {
          error(getApiErrorMessage(e));
        }
      },
    });
  };

  const handleResetPassword = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Réinitialiser le mot de passe',
      description: "Êtes-vous sûr de vouloir générer un nouveau mot de passe et l'envoyer par e-mail à ce médecin ?",
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setResettingId(id);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { MDecinsService } = (await import('@/lib2')) as any;
          await MDecinsService.resetPassword(id);
          success('Nouveau mot de passe envoyé par email.');
        } catch (e) {
          error(getApiErrorMessage(e));
        } finally {
          setResettingId(null);
        }
      },
    });
  };

  const exportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Email', 'Type', 'Specialisation', 'Telephone'];
    const rows = filteredMedecins.map((m) => [
      m.matricule,
      m.nom,
      m.email || '',
      m.type,
      m.domaineSpecialisation || '',
      m.numTelephone,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'medecins_csi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Derived state ─────────────────────────────────────────
  const specialities = Array.from(
    new Set(
      medecins
        .filter((m) => m.type === 'SPECIALISTE' && m.domaineSpecialisation)
        .map((m) => m.domaineSpecialisation!),
    ),
  );

  const filteredMedecins = medecins.filter((m) => {
    const matchesSearch =
      m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.matricule.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    const matchesDomain =
      filterDomain === 'ALL' || (m.type === 'SPECIALISTE' && m.domaineSpecialisation === filterDomain);
    return matchesSearch && matchesType && matchesDomain;
  });

  const getPatientCount = (doctor: Medecin) => {
    if (doctor.type !== 'GENERALISTE') return '-';
    return assures.filter((a) => a.medecinTraitant && a.medecinTraitant.id === doctor.id).length;
  };

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            {t('admin.medecins.title')}
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            {t('admin.medecins.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" leftIcon={<Download size={16} />} onClick={exportCSV}>
            Exporter CSV
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />}>
            {t('admin.medecins.new_doctor')}
          </Button>
        </div>
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
              placeholder={t('admin.medecins.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>

          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl w-full md:w-auto">
            {(['ALL', 'GENERALISTE', 'SPECIALISTE'] as const).map((tVal) => (
              <button
                key={tVal}
                onClick={() => {
                  setFilterType(tVal);
                  setFilterDomain('ALL');
                }}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-display font-medium uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  filterType === tVal
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tVal === 'ALL'
                  ? t('admin.medecins.filter_all')
                  : tVal === 'GENERALISTE'
                  ? t('admin.medecins.filter_generalists')
                  : t('admin.medecins.filter_specialists')}
              </button>
            ))}
          </div>

          {filterType === 'SPECIALISTE' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 animate-fade-in">
              <Bookmark size={16} className="text-slate-400 shrink-0" />
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">{t('admin.medecins.filter_all_specialities')}</option>
                {specialities.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardBody>
      </Card>

      {/* TABLE */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.medecins.col_nom')}</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>{t('admin.medecins.col_matricule')}</TableHead>
                <TableHead>{t('admin.medecins.col_type')}</TableHead>
                <TableHead>{t('admin.medecins.col_domain')}</TableHead>
                <TableHead>{t('admin.medecins.col_patients_count')}</TableHead>
                <TableHead>{t('admin.medecins.col_phone')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedecins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-body">
                    {t('admin.medecins.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedecins.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-display font-bold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        {m.photoUrl ? (
                          <img
                            src={m.photoUrl}
                            alt={m.nom}
                            className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                            {m.nom.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{m.nom}</span>
                          {m.estAssure && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                Assuré
                              </span>
                              {m.medecinTraitant && (
                                <span className="text-[10px] text-slate-500 font-body">
                                  Traitant : {m.medecinTraitant.nom}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        {m.email || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary-300 font-medium">
                      {m.matricule}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'GENERALISTE' ? 'info' : 'warning'}>
                        {m.type === 'GENERALISTE'
                          ? t('admin.medecins.generaliste')
                          : t('admin.medecins.specialiste')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {m.domaineSpecialisation || <span className="text-slate-500 italic">-</span>}
                    </TableCell>
                    <TableCell className="text-xs text-center font-semibold text-slate-700">
                      {getPatientCount(m)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-350">
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-500" />
                        {m.indicatifPays ? `${m.indicatifPays} ` : ''}
                        {m.numTelephone}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {/* Edit button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-8 w-8 text-primary-600 hover:bg-primary-50"
                          title="Modifier les informations"
                          onClick={() => openEditModal(m)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-8 w-8 text-success hover:bg-success/10"
                          title="Réinitialiser le mot de passe"
                          onClick={() => handleResetPassword(m.id)}
                          isLoading={resettingId === m.id}
                        >
                          <KeyRound size={15} />
                        </Button>
                        <Button
                          onClick={() => handleDelete(m.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-8 w-8 text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={15} />
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

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title={t('admin.medecins.new_doctor') || 'Nouveau'}
        description={t('admin.medecins.form_desc') || ''}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t('admin.medecins.form_name') || 'Nom'}
            placeholder="Ex: Dr. Célestin Etoa"
            error={errors.nom?.message ? String(errors.nom.message) : undefined}
            {...register('nom')}
          />

          <Input
            label={t('admin.medecins.col_matricule') || 'Matricule'}
            placeholder="Ex: MED-12345 (Laisser vide pour auto-générer)"
            error={errors.matricule?.message ? String(errors.matricule.message) : undefined}
            {...register('matricule')}
          />

          <Input
            label={t('admin.medecins.form_email') || 'Email'}
            type="email"
            placeholder="medecin@csi.cm"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message ? String(errors.email.message) : undefined}
            {...register('email')}
          />

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <Input
                label={t('admin.medecins.form_country_code') || 'Indicatif'}
                placeholder="+237"
                error={errors.indicatifPays?.message ? String(errors.indicatifPays.message) : undefined}
                {...register('indicatifPays')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label={t('admin.medecins.form_phone') || 'Téléphone'}
                placeholder="6xx xx xx xx"
                error={errors.numTelephone?.message ? String(errors.numTelephone.message) : undefined}
                {...register('numTelephone')}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-inline">{t('admin.medecins.form_type')}</label>
            <select className="dashboard-input" {...register('type')}>
              <option value="GENERALISTE">{t('admin.medecins.generaliste')}</option>
              <option value="SPECIALISTE">{t('admin.medecins.specialiste')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="estAssure"
              {...register('estAssure')}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="estAssure" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Rendre ce médecin également assuré de l'organisme
            </label>
          </div>

          {watchEstAssure && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="form-group">
              <label className="form-label">Médecin traitant (généraliste)</label>
              <select className="dashboard-input" {...register('medecinTraitantId')}>
                <option value="">-- Sélectionnez un médecin traitant --</option>
                {medecins
                  .filter((m) => m.type === 'GENERALISTE')
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nom}
                    </option>
                  ))}
              </select>
            </motion.div>
          )}

          {watchType === 'SPECIALISTE' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Input
                label={t('admin.medecins.form_speciality') || 'Speciality'}
                placeholder="Ex: Cardiologie, Pédiatrie, Dermatologie"
                error={
                  errors.domaineSpecialisation?.message
                    ? String(errors.domaineSpecialisation.message)
                    : undefined
                }
                {...register('domaineSpecialisation')}
              />
            </motion.div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {t('admin.medecins.form_submit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingMedecin(null);
        }}
        title="Modifier les informations du médecin"
        description={
          editingMedecin
            ? `Mise à jour du profil de ${editingMedecin.nom} (${editingMedecin.matricule}) — le mot de passe ne peut pas être modifié ici.`
            : ''
        }
      >
        {editingMedecin && (
          <form onSubmit={handleSubmitEdit(onEditSubmit)} className="space-y-4">
            <Input
              label="Nom complet"
              placeholder="Ex: Dr. Célestin Etoa"
              error={editErrors.nom?.message ? String(editErrors.nom.message) : undefined}
              {...registerEdit('nom')}
            />

            <Input
              label="Matricule professionnel"
              placeholder="Ex: MED-12345"
              error={editErrors.matricule?.message ? String(editErrors.matricule.message) : undefined}
              {...registerEdit('matricule')}
            />

            <Input
              label="Email"
              type="email"
              placeholder="medecin@csi.cm"
              leftIcon={<Mail size={16} />}
              error={editErrors.email?.message ? String(editErrors.email.message) : undefined}
              {...registerEdit('email')}
            />

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <Input
                  label="Indicatif"
                  placeholder="+237"
                  error={editErrors.indicatifPays?.message ? String(editErrors.indicatifPays.message) : undefined}
                  {...registerEdit('indicatifPays')}
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Téléphone"
                  placeholder="6xx xx xx xx"
                  error={editErrors.numTelephone?.message ? String(editErrors.numTelephone.message) : undefined}
                  {...registerEdit('numTelephone')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="form-label-inline">Genre</label>
                <select className="dashboard-input" {...registerEdit('sexe')}>
                  <option value="">— Non précisé —</option>
                  <option value="Homme">Masculin</option>
                  <option value="Femme">Féminin</option>
                </select>
              </div>
              <div>
                <Input
                  label="Date de naissance"
                  type="date"
                  error={editErrors.dateNaissance?.message ? String(editErrors.dateNaissance.message) : undefined}
                  {...registerEdit('dateNaissance')}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="estAssureEdit"
                {...registerEdit('estAssure')}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="estAssureEdit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Rendre ce médecin également assuré de l'organisme
              </label>
            </div>

            {watchEstAssureEdit && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="form-group">
                <label className="form-label">Médecin traitant (généraliste)</label>
                <select className="dashboard-input" {...registerEdit('medecinTraitantId')}>
                  <option value="">-- Sélectionnez un médecin traitant --</option>
                  {medecins
                    .filter((m) => m.type === 'GENERALISTE' && m.id !== editingMedecin.id)
                    .map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nom}
                      </option>
                    ))}
                </select>
              </motion.div>
            )}

            {editingMedecin.type === 'SPECIALISTE' && (
              <Input
                label="Domaine de spécialisation"
                placeholder="Ex: Cardiologie, Pédiatrie"
                error={
                  editErrors.domaineSpecialisation?.message
                    ? String(editErrors.domaineSpecialisation.message)
                    : undefined
                }
                {...registerEdit('domaineSpecialisation')}
              />
            )}

            {/* Info badge */}
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
              <KeyRound size={13} className="shrink-0" />
              <span>
                Le mot de passe ne peut pas être modifié ici. Utilisez le bouton{' '}
                <strong>Réinitialiser</strong> pour envoyer un nouveau mot de passe par email.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingMedecin(null);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" isLoading={isEditSubmitting}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        title={confirmModal.title}
        description={confirmModal.description}
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              confirmModal.onConfirm();
            }}
          >
            {t('common.confirm')}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
