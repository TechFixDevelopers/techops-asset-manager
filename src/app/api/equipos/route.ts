import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listEquipos, createEquipo } from '@/lib/services/equipos';
import { createEquipoSchema, type CreateEquipoInput } from '@/lib/validations/equipo';

export const GET = withAuth('read', 'equipos', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    tipo: sp.get('tipo') || undefined,
    marca: sp.get('marca') || undefined,
    estado: sp.get('estado') || undefined,
    sitioId: sp.get('sitioId') || undefined,
    empresaId: sp.get('empresaId') || undefined,
    obsoleto: sp.get('obsoleto') === 'true' ? true : sp.get('obsoleto') === 'false' ? false : undefined,
  };
  const result = await listEquipos(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateEquipoInput>('create', 'equipos', async (_req, _session, body) => {
  const created = await createEquipo(body!);
  return NextResponse.json(created, { status: 201 });
}, { schema: createEquipoSchema });
