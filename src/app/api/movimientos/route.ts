import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listMovimientos, createMovimiento } from '@/lib/services/movimientos';
import { createMovimientoSchema, type CreateMovimientoInput } from '@/lib/validations/movimiento';

export const GET = withAuth('read', 'movimientos', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    tipo: sp.get('tipo') || undefined,
    colaboradorId: sp.get('colaboradorId') || undefined,
    equipoId: sp.get('equipoId') || undefined,
    celularId: sp.get('celularId') || undefined,
    insumoId: sp.get('insumoId') || undefined,
    monitorId: sp.get('monitorId') || undefined,
    sitioId: sp.get('sitioId') || undefined,
    desde: sp.get('desde') || undefined,
    hasta: sp.get('hasta') || undefined,
  };
  const result = await listMovimientos(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateMovimientoInput>('create', 'movimientos', async (_req, session, body) => {
  const movimiento = await createMovimiento(body!, session.user.id);
  return NextResponse.json(movimiento, { status: 201 });
}, { schema: createMovimientoSchema });
