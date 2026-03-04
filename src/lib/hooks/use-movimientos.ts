'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, MovimientoWithRelations } from '@/lib/types/database';

export function useMovimientos(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['movimientos', params],
    queryFn: () =>
      apiFetch<PaginatedResponse<MovimientoWithRelations>>(
        `/api/movimientos?${toQueryString(params)}`
      ),
    placeholderData: (prev) => prev,
  });
}

export function useMovimiento(id: string | null) {
  return useQuery({
    queryKey: ['movimientos', id],
    queryFn: () => apiFetch<MovimientoWithRelations>(`/api/movimientos/${id}`),
    enabled: !!id,
  });
}

export function useCreateMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/movimientos', { method: 'POST', body: data }),
    onSuccess: () => {
      // Cross-module invalidation: movimiento creation changes asset state
      queryClient.invalidateQueries({ queryKey: ['movimientos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['celulares'] });
      queryClient.invalidateQueries({ queryKey: ['monitores'] });
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Movimiento registrado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
