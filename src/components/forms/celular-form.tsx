'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createCelularSchema, type CreateCelularInput } from '@/lib/validations/celular';
import {
  TIPO_CELULAR,
  MARCA_CELULAR,
  ESTADO_EQUIPO,
  ESTADO_SECUNDARIO_EQUIPO,
} from '@/lib/utils/constants';
import { useEmpresas, useSitios } from '@/lib/hooks/use-catalogos';

interface CelularFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export function CelularForm({ defaultValues, onSubmit, isLoading }: CelularFormProps) {
  const { data: empresas = [] } = useEmpresas();
  const { data: sitios = [] } = useSitios();

  const form = useForm<CreateCelularInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createCelularSchema) as any,
    defaultValues: {
      imei: '',
      tipo: 'CELULAR',
      marca: 'SAMSUNG',
      modelo: '',
      proveedor: '',
      plan: '',
      condicion: '',
      principalSecundaria: '',
      motivoAsignacion: '',
      comentarios: '',
      fechaCompra: '',
      fechaAsignacion: '',
      diasGarantia: 365,
      obsoleto: false,
      poseeCargador: true,
      estado: 'STOCK',
      estadoSecundario: 'DISPONIBLE',
      empresaId: null,
      colaboradorId: null,
      lineaId: null,
      sitioId: null,
      ...(defaultValues as Partial<CreateCelularInput>),
    },
  });

  function handleSubmit(data: CreateCelularInput) {
    // Convert empty strings to null for nullable UUID fields
    const cleaned: Record<string, unknown> = { ...data };
    const nullableFields = ['empresaId', 'colaboradorId', 'lineaId', 'sitioId'];
    for (const field of nullableFields) {
      if (cleaned[field] === '' || cleaned[field] === undefined) {
        cleaned[field] = null;
      }
    }
    onSubmit(cleaned);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Identificacion */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Identificacion</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="imei"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>IMEI *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 356789012345678" {...field} />
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
                  <FormLabel>Tipo *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPO_CELULAR.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
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
                  <FormLabel>Marca *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MARCA_CELULAR.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
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
                <FormItem className="col-span-2">
                  <FormLabel>Modelo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Galaxy S24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Detalles */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Detalles</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="proveedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Claro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: DATOS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condicion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condicion</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Nuevo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-end gap-6">
              <FormField
                control={form.control}
                name="poseeCargador"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Posee cargador</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="obsoleto"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Obsoleto</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Compra */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Compra</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fechaCompra"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de compra</FormLabel>
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
                  <FormLabel>Dias de garantia</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Estado */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Estado</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADO_EQUIPO.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
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
                  <FormLabel>Estado secundario</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTADO_SECUNDARIO_EQUIPO.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Asignacion */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Asignacion</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="empresaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === '' ? null : val)}
                    defaultValue={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {empresas.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.nombre}</SelectItem>
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
                  <FormLabel>Colaborador ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="UUID del colaborador"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lineaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linea ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="UUID de la linea"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
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
                  <Select
                    onValueChange={(val) => field.onChange(val === '' ? null : val)}
                    defaultValue={field.value ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sin asignar</SelectItem>
                      {sitios.map((s) => (
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
              name="principalSecundaria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principal / Secundaria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Principal" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="motivoAsignacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo de asignacion</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Nueva Posicion" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechaAsignacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de asignacion</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Notas */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Notas</h3>
          <FormField
            control={form.control}
            name="comentarios"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comentarios</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas adicionales..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
