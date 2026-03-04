import { z } from 'zod';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

export const createColaboradorSchema = z.object({
  // Required fields
  globalId: z.string().min(1, 'Global ID requerido'),
  legajo: z.string().min(1, 'Legajo requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),

  // Optional string fields
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  businessTitle: z.string().optional(),
  band: z.string().optional(),
  costCenterId: z.string().optional(),
  costCenterDesc: z.string().optional(),
  positionId: z.string().optional(),
  positionName: z.string().optional(),
  managerName: z.string().optional(),
  managerId: z.string().optional(),
  area: z.string().optional(),
  subArea: z.string().optional(),
  groupedUnity: z.string().optional(),
  unity: z.string().optional(),
  pais: z.string().default('Argentina'),
  regional: z.string().optional(),
  hrbp: z.string().optional(),
  collar: z.string().optional(),

  // Optional UUIDs (nullable)
  empresaId: z.string().uuid('Empresa ID inválido').nullable().optional(),
  sitioId: z.string().uuid('Sitio ID inválido').nullable().optional(),

  // Optional date
  hireDate: z.string().optional(),

  // Status with default
  status: z.string().default('Active'),
});

export const updateColaboradorSchema = createColaboradorSchema.partial();

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchColaboradorSchema = paginationSchema.extend({
  status: z.string().optional(),
  empresaId: z.string().uuid().optional(),
  sitioId: z.string().uuid().optional(),
  area: z.string().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type CreateColaboradorInput = z.infer<typeof createColaboradorSchema>;
export type UpdateColaboradorInput = z.infer<typeof updateColaboradorSchema>;
export type SearchColaboradorParams = z.infer<typeof searchColaboradorSchema>;
