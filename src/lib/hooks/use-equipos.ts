'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, Equipo } from '@/lib/types/database';

type EquipoList = Equipo & {
  empresa: { nombre: string } | null;
  colaborador: { nombre: string } | null;
  sitio: { nombre: string } | null;
};

export function useEquipos(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['equipos', params],
    queryFn: () => apiFetch<PaginatedResponse<EquipoList>>(`/api/equipos?${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useEquipo(id: string | undefined) {
  return useQuery({
    queryKey: ['equipos', id],
    queryFn: () => apiFetch<EquipoList>(`/api/equipos/${id}`),
    enabled: !!id,
  });
}

export function useCreateEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/equipos', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      toast.success('Equipo creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/equipos/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      queryClient.invalidateQueries({ queryKey: ['equipos', id] });
      toast.success('Equipo actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEquipo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/equipos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipos'] });
      toast.success('Equipo eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
