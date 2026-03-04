'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, Colaborador } from '@/lib/types/database';

type ColaboradorList = Colaborador & { empresa: { nombre: string } | null; sitio: { nombre: string } | null };

export function useColaboradores(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['colaboradores', params],
    queryFn: () => apiFetch<PaginatedResponse<ColaboradorList>>(`/api/colaboradores?${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useColaborador(id: string | undefined) {
  return useQuery({
    queryKey: ['colaboradores', id],
    queryFn: () => apiFetch<ColaboradorList>(`/api/colaboradores/${id}`),
    enabled: !!id,
  });
}

export function useCreateColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/colaboradores', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/colaboradores/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      queryClient.invalidateQueries({ queryKey: ['colaboradores', id] });
      toast.success('Colaborador actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/colaboradores/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] });
      toast.success('Colaborador eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useSearchColaboradores(query: string) {
  return useQuery({
    queryKey: ['colaboradores', 'search', query],
    queryFn: () => apiFetch<{ id: string; legajo: string; nombre: string; email: string | null }[]>(`/api/colaboradores?search=${encodeURIComponent(query)}&pageSize=10`),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
