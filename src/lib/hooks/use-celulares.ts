'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, Celular } from '@/lib/types/database';

type CelularList = Celular & {
  empresa: { nombre: string } | null;
  colaborador: { nombre: string } | null;
  linea: { numero: string } | null;
  sitio: { nombre: string } | null;
};

export function useCelulares(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['celulares', params],
    queryFn: () => apiFetch<PaginatedResponse<CelularList>>(`/api/celulares?${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useCelular(id: string | undefined) {
  return useQuery({
    queryKey: ['celulares', id],
    queryFn: () => apiFetch<CelularList>(`/api/celulares/${id}`),
    enabled: !!id,
  });
}

export function useCreateCelular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/celulares', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celulares'] });
      toast.success('Celular creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCelular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/celulares/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['celulares'] });
      queryClient.invalidateQueries({ queryKey: ['celulares', id] });
      toast.success('Celular actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCelular() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/celulares/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['celulares'] });
      toast.success('Celular eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
