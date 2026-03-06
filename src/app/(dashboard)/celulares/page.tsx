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
import { celularesColumns } from '@/components/tables/columns/celulares-columns';
import { CelularForm } from '@/components/forms/celular-form';
import {
  useCelulares,
  useCreateCelular,
  useUpdateCelular,
  useDeleteCelular,
} from '@/lib/hooks/use-celulares';
import { useSitios } from '@/lib/hooks/use-catalogos';
import { ESTADO_EQUIPO, TIPO_CELULAR } from '@/lib/utils/constants';
import type { Celular } from '@/lib/types/database';

type CelularRow = Celular & {
  empresa: { nombre: string } | null;
  colaborador: { nombre: string } | null;
  linea: { numero: string } | null;
  sitio: { nombre: string } | null;
};

export default function CelularesPage() {
  const router = useRouter();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterSitio, setFilterSitio] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CelularRow | null>(null);

  const { data: sitiosData } = useSitios();

  // Queries & mutations
  const { data, isLoading } = useCelulares({
    page,
    pageSize,
    search,
    estado: filterEstado || undefined,
    tipo: filterTipo || undefined,
    sitioId: filterSitio || undefined,
  });
  const createMutation = useCreateCelular();
  const updateMutation = useUpdateCelular();
  const deleteMutation = useDeleteCelular();

  // Add actions column
  const columnsWithActions = useMemo<ColumnDef<CelularRow>[]>(() => [
    ...celularesColumns,
    {
      id: 'actions',
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onView={(celular) => router.push(`/celulares/${celular.id}`)}
          onEdit={(celular) => {
            setSelected(celular);
            setFormOpen(true);
          }}
          onDelete={(celular) => {
            setSelected(celular);
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
      <PageHeader title="Celulares" description="Gestion de celulares, tablets y modems">
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Nuevo celular
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            {ESTADO_EQUIPO.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterTipo} onValueChange={(v) => { setFilterTipo(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {TIPO_CELULAR.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterSitio} onValueChange={(v) => { setFilterSitio(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sitio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los sitios</SelectItem>
            {(sitiosData ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>)}
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
        searchPlaceholder="Buscar por IMEI, modelo o marca..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            exportUrl="/api/export/celulares"
            exportFilename="Inventario CELULARES AR.xlsx"
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelected(null);
        }}
        title={selected ? 'Editar celular' : 'Nuevo celular'}
        description={selected ? `Editando ${selected.imei}` : 'Completar datos del celular'}
      >
        <CelularForm
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
        title="Eliminar celular"
        description={`Esta seguro que desea eliminar el celular con IMEI ${selected?.imei ?? ''}? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
