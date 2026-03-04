import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { listAppUsers, createAppUser } from '@/lib/services/app-users';
import { createAppUserSchema, type CreateAppUserInput } from '@/lib/validations/app-user';

export const GET = withAuth('read', 'app_users', async (req) => {
  const sp = req.nextUrl.searchParams;
  const params = {
    page: Number(sp.get('page')) || 1,
    pageSize: Number(sp.get('pageSize')) || 25,
    search: sp.get('search') || undefined,
    perfil: sp.get('perfil') || undefined,
    activo: sp.get('activo') === 'true' ? true : sp.get('activo') === 'false' ? false : undefined,
  };
  const result = await listAppUsers(params);
  return NextResponse.json(result);
});

export const POST = withAuth<CreateAppUserInput>('create', 'app_users', async (_req, _session, body) => {
  try {
    const created = await createAppUser(body!);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 409 },
      );
    }
    throw error;
  }
}, { schema: createAppUserSchema });
