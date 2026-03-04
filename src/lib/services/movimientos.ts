import { db } from '@/lib/db';
import {
  movimientos,
  equipos,
  celulares,
  monitores,
  insumos,
  insumoStock,
  colaboradores,
  sitios,
  appUsers,
} from '@/lib/db/schema';
import { eq, and, desc, count, ilike, or, gte, lte, isNull } from 'drizzle-orm';
import type { PaginatedResponse } from '@/lib/types/database';
import type { CreateMovimientoInput } from '@/lib/validations/movimiento';

// ============================================================
// Search Params
// ============================================================

export interface MovimientoSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tipo?: string;
  colaboradorId?: string;
  equipoId?: string;
  celularId?: string;
  insumoId?: string;
  monitorId?: string;
  sitioId?: string;
  desde?: string; // ISO date
  hasta?: string; // ISO date
}

// ============================================================
// List Movimientos (paginated with LEFT JOINs)
// ============================================================

export async function listMovimientos(params: MovimientoSearchParams) {
  const { page = 1, pageSize = 25, search, tipo, colaboradorId, equipoId, celularId, insumoId, monitorId, sitioId, desde, hasta } = params;
  const offset = (page - 1) * pageSize;

  // Build dynamic where conditions
  const conditions = [];
  if (tipo) conditions.push(eq(movimientos.tipo, tipo));
  if (colaboradorId) conditions.push(eq(movimientos.colaboradorId, colaboradorId));
  if (equipoId) conditions.push(eq(movimientos.equipoId, equipoId));
  if (celularId) conditions.push(eq(movimientos.celularId, celularId));
  if (insumoId) conditions.push(eq(movimientos.insumoId, insumoId));
  if (monitorId) conditions.push(eq(movimientos.monitorId, monitorId));
  if (sitioId) conditions.push(eq(movimientos.sitioId, sitioId));
  if (desde) conditions.push(gte(movimientos.createdAt, new Date(desde)));
  if (hasta) conditions.push(lte(movimientos.createdAt, new Date(hasta)));
  if (search) {
    conditions.push(
      or(
        ilike(movimientos.motivo, `%${search}%`),
        ilike(movimientos.comentarios, `%${search}%`),
        ilike(movimientos.ticketSnow, `%${search}%`),
        ilike(movimientos.serialRef, `%${search}%`),
        ilike(movimientos.imeiRef, `%${search}%`),
      )!,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        // All movimiento columns
        id: movimientos.id,
        tipo: movimientos.tipo,
        colaboradorId: movimientos.colaboradorId,
        operadorId: movimientos.operadorId,
        equipoId: movimientos.equipoId,
        celularId: movimientos.celularId,
        insumoId: movimientos.insumoId,
        monitorId: movimientos.monitorId,
        serialRef: movimientos.serialRef,
        imeiRef: movimientos.imeiRef,
        sitioId: movimientos.sitioId,
        motivo: movimientos.motivo,
        estadoAnterior: movimientos.estadoAnterior,
        estadoNuevo: movimientos.estadoNuevo,
        cantidad: movimientos.cantidad,
        comentarios: movimientos.comentarios,
        ticketSnow: movimientos.ticketSnow,
        metadata: movimientos.metadata,
        createdAt: movimientos.createdAt,
        // Joined fields
        colaboradorNombre: colaboradores.nombre,
        operadorNombre: appUsers.nombre,
        equipoSerial: equipos.serialNumber,
        celularImei: celulares.imei,
        insumoNombre: insumos.nombre,
        monitorSerial: monitores.serialNumber,
        sitioNombre: sitios.nombre,
      })
      .from(movimientos)
      .leftJoin(colaboradores, eq(movimientos.colaboradorId, colaboradores.id))
      .leftJoin(appUsers, eq(movimientos.operadorId, appUsers.id))
      .leftJoin(equipos, eq(movimientos.equipoId, equipos.id))
      .leftJoin(celulares, eq(movimientos.celularId, celulares.id))
      .leftJoin(insumos, eq(movimientos.insumoId, insumos.id))
      .leftJoin(monitores, eq(movimientos.monitorId, monitores.id))
      .leftJoin(sitios, eq(movimientos.sitioId, sitios.id))
      .where(where)
      .orderBy(desc(movimientos.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(movimientos)
      .where(where),
  ]);

  const total = totalResult[0]?.total ?? 0;

  // Map joined columns back into nested objects
  const mapped = data.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    colaboradorId: row.colaboradorId,
    operadorId: row.operadorId,
    equipoId: row.equipoId,
    celularId: row.celularId,
    insumoId: row.insumoId,
    monitorId: row.monitorId,
    serialRef: row.serialRef,
    imeiRef: row.imeiRef,
    sitioId: row.sitioId,
    motivo: row.motivo,
    estadoAnterior: row.estadoAnterior,
    estadoNuevo: row.estadoNuevo,
    cantidad: row.cantidad,
    comentarios: row.comentarios,
    ticketSnow: row.ticketSnow,
    metadata: row.metadata,
    createdAt: row.createdAt,
    colaborador: row.colaboradorNombre ? { nombre: row.colaboradorNombre } : null,
    operador: row.operadorNombre !== undefined ? { nombre: row.operadorNombre } : null,
    equipo: row.equipoSerial ? { serialNumber: row.equipoSerial } : null,
    celular: row.celularImei ? { imei: row.celularImei } : null,
    insumo: row.insumoNombre ? { nombre: row.insumoNombre } : null,
    monitor: row.monitorSerial ? { serialNumber: row.monitorSerial } : null,
    sitio: row.sitioNombre ? { nombre: row.sitioNombre } : null,
  }));

  return {
    data: mapped,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  } satisfies PaginatedResponse<(typeof mapped)[number]>;
}

// ============================================================
// Get Movimiento by ID (with relational query)
// ============================================================

export async function getMovimientoById(id: string) {
  const movimiento = await db.query.movimientos.findFirst({
    where: eq(movimientos.id, id),
    with: {
      colaborador: true,
      operador: true,
      equipo: true,
      celular: true,
      insumo: true,
      monitor: true,
      sitio: true,
    },
  });

  return movimiento ?? null;
}

// ============================================================
// Create Movimiento (transactional)
// ============================================================

export async function createMovimiento(data: CreateMovimientoInput, operadorId: string) {
  return db.transaction(async (tx) => {
    switch (data.tipo) {
      case 'ASIGNACION_PC':
        return handleAsignacionPC(tx, data, operadorId);
      case 'DEVOLUCION_PC':
        return handleDevolucionPC(tx, data, operadorId);
      case 'ASIGNACION_CEL':
        return handleAsignacionCel(tx, data, operadorId);
      case 'DEVOLUCION_CEL':
        return handleDevolucionCel(tx, data, operadorId);
      case 'ENTREGA_INSUMO':
        return handleEntregaInsumo(tx, data, operadorId);
      case 'TRANSFERENCIA':
        return handleTransferencia(tx, data, operadorId);
      default:
        return handleGeneric(tx, data, operadorId);
    }
  });
}

// ============================================================
// Transaction type alias
// ============================================================

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ============================================================
// ASIGNACION_PC Handler
// ============================================================

async function handleAsignacionPC(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  // 1. Fetch equipo
  const equipo = await tx.query.equipos.findFirst({
    where: and(eq(equipos.id, data.equipoId!), isNull(equipos.deletedAt)),
  });

  if (!equipo) {
    throw new Error('Equipo no encontrado');
  }

  // 2. Validate equipo is in assignable state
  if (equipo.estado === 'ACTIVO') {
    throw new Error('El equipo ya se encuentra asignado (estado ACTIVO)');
  }

  if (equipo.estado !== 'STOCK' && equipo.estado !== 'STOCK AREA') {
    throw new Error(`El equipo no está disponible para asignación (estado actual: ${equipo.estado})`);
  }

  // 3. Validate colaborador exists
  const colaborador = await tx.query.colaboradores.findFirst({
    where: and(eq(colaboradores.id, data.colaboradorId!), isNull(colaboradores.deletedAt)),
  });

  if (!colaborador) {
    throw new Error('Colaborador no encontrado');
  }

  // 4. Insert movimiento
  const [movimiento] = await tx
    .insert(movimientos)
    .values({
      tipo: 'ASIGNACION_PC',
      operadorId,
      colaboradorId: data.colaboradorId!,
      equipoId: data.equipoId!,
      sitioId: data.sitioId!,
      serialRef: equipo.serialNumber,
      estadoAnterior: equipo.estado,
      estadoNuevo: 'ACTIVO',
      motivo: data.motivo,
      comentarios: data.comentarios,
      ticketSnow: data.ticketSnow,
    })
    .returning();

  // 5. Update equipo state
  await tx
    .update(equipos)
    .set({
      estado: 'ACTIVO',
      estadoSecundario: 'ASIGNADO',
      colaboradorId: data.colaboradorId!,
      sitioId: data.sitioId!,
      motivoAsignacion: data.motivo ?? null,
      fechaAsignacion: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(eq(equipos.id, data.equipoId!));

  return movimiento;
}

// ============================================================
// DEVOLUCION_PC Handler
// ============================================================

async function handleDevolucionPC(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  // 1. Fetch equipo
  const equipo = await tx.query.equipos.findFirst({
    where: and(eq(equipos.id, data.equipoId!), isNull(equipos.deletedAt)),
  });

  if (!equipo) {
    throw new Error('Equipo no encontrado');
  }

  // 2. Record previous state
  const estadoAnterior = equipo.estado;
  const previousColaboradorId = equipo.colaboradorId;

  // 3. Insert movimiento
  const [movimiento] = await tx
    .insert(movimientos)
    .values({
      tipo: 'DEVOLUCION_PC',
      operadorId,
      colaboradorId: previousColaboradorId,
      equipoId: data.equipoId!,
      sitioId: data.sitioId,
      serialRef: equipo.serialNumber,
      estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      motivo: data.motivo,
      comentarios: data.comentarios,
      ticketSnow: data.ticketSnow,
    })
    .returning();

  // 4. Update equipo state
  await tx
    .update(equipos)
    .set({
      estado: data.estadoNuevo!,
      estadoSecundario: 'DISPONIBLE',
      colaboradorId: null,
      motivoAsignacion: null,
      fechaAsignacion: null,
      updatedAt: new Date(),
    })
    .where(eq(equipos.id, data.equipoId!));

  return movimiento;
}

// ============================================================
// ASIGNACION_CEL Handler
// ============================================================

async function handleAsignacionCel(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  // 1. Fetch celular
  const celular = await tx.query.celulares.findFirst({
    where: and(eq(celulares.id, data.celularId!), isNull(celulares.deletedAt)),
  });

  if (!celular) {
    throw new Error('Celular no encontrado');
  }

  // 2. Validate celular is in assignable state
  if (celular.estado === 'ACTIVO') {
    throw new Error('El celular ya se encuentra asignado (estado ACTIVO)');
  }

  if (celular.estado !== 'STOCK' && celular.estado !== 'STOCK AREA') {
    throw new Error(`El celular no está disponible para asignación (estado actual: ${celular.estado})`);
  }

  // 3. Validate colaborador exists
  const colaborador = await tx.query.colaboradores.findFirst({
    where: and(eq(colaboradores.id, data.colaboradorId!), isNull(colaboradores.deletedAt)),
  });

  if (!colaborador) {
    throw new Error('Colaborador no encontrado');
  }

  // 4. Insert movimiento
  const [movimiento] = await tx
    .insert(movimientos)
    .values({
      tipo: 'ASIGNACION_CEL',
      operadorId,
      colaboradorId: data.colaboradorId!,
      celularId: data.celularId!,
      sitioId: data.sitioId!,
      imeiRef: celular.imei,
      estadoAnterior: celular.estado,
      estadoNuevo: 'ACTIVO',
      motivo: data.motivo,
      comentarios: data.comentarios,
      ticketSnow: data.ticketSnow,
    })
    .returning();

  // 5. Update celular state
  await tx
    .update(celulares)
    .set({
      estado: 'ACTIVO',
      estadoSecundario: 'ASIGNADO',
      colaboradorId: data.colaboradorId!,
      sitioId: data.sitioId!,
      motivoAsignacion: data.motivo ?? null,
      fechaAsignacion: new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(eq(celulares.id, data.celularId!));

  return movimiento;
}

// ============================================================
// DEVOLUCION_CEL Handler
// ============================================================

async function handleDevolucionCel(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  // 1. Fetch celular
  const celular = await tx.query.celulares.findFirst({
    where: and(eq(celulares.id, data.celularId!), isNull(celulares.deletedAt)),
  });

  if (!celular) {
    throw new Error('Celular no encontrado');
  }

  // 2. Record previous state
  const estadoAnterior = celular.estado;
  const previousColaboradorId = celular.colaboradorId;

  // 3. Insert movimiento
  const [movimiento] = await tx
    .insert(movimientos)
    .values({
      tipo: 'DEVOLUCION_CEL',
      operadorId,
      colaboradorId: previousColaboradorId,
      celularId: data.celularId!,
      sitioId: data.sitioId,
      imeiRef: celular.imei,
      estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      motivo: data.motivo,
      comentarios: data.comentarios,
      ticketSnow: data.ticketSnow,
    })
    .returning();

  // 4. Update celular state
  await tx
    .update(celulares)
    .set({
      estado: data.estadoNuevo!,
      estadoSecundario: 'DISPONIBLE',
      colaboradorId: null,
      motivoAsignacion: null,
      fechaAsignacion: null,
      updatedAt: new Date(),
    })
    .where(eq(celulares.id, data.celularId!));

  return movimiento;
}

// ============================================================
// ENTREGA_INSUMO Handler
// ============================================================

async function handleEntregaInsumo(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  // 1. Fetch insumo
  const insumo = await tx.query.insumos.findFirst({
    where: eq(insumos.id, data.insumoId!),
  });

  if (!insumo) {
    throw new Error('Insumo no encontrado');
  }

  // 2. Find stock record for this insumo + sitio combination
  const stockRecord = await tx.query.insumoStock.findFirst({
    where: and(
      eq(insumoStock.insumoId, data.insumoId!),
      eq(insumoStock.sitioId, data.sitioId!),
    ),
  });

  if (!stockRecord || !stockRecord.cantidad || stockRecord.cantidad < data.cantidad!) {
    throw new Error('Stock insuficiente');
  }

  // 3. Insert movimiento
  const [movimiento] = await tx
    .insert(movimientos)
    .values({
      tipo: 'ENTREGA_INSUMO',
      operadorId,
      colaboradorId: data.colaboradorId,
      insumoId: data.insumoId!,
      sitioId: data.sitioId!,
      cantidad: data.cantidad,
      motivo: data.motivo,
      comentarios: data.comentarios,
      ticketSnow: data.ticketSnow,
    })
    .returning();

  // 4. Decrement stock
  await tx
    .update(insumoStock)
    .set({
      cantidad: stockRecord.cantidad - data.cantidad!,
      updatedAt: new Date(),
    })
    .where(eq(insumoStock.id, stockRecord.id));

  return movimiento;
}

// ============================================================
// TRANSFERENCIA Handler
// ============================================================

async function handleTransferencia(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  // Determine which asset is being transferred
  if (data.equipoId) {
    const equipo = await tx.query.equipos.findFirst({
      where: and(eq(equipos.id, data.equipoId), isNull(equipos.deletedAt)),
    });

    if (!equipo) {
      throw new Error('Equipo no encontrado');
    }

    if (!equipo.colaboradorId) {
      throw new Error('El equipo no tiene un colaborador asignado actualmente');
    }

    const previousColaboradorId = equipo.colaboradorId;

    const [movimiento] = await tx
      .insert(movimientos)
      .values({
        tipo: 'TRANSFERENCIA',
        operadorId,
        colaboradorId: data.colaboradorId!,
        equipoId: data.equipoId,
        sitioId: data.sitioId,
        serialRef: equipo.serialNumber,
        estadoAnterior: equipo.estado,
        estadoNuevo: equipo.estado,
        motivo: data.motivo,
        comentarios: data.comentarios,
        ticketSnow: data.ticketSnow,
        metadata: { previousColaboradorId },
      })
      .returning();

    await tx
      .update(equipos)
      .set({
        colaboradorId: data.colaboradorId!,
        ...(data.sitioId ? { sitioId: data.sitioId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(equipos.id, data.equipoId));

    return movimiento;
  }

  if (data.celularId) {
    const celular = await tx.query.celulares.findFirst({
      where: and(eq(celulares.id, data.celularId), isNull(celulares.deletedAt)),
    });

    if (!celular) {
      throw new Error('Celular no encontrado');
    }

    if (!celular.colaboradorId) {
      throw new Error('El celular no tiene un colaborador asignado actualmente');
    }

    const previousColaboradorId = celular.colaboradorId;

    const [movimiento] = await tx
      .insert(movimientos)
      .values({
        tipo: 'TRANSFERENCIA',
        operadorId,
        colaboradorId: data.colaboradorId!,
        celularId: data.celularId,
        sitioId: data.sitioId,
        imeiRef: celular.imei,
        estadoAnterior: celular.estado,
        estadoNuevo: celular.estado,
        motivo: data.motivo,
        comentarios: data.comentarios,
        ticketSnow: data.ticketSnow,
        metadata: { previousColaboradorId },
      })
      .returning();

    await tx
      .update(celulares)
      .set({
        colaboradorId: data.colaboradorId!,
        ...(data.sitioId ? { sitioId: data.sitioId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(celulares.id, data.celularId));

    return movimiento;
  }

  if (data.monitorId) {
    const monitor = await tx.query.monitores.findFirst({
      where: and(eq(monitores.id, data.monitorId), isNull(monitores.deletedAt)),
    });

    if (!monitor) {
      throw new Error('Monitor no encontrado');
    }

    if (!monitor.colaboradorId) {
      throw new Error('El monitor no tiene un colaborador asignado actualmente');
    }

    const previousColaboradorId = monitor.colaboradorId;

    const [movimiento] = await tx
      .insert(movimientos)
      .values({
        tipo: 'TRANSFERENCIA',
        operadorId,
        colaboradorId: data.colaboradorId!,
        monitorId: data.monitorId,
        sitioId: data.sitioId,
        serialRef: monitor.serialNumber,
        motivo: data.motivo,
        comentarios: data.comentarios,
        ticketSnow: data.ticketSnow,
        metadata: { previousColaboradorId },
      })
      .returning();

    await tx
      .update(monitores)
      .set({
        colaboradorId: data.colaboradorId!,
        ...(data.sitioId ? { sitioId: data.sitioId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(monitores.id, data.monitorId));

    return movimiento;
  }

  throw new Error('Debe seleccionar un activo para transferir');
}

// ============================================================
// Generic Handler (ROBO, ROAMING, ONBOARDING, OFFBOARDING, RECAMBIO)
// ============================================================

async function handleGeneric(tx: Transaction, data: CreateMovimientoInput, operadorId: string) {
  let serialRef: string | undefined;
  let imeiRef: string | undefined;
  let estadoAnterior: string | undefined;

  // Determine referenced asset and capture state
  if (data.equipoId) {
    const equipo = await tx.query.equipos.findFirst({
      where: and(eq(equipos.id, data.equipoId), isNull(equipos.deletedAt)),
    });

    if (equipo) {
      serialRef = equipo.serialNumber;
      estadoAnterior = equipo.estado;
    }
  } else if (data.celularId) {
    const celular = await tx.query.celulares.findFirst({
      where: and(eq(celulares.id, data.celularId), isNull(celulares.deletedAt)),
    });

    if (celular) {
      imeiRef = celular.imei;
      estadoAnterior = celular.estado;
    }
  } else if (data.monitorId) {
    const monitor = await tx.query.monitores.findFirst({
      where: and(eq(monitores.id, data.monitorId), isNull(monitores.deletedAt)),
    });

    if (monitor) {
      serialRef = monitor.serialNumber;
    }
  }

  // Insert movimiento
  const [movimiento] = await tx
    .insert(movimientos)
    .values({
      tipo: data.tipo,
      operadorId,
      colaboradorId: data.colaboradorId,
      equipoId: data.equipoId,
      celularId: data.celularId,
      insumoId: data.insumoId,
      monitorId: data.monitorId,
      sitioId: data.sitioId,
      serialRef,
      imeiRef,
      estadoAnterior,
      estadoNuevo: data.estadoNuevo,
      cantidad: data.cantidad,
      motivo: data.motivo,
      comentarios: data.comentarios,
      ticketSnow: data.ticketSnow,
    })
    .returning();

  // If a new state is specified and an asset is referenced, update the asset
  if (data.estadoNuevo) {
    if (data.equipoId) {
      await tx
        .update(equipos)
        .set({
          estado: data.estadoNuevo,
          updatedAt: new Date(),
        })
        .where(eq(equipos.id, data.equipoId));
    } else if (data.celularId) {
      await tx
        .update(celulares)
        .set({
          estado: data.estadoNuevo,
          updatedAt: new Date(),
        })
        .where(eq(celulares.id, data.celularId));
    }
  }

  return movimiento;
}
