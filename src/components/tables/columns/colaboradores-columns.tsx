'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Colaborador } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';

type ColaboradorRow = Colaborador & {
  empresa: { nombre: string } | null;
  sitio: { nombre: string } | null;
};

export const colaboradoresColumns: ColumnDef<ColaboradorRow>[] = [
  {
    accessorKey: 'legajo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Legajo" />,
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => row.original.email || '-',
  },
  {
    id: 'empresa',
    header: 'Empresa',
    cell: ({ row }) => row.original.empresa?.nombre || '-',
  },
  {
    id: 'sitio',
    header: 'Sitio',
    cell: ({ row }) => row.original.sitio?.nombre || '-',
  },
  {
    accessorKey: 'area',
    header: 'Area',
    cell: ({ row }) => row.original.area || '-',
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.original.status || 'Active'} />,
  },
];
