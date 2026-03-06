import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import {
  empresas,
  sitios,
  colaboradores,
  equipos,
  celulares,
  lineas,
  monitores,
  insumos,
  insumoStock,
  movimientos,
  cortesStock,
  ticketsSnow,
  wikiPages,
  linksUtiles,
  reparaciones,
} from '@/lib/db/schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTable = any;

const BATCH_SIZE = 500;

async function batchInsert(table: AnyTable, records: AnyTable[]) {
  if (!records || records.length === 0) return 0;
  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(table).values(batch).onConflictDoNothing();
      inserted += batch.length;
    } catch {
      // Try one-by-one on batch error
      for (const record of batch) {
        try {
          await db.insert(table).values(record).onConflictDoNothing();
          inserted++;
        } catch {
          // Skip individual record errors
        }
      }
    }
  }
  return inserted;
}

export const POST = withAuth('create', 'app_users', async (req: NextRequest) => {
  try {
    const body = await req.json();

    if (!body.tables || !body.version) {
      return NextResponse.json(
        { error: 'Formato de backup inválido. Se requiere version y tables.' },
        { status: 400 },
      );
    }

    const tables = body.tables;
    const mode = body.mode || 'merge'; // 'merge' = add missing, 'replace' = clear + insert
    const results: Record<string, number> = {};

    if (mode === 'replace') {
      // Clear tables in reverse dependency order
      await db.execute(sql`DELETE FROM tickets_snow`);
      await db.execute(sql`DELETE FROM cortes_stock`);
      await db.execute(sql`DELETE FROM movimientos`);
      await db.execute(sql`DELETE FROM insumo_stock`);
      await db.execute(sql`DELETE FROM reparaciones`);
      await db.execute(sql`DELETE FROM monitores`);
      await db.execute(sql`DELETE FROM celulares`);
      await db.execute(sql`DELETE FROM equipos`);
      await db.execute(sql`DELETE FROM lineas`);
      await db.execute(sql`DELETE FROM colaboradores`);
      await db.execute(sql`DELETE FROM wiki_pages`);
      await db.execute(sql`DELETE FROM links_utiles`);
      await db.execute(sql`DELETE FROM sitios`);
      await db.execute(sql`DELETE FROM empresas`);
    }

    // Insert in dependency order
    if (tables.empresas) results.empresas = await batchInsert(empresas, tables.empresas);
    if (tables.sitios) results.sitios = await batchInsert(sitios, tables.sitios);
    if (tables.colaboradores) results.colaboradores = await batchInsert(colaboradores, tables.colaboradores);
    if (tables.lineas) results.lineas = await batchInsert(lineas, tables.lineas);
    if (tables.equipos) results.equipos = await batchInsert(equipos, tables.equipos);
    if (tables.celulares) results.celulares = await batchInsert(celulares, tables.celulares);
    if (tables.monitores) results.monitores = await batchInsert(monitores, tables.monitores);
    if (tables.insumos) results.insumos = await batchInsert(insumos, tables.insumos);
    if (tables.insumo_stock) results.insumo_stock = await batchInsert(insumoStock, tables.insumo_stock);
    if (tables.reparaciones) results.reparaciones = await batchInsert(reparaciones, tables.reparaciones);
    if (tables.movimientos) results.movimientos = await batchInsert(movimientos, tables.movimientos);
    if (tables.cortes_stock) results.cortes_stock = await batchInsert(cortesStock, tables.cortes_stock);
    if (tables.tickets_snow) results.tickets_snow = await batchInsert(ticketsSnow, tables.tickets_snow);
    if (tables.wiki_pages) results.wiki_pages = await batchInsert(wikiPages, tables.wiki_pages);
    if (tables.links_utiles) results.links_utiles = await batchInsert(linksUtiles, tables.links_utiles);

    return NextResponse.json({
      success: true,
      mode,
      imported: results,
    });
  } catch (err) {
    console.error('DB import error:', err);
    return NextResponse.json(
      { error: `Import failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
});
