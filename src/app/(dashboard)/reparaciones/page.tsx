'use client';

import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';

import { useReparaciones, useCreateReparacion } from '@/lib/hooks/use-reparaciones';
import { TIPO_TAREA_REPARACION, ESTADO_REPARACION, ESTADO_COLORS } from '@/lib/utils/constants';
import type { CreateReparacionInput } from '@/lib/validations/reparacion';
import { formatDateTime } from '@/lib/utils/format';

import { PageHeader } from '@/components/shared/page-header';
import { FormDialog } from '@/components/shared/form-dialog';
import { ReparacionForm } from '@/components/forms/reparacion-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ReparacionesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading } = useReparaciones({
    page,
    pageSize,
    search: search || undefined,
    tipoTarea: tipoFilter || undefined,
    estado: estadoFilter || undefined,
  });

  const createMutation = useCreateReparacion();

  const handleCreate = useCallback(
    (formData: CreateReparacionInput) => {
      createMutation.mutate(formData, {
        onSuccess: () => setFormOpen(false),
      });
    },
    [createMutation],
  );

  const rows = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reparaciones"
        description="Gestiones de Field Support"
      >
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Reparacion
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm"
        />
        <Select value={tipoFilter} onValueChange={(v) => { setTipoFilter(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Tipo de tarea" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {TIPO_TAREA_REPARACION.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {ESTADO_REPARACION.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No hay reparaciones registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Fecha</th>
                <th className="px-4 py-3 text-left font-medium">Tipo Tarea</th>
                <th className="px-4 py-3 text-left font-medium">Colaborador</th>
                <th className="px-4 py-3 text-left font-medium">Equipo</th>
                <th className="px-4 py-3 text-left font-medium">Sitio</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Ticket</th>
                <th className="px-4 py-3 text-left font-medium">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-2 whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                  <td className="px-4 py-2">{r.tipoTarea}</td>
                  <td className="px-4 py-2">{r.colaboradorNombre || '-'}</td>
                  <td className="px-4 py-2">{r.equipoRef || '-'}</td>
                  <td className="px-4 py-2">{r.sitioNombre || '-'}</td>
                  <td className="px-4 py-2">
                    <Badge className={ESTADO_COLORS[r.estado] || ''}>
                      {r.estado}
                    </Badge>
                  </td>
                  <td className="px-4 py-2">{r.ticketSnow || '-'}</td>
                  <td className="px-4 py-2">{r.operadorNombre || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Pagina {data.page} de {data.totalPages} ({data.total} registros)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title="Nueva Reparacion"
        description="Registre una gestion de Field Support"
      >
        <ReparacionForm
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
        />
      </FormDialog>
    </div>
  );
}
