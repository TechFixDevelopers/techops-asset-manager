import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
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

export const GET = withAuth('read', 'app_users', async () => {
  const [
    empresasData,
    sitiosData,
    colaboradoresData,
    equiposData,
    celularesData,
    lineasData,
    monitoresData,
    insumosData,
    insumoStockData,
    movimientosData,
    cortesStockData,
    ticketsSnowData,
    wikiPagesData,
    linksUtilesData,
    reparacionesData,
  ] = await Promise.all([
    db.select().from(empresas),
    db.select().from(sitios),
    db.select().from(colaboradores),
    db.select().from(equipos),
    db.select().from(celulares),
    db.select().from(lineas),
    db.select().from(monitores),
    db.select().from(insumos),
    db.select().from(insumoStock),
    db.select().from(movimientos),
    db.select().from(cortesStock),
    db.select().from(ticketsSnow),
    db.select().from(wikiPages),
    db.select().from(linksUtiles),
    db.select().from(reparaciones),
  ]);

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tables: {
      empresas: empresasData,
      sitios: sitiosData,
      colaboradores: colaboradoresData,
      equipos: equiposData,
      celulares: celularesData,
      lineas: lineasData,
      monitores: monitoresData,
      insumos: insumosData,
      insumo_stock: insumoStockData,
      movimientos: movimientosData,
      cortes_stock: cortesStockData,
      tickets_snow: ticketsSnowData,
      wiki_pages: wikiPagesData,
      links_utiles: linksUtilesData,
      reparaciones: reparacionesData,
    },
    counts: {
      empresas: empresasData.length,
      sitios: sitiosData.length,
      colaboradores: colaboradoresData.length,
      equipos: equiposData.length,
      celulares: celularesData.length,
      lineas: lineasData.length,
      monitores: monitoresData.length,
      insumos: insumosData.length,
      insumo_stock: insumoStockData.length,
      movimientos: movimientosData.length,
      cortes_stock: cortesStockData.length,
      tickets_snow: ticketsSnowData.length,
      wiki_pages: wikiPagesData.length,
      links_utiles: linksUtilesData.length,
      reparaciones: reparacionesData.length,
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="techops-backup-${date}.json"`,
    },
  });
}, { skipCsrf: true });
