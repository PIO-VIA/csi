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
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Activity,
  Heart,
  Pill,
  UserCheck
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const role = user.role;

  // Define sidebar navigation items based on user role
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Tableau de bord', href: '/admin', icon: <LayoutDashboard size={20} /> },
          { label: 'Assurés', href: '/admin/assures', icon: <Users size={20} /> },
          { label: 'Médecins', href: '/admin/medecins', icon: <Stethoscope size={20} /> },
          { label: 'Consultations', href: '/admin/consultations', icon: <Calendar size={20} /> },
          { label: 'Feuilles de maladie', href: '/admin/feuilles', icon: <FileText size={20} /> },
          { label: 'Remboursements', href: '/admin/remboursements', icon: <CreditCard size={20} /> },
        ];
      case 'ASSURE':
        return [
          { label: 'Mon espace', href: '/assure', icon: <LayoutDashboard size={20} /> },
          { label: 'Mes consultations', href: '/assure/consultations', icon: <Calendar size={20} /> },
          { label: 'Mes prescriptions', href: '/assure/prescriptions', icon: <Pill size={20} /> },
          { label: 'Mes feuilles de maladie', href: '/assure/feuilles', icon: <FileText size={20} /> },
          { label: 'Mes remboursements', href: '/assure/remboursements', icon: <CreditCard size={20} /> },
          { label: 'Mon médecin', href: '/assure/medecin', icon: <UserCheck size={20} /> },
        ];
      case 'GENERALISTE':
      case 'SPECIALISTE':
        const commonItems = [
          { label: 'Mon tableau de bord', href: '/medecin', icon: <LayoutDashboard size={20} /> },
          { label: 'Mes patients', href: '/medecin/patients', icon: <Users size={20} /> },
          { label: 'Mes consultations', href: '/medecin/consultations', icon: <Calendar size={20} /> },
          { label: 'Nouvelle consultation', href: '/medecin/consultations/nouvelle', icon: <Activity size={20} /> },
          { label: 'Prescriptions', href: '/medecin/prescriptions', icon: <Pill size={20} /> },
        ];
        
        if (role === 'GENERALISTE') {
          return [
            ...commonItems,
            { label: 'Feuilles de maladie', href: '/medecin/feuilles', icon: <FileText size={20} /> }
          ];
        }
        return commonItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-slate-800 select-none">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="h-7 w-7 text-primary-600 fill-primary-500/10" />
          <span className="font-display font-bold text-lg tracking-tight text-slate-900">
            CSI Sécurité
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* User block */}
      <div className="px-6 py-5 border-b border-slate-200 flex items-center gap-3">
        <Avatar nom={user.nom} initials={user.avatarInitiales} size="md" />
        <div className="flex flex-col min-w-0">
          <span className="font-display font-semibold text-sm truncate text-slate-800">
            {user.nom}
          </span>
          <span className="text-[10px] font-body text-slate-500 truncate mb-1">
            {user.email}
          </span>
          <RoleBadge role={user.role} className="w-fit scale-90 -ml-1" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        <div className="text-[10px] font-display font-semibold text-slate-400 tracking-wider uppercase px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          // Check active route: exact match or starting with link (excluding dashboard index)
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center gap-3.5 px-3 py-3 rounded-xl font-display text-sm font-medium transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <span className={cn('transition-transform duration-200 group-hover:scale-110', isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-650')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-1">
        <Link
          href="/settings"
          onClick={handleLinkClick}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-display font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <Settings size={16} />
          <span>Paramètres</span>
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-display font-medium text-danger/80 hover:bg-danger/10 hover:text-danger transition cursor-pointer"
        >
          <LogOut size={16} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-white border border-slate-200 text-slate-800 rounded-xl hover:bg-slate-50 transition focus:outline-none"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className="hidden lg:block fixed top-0 left-0 bottom-0 z-30 w-[280px]">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative z-50 w-[280px] h-full animate-slide-in-left">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
