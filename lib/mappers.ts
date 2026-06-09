import type {
  Assure,
  Consultation,
  FeuillemMaladie,
  Medecin,
  Prescription,
  Remboursement,
  UserRole,
} from '@/types';

type RawRecord = Record<string, unknown>;

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value == null) return [];
  return [value as T];
}

export function mapBackendRole(role: string): UserRole {
  switch (role) {
    case 'ROLE_ORGANISME':
    case 'ROLE_ADMIN':
      return 'ADMIN';
    case 'ROLE_SPECIALISTE':
      return 'SPECIALISTE';
    case 'ROLE_ASSURE':
      return 'ASSURE';
    case 'ROLE_GENERALISTE':
    case 'ROLE_MEDECIN':
    default:
      if (role.includes('SPECIALISTE')) return 'SPECIALISTE';
      if (role.includes('ORGANISME') || role.includes('ADMIN')) return 'ADMIN';
      if (role.includes('ASSURE')) return 'ASSURE';
      return 'GENERALISTE';
  }
}

export function mapMedecin(raw: RawRecord): Medecin {
  return {
    id: Number(raw.id),
    nom: String(raw.nom ?? ''),
    matricule: String(raw.matricule ?? ''),
    email: String(raw.email ?? ''),
    type: raw.type === 'SPECIALISTE' ? 'SPECIALISTE' : 'GENERALISTE',
    domaineSpecialisation: raw.domaineSpecialisation
      ? String(raw.domaineSpecialisation)
      : undefined,
    estAssure: Boolean(raw.estAssure),
    numTelephone: String(raw.numTelephone ?? ''),
  };
}

export function mapAssure(raw: RawRecord, medecins: Medecin[] = []): Assure {
  const medecinTraitant =
    raw.medecinTraitant && typeof raw.medecinTraitant === 'object'
      ? mapMedecin(raw.medecinTraitant as RawRecord)
      : raw.medecinTraitantId != null
        ? medecins.find((m) => m.id === Number(raw.medecinTraitantId))
        : undefined;

  return {
    id: Number(raw.id),
    idAssure: String(raw.idAssure ?? ''),
    nom: String(raw.nom ?? ''),
    dateNaissance: String(raw.dateNaissance ?? ''),
    sexe: String(raw.sexe ?? ''),
    profession: String(raw.profession ?? ''),
    statutMatrimoniale: String(raw.statutMatrimoniale ?? ''),
    groupeSanguin: String(raw.groupeSanguin ?? ''),
    numTelephone: String(raw.numTelephone ?? ''),
    medecinTraitant,
  };
}

export function mapPrescription(raw: RawRecord): Prescription {
  const type =
    raw.type === 'CONSULTATION_SPECIALISTE' || raw.matriculeMedecin
      ? 'CONSULTATION_SPECIALISTE'
      : 'MEDICAMENT';

  return {
    id: Number(raw.id),
    consultationId: Number(raw.consultationId),
    type,
    medicament: raw.medicament ? String(raw.medicament) : undefined,
    posologie: raw.posologie ? String(raw.posologie) : undefined,
    matriculeMedecin: raw.matriculeMedecin
      ? String(raw.matriculeMedecin)
      : undefined,
    motif: raw.motif ? String(raw.motif) : undefined,
  };
}

export function mapRemboursement(raw: RawRecord): Remboursement {
  const mode = String(raw.modePaiement ?? 'VIREMENT').toUpperCase();
  return {
    id: Number(raw.id),
    montant: Number(raw.montant ?? 0),
    dateRemboursement: String(raw.dateRemboursement ?? ''),
    modePaiement: mode === 'CASH' ? 'CASH' : 'VIREMENT',
    feuilleMaladieId: Number(raw.feuilleMaladieId),
  };
}

export function mapFeuille(raw: RawRecord, remboursement?: Remboursement): FeuillemMaladie {
  return {
    id: Number(raw.id),
    idFeuille: String(raw.idFeuille ?? ''),
    montantSoin: Number(raw.montantSoin ?? 0),
    estRembourse: Boolean(raw.estRembourse),
    consultationId: Number(raw.consultationId),
    remboursement,
  };
}

export function buildConsultation(
  raw: RawRecord,
  assure: Assure,
  generaliste: Medecin,
  prescriptions: Prescription[] = [],
  feuilleMaladie?: FeuillemMaladie,
): Consultation {
  return {
    id: Number(raw.id),
    date: String(raw.date ?? ''),
    assure,
    generaliste,
    prescriptions,
    feuilleMaladie,
    motif: raw.motif ? String(raw.motif) : undefined,
  };
}

export function initialsFromName(nom: string): string {
  return nom
    .split(' ')
    .filter((x) => !x.includes('.'))
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 3) || 'U';
}
