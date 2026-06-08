import { Assure, Medecin, Consultation, Prescription, FeuillemMaladie, Remboursement, User } from '@/types';

export const mockUsers: User[] = [
  { id: 1, nom: 'M. Administrator', email: 'admin@csi.cm', role: 'ADMIN', avatarInitiales: 'AD' },
  { id: 2, nom: 'Jean-Marc Fosso', email: 'jean.fosso@gmail.com', role: 'ASSURE', avatarInitiales: 'JF' },
  { id: 3, nom: 'Dr. Célestin Etoa', email: 'etoa@csi.cm', role: 'GENERALISTE', avatarInitiales: 'CE' },
  { id: 4, nom: 'Dr. Thérèse Ngo', email: 'ngo@csi.cm', role: 'SPECIALISTE', avatarInitiales: 'TN' },
];

export const mockMedecins: Medecin[] = [
  { id: 3, nom: 'Dr. Célestin Etoa', matricule: 'MED-GEN-001', type: 'GENERALISTE', estAssure: false, numTelephone: '+237 677 89 45 12' },
  { id: 10, nom: 'Dr. Samuel Tchoutouo', matricule: 'MED-GEN-002', type: 'GENERALISTE', estAssure: false, numTelephone: '+237 699 12 34 56' },
  { id: 11, nom: 'Dr. Alice Ondoua', matricule: 'MED-GEN-003', type: 'GENERALISTE', estAssure: false, numTelephone: '+237 655 43 21 09' },
  { id: 4, nom: 'Dr. Thérèse Ngo', matricule: 'MED-SPC-001', type: 'SPECIALISTE', domaineSpecialisation: 'Cardiologie', estAssure: false, numTelephone: '+237 691 88 77 66' },
  { id: 12, nom: 'Dr. Jean-Pierre Belinga', matricule: 'MED-SPC-002', type: 'SPECIALISTE', domaineSpecialisation: 'Pédiatrie', estAssure: false, numTelephone: '+237 671 22 33 44' },
  { id: 13, nom: 'Dr. Marie Mbarga', matricule: 'MED-SPC-003', type: 'SPECIALISTE', domaineSpecialisation: 'Gynécologie', estAssure: false, numTelephone: '+237 680 55 66 77' },
];

export const mockAssures: Assure[] = [
  {
    id: 2,
    idAssure: 'ASS-2025-0981',
    nom: 'Jean-Marc Fosso',
    dateNaissance: '1990-05-14',
    sexe: 'Homme',
    profession: 'Enseignant',
    statutMatrimoniale: 'Marié',
    groupeSanguin: 'O+',
    numTelephone: '+237 694 55 11 22',
    medecinTraitant: mockMedecins[0]
  },
  {
    id: 5,
    idAssure: 'ASS-2025-1042',
    nom: 'Chantal Bella',
    dateNaissance: '1985-11-23',
    sexe: 'Femme',
    profession: 'Comptable',
    statutMatrimoniale: 'Célibataire',
    groupeSanguin: 'A+',
    numTelephone: '+237 673 44 88 99',
    medecinTraitant: mockMedecins[0]
  },
  {
    id: 6,
    idAssure: 'ASS-2025-1563',
    nom: 'Marc-Aurèle Tchamo',
    dateNaissance: '1998-02-03',
    sexe: 'Homme',
    profession: 'Étudiant',
    statutMatrimoniale: 'Célibataire',
    groupeSanguin: 'B-',
    numTelephone: '+237 651 22 99 00',
    medecinTraitant: mockMedecins[1]
  },
  {
    id: 7,
    idAssure: 'ASS-2025-2341',
    nom: 'Bernadette Ngo Nack',
    dateNaissance: '1974-08-30',
    sexe: 'Femme',
    profession: 'Infirmière',
    statutMatrimoniale: 'Mariée',
    groupeSanguin: 'AB+',
    numTelephone: '+237 690 11 22 33',
    medecinTraitant: mockMedecins[2]
  },
  {
    id: 8,
    idAssure: 'ASS-2025-3490',
    nom: 'Paul Biya II',
    dateNaissance: '2001-10-10',
    sexe: 'Homme',
    profession: 'Développeur',
    statutMatrimoniale: 'Célibataire',
    groupeSanguin: 'O-',
    numTelephone: '+237 688 88 88 88',
    medecinTraitant: undefined
  }
];

export const mockPrescriptions: Prescription[] = [
  { id: 1, consultationId: 1, type: 'MEDICAMENT', medicament: 'Paracétamol 500mg', posologie: '1 comp, 3 fois par jour pendant 5 jours' },
  { id: 2, consultationId: 1, type: 'MEDICAMENT', medicament: 'Amoxicilline 1g', posologie: '1 comp, 2 fois par jour pendant 7 jours' },
  { id: 3, consultationId: 2, type: 'CONSULTATION_SPECIALISTE', matriculeMedecin: 'MED-SPC-001', motif: 'Évaluation cardiologique pour hypertension artérielle modérée' },
  { id: 4, consultationId: 3, type: 'MEDICAMENT', medicament: 'Artemether + Lumefantrine (Coartem)', posologie: '1 dose matin et soir pendant 3 jours' },
  { id: 5, consultationId: 4, type: 'MEDICAMENT', medicament: 'Spasfon', posologie: '2 comprimés en cas de crise' }
];

export const mockFeuilles: FeuillemMaladie[] = [
  { id: 1, idFeuille: 'FM-98402-25', montantSoin: 15000, estRembourse: true, consultationId: 1 },
  { id: 2, idFeuille: 'FM-10842-25', montantSoin: 25000, estRembourse: false, consultationId: 2 },
  { id: 3, idFeuille: 'FM-77412-25', montantSoin: 8500, estRembourse: true, consultationId: 3 },
  { id: 4, idFeuille: 'FM-88941-25', montantSoin: 12000, estRembourse: false, consultationId: 4 }
];

export const mockRemboursements: Remboursement[] = [
  { id: 1, montant: 15000, dateRemboursement: '2026-05-18', modePaiement: 'VIREMENT', feuilleMaladieId: 1 },
  { id: 2, montant: 6800, dateRemboursement: '2026-06-02', modePaiement: 'CASH', feuilleMaladieId: 3 }
];

// link objects
mockFeuilles[0].remboursement = mockRemboursements[0];
mockFeuilles[2].remboursement = mockRemboursements[1];

export const mockConsultations: Consultation[] = [
  {
    id: 1,
    date: '2026-05-15T10:30:00Z',
    assure: mockAssures[0], // Jean-Marc Fosso
    generaliste: mockMedecins[0], // Dr. Etoa
    prescriptions: [mockPrescriptions[0], mockPrescriptions[1]],
    feuilleMaladie: mockFeuilles[0]
  },
  {
    id: 2,
    date: '2026-05-28T14:00:00Z',
    assure: mockAssures[1], // Chantal Bella
    generaliste: mockMedecins[0], // Dr. Etoa
    prescriptions: [mockPrescriptions[2]],
    feuilleMaladie: mockFeuilles[1]
  },
  {
    id: 3,
    date: '2026-06-01T09:15:00Z',
    assure: mockAssures[2], // Marc-Aurèle Tchamo
    generaliste: mockMedecins[1], // Dr. Tchoutouo
    prescriptions: [mockPrescriptions[3]],
    feuilleMaladie: mockFeuilles[2]
  },
  {
    id: 4,
    date: '2026-06-05T11:45:00Z',
    assure: mockAssures[0], // Jean-Marc Fosso
    generaliste: mockMedecins[0], // Dr. Etoa
    prescriptions: [mockPrescriptions[4]],
    feuilleMaladie: mockFeuilles[3]
  }
];
