import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getColaboradorById, updateColaborador, softDeleteColaborador } from '@/lib/services/colaboradores';
import { updateColaboradorSchema, type UpdateColaboradorInput } from '@/lib/validations/colaborador';

export const GET = withAuth('read', 'colaboradores', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getColaboradorById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateColaboradorInput>('update', 'colaboradores', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateColaborador(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
}, { schema: updateColaboradorSchema });

export const DELETE = withAuth('delete', 'colaboradores', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await softDeleteColaborador(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
