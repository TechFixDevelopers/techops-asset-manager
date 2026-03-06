'use client';

import { useState, useCallback } from 'react';
import { Plus, Ticket } from 'lucide-react';

import { useMovimientos, useCreateMovimiento } from '@/lib/hooks/use-movimientos';
import type { CreateMovimientoInput } from '@/lib/validations/movimiento';
import { TIPO_MOVIMIENTO } from '@/lib/utils/constants';

import { exportToExcel } from '@/lib/utils/excel-export';
import { ExportButton } from '@/components/shared/export-button';
import { formatDateTime } from '@/lib/utils/format';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { FormDialog } from '@/components/shared/form-dialog';
import { MovimientoForm } from '@/components/forms/movimiento-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { movimientosColumns } from '@/components/tables/columns/movimientos-columns';
import { SnowTicketDialog } from '@/components/servicenow/snow-ticket-dialog';

export default function MovimientosPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [snowOpen, setSnowOpen] = useState(false);

  const { data, isLoading } = useMovimientos({
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    tipo: tipoFilter || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  });

  const createMutation = useCreateMovimiento();

  const handleCreate = useCallback(
    (formData: CreateMovimientoInput) => {
      createMutation.mutate(formData as Record<string, unknown>, {
        onSuccess: () => setFormOpen(false),
      });
    },
    [createMutation],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos"
        description="Registro de movimientos de inventario"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSnowOpen(true)}>
            <Ticket className="mr-2 h-4 w-4" /> Crear Ticket ServiceNow
          </Button>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Movimiento
          </Button>
        </div>
      </PageHeader>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select
          value={tipoFilter}
          onValueChange={(value) => {
            setTipoFilter(value === '__all__' ? '' : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de movimiento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {TIPO_MOVIMIENTO.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
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
        columns={movimientosColumns}
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
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        isLoading={isLoading}
        searchPlaceholder="Buscar por motivo, ticket, serial..."
        toolbarActions={
          <ExportButton
            onExport={() => {
              const rows = (data?.data ?? []).map((m) => {
                const activo = m.equipo?.serialNumber || m.celular?.imei || m.insumo?.nombre || m.monitor?.serialNumber || m.serialRef || m.imeiRef || '';
                return [
                  m.tipo, formatDateTime(m.createdAt) || '', activo,
                  m.colaborador?.nombre || '', m.sitio?.nombre || '',
                  m.estadoAnterior || '', m.estadoNuevo || '',
                  m.operador?.nombre || '', m.ticketSnow || '',
                ];
              });
              exportToExcel({
                filename: 'movimientos',
                sheets: [{ name: 'Movimientos', headers: ['Tipo', 'Fecha', 'Activo', 'Colaborador', 'Sitio', 'Estado Anterior', 'Estado Nuevo', 'Operador', 'Ticket'], rows }],
              });
            }}
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Nuevo Movimiento"
        description="Registre un movimiento de inventario"
      >
        <MovimientoForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </FormDialog>

      <SnowTicketDialog open={snowOpen} onOpenChange={setSnowOpen} />
    </div>
  );
}
