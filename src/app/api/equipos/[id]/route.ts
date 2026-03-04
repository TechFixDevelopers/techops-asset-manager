import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getEquipoById, updateEquipo, softDeleteEquipo } from '@/lib/services/equipos';
import { updateEquipoSchema, type UpdateEquipoInput } from '@/lib/validations/equipo';

export const GET = withAuth('read', 'equipos', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getEquipoById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateEquipoInput>('update', 'equipos', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateEquipo(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
}, { schema: updateEquipoSchema });

export const DELETE = withAuth('delete', 'equipos', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await softDeleteEquipo(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
