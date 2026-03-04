import { z } from 'zod';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

export const createLineaSchema = z.object({
  numero: z.string().min(1, 'Número de línea requerido'),
  tipoLinea: z.string().optional(),
  proveedor: z.string().optional(),
  plan: z.string().optional(),
  sitioId: z.string().uuid('Sitio ID inválido').nullable().optional(),
  estado: z.string().default('ACTIVA'),
  comentarios: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
});

export const updateLineaSchema = createLineaSchema.partial();

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchLineaSchema = paginationSchema.extend({
  proveedor: z.string().optional(),
  estado: z.string().optional(),
  sitioId: z.string().uuid().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type CreateLineaInput = z.infer<typeof createLineaSchema>;
export type UpdateLineaInput = z.infer<typeof updateLineaSchema>;
export type SearchLineaParams = z.infer<typeof searchLineaSchema>;
