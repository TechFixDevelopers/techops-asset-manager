import { auth } from '@/lib/auth/config';

export type Perfil = 'SAZ' | 'LAS' | 'ADMIN';
export type Action = 'read' | 'create' | 'update' | 'delete';
export type Resource =
  | 'equipos'
  | 'celulares'
  | 'monitores'
  | 'insumos'
  | 'colaboradores'
  | 'movimientos'
  | 'cortes'
  | 'tickets'
  | 'app_users'
  | 'empresas'
  | 'sitios'
  | 'lineas'
  | 'wiki'
  | 'links'
  | 'reparaciones';

const PERMISSIONS: Record<Perfil, Record<Action, Resource[]>> = {
  LAS: {
    read: [
      'equipos', 'celulares', 'monitores', 'insumos', 'colaboradores',
      'movimientos', 'cortes', 'tickets', 'empresas', 'sitios', 'lineas',
      'wiki', 'links', 'reparaciones',
    ],
    create: [],
    update: [],
    delete: [],
  },
  SAZ: {
    read: [
      'equipos', 'celulares', 'monitores', 'insumos', 'colaboradores',
      'movimientos', 'cortes', 'tickets', 'empresas', 'sitios', 'lineas',
      'wiki', 'links', 'reparaciones',
    ],
    create: ['equipos', 'celulares', 'monitores', 'insumos', 'movimientos', 'cortes', 'tickets', 'lineas', 'reparaciones'],
    update: ['equipos', 'celulares', 'monitores', 'insumos', 'cortes', 'lineas', 'reparaciones'],
    delete: [],
  },
  ADMIN: {
    read: [
      'equipos', 'celulares', 'monitores', 'insumos', 'colaboradores',
      'movimientos', 'cortes', 'tickets', 'empresas', 'sitios', 'app_users', 'lineas',
      'wiki', 'links', 'reparaciones',
    ],
    create: [
      'equipos', 'celulares', 'monitores', 'insumos', 'movimientos',
      'cortes', 'tickets', 'empresas', 'sitios', 'app_users', 'colaboradores', 'lineas',
      'wiki', 'links', 'reparaciones',
    ],
    update: [
      'equipos', 'celulares', 'monitores', 'insumos', 'cortes', 'empresas',
      'sitios', 'app_users', 'colaboradores', 'lineas',
      'wiki', 'links', 'reparaciones',
    ],
    delete: [
      'equipos', 'celulares', 'monitores', 'insumos', 'empresas', 'sitios', 'app_users', 'lineas',
      'wiki', 'links', 'reparaciones',
    ],
  },
};

export function hasPermission(perfil: Perfil, action: Action, resource: Resource): boolean {
  return PERMISSIONS[perfil]?.[action]?.includes(resource) ?? false;
}

/**
 * Check if a user can access a given module based on their profile and permisos config.
 * - ADMIN always has access to everything.
 * - If modulosHabilitados is empty/undefined → access to all (backward-compatible).
 * - Otherwise, only listed modules are accessible.
 */
export function canAccessModule(
  perfil: string,
  moduleId: string,
  permisos?: { modulosHabilitados?: string[] } | null,
): boolean {
  if (perfil === 'ADMIN') return true;
  const habilitados = permisos?.modulosHabilitados;
  if (!habilitados || habilitados.length === 0) return true;
  return habilitados.includes(moduleId);
}

export async function requirePermission(action: Action, resource: Resource) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }

  const perfil = session.user.perfil as Perfil;
  if (!hasPermission(perfil, action, resource)) {
    throw new Error('FORBIDDEN');
  }

  return session;
}
