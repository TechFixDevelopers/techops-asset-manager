import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { getWikiPageBySlug, updateWikiPage, deleteWikiPage } from '@/lib/services/wiki';
import { updateWikiPageSchema } from '@/lib/validations/wiki';

export const GET = withAuth('read', 'wiki', async (req: NextRequest) => {
  const slug = req.nextUrl.pathname.split('/').pop()!;
  const page = await getWikiPageBySlug(slug);
  if (!page) return NextResponse.json({ error: 'Pagina no encontrada' }, { status: 404 });
  return NextResponse.json(page);
});

export const PATCH = withAuth('update', 'wiki', async (req: NextRequest) => {
  const slug = req.nextUrl.pathname.split('/').pop()!;
  const page = await getWikiPageBySlug(slug);
  if (!page) return NextResponse.json({ error: 'Pagina no encontrada' }, { status: 404 });

  const body = await req.json();
  const parsed = updateWikiPageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateWikiPage(page.id, parsed.data);
  return NextResponse.json(updated);
});

export const DELETE = withAuth('delete', 'wiki', async (req: NextRequest) => {
  const slug = req.nextUrl.pathname.split('/').pop()!;
  const page = await getWikiPageBySlug(slug);
  if (!page) return NextResponse.json({ error: 'Pagina no encontrada' }, { status: 404 });

  await deleteWikiPage(page.id);
  return NextResponse.json({ success: true });
});
