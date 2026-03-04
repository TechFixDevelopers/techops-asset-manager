'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColaboradorSchema,
  type CreateColaboradorInput,
} from '@/lib/validations/colaborador';
import { useEmpresas, useSitios } from '@/lib/hooks/use-catalogos';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ColaboradorFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: CreateColaboradorInput) => void;
  isLoading?: boolean;
}

export function ColaboradorForm({ defaultValues, onSubmit, isLoading }: ColaboradorFormProps) {
  const { data: empresas } = useEmpresas();
  const { data: sitios } = useSitios();

  const form = useForm<CreateColaboradorInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createColaboradorSchema) as any,
    defaultValues: {
      globalId: '',
      legajo: '',
      nombre: '',
      email: '',
      businessTitle: '',
      band: '',
      costCenterId: '',
      costCenterDesc: '',
      positionId: '',
      positionName: '',
      managerName: '',
      managerId: '',
      area: '',
      subArea: '',
      pais: 'Argentina',
      regional: '',
      hrbp: '',
      collar: '',
      hireDate: '',
      status: 'Active',
      empresaId: null,
      sitioId: null,
      ...(defaultValues as Partial<CreateColaboradorInput>),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Personal */}
        <h4 className="text-sm font-medium text-muted-foreground">Personal</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="globalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Global ID</FormLabel>
                <FormControl>
                  <Input placeholder="Global ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="legajo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legajo</FormLabel>
                <FormControl>
                  <Input placeholder="Legajo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Organizacional */}
        <h4 className="text-sm font-medium text-muted-foreground">Organizacional</h4>
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
            name="businessTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Title</FormLabel>
                <FormControl>
                  <Input placeholder="Business Title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="band"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Band</FormLabel>
                <FormControl>
                  <Input placeholder="Band" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costCenterId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost Center ID</FormLabel>
                <FormControl>
                  <Input placeholder="Cost Center ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="costCenterDesc"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Cost Center Desc.</FormLabel>
                <FormControl>
                  <Input placeholder="Descripcion del Cost Center" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Posicion */}
        <h4 className="text-sm font-medium text-muted-foreground">Posicion</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position ID</FormLabel>
                <FormControl>
                  <Input placeholder="Position ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="positionName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position Name</FormLabel>
                <FormControl>
                  <Input placeholder="Position Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="managerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager Name</FormLabel>
                <FormControl>
                  <Input placeholder="Manager Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="managerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manager ID</FormLabel>
                <FormControl>
                  <Input placeholder="Manager ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Ubicacion */}
        <h4 className="text-sm font-medium text-muted-foreground">Ubicacion</h4>
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
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area</FormLabel>
                <FormControl>
                  <Input placeholder="Area" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Area</FormLabel>
                <FormControl>
                  <Input placeholder="Sub Area" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pais</FormLabel>
                <FormControl>
                  <Input placeholder="Pais" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="regional"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regional</FormLabel>
                <FormControl>
                  <Input placeholder="Regional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* HR */}
        <h4 className="text-sm font-medium text-muted-foreground">HR</h4>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="hireDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de ingreso</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Leave">Leave</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="collar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Collar</FormLabel>
                <FormControl>
                  <Input placeholder="Collar" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hrbp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>HRBP</FormLabel>
                <FormControl>
                  <Input placeholder="HRBP" {...field} />
                </FormControl>
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
