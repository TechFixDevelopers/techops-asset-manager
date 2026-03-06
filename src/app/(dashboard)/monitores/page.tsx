'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportButton } from '@/components/shared/export-button';
import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { monitoresColumns } from '@/components/tables/columns/monitores-columns';
import { MonitorForm } from '@/components/forms/monitor-form';
import {
  useMonitores,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from '@/lib/hooks/use-monitores';
import { useSitios } from '@/lib/hooks/use-catalogos';
import type { Monitor } from '@/lib/types/database';

type MonitorRow = Monitor & {
  colaborador: { nombre: string } | null;
  sitio: { nombre: string } | null;
};

export default function MonitoresPage() {
  const router = useRouter();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filterSitio, setFilterSitio] = useState('');
  const [filterObsoleto, setFilterObsoleto] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<MonitorRow | null>(null);

  const { data: sitiosData } = useSitios();

  // Queries & mutations
  const { data, isLoading } = useMonitores({
    page,
    pageSize,
    search,
    sitioId: filterSitio || undefined,
    obsoleto: filterObsoleto === 'true' ? true : filterObsoleto === 'false' ? false : undefined,
  });
  const createMutation = useCreateMonitor();
  const updateMutation = useUpdateMonitor();
  const deleteMutation = useDeleteMonitor();

  // Add actions column
  const columnsWithActions = useMemo<ColumnDef<MonitorRow>[]>(() => [
    ...monitoresColumns,
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onView={(monitor) => router.push(`/monitores/${monitor.id}`)}
          onEdit={(monitor) => {
            setSelected(monitor);
            setFormOpen(true);
          }}
          onDelete={(monitor) => {
            setSelected(monitor);
            setDeleteOpen(true);
          }}
        />
      ),
    },
  ], [router]);

  // Handlers
  function handleSubmit(formData: Record<string, unknown>) {
    if (selected) {
      updateMutation.mutate(
        { id: selected.id, data: formData },
        {
          onSuccess: () => {
            setFormOpen(false);
            setSelected(null);
          },
        },
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormOpen(false);
        },
      });
    }
  }

  function handleDelete() {
    if (!selected) return;
    deleteMutation.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelected(null);
      },
    });
  }

  function handleOpenCreate() {
    setSelected(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Monitores" description="Gestion de monitores y pantallas">
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Nuevo monitor
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterSitio} onValueChange={(v) => { setFilterSitio(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sitio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los sitios</SelectItem>
            {(sitiosData ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterObsoleto} onValueChange={(v) => { setFilterObsoleto(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Obsoleto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="true">Si</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={data?.data ?? []}
        total={data?.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={setSearch}
        searchPlaceholder="Buscar por serial, marca o modelo..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            exportUrl="/api/export/equipos"
            exportFilename="Inventario EQUIPAMIENTO AR.xlsx"
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelected(null);
        }}
        title={selected ? 'Editar monitor' : 'Nuevo monitor'}
        description={selected ? `Editando ${selected.serialNumber}` : 'Completar datos del monitor'}
      >
        <MonitorForm
          defaultValues={selected ? (selected as unknown as Record<string, unknown>) : undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setSelected(null);
        }}
        title="Eliminar monitor"
        description={`Esta seguro que desea eliminar el monitor ${selected?.marca ?? ''} ${selected?.modelo ?? ''} (S/N: ${selected?.serialNumber ?? ''})? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
