import { z } from 'zod';
import {
  TIPO_EQUIPO,
  MARCA_EQUIPO,
  ESTADO_EQUIPO,
  ESTADO_SECUNDARIO_EQUIPO,
} from '@/lib/utils/constants';
import { paginationSchema } from './common';

// ============================================================
// Create / Update Schemas
// ============================================================

export const createEquipoSchema = z.object({
  // Required fields
  serialNumber: z.string().min(1, 'Número de serie requerido'),
  tipo: z.enum(TIPO_EQUIPO, { message: 'Tipo de equipo inválido' }),
  marca: z.enum(MARCA_EQUIPO, { message: 'Marca inválida' }),
  modelo: z.string().min(1, 'Modelo requerido'),

  // Optional string fields
  hostname: z.string().optional(),
  procesador: z.string().optional(),
  memoria: z.string().optional(),
  tipoDisco: z.string().optional(),
  tamanoDisco: z.string().optional(),
  sistemaOperativo: z.string().optional(),
  compradoPor: z.string().optional(),
  ordenCompra: z.string().optional(),
  comentarios: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  principalSecundaria: z.string().optional(),
  motivoAsignacion: z.string().optional(),

  // Optional date fields (ISO strings)
  fechaCompra: z.string().optional(),
  vencGarantia: z.string().optional(),
  fechaAsignacion: z.string().optional(),

  // Optional number fields
  diasGarantia: z.coerce.number().int().default(1095),

  // Boolean fields
  obsoleto: z.boolean().default(false),
  red: z.boolean().optional(),

  // Estado fields with defaults
  estado: z.enum(ESTADO_EQUIPO, { message: 'Estado inválido' }).default('STOCK'),
  estadoSecundario: z.enum(ESTADO_SECUNDARIO_EQUIPO, { message: 'Estado secundario inválido' }).default('DISPONIBLE'),

  // UUIDs (nullable)
  empresaId: z.string().uuid('Empresa ID inválido').nullable().optional(),
  colaboradorId: z.string().uuid('Colaborador ID inválido').nullable().optional(),
  sitioId: z.string().uuid('Sitio ID inválido').nullable().optional(),
});

export const updateEquipoSchema = createEquipoSchema.partial();

// ============================================================
// Search / Filter Schema
// ============================================================

export const searchEquipoSchema = paginationSchema.extend({
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

export type CreateEquipoInput = z.infer<typeof createEquipoSchema>;
export type UpdateEquipoInput = z.infer<typeof updateEquipoSchema>;
export type SearchEquipoParams = z.infer<typeof searchEquipoSchema>;
