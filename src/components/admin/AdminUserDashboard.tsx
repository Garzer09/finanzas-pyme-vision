import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Upload, 
  User, 
  Building2, 
  Settings,
  Eye 
} from 'lucide-react';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import HomePage from '@/pages/HomePage';

interface AdminUserDashboardProps {
  onBack: () => void;
  onManageData: () => void;
}

export const AdminUserDashboard: React.FC<AdminUserDashboardProps> = ({
  onBack,
  onManageData
}) => {
  const { impersonatedUserInfo, isImpersonating } = useAdminImpersonation();

  if (!isImpersonating || !impersonatedUserInfo) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No hay usuario seleccionado</p>
        <Button onClick={onBack} className="mt-4">
          Volver al Panel de Administración
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header - Indicador de que está viendo como admin */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      Viendo como: {impersonatedUserInfo.email}
                    </CardTitle>
                    <Badge variant="outline" className="text-primary border-primary">
                      <Eye className="h-3 w-3 mr-1" />
                      Vista Admin
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{impersonatedUserInfo.company_name || 'Sin empresa'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onManageData}
                className="shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Gestionar Datos
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard del Usuario */}
      <div className="min-h-screen bg-background">
        <HomePage />
      </div>
    </div>
  );
};