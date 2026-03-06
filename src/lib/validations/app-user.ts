import { z } from 'zod';
import { PERFIL_USUARIO } from '@/lib/utils/constants';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

const permisosSchema = z.object({
  modulosHabilitados: z.array(z.string()).optional(),
}).optional();

export const createAppUserSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  perfil: z.enum(PERFIL_USUARIO, { message: 'Perfil inválido' }).default('SAZ'),
  nombre: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  activo: z.boolean().default(true),
  permisos: permisosSchema,
});

// Update doesn't require password (optional change)
export const updateAppUserSchema = z.object({
  username: z.string().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres').optional(),
  password: z.string().min(8, 'Mínimo 8 caracteres').optional(),
  perfil: z.enum(PERFIL_USUARIO, { message: 'Perfil inválido' }).optional(),
  nombre: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  activo: z.boolean().optional(),
  permisos: permisosSchema,
});

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchAppUserSchema = paginationSchema.extend({
  perfil: z.string().optional(),
  activo: z.coerce.boolean().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type CreateAppUserInput = z.infer<typeof createAppUserSchema>;
export type UpdateAppUserInput = z.infer<typeof updateAppUserSchema>;
export type SearchAppUserParams = z.infer<typeof searchAppUserSchema>;
