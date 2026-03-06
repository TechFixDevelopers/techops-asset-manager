'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, Linea } from '@/lib/types/database';

type LineaList = Linea & {
  sitio: { nombre: string } | null;
  celulares?: {
    id: string;
    imei: string;
    tipo: string;
    marca: string;
    modelo: string;
    estado: string;
    colaborador?: { nombre: string } | null;
  }[];
};

export function useLineas(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['lineas', params],
    queryFn: () => apiFetch<PaginatedResponse<LineaList>>(`/api/lineas?${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useLinea(id: string | undefined) {
  return useQuery({
    queryKey: ['lineas', id],
    queryFn: () => apiFetch<LineaList>(`/api/lineas/${id}`),
    enabled: !!id,
  });
}

export function useCreateLinea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/lineas', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      toast.success('Línea creada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateLinea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/lineas/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      queryClient.invalidateQueries({ queryKey: ['lineas', id] });
      toast.success('Línea actualizada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteLinea() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/lineas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lineas'] });
      toast.success('Línea eliminada correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
