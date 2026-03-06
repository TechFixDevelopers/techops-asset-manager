import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listLinks, createLink } from '@/lib/services/links';
import { createLinkSchema } from '@/lib/validations/link';

export const GET = withAuth('read', 'links', async (req) => {
  const url = new URL(req.url);
  const categoria = url.searchParams.get('categoria') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const links = await listLinks({ categoria, search });
  return NextResponse.json(links);
});

export const POST = withAuth('create', 'links', async (req) => {
  const body = await req.json();
  const parsed = createLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.issues }, { status: 400 });
  }

  const link = await createLink(parsed.data);
  return NextResponse.json(link, { status: 201 });
});
