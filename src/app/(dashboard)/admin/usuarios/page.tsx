'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';

import { exportToExcel } from '@/lib/utils/excel-export';
import { ExportButton } from '@/components/shared/export-button';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/lib/hooks/use-users';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/tables/data-table';
import { DataTableRowActions } from '@/components/tables/data-table-row-actions';
import { FormDialog } from '@/components/shared/form-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { UserForm } from '@/components/forms/user-form';
import { Button } from '@/components/ui/button';
import { usersColumns, type UserRow } from '@/components/tables/columns/users-columns';

export default function UsuariosPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const { data, isLoading } = useUsers({ page, pageSize, search });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const handleSubmit = useCallback(
    (formData: Record<string, unknown>) => {
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
      ...usersColumns,
      {
        id: 'actions',
        cell: ({ row }: { row: { original: UserRow } }) => (
          <DataTableRowActions
            row={row as never}
            onEdit={(d: UserRow) => {
              setSelected(d);
              setFormOpen(true);
            }}
            onDelete={(d: UserRow) => {
              setSelected(d);
              setDeleteOpen(true);
            }}
          />
        ),
      } satisfies ColumnDef<UserRow>,
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" description="Administración de usuarios del sistema">
        <Button
          onClick={() => {
            setSelected(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> Nuevo Usuario
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
        searchPlaceholder="Buscar por username, nombre o email..."
        isLoading={isLoading}
        toolbarActions={
          <ExportButton
            onExport={() => {
              const rows = (data?.data ?? []).map((u) => [
                u.username,
                u.nombre || '',
                u.email || '',
                u.perfil,
                u.activo ? 'Activo' : 'Inactivo',
                u.createdAt
                  ? new Date(u.createdAt).toLocaleDateString('es-AR')
                  : '',
              ]);
              exportToExcel({
                filename: 'usuarios',
                sheets: [
                  {
                    name: 'Usuarios',
                    headers: ['Username', 'Nombre', 'Email', 'Perfil', 'Estado', 'Creado'],
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
        onOpenChange={setFormOpen}
        title={selected ? 'Editar Usuario' : 'Nuevo Usuario'}
        description={
          selected
            ? 'Modifique los datos del usuario.'
            : 'Complete los datos para crear un nuevo usuario.'
        }
      >
        <UserForm
          defaultValues={selected ? (selected as unknown as Record<string, unknown>) : undefined}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
          isEditing={!!selected}
        />
      </FormDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Usuario"
        description={`¿Está seguro de que desea eliminar el usuario "${selected?.username ?? ''}"? Esta acción no se puede deshacer.`}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
