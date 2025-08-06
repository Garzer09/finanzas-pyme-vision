import React from 'react';
import { AlertCircle, Database, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NoDataIndicatorProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'minimal' | 'detailed';
  className?: string;
}

export const NoDataIndicator: React.FC<NoDataIndicatorProps> = ({
  title = "Sin datos disponibles",
  description = "No se han encontrado datos para mostrar en este momento.",
  icon,
  actionLabel,
  onAction,
  variant = 'default',
  className = ""
}) => {
  const defaultIcon = <Database className="h-12 w-12 text-muted-foreground/50" />;
  
  if (variant === 'minimal') {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
        <div className="text-muted-foreground/60 mb-2">
          {icon || <AlertCircle className="h-6 w-6" />}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted/50 p-4 mb-4">
            {icon || defaultIcon}
          </div>
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      <div className="rounded-full bg-muted/30 p-6 mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium mb-2 text-muted-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground/80 mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};