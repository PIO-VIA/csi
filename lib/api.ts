import '@/lib/openapi-config';
import {
  ApiError,
  AssurSService,
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
  const raw = await AssurSService.getAll2();
  return toList<Record<string, unknown>>(raw).map((item) => mapAssure(item, doctors));
}

async function loadFeuilles(): Promise<FeuillemMaladie[]> {
  const raw = await FeuillesMaladieService.getAll1();
  const feuilles = toList<Record<string, unknown>>(raw).map((item) => mapFeuille(item));

  return Promise.all(
    feuilles.map(async (feuille) => {
      if (!feuille.estRembourse) return feuille;
      try {
        const remb = await RemboursementsService.getById2(feuille.id);
        return mapFeuille(
          {
            id: feuille.id,
            idFeuille: feuille.idFeuille,
            montantSoin: feuille.montantSoin,
            estRembourse: feuille.estRembourse,
            consultationId: feuille.consultationId,
          },
          mapRemboursement(remb as Record<string, unknown>),
        );
      } catch {
        return feuille;
      }
    }),
  );
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
  const feuilleMap = new Map(feuilles.map((f) => [f.consultationId, f]));

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

      return buildConsultation(
        raw,
        assure,
        generaliste,
        prescriptions,
        feuilleMap.get(id),
      );
    }),
  );
}

async function loadAllConsultations(): Promise<Consultation[]> {
  const medecins = await loadMedecins();
  const results = await Promise.all(
    medecins.map((m) => ConsultationsService.getByGeneraliste(m.id)),
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
// ASSURÉS
// ============================================================

export const getAssures = async (): Promise<ApiPayload<Assure[]>> => ({
  data: await loadAssures(),
});

export const getAssureById = async (id: number): Promise<ApiPayload<Assure>> => {
  const medecins = await loadMedecins();
  const raw = await AssurSService.getById(id);
  return { data: mapAssure(raw as Record<string, unknown>, medecins) };
};

export const createAssure = async (data: Partial<Assure>): Promise<ApiPayload<Assure>> => {
  const email =
    (data as { email?: string }).email ??
    `${String(data.nom ?? 'assure')
      .toLowerCase()
      .replace(/\s+/g, '.')}@csi.cm`;

  const payload: AssureRequestDTO = {
    nom: data.nom,
    dateNaissance: data.dateNaissance,
    sexe: data.sexe,
    numTelephone: data.numTelephone,
    profession: data.profession,
    statutMatrimoniale: data.statutMatrimoniale,
    groupeSanguin: data.groupeSanguin,
    email,
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
    numTelephone: data.numTelephone,
    profession: data.profession,
    statutMatrimoniale: data.statutMatrimoniale,
    groupeSanguin: data.groupeSanguin,
  };

  const raw = await AssurSService.update(id, payload);
  const medecins = await loadMedecins();
  return { data: mapAssure(raw as Record<string, unknown>, medecins) };
};

/**
 * Supprime un assuré via le backend (DELETE /api/assures/{id}).
 */
export const deleteAssure = async (id: number): Promise<void> => {
  await AssurSService.delete(id);
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
  const raw = await MDecinsService.getById3(id);
  return { data: mapMedecin(raw as Record<string, unknown>) };
};

export const getGeneralistes = async (): Promise<ApiPayload<Medecin[]>> => {
  const raw = await GNRalistesService.getAll4();
  return { data: toList<Record<string, unknown>>(raw).map(mapMedecin) };
};

export const getSpecialistes = async (): Promise<ApiPayload<Medecin[]>> => {
  const raw = await SpCialistesService.getAll3();
  return { data: toList<Record<string, unknown>>(raw).map(mapMedecin) };
};

export const getGeneralisteById = async (id: number): Promise<ApiPayload<Medecin>> => {
  const raw = await GNRalistesService.getById4(id);
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

export const createMedecin = async (
  data: CreateMedecinInput,
): Promise<ApiPayload<Medecin>> => {
  try {
    const payload: MedecinRequestDTO = {
      nom: data.nom,
      email: data.email,
      numTelephone: data.numTelephone,
      type: data.type,
      domaineSpecialisation: data.domaineSpecialisation,
      motDePasse: randomPassword(),
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

// ============================================================
// CONSULTATIONS
// ============================================================

export const getConsultations = async (): Promise<ApiPayload<Consultation[]>> => ({
  data: await loadAllConsultations(),
});

export const getConsultationById = async (id: number): Promise<ApiPayload<Consultation>> => {
  const raw = await ConsultationsService.getById6(id);
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
  const raw = await ConsultationsService.getByGeneraliste(id);
  return { data: await enrichConsultations(toList<Record<string, unknown>>(raw)) };
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
  const raw = await FeuillesMaladieService.getById5(id);
  return { data: mapFeuille(raw as Record<string, unknown>) };
};

export const getFeuillesByAssure = async (
  id: number,
): Promise<ApiPayload<FeuillemMaladie[]>> => {
  const raw = await FeuillesMaladieService.getByAssure(id);
  const feuilles = toList<Record<string, unknown>>(raw).map((item) => mapFeuille(item));

  const enriched = await Promise.all(
    feuilles.map(async (feuille) => {
      if (!feuille.estRembourse) return feuille;
      try {
        const remb = await RemboursementsService.getById2(feuille.id);
        return mapFeuille(
          {
            id: feuille.id,
            idFeuille: feuille.idFeuille,
            montantSoin: feuille.montantSoin,
            estRembourse: feuille.estRembourse,
            consultationId: feuille.consultationId,
          },
          mapRemboursement(remb as Record<string, unknown>),
        );
      } catch {
        return feuille;
      }
    }),
  );

  return { data: enriched };
};

export const getFeuilles = async (): Promise<ApiPayload<FeuillemMaladie[]>> => ({
  data: await loadFeuilles(),
});

// ============================================================
// REMBOURSEMENTS
// ============================================================

export const getRemboursements = async (): Promise<ApiPayload<Remboursement[]>> => {
  const feuilles = await loadFeuilles();
  const remboursements = await Promise.all(
    feuilles
      .filter((f) => f.estRembourse)
      .map(async (feuille) => {
        if (feuille.remboursement) return feuille.remboursement;
        try {
          const raw = await RemboursementsService.getById2(feuille.id);
          return mapRemboursement(raw as Record<string, unknown>);
        } catch {
          return null;
        }
      }),
  );

  return { data: remboursements.filter((r): r is Remboursement => r != null) };
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
  const raw = await RemboursementsService.effectuer(feuilleId, mode);
  return { data: mapRemboursement(raw as Record<string, unknown>) };
};
