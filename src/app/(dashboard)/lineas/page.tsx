'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { ExportButton } from '@/components/shared/export-button';
import {
  useLineas,
  useCreateLinea,
  useUpdateLinea,
  useDeleteLinea,
} from '@/lib/hooks/use-lineas';
import { useSitios } from '@/lib/hooks/use-catalogos';
import { TIPO_LINEA, ESTADO_LINEA, PROVEEDOR_CELULAR } from '@/lib/utils/constants';
import type { CreateLineaInput } from '@/lib/validations/linea';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { LineaForm } from '@/components/forms/linea-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { lineasColumns, type LineaRow } from '@/components/tables/columns/lineas-columns';

export default function LineasPage() {
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterProveedor, setFilterProveedor] = useState('');
  const [filterSitio, setFilterSitio] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LineaRow | null>(null);

  const { data: sitiosData } = useSitios();

  const { data, isLoading } = useLineas({
    page,
    pageSize,
    search,
    estado: filterEstado || undefined,
    tipoLinea: filterTipo || undefined,
    proveedor: filterProveedor || undefined,
    sitioId: filterSitio || undefined,
  });
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

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estados</SelectItem>
            {ESTADO_LINEA.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterTipo} onValueChange={(v) => { setFilterTipo(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {TIPO_LINEA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterProveedor} onValueChange={(v) => { setFilterProveedor(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {PROVEEDOR_CELULAR.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
        searchPlaceholder="Buscar por número, proveedor o plan..."
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
