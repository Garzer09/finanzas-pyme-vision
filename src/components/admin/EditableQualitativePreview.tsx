import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building, Users, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
}

interface EditableQualitativePreviewProps {
  data: QualitativeData;
  onChange: (updatedData: QualitativeData) => void;
  modifiedFields: Set<string>;
}

export const EditableQualitativePreview: React.FC<EditableQualitativePreviewProps> = ({
  data,
  onChange,
  modifiedFields
}) => {
  const updateCompanyField = (field: string, value: string | number) => {
    onChange({
      ...data,
      company: {
        ...data.company,
        [field]: value
      }
    });
  };

  const updateShareholderField = (index: number, field: string, value: string | number) => {
    const updatedShareholders = [...data.shareholders];
    updatedShareholders[index] = {
      ...updatedShareholders[index],
      [field]: value
    };
    onChange({
      ...data,
      shareholders: updatedShareholders
    });
  };

  const addShareholder = () => {
    onChange({
      ...data,
      shareholders: [
        ...data.shareholders,
        {
          shareholder_name: '',
          shareholder_type: '',
          country: '',
          ownership_pct: 0,
          notes: ''
        }
      ]
    });
  };

  const removeShareholder = (index: number) => {
    onChange({
      ...data,
      shareholders: data.shareholders.filter((_, i) => i !== index)
    });
  };

  const getFieldClassName = (fieldName: string) => {
    return modifiedFields.has(fieldName) 
      ? "border-blue-500 bg-blue-50" 
      : "";
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Información de la Empresa
          </CardTitle>
          <CardDescription>
            Edita los datos de la empresa detectados automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Nombre de la Empresa</Label>
              <Input
                id="company_name"
                value={data.company.company_name || ''}
                onChange={(e) => updateCompanyField('company_name', e.target.value)}
                className={getFieldClassName('company_name')}
                placeholder="Nombre de la empresa"
              />
            </div>
            
            <div>
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                value={data.company.sector || ''}
                onChange={(e) => updateCompanyField('sector', e.target.value)}
                className={getFieldClassName('sector')}
                placeholder="Sector de actividad"
              />
            </div>
            
            <div>
              <Label htmlFor="industry">Industria</Label>
              <Input
                id="industry"
                value={data.company.industry || ''}
                onChange={(e) => updateCompanyField('industry', e.target.value)}
                className={getFieldClassName('industry')}
                placeholder="Industria específica"
              />
            </div>
            
            <div>
              <Label htmlFor="founded_year">Año de Fundación</Label>
              <Input
                id="founded_year"
                type="number"
                value={data.company.founded_year || ''}
                onChange={(e) => updateCompanyField('founded_year', parseInt(e.target.value) || 0)}
                className={getFieldClassName('founded_year')}
                placeholder="Año de fundación"
              />
            </div>
            
            <div>
              <Label htmlFor="employees_range">Rango de Empleados</Label>
              <Input
                id="employees_range"
                value={data.company.employees_range || ''}
                onChange={(e) => updateCompanyField('employees_range', e.target.value)}
                className={getFieldClassName('employees_range')}
                placeholder="ej: 100-500"
              />
            </div>
            
            <div>
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                value={data.company.website || ''}
                onChange={(e) => updateCompanyField('website', e.target.value)}
                className={getFieldClassName('website')}
                placeholder="https://www.empresa.com"
              />
            </div>
            
            <div>
              <Label htmlFor="hq_city">Ciudad Sede</Label>
              <Input
                id="hq_city"
                value={data.company.hq_city || ''}
                onChange={(e) => updateCompanyField('hq_city', e.target.value)}
                className={getFieldClassName('hq_city')}
                placeholder="Ciudad"
              />
            </div>
            
            <div>
              <Label htmlFor="hq_country">País</Label>
              <Input
                id="hq_country"
                value={data.company.hq_country || ''}
                onChange={(e) => updateCompanyField('hq_country', e.target.value)}
                className={getFieldClassName('hq_country')}
                placeholder="País"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="business_description">Descripción del Negocio</Label>
            <textarea
              id="business_description"
              rows={3}
              className={`w-full px-3 py-2 border rounded-md ${getFieldClassName('business_description')}`}
              value={data.company.business_description || ''}
              onChange={(e) => updateCompanyField('business_description', e.target.value)}
              placeholder="Descripción de la actividad empresarial"
            />
          </div>
        </CardContent>
      </Card>

      {/* Shareholders Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estructura Accionarial ({data.shareholders.length} accionistas)
              </CardTitle>
              <CardDescription>
                Gestiona la información de los accionistas
              </CardDescription>
            </div>
            <Button onClick={addShareholder} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Accionista
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.shareholders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay accionistas registrados. Haz clic en "Agregar Accionista" para comenzar.
            </div>
          ) : (
            <div className="space-y-4">
              {data.shareholders.map((shareholder, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-sm">Accionista {index + 1}</h4>
                    <Button
                      onClick={() => removeShareholder(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label>Nombre del Accionista</Label>
                      <Input
                        value={shareholder.shareholder_name || ''}
                        onChange={(e) => updateShareholderField(index, 'shareholder_name', e.target.value)}
                        className={getFieldClassName(`shareholder_${index}_name`)}
                        placeholder="Nombre del accionista"
                      />
                    </div>
                    
                    <div>
                      <Label>Tipo</Label>
                      <Input
                        value={shareholder.shareholder_type || ''}
                        onChange={(e) => updateShareholderField(index, 'shareholder_type', e.target.value)}
                        className={getFieldClassName(`shareholder_${index}_type`)}
                        placeholder="ej: Persona física, Empresa"
                      />
                    </div>
                    
                    <div>
                      <Label>País</Label>
                      <Input
                        value={shareholder.country || ''}
                        onChange={(e) => updateShareholderField(index, 'country', e.target.value)}
                        className={getFieldClassName(`shareholder_${index}_country`)}
                        placeholder="País"
                      />
                    </div>
                    
                    <div>
                      <Label>Participación (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={shareholder.ownership_pct || ''}
                        onChange={(e) => updateShareholderField(index, 'ownership_pct', parseFloat(e.target.value) || 0)}
                        className={getFieldClassName(`shareholder_${index}_ownership`)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>Notas</Label>
                      <Input
                        value={shareholder.notes || ''}
                        onChange={(e) => updateShareholderField(index, 'notes', e.target.value)}
                        className={getFieldClassName(`shareholder_${index}_notes`)}
                        placeholder="Notas adicionales"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {modifiedFields.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {modifiedFields.size} campo(s) modificado(s)
              </Badge>
              <span className="text-sm text-blue-700">
                Los campos modificados se guardarán con los datos editados
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};