import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listWikiPages, createWikiPage } from '@/lib/services/wiki';
import { createWikiPageSchema } from '@/lib/validations/wiki';

export const GET = withAuth('read', 'wiki', async (req) => {
  const url = new URL(req.url);
  const categoria = url.searchParams.get('categoria') || undefined;
  const search = url.searchParams.get('search') || undefined;

  const pages = await listWikiPages({ categoria, search, activo: true });
  return NextResponse.json(pages);
});

export const POST = withAuth('create', 'wiki', async (req) => {
  const body = await req.json();
  const parsed = createWikiPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.issues }, { status: 400 });
  }

  const page = await createWikiPage(parsed.data);
  return NextResponse.json(page, { status: 201 });
});
