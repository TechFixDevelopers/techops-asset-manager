import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getCelularById, updateCelular, softDeleteCelular } from '@/lib/services/celulares';
import { updateCelularSchema, type UpdateCelularInput } from '@/lib/validations/celular';

export const GET = withAuth('read', 'celulares', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getCelularById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateCelularInput>('update', 'celulares', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateCelular(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
}, { schema: updateCelularSchema });

export const DELETE = withAuth('delete', 'celulares', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await softDeleteCelular(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
