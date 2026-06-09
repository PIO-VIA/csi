'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Heart,
  Activity,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@csi.cm' },
  { role: 'Médecin généraliste', email: 'etoa@csi.cm' },
  { role: 'Médecin spécialiste', email: 'ngo@csi.cm' },
];

function redirectByRole(router: ReturnType<typeof useRouter>, role: string) {
  if (role === 'ADMIN') router.push('/admin');
  else if (role === 'GENERALISTE' || role === 'SPECIALISTE') router.push('/medecin');
}

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) redirectByRole(router, user.role);
  }, [user, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const success = await login(data.email);
      if (success) {
        const storedUser = localStorage.getItem('csi_session');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          redirectByRole(router, u.role);
        }
      } else {
        setErrorMsg(
          'Accès refusé. Seuls les administrateurs et les médecins peuvent se connecter. Vérifiez votre email ou utilisez un compte démo.'
        );
      }
    } catch {
      setErrorMsg('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="min-h-screen flex font-body text-slate-800 selection:bg-primary-500 selection:text-white">
      {/* Panneau visuel — desktop */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80"
          alt="Professionnels de santé"
          fill
          priority
          className="object-cover"
          sizes="52vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/90 via-primary-900/75 to-accent-600/40" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display font-extrabold text-xl text-white tracking-tight">
                CSI Sécurité Sociale
              </p>
              <p className="text-xs text-primary-100/80">République du Cameroun</p>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <h2 className="font-display font-extrabold text-3xl xl:text-4xl text-white leading-tight tracking-tight">
                Votre santé, notre priorité nationale
              </h2>
              <p className="mt-4 text-sm text-primary-100/90 leading-relaxed">
                Plateforme de coordination des soins, remboursements et suivi médical
                pour assurés, praticiens et administrateurs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Heart, label: 'Couverture santé', value: '100%' },
                { icon: Activity, label: 'Consultations', value: '12K+' },
                { icon: Users, label: 'Assurés actifs', value: '8 500' },
                { icon: CheckCircle2, label: 'Remboursements', value: '98%' },
              ].map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4"
                >
                  <Icon className="h-5 w-5 text-accent-400 mb-2" />
                  <p className="font-display font-bold text-lg text-white">{value}</p>
                  <p className="text-[11px] text-primary-100/70">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-primary-200/60">
            ENSPY Yaoundé — Projet Académique © 2026 CSI
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-slate-50 via-white to-primary-50/30">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="w-full max-w-md space-y-8"
        >
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="font-display font-extrabold text-lg text-slate-900">
              CSI <span className="text-primary-600 font-normal">Sécurité Sociale</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Connexion
            </h1>
            <p className="text-sm text-slate-500">
              Accédez à votre espace professionnel sécurisé
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@exemple.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-display font-semibold text-slate-700">
                  Mot de passe
                </span>
                <a
                  href="#"
                  className="text-[11px] font-display font-semibold text-primary-600 hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs leading-relaxed">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 font-semibold text-sm btn-primary-shadow"
              isLoading={isLoading}
            >
              Se connecter
            </Button>
          </form>

          {/* Comptes démo */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-display font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Comptes de démonstration
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(({ role, email }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => {
                    setValue('email', email);
                    setValue('password', 'demo');
                  }}
                  className="text-left rounded-xl border border-slate-100 bg-slate-50 hover:bg-primary-50 hover:border-primary-200 px-3 py-2.5 transition group"
                >
                  <span className="block text-[10px] font-display font-bold text-primary-600 uppercase tracking-wide">
                    {role}
                  </span>
                  <span className="block text-[11px] text-slate-500 truncate group-hover:text-slate-700">
                    {email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
