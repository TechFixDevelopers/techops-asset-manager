'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

import { useColaborador, useUpdateColaborador, useDeleteColaborador } from '@/lib/hooks/use-colaboradores';
import { formatDate } from '@/lib/utils/format';

import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ColaboradorForm } from '@/components/forms/colaborador-form';
import { Button } from '@/components/ui/button';
import type { CreateColaboradorInput } from '@/lib/validations/colaborador';
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

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
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
        {Array.from({ length: 4 }).map((_, i) => (
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

export default function ColaboradorDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useColaborador(params.id);
  const updateMutation = useUpdateColaborador();
  const deleteMutation = useDeleteColaborador();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Colaborador no encontrado">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </PageHeader>
        <p className="text-muted-foreground">
          No se encontro el colaborador solicitado.
        </p>
      </div>
    );
  }

  // Type assertion for related data that may come from the API
  const colaborador = data as typeof data & {
    equipos?: Array<{ id: string; serialNumber: string; hostname: string | null; tipo: string; marca: string; modelo: string; estado: string }>;
    celulares?: Array<{ id: string; imei: string; tipo: string; marca: string; modelo: string; estado: string }>;
    monitores?: Array<{ id: string; serialNumber: string; marca: string; modelo: string; pulgadas: string | null }>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title={colaborador.nombre}>
        <div className="flex items-center gap-2">
          <StatusBadge status={colaborador.status || 'Active'} />
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
        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion Personal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Global ID" value={colaborador.globalId} />
            <DetailRow label="Legajo" value={colaborador.legajo} />
            <DetailRow label="Nombre" value={colaborador.nombre} />
            <DetailRow label="Email" value={colaborador.email} />
          </CardContent>
        </Card>

        {/* Organizacional */}
        <Card>
          <CardHeader>
            <CardTitle>Organizacional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Empresa" value={colaborador.empresa?.nombre} />
            <DetailRow label="Business Title" value={colaborador.businessTitle} />
            <DetailRow label="Band" value={colaborador.band} />
            <DetailRow label="Cost Center ID" value={colaborador.costCenterId} />
            <DetailRow label="Cost Center Desc." value={colaborador.costCenterDesc} />
          </CardContent>
        </Card>

        {/* Posicion */}
        <Card>
          <CardHeader>
            <CardTitle>Posicion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Position ID" value={colaborador.positionId} />
            <DetailRow label="Position Name" value={colaborador.positionName} />
            <DetailRow label="Manager Name" value={colaborador.managerName} />
            <DetailRow label="Manager ID" value={colaborador.managerId} />
          </CardContent>
        </Card>

        {/* Ubicacion */}
        <Card>
          <CardHeader>
            <CardTitle>Ubicacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Sitio" value={colaborador.sitio?.nombre} />
            <DetailRow label="Area" value={colaborador.area} />
            <DetailRow label="Sub Area" value={colaborador.subArea} />
            <DetailRow label="Pais" value={colaborador.pais} />
            <DetailRow label="Regional" value={colaborador.regional} />
          </CardContent>
        </Card>

        {/* HR */}
        <Card>
          <CardHeader>
            <CardTitle>HR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Fecha de Ingreso" value={formatDate(colaborador.hireDate)} />
            <DetailRow label="Estado" value={colaborador.status} />
            <DetailRow label="Collar" value={colaborador.collar} />
            <DetailRow label="HRBP" value={colaborador.hrbp} />
          </CardContent>
        </Card>
      </div>

      {/* Assigned Assets Tabs */}
      <Tabs defaultValue="equipos">
        <TabsList>
          <TabsTrigger value="equipos">
            Equipos ({colaborador.equipos?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="celulares">
            Celulares ({colaborador.celulares?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="monitores">
            Monitores ({colaborador.monitores?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipos">
          <Card>
            <CardHeader>
              <CardTitle>Equipos Asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {colaborador.equipos && colaborador.equipos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaborador.equipos.map((equipo) => (
                      <TableRow
                        key={equipo.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/equipos/${equipo.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {equipo.serialNumber}
                        </TableCell>
                        <TableCell>{equipo.hostname || '-'}</TableCell>
                        <TableCell>{equipo.tipo}</TableCell>
                        <TableCell>{equipo.marca}</TableCell>
                        <TableCell>{equipo.modelo}</TableCell>
                        <TableCell>
                          <StatusBadge status={equipo.estado} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No tiene equipos asignados.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="celulares">
          <Card>
            <CardHeader>
              <CardTitle>Celulares Asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {colaborador.celulares && colaborador.celulares.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaborador.celulares.map((celular) => (
                      <TableRow key={celular.id}>
                        <TableCell className="font-mono text-sm">
                          {celular.imei}
                        </TableCell>
                        <TableCell>{celular.tipo}</TableCell>
                        <TableCell>{celular.marca}</TableCell>
                        <TableCell>{celular.modelo}</TableCell>
                        <TableCell>
                          <StatusBadge status={celular.estado} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No tiene celulares asignados.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitores">
          <Card>
            <CardHeader>
              <CardTitle>Monitores Asignados</CardTitle>
            </CardHeader>
            <CardContent>
              {colaborador.monitores && colaborador.monitores.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Pulgadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaborador.monitores.map((monitor) => (
                      <TableRow key={monitor.id}>
                        <TableCell className="font-mono text-sm">
                          {monitor.serialNumber}
                        </TableCell>
                        <TableCell>{monitor.marca}</TableCell>
                        <TableCell>{monitor.modelo}</TableCell>
                        <TableCell>{monitor.pulgadas || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No tiene monitores asignados.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Editar Colaborador"
        description="Modifique los datos del colaborador."
      >
        <ColaboradorForm
          defaultValues={colaborador as unknown as Record<string, unknown>}
          onSubmit={(formData: CreateColaboradorInput) => {
            updateMutation.mutate(
              { id: colaborador.id, data: formData as unknown as Record<string, unknown> },
              { onSuccess: () => setEditOpen(false) }
            );
          }}
          isLoading={updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Colaborador"
        description={`¿Está seguro de que desea eliminar al colaborador ${colaborador.nombre}? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          deleteMutation.mutate(colaborador.id, {
            onSuccess: () => router.push('/colaboradores'),
          });
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
