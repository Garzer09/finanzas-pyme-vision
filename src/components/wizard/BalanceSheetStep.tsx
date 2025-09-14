import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface BalanceSheetStepProps {
  data: any;
  onChange: (data: any) => void;
}

interface BalanceSheetData {
  // Activo Corriente
  tesoreria: number;
  deudoresComerciales: number;
  existencias: number;
  otroActivoCorriente: number;
  
  // Activo No Corriente
  inmovilizadoMaterial: number;
  inmovilizadoIntangible: number;
  inversionesFinancieras: number;
  
  // Pasivo Corriente
  deudaFinancieraCP: number;
  acreedoresComerciales: number;
  otroPasivoCorriente: number;
  
  // Pasivo No Corriente
  deudaFinancieraLP: number;
  otroPasivoNoCorriente: number;
  
  // Patrimonio Neto
  capitalSocial: number;
  reservas: number;
  resultadoEjercicio: number;
}

export const BalanceSheetStep: React.FC<BalanceSheetStepProps> = ({
  data,
  onChange
}) => {
  const [balance, setBalance] = useState<BalanceSheetData>({
    tesoreria: 0,
    deudoresComerciales: 0,
    existencias: 0,
    otroActivoCorriente: 0,
    inmovilizadoMaterial: 0,
    inmovilizadoIntangible: 0,
    inversionesFinancieras: 0,
    deudaFinancieraCP: 0,
    acreedoresComerciales: 0,
    otroPasivoCorriente: 0,
    deudaFinancieraLP: 0,
    otroPasivoNoCorriente: 0,
    capitalSocial: 0,
    reservas: 0,
    resultadoEjercicio: 0,
    ...data
  });

  const handleInputChange = (field: keyof BalanceSheetData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newBalance = { ...balance, [field]: numValue };
    setBalance(newBalance);
    onChange(newBalance);
  };

  // Calculations
  const activoCorriente = balance.tesoreria + balance.deudoresComerciales + 
                         balance.existencias + balance.otroActivoCorriente;
  const activoNoCorriente = balance.inmovilizadoMaterial + balance.inmovilizadoIntangible + 
                           balance.inversionesFinancieras;
  const totalActivo = activoCorriente + activoNoCorriente;

  const pasivoCorriente = balance.deudaFinancieraCP + balance.acreedoresComerciales + 
                         balance.otroPasivoCorriente;
  const pasivoNoCorriente = balance.deudaFinancieraLP + balance.otroPasivoNoCorriente;
  const patrimonioNeto = balance.capitalSocial + balance.reservas + balance.resultadoEjercicio;
  const totalPasivoPatrimonio = pasivoCorriente + pasivoNoCorriente + patrimonioNeto;

  const difference = totalActivo - totalPasivoPatrimonio;
  const isBalanced = Math.abs(difference) < 0.01;

  // Update parent with calculated totals
  useEffect(() => {
    onChange({
      ...balance,
      activoCorriente,
      activoNoCorriente,
      totalActivo,
      pasivoCorriente,
      pasivoNoCorriente,
      patrimonioNeto,
      totalPasivoPatrimonio,
      isBalanced
    });
  }, [balance, activoCorriente, activoNoCorriente, totalActivo, pasivoCorriente, pasivoNoCorriente, patrimonioNeto, totalPasivoPatrimonio, isBalanced]);

  const InputField = ({ 
    label, 
    field, 
    value, 
    placeholder = "0" 
  }: { 
    label: string; 
    field: keyof BalanceSheetData; 
    value: number;
    placeholder?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={field}>{label}</Label>
      <Input
        id={field}
        type="number"
        value={value || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className="text-right"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ACTIVO */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">ACTIVO</h3>
          
          {/* Activo Corriente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activo Corriente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Tesorería" field="tesoreria" value={balance.tesoreria} />
              <InputField label="Deudores Comerciales" field="deudoresComerciales" value={balance.deudoresComerciales} />
              <InputField label="Existencias" field="existencias" value={balance.existencias} />
              <InputField label="Otros" field="otroActivoCorriente" value={balance.otroActivoCorriente} />
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Activo Corriente:</span>
                  <span>{activoCorriente.toLocaleString()} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activo No Corriente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activo No Corriente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Inmovilizado Material" field="inmovilizadoMaterial" value={balance.inmovilizadoMaterial} />
              <InputField label="Inmovilizado Intangible" field="inmovilizadoIntangible" value={balance.inmovilizadoIntangible} />
              <InputField label="Inversiones Financieras" field="inversionesFinancieras" value={balance.inversionesFinancieras} />
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Activo No Corriente:</span>
                  <span>{activoNoCorriente.toLocaleString()} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL ACTIVO:</span>
              <span>{totalActivo.toLocaleString()} €</span>
            </div>
          </div>
        </div>

        {/* PASIVO + PATRIMONIO */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-primary">PASIVO + PATRIMONIO</h3>
          
          {/* Pasivo Corriente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pasivo Corriente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Deuda Financiera CP" field="deudaFinancieraCP" value={balance.deudaFinancieraCP} />
              <InputField label="Acreedores Comerciales" field="acreedoresComerciales" value={balance.acreedoresComerciales} />
              <InputField label="Otros" field="otroPasivoCorriente" value={balance.otroPasivoCorriente} />
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Pasivo Corriente:</span>
                  <span>{pasivoCorriente.toLocaleString()} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pasivo No Corriente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pasivo No Corriente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Deuda Financiera LP" field="deudaFinancieraLP" value={balance.deudaFinancieraLP} />
              <InputField label="Otros" field="otroPasivoNoCorriente" value={balance.otroPasivoNoCorriente} />
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Pasivo No Corriente:</span>
                  <span>{pasivoNoCorriente.toLocaleString()} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patrimonio Neto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Patrimonio Neto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputField label="Capital Social" field="capitalSocial" value={balance.capitalSocial} />
              <InputField label="Reservas" field="reservas" value={balance.reservas} />
              <InputField label="Resultado del Ejercicio" field="resultadoEjercicio" value={balance.resultadoEjercicio} />
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Patrimonio Neto:</span>
                  <span>{patrimonioNeto.toLocaleString()} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex justify-between font-bold text-lg">
              <span>TOTAL PASIVO + PATRIMONIO:</span>
              <span>{totalPasivoPatrimonio.toLocaleString()} €</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Validation */}
      <Alert className={isBalanced ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        {isBalanced ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )}
        <AlertDescription className={isBalanced ? "text-green-800" : "text-red-800"}>
          {isBalanced ? (
            <span className="font-medium">✓ Balance cuadrado correctamente</span>
          ) : (
            <span>
              <span className="font-medium">⚠ Balance descuadrado:</span> 
              {" "}Diferencia de {Math.abs(difference).toLocaleString()} €
              {difference > 0 ? " (Activo mayor)" : " (Pasivo mayor)"}
            </span>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
};