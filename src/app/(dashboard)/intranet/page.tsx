'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus, Search, FileText } from 'lucide-react';

import { useWikiPages, useCreateWikiPage } from '@/lib/hooks/use-wiki';
import { WIKI_CATEGORIAS } from '@/lib/utils/constants';
import type { CreateWikiPageInput } from '@/lib/validations/wiki';

import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { WikiForm } from '@/components/forms/wiki-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function IntranetPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.perfil === 'ADMIN';

  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);

  const { data: pages, isLoading } = useWikiPages({
    categoria: selectedCategoria,
    search: search.length >= 2 ? search : undefined,
  });

  const createMutation = useCreateWikiPage();

  const handleCreate = (data: CreateWikiPageInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  // Group pages by category
  const grouped = (pages ?? []).reduce<Record<string, typeof pages>>((acc, page) => {
    if (!page) return acc;
    const cat = page.categoria;
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(page);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Intranet"
        description="Procesos, politicas y documentacion del area"
      >
        {isAdmin && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Pagina
          </Button>
        )}
      </PageHeader>

      {/* Search + category filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paginas..."
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
          {WIKI_CATEGORIAS.map((cat) => (
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
          <FileText className="h-12 w-12" />
          <p>No hay paginas disponibles.</p>
          {isAdmin && <p className="text-xs">Cree una nueva pagina para comenzar.</p>}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([categoria, catPages]) => (
            <div key={categoria}>
              <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                {categoria}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {catPages?.map((page) => (
                  <Link
                    key={page.id}
                    href={`/intranet/${page.slug}`}
                    className="rounded-lg border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {page.titulo}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {page.contenido.slice(0, 120)}...
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <FormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          title="Nueva Pagina"
          description="Cree una nueva pagina de la intranet"
        >
          <WikiForm onSubmit={handleCreate} isLoading={createMutation.isPending} />
        </FormDialog>
      )}
    </div>
  );
}
