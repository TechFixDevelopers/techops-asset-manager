'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils/api';
import type { LinkUtil } from '@/lib/types/database';
import type { CreateLinkInput, UpdateLinkInput } from '@/lib/validations/link';

export function useLinks(params?: { categoria?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.categoria) searchParams.set('categoria', params.categoria);
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['links', params],
    queryFn: () => apiFetch<LinkUtil[]>(`/api/links${qs ? `?${qs}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLinkInput) =>
      apiFetch<LinkUtil>('/api/links', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links'] }),
  });
}

export function useUpdateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLinkInput }) =>
      apiFetch<LinkUtil>(`/api/links/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links'] }),
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/links/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['links'] }),
  });
}
