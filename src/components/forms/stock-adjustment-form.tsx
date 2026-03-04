'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustSchema, type StockAdjustInput } from '@/lib/validations/insumo';
import { useSitios } from '@/lib/hooks/use-catalogos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StockAdjustmentFormProps {
  insumoId: string;
  onSubmit: (data: StockAdjustInput) => void;
  isLoading?: boolean;
}

export function StockAdjustmentForm({ insumoId, onSubmit, isLoading }: StockAdjustmentFormProps) {
  const { data: sitios } = useSitios();
  const form = useForm<StockAdjustInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(stockAdjustSchema) as any,
    defaultValues: {
      insumoId,
      sitioId: '',
      cantidad: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="sitioId" render={({ field }) => (
          <FormItem>
            <FormLabel>Sitio</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Seleccionar sitio" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {sitios?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cantidad" render={({ field }) => (
          <FormItem>
            <FormLabel>Cantidad (+ para agregar, - para quitar)</FormLabel>
            <FormControl>
              <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Ajustando...' : 'Ajustar Stock'}
        </Button>
      </form>
    </Form>
  );
}
