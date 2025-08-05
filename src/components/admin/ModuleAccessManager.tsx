import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useModuleAccess, AVAILABLE_MODULES } from '@/hooks/useModuleAccess';
import { toast } from 'sonner';

interface ModuleAccessManagerProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export const ModuleAccessManager: React.FC<ModuleAccessManagerProps> = ({
  open,
  onClose,
  companyId,
  companyName
}) => {
  const { moduleAccess, loading, updateModuleAccess, hasModuleAccess } = useModuleAccess(companyId);
  const [saving, setSaving] = useState(false);

  const categories = [...new Set(AVAILABLE_MODULES.map(module => module.category))];

  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    setSaving(true);
    const success = await updateModuleAccess(moduleId, enabled);
    if (success) {
      toast.success(
        enabled 
          ? 'Módulo habilitado correctamente'
          : 'Módulo deshabilitado correctamente'
      );
    }
    setSaving(false);
  };

  const getEnabledCount = () => {
    return AVAILABLE_MODULES.filter(module => hasModuleAccess(module.id)).length;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestionar Acceso a Módulos</DialogTitle>
          <DialogDescription>
            Configura qué módulos puede acceder <strong>{companyName}</strong>.
            <div className="mt-2">
              <Badge variant="secondary">
                {getEnabledCount()} de {AVAILABLE_MODULES.length} módulos habilitados
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {categories.map(category => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {AVAILABLE_MODULES
                    .filter(module => module.category === category)
                    .map(module => (
                      <div 
                        key={module.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{module.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            ID: {module.id}
                          </p>
                        </div>
                        <Switch
                          checked={hasModuleAccess(module.id)}
                          onCheckedChange={(enabled) => handleToggleModule(module.id, enabled)}
                          disabled={saving}
                        />
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};