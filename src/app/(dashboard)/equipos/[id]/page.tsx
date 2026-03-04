'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';

import { useEquipo, useUpdateEquipo, useDeleteEquipo } from '@/lib/hooks/use-equipos';
import { formatDate, formatDateTime } from '@/lib/utils/format';

import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EquipoForm } from '@/components/forms/equipo-form';
import { MovimientoForm } from '@/components/forms/movimiento-form';
import { useCreateMovimiento } from '@/lib/hooks/use-movimientos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CreateMovimientoInput } from '@/lib/validations/movimiento';
import type { CreateEquipoInput } from '@/lib/validations/equipo';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
        {Array.from({ length: 6 }).map((_, i) => (
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

interface Movimiento {
  id: string;
  tipo: string;
  motivo: string | null;
  createdAt: string | null;
  colaborador?: { nombre: string } | null;
}

export default function EquipoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useEquipo(params.id);
  const createMovimiento = useCreateMovimiento();
  const updateMutation = useUpdateEquipo();
  const deleteMutation = useDeleteEquipo();
  const [movFormOpen, setMovFormOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Equipo no encontrado">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </PageHeader>
        <p className="text-muted-foreground">
          No se encontro el equipo solicitado.
        </p>
      </div>
    );
  }

  // Type assertion for related data that may come from the API
  const equipo = data as typeof data & {
    movimientos?: Movimiento[];
  };

  return (
    <div className="space-y-6">
      <PageHeader title={`${equipo.serialNumber}`}>
        <div className="flex items-center gap-2">
          <StatusBadge status={equipo.estado} />
          {equipo.estadoSecundario && (
            <StatusBadge status={equipo.estadoSecundario} />
          )}
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
        {/* Identificacion */}
        <Card>
          <CardHeader>
            <CardTitle>Identificacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Serial Number" value={equipo.serialNumber} />
            <DetailRow label="Hostname" value={equipo.hostname} />
            <DetailRow label="Tipo" value={equipo.tipo} />
            <DetailRow label="Marca" value={equipo.marca} />
            <DetailRow label="Modelo" value={equipo.modelo} />
          </CardContent>
        </Card>

        {/* Especificaciones */}
        <Card>
          <CardHeader>
            <CardTitle>Especificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Procesador" value={equipo.procesador} />
            <DetailRow label="Memoria" value={equipo.memoria} />
            <DetailRow label="Tipo Disco" value={equipo.tipoDisco} />
            <DetailRow label="Tamano Disco" value={equipo.tamanoDisco} />
            <DetailRow label="Sistema Operativo" value={equipo.sistemaOperativo} />
            <DetailRow
              label="Red"
              value={equipo.red ? 'Si' : 'No'}
            />
          </CardContent>
        </Card>

        {/* Compra */}
        <Card>
          <CardHeader>
            <CardTitle>Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Comprado Por" value={equipo.compradoPor} />
            <DetailRow label="Orden de Compra" value={equipo.ordenCompra} />
            <DetailRow label="Fecha de Compra" value={formatDate(equipo.fechaCompra)} />
            <DetailRow
              label="Dias de Garantia"
              value={equipo.diasGarantia?.toString()}
            />
            <DetailRow label="Venc. Garantia" value={formatDate(equipo.vencGarantia)} />
          </CardContent>
        </Card>

        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow
              label="Estado"
              value={<StatusBadge status={equipo.estado} />}
            />
            <DetailRow
              label="Estado Secundario"
              value={
                equipo.estadoSecundario ? (
                  <StatusBadge status={equipo.estadoSecundario} />
                ) : (
                  '-'
                )
              }
            />
            <DetailRow
              label="Obsoleto"
              value={
                <Badge variant={equipo.obsoleto ? 'destructive' : 'secondary'}>
                  {equipo.obsoleto ? 'Si' : 'No'}
                </Badge>
              }
            />
          </CardContent>
        </Card>

        {/* Asignacion */}
        <Card>
          <CardHeader>
            <CardTitle>Asignacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Empresa" value={equipo.empresa?.nombre} />
            <DetailRow
              label="Colaborador"
              value={equipo.colaborador?.nombre}
            />
            <DetailRow label="Sitio" value={equipo.sitio?.nombre} />
            <DetailRow label="Principal / Secundaria" value={equipo.principalSecundaria} />
            <DetailRow label="Motivo Asignacion" value={equipo.motivoAsignacion} />
            <DetailRow label="Fecha Asignacion" value={formatDate(equipo.fechaAsignacion)} />
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Comentarios" value={equipo.comentarios} />
            <DetailRow label="Creado" value={formatDateTime(equipo.createdAt)} />
            <DetailRow label="Actualizado" value={formatDateTime(equipo.updatedAt)} />
          </CardContent>
        </Card>
      </div>

      {/* Movimientos Tab */}
      <Tabs defaultValue="movimientos">
        <TabsList>
          <TabsTrigger value="movimientos">
            Movimientos ({equipo.movimientos?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movimientos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historial de Movimientos</CardTitle>
              <Button size="sm" onClick={() => setMovFormOpen(true)}>
                <Plus className="mr-1 h-4 w-4" /> Nuevo Movimiento
              </Button>
            </CardHeader>
            <CardContent>
              {equipo.movimientos && equipo.movimientos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Colaborador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipo.movimientos.slice(0, 20).map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          <StatusBadge status={mov.tipo} />
                        </TableCell>
                        <TableCell>{formatDateTime(mov.createdAt)}</TableCell>
                        <TableCell>{mov.motivo || '-'}</TableCell>
                        <TableCell>{mov.colaborador?.nombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay movimientos registrados para este equipo.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={movFormOpen}
        onOpenChange={setMovFormOpen}
        title="Nuevo Movimiento"
        description={`Registrar movimiento para equipo ${equipo.serialNumber}`}
      >
        <MovimientoForm
          defaultEquipoId={equipo.id}
          defaultTipo={equipo.estado === 'ACTIVO' ? 'DEVOLUCION_PC' : 'ASIGNACION_PC'}
          onSubmit={(formData: CreateMovimientoInput) => {
            createMovimiento.mutate(formData as Record<string, unknown>, {
              onSuccess: () => setMovFormOpen(false),
            });
          }}
          isLoading={createMovimiento.isPending}
        />
      </FormDialog>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar Equipo"
        description="Modifique los datos del equipo."
      >
        <EquipoForm
          defaultValues={equipo as unknown as Record<string, unknown>}
          onSubmit={(formData: CreateEquipoInput) => {
            updateMutation.mutate(
              { id: equipo.id, data: formData as unknown as Record<string, unknown> },
              { onSuccess: () => setEditOpen(false) }
            );
          }}
          isLoading={updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Equipo"
        description={`¿Está seguro de que desea eliminar el equipo ${equipo.serialNumber}? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteMutation.mutate(equipo.id, {
            onSuccess: () => router.push('/equipos'),
          });
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
