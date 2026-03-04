'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Linea } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';

type LineaRow = Linea & {
  sitio: { nombre: string } | null;
};

export type { LineaRow };

export const lineasColumns: ColumnDef<LineaRow>[] = [
  {
    accessorKey: 'numero',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Número" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.numero}</span>
    ),
  },
  {
    accessorKey: 'tipoLinea',
    header: 'Tipo',
    cell: ({ row }) => row.original.tipoLinea || '-',
  },
  {
    accessorKey: 'proveedor',
    header: 'Proveedor',
    cell: ({ row }) => row.original.proveedor || '-',
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    cell: ({ row }) => row.original.plan || '-',
  },
  {
    id: 'sitio',
    header: 'Sitio',
    cell: ({ row }) => row.original.sitio?.nombre || '-',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.original.estado ?? 'ACTIVA'} />,
  },
];
