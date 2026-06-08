export type UserRole = 'ADMIN' | 'ASSURE' | 'GENERALISTE' | 'SPECIALISTE';

export interface User {
  id: number;
  nom: string;
  email: string;
  role: UserRole;
  avatarInitiales: string; // e.g. "PIO"
}

export interface Assure {
  id: number;
  idAssure: string; // Matricule Assuré
  nom: string;
  dateNaissance: string;
  sexe: string;
  profession: string;
  statutMatrimoniale: string;
  groupeSanguin: string;
  numTelephone: string;
  medecinTraitant?: Medecin;
}

export interface Medecin {
  id: number;
  nom: string;
  matricule: string;
  type: 'GENERALISTE' | 'SPECIALISTE';
  domaineSpecialisation?: string;
  estAssure: boolean;
  numTelephone: string;
}

export interface Consultation {
  id: number;
  date: string;
  assure: Assure;
  generaliste: Medecin;
  prescriptions: Prescription[];
  feuilleMaladie?: FeuillemMaladie;
}

export interface Prescription {
  id: number;
  consultationId: number;
  type: 'MEDICAMENT' | 'CONSULTATION_SPECIALISTE';
  medicament?: string;
  posologie?: string;
  matriculeMedecin?: string; // Specifying referral specialist
  motif?: string;
}

export interface FeuillemMaladie {
  id: number;
  idFeuille: string;
  montantSoin: number;
  estRembourse: boolean;
  consultationId: number;
  remboursement?: Remboursement;
}

export interface Remboursement {
  id: number;
  montant: number;
  dateRemboursement: string;
  modePaiement: 'VIREMENT' | 'CASH';
  feuilleMaladieId: number;
}

export interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  variation?: string;     // e.g. "+12% ce mois"
  variationUp?: boolean;
}
