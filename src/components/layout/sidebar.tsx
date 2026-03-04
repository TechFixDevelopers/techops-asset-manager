'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  user: {
    name?: string | null;
    username: string;
    perfil: string;
  };
}

const navLinks = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/equipos', label: 'Equipos', icon: Monitor },
  { href: '/celulares', label: 'Celulares', icon: Smartphone },
  { href: '/monitores', label: 'Monitores', icon: MonitorSmartphone },
  { href: '/insumos', label: 'Insumos', icon: Package },
  { href: '/colaboradores', label: 'Colaboradores', icon: Users },
  { href: '/movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { href: '/cortes', label: 'Cortes de Stock', icon: ClipboardList },
] as const;

const perfilColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  SAZ: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LAS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700">
        <h2 className="text-lg font-bold text-[#54A0D6]">TechOps</h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
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
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
