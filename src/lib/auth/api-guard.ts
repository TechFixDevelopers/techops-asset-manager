import { NextRequest, NextResponse } from 'next/server';
import { Session } from 'next-auth';
import { ZodType } from 'zod';
import { requirePermission, Action, Resource } from './permissions';
import { validateCsrf } from '@/lib/middleware/csrf';
import { rateLimit } from '@/lib/middleware/rate-limit';

interface WithAuthOptions<T> {
  schema?: ZodType<T>;
  rateLimit?: { limit: number; windowMs: number };
  skipCsrf?: boolean;
}

const WRITE_METHODS = ['POST', 'PATCH', 'PUT', 'DELETE'];

export function withAuth<T = unknown>(
  action: Action,
  resource: Resource,
  handler: (req: NextRequest, session: Session, body?: T) => Promise<NextResponse>,
  options?: WithAuthOptions<T>,
) {
  return async (req: NextRequest) => {
    try {
      // 1. Rate limiting
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
      const isWrite = WRITE_METHODS.includes(req.method);
      const rlConfig = options?.rateLimit ?? {
        limit: isWrite ? 30 : 100,
        windowMs: 15 * 60 * 1000,
      };
      const rlResult = rateLimit(`${ip}:${resource}:${action}`, rlConfig.limit, rlConfig.windowMs);
      if (!rlResult.allowed) {
        return NextResponse.json(
          { error: 'Demasiadas solicitudes. Intente más tarde.' },
          { status: 429, headers: { 'Retry-After': '60' } },
        );
      }

      // 2. CSRF validation (for mutating methods)
      if (!options?.skipCsrf && !validateCsrf(req)) {
        return NextResponse.json({ error: 'Validación CSRF fallida' }, { status: 403 });
      }

      // 3. Auth + permissions
      const session = await requirePermission(action, resource);

      // 4. Body parsing + Zod validation (if schema provided)
      let body: T | undefined;
      if (options?.schema && isWrite) {
        const rawBody = await req.json().catch(() => null);
        if (!rawBody) {
          return NextResponse.json({ error: 'Body requerido' }, { status: 400 });
        }
        const parsed = options.schema.safeParse(rawBody);
        if (!parsed.success) {
          return NextResponse.json(
            { error: 'Datos inválidos', details: parsed.error.issues },
            { status: 400 },
          );
        }
        body = parsed.data;
      }

      // 5. Execute handler
      return handler(req, session, body);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'UNAUTHORIZED') {
          return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }
        if (error.message === 'FORBIDDEN') {
          return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
        }
      }
      console.error(`API error [${resource}/${action}]:`, error);
      return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
  };
}
