'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '@/types';
import '@/lib/openapi-config';
import '@/lib/i18n';
import { AuthentificationService, MDecinsService } from '@/lib2';
import { getApiErrorMessage } from '@/lib/api';
import {
  asArray,
  initialsFromName,
  mapBackendRole,
  mapMedecin,
} from '@/lib/mappers';

interface SessionUser extends User {
  token: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  registerUser: (data: {
    nom: string;
    email: string;
    role: UserRole;
    phone: string;
    [key: string]: unknown;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function resolveUserFromLogin(
  email: string,
  response: Record<string, unknown>,
): Promise<User> {
  const role = mapBackendRole(String(response.role ?? ''));
  const username = String(response.username ?? email);

  if (role === 'GENERALISTE' || role === 'SPECIALISTE') {
    const medecinsRaw = await MDecinsService.getAll();
    const medecins = asArray<Record<string, unknown>>(medecinsRaw).map(mapMedecin);
    const medecin =
      medecins.find((m) => m.email.toLowerCase() === email.toLowerCase()) ??
      medecins.find((m) => m.matricule === username);

    if (medecin) {
      return {
        id: medecin.id,
        nom: medecin.nom,
        email: medecin.email || email,
        role: medecin.type,
        avatarInitiales: initialsFromName(medecin.nom),
      };
    }
  }

  return {
    id: role === 'ADMIN' ? 1 : 0,
    nom: username,
    email,
    role,
    avatarInitiales: initialsFromName(username),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('csi_session');
    if (storedUser) {
      try {
        const session = JSON.parse(storedUser) as SessionUser;
        const { token: _token, username: _username, ...userData } = session;
        setUser(userData);
      } catch {
        localStorage.removeItem('csi_session');
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
    requestedRole?: UserRole,
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const response = (await AuthentificationService.login({
        username: email,
        password,
      })) as Record<string, unknown>;

      const token = String(response.token ?? '');
      const username = String(response.username ?? email);

      // Stocker le token avant les appels API suivants (profil médecin, etc.)
      localStorage.setItem(
        'csi_session',
        JSON.stringify({ token, username, email, role: mapBackendRole(String(response.role ?? '')) }),
      );

      const userData = await resolveUserFromLogin(email, response);

      if (userData.role === 'ASSURE') {
        localStorage.removeItem('csi_session');
        setLoading(false);
        return false;
      }

      if (requestedRole && userData.role !== requestedRole) {
        localStorage.removeItem('csi_session');
        setLoading(false);
        return false;
      }

      const session: SessionUser = {
        ...userData,
        token,
        username,
      };

      setUser(userData);
      localStorage.setItem('csi_session', JSON.stringify(session));
      setLoading(false);
      return true;
    } catch (error) {
      console.error(getApiErrorMessage(error));
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('csi_session');
    router.push('/');
  };

  const registerUser = async (_data: {
    nom: string;
    email: string;
    role: UserRole;
    phone: string;
    [key: string]: unknown;
  }) => {
    throw new Error('Inscription locale désactivée — utilisez les endpoints backend.');
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
