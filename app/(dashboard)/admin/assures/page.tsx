'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Search,
  Plus,
  Eye,
  Trash2,
  Pencil,
  Download,
  UserCheck,
  Smartphone,
  Droplet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getAssures, getGeneralistes, createAssure, deleteAssure, updateAssure, getApiErrorMessage } from '@/lib/api';
import { Assure, Medecin } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';

const assureFormSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  dateNaissance: z.string().min(1, { message: 'La date de naissance est requise' }),
  sexe: z.string().min(1, { message: 'Veuillez choisir le sexe' }),
  profession: z.string().min(1, { message: 'La profession est requise' }),
  statutMatrimoniale: z.string().min(1, { message: 'Le statut est requis' }),
  groupeSanguin: z.string().min(1, { message: 'Le groupe sanguin est requis' }),
  indicatifPays: z.string().min(1, { message: "L'indicatif pays est requis" }),
  numTelephone: z.string().min(6, { message: 'Le numéro de téléphone est requis' }),
  medecinTraitantId: z.string().optional(),
});

type AssureFormValues = z.infer<typeof assureFormSchema>;

function AssureForm({
  onSubmit,
  register,
  errors,
  generalistes,
  onCancel,
  submitLabel,
  isLoading,
  t,
}: {
  onSubmit: (e: React.FormEvent) => void;
  register: ReturnType<typeof useForm<AssureFormValues>>['register'];
  errors: ReturnType<typeof useForm<AssureFormValues>>['formState']['errors'];
  generalistes: Medecin[];
  onCancel: () => void;
  submitLabel: string;
  isLoading?: boolean;
  t: (key: string) => string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label={t('admin.assures.form_name') || 'Nom'}
        placeholder="Ex: Jean-Marc Fosso"
        error={errors.nom?.message ? String(errors.nom.message) : undefined}
        {...register('nom')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label={t('admin.assures.form_dob') || 'DOB'}
          type="date"
          error={errors.dateNaissance?.message ? String(errors.dateNaissance.message) : undefined}
          {...register('dateNaissance')}
        />

        <div className="form-group">
          <label className="form-label">{t('admin.assures.form_sex') || 'Sexe'}</label>
          <select className="dashboard-input" {...register('sexe')}>
            <option value="Homme">{t('admin.assures.sex_male')}</option>
            <option value="Femme">{t('admin.assures.sex_female')}</option>
            <option value="Autre">{t('admin.assures.sex_other')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <Input
              label={t('admin.assures.form_country_code') || 'Indicatif'}
              placeholder="+237"
              error={errors.indicatifPays?.message ? String(errors.indicatifPays.message) : undefined}
              {...register('indicatifPays')}
            />
          </div>
          <div className="col-span-2">
            <Input
              label={t('admin.assures.form_phone') || 'Téléphone'}
              placeholder="6xx xx xx xx"
              error={errors.numTelephone?.message ? String(errors.numTelephone.message) : undefined}
              {...register('numTelephone')}
            />
          </div>
        </div>

        <Input
          label={t('admin.assures.form_profession') || 'Profession'}
          placeholder="Ex: Comptable, Enseignant"
          error={errors.profession?.message ? String(errors.profession.message) : undefined}
          {...register('profession')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">{t('admin.assures.form_matrimonial') || 'Statut'}</label>
          <select className="dashboard-input" {...register('statutMatrimoniale')}>
            <option value="Célibataire">{t('admin.assures.matrimonial_single')}</option>
            <option value="Marié">{t('admin.assures.matrimonial_married')}</option>
            <option value="Divorcé">{t('admin.assures.matrimonial_divorced')}</option>
            <option value="Veuf">{t('admin.assures.matrimonial_widowed')}</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t('auth.blood_group')}</label>
          <select className="dashboard-input" {...register('groupeSanguin')}>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('admin.assures.form_doctor')}</label>
        <select className="dashboard-input" {...register('medecinTraitantId')}>
          <option value="">-- {t('admin.assures.form_doctor_select')} --</option>
          {generalistes.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nom} ({g.matricule})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function AssuresAdminPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [assures, setAssures] = useState<Assure[]>([]);
  const [generalistes, setGeneralistes] = useState<Medecin[]>([]);

  // Create modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit modal
  const [editingAssure, setEditingAssure] = useState<Assure | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMedecin, setFilterMedecin] = useState('ALL');
  const [filterBlood, setFilterBlood] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resAssures, resGen] = await Promise.all([getAssures(), getGeneralistes()]);
      setAssures(resAssures.data);
      setGeneralistes(resGen.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssureFormValues>({
    resolver: zodResolver(assureFormSchema),
    defaultValues: { sexe: 'Homme', statutMatrimoniale: 'Célibataire', groupeSanguin: 'O+', indicatifPays: '+237' },
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: errorsEdit },
  } = useForm<AssureFormValues>({
    resolver: zodResolver(assureFormSchema),
  });

  const onSubmit = async (data: AssureFormValues) => {
    setIsSubmitting(true);
    try {
      const doc = generalistes.find((m) => m.id === Number(data.medecinTraitantId));
      const payload: Partial<Assure> = {
        nom: data.nom,
        dateNaissance: data.dateNaissance,
        sexe: data.sexe,
        profession: data.profession,
        statutMatrimoniale: data.statutMatrimoniale,
        groupeSanguin: data.groupeSanguin,
        indicatifPays: data.indicatifPays,
        numTelephone: data.numTelephone,
        medecinTraitant: doc,
      };
      await createAssure(payload);
      success(t('admin.assures.create_success') || 'Assuré créé avec succès.');
      setIsModalOpen(false);
      reset();
      loadData();
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEditSubmit = async (data: AssureFormValues) => {
    if (!editingAssure) return;
    setIsEditSubmitting(true);
    try {
      const doc = generalistes.find((m) => m.id === Number(data.medecinTraitantId));
      await updateAssure(editingAssure.id, {
        nom: data.nom,
        dateNaissance: data.dateNaissance,
        sexe: data.sexe,
        profession: data.profession,
        statutMatrimoniale: data.statutMatrimoniale,
        groupeSanguin: data.groupeSanguin,
        indicatifPays: data.indicatifPays,
        numTelephone: data.numTelephone,
        medecinTraitant: doc,
      });
      success(t('admin.assures.update_success') || 'Modifications enregistrées.');
      setIsEditModalOpen(false);
      setEditingAssure(null);
      resetEdit();
      loadData();
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.assures.delete_confirm') || 'Supprimer ?')) return;
    setDeletingId(id);
    try {
      await deleteAssure(id);
      success(t('admin.assures.delete_success') || 'Assuré supprimé.');
      loadData();
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (a: Assure) => {
    setEditingAssure(a);
    resetEdit({
      nom: a.nom,
      dateNaissance: a.dateNaissance || '',
      sexe: a.sexe || 'Homme',
      profession: a.profession || '',
      statutMatrimoniale: a.statutMatrimoniale || 'Célibataire',
      groupeSanguin: a.groupeSanguin || 'O+',
      indicatifPays: a.indicatifPays || '+237',
      numTelephone: a.numTelephone || '',
      medecinTraitantId: a.medecinTraitant ? String(a.medecinTraitant.id) : '',
    });
    setIsEditModalOpen(true);
  };

  // Filter logic
  const filteredAssures = assures.filter((a) => {
    const matchesSearch =
      a.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.idAssure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.numTelephone.includes(searchTerm);

    const matchesMedecin =
      filterMedecin === 'ALL' ||
      (filterMedecin === 'NONE' && !a.medecinTraitant) ||
      (a.medecinTraitant && a.medecinTraitant.id === Number(filterMedecin));

    const matchesBlood = filterBlood === 'ALL' || a.groupeSanguin === filterBlood;

    return matchesSearch && matchesMedecin && matchesBlood;
  });

  // CSV Export
  const exportCSV = () => {
    const headers = ['ID', 'Nom', 'Telephone', 'Profession', 'Medecin', 'Groupe Sanguin'];
    const rows = filteredAssures.map((a) => [
      a.idAssure,
      a.nom,
      a.numTelephone,
      a.profession,
      a.medecinTraitant?.nom || 'Non affecte',
      a.groupeSanguin,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'assures_csi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Pagination calculation
  const totalItems = filteredAssures.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedAssures = filteredAssures.slice(
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
            {t('admin.assures.title')}
          </h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            {t('admin.assures.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" leftIcon={<Download size={16} />} onClick={exportCSV}>
            Exporter CSV
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />}>
            {t('admin.assures.new_assure')}
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
              placeholder={t('admin.assures.search_placeholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="dashboard-search"
            />
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <UserCheck size={16} className="text-slate-400 shrink-0" />
            <select
              value={filterMedecin}
              onChange={(e) => { setFilterMedecin(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('admin.assures.filter_all_doctors')}</option>
              <option value="NONE">{t('admin.assures.filter_no_doctor')}</option>
              {generalistes.map((g) => (
                <option key={g.id} value={g.id}>{g.nom}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Droplet size={16} className="text-slate-400 shrink-0" />
            <select
              value={filterBlood}
              onChange={(e) => { setFilterBlood(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('admin.assures.filter_all_blood')}</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* TABLE */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>{t('admin.assures.col_id')}</TableHead>
                <TableHead>{t('admin.assures.col_nom')}</TableHead>
                <TableHead>{t('admin.assures.col_telephone')}</TableHead>
                <TableHead>{t('admin.assures.col_profession')}</TableHead>
                <TableHead>{t('admin.assures.col_doctor')}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAssures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500 font-body">
                    {t('admin.assures.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAssures.map((a, idx) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-center text-slate-500 text-xs">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-accent-400 font-medium">
                      {a.idAssure}
                    </TableCell>
                    <TableCell className="font-display font-semibold text-slate-800">
                      {a.nom}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Smartphone size={13} className="text-slate-500" />
                        {a.indicatifPays ? `${a.indicatifPays} ` : ''}{a.numTelephone}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{a.profession}</TableCell>
                    <TableCell className="text-xs">
                      {a.medecinTraitant ? (
                        <span className="text-slate-700 font-medium">{a.medecinTraitant.nom}</span>
                      ) : (
                        <Badge variant="warning">{t('admin.assures.no_doctor')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/assures/${a.id}`}>
                          <Button variant="ghost" size="sm" className="p-1.5 h-8 w-8 text-primary-400">
                            <Eye size={15} />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-8 w-8 text-primary-400"
                          onClick={() => openEditModal(a)}
                        >
                          <Pencil size={15} />
                        </Button>
                         <Button
                          onClick={() => handleDelete(a.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 h-8 w-8 text-danger hover:bg-danger/10"
                          isLoading={deletingId === a.id}
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

          {/* Table Footer / Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="dashboard-input w-28 text-xs h-8"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </CardBody>
      </Card>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); reset(); }}
        title={t('admin.assures.new_assure') || 'Nouveau'}
        description={t('admin.assures.form_desc') || ''}
        size="lg"
      >
        <AssureForm
          onSubmit={handleSubmit(onSubmit)}
          register={register}
          errors={errors}
          generalistes={generalistes}
          onCancel={() => { setIsModalOpen(false); reset(); }}
          submitLabel={t('admin.assures.form_submit')}
          isLoading={isSubmitting}
          t={t}
        />
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingAssure(null); resetEdit(); }}
        title="Modifier l'assuré"
        description={editingAssure ? `Modification de ${editingAssure.nom}` : ''}
        size="lg"
      >
        <AssureForm
          onSubmit={handleSubmitEdit(onEditSubmit)}
          register={registerEdit}
          errors={errorsEdit}
          generalistes={generalistes}
          onCancel={() => { setIsEditModalOpen(false); setEditingAssure(null); resetEdit(); }}
          submitLabel="Enregistrer les modifications"
          isLoading={isEditSubmitting}
          t={t}
        />
      </Modal>
    </motion.div>
  );
}
