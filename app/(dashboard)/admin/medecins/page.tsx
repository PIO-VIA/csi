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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getMedecins, getAssures, createMedecin, getApiErrorMessage } from '@/lib/api';
import { Medecin, Assure, CreateMedecinInput } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';

const medecinFormSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  numTelephone: z.string().min(6, { message: 'Le numéro de téléphone est requis' }),
  type: z.enum(['GENERALISTE', 'SPECIALISTE']),
  domaineSpecialisation: z.string().optional(),
});

type MedecinFormValues = z.infer<typeof medecinFormSchema>;

export default function MedecinsAdminPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [assures, setAssures] = useState<Assure[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

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
    }
  });

  const watchType = watch('type');

  const onSubmit = async (data: MedecinFormValues) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const payload: CreateMedecinInput = {
        nom: data.nom,
        email: data.email,
        numTelephone: data.numTelephone,
        type: data.type,
        domaineSpecialisation: data.type === 'SPECIALISTE' ? data.domaineSpecialisation : undefined,
      };

      await createMedecin(payload);
      setSubmitSuccess(
        t('admin.medecins.form_success', { email: data.email }) || `Enregistré.`
      );
      reset();
      loadData();
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(null);
      }, 2500);
    } catch (e) {
      setSubmitError(getApiErrorMessage(e));
    }
  };

  const handleDelete = (_id: number) => {
    alert(t('admin.medecins.delete_not_supported') || 'La suppression n’est pas disponible.');
  };

  const handleResetPassword = async (id: number) => {
    if (!confirm('Envoyer un nouveau mot de passe par email ?')) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { MDecinsService } = await import('@/lib2') as any;
      await MDecinsService.resetPassword(id);
      alert('Nouveau mot de passe envoyé par email.');
    } catch (e) {
      alert(getApiErrorMessage(e));
    }
  };

  const exportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Email', 'Type', 'Specialisation', 'Telephone'];
    const rows = filteredMedecins.map((m) => [
      m.matricule, m.nom, m.email || '', m.type,
      m.domaineSpecialisation || '', m.numTelephone,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'medecins_csi.csv'; link.click();
    URL.revokeObjectURL(url);
  };

  // Unique list of specialities
  const specialities = Array.from(
    new Set(
      medecins
        .filter((m) => m.type === 'SPECIALISTE' && m.domaineSpecialisation)
        .map((m) => m.domaineSpecialisation!)
    )
  );

  // Filter doctors list
  const filteredMedecins = medecins.filter((m) => {
    const matchesSearch =
      m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.matricule.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || m.type === filterType;

    const matchesDomain =
      filterDomain === 'ALL' ||
      (m.type === 'SPECIALISTE' && m.domaineSpecialisation === filterDomain);

    return matchesSearch && matchesType && matchesDomain;
  });

  // Calculate patient counts for each doctor
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
          {/* Search box */}
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

          {/* Toggle Type */}
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

          {/* Select Speciality */}
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
                      {m.nom}
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
                        {m.numTelephone}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-8 w-8 text-success hover:bg-success/10"
                          title="Réinitialiser le mot de passe"
                          onClick={() => handleResetPassword(m.id)}
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
          setSubmitError(null);
          setSubmitSuccess(null);
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
            label={t('admin.medecins.form_email') || 'Email'}
            type="email"
            placeholder="medecin@csi.cm"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message ? String(errors.email.message) : undefined}
            {...register('email')}
          />

          <Input
            label={t('admin.medecins.form_phone') || 'Phone'}
            placeholder="+237 6xx xx xx xx"
            error={errors.numTelephone?.message ? String(errors.numTelephone.message) : undefined}
            {...register('numTelephone')}
          />

          <div className="form-group">
            <label className="form-label-inline">{t('admin.medecins.form_type')}</label>
            <select
              className="dashboard-input"
              {...register('type')}
            >
              <option value="GENERALISTE">{t('admin.medecins.generaliste')}</option>
              <option value="SPECIALISTE">{t('admin.medecins.specialiste')}</option>
            </select>
          </div>

          {watchType === 'SPECIALISTE' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Input
                label={t('admin.medecins.form_speciality') || 'Speciality'}
                placeholder="Ex: Cardiologie, Pédiatrie, Dermatologie"
                error={errors.domaineSpecialisation?.message ? String(errors.domaineSpecialisation.message) : undefined}
                {...register('domaineSpecialisation')}
              />
            </motion.div>
          )}

          {submitSuccess && (
            <div className="p-3 bg-success/10 border border-success/20 text-success rounded-xl text-xs leading-relaxed">
              {submitSuccess}
            </div>
          )}

          {submitError && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs">
              {submitError}
            </div>
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
            <Button type="submit" variant="primary">
              {t('admin.medecins.form_submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
