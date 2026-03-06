'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiDownload } from '@/lib/utils/api';

interface ExportButtonProps {
  onExport?: () => void | Promise<void>;
  /** API route for template-based export (takes priority over onExport) */
  exportUrl?: string;
  /** Fallback filename for API download */
  exportFilename?: string;
  label?: string;
}

export function ExportButton({
  onExport,
  exportUrl,
  exportFilename = 'export.xlsx',
  label = 'Exportar',
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (exportUrl) {
        await apiDownload(exportUrl, exportFilename);
        toast.success('Archivo exportado correctamente');
      } else if (onExport) {
        await onExport();
      }
    } catch (err) {
      toast.error((err as Error).message || 'Error al exportar');
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
