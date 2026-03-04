import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getLineaById, updateLinea, deleteLinea } from '@/lib/services/lineas';
import { updateLineaSchema, type UpdateLineaInput } from '@/lib/validations/linea';

export const GET = withAuth('read', 'lineas', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getLineaById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateLineaInput>('update', 'lineas', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateLinea(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
}, { schema: updateLineaSchema });

export const DELETE = withAuth('delete', 'lineas', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await deleteLinea(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
