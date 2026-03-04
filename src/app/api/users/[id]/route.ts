import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { extractIdFromPath } from '@/lib/utils/route-helpers';
import { getAppUserById, updateAppUser, deleteAppUser } from '@/lib/services/app-users';
import { updateAppUserSchema, type UpdateAppUserInput } from '@/lib/validations/app-user';

export const GET = withAuth('read', 'app_users', async (req) => {
  try {
    const id = extractIdFromPath(req);
    const user = await getAppUserById(id);
    if (!user) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});

export const PATCH = withAuth<UpdateAppUserInput>('update', 'app_users', async (req, _session, body) => {
  try {
    const id = extractIdFromPath(req);
    const updated = await updateAppUser(id, body!);
    if (!updated) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes('unique')) {
      return NextResponse.json(
        { error: 'El nombre de usuario ya existe' },
        { status: 409 },
      );
    }
    throw error;
  }
}, { schema: updateAppUserSchema });

export const DELETE = withAuth('delete', 'app_users', async (req) => {
  try {
    const id = extractIdFromPath(req);
    await deleteAppUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid or missing UUID')) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    throw error;
  }
});
