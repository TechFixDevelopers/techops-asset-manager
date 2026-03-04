import { db } from '@/lib/db';
import { lineas, sitios } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, count } from 'drizzle-orm';
import type { PaginatedResponse, Linea } from '@/lib/types/database';

export interface LineaSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  proveedor?: string;
  estado?: string;
  sitioId?: string;
}

export async function listLineas(params: LineaSearchParams): Promise<PaginatedResponse<Linea & { sitio: { nombre: string } | null }>> {
  const { page = 1, pageSize = 25, search, proveedor, estado, sitioId } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (proveedor) conditions.push(eq(lineas.proveedor, proveedor));
  if (estado) conditions.push(eq(lineas.estado, estado));
  if (sitioId) conditions.push(eq(lineas.sitioId, sitioId));
  if (search) {
    conditions.push(
      or(
        ilike(lineas.numero, `%${search}%`),
        ilike(lineas.proveedor, `%${search}%`),
        ilike(lineas.plan, `%${search}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: lineas.id,
        numero: lineas.numero,
        tipoLinea: lineas.tipoLinea,
        proveedor: lineas.proveedor,
        plan: lineas.plan,
        sitioId: lineas.sitioId,
        estado: lineas.estado,
        comentarios: lineas.comentarios,
        createdAt: lineas.createdAt,
        updatedAt: lineas.updatedAt,
        sitio: { nombre: sitios.nombre },
      })
      .from(lineas)
      .leftJoin(sitios, eq(lineas.sitioId, sitios.id))
      .where(where)
      .orderBy(desc(lineas.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(lineas).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as (Linea & { sitio: { nombre: string } | null })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLineaById(id: string) {
  return db.query.lineas.findFirst({
    where: eq(lineas.id, id),
    with: {
      sitio: true,
    },
  }) ?? null;
}

export async function createLinea(data: Record<string, unknown>) {
  const [created] = await db.insert(lineas).values(data as typeof lineas.$inferInsert).returning();
  return created;
}

export async function updateLinea(id: string, data: Record<string, unknown>) {
  const [updated] = await db
    .update(lineas)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(lineas.id, id))
    .returning();
  return updated;
}

export async function deleteLinea(id: string) {
  await db.delete(lineas).where(eq(lineas.id, id));
}
