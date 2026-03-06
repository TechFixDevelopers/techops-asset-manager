'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Search, ExternalLink, Pencil, Trash2, Link2 } from 'lucide-react';

import { useLinks, useCreateLink, useUpdateLink, useDeleteLink } from '@/lib/hooks/use-links';
import { LINK_CATEGORIAS } from '@/lib/utils/constants';
import type { CreateLinkInput, UpdateLinkInput } from '@/lib/validations/link';
import type { LinkUtil } from '@/lib/types/database';

import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { LinkForm } from '@/components/forms/link-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function LinksPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.perfil === 'ADMIN';

  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editLink, setEditLink] = useState<LinkUtil | null>(null);

  const { data: links, isLoading } = useLinks({
    categoria: selectedCategoria,
    search: search.length >= 2 ? search : undefined,
  });

  const createMutation = useCreateLink();
  const updateMutation = useUpdateLink();
  const deleteMutation = useDeleteLink();

  const handleCreate = (data: CreateLinkInput) => {
    createMutation.mutate(data, { onSuccess: () => setFormOpen(false) });
  };

  const handleUpdate = (data: UpdateLinkInput) => {
    if (!editLink) return;
    updateMutation.mutate(
      { id: editLink.id, data },
      { onSuccess: () => setEditLink(null) },
    );
  };

  const handleDelete = (id: string) => {
    if (!confirm('Eliminar este link?')) return;
    deleteMutation.mutate(id);
  };

  // Group by category
  const grouped = (links ?? []).reduce<Record<string, LinkUtil[]>>((acc, link) => {
    const cat = link.categoria;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Links Utiles"
        description="Accesos directos a herramientas y recursos"
      >
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Link
          </Button>
        )}
      </PageHeader>

      {/* Search + category filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar links..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={!selectedCategoria ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategoria(undefined)}
          >
            Todas
          </Badge>
          {LINK_CATEGORIAS.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategoria === cat ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategoria(selectedCategoria === cat ? undefined : cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Link2 className="h-12 w-12" />
          <p>No hay links disponibles.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([categoria, catLinks]) => (
            <div key={categoria}>
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {categoria}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catLinks.map((link) => (
                  <div
                    key={link.id}
                    className="group rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <h4 className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                          {link.titulo}
                          <ExternalLink className="ml-1 inline h-3 w-3" />
                        </h4>
                        {link.descripcion && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {link.descripcion}
                          </p>
                        )}
                      </a>
                      {isAdmin && (
                        <div className="ml-2 flex gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditLink(link)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => handleDelete(link.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <>
          <FormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            title="Nuevo Link"
            description="Agregue un link util"
          >
            <LinkForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
          </FormDialog>

          <FormDialog
            open={!!editLink}
            onOpenChange={(open) => !open && setEditLink(null)}
            title="Editar Link"
            description="Modifique el link"
          >
            {editLink && (
              <LinkForm
                defaultValues={{
                  titulo: editLink.titulo,
                  url: editLink.url,
                  descripcion: editLink.descripcion ?? '',
                  categoria: editLink.categoria,
                  orden: editLink.orden ?? 0,
                  activo: editLink.activo ?? true,
                }}
                onSubmit={handleUpdate}
                isLoading={updateMutation.isPending}
              />
            )}
          </FormDialog>
        </>
      )}
    </div>
  );
}
