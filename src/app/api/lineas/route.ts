import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listLineas, createLinea } from '@/lib/services/lineas';
import { createLineaSchema, type CreateLineaInput } from '@/lib/validations/linea';

export const GET = withAuth('read', 'lineas', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    proveedor: sp.get('proveedor') || undefined,
    estado: sp.get('estado') || undefined,
    tipoLinea: sp.get('tipoLinea') || undefined,
    sitioId: sp.get('sitioId') || undefined,
  };
  const result = await listLineas(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateLineaInput>('create', 'lineas', async (_req, _session, body) => {
  const created = await createLinea(body!);
  return NextResponse.json(created, { status: 201 });
}, { schema: createLineaSchema });
