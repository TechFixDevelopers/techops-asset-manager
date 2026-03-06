import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { colaboradores, empresas } from '@/lib/db/schema';
import { eq, isNull } from 'drizzle-orm';
import {
  exportFromTemplate,
  TEMPLATE_FILES,
  COLABORADORES_SHEET,
} from '@/lib/utils/excel-template-export';

export const GET = withAuth('read', 'colaboradores', async () => {
  const data = await db
    .select({
      globalId: colaboradores.globalId,
      legajo: colaboradores.legajo,
      email: colaboradores.email,
      nombre: colaboradores.nombre,
      businessTitle: colaboradores.businessTitle,
      band: colaboradores.band,
      empresaCodigo: empresas.codigo,
      costCenterId: colaboradores.costCenterId,
      costCenterDesc: colaboradores.costCenterDesc,
      positionId: colaboradores.positionId,
      positionName: colaboradores.positionName,
      managerName: colaboradores.managerName,
      managerId: colaboradores.managerId,
      area: colaboradores.area,
      subArea: colaboradores.subArea,
      groupedUnity: colaboradores.groupedUnity,
      unity: colaboradores.unity,
      pais: colaboradores.pais,
      regional: colaboradores.regional,
      hrbp: colaboradores.hrbp,
      hireDate: colaboradores.hireDate,
      status: colaboradores.status,
      collar: colaboradores.collar,
    })
    .from(colaboradores)
    .leftJoin(empresas, eq(colaboradores.empresaId, empresas.id))
    .where(isNull(colaboradores.deletedAt));

  try {
    const buffer = await exportFromTemplate(TEMPLATE_FILES.colaboradores, [
      { config: COLABORADORES_SHEET, data },
    ]);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="INVENTARIOS-Datos Planos ARG.xlsx"',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Export failed: ${(err as Error).message}` },
      { status: 500 },
    );
  }
}, { skipCsrf: true });
