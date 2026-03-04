'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, Monitor } from '@/lib/types/database';

type MonitorList = Monitor & {
  colaborador: { nombre: string } | null;
  sitio: { nombre: string } | null;
};

export function useMonitores(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['monitores', params],
    queryFn: () => apiFetch<PaginatedResponse<MonitorList>>(`/api/monitores?${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useMonitor(id: string | undefined) {
  return useQuery({
    queryKey: ['monitores', id],
    queryFn: () => apiFetch<MonitorList>(`/api/monitores/${id}`),
    enabled: !!id,
  });
}

export function useCreateMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/monitores', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitores'] });
      toast.success('Monitor creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/monitores/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['monitores'] });
      queryClient.invalidateQueries({ queryKey: ['monitores', id] });
      toast.success('Monitor actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteMonitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/monitores/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitores'] });
      toast.success('Monitor eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
