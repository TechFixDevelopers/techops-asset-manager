import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { celulares, empresas, colaboradores, lineas, sitios } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import {
  exportFromTemplate,
  TEMPLATE_FILES,
  CELULARES_SHEET,
  LINEAS_SHEET,
  INVENTARIO_CELULARES_SHEET,
} from '@/lib/utils/excel-template-export';

export const GET = withAuth('read', 'celulares', async () => {
  // Query celulares with all relations (for CELULARES + Inventario sheets)
  const celularesData = await db
    .select({
      imei: celulares.imei,
      tipo: celulares.tipo,
      marca: celulares.marca,
      modelo: celulares.modelo,
      empresaNombre: empresas.nombre,
      proveedor: celulares.proveedor,
      fechaCompra: celulares.fechaCompra,
      obsoleto: celulares.obsoleto,
      estado: celulares.estado,
      estadoSecundario: celulares.estadoSecundario,
      colaboradorLegajo: colaboradores.legajo,
      lineaNumero: lineas.numero,
      sitioNombre: sitios.nombre,
      principalSecundaria: celulares.principalSecundaria,
      motivoAsignacion: celulares.motivoAsignacion,
      fechaAsignacion: celulares.fechaAsignacion,
      comentarios: celulares.comentarios,
    })
    .from(celulares)
    .leftJoin(empresas, eq(celulares.empresaId, empresas.id))
    .leftJoin(colaboradores, eq(celulares.colaboradorId, colaboradores.id))
    .leftJoin(lineas, eq(celulares.lineaId, lineas.id))
    .leftJoin(sitios, eq(celulares.sitioId, sitios.id))
    .where(isNull(celulares.deletedAt));

  // Query lineas (for LINEAS sheet)
  const lineasData = await db
    .select({
      numero: lineas.numero,
      tipoLinea: lineas.tipoLinea,
      proveedor: lineas.proveedor,
      estado: lineas.estado,
      comentarios: lineas.comentarios,
    })
    .from(lineas);

  // Build combined Inventario data (celulares + lineas assignment view)
  const inventarioData: Record<string, unknown>[] = [
    // Celular rows
    ...celularesData.map((c) => ({
      tipo: c.tipo,
      identificador: c.imei,
      marca: c.marca,
      modelo: c.modelo,
      empresaNombre: c.empresaNombre,
      proveedor: c.proveedor,
      lineaNumero: c.lineaNumero,
      colaboradorLegajo: c.colaboradorLegajo,
      estado: c.estado,
      estadoSecundario: c.estadoSecundario,
      sitioNombre: c.sitioNombre,
      principalSecundaria: c.principalSecundaria,
      motivoAsignacion: c.motivoAsignacion,
      fechaAsignacion: c.fechaAsignacion,
      comentarios: c.comentarios,
    })),
    // Linea rows
    ...lineasData.map((l) => ({
      tipo: 'LINEA',
      identificador: l.numero,
      marca: null,
      modelo: null,
      empresaNombre: null,
      proveedor: l.proveedor,
      lineaNumero: null,
      colaboradorLegajo: null,
      estado: l.estado,
      estadoSecundario: null,
      sitioNombre: null,
      principalSecundaria: null,
      motivoAsignacion: null,
      fechaAsignacion: null,
      comentarios: l.comentarios,
    })),
  ];

  try {
    const buffer = await exportFromTemplate(TEMPLATE_FILES.celulares, [
      { config: CELULARES_SHEET, data: celularesData },
      { config: LINEAS_SHEET, data: lineasData },
      { config: INVENTARIO_CELULARES_SHEET, data: inventarioData },
    ]);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Inventario CELULARES AR.xlsx"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Export failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}, { skipCsrf: true });
