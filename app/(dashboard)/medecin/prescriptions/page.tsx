'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pill, Search, Calendar, User, Edit, Trash2, Stethoscope, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { useAuth } from '@/lib/authContext';
import { getConsultationsByMedecin, updatePrescription, deletePrescription, getMedecins, getPrescriptionsByConsultation, prescrireMedicament, prescrireConsultation } from '@/lib/api';
import { Consultation, Prescription, Medecin } from '@/types';
import Card, { CardBody } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

export default function MedecinPrescriptionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<(Prescription & { date: string; patient: string })[]>([]);
  const [specialists, setSpecialists] = useState<Medecin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<(Prescription & { date: string; patient: string }) | null>(null);
  
  // Form fields state for editing
  const [editType, setEditType] = useState<'MEDICAMENT' | 'CONSULTATION_SPECIALISTE'>('MEDICAMENT');
  const [editMedicament, setEditMedicament] = useState('');
  const [editPosologie, setEditPosologie] = useState('');
  const [editMatricule, setEditMatricule] = useState('');
  const [editMotif, setEditMotif] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // States for other prescriptions of the same consultation
  const [relatedPrescriptions, setRelatedPrescriptions] = useState<Prescription[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Form fields for adding new prescription in the modal
  const [newType, setNewType] = useState<'MEDICAMENT' | 'CONSULTATION_SPECIALISTE'>('MEDICAMENT');
  const [newMedicament, setNewMedicament] = useState('');
  const [newPosologie, setNewPosologie] = useState('');
  const [newMatricule, setNewMatricule] = useState('');
  const [newMotif, setNewMotif] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        const [resConsults, resMedecins] = await Promise.all([
          getConsultationsByMedecin(user.id).catch((err) => {
            console.error('Failed to load consultations for prescriptions:', err);
            return { data: [] };
          }),
          getMedecins().catch((err) => {
            console.error('Failed to load specialists:', err);
            return { data: [] };
          })
        ]);
        
        const consults: Consultation[] = resConsults.data || [];
        
        // Extract all prescriptions
        const list = consults.flatMap((c) =>
          (c.prescriptions || []).map((p) => ({
            ...p,
            date: c.date,
            patient: c.assure.nom,
          }))
        );
        
        setPrescriptions(list);
        setSpecialists(resMedecins.data.filter((m) => m.type === 'SPECIALISTE'));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleOpenEdit = async (p: Prescription & { date: string; patient: string }) => {
    setEditingPrescription(p);
    setEditType(p.type);
    setEditMedicament(p.medicament || '');
    setEditPosologie(p.posologie || '');
    setEditMatricule(p.matriculeMedecin || '');
    setEditMotif(p.motif || '');
    setIsEditModalOpen(true);
    
    // Fetch related prescriptions
    setIsLoadingRelated(true);
    try {
      const res = await getPrescriptionsByConsultation(p.consultationId);
      setRelatedPrescriptions(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingPrescription) return;

    if (editType === 'MEDICAMENT') {
      if (!editMedicament.trim() || !editPosologie.trim()) {
        warning(t('medecin.nouvelle_consultation.form_error_med') || 'Veuillez renseigner le nom du médicament et sa posologie.');
        return;
      }
    } else {
      if (!editMatricule || !editMotif.trim()) {
        warning(t('medecin.nouvelle_consultation.form_error_spec') || 'Veuillez sélectionner le spécialiste ciblé et renseigner le motif.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        consultationId: editingPrescription.consultationId,
        medicament: editType === 'MEDICAMENT' ? editMedicament : undefined,
        posologie: editType === 'MEDICAMENT' ? editPosologie : undefined,
        matriculeMedecin: editType === 'CONSULTATION_SPECIALISTE' ? editMatricule : undefined,
        motif: editType === 'CONSULTATION_SPECIALISTE' ? editMotif : undefined,
      };

      const res = await updatePrescription(editingPrescription.id, payload);
      
      setPrescriptions((prev) =>
        prev.map((item) =>
          item.id === editingPrescription.id
            ? { ...item, ...res.data, type: editType }
            : item
        )
      );

      success("Prescription modifiée avec succès.");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      error("Erreur lors de la modification de la prescription.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette prescription ?")) {
      return;
    }
    try {
      await deletePrescription(id);
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      success("Prescription supprimée avec succès.");
    } catch (err) {
      console.error(err);
      error("Erreur lors de la suppression de la prescription.");
    }
  };

  const handleAddNewPrescription = async () => {
    if (!editingPrescription) return;

    if (newType === 'MEDICAMENT') {
      if (!newMedicament.trim() || !newPosologie.trim()) {
        warning("Veuillez renseigner le nom du médicament et sa posologie.");
        return;
      }
    } else {
      if (!newMatricule || !newMotif.trim()) {
        warning("Veuillez sélectionner le spécialiste ciblé et renseigner le motif.");
        return;
      }
    }

    setIsAddingNew(true);
    try {
      let res;
      if (newType === 'MEDICAMENT') {
        res = await prescrireMedicament({
          consultationId: editingPrescription.consultationId,
          medicament: newMedicament,
          posologie: newPosologie,
        });
      } else {
        res = await prescrireConsultation({
          consultationId: editingPrescription.consultationId,
          matriculeMedecin: newMatricule,
          motif: newMotif,
        });
      }

      const newPresc = res.data;
      if (newPresc) {
        setRelatedPrescriptions((prev) => [...prev, newPresc]);

        // Add to main prescriptions table list
        const mainItem = {
          ...newPresc,
          date: editingPrescription.date,
          patient: editingPrescription.patient,
        };
        setPrescriptions((prev) => [...prev, mainItem]);

        success("Prescription ajoutée avec succès à l'ordonnance.");
        
        // Reset fields
        setNewMedicament('');
        setNewPosologie('');
        setNewMatricule('');
        setNewMotif('');
      }
    } catch (err) {
      console.error(err);
      error("Erreur lors de l'ajout de la prescription.");
    } finally {
      setIsAddingNew(false);
    }
  };

  const handleDeleteRelated = async (id: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette prescription de l'ordonnance ?")) {
      return;
    }
    try {
      await deletePrescription(id);
      setRelatedPrescriptions((prev) => prev.filter((p) => p.id !== id));
      setPrescriptions((prev) => prev.filter((p) => p.id !== id));
      success("Prescription retirée de l'ordonnance.");
    } catch (err) {
      console.error(err);
      error("Erreur lors du retrait de la prescription.");
    }
  };

  const filtered = prescriptions.filter((p) =>
    (p.type === 'MEDICAMENT' ? p.medicament || '' : p.motif || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    p.patient.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader className="min-h-[60vh]" size="lg" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
          {t('medecin.prescriptions.title')}
        </h1>
        <p className="font-body text-sm text-slate-500 mt-1">
          {t('medecin.prescriptions.subtitle')}
        </p>
      </div>

      <Card>
        <CardBody className="p-4 flex gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t('medecin.prescriptions.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="dashboard-search"
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('medecin.prescriptions.col_date')}</TableHead>
                <TableHead>{t('medecin.prescriptions.col_patient')}</TableHead>
                <TableHead>{t('medecin.prescriptions.col_type')}</TableHead>
                <TableHead>{t('medecin.prescriptions.col_details')}</TableHead>
                <TableHead className="no-print">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500 font-body">
                    {t('medecin.prescriptions.not_found')}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-500" />
                        {formatDate(p.date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      <span className="flex items-center gap-1.5">
                        <span className="p-1 bg-slate-850 rounded text-slate-400">
                          <User size={12} />
                        </span>
                        <span>{p.patient}</span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.type === 'MEDICAMENT' ? 'info' : 'warning'}>
                        {p.type === 'MEDICAMENT' ? t('medecin.prescriptions.type_medicament') : t('medecin.prescriptions.type_specialiste')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs leading-relaxed">
                      {p.type === 'MEDICAMENT' ? (
                        <div>
                          <span className="font-semibold text-sm">{p.medicament}</span> <br />
                          <span className="text-slate-400 italic text-[11px]">{t('medecin.nouvelle_consultation.posologie')} : {p.posologie}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-sm font-display">{t('medecin.prescriptions.type_specialiste')}</span> <br />
                          <span className="text-slate-400 text-[11px]">
                            {t('medecin.nouvelle_consultation.specialiste_matricule')} : <span className="font-mono text-primary-300 font-medium">{p.matriculeMedecin}</span> <br />
                            {t('medecin.nouvelle_consultation.referral_motif')} : {p.motif}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="no-print">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2.5 py-1.5"
                          onClick={() => handleOpenEdit(p)}
                        >
                          <Edit size={14} className="mr-1 inline" />
                          Modifier
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="text-xs px-2.5 py-1.5"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 size={14} className="mr-1 inline" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'ordonnance"
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          
          {/* SECTION 1: Edit Selected Prescription */}
          <div className="space-y-4 pr-0 md:pr-4">
            <h4 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">
              Modifier l'élément actuel
            </h4>
            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => { setEditType('MEDICAMENT'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer ${
                  editType === 'MEDICAMENT' ? 'bg-white text-slate-850 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('medecin.nouvelle_consultation.type_med')}
              </button>
              <button
                type="button"
                onClick={() => { setEditType('CONSULTATION_SPECIALISTE'); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition cursor-pointer ${
                  editType === 'CONSULTATION_SPECIALISTE' ? 'bg-white text-slate-850 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t('medecin.nouvelle_consultation.type_spec')}
              </button>
            </div>

            {editType === 'MEDICAMENT' ? (
              <div className="space-y-3">
                <Input
                  id="input-edit-medicament"
                  label={t('medecin.nouvelle_consultation.medicament')}
                  placeholder={t('medecin.nouvelle_consultation.medicament_placeholder')}
                  value={editMedicament}
                  onChange={(e) => setEditMedicament(e.target.value)}
                  leftIcon={<Pill size={16} className="text-slate-400" />}
                />
                <Input
                  id="input-edit-posologie"
                  label={t('medecin.nouvelle_consultation.posologie')}
                  placeholder={t('medecin.nouvelle_consultation.posologie_placeholder')}
                  value={editPosologie}
                  onChange={(e) => setEditPosologie(e.target.value)}
                  leftIcon={<FileText size={16} className="text-slate-400" />}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="form-group">
                  <label className="font-display font-semibold text-[13px] text-slate-700 tracking-wide mb-1 block">
                    {t('medecin.nouvelle_consultation.target_spec')}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                      <Stethoscope size={16} />
                    </div>
                    <select
                      id="select-edit-specialist"
                      value={editMatricule}
                      onChange={(e) => setEditMatricule(e.target.value)}
                      className="w-full h-11 bg-slate-50/80 border border-slate-200 rounded-xl font-body text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200 pl-10 pr-10 dashboard-input"
                    >
                      <option value="">-- {t('medecin.nouvelle_consultation.choose_spec')} --</option>
                      {specialists.map((s) => (
                        <option key={s.id} value={s.matricule}>
                          Dr. {s.nom} ({s.domaineSpecialisation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Input
                  id="input-edit-referral-reason"
                  label={t('medecin.nouvelle_consultation.referral_reason')}
                  placeholder={t('medecin.nouvelle_consultation.referral_motif_placeholder')}
                  value={editMotif}
                  onChange={(e) => setEditMotif(e.target.value)}
                  leftIcon={<FileText size={16} className="text-slate-400" />}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs"
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSaveEdit}
                isLoading={isSaving}
                className="text-xs font-semibold"
              >
                Enregistrer
              </Button>
            </div>
          </div>

          {/* SECTION 2: Ordonnance / Related Prescriptions list & addition */}
          <div className="space-y-4 pt-4 md:pt-0 pl-0 md:pl-6">
            <h4 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider mb-2">
              Médicaments & Soins de l'ordonnance
            </h4>

            {/* List of existing prescriptions in this order */}
            <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
              {isLoadingRelated ? (
                <div className="py-6 flex justify-center"><Loader size="sm" /></div>
              ) : relatedPrescriptions.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-4">Aucune prescription dans cette ordonnance.</p>
              ) : (
                relatedPrescriptions.map((rp) => (
                  <div key={rp.id} className="flex justify-between items-center gap-2 bg-white p-2 rounded-lg border border-slate-200/60 shadow-sm">
                    <div className="text-xs min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={rp.type === 'MEDICAMENT' ? 'info' : 'warning'} className="text-[9px] px-1 py-0 scale-90 origin-left">
                          {rp.type === 'MEDICAMENT' ? 'Med' : 'Spéc'}
                        </Badge>
                        <span className="font-semibold text-slate-800 truncate">
                          {rp.type === 'MEDICAMENT' ? rp.medicament : `Orientation`}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] truncate pl-1 mt-0.5">
                        {rp.type === 'MEDICAMENT' ? rp.posologie : rp.motif}
                      </p>
                    </div>
                    {editingPrescription && rp.id !== editingPrescription.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteRelated(rp.id)}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Form to add a new prescription to the same consultation */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-3">
              <span className="font-display font-bold text-[10px] text-slate-700 uppercase tracking-wider block">
                + Ajouter un autre élément à l'ordonnance
              </span>
              
              <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setNewType('MEDICAMENT')}
                  className={`flex-1 py-1 rounded-md font-bold uppercase transition cursor-pointer ${
                    newType === 'MEDICAMENT' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Médicament
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('CONSULTATION_SPECIALISTE')}
                  className={`flex-1 py-1 rounded-md font-bold uppercase transition cursor-pointer ${
                    newType === 'CONSULTATION_SPECIALISTE' ? 'bg-white text-slate-850 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Spécialiste
                </button>
              </div>

              {newType === 'MEDICAMENT' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nom du médicament"
                    value={newMedicament}
                    onChange={(e) => setNewMedicament(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Posologie (ex: 1 cp matin/soir)"
                    value={newPosologie}
                    onChange={(e) => setNewPosologie(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <select
                    value={newMatricule}
                    onChange={(e) => setNewMatricule(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500"
                  >
                    <option value="">-- Sélectionner spécialiste --</option>
                    {specialists.map((s) => (
                      <option key={s.id} value={s.matricule}>
                        Dr. {s.nom} ({s.domaineSpecialisation})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Motif de l'orientation"
                    value={newMotif}
                    onChange={(e) => setNewMotif(e.target.value)}
                    className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500"
                  />
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full text-[10px] py-1.5 h-8 bg-slate-800 text-white hover:bg-slate-900"
                onClick={handleAddNewPrescription}
                isLoading={isAddingNew}
              >
                Ajouter à l'ordonnance
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

