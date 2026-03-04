import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listCelulares, createCelular } from '@/lib/services/celulares';
import { createCelularSchema, type CreateCelularInput } from '@/lib/validations/celular';

export const GET = withAuth('read', 'celulares', async (req) => {
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
  };
  const result = await listCelulares(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateCelularInput>('create', 'celulares', async (_req, _session, body) => {
  const created = await createCelular(body!);
  return NextResponse.json(created, { status: 201 });
}, { schema: createCelularSchema });
