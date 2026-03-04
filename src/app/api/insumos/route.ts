import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listInsumos, createInsumo } from '@/lib/services/insumos';
import { createInsumoSchema, type CreateInsumoInput } from '@/lib/validations/insumo';

export const GET = withAuth('read', 'insumos', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    tipoInsumo: sp.get('tipoInsumo') || undefined,
  };
  const result = await listInsumos(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateInsumoInput>('create', 'insumos', async (_req, _session, body) => {
  const created = await createInsumo(body!);
  return NextResponse.json(created, { status: 201 });
}, { schema: createInsumoSchema });
