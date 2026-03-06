'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Monitor,
  Smartphone,
  MonitorSmartphone,
  Package,
  Users,
  ArrowLeftRight,
  ClipboardList,
  Phone,
  Shield,
  DatabaseBackup,
  LogOut,
  Sun,
  Moon,
  Menu,
  Wrench,
  BookOpen,
  Link2,
  Bot,
  type LucideIcon,
} from 'lucide-react';
// canAccessModule inline to avoid importing permissions.ts (pulls server-only auth/db)
function canAccessModule(
  perfil: string,
  moduleId: string,
  permisos?: { modulosHabilitados?: string[] } | null,
): boolean {
  if (perfil === 'ADMIN') return true;
  const habilitados = permisos?.modulosHabilitados;
  if (!habilitados || habilitados.length === 0) return true;
  return habilitados.includes(moduleId);
}
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

interface SidebarProps {
  user: {
    name?: string | null;
    username: string;
    perfil: string;
    permisos?: { modulosHabilitados?: string[] } | null;
  };
}

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  moduleId?: string; // undefined = always visible (e.g. Dashboard)
}

interface NavSection {
  title: string;
  links: NavLink[];
  adminOnly?: boolean;
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    links: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Inventario',
    links: [
      { href: '/equipos', label: 'Equipos', icon: Monitor, moduleId: 'equipos' },
      { href: '/celulares', label: 'Celulares', icon: Smartphone, moduleId: 'celulares' },
      { href: '/monitores', label: 'Monitores', icon: MonitorSmartphone, moduleId: 'monitores' },
      { href: '/lineas', label: 'Lineas', icon: Phone, moduleId: 'lineas' },
      { href: '/insumos', label: 'Insumos', icon: Package, moduleId: 'insumos' },
    ],
  },
  {
    title: 'Personal',
    links: [
      { href: '/colaboradores', label: 'Colaboradores', icon: Users, moduleId: 'colaboradores' },
    ],
  },
  {
    title: 'Operaciones',
    links: [
      { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight, moduleId: 'movimientos' },
      { href: '/cortes', label: 'Cortes de Stock', icon: ClipboardList, moduleId: 'cortes' },
      { href: '/reparaciones', label: 'Reparaciones', icon: Wrench, moduleId: 'reparaciones' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/intranet', label: 'Intranet', icon: BookOpen, moduleId: 'intranet' },
      { href: '/links', label: 'Links Utiles', icon: Link2, moduleId: 'links' },
      { href: '/asistente', label: 'Asistente', icon: Bot },
    ],
  },
  {
    title: 'Admin',
    adminOnly: true,
    links: [
      { href: '/admin/usuarios', label: 'Usuarios', icon: Shield },
      { href: '/admin/datos', label: 'Gestion de Datos', icon: DatabaseBackup },
    ],
  },
];

const perfilColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SAZ: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LAS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

// Shared navigation content used by both desktop sidebar and mobile sheet
function SidebarContent({
  user,
  onLinkClick,
}: SidebarProps & { onLinkClick?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  // Filter sections: remove admin-only if not admin, filter links by module access
  const visibleSections = navSections
    .filter((section) => !section.adminOnly || user.perfil === 'ADMIN')
    .map((section) => ({
      ...section,
      links: section.links.filter((link) =>
        !link.moduleId || canAccessModule(user.perfil, link.moduleId, user.permisos),
      ),
    }))
    .filter((section) => section.links.length > 0);

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'mt-4' : ''}>
            {/* Section header (skip for Principal) */}
            {section.title !== 'Principal' && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.links.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onLinkClick}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-gray-100 font-semibold text-[#54A0D6] dark:bg-gray-700'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
              {user.name || user.username}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                perfilColors[user.perfil] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}
            >
              {user.perfil}
            </span>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="ml-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            title="Cerrar sesion"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// Theme toggle button extracted for reuse
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

// Mobile top bar + Sheet sidebar
function MobileSidebar({ user }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 md:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          title="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-[#54A0D6]">TechOps</h2>
        <ThemeToggle />
      </div>

      {/* Sheet with nav content */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="flex w-64 flex-col p-0 sm:max-w-64 bg-white dark:bg-gray-800"
        >
          {/* Accessible title for the sheet */}
          <SheetTitle className="sr-only">Menu de navegacion</SheetTitle>

          {/* Header inside sheet */}
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
            <h2 className="text-lg font-bold text-[#54A0D6]">TechOps</h2>
            <ThemeToggle />
          </div>

          <SidebarContent user={user} onLinkClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

// Desktop sidebar -- hidden on mobile
export function Sidebar({ user }: SidebarProps) {
  return (
    <>
      {/* Mobile: top bar + sheet */}
      <MobileSidebar user={user} />

      {/* Desktop: fixed sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 md:flex">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-700">
          <h2 className="text-lg font-bold text-[#54A0D6]">TechOps</h2>
          <ThemeToggle />
        </div>

        <SidebarContent user={user} />
      </aside>
    </>
  );
}
