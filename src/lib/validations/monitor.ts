import { z } from 'zod';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

export const createMonitorSchema = z.object({
  // Required fields
  serialNumber: z.string().min(1, 'Número de serie requerido'),
  marca: z.string().min(1, 'Marca requerida'),
  modelo: z.string().min(1, 'Modelo requerido'),

  // Optional string fields
  empresa: z.string().optional(),
  tipoMonitor: z.string().optional(),
  pulgadas: z.string().optional(),
  proveedor: z.string().optional(),
  ordenCompra: z.string().optional(),
  factura: z.string().optional(),
  compradoPor: z.string().optional(),
  comentarios: z.string().max(2000, 'Máximo 2000 caracteres').optional(),

  // Optional date fields (ISO strings)
  fechaCompra: z.string().optional(),
  vencGarantia: z.string().optional(),

  // Optional number fields
  diasGarantia: z.coerce.number().int().default(365),

  // Boolean fields
  obsoleto: z.boolean().default(false),

  // UUIDs (nullable)
  colaboradorId: z.string().uuid('Colaborador ID inválido').nullable().optional(),
  sitioId: z.string().uuid('Sitio ID inválido').nullable().optional(),
});

export const updateMonitorSchema = createMonitorSchema.partial();

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchMonitorSchema = paginationSchema.extend({
  marca: z.string().optional(),
  sitioId: z.string().uuid().optional(),
  obsoleto: z.coerce.boolean().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type CreateMonitorInput = z.infer<typeof createMonitorSchema>;
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>;
export type SearchMonitorParams = z.infer<typeof searchMonitorSchema>;
