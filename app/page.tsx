'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowRight,
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  Activity,
  Pill,
  Menu,
  X,
  CheckCircle,
  Lock,
  Heart,
  MapPin,
  Mail,
  Phone,
  User,
  ExternalLink,
  Globe
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import Card, { CardBody } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatFCFA } from '@/lib/utils';

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Monitor scroll to trigger navbar background change
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-mesh text-slate-100 flex flex-col font-body selection:bg-primary-500 selection:text-white overflow-x-hidden">
      
      {/* 3.1 NAVBAR */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Shield className="h-7 w-7 text-accent-400 fill-accent-500/10 group-hover:scale-105 duration-200" />
            <span className="font-display font-extrabold text-xl tracking-tight text-white">
              CSI <span className="text-primary-400 font-normal">Sécurité Sociale</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-300 hover:text-white transition">
              {i18n.language?.startsWith('en') ? 'Features' : 'Fonctionnalités'}
            </a>
            <a href="#acteurs" className="text-sm font-medium text-slate-300 hover:text-white transition">
              {i18n.language?.startsWith('en') ? 'Actors' : 'Acteurs'}
            </a>
            <a href="#contact" className="text-sm font-medium text-slate-300 hover:text-white transition">
              Contact
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher Toggle */}
            <button
              onClick={() => {
                const nextLang = i18n.language?.startsWith('fr') ? 'en' : 'fr';
                i18n.changeLanguage(nextLang);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-300 hover:text-white hover:border-slate-700 transition flex items-center gap-1.5 cursor-pointer mr-1"
            >
              <Globe size={11} className="text-slate-400" />
              <span>{i18n.language?.startsWith('fr') ? 'FR' : 'EN'}</span>
            </button>

            <Link href="/login">
              <Button variant="outline" size="sm">
                {t('nav.login')}
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />}>
                {t('nav.register')}
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/40 transition"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-850 px-6 py-8 flex flex-col gap-6 shadow-2xl"
          >
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white transition"
              >
                Fonctionnalités
              </a>
              <a
                href="#acteurs"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white transition"
              >
                Acteurs
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-300 hover:text-white transition"
              >
                Contact
              </a>
            </nav>
            <div className="h-px bg-slate-800" />
            <div className="flex flex-col gap-3">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" className="w-full">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="primary" className="w-full">
                  S&apos;inscrire
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* 3.2 HERO SECTION */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Hero Left Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="lg:col-span-7 flex flex-col gap-6 z-10"
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-display font-semibold bg-primary-500/10 text-accent-400 border border-primary-500/20 animate-pulse">
                🏥 {t('landing.subtitle')}
              </span>
            </div>
            
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight">
              {i18n.language?.startsWith('en') ? (
                <>
                  Your health, <br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">protected</span> and{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-accent-400 bg-clip-text text-transparent">reimbursed</span>
                </>
              ) : (
                <>
                  Votre santé, <br />
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">protégée</span> et{' '}
                  <span className="bg-gradient-to-r from-cyan-400 to-accent-400 bg-clip-text text-transparent">remboursée</span>
                </>
              )}
            </h1>

            <p className="font-body text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              {t('landing.tagline')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight size={16} />}>
                  {t('nav.register')}
                </Button>
              </Link>
              <a href="#features">
                <Button variant="ghost" size="lg" className="w-full sm:w-auto text-slate-300">
                  {i18n.language?.startsWith('en') ? 'Learn more ↓' : 'En savoir plus ↓'}
                </Button>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-800/80 mt-4 max-w-lg">
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl md:text-3xl text-white">12K+</span>
                <span className="text-xs font-body text-slate-400">{t('landing.metrics.assures')}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl md:text-3xl text-white">850</span>
                <span className="text-xs font-body text-slate-400">{i18n.language?.startsWith('en') ? 'Approved Doctors' : 'Médecins Agréés'}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-2xl md:text-3xl text-white">98%</span>
                <span className="text-xs font-body text-slate-400">Satisfaction</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Right Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center items-center relative z-10"
          >
            {/* Background glowing circle */}
            <div className="absolute h-72 w-72 md:h-96 md:w-96 rounded-full bg-gradient-to-tr from-primary-600/30 to-accent-600/20 blur-3xl -z-10" />

            {/* Floating Insured Card */}
            <div className="w-full max-w-sm glass-card border border-white/10 rounded-3xl p-6 shadow-2xl animate-float relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-accent-400" />
                  <span className="font-display font-bold text-sm tracking-tight text-white">CSI SANTE</span>
                </div>
                <Badge variant="success">Carte Assuré</Badge>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <div className="text-[10px] uppercase font-display font-medium text-slate-400 tracking-wider">Identifiant Assuré</div>
                  <div className="font-mono text-sm text-slate-100 font-medium">ASS-2025-0981</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-display font-medium text-slate-400 tracking-wider">Nom Complet</div>
                  <div className="font-display text-base text-white font-semibold">Jean-Marc Fosso</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase font-display font-medium text-slate-400 tracking-wider">Médecin Traitant</div>
                    <div className="font-body text-xs text-slate-200">Dr. Célestin Etoa</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-display font-medium text-slate-400 tracking-wider">Groupe Sanguin</div>
                    <div className="font-display text-xs text-white font-semibold">O+ (Positif)</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[10px] text-slate-400">
                <span>Régime Général ENSPY</span>
                <span>Exp: Valide</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3.3 FEATURES SECTION */}
      <section id="features" className="py-24 bg-slate-900/90 relative border-t border-b border-slate-800/80 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-display font-semibold text-primary-400 tracking-widest uppercase">
              Services Intégrés
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Tout ce dont vous avez besoin
            </h2>
            <p className="font-body text-sm text-slate-400 leading-relaxed">
              Une gamme d&apos;outils performants pour digitaliser le parcours de soin national de bout en bout.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div variants={fadeUp}>
              <Card className="h-full hover:-translate-y-1 hover:border-primary-500/40 duration-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="p-3 bg-primary-800/40 border border-primary-500/20 text-accent-400 rounded-xl w-fit">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Inscription sécurisée</h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Créez votre compte assuré de manière ultra-sécurisée et accédez instantanément à votre dossier médical numérique.
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeUp}>
              <Card className="h-full hover:-translate-y-1 hover:border-primary-500/40 duration-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="p-3 bg-primary-800/40 border border-primary-500/20 text-accent-400 rounded-xl w-fit">
                    <Stethoscope size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Choisissez votre médecin</h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Sélectionnez votre généraliste traitant agrée directement sur la plateforme pour un suivi médical personnalisé et coordonné.
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeUp}>
              <Card className="h-full hover:-translate-y-1 hover:border-primary-500/40 duration-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="p-3 bg-primary-800/40 border border-primary-500/20 text-accent-400 rounded-xl w-fit">
                    <Calendar size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Suivi des consultations</h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Consultez l&apos;historique complet de vos visites chez le médecin, les motifs de consultation et les diagnostics posés.
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeUp}>
              <Card className="h-full hover:-translate-y-1 hover:border-primary-500/40 duration-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="p-3 bg-primary-800/40 border border-primary-500/20 text-accent-400 rounded-xl w-fit">
                    <Pill size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Prescriptions en ligne</h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Recevez des ordonnances numérisées et sécurisées, éliminant les risques de perte et facilitant le retrait en pharmacie.
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={fadeUp}>
              <Card className="h-full hover:-translate-y-1 hover:border-primary-500/40 duration-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="p-3 bg-primary-800/40 border border-primary-500/20 text-accent-400 rounded-xl w-fit">
                    <CreditCard size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Remboursements rapides</h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Bénéficiez d&apos;un remboursement automatique selon votre parcours de soin : 100% chez le généraliste, 80% chez le spécialiste.
                  </p>
                </CardBody>
              </Card>
            </motion.div>

            {/* Feature 6 */}
            <motion.div variants={fadeUp}>
              <Card className="h-full hover:-translate-y-1 hover:border-primary-500/40 duration-300">
                <CardBody className="flex flex-col gap-4">
                  <div className="p-3 bg-primary-800/40 border border-primary-500/20 text-accent-400 rounded-xl w-fit">
                    <Activity size={20} />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white">Tableau de bord complet</h3>
                  <p className="font-body text-xs text-slate-400 leading-relaxed">
                    Profitez d&apos;une vue unifiée claire sur vos dépenses médicales, vos prises en charge et l&apos;évolution de votre couverture santé.
                  </p>
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* 3.4 ACTEURS SECTION */}
      <section id="acteurs" className="py-24 bg-primary-950 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <span className="text-xs font-display font-semibold text-accent-400 tracking-widest uppercase">
              Profils Utilisateurs
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Une plateforme pour chaque acteur
            </h2>
            <p className="font-body text-sm text-slate-400 leading-relaxed">
              Des interfaces dédiées et ergonomiques adaptées aux besoins de chacun des professionnels et bénéficiaires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Acteur 1 - Assuré */}
            <Card className="hover:border-slate-700/60 duration-300 flex flex-col h-full bg-slate-900/60">
              <CardBody className="flex-1 flex flex-col gap-4">
                <div className="p-3 bg-accent-500/10 border border-accent-500/20 text-accent-400 rounded-xl w-fit">
                  <User size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Assuré</h3>
                <p className="font-body text-xs text-slate-400 leading-relaxed flex-1">
                  Inscrivez-vous, choisissez votre médecin traitant et suivez l&apos;évolution de vos remboursements de soins.
                </p>
                <div className="flex flex-wrap gap-1.5 py-2">
                  <Badge variant="neutral">Consultations</Badge>
                  <Badge variant="neutral">Prescriptions</Badge>
                  <Badge variant="neutral">Remboursements</Badge>
                </div>
                <Link href="/register?role=assure" className="w-full">
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <span>Je m&apos;inscris</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </CardBody>
            </Card>

            {/* Acteur 2 - Généraliste */}
            <Card className="hover:border-slate-700/60 duration-300 flex flex-col h-full bg-slate-900/60">
              <CardBody className="flex-1 flex flex-col gap-4">
                <div className="p-3 bg-primary-500/10 border border-primary-500/20 text-primary-400 rounded-xl w-fit">
                  <Stethoscope size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Médecin Généraliste</h3>
                <p className="font-body text-xs text-slate-400 leading-relaxed flex-1">
                  Gérez vos patients, déclarez les actes médicaux, transmettez les feuilles de soin et prescrivez des examens ou médicaments.
                </p>
                <div className="flex flex-wrap gap-1.5 py-2">
                  <Badge variant="neutral">Patients</Badge>
                  <Badge variant="neutral">Consultations</Badge>
                  <Badge variant="neutral">Prescriptions</Badge>
                </div>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <span>Accès médecin</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </CardBody>
            </Card>

            {/* Acteur 3 - Spécialiste */}
            <Card className="hover:border-slate-700/60 duration-300 flex flex-col h-full bg-slate-900/60">
              <CardBody className="flex-1 flex flex-col gap-4">
                <div className="p-3 bg-warning/10 border border-warning/20 text-warning rounded-xl w-fit">
                  <Activity size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Médecin Spécialiste</h3>
                <p className="font-body text-xs text-slate-400 leading-relaxed flex-1">
                  Accueillez les patients référés par les généralistes, enregistrez les consultations spécialisées et suivez les prescriptions.
                </p>
                <div className="flex flex-wrap gap-1.5 py-2">
                  <Badge variant="neutral">Références</Badge>
                  <Badge variant="neutral">Actes Spécifiques</Badge>
                </div>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <span>Accès médecin</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </CardBody>
            </Card>

            {/* Acteur 4 - Admin */}
            <Card className="hover:border-slate-700/60 duration-300 flex flex-col h-full bg-slate-900/60">
              <CardBody className="flex-1 flex flex-col gap-4">
                <div className="p-3 bg-success/10 border border-success/20 text-success rounded-xl w-fit">
                  <Shield size={20} />
                </div>
                <h3 className="font-display font-bold text-lg text-white">Administrateur</h3>
                <p className="font-body text-xs text-slate-400 leading-relaxed flex-1">
                  Supervisez l&apos;ensemble du système national. Validez les profils des médecins, gérez les assurés, et autorisez les virements de remboursement.
                </p>
                <div className="flex flex-wrap gap-1.5 py-2">
                  <Badge variant="neutral">Statistiques</Badge>
                  <Badge variant="neutral">Paiements</Badge>
                  <Badge variant="neutral">Audit</Badge>
                </div>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full justify-between" size="sm">
                    <span>Accès admin</span>
                    <ArrowRight size={14} />
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* 3.5 CTA FINAL */}
      <section className="py-24 px-6 relative overflow-hidden bg-gradient-to-r from-primary-800 to-primary-900">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col gap-6">
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
            Prêt à rejoindre la plateforme ?
          </h2>
          <p className="font-body text-base text-primary-100 max-w-xl mx-auto">
            Rejoignez dès aujourd&apos;hui des milliers d&apos;assurés qui prennent le contrôle de leur couverture santé numérique en direct.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="primary" size="lg" className="bg-white text-primary-900 hover:bg-slate-100 border-none btn-primary-shadow">
                Créer mon compte gratuitement
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3.6 FOOTER */}
      <footer id="contact" className="bg-slate-900 border-t border-slate-800/80 pt-16 pb-8 px-6 text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Logo & Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-white">
              <Shield className="h-6 w-6 text-accent-400" />
              <span className="font-display font-bold tracking-tight">CSI Sécurité Sociale</span>
            </div>
            <p className="font-body text-xs leading-relaxed">
              Plateforme nationale de gestion de la santé, connectant les assurés, les médecins généralistes, les spécialistes et l&apos;organisme de prévoyance.
            </p>
          </div>

          {/* Links Platform */}
          <div className="flex flex-col gap-4">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Plateforme</h4>
            <ul className="space-y-2.5 text-xs font-body">
              <li>
                <Link href="/login" className="hover:text-white transition">Connexion</Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">Inscription</Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition">Fonctionnalités</a>
              </li>
              <li>
                <a href="#acteurs" className="hover:text-white transition">Acteurs</a>
              </li>
            </ul>
          </div>

          {/* Links Legal */}
          <div className="flex flex-col gap-4">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Légal</h4>
            <ul className="space-y-2.5 text-xs font-body">
              <li>
                <a href="#" className="hover:text-white transition">Mentions légales</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">CGU</a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">Politique de confidentialité</a>
              </li>
            </ul>
          </div>

          {/* Contact details */}
          <div className="flex flex-col gap-4">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-xs font-body">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="text-accent-400 mt-0.5 shrink-0" />
                <span>École Nationale Supérieure Polytechnique de Yaoundé (ENSPY), Cameroun</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-accent-400 shrink-0" />
                <span>contact@csi.enspy.cm</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-accent-400 shrink-0" />
                <span>+237 222 22 22 22 / 242 42 42 42</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body">
          <p>© 2025 CSI Sécurité Sociale — ENSPY. Tous droits réservés.</p>
          <p className="flex items-center gap-1.5 text-slate-500">
            Conçu par <span className="text-slate-300 font-semibold">PIO</span> — Génie Informatique, ENSPY
          </p>
        </div>
      </footer>
    </div>
  );
}
