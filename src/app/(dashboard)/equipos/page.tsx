'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { exportToExcel } from '@/lib/utils/excel-export';
import { ExportButton } from '@/components/shared/export-button';
import {
  useEquipos,
  useCreateEquipo,
  useUpdateEquipo,
  useDeleteEquipo,
} from '@/lib/hooks/use-equipos';
import type { CreateEquipoInput } from '@/lib/validations/equipo';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EquipoForm } from '@/components/forms/equipo-form';
import { Button } from '@/components/ui/button';
import { equiposColumns, type EquipoRow } from '@/components/tables/columns/equipos-columns';

export default function EquiposPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<EquipoRow | null>(null);

  const { data, isLoading } = useEquipos({ page, pageSize, search });
  const createMutation = useCreateEquipo();
  const updateMutation = useUpdateEquipo();
  const deleteMutation = useDeleteEquipo();

  const handleSubmit = useCallback(
    (formData: CreateEquipoInput) => {
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
        createMutation.mutate(formData as Record<string, unknown>, {
          onSuccess: () => {
            setFormOpen(false);
            setSelected(null);
          },
        });
      }
    },
    [selected, createMutation, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (!selected) return;
    deleteMutation.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelected(null);
      },
    });
  }, [selected, deleteMutation]);

  const columnsWithActions = useMemo(
    () => [
      ...equiposColumns,
      {
        id: 'actions',
        cell: ({ row }: { row: { original: EquipoRow } }) => (
          <DataTableRowActions
            row={row as never}
            onView={(d: EquipoRow) => router.push(`/equipos/${d.id}`)}
            onEdit={(d: EquipoRow) => {
              setSelected(d);
              setFormOpen(true);
            }}
            onDelete={(d: EquipoRow) => {
              setSelected(d);
              setDeleteOpen(true);
            }}
          />
        ),
      } satisfies ColumnDef<EquipoRow>,
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Equipos" description="Gestion de equipos informaticos">
        <Button
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Nuevo
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
        searchPlaceholder="Buscar por serial, hostname o modelo..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            onExport={() => {
              const rows = (data?.data ?? []).map((e) => [
                e.serialNumber, e.hostname || '', e.tipo, e.marca, e.modelo,
                e.estado, e.estadoSecundario || '', e.colaborador?.nombre || '',
                e.sitio?.nombre || '', e.obsoleto ? 'Si' : 'No',
              ]);
              exportToExcel({
                filename: 'equipos',
                sheets: [{ name: 'Equipos', headers: ['Serial', 'Hostname', 'Tipo', 'Marca', 'Modelo', 'Estado', 'Estado Sec.', 'Colaborador', 'Sitio', 'Obsoleto'], rows }],
              });
            }}
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? 'Editar Equipo' : 'Nuevo Equipo'}
        description={
          selected
            ? 'Modifique los datos del equipo.'
            : 'Complete los datos para registrar un nuevo equipo.'
        }
      >
        <EquipoForm
          defaultValues={selected ? (selected as unknown as Record<string, unknown>) : undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Equipo"
        description={`Esta seguro de que desea eliminar el equipo ${selected?.serialNumber ?? ''}? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
