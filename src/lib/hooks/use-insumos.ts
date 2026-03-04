'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/utils/api';
import { toQueryString } from '@/lib/utils/query-string';
import type { PaginatedResponse, Insumo, InsumoWithStock } from '@/lib/types/database';

type InsumoList = Insumo & { stockTotal: number };

type InsumoDetail = InsumoWithStock & { stockEntries: Array<{ id: string; insumoId: string; sitioId: string; cantidad: number; updatedAt: Date | string | null; sitio?: { nombre: string } | null }> };

export function useInsumos(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['insumos', params],
    queryFn: () => apiFetch<PaginatedResponse<InsumoList>>(`/api/insumos?${toQueryString(params)}`),
    placeholderData: (prev) => prev,
  });
}

export function useInsumo(id: string | undefined) {
  return useQuery({
    queryKey: ['insumos', id],
    queryFn: () => apiFetch<InsumoDetail>(`/api/insumos/${id}`),
    enabled: !!id,
  });
}

export function useCreateInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch('/api/insumos', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      toast.success('Insumo creado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiFetch(`/api/insumos/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      queryClient.invalidateQueries({ queryKey: ['insumos', id] });
      toast.success('Insumo actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteInsumo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/insumos/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      toast.success('Insumo eliminado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { insumoId: string; sitioId: string; cantidad: number }) =>
      apiFetch('/api/insumos/stock', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insumos'] });
      toast.success('Stock ajustado correctamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
