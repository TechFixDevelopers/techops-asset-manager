import { z } from 'zod';

export const createWikiPageSchema = z.object({
  titulo: z.string().min(1, 'Titulo requerido').max(200),
  slug: z.string().min(1, 'Slug requerido').max(200).regex(/^[a-z0-9-]+$/, 'Solo letras minusculas, numeros y guiones'),
  contenido: z.string().min(1, 'Contenido requerido'),
  categoria: z.string().min(1, 'Categoria requerida'),
  orden: z.number().int().default(0),
  activo: z.boolean().default(true),
});

export const updateWikiPageSchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  contenido: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
  orden: z.number().int().optional(),
  activo: z.boolean().optional(),
});

export type CreateWikiPageInput = z.infer<typeof createWikiPageSchema>;
export type UpdateWikiPageInput = z.infer<typeof updateWikiPageSchema>;
