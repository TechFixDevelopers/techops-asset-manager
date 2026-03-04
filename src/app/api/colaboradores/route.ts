import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listColaboradores, createColaborador } from '@/lib/services/colaboradores';
import { createColaboradorSchema, type CreateColaboradorInput } from '@/lib/validations/colaborador';

export const GET = withAuth('read', 'colaboradores', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    status: sp.get('status') || undefined,
    empresaId: sp.get('empresaId') || undefined,
    sitioId: sp.get('sitioId') || undefined,
    area: sp.get('area') || undefined,
  };
  const result = await listColaboradores(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateColaboradorInput>('create', 'colaboradores', async (_req, _session, body) => {
  const created = await createColaborador(body!);
  return NextResponse.json(created, { status: 201 });
}, { schema: createColaboradorSchema });
