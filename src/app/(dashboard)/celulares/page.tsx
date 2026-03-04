'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { exportToExcel } from '@/lib/utils/excel-export';
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
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<CelularRow | null>(null);

  // Queries & mutations
  const { data, isLoading } = useCelulares({ page, pageSize, search });
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
            onExport={() => {
              const rows = (data?.data ?? []).map((c) => [
                c.imei, c.tipo, c.marca, c.modelo, c.estado,
                c.colaborador?.nombre || '', c.linea?.numero || '', c.sitio?.nombre || '',
              ]);
              exportToExcel({
                filename: 'celulares',
                sheets: [{ name: 'Celulares', headers: ['IMEI', 'Tipo', 'Marca', 'Modelo', 'Estado', 'Colaborador', 'Linea', 'Sitio'], rows }],
              });
            }}
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
