'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { type ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import type { Insumo } from '@/lib/types/database';
import {
  useInsumos,
  useCreateInsumo,
  useUpdateInsumo,
  useDeleteInsumo,
  useAdjustStock,
} from '@/lib/hooks/use-insumos';
import { TIPO_INSUMO } from '@/lib/utils/constants';
import type { CreateInsumoInput } from '@/lib/validations/insumo';
import type { StockAdjustInput } from '@/lib/validations/insumo';

import { exportToExcel } from '@/lib/utils/excel-export';
import { ExportButton } from '@/components/shared/export-button';
import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { insumosColumns } from '@/components/tables/columns/insumos-columns';
import { InsumoForm } from '@/components/forms/insumo-form';
import { StockAdjustmentForm } from '@/components/forms/stock-adjustment-form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type InsumoRow = Insumo & { stockTotal: number };

export default function InsumosPage() {
  const router = useRouter();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [selected, setSelected] = useState<InsumoRow | null>(null);

  // Data
  const { data, isLoading } = useInsumos({
    page,
    pageSize,
    search,
    tipoInsumo: filterTipo || undefined,
  });
  const createMutation = useCreateInsumo();
  const updateMutation = useUpdateInsumo();
  const deleteMutation = useDeleteInsumo();
  const stockMutation = useAdjustStock();

  // Handlers
  const handleCreate = (formData: CreateInsumoInput) => {
    createMutation.mutate(formData as Record<string, unknown>, {
      onSuccess: () => {
        setFormOpen(false);
        setSelected(null);
      },
    });
  };

  const handleUpdate = (formData: CreateInsumoInput) => {
    if (!selected) return;
    updateMutation.mutate(
      { id: selected.id, data: formData as Record<string, unknown> },
      {
        onSuccess: () => {
          setFormOpen(false);
          setSelected(null);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!selected) return;
    deleteMutation.mutate(selected.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        setSelected(null);
      },
    });
  };

  const handleStockAdjust = (formData: StockAdjustInput) => {
    stockMutation.mutate(formData, {
      onSuccess: () => {
        setStockOpen(false);
        setSelected(null);
      },
    });
  };

  const handleOpenCreate = () => {
    setSelected(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (row: InsumoRow) => {
    setSelected(row);
    setFormOpen(true);
  };

  const handleOpenDelete = (row: InsumoRow) => {
    setSelected(row);
    setDeleteOpen(true);
  };

  const handleView = (row: InsumoRow) => {
    router.push(`/insumos/${row.id}`);
  };

  // Columns with actions
  const columnsWithActions: ColumnDef<InsumoRow>[] = useMemo(
    () => [
      ...insumosColumns,
      {
        id: 'stockAction',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(row.original);
              setStockOpen(true);
            }}
          >
            Stock
          </Button>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DataTableRowActions
            row={row}
            onView={(data) => handleView(data)}
            onEdit={(data) => handleOpenEdit(data)}
            onDelete={(data) => handleOpenDelete(data)}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Insumos" description="Gestion de insumos y stock">
        <Button onClick={handleOpenCreate}>
          <Plus className="size-4" />
          Nuevo Insumo
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterTipo} onValueChange={(v) => { setFilterTipo(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los tipos</SelectItem>
            {TIPO_INSUMO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
        searchPlaceholder="Buscar por nombre, tipo o serial..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            onExport={() => {
              const rows = (data?.data ?? []).map((i) => [
                i.nombre, i.tipoInsumo, i.serialInsumo || '', i.stockTotal, i.cantidadMin ?? '',
              ]);
              exportToExcel({
                filename: 'insumos',
                sheets: [{ name: 'Insumos', headers: ['Nombre', 'Tipo', 'Serial', 'Stock Total', 'Min.'], rows }],
              });
            }}
          />
        }
      />

      {/* Create / Edit Dialog */}
      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={selected ? 'Editar Insumo' : 'Nuevo Insumo'}
        description={
          selected
            ? `Editando insumo: ${selected.nombre}`
            : 'Completar los datos del nuevo insumo'
        }
      >
        <InsumoForm
          defaultValues={
            selected
              ? {
                  nombre: selected.nombre,
                  tipoInsumo: selected.tipoInsumo as CreateInsumoInput['tipoInsumo'],
                  serialInsumo: selected.serialInsumo ?? '',
                  ordenCompra: selected.ordenCompra ?? '',
                  areaCompra: selected.areaCompra ?? '',
                  fechaCompra: selected.fechaCompra ?? '',
                  cantidadMin: selected.cantidadMin ?? 5,
                }
              : undefined
          }
          onSubmit={selected ? handleUpdate : handleCreate}
          isLoading={
            selected ? updateMutation.isPending : createMutation.isPending
          }
        />
      </FormDialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Insumo"
        description={`Esta seguro que desea eliminar "${selected?.nombre ?? ''}"? Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />

      {/* Stock Adjustment Dialog */}
      <FormDialog
        open={stockOpen}
        onOpenChange={setStockOpen}
        title="Ajustar Stock"
        description={`Ajustar stock de ${selected?.nombre ?? ''}`}
      >
        <StockAdjustmentForm
          insumoId={selected?.id ?? ''}
          onSubmit={handleStockAdjust}
          isLoading={stockMutation.isPending}
        />
      </FormDialog>
    </div>
  );
}
