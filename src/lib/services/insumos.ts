import { db } from '@/lib/db';
import { insumos, insumoStock, sitios } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, count, sql } from 'drizzle-orm';
import type { PaginatedResponse, Insumo } from '@/lib/types/database';

export interface InsumoSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tipoInsumo?: string;
  sitioId?: string;
}

export async function listInsumos(params: InsumoSearchParams): Promise<PaginatedResponse<Insumo & { stockTotal: number }>> {
  const { page = 1, pageSize = 25, search, tipoInsumo } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (tipoInsumo) conditions.push(eq(insumos.tipoInsumo, tipoInsumo));
  if (search) {
    conditions.push(
      or(
        ilike(insumos.nombre, `%${search}%`),
        ilike(insumos.tipoInsumo, `%${search}%`),
        ilike(insumos.serialInsumo, `%${search}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: insumos.id,
        nombre: insumos.nombre,
        tipoInsumo: insumos.tipoInsumo,
        serialInsumo: insumos.serialInsumo,
        ordenCompra: insumos.ordenCompra,
        fechaCompra: insumos.fechaCompra,
        areaCompra: insumos.areaCompra,
        cantidadMin: insumos.cantidadMin,
        createdAt: insumos.createdAt,
        updatedAt: insumos.updatedAt,
        stockTotal: sql<number>`COALESCE(SUM(${insumoStock.cantidad}), 0)`.as('stock_total'),
      })
      .from(insumos)
      .leftJoin(insumoStock, eq(insumos.id, insumoStock.insumoId))
      .where(where)
      .groupBy(insumos.id)
      .orderBy(desc(insumos.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(insumos).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as (Insumo & { stockTotal: number })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getInsumoById(id: string) {
  const insumo = await db.query.insumos.findFirst({
    where: eq(insumos.id, id),
  });
  if (!insumo) return null;

  const stockEntries = await db
    .select({
      id: insumoStock.id,
      insumoId: insumoStock.insumoId,
      sitioId: insumoStock.sitioId,
      cantidad: insumoStock.cantidad,
      updatedAt: insumoStock.updatedAt,
      sitio: { nombre: sitios.nombre },
    })
    .from(insumoStock)
    .leftJoin(sitios, eq(insumoStock.sitioId, sitios.id))
    .where(eq(insumoStock.insumoId, id));

  const stockTotal = stockEntries.reduce((acc, e) => acc + (e.cantidad ?? 0), 0);

  return { ...insumo, stockTotal, stockEntries };
}

export async function createInsumo(data: Record<string, unknown>) {
  const [created] = await db.insert(insumos).values(data as typeof insumos.$inferInsert).returning();
  return created;
}

export async function updateInsumo(id: string, data: Record<string, unknown>) {
  const [updated] = await db
    .update(insumos)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(insumos.id, id))
    .returning();
  return updated;
}

export async function deleteInsumo(id: string) {
  await db.delete(insumos).where(eq(insumos.id, id));
}

export async function adjustStock(insumoId: string, sitioId: string, cantidad: number) {
  // Check current stock to prevent negative
  const existing = await db
    .select()
    .from(insumoStock)
    .where(and(eq(insumoStock.insumoId, insumoId), eq(insumoStock.sitioId, sitioId)));

  const current = existing[0]?.cantidad ?? 0;
  const newQuantity = current + cantidad;

  if (newQuantity < 0) {
    throw new Error('Stock no puede ser negativo');
  }

  if (existing.length > 0) {
    const [updated] = await db
      .update(insumoStock)
      .set({ cantidad: newQuantity, updatedAt: new Date() })
      .where(and(eq(insumoStock.insumoId, insumoId), eq(insumoStock.sitioId, sitioId)))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(insumoStock)
    .values({ insumoId, sitioId, cantidad: newQuantity })
    .returning();
  return created;
}

export async function getStockBySitio(sitioId: string) {
  return db
    .select({
      id: insumoStock.id,
      insumoId: insumoStock.insumoId,
      sitioId: insumoStock.sitioId,
      cantidad: insumoStock.cantidad,
      updatedAt: insumoStock.updatedAt,
      insumo: {
        nombre: insumos.nombre,
        tipoInsumo: insumos.tipoInsumo,
        cantidadMin: insumos.cantidadMin,
      },
    })
    .from(insumoStock)
    .leftJoin(insumos, eq(insumoStock.insumoId, insumos.id))
    .where(eq(insumoStock.sitioId, sitioId));
}
