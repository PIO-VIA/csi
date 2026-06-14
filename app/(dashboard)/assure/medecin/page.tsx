'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Heart, Check, Search, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getAssureById, getGeneralistes, choisirMedecinTraitant } from '@/lib/api';
import { Assure, Medecin } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { useToast } from '@/components/ui/Toast';

export default function AssureMedecinPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [assureInfo, setAssureInfo] = useState<Assure | null>(null);
  const [generalistes, setGeneralistes] = useState<Medecin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [resAssure, resGen] = await Promise.all([
        getAssureById(user.id),
        getGeneralistes(),
      ]);
      setAssureInfo(resAssure.data);
      setGeneralistes(resGen.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSelectMedecin = async (medecinId: number) => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await choisirMedecinTraitant(user.id, medecinId);
      success(t('common.success') || 'Opération réussie');
      await loadData();
    } catch (e) {
      error(t('common.error') || 'Une erreur est survenue');
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = generalistes.filter((g) =>
    g.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;
  if (!assureInfo) return <div className="text-slate-400">{t('common.error')}</div>;

  const currentDoctor = assureInfo.medecinTraitant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('assure.medecin.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('assure.medecin.subtitle')}
        </p>
      </div>

      {/* CURRENT DOCTOR CARD */}
      <div className="max-w-2xl">
        {currentDoctor ? (
          <Card className="border-l-4 border-success bg-slate-50">
            <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center justify-center shadow-lg shadow-success/5 shrink-0">
                  <Stethoscope size={28} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-display font-bold text-success uppercase tracking-wider">
                      {t('assure.medecin.current_doctor')}
                    </span>
                    <Badge variant="success">{t('common.active')}</Badge>
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-800">
                    Dr. {currentDoctor.nom}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-mono">Matricule: {currentDoctor.matricule}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {currentDoctor.numTelephone}
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="border-l-4 border-warning bg-slate-50">
            <CardBody className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-warning/10 border border-warning/20 text-warning flex items-center justify-center shrink-0">
                  <Heart size={28} className="animate-pulse" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-display font-bold text-warning uppercase tracking-wider">
                    {t('assure.dashboard.no_doctor')}
                  </span>
                  <h3 className="font-display font-bold text-sm text-slate-800">
                    {t('assure.medecin.no_doctor')}
                  </h3>
                  <p className="font-body text-xs text-slate-500 leading-relaxed max-w-md">
                    {t('assure.medecin.no_doctor_desc')}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* SEARCH AND LIST OF GENERAL PRACTITIONERS */}
      <div className="space-y-4 pt-4 border-t border-slate-200/80">
        <div>
          <h2 className="font-display font-bold text-sm text-slate-800 uppercase tracking-wider">
            {t('assure.medecin.available_doctors')}
          </h2>
          <p className="font-body text-xs text-slate-400">
            {t('assure.medecin.choose_doctor')}
          </p>
        </div>

        {/* Search Input */}
        <Card className="max-w-xl">
          <CardBody className="p-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder={t('assure.medecin.search_placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dashboard-search text-xs"
              />
            </div>
          </CardBody>
        </Card>

        {/* Doctor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-500 text-xs font-body">
              {t('admin.medecins.not_found')}
            </div>
          ) : (
            filtered.map((g) => {
              const isSelected = currentDoctor?.id === g.id;
              return (
                <Card
                  key={g.id}
                  className={`duration-300 ${
                    isSelected ? 'border-primary-500/60 bg-primary-50/30' : 'hover:border-slate-350'
                  }`}
                >
                  <CardBody className="p-5 flex flex-col justify-between h-full gap-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                          <Stethoscope size={20} />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-slate-850">Dr. {g.nom}</h4>
                          <span className="font-mono text-[9px] text-slate-500">{g.matricule}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="success" className="scale-90 origin-right">
                          {t('assure.medecin.selected')}
                        </Badge>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone size={12} className="text-slate-400" />
                        <span>{g.numTelephone}</span>
                      </div>
                      <div>Type: {t('admin.medecins.generaliste')}</div>
                    </div>

                    <Button
                      variant={isSelected ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleSelectMedecin(g.id)}
                      disabled={isSelected || isUpdating}
                      className="w-full text-xs font-medium"
                    >
                      {isSelected ? (
                        <span className="flex items-center justify-center gap-1">
                          <Check size={12} /> {t('assure.medecin.selected')}
                        </span>
                      ) : (
                        <span>{t('assure.medecin.select')}</span>
                      )}
                    </Button>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
