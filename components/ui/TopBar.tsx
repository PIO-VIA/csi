'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Avatar from './Avatar';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, Settings, User, Globe, ChevronRight, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();

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

  const getProfileLink = () => {
    if (user.role === 'ADMIN') return '/admin/profil';
    return '/medecin/profil';
  };

  const getHomeLink = () => {
    if (user.role === 'ADMIN') return '/admin';
    return '/medecin';
  };

  return (
    <header className="sticky top-0 z-20 h-16 w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/75 backdrop-blur-md border-b border-slate-200/50 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left side: Breadcrumb & Title */}
      <div className="flex items-center gap-2 pl-10 lg:pl-0 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-display font-medium mb-0.5">
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase">
              {getRoleLabel()}
            </span>
            <ChevronRight size={10} className="text-slate-300 shrink-0" />
            <span className="text-primary-600 font-semibold truncate hover:underline cursor-pointer" onClick={() => router.push(getProfileLink())}>
              {getPageTitle()}
            </span>
          </div>
          <h2 className="font-display font-extrabold text-base text-slate-800 tracking-tight truncate flex items-center gap-2">
            <span>{getPageTitle()}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Language button */}
        <button
          onClick={() => {
            const nextLang = i18n.language?.startsWith('fr') ? 'en' : 'fr';
            i18n.changeLanguage(nextLang);
          }}
          className="h-9 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-display font-bold uppercase tracking-wider text-slate-600 hover:text-primary-600 hover:border-primary-200 transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
          title="Changer la langue / Change language"
        >
          <Globe size={13} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
          <span>{i18n.language?.startsWith('fr') ? 'FR' : 'EN'}</span>
        </button>

        {/* User profile dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 focus:outline-none cursor-pointer group p-0.5 rounded-full border border-slate-200/60 bg-slate-50 hover:bg-white hover:border-primary-300 transition-all duration-200 active:scale-95 shadow-sm">
              <Avatar
                nom={user.nom}
                initials={user.avatarInitiales}
                src={user.photoUrl}
                size="sm"
                className="ring-2 ring-transparent group-hover:ring-primary-100 transition duration-200"
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="z-50 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-fade-in"
              align="end"
              sideOffset={8}
            >
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1.5">
                <p className="font-display font-bold text-xs text-slate-800 truncate leading-none">{user.nom}</p>
                <p className="text-[10px] font-body text-slate-400 truncate mt-1 leading-none">{user.email}</p>
              </div>

              <DropdownMenu.Item
                onClick={() => router.push(getProfileLink())}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-display font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition outline-none cursor-pointer"
              >
                <User size={14} className="text-slate-400" />
                <span>Mon profil</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onClick={() => router.push(getProfileLink())}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-display font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition outline-none cursor-pointer"
              >
                <Settings size={14} className="text-slate-400" />
                <span>Paramètres</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                onClick={() => router.push(getHomeLink())}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-display font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition outline-none cursor-pointer"
              >
                <Layout size={14} className="text-slate-400" />
                <span>Tableau de bord</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-slate-100 my-1.5" />

              <DropdownMenu.Item
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-display font-semibold text-danger hover:bg-danger/10 rounded-xl transition outline-none cursor-pointer"
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
