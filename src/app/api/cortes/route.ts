import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listCortes, createCorteStock } from '@/lib/services/cortes';
import { createCorteSchema, searchCorteSchema, type CreateCorteInput } from '@/lib/validations/corte';

export const GET = withAuth('read', 'cortes', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = searchCorteSchema.parse({
    page: sp.get('page') || undefined,
    pageSize: sp.get('pageSize') || undefined,
    sitioId: sp.get('sitioId') || undefined,
    desde: sp.get('desde') || undefined,
    hasta: sp.get('hasta') || undefined,
    reconciliado: sp.get('reconciliado') || undefined,
  });
  const result = await listCortes(params);
  return NextResponse.json(result);
}, { skipCsrf: true });

export const POST = withAuth<CreateCorteInput>('create', 'cortes', async (_req, session, body) => {
  try {
    const result = await createCorteStock(body!.sitioId, session.user.id, body!.fechaCorte);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Ya existe un corte')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    throw error;
  }
}, { schema: createCorteSchema });
