import { z } from 'zod';
import { paginationSchema } from './common';

export const createCorteSchema = z.object({
  sitioId: z.string().uuid('Sitio requerido'),
  fechaCorte: z.string().optional(),
});

export type CreateCorteInput = z.infer<typeof createCorteSchema>;

export const searchCorteSchema = paginationSchema.extend({
  sitioId: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
  reconciliado: z.string().optional(),
});

export type SearchCorteParams = z.infer<typeof searchCorteSchema>;
