import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { getLinkById, updateLink, deleteLink } from '@/lib/services/links';
import { updateLinkSchema } from '@/lib/validations/link';

export const PATCH = withAuth('update', 'links', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').pop()!;
  const existing = await getLinkById(id);
  if (!existing) return NextResponse.json({ error: 'Link no encontrado' }, { status: 404 });

  const body = await req.json();
  const parsed = updateLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos invalidos', details: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateLink(id, parsed.data);
  return NextResponse.json(updated);
});

export const DELETE = withAuth('delete', 'links', async (req: NextRequest) => {
  const id = req.nextUrl.pathname.split('/').pop()!;
  const existing = await getLinkById(id);
  if (!existing) return NextResponse.json({ error: 'Link no encontrado' }, { status: 404 });

  await deleteLink(id);
  return NextResponse.json({ success: true });
});
