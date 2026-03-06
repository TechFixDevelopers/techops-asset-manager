import { db } from '@/lib/db';
import { reparaciones, colaboradores, sitios, appUsers } from '@/lib/db/schema';
import { eq, and, ilike, desc, count, type SQL } from 'drizzle-orm';
import type { PaginatedResponse } from '@/lib/types/database';
import type { CreateReparacionInput, UpdateReparacionInput } from '@/lib/validations/reparacion';

interface ReparacionRow {
  id: string;
  tipoTarea: string;
  tipoEquipo: string | null;
  reparacionesRealizadas: unknown;
  descripcion: string | null;
  colaboradorId: string | null;
  equipoRef: string | null;
  sitioId: string | null;
  ticketSnow: string | null;
  estado: string;
  operadorId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  colaboradorNombre: string | null;
  colaboradorLegajo: string | null;
  sitioNombre: string | null;
  operadorNombre: string | null;
}

export interface ReparacionSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tipoTarea?: string;
  estado?: string;
}

export async function listReparaciones(params: ReparacionSearchParams): Promise<PaginatedResponse<ReparacionRow>> {
  const { page = 1, pageSize = 25, search, tipoTarea, estado } = params;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (tipoTarea) conditions.push(eq(reparaciones.tipoTarea, tipoTarea));
  if (estado) conditions.push(eq(reparaciones.estado, estado));
  if (search) conditions.push(ilike(reparaciones.descripcion, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: reparaciones.id,
        tipoTarea: reparaciones.tipoTarea,
        tipoEquipo: reparaciones.tipoEquipo,
        reparacionesRealizadas: reparaciones.reparacionesRealizadas,
        descripcion: reparaciones.descripcion,
        colaboradorId: reparaciones.colaboradorId,
        equipoRef: reparaciones.equipoRef,
        sitioId: reparaciones.sitioId,
        ticketSnow: reparaciones.ticketSnow,
        estado: reparaciones.estado,
        operadorId: reparaciones.operadorId,
        createdAt: reparaciones.createdAt,
        updatedAt: reparaciones.updatedAt,
        colaboradorNombre: colaboradores.nombre,
        colaboradorLegajo: colaboradores.legajo,
        sitioNombre: sitios.nombre,
        operadorNombre: appUsers.nombre,
      })
      .from(reparaciones)
      .leftJoin(colaboradores, eq(reparaciones.colaboradorId, colaboradores.id))
      .leftJoin(sitios, eq(reparaciones.sitioId, sitios.id))
      .leftJoin(appUsers, eq(reparaciones.operadorId, appUsers.id))
      .where(where)
      .orderBy(desc(reparaciones.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(reparaciones).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;
  return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export async function getReparacionById(id: string) {
  const [row] = await db
    .select({
      id: reparaciones.id,
      tipoTarea: reparaciones.tipoTarea,
      tipoEquipo: reparaciones.tipoEquipo,
      reparacionesRealizadas: reparaciones.reparacionesRealizadas,
      descripcion: reparaciones.descripcion,
      colaboradorId: reparaciones.colaboradorId,
      equipoRef: reparaciones.equipoRef,
      sitioId: reparaciones.sitioId,
      ticketSnow: reparaciones.ticketSnow,
      estado: reparaciones.estado,
      operadorId: reparaciones.operadorId,
      createdAt: reparaciones.createdAt,
      updatedAt: reparaciones.updatedAt,
      colaboradorNombre: colaboradores.nombre,
      colaboradorLegajo: colaboradores.legajo,
      sitioNombre: sitios.nombre,
      operadorNombre: appUsers.nombre,
    })
    .from(reparaciones)
    .leftJoin(colaboradores, eq(reparaciones.colaboradorId, colaboradores.id))
    .leftJoin(sitios, eq(reparaciones.sitioId, sitios.id))
    .leftJoin(appUsers, eq(reparaciones.operadorId, appUsers.id))
    .where(eq(reparaciones.id, id))
    .limit(1);
  return row ?? null;
}

export async function createReparacion(data: CreateReparacionInput, operadorId: string) {
  const [created] = await db
    .insert(reparaciones)
    .values({ ...data, operadorId } as typeof reparaciones.$inferInsert)
    .returning();
  return created;
}

export async function updateReparacion(id: string, data: UpdateReparacionInput) {
  const [updated] = await db
    .update(reparaciones)
    .set({ ...data, updatedAt: new Date() } as Record<string, unknown>)
    .where(eq(reparaciones.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteReparacion(id: string) {
  await db.delete(reparaciones).where(eq(reparaciones.id, id));
}
