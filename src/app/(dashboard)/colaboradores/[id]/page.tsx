'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { useColaborador } from '@/lib/hooks/use-colaboradores';
import { formatDate } from '@/lib/utils/format';

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
    monitores?: Array<{ id: string; serialNumber: string; marca: string; modelo: string }>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title={colaborador.nombre}>
        <div className="flex items-center gap-2">
          <StatusBadge status={colaborador.status || 'Active'} />
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
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
            <CardContent className="pt-6">
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
            <CardContent className="pt-6">
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
            <CardContent className="pt-6">
              {colaborador.monitores && colaborador.monitores.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
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
    </div>
  );
}
