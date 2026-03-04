import { db } from '@/lib/db';
import { celulares, empresas, colaboradores, lineas, sitios } from '@/lib/db/schema';
import { eq, and, isNull, ilike, or, desc, count } from 'drizzle-orm';
import type { PaginatedResponse, Celular } from '@/lib/types/database';

export interface CelularSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tipo?: string;
  marca?: string;
  estado?: string;
  sitioId?: string;
  empresaId?: string;
  proveedor?: string;
}

export async function listCelulares(params: CelularSearchParams): Promise<PaginatedResponse<Celular & { empresa: { nombre: string } | null; colaborador: { nombre: string } | null; linea: { numero: string } | null; sitio: { nombre: string } | null }>> {
  const { page = 1, pageSize = 25, search, tipo, marca, estado, sitioId, empresaId, proveedor } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(celulares.deletedAt)];
  if (tipo) conditions.push(eq(celulares.tipo, tipo));
  if (marca) conditions.push(eq(celulares.marca, marca));
  if (estado) conditions.push(eq(celulares.estado, estado));
  if (sitioId) conditions.push(eq(celulares.sitioId, sitioId));
  if (empresaId) conditions.push(eq(celulares.empresaId, empresaId));
  if (proveedor) conditions.push(eq(celulares.proveedor, proveedor));
  if (search) {
    conditions.push(
      or(
        ilike(celulares.imei, `%${search}%`),
        ilike(celulares.modelo, `%${search}%`),
        ilike(celulares.marca, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: celulares.id,
        imei: celulares.imei,
        empresaId: celulares.empresaId,
        tipo: celulares.tipo,
        marca: celulares.marca,
        modelo: celulares.modelo,
        proveedor: celulares.proveedor,
        plan: celulares.plan,
        fechaCompra: celulares.fechaCompra,
        diasGarantia: celulares.diasGarantia,
        obsoleto: celulares.obsoleto,
        estado: celulares.estado,
        estadoSecundario: celulares.estadoSecundario,
        colaboradorId: celulares.colaboradorId,
        lineaId: celulares.lineaId,
        sitioId: celulares.sitioId,
        principalSecundaria: celulares.principalSecundaria,
        motivoAsignacion: celulares.motivoAsignacion,
        fechaAsignacion: celulares.fechaAsignacion,
        poseeCargador: celulares.poseeCargador,
        condicion: celulares.condicion,
        comentarios: celulares.comentarios,
        createdAt: celulares.createdAt,
        updatedAt: celulares.updatedAt,
        deletedAt: celulares.deletedAt,
        empresa: { nombre: empresas.nombre },
        colaborador: { nombre: colaboradores.nombre },
        linea: { numero: lineas.numero },
        sitio: { nombre: sitios.nombre },
      })
      .from(celulares)
      .leftJoin(empresas, eq(celulares.empresaId, empresas.id))
      .leftJoin(colaboradores, eq(celulares.colaboradorId, colaboradores.id))
      .leftJoin(lineas, eq(celulares.lineaId, lineas.id))
      .leftJoin(sitios, eq(celulares.sitioId, sitios.id))
      .where(where)
      .orderBy(desc(celulares.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(celulares).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as (Celular & { empresa: { nombre: string } | null; colaborador: { nombre: string } | null; linea: { numero: string } | null; sitio: { nombre: string } | null })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCelularById(id: string) {
  return db.query.celulares.findFirst({
    where: and(eq(celulares.id, id), isNull(celulares.deletedAt)),
    with: {
      empresa: true,
      colaborador: true,
      linea: true,
      sitio: true,
    },
  }) ?? null;
}

export async function createCelular(data: Record<string, unknown>) {
  const [created] = await db.insert(celulares).values(data as typeof celulares.$inferInsert).returning();
  return created;
}

export async function updateCelular(id: string, data: Record<string, unknown>) {
  const [updated] = await db
    .update(celulares)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(celulares.id, id), isNull(celulares.deletedAt)))
    .returning();
  return updated;
}

export async function softDeleteCelular(id: string) {
  await db
    .update(celulares)
    .set({ deletedAt: new Date() })
    .where(and(eq(celulares.id, id), isNull(celulares.deletedAt)));
}
