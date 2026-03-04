import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { empresas } from '@/lib/db/schema';

export const GET = withAuth('read', 'empresas', async () => {
  const data = await db.select().from(empresas);
  return NextResponse.json(data);
});
