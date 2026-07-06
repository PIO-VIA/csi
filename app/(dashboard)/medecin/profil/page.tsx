'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Shield,
  KeyRound,
  Globe,
  Camera,
  User,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getApiErrorMessage, getMedecinById, uploadMedecinPhoto, updateMedecin, getGeneralistes } from '@/lib/api';
import { Medecin } from '@/types';
import { useToast } from '@/components/ui/Toast';
import Loader from '@/components/ui/Loader';

const changePasswordSchema = z.object({
  ancienMotDePasse: z.string().min(1, { message: 'L\'ancien mot de passe est requis' }),
  nouveauMotDePasse: z.string().min(6, { message: 'Le nouveau mot de passe doit faire au moins 6 caractères' }),
  confirmerMotDePasse: z.string().min(1, { message: 'Veuillez confirmer le mot de passe' }),
}).refine((data) => data.nouveauMotDePasse === data.confirmerMotDePasse, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirmerMotDePasse'],
});

const personalInfoSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  indicatifPays: z.string().min(1, { message: "L'indicatif pays est requis" }),
  numTelephone: z.string().min(6, { message: 'Le numéro de téléphone est requis' }),
  matricule: z.string().min(1, { message: 'Le matricule est requis' }),
  sexe: z.string().optional(),
  dateNaissance: z.string().optional(),
  domaineSpecialisation: z.string().optional(),
  estAssure: z.boolean().optional(),
  medecinTraitantId: z.string().optional(),
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

const initialsFromName = (name: string) => {
  return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'D';
};

export default function MedecinProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, changePassword, updateUserPhotoUrl, updateUserInfo } = useAuth();
  const { success, error } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [medecinInfo, setMedecinInfo] = useState<Medecin | null>(null);
  const [generalistes, setGeneralistes] = useState<Medecin[]>([]);

  useEffect(() => {
    const loadGeneralistes = async () => {
      try {
        const res = await getGeneralistes();
        setGeneralistes(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadGeneralistes();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadDoctorInfo = async () => {
      try {
        const res = await getMedecinById(user.id);
        setMedecinInfo(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadDoctorInfo();
  }, [user]);

  // Form for password change
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Form for personal info
  const {
    register: registerInfo,
    handleSubmit: handleSubmitInfo,
    reset: resetInfo,
    watch: watchInfo,
    formState: { errors: infoErrors },
  } = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
  });

  const watchEstAssureInfo = watchInfo('estAssure');

  useEffect(() => {
    if (medecinInfo) {
      resetInfo({
        nom: medecinInfo.nom,
        email: medecinInfo.email,
        indicatifPays: medecinInfo.indicatifPays ?? '+237',
        numTelephone: medecinInfo.numTelephone,
        matricule: medecinInfo.matricule ?? '',
        sexe: medecinInfo.sexe ?? '',
        dateNaissance: medecinInfo.dateNaissance ?? '',
        domaineSpecialisation: medecinInfo.domaineSpecialisation ?? '',
        estAssure: medecinInfo.estAssure ?? false,
        medecinTraitantId: medecinInfo.medecinTraitantId ? String(medecinInfo.medecinTraitantId) : '',
      });
    }
  }, [medecinInfo, resetInfo]);

  const onSubmit = async (data: ChangePasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await changePassword(data.ancienMotDePasse, data.nouveauMotDePasse);
      success(t('profile.password_success') || 'Mot de passe changé avec succès !');
      reset();
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInfoSubmit = async (data: PersonalInfoFormValues) => {
    if (!user) return;
    setIsUpdatingInfo(true);
    try {
      const res = await updateMedecin(user.id, {
        nom: data.nom,
        email: data.email,
        indicatifPays: data.indicatifPays,
        numTelephone: data.numTelephone,
        matricule: data.matricule,
        sexe: data.sexe || undefined,
        dateNaissance: data.dateNaissance || undefined,
        domaineSpecialisation: data.domaineSpecialisation || undefined,
        type: medecinInfo?.type,
        estAssure: data.estAssure,
        medecinTraitantId: data.estAssure ? (data.medecinTraitantId ? Number(data.medecinTraitantId) : -1) : -1,
      });
      success('Informations personnelles mises à jour avec succès.');
      setMedecinInfo(res.data);
      updateUserInfo({
        nom: res.data.nom,
        email: res.data.email,
        avatarInitiales: initialsFromName(res.data.nom),
      });
    } catch (e) {
      error(getApiErrorMessage(e));
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const res = await uploadMedecinPhoto(user.id, file);
      if (res.photoUrl) {
        updateUserPhotoUrl(res.photoUrl);
        setMedecinInfo((prev) => (prev ? { ...prev, photoUrl: res.photoUrl } : null));
        success('Photo de profil mise à jour.');
      } else {
        error('La mise à jour de la photo a échoué.');
      }
    } catch (err) {
      error(getApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('profile.title') || 'Paramètres du Profil'}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('profile.subtitle') || 'Gérez vos informations personnelles et vos préférences de sécurité'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile Card Summary */}
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardBody className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="relative group">
                {medecinInfo?.photoUrl ? (
                  <img
                    src={medecinInfo.photoUrl}
                    alt={user.nom}
                    className="h-20 w-20 rounded-2xl object-cover shadow-xl shadow-primary-500/10 border border-slate-200"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-xl shadow-primary-500/10">
                    {user.avatarInitiales || user.nom?.charAt(0) || 'D'}
                  </div>
                )}
                <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition rounded-2xl cursor-pointer duration-200">
                  <Camera size={18} className="mb-0.5" />
                  <span className="text-[9px] font-semibold font-display">Modifier</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={isUploading}
                  />
                </label>
                {isUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
                    <Loader size="sm" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-slate-900">Dr. {user.nom}</h3>
                <p className="text-xs text-slate-500 font-body">{user.email}</p>
                {medecinInfo?.matricule && (
                  <p className="text-xs text-primary-600 font-mono font-semibold pt-1">{medecinInfo.matricule}</p>
                )}
                <div className="pt-2 flex flex-wrap gap-1.5 justify-center">
                  <Badge variant="neutral" className="flex items-center gap-1">
                    <Shield size={12} />
                    <span>{user.role}</span>
                  </Badge>
                  {medecinInfo?.domaineSpecialisation && (
                    <Badge variant="warning">{medecinInfo.domaineSpecialisation}</Badge>
                  )}
                  {medecinInfo?.estAssure && (
                    <Badge variant="success">Assuré</Badge>
                  )}
                </div>
              </div>

              {medecinInfo && (medecinInfo.dateNaissance || medecinInfo.sexe || medecinInfo.numTelephone) && (
                <div className="w-full border-t border-slate-100 pt-4 mt-4 space-y-3 text-xs font-body text-left">
                  {medecinInfo.dateNaissance && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date de naissance</span>
                      <span className="text-slate-700 font-medium">
                        {new Date(medecinInfo.dateNaissance).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                  {medecinInfo.sexe && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Genre</span>
                      <span className="text-slate-700 font-medium">
                        {medecinInfo.sexe === 'Homme' ? 'Masculin' : medecinInfo.sexe === 'Femme' ? 'Féminin' : medecinInfo.sexe}
                      </span>
                    </div>
                  )}
                  {medecinInfo.numTelephone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Téléphone</span>
                      <span className="text-slate-700 font-medium">
                        {medecinInfo.indicatifPays ? `${medecinInfo.indicatifPays} ` : ''}{medecinInfo.numTelephone}
                      </span>
                    </div>
                  )}
                  {medecinInfo.estAssure && medecinInfo.medecinTraitant && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Médecin traitant</span>
                      <span className="text-slate-700 font-medium truncate max-w-[150px]">
                        Dr. {medecinInfo.medecinTraitant.nom}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Preferences Settings */}
          <Card>
            <CardHeader className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Globe size={16} className="text-primary-600" />
              <span className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider">
                {t('profile.preferences') || 'Préférences'}
              </span>
            </CardHeader>
            <CardBody className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-display font-semibold text-slate-700 block">
                  {t('profile.language') || 'Langue de l\'interface'}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => changeLanguage('fr')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      i18n.language.startsWith('fr')
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Français
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      i18n.language.startsWith('en')
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Edit Panels */}
        <div className="md:col-span-7 space-y-6">
          {/* Personal Info Panel */}
          <Card>
            <CardHeader className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={16} className="text-primary-600" />
              <span className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider">
                Informations personnelles
              </span>
            </CardHeader>
            <CardBody className="p-5">
              <form onSubmit={handleSubmitInfo(onInfoSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nom complet"
                    placeholder="Ex: Dr. Célestin Etoa"
                    error={infoErrors.nom?.message ? String(infoErrors.nom.message) : undefined}
                    {...registerInfo('nom')}
                  />

                  <Input
                    label="Adresse email"
                    type="email"
                    placeholder="Ex: email@domaine.com"
                    error={infoErrors.email?.message ? String(infoErrors.email.message) : undefined}
                    {...registerInfo('email')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <Input
                        label="Indicatif"
                        placeholder="+237"
                        error={infoErrors.indicatifPays?.message ? String(infoErrors.indicatifPays.message) : undefined}
                        {...registerInfo('indicatifPays')}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="N° Téléphone"
                        placeholder="699000000"
                        error={infoErrors.numTelephone?.message ? String(infoErrors.numTelephone.message) : undefined}
                        {...registerInfo('numTelephone')}
                      />
                    </div>
                  </div>

                  <Input
                    label="Matricule professionnel"
                    placeholder="Ex: MED-12345"
                    error={infoErrors.matricule?.message ? String(infoErrors.matricule.message) : undefined}
                    {...registerInfo('matricule')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-display font-semibold text-slate-700 block mb-1">
                      Genre
                    </label>
                    <select
                      {...registerInfo('sexe')}
                      className="w-full h-[38px] px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-primary-500 transition duration-150"
                    >
                      <option value="">Sélectionner</option>
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>

                  <Input
                    label="Date de naissance"
                    type="date"
                    error={infoErrors.dateNaissance?.message ? String(infoErrors.dateNaissance.message) : undefined}
                    {...registerInfo('dateNaissance')}
                  />

                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="estAssure"
                      {...registerInfo('estAssure')}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="estAssure" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Je suis également assuré de l'organisme (Rendre assuré)
                    </label>
                  </div>

                  {watchEstAssureInfo && (
                    <div className="col-span-full">
                      <label className="text-xs font-display font-semibold text-slate-700 block mb-1">
                        Médecin traitant (généraliste)
                      </label>
                      <select
                        {...registerInfo('medecinTraitantId')}
                        className="w-full h-[38px] px-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:border-primary-500 transition duration-150"
                      >
                        <option value="">-- Sélectionnez un médecin traitant --</option>
                        {generalistes
                          .filter((g) => g.id !== user.id)
                          .map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.nom}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {medecinInfo?.type === 'SPECIALISTE' && (
                    <Input
                      label="Spécialisation"
                      placeholder="Ex: Cardiologie"
                      error={infoErrors.domaineSpecialisation?.message ? String(infoErrors.domaineSpecialisation.message) : undefined}
                      {...registerInfo('domaineSpecialisation')}
                    />
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isUpdatingInfo}
                    className="w-full sm:w-auto text-xs"
                  >
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Change Password Panel */}
          <Card>
            <CardHeader className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound size={16} className="text-primary-600" />
              <span className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider">
                {t('profile.security') || 'Sécurité & Mot de passe'}
              </span>
            </CardHeader>
            <CardBody className="p-5">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label={t('profile.current_password') || 'Ancien mot de passe'}
                  type="password"
                  placeholder="••••••••"
                  error={errors.ancienMotDePasse?.message ? String(errors.ancienMotDePasse.message) : undefined}
                  {...register('ancienMotDePasse')}
                />

                <Input
                  label={t('profile.new_password') || 'Nouveau mot de passe'}
                  type="password"
                  placeholder="••••••••"
                  error={errors.nouveauMotDePasse?.message ? String(errors.nouveauMotDePasse.message) : undefined}
                  {...register('nouveauMotDePasse')}
                />

                <Input
                  label={t('profile.confirm_password') || 'Confirmer le nouveau mot de passe'}
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmerMotDePasse?.message ? String(errors.confirmerMotDePasse.message) : undefined}
                  {...register('confirmerMotDePasse')}
                />

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="w-full sm:w-auto text-xs"
                  >
                    {t('profile.update_btn') || 'Mettre à jour le mot de passe'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
