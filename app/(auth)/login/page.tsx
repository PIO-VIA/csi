'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email({ message: 'Adresse email invalide' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect them immediately based on their role
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'ASSURE') router.push('/assure');
      else if (user.role === 'GENERALISTE' || user.role === 'SPECIALISTE') router.push('/medecin');
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
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
        // Redirect logic will run via the useEffect above, but let's do it here too just in case
        const storedUser = localStorage.getItem('csi_session');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u.role === 'ADMIN') router.push('/admin');
          else if (u.role === 'ASSURE') router.push('/assure');
          else if (u.role === 'GENERALISTE' || u.role === 'SPECIALISTE') router.push('/medecin');
        }
      } else {
        setErrorMsg('Email ou mot de passe incorrect. Pour tester, utilisez: admin@csi.cm, jean.fosso@gmail.com, etoa@csi.cm ou ngo@csi.cm');
      }
    } catch (e) {
      setErrorMsg('Une erreur est survenue lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-mesh flex items-stretch font-body text-slate-100 selection:bg-primary-500 selection:text-white">
      {/* Left Column (Decorative, Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-950 flex-col justify-between p-12 relative overflow-hidden border-r border-primary-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 z-10">
          <Shield className="h-8 w-8 text-accent-400 fill-accent-500/10" />
          <span className="font-display font-extrabold text-xl tracking-tight text-white">
            CSI <span className="text-primary-400 font-normal">Sécurité Sociale</span>
          </span>
        </Link>

        {/* Central Graphic (Floating mockup dashboard elements) */}
        <div className="flex flex-col items-center justify-center gap-8 py-20 z-10">
          <div className="w-80 glass-card rounded-2xl p-5 shadow-2xl border border-white/5 space-y-4 animate-float">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-success" />
              <div className="h-2 w-24 rounded bg-slate-700" />
            </div>
            <div className="h-3 w-48 rounded bg-slate-700" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="h-12 rounded bg-slate-800/80 border border-slate-700/40 p-2 flex flex-col gap-1.5 justify-center">
                <div className="h-1.5 w-10 rounded bg-slate-600" />
                <div className="h-2 w-16 rounded bg-primary-500" />
              </div>
              <div className="h-12 rounded bg-slate-800/80 border border-slate-700/40 p-2 flex flex-col gap-1.5 justify-center">
                <div className="h-1.5 w-10 rounded bg-slate-600" />
                <div className="h-2 w-16 rounded bg-accent-400" />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col text-center max-w-md gap-3">
            <p className="font-display font-bold text-lg text-white italic">
              &quot;Votre santé mérite le meilleur suivi.&quot;
            </p>
            <p className="text-xs text-slate-400">
              Plateforme nationale de coordination et de prise en charge des frais médicaux.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-slate-500 z-10 flex items-center justify-between">
          <span>ENSPY Yaoundé — Projet Académique</span>
          <span>© 2025 CSI</span>
        </div>
      </div>

      {/* Right Column (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="w-full max-w-md flex flex-col gap-8"
        >
          {/* Back link */}
          <Link href="/" className="flex items-center gap-2 text-xs font-display text-slate-400 hover:text-white transition w-fit group">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition" />
            <span>Retour à l&apos;accueil</span>
          </Link>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <h1 className="font-display font-bold text-2xl text-white tracking-tight">
              Connexion
            </h1>
            <p className="font-body text-xs text-slate-400">
              Accédez à votre espace personnel sécurisé
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <Input
              label="Adresse email"
              type="email"
              placeholder="vous@exemple.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 rounded-md text-slate-400 hover:text-white transition focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="absolute right-0 top-0">
                <a href="#" className="text-[10px] font-display font-semibold text-accent-400 hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-danger/10 border border-danger/20 text-danger rounded-xl text-xs font-body leading-normal">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 font-semibold text-sm"
              isLoading={isLoading}
            >
              Se connecter
            </Button>
          </form>

          {/* Separator */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-slate-800" />
            <span className="relative px-3 bg-slate-900 text-[10px] font-display font-medium uppercase tracking-wider text-slate-500">
              ou
            </span>
          </div>

          {/* Register Link */}
          <div className="text-center text-xs font-body text-slate-400">
            Pas encore inscrit ?{' '}
            <Link href="/register" className="font-display font-semibold text-accent-400 hover:underline">
              Créer un compte
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
