'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Celular } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';

type CelularRow = Celular & {
  empresa: { nombre: string } | null;
  colaborador: { nombre: string } | null;
  linea: { numero: string } | null;
  sitio: { nombre: string } | null;
};

export const celularesColumns: ColumnDef<CelularRow>[] = [
  {
    accessorKey: 'imei',
    header: ({ column }) => <DataTableColumnHeader column={column} title="IMEI" />,
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
  },
  {
    accessorKey: 'marca',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Marca" />,
  },
  {
    accessorKey: 'modelo',
    header: 'Modelo',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.original.estado || '-'} />,
  },
  {
    id: 'colaborador',
    header: 'Asignado a',
    cell: ({ row }) => row.original.colaborador?.nombre || '-',
  },
  {
    id: 'linea',
    header: 'Linea',
    cell: ({ row }) => row.original.linea?.numero || '-',
  },
  {
    id: 'sitio',
    header: 'Sitio',
    cell: ({ row }) => row.original.sitio?.nombre || '-',
  },
];
