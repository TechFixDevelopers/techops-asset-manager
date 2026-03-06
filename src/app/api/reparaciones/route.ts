import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listReparaciones, createReparacion } from '@/lib/services/reparaciones';
import { createReparacionSchema } from '@/lib/validations/reparacion';

export const GET = withAuth('read', 'reparaciones', async (req) => {
  const url = new URL(req.url);
  const params = {
    page: Number(url.searchParams.get('page') || '1'),
    pageSize: Number(url.searchParams.get('pageSize') || '25'),
    search: url.searchParams.get('search') || undefined,
    tipoTarea: url.searchParams.get('tipoTarea') || undefined,
    estado: url.searchParams.get('estado') || undefined,
  };

  const result = await listReparaciones(params);
  return NextResponse.json(result);
});

export const POST = withAuth('create', 'reparaciones', async (req, session) => {
  const body = await req.json();
  const parsed = createReparacionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.issues }, { status: 400 });
  }

  const reparacion = await createReparacion(parsed.data, session.user.id);
  return NextResponse.json(reparacion, { status: 201 });
});
