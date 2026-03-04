'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Monitor } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { Badge } from '@/components/ui/badge';

type MonitorRow = Monitor & {
  colaborador: { nombre: string } | null;
  sitio: { nombre: string } | null;
};

export const monitoresColumns: ColumnDef<MonitorRow>[] = [
  {
    accessorKey: 'serialNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="N/S" />,
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
    accessorKey: 'pulgadas',
    header: 'Pulgadas',
  },
  {
    accessorKey: 'tipoMonitor',
    header: 'Tipo',
  },
  {
    id: 'colaborador',
    header: 'Asignado a',
    cell: ({ row }) => row.original.colaborador?.nombre || '-',
  },
  {
    id: 'sitio',
    header: 'Sitio',
    cell: ({ row }) => row.original.sitio?.nombre || '-',
  },
  {
    accessorKey: 'obsoleto',
    header: 'Obsoleto',
    cell: ({ row }) =>
      row.original.obsoleto ? (
        <Badge variant="destructive">Si</Badge>
      ) : (
        <Badge variant="secondary">No</Badge>
      ),
  },
];
