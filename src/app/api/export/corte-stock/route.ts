import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import {
  movimientos,
  equipos,
  celulares,
  insumos,
  colaboradores,
  sitios,
  appUsers,
} from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import * as XLSX from 'xlsx';

/**
 * Export "Corte de Stock" — a report of all items that left inventory
 * (devolutions, robberies, transfers, etc.) with estado, ticket, and date.
 *
 * Optional query params:
 *   ?sitioId=<uuid>  — filter by site
 *   ?desde=<ISO>     — from date
 *   ?hasta=<ISO>     — to date
 */

const TIPOS_BAJA = [
  'DEVOLUCION_PC',
  'DEVOLUCION_CEL',
  'ENTREGA_INSUMO',
  'ROBO',
  'OFFBOARDING',
  'RECAMBIO',
  'TRANSFERENCIA',
];

export const GET = withAuth('read', 'cortes', async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sitioId = searchParams.get('sitioId');
  const desde = searchParams.get('desde');
  const hasta = searchParams.get('hasta');

  // Build conditions
  const conditions = [inArray(movimientos.tipo, TIPOS_BAJA)];
  if (sitioId) conditions.push(eq(movimientos.sitioId, sitioId));
  if (desde) conditions.push(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (movimientos.createdAt as any).gte(new Date(desde))
  );
  if (hasta) conditions.push(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (movimientos.createdAt as any).lte(new Date(hasta))
  );

  const data = await db
    .select({
      id: movimientos.id,
      tipo: movimientos.tipo,
      serialRef: movimientos.serialRef,
      imeiRef: movimientos.imeiRef,
      estadoAnterior: movimientos.estadoAnterior,
      estadoNuevo: movimientos.estadoNuevo,
      motivo: movimientos.motivo,
      cantidad: movimientos.cantidad,
      comentarios: movimientos.comentarios,
      ticketSnow: movimientos.ticketSnow,
      createdAt: movimientos.createdAt,
      // Joined
      colaboradorNombre: colaboradores.nombre,
      colaboradorLegajo: colaboradores.legajo,
      operadorNombre: appUsers.nombre,
      equipoSerial: equipos.serialNumber,
      equipoTipo: equipos.tipo,
      equipoMarca: equipos.marca,
      equipoModelo: equipos.modelo,
      equipoEstado: equipos.estado,
      celularImei: celulares.imei,
      celularTipo: celulares.tipo,
      celularMarca: celulares.marca,
      celularModelo: celulares.modelo,
      celularEstado: celulares.estado,
      insumoNombre: insumos.nombre,
      insumoTipo: insumos.tipoInsumo,
      sitioNombre: sitios.nombre,
    })
    .from(movimientos)
    .leftJoin(colaboradores, eq(movimientos.colaboradorId, colaboradores.id))
    .leftJoin(appUsers, eq(movimientos.operadorId, appUsers.id))
    .leftJoin(equipos, eq(movimientos.equipoId, equipos.id))
    .leftJoin(celulares, eq(movimientos.celularId, celulares.id))
    .leftJoin(insumos, eq(movimientos.insumoId, insumos.id))
    .leftJoin(sitios, eq(movimientos.sitioId, sitios.id))
    .where(and(...conditions))
    .orderBy(desc(movimientos.createdAt));

  // Build sheets: Equipos, Celulares, Insumos
  const equipoRows = data
    .filter((r) => r.equipoSerial || r.serialRef)
    .map((r) => ({
      'FECHA': r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      'TIPO MOVIMIENTO': r.tipo,
      'SERIAL NUMBER': r.equipoSerial ?? r.serialRef ?? '',
      'TIPO EQUIPO': r.equipoTipo ?? '',
      'MARCA': r.equipoMarca ?? '',
      'MODELO': r.equipoModelo ?? '',
      'ESTADO ANTERIOR': r.estadoAnterior ?? '',
      'ESTADO ACTUAL': r.estadoNuevo ?? r.equipoEstado ?? '',
      'COLABORADOR': r.colaboradorNombre ?? '',
      'LEGAJO': r.colaboradorLegajo ?? '',
      'PLANTA': r.sitioNombre ?? '',
      'MOTIVO': r.motivo ?? '',
      'TICKET SNOW': r.ticketSnow ?? '',
      'COMENTARIOS': r.comentarios ?? '',
      'OPERADOR': r.operadorNombre ?? '',
    }));

  const celularRows = data
    .filter((r) => r.celularImei || r.imeiRef)
    .map((r) => ({
      'FECHA': r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      'TIPO MOVIMIENTO': r.tipo,
      'IMEI': r.celularImei ?? r.imeiRef ?? '',
      'TIPO': r.celularTipo ?? '',
      'MARCA': r.celularMarca ?? '',
      'MODELO': r.celularModelo ?? '',
      'ESTADO ANTERIOR': r.estadoAnterior ?? '',
      'ESTADO ACTUAL': r.estadoNuevo ?? r.celularEstado ?? '',
      'COLABORADOR': r.colaboradorNombre ?? '',
      'LEGAJO': r.colaboradorLegajo ?? '',
      'PLANTA': r.sitioNombre ?? '',
      'MOTIVO': r.motivo ?? '',
      'TICKET SNOW': r.ticketSnow ?? '',
      'COMENTARIOS': r.comentarios ?? '',
      'OPERADOR': r.operadorNombre ?? '',
    }));

  const insumoRows = data
    .filter((r) => r.insumoNombre)
    .map((r) => ({
      'FECHA': r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      'TIPO MOVIMIENTO': r.tipo,
      'INSUMO': r.insumoNombre ?? '',
      'TIPO INSUMO': r.insumoTipo ?? '',
      'CANTIDAD': r.cantidad ?? '',
      'COLABORADOR': r.colaboradorNombre ?? '',
      'LEGAJO': r.colaboradorLegajo ?? '',
      'PLANTA': r.sitioNombre ?? '',
      'MOTIVO': r.motivo ?? '',
      'TICKET SNOW': r.ticketSnow ?? '',
      'COMENTARIOS': r.comentarios ?? '',
      'OPERADOR': r.operadorNombre ?? '',
    }));

  // Create workbook
  const wb = XLSX.utils.book_new();

  const wsEquipos = XLSX.utils.json_to_sheet(
    equipoRows.length > 0 ? equipoRows : [{ 'FECHA': 'Sin movimientos' }]
  );
  XLSX.utils.book_append_sheet(wb, wsEquipos, 'Equipos');

  const wsCelulares = XLSX.utils.json_to_sheet(
    celularRows.length > 0 ? celularRows : [{ 'FECHA': 'Sin movimientos' }]
  );
  XLSX.utils.book_append_sheet(wb, wsCelulares, 'Celulares');

  const wsInsumos = XLSX.utils.json_to_sheet(
    insumoRows.length > 0 ? insumoRows : [{ 'FECHA': 'Sin movimientos' }]
  );
  XLSX.utils.book_append_sheet(wb, wsInsumos, 'Insumos');

  // Set column widths
  const colWidths = [
    { wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 12 },
    { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 10 },
    { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 15 },
  ];
  wsEquipos['!cols'] = colWidths;
  wsCelulares['!cols'] = colWidths;
  wsInsumos['!cols'] = colWidths.slice(0, 12);

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Corte_Stock_${date}.xlsx"`,
    },
  });
}, { skipCsrf: true });
