import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator } from 'lucide-react';

interface ProfitLossStepProps {
  data: any;
  onChange: (data: any) => void;
}

interface ProfitLossData {
  ingresos: number;
  costesVentas: number;
  gastosPersonal: number;
  otrosGastos: number;
  ebitda: number;
  amortizaciones: number;
  gastosFinancieros: number;
  ingresosFinancieros: number;
  impuestos: number;
  // Calculated fields
  margenBruto?: number;
  ebit?: number;
  ebt?: number;
  resultadoNeto?: number;
  margenEbitda?: number;
  margenNeto?: number;
}

export const ProfitLossStep: React.FC<ProfitLossStepProps> = ({
  data,
  onChange
}) => {
  const [pyg, setPyg] = useState<ProfitLossData>({
    ingresos: 0,
    costesVentas: 0,
    gastosPersonal: 0,
    otrosGastos: 0,
    ebitda: 0,
    amortizaciones: 0,
    gastosFinancieros: 0,
    ingresosFinancieros: 0,
    impuestos: 0,
    ...data
  });

  const handleInputChange = (field: keyof ProfitLossData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPyg = { ...pyg, [field]: numValue };
    setPyg(newPyg);
  };

  // Calculations
  const margenBruto = pyg.ingresos - pyg.costesVentas;
  const totalGastosOperativos = pyg.gastosPersonal + pyg.otrosGastos;
  const ebitdaCalculado = margenBruto - totalGastosOperativos;
  const ebitdaFinal = pyg.ebitda || ebitdaCalculado; // Use manual if provided, otherwise calculated
  const ebit = ebitdaFinal - pyg.amortizaciones;
  const resultadoFinanciero = pyg.ingresosFinancieros - pyg.gastosFinancieros;
  const ebt = ebit + resultadoFinanciero;
  const resultadoNeto = ebt - pyg.impuestos;
  
  const margenEbitda = pyg.ingresos ? (ebitdaFinal / pyg.ingresos) * 100 : 0;
  const margenNeto = pyg.ingresos ? (resultadoNeto / pyg.ingresos) * 100 : 0;

  // Update parent with calculated values
  useEffect(() => {
    onChange({
      ...pyg,
      margenBruto,
      ebit,
      ebt,
      resultadoNeto,
      margenEbitda,
      margenNeto,
      ebitdaFinal
    });
  }, [pyg, margenBruto, ebit, ebt, resultadoNeto, margenEbitda, margenNeto, ebitdaFinal]);

  const InputField = ({ 
    label, 
    field, 
    value, 
    placeholder = "0",
    calculated = false
  }: { 
    label: string; 
    field: keyof ProfitLossData; 
    value: number;
    placeholder?: string;
    calculated?: boolean;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {label}
        {calculated && <Badge variant="outline" className="text-xs">Auto</Badge>}
      </Label>
      <Input
        id={field}
        type="number"
        value={calculated ? '' : (value || '')}
        onChange={(e) => !calculated && handleInputChange(field, e.target.value)}
        placeholder={calculated ? `${value.toLocaleString()}` : placeholder}
        className="text-right"
        disabled={calculated}
      />
    </div>
  );

  const ResultRow = ({ label, value, isPercentage = false, className = "" }: {
    label: string;
    value: number;
    isPercentage?: boolean;
    className?: string;
  }) => (
    <div className={`flex justify-between items-center py-2 ${className}`}>
      <span className="font-medium">{label}:</span>
      <span className="font-bold">
        {isPercentage 
          ? `${value.toFixed(1)}%` 
          : `${value.toLocaleString()} €`
        }
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Datos de Entrada</h3>
          
          {/* Ingresos y Costes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ingresos y Costes Directos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Ingresos de Explotación" field="ingresos" value={pyg.ingresos} />
              <InputField label="Coste de Ventas" field="costesVentas" value={pyg.costesVentas} />
              
              <div className="border-t pt-2">
                <ResultRow label="Margen Bruto" value={margenBruto} className="text-sm bg-muted/50 px-2 rounded" />
              </div>
            </CardContent>
          </Card>

          {/* Gastos Operativos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Gastos Operativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Gastos de Personal" field="gastosPersonal" value={pyg.gastosPersonal} />
              <InputField label="Otros Gastos de Explotación" field="otrosGastos" value={pyg.otrosGastos} />
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  EBITDA 
                  <Calculator className="h-4 w-4" />
                  <Badge variant="outline" className="text-xs">Opcional</Badge>
                </Label>
                <Input
                  type="number"
                  value={pyg.ebitda || ''}
                  onChange={(e) => handleInputChange('ebitda', e.target.value)}
                  placeholder={`Calculado: ${ebitdaCalculado.toLocaleString()}`}
                  className="text-right"
                />
                <p className="text-xs text-muted-foreground">
                  Dejar vacío para cálculo automático
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Otros Conceptos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Amortizaciones y Financieros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Amortizaciones" field="amortizaciones" value={pyg.amortizaciones} />
              <InputField label="Gastos Financieros" field="gastosFinancieros" value={pyg.gastosFinancieros} />
              <InputField label="Ingresos Financieros" field="ingresosFinancieros" value={pyg.ingresosFinancieros} />
              <InputField label="Impuestos" field="impuestos" value={pyg.impuestos} />
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">Resultados Calculados</h3>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                Cuenta de Resultados
                <Calculator className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ResultRow label="Ingresos de Explotación" value={pyg.ingresos} />
              <ResultRow label="Coste de Ventas" value={-pyg.costesVentas} />
              <div className="border-t border-b py-2">
                <ResultRow label="Margen Bruto" value={margenBruto} className="font-semibold" />
              </div>
              
              <ResultRow label="Gastos de Personal" value={-pyg.gastosPersonal} />
              <ResultRow label="Otros Gastos" value={-pyg.otrosGastos} />
              <div className="border-t border-b py-2 bg-blue-50">
                <ResultRow label="EBITDA" value={ebitdaFinal} className="font-bold text-blue-900" />
                <ResultRow label="Margen EBITDA" value={margenEbitda} isPercentage className="text-sm text-blue-700" />
              </div>
              
              <ResultRow label="Amortizaciones" value={-pyg.amortizaciones} />
              <div className="border-t border-b py-2">
                <ResultRow label="EBIT" value={ebit} className="font-semibold" />
              </div>
              
              <ResultRow label="Resultado Financiero" value={resultadoFinanciero} />
              <div className="border-t border-b py-2">
                <ResultRow label="EBT" value={ebt} className="font-semibold" />
              </div>
              
              <ResultRow label="Impuestos" value={-pyg.impuestos} />
              <div className="border-t border-b py-2 bg-green-50">
                <ResultRow label="Resultado Neto" value={resultadoNeto} className="font-bold text-green-900" />
                <ResultRow label="Margen Neto" value={margenNeto} isPercentage className="text-sm text-green-700" />
              </div>
            </CardContent>
          </Card>

          {/* Key Ratios Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ratios Clave (Preview)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Margen EBITDA:</span>
                  <span className={`ml-2 font-medium ${margenEbitda > 15 ? 'text-green-600' : margenEbitda > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {margenEbitda.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Margen Neto:</span>
                  <span className={`ml-2 font-medium ${margenNeto > 10 ? 'text-green-600' : margenNeto > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {margenNeto.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};