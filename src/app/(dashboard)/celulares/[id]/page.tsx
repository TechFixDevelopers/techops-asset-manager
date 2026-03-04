'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FormDialog } from '@/components/shared/form-dialog';
import { MovimientoForm } from '@/components/forms/movimiento-form';
import { useCelular } from '@/lib/hooks/use-celulares';
import { useCreateMovimiento } from '@/lib/hooks/use-movimientos';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import type { CreateMovimientoInput } from '@/lib/validations/movimiento';

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? '-'}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
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

export default function CelularDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading } = useCelular(id);
  const createMovimiento = useCreateMovimiento();
  const [movFormOpen, setMovFormOpen] = useState(false);

  const celular = data as typeof data & { movimientos?: Movimiento[] };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!celular) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push('/celulares')}>
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <p className="text-muted-foreground">Celular no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/celulares')}>
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {celular.marca} {celular.modelo}
        </h1>
        <StatusBadge status={celular.estado || '-'} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Identificacion */}
        <Card>
          <CardHeader>
            <CardTitle>Identificacion</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="IMEI" value={celular.imei} />
            <DetailRow label="Tipo" value={celular.tipo} />
            <DetailRow label="Marca" value={celular.marca} />
            <DetailRow label="Modelo" value={celular.modelo} />
          </CardContent>
        </Card>

        {/* Detalles */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Proveedor" value={celular.proveedor} />
            <DetailRow label="Plan" value={celular.plan} />
            <DetailRow label="Condicion" value={celular.condicion} />
            <DetailRow
              label="Posee cargador"
              value={celular.poseeCargador ? 'Si' : 'No'}
            />
            <DetailRow label="Dias de garantia" value={celular.diasGarantia} />
            <DetailRow label="Fecha de compra" value={formatDate(celular.fechaCompra)} />
          </CardContent>
        </Card>

        {/* Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Estado" value={<StatusBadge status={celular.estado || '-'} />} />
            <DetailRow
              label="Estado secundario"
              value={celular.estadoSecundario ? <StatusBadge status={celular.estadoSecundario} /> : '-'}
            />
            <DetailRow
              label="Obsoleto"
              value={
                celular.obsoleto ? (
                  <Badge variant="destructive">Si</Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )
              }
            />
          </CardContent>
        </Card>

        {/* Asignacion */}
        <Card>
          <CardHeader>
            <CardTitle>Asignacion</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow
              label="Empresa"
              value={celular.empresa?.nombre}
            />
            <DetailRow
              label="Colaborador"
              value={celular.colaborador?.nombre}
            />
            <DetailRow
              label="Linea"
              value={celular.linea?.numero}
            />
            <DetailRow
              label="Sitio"
              value={celular.sitio?.nombre}
            />
            <DetailRow label="Principal / Secundaria" value={celular.principalSecundaria} />
            <DetailRow label="Motivo de asignacion" value={celular.motivoAsignacion} />
            <DetailRow label="Fecha de asignacion" value={formatDate(celular.fechaAsignacion)} />
          </CardContent>
        </Card>

        {/* Notas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {celular.comentarios || 'Sin comentarios.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Movimientos Tab */}
      <Tabs defaultValue="movimientos">
        <TabsList>
          <TabsTrigger value="movimientos">
            Movimientos ({celular.movimientos?.length ?? 0})
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
              {celular.movimientos && celular.movimientos.length > 0 ? (
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
                    {celular.movimientos.slice(0, 20).map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell><StatusBadge status={mov.tipo} /></TableCell>
                        <TableCell>{formatDateTime(mov.createdAt)}</TableCell>
                        <TableCell>{mov.motivo || '-'}</TableCell>
                        <TableCell>{mov.colaborador?.nombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay movimientos registrados para este celular.
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
        description={`Registrar movimiento para celular ${celular.imei}`}
      >
        <MovimientoForm
          defaultCelularId={celular.id}
          defaultTipo={celular.estado === 'ACTIVO' ? 'DEVOLUCION_CEL' : 'ASIGNACION_CEL'}
          onSubmit={(formData: CreateMovimientoInput) => {
            createMovimiento.mutate(formData as Record<string, unknown>, {
              onSuccess: () => setMovFormOpen(false),
            });
          }}
          isLoading={createMovimiento.isPending}
        />
      </FormDialog>
    </div>
  );
}
