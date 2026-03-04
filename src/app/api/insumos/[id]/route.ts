import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getInsumoById, updateInsumo, deleteInsumo } from '@/lib/services/insumos';
import { updateInsumoSchema, type UpdateInsumoInput } from '@/lib/validations/insumo';

export const GET = withAuth('read', 'insumos', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getInsumoById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateInsumoInput>('update', 'insumos', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateInsumo(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
}, { schema: updateInsumoSchema });

export const DELETE = withAuth('delete', 'insumos', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await deleteInsumo(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
