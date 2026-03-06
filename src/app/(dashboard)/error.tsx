'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <CardTitle className="mt-4">Ocurrió un error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {error.message === 'UNAUTHORIZED'
              ? 'Su sesión expiró. Por favor inicie sesión nuevamente.'
              : error.message === 'FORBIDDEN'
                ? 'No tiene permisos para acceder a este recurso.'
                : 'Ocurrió un error inesperado al cargar esta página.'}
          </p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Volver
            </Button>
            <Button onClick={reset}>Reintentar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
