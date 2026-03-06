import { db } from '@/lib/db';
import { wikiPages } from '@/lib/db/schema';
import { eq, and, ilike, asc, type SQL } from 'drizzle-orm';
import type { CreateWikiPageInput, UpdateWikiPageInput } from '@/lib/validations/wiki';

export async function listWikiPages(params?: { categoria?: string; search?: string; activo?: boolean }) {
  const conditions: SQL[] = [];

  if (params?.categoria) conditions.push(eq(wikiPages.categoria, params.categoria));
  if (params?.activo !== undefined) conditions.push(eq(wikiPages.activo, params.activo));
  if (params?.search) {
    conditions.push(ilike(wikiPages.titulo, `%${params.search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(wikiPages)
    .where(where)
    .orderBy(asc(wikiPages.orden), asc(wikiPages.titulo));
}

export async function getWikiPageBySlug(slug: string) {
  const [page] = await db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.slug, slug))
    .limit(1);
  return page ?? null;
}

export async function getWikiPageById(id: string) {
  const [page] = await db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.id, id))
    .limit(1);
  return page ?? null;
}

export async function createWikiPage(data: CreateWikiPageInput) {
  const [created] = await db
    .insert(wikiPages)
    .values(data)
    .returning();
  return created;
}

export async function updateWikiPage(id: string, data: UpdateWikiPageInput) {
  const [updated] = await db
    .update(wikiPages)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(wikiPages.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteWikiPage(id: string) {
  await db.delete(wikiPages).where(eq(wikiPages.id, id));
}
