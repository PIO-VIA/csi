import '@/lib/openapi-config';
import {
  ApiError,
  AuthentificationService,
  AssurSService,
  AgentsService,
  ConsultationsService,
  FeuillesMaladieService,
  GNRalistesService,
  MDecinsService,
  PrescriptionsService,
  RemboursementsService,
  SpCialistesService,
} from '@/lib2';
import type { AssureRequestDTO, MedecinRequestDTO } from '@/lib2';
import {
  asArray,
  buildConsultation,
  mapAssure,
  mapFeuille,
  mapMedecin,
  mapPrescription,
  mapRemboursement,
  getFullPhotoUrl,
} from '@/lib/mappers';
import type {
  Assure,
  Consultation,
  CreateMedecinInput,
  FeuillemMaladie,
  Medecin,
  Prescription,
  Remboursement,
} from '@/types';

type ApiPayload<T> = { data: T };

const toList = <T>(value: unknown): T[] => asArray<T>(value);

// ============================================================
// HELPERS INTERNES
// ============================================================

async function loadMedecins(): Promise<Medecin[]> {
  const raw = await MDecinsService.getAll();
  return toList<Record<string, unknown>>(raw).map(mapMedecin);
}

async function loadAssures(medecins?: Medecin[]): Promise<Assure[]> {
  const doctors = medecins ?? (await loadMedecins());

  // Essai 1 : endpoint médecin /api/medecins/me/assures (autorisé pour GENERALISTE et SPECIALISTE)
  // Cela évite le 403 que renvoie /api/assures pour les non-admins
  try {
    const raw = await MDecinsService.getMesAssures();
    const list = toList<Record<string, unknown>>(raw);
    if (list.length >= 0) {
      return list.map((item) => mapAssure(item, doctors));
    }
  } catch {
    // Non-médecin (ex: admin) → fallback sur l'endpoint admin
  }

  // Essai 2 : endpoint admin /api/assures (ADMIN uniquement)
  try {
    const raw = await AssurSService.getAll2();
    return toList<Record<string, unknown>>(raw).map((item) => mapAssure(item, doctors));
  } catch {
    return [];
  }
}

async function loadFeuilles(): Promise<FeuillemMaladie[]> {
  const raw = await FeuillesMaladieService.getAll1();
  // montantRembourse est déjà inclus dans FeuillemMaladieResponseDTO — pas besoin d'appel supplémentaire
  return toList<Record<string, unknown>>(raw).map((item) => mapFeuille(item));
}

async function enrichConsultations(
  rawConsultations: Record<string, unknown>[],
): Promise<Consultation[]> {
  if (!rawConsultations.length) return [];

  const [assures, medecins, feuilles] = await Promise.all([
    loadAssures(),
    loadMedecins(),
    loadFeuilles(),
  ]);

  const assureMap = new Map(assures.map((a) => [a.id, a]));
  const medecinMap = new Map(medecins.map((m) => [m.id, m]));
  
  const feuillesMap = new Map<number, FeuillemMaladie[]>();
  for (const f of feuilles) {
    const list = feuillesMap.get(f.consultationId) || [];
    list.push(f);
    feuillesMap.set(f.consultationId, list);
  }

  return Promise.all(
    rawConsultations.map(async (raw) => {
      const id = Number(raw.id);
      const assureId = Number(raw.assureId);
      const generalisteId = Number(raw.generalisteId);

      let prescriptions: Prescription[] = [];
      try {
        const prescs = await PrescriptionsService.getByConsultation(id);
        prescriptions = toList<Record<string, unknown>>(prescs).map(mapPrescription);
      } catch {
        prescriptions = [];
      }

      const assure =
        assureMap.get(assureId) ??
        mapAssure({ id: assureId, nom: `Assuré #${assureId}` });
      const generaliste =
        medecinMap.get(generalisteId) ??
        mapMedecin({ id: generalisteId, nom: `Médecin #${generalisteId}`, type: 'GENERALISTE' });

      const cFeuilles = feuillesMap.get(id) || [];
      const primaryFeuille = cFeuilles[0];

      return buildConsultation(
        raw,
        assure,
        generaliste,
        prescriptions,
        primaryFeuille,
        cFeuilles,
      );
    }),
  );
}

async function loadAllConsultations(): Promise<Consultation[]> {
  const medecins = await loadMedecins();
  // On ne boucle que sur les généralistes : l'endpoint /generaliste/{id} renvoie
  // 400 Bad Request pour un spécialiste (BUG FRONT #3)
  const generalistes = medecins.filter((m) => m.type === 'GENERALISTE');
  const results = await Promise.all(
    generalistes.map(async (m) => {
      try {
        return await ConsultationsService.getByGeneraliste(m.id);
      } catch (err) {
        console.error(`Error fetching consultations for doctor ID ${m.id}:`, err);
        return [];
      }
    }),
  );

  const seen = new Set<number>();
  const raw: Record<string, unknown>[] = [];

  for (const result of results) {
    for (const item of toList<Record<string, unknown>>(result)) {
      const id = Number(item.id);
      if (!seen.has(id)) {
        seen.add(id);
        raw.push(item);
      }
    }
  }

  return enrichConsultations(raw);
}

function randomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ============================================================
// UTILITAIRES PUBLICS
// ============================================================

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.body && typeof error.body === 'object' && 'error' in error.body) {
      return String((error.body as { error: string }).error);
    }
    if (error.body && typeof error.body === 'object' && 'message' in error.body) {
      return String((error.body as { message: string }).message);
    }
    if (typeof error.body === 'string' && error.body.trim()) {
      return error.body;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue';
}

/** @deprecated Conservé pour compatibilité — les données viennent du backend. */
export const initLocalStorage = () => {};

// ============================================================
// AUTHENTIFICATION / PROFIL
// ============================================================

/**
 * Récupère le profil de l'utilisateur connecté (GET /api/auth/me).
 * Retourne la réponse brute du backend, à interpréter via mapAuthMe.
 */
export const getMe = async (): Promise<Record<string, unknown>> => {
  const raw = await AuthentificationService.me();
  return (raw ?? {}) as Record<string, unknown>;
};

// ============================================================
// ASSURÉS
// ============================================================

export const getAssures = async (): Promise<ApiPayload<Assure[]>> => ({
  data: await loadAssures(),
});

export const getAssureById = async (id: number): Promise<ApiPayload<Assure>> => {
  const medecins = await loadMedecins();
  const raw = await AssurSService.getById2(id);
  return { data: mapAssure(raw as Record<string, unknown>, medecins) };
};

export const createAssure = async (
  data: Partial<Assure> & { email?: string },
): Promise<ApiPayload<Assure>> => {
  const payload: AssureRequestDTO = {
    nom: data.nom,
    dateNaissance: data.dateNaissance,
    sexe: data.sexe,
    indicatifPays: data.indicatifPays,
    numTelephone: data.numTelephone,
    profession: data.profession,
    statutMatrimoniale: data.statutMatrimoniale,
    groupeSanguin: data.groupeSanguin,
    email: data.email,
    motDePasse: randomPassword(),
  };

  const raw = await AssurSService.inscrire(payload);
  const medecins = await loadMedecins();
  let assure = mapAssure(raw as Record<string, unknown>, medecins);

  if (data.medecinTraitant?.id) {
    const updated = await AssurSService.choisirMedecin(assure.id, data.medecinTraitant.id);
    assure = mapAssure(updated as Record<string, unknown>, medecins);
  }

  return { data: assure };
};

export const updateAssure = async (
  id: number,
  data: Partial<Assure>,
): Promise<ApiPayload<Assure>> => {
  const payload: AssureRequestDTO = {
    nom: data.nom,
    dateNaissance: data.dateNaissance,
    sexe: data.sexe,
    indicatifPays: data.indicatifPays,
    numTelephone: data.numTelephone,
    profession: data.profession,
    statutMatrimoniale: data.statutMatrimoniale,
    groupeSanguin: data.groupeSanguin,
  };

  const raw = await AssurSService.update1(id, payload);
  const medecins = await loadMedecins();
  let assure = mapAssure(raw as Record<string, unknown>, medecins);

  if (data.medecinTraitant?.id) {
    const updated = await AssurSService.choisirMedecin(assure.id, data.medecinTraitant.id);
    assure = mapAssure(updated as Record<string, unknown>, medecins);
  }

  return { data: assure };
};

/**
 * Supprime un assuré via le backend (DELETE /api/assures/{id}).
 */
export const deleteAssure = async (id: number): Promise<void> => {
  await AssurSService.delete1(id);
};

export const choisirMedecin = async (
  assureId: number,
  genId: number,
): Promise<ApiPayload<Assure>> => {
  const raw = await AssurSService.choisirMedecin(assureId, genId);
  const medecins = await loadMedecins();
  return { data: mapAssure(raw as Record<string, unknown>, medecins) };
};

export const choisirMedecinTraitant = choisirMedecin;

// ============================================================
// MÉDECINS
// ============================================================

export const getMedecins = async (): Promise<ApiPayload<Medecin[]>> => ({
  data: await loadMedecins(),
});

export const getMedecinById = async (id: number): Promise<ApiPayload<Medecin>> => {
  const raw = await MDecinsService.getById(id);
  return { data: mapMedecin(raw as Record<string, unknown>) };
};

export const getGeneralistes = async (): Promise<ApiPayload<Medecin[]>> => {
  const raw = await GNRalistesService.getAll5();
  return { data: toList<Record<string, unknown>>(raw).map(mapMedecin) };
};

export const getSpecialistes = async (): Promise<ApiPayload<Medecin[]>> => {
  const raw = await SpCialistesService.getAll4();
  return { data: toList<Record<string, unknown>>(raw).map(mapMedecin) };
};

export const getGeneralisteById = async (id: number): Promise<ApiPayload<Medecin>> => {
  const raw = await GNRalistesService.getById6(id);
  return { data: mapMedecin(raw as Record<string, unknown>) };
};

/**
 * Liste les assurés d'un généraliste donné
 * (endpoint GET /api/generalistes/{id}/assures).
 * Utilisé par le dashboard médecin pour charger uniquement ses propres patients.
 */
export const getAssuresByGeneraliste = async (
  generalisteId: number,
): Promise<ApiPayload<Assure[]>> => {
  const medecins = await loadMedecins();
  const raw = await GNRalistesService.getAssuresByGeneraliste(generalisteId);
  return { data: toList<Record<string, unknown>>(raw).map((item) => mapAssure(item, medecins)) };
};

/**
 * Liste les assurés affectés au médecin connecté (via endpoint GET /api/medecins/me/assures).
 */
export const getMesAssures = async (): Promise<ApiPayload<Assure[]>> => {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('csi_session') : null;
  if (storedUser) {
    try {
      const session = JSON.parse(storedUser);
      if (session.role === 'SPECIALISTE') {
        return { data: [] };
      }
    } catch (e) {
      console.error(e);
    }
  }
  try {
    const medecins = await loadMedecins();
    const raw = await MDecinsService.getMesAssures();
    return { data: toList<Record<string, unknown>>(raw).map((item) => mapAssure(item, medecins)) };
  } catch (err) {
    return { data: [] };
  }
};

export const createMedecin = async (
  data: CreateMedecinInput,
): Promise<ApiPayload<Medecin>> => {
  try {
    const payload: MedecinRequestDTO = {
      nom: data.nom,
      email: data.email,
      indicatifPays: data.indicatifPays,
      numTelephone: data.numTelephone,
      type: data.type,
      domaineSpecialisation: data.domaineSpecialisation || undefined,
      motDePasse: randomPassword(),
      matricule: data.matricule,
      estAssure: data.estAssure ?? false,
    };

    const raw = await MDecinsService.enregistrer(payload);
    return { data: mapMedecin(raw as Record<string, unknown>) };
  } catch (error) {
    if (error instanceof ApiError && getApiErrorMessage(error).includes('enregistré')) {
      const list = await loadMedecins();
      const created = list.find(
        (m) => m.email.toLowerCase() === data.email.toLowerCase(),
      );
      if (created) return { data: created };
    }
    throw error;
  }
};

export const updateMedecin = async (
  id: number,
  data: Partial<Medecin>,
): Promise<ApiPayload<Medecin>> => {
  const payload = {
    nom: data.nom,
    email: data.email,
    indicatifPays: data.indicatifPays,
    numTelephone: data.numTelephone,
    dateNaissance: (data.dateNaissance || null) as any,
    sexe: (data.sexe || null) as any,
    type: data.type,
    domaineSpecialisation: (data.domaineSpecialisation || null) as any,
    matricule: data.matricule,
    estAssure: data.estAssure,
  };
  const raw = await MDecinsService.modifier1(id, payload as Parameters<typeof MDecinsService.modifier1>[1]);
  return { data: mapMedecin(raw as Record<string, unknown>) };
};

export const deleteMedecin = async (id: number): Promise<void> => {
  await MDecinsService.supprimer1(id);
};

export const uploadMedecinPhoto = async (
  id: number,
  file: File,
): Promise<{ photoUrl: string }> => {
  const raw = await MDecinsService.uploadPhoto(id, { photo: file });
  return { photoUrl: getFullPhotoUrl(String((raw as Record<string, unknown>).photoUrl ?? '')) ?? '' };
};

export const uploadAgentPhoto = async (
  id: number,
  file: File,
): Promise<{ photoUrl: string }> => {
  const raw = await AgentsService.uploadPhoto2(id, { photo: file });
  return { photoUrl: getFullPhotoUrl(String((raw as Record<string, unknown>).photoUrl ?? '')) ?? '' };
};

export const getAgentById = async (id: number): Promise<ApiPayload<Record<string, any>>> => {
  const raw = await AgentsService.getById3(id);
  return { data: raw };
};

export const updateAgent = async (
  id: number,
  data: any,
): Promise<ApiPayload<Record<string, any>>> => {
  const raw = await AgentsService.update2(id, data);
  return { data: raw };
};

export const uploadAssurePhoto = async (
  id: number,
  file: File,
): Promise<{ photoUrl: string }> => {
  const raw = await AssurSService.uploadPhoto1(id, { photo: file });
  return { photoUrl: getFullPhotoUrl(String((raw as Record<string, unknown>).photoUrl ?? '')) ?? '' };
};

// ============================================================
// CONSULTATIONS
// ============================================================

export const getConsultations = async (): Promise<ApiPayload<Consultation[]>> => ({
  data: await loadAllConsultations(),
});

export const getConsultationById = async (id: number): Promise<ApiPayload<Consultation>> => {
  const raw = await ConsultationsService.getById7(id);
  const [enriched] = await enrichConsultations([raw as Record<string, unknown>]);
  return { data: enriched };
};

export const createConsultation = async (data: {
  assureId: number;
  generalisteId: number;
  date?: string;
  motif?: string;
  prescriptions?: Array<{
    type: 'MEDICAMENT' | 'SPECIALISTE';
    medicament?: string;
    posologie?: string;
    matriculeMedecin?: string;
    motif?: string;
  }>;
  creerFeuille?: boolean;
  registerFeuille?: boolean;
  montantSoin?: number;
  idFeuille?: string;
}): Promise<ApiPayload<Consultation>> => {
  const raw = await ConsultationsService.creer({
    date: data.date ?? new Date().toISOString().split('T')[0],
    assureId: Number(data.assureId),
    generalisteId: Number(data.generalisteId),
    motif: data.motif,
  });

  const consultationId = Number((raw as Record<string, unknown>).id);

  for (const prescription of data.prescriptions ?? []) {
    if (prescription.type === 'MEDICAMENT') {
      await PrescriptionsService.prescrireMedicament({
        consultationId,
        medicament: prescription.medicament,
        posologie: prescription.posologie,
      });
    } else {
      await PrescriptionsService.prescrireConsultation({
        consultationId,
        matriculeMedecin: prescription.matriculeMedecin,
        motif: prescription.motif,
      });
    }
  }

  if (data.creerFeuille || data.registerFeuille) {
    await FeuillesMaladieService.enregistrer1({
      consultationId,
      montantSoin: data.montantSoin,
      idFeuille: data.idFeuille,
    });
  }

  const [enriched] = await enrichConsultations([raw as Record<string, unknown>]);
  return { data: enriched };
};

export const getConsultationsByAssure = async (
  id: number,
): Promise<ApiPayload<Consultation[]>> => {
  const raw = await ConsultationsService.getByAssure1(id);
  return { data: await enrichConsultations(toList<Record<string, unknown>>(raw)) };
};

export const getConsultationsByGeneraliste = async (
  id: number,
): Promise<ApiPayload<Consultation[]>> => {
  const storedUser = typeof window !== 'undefined' ? localStorage.getItem('csi_session') : null;
  if (storedUser) {
    try {
      const session = JSON.parse(storedUser);
      if (session.role === 'SPECIALISTE') {
        return { data: [] };
      }
    } catch (e) {
      console.error(e);
    }
  }
  try {
    const raw = await ConsultationsService.getByGeneraliste(id);
    return { data: await enrichConsultations(toList<Record<string, unknown>>(raw)) };
  } catch (err) {
    return { data: [] };
  }
};

export const getConsultationsByMedecin = getConsultationsByGeneraliste;

// ============================================================
// PRESCRIPTIONS
// ============================================================

export const prescrireMedicament = async (data: {
  consultationId: number;
  medicament: string;
  posologie: string;
}): Promise<ApiPayload<Prescription>> => {
  const raw = await PrescriptionsService.prescrireMedicament(data);
  return { data: mapPrescription(raw as Record<string, unknown>) };
};

export const prescrireConsultation = async (data: {
  consultationId: number;
  matriculeMedecin: string;
  motif: string;
}): Promise<ApiPayload<Prescription>> => {
  const raw = await PrescriptionsService.prescrireConsultation(data);
  return { data: mapPrescription(raw as Record<string, unknown>) };
};

export const updatePrescription = async (
  id: number,
  data: {
    consultationId?: number;
    medicament?: string;
    posologie?: string;
    matriculeMedecin?: string;
    motif?: string;
  },
): Promise<ApiPayload<Prescription>> => {
  const raw = await PrescriptionsService.modifier(id, data);
  return { data: mapPrescription(raw as Record<string, unknown>) };
};

export const deletePrescription = async (id: number): Promise<void> => {
  await PrescriptionsService.supprimer(id);
};

export const getPrescriptionsByConsultation = async (
  consultationId: number,
): Promise<ApiPayload<Prescription[]>> => {
  const raw = await PrescriptionsService.getByConsultation(consultationId);
  return { data: toList<Record<string, unknown>>(raw).map(mapPrescription) };
};

// ============================================================
// FEUILLES MALADIE
// ============================================================

export const createFeuille = async (data: {
  consultationId: number;
  montantSoin: number;
  idFeuille?: string;
}): Promise<ApiPayload<FeuillemMaladie>> => {
  const raw = await FeuillesMaladieService.enregistrer1(data);
  return { data: mapFeuille(raw as Record<string, unknown>) };
};

export const getFeuilleById = async (id: number): Promise<ApiPayload<FeuillemMaladie>> => {
  const raw = await FeuillesMaladieService.getById1(id);
  return { data: mapFeuille(raw as Record<string, unknown>) };
};

export const getFeuillesByAssure = async (
  id: number,
): Promise<ApiPayload<FeuillemMaladie[]>> => {
  const raw = await FeuillesMaladieService.getByAssure(id);
  // montantRembourse déjà renvoyé par le DTO backend — pas de second appel nécessaire
  return { data: toList<Record<string, unknown>>(raw).map((item) => mapFeuille(item)) };
};

export const getFeuilles = async (): Promise<ApiPayload<FeuillemMaladie[]>> => ({
  data: await loadFeuilles(),
});

/**
 * Liste les feuilles de maladie créées par le médecin connecté (via endpoint GET /api/feuilles-maladie/medecin/me).
 */
export const getMesFeuilles = async (): Promise<ApiPayload<FeuillemMaladie[]>> => {
  const raw = await FeuillesMaladieService.getMesFeuilles();
  // montantRembourse déjà renvoyé par le DTO backend — pas de second appel nécessaire
  return { data: toList<Record<string, unknown>>(raw).map((item) => mapFeuille(item)) };
};

export const annulerFeuille = async (id: number): Promise<ApiPayload<FeuillemMaladie>> => {
  const raw = await FeuillesMaladieService.annuler(id);
  return { data: mapFeuille(raw as Record<string, unknown>) };
};

export const updateFeuille = async (
  id: number,
  data: {
    idFeuille?: string;
    montantSoin?: number;
    consultationId?: number;
  },
): Promise<ApiPayload<FeuillemMaladie>> => {
  const raw = await FeuillesMaladieService.update(id, data);
  return { data: mapFeuille(raw as Record<string, unknown>) };
};

// ============================================================
// REMBOURSEMENTS
// ============================================================

export const getRemboursements = async (): Promise<ApiPayload<Remboursement[]>> => {
  const feuilles = await loadFeuilles();
  // Utilise le nouvel endpoint /by-feuille/{id} pour obtenir les vrais remboursements
  // (date, mode de paiement, montant exact) avec le bon ID feuille — plus de 404
  const results = await Promise.all(
    feuilles
      .filter((f) => f.estRembourse)
      .map(async (feuille) => {
        try {
          const raw = await RemboursementsService.getByFeuille(feuille.id);
          return mapRemboursement(raw as Record<string, unknown>);
        } catch {
          // Fallback si l'endpoint échoue : construire à partir de montantRembourse du DTO
          if (feuille.montantRembourse != null) {
            return {
              id: feuille.id,
              montant: feuille.montantRembourse,
              dateRemboursement: '',
              modePaiement: 'VIREMENT' as const,
              feuilleMaladieId: feuille.id,
            } satisfies Remboursement;
          }
          return null;
        }
      }),
  );

  const uniqueResults: Remboursement[] = [];
  const seenIds = new Set<number>();
  for (const r of results) {
    if (r && !seenIds.has(r.id)) {
      seenIds.add(r.id);
      uniqueResults.push(r);
    }
  }

  return { data: uniqueResults };
};


/**
 * Liste les feuilles de maladie non encore remboursées
 * (endpoint GET /api/remboursements/non-rembourses).
 */
export const getNonRembourses = async (): Promise<ApiPayload<FeuillemMaladie[]>> => {
  const raw = await RemboursementsService.getNonRembourses();
  return { data: toList<Record<string, unknown>>(raw).map((item) => mapFeuille(item)) };
};

/**
 * Montant total de tous les remboursements
 * (endpoint GET /api/remboursements/stats/total).
 */
export const getTotalRemboursements = async (): Promise<number> => {
  const raw = await RemboursementsService.getTotal();
  // Le backend retourne probablement un nombre ou un objet { total: number }
  if (typeof raw === 'number') return raw;
  if (raw && typeof raw === 'object' && 'total' in raw) return Number((raw as Record<string, unknown>).total);
  return 0;
};

export const effectuerRemboursement = async (
  feuilleId: number,
  mode: string,
): Promise<ApiPayload<Remboursement>> => {
  const raw = await RemboursementsService.confirmer(feuilleId, mode);
  return { data: mapRemboursement(raw as Record<string, unknown>) };
};

export const effectuerRemboursementPlusieurs = async (
  feuilleIds: number[],
  mode: string,
): Promise<ApiPayload<Remboursement>> => {
  if (feuilleIds.length === 1) {
    const raw = await RemboursementsService.confirmer(feuilleIds[0], mode);
    return { data: mapRemboursement(raw as Record<string, unknown>) };
  }
  await RemboursementsService.initierPourPlusieurs(feuilleIds);
  const raw = await RemboursementsService.confirmer(feuilleIds[0], mode);
  return { data: mapRemboursement(raw as Record<string, unknown>) };
};

// ============================================================
// ORIENTATIONS SPECIALISTE
// ============================================================

export interface EnrichedOrientation extends Prescription {
  date: string;
  patientName: string;
  patientIdAssure: string;
  patientPhone: string;
  patientId: number;
  medecinPrescripteur: string;
  consultation?: Consultation;
}

export const getMesOrientations = async (): Promise<ApiPayload<Prescription[]>> => {
  const raw = await PrescriptionsService.getMesOrientations();
  return { data: toList<Record<string, unknown>>(raw).map(mapPrescription) };
};

export const getOrientationsByMatricule = async (
  matricule: string,
): Promise<ApiPayload<Prescription[]>> => {
  const raw = await PrescriptionsService.getOrientationsByMatricule(matricule);
  return { data: toList<Record<string, unknown>>(raw).map(mapPrescription) };
};

export const getMesOrientationsEnriched = async (): Promise<EnrichedOrientation[]> => {
  try {
    const raw = await PrescriptionsService.getMesOrientations();
    const rawList = toList<Record<string, unknown>>(raw);
    
    const enriched = await Promise.all(
      rawList.map(async (rawItem) => {
        const presc = mapPrescription(rawItem);
        
        // Extract fields directly from the raw item DTO
        const rawAssure = rawItem.assure as Record<string, any> | undefined;
        let date = rawItem.dateConsultation ? String(rawItem.dateConsultation) : '';
        let patientName = rawAssure?.nom ? String(rawAssure.nom) : (rawItem.assureNom ? String(rawItem.assureNom) : 'Assuré');
        let patientIdAssure = rawAssure?.idAssure ? String(rawAssure.idAssure) : (rawItem.assureIdAssure ? String(rawItem.assureIdAssure) : 'N/A');
        let patientPhone = rawAssure?.numTelephone ? String(rawAssure.numTelephone) : (rawItem.assureTelephone ? String(rawItem.assureTelephone) : '');
        let patientId = rawAssure?.id ? Number(rawAssure.id) : (rawItem.assureId ? Number(rawItem.assureId) : 0);
        let medecinPrescripteur = rawItem.medecinPrescripteurNom ? String(rawItem.medecinPrescripteurNom) : 'Médecin';
        let consultation: Consultation | undefined = undefined;

        // We no longer call getConsultationById here because specialists are forbidden
        // from accessing it (403). We rely entirely on the enriched PrescriptionResponseDTO.

        return {
          ...presc,
          date,
          patientName,
          patientIdAssure,
          patientPhone,
          patientId,
          medecinPrescripteur,
          consultation: consultation || {
            id: presc.consultationId,
            date,
            assure: {
              id: patientId,
              idAssure: patientIdAssure,
              nom: patientName,
              numTelephone: patientPhone,
              dateNaissance: '',
              sexe: rawAssure?.sexe ? String(rawAssure.sexe) : '',
              profession: '',
              statutMatrimoniale: '',
              groupeSanguin: rawAssure?.groupeSanguin ? String(rawAssure.groupeSanguin) : '',
            },
            generaliste: {
              id: 0,
              nom: medecinPrescripteur,
              matricule: presc.matriculeMedecin || '',
              email: '',
              type: 'GENERALISTE',
              estAssure: false,
              numTelephone: '',
            },
            prescriptions: [presc],
          },
        } as EnrichedOrientation;
      })
    );
    return enriched;
  } catch (err) {
    console.error('Failed to load enriched orientations:', err);
    return [];
  }
};

