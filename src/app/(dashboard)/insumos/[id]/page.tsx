'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

import { useInsumo, useUpdateInsumo, useDeleteInsumo } from '@/lib/hooks/use-insumos';
import { formatDate, formatDateTime } from '@/lib/utils/format';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { InsumoForm } from '@/components/forms/insumo-form';
import type { CreateInsumoInput } from '@/lib/validations/insumo';

export default function InsumoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useInsumo(id);
  const updateMutation = useUpdateInsumo();
  const deleteMutation = useDeleteInsumo();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/insumos')}>
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <p className="text-muted-foreground">Insumo no encontrado.</p>
      </div>
    );
  }

  const isBelowMin = data.stockTotal < (data.cantidadMin ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/insumos')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.nombre}</h1>
          <p className="text-muted-foreground">{data.tipoInsumo}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> Editar
        </Button>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="size-4" /> Eliminar
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* General */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nombre</span>
              <span className="text-sm font-medium">{data.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tipo</span>
              <span className="text-sm font-medium">{data.tipoInsumo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Serial</span>
              <span className="text-sm font-medium">{data.serialInsumo || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compra */}
        <Card>
          <CardHeader>
            <CardTitle>Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Orden de Compra</span>
              <span className="text-sm font-medium">{data.ordenCompra || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fecha de Compra</span>
              <span className="text-sm font-medium">{formatDate(data.fechaCompra)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Area de Compra</span>
              <span className="text-sm font-medium">{data.areaCompra || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cantidad Minima</span>
              <span className="text-sm font-medium">{data.cantidadMin ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Stock Total</span>
              <Badge variant={isBelowMin ? 'destructive' : 'secondary'}>
                {data.stockTotal}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Entries Table */}
      {data.stockEntries && data.stockEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stock por Sitio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sitio</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Ultima actualizacion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.stockEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {(entry as unknown as { sitio?: { nombre: string } }).sitio?.nombre ?? entry.sitioId}
                      </TableCell>
                      <TableCell>{entry.cantidad}</TableCell>
                      <TableCell>{formatDateTime(entry.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar Insumo"
        description="Modifique los datos del insumo."
      >
        <InsumoForm
          defaultValues={data as unknown as Partial<CreateInsumoInput>}
          onSubmit={(formData: CreateInsumoInput) => {
            updateMutation.mutate(
              { id: data.id, data: formData as unknown as Record<string, unknown> },
              { onSuccess: () => setEditOpen(false) }
            );
          }}
          isLoading={updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Insumo"
        description={`¿Está seguro de que desea eliminar el insumo "${data.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteMutation.mutate(data.id, {
            onSuccess: () => router.push('/insumos'),
          });
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
