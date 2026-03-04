'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils/api';
import type { Empresa, Sitio } from '@/lib/types/database';

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: () => apiFetch<Empresa[]>('/api/empresas'),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSitios() {
  return useQuery({
    queryKey: ['sitios'],
    queryFn: () => apiFetch<Sitio[]>('/api/sitios'),
    staleTime: 30 * 60 * 1000,
  });
}
