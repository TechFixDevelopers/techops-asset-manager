import { z } from 'zod';
import {
  TIPO_CELULAR,
  MARCA_CELULAR,
  ESTADO_EQUIPO,
  ESTADO_SECUNDARIO_EQUIPO,
} from '@/lib/utils/constants';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

export const createCelularSchema = z.object({
  // Required fields
  imei: z.string().min(1, 'IMEI requerido'),
  tipo: z.enum(TIPO_CELULAR, { message: 'Tipo de celular inválido' }),
  marca: z.enum(MARCA_CELULAR, { message: 'Marca inválida' }),
  modelo: z.string().min(1, 'Modelo requerido'),

  // Optional string fields
  proveedor: z.string().optional(),
  plan: z.string().optional(),
  principalSecundaria: z.string().optional(),
  motivoAsignacion: z.string().optional(),
  condicion: z.string().optional(),
  comentarios: z.string().max(2000, 'Máximo 2000 caracteres').optional(),

  // Optional date fields (ISO strings)
  fechaCompra: z.string().optional(),
  fechaAsignacion: z.string().optional(),

  // Optional number fields
  diasGarantia: z.coerce.number().int().default(365),

  // Boolean fields
  obsoleto: z.boolean().default(false),
  poseeCargador: z.boolean().default(true),

  // Estado fields with defaults (same states as equipos)
  estado: z.enum(ESTADO_EQUIPO, { message: 'Estado inválido' }).default('STOCK'),
  estadoSecundario: z.enum(ESTADO_SECUNDARIO_EQUIPO, { message: 'Estado secundario inválido' }).default('DISPONIBLE'),

  // UUIDs (nullable)
  empresaId: z.string().uuid('Empresa ID inválido').nullable().optional(),
  colaboradorId: z.string().uuid('Colaborador ID inválido').nullable().optional(),
  lineaId: z.string().uuid('Línea ID inválido').nullable().optional(),
  sitioId: z.string().uuid('Sitio ID inválido').nullable().optional(),
});

export const updateCelularSchema = createCelularSchema.partial();

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchCelularSchema = paginationSchema.extend({
  tipo: z.string().optional(),
  marca: z.string().optional(),
  estado: z.string().optional(),
  sitioId: z.string().uuid().optional(),
  empresaId: z.string().uuid().optional(),
  obsoleto: z.coerce.boolean().optional(),
});

// ============================================================
// Inferred Types
// ============================================================

export type CreateCelularInput = z.infer<typeof createCelularSchema>;
export type UpdateCelularInput = z.infer<typeof updateCelularSchema>;
export type SearchCelularParams = z.infer<typeof searchCelularSchema>;
