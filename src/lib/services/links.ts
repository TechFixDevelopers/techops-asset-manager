import { db } from '@/lib/db';
import { linksUtiles } from '@/lib/db/schema';
import { eq, and, ilike, asc, type SQL } from 'drizzle-orm';
import type { CreateLinkInput, UpdateLinkInput } from '@/lib/validations/link';

export async function listLinks(params?: { categoria?: string; search?: string }) {
  const conditions: SQL[] = [];
  conditions.push(eq(linksUtiles.activo, true));

  if (params?.categoria) conditions.push(eq(linksUtiles.categoria, params.categoria));
  if (params?.search) {
    conditions.push(ilike(linksUtiles.titulo, `%${params.search}%`));
  }

  return db
    .select()
    .from(linksUtiles)
    .where(and(...conditions))
    .orderBy(asc(linksUtiles.categoria), asc(linksUtiles.orden), asc(linksUtiles.titulo));
}

export async function getLinkById(id: string) {
  const [link] = await db.select().from(linksUtiles).where(eq(linksUtiles.id, id)).limit(1);
  return link ?? null;
}

export async function createLink(data: CreateLinkInput) {
  const [created] = await db.insert(linksUtiles).values(data).returning();
  return created;
}

export async function updateLink(id: string, data: UpdateLinkInput) {
  const [updated] = await db
    .update(linksUtiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(linksUtiles.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteLink(id: string) {
  await db.delete(linksUtiles).where(eq(linksUtiles.id, id));
}
