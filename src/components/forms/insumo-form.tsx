'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createInsumoSchema, type CreateInsumoInput } from '@/lib/validations/insumo';
import { TIPO_INSUMO } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface InsumoFormProps {
  defaultValues?: Partial<CreateInsumoInput>;
  onSubmit: (data: CreateInsumoInput) => void;
  isLoading?: boolean;
}

export function InsumoForm({ defaultValues, onSubmit, isLoading }: InsumoFormProps) {
  const form = useForm<CreateInsumoInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInsumoSchema) as any,
    defaultValues: {
      nombre: '',
      tipoInsumo: undefined,
      serialInsumo: '',
      ordenCompra: '',
      areaCompra: '',
      fechaCompra: '',
      cantidadMin: 5,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* General Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">General</h3>
          <Separator className="my-2" />
          <div className="space-y-4">
            <FormField control={form.control} name="nombre" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del insumo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="tipoInsumo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Insumo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPO_INSUMO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="serialInsumo" render={({ field }) => (
              <FormItem>
                <FormLabel>Serial</FormLabel>
                <FormControl>
                  <Input placeholder="Serial del insumo (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Compra Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Compra</h3>
          <Separator className="my-2" />
          <div className="space-y-4">
            <FormField control={form.control} name="ordenCompra" render={({ field }) => (
              <FormItem>
                <FormLabel>Orden de Compra</FormLabel>
                <FormControl>
                  <Input placeholder="N. de orden de compra" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="fechaCompra" render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Compra</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="areaCompra" render={({ field }) => (
              <FormItem>
                <FormLabel>Area de Compra</FormLabel>
                <FormControl>
                  <Input placeholder="Area solicitante" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        {/* Stock Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Stock</h3>
          <Separator className="my-2" />
          <div className="space-y-4">
            <FormField control={form.control} name="cantidadMin" render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad Minima</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="5"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Insumo'}
        </Button>
      </form>
    </Form>
  );
}
