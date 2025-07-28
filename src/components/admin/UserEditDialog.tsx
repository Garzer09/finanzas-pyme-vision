import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  company_name?: string;
  created_at: string;
  role?: 'admin' | 'user';
  email?: string;
}

interface UserEditDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
}

const INDUSTRY_SECTORS = [
  'Tecnología', 'Manufactura', 'Servicios', 'Retail', 'Construcción',
  'Agricultura', 'Energía', 'Telecomunicaciones', 'Financiero',
  'Inmobiliario', 'Turismo', 'Transporte', 'Educación', 'Salud', 'Otros'
];

export const UserEditDialog: React.FC<UserEditDialogProps> = ({ 
  user, 
  open, 
  onOpenChange, 
  onUserUpdated 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: '',
    role: 'user' as 'admin' | 'user',
    industry_sector: '',
    default_currency: 'EUR',
    default_physical_unit: '',
    advanced_features: false,
    subscription_status: 'active'
  });

  const [clientConfig, setClientConfig] = useState<any>(null);
  const [fileHistory, setFileHistory] = useState<any[]>([]);

  useEffect(() => {
    if (user && open) {
      setFormData({
        company_name: user.company_name || '',
        role: user.role || 'user',
        industry_sector: '',
        default_currency: 'EUR',
        default_physical_unit: '',
        advanced_features: false,
        subscription_status: 'active'
      });
      
      fetchUserDetails();
    }
  }, [user, open]);

  const fetchUserDetails = async () => {
    if (!user) return;

    try {
      // Fetch client configuration
      const { data: configData } = await supabase
        .from('client_configurations')
        .select('*')
        .eq('user_id', user.user_id)
        .single();

      if (configData) {
        setClientConfig(configData);
        setFormData(prev => ({
          ...prev,
          industry_sector: configData.industry_sector || '',
          default_currency: configData.default_units?.toUpperCase() || 'EUR',
          default_physical_unit: configData.default_physical_unit || '',
          advanced_features: typeof configData.validation_rules === 'object' && configData.validation_rules && 'advanced_features' in configData.validation_rules ? Boolean(configData.validation_rules.advanced_features) : false
        }));
      }

      // Fetch file upload history
      const { data: filesData } = await supabase
        .from('excel_files')
        .select('file_name, upload_date, processing_status')
        .eq('user_id', user.user_id)
        .order('upload_date', { ascending: false })
        .limit(10);

      setFileHistory(filesData || []);

    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          company_name: formData.company_name
        })
        .eq('user_id', user.user_id);

      if (profileError) throw profileError;

      // Update user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: formData.role })
        .eq('user_id', user.user_id);

      if (roleError) throw roleError;

      // Update or create client configuration
      const configData = {
        user_id: user.user_id,
        client_name: formData.company_name,
        industry_sector: formData.industry_sector,
        default_units: formData.default_currency.toLowerCase(),
        default_physical_unit: formData.default_physical_unit || null,
        validation_rules: {
          ...clientConfig?.validation_rules,
          advanced_features: formData.advanced_features
        }
      };

      if (clientConfig) {
        const { error: updateError } = await supabase
          .from('client_configurations')
          .update(configData)
          .eq('user_id', user.user_id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('client_configurations')
          .insert(configData);
        
        if (insertError) throw insertError;
      }

      toast({
        title: "Usuario actualizado",
        description: "Los cambios se han guardado correctamente",
      });

      onUserUpdated?.();
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'completed': 'default',
      'pending': 'secondary',
      'error': 'destructive'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
          <DialogDescription>
            Gestiona la información y configuración de {user.company_name || user.email}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Información Básica</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
            <TabsTrigger value="files">Archivos</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label htmlFor="created">Fecha de registro</Label>
                <Input
                  id="created"
                  value={new Date(user.created_at).toLocaleDateString()}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company_name">Nombre de la empresa</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>

            <div>
              <Label htmlFor="role">Rol del usuario</Label>
              <Select value={formData.role} onValueChange={(value) => updateFormData('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario estándar</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <div>
              <Label htmlFor="industry_sector">Sector de actividad</Label>
              <Select value={formData.industry_sector} onValueChange={(value) => updateFormData('industry_sector', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un sector" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_currency">Moneda por defecto</Label>
                <Select value={formData.default_currency} onValueChange={(value) => updateFormData('default_currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dólar US ($)</SelectItem>
                    <SelectItem value="GBP">Libra (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="default_physical_unit">Unidad física principal</Label>
                <Input
                  id="default_physical_unit"
                  value={formData.default_physical_unit}
                  onChange={(e) => updateFormData('default_physical_unit', e.target.value)}
                  placeholder="kg, litros, piezas..."
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="advanced_features"
                checked={formData.advanced_features}
                onCheckedChange={(checked) => updateFormData('advanced_features', checked)}
              />
              <Label htmlFor="advanced_features">Habilitar características avanzadas</Label>
            </div>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Historial de archivos subidos</h3>
              {fileHistory.length > 0 ? (
                <div className="space-y-2">
                  {fileHistory.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(file.upload_date).toLocaleString()}
                        </p>
                      </div>
                      {getStatusBadge(file.processing_status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No se han subido archivos aún</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-3">Actividad reciente</h3>
              <p className="text-muted-foreground">
                Esta funcionalidad se implementará en una versión futura para mostrar el log de actividades del usuario.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};