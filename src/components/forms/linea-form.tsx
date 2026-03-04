'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createLineaSchema,
  type CreateLineaInput,
} from '@/lib/validations/linea';
import { PROVEEDOR_CELULAR } from '@/lib/utils/constants';
import { useSitios } from '@/lib/hooks/use-catalogos';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const TIPO_LINEA = ['CORPORATIVA', 'PERSONAL', 'DATOS', 'INTRAGRUPO'] as const;
const ESTADO_LINEA = ['ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'BAJA'] as const;

interface LineaFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: CreateLineaInput) => void;
  isLoading?: boolean;
}

export function LineaForm({ defaultValues, onSubmit, isLoading }: LineaFormProps) {
  const { data: sitios } = useSitios();

  const form = useForm<CreateLineaInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createLineaSchema) as any,
    defaultValues: {
      numero: '',
      tipoLinea: '',
      proveedor: '',
      plan: '',
      sitioId: null,
      estado: 'ACTIVA',
      comentarios: '',
      ...(defaultValues as Partial<CreateLineaInput>),
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
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Línea</FormLabel>
                <FormControl>
                  <Input placeholder="Ej: 1122334455" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipoLinea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Línea</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIPO_LINEA.map((t) => (
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
            name="proveedor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVEEDOR_CELULAR.map((p) => (
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
            name="plan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan</FormLabel>
                <FormControl>
                  <Input placeholder="Plan de la línea" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ubicacion y Estado */}
        <h4 className="text-sm font-medium text-muted-foreground">Ubicacion y Estado</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
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
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? 'ACTIVA'}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ESTADO_LINEA.map((e) => (
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
