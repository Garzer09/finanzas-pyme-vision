import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  Calendar, 
  Clock,
  Database,
  CheckCircle,
  AlertCircle
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
  onClick: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  hasData = false, 
  lastDataUpdate,
  onClick 
}) => {
  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105" 
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
              <CheckCircle className="h-5 w-5 text-green-500" />
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
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t">
          <div className="text-xs text-muted-foreground">
            {hasData ? 'Dashboard con datos • ' : 'Sin datos • '}
            Click para gestionar
          </div>
        </div>
      </CardContent>
    </Card>
  );
};