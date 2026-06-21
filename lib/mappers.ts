import type {
  Assure,
  Consultation,
  FeuillemMaladie,
  Medecin,
  Prescription,
  Remboursement,
  User,
  UserRole,
} from '@/types';
import { OpenAPI } from '@/lib2';

type RawRecord = Record<string, unknown>;

export function getFullPhotoUrl(photoUrl?: string): string | undefined {
  if (!photoUrl) return undefined;
  if (
    photoUrl.startsWith('http://') ||
    photoUrl.startsWith('https://') ||
    photoUrl.startsWith('data:')
  ) {
    return photoUrl;
  }
  const baseUrl = OpenAPI.BASE || '';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = photoUrl.startsWith('/') ? photoUrl : `/${photoUrl}`;
  return `${cleanBase}${cleanPath}`;
}

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
    indicatifPays: raw.indicatifPays ? String(raw.indicatifPays) : undefined,
    numTelephone: String(raw.numTelephone ?? ''),
    photoUrl: getFullPhotoUrl(raw.photoUrl ? String(raw.photoUrl) : undefined),
    dateNaissance: raw.dateNaissance ? String(raw.dateNaissance) : undefined,
    sexe: raw.sexe ? String(raw.sexe) : undefined,
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
    indicatifPays: raw.indicatifPays ? String(raw.indicatifPays) : undefined,
    numTelephone: String(raw.numTelephone ?? ''),
    email: raw.email ? String(raw.email) : undefined,
    photoUrl: getFullPhotoUrl(raw.photoUrl ? String(raw.photoUrl) : undefined),
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
  const mappedRemboursement = remboursement || (raw.estRembourse ? {
    id: Number(raw.id),
    montant: raw.montantRembourse != null ? Number(raw.montantRembourse) : Number(raw.montantSoin ?? 0),
    dateRemboursement: raw.dateRemboursement ? String(raw.dateRemboursement) : '',
    modePaiement: raw.modePaiement === 'CASH' ? ('CASH' as const) : ('VIREMENT' as const),
    feuilleMaladieId: Number(raw.id),
  } : undefined);

  return {
    id: Number(raw.id),
    idFeuille: String(raw.idFeuille ?? ''),
    montantSoin: Number(raw.montantSoin ?? 0),
    estRembourse: Boolean(raw.estRembourse),
    consultationId: Number(raw.consultationId),
    montantRembourse: raw.montantRembourse != null ? Number(raw.montantRembourse) : undefined,
    remboursement: mappedRemboursement,
    statut: raw.statut ? String(raw.statut) : undefined,
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

/**
 * Construit l'utilisateur connecté à partir de la réponse de GET /api/auth/me.
 * Le backend peut renvoyer le rôle sous différentes formes (ROLE_GENERALISTE,
 * ROLE_ORGANISME, ...) et préciser le type pour les médecins (GENERALISTE /
 * SPECIALISTE). On combine les deux pour obtenir le rôle frontend exact.
 */
export function mapAuthMe(raw: RawRecord, fallbackEmail = ''): User {
  let role = mapBackendRole(String(raw.role ?? raw.authority ?? ''));
  const typeField = raw.type ? String(raw.type).toUpperCase() : '';

  if (role !== 'ADMIN' && role !== 'ASSURE') {
    if (typeField === 'SPECIALISTE') role = 'SPECIALISTE';
    else if (typeField === 'GENERALISTE') role = 'GENERALISTE';
  }

  const nom = String(raw.nom ?? raw.username ?? raw.name ?? fallbackEmail);
  const email = String(raw.email ?? fallbackEmail);

  return {
    id: Number(raw.id ?? 0),
    nom,
    email,
    role,
    avatarInitiales: initialsFromName(nom),
    photoUrl: getFullPhotoUrl(raw.photoUrl ? String(raw.photoUrl) : undefined),
  };
}

export function initialsFromName(nom?: string): string {
  if (!nom) return 'U';
  return nom
    .split(' ')
    .filter((x) => !x.includes('.'))
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 3) || 'U';
}
