import { Badge } from '@/components/ui/badge';
import { ESTADO_COLORS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const DEFAULT_COLORS = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClasses = ESTADO_COLORS[status] ?? DEFAULT_COLORS;

  return (
    <Badge
      variant="outline"
      className={cn('border-transparent', colorClasses, className)}
    >
      {status}
    </Badge>
  );
}
