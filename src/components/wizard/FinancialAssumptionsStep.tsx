import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Percent, Euro, Target } from 'lucide-react';

interface FinancialAssumptionsStepProps {
  data: any;
  onChange: (data: any) => void;
}

interface AssumptionsData {
  // Growth assumptions
  crecimientoVentas: number;
  crecimientoEbitda: number;
  
  // Profitability assumptions
  margenEbitdaObjetivo: number;
  margenNetoObjetivo: number;
  
  // Investment assumptions
  capexSobreVentas: number;
  inversionCapitalTrabajo: number;
  
  // Cost of capital
  wacc: number;
  costeDeuda: number;
  
  // Other assumptions
  tasaImpuestos: number;
  politicaDividendos: number;
  
  // Scenario notes
  escenarioBase: string;
  supuestosAdicionales: string;
}

export const FinancialAssumptionsStep: React.FC<FinancialAssumptionsStepProps> = ({
  data,
  onChange
}) => {
  const [assumptions, setAssumptions] = useState<AssumptionsData>({
    crecimientoVentas: 5,
    crecimientoEbitda: 0,
    margenEbitdaObjetivo: 15,
    margenNetoObjetivo: 8,
    capexSobreVentas: 3,
    inversionCapitalTrabajo: 2,
    wacc: 8,
    costeDeuda: 4,
    tasaImpuestos: 25,
    politicaDividendos: 30,
    escenarioBase: 'conservador',
    supuestosAdicionales: '',
    ...data
  });

  const handleSliderChange = (field: keyof AssumptionsData, value: number[]) => {
    const newAssumptions = { ...assumptions, [field]: value[0] };
    setAssumptions(newAssumptions);
    onChange(newAssumptions);
  };

  const handleInputChange = (field: keyof AssumptionsData, value: string | number) => {
    const newAssumptions = { ...assumptions, [field]: value };
    setAssumptions(newAssumptions);
    onChange(newAssumptions);
  };

  const SliderField = ({ 
    label, 
    field, 
    value, 
    min = 0, 
    max = 100, 
    step = 0.1,
    suffix = '%',
    icon,
    description
  }: {
    label: string;
    field: keyof AssumptionsData;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    icon?: React.ReactNode;
    description?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        <Badge variant="outline" className="font-mono">
          {value.toFixed(1)}{suffix}
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={(val) => handleSliderChange(field, val)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );

  const getWaccRating = (wacc: number) => {
    if (wacc <= 6) return { rating: 'Excelente', color: 'text-green-600' };
    if (wacc <= 8) return { rating: 'Bueno', color: 'text-blue-600' };
    if (wacc <= 12) return { rating: 'Moderado', color: 'text-yellow-600' };
    return { rating: 'Alto', color: 'text-red-600' };
  };

  const getGrowthRating = (growth: number) => {
    if (growth >= 10) return { rating: 'Agresivo', color: 'text-red-600' };
    if (growth >= 5) return { rating: 'Moderado', color: 'text-blue-600' };
    if (growth >= 2) return { rating: 'Conservador', color: 'text-green-600' };
    return { rating: 'Defensivo', color: 'text-gray-600' };
  };

  const waccRating = getWaccRating(assumptions.wacc);
  const growthRating = getGrowthRating(assumptions.crecimientoVentas);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Assumptions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Supuestos de Crecimiento</h3>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Proyecciones de Crecimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderField
                label="Crecimiento Anual de Ventas"
                field="crecimientoVentas"
                value={assumptions.crecimientoVentas}
                min={-10}
                max={25}
                icon={<TrendingUp className="h-4 w-4" />}
                description={`Perfil ${growthRating.rating.toLowerCase()}`}
              />
              
              <SliderField
                label="Crecimiento EBITDA (adicional)"
                field="crecimientoEbitda"
                value={assumptions.crecimientoEbitda}
                min={-5}
                max={15}
                icon={<Percent className="h-4 w-4" />}
                description="Crecimiento adicional por mejoras operativas"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                Márgenes Objetivo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderField
                label="Margen EBITDA Objetivo"
                field="margenEbitdaObjetivo"
                value={assumptions.margenEbitdaObjetivo}
                min={5}
                max={40}
                icon={<Percent className="h-4 w-4" />}
              />
              
              <SliderField
                label="Margen Neto Objetivo"
                field="margenNetoObjetivo"
                value={assumptions.margenNetoObjetivo}
                min={1}
                max={25}
                icon={<Percent className="h-4 w-4" />}
              />
            </CardContent>
          </Card>
        </div>

        {/* Investment & Cost of Capital */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Inversión y Coste de Capital</h3>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Necesidades de Inversión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderField
                label="CAPEX sobre Ventas"
                field="capexSobreVentas"
                value={assumptions.capexSobreVentas}
                min={0}
                max={15}
                icon={<Euro className="h-4 w-4" />}
                description="Inversiones en activos fijos anuales"
              />
              
              <SliderField
                label="Inversión en Capital de Trabajo"
                field="inversionCapitalTrabajo"
                value={assumptions.inversionCapitalTrabajo}
                min={0}
                max={10}
                icon={<Euro className="h-4 w-4" />}
                description="Como % del crecimiento de ventas"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Coste de Capital</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <SliderField
                label="WACC (Coste Medio Ponderado)"
                field="wacc"
                value={assumptions.wacc}
                min={3}
                max={20}
                icon={<Percent className="h-4 w-4" />}
                description={`Nivel ${waccRating.rating.toLowerCase()} para descuento de flujos`}
              />
              
              <SliderField
                label="Coste de la Deuda"
                field="costeDeuda"
                value={assumptions.costeDeuda}
                min={1}
                max={15}
                icon={<Percent className="h-4 w-4" />}
                description="Tipo de interés promedio de financiación"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Assumptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Otros Supuestos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SliderField
            label="Tasa de Impuestos"
            field="tasaImpuestos"
            value={assumptions.tasaImpuestos}
            min={15}
            max={35}
            icon={<Percent className="h-4 w-4" />}
            description="Tipo impositivo efectivo"
          />
          
          <SliderField
            label="Política de Dividendos"
            field="politicaDividendos"
            value={assumptions.politicaDividendos}
            min={0}
            max={80}
            icon={<Euro className="h-4 w-4" />}
            description="% del beneficio neto distribuido"
          />
        </CardContent>
      </Card>

      {/* Scenario Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notas del Escenario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="escenarioBase">Tipo de Escenario</Label>
            <Input
              id="escenarioBase"
              value={assumptions.escenarioBase}
              onChange={(e) => handleInputChange('escenarioBase', e.target.value)}
              placeholder="Ej: Base, Conservador, Optimista"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supuestosAdicionales">Supuestos Adicionales</Label>
            <Textarea
              id="supuestosAdicionales"
              value={assumptions.supuestosAdicionales}
              onChange={(e) => handleInputChange('supuestosAdicionales', e.target.value)}
              placeholder="Describe supuestos específicos del sector, mercado, o situación particular de la empresa..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumen de Supuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-bold text-blue-900">{assumptions.crecimientoVentas.toFixed(1)}%</div>
              <div className="text-blue-700">Crecimiento</div>
              <div className={`text-xs ${growthRating.color}`}>{growthRating.rating}</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-bold text-green-900">{assumptions.margenEbitdaObjetivo.toFixed(1)}%</div>
              <div className="text-green-700">EBITDA Target</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-bold text-purple-900">{assumptions.wacc.toFixed(1)}%</div>
              <div className="text-purple-700">WACC</div>
              <div className={`text-xs ${waccRating.color}`}>{waccRating.rating}</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="font-bold text-orange-900">{assumptions.capexSobreVentas.toFixed(1)}%</div>
              <div className="text-orange-700">CAPEX/Ventas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
