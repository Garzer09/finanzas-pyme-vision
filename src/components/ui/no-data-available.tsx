import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, AlertCircle, FileText, Building } from 'lucide-react';

interface NoDataAvailableProps {
  title?: string;
  description?: string;
  type?: 'upload' | 'empty' | 'error' | 'permission';
  actionText?: string;
  onAction?: () => void;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const NoDataAvailable: React.FC<NoDataAvailableProps> = ({
  title,
  description,
  type = 'empty',
  actionText,
  onAction,
  showIcon = true,
  size = 'md'
}) => {
  const getIcon = () => {
    switch (type) {
      case 'upload':
        return Upload;
      case 'error':
        return AlertCircle;
      case 'permission':
        return Building;
      default:
        return FileText;
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'upload':
        return {
          title: 'Sin datos financieros',
          description: 'Carga un archivo Excel o CSV para visualizar los datos financieros de la empresa.',
          actionText: 'Cargar Datos'
        };
      case 'error':
        return {
          title: 'Error al cargar datos',
          description: 'No se pudieron cargar los datos. Inténtalo de nuevo más tarde.',
          actionText: 'Reintentar'
        };
      case 'permission':
        return {
          title: 'Sin acceso',
          description: 'No tienes permisos para acceder a estos datos.',
          actionText: null
        };
      default:
        return {
          title: 'No hay datos disponibles',
          description: 'Actualmente no hay información para mostrar en esta sección.',
          actionText: null
        };
    }
  };

  const defaultContent = getDefaultContent();
  const IconComponent = getIcon();
  
  const sizeClasses = {
    sm: 'py-6',
    md: 'py-8',
    lg: 'py-12'
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12'
  };

  return (
    <Card className="border-dashed border-2 border-muted">
      <CardContent className={`flex flex-col items-center justify-center text-center ${sizeClasses[size]}`}>
        {showIcon && (
          <div className="mb-4">
            <IconComponent className={`${iconSizes[size]} text-muted-foreground`} />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title || defaultContent.title}
        </h3>
        
        <p className="text-muted-foreground mb-4 max-w-md">
          {description || defaultContent.description}
        </p>

        {type === 'upload' && (
          <Badge variant="outline" className="mb-4 text-xs">
            Formatos soportados: Excel (.xlsx), CSV
          </Badge>
        )}

        {(actionText || defaultContent.actionText) && onAction && (
          <Button 
            onClick={onAction}
            variant={type === 'error' ? 'destructive' : 'default'}
            size="sm"
            className="gap-2"
          >
            <IconComponent className="h-4 w-4" />
            {actionText || defaultContent.actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};