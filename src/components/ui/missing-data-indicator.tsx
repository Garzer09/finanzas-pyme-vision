import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MissingDataIndicatorProps {
  title: string;
  description: string;
  icon?: React.ComponentType<any>;
  onUploadClick?: () => void;
  onCreateClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MissingDataIndicator = ({
  title,
  description,
  icon: Icon = FileText,
  onUploadClick,
  onCreateClick,
  className,
  size = 'md'
}: MissingDataIndicatorProps) => {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4', 
    lg: 'p-6'
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <Card className={cn(
      "border-2 border-dashed border-muted-foreground/20 bg-muted/5",
      className
    )}>
      <CardContent className={cn("text-center", sizeClasses[size])}>
        <div className="flex flex-col items-center space-y-3">
          <div className="rounded-full bg-muted/20 p-3">
            <Icon className={cn(
              "text-muted-foreground",
              iconSizes[size]
            )} />
          </div>
          
          <div className="space-y-1">
            <h3 className="font-medium text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            {onUploadClick && (
              <Button
                onClick={onUploadClick}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Upload className="h-3 w-3 mr-1" />
                Subir Plantilla
              </Button>
            )}
            
            {onCreateClick && (
              <Button
                onClick={onCreateClick}
                variant="default"
                size="sm"
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Crear Datos
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const MissingDataKPI = ({ 
  title, 
  dataType,
  className 
}: { 
  title: string; 
  dataType: string;
  className?: string;
}) => {
  return (
    <Card className={cn(
      "border-2 border-dashed border-muted-foreground/20 bg-muted/5",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-lg font-semibold text-muted-foreground">
            📁 Sin datos
          </p>
          <p className="text-xs text-muted-foreground">
            Faltan datos de {dataType}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};