import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Upload, History, BarChart3, Plus, Calendar, Briefcase, MoreVertical, Edit, Users, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AdminTopNavigation } from '@/components/AdminTopNavigation';
import { RoleBasedAccess } from '@/components/RoleBasedAccess';
import { ModuleAccessManager } from '@/components/admin/ModuleAccessManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
  currency_code: string;
  accounting_standard: string;
  sector: string;
  created_at: string;
  logo_url?: string;
}

interface DataCoverage {
  pyg_years: string[];
  balance_years: string[];
  latest_load: {
    date: string;
    status: string;
  } | null;
}

export const AdminEmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [coverageData, setCoverageData] = useState<{ [key: string]: DataCoverage }>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showModuleAccessModal, setShowModuleAccessModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    currency_code: 'EUR',
    accounting_standard: 'PGC',
    sector: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      setCompanies(companiesData || []);

      // Load data coverage for each company
      const coverage: { [key: string]: DataCoverage } = {};
      
      for (const company of companiesData || []) {
        // Get P&L years
        const { data: pygData } = await supabase
          .from('fs_pyg_lines')
          .select('period_year')
          .eq('company_id', company.id)
          .order('period_year', { ascending: false });

        // Get Balance years
        const { data: balanceData } = await supabase
          .from('fs_balance_lines')
          .select('period_year')
          .eq('company_id', company.id)
          .order('period_year', { ascending: false });

        // Get latest processing job
        const { data: latestJob } = await supabase
          .from('processing_jobs')
          .select('created_at, status')
          .eq('company_id', company.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const pygYears = [...new Set(pygData?.map(d => d.period_year.toString()) || [])];
        const balanceYears = [...new Set(balanceData?.map(d => d.period_year.toString()) || [])];

        coverage[company.id] = {
          pyg_years: pygYears,
          balance_years: balanceYears,
          latest_load: latestJob ? {
            date: latestJob.created_at,
            status: latestJob.status
          } : null
        };
      }

      setCoverageData(coverage);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las empresas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .insert([newCompany]);

      if (error) throw error;

      toast({
        title: "Empresa creada",
        description: `${newCompany.name} se ha creado exitosamente`
      });

      setShowCreateModal(false);
      setNewCompany({
        name: '',
        currency_code: 'EUR',
        accounting_standard: 'PGC',
        sector: ''
      });
      loadCompanies();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la empresa",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setNewCompany({
      name: company.name,
      currency_code: company.currency_code,
      accounting_standard: company.accounting_standard,
      sector: company.sector || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateCompany = async () => {
    if (!selectedCompany || !newCompany.name) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: newCompany.name,
          currency_code: newCompany.currency_code,
          accounting_standard: newCompany.accounting_standard,
          sector: newCompany.sector
        })
        .eq('id', selectedCompany.id);

      if (error) throw error;

      toast({
        title: "Empresa actualizada",
        description: `${newCompany.name} se ha actualizado exitosamente`
      });

      setShowEditModal(false);
      setSelectedCompany(null);
      setNewCompany({
        name: '',
        currency_code: 'EUR',
        accounting_standard: 'PGC',
        sector: ''
      });
      loadCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la empresa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    try {
      // First check if company has data
      const { data: hasData } = await supabase
        .from('fs_pyg_lines')
        .select('id')
        .eq('company_id', selectedCompany.id)
        .limit(1);

      if (hasData && hasData.length > 0) {
        toast({
          title: "No se puede eliminar",
          description: "Esta empresa tiene datos asociados. Elimina primero todos los datos financieros.",
          variant: "destructive"
        });
        setShowDeleteDialog(false);
        setSelectedCompany(null);
        return;
      }

      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', selectedCompany.id);

      if (error) throw error;

      toast({
        title: "Empresa eliminada",
        description: `${selectedCompany.name} se ha eliminado exitosamente`
      });

      setShowDeleteDialog(false);
      setSelectedCompany(null);
      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la empresa",
        variant: "destructive"
      });
    }
  };

  const handleAssignUsers = (company: Company) => {
    // Navigate to user management with company filter
    navigate(`/admin/usuarios?companyId=${company.id}`);
  };

  const handleManageModules = (company: Company) => {
    setSelectedCompany(company);
    setShowModuleAccessModal(true);
  };

  const formatDataCoverage = (coverage: DataCoverage) => {
    const pygRange = coverage.pyg_years.length > 0 
      ? coverage.pyg_years.length === 1 
        ? coverage.pyg_years[0]
        : `${coverage.pyg_years[coverage.pyg_years.length - 1]}-${coverage.pyg_years[0]}`
      : 'Sin datos';

    const balanceRange = coverage.balance_years.length > 0
      ? coverage.balance_years.length === 1
        ? coverage.balance_years[0]
        : `${coverage.balance_years[coverage.balance_years.length - 1]}-${coverage.balance_years[0]}`
      : 'Sin datos';

    return `P&L: ${pygRange} • Balance: ${balanceRange}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'PARSING':
      case 'VALIDATING':
      case 'LOADING':
      case 'AGGREGATING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <RoleBasedAccess allowedRoles={['admin']}>
        <div className="min-h-screen bg-background">
          <AdminTopNavigation />
          <main className="p-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando empresas...</p>
              </div>
            </div>
          </main>
        </div>
      </RoleBasedAccess>
    );
  }

  return (
    <RoleBasedAccess allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        <AdminTopNavigation />
        <main className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">Gestión de Empresas</h1>
                  <p className="text-muted-foreground">
                    Administra empresas y carga datos financieros mediante plantillas CSV
                  </p>
                </div>
                
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Crear Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Nueva Empresa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Empresa *</Label>
                        <Input
                          id="name"
                          value={newCompany.name}
                          onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ingresa el nombre de la empresa"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency">Moneda por Defecto</Label>
                          <Select 
                            value={newCompany.currency_code}
                            onValueChange={(value) => setNewCompany(prev => ({ ...prev, currency_code: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="USD">USD - Dólar</SelectItem>
                              <SelectItem value="GBP">GBP - Libra</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="standard">Estándar Contable</Label>
                          <Select 
                            value={newCompany.accounting_standard}
                            onValueChange={(value) => setNewCompany(prev => ({ ...prev, accounting_standard: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PGC">PGC - Plan General Contable</SelectItem>
                              <SelectItem value="IFRS">IFRS - Normas Internacionales</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sector">Sector</Label>
                        <Input
                          id="sector"
                          value={newCompany.sector}
                          onChange={(e) => setNewCompany(prev => ({ ...prev, sector: e.target.value }))}
                          placeholder="Ej: Tecnología, Manufactura, Servicios"
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateCompany} className="flex-1">
                          Crear Empresa
                        </Button>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Companies Grid */}
              {companies.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent className="space-y-4">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">No hay empresas registradas</h3>
                      <p className="text-muted-foreground">Crea tu primera empresa para empezar</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {companies.map((company) => {
                    const coverage = coverageData[company.id];
                    return (
                       <Card key={company.id} className="hover:shadow-lg transition-shadow">
                         <CardHeader className="pb-3">
                           <div className="flex items-start justify-between">
                             <div className="flex items-center gap-3">
                               {company.logo_url ? (
                                 <img 
                                   src={company.logo_url} 
                                   alt={`${company.name} logo`}
                                   className="h-10 w-10 rounded-lg object-cover"
                                 />
                               ) : (
                                 <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                   <Building2 className="h-5 w-5 text-primary" />
                                 </div>
                               )}
                               <div>
                                 <CardTitle className="text-lg">{company.name}</CardTitle>
                                 <div className="flex gap-2 mt-1">
                                   <Badge variant="outline" className="text-xs">
                                     {company.currency_code}
                                   </Badge>
                                   <Badge variant="outline" className="text-xs">
                                     {company.accounting_standard}
                                   </Badge>
                                 </div>
                               </div>
                             </div>
                             
                             {/* Company Actions Menu */}
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                   <MoreVertical className="h-4 w-4" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg">
                                 <DropdownMenuItem onClick={() => handleEditCompany(company)} className="gap-2">
                                   <Edit className="h-4 w-4" />
                                   Actualizar datos
                                 </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAssignUsers(company)} className="gap-2">
                                    <Users className="h-4 w-4" />
                                    Asignar usuarios
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleManageModules(company)} className="gap-2">
                                    <Settings className="h-4 w-4" />
                                    Gestionar módulos
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowDeleteDialog(true);
                                    }}
                                    className="gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Eliminar empresa
                                  </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>
                         </CardHeader>
                        
                        <CardContent className="space-y-4">
                          {/* Data Coverage */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Cobertura de Datos</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {coverage ? formatDataCoverage(coverage) : 'Cargando...'}
                            </p>
                          </div>

                          {/* Latest Load Status */}
                          {coverage?.latest_load && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">Última Carga</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getStatusColor(coverage.latest_load.status)}>
                                  {coverage.latest_load.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(coverage.latest_load.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Sector */}
                          {company.sector && (
                            <div className="text-sm text-muted-foreground">
                              <strong>Sector:</strong> {company.sector}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="grid grid-cols-1 gap-2 pt-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              className="w-full gap-2"
                              onClick={() => navigate(`/admin/carga-plantillas?companyId=${company.id}`)}
                            >
                              <Upload className="h-4 w-4" />
                              Cargar Plantillas CSV
                            </Button>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => navigate(`/admin/cargas?companyId=${company.id}`)}
                              >
                                <History className="h-4 w-4" />
                                Histórico
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => navigate(`/dashboard/company/${company.id}`)}
                              >
                                <BarChart3 className="h-4 w-4" />
                                Dashboard
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
          </div>
          
          {/* Edit Company Modal */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Actualizar Empresa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre de la Empresa *</Label>
                  <Input
                    id="edit-name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ingresa el nombre de la empresa"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-currency">Moneda por Defecto</Label>
                    <Select 
                      value={newCompany.currency_code}
                      onValueChange={(value) => setNewCompany(prev => ({ ...prev, currency_code: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="GBP">GBP - Libra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-standard">Estándar Contable</Label>
                    <Select 
                      value={newCompany.accounting_standard}
                      onValueChange={(value) => setNewCompany(prev => ({ ...prev, accounting_standard: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PGC">PGC - Plan General Contable</SelectItem>
                        <SelectItem value="IFRS">IFRS - Normas Internacionales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-sector">Sector</Label>
                  <Input
                    id="edit-sector"
                    value={newCompany.sector}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, sector: e.target.value }))}
                    placeholder="Ej: Tecnología, Manufactura, Servicios"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateCompany} className="flex-1">
                    Actualizar Empresa
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Module Access Manager */}
          {selectedCompany && (
            <ModuleAccessManager
              open={showModuleAccessModal}
              onClose={() => {
                setShowModuleAccessModal(false);
                setSelectedCompany(null);
              }}
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          )}
          
          {/* Delete Company Alert Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará permanentemente la empresa "{selectedCompany?.name}" del sistema.
                  Asegúrate de que no tenga datos financieros asociados antes de proceder.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedCompany(null)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteCompany}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </RoleBasedAccess>
  );
};

export default AdminEmpresasPage;