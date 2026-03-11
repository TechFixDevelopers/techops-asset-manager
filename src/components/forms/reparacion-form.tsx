'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TIPO_TAREA_REPARACION,
  TIPO_EQUIPO_REPARACION,
  REPARACIONES_CHECKBOXES,
  ESTADO_REPARACION,
} from '@/lib/utils/constants';
import { createReparacionSchema, type CreateReparacionInput } from '@/lib/validations/reparacion';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ColaboradorCombobox } from '@/components/shared/colaborador-combobox';
import { useSitios } from '@/lib/hooks/use-catalogos';
import { useEquipos } from '@/lib/hooks/use-equipos';
import { useColaboradores } from '@/lib/hooks/use-colaboradores';

interface ReparacionFormProps {
  defaultValues?: Partial<CreateReparacionInput>;
  onSubmit: (data: CreateReparacionInput) => void;
  isLoading?: boolean;
}

export function ReparacionForm({ defaultValues, onSubmit, isLoading }: ReparacionFormProps) {
  const { data: sitios } = useSitios();
  const { data: equiposData } = useEquipos({ pageSize: 500 });
  const { data: colaboradoresData } = useColaboradores({ pageSize: 500 });
  const allEquipos = equiposData?.data ?? [];
  const allColaboradores = colaboradoresData?.data ?? [];

  const form = useForm<CreateReparacionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createReparacionSchema) as any,
    defaultValues: {
      tipoTarea: '',
      tipoEquipo: '',
      reparacionesRealizadas: [],
      descripcion: '',
      colaboradorId: null,
      equipoRef: '',
      sitioId: null,
      ticketSnow: '',
      estado: 'ABIERTA',
      ...defaultValues,
    },
  });

  const tipoTarea = form.watch('tipoTarea');

  // --- Auto-selection: colaborador → equipoRef + sitio ---
  const handleColaboradorAutoFill = (colaboradorId: string | null) => {
    form.setValue('colaboradorId', colaboradorId);
    if (!colaboradorId) return;

    const col = allColaboradores.find((c) => c.id === colaboradorId);

    // Auto-fill equipoRef with assigned equipo's serial
    const assignedEquipo = allEquipos.find((e) => e.colaboradorId === colaboradorId);
    if (assignedEquipo && !form.getValues('equipoRef')) {
      form.setValue('equipoRef', assignedEquipo.serialNumber);
    }

    // Auto-fill sitio from colaborador
    if (col?.sitioId && !form.getValues('sitioId')) {
      form.setValue('sitioId', col.sitioId);
    }
  };
  const reparacionesSel = form.watch('reparacionesRealizadas') ?? [];

  // Show equipment repair panel for hardware-related tasks
  const showReparacionPanel = [
    'Problemas con Notebook, TC o Desktop',
    'Problemas con Monitores, TVs, Proyectores',
    'Periféricos rotos (mouse, teclado, adaptadores)',
  ].includes(tipoTarea);

  const toggleReparacion = (item: string) => {
    const current = form.getValues('reparacionesRealizadas') ?? [];
    const next = current.includes(item)
      ? current.filter((r) => r !== item)
      : [...current, item];
    form.setValue('reparacionesRealizadas', next);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipoTarea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Tarea</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIPO_TAREA_REPARACION.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showReparacionPanel && (
          <>
            <FormField
              control={form.control}
              name="tipoEquipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Equipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar tipo equipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPO_EQUIPO_REPARACION.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2 rounded-md border p-4">
              <FormLabel>Reparaciones Realizadas</FormLabel>
              <div className="grid gap-2 sm:grid-cols-3">
                {REPARACIONES_CHECKBOXES.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={reparacionesSel.includes(item)}
                      onCheckedChange={() => toggleReparacion(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <FormField
          control={form.control}
          name="colaboradorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Colaborador</FormLabel>
              <FormControl>
                <ColaboradorCombobox
                  value={field.value}
                  onValueChange={handleColaboradorAutoFill}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipoRef"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia Equipo (Serial/Hostname)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Serial o hostname del equipo" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sitioId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sitio</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar sitio..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(sitios ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripcion</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} placeholder="Descripcion del problema..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="ticketSnow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ticket ServiceNow</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="INC..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADO_REPARACION.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
