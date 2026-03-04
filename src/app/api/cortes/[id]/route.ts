import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getCorteById, reconciliarCorte } from '@/lib/services/cortes';

export const GET = withAuth('read', 'cortes', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getCorteById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }
    throw error;
  }
}, { skipCsrf: true });

export const PATCH = withAuth('update', 'cortes', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await reconciliarCorte(id);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('Invalid or missing UUID')) {
        return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
      }
      if (error.message.includes('no encontrado') || error.message.includes('ya fue reconciliado')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    throw error;
  }
});
