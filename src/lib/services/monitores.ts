import { db } from '@/lib/db';
import { monitores, colaboradores, sitios } from '@/lib/db/schema';
import { eq, and, isNull, ilike, or, desc, count } from 'drizzle-orm';
import type { PaginatedResponse, Monitor } from '@/lib/types/database';

export interface MonitorSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  marca?: string;
  sitioId?: string;
  obsoleto?: boolean;
}

export async function listMonitores(params: MonitorSearchParams): Promise<PaginatedResponse<Monitor & { colaborador: { nombre: string } | null; sitio: { nombre: string } | null }>> {
  const { page = 1, pageSize = 25, search, marca, sitioId, obsoleto } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(monitores.deletedAt)];
  if (marca) conditions.push(eq(monitores.marca, marca));
  if (sitioId) conditions.push(eq(monitores.sitioId, sitioId));
  if (obsoleto !== undefined) conditions.push(eq(monitores.obsoleto, obsoleto));
  if (search) {
    conditions.push(
      or(
        ilike(monitores.serialNumber, `%${search}%`),
        ilike(monitores.marca, `%${search}%`),
        ilike(monitores.modelo, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: monitores.id,
        serialNumber: monitores.serialNumber,
        empresa: monitores.empresa,
        tipoMonitor: monitores.tipoMonitor,
        marca: monitores.marca,
        modelo: monitores.modelo,
        pulgadas: monitores.pulgadas,
        proveedor: monitores.proveedor,
        ordenCompra: monitores.ordenCompra,
        factura: monitores.factura,
        fechaCompra: monitores.fechaCompra,
        diasGarantia: monitores.diasGarantia,
        vencGarantia: monitores.vencGarantia,
        obsoleto: monitores.obsoleto,
        compradoPor: monitores.compradoPor,
        colaboradorId: monitores.colaboradorId,
        sitioId: monitores.sitioId,
        comentarios: monitores.comentarios,
        createdAt: monitores.createdAt,
        updatedAt: monitores.updatedAt,
        deletedAt: monitores.deletedAt,
        colaborador: { nombre: colaboradores.nombre },
        sitio: { nombre: sitios.nombre },
      })
      .from(monitores)
      .leftJoin(colaboradores, eq(monitores.colaboradorId, colaboradores.id))
      .leftJoin(sitios, eq(monitores.sitioId, sitios.id))
      .where(where)
      .orderBy(desc(monitores.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(monitores).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as (Monitor & { colaborador: { nombre: string } | null; sitio: { nombre: string } | null })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getMonitorById(id: string) {
  return db.query.monitores.findFirst({
    where: and(eq(monitores.id, id), isNull(monitores.deletedAt)),
    with: {
      colaborador: true,
      sitio: true,
    },
  }) ?? null;
}

export async function createMonitor(data: Record<string, unknown>) {
  const [created] = await db.insert(monitores).values(data as typeof monitores.$inferInsert).returning();
  return created;
}

export async function updateMonitor(id: string, data: Record<string, unknown>) {
  const [updated] = await db
    .update(monitores)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(monitores.id, id), isNull(monitores.deletedAt)))
    .returning();
  return updated;
}

export async function softDeleteMonitor(id: string) {
  await db
    .update(monitores)
    .set({ deletedAt: new Date() })
    .where(and(eq(monitores.id, id), isNull(monitores.deletedAt)));
}
