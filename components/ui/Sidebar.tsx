'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import Avatar from './Avatar';
import RoleBadge from './RoleBadge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  FileText,
  CreditCard,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Pill,
} from 'lucide-react';

function getRoleHome(role: string) {
  if (role === 'ADMIN') return '/admin';
  return '/medecin';
}

const MEDECIN_NAV = [
  { label: 'Tableau de bord', href: '/medecin', icon: LayoutDashboard },
  { label: 'Mes patients', href: '/medecin/patients', icon: Users },
  { label: 'Consultations', href: '/medecin/consultations', icon: Calendar },
  { label: 'Nouvelle consultation', href: '/medecin/consultations/nouvelle', icon: Activity },
  { label: 'Prescriptions', href: '/medecin/prescriptions', icon: Pill },
  { label: 'Feuilles de maladie', href: '/medecin/feuilles', icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const role = user.role;
  const homeHref = getRoleHome(role);

  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
          { label: 'Assurés', href: '/admin/assures', icon: Users },
          { label: 'Médecins', href: '/admin/medecins', icon: Stethoscope },
          { label: 'Consultations', href: '/admin/consultations', icon: Calendar },
          { label: 'Feuilles de maladie', href: '/admin/feuilles', icon: FileText },
          { label: 'Remboursements', href: '/admin/remboursements', icon: CreditCard },
        ];
      case 'GENERALISTE':
      case 'SPECIALISTE':
        return MEDECIN_NAV;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 text-slate-800 select-none shadow-sm">
      {/* Header avec gradient */}
      <div className="px-5 py-5 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="flex items-center justify-between">
          <Link href={homeHref} className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-sm tracking-tight text-white block leading-tight">
                CSI Sécurité
              </span>
              <span className="text-[10px] text-primary-100/70">Portail national</span>
            </div>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Profil utilisateur */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <Avatar nom={user.nom} initials={user.avatarInitiales} size="md" />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-display font-semibold text-sm truncate text-slate-800">
            {user.nom}
          </span>
          <span className="text-[10px] font-body text-slate-400 truncate">
            {user.email}
          </span>
          <RoleBadge role={user.role} className="w-fit scale-90 -ml-1 mt-0.5" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto space-y-0.5">
        <div className="text-[10px] font-display font-semibold text-slate-400 tracking-wider uppercase px-3 mb-2">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== homeHref && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl font-display text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-display font-medium text-slate-500 hover:bg-danger/5 hover:text-danger transition cursor-pointer"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition shadow-sm"
        >
          <Menu size={20} />
        </button>
      </div>

      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-30 w-[280px]">
        <SidebarContent />
      </aside>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-50 w-[280px] h-full animate-slide-in-left shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
