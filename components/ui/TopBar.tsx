'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Avatar from './Avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Bell, LogOut, Settings, User, Globe, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function TopBar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Nouveau remboursement validé (15 000 FCFA)', time: 'Il y a 10 min', read: false },
    { id: 2, text: 'Dr. Etoa a enregistré une nouvelle consultation', time: 'Il y a 1h', read: false },
    { id: 3, text: 'Rappel: Votre médecin traitant a changé', time: 'Hier', read: true },
  ]);

  if (!user) return null;

  const isEn = i18n.language?.startsWith('en');

  const getPageTitle = () => {
    if (pathname === '/admin') return isEn ? 'Admin Dashboard' : 'Tableau de bord';
    if (pathname === '/admin/assures') return isEn ? 'Manage Insured Citizens' : 'Gestion des assurés';
    if (pathname.startsWith('/admin/assures/') && pathname !== '/admin/assures')
      return isEn ? 'Assurés > Détail' : 'Assurés > Détail';
    if (pathname === '/admin/medecins') return isEn ? 'Manage Doctors' : 'Gestion des médecins';
    if (pathname === '/admin/consultations') return isEn ? 'Consultations' : 'Consultations';
    if (pathname === '/admin/feuilles') return isEn ? 'Health Sheets' : 'Feuilles de maladie';
    if (pathname === '/admin/remboursements') return isEn ? 'Reimbursements' : 'Remboursements';

    if (pathname === '/assure') return isEn ? 'My Health Portal' : 'Mon espace santé';
    if (pathname === '/assure/consultations') return isEn ? 'My Consultations' : 'Mes consultations';
    if (pathname === '/assure/prescriptions') return isEn ? 'My Prescriptions' : 'Mes prescriptions';
    if (pathname === '/assure/feuilles') return isEn ? 'My Health Sheets' : 'Mes feuilles de maladie';
    if (pathname === '/assure/remboursements') return isEn ? 'My Reimbursements' : 'Mes remboursements';
    if (pathname === '/assure/medecin') return isEn ? 'My Family Physician' : 'Mon médecin traitant';

    if (pathname === '/medecin') return isEn ? 'Medical Dashboard' : 'Tableau de bord médical';
    if (pathname === '/medecin/patients') return isEn ? 'Patients' : 'Mes patients';
    if (pathname === '/medecin/consultations') return isEn ? 'Consultations' : 'Consultations';
    if (pathname === '/medecin/consultations/nouvelle') return isEn ? 'New Consultation' : 'Nouvelle consultation';
    if (pathname === '/medecin/prescriptions') return isEn ? 'Prescriptions' : 'Prescriptions';
    if (pathname === '/medecin/feuilles') return isEn ? 'Health Sheets' : 'Feuilles de maladie';

    return isEn ? 'Personal Space' : 'Espace personnel';
  };

  const getRoleLabel = () => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      ASSURE: 'Assuré',
      GENERALISTE: 'Médecin',
      SPECIALISTE: 'Médecin',
    };
    return labels[user.role] || user.role;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="sticky top-0 z-20 h-[4.25rem] w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/90 backdrop-blur-lg border-b border-slate-200/70 shadow-sm">
      <div className="flex items-center gap-2 pl-10 lg:pl-0 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-display mb-0.5">
            <span className="truncate">{getRoleLabel()}</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-primary-600 font-semibold truncate">{getPageTitle()}</span>
          </div>
          <h2 className="font-display font-bold text-lg text-slate-900 tracking-tight truncate">
            {getPageTitle()}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => {
            const nextLang = i18n.language?.startsWith('fr') ? 'en' : 'fr';
            i18n.changeLanguage(nextLang);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[10px] font-display font-bold uppercase tracking-wider text-slate-600 hover:text-primary-600 hover:border-primary-200 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Globe size={11} />
          <span>{i18n.language?.startsWith('fr') ? 'FR' : 'EN'}</span>
        </button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer">
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 bg-danger text-[9px] font-display font-bold text-white rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              align="end"
              sideOffset={8}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                <span className="font-display font-semibold text-xs text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-body text-primary-600 hover:underline cursor-pointer"
                  >
                    {t('dashboard.notifications.mark_all_read') || 'Tout marquer lu'}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Aucune notification
                  </p>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-2.5 rounded-xl flex flex-col gap-1 transition',
                      n.read
                        ? 'hover:bg-slate-50'
                        : 'bg-primary-50/60 hover:bg-primary-50 border-l-2 border-primary-500'
                    )}
                  >
                    <p className="text-xs font-body text-slate-700 leading-normal">{n.text}</p>
                    <span className="text-[9px] font-body text-slate-400">{n.time}</span>
                  </div>
                ))}
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 focus:outline-none cursor-pointer group pl-1">
              <Avatar
                nom={user.nom}
                initials={user.avatarInitiales}
                src={user.photoUrl}
                size="sm"
                className="ring-2 ring-transparent group-hover:ring-primary-200 transition"
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
              align="end"
              sideOffset={8}
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <p className="font-display font-semibold text-xs text-slate-900 truncate">{user.nom}</p>
                <p className="text-[10px] font-body text-slate-400 truncate">{user.email}</p>
              </div>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs font-display text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition outline-none cursor-pointer">
                <User size={14} />
                <span>Mon profil</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-xs font-display text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition outline-none cursor-pointer">
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
