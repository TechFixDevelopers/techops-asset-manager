import ExcelJS from 'exceljs';
import * as path from 'path';
import { promises as fs } from 'fs';

// ============================================================
// Template-based Excel Export
// Reads the original Excel files as templates, preserving all
// formatting, colors, styles, and macros, then fills with data.
// Supports multi-sheet export for templates with multiple sheets.
// ============================================================

const EXCEL_TEMPLATES_PATH = process.env.EXCEL_TEMPLATES_PATH
  || path.resolve('C:/Users/CarlosCarabajal/OneDrive - pixelit.com.ar/Documentos/Analista I+D/Proyectos varios/Gestion de Activos Usuarios e Inventario');

export const TEMPLATE_FILES = {
  equipamiento: path.join(EXCEL_TEMPLATES_PATH, 'Inventario EQUIPAMIENTO AR.xlsx'),
  celulares: path.join(EXCEL_TEMPLATES_PATH, 'Inventario CELULARES AR.xlsx'),
  insumos: path.join(EXCEL_TEMPLATES_PATH, 'Inventario Insumos AR.xlsx'),
  colaboradores: path.join(EXCEL_TEMPLATES_PATH, 'INVENTARIOS-Datos Planos ARG.xlsx'),
} as const;

// ============================================================
// Template file cache — avoids re-reading from disk on every request
// ============================================================

const templateCache = new Map<string, Buffer>();

async function readTemplateBytes(filePath: string): Promise<Buffer> {
  const cached = templateCache.get(filePath);
  if (cached) return cached;

  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`Template file not found: ${filePath}`);
  }

  const bytes = await fs.readFile(filePath);
  templateCache.set(filePath, bytes);
  return bytes;
}

// ============================================================
// Types
// ============================================================

export interface SheetConfig {
  sheetName: string;
  headerRow: number;
  columnMap: Record<string, (row: Record<string, unknown>) => unknown>;
}

export interface SheetData {
  config: SheetConfig;
  data: Record<string, unknown>[];
}

// ============================================================
// Core export function — fills multiple sheets in one template
// ============================================================

function fillSheet(
  sheet: ExcelJS.Worksheet,
  headerRow: number,
  columnMap: Record<string, (row: Record<string, unknown>) => unknown>,
  data: Record<string, unknown>[],
): void {
  // Read headers to build column index map
  const headerRowObj = sheet.getRow(headerRow);
  const colIndexMap = new Map<string, number>();
  headerRowObj.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    const val = cell.value;
    if (val !== null && val !== undefined) {
      colIndexMap.set(String(val).trim(), colNumber);
    }
  });

  // Capture styles from first data row (non-empty cells only for speed)
  const styleRow = sheet.getRow(headerRow + 1);
  const colStyles = new Map<number, Partial<ExcelJS.Style>>();
  styleRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    colStyles.set(colNumber, {
      font: cell.font ? { ...cell.font } : undefined,
      alignment: cell.alignment ? { ...cell.alignment } : undefined,
      border: cell.border ? { ...cell.border } : undefined,
      numFmt: cell.numFmt || undefined,
    });
  });

  // Batch-remove existing data rows (single splice instead of loop)
  const lastRow = sheet.rowCount;
  const rowsToDelete = lastRow - headerRow;
  if (rowsToDelete > 0) {
    sheet.spliceRows(headerRow + 1, rowsToDelete);
  }

  // Fill new data rows
  for (let i = 0; i < data.length; i++) {
    const rowData = data[i];
    const excelRow = sheet.getRow(headerRow + 1 + i);

    for (const [headerName, getter] of Object.entries(columnMap)) {
      const colNum = colIndexMap.get(headerName);
      if (colNum === undefined) continue;

      const value = getter(rowData);
      const cell = excelRow.getCell(colNum);
      cell.value = value === null || value === undefined ? null : value as ExcelJS.CellValue;

      // Apply style from template
      const style = colStyles.get(colNum);
      if (style) {
        if (style.font) cell.font = style.font;
        if (style.alignment) cell.alignment = style.alignment;
        if (style.border) cell.border = style.border;
        if (style.numFmt) cell.numFmt = style.numFmt;
      }
    }

    excelRow.commit();
  }
}

/**
 * Export a multi-sheet Excel file from a template.
 * Reads the template (cached), fills specified sheets with data,
 * returns buffer preserving all original formatting.
 */
export async function exportFromTemplate(
  templateFile: string,
  sheets: SheetData[],
): Promise<ArrayBuffer> {
  const templateBytes = await readTemplateBytes(templateFile);

  const workbook = new ExcelJS.Workbook();
  // ExcelJS type for load() doesn't match Node 22 Buffer<ArrayBufferLike> generic
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(templateBytes as any);

  for (const { config, data } of sheets) {
    const sheet = workbook.getWorksheet(config.sheetName);
    if (!sheet) continue; // Skip if sheet doesn't exist in template
    fillSheet(sheet, config.headerRow, config.columnMap, data);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as ArrayBuffer;
}

// ============================================================
// Sheet configurations per module
// ============================================================

// --- EQUIPAMIENTO template: EQUIPOS sheet ---
export const EQUIPOS_SHEET: SheetConfig = {
  sheetName: 'EQUIPOS',
  headerRow: 1,
  columnMap: {
    'Serial': (r) => r.serialNumber,
    'Hostname': (r) => r.hostname,
    'Tipo': (r) => r.tipo,
    'MARCA': (r) => r.marca,
    'MODELO': (r) => r.modelo,
    'Compañía': (r) => r.empresaNombre,
    'COMPRADA POR': (r) => r.compradoPor,
    'ORDEN DE COMPRA / COMENTARIO': (r) => r.ordenCompra,
    'FECHA COMPRA': (r) => r.fechaCompra,
    'DIAS GARANTIA': (r) => r.diasGarantia,
    'VENC.GARANTIA': (r) => r.vencGarantia,
    'OBSOLETO': (r) => r.obsoleto ? 'SI' : 'NO',
  },
};

// --- EQUIPAMIENTO template: INVENTARIO sheet ---
export const INVENTARIO_EQUIPOS_SHEET: SheetConfig = {
  sheetName: 'INVENTARIO',
  headerRow: 1,
  columnMap: {
    'SERIAL NUMBER': (r) => r.serialNumber,
    'NOMBRE EQUIPO': (r) => r.hostname,
    'TIPO': (r) => r.tipo,
    'MARCA': (r) => r.marca,
    'MODELO': (r) => r.modelo,
    'EMPRESA': (r) => r.empresaNombre,
    'ESTADO': (r) => r.estado,
    'ESTADO SECUNDARIO': (r) => r.estadoSecundario,
    'LEGAJO ASIGNACIÓN': (r) => r.colaboradorLegajo,
    'PRINCIPAL/SECUNDARIA': (r) => r.principalSecundaria,
    'MOTIVO ASIGNACION': (r) => r.motivoAsignacion,
    'FECHA ASIGNACIÓN': (r) => r.fechaAsignacion,
    'PLANTA ASIGNACIÓN': (r) => r.sitioNombre,
    'COMENTARIO ASIGNACIÓN': (r) => r.comentarios,
    'COMPRADO POR': (r) => r.compradoPor,
  },
};

// --- EQUIPAMIENTO template: MONITORES sheet ---
export const MONITORES_SHEET: SheetConfig = {
  sheetName: 'MONITORES',
  headerRow: 2,
  columnMap: {
    'SERIAL NUMBER': (r) => r.serialNumber,
    'EMPRESA': (r) => r.empresa,
    'TIPO MONITOR': (r) => r.tipoMonitor,
    'MARCA MONITOR': (r) => r.marca,
    'MODELO MONITOR': (r) => r.modelo,
    'PULGADAS': (r) => r.pulgadas,
    'PROVEEDOR': (r) => r.proveedor,
    'ORDEN DE COMPRA': (r) => r.ordenCompra,
    'FACTURA': (r) => r.factura,
    'FECHA COMPRA': (r) => r.fechaCompra,
    'DIAS GARANTIA': (r) => r.diasGarantia,
    'VENC.GARANTIA': (r) => r.vencGarantia,
    'OBSOLETO': (r) => r.obsoleto ? 'SI' : 'NO',
    'COMPRADA POR': (r) => r.compradoPor,
    'LEGAJO': (r) => r.colaboradorLegajo,
    'COMENTARIOS': (r) => r.comentarios,
  },
};

// --- CELULARES template: CELULARES sheet ---
export const CELULARES_SHEET: SheetConfig = {
  sheetName: 'CELULARES',
  headerRow: 3,
  columnMap: {
    'IMEI EQUIPO': (r) => r.imei,
    'TIPO': (r) => r.tipo,
    'MARCA': (r) => r.marca,
    'MODELO': (r) => r.modelo,
    'EMPRESA': (r) => r.empresaNombre,
    'PROVEEDOR': (r) => r.proveedor,
    'FECHA COMPRA': (r) => r.fechaCompra,
    'OBSOLETO': (r) => r.obsoleto ? 'SI' : 'NO',
    'COMENTARIOS': (r) => r.comentarios,
  },
};

// --- CELULARES template: LINEAS sheet ---
export const LINEAS_SHEET: SheetConfig = {
  sheetName: 'LINEAS',
  headerRow: 3,
  columnMap: {
    'LINEA': (r) => r.numero,
    'TIPO LINEA': (r) => r.tipoLinea,
    'PROVEEDOR': (r) => r.proveedor,
    'Activo': (r) => r.estado === 'ACTIVA' ? 'SI' : 'NO',
    'COMENTARIOS': (r) => r.comentarios,
  },
};

// --- CELULARES template: Inventario sheet (combined assignment view) ---
export const INVENTARIO_CELULARES_SHEET: SheetConfig = {
  sheetName: 'Inventario',
  headerRow: 1,
  columnMap: {
    'TIPO': (r) => r.tipo,
    'Celular/Linea Asignado': (r) => r.identificador,
    'MARCA': (r) => r.marca,
    'MODELO': (r) => r.modelo,
    'EMPRESA': (r) => r.empresaNombre,
    'Proveedor': (r) => r.proveedor,
    'Linea-IMEI': (r) => r.lineaNumero,
    'LEGAJO': (r) => r.colaboradorLegajo,
    'ESTADO LINEA/EQUIPO': (r) => r.estado,
    'ESTADO SECUNDARIO LINEA/EQUIPO': (r) => r.estadoSecundario,
    'PLANTA': (r) => r.sitioNombre,
    'PRINCIPAL/SECUNDARIA': (r) => r.principalSecundaria,
    'MOTIVO ASIGNACION': (r) => r.motivoAsignacion,
    'FECHA ASIGNACION': (r) => r.fechaAsignacion,
    'COMENTARIOS': (r) => r.comentarios,
  },
};

// --- INSUMOS template: INVENTARIO sheet ---
export const INSUMOS_SHEET: SheetConfig = {
  sheetName: 'INVENTARIO',
  headerRow: 1,
  columnMap: {
    'INSUMO': (r) => r.nombre,
    'TIPO INSUMO': (r) => r.tipoInsumo,
    'SERIAL INSUMO': (r) => r.serialInsumo,
    'ORDEN DE COMPRA': (r) => r.ordenCompra,
    'FECHA COMPRA': (r) => r.fechaCompra,
    'Area Compra': (r) => r.areaCompra,
  },
};

// --- COLABORADORES template: QLP sheet ---
export const COLABORADORES_SHEET: SheetConfig = {
  sheetName: 'QLP',
  headerRow: 1,
  columnMap: {
    'Global ID': (r) => r.globalId,
    'Local ID': (r) => r.legajo,
    'Email': (r) => r.email,
    'Columna1': (r) => r.nombre,
    'Business Title': (r) => r.businessTitle,
    'Band': (r) => r.band,
    'Company ID': (r) => r.empresaCodigo,
    'Cost Center ID': (r) => r.costCenterId,
    'Cost Center Description': (r) => r.costCenterDesc,
    'Position ID': (r) => r.positionId,
    'Job Profile Name': (r) => r.positionName,
    'Hierarchy Manager Name': (r) => r.managerName,
    'Hierarchy Manager ID': (r) => r.managerId,
    'Area': (r) => r.area,
    'Sub Area': (r) => r.subArea,
    'Grouped Unity': (r) => r.groupedUnity,
    'Unity': (r) => r.unity,
    'Pais': (r) => r.pais,
    'Regional': (r) => r.regional,
    'HRBP': (r) => r.hrbp,
    'Last Hire Date': (r) => r.hireDate,
    'FTE Status Description': (r) => r.status,
    'Employee Group Description': (r) => r.collar,
  },
};
