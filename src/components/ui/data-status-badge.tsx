import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataStatusBadgeProps {
  hasData: boolean;
  lastUpdated?: string | null;
  completeness?: number;
  className?: string;
  variant?: 'default' | 'compact';
}

export const DataStatusBadge = ({
  hasData,
  lastUpdated,
  completeness = 0,
  className,
  variant = 'default'
}: DataStatusBadgeProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'hace 1 día';
    if (diffDays < 30) return `hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusConfig = () => {
    if (!hasData) {
      return {
        icon: Database,
        text: 'Sin Datos',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/20 border-muted-foreground/20'
      };
    }

    if (completeness < 50) {
      return {
        icon: AlertCircle,
        text: variant === 'compact' ? 'Incompleto' : 'Datos Incompletos',
        color: 'text-warning-foreground',
        bgColor: 'bg-warning/10 border-warning/30'
      };
    }

    return {
      icon: CheckCircle,
      text: variant === 'compact' ? 'Datos Reales' : 'Datos Verificados',
      color: 'text-success-foreground',
      bgColor: 'bg-success/10 border-success/30'
    };
  };

  const status = getStatusConfig();
  const Icon = status.icon;

  if (variant === 'compact') {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          status.bgColor,
          status.color,
          'border',
          className
        )}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status.text}
      </Badge>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2 text-sm',
      className
    )}>
      <Badge 
        variant="outline" 
        className={cn(
          status.bgColor,
          status.color,
          'border'
        )}
      >
        <Icon className="h-3 w-3 mr-1" />
        {status.text}
      </Badge>
      
      {hasData && lastUpdated && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="text-xs">
            {formatDate(lastUpdated)}
          </span>
        </div>
      )}
      
      {hasData && completeness > 0 && (
        <div className="text-xs text-muted-foreground">
          {completeness.toFixed(0)}% completo
        </div>
      )}
    </div>
  );
};