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
import { createMonitorSchema, type CreateMonitorInput } from '@/lib/validations/monitor';
import { useSitios } from '@/lib/hooks/use-catalogos';

interface MonitorFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading?: boolean;
}

export function MonitorForm({ defaultValues, onSubmit, isLoading }: MonitorFormProps) {
  const { data: sitios = [] } = useSitios();

  const form = useForm<CreateMonitorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createMonitorSchema) as any,
    defaultValues: {
      serialNumber: '',
      marca: '',
      modelo: '',
      empresa: '',
      tipoMonitor: '',
      pulgadas: '',
      proveedor: '',
      ordenCompra: '',
      factura: '',
      compradoPor: '',
      comentarios: '',
      fechaCompra: '',
      vencGarantia: '',
      diasGarantia: 365,
      obsoleto: false,
      colaboradorId: null,
      sitioId: null,
      ...(defaultValues as Partial<CreateMonitorInput>),
    },
  });

  function handleSubmit(data: CreateMonitorInput) {
    // Convert empty strings to null for nullable UUID fields
    const cleaned: Record<string, unknown> = { ...data };
    const nullableFields = ['colaboradorId', 'sitioId'];
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
              name="serialNumber"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Numero de serie *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: CN0XYZ123" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input placeholder="Ej: DELL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modelo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: P2422H" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="empresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: AB InBev" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipoMonitor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de monitor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: LED" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pulgadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pulgadas</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Compra */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Compra</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="proveedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proveedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Dell Technologies" {...field} />
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
                  <FormLabel>Orden de compra</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: OC-2024-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="factura"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factura</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: A-0001-00012345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="compradoPor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comprado por</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: IT Argentina" {...field} />
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
            <FormField
              control={form.control}
              name="vencGarantia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vencimiento garantia</FormLabel>
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

        {/* Estado */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Estado</h3>
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

        <Separator />

        {/* Asignacion */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Asignacion</h3>
          <div className="grid grid-cols-2 gap-4">
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
