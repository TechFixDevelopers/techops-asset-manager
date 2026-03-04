import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getMonitorById, updateMonitor, softDeleteMonitor } from '@/lib/services/monitores';
import { updateMonitorSchema, type UpdateMonitorInput } from '@/lib/validations/monitor';

export const GET = withAuth('read', 'monitores', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const item = await getMonitorById(id);
    if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateMonitorInput>('update', 'monitores', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateMonitor(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
}, { schema: updateMonitorSchema });

export const DELETE = withAuth('delete', 'monitores', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await softDeleteMonitor(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
