import { db } from '@/lib/db';
import {
  cortesStock,
  sitios,
  appUsers,
  equipos,
  celulares,
  insumoStock,
  insumos,
  lineas,
  colaboradores,
} from '@/lib/db/schema';
import { eq, and, isNull, desc, count, gte, lte, sql } from 'drizzle-orm';
import type { SearchCorteParams } from '@/lib/validations/corte';
import type { PaginatedResponse } from '@/lib/types/database';

// ------------------------------------------------------------------
// Snapshot item interfaces
// ------------------------------------------------------------------

export interface EquipoSnapshot {
  id: string;
  serialNumber: string;
  hostname: string | null;
  tipo: string;
  marca: string;
  modelo: string;
  estado: string;
  colaboradorNombre: string | null;
}

export interface CelularSnapshot {
  id: string;
  imei: string;
  tipo: string;
  marca: string;
  modelo: string;
  estado: string;
  colaboradorNombre: string | null;
}

export interface InsumoSnapshot {
  insumoId: string;
  nombre: string;
  tipoInsumo: string;
  cantidad: number | null;
}

export interface LineaSnapshot {
  id: string;
  numero: string;
  tipoLinea: string | null;
  estado: string | null;
}

export interface DiferenciasData {
  equipos: {
    added: EquipoSnapshot[];
    removed: EquipoSnapshot[];
    changed: { before: EquipoSnapshot; after: EquipoSnapshot }[];
  };
  celulares: {
    added: CelularSnapshot[];
    removed: CelularSnapshot[];
    changed: { before: CelularSnapshot; after: CelularSnapshot }[];
  };
  insumos: {
    changed: { before: InsumoSnapshot; after: InsumoSnapshot }[];
  };
  lineas: {
    added: LineaSnapshot[];
    removed: LineaSnapshot[];
  };
}

// ------------------------------------------------------------------
// List type returned by the paginated query
// ------------------------------------------------------------------

export interface CorteListItem {
  id: string;
  fechaCorte: string;
  sitioNombre: string | null;
  generadoPorNombre: string | null;
  reconciliado: boolean | null;
  equiposCount: number;
  celularesCount: number;
  insumosCount: number;
  lineasCount: number;
  createdAt: Date | null;
}

// ------------------------------------------------------------------
// listCortes - paginated with JOIN to sitio and generadoPor
// ------------------------------------------------------------------

export async function listCortes(
  params: SearchCorteParams,
): Promise<PaginatedResponse<CorteListItem>> {
  const { page = 1, pageSize = 25, sitioId, desde, hasta, reconciliado } = params;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (sitioId) conditions.push(eq(cortesStock.sitioId, sitioId));
  if (desde) conditions.push(gte(cortesStock.fechaCorte, desde));
  if (hasta) conditions.push(lte(cortesStock.fechaCorte, hasta));
  if (reconciliado === 'true') conditions.push(eq(cortesStock.reconciliado, true));
  if (reconciliado === 'false') conditions.push(eq(cortesStock.reconciliado, false));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: cortesStock.id,
        fechaCorte: cortesStock.fechaCorte,
        sitioNombre: sitios.nombre,
        generadoPorNombre: appUsers.nombre,
        reconciliado: cortesStock.reconciliado,
        equiposData: cortesStock.equiposData,
        celularesData: cortesStock.celularesData,
        insumosData: cortesStock.insumosData,
        lineasData: cortesStock.lineasData,
        createdAt: cortesStock.createdAt,
      })
      .from(cortesStock)
      .leftJoin(sitios, eq(cortesStock.sitioId, sitios.id))
      .leftJoin(appUsers, eq(cortesStock.generadoPor, appUsers.id))
      .where(where)
      .orderBy(desc(cortesStock.fechaCorte), desc(cortesStock.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: count() }).from(cortesStock).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  const mapped: CorteListItem[] = data.map((row) => ({
    id: row.id,
    fechaCorte: row.fechaCorte,
    sitioNombre: row.sitioNombre,
    generadoPorNombre: row.generadoPorNombre,
    reconciliado: row.reconciliado,
    equiposCount: Array.isArray(row.equiposData) ? row.equiposData.length : 0,
    celularesCount: Array.isArray(row.celularesData) ? row.celularesData.length : 0,
    insumosCount: Array.isArray(row.insumosData) ? row.insumosData.length : 0,
    lineasCount: Array.isArray(row.lineasData) ? row.lineasData.length : 0,
    createdAt: row.createdAt,
  }));

  return {
    data: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ------------------------------------------------------------------
// getCorteById - full detail including JSONB data
// ------------------------------------------------------------------

export async function getCorteById(id: string) {
  const rows = await db
    .select({
      id: cortesStock.id,
      fechaCorte: cortesStock.fechaCorte,
      sitioId: cortesStock.sitioId,
      sitioNombre: sitios.nombre,
      generadoPor: cortesStock.generadoPor,
      generadoPorNombre: appUsers.nombre,
      equiposData: cortesStock.equiposData,
      celularesData: cortesStock.celularesData,
      insumosData: cortesStock.insumosData,
      lineasData: cortesStock.lineasData,
      reconciliado: cortesStock.reconciliado,
      diferencias: cortesStock.diferencias,
      createdAt: cortesStock.createdAt,
    })
    .from(cortesStock)
    .leftJoin(sitios, eq(cortesStock.sitioId, sitios.id))
    .leftJoin(appUsers, eq(cortesStock.generadoPor, appUsers.id))
    .where(eq(cortesStock.id, id))
    .limit(1);

  return rows[0] ?? null;
}

// ------------------------------------------------------------------
// createCorteStock - transactional snapshot creation
// ------------------------------------------------------------------

export async function createCorteStock(
  sitioId: string,
  generadoPorId: string,
  fechaCorte?: string,
) {
  const fecha = fechaCorte ?? new Date().toISOString().split('T')[0];

  // Check for existing corte on same date + site
  const existing = await db
    .select({ id: cortesStock.id })
    .from(cortesStock)
    .where(and(eq(cortesStock.fechaCorte, fecha), eq(cortesStock.sitioId, sitioId)))
    .limit(1);

  if (existing.length > 0) {
    throw new Error('Ya existe un corte de stock para este sitio en la fecha indicada.');
  }

  // 1. Snapshot equipos for the site (not deleted)
  const equiposRows = await db
    .select({
      id: equipos.id,
      serialNumber: equipos.serialNumber,
      hostname: equipos.hostname,
      tipo: equipos.tipo,
      marca: equipos.marca,
      modelo: equipos.modelo,
      estado: equipos.estado,
      colaboradorNombre: colaboradores.nombre,
    })
    .from(equipos)
    .leftJoin(colaboradores, eq(equipos.colaboradorId, colaboradores.id))
    .where(and(eq(equipos.sitioId, sitioId), isNull(equipos.deletedAt)));

  const equiposData: EquipoSnapshot[] = equiposRows.map((r) => ({
    id: r.id,
    serialNumber: r.serialNumber,
    hostname: r.hostname,
    tipo: r.tipo,
    marca: r.marca,
    modelo: r.modelo,
    estado: r.estado,
    colaboradorNombre: r.colaboradorNombre,
  }));

  // 2. Snapshot celulares for the site (not deleted)
  const celularesRows = await db
    .select({
      id: celulares.id,
      imei: celulares.imei,
      tipo: celulares.tipo,
      marca: celulares.marca,
      modelo: celulares.modelo,
      estado: celulares.estado,
      colaboradorNombre: colaboradores.nombre,
    })
    .from(celulares)
    .leftJoin(colaboradores, eq(celulares.colaboradorId, colaboradores.id))
    .where(and(eq(celulares.sitioId, sitioId), isNull(celulares.deletedAt)));

  const celularesData: CelularSnapshot[] = celularesRows.map((r) => ({
    id: r.id,
    imei: r.imei,
    tipo: r.tipo,
    marca: r.marca,
    modelo: r.modelo,
    estado: r.estado,
    colaboradorNombre: r.colaboradorNombre,
  }));

  // 3. Snapshot insumo stock for the site, JOIN insumos for name/tipo
  const insumosRows = await db
    .select({
      insumoId: insumoStock.insumoId,
      nombre: insumos.nombre,
      tipoInsumo: insumos.tipoInsumo,
      cantidad: insumoStock.cantidad,
    })
    .from(insumoStock)
    .innerJoin(insumos, eq(insumoStock.insumoId, insumos.id))
    .where(eq(insumoStock.sitioId, sitioId));

  const insumosData: InsumoSnapshot[] = insumosRows.map((r) => ({
    insumoId: r.insumoId,
    nombre: r.nombre,
    tipoInsumo: r.tipoInsumo,
    cantidad: r.cantidad,
  }));

  // 4. Snapshot lineas for the site
  const lineasRows = await db
    .select({
      id: lineas.id,
      numero: lineas.numero,
      tipoLinea: lineas.tipoLinea,
      estado: lineas.estado,
    })
    .from(lineas)
    .where(eq(lineas.sitioId, sitioId));

  const lineasData: LineaSnapshot[] = lineasRows.map((r) => ({
    id: r.id,
    numero: r.numero,
    tipoLinea: r.tipoLinea,
    estado: r.estado,
  }));

  // 5. Insert the corte record
  const [created] = await db
    .insert(cortesStock)
    .values({
      fechaCorte: fecha,
      sitioId,
      generadoPor: generadoPorId,
      equiposData: sql`${JSON.stringify(equiposData)}::jsonb`,
      celularesData: sql`${JSON.stringify(celularesData)}::jsonb`,
      insumosData: sql`${JSON.stringify(insumosData)}::jsonb`,
      lineasData: sql`${JSON.stringify(lineasData)}::jsonb`,
    })
    .returning();

  return created;
}

// ------------------------------------------------------------------
// reconciliarCorte - compare snapshot vs current state
// ------------------------------------------------------------------

export async function reconciliarCorte(corteId: string) {
  // 1. Read the corte record
  const corte = await db
    .select()
    .from(cortesStock)
    .where(eq(cortesStock.id, corteId))
    .limit(1);

  if (!corte[0]) {
    throw new Error('Corte de stock no encontrado.');
  }

  const record = corte[0];

  if (record.reconciliado) {
    throw new Error('Este corte ya fue reconciliado.');
  }

  const sitioId = record.sitioId;

  // 2. Query current state of assets for the same sitio
  const currentEquipos = await db
    .select({
      id: equipos.id,
      serialNumber: equipos.serialNumber,
      hostname: equipos.hostname,
      tipo: equipos.tipo,
      marca: equipos.marca,
      modelo: equipos.modelo,
      estado: equipos.estado,
      colaboradorNombre: colaboradores.nombre,
    })
    .from(equipos)
    .leftJoin(colaboradores, eq(equipos.colaboradorId, colaboradores.id))
    .where(and(eq(equipos.sitioId, sitioId), isNull(equipos.deletedAt)));

  const currentCelulares = await db
    .select({
      id: celulares.id,
      imei: celulares.imei,
      tipo: celulares.tipo,
      marca: celulares.marca,
      modelo: celulares.modelo,
      estado: celulares.estado,
      colaboradorNombre: colaboradores.nombre,
    })
    .from(celulares)
    .leftJoin(colaboradores, eq(celulares.colaboradorId, colaboradores.id))
    .where(and(eq(celulares.sitioId, sitioId), isNull(celulares.deletedAt)));

  const currentInsumos = await db
    .select({
      insumoId: insumoStock.insumoId,
      nombre: insumos.nombre,
      tipoInsumo: insumos.tipoInsumo,
      cantidad: insumoStock.cantidad,
    })
    .from(insumoStock)
    .innerJoin(insumos, eq(insumoStock.insumoId, insumos.id))
    .where(eq(insumoStock.sitioId, sitioId));

  const currentLineas = await db
    .select({
      id: lineas.id,
      numero: lineas.numero,
      tipoLinea: lineas.tipoLinea,
      estado: lineas.estado,
    })
    .from(lineas)
    .where(eq(lineas.sitioId, sitioId));

  // 3. Compute differences
  const snapshotEquipos = (record.equiposData as EquipoSnapshot[]) || [];
  const snapshotCelulares = (record.celularesData as CelularSnapshot[]) || [];
  const snapshotInsumos = (record.insumosData as InsumoSnapshot[]) || [];
  const snapshotLineas = (record.lineasData as LineaSnapshot[]) || [];

  // Equipos diff
  const snapshotEquiposMap = new Map(snapshotEquipos.map((e) => [e.id, e]));
  const currentEquiposMap = new Map(currentEquipos.map((e) => [e.id, e]));

  const equiposAdded: EquipoSnapshot[] = [];
  const equiposRemoved: EquipoSnapshot[] = [];
  const equiposChanged: { before: EquipoSnapshot; after: EquipoSnapshot }[] = [];

  for (const [id, current] of currentEquiposMap) {
    const snapshot = snapshotEquiposMap.get(id);
    if (!snapshot) {
      equiposAdded.push(current as EquipoSnapshot);
    } else if (snapshot.estado !== current.estado) {
      equiposChanged.push({
        before: snapshot,
        after: current as EquipoSnapshot,
      });
    }
  }
  for (const [id, snapshot] of snapshotEquiposMap) {
    if (!currentEquiposMap.has(id)) {
      equiposRemoved.push(snapshot);
    }
  }

  // Celulares diff
  const snapshotCelularesMap = new Map(snapshotCelulares.map((c) => [c.id, c]));
  const currentCelularesMap = new Map(currentCelulares.map((c) => [c.id, c]));

  const celularesAdded: CelularSnapshot[] = [];
  const celularesRemoved: CelularSnapshot[] = [];
  const celularesChanged: { before: CelularSnapshot; after: CelularSnapshot }[] = [];

  for (const [id, current] of currentCelularesMap) {
    const snapshot = snapshotCelularesMap.get(id);
    if (!snapshot) {
      celularesAdded.push(current as CelularSnapshot);
    } else if (snapshot.estado !== current.estado) {
      celularesChanged.push({
        before: snapshot,
        after: current as CelularSnapshot,
      });
    }
  }
  for (const [id, snapshot] of snapshotCelularesMap) {
    if (!currentCelularesMap.has(id)) {
      celularesRemoved.push(snapshot);
    }
  }

  // Insumos diff (compare by insumoId)
  const snapshotInsumosMap = new Map(snapshotInsumos.map((i) => [i.insumoId, i]));
  const currentInsumosMap = new Map(currentInsumos.map((i) => [i.insumoId, i]));

  const insumosChanged: { before: InsumoSnapshot; after: InsumoSnapshot }[] = [];

  for (const [insumoId, current] of currentInsumosMap) {
    const snapshot = snapshotInsumosMap.get(insumoId);
    if (snapshot && snapshot.cantidad !== current.cantidad) {
      insumosChanged.push({
        before: snapshot,
        after: current as InsumoSnapshot,
      });
    }
  }

  // Lineas diff
  const snapshotLineasMap = new Map(snapshotLineas.map((l) => [l.id, l]));
  const currentLineasMap = new Map(currentLineas.map((l) => [l.id, l]));

  const lineasAdded: LineaSnapshot[] = [];
  const lineasRemoved: LineaSnapshot[] = [];

  for (const [id, current] of currentLineasMap) {
    if (!snapshotLineasMap.has(id)) {
      lineasAdded.push(current as LineaSnapshot);
    }
  }
  for (const [id, snapshot] of snapshotLineasMap) {
    if (!currentLineasMap.has(id)) {
      lineasRemoved.push(snapshot);
    }
  }

  const diferencias: DiferenciasData = {
    equipos: { added: equiposAdded, removed: equiposRemoved, changed: equiposChanged },
    celulares: { added: celularesAdded, removed: celularesRemoved, changed: celularesChanged },
    insumos: { changed: insumosChanged },
    lineas: { added: lineasAdded, removed: lineasRemoved },
  };

  // 4. Update the corte record
  const [updated] = await db
    .update(cortesStock)
    .set({
      reconciliado: true,
      diferencias: sql`${JSON.stringify(diferencias)}::jsonb`,
    })
    .where(eq(cortesStock.id, corteId))
    .returning();

  return updated;
}
