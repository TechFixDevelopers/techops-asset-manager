import { z } from 'zod';

export const createReparacionSchema = z.object({
  tipoTarea: z.string().min(1, 'Tipo de tarea requerido'),
  tipoEquipo: z.string().optional(),
  reparacionesRealizadas: z.array(z.string()).default([]),
  descripcion: z.string().optional(),
  colaboradorId: z.string().uuid().optional().nullable(),
  equipoRef: z.string().optional(),
  sitioId: z.string().uuid().optional().nullable(),
  ticketSnow: z.string().optional(),
  estado: z.string().default('ABIERTA'),
});

export const updateReparacionSchema = z.object({
  tipoTarea: z.string().min(1).optional(),
  tipoEquipo: z.string().optional(),
  reparacionesRealizadas: z.array(z.string()).optional(),
  descripcion: z.string().optional(),
  colaboradorId: z.string().uuid().optional().nullable(),
  equipoRef: z.string().optional(),
  sitioId: z.string().uuid().optional().nullable(),
  ticketSnow: z.string().optional(),
  estado: z.string().optional(),
});

export type CreateReparacionInput = z.infer<typeof createReparacionSchema>;
export type UpdateReparacionInput = z.infer<typeof updateReparacionSchema>;
