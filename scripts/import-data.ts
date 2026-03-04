/**
 * TechOps Asset Manager - Excel Data Import Script
 *
 * Reads data from Excel files and upserts into the PostgreSQL database.
 * Safe to re-run: uses onConflictDoUpdate on unique columns.
 *
 * Usage:
 *   npx tsx scripts/import-data.ts
 *
 * Requires DATABASE_URL in .env.local or as env var.
 */
import dotenv from 'dotenv';
// Load .env.local first (project convention), then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as XLSX from 'xlsx';
import * as path from 'path';
import {
  empresas,
  sitios,
  colaboradores,
  lineas,
  equipos,
  monitores,
  celulares,
  insumos,
} from '../src/lib/db/schema';

// ============================================================
// CONFIGURATION
// ============================================================

const EXCEL_BASE_PATH = path.resolve(
  'C:/Users/CarlosCarabajal/OneDrive - pixelit.com.ar/Documentos/Analista I+D/Proyectos varios/Gestion de Activos Usuarios e Inventario'
);

const FILES = {
  colaboradores: path.join(EXCEL_BASE_PATH, 'INVENTARIOS-Datos Planos ARG.xlsx'),
  equipamiento: path.join(EXCEL_BASE_PATH, 'Inventario EQUIPAMIENTO AR.xlsx'),
  celulares: path.join(EXCEL_BASE_PATH, 'Inventario CELULARES AR.xlsx'),
  insumos: path.join(EXCEL_BASE_PATH, 'Inventario Insumos AR.xlsx'),
};

const BATCH_SIZE = 500;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Convert Excel date serial number to ISO date string (YYYY-MM-DD) */
function excelDateToISO(serial: number | string | null | undefined): string | null {
  if (serial === null || serial === undefined || serial === '' || serial === '-') return null;
  // If it's already a date string (e.g. "2024-01-15"), return as-is
  if (typeof serial === 'string') {
    const parsed = Date.parse(serial);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().split('T')[0];
    }
    return null;
  }
  if (typeof serial !== 'number' || serial < 1) return null;
  // Excel epoch: Jan 1, 1900 = serial 1, but with the Lotus 1-2-3 leap year bug
  const date = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

/** Clean and trim a string value, returning null for empty/dash values */
function cleanStr(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || s === '-' || s === 'N/A' || s === 'n/a' || s === '#N/A') return null;
  return s;
}

/** Parse a boolean-like Excel value ('SI'/'NO'/true/false) */
function parseBool(val: unknown, trueValue = 'SI'): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toUpperCase();
  return s === trueValue.toUpperCase();
}

/** Parse integer from Excel, returning null if not a valid number */
function parseInt_(val: unknown): number | null {
  if (val === null || val === undefined || val === '' || val === '-') return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  return Math.round(n);
}

/**
 * Read an Excel sheet with headers on a specified row (1-indexed).
 * Returns an array of objects keyed by trimmed header names.
 * Skips completely empty rows.
 */
function readSheet(
  wb: XLSX.WorkBook,
  sheetName: string,
  headerRow: number = 1
): Record<string, unknown>[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.warn(`  WARNING: Sheet "${sheetName}" not found in workbook. Available: ${wb.SheetNames.join(', ')}`);
    return [];
  }
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null });
  if (raw.length < headerRow) {
    console.warn(`  WARNING: Sheet "${sheetName}" has fewer than ${headerRow} rows.`);
    return [];
  }
  const headersRaw = raw[headerRow - 1] as unknown[];
  const headers: (string | null)[] = headersRaw.map((h) =>
    h !== null && h !== undefined ? String(h).trim() : null
  );

  const data: Record<string, unknown>[] = [];
  for (let i = headerRow; i < raw.length; i++) {
    const row = raw[i] as unknown[];
    if (!row || row.every((v) => v === null || v === undefined || v === '')) continue;
    const obj: Record<string, unknown> = {};
    headers.forEach((h, j) => {
      if (h) obj[h] = row[j] ?? null;
    });
    data.push(obj);
  }
  return data;
}

/** Print progress inline */
function progress(label: string, current: number, total: number): void {
  process.stdout.write(`\r  ${label}: ${current}/${total}`);
  if (current >= total) console.log(' - Done');
}

// ============================================================
// LOOKUP MAPS (populated at runtime)
// ============================================================

// Map empresa nombre (lowercase) -> id
const empresaMap = new Map<string, string>();
// Map empresa codigo (lowercase) -> id
const empresaCodMap = new Map<string, string>();

// Map sitio nombre (lowercase) -> id
const sitioMap = new Map<string, string>();

// Map colaborador legajo (string) -> id
const colaboradorMap = new Map<string, string>();

// Map linea numero (string) -> id
const lineaMap = new Map<string, string>();

// ============================================================
// SITIO ALIASES: Excel plant name -> seeded sitio nombre
// ============================================================

const SITIO_ALIASES: Record<string, string> = {
  // Exact matches (case-insensitive handled via toLowerCase)
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
  // Common variations from Excel data
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

/** Resolve an Excel plant/sitio name to a sitio UUID, using aliases + fuzzy match */
function resolveSitioId(raw: unknown): string | null {
  const val = cleanStr(raw);
  if (!val) return null;
  const lower = val.toLowerCase();

  // Direct match on sitioMap
  if (sitioMap.has(lower)) return sitioMap.get(lower)!;

  // Alias match
  const aliasTarget = SITIO_ALIASES[lower];
  if (aliasTarget) {
    const id = sitioMap.get(aliasTarget.toLowerCase());
    if (id) return id;
  }

  // Fuzzy: check if any sitio name is contained in the value or vice versa
  for (const [sitioName, sitioId] of sitioMap.entries()) {
    if (lower.includes(sitioName) || sitioName.includes(lower)) {
      return sitioId;
    }
  }

  return null;
}

// ============================================================
// EMPRESA ALIASES: Excel company name/code -> seeded empresa nombre
// ============================================================

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
  // Company IDs from QLP
  'ar11': 'Cerveceria y Malteria Quilmes',
  'ar24': 'Cerveceria y Malteria Quilmes',
  'ar15': 'FNC',
};

/** Resolve an Excel empresa name/code to an empresa UUID */
function resolveEmpresaId(raw: unknown): string | null {
  const val = cleanStr(raw);
  if (!val) return null;
  const lower = val.toLowerCase();

  // Direct match on empresaMap (by nombre)
  if (empresaMap.has(lower)) return empresaMap.get(lower)!;
  // Direct match on empresaCodMap (by codigo)
  if (empresaCodMap.has(lower)) return empresaCodMap.get(lower)!;

  // Alias match
  const aliasTarget = EMPRESA_ALIASES[lower];
  if (aliasTarget) {
    const id = empresaMap.get(aliasTarget.toLowerCase());
    if (id) return id;
  }

  // Fuzzy containment
  for (const [name, id] of empresaMap.entries()) {
    if (lower.includes(name) || name.includes(lower)) return id;
  }

  return null;
}

/** Resolve a legajo string to a colaborador UUID */
function resolveColaboradorId(raw: unknown): string | null {
  const val = cleanStr(raw);
  if (!val) return null;
  // Legajo might come as number - stringify it
  const legajo = String(val).replace(/\.0$/, '');
  return colaboradorMap.get(legajo) ?? null;
}

/** Resolve a linea numero string to a linea UUID */
function resolveLineaId(raw: unknown): string | null {
  const val = cleanStr(raw);
  if (!val) return null;
  const numero = String(val).replace(/\.0$/, '');
  return lineaMap.get(numero) ?? null;
}

// ============================================================
// BATCH UPSERT HELPER
// ============================================================

type DrizzleDB = ReturnType<typeof drizzle>;

async function batchUpsert(
  db: DrizzleDB,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records: any[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conflictTarget: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateSet: Record<string, any>,
  label: string
): Promise<number> {
  if (records.length === 0) {
    console.log(`  ${label}: 0 records to import. Skipping.`);
    return 0;
  }

  let inserted = 0;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    try {
      await db
        .insert(table)
        .values(batch)
        .onConflictDoUpdate({
          target: conflictTarget,
          set: updateSet,
        });
      inserted += batch.length;
    } catch (err) {
      // On batch error, try one-by-one to isolate bad records
      for (const record of batch) {
        try {
          await db
            .insert(table)
            .values(record)
            .onConflictDoUpdate({
              target: conflictTarget,
              set: updateSet,
            });
          inserted++;
        } catch (recErr) {
          const key = Object.values(record).slice(0, 3).join(', ');
          console.error(`\n  ERROR inserting ${label} record [${key}]: ${(recErr as Error).message}`);
        }
      }
    }
    progress(label, Math.min(i + BATCH_SIZE, records.length), records.length);
  }
  return inserted;
}

// ============================================================
// IMPORT FUNCTIONS
// ============================================================

async function loadLookups(db: DrizzleDB): Promise<void> {
  console.log('\n=== Loading lookup tables ===');

  // Load empresas
  const empresaRows = await db.select().from(empresas);
  for (const e of empresaRows) {
    empresaMap.set(e.nombre.toLowerCase(), e.id);
    empresaCodMap.set(e.codigo.toLowerCase(), e.id);
  }
  console.log(`  Empresas loaded: ${empresaRows.length}`);

  // Load sitios
  const sitioRows = await db.select().from(sitios);
  for (const s of sitioRows) {
    sitioMap.set(s.nombre.toLowerCase(), s.id);
  }
  console.log(`  Sitios loaded: ${sitioRows.length}`);
}

async function loadColaboradorLookup(db: DrizzleDB): Promise<void> {
  const rows = await db
    .select({ id: colaboradores.id, legajo: colaboradores.legajo })
    .from(colaboradores);
  for (const r of rows) {
    colaboradorMap.set(r.legajo, r.id);
  }
  console.log(`  Colaboradores lookup loaded: ${rows.length}`);
}

async function loadLineaLookup(db: DrizzleDB): Promise<void> {
  const rows = await db
    .select({ id: lineas.id, numero: lineas.numero })
    .from(lineas);
  for (const r of rows) {
    lineaMap.set(r.numero, r.id);
  }
  console.log(`  Lineas lookup loaded: ${rows.length}`);
}

// --------------------------------------------------
// 1. COLABORADORES
// --------------------------------------------------

async function importColaboradores(db: DrizzleDB): Promise<void> {
  console.log('\n=== Importing Colaboradores ===');
  console.log(`  Reading: ${FILES.colaboradores}`);

  const wb = XLSX.readFile(FILES.colaboradores);
  const data = readSheet(wb, 'QLP', 1); // Headers on row 1
  console.log(`  Rows read: ${data.length}`);

  // Deduplicate by Global ID (keep last occurrence)
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of data) {
    const gid = cleanStr(row['Global ID']);
    if (!gid) continue;
    deduped.set(gid, row);
  }
  console.log(`  Unique Global IDs: ${deduped.size}`);

  const records: (typeof colaboradores.$inferInsert)[] = [];
  let skipped = 0;

  for (const [, row] of deduped) {
    const globalId = cleanStr(row['Global ID']);
    const legajo = cleanStr(row['Local ID']);
    const nombre = cleanStr(row['Columna1']); // Full name is in Columna1

    if (!globalId || !legajo || !nombre) {
      skipped++;
      continue;
    }

    records.push({
      globalId: String(globalId),
      legajo: String(legajo),
      email: cleanStr(row['Email']),
      nombre,
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

  if (skipped > 0) console.log(`  Skipped (missing key fields): ${skipped}`);
  console.log(`  Records to upsert: ${records.length}`);

  // Build the update set using sql`excluded."col"` for upsert
  const updateSet = {
    legajo: sql`excluded.legajo`,
    email: sql`excluded.email`,
    nombre: sql`excluded.nombre`,
    businessTitle: sql`excluded.business_title`,
    band: sql`excluded.band`,
    empresaId: sql`excluded.empresa_id`,
    costCenterId: sql`excluded.cost_center_id`,
    costCenterDesc: sql`excluded.cost_center_desc`,
    positionId: sql`excluded.position_id`,
    positionName: sql`excluded.position_name`,
    managerName: sql`excluded.manager_name`,
    managerId: sql`excluded.manager_id`,
    area: sql`excluded.area`,
    subArea: sql`excluded.sub_area`,
    groupedUnity: sql`excluded.grouped_unity`,
    unity: sql`excluded.unity`,
    pais: sql`excluded.pais`,
    regional: sql`excluded.regional`,
    hrbp: sql`excluded.hrbp`,
    hireDate: sql`excluded.hire_date`,
    status: sql`excluded.status`,
    collar: sql`excluded.collar`,
    sitioId: sql`excluded.sitio_id`,
    updatedAt: sql`now()`,
  };

  // Due to both globalId and legajo being unique, we need to handle potential conflicts
  // Use globalId as the primary conflict target
  await batchUpsert(
    db,
    colaboradores,
    records,
    colaboradores.globalId,
    updateSet,
    'Colaboradores'
  );

  // Reload lookup after import
  await loadColaboradorLookup(db);
}

// --------------------------------------------------
// 2. LINEAS
// --------------------------------------------------

async function importLineas(db: DrizzleDB): Promise<void> {
  console.log('\n=== Importing Lineas ===');
  console.log(`  Reading: ${FILES.celulares}`);

  const wb = XLSX.readFile(FILES.celulares);
  const data = readSheet(wb, 'LINEAS', 3); // Headers on row 3
  console.log(`  Rows read: ${data.length}`);

  // Deduplicate by LINEA number
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of data) {
    const num = cleanStr(row['LINEA']);
    if (!num) continue;
    const numero = String(num).replace(/\.0$/, '');
    if (!numero || numero === '0') continue;
    deduped.set(numero, row);
  }
  console.log(`  Unique lineas: ${deduped.size}`);

  const records: (typeof lineas.$inferInsert)[] = [];

  for (const [numero, row] of deduped) {
    const activo = cleanStr(row['Activo']);
    const estado = activo?.toUpperCase() === 'SI' ? 'ACTIVA' : 'INACTIVA';

    records.push({
      numero,
      tipoLinea: cleanStr(row['TIPO LINEA']),
      proveedor: cleanStr(row['PROVEEDOR']),
      estado,
      comentarios: cleanStr(row['COMENTARIOS']),
    });
  }

  console.log(`  Records to upsert: ${records.length}`);

  const updateSet = {
    tipoLinea: sql`excluded.tipo_linea`,
    proveedor: sql`excluded.proveedor`,
    estado: sql`excluded.estado`,
    comentarios: sql`excluded.comentarios`,
    updatedAt: sql`now()`,
  };

  await batchUpsert(db, lineas, records, lineas.numero, updateSet, 'Lineas');

  // Reload lookup after import
  await loadLineaLookup(db);
}

// --------------------------------------------------
// 3. EQUIPOS
// --------------------------------------------------

async function importEquipos(db: DrizzleDB): Promise<void> {
  console.log('\n=== Importing Equipos ===');
  console.log(`  Reading: ${FILES.equipamiento}`);

  const wb = XLSX.readFile(FILES.equipamiento);

  // Read the EQUIPOS sheet (base data) - headers on row 1
  const equiposData = readSheet(wb, 'EQUIPOS', 1);
  console.log(`  EQUIPOS rows read: ${equiposData.length}`);

  // Read the INVENTARIO sheet (estado/assignment data) - headers on row 1
  const inventarioData = readSheet(wb, 'INVENTARIO', 1);
  console.log(`  INVENTARIO rows read: ${inventarioData.length}`);

  // Build inventario lookup by serial number
  const inventarioMap = new Map<string, Record<string, unknown>>();
  for (const row of inventarioData) {
    const serial = cleanStr(row['SERIAL NUMBER']);
    if (serial) {
      inventarioMap.set(String(serial), row);
    }
  }

  // Deduplicate equipos by serial
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of equiposData) {
    const serial = cleanStr(row['Serial']);
    if (!serial) continue;
    deduped.set(String(serial), row);
  }
  console.log(`  Unique serials: ${deduped.size}`);

  const records: (typeof equipos.$inferInsert)[] = [];
  let skipped = 0;

  for (const [serial, baseRow] of deduped) {
    const invRow = inventarioMap.get(serial);

    const tipo = cleanStr(baseRow['Tipo']) ?? cleanStr(invRow?.['TIPO']);
    const marca = cleanStr(baseRow['MARCA']) ?? cleanStr(invRow?.['MARCA']);
    const modelo = cleanStr(baseRow['MODELO']) ?? cleanStr(invRow?.['MODELO']);

    if (!tipo || !marca || !modelo) {
      skipped++;
      continue;
    }

    // Resolve empresa from EQUIPOS sheet "Compañía" or INVENTARIO "EMPRESA"
    const empresaRaw = cleanStr(baseRow['Compañía']) ?? cleanStr(invRow?.['EMPRESA']);
    const empresaId = resolveEmpresaId(empresaRaw);

    // Assignment data from INVENTARIO
    const estado = cleanStr(invRow?.['ESTADO']) ?? 'STOCK';
    const estadoSecundario = cleanStr(invRow?.['ESTADO SECUNDARIO']) ?? 'DISPONIBLE';
    const legajoAsign = cleanStr(invRow?.['LEGAJO ASIGNACIÓN']);
    const colaboradorId = resolveColaboradorId(legajoAsign);

    records.push({
      serialNumber: serial,
      hostname: cleanStr(baseRow['Hostname']) ?? cleanStr(invRow?.['NOMBRE EQUIPO']),
      empresaId,
      tipo: tipo.toUpperCase(),
      marca: marca.toUpperCase(),
      modelo,
      compradoPor: cleanStr(baseRow['COMPRADA POR']) ?? cleanStr(invRow?.['COMPRADO POR']),
      ordenCompra: cleanStr(baseRow['ORDEN DE COMPRA / COMENTARIO']),
      fechaCompra: excelDateToISO(baseRow['FECHA COMPRA'] as number),
      diasGarantia: parseInt_(baseRow['DIAS GARANTIA']),
      vencGarantia: excelDateToISO(baseRow['VENC.GARANTIA'] as number),
      obsoleto: parseBool(baseRow['OBSOLETO']),
      estado,
      estadoSecundario,
      colaboradorId,
      principalSecundaria: cleanStr(invRow?.['PRINCIPAL/SECUNDARIA']),
      motivoAsignacion: cleanStr(invRow?.['MOTIVO ASIGNACION']),
      fechaAsignacion: excelDateToISO(invRow?.['FECHA ASIGNACIÓN'] as number),
      sitioId: resolveSitioId(invRow?.['PLANTA ASIGNACIÓN']),
      comentarios: cleanStr(invRow?.['COMENTARIO ASIGNACIÓN']),
    });
  }

  if (skipped > 0) console.log(`  Skipped (missing tipo/marca/modelo): ${skipped}`);
  console.log(`  Records to upsert: ${records.length}`);

  const updateSet = {
    hostname: sql`excluded.hostname`,
    empresaId: sql`excluded.empresa_id`,
    tipo: sql`excluded.tipo`,
    marca: sql`excluded.marca`,
    modelo: sql`excluded.modelo`,
    compradoPor: sql`excluded.comprado_por`,
    ordenCompra: sql`excluded.orden_compra`,
    fechaCompra: sql`excluded.fecha_compra`,
    diasGarantia: sql`excluded.dias_garantia`,
    vencGarantia: sql`excluded.venc_garantia`,
    obsoleto: sql`excluded.obsoleto`,
    estado: sql`excluded.estado`,
    estadoSecundario: sql`excluded.estado_secundario`,
    colaboradorId: sql`excluded.colaborador_id`,
    principalSecundaria: sql`excluded.principal_secundaria`,
    motivoAsignacion: sql`excluded.motivo_asignacion`,
    fechaAsignacion: sql`excluded.fecha_asignacion`,
    sitioId: sql`excluded.sitio_id`,
    comentarios: sql`excluded.comentarios`,
    updatedAt: sql`now()`,
  };

  await batchUpsert(db, equipos, records, equipos.serialNumber, updateSet, 'Equipos');
}

// --------------------------------------------------
// 4. MONITORES
// --------------------------------------------------

async function importMonitores(db: DrizzleDB): Promise<void> {
  console.log('\n=== Importing Monitores ===');
  console.log(`  Reading: ${FILES.equipamiento}`);

  const wb = XLSX.readFile(FILES.equipamiento);
  // Headers on row 2 (row 1 is a title row "MONITORES")
  const data = readSheet(wb, 'MONITORES', 2);
  console.log(`  Rows read: ${data.length}`);

  // Deduplicate by SERIAL NUMBER
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of data) {
    const serial = cleanStr(row['SERIAL NUMBER']);
    if (!serial) continue;
    deduped.set(String(serial), row);
  }
  console.log(`  Unique serials: ${deduped.size}`);

  const records: (typeof monitores.$inferInsert)[] = [];
  let skipped = 0;

  for (const [serial, row] of deduped) {
    const marca = cleanStr(row['MARCA MONITOR']);
    const modelo = cleanStr(row['MODELO MONITOR']);

    if (!marca || !modelo) {
      skipped++;
      continue;
    }

    const legajo = cleanStr(row['LEGAJO']);
    const colaboradorId = resolveColaboradorId(legajo);

    records.push({
      serialNumber: serial,
      empresa: cleanStr(row['EMPRESA']), // TEXT field, not FK
      tipoMonitor: cleanStr(row['TIPO MONITOR']),
      marca,
      modelo,
      pulgadas: cleanStr(row['PULGADAS']),
      proveedor: cleanStr(row['PROVEEDOR']),
      ordenCompra: cleanStr(row['ORDEN DE COMPRA']),
      factura: cleanStr(row['FACTURA']),
      fechaCompra: excelDateToISO(row['FECHA COMPRA'] as number),
      diasGarantia: parseInt_(row['DIAS GARANTIA']),
      vencGarantia: excelDateToISO(row['VENC.GARANTIA'] as number),
      obsoleto: parseBool(row['OBSOLETO']),
      compradoPor: cleanStr(row['COMPRADA POR']),
      colaboradorId,
      comentarios: cleanStr(row['COMENTARIOS']),
      // No sitio column in MONITORES sheet, but we can try to use EMPRESA as sitio
      sitioId: resolveSitioId(row['EMPRESA']),
    });
  }

  if (skipped > 0) console.log(`  Skipped (missing marca/modelo): ${skipped}`);
  console.log(`  Records to upsert: ${records.length}`);

  const updateSet = {
    empresa: sql`excluded.empresa`,
    tipoMonitor: sql`excluded.tipo_monitor`,
    marca: sql`excluded.marca`,
    modelo: sql`excluded.modelo`,
    pulgadas: sql`excluded.pulgadas`,
    proveedor: sql`excluded.proveedor`,
    ordenCompra: sql`excluded.orden_compra`,
    factura: sql`excluded.factura`,
    fechaCompra: sql`excluded.fecha_compra`,
    diasGarantia: sql`excluded.dias_garantia`,
    vencGarantia: sql`excluded.venc_garantia`,
    obsoleto: sql`excluded.obsoleto`,
    compradoPor: sql`excluded.comprado_por`,
    colaboradorId: sql`excluded.colaborador_id`,
    sitioId: sql`excluded.sitio_id`,
    comentarios: sql`excluded.comentarios`,
    updatedAt: sql`now()`,
  };

  await batchUpsert(db, monitores, records, monitores.serialNumber, updateSet, 'Monitores');
}

// --------------------------------------------------
// 5. CELULARES
// --------------------------------------------------

async function importCelulares(db: DrizzleDB): Promise<void> {
  console.log('\n=== Importing Celulares ===');
  console.log(`  Reading: ${FILES.celulares}`);

  const wb = XLSX.readFile(FILES.celulares);

  // Read CELULARES sheet (base data) - headers on row 3
  const celData = readSheet(wb, 'CELULARES', 3);
  console.log(`  CELULARES rows read: ${celData.length}`);

  // Read Inventario sheet (assignment data) - headers on row 1
  const invData = readSheet(wb, 'Inventario', 1);
  console.log(`  Inventario rows read: ${invData.length}`);

  // Build inventario lookup by IMEI (from "Celular/Linea Asignado" column)
  // The Inventario sheet has rows for both LINEA and CELULAR types
  // For celulares, the "Celular/Linea Asignado" column contains the IMEI
  // and "Linea-IMEI" contains the linea number
  const invByImei = new Map<string, Record<string, unknown>>();
  for (const row of invData) {
    const tipo = cleanStr(row['TIPO']);
    // Only process CELULAR, TABLET, MODEM rows (not LINEA)
    if (tipo && tipo.toUpperCase() !== 'LINEA') {
      const imei = cleanStr(row['Celular/Linea Asignado']);
      if (imei) {
        const imeiStr = String(imei).replace(/\.0$/, '');
        invByImei.set(imeiStr, row);
      }
    }
  }
  console.log(`  Inventario celular entries: ${invByImei.size}`);

  // Deduplicate by IMEI
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of celData) {
    const imei = cleanStr(row['IMEI EQUIPO']);
    if (!imei) continue;
    const imeiStr = String(imei).replace(/\.0$/, '');
    if (!imeiStr || imeiStr === '0') continue;
    deduped.set(imeiStr, row);
  }
  console.log(`  Unique IMEIs: ${deduped.size}`);

  const records: (typeof celulares.$inferInsert)[] = [];
  let skipped = 0;

  for (const [imei, baseRow] of deduped) {
    const invRow = invByImei.get(imei);

    const tipo = cleanStr(baseRow['TIPO']) ?? cleanStr(invRow?.['TIPO']);
    const marca = cleanStr(baseRow['MARCA']) ?? cleanStr(invRow?.['MARCA']);
    const modelo = cleanStr(baseRow['MODELO']) ?? cleanStr(invRow?.['MODELO']);

    if (!tipo || !marca || !modelo) {
      skipped++;
      continue;
    }

    // Resolve empresa
    const empresaId = resolveEmpresaId(baseRow['EMPRESA']);

    // Assignment data from Inventario
    const estado = cleanStr(invRow?.['ESTADO LINEA/EQUIPO']) ?? 'STOCK';
    const estadoSecundario = cleanStr(invRow?.['ESTADO SECUNDARIO LINEA/EQUIPO']) ?? 'DISPONIBLE';
    const legajo = cleanStr(invRow?.['LEGAJO']);
    const colaboradorId = resolveColaboradorId(legajo);

    // Resolve linea from Inventario "Linea-IMEI" column
    const lineaNum = cleanStr(invRow?.['Linea-IMEI']);
    const lineaId = resolveLineaId(lineaNum);

    records.push({
      imei,
      empresaId,
      tipo: tipo.toUpperCase(),
      marca: marca.toUpperCase(),
      modelo,
      proveedor: cleanStr(baseRow['PROVEEDOR']) ?? cleanStr(invRow?.['Proveedor']),
      fechaCompra: excelDateToISO(baseRow['FECHA COMPRA'] as number),
      obsoleto: parseBool(baseRow['OBSOLETO']),
      estado,
      estadoSecundario,
      colaboradorId,
      lineaId,
      sitioId: resolveSitioId(invRow?.['PLANTA']),
      principalSecundaria: cleanStr(invRow?.['PRINCIPAL/SECUNDARIA']),
      motivoAsignacion: cleanStr(invRow?.['MOTIVO ASIGNACION']),
      fechaAsignacion: excelDateToISO(invRow?.['FECHA ASIGNACION'] as number),
      comentarios: cleanStr(invRow?.['COMENTARIOS']) ?? cleanStr(baseRow['COMENTARIOS']),
    });
  }

  if (skipped > 0) console.log(`  Skipped (missing tipo/marca/modelo): ${skipped}`);
  console.log(`  Records to upsert: ${records.length}`);

  const updateSet = {
    empresaId: sql`excluded.empresa_id`,
    tipo: sql`excluded.tipo`,
    marca: sql`excluded.marca`,
    modelo: sql`excluded.modelo`,
    proveedor: sql`excluded.proveedor`,
    fechaCompra: sql`excluded.fecha_compra`,
    obsoleto: sql`excluded.obsoleto`,
    estado: sql`excluded.estado`,
    estadoSecundario: sql`excluded.estado_secundario`,
    colaboradorId: sql`excluded.colaborador_id`,
    lineaId: sql`excluded.linea_id`,
    sitioId: sql`excluded.sitio_id`,
    principalSecundaria: sql`excluded.principal_secundaria`,
    motivoAsignacion: sql`excluded.motivo_asignacion`,
    fechaAsignacion: sql`excluded.fecha_asignacion`,
    comentarios: sql`excluded.comentarios`,
    updatedAt: sql`now()`,
  };

  await batchUpsert(db, celulares, records, celulares.imei, updateSet, 'Celulares');
}

// --------------------------------------------------
// 6. INSUMOS
// --------------------------------------------------

async function importInsumos(db: DrizzleDB): Promise<void> {
  console.log('\n=== Importing Insumos ===');
  console.log(`  Reading: ${FILES.insumos}`);

  const wb = XLSX.readFile(FILES.insumos);
  // Headers on row 1
  const data = readSheet(wb, 'INVENTARIO', 1);
  console.log(`  Rows read: ${data.length}`);

  // Insumos table does NOT have a unique column defined in schema.
  // We will deduplicate by (nombre + tipoInsumo + serialInsumo) combination.
  // For the database insert, we use a simple insert (not upsert) approach:
  // first clear then insert, or just insert-ignore duplicates.
  // Since insumos has no unique constraint, we'll do a delete-then-insert strategy
  // using serialInsumo as an approximate key.
  // However, the user requested onConflictDoUpdate. Since there's no unique column,
  // we'll insert new records and skip duplicates based on serialInsumo match.

  // Actually, let's group by serialInsumo and insert unique ones.
  // For re-run safety, we'll check existence by serialInsumo if it exists.

  const records: (typeof insumos.$inferInsert)[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const row of data) {
    const nombre = cleanStr(row['INSUMO']);
    const tipoInsumo = cleanStr(row['TIPO INSUMO']);

    if (!nombre || !tipoInsumo) {
      skipped++;
      continue;
    }

    const serialInsumo = cleanStr(row['SERIAL INSUMO']);

    // Create a dedup key: serial if unique, otherwise nombre+tipo+orden
    const dedupKey = serialInsumo
      ? `serial:${serialInsumo}`
      : `combo:${nombre}|${tipoInsumo}|${cleanStr(row['ORDEN DE COMPRA']) ?? ''}`;

    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    records.push({
      nombre,
      tipoInsumo,
      serialInsumo,
      ordenCompra: cleanStr(row['ORDEN DE COMPRA']),
      fechaCompra: excelDateToISO(row['FECHA COMPRA'] as number),
      areaCompra: cleanStr(row['Area Compra']),
    });
  }

  if (skipped > 0) console.log(`  Skipped (missing nombre/tipo): ${skipped}`);
  console.log(`  Unique records to insert: ${records.length}`);

  // Since insumos has no unique constraint, we can't use onConflictDoUpdate.
  // Strategy: load existing serials, only insert those we don't already have.
  const existingRows = await db
    .select({
      id: insumos.id,
      nombre: insumos.nombre,
      tipoInsumo: insumos.tipoInsumo,
      serialInsumo: insumos.serialInsumo,
    })
    .from(insumos);

  const existingSerials = new Set<string>();
  const existingCombos = new Set<string>();
  for (const e of existingRows) {
    if (e.serialInsumo) {
      existingSerials.add(e.serialInsumo);
    }
    existingCombos.add(`${e.nombre}|${e.tipoInsumo}`);
  }

  const newRecords = records.filter((r) => {
    if (r.serialInsumo && existingSerials.has(r.serialInsumo)) return false;
    if (!r.serialInsumo && existingCombos.has(`${r.nombre}|${r.tipoInsumo}`)) return false;
    return true;
  });

  console.log(`  Existing insumos in DB: ${existingRows.length}`);
  console.log(`  New records to insert: ${newRecords.length}`);

  if (newRecords.length === 0) {
    console.log('  No new insumos to insert.');
    return;
  }

  // Simple batch insert (no upsert since no unique constraint)
  let inserted = 0;
  for (let i = 0; i < newRecords.length; i += BATCH_SIZE) {
    const batch = newRecords.slice(i, i + BATCH_SIZE);
    try {
      await db.insert(insumos).values(batch);
      inserted += batch.length;
    } catch (err) {
      // Try one-by-one
      for (const record of batch) {
        try {
          await db.insert(insumos).values(record);
          inserted++;
        } catch (recErr) {
          console.error(
            `\n  ERROR inserting insumo [${record.nombre}]: ${(recErr as Error).message}`
          );
        }
      }
    }
    progress('Insumos', Math.min(i + BATCH_SIZE, newRecords.length), newRecords.length);
  }
  console.log(`  Total inserted: ${inserted}`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      'ERROR: DATABASE_URL not set. Set it in .env.local or pass as environment variable.'
    );
    console.error(
      'Example: DATABASE_URL="postgresql://user:pass@localhost:5432/techops_assets" npx tsx scripts/import-data.ts'
    );
    process.exit(1);
  }

  console.log('============================================');
  console.log('  TechOps Asset Manager - Data Import');
  console.log('============================================');
  console.log(`  Database: ${connectionString.replace(/:[^@]+@/, ':****@')}`);
  console.log(`  Excel path: ${EXCEL_BASE_PATH}`);

  // Verify Excel files exist
  const fs = await import('fs');
  for (const [name, filePath] of Object.entries(FILES)) {
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: File not found: ${filePath} (${name})`);
      process.exit(1);
    }
  }
  console.log('  All Excel files found.');

  const client = postgres(connectionString, { max: 5 });
  const db = drizzle(client);

  const startTime = Date.now();

  try {
    // Step 0: Load lookup tables (empresas, sitios)
    await loadLookups(db);

    // Step 1: Import colaboradores (needs empresaId, sitioId)
    await importColaboradores(db);

    // Step 2: Import lineas (minimal FKs)
    await importLineas(db);

    // Step 3: Import equipos (needs empresaId, colaboradorId, sitioId)
    await importEquipos(db);

    // Step 4: Import monitores (needs colaboradorId, sitioId)
    await importMonitores(db);

    // Step 5: Import celulares (needs empresaId, colaboradorId, lineaId, sitioId)
    await importCelulares(db);

    // Step 6: Import insumos (no FK dependencies)
    await importInsumos(db);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n============================================');
    console.log(`  Import completed in ${elapsed}s`);
    console.log('============================================');
  } catch (err) {
    console.error('\nFATAL ERROR:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
