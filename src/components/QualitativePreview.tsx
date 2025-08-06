import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Info } from 'lucide-react';

interface QualitativeData {
  company: {
    company_name?: string;
    sector?: string;
    industry?: string;
    founded_year?: number;
    employees_range?: string;
    annual_revenue_range?: string;
    hq_city?: string;
    hq_country?: string;
    website?: string;
    business_description?: string;
    currency_code?: string;
    accounting_standard?: string;
    cif?: string;
  };
  shareholders: Array<{
    shareholder_name?: string;
    shareholder_type?: string;
    country?: string;
    ownership_pct?: number;
    notes?: string;
  }>;
  confidence?: number;
  stats?: {
    totalHeaders: number;
    mappedHeaders: number;
    companyFieldsFound: number;
    shareholdersFound: number;
  };
}

interface QualitativePreviewProps {
  data: QualitativeData;
  showDetails?: boolean;
}

export const QualitativePreview: React.FC<QualitativePreviewProps> = ({
  data,
  showDetails = true
}) => {
  const { company, shareholders, confidence, stats } = data;

  const getConfidenceBadge = () => {
    if (!confidence) return null;
    
    const level = confidence >= 0.8 ? 'high' : confidence >= 0.6 ? 'medium' : 'low';
    const variant = level === 'high' ? 'default' : level === 'medium' ? 'secondary' : 'destructive';
    const label = level === 'high' ? 'Alta' : level === 'medium' ? 'Media' : 'Baja';
    
    return (
      <Badge variant={variant}>
        Confianza: {label} ({(confidence * 100).toFixed(1)}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Información de la Empresa
            {getConfidenceBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {company.company_name ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                <p className="text-sm">{company.company_name}</p>
              </div>
              
              {company.sector && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sector</label>
                  <p className="text-sm">{company.sector}</p>
                </div>
              )}
              
              {company.industry && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Industria</label>
                  <p className="text-sm">{company.industry}</p>
                </div>
              )}
              
              {company.founded_year && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Año de Fundación</label>
                  <p className="text-sm">{company.founded_year}</p>
                </div>
              )}
              
              {company.employees_range && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Empleados</label>
                  <p className="text-sm">{company.employees_range}</p>
                </div>
              )}
              
              {company.annual_revenue_range && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Facturación Anual</label>
                  <p className="text-sm">{company.annual_revenue_range}</p>
                </div>
              )}
              
              {(company.hq_city || company.hq_country) && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sede</label>
                  <p className="text-sm">
                    {[company.hq_city, company.hq_country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {company.website && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Sitio Web</label>
                  <p className="text-sm">
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {company.website}
                    </a>
                  </p>
                </div>
              )}
              
              {company.currency_code && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Moneda</label>
                  <p className="text-sm">{company.currency_code}</p>
                </div>
              )}
              
              {company.accounting_standard && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estándar Contable</label>
                  <p className="text-sm">{company.accounting_standard}</p>
                </div>
              )}
              
              {company.cif && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CIF</label>
                  <p className="text-sm">{company.cif}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Info className="h-8 w-8 mx-auto mb-2" />
              <p>No se encontró información de empresa válida</p>
            </div>
          )}
          
          {company.business_description && (
            <div className="mt-4 pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">Descripción del Negocio</label>
              <p className="text-sm mt-1">{company.business_description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shareholder Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estructura Accionarial ({shareholders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shareholders.length > 0 ? (
            <div className="space-y-3">
              {shareholders.map((shareholder, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Nombre</label>
                      <p className="text-sm">{shareholder.shareholder_name || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                      <p className="text-sm">{shareholder.shareholder_type || 'No especificado'}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Participación</label>
                      <p className="text-sm">
                        {shareholder.ownership_pct ? `${shareholder.ownership_pct}%` : 'No especificado'}
                      </p>
                    </div>
                  </div>
                  
                  {(shareholder.country || shareholder.notes) && (
                    <div className="mt-2 pt-2 border-t grid grid-cols-1 md:grid-cols-2 gap-2">
                      {shareholder.country && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">País</label>
                          <p className="text-sm">{shareholder.country}</p>
                        </div>
                      )}
                      
                      {shareholder.notes && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">Notas</label>
                          <p className="text-sm">{shareholder.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2" />
              <p>No se encontraron accionistas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Statistics */}
      {showDetails && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Estadísticas de Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.mappedHeaders}</p>
                <p className="text-xs text-muted-foreground">Headers Mapeados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.totalHeaders}</p>
                <p className="text-xs text-muted-foreground">Headers Totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.companyFieldsFound}</p>
                <p className="text-xs text-muted-foreground">Campos de Empresa</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{stats.shareholdersFound}</p>
                <p className="text-xs text-muted-foreground">Accionistas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};