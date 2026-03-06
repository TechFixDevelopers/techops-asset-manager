'use client';

import { useState, useCallback } from 'react';
import { Plus, FileDown } from 'lucide-react';

import { useCortes, useCreateCorte } from '@/lib/hooks/use-cortes';
import { useSitios } from '@/lib/hooks/use-catalogos';

import { exportToExcel } from '@/lib/utils/excel-export';
import { ExportButton } from '@/components/shared/export-button';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { FormDialog } from '@/components/shared/form-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cortesColumns } from '@/components/tables/columns/cortes-columns';

export default function CortesPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [sitioFilter, setSitioFilter] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  // Form state for new corte
  const [formSitioId, setFormSitioId] = useState('');
  const [formFechaCorte, setFormFechaCorte] = useState('');

  const { data: sitiosData } = useSitios();

  const { data, isLoading } = useCortes({
    page,
    pageSize,
    sortBy,
    sortOrder,
    sitioId: sitioFilter || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  const createMutation = useCreateCorte();

  const handleCreate = useCallback(() => {
    if (!formSitioId) return;
    createMutation.mutate(
      {
        sitioId: formSitioId,
        fechaCorte: formFechaCorte || undefined,
      },
      {
        onSuccess: () => {
          setFormOpen(false);
          setFormSitioId('');
          setFormFechaCorte('');
        },
      },
    );
  }, [createMutation, formSitioId, formFechaCorte]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cortes de Stock"
        description="Snapshots de inventario fisico por sitio"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const params = new URLSearchParams();
                if (sitioFilter) params.set('sitioId', sitioFilter);
                if (desde) params.set('desde', desde);
                if (hasta) params.set('hasta', hasta);
                const res = await fetch(`/api/export/corte-stock?${params}`);
                if (!res.ok) throw new Error('Error al exportar');
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Corte_Stock_${new Date().toISOString().split('T')[0]}.xlsx`;
                a.click();
                URL.revokeObjectURL(url);
              } catch {
                // toast handled by global error
              }
            }}
          >
            <FileDown className="mr-2 h-4 w-4" /> Exportar Movimientos
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Corte
          </Button>
        </div>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={sitioFilter}
          onValueChange={(value) => {
            setSitioFilter(value === '__all__' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Filtrar por sitio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los sitios</SelectItem>
            {sitiosData?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <label htmlFor="desde" className="text-sm text-muted-foreground">
            Desde
          </label>
          <Input
            id="desde"
            type="date"
            value={desde}
            onChange={(e) => {
              setDesde(e.target.value);
              setPage(1);
            }}
            className="w-[160px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="hasta" className="text-sm text-muted-foreground">
            Hasta
          </label>
          <Input
            id="hasta"
            type="date"
            value={hasta}
            onChange={(e) => {
              setHasta(e.target.value);
              setPage(1);
            }}
            className="w-[160px]"
          />
        </div>
      </div>

      <DataTable
        columns={cortesColumns}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onSortChange={(sorting) => {
          if (sorting.length > 0) {
            setSortBy(sorting[0].id);
            setSortOrder(sorting[0].desc ? 'desc' : 'asc');
          } else {
            setSortBy('');
            setSortOrder('');
          }
        }}
        isLoading={isLoading}
        searchPlaceholder="Buscar cortes..."
        toolbarActions={
          <ExportButton
            onExport={() => {
              const rows = (data?.data ?? []).map((c) => [
                formatDate(c.fechaCorte),
                c.sitioNombre || '',
                c.generadoPorNombre || '',
                c.reconciliado ? 'Si' : 'Pendiente',
                c.equiposCount,
                c.celularesCount,
                c.insumosCount,
                c.lineasCount,
                formatDateTime(c.createdAt) || '',
              ]);
              exportToExcel({
                filename: 'cortes-de-stock',
                sheets: [
                  {
                    name: 'Cortes de Stock',
                    headers: [
                      'Fecha',
                      'Sitio',
                      'Generado Por',
                      'Reconciliado',
                      'Equipos',
                      'Celulares',
                      'Insumos',
                      'Lineas',
                      'Creado',
                    ],
                    rows,
                  },
                ],
              });
            }}
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setFormSitioId('');
            setFormFechaCorte('');
          }
        }}
        title="Nuevo Corte de Stock"
        description="Genere un snapshot del inventario fisico para un sitio"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="corte-sitio">Sitio *</Label>
            <Select value={formSitioId} onValueChange={setFormSitioId}>
              <SelectTrigger id="corte-sitio">
                <SelectValue placeholder="Seleccione un sitio" />
              </SelectTrigger>
              <SelectContent>
                {sitiosData?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="corte-fecha">Fecha de corte (opcional)</Label>
            <Input
              id="corte-fecha"
              type="date"
              value={formFechaCorte}
              onChange={(e) => setFormFechaCorte(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Si no se especifica, se usa la fecha de hoy.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormOpen(false);
                setFormSitioId('');
                setFormFechaCorte('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formSitioId || createMutation.isPending}
            >
              {createMutation.isPending ? 'Generando...' : 'Generar Corte'}
            </Button>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}
