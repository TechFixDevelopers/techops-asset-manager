'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMovimientoSchema, type CreateMovimientoInput } from '@/lib/validations/movimiento';
import { TIPO_MOVIMIENTO, ESTADO_DEVOLUCION } from '@/lib/utils/constants';
import { useEquipos } from '@/lib/hooks/use-equipos';
import { useCelulares } from '@/lib/hooks/use-celulares';
import { useInsumos } from '@/lib/hooks/use-insumos';
import { useMonitores } from '@/lib/hooks/use-monitores';
import { useSitios } from '@/lib/hooks/use-catalogos';
import { ColaboradorCombobox } from '@/components/shared/colaborador-combobox';
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
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Human-readable labels for tipo movimiento ---
const TIPO_LABELS: Record<string, string> = {
  ASIGNACION_PC: 'Asignacion PC',
  DEVOLUCION_PC: 'Devolucion PC',
  ASIGNACION_CEL: 'Asignacion Celular',
  DEVOLUCION_CEL: 'Devolucion Celular',
  ENTREGA_INSUMO: 'Entrega de Insumo',
  ROBO: 'Robo',
  ROAMING: 'Roaming',
  ONBOARDING: 'Onboarding',
  OFFBOARDING: 'Offboarding',
  RECAMBIO: 'Recambio',
  TRANSFERENCIA: 'Transferencia',
};

// --- Generic types that share the same field layout ---
const GENERIC_TIPOS = ['ROBO', 'ROAMING', 'ONBOARDING', 'OFFBOARDING', 'RECAMBIO'] as const;

interface MovimientoFormProps {
  defaultTipo?: string;
  defaultEquipoId?: string;
  defaultCelularId?: string;
  defaultMonitorId?: string;
  defaultInsumoId?: string;
  defaultColaboradorId?: string;
  onSubmit: (data: CreateMovimientoInput) => void;
  isLoading?: boolean;
}

function getEmptyDefaults(overrides?: Partial<CreateMovimientoInput>): CreateMovimientoInput {
  return {
    tipo: 'ASIGNACION_PC',
    colaboradorId: null,
    equipoId: null,
    celularId: null,
    insumoId: null,
    monitorId: null,
    sitioId: null,
    motivo: '',
    estadoNuevo: '',
    cantidad: undefined,
    comentarios: '',
    ticketSnow: '',
    ...overrides,
  };
}

export function MovimientoForm({
  defaultTipo,
  defaultEquipoId,
  defaultCelularId,
  defaultMonitorId,
  defaultInsumoId,
  defaultColaboradorId,
  onSubmit,
  isLoading,
}: MovimientoFormProps) {
  const form = useForm<CreateMovimientoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createMovimientoSchema) as any,
    defaultValues: getEmptyDefaults({
      tipo: (defaultTipo as CreateMovimientoInput['tipo']) ?? 'ASIGNACION_PC',
      equipoId: defaultEquipoId ?? null,
      celularId: defaultCelularId ?? null,
      monitorId: defaultMonitorId ?? null,
      insumoId: defaultInsumoId ?? null,
      colaboradorId: defaultColaboradorId ?? null,
    }),
  });

  const tipo = useWatch({ control: form.control, name: 'tipo' });

  // --- Data hooks ---
  const { data: sitiosData } = useSitios();
  const sitios = sitiosData ?? [];

  const { data: equiposData } = useEquipos({ pageSize: 200 });
  const allEquipos = equiposData?.data ?? [];

  const { data: celularesData } = useCelulares({ pageSize: 200 });
  const allCelulares = celularesData?.data ?? [];

  const { data: insumosData } = useInsumos({ pageSize: 200 });
  const allInsumos = insumosData?.data ?? [];

  const { data: monitoresData } = useMonitores({ pageSize: 200 });
  const allMonitores = monitoresData?.data ?? [];

  // --- Filtered lists based on tipo ---
  const filteredEquipos = (() => {
    switch (tipo) {
      case 'ASIGNACION_PC':
        return allEquipos.filter((e) => e.estado === 'STOCK' || e.estado === 'STOCK AREA');
      case 'DEVOLUCION_PC':
        return allEquipos.filter((e) => e.estado === 'ACTIVO');
      case 'TRANSFERENCIA':
        return allEquipos.filter((e) => e.estado === 'ACTIVO');
      default:
        return allEquipos;
    }
  })();

  const filteredCelulares = (() => {
    switch (tipo) {
      case 'ASIGNACION_CEL':
        return allCelulares.filter((c) => c.estado === 'STOCK' || c.estado === 'STOCK AREA');
      case 'DEVOLUCION_CEL':
        return allCelulares.filter((c) => c.estado === 'ACTIVO');
      case 'TRANSFERENCIA':
        return allCelulares.filter((c) => c.estado === 'ACTIVO');
      default:
        return allCelulares;
    }
  })();

  // --- Determine which tipo is "generic" ---
  const isGenericTipo = (GENERIC_TIPOS as readonly string[]).includes(tipo);

  // --- Helpers for tipo change (reset dependent fields) ---
  const handleTipoChange = (value: string) => {
    form.reset(
      getEmptyDefaults({
        tipo: value as CreateMovimientoInput['tipo'],
      }),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ============================================ */}
        {/* Tipo de Movimiento (always visible)         */}
        {/* ============================================ */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Movimiento *</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  handleTipoChange(value);
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIPO_MOVIMIENTO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t] ?? t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ============================================ */}
        {/* ASIGNACION_PC                               */}
        {/* ============================================ */}
        {tipo === 'ASIGNACION_PC' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Asignacion de PC</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Equipo */}
              <FormField
                control={form.control}
                name="equipoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {filteredEquipos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.serialNumber} - {e.hostname || e.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sitio */}
              <FormField
                control={form.control}
                name="sitioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar sitio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {sitios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Colaborador */}
              <FormField
                control={form.control}
                name="colaboradorId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Colaborador *</FormLabel>
                    <FormControl>
                      <ColaboradorCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motivo (optional) */}
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo de la asignacion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* DEVOLUCION_PC                               */}
        {/* ============================================ */}
        {tipo === 'DEVOLUCION_PC' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Devolucion de PC</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Equipo */}
              <FormField
                control={form.control}
                name="equipoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {filteredEquipos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.serialNumber} - {e.hostname || e.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado devolucion */}
              <FormField
                control={form.control}
                name="estadoNuevo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Devolucion *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADO_DEVOLUCION.map((ed) => (
                          <SelectItem key={ed} value={ed}>
                            {ed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motivo (optional) */}
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo de la devolucion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ASIGNACION_CEL                              */}
        {/* ============================================ */}
        {tipo === 'ASIGNACION_CEL' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Asignacion de Celular</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Celular */}
              <FormField
                control={form.control}
                name="celularId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar celular" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {filteredCelulares.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.imei} - {c.marca} {c.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sitio */}
              <FormField
                control={form.control}
                name="sitioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar sitio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {sitios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Colaborador */}
              <FormField
                control={form.control}
                name="colaboradorId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Colaborador *</FormLabel>
                    <FormControl>
                      <ColaboradorCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motivo (optional) */}
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo de la asignacion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* DEVOLUCION_CEL                              */}
        {/* ============================================ */}
        {tipo === 'DEVOLUCION_CEL' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Devolucion de Celular</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Celular */}
              <FormField
                control={form.control}
                name="celularId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar celular" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {filteredCelulares.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.imei} - {c.marca} {c.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado devolucion */}
              <FormField
                control={form.control}
                name="estadoNuevo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Devolucion *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ESTADO_DEVOLUCION.map((ed) => (
                          <SelectItem key={ed} value={ed}>
                            {ed}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motivo (optional) */}
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo de la devolucion" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* ENTREGA_INSUMO                              */}
        {/* ============================================ */}
        {tipo === 'ENTREGA_INSUMO' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Entrega de Insumo</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Insumo */}
              <FormField
                control={form.control}
                name="insumoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insumo *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar insumo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {allInsumos.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.nombre} - {i.tipoInsumo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sitio */}
              <FormField
                control={form.control}
                name="sitioId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sitio *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar sitio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {sitios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cantidad */}
              <FormField
                control={form.control}
                name="cantidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Colaborador (optional, who receives it) */}
              <FormField
                control={form.control}
                name="colaboradorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colaborador (receptor)</FormLabel>
                    <FormControl>
                      <ColaboradorCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* TRANSFERENCIA                               */}
        {/* ============================================ */}
        {tipo === 'TRANSFERENCIA' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Transferencia</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Equipo */}
              <FormField
                control={form.control}
                name="equipoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {filteredEquipos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.serialNumber} - {e.hostname || e.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Celular */}
              <FormField
                control={form.control}
                name="celularId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar celular" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {filteredCelulares.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.imei} - {c.marca} {c.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Monitor */}
              <FormField
                control={form.control}
                name="monitorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitor</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar monitor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {allMonitores.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.serialNumber} - {m.marca} {m.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Colaborador (new assignee) */}
              <FormField
                control={form.control}
                name="colaboradorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nuevo Colaborador *</FormLabel>
                    <FormControl>
                      <ColaboradorCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sitio */}
              <FormField
                control={form.control}
                name="sitioId"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Sitio</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar sitio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {sitios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Generic types: ROBO, ROAMING, ONBOARDING,   */}
        {/*   OFFBOARDING, RECAMBIO                     */}
        {/* ============================================ */}
        {isGenericTipo && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">
              {TIPO_LABELS[tipo] ?? tipo}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Equipo (optional) */}
              <FormField
                control={form.control}
                name="equipoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Sin seleccionar</SelectItem>
                        {allEquipos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.serialNumber} - {e.hostname || e.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Colaborador (optional) */}
              <FormField
                control={form.control}
                name="colaboradorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Colaborador</FormLabel>
                    <FormControl>
                      <ColaboradorCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estado nuevo (optional) */}
              <FormField
                control={form.control}
                name="estadoNuevo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado Nuevo</FormLabel>
                    <FormControl>
                      <Input placeholder="Estado resultante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Motivo */}
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo</FormLabel>
                    <FormControl>
                      <Input placeholder="Motivo del movimiento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* Common fields (always visible)              */}
        {/* ============================================ */}
        <Separator />
        <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>

        <FormField
          control={form.control}
          name="comentarios"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comentarios</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Comentarios adicionales..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="ticketSnow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket ServiceNow</FormLabel>
              <FormControl>
                <Input placeholder="INC0000000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ============================================ */}
        {/* Submit                                       */}
        {/* ============================================ */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Registrando...' : 'Registrar Movimiento'}
        </Button>
      </form>
    </Form>
  );
}
