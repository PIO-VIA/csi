'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
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
  PenLine,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';

const SIDEBAR_WIDTH = 256;

function getRoleHome(role: string) {
  if (role === 'ADMIN') return '/admin';
  return '/medecin';
}

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const MEDECIN_NAV: NavItem[] = [
  { label: 'Tableau de bord', href: '/medecin', icon: LayoutDashboard },
  { label: 'Mes patients', href: '/medecin/patients', icon: Users },
  { label: 'Consultations', href: '/medecin/consultations', icon: Calendar },
  { label: 'Prescriptions', href: '/medecin/prescriptions', icon: Pill },
  { label: 'Feuilles de maladie', href: '/medecin/feuilles', icon: FileText },
];

const ADMIN_MAIN_NAV: NavItem[] = [
  { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard },
  { label: 'Consultations', href: '/admin/consultations', icon: Calendar },
  { label: 'Remboursements', href: '/admin/remboursements', icon: CreditCard },
];

const ADMIN_SECONDARY_NAV: NavItem[] = [
  { label: 'Assurés', href: '/admin/assures', icon: Users },
  { label: 'Médecins', href: '/admin/medecins', icon: Stethoscope },
  { label: 'Feuilles de maladie', href: '/admin/feuilles', icon: FileText },
];

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'gmail-nav-item group',
        isActive && 'gmail-nav-item-active'
      )}
    >
      <span className="gmail-nav-icon">
        <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
      </span>
      <span className="gmail-nav-label">{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const role = user.role;
  const homeHref = getRoleHome(role);
  const close = () => setIsOpen(false);

  const isActive = (href: string) =>
    pathname === href || (href !== homeHref && pathname.startsWith(href + '/'));

  const compose =
    role === 'ADMIN'
      ? { label: 'Nouvel assuré', href: '/admin/assures', icon: UserPlus }
      : role === 'GENERALISTE' || role === 'SPECIALISTE'
        ? { label: 'Nouvelle consultation', href: '/medecin/consultations/nouvelle', icon: PenLine }
        : null;

  const SidebarContent = () => (
    <div className="gmail-sidebar flex flex-col h-full">
      {/* En-tête compact — style Gmail */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1 shrink-0">
        <Link href={homeHref} className="flex items-center gap-2.5 px-2 py-2 rounded-full hover:bg-[#e8eaed] transition-colors min-w-0">
          <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
            <Shield className="h-[18px] w-[18px] text-white" />
          </div>
          <span className="font-display font-semibold text-[15px] text-[#1f1f1f] tracking-tight truncate">
            CSI
          </span>
        </Link>
        <button
          onClick={close}
          className="lg:hidden p-2 rounded-full text-[#444746] hover:bg-[#e8eaed] transition"
          aria-label="Fermer le menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Bouton action — équivalent « Rédiger » */}
      {compose && (
        <div className="px-3 py-3 shrink-0">
          <Link
            href={compose.href}
            onClick={close}
            className="gmail-compose-btn"
          >
            <compose.icon size={20} strokeWidth={2} />
            <span>{compose.label}</span>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {role === 'ADMIN' && (
          <>
            {ADMIN_MAIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onNavigate={close}
              />
            ))}

            <div className="gmail-sidebar-divider" />

            <p className="gmail-sidebar-section-title">Gestion</p>
            {ADMIN_SECONDARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onNavigate={close}
              />
            ))}
          </>
        )}

        {(role === 'GENERALISTE' || role === 'SPECIALISTE') &&
          MEDECIN_NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onNavigate={close}
            />
          ))}
      </nav>

      {/* Pied de page */}
      <div className="px-3 py-3 shrink-0 border-t border-[#e0e0e0]">
        <button
          onClick={logout}
          className="gmail-nav-item w-full text-[#444746] hover:text-[#1f1f1f]"
        >
          <span className="gmail-nav-icon">
            <LogOut size={20} strokeWidth={1.75} />
          </span>
          <span className="gmail-nav-label">Déconnexion</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Menu mobile */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-full bg-white text-[#444746] hover:bg-[#f1f3f4] transition shadow-sm border border-[#e0e0e0]"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Desktop */}
      <aside
        className="hidden lg:block fixed top-0 left-0 bottom-0 z-30"
        style={{ width: SIDEBAR_WIDTH }}
      >
        <SidebarContent />
      </aside>

      {/* Drawer mobile */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={close}
            aria-hidden
          />
          <div
            className="relative z-50 h-full animate-slide-in-left shadow-xl"
            style={{ width: SIDEBAR_WIDTH }}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
}

export const SIDEBAR_WIDTH_PX = SIDEBAR_WIDTH;

export default Sidebar;
