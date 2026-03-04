'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils/api';
import type { DashboardStats } from '@/lib/types/database';
import type { ChartData } from '@/lib/services/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiFetch<DashboardStats>('/api/dashboard/stats'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ['dashboard', 'charts'],
    queryFn: () => apiFetch<ChartData>('/api/dashboard/stats?charts=true'),
    staleTime: 5 * 60 * 1000,
  });
}
