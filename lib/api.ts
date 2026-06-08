import axios from 'axios';
import { Assure, Medecin, Consultation, Prescription, FeuillemMaladie, Remboursement, User } from '@/types';
import * as mock from './mockData';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Helper to check if we are running in the browser
const isClient = typeof window !== 'undefined';

// Local storage keys
const KEYS = {
  USERS: 'csi_users',
  ASSURES: 'csi_assures',
  MEDECINS: 'csi_medecins',
  CONSULTATIONS: 'csi_consultations',
  PRESCRIPTIONS: 'csi_prescriptions',
  FEUILLES: 'csi_feuilles',
  REMBOURSEMENTS: 'csi_remboursements'
};

// Seed localStorage with mock data if not already present
function getLocalData<T>(key: string, defaultData: T[]): T[] {
  if (!isClient) return defaultData;
  const item = localStorage.getItem(key);
  if (!item) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(item);
  } catch (e) {
    return defaultData;
  }
}

function setLocalData<T>(key: string, data: T[]): void {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// Initialize local storage states
export const initLocalStorage = () => {
  if (!isClient) return;
  getLocalData(KEYS.USERS, mock.mockUsers);
  getLocalData(KEYS.ASSURES, mock.mockAssures);
  getLocalData(KEYS.MEDECINS, mock.mockMedecins);
  getLocalData(KEYS.CONSULTATIONS, mock.mockConsultations);
  getLocalData(KEYS.PRESCRIPTIONS, mock.mockPrescriptions);
  getLocalData(KEYS.FEUILLES, mock.mockFeuilles);
  getLocalData(KEYS.REMBOURSEMENTS, mock.mockRemboursements);
};

// Fallback logic wrapper
async function requestWithFallback<T>(
  apiCall: () => Promise<{ data: T }>,
  localFallback: () => T
): Promise<{ data: T }> {
  try {
    // Try api call
    return await apiCall();
  } catch (error) {
    // Fall back to local storage
    console.warn('API Request failed, falling back to LocalStorage:', error);
    return { data: localFallback() };
  }
}

// ----------------------------------------------------
// ASSURÉS
// ----------------------------------------------------

export const getAssures = () =>
  requestWithFallback(
    () => api.get<Assure[]>('/assures'),
    () => getLocalData<Assure>(KEYS.ASSURES, mock.mockAssures)
  );

export const getAssureById = (id: number) =>
  requestWithFallback(
    () => api.get<Assure>(`/assures/${id}`),
    () => {
      const list = getLocalData<Assure>(KEYS.ASSURES, mock.mockAssures);
      const res = list.find((a) => a.id === id);
      if (!res) throw new Error('Assuré non trouvé');
      return res;
    }
  );

export const createAssure = (data: Partial<Assure>) =>
  requestWithFallback(
    () => api.post<Assure>('/assures', data),
    () => {
      const list = getLocalData<Assure>(KEYS.ASSURES, mock.mockAssures);
      const newId = list.length > 0 ? Math.max(...list.map(a => a.id)) + 1 : 1;
      const newAssure: Assure = {
        id: newId,
        idAssure: `ASS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        nom: data.nom || '',
        dateNaissance: data.dateNaissance || '',
        sexe: data.sexe || '',
        profession: data.profession || '',
        statutMatrimoniale: data.statutMatrimoniale || '',
        groupeSanguin: data.groupeSanguin || '',
        numTelephone: data.numTelephone || '',
        medecinTraitant: data.medecinTraitant,
      };
      list.push(newAssure);
      setLocalData(KEYS.ASSURES, list);

      // Create matching user account
      const userList = getLocalData<User>(KEYS.USERS, mock.mockUsers);
      userList.push({
        id: newId,
        nom: newAssure.nom,
        email: `${newAssure.nom.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
        role: 'ASSURE',
        avatarInitiales: newAssure.nom.split(' ').map(n => n[0]).join('').toUpperCase()
      });
      setLocalData(KEYS.USERS, userList);

      return newAssure;
    }
  );

export const updateAssure = (id: number, data: Partial<Assure>) =>
  requestWithFallback(
    () => api.put<Assure>(`/assures/${id}`, data),
    () => {
      const list = getLocalData<Assure>(KEYS.ASSURES, mock.mockAssures);
      const index = list.findIndex(a => a.id === id);
      if (index === -1) throw new Error('Assuré non trouvé');
      
      const updated = { ...list[index], ...data };
      list[index] = updated;
      setLocalData(KEYS.ASSURES, list);
      return updated;
    }
  );

export const choisirMedecin = (assureId: number, genId: number) =>
  requestWithFallback(
    () => api.patch<Assure>(`/assures/${assureId}/choisir-medecin/${genId}`),
    () => {
      const list = getLocalData<Assure>(KEYS.ASSURES, mock.mockAssures);
      const medecins = getLocalData<Medecin>(KEYS.MEDECINS, mock.mockMedecins);
      const medecin = medecins.find(m => m.id === genId);
      
      const index = list.findIndex(a => a.id === assureId);
      if (index === -1) throw new Error('Assuré non trouvé');
      
      list[index].medecinTraitant = medecin;
      setLocalData(KEYS.ASSURES, list);

      // update consultations too
      const consultations = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations);
      consultations.forEach(c => {
        if (c.assure.id === assureId) {
          c.assure.medecinTraitant = medecin;
        }
      });
      setLocalData(KEYS.CONSULTATIONS, consultations);

      return list[index];
    }
  );

export const choisirMedecinTraitant = choisirMedecin;

// ----------------------------------------------------
// MÉDECINS
// ----------------------------------------------------

export const getMedecins = () =>
  requestWithFallback(
    () => api.get<Medecin[]>('/medecins'),
    () => getLocalData<Medecin>(KEYS.MEDECINS, mock.mockMedecins)
  );

export const getGeneralistes = () =>
  requestWithFallback(
    () => api.get<Medecin[]>('/generalistes'),
    () => getLocalData<Medecin>(KEYS.MEDECINS, mock.mockMedecins).filter(m => m.type === 'GENERALISTE')
  );

export const getSpecialistes = () =>
  requestWithFallback(
    () => api.get<Medecin[]>('/specialistes'),
    () => getLocalData<Medecin>(KEYS.MEDECINS, mock.mockMedecins).filter(m => m.type === 'SPECIALISTE')
  );

export const createMedecin = (data: Partial<Medecin>) =>
  requestWithFallback(
    () => api.post<Medecin>('/medecins', data),
    () => {
      const list = getLocalData<Medecin>(KEYS.MEDECINS, mock.mockMedecins);
      const newId = list.length > 0 ? Math.max(...list.map(m => m.id)) + 1 : 3;
      const codeType = data.type === 'SPECIALISTE' ? 'SPC' : 'GEN';
      const count = list.filter(m => m.type === data.type).length + 1;
      
      const newMedecin: Medecin = {
        id: newId,
        nom: data.nom || '',
        matricule: `MED-${codeType}-${count.toString().padStart(3, '0')}`,
        type: data.type || 'GENERALISTE',
        domaineSpecialisation: data.domaineSpecialisation,
        estAssure: false,
        numTelephone: data.numTelephone || '',
      };
      
      list.push(newMedecin);
      setLocalData(KEYS.MEDECINS, list);

      // Create matching user account
      const userList = getLocalData<User>(KEYS.USERS, mock.mockUsers);
      userList.push({
        id: newId,
        nom: newMedecin.nom,
        email: `${newMedecin.nom.toLowerCase().replace(/\s+/g, '.')}@csi.cm`,
        role: newMedecin.type,
        avatarInitiales: newMedecin.nom.split(' ').filter(x => !x.includes('.')).map(n => n[0]).join('').toUpperCase()
      });
      setLocalData(KEYS.USERS, userList);

      return newMedecin;
    }
  );

// ----------------------------------------------------
// CONSULTATIONS
// ----------------------------------------------------

export const getConsultations = () =>
  requestWithFallback(
    () => api.get<Consultation[]>('/consultations'),
    () => getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations)
  );

export const createConsultation = (data: any) =>
  requestWithFallback(
    () => api.post<Consultation>('/consultations', data),
    () => {
      // data contains: assureId, generalisteId (or current medecin), date, prescriptions: Array, registerFeuille, montantSoin, idFeuille
      const list = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations);
      const assures = getLocalData<Assure>(KEYS.ASSURES, mock.mockAssures);
      const medecins = getLocalData<Medecin>(KEYS.MEDECINS, mock.mockMedecins);
      
      const assureObj = assures.find(a => a.id === Number(data.assureId));
      const medecinObj = medecins.find(m => m.id === Number(data.generalisteId));

      if (!assureObj || !medecinObj) throw new Error('Assuré ou médecin non trouvé');

      const newConsId = list.length > 0 ? Math.max(...list.map(c => c.id)) + 1 : 1;
      
      // Build prescriptions
      const newPrescriptions: Prescription[] = [];
      const localPrescriptions = getLocalData<Prescription>(KEYS.PRESCRIPTIONS, mock.mockPrescriptions);
      
      if (data.prescriptions && Array.isArray(data.prescriptions)) {
        data.prescriptions.forEach((p: any, idx: number) => {
          const presId = localPrescriptions.length > 0 ? Math.max(...localPrescriptions.map(pr => pr.id)) + 1 + idx : 1 + idx;
          const newP: Prescription = {
            id: presId,
            consultationId: newConsId,
            type: p.type,
            medicament: p.medicament,
            posologie: p.posologie,
            matriculeMedecin: p.matriculeMedecin,
            motif: p.motif
          };
          newPrescriptions.push(newP);
          localPrescriptions.push(newP);
        });
        setLocalData(KEYS.PRESCRIPTIONS, localPrescriptions);
      }

      // Build Sheet if active
      let feuilleObj: FeuillemMaladie | undefined = undefined;
      if (data.registerFeuille) {
        const feuilles = getLocalData<FeuillemMaladie>(KEYS.FEUILLES, mock.mockFeuilles);
        const fId = feuilles.length > 0 ? Math.max(...feuilles.map(f => f.id)) + 1 : 1;
        feuilleObj = {
          id: fId,
          idFeuille: data.idFeuille || `FM-${Math.floor(10000 + Math.random() * 90000)}-26`,
          montantSoin: Number(data.montantSoin) || 0,
          estRembourse: false,
          consultationId: newConsId
        };
        feuilles.push(feuilleObj);
        setLocalData(KEYS.FEUILLES, feuilles);
      }

      const newConsultation: Consultation = {
        id: newConsId,
        date: data.date || new Date().toISOString(),
        assure: assureObj,
        generaliste: medecinObj,
        prescriptions: newPrescriptions,
        feuilleMaladie: feuilleObj
      };

      list.push(newConsultation);
      setLocalData(KEYS.CONSULTATIONS, list);
      return newConsultation;
    }
  );

export const getConsultationsByAssure = (id: number) =>
  requestWithFallback(
    () => api.get<Consultation[]>(`/consultations/assure/${id}`),
    () => getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations).filter(c => c.assure.id === id)
  );

export const getConsultationsByGeneraliste = (id: number) =>
  requestWithFallback(
    () => api.get<Consultation[]>(`/consultations/generaliste/${id}`),
    () => getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations).filter(c => c.generaliste.id === id)
  );

export const getConsultationsByMedecin = getConsultationsByGeneraliste;

// ----------------------------------------------------
// PRESCRIPTIONS
// ----------------------------------------------------

export const prescrireMedicament = (data: any) =>
  requestWithFallback(
    () => api.post<Prescription>('/prescriptions/medicament', data),
    () => {
      const list = getLocalData<Prescription>(KEYS.PRESCRIPTIONS, mock.mockPrescriptions);
      const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
      const newP: Prescription = {
        id: newId,
        consultationId: data.consultationId,
        type: 'MEDICAMENT',
        medicament: data.medicament,
        posologie: data.posologie
      };
      list.push(newP);
      setLocalData(KEYS.PRESCRIPTIONS, list);
      
      // Update consultation details
      const consultations = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations);
      const cIdx = consultations.findIndex(c => c.id === data.consultationId);
      if (cIdx !== -1) {
        consultations[cIdx].prescriptions = consultations[cIdx].prescriptions || [];
        consultations[cIdx].prescriptions.push(newP);
        setLocalData(KEYS.CONSULTATIONS, consultations);
      }
      
      return newP;
    }
  );

export const prescrireConsultation = (data: any) =>
  requestWithFallback(
    () => api.post<Prescription>('/prescriptions/consultation', data),
    () => {
      const list = getLocalData<Prescription>(KEYS.PRESCRIPTIONS, mock.mockPrescriptions);
      const newId = list.length > 0 ? Math.max(...list.map(p => p.id)) + 1 : 1;
      const newP: Prescription = {
        id: newId,
        consultationId: data.consultationId,
        type: 'CONSULTATION_SPECIALISTE',
        matriculeMedecin: data.matriculeMedecin,
        motif: data.motif
      };
      list.push(newP);
      setLocalData(KEYS.PRESCRIPTIONS, list);
      
      // Update consultation details
      const consultations = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations);
      const cIdx = consultations.findIndex(c => c.id === data.consultationId);
      if (cIdx !== -1) {
        consultations[cIdx].prescriptions = consultations[cIdx].prescriptions || [];
        consultations[cIdx].prescriptions.push(newP);
        setLocalData(KEYS.CONSULTATIONS, consultations);
      }

      return newP;
    }
  );

// ----------------------------------------------------
// FEUILLES MALADIE
// ----------------------------------------------------

export const createFeuille = (data: any) =>
  requestWithFallback(
    () => api.post<FeuillemMaladie>('/feuilles-maladie', data),
    () => {
      const list = getLocalData<FeuillemMaladie>(KEYS.FEUILLES, mock.mockFeuilles);
      const newId = list.length > 0 ? Math.max(...list.map(f => f.id)) + 1 : 1;
      const newF: FeuillemMaladie = {
        id: newId,
        idFeuille: data.idFeuille || `FM-${Math.floor(10000 + Math.random() * 90000)}-26`,
        montantSoin: Number(data.montantSoin) || 0,
        estRembourse: false,
        consultationId: data.consultationId
      };
      list.push(newF);
      setLocalData(KEYS.FEUILLES, list);

      // Link it to the consultation
      const consultations = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations);
      const idx = consultations.findIndex(c => c.id === data.consultationId);
      if (idx !== -1) {
        consultations[idx].feuilleMaladie = newF;
        setLocalData(KEYS.CONSULTATIONS, consultations);
      }

      return newF;
    }
  );

export const getFeuillesByAssure = (id: number) =>
  requestWithFallback(
    () => api.get<FeuillemMaladie[]>(`/feuilles-maladie/assure/${id}`),
    () => {
      const consultations = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations).filter(c => c.assure.id === id);
      const consIds = consultations.map(c => c.id);
      return getLocalData<FeuillemMaladie>(KEYS.FEUILLES, mock.mockFeuilles).filter(f => consIds.includes(f.consultationId));
    }
  );

export const getFeuilles = () =>
  requestWithFallback(
    () => api.get<FeuillemMaladie[]>('/feuilles-maladie'),
    () => getLocalData<FeuillemMaladie>(KEYS.FEUILLES, mock.mockFeuilles)
  );

// ----------------------------------------------------
// REMBOURSEMENTS
// ----------------------------------------------------

export const getRemboursements = () =>
  requestWithFallback(
    () => api.get<Remboursement[]>('/remboursements'),
    () => getLocalData<Remboursement>(KEYS.REMBOURSEMENTS, mock.mockRemboursements)
  );


export const effectuerRemboursement = (feuilleId: number, mode: string) =>
  requestWithFallback(
    () => api.post<Remboursement>(`/remboursements/${feuilleId}?modePaiement=${mode}`),
    () => {
      const list = getLocalData<Remboursement>(KEYS.REMBOURSEMENTS, mock.mockRemboursements);
      const feuilles = getLocalData<FeuillemMaladie>(KEYS.FEUILLES, mock.mockFeuilles);
      
      const fIdx = feuilles.findIndex(f => f.id === feuilleId);
      if (fIdx === -1) throw new Error('Feuille de maladie non trouvée');
      
      if (feuilles[fIdx].estRembourse) throw new Error('Feuille de maladie déjà remboursée');

      const isSpecialistConsultation = false; 
      // Consultations with specialist: 80% reimbursement, Generalist: 100% reimbursement
      // Let's inspect the consultation
      const consultations = getLocalData<Consultation>(KEYS.CONSULTATIONS, mock.mockConsultations);
      const consultation = consultations.find(c => c.id === feuilles[fIdx].consultationId);
      
      let rate = 1.0;
      if (consultation && consultation.generaliste.type === 'SPECIALISTE') {
        rate = 0.8;
      }
      
      const rembId = list.length > 0 ? Math.max(...list.map(r => r.id)) + 1 : 1;
      const refundAmount = Math.round(feuilles[fIdx].montantSoin * rate);
      
      const newRemb: Remboursement = {
        id: rembId,
        montant: refundAmount,
        dateRemboursement: new Date().toISOString().split('T')[0],
        modePaiement: (mode as 'VIREMENT' | 'CASH') || 'VIREMENT',
        feuilleMaladieId: feuilleId
      };
      
      list.push(newRemb);
      setLocalData(KEYS.REMBOURSEMENTS, list);
      
      // Update feuille
      feuilles[fIdx].estRembourse = true;
      feuilles[fIdx].remboursement = newRemb;
      setLocalData(KEYS.FEUILLES, feuilles);

      // update consultations too
      const cIdx = consultations.findIndex(c => c.id === feuilles[fIdx].consultationId);
      if (cIdx !== -1) {
        consultations[cIdx].feuilleMaladie = feuilles[fIdx];
        setLocalData(KEYS.CONSULTATIONS, consultations);
      }

      return newRemb;
    }
  );
