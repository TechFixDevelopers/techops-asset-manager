import { z } from 'zod';

export const createLinkSchema = z.object({
  titulo: z.string().min(1, 'Titulo requerido').max(200),
  url: z.string().url('URL invalida'),
  descripcion: z.string().optional(),
  categoria: z.string().min(1, 'Categoria requerida'),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export const updateLinkSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  url: z.string().url().optional(),
  descripcion: z.string().optional(),
  categoria: z.string().min(1).optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
