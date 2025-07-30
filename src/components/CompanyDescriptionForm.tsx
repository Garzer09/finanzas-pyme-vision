import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { usePerplexityCompanySearch } from '@/hooks/usePerplexityCompanySearch';
import { useCompanyDescription } from '@/hooks/useCompanyDescription';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { Search, Edit3, Save, X, CheckCircle, AlertTriangle, Building, Globe, Users, MapPin, Calendar, DollarSign } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
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
  const { searchCompany, isSearching, searchResult, error, clearSearch, dataFound } = usePerplexityCompanySearch();
  const { companyDescription, loading: descriptionLoading, saveCompanyDescription, createFromPerplexityResult } = useCompanyDescription();

  // Get company name from profile or impersonated user
  const getCompanyName = () => {
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
    }
  }, [companyDescription]);

  // Auto-search for normal users on component mount
  useEffect(() => {
    if (!isAdmin && companyName && !companyDescription && !descriptionLoading) {
      setSearchQuery(companyName);
      searchCompany(companyName);
    }
  }, [companyName, isAdmin, companyDescription, descriptionLoading]);

  useEffect(() => {
    if (searchResult?.companyInfo && dataFound) {
      const info = searchResult.companyInfo;
      setCompanyData({
        name: info.name,
        description: info.description,
        sector: info.sector || '',
        industry: info.industry || '',
        foundedYear: info.foundedYear,
        employees: info.employees || '',
        revenue: info.revenue || '',
        headquarters: info.headquarters || '',
        website: info.website || ''
      });
      
      // Auto-save for normal users
      if (!isAdmin) {
        createFromPerplexityResult(searchResult);
      }
    }
  }, [searchResult, dataFound, isAdmin]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await searchCompany(searchQuery);
  };

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
    setSearchQuery('');
    clearSearch();
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
      {/* Información de empresa para usuarios normales o búsqueda para admins */}
      {!isAdmin && companyName ? (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Tu Empresa: {companyName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {descriptionLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div>
                {companyDescription ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Información de tu empresa cargada automáticamente desde nuestra base de datos.
                    </AlertDescription>
                  </Alert>
                ) : isSearching ? (
                  <Alert>
                    <Search className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      Buscando información sobre {companyName} con IA...
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No se encontró información sobre tu empresa. Puedes completar los datos manualmente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : isAdmin ? (
        /* Búsqueda manual para administradores */
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Búsqueda Inteligente de Empresa (Admin)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Nombre de la empresa a buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                disabled={isSearching}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchQuery.trim()}
                className="min-w-[100px]"
              >
                {isSearching ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSearching && (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            )}

            {searchResult && !dataFound && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No se encontró información específica sobre "{searchQuery}". Puedes completar los datos manualmente.
                </AlertDescription>
              </Alert>
            )}

            {searchResult && dataFound && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  ¡Información encontrada! Los datos se han cargado automáticamente. Puedes editarlos si es necesario.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Información de la Empresa */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Información de la Empresa
              {searchResult?.companyInfo.source && (
                <Badge variant="secondary" className="ml-2">
                  {searchResult.companyInfo.source}
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

          {/* Resultado de búsqueda raw (solo si hay datos) */}
          {searchResult?.rawSearchResult && dataFound && (
            <Card className="bg-gray-50 border-dashed">
              <CardHeader>
                <CardTitle className="text-sm">Información Original de Perplexity</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {searchResult.rawSearchResult}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};