'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import type { AppUserSafe } from '@/lib/services/app-users';

export type UserRow = AppUserSafe;

export const usersColumns: ColumnDef<UserRow>[] = [
  {
    accessorKey: 'username',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.username}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => row.original.nombre || '-',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email || '-',
  },
  {
    accessorKey: 'perfil',
    header: 'Perfil',
    cell: ({ row }) => <StatusBadge status={row.original.perfil} />,
  },
  {
    accessorKey: 'activo',
    header: 'Activo',
    cell: ({ row }) => (
      <Badge variant={row.original.activo ? 'default' : 'destructive'}>
        {row.original.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
    cell: ({ row }) => {
      const date = row.original.createdAt;
      if (!date) return '-';
      return new Date(date).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    },
  },
];
