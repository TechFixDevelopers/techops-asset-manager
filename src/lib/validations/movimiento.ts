import { z } from 'zod';
import { TIPO_MOVIMIENTO, ESTADO_DEVOLUCION } from '@/lib/utils/constants';
import { paginationSchema } from './common';

export const createMovimientoSchema = z.object({
  tipo: z.enum(TIPO_MOVIMIENTO, { message: 'Tipo de movimiento inválido' }),
  colaboradorId: z.string().uuid('UUID inválido').nullable().optional(),
  equipoId: z.string().uuid('UUID inválido').nullable().optional(),
  celularId: z.string().uuid('UUID inválido').nullable().optional(),
  insumoId: z.string().uuid('UUID inválido').nullable().optional(),
  monitorId: z.string().uuid('UUID inválido').nullable().optional(),
  sitioId: z.string().uuid('UUID inválido').nullable().optional(),
  motivo: z.string().max(500).optional(),
  estadoNuevo: z.string().optional(),
  cantidad: z.coerce.number().int().positive('Cantidad debe ser mayor a 0').optional(),
  comentarios: z.string().max(2000).optional(),
  ticketSnow: z.string().max(50).optional(),
}).superRefine((data, ctx) => {
  switch (data.tipo) {
    case 'ASIGNACION_PC':
      if (!data.equipoId) ctx.addIssue({ code: 'custom', path: ['equipoId'], message: 'Equipo requerido para asignación' });
      if (!data.colaboradorId) ctx.addIssue({ code: 'custom', path: ['colaboradorId'], message: 'Colaborador requerido para asignación' });
      if (!data.sitioId) ctx.addIssue({ code: 'custom', path: ['sitioId'], message: 'Sitio requerido para asignación' });
      break;
    case 'DEVOLUCION_PC':
      if (!data.equipoId) ctx.addIssue({ code: 'custom', path: ['equipoId'], message: 'Equipo requerido para devolución' });
      if (!data.estadoNuevo) ctx.addIssue({ code: 'custom', path: ['estadoNuevo'], message: 'Estado de devolución requerido' });
      break;
    case 'ASIGNACION_CEL':
      if (!data.celularId) ctx.addIssue({ code: 'custom', path: ['celularId'], message: 'Celular requerido para asignación' });
      if (!data.colaboradorId) ctx.addIssue({ code: 'custom', path: ['colaboradorId'], message: 'Colaborador requerido para asignación' });
      if (!data.sitioId) ctx.addIssue({ code: 'custom', path: ['sitioId'], message: 'Sitio requerido para asignación' });
      break;
    case 'DEVOLUCION_CEL':
      if (!data.celularId) ctx.addIssue({ code: 'custom', path: ['celularId'], message: 'Celular requerido para devolución' });
      if (!data.estadoNuevo) ctx.addIssue({ code: 'custom', path: ['estadoNuevo'], message: 'Estado de devolución requerido' });
      break;
    case 'ENTREGA_INSUMO':
      if (!data.insumoId) ctx.addIssue({ code: 'custom', path: ['insumoId'], message: 'Insumo requerido' });
      if (!data.sitioId) ctx.addIssue({ code: 'custom', path: ['sitioId'], message: 'Sitio requerido' });
      if (!data.cantidad || data.cantidad < 1) ctx.addIssue({ code: 'custom', path: ['cantidad'], message: 'Cantidad requerida (mayor a 0)' });
      break;
    case 'TRANSFERENCIA':
      if (!data.equipoId && !data.celularId && !data.monitorId) {
        ctx.addIssue({ code: 'custom', path: ['equipoId'], message: 'Seleccione un activo para transferir' });
      }
      if (!data.colaboradorId) ctx.addIssue({ code: 'custom', path: ['colaboradorId'], message: 'Colaborador destino requerido' });
      break;
  }
});

export type CreateMovimientoInput = z.infer<typeof createMovimientoSchema>;

export const searchMovimientoSchema = paginationSchema.extend({
  tipo: z.string().optional(),
  colaboradorId: z.string().uuid().optional(),
  equipoId: z.string().uuid().optional(),
  celularId: z.string().uuid().optional(),
  insumoId: z.string().uuid().optional(),
  monitorId: z.string().uuid().optional(),
  sitioId: z.string().uuid().optional(),
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

export type SearchMovimientoParams = z.infer<typeof searchMovimientoSchema>;

export { ESTADO_DEVOLUCION };
