import { db } from '@/lib/db';
import { equipos, empresas, colaboradores, sitios, movimientos } from '@/lib/db/schema';
import { eq, and, isNull, ilike, or, desc, count } from 'drizzle-orm';
import type { PaginatedResponse, Equipo } from '@/lib/types/database';

export interface EquipoSearchParams {
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
  obsoleto?: boolean;
}

export async function listEquipos(params: EquipoSearchParams): Promise<PaginatedResponse<Equipo & { empresa: { nombre: string } | null; colaborador: { nombre: string } | null; sitio: { nombre: string } | null }>> {
  const { page = 1, pageSize = 25, search, tipo, marca, estado, sitioId, empresaId, obsoleto } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [isNull(equipos.deletedAt)];
  if (tipo) conditions.push(eq(equipos.tipo, tipo));
  if (marca) conditions.push(eq(equipos.marca, marca));
  if (estado) conditions.push(eq(equipos.estado, estado));
  if (sitioId) conditions.push(eq(equipos.sitioId, sitioId));
  if (empresaId) conditions.push(eq(equipos.empresaId, empresaId));
  if (obsoleto !== undefined) conditions.push(eq(equipos.obsoleto, obsoleto));
  if (search) {
    conditions.push(
      or(
        ilike(equipos.serialNumber, `%${search}%`),
        ilike(equipos.hostname, `%${search}%`),
        ilike(equipos.modelo, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: equipos.id,
        serialNumber: equipos.serialNumber,
        hostname: equipos.hostname,
        empresaId: equipos.empresaId,
        tipo: equipos.tipo,
        marca: equipos.marca,
        modelo: equipos.modelo,
        procesador: equipos.procesador,
        memoria: equipos.memoria,
        tipoDisco: equipos.tipoDisco,
        tamanoDisco: equipos.tamanoDisco,
        sistemaOperativo: equipos.sistemaOperativo,
        compradoPor: equipos.compradoPor,
        ordenCompra: equipos.ordenCompra,
        fechaCompra: equipos.fechaCompra,
        diasGarantia: equipos.diasGarantia,
        vencGarantia: equipos.vencGarantia,
        obsoleto: equipos.obsoleto,
        estado: equipos.estado,
        estadoSecundario: equipos.estadoSecundario,
        colaboradorId: equipos.colaboradorId,
        principalSecundaria: equipos.principalSecundaria,
        motivoAsignacion: equipos.motivoAsignacion,
        fechaAsignacion: equipos.fechaAsignacion,
        sitioId: equipos.sitioId,
        comentarios: equipos.comentarios,
        red: equipos.red,
        createdAt: equipos.createdAt,
        updatedAt: equipos.updatedAt,
        deletedAt: equipos.deletedAt,
        empresa: { nombre: empresas.nombre },
        colaborador: { nombre: colaboradores.nombre },
        sitio: { nombre: sitios.nombre },
      })
      .from(equipos)
      .leftJoin(empresas, eq(equipos.empresaId, empresas.id))
      .leftJoin(colaboradores, eq(equipos.colaboradorId, colaboradores.id))
      .leftJoin(sitios, eq(equipos.sitioId, sitios.id))
      .where(where)
      .orderBy(desc(equipos.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(equipos).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    data: data as (Equipo & { empresa: { nombre: string } | null; colaborador: { nombre: string } | null; sitio: { nombre: string } | null })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getEquipoById(id: string) {
  return db.query.equipos.findFirst({
    where: and(eq(equipos.id, id), isNull(equipos.deletedAt)),
    with: {
      empresa: true,
      colaborador: true,
      sitio: true,
      movimientos: {
        orderBy: [desc(movimientos.createdAt)],
        limit: 20,
      },
    },
  }) ?? null;
}

export async function createEquipo(data: Record<string, unknown>) {
  const [created] = await db.insert(equipos).values(data as typeof equipos.$inferInsert).returning();
  return created;
}

export async function updateEquipo(id: string, data: Record<string, unknown>) {
  const [updated] = await db
    .update(equipos)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(equipos.id, id), isNull(equipos.deletedAt)))
    .returning();
  return updated;
}

export async function softDeleteEquipo(id: string) {
  await db
    .update(equipos)
    .set({ deletedAt: new Date() })
    .where(and(eq(equipos.id, id), isNull(equipos.deletedAt)));
}
