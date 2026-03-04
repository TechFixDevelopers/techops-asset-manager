'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Equipo } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';

type EquipoRow = Equipo & {
  empresa: { nombre: string } | null;
  colaborador: { nombre: string } | null;
  sitio: { nombre: string } | null;
};

export type { EquipoRow };

export const equiposColumns: ColumnDef<EquipoRow>[] = [
  {
    accessorKey: 'serialNumber',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Serial" />,
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.serialNumber}</span>
    ),
  },
  {
    accessorKey: 'hostname',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hostname" />,
    cell: ({ row }) => row.original.hostname || '-',
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
  },
  {
    accessorKey: 'marca',
    header: 'Marca',
  },
  {
    accessorKey: 'modelo',
    header: 'Modelo',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => <StatusBadge status={row.original.estado} />,
  },
  {
    accessorKey: 'estadoSecundario',
    header: 'Estado Sec.',
    cell: ({ row }) =>
      row.original.estadoSecundario ? (
        <StatusBadge status={row.original.estadoSecundario} />
      ) : (
        '-'
      ),
  },
  {
    id: 'colaborador',
    header: 'Colaborador',
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
    cell: ({ row }) => (
      <Badge variant={row.original.obsoleto ? 'destructive' : 'secondary'}>
        {row.original.obsoleto ? 'Si' : 'No'}
      </Badge>
    ),
  },
];
