'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Avatar from './Avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, LogOut, Settings, User, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Nouveau remboursement validé (15 000 FCFA)', time: 'Il y a 10 min', read: false },
    { id: 2, text: 'Dr. Etoa a enregistré une nouvelle consultation', time: 'Il y a 1h', read: false },
    { id: 3, text: 'Rappel: Votre médecin traitant a changé', time: 'Hier', read: true },
  ]);

  if (!user) return null;

  // Resolve page title based on active path
  const getPageTitle = () => {
    const isEn = i18n.language?.startsWith('en');
    if (pathname === '/admin') return isEn ? 'Admin Dashboard' : 'Tableau de Bord';
    if (pathname === '/admin/assures') return isEn ? 'Manage Insured Citizens' : 'Gestion des Assurés';
    if (pathname.startsWith('/admin/assures/')) return isEn ? 'Insured Details' : 'Détails de l\'Assuré';
    if (pathname === '/admin/medecins') return isEn ? 'Manage Medical Practitioners' : 'Gestion des Médecins';
    if (pathname.startsWith('/admin/medecins/')) return isEn ? 'Practitioner Details' : 'Détails du Médecin';
    if (pathname === '/admin/consultations') return isEn ? 'Consultations History' : 'Suivi des Consultations';
    if (pathname === '/admin/feuilles') return isEn ? 'Digital Health Sheets' : 'Feuilles de Maladie';
    if (pathname === '/admin/remboursements') return isEn ? 'Reimbursements and Payments' : 'Remboursements et Paiements';

    if (pathname === '/assure') return isEn ? 'My Health Portal' : 'Mon Espace Santé';
    if (pathname === '/assure/consultations') return isEn ? 'My Consultations' : 'Mes Consultations';
    if (pathname === '/assure/prescriptions') return isEn ? 'My Prescriptions' : 'Mes Prescriptions';
    if (pathname === '/assure/feuilles') return isEn ? 'My Health Sheets' : 'Mes Feuilles de Maladie';
    if (pathname === '/assure/remboursements') return isEn ? 'My Reimbursements' : 'Mes Remboursements';
    if (pathname === '/assure/medecin') return isEn ? 'My Family Physician' : 'Mon Médecin Traitant';

    if (pathname === '/medecin') return isEn ? 'Medical Dashboard' : 'Tableau de Bord Médical';
    if (pathname === '/medecin/patients') return isEn ? 'Patient Roster' : 'Gestion de mes Patients';
    if (pathname === '/medecin/consultations') return isEn ? 'Consultations Archive' : 'Historique des Consultations';
    if (pathname === '/medecin/consultations/nouvelle') return isEn ? 'New Consultation' : 'Nouvelle Consultation';
    if (pathname === '/medecin/prescriptions') return isEn ? 'Issued Prescriptions' : 'Prescriptions & Ordonnances';
    if (pathname === '/medecin/feuilles') return isEn ? 'Filled Health Sheets' : 'Feuilles de Maladie Remplies';

    return isEn ? 'Personal Space' : 'Espace Personnel';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-20 h-16 w-full flex items-center justify-between px-6 bg-white/85 backdrop-blur-md border-b border-slate-200/60">
      {/* Title */}
      <div className="flex items-center gap-4 pl-10 lg:pl-0">
        <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Language Switcher Toggle */}
        <button
          onClick={() => {
            const nextLang = i18n.language?.startsWith('fr') ? 'en' : 'fr';
            i18n.changeLanguage(nextLang);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-display font-extrabold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Globe size={11} className="text-slate-500" />
          <span>{i18n.language?.startsWith('fr') ? 'FR' : 'EN'}</span>
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-danger text-[9px] font-display font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-80 rounded-2xl border border-slate-200/85 bg-white p-2 shadow-2xl animate-in fade-in-0 zoom-in-95"
              align="end"
              sideOffset={8}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                <span className="font-display font-semibold text-xs text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-body text-primary-600 hover:underline cursor-pointer">
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-xs font-body text-slate-400">
                    Aucune notification
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-2.5 rounded-xl flex flex-col gap-1 transition',
                        n.read ? 'hover:bg-slate-50' : 'bg-primary-50/50 hover:bg-primary-50 border-l-2 border-primary-500'
                      )}
                    >
                      <p className="text-xs font-body text-slate-800 leading-normal">{n.text}</p>
                      <span className="text-[9px] font-body text-slate-400">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* User Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 focus:outline-none cursor-pointer group">
              <Avatar nom={user.nom} initials={user.avatarInitiales} size="sm" className="group-hover:border-slate-400 transition duration-200" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-56 rounded-2xl border border-slate-200/85 bg-white p-2 shadow-2xl animate-in fade-in-0 zoom-in-95"
              align="end"
              sideOffset={8}
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <p className="font-display font-semibold text-xs text-slate-900 truncate">{user.nom}</p>
                <p className="text-[10px] font-body text-slate-400 truncate">{user.email}</p>
              </div>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs font-display text-slate-650 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition outline-none cursor-pointer">
                <User size={14} />
                <span>Mon Profil</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs font-display text-slate-650 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition outline-none cursor-pointer">
                <Settings size={14} />
                <span>Paramètres</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-slate-100 my-1" />

              <DropdownMenu.Item
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-xs font-display text-danger hover:bg-danger/10 rounded-lg transition outline-none cursor-pointer"
              >
                <LogOut size={14} />
                <span>Déconnexion</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}

export default TopBar;
