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
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import Card, { CardHeader, CardBody } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getApiErrorMessage, getMedecins } from '@/lib/api';
import { Medecin } from '@/types';
import { useToast } from '@/components/ui/Toast';

const changePasswordSchema = z.object({
  ancienMotDePasse: z.string().min(1, { message: 'L\'ancien mot de passe est requis' }),
  nouveauMotDePasse: z.string().min(6, { message: 'Le nouveau mot de passe doit faire au moins 6 caractères' }),
  confirmerMotDePasse: z.string().min(1, { message: 'Veuillez confirmer le mot de passe' }),
}).refine((data) => data.nouveauMotDePasse === data.confirmerMotDePasse, {
  message: 'Les nouveaux mots de passe ne correspondent pas',
  path: ['confirmerMotDePasse'],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export default function MedecinProfilePage() {
  const { t, i18n } = useTranslation();
  const { user, changePassword } = useAuth();
  const { success, error } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medecinInfo, setMedecinInfo] = useState<Medecin | null>(null);

  useEffect(() => {
    if (!user) return;
    const loadDoctorInfo = async () => {
      try {
        const res = await getMedecins();
        const found = res.data.find((m) => m.id === user.id);
        if (found) setMedecinInfo(found);
      } catch (e) {
        console.error(e);
      }
    };
    loadDoctorInfo();
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
  });

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
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-white flex items-center justify-center font-display font-extrabold text-2xl shadow-xl shadow-primary-500/10">
                {user.avatarInitiales || user.nom?.charAt(0) || 'D'}
              </div>
              
              <div className="space-y-1">
                <h3 className="font-display font-bold text-lg text-slate-900">Dr. {user.nom}</h3>
                <p className="text-xs text-slate-500 font-body">{user.email}</p>
                {medecinInfo && (
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
                </div>
              </div>
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

        {/* Change Password Panel */}
        <div className="md:col-span-7">
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
