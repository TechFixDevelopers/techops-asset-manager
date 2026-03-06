import { db } from '@/lib/db';
import { equipos, celulares, insumos, insumoStock, movimientos } from '@/lib/db/schema';
import { eq, isNull, count, sql, gte, desc } from 'drizzle-orm';
import type { DashboardStats } from '@/lib/types/database';

export interface ChartData {
  equiposByEstado: { estado: string; count: number }[];
  celularesByEstado: { estado: string; count: number }[];
  movimientosPorDia: { fecha: string; count: number }[];
}

export interface RecentActivityItem {
  id: string;
  tipo: string;
  colaboradorNombre: string | null;
  operadorNombre: string | null;
  serialRef: string | null;
  imeiRef: string | null;
  sitioNombre: string | null;
  comentarios: string | null;
  createdAt: Date | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    equipoStats,
    celularStats,
    insumoStats,
    movimientoStats,
  ] = await Promise.all([
    // Equipos stats
    db
      .select({
        total: count(),
        asignados: sql<number>`COUNT(*) FILTER (WHERE ${equipos.estado} = 'ACTIVO')`,
        enStock: sql<number>`COUNT(*) FILTER (WHERE ${equipos.estado} = 'STOCK')`,
        obsoletos: sql<number>`COUNT(*) FILTER (WHERE ${equipos.obsoleto} = true)`,
      })
      .from(equipos)
      .where(isNull(equipos.deletedAt)),

    // Celulares stats
    db
      .select({
        total: count(),
        activos: sql<number>`COUNT(*) FILTER (WHERE ${celulares.estado} = 'ACTIVO')`,
        enStock: sql<number>`COUNT(*) FILTER (WHERE ${celulares.estado} = 'STOCK')`,
        robados: sql<number>`COUNT(*) FILTER (WHERE ${celulares.estado} = 'ROBADO')`,
      })
      .from(celulares)
      .where(isNull(celulares.deletedAt)),

    // Insumos below minimum stock
    db
      .select({
        bajoStock: sql<number>`COUNT(DISTINCT ${insumos.id})`,
      })
      .from(insumos)
      .leftJoin(insumoStock, eq(insumos.id, insumoStock.insumoId))
      .where(
        sql`COALESCE((SELECT SUM(${insumoStock.cantidad}) FROM ${insumoStock} WHERE ${insumoStock.insumoId} = ${insumos.id}), 0) < ${insumos.cantidadMin}`,
      ),

    // Movimientos in last 30 days
    db
      .select({ ultimoMes: count() })
      .from(movimientos)
      .where(gte(movimientos.createdAt, thirtyDaysAgo)),
  ]);

  return {
    equipos: {
      total: equipoStats[0]?.total ?? 0,
      asignados: Number(equipoStats[0]?.asignados ?? 0),
      enStock: Number(equipoStats[0]?.enStock ?? 0),
      obsoletos: Number(equipoStats[0]?.obsoletos ?? 0),
    },
    celulares: {
      total: celularStats[0]?.total ?? 0,
      activos: Number(celularStats[0]?.activos ?? 0),
      enStock: Number(celularStats[0]?.enStock ?? 0),
      robados: Number(celularStats[0]?.robados ?? 0),
    },
    insumos: {
      bajoStock: Number(insumoStats[0]?.bajoStock ?? 0),
    },
    movimientos: {
      ultimoMes: movimientoStats[0]?.ultimoMes ?? 0,
    },
  };
}

export async function getChartData(): Promise<ChartData> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [equiposByEstado, celularesByEstado, movimientosPorDia] = await Promise.all([
    db.select({ estado: equipos.estado, count: count() })
      .from(equipos)
      .where(isNull(equipos.deletedAt))
      .groupBy(equipos.estado),

    db.select({ estado: celulares.estado, count: count() })
      .from(celulares)
      .where(isNull(celulares.deletedAt))
      .groupBy(celulares.estado),

    db.select({
      fecha: sql<string>`TO_CHAR(${movimientos.createdAt}::date, 'YYYY-MM-DD')`,
      count: count(),
    })
      .from(movimientos)
      .where(gte(movimientos.createdAt, thirtyDaysAgo))
      .groupBy(sql`${movimientos.createdAt}::date`)
      .orderBy(sql`${movimientos.createdAt}::date`),
  ]);

  return {
    equiposByEstado: equiposByEstado.map(r => ({ estado: r.estado, count: r.count })),
    celularesByEstado: celularesByEstado.map(r => ({ estado: r.estado, count: r.count })),
    movimientosPorDia: movimientosPorDia.map(r => ({ fecha: r.fecha, count: r.count })),
  };
}

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const rows = await db.query.movimientos.findMany({
    orderBy: [desc(movimientos.createdAt)],
    limit: 10,
    columns: {
      id: true,
      tipo: true,
      serialRef: true,
      imeiRef: true,
      comentarios: true,
      createdAt: true,
    },
    with: {
      colaborador: { columns: { nombre: true } },
      operador: { columns: { nombre: true } },
      equipo: { columns: { serialNumber: true } },
      celular: { columns: { imei: true } },
      sitio: { columns: { nombre: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    tipo: row.tipo,
    colaboradorNombre: row.colaborador?.nombre ?? null,
    operadorNombre: row.operador?.nombre ?? null,
    serialRef: row.serialRef ?? row.equipo?.serialNumber ?? null,
    imeiRef: row.imeiRef ?? row.celular?.imei ?? null,
    sitioNombre: row.sitio?.nombre ?? null,
    comentarios: row.comentarios,
    createdAt: row.createdAt,
  }));
}
