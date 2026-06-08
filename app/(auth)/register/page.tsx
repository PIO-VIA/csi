'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Stethoscope,
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card, { CardBody } from '@/components/ui/Card';

const registerSchema = z.object({
  nom: z.string().min(3, { message: 'Le nom doit faire au moins 3 caractères' }),
  email: z.string().email({ message: 'Adresse email invalide' }),
  dateNaissance: z.string().min(1, { message: 'La date de naissance est requise' }),
  sexe: z.string().min(1, { message: 'Veuillez sélectionner le sexe' }),
  phoneIndicator: z.string().default('+237'),
  phone: z.string().min(6, { message: 'Numéro de téléphone invalide' }),
  password: z.string().min(6, { message: 'Le mot de passe doit faire au moins 6 caractères' }),
  confirmPassword: z.string().min(6, { message: 'La confirmation est requise' }),
  
  // Assuré only
  profession: z.string().optional(),
  statutMatrimoniale: z.string().optional(),
  groupeSanguin: z.string().optional(),

  // Médecins common
  matricule: z.string().optional(),
  // Spécialiste only
  domaineSpecialisation: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const COUNTRIES = [
  { flag: '🇨🇲', code: '+237', name: 'Cameroun' },
  { flag: '🇫🇷', code: '+33', name: 'France' },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria' },
  { flag: '🇨🇦', code: '+1', name: 'Canada' },
  { flag: '🇺🇸', code: '+1', name: 'USA' },
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerUser } = useAuth();
  
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<'ASSURE' | 'GENERALISTE' | 'SPECIALISTE'>('ASSURE');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Très faible', color: 'bg-danger' });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Read role from query param if available
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'assure') {
      setSelectedRole('ASSURE');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      phoneIndicator: '+237',
      sexe: 'Homme',
      statutMatrimoniale: 'Célibataire',
      groupeSanguin: 'O+',
    }
  });

  const watchPassword = watch('password');

  // Evaluate password strength
  useEffect(() => {
    if (!watchPassword) {
      setPasswordStrength({ score: 0, label: 'Aucun', color: 'bg-slate-800' });
      return;
    }
    let score = 0;
    if (watchPassword.length >= 6) score += 1;
    if (watchPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(watchPassword)) score += 1;
    if (/[0-9]/.test(watchPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(watchPassword)) score += 1;

    if (score <= 1) {
      setPasswordStrength({ score: 20, label: 'Faible', color: 'bg-danger' });
    } else if (score <= 3) {
      setPasswordStrength({ score: 60, label: 'Moyen', color: 'bg-warning' });
    } else {
      setPasswordStrength({ score: 100, label: 'Fort', color: 'bg-success' });
    }
  }, [watchPassword]);

  const handleNextStep = () => {
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const payload = {
        nom: data.nom,
        email: data.email,
        role: selectedRole,
        phone: `${data.phoneIndicator} ${data.phone}`,
        dateNaissance: data.dateNaissance,
        sexe: data.sexe,
        profession: data.profession,
        statutMatrimoniale: data.statutMatrimoniale,
        groupeSanguin: data.groupeSanguin,
        matricule: data.matricule,
        domaineSpecialisation: data.domaineSpecialisation,
      };

      await registerUser(payload);
      setIsSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-6 text-slate-100 font-body">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center gap-5"
        >
          <div className="h-16 w-16 bg-success/10 text-success rounded-full flex items-center justify-center mb-2 animate-bounce">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="font-display font-bold text-xl text-white tracking-tight">
            Compte créé avec succès !
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Votre inscription a été validée. Vous allez être redirigé vers la page de connexion pour accéder à votre nouvel espace personnel.
          </p>
          <div className="h-1 w-24 bg-slate-850 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-primary-500 rounded-full animate-pulse w-full" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Redirection automatique...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 font-body text-slate-100 selection:bg-primary-500 selection:text-white relative">
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition font-display text-xs">
          <Shield className="h-5 w-5 text-accent-400" />
          <span className="font-bold text-white">CSI Sécurité</span>
        </Link>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl my-16"
      >
        {/* Stepper Header */}
        <div className="flex items-center justify-between mb-10 max-w-sm mx-auto">
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-display font-semibold border ${
              step === 1 ? 'bg-primary-600 border-primary-500 text-white shadow-md' : 'bg-success/10 border-success/30 text-success'
            }`}>
              {step > 1 ? <Check size={14} /> : '1'}
            </div>
            <span className={`text-xs font-display font-semibold ${step === 1 ? 'text-white' : 'text-slate-400'}`}>Type de compte</span>
          </div>

          <div className="flex-1 h-px bg-slate-800 mx-4" />

          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-display font-semibold border ${
              step === 2 ? 'bg-primary-600 border-primary-500 text-white shadow-md' : 'border-slate-800 text-slate-500 bg-slate-900/40'
            }`}>
              2
            </div>
            <span className={`text-xs font-display font-semibold ${step === 2 ? 'text-white' : 'text-slate-500'}`}>Informations</span>
          </div>
        </div>

        {/* STEP 1: Select account type */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center max-w-md mx-auto space-y-2">
              <h1 className="font-display font-bold text-2xl text-white tracking-tight">Choisissez votre type de compte</h1>
              <p className="font-body text-xs text-slate-400">Sélectionnez le rôle qui correspond à votre profil d&apos;utilisateur</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card Assuré */}
              <div
                onClick={() => setSelectedRole('ASSURE')}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer select-none transition-all duration-300 ${
                  selectedRole === 'ASSURE'
                    ? 'border-primary-500 bg-primary-950/20 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700/60 bg-slate-900/30'
                }`}
              >
                {selectedRole === 'ASSURE' && (
                  <div className="absolute top-3 right-3 h-5 w-5 bg-primary-600 text-white rounded-full flex items-center justify-center border border-primary-500 shadow">
                    <Check size={10} className="stroke-[3]" />
                  </div>
                )}
                <div className="p-3 bg-accent-500/10 border border-accent-500/20 text-accent-400 rounded-xl w-fit">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Assuré</h3>
                  <p className="font-body text-[11px] text-slate-400 mt-1 leading-normal">Bénéficiaire de couverture santé et remboursements.</p>
                </div>
              </div>

              {/* Card Généraliste */}
              <div
                onClick={() => setSelectedRole('GENERALISTE')}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer select-none transition-all duration-300 ${
                  selectedRole === 'GENERALISTE'
                    ? 'border-primary-500 bg-primary-950/20 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700/60 bg-slate-900/30'
                }`}
              >
                {selectedRole === 'GENERALISTE' && (
                  <div className="absolute top-3 right-3 h-5 w-5 bg-primary-600 text-white rounded-full flex items-center justify-center border border-primary-500 shadow">
                    <Check size={10} className="stroke-[3]" />
                  </div>
                )}
                <div className="p-3 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl w-fit">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Généraliste</h3>
                  <p className="font-body text-[11px] text-slate-400 mt-1 leading-normal">Médecin traitant pour déclarations et prescriptions.</p>
                </div>
              </div>

              {/* Card Spécialiste */}
              <div
                onClick={() => setSelectedRole('SPECIALISTE')}
                className={`relative rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer select-none transition-all duration-300 ${
                  selectedRole === 'SPECIALISTE'
                    ? 'border-primary-500 bg-primary-950/20 shadow-lg'
                    : 'border-slate-800 hover:border-slate-700/60 bg-slate-900/30'
                }`}
              >
                {selectedRole === 'SPECIALISTE' && (
                  <div className="absolute top-3 right-3 h-5 w-5 bg-primary-600 text-white rounded-full flex items-center justify-center border border-primary-500 shadow">
                    <Check size={10} className="stroke-[3]" />
                  </div>
                )}
                <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl w-fit">
                  <Activity size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white">Spécialiste</h3>
                  <p className="font-body text-[11px] text-slate-400 mt-1 leading-normal">Praticien ciblé pour examens spécialisés sur référence.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-850">
              <Button onClick={handleNextStep} variant="primary" rightIcon={<ArrowRight size={14} />}>
                Suivant
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Fill Personal Information */}
        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-850">
              <button
                type="button"
                onClick={handlePrevStep}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/40 transition focus:outline-none"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <h2 className="font-display font-bold text-lg text-white">Informations Personnelles</h2>
                <p className="font-body text-[10px] text-slate-400">Veuillez renseigner les détails du profil {selectedRole.toLowerCase()}</p>
              </div>
            </div>

            {/* COMMON FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom complet"
                type="text"
                placeholder="Ex: Jean-Marc Fosso"
                error={errors.nom?.message}
                {...register('nom')}
              />

              <Input
                label="Adresse email"
                type="email"
                placeholder="Ex: jeanmarc.fosso@gmail.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Date de naissance"
                type="date"
                error={errors.dateNaissance?.message}
                {...register('dateNaissance')}
              />

              <div className="w-full flex flex-col gap-1.5">
                <label className="font-display font-medium text-xs text-slate-300 tracking-wide">Sexe</label>
                <select
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl font-body text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  {...register('sexe')}
                >
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                  <option value="Autre">Autre</option>
                </select>
                {errors.sexe && <p className="text-xs text-danger font-medium">{errors.sexe.message}</p>}
              </div>

              {/* Phone Field Group */}
              <div className="w-full flex flex-col gap-1.5">
                <label className="font-display font-medium text-xs text-slate-300 tracking-wide">Téléphone</label>
                <div className="flex gap-2">
                  <select
                    className="w-24 px-2 py-3 bg-slate-900 border border-slate-800 rounded-xl font-body text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    {...register('phoneIndicator')}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code + c.flag} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    placeholder="677 89 45 12"
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl font-body text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    {...register('phone')}
                  />
                </div>
                {errors.phone && <p className="text-xs text-danger font-medium">{errors.phone.message}</p>}
              </div>
            </div>

            {/* ROLE-SPECIFIC FIELDS */}

            {/* Assuré additional fields */}
            {selectedRole === 'ASSURE' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-850"
              >
                <Input
                  label="Profession"
                  type="text"
                  placeholder="Ex: Enseignant, Étudiant"
                  error={errors.profession?.message}
                  {...register('profession')}
                />

                <div className="w-full flex flex-col gap-1.5">
                  <label className="font-display font-medium text-xs text-slate-300 tracking-wide">Statut matrimonial</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl font-body text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    {...register('statutMatrimoniale')}
                  >
                    <option value="Célibataire">Célibataire</option>
                    <option value="Marié">Marié(e)</option>
                    <option value="Divorcé">Divorcé(e)</option>
                    <option value="Veuf">Veuf/Veuve</option>
                  </select>
                </div>

                <div className="w-full flex flex-col gap-1.5">
                  <label className="font-display font-medium text-xs text-slate-300 tracking-wide">Groupe sanguin</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl font-body text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
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
              </motion.div>
            )}

            {/* Doctors (Généraliste / Spécialiste) additional fields */}
            {(selectedRole === 'GENERALISTE' || selectedRole === 'SPECIALISTE') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-850"
              >
                <Input
                  label="Matricule médecin"
                  type="text"
                  placeholder="Ex: MED-GEN-501"
                  error={errors.matricule?.message}
                  {...register('matricule')}
                />

                {selectedRole === 'SPECIALISTE' && (
                  <Input
                    label="Domaine de spécialisation"
                    type="text"
                    placeholder="Ex: Cardiologie, Pédiatrie"
                    error={errors.domaineSpecialisation?.message}
                    {...register('domaineSpecialisation')}
                  />
                )}
              </motion.div>
            )}

            {/* PASSWORDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-850">
              <div className="space-y-1.5">
                <Input
                  label="Mot de passe"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                />
                {watchPassword && (
                  <div className="flex flex-col gap-1 px-1">
                    <div className="flex justify-between items-center text-[9px] font-display font-medium text-slate-400">
                      <span>Force du mot de passe</span>
                      <span className={passwordStrength.label === 'Fort' ? 'text-success' : passwordStrength.label === 'Moyen' ? 'text-warning' : 'text-danger'}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Input
                label="Confirmer le mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-850">
              <Button type="button" onClick={handlePrevStep} variant="ghost">
                Retour
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading}>
                Créer mon compte
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
