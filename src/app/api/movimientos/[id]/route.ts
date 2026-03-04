import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { getMovimientoById } from '@/lib/services/movimientos';
import { extractIdFromPath } from '@/lib/utils/route-helpers';

export const GET = withAuth('read', 'movimientos', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getMovimientoById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
