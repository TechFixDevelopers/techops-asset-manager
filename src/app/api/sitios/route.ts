import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { db } from '@/lib/db';
import { sitios } from '@/lib/db/schema';

export const GET = withAuth('read', 'sitios', async () => {
  const data = await db.select().from(sitios);
  return NextResponse.json(data);
});
