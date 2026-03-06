'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils/api';
import type { WikiPage } from '@/lib/types/database';
import type { CreateWikiPageInput, UpdateWikiPageInput } from '@/lib/validations/wiki';

export function useWikiPages(params?: { categoria?: string; search?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.categoria) searchParams.set('categoria', params.categoria);
  if (params?.search) searchParams.set('search', params.search);
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ['wiki', params],
    queryFn: () => apiFetch<WikiPage[]>(`/api/wiki${qs ? `?${qs}` : ''}`),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWikiPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['wiki', slug],
    queryFn: () => apiFetch<WikiPage>(`/api/wiki/${slug}`),
    enabled: !!slug,
  });
}

export function useCreateWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWikiPageInput) =>
      apiFetch<WikiPage>('/api/wiki', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wiki'] }),
  });
}

export function useUpdateWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: UpdateWikiPageInput }) =>
      apiFetch<WikiPage>(`/api/wiki/${slug}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wiki'] }),
  });
}

export function useDeleteWikiPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) =>
      apiFetch(`/api/wiki/${slug}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wiki'] }),
  });
}
