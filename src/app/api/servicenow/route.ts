import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/api-guard';
import {
  getServiceNowMode,
  createIncidentAPI,
  generateClipboardResult,
} from '@/lib/services/servicenow';

const snowTicketSchema = z.object({
  callerLegajo: z.string().min(1),
  callerName: z.string().min(1),
  assignmentGroup: z.string().min(1),
  shortDescription: z.string().min(1).max(200),
  description: z.string().min(1).max(4000),
  symptom: z.string().min(1),
  contactType: z.string().min(1),
  impact: z.string().min(1),
  urgency: z.string().min(1),
  category: z.string().min(1),
  zone: z.string().min(1),
  location: z.string().min(1),
});

type SnowTicketInput = z.infer<typeof snowTicketSchema>;

export const POST = withAuth<SnowTicketInput>('create', 'tickets', async (_req, _session, data) => {
  if (!data) {
    return NextResponse.json({ error: 'Datos requeridos' }, { status: 400 });
  }

  const mode = getServiceNowMode();

  if (mode === 'api') {
    try {
      const result = await createIncidentAPI(data);
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return NextResponse.json(
        { error: `Error al crear incidente: ${message}`, fallback: generateClipboardResult(data) },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(generateClipboardResult(data));
}, { schema: snowTicketSchema });
