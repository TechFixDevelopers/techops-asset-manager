'use client';

import { Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';

export default function AsistentePage() {
  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <PageHeader
        title="Asistente Virtual"
        description="Consultas sobre gestiones y procesos de Field Support"
      />

      {/* Chat area */}
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-celeste/10">
            <Bot className="h-8 w-8 text-brand-celeste" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Asistente en Desarrollo</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              El asistente virtual esta en desarrollo. Proximamente podras consultar
              como realizar gestiones de Field Support, procesos de la web y politicas del area.
            </p>
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="mt-4 flex gap-2">
        <Input
          disabled
          placeholder="Esta funcion estara disponible proximamente..."
          className="flex-1"
        />
        <Button disabled>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
