'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useWikiPage, useUpdateWikiPage, useDeleteWikiPage } from '@/lib/hooks/use-wiki';
import type { UpdateWikiPageInput } from '@/lib/validations/wiki';

import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { WikiForm } from '@/components/forms/wiki-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function WikiPageDetail() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: session } = useSession();
  const isAdmin = session?.user?.perfil === 'ADMIN';

  const { data: page, isLoading } = useWikiPage(slug);
  const updateMutation = useUpdateWikiPage();
  const deleteMutation = useDeleteWikiPage();

  const [editOpen, setEditOpen] = useState(false);

  const handleUpdate = (data: UpdateWikiPageInput) => {
    updateMutation.mutate(
      { slug, data },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const handleDelete = () => {
    if (!confirm('Eliminar esta pagina?')) return;
    deleteMutation.mutate(slug, {
      onSuccess: () => router.push('/intranet'),
    });
  };

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Cargando...</div>;
  }

  if (!page) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Pagina no encontrada.</p>
        <Link href="/intranet" className="text-sm text-blue-500 hover:underline">
          Volver a Intranet
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={page.titulo}>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/intranet">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Link>
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <Badge variant="outline">{page.categoria}</Badge>

      <article className="prose prose-sm dark:prose-invert max-w-none rounded-lg border p-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.contenido}</ReactMarkdown>
      </article>

      {isAdmin && (
        <FormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          title="Editar Pagina"
          description="Modifique el contenido de la pagina"
        >
          <WikiForm
            defaultValues={{
              titulo: page.titulo,
              slug: page.slug,
              contenido: page.contenido,
              categoria: page.categoria,
              orden: page.orden ?? 0,
              activo: page.activo ?? true,
            }}
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
          />
        </FormDialog>
      )}
    </div>
  );
}
