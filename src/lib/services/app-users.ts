import { db } from '@/lib/db';
import { appUsers } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, count, type SQL } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import type { PaginatedResponse } from '@/lib/types/database';

// ============================================================
// Types (safe — never includes passwordHash)
// ============================================================

export interface AppUserSafe {
  id: string;
  username: string;
  perfil: string;
  nombre: string | null;
  email: string | null;
  activo: boolean | null;
  permisos: unknown;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AppUserSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  perfil?: string;
  activo?: boolean;
}

// Safe selection — explicitly excludes passwordHash
const safeColumns = {
  id: appUsers.id,
  username: appUsers.username,
  perfil: appUsers.perfil,
  nombre: appUsers.nombre,
  email: appUsers.email,
  activo: appUsers.activo,
  permisos: appUsers.permisos,
  createdAt: appUsers.createdAt,
  updatedAt: appUsers.updatedAt,
};

// ============================================================
// List
// ============================================================

export async function listAppUsers(params: AppUserSearchParams): Promise<PaginatedResponse<AppUserSafe>> {
  const { page = 1, pageSize = 25, search, perfil, activo } = params;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (perfil) conditions.push(eq(appUsers.perfil, perfil));
  if (activo !== undefined) conditions.push(eq(appUsers.activo, activo));
  if (search) {
    conditions.push(
      or(
        ilike(appUsers.username, `%${search}%`),
        ilike(appUsers.nombre, `%${search}%`),
        ilike(appUsers.email, `%${search}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select(safeColumns)
      .from(appUsers)
      .where(where)
      .orderBy(desc(appUsers.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(appUsers).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as AppUserSafe[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============================================================
// Get by ID
// ============================================================

export async function getAppUserById(id: string): Promise<AppUserSafe | null> {
  const [user] = await db
    .select(safeColumns)
    .from(appUsers)
    .where(eq(appUsers.id, id))
    .limit(1);

  return (user as AppUserSafe) ?? null;
}

// ============================================================
// Create
// ============================================================

export async function createAppUser(data: {
  username: string;
  password: string;
  perfil?: string;
  nombre?: string;
  email?: string;
  activo?: boolean;
}): Promise<AppUserSafe> {
  const passwordHash = await hash(data.password, 12);
  const { password: _, ...rest } = data;

  const [created] = await db
    .insert(appUsers)
    .values({ ...rest, passwordHash } as typeof appUsers.$inferInsert)
    .returning();

  const { passwordHash: __, ...safe } = created;
  return safe as AppUserSafe;
}

// ============================================================
// Update
// ============================================================

export async function updateAppUser(
  id: string,
  data: Record<string, unknown>,
): Promise<AppUserSafe | null> {
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

  // Hash password if provided
  if (updateData.password) {
    updateData.passwordHash = await hash(updateData.password as string, 12);
    delete updateData.password;
  }

  const [updated] = await db
    .update(appUsers)
    .set(updateData)
    .where(eq(appUsers.id, id))
    .returning();

  if (!updated) return null;

  const { passwordHash: _, ...safe } = updated;
  return safe as AppUserSafe;
}

// ============================================================
// Delete (hard delete)
// ============================================================

export async function deleteAppUser(id: string): Promise<void> {
  await db.delete(appUsers).where(eq(appUsers.id, id));
}
