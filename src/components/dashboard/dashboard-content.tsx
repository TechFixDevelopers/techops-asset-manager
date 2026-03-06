'use client';

import { Monitor, Smartphone, Package, ArrowLeftRight } from 'lucide-react';
import { useDashboardStats, useDashboardCharts, useDashboardActivity } from '@/lib/hooks/use-dashboard';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { ChartEquiposEstado } from '@/components/dashboard/chart-equipos-estado';
import { ChartCelularesEstado } from '@/components/dashboard/chart-celulares-estado';
import { ChartMovimientosTimeline } from '@/components/dashboard/chart-movimientos-timeline';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime } from '@/lib/utils/format';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function DashboardContent() {
  const { data, isLoading } = useDashboardStats();
  const { data: charts } = useDashboardCharts();
  const { data: activity } = useDashboardActivity();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Equipos"
          value={data.equipos.total}
          description={`${data.equipos.asignados} activos · ${data.equipos.enStock} en stock`}
          icon={Monitor}
        />
        <KpiCard
          title="Celulares"
          value={data.celulares.total}
          description={`${data.celulares.activos} activos · ${data.celulares.enStock} en stock`}
          icon={Smartphone}
        />
        <KpiCard
          title="Insumos Bajo Stock"
          value={data.insumos.bajoStock}
          description="Insumos por debajo del minimo"
          icon={Package}
        />
        <KpiCard
          title="Movimientos (30d)"
          value={data.movimientos.ultimoMes}
          description="Movimientos en ultimos 30 dias"
          icon={ArrowLeftRight}
        />
      </div>

      {/* Summary cards with more detail */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumen Equipos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-medium">{data.equipos.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Activos</span>
              <span className="font-medium">{data.equipos.asignados}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">En Stock</span>
              <span className="font-medium">{data.equipos.enStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Obsoletos</span>
              <span className="font-medium">{data.equipos.obsoletos}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resumen Celulares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-medium">{data.celulares.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Activos</span>
              <span className="font-medium">{data.celulares.activos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">En Stock</span>
              <span className="font-medium">{data.celulares.enStock}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Robados</span>
              <span className="font-medium">{data.celulares.robados}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {charts && (
        <div className="grid gap-4 md:grid-cols-2">
          <ChartEquiposEstado data={charts.equiposByEstado} />
          <ChartCelularesEstado data={charts.celularesByEstado} />
          <div className="md:col-span-2">
            <ChartMovimientosTimeline data={charts.movimientosPorDia} />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Ultimos Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {!activity || activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos recientes</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Sitio</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activity.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <StatusBadge status={item.tipo} />
                    </TableCell>
                    <TableCell>{item.colaboradorNombre ?? '-'}</TableCell>
                    <TableCell>{item.serialRef ?? item.imeiRef ?? '-'}</TableCell>
                    <TableCell>{item.sitioNombre ?? '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(item.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
