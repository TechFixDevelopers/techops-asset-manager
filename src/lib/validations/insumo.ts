import { z } from 'zod';
import { TIPO_INSUMO } from '@/lib/utils/constants';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

export const createInsumoSchema = z.object({
  // Required fields
  nombre: z.string().min(1, 'Nombre requerido'),
  tipoInsumo: z.enum(TIPO_INSUMO, { message: 'Tipo de insumo inválido' }),

  // Optional string fields
  serialInsumo: z.string().optional(),
  ordenCompra: z.string().optional(),
  areaCompra: z.string().optional(),

  // Optional date field (ISO string)
  fechaCompra: z.string().optional(),

  // Optional number fields
  cantidadMin: z.coerce.number().int().default(5),
});

export const updateInsumoSchema = createInsumoSchema.partial();

// ============================================================
// Stock Adjustment Schema
// ============================================================

export const stockAdjustSchema = z.object({
  insumoId: z.string().uuid('Insumo ID inválido'),
  sitioId: z.string().uuid('Sitio ID inválido'),
  cantidad: z.coerce.number().int('Cantidad debe ser un número entero'),
});

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchInsumoSchema = paginationSchema.extend({
  tipoInsumo: z.string().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type CreateInsumoInput = z.infer<typeof createInsumoSchema>;
export type UpdateInsumoInput = z.infer<typeof updateInsumoSchema>;
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;
export type SearchInsumoParams = z.infer<typeof searchInsumoSchema>;
