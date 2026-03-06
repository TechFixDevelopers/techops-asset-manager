import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import {
  empresas,
  sitios,
  colaboradores,
  lineas,
  equipos,
  celulares,
  monitores,
  insumos,
  insumoStock,
} from '@/lib/db/schema';

// ============================================================
// HELPER FUNCTIONS (mirror of scripts/import-data.ts)
// ============================================================

function excelDateToISO(serial: number | string | null | undefined): string | null {
  if (serial === null || serial === undefined || serial === '' || serial === '-') return null;
  if (typeof serial === 'string') {
    const parsed = Date.parse(serial);
    if (!isNaN(parsed)) return new Date(parsed).toISOString().split('T')[0];
    return null;
  }
  if (typeof serial !== 'number' || serial < 1) return null;
  const date = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function cleanStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || s === '-' || s === 'N/A' || s === 'n/a' || s === '#N/A') return null;
  return s;
}

function parseBool(val: unknown, trueValue = 'SI'): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  return String(val).trim().toUpperCase() === trueValue.toUpperCase();
}

function parseInt_(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  return Math.round(n);
}

function readSheet(wb: XLSX.WorkBook, sheetName: string, headerRow = 1): Record<string, unknown>[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  if (raw.length < headerRow) return [];
  const headersRaw = raw[headerRow - 1] as unknown[];
  const headers: (string | null)[] = headersRaw.map((h) =>
    h !== null && h !== undefined ? String(h).trim() : null
  );
  const data: Record<string, unknown>[] = [];
  for (let i = headerRow; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!row || row.every((v) => v === null || v === undefined || v === '')) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, j) => { if (h) obj[h] = row[j] ?? null; });
    data.push(obj);
  }
  return data;
}

// ============================================================
// LOOKUP MAPS
// ============================================================

const SITIO_ALIASES: Record<string, string> = {
  'estructura central': 'Estructura Central',
  'planta pompeya': 'Planta Pompeya',
  'cd mercado central': 'CD Mercado Central',
  'planta zarate': 'Planta Zarate',
  'planta quilmes': 'Planta Quilmes',
  'planta corrientes': 'Planta Corrientes',
  'planta tucuman': 'Planta Tucuman',
  'planta mendoza': 'Planta Mendoza',
  'cd rosario': 'CD Rosario',
  'cd cordoba': 'CD Cordoba',
  'oficina parana': 'Oficina Parana',
  'planta tres arroyos': 'Planta Tres Arroyos',
  'planta puan': 'Planta Puan',
  'cd la plata': 'CD La Plata',
  'planta llavallol': 'Planta Llavallol',
  'planta estr central': 'Estructura Central',
  'ec quilmes hq': 'Estructura Central',
  'cdd mercado central dc': 'CD Mercado Central',
  'cdd rosario dc': 'CD Rosario',
  'cdd cordoba dc': 'CD Cordoba',
  'cdd buenos aires': 'CD Mercado Central',
  'cdd tucuman': 'Planta Tucuman',
  'cdd mendoza dc': 'Planta Mendoza',
  'f. quilmes prod-dc': 'Planta Quilmes',
  'f. pompeya prod-dc': 'Planta Pompeya',
  'f. zarate prod-dc': 'Planta Zarate',
  'f. mendoza prod-dc': 'Planta Mendoza',
  'f. corrientes prod-dc': 'Planta Corrientes',
  'f. manantial prod-dc': 'Planta Tucuman',
  'f. cordoba prod-dc': 'CD Cordoba',
  'f. tres arroyos vert': 'Planta Tres Arroyos',
  'f.casaui zarate prod -dc': 'Planta Zarate',
  'f.dante robino prod': 'Planta Mendoza',
  'malteria pampa': 'Planta Puan',
  'maltería tres arroyos + f. semilla vert': 'Planta Tres Arroyos',
  'ceng rdlp': 'Estructura Central',
  'regional argentina ec': 'Estructura Central',
  'ibs - quilmes': 'Estructura Central',
  'planta casa': 'Planta Zarate',
  'planta manantial': 'Planta Tucuman',
  'planta acheral': 'Planta Tucuman',
  'solutions - quilmes': 'Estructura Central',
};

const EMPRESA_ALIASES: Record<string, string> = {
  'cmq': 'Cerveceria y Malteria Quilmes',
  'quilmes': 'Cerveceria y Malteria Quilmes',
  'cerveceria y malteria quilmes': 'Cerveceria y Malteria Quilmes',
  'cervecería y maltería quilmes': 'Cerveceria y Malteria Quilmes',
  'fnc': 'FNC',
  'pampa': 'Pampa',
  'nestle': 'Nestle',
  'nestlé': 'Nestle',
  'cympay': 'Cympay',
  'ar11': 'Cerveceria y Malteria Quilmes',
  'ar24': 'Cerveceria y Malteria Quilmes',
  'ar15': 'FNC',
};

// ============================================================
// BATCH UPSERT
// ============================================================

const BATCH_SIZE = 500;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchUpsert(table: any, records: any[], conflictTarget: any, updateSet: Record<string, any>, label: string) {
  if (records.length === 0) return { label, inserted: 0, errors: 0 };
  let inserted = 0;
  let errors = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(table).values(batch).onConflictDoUpdate({ target: conflictTarget, set: updateSet });
      inserted += batch.length;
    } catch {
      for (const record of batch) {
        try {
          await db.insert(table).values(record).onConflictDoUpdate({ target: conflictTarget, set: updateSet });
          inserted++;
        } catch {
          errors++;
        }
      }
    }
  }
  return { label, inserted, errors };
}

// ============================================================
// MAIN IMPORT HANDLER
// ============================================================

export const POST = withAuth('create', 'app_users', async (req: NextRequest) => {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('type') as string | null;

    if (!file || !fileType) {
      return NextResponse.json({ error: 'Se requiere archivo y tipo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    // Load lookup maps
    const empresaMap = new Map<string, string>();
    const empresaCodMap = new Map<string, string>();
    const sitioMap = new Map<string, string>();
    const colaboradorMap = new Map<string, string>();
    const lineaMap = new Map<string, string>();

    const [empresaRows, sitioRows, colabRows, lineaRows] = await Promise.all([
      db.select().from(empresas),
      db.select().from(sitios),
      db.select({ id: colaboradores.id, legajo: colaboradores.legajo }).from(colaboradores),
      db.select({ id: lineas.id, numero: lineas.numero }).from(lineas),
    ]);

    for (const e of empresaRows) {
      empresaMap.set(e.nombre.toLowerCase(), e.id);
      empresaCodMap.set(e.codigo.toLowerCase(), e.id);
    }
    for (const s of sitioRows) sitioMap.set(s.nombre.toLowerCase(), s.id);
    for (const c of colabRows) colaboradorMap.set(c.legajo, c.id);
    for (const l of lineaRows) lineaMap.set(l.numero, l.id);

    function resolveEmpresaId(raw: unknown): string | null {
      const val = cleanStr(raw);
      if (!val) return null;
      const lower = val.toLowerCase();
      if (empresaMap.has(lower)) return empresaMap.get(lower)!;
      if (empresaCodMap.has(lower)) return empresaCodMap.get(lower)!;
      const aliasTarget = EMPRESA_ALIASES[lower];
      if (aliasTarget) { const id = empresaMap.get(aliasTarget.toLowerCase()); if (id) return id; }
      for (const [name, id] of empresaMap.entries()) { if (lower.includes(name) || name.includes(lower)) return id; }
      return null;
    }

    function resolveSitioId(raw: unknown): string | null {
      const val = cleanStr(raw);
      if (!val) return null;
      const lower = val.toLowerCase();
      if (sitioMap.has(lower)) return sitioMap.get(lower)!;
      const aliasTarget = SITIO_ALIASES[lower];
      if (aliasTarget) { const id = sitioMap.get(aliasTarget.toLowerCase()); if (id) return id; }
      for (const [name, id] of sitioMap.entries()) { if (lower.includes(name) || name.includes(lower)) return id; }
      return null;
    }

    function resolveColaboradorId(raw: unknown): string | null {
      const val = cleanStr(raw);
      if (!val) return null;
      return colaboradorMap.get(String(val).replace(/\.0$/, '')) ?? null;
    }

    function resolveLineaId(raw: unknown): string | null {
      const val = cleanStr(raw);
      if (!val) return null;
      return lineaMap.get(String(val).replace(/\.0$/, '')) ?? null;
    }

    const results: { label: string; inserted: number; errors: number }[] = [];

    // ---- EQUIPAMIENTO ----
    if (fileType === 'equipamiento') {
      // EQUIPOS
      const equiposData = readSheet(wb, 'EQUIPOS', 1);
      const inventarioData = readSheet(wb, 'INVENTARIO', 1);
      const inventarioMap = new Map<string, Record<string, unknown>>();
      for (const row of inventarioData) {
        const serial = cleanStr(row['SERIAL NUMBER']);
        if (serial) inventarioMap.set(String(serial), row);
      }

      const equiposRecords: (typeof equipos.$inferInsert)[] = [];
      for (const row of equiposData) {
        const serial = cleanStr(row['Serial']);
        if (!serial) continue;
        const invRow = inventarioMap.get(String(serial));
        const tipo = cleanStr(row['Tipo']) ?? cleanStr(invRow?.['TIPO']);
        const marca = cleanStr(row['MARCA']) ?? cleanStr(invRow?.['MARCA']);
        const modelo = cleanStr(row['MODELO']) ?? cleanStr(invRow?.['MODELO']);
        if (!tipo || !marca || !modelo) continue;

        equiposRecords.push({
          serialNumber: String(serial),
          hostname: cleanStr(row['Hostname']) ?? cleanStr(invRow?.['NOMBRE EQUIPO']),
          empresaId: resolveEmpresaId(row['Compañía'] ?? invRow?.['EMPRESA']),
          tipo: tipo.toUpperCase(),
          marca: marca.toUpperCase(),
          modelo,
          compradoPor: cleanStr(row['COMPRADA POR']),
          ordenCompra: cleanStr(row['ORDEN DE COMPRA / COMENTARIO']),
          fechaCompra: excelDateToISO(row['FECHA COMPRA'] as number),
          diasGarantia: parseInt_(row['DIAS GARANTIA']),
          vencGarantia: excelDateToISO(row['VENC.GARANTIA'] as number),
          obsoleto: parseBool(row['OBSOLETO']),
          estado: cleanStr(invRow?.['ESTADO']) ?? 'STOCK',
          estadoSecundario: cleanStr(invRow?.['ESTADO SECUNDARIO']) ?? 'DISPONIBLE',
          colaboradorId: resolveColaboradorId(invRow?.['LEGAJO ASIGNACIÓN']),
          principalSecundaria: cleanStr(invRow?.['PRINCIPAL/SECUNDARIA']),
          motivoAsignacion: cleanStr(invRow?.['MOTIVO ASIGNACION']),
          fechaAsignacion: excelDateToISO(invRow?.['FECHA ASIGNACIÓN'] as number),
          sitioId: resolveSitioId(invRow?.['PLANTA ASIGNACIÓN']),
          comentarios: cleanStr(invRow?.['COMENTARIO ASIGNACIÓN']),
        });
      }

      results.push(await batchUpsert(equipos, equiposRecords, equipos.serialNumber, {
        hostname: sql`excluded.hostname`, empresaId: sql`excluded.empresa_id`,
        tipo: sql`excluded.tipo`, marca: sql`excluded.marca`, modelo: sql`excluded.modelo`,
        estado: sql`excluded.estado`, estadoSecundario: sql`excluded.estado_secundario`,
        colaboradorId: sql`excluded.colaborador_id`, sitioId: sql`excluded.sitio_id`,
        updatedAt: sql`now()`,
      }, 'Equipos'));

      // MONITORES
      const monData = readSheet(wb, 'MONITORES', 2);
      const monRecords: (typeof monitores.$inferInsert)[] = [];
      for (const row of monData) {
        const serial = cleanStr(row['SERIAL NUMBER']);
        const marca = cleanStr(row['MARCA MONITOR']);
        const modelo = cleanStr(row['MODELO MONITOR']);
        if (!serial || !marca || !modelo) continue;
        monRecords.push({
          serialNumber: String(serial), empresa: cleanStr(row['EMPRESA']),
          tipoMonitor: cleanStr(row['TIPO MONITOR']), marca, modelo,
          pulgadas: cleanStr(row['PULGADAS']), proveedor: cleanStr(row['PROVEEDOR']),
          ordenCompra: cleanStr(row['ORDEN DE COMPRA']), factura: cleanStr(row['FACTURA']),
          fechaCompra: excelDateToISO(row['FECHA COMPRA'] as number),
          diasGarantia: parseInt_(row['DIAS GARANTIA']),
          vencGarantia: excelDateToISO(row['VENC.GARANTIA'] as number),
          obsoleto: parseBool(row['OBSOLETO']), compradoPor: cleanStr(row['COMPRADA POR']),
          colaboradorId: resolveColaboradorId(row['LEGAJO']),
          sitioId: resolveSitioId(row['EMPRESA']),
          comentarios: cleanStr(row['COMENTARIOS']),
        });
      }

      results.push(await batchUpsert(monitores, monRecords, monitores.serialNumber, {
        marca: sql`excluded.marca`, modelo: sql`excluded.modelo`,
        colaboradorId: sql`excluded.colaborador_id`, updatedAt: sql`now()`,
      }, 'Monitores'));
    }

    // ---- CELULARES ----
    if (fileType === 'celulares') {
      // LINEAS
      const linData = readSheet(wb, 'LINEAS', 3);
      const linRecords: (typeof lineas.$inferInsert)[] = [];
      for (const row of linData) {
        const num = cleanStr(row['LINEA']);
        if (!num) continue;
        const numero = String(num).replace(/\.0$/, '');
        if (!numero || numero === '0') continue;
        linRecords.push({
          numero, tipoLinea: cleanStr(row['TIPO LINEA']),
          proveedor: cleanStr(row['PROVEEDOR']),
          estado: cleanStr(row['Activo'])?.toUpperCase() === 'SI' ? 'ACTIVA' : 'INACTIVA',
          comentarios: cleanStr(row['COMENTARIOS']),
        });
      }
      results.push(await batchUpsert(lineas, linRecords, lineas.numero, {
        tipoLinea: sql`excluded.tipo_linea`, proveedor: sql`excluded.proveedor`,
        estado: sql`excluded.estado`, updatedAt: sql`now()`,
      }, 'Lineas'));

      // Reload linea map
      const newLineas = await db.select({ id: lineas.id, numero: lineas.numero }).from(lineas);
      lineaMap.clear();
      for (const l of newLineas) lineaMap.set(l.numero, l.id);

      // CELULARES
      const celData = readSheet(wb, 'CELULARES', 3);
      const invData = readSheet(wb, 'Inventario', 1);
      const invByImei = new Map<string, Record<string, unknown>>();
      for (const row of invData) {
        const tipo = cleanStr(row['TIPO']);
        if (tipo && tipo.toUpperCase() !== 'LINEA') {
          const imei = cleanStr(row['Celular/Linea Asignado']);
          if (imei) invByImei.set(String(imei).replace(/\.0$/, ''), row);
        }
      }

      const celRecords: (typeof celulares.$inferInsert)[] = [];
      for (const row of celData) {
        const imei = cleanStr(row['IMEI EQUIPO']);
        if (!imei) continue;
        const imeiStr = String(imei).replace(/\.0$/, '');
        if (!imeiStr || imeiStr === '0') continue;
        const invRow = invByImei.get(imeiStr);
        const tipo = cleanStr(row['TIPO']) ?? cleanStr(invRow?.['TIPO']);
        const marca = cleanStr(row['MARCA']) ?? cleanStr(invRow?.['MARCA']);
        const modelo = cleanStr(row['MODELO']) ?? cleanStr(invRow?.['MODELO']);
        if (!tipo || !marca || !modelo) continue;

        celRecords.push({
          imei: imeiStr, empresaId: resolveEmpresaId(row['EMPRESA']),
          tipo: tipo.toUpperCase(), marca: marca.toUpperCase(), modelo,
          proveedor: cleanStr(row['PROVEEDOR']) ?? cleanStr(invRow?.['Proveedor']),
          fechaCompra: excelDateToISO(row['FECHA COMPRA'] as number),
          obsoleto: parseBool(row['OBSOLETO']),
          estado: cleanStr(invRow?.['ESTADO LINEA/EQUIPO']) ?? 'STOCK',
          estadoSecundario: cleanStr(invRow?.['ESTADO SECUNDARIO LINEA/EQUIPO']) ?? 'DISPONIBLE',
          colaboradorId: resolveColaboradorId(invRow?.['LEGAJO']),
          lineaId: resolveLineaId(invRow?.['Linea-IMEI']),
          sitioId: resolveSitioId(invRow?.['PLANTA']),
          principalSecundaria: cleanStr(invRow?.['PRINCIPAL/SECUNDARIA']),
          motivoAsignacion: cleanStr(invRow?.['MOTIVO ASIGNACION']),
          fechaAsignacion: excelDateToISO(invRow?.['FECHA ASIGNACION'] as number),
          comentarios: cleanStr(invRow?.['COMENTARIOS']) ?? cleanStr(row['COMENTARIOS']),
        });
      }

      results.push(await batchUpsert(celulares, celRecords, celulares.imei, {
        empresaId: sql`excluded.empresa_id`, tipo: sql`excluded.tipo`,
        marca: sql`excluded.marca`, modelo: sql`excluded.modelo`,
        estado: sql`excluded.estado`, estadoSecundario: sql`excluded.estado_secundario`,
        colaboradorId: sql`excluded.colaborador_id`, lineaId: sql`excluded.linea_id`,
        sitioId: sql`excluded.sitio_id`, updatedAt: sql`now()`,
      }, 'Celulares'));
    }

    // ---- INSUMOS ----
    if (fileType === 'insumos') {
      const insData = readSheet(wb, 'INVENTARIO', 1);
      const insRecords: (typeof insumos.$inferInsert)[] = [];
      for (const row of insData) {
        const nombre = cleanStr(row['INSUMO']);
        const tipoInsumo = cleanStr(row['TIPO INSUMO']);
        if (!nombre || !tipoInsumo) continue;
        insRecords.push({
          nombre, tipoInsumo,
          serialInsumo: cleanStr(row['SERIAL INSUMO']),
          ordenCompra: cleanStr(row['ORDEN DE COMPRA']),
          fechaCompra: excelDateToISO(row['FECHA COMPRA'] as number),
          areaCompra: cleanStr(row['Area Compra']),
        });
      }
      // Insumos don't have unique constraint; insert and skip dupes
      let inserted = 0;
      for (const rec of insRecords) {
        try {
          await db.insert(insumos).values(rec);
          inserted++;
        } catch {
          // Skip duplicates
        }
      }
      results.push({ label: 'Insumos', inserted, errors: insRecords.length - inserted });

      // Stock by sitio columns
      const stockSheets = wb.SheetNames.filter(s => s !== 'INVENTARIO');
      for (const sheetName of stockSheets) {
        const stockData = readSheet(wb, sheetName, 1);
        const sitioId = resolveSitioId(sheetName);
        if (!sitioId || stockData.length === 0) continue;

        for (const row of stockData) {
          const nombre = cleanStr(row['INSUMO']);
          const cantidad = parseInt_(row['CANTIDAD']);
          if (!nombre || cantidad === null) continue;

          // Find insumo by nombre
          const insumoRows = await db.select({ id: insumos.id }).from(insumos)
            .where(sql`lower(${insumos.nombre}) = lower(${nombre})`).limit(1);
          if (insumoRows.length === 0) continue;

          await db.insert(insumoStock).values({
            insumoId: insumoRows[0].id,
            sitioId,
            cantidad,
          }).onConflictDoUpdate({
            target: [insumoStock.insumoId, insumoStock.sitioId],
            set: { cantidad: sql`excluded.cantidad`, updatedAt: sql`now()` },
          });
        }
      }
    }

    // ---- COLABORADORES ----
    if (fileType === 'colaboradores') {
      const data = readSheet(wb, 'QLP', 1);
      const deduped = new Map<string, Record<string, unknown>>();
      for (const row of data) {
        const gid = cleanStr(row['Global ID']);
        if (gid) deduped.set(gid, row);
      }

      const colabRecords: (typeof colaboradores.$inferInsert)[] = [];
      for (const [, row] of deduped) {
        const globalId = cleanStr(row['Global ID']);
        const legajo = cleanStr(row['Local ID']);
        const nombre = cleanStr(row['Columna1']);
        if (!globalId || !legajo || !nombre) continue;

        colabRecords.push({
          globalId: String(globalId), legajo: String(legajo),
          email: cleanStr(row['Email']), nombre,
          businessTitle: cleanStr(row['Business Title']),
          band: cleanStr(row['Band']),
          empresaId: resolveEmpresaId(row['Company ID']),
          costCenterId: cleanStr(row['Cost Center ID']),
          costCenterDesc: cleanStr(row['Cost Center Description']),
          positionId: cleanStr(row['Position ID']),
          positionName: cleanStr(row['Job Profile Name']),
          managerName: cleanStr(row['Hierarchy Manager Name']),
          managerId: cleanStr(row['Hierarchy Manager ID']),
          area: cleanStr(row['Area']),
          subArea: cleanStr(row['Sub Area']),
          groupedUnity: cleanStr(row['Grouped Unity']),
          unity: cleanStr(row['Unity']),
          pais: cleanStr(row['Pais']) ?? 'Argentina',
          regional: cleanStr(row['Regional']),
          hrbp: cleanStr(row['HRBP']),
          hireDate: excelDateToISO(row['Last Hire Date'] as number),
          status: cleanStr(row['FTE Status Description']) ?? 'Active',
          collar: cleanStr(row['Employee Group Description']),
          sitioId: resolveSitioId(row['Grouped Unity']) ?? resolveSitioId(row['Unity']),
        });
      }

      results.push(await batchUpsert(colaboradores, colabRecords, colaboradores.globalId, {
        legajo: sql`excluded.legajo`, email: sql`excluded.email`, nombre: sql`excluded.nombre`,
        businessTitle: sql`excluded.business_title`, band: sql`excluded.band`,
        empresaId: sql`excluded.empresa_id`, sitioId: sql`excluded.sitio_id`,
        updatedAt: sql`now()`,
      }, 'Colaboradores'));
    }

    return NextResponse.json({
      success: true,
      sheets: wb.SheetNames,
      results,
    });
  } catch (err) {
    console.error('Excel import error:', err);
    return NextResponse.json(
      { error: `Import failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
});
