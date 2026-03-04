'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEquipoSchema,
  type CreateEquipoInput,
} from '@/lib/validations/equipo';
import {
  TIPO_EQUIPO,
  MARCA_EQUIPO,
  ESTADO_EQUIPO,
  ESTADO_SECUNDARIO_EQUIPO,
  MOTIVO_ASIGNACION,
  PRINCIPAL_SECUNDARIA,
} from '@/lib/utils/constants';
import { useEmpresas, useSitios } from '@/lib/hooks/use-catalogos';
import { useColaboradores } from '@/lib/hooks/use-colaboradores';
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
import { Separator } from '@/components/ui/separator';

interface EquipoFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: CreateEquipoInput) => void;
  isLoading?: boolean;
}

export function EquipoForm({ defaultValues, onSubmit, isLoading }: EquipoFormProps) {
  const { data: empresas } = useEmpresas();
  const { data: sitios } = useSitios();
  const { data: colaboradoresData } = useColaboradores({ pageSize: 500 });

  const form = useForm<CreateEquipoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createEquipoSchema) as any,
    defaultValues: {
      serialNumber: '',
      hostname: '',
      tipo: 'NOTEBOOK',
      marca: 'DELL',
      modelo: '',
      procesador: '',
      memoria: '',
      tipoDisco: '',
      tamanoDisco: '',
      sistemaOperativo: '',
      red: false,
      compradoPor: '',
      ordenCompra: '',
      fechaCompra: '',
      diasGarantia: 1095,
      vencGarantia: '',
      estado: 'STOCK',
      estadoSecundario: 'DISPONIBLE',
      obsoleto: false,
      empresaId: null,
      colaboradorId: null,
      sitioId: null,
      principalSecundaria: '',
      motivoAsignacion: '',
      fechaAsignacion: '',
      comentarios: '',
      ...(defaultValues as Partial<CreateEquipoInput>),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Identificacion */}
        <h4 className="text-sm font-medium text-muted-foreground">Identificacion</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Numero de Serie</FormLabel>
                <FormControl>
                  <Input placeholder="Serial Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hostname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hostname</FormLabel>
                <FormControl>
                  <Input placeholder="Hostname" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPO_EQUIPO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MARCA_EQUIPO.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Modelo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Especificaciones */}
        <h4 className="text-sm font-medium text-muted-foreground">Especificaciones</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="procesador"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Procesador</FormLabel>
                <FormControl>
                  <Input placeholder="Intel i7, AMD Ryzen..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="memoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Memoria</FormLabel>
                <FormControl>
                  <Input placeholder="8GB, 16GB..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipoDisco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo Disco</FormLabel>
                <FormControl>
                  <Input placeholder="SSD, HDD..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tamanoDisco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tamano Disco</FormLabel>
                <FormControl>
                  <Input placeholder="256GB, 512GB..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sistemaOperativo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sistema Operativo</FormLabel>
                <FormControl>
                  <Input placeholder="Windows 11 Pro..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="red"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Conectado a red</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Compra */}
        <h4 className="text-sm font-medium text-muted-foreground">Compra</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="compradoPor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comprado Por</FormLabel>
                <FormControl>
                  <Input placeholder="Comprado por" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ordenCompra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Orden de Compra</FormLabel>
                <FormControl>
                  <Input placeholder="OC-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fechaCompra"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Compra</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="diasGarantia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dias de Garantia</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1095"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vencGarantia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vencimiento Garantia</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estado */}
        <h4 className="text-sm font-medium text-muted-foreground">Estado</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADO_EQUIPO.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estadoSecundario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado Secundario</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? 'DISPONIBLE'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado secundario" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADO_SECUNDARIO_EQUIPO.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="obsoleto"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Obsoleto</FormLabel>
              </FormItem>
            )}
          />
        </div>

        {/* Asignacion */}
        <h4 className="text-sm font-medium text-muted-foreground">Asignacion</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="empresaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                  value={field.value ?? '__none__'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {empresas?.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="colaboradorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Colaborador</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                  value={field.value ?? '__none__'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {colaboradoresData?.data?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.legajo} - {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select
                  onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                  value={field.value ?? '__none__'}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">Sin asignar</SelectItem>
                    {sitios?.map((s) => (
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
          <FormField
            control={form.control}
            name="principalSecundaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Principal / Secundaria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRINCIPAL_SECUNDARIA.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motivoAsignacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo Asignacion</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ''}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MOTIVO_ASIGNACION.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fechaAsignacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Asignacion</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notas */}
        <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
        <Separator />
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

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
