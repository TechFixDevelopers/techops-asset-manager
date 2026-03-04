'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { MovimientoWithRelations } from '@/lib/types/database';
import { DataTableColumnHeader } from '@/components/tables/data-table-column-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDateTime } from '@/lib/utils/format';

export const movimientosColumns: ColumnDef<MovimientoWithRelations>[] = [
  {
    accessorKey: 'tipo',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => <StatusBadge status={row.original.tipo} />,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => formatDateTime(row.original.createdAt),
  },
  {
    id: 'activo',
    header: 'Activo',
    cell: ({ row }) => {
      const m = row.original;
      if (m.equipo) return m.equipo.serialNumber;
      if (m.celular) return m.celular.imei;
      if (m.monitor) return m.monitor.serialNumber;
      if (m.insumo) return `${m.insumo.nombre}${m.cantidad ? ` (x${m.cantidad})` : ''}`;
      return m.serialRef || m.imeiRef || '-';
    },
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
    id: 'cambioEstado',
    header: 'Cambio Estado',
    cell: ({ row }) => {
      const { estadoAnterior, estadoNuevo } = row.original;
      if (!estadoAnterior && !estadoNuevo) return '-';
      return (
        <span className="flex items-center gap-1 text-xs">
          {estadoAnterior && <StatusBadge status={estadoAnterior} />}
          {estadoAnterior && estadoNuevo && <span>→</span>}
          {estadoNuevo && <StatusBadge status={estadoNuevo} />}
        </span>
      );
    },
  },
  {
    id: 'operador',
    header: 'Operador',
    cell: ({ row }) => row.original.operador?.nombre || '-',
  },
  {
    accessorKey: 'ticketSnow',
    header: 'Ticket INC',
    cell: ({ row }) => row.original.ticketSnow || '-',
  },
];
