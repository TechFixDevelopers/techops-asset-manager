'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils/api';
import type { PaginatedResponse } from '@/lib/types/database';
import type { CreateReparacionInput, UpdateReparacionInput } from '@/lib/validations/reparacion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReparacionRow = Record<string, any>;

export function useReparaciones(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['reparaciones', params],
    queryFn: () => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') sp.set(k, String(v));
      }
      return apiFetch<PaginatedResponse<ReparacionRow>>(`/api/reparaciones?${sp.toString()}`);
    },
  });
}

export function useReparacion(id: string | undefined) {
  return useQuery({
    queryKey: ['reparaciones', id],
    queryFn: () => apiFetch<ReparacionRow>(`/api/reparaciones/${id}`),
    enabled: !!id,
  });
}

export function useCreateReparacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReparacionInput) =>
      apiFetch<ReparacionRow>('/api/reparaciones', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reparaciones'] }),
  });
}

export function useUpdateReparacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReparacionInput }) =>
      apiFetch<ReparacionRow>(`/api/reparaciones/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reparaciones'] }),
  });
}

export function useDeleteReparacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/reparaciones/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reparaciones'] }),
  });
}
