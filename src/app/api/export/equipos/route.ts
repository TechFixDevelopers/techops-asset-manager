import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { equipos, empresas, colaboradores, sitios, monitores } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import {
  exportFromTemplate,
  TEMPLATE_FILES,
  EQUIPOS_SHEET,
  INVENTARIO_EQUIPOS_SHEET,
  MONITORES_SHEET,
} from '@/lib/utils/excel-template-export';

export const GET = withAuth('read', 'equipos', async () => {
  // Query equipos with all related data (for EQUIPOS + INVENTARIO sheets)
  const equiposData = await db
    .select({
      serialNumber: equipos.serialNumber,
      hostname: equipos.hostname,
      tipo: equipos.tipo,
      marca: equipos.marca,
      modelo: equipos.modelo,
      empresaNombre: empresas.nombre,
      compradoPor: equipos.compradoPor,
      ordenCompra: equipos.ordenCompra,
      fechaCompra: equipos.fechaCompra,
      diasGarantia: equipos.diasGarantia,
      vencGarantia: equipos.vencGarantia,
      obsoleto: equipos.obsoleto,
      estado: equipos.estado,
      estadoSecundario: equipos.estadoSecundario,
      colaboradorLegajo: colaboradores.legajo,
      principalSecundaria: equipos.principalSecundaria,
      motivoAsignacion: equipos.motivoAsignacion,
      fechaAsignacion: equipos.fechaAsignacion,
      sitioNombre: sitios.nombre,
      comentarios: equipos.comentarios,
    })
    .from(equipos)
    .leftJoin(empresas, eq(equipos.empresaId, empresas.id))
    .leftJoin(colaboradores, eq(equipos.colaboradorId, colaboradores.id))
    .leftJoin(sitios, eq(equipos.sitioId, sitios.id))
    .where(isNull(equipos.deletedAt));

  // Query monitores with colaborador (for MONITORES sheet)
  const monitoresData = await db
    .select({
      serialNumber: monitores.serialNumber,
      empresa: monitores.empresa,
      tipoMonitor: monitores.tipoMonitor,
      marca: monitores.marca,
      modelo: monitores.modelo,
      pulgadas: monitores.pulgadas,
      proveedor: monitores.proveedor,
      ordenCompra: monitores.ordenCompra,
      factura: monitores.factura,
      fechaCompra: monitores.fechaCompra,
      diasGarantia: monitores.diasGarantia,
      vencGarantia: monitores.vencGarantia,
      obsoleto: monitores.obsoleto,
      compradoPor: monitores.compradoPor,
      colaboradorLegajo: colaboradores.legajo,
      comentarios: monitores.comentarios,
    })
    .from(monitores)
    .leftJoin(colaboradores, eq(monitores.colaboradorId, colaboradores.id))
    .where(isNull(monitores.deletedAt));

  try {
    const buffer = await exportFromTemplate(TEMPLATE_FILES.equipamiento, [
      { config: EQUIPOS_SHEET, data: equiposData },
      { config: INVENTARIO_EQUIPOS_SHEET, data: equiposData },
      { config: MONITORES_SHEET, data: monitoresData },
    ]);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Inventario EQUIPAMIENTO AR.xlsx"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Export failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}, { skipCsrf: true });
