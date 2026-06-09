'use client';

import React, { useState, createContext, useContext } from 'react';
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
  Pill,
  PenLine,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

export const SIDEBAR_EXPANDED_W = 260;
export const SIDEBAR_COLLAPSED_W = 64;

// Context so layout can read collapsed state
type SidebarCtx = { collapsed: boolean };
export const SidebarContext = createContext<SidebarCtx>({ collapsed: false });
export const useSidebarContext = () => useContext(SidebarContext);

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
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate: () => void;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={cn(
        'sidebar-nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
        isActive
          ? 'sidebar-nav-item-active bg-primary-50 text-primary-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        collapsed ? 'justify-center px-2' : 'justify-start'
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center shrink-0 transition-colors',
          isActive ? 'text-primary-600' : 'text-slate-500 group-hover:text-slate-700'
        )}
      >
        <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
      </span>
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {isActive && !collapsed && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
      )}
      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="sidebar-tooltip pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150">
          {item.label}
        </div>
      )}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-slate-200/80 relative transition-all duration-300 ease-in-out',
        !isMobile && (collapsed ? 'w-16' : 'w-[260px]')
      )}
    >
      {/* Toggle button — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-md text-slate-500 hover:text-primary-600 hover:border-primary-200 transition-all duration-150"
          aria-label={collapsed ? 'Déplier la sidebar' : 'Réduire la sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* Header */}
      <div className={cn('flex items-center pt-4 pb-3 shrink-0 border-b border-slate-100', collapsed && !isMobile ? 'justify-center px-2' : 'justify-between px-4')}>
        <Link
          href={homeHref}
          className={cn(
            'flex items-center gap-2.5 rounded-xl hover:bg-slate-50 transition-colors min-w-0',
            collapsed && !isMobile ? 'p-1.5' : 'px-1 py-1.5'
          )}
        >
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0 shadow-md shadow-primary-200">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <div className="min-w-0">
              <span className="font-display font-bold text-sm text-slate-900 tracking-tight truncate block">
                CSI
              </span>
              <span className="font-body text-[10px] text-slate-400 truncate block leading-none">
                Santé sociale
              </span>
            </div>
          )}
        </Link>
        {isMobile && (
          <button
            onClick={close}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Compose / CTA button */}
      {compose && (!collapsed || isMobile) && (
        <div className="px-4 py-3 shrink-0">
          <Link
            href={compose.href}
            onClick={isMobile ? close : undefined}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium font-display shadow-md shadow-primary-200/60 transition-all duration-150 hover:shadow-lg hover:shadow-primary-200/60 active:scale-[0.98]"
          >
            <compose.icon size={16} strokeWidth={2} />
            <span className="truncate">{compose.label}</span>
          </Link>
        </div>
      )}

      {/* Icon-only compose button */}
      {compose && collapsed && !isMobile && (
        <div className="px-2 py-3 shrink-0 flex justify-center">
          <Link
            href={compose.href}
            title={compose.label}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-200/60 transition-all duration-150 active:scale-95"
          >
            <compose.icon size={18} strokeWidth={2} />
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto py-2 space-y-0.5', collapsed && !isMobile ? 'px-2' : 'px-3')}>
        {role === 'ADMIN' && (
          <>
            {ADMIN_MAIN_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onNavigate={isMobile ? close : () => {}}
                collapsed={collapsed && !isMobile}
              />
            ))}

            {(!collapsed || isMobile) && (
              <>
                <div className="h-px bg-slate-100 my-2 mx-1" />
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Gestion
                </p>
              </>
            )}
            {collapsed && !isMobile && <div className="h-px bg-slate-100 my-2" />}

            {ADMIN_SECONDARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onNavigate={isMobile ? close : () => {}}
                collapsed={collapsed && !isMobile}
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
              onNavigate={isMobile ? close : () => {}}
              collapsed={collapsed && !isMobile}
            />
          ))}
      </nav>

      {/* Footer — user info + logout */}
      <div className={cn('shrink-0 border-t border-slate-100 py-3', collapsed && !isMobile ? 'px-2' : 'px-3')}>
        {(!collapsed || isMobile) && (
          <div className="px-2 py-2 mb-1 flex items-center gap-3 rounded-xl bg-slate-50">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shrink-0 text-white text-xs font-bold font-display">
              {user.avatarInitiales || user.nom?.charAt(0) || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-xs text-slate-800 truncate">{user.nom}</p>
              <p className="font-body text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          title={collapsed && !isMobile ? 'Déconnexion' : undefined}
          className={cn(
            'group relative flex items-center gap-3 w-full rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150',
            collapsed && !isMobile ? 'justify-center p-2.5' : 'px-3 py-2.5'
          )}
        >
          <LogOut size={18} strokeWidth={1.75} />
          {(!collapsed || isMobile) && <span>Déconnexion</span>}
          {collapsed && !isMobile && (
            <div className="sidebar-tooltip pointer-events-none absolute left-full ml-3 z-50 px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-150">
              Déconnexion
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <SidebarContext.Provider value={{ collapsed }}>
      {/* Mobile trigger */}
      <div className="lg:hidden fixed top-3 left-3 z-40">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl bg-white text-slate-600 hover:bg-slate-50 transition shadow-sm border border-slate-200"
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:block fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 ease-in-out"
        style={{ width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_EXPANDED_W }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <div
            className="relative z-50 h-full animate-slide-in-left shadow-2xl"
            style={{ width: SIDEBAR_EXPANDED_W }}
          >
            <SidebarContent isMobile />
          </div>
        </div>
      )}
    </SidebarContext.Provider>
  );
}

export const SIDEBAR_WIDTH_PX = SIDEBAR_EXPANDED_W;

export default Sidebar;
