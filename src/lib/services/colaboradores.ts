import { db } from '@/lib/db';
import { colaboradores, empresas, sitios, equipos, celulares, monitores } from '@/lib/db/schema';
import { eq, and, isNull, ilike, or, desc, count } from 'drizzle-orm';
import type { PaginatedResponse, Colaborador } from '@/lib/types/database';

export interface ColaboradorSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  empresaId?: string;
  sitioId?: string;
  area?: string;
}

export async function listColaboradores(params: ColaboradorSearchParams): Promise<PaginatedResponse<Colaborador & { empresa: { nombre: string } | null; sitio: { nombre: string } | null }>> {
  const { page = 1, pageSize = 25, search, status, empresaId, sitioId, area } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(colaboradores.deletedAt)];
  if (status) conditions.push(eq(colaboradores.status, status));
  if (empresaId) conditions.push(eq(colaboradores.empresaId, empresaId));
  if (sitioId) conditions.push(eq(colaboradores.sitioId, sitioId));
  if (area) conditions.push(eq(colaboradores.area, area));
  if (search) {
    conditions.push(
      or(
        ilike(colaboradores.nombre, `%${search}%`),
        ilike(colaboradores.legajo, `%${search}%`),
        ilike(colaboradores.email, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: colaboradores.id,
        globalId: colaboradores.globalId,
        legajo: colaboradores.legajo,
        email: colaboradores.email,
        nombre: colaboradores.nombre,
        businessTitle: colaboradores.businessTitle,
        band: colaboradores.band,
        empresaId: colaboradores.empresaId,
        costCenterId: colaboradores.costCenterId,
        costCenterDesc: colaboradores.costCenterDesc,
        positionId: colaboradores.positionId,
        positionName: colaboradores.positionName,
        managerName: colaboradores.managerName,
        managerId: colaboradores.managerId,
        area: colaboradores.area,
        subArea: colaboradores.subArea,
        groupedUnity: colaboradores.groupedUnity,
        unity: colaboradores.unity,
        pais: colaboradores.pais,
        regional: colaboradores.regional,
        hrbp: colaboradores.hrbp,
        hireDate: colaboradores.hireDate,
        status: colaboradores.status,
        collar: colaboradores.collar,
        sitioId: colaboradores.sitioId,
        createdAt: colaboradores.createdAt,
        updatedAt: colaboradores.updatedAt,
        deletedAt: colaboradores.deletedAt,
        empresa: {
          nombre: empresas.nombre,
        },
        sitio: {
          nombre: sitios.nombre,
        },
      })
      .from(colaboradores)
      .leftJoin(empresas, eq(colaboradores.empresaId, empresas.id))
      .leftJoin(sitios, eq(colaboradores.sitioId, sitios.id))
      .where(where)
      .orderBy(desc(colaboradores.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(colaboradores).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as (Colaborador & { empresa: { nombre: string } | null; sitio: { nombre: string } | null })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getColaboradorById(id: string) {
  const result = await db.query.colaboradores.findFirst({
    where: and(eq(colaboradores.id, id), isNull(colaboradores.deletedAt)),
    with: {
      empresa: true,
      sitio: true,
      equipos: {
        where: isNull(equipos.deletedAt),
      },
      celulares: {
        where: isNull(celulares.deletedAt),
      },
      monitores: {
        where: isNull(monitores.deletedAt),
      },
    },
  });
  return result ?? null;
}

export async function createColaborador(data: Record<string, unknown>) {
  const [created] = await db.insert(colaboradores).values(data as typeof colaboradores.$inferInsert).returning();
  return created;
}

export async function updateColaborador(id: string, data: Record<string, unknown>) {
  const [updated] = await db
    .update(colaboradores)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(colaboradores.id, id), isNull(colaboradores.deletedAt)))
    .returning();
  return updated;
}

export async function softDeleteColaborador(id: string) {
  await db
    .update(colaboradores)
    .set({ deletedAt: new Date() })
    .where(and(eq(colaboradores.id, id), isNull(colaboradores.deletedAt)));
}

export async function searchColaboradores(query: string, limit = 10) {
  return db
    .select({
      id: colaboradores.id,
      legajo: colaboradores.legajo,
      nombre: colaboradores.nombre,
      email: colaboradores.email,
    })
    .from(colaboradores)
    .where(
      and(
        isNull(colaboradores.deletedAt),
        or(
          ilike(colaboradores.nombre, `%${query}%`),
          ilike(colaboradores.legajo, `%${query}%`),
        )!,
      ),
    )
    .limit(limit);
}
