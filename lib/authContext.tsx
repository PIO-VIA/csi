'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types';
import { initLocalStorage } from './api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  registerUser: (data: {
    nom: string;
    email: string;
    role: UserRole;
    phone: string;
    [key: string]: any;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize and load session on mount
  useEffect(() => {
    initLocalStorage();
    const storedUser = localStorage.getItem('csi_session');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('csi_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, requestedRole?: UserRole): Promise<boolean> => {
    setLoading(true);
    try {
      // Find matching user in csi_users
      const usersStr = localStorage.getItem('csi_users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const foundUser = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && (!requestedRole || u.role === requestedRole)
      );

      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('csi_session', JSON.stringify(foundUser));
        setLoading(false);
        return true;
      }
      
      // If email doesn't exist, search in doctors / patients and create or map
      // For quick demo, if we type a known role-specific prefix or default email, we log in as that:
      let fallbackUser: User | null = null;
      if (email.includes('admin')) {
        fallbackUser = { id: 1, nom: 'M. Administrator', email: 'admin@csi.cm', role: 'ADMIN', avatarInitiales: 'AD' };
      } else if (email.includes('etoa') || email.includes('gen')) {
        fallbackUser = { id: 3, nom: 'Dr. Célestin Etoa', email: 'etoa@csi.cm', role: 'GENERALISTE', avatarInitiales: 'CE' };
      } else if (email.includes('ngo') || email.includes('spec')) {
        fallbackUser = { id: 4, nom: 'Dr. Thérèse Ngo', email: 'ngo@csi.cm', role: 'SPECIALISTE', avatarInitiales: 'TN' };
      } else if (email.includes('fosso') || email.includes('assure')) {
        fallbackUser = { id: 2, nom: 'Jean-Marc Fosso', email: 'jean.fosso@gmail.com', role: 'ASSURE', avatarInitiales: 'JF' };
      }

      if (fallbackUser) {
        // save to users
        const updatedUsers = [...users];
        if (!updatedUsers.some(u => u.email === fallbackUser?.email)) {
          updatedUsers.push(fallbackUser);
          localStorage.setItem('csi_users', JSON.stringify(updatedUsers));
        }
        setUser(fallbackUser);
        localStorage.setItem('csi_session', JSON.stringify(fallbackUser));
        setLoading(false);
        return true;
      }

      setLoading(false);
      return false;
    } catch (error) {
      console.error(error);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('csi_session');
    router.push('/login');
  };

  const registerUser = async (data: {
    nom: string;
    email: string;
    role: UserRole;
    phone: string;
    [key: string]: any;
  }) => {
    // Add user to csi_users
    const usersStr = localStorage.getItem('csi_users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const initiales = data.nom
      .split(' ')
      .filter(x => !x.includes('.'))
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
      
    const newUser: User = {
      id: newId,
      nom: data.nom,
      email: data.email,
      role: data.role,
      avatarInitiales: initiales || 'U',
    };
    
    users.push(newUser);
    localStorage.setItem('csi_users', JSON.stringify(users));

    // Also register in corresponding data table (assurés or médecins)
    if (data.role === 'ASSURE') {
      const assuresStr = localStorage.getItem('csi_assures');
      const assures = assuresStr ? JSON.parse(assuresStr) : [];
      assures.push({
        id: newId,
        idAssure: `ASS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        nom: data.nom,
        dateNaissance: data.dateNaissance || '1995-01-01',
        sexe: data.sexe || 'Homme',
        profession: data.profession || 'Employé',
        statutMatrimoniale: data.statutMatrimoniale || 'Célibataire',
        groupeSanguin: data.groupeSanguin || 'O+',
        numTelephone: data.phone,
      });
      localStorage.setItem('csi_assures', JSON.stringify(assures));
    } else if (data.role === 'GENERALISTE' || data.role === 'SPECIALISTE') {
      const medecinsStr = localStorage.getItem('csi_medecins');
      const medecins = medecinsStr ? JSON.parse(medecinsStr) : [];
      const codeType = data.role === 'SPECIALISTE' ? 'SPC' : 'GEN';
      const count = medecins.filter((m: any) => m.type === data.role).length + 1;
      medecins.push({
        id: newId,
        nom: data.nom,
        matricule: `MED-${codeType}-${count.toString().padStart(3, '0')}`,
        type: data.role,
        domaineSpecialisation: data.domaineSpecialisation,
        estAssure: false,
        numTelephone: data.phone,
      });
      localStorage.setItem('csi_medecins', JSON.stringify(medecins));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
