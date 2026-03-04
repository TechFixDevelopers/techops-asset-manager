'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  onExport: () => void | Promise<void>;
  label?: string;
}

export function ExportButton({ onExport, label = 'Exportar' }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onExport();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={isLoading}>
      <Download className="size-4" />
      {isLoading ? 'Exportando...' : label}
    </Button>
  );
}
