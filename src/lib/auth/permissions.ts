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
  | 'lineas';

const PERMISSIONS: Record<Perfil, Record<Action, Resource[]>> = {
  LAS: {
    read: [
      'equipos', 'celulares', 'monitores', 'insumos', 'colaboradores',
      'movimientos', 'cortes', 'tickets', 'empresas', 'sitios', 'lineas',
    ],
    create: [],
    update: [],
    delete: [],
  },
  SAZ: {
    read: [
      'equipos', 'celulares', 'monitores', 'insumos', 'colaboradores',
      'movimientos', 'cortes', 'tickets', 'empresas', 'sitios', 'lineas',
    ],
    create: ['equipos', 'celulares', 'monitores', 'insumos', 'movimientos', 'cortes', 'tickets', 'lineas'],
    update: ['equipos', 'celulares', 'monitores', 'insumos', 'cortes', 'lineas'],
    delete: [],
  },
  ADMIN: {
    read: [
      'equipos', 'celulares', 'monitores', 'insumos', 'colaboradores',
      'movimientos', 'cortes', 'tickets', 'empresas', 'sitios', 'app_users', 'lineas',
    ],
    create: [
      'equipos', 'celulares', 'monitores', 'insumos', 'movimientos',
      'cortes', 'tickets', 'empresas', 'sitios', 'app_users', 'colaboradores', 'lineas',
    ],
    update: [
      'equipos', 'celulares', 'monitores', 'insumos', 'cortes', 'empresas',
      'sitios', 'app_users', 'colaboradores', 'lineas',
    ],
    delete: ['equipos', 'celulares', 'monitores', 'insumos', 'empresas', 'sitios', 'app_users', 'lineas'],
  },
};

export function hasPermission(perfil: Perfil, action: Action, resource: Resource): boolean {
  return PERMISSIONS[perfil]?.[action]?.includes(resource) ?? false;
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
