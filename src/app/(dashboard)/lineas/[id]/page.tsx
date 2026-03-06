'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

import { useLinea, useUpdateLinea, useDeleteLinea } from '@/lib/hooks/use-lineas';
import { formatDateTime } from '@/lib/utils/format';

import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LineaForm } from '@/components/forms/linea-form';
import { Button } from '@/components/ui/button';
import type { CreateLineaInput } from '@/lib/validations/linea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '-'}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex justify-between py-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function LineaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useLinea(params.id);
  const updateMutation = useUpdateLinea();
  const deleteMutation = useDeleteLinea();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Línea no encontrada">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </PageHeader>
        <p className="text-muted-foreground">
          No se encontró la línea solicitada.
        </p>
      </div>
    );
  }

  const linea = data;

  return (
    <div className="space-y-6">
      <PageHeader title={linea.numero}>
        <div className="flex items-center gap-2">
          <StatusBadge status={linea.estado ?? 'ACTIVA'} />
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" /> Eliminar
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion de la Linea */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Línea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow
              label="Número"
              value={<span className="font-mono">{linea.numero}</span>}
            />
            <DetailRow label="Tipo de Línea" value={linea.tipoLinea} />
            <DetailRow label="Proveedor" value={linea.proveedor} />
            <DetailRow label="Plan" value={linea.plan} />
            <DetailRow label="Sitio" value={linea.sitio?.nombre} />
            <DetailRow
              label="Estado"
              value={<StatusBadge status={linea.estado ?? 'ACTIVA'} />}
            />
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Comentarios" value={linea.comentarios} />
            <DetailRow label="Creado" value={formatDateTime(linea.createdAt)} />
            <DetailRow label="Actualizado" value={formatDateTime(linea.updatedAt)} />
          </CardContent>
        </Card>
      </div>

      {/* Celulares vinculados */}
      {linea.celulares && linea.celulares.length > 0 && (
        <Tabs defaultValue="celulares">
          <TabsList>
            <TabsTrigger value="celulares">
              Celulares Asignados ({linea.celulares.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="celulares">
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">IMEI</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 pr-4">Marca</th>
                        <th className="pb-2 pr-4">Modelo</th>
                        <th className="pb-2 pr-4">Estado</th>
                        <th className="pb-2 pr-4">Colaborador</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linea.celulares.map((cel: Record<string, unknown>) => (
                        <tr
                          key={cel.id as string}
                          className="cursor-pointer border-b hover:bg-muted/50"
                          onClick={() => router.push(`/celulares/${cel.id}`)}
                        >
                          <td className="py-2 pr-4 font-mono">{cel.imei as string}</td>
                          <td className="py-2 pr-4">{cel.tipo as string}</td>
                          <td className="py-2 pr-4">{cel.marca as string}</td>
                          <td className="py-2 pr-4">{cel.modelo as string}</td>
                          <td className="py-2 pr-4">
                            <StatusBadge status={(cel.estado as string) ?? 'STOCK'} />
                          </td>
                          <td className="py-2 pr-4">
                            {(cel.colaborador as Record<string, unknown>)?.nombre as string ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar Línea"
        description="Modifique los datos de la línea."
      >
        <LineaForm
          defaultValues={linea as unknown as Record<string, unknown>}
          onSubmit={(formData: CreateLineaInput) => {
            updateMutation.mutate(
              { id: linea.id, data: formData as unknown as Record<string, unknown> },
              { onSuccess: () => setEditOpen(false) }
            );
          }}
          isLoading={updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Línea"
        description={`¿Está seguro de que desea eliminar la línea ${linea.numero}? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteMutation.mutate(linea.id, {
            onSuccess: () => router.push('/lineas'),
          });
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
