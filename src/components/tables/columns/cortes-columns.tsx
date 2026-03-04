'use client';

import Link from 'next/link';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils/format';
import type { CorteListItem } from '@/lib/services/cortes';

export const cortesColumns: ColumnDef<CorteListItem>[] = [
  {
    accessorKey: 'fechaCorte',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => (
      <Link
        href={`/cortes/${row.original.id}`}
        className="font-medium text-[#54A0D6] hover:underline"
      >
        {formatDate(row.original.fechaCorte)}
      </Link>
    ),
  },
  {
    id: 'sitio',
    header: 'Sitio',
    cell: ({ row }) => row.original.sitioNombre || '-',
  },
  {
    id: 'generadoPor',
    header: 'Generado Por',
    cell: ({ row }) => row.original.generadoPorNombre || '-',
  },
  {
    accessorKey: 'reconciliado',
    header: 'Reconciliado',
    cell: ({ row }) => {
      const reconciliado = row.original.reconciliado;
      return (
        <Badge
          variant="outline"
          className={
            reconciliado
              ? 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }
        >
          {reconciliado ? 'Si' : 'Pendiente'}
        </Badge>
      );
    },
  },
  {
    id: 'equiposCount',
    header: 'Equipos',
    cell: ({ row }) => row.original.equiposCount,
  },
  {
    id: 'celularesCount',
    header: 'Celulares',
    cell: ({ row }) => row.original.celularesCount,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Creado" />,
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
];
