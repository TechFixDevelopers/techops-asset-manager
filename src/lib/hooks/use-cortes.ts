'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse } from '@/lib/types/database';
import type { CorteListItem } from '@/lib/services/cortes';

export interface CorteDetail {
  id: string;
  fechaCorte: string;
  sitioId: string;
  sitioNombre: string | null;
  generadoPor: string | null;
  generadoPorNombre: string | null;
  equiposData: unknown[];
  celularesData: unknown[];
  insumosData: unknown[];
  lineasData: unknown[];
  reconciliado: boolean | null;
  diferencias: unknown;
  createdAt: string | null;
}

export function useCortes(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['cortes', params],
    queryFn: () =>
      apiFetch<PaginatedResponse<CorteListItem>>(
        `/api/cortes?${toQueryString(params)}`,
      ),
    placeholderData: (prev) => prev,
  });
}

export function useCorte(id: string | undefined) {
  return useQuery({
    queryKey: ['cortes', id],
    queryFn: () => apiFetch<CorteDetail>(`/api/cortes/${id}`),
    enabled: !!id,
  });
}

export function useCreateCorte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { sitioId: string; fechaCorte?: string }) =>
      apiFetch('/api/cortes', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cortes'] });
      toast.success('Corte de stock generado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useReconciliarCorte() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/cortes/${id}`, { method: 'PATCH' }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['cortes'] });
      queryClient.invalidateQueries({ queryKey: ['cortes', id] });
      toast.success('Corte reconciliado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
