'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import {
  useColaboradores,
  useCreateColaborador,
  useUpdateColaborador,
  useDeleteColaborador,
} from '@/lib/hooks/use-colaboradores';
import { useEmpresas, useSitios } from '@/lib/hooks/use-catalogos';
import type { CreateColaboradorInput } from '@/lib/validations/colaborador';

import { ExportButton } from '@/components/shared/export-button';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ColaboradorForm } from '@/components/forms/colaborador-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { colaboradoresColumns } from '@/components/tables/columns/colaboradores-columns';

type ColaboradorRow = (typeof colaboradoresColumns extends ColumnDef<infer T>[] ? T : never);

export default function ColaboradoresPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterSitio, setFilterSitio] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<ColaboradorRow | null>(null);

  const { data: empresasData } = useEmpresas();
  const { data: sitiosData } = useSitios();

  const { data, isLoading } = useColaboradores({
    page,
    pageSize,
    search,
    empresaId: filterEmpresa || undefined,
    sitioId: filterSitio || undefined,
  });
  const createMutation = useCreateColaborador();
  const updateMutation = useUpdateColaborador();
  const deleteMutation = useDeleteColaborador();

  const handleSubmit = useCallback(
    (formData: CreateColaboradorInput) => {
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
      ...colaboradoresColumns,
      {
        id: 'actions',
        cell: ({ row }: { row: { original: ColaboradorRow } }) => (
          <DataTableRowActions
            row={row as never}
            onView={(d: ColaboradorRow) => router.push(`/colaboradores/${d.id}`)}
            onEdit={(d: ColaboradorRow) => {
              setSelected(d);
              setFormOpen(true);
            }}
            onDelete={(d: ColaboradorRow) => {
              setSelected(d);
              setDeleteOpen(true);
            }}
          />
        ),
      } satisfies ColumnDef<ColaboradorRow>,
    ],
    [router],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Colaboradores" description="Gestion de colaboradores">
        <Button
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Nuevo
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterEmpresa} onValueChange={(v) => { setFilterEmpresa(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las empresas</SelectItem>
            {(empresasData ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}
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
        searchPlaceholder="Buscar por nombre, legajo o email..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            exportUrl="/api/export/colaboradores"
            exportFilename="INVENTARIOS-Datos Planos ARG.xlsx"
          />
        }
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? 'Editar Colaborador' : 'Nuevo Colaborador'}
        description={
          selected
            ? 'Modifique los datos del colaborador.'
            : 'Complete los datos para crear un nuevo colaborador.'
        }
      >
        <ColaboradorForm
          defaultValues={selected ? (selected as unknown as Record<string, unknown>) : undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Colaborador"
        description={`Esta seguro de que desea eliminar a ${selected?.nombre ?? 'este colaborador'}? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
