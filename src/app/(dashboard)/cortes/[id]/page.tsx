'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import { useCorte, useReconciliarCorte } from '@/lib/hooks/use-cortes';
import { formatDate, formatDateTime } from '@/lib/utils/format';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

import type {
  EquipoSnapshot,
  CelularSnapshot,
  InsumoSnapshot,
  LineaSnapshot,
  DiferenciasData,
} from '@/lib/services/cortes';

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

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
        {Array.from({ length: 4 }).map((_, i) => (
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

// ------------------------------------------------------------------
// Diferencias Section
// ------------------------------------------------------------------

function DiferenciasSection({ diferencias }: { diferencias: DiferenciasData }) {
  const hasEquiposDiff =
    diferencias.equipos.added.length > 0 ||
    diferencias.equipos.removed.length > 0 ||
    diferencias.equipos.changed.length > 0;

  const hasCelularesDiff =
    diferencias.celulares.added.length > 0 ||
    diferencias.celulares.removed.length > 0 ||
    diferencias.celulares.changed.length > 0;

  const hasInsumosDiff = diferencias.insumos.changed.length > 0;

  const hasLineasDiff =
    diferencias.lineas.added.length > 0 ||
    diferencias.lineas.removed.length > 0;

  const noDiffs = !hasEquiposDiff && !hasCelularesDiff && !hasInsumosDiff && !hasLineasDiff;

  if (noDiffs) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No se encontraron diferencias entre el snapshot y el estado actual.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hasEquiposDiff && (
        <Card>
          <CardHeader>
            <CardTitle>Diferencias en Equipos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diferencias.equipos.added.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-2">
                  Agregados ({diferencias.equipos.added.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.equipos.added.map((e) => (
                      <TableRow key={e.id} className="bg-green-50 dark:bg-green-950/20">
                        <TableCell>{e.serialNumber}</TableCell>
                        <TableCell>{e.tipo}</TableCell>
                        <TableCell>{e.marca} {e.modelo}</TableCell>
                        <TableCell>{e.estado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {diferencias.equipos.removed.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">
                  Removidos ({diferencias.equipos.removed.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.equipos.removed.map((e) => (
                      <TableRow key={e.id} className="bg-red-50 dark:bg-red-950/20">
                        <TableCell>{e.serialNumber}</TableCell>
                        <TableCell>{e.tipo}</TableCell>
                        <TableCell>{e.marca} {e.modelo}</TableCell>
                        <TableCell>{e.estado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {diferencias.equipos.changed.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-600 mb-2">
                  Cambios de estado ({diferencias.equipos.changed.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado anterior</TableHead>
                      <TableHead>Estado actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.equipos.changed.map((c) => (
                      <TableRow key={c.before.id} className="bg-yellow-50 dark:bg-yellow-950/20">
                        <TableCell>{c.before.serialNumber}</TableCell>
                        <TableCell>{c.before.tipo}</TableCell>
                        <TableCell>{c.before.estado}</TableCell>
                        <TableCell>{c.after.estado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasCelularesDiff && (
        <Card>
          <CardHeader>
            <CardTitle>Diferencias en Celulares</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diferencias.celulares.added.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-2">
                  Agregados ({diferencias.celulares.added.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.celulares.added.map((c) => (
                      <TableRow key={c.id} className="bg-green-50 dark:bg-green-950/20">
                        <TableCell>{c.imei}</TableCell>
                        <TableCell>{c.tipo}</TableCell>
                        <TableCell>{c.marca} {c.modelo}</TableCell>
                        <TableCell>{c.estado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {diferencias.celulares.removed.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">
                  Removidos ({diferencias.celulares.removed.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.celulares.removed.map((c) => (
                      <TableRow key={c.id} className="bg-red-50 dark:bg-red-950/20">
                        <TableCell>{c.imei}</TableCell>
                        <TableCell>{c.tipo}</TableCell>
                        <TableCell>{c.marca} {c.modelo}</TableCell>
                        <TableCell>{c.estado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {diferencias.celulares.changed.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-yellow-600 mb-2">
                  Cambios de estado ({diferencias.celulares.changed.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado anterior</TableHead>
                      <TableHead>Estado actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.celulares.changed.map((c) => (
                      <TableRow key={c.before.id} className="bg-yellow-50 dark:bg-yellow-950/20">
                        <TableCell>{c.before.imei}</TableCell>
                        <TableCell>{c.before.tipo}</TableCell>
                        <TableCell>{c.before.estado}</TableCell>
                        <TableCell>{c.after.estado}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {hasInsumosDiff && (
        <Card>
          <CardHeader>
            <CardTitle>Diferencias en Insumos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad anterior</TableHead>
                  <TableHead>Cantidad actual</TableHead>
                  <TableHead>Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diferencias.insumos.changed.map((c) => {
                  const diff = (c.after.cantidad ?? 0) - (c.before.cantidad ?? 0);
                  return (
                    <TableRow key={c.before.insumoId} className="bg-yellow-50 dark:bg-yellow-950/20">
                      <TableCell>{c.before.nombre}</TableCell>
                      <TableCell>{c.before.tipoInsumo}</TableCell>
                      <TableCell>{c.before.cantidad ?? 0}</TableCell>
                      <TableCell>{c.after.cantidad ?? 0}</TableCell>
                      <TableCell className={diff > 0 ? 'text-green-600' : 'text-red-600'}>
                        {diff > 0 ? `+${diff}` : diff}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {hasLineasDiff && (
        <Card>
          <CardHeader>
            <CardTitle>Diferencias en Lineas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {diferencias.lineas.added.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-2">
                  Agregadas ({diferencias.lineas.added.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.lineas.added.map((l) => (
                      <TableRow key={l.id} className="bg-green-50 dark:bg-green-950/20">
                        <TableCell>{l.numero}</TableCell>
                        <TableCell>{l.tipoLinea || '-'}</TableCell>
                        <TableCell>{l.estado || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {diferencias.lineas.removed.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">
                  Removidas ({diferencias.lineas.removed.length})
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diferencias.lineas.removed.map((l) => (
                      <TableRow key={l.id} className="bg-red-50 dark:bg-red-950/20">
                        <TableCell>{l.numero}</TableCell>
                        <TableCell>{l.tipoLinea || '-'}</TableCell>
                        <TableCell>{l.estado || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Page Component
// ------------------------------------------------------------------

export default function CorteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useCorte(params.id);
  const reconciliar = useReconciliarCorte();

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Corte no encontrado">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </PageHeader>
        <p className="text-muted-foreground">
          No se encontro el corte de stock solicitado.
        </p>
      </div>
    );
  }

  const equiposData = (data.equiposData as EquipoSnapshot[]) || [];
  const celularesData = (data.celularesData as CelularSnapshot[]) || [];
  const insumosData = (data.insumosData as InsumoSnapshot[]) || [];
  const lineasData = (data.lineasData as LineaSnapshot[]) || [];
  const diferencias = data.diferencias as DiferenciasData | null;

  return (
    <div className="space-y-6">
      <PageHeader title={`Corte de Stock - ${formatDate(data.fechaCorte)}`}>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              data.reconciliado
                ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            }
          >
            {data.reconciliado ? 'Reconciliado' : 'Pendiente'}
          </Badge>
          {!data.reconciliado && (
            <Button
              onClick={() => reconciliar.mutate(data.id)}
              disabled={reconciliar.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${reconciliar.isPending ? 'animate-spin' : ''}`} />
              {reconciliar.isPending ? 'Reconciliando...' : 'Reconciliar'}
            </Button>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="size-4" /> Volver
          </Button>
        </div>
      </PageHeader>

      {/* Info cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informacion General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Fecha de Corte" value={formatDate(data.fechaCorte)} />
            <DetailRow label="Sitio" value={data.sitioNombre} />
            <DetailRow label="Generado Por" value={data.generadoPorNombre} />
            <DetailRow label="Creado" value={formatDateTime(data.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <DetailRow label="Equipos" value={equiposData.length.toString()} />
            <DetailRow label="Celulares" value={celularesData.length.toString()} />
            <DetailRow label="Insumos" value={insumosData.length.toString()} />
            <DetailRow label="Lineas" value={lineasData.length.toString()} />
          </CardContent>
        </Card>
      </div>

      {/* Snapshot tabs */}
      <Tabs defaultValue="equipos">
        <TabsList>
          <TabsTrigger value="equipos">
            Equipos ({equiposData.length})
          </TabsTrigger>
          <TabsTrigger value="celulares">
            Celulares ({celularesData.length})
          </TabsTrigger>
          <TabsTrigger value="insumos">
            Insumos ({insumosData.length})
          </TabsTrigger>
          <TabsTrigger value="lineas">
            Lineas ({lineasData.length})
          </TabsTrigger>
          {data.reconciliado && diferencias && (
            <TabsTrigger value="diferencias">
              Diferencias
            </TabsTrigger>
          )}
        </TabsList>

        {/* Equipos tab */}
        <TabsContent value="equipos">
          <Card>
            <CardHeader>
              <CardTitle>Equipos al momento del corte</CardTitle>
            </CardHeader>
            <CardContent>
              {equiposData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Colaborador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equiposData.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.serialNumber}</TableCell>
                        <TableCell>{e.hostname || '-'}</TableCell>
                        <TableCell>{e.tipo}</TableCell>
                        <TableCell>{e.marca}</TableCell>
                        <TableCell>{e.modelo}</TableCell>
                        <TableCell>{e.estado}</TableCell>
                        <TableCell>{e.colaboradorNombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay equipos registrados en este sitio al momento del corte.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Celulares tab */}
        <TabsContent value="celulares">
          <Card>
            <CardHeader>
              <CardTitle>Celulares al momento del corte</CardTitle>
            </CardHeader>
            <CardContent>
              {celularesData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Colaborador</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {celularesData.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.imei}</TableCell>
                        <TableCell>{c.tipo}</TableCell>
                        <TableCell>{c.marca}</TableCell>
                        <TableCell>{c.modelo}</TableCell>
                        <TableCell>{c.estado}</TableCell>
                        <TableCell>{c.colaboradorNombre || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay celulares registrados en este sitio al momento del corte.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insumos tab */}
        <TabsContent value="insumos">
          <Card>
            <CardHeader>
              <CardTitle>Insumos al momento del corte</CardTitle>
            </CardHeader>
            <CardContent>
              {insumosData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo de Insumo</TableHead>
                      <TableHead>Cantidad</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insumosData.map((i) => (
                      <TableRow key={i.insumoId}>
                        <TableCell className="font-medium">{i.nombre}</TableCell>
                        <TableCell>{i.tipoInsumo}</TableCell>
                        <TableCell>{i.cantidad ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay insumos registrados en este sitio al momento del corte.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lineas tab */}
        <TabsContent value="lineas">
          <Card>
            <CardHeader>
              <CardTitle>Lineas al momento del corte</CardTitle>
            </CardHeader>
            <CardContent>
              {lineasData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numero</TableHead>
                      <TableHead>Tipo de Linea</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineasData.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.numero}</TableCell>
                        <TableCell>{l.tipoLinea || '-'}</TableCell>
                        <TableCell>{l.estado || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No hay lineas registradas en este sitio al momento del corte.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diferencias tab */}
        {data.reconciliado && diferencias && (
          <TabsContent value="diferencias">
            <DiferenciasSection diferencias={diferencias} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
