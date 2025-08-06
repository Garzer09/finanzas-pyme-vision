import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompanyDescription } from '@/hooks/useCompanyDescription';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { useCompanyContext } from '@/contexts/CompanyContext';
import { Edit3, Save, X, CheckCircle, AlertTriangle, Building, Globe, Users, MapPin, Calendar, DollarSign } from 'lucide-react';

interface CompanyData {
  name: string;
  description: string;
  sector: string;
  industry: string;
  foundedYear?: number;
  employees?: string;
  revenue?: string;
  headquarters?: string;
  website?: string;
}

export const CompanyDescriptionForm = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData>({
    name: '',
    description: '',
    sector: '',
    industry: '',
    foundedYear: undefined,
    employees: '',
    revenue: '',
    headquarters: '',
    website: ''
  });

  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { impersonatedUserInfo } = useAdminImpersonation();
  const { currentCompany } = useCompanyContext();
  const { companyDescription, loading: descriptionLoading, saveCompanyDescription } = useCompanyDescription();

  // Get company name from current company context first, then fallback to impersonation/profile
  const getCompanyName = () => {
    if (currentCompany?.name) {
      return currentCompany.name;
    }
    if (impersonatedUserInfo?.company_name) {
      return impersonatedUserInfo.company_name;
    }
    // For normal users, get from user profile meta data
    return user?.user_metadata?.company_name || '';
  };

  const companyName = getCompanyName();

  // Auto-load existing company description
  useEffect(() => {
    if (companyDescription) {
      setCompanyData({
        name: companyDescription.company_name,
        description: companyDescription.description || '',
        sector: companyDescription.sector || '',
        industry: companyDescription.industry || '',
        foundedYear: companyDescription.founded_year,
        employees: companyDescription.employees || '',
        revenue: companyDescription.revenue || '',
        headquarters: companyDescription.headquarters || '',
        website: companyDescription.website || ''
      });
    } else if (companyName) {
      // Initialize with company name from context if no description exists
      setCompanyData(prev => ({
        ...prev,
        name: companyName
      }));
    }
  }, [companyDescription, companyName]);

  const handleSave = async () => {
    const success = await saveCompanyDescription({
      company_name: companyData.name,
      description: companyData.description,
      sector: companyData.sector,
      industry: companyData.industry,
      founded_year: companyData.foundedYear,
      employees: companyData.employees,
      revenue: companyData.revenue,
      headquarters: companyData.headquarters,
      website: companyData.website
    });
    
    if (success) {
      setIsEditing(false);
    }
  };

  const handleReset = () => {
    setCompanyData({
      name: '',
      description: '',
      sector: '',
      industry: '',
      foundedYear: undefined,
      employees: '',
      revenue: '',
      headquarters: '',
      website: ''
    });
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof CompanyData, value: string | number) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Información de la Empresa */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Información de la Empresa
              {companyDescription?.data_source && (
                <Badge variant="secondary" className="ml-2">
                  {companyDescription.data_source}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Empresa</Label>
                <Input
                  id="name"
                  value={companyData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Ingresa el nombre de la empresa"
                />
              </div>

              <div>
                <Label htmlFor="sector">Sector</Label>
                <Input
                  id="sector"
                  value={companyData.sector}
                  onChange={(e) => handleInputChange('sector', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Ej: Tecnología, Manufacturas, Servicios"
                />
              </div>

              <div>
                <Label htmlFor="industry">Industria</Label>
                <Input
                  id="industry"
                  value={companyData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Ej: Software, Automotriz, Consultoría"
                />
              </div>
            </div>

            {/* Datos Adicionales */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="foundedYear" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Año de Fundación
                  </Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    value={companyData.foundedYear || ''}
                    onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || undefined)}
                    disabled={!isEditing}
                    placeholder="2000"
                  />
                </div>

                <div>
                  <Label htmlFor="employees" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Empleados
                  </Label>
                  <Input
                    id="employees"
                    value={companyData.employees}
                    onChange={(e) => handleInputChange('employees', e.target.value)}
                    disabled={!isEditing}
                    placeholder="100-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="revenue" className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  Ingresos Anuales
                </Label>
                <Input
                  id="revenue"
                  value={companyData.revenue}
                  onChange={(e) => handleInputChange('revenue', e.target.value)}
                  disabled={!isEditing}
                  placeholder="€10M, $50M, etc."
                />
              </div>

              <div>
                <Label htmlFor="headquarters" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Sede Principal
                </Label>
                <Input
                  id="headquarters"
                  value={companyData.headquarters}
                  onChange={(e) => handleInputChange('headquarters', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Madrid, España"
                />
              </div>

              <div>
                <Label htmlFor="website" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Sitio Web
                </Label>
                <Input
                  id="website"
                  value={companyData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción del Negocio</Label>
            <Textarea
              id="description"
              value={companyData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={!isEditing}
              placeholder="Describe la actividad principal de la empresa, productos, servicios y modelo de negocio..."
              rows={6}
              className="mt-2"
            />
          </div>

          {/* Raw search result (only if available) */}
          {companyDescription?.raw_search_result && (
            <Card className="bg-gray-50 border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Información Original de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {companyDescription.raw_search_result}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};