import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Building2, 
  Calendar, 
  Clock,
  Database,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users
} from 'lucide-react';

interface UserCardProps {
  user: {
    id: string;
    email: string;
    company_name: string;
    role: 'admin' | 'user';
    created_at: string;
    last_sign_in_at?: string;
  };
  hasData?: boolean;
  lastDataUpdate?: string;
  dataQuality?: number;
  onClick: () => void;
  onManageMemberships: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  hasData = false, 
  lastDataUpdate,
  dataQuality,
  onClick,
  onManageMemberships
}) => {
  
  const getDataStatus = () => {
    if (!hasData) return { status: 'no-data', label: 'Sin datos', color: 'text-yellow-500' };
    if (dataQuality && dataQuality >= 80) return { status: 'excellent', label: 'Excelente', color: 'text-green-500' };
    if (dataQuality && dataQuality >= 60) return { status: 'good', label: 'Bueno', color: 'text-blue-500' };
    return { status: 'needs-review', label: 'Necesita revisión', color: 'text-orange-500' };
  };

  const dataStatus = getDataStatus();
  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <div 
        className="cursor-pointer" 
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{user.email}</h3>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasData ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className={`h-5 w-5 ${dataStatus.color}`} />
                  <Badge variant="outline" className={dataStatus.color}>
                    {dataStatus.label}
                  </Badge>
                </div>
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{user.company_name || 'Sin empresa asignada'}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Registrado: {new Date(user.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Último acceso: {user.last_sign_in_at 
                  ? new Date(user.last_sign_in_at).toLocaleDateString()
                  : 'Nunca'
                }
              </span>
            </div>

            {hasData && lastDataUpdate && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Database className="h-4 w-4" />
                <span>Datos: {new Date(lastDataUpdate).toLocaleDateString()}</span>
                {dataQuality && (
                  <Badge variant="secondary" className="ml-2">
                    {dataQuality}% calidad
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Botones de acción */}
      <div className="px-6 pb-4 pt-2 border-t bg-muted/20">
        <div className="flex gap-2">
          {hasData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              className="flex-1"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Dashboard
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onManageMemberships();
            }}
            className={hasData ? "flex-1" : "w-full"}
          >
            <Users className="h-4 w-4 mr-2" />
            Asignar Empresas
          </Button>
        </div>
      </div>
    </Card>
  );
};