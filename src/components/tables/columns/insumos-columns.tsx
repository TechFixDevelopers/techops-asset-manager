'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Insumo } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { Badge } from '@/components/ui/badge';

type InsumoRow = Insumo & { stockTotal: number };

export const insumosColumns: ColumnDef<InsumoRow>[] = [
  {
    accessorKey: 'nombre',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
  },
  {
    accessorKey: 'tipoInsumo',
    header: 'Tipo',
  },
  {
    accessorKey: 'serialInsumo',
    header: 'Serial',
    cell: ({ row }) => row.original.serialInsumo || '-',
  },
  {
    accessorKey: 'stockTotal',
    header: 'Stock Total',
    cell: ({ row }) => {
      const stock = row.original.stockTotal;
      const min = row.original.cantidadMin;
      const isBelowMin = stock < (min ?? 0);
      return (
        <Badge variant={isBelowMin ? 'destructive' : 'secondary'}>
          {stock}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'cantidadMin',
    header: 'Mín.',
    cell: ({ row }) => row.original.cantidadMin ?? '-',
  },
];
