'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { useMovimiento } from '@/lib/hooks/use-movimientos';
import { formatDateTime } from '@/lib/utils/format';

import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
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

export default function MovimientoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useMovimiento(params.id);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Movimiento no encontrado">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </PageHeader>
        <p className="text-muted-foreground">
          No se encontro el movimiento solicitado.
        </p>
      </div>
    );
  }

  const movimiento = data;

  // Determine the referenced asset display
  const activoDisplay = (() => {
    if (movimiento.equipo) return `Equipo: ${movimiento.equipo.serialNumber}`;
    if (movimiento.celular) return `Celular: ${movimiento.celular.imei}`;
    if (movimiento.monitor) return `Monitor: ${movimiento.monitor.serialNumber}`;
    if (movimiento.insumo) {
      const cantStr = movimiento.cantidad ? ` (x${movimiento.cantidad})` : '';
      return `Insumo: ${movimiento.insumo.nombre}${cantStr}`;
    }
    if (movimiento.serialRef) return `Serial: ${movimiento.serialRef}`;
    if (movimiento.imeiRef) return `IMEI: ${movimiento.imeiRef}`;
    return null;
  })();

  return (
    <div className="space-y-6">
      <PageHeader title={`Movimiento - ${movimiento.tipo}`}>
        <div className="flex items-center gap-2">
          <StatusBadge status={movimiento.tipo} />
          <Button variant="outline" onClick={() => router.push('/movimientos')}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacion General */}
        <Card>
          <CardHeader>
            <CardTitle>Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow
              label="Tipo"
              value={<StatusBadge status={movimiento.tipo} />}
            />
            <DetailRow
              label="Fecha"
              value={formatDateTime(movimiento.createdAt)}
            />
            <DetailRow
              label="Operador"
              value={movimiento.operador?.nombre}
            />
            <DetailRow label="Motivo" value={movimiento.motivo} />
          </CardContent>
        </Card>

        {/* Activo Referenciado */}
        <Card>
          <CardHeader>
            <CardTitle>Activo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activoDisplay ? (
              <DetailRow label="Activo" value={activoDisplay} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                Sin activo referenciado
              </p>
            )}
            {movimiento.cantidad && (
              <DetailRow
                label="Cantidad"
                value={movimiento.cantidad.toString()}
              />
            )}
            {movimiento.sitio && (
              <DetailRow label="Sitio" value={movimiento.sitio.nombre} />
            )}
          </CardContent>
        </Card>

        {/* Colaborador */}
        <Card>
          <CardHeader>
            <CardTitle>Colaborador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {movimiento.colaborador ? (
              <DetailRow
                label="Nombre"
                value={movimiento.colaborador.nombre}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                Sin colaborador
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cambio de Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Cambio de Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {movimiento.estadoAnterior || movimiento.estadoNuevo ? (
              <>
                {movimiento.estadoAnterior && (
                  <DetailRow
                    label="Estado Anterior"
                    value={<StatusBadge status={movimiento.estadoAnterior} />}
                  />
                )}
                {movimiento.estadoNuevo && (
                  <DetailRow
                    label="Estado Nuevo"
                    value={<StatusBadge status={movimiento.estadoNuevo} />}
                  />
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                Sin cambio de estado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Comentarios" value={movimiento.comentarios} />
          </CardContent>
        </Card>

        {/* ServiceNow */}
        <Card>
          <CardHeader>
            <CardTitle>ServiceNow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {movimiento.ticketSnow ? (
              <DetailRow label="Ticket INC" value={movimiento.ticketSnow} />
            ) : (
              <p className="text-sm text-muted-foreground py-2">
                Sin ticket
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
