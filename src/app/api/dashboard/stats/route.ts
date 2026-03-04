import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/api-guard';
import { getDashboardStats, getChartData } from '@/lib/services/dashboard';

export const GET = withAuth('read', 'equipos', async (req) => {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('charts') === 'true') {
    const charts = await getChartData();
    return NextResponse.json(charts);
  }
  const stats = await getDashboardStats();
  return NextResponse.json(stats);
}, { skipCsrf: true });
