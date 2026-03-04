'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PERFIL_USUARIO } from '@/lib/utils/constants';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

// Dynamic schema: password required on create, optional on edit
function buildSchema(isEditing: boolean) {
  return z.object({
    username: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
    password: isEditing
      ? z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal(''))
      : z.string().min(8, 'Mínimo 8 caracteres'),
    perfil: z.enum(PERFIL_USUARIO, { message: 'Perfil inválido' }).default('SAZ'),
    nombre: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    activo: z.boolean().default(true),
  });
}

type UserFormValues = z.infer<ReturnType<typeof buildSchema>>;

interface UserFormProps {
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: UserFormValues) => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

export function UserForm({ defaultValues, onSubmit, isLoading, isEditing = false }: UserFormProps) {
  const schema = buildSchema(isEditing);

  const form = useForm<UserFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      username: '',
      password: '',
      perfil: 'SAZ',
      nombre: '',
      email: '',
      activo: true,
      ...(defaultValues as Partial<UserFormValues>),
      // Always clear password field on edit
      ...(isEditing ? { password: '' } : {}),
    },
  });

  const handleSubmit = (data: UserFormValues) => {
    // If editing and password is empty, remove it from payload
    if (isEditing && (!data.password || data.password === '')) {
      const { password: _, ...rest } = data;
      onSubmit(rest as UserFormValues);
    } else {
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="nombre.usuario" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={isEditing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="perfil"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Perfil</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar perfil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PERFIL_USUARIO.map((p) => (
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
            name="nombre"
            render={({ field }) => (
              <FormItem>
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
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="usuario@empresa.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="activo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-md border p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">Activo</FormLabel>
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
