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
  Filter,
  UserCheck,
  Smartphone,
  Droplet
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { getAssures, getGeneralistes, createAssure, deleteAssure, getApiErrorMessage } from '@/lib/api';
import { Assure, Medecin } from '@/types';
import Button from '@/components/ui/Button';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';

const assureFormSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  dateNaissance: z.string().min(1, { message: 'La date de naissance est requise' }),
  sexe: z.string().min(1, { message: 'Veuillez choisir le sexe' }),
  profession: z.string().min(1, { message: 'La profession est requise' }),
  statutMatrimoniale: z.string().min(1, { message: 'Le statut est requis' }),
  groupeSanguin: z.string().min(1, { message: 'Le groupe sanguin est requis' }),
  numTelephone: z.string().min(6, { message: 'Le numéro de téléphone est requis' }),
  medecinTraitantId: z.string().optional(),
});

type AssureFormValues = z.infer<typeof assureFormSchema>;

export default function AssuresAdminPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [assures, setAssures] = useState<Assure[]>([]);
  const [generalistes, setGeneralistes] = useState<Medecin[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssureFormValues>({
    resolver: zodResolver(assureFormSchema),
    defaultValues: {
      sexe: 'Homme',
      statutMatrimoniale: 'Célibataire',
      groupeSanguin: 'O+',
    }
  });

  const onSubmit = async (data: AssureFormValues) => {
    setSubmitError(null);
    try {
      const doc = generalistes.find((m) => m.id === Number(data.medecinTraitantId));
      
      const payload: Partial<Assure> = {
        nom: data.nom,
        dateNaissance: data.dateNaissance,
        sexe: data.sexe,
        profession: data.profession,
        statutMatrimoniale: data.statutMatrimoniale,
        groupeSanguin: data.groupeSanguin,
        numTelephone: data.numTelephone,
        medecinTraitant: doc,
      };

      await createAssure(payload);
      setIsModalOpen(false);
      reset();
      loadData();
    } catch (e) {
      setSubmitError(t('common.error'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.assures.delete_confirm') || 'Supprimer ?')) return;
    try {
      await deleteAssure(id);
      loadData();
    } catch (e) {
      alert(getApiErrorMessage(e));
    }
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
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />}>
          {t('admin.assures.new_assure')}
        </Button>
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
              placeholder={t('admin.assures.search_placeholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="dashboard-search"
            />
          </div>

          {/* Select Medecin */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <UserCheck size={16} className="text-slate-400 shrink-0" />
            <select
              value={filterMedecin}
              onChange={(e) => {
                setFilterMedecin(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('admin.assures.filter_all_doctors')}</option>
              <option value="NONE">{t('admin.assures.filter_no_doctor')}</option>
              {generalistes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Select Blood Group */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Droplet size={16} className="text-slate-400 shrink-0" />
            <select
              value={filterBlood}
              onChange={(e) => {
                setFilterBlood(e.target.value);
                setCurrentPage(1);
              }}
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
                    <TableCell className="font-display font-semibold text-white">
                      {a.nom}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Smartphone size={13} className="text-slate-500" />
                        {a.numTelephone}
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
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/assures/${a.id}`}>
                          <Button variant="ghost" size="sm" className="p-1.5 h-8 w-8 text-primary-400">
                            <Eye size={15} />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleDelete(a.id)}
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

          {/* Table Footer / Pagination */}
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
          />
        </CardBody>
      </Card>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        title={t('admin.assures.new_assure') || 'Nouveau'}
        description={t('admin.assures.form_desc') || ''}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <select
                className="dashboard-input"
                {...register('sexe')}
              >
                <option value="Homme">{t('admin.assures.sex_male')}</option>
                <option value="Femme">{t('admin.assures.sex_female')}</option>
                <option value="Autre">{t('admin.assures.sex_other')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('admin.assures.form_phone') || 'Phone'}
              placeholder="+237 6xx xx xx xx"
              error={errors.numTelephone?.message ? String(errors.numTelephone.message) : undefined}
              {...register('numTelephone')}
            />

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
              <select
                className="dashboard-input"
                {...register('statutMatrimoniale')}
              >
                <option value="Célibataire">{t('admin.assures.matrimonial_single')}</option>
                <option value="Marié">{t('admin.assures.matrimonial_married')}</option>
                <option value="Divorcé">{t('admin.assures.matrimonial_divorced')}</option>
                <option value="Veuf">{t('admin.assures.matrimonial_widowed')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.blood_group')}</label>
              <select
                className="dashboard-input"
                {...register('groupeSanguin')}
              >
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
            <select
              className="dashboard-input"
              {...register('medecinTraitantId')}
            >
              <option value="">-- {t('admin.assures.form_doctor_select')} --</option>
              {generalistes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom} ({g.matricule})
                </option>
              ))}
            </select>
          </div>

          {submitError && (
            <div className="p-3 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
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
              {t('admin.assures.form_submit')}
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
