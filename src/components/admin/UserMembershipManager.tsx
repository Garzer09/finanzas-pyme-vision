import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, Plus, X, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  sector?: string;
}

interface UserMembership {
  company_id: string;
  companies: Company;
}

interface UserMembershipManagerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
}

export const UserMembershipManager: React.FC<UserMembershipManagerProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName
}) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, sector')
        .order('name');

      if (companiesError) throw companiesError;

      // Load user's current memberships
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('memberships')
        .select('company_id')
        .eq('user_id', userId);

      if (membershipsError) throw membershipsError;

      setCompanies(companiesData || []);
      setUserMemberships(membershipsData?.map(m => m.company_id) || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMembershipChange = (companyId: string, isChecked: boolean) => {
    setUserMemberships(prev => 
      isChecked 
        ? [...prev, companyId]
        : prev.filter(id => id !== companyId)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all current memberships
      const { error: deleteError } = await supabase
        .from('memberships')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Insert new memberships
      if (userMemberships.length > 0) {
        const membershipInserts = userMemberships.map(companyId => ({
          user_id: userId,
          company_id: companyId,
          role: 'member'
        }));

        const { error: insertError } = await supabase
          .from('memberships')
          .insert(membershipInserts);

        if (insertError) throw insertError;
      }

      toast({
        title: "Membresías actualizadas",
        description: `Se han actualizado las empresas asignadas a ${userName}`
      });

      onClose();
    } catch (error) {
      console.error('Error saving memberships:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las membresías",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestionar Empresas Asignadas
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <strong>{userName}</strong> ({userEmail})
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* Current assignments summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Empresas Actualmente Asignadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {userMemberships.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Este usuario no tiene empresas asignadas
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {userMemberships.map(companyId => {
                        const company = companies.find(c => c.id === companyId);
                        return company ? (
                          <Badge key={companyId} variant="default" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {company.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Seleccionar Empresas</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Marca las empresas a las que este usuario debe tener acceso
                  </p>
                </CardHeader>
                <CardContent>
                  {companies.length === 0 ? (
                    <div className="text-center py-8">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No hay empresas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {companies.map((company) => (
                        <div key={company.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                          <Checkbox
                            id={`company-${company.id}`}
                            checked={userMemberships.includes(company.id)}
                            onCheckedChange={(checked) => 
                              handleMembershipChange(company.id, checked as boolean)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <label 
                                htmlFor={`company-${company.id}`}
                                className="font-medium cursor-pointer truncate"
                              >
                                {company.name}
                              </label>
                            </div>
                            {company.sector && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {company.sector}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};