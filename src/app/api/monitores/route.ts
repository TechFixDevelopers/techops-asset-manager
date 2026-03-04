import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listMonitores, createMonitor } from '@/lib/services/monitores';
import { createMonitorSchema, type CreateMonitorInput } from '@/lib/validations/monitor';

export const GET = withAuth('read', 'monitores', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    marca: sp.get('marca') || undefined,
    sitioId: sp.get('sitioId') || undefined,
    obsoleto: sp.get('obsoleto') === 'true' ? true : sp.get('obsoleto') === 'false' ? false : undefined,
  };
  const result = await listMonitores(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateMonitorInput>('create', 'monitores', async (_req, _session, body) => {
  const created = await createMonitor(body!);
  return NextResponse.json(created, { status: 201 });
}, { schema: createMonitorSchema });
