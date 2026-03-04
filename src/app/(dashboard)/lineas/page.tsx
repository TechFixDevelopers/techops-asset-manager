'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { exportToExcel } from '@/lib/utils/excel-export';
import { ExportButton } from '@/components/shared/export-button';
import {
  useLineas,
  useCreateLinea,
  useUpdateLinea,
  useDeleteLinea,
} from '@/lib/hooks/use-lineas';
import type { CreateLineaInput } from '@/lib/validations/linea';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LineaForm } from '@/components/forms/linea-form';
import { Button } from '@/components/ui/button';
import { lineasColumns, type LineaRow } from '@/components/tables/columns/lineas-columns';

export default function LineasPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LineaRow | null>(null);

  const { data, isLoading } = useLineas({ page, pageSize, search });
  const createMutation = useCreateLinea();
  const updateMutation = useUpdateLinea();
  const deleteMutation = useDeleteLinea();

  const handleSubmit = useCallback(
    (formData: CreateLineaInput) => {
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
      ...lineasColumns,
      {
        id: 'actions',
        cell: ({ row }: { row: { original: LineaRow } }) => (
          <DataTableRowActions
            row={row as never}
            onView={(d: LineaRow) => router.push(`/lineas/${d.id}`)}
            onEdit={(d: LineaRow) => {
              setSelected(d);
              setFormOpen(true);
            }}
            onDelete={(d: LineaRow) => {
              setSelected(d);
              setDeleteOpen(true);
            }}
          />
        ),
      } satisfies ColumnDef<LineaRow>,
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Líneas" description="Gestión de líneas telefónicas">
        <Button
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Nueva Línea
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
        searchPlaceholder="Buscar por número, proveedor o plan..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            onExport={() => {
              const rows = (data?.data ?? []).map((l) => [
                l.numero, l.tipoLinea || '', l.proveedor || '', l.plan || '',
                l.sitio?.nombre || '', l.estado || '',
              ]);
              exportToExcel({
                filename: 'lineas',
                sheets: [{ name: 'Líneas', headers: ['Número', 'Tipo', 'Proveedor', 'Plan', 'Sitio', 'Estado'], rows }],
              });
            }}
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? 'Editar Línea' : 'Nueva Línea'}
        description={
          selected
            ? 'Modifique los datos de la línea.'
            : 'Complete los datos para registrar una nueva línea.'
        }
      >
        <LineaForm
          defaultValues={selected ? (selected as unknown as Record<string, unknown>) : undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Línea"
        description={`¿Está seguro de que desea eliminar la línea ${selected?.numero ?? ''}? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
