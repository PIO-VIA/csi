'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
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

function redirectByRole(router: ReturnType<typeof useRouter>, role: string) {
  if (role === 'ADMIN') router.push('/admin');
  else if (role === 'GENERALISTE' || role === 'SPECIALISTE') router.push('/medecin');
}

export default function LoginPage() {
  const { t } = useTranslation();
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
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const success = await login(data.email, data.password);
      if (success) {
        const storedUser = localStorage.getItem('csi_session');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          redirectByRole(router, u.role);
        }
      } else {
        setErrorMsg(t('auth.error_credentials'));
      }
    } catch {
      setErrorMsg(t('common.error'));
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
                {t('landing.title')}
              </p>
              <p className="text-xs text-primary-100/80">{t('landing.republic_of_cameroon')}</p>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <h2 className="font-display font-extrabold text-3xl xl:text-4xl text-white leading-tight tracking-tight">
                {t('landing.hero_title')}
              </h2>
              <p className="mt-4 text-sm text-primary-100/90 leading-relaxed">
                {t('landing.tagline')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Heart, label: t('landing.health_coverage'), value: '100%' },
                { icon: Activity, label: t('dashboard.stats.consultations'), value: '12K+' },
                { icon: Users, label: t('landing.metrics.assures'), value: '8 500' },
                { icon: CheckCircle2, label: t('landing.metrics.reimbursements'), value: '98%' },
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
            {t('common.academic_project')}
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
              CSI <span className="text-primary-600 font-normal">{t('landing.security_sociale')}</span>
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              {t('nav.login')}
            </h1>
            <p className="text-sm text-slate-500">
              {t('auth.login_subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t('auth.email_label')}
              type="text"
              placeholder="vous@exemple.com"
              leftIcon={<Mail size={16} />}
              error={errors.email?.message ? String(errors.email.message) : undefined}
              {...register('email')}
            />

            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-display font-semibold text-slate-700">
                  {t('auth.password_label')}
                </span>
                <a
                  href="#"
                  className="text-[11px] font-display font-semibold text-primary-600 hover:underline"
                >
                  {t('auth.forgot_password')}
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
                error={errors.password?.message ? String(errors.password.message) : undefined}
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
              {t('nav.login')}
            </Button>
          </form>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed">
            {t('auth.medecin_hint')}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
