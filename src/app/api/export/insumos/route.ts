import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { insumos } from '@/lib/db/schema';
import {
  exportFromTemplate,
  TEMPLATE_FILES,
  INSUMOS_SHEET,
} from '@/lib/utils/excel-template-export';

export const GET = withAuth('read', 'insumos', async () => {
  const data = await db
    .select({
      nombre: insumos.nombre,
      tipoInsumo: insumos.tipoInsumo,
      serialInsumo: insumos.serialInsumo,
      ordenCompra: insumos.ordenCompra,
      fechaCompra: insumos.fechaCompra,
      areaCompra: insumos.areaCompra,
    })
    .from(insumos);

  try {
    const buffer = await exportFromTemplate(TEMPLATE_FILES.insumos, [
      { config: INSUMOS_SHEET, data },
    ]);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Inventario Insumos AR.xlsx"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Export failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}, { skipCsrf: true });
