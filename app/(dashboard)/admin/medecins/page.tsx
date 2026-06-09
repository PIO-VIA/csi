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
} from 'lucide-react';
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
        `Médecin enregistré. Un mot de passe provisoire sera envoyé à ${data.email} par le backend.`
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
    // Le backend ne fournit pas d’endpoint DELETE /api/medecins.
    alert('La suppression d’un médecin n’est pas disponible via le backend actuel.');
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
          <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">Gestion des Médecins</h1>
          <p className="font-body text-sm text-slate-500 mt-1">
            Enregistrez les professionnels de santé habilités à utiliser le système
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={16} />}>
          Enregistrer médecin
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
              placeholder="Rechercher par nom, matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>

          {/* Toggle Type */}
          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl w-full md:w-auto">
            {(['ALL', 'GENERALISTE', 'SPECIALISTE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilterType(t);
                  setFilterDomain('ALL');
                }}
                className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-display font-medium uppercase tracking-wider transition whitespace-nowrap cursor-pointer ${
                  filterType === t
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t === 'ALL' ? 'Tous' : t === 'GENERALISTE' ? 'Généralistes' : 'Spécialistes'}
              </button>
            ))}
          </div>

          {/* Select Speciality (only if Specialists is active) */}
          {filterType === 'SPECIALISTE' && (
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 animate-fade-in">
              <Bookmark size={16} className="text-slate-400 shrink-0" />
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="w-full bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Toutes spécialités</option>
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
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Domaine</TableHead>
                <TableHead>Patients Suivis</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedecins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-slate-500 font-body">
                    Aucun médecin trouvé avec ces critères.
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
                      <Badge variant={m.type === 'GENERALISTE' ? 'neutral' : 'warning'}>
                        {m.type === 'GENERALISTE' ? 'Généraliste' : 'Spécialiste'}
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
                      <Button
                        onClick={() => handleDelete(m.id)}
                        variant="ghost"
                        size="sm"
                        className="p-1.5 h-8 w-8 text-danger hover:bg-danger/10"
                      >
                        <Trash2 size={15} />
                      </Button>
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
        title="Enregistrement professionnel de santé"
        description="Le mot de passe généré sera envoyé par email au praticien via le backend."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom complet du médecin"
            placeholder="Ex: Dr. Célestin Etoa"
            error={errors.nom?.message}
            {...register('nom')}
          />

          <Input
            label="Adresse email professionnelle"
            type="email"
            placeholder="medecin@csi.cm"
            leftIcon={<Mail size={16} />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Numéro de téléphone"
            placeholder="+237 6xx xx xx xx"
            error={errors.numTelephone?.message}
            {...register('numTelephone')}
          />

          <div className="form-group">
            <label className="form-label-inline">Type de praticien</label>
            <select
              className="dashboard-input"
              {...register('type')}
            >
              <option value="GENERALISTE">Médecin Généraliste</option>
              <option value="SPECIALISTE">Médecin Spécialiste</option>
            </select>
          </div>

          {watchType === 'SPECIALISTE' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
            >
              <Input
                label="Domaine de spécialisation"
                placeholder="Ex: Cardiologie, Pédiatrie, Dermatologie"
                error={errors.domaineSpecialisation?.message}
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-850">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsModalOpen(false);
                reset();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              Enregistrer le médecin
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
