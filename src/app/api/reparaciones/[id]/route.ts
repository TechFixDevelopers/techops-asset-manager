import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { getReparacionById, updateReparacion, deleteReparacion } from '@/lib/services/reparaciones';
import { updateReparacionSchema } from '@/lib/validations/reparacion';

export const GET = withAuth('read', 'reparaciones', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').pop()!;
  const reparacion = await getReparacionById(id);
  if (!reparacion) return NextResponse.json({ error: 'Reparacion no encontrada' }, { status: 404 });
  return NextResponse.json(reparacion);
});

export const PATCH = withAuth('update', 'reparaciones', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').pop()!;
  const existing = await getReparacionById(id);
  if (!existing) return NextResponse.json({ error: 'Reparacion no encontrada' }, { status: 404 });

  const body = await req.json();
  const parsed = updateReparacionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateReparacion(id, parsed.data);
  return NextResponse.json(updated);
});

export const DELETE = withAuth('delete', 'reparaciones', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').pop()!;
  await deleteReparacion(id);
  return NextResponse.json({ success: true });
});
