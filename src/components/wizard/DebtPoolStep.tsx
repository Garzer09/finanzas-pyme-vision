import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Building, Calculator } from 'lucide-react';

interface DebtPoolStepProps {
  data: any[];
  onChange: (data: any[]) => void;
}

interface DebtLoan {
  id: string;
  entidad: string;
  tipo: 'corto_plazo' | 'largo_plazo' | 'credito_comercial';
  importeInicial: number;
  saldoActual: number;
  tipoInteres: number;
  fechaVencimiento: string;
  garantias: string;
  observaciones: string;
}

const LOAN_TYPES = [
  { value: 'largo_plazo', label: 'Largo Plazo (>1 año)' },
  { value: 'corto_plazo', label: 'Corto Plazo (<1 año)' },
  { value: 'credito_comercial', label: 'Crédito Comercial' }
];

export const DebtPoolStep: React.FC<DebtPoolStepProps> = ({
  data,
  onChange
}) => {
  const [loans, setLoans] = useState<DebtLoan[]>(
    data.length > 0 ? data : [{
      id: Date.now().toString(),
      entidad: '',
      tipo: 'largo_plazo',
      importeInicial: 0,
      saldoActual: 0,
      tipoInteres: 0,
      fechaVencimiento: '',
      garantias: '',
      observaciones: ''
    }]
  );

  const updateLoan = (id: string, field: keyof DebtLoan, value: any) => {
    const updatedLoans = loans.map(loan => 
      loan.id === id ? { ...loan, [field]: value } : loan
    );
    setLoans(updatedLoans);
    onChange(updatedLoans);
  };

  const addLoan = () => {
    const newLoan: DebtLoan = {
      id: Date.now().toString(),
      entidad: '',
      tipo: 'largo_plazo',
      importeInicial: 0,
      saldoActual: 0,
      tipoInteres: 0,
      fechaVencimiento: '',
      garantias: '',
      observaciones: ''
    };
    const updatedLoans = [...loans, newLoan];
    setLoans(updatedLoans);
    onChange(updatedLoans);
  };

  const removeLoan = (id: string) => {
    const updatedLoans = loans.filter(loan => loan.id !== id);
    setLoans(updatedLoans);
    onChange(updatedLoans);
  };

  // Calculations
  const totalDeuda = loans.reduce((sum, loan) => sum + loan.saldoActual, 0);
  const deudaCP = loans.filter(l => l.tipo === 'corto_plazo').reduce((sum, loan) => sum + loan.saldoActual, 0);
  const deudaLP = loans.filter(l => l.tipo === 'largo_plazo').reduce((sum, loan) => sum + loan.saldoActual, 0);
  const tipoInteresPromedio = loans.length > 0 
    ? loans.reduce((sum, loan) => sum + (loan.tipoInteres * loan.saldoActual), 0) / totalDeuda 
    : 0;

  const currentYear = new Date().getFullYear();
  const vencimientosPorAno = loans.reduce((acc, loan) => {
    if (loan.fechaVencimiento) {
      const year = new Date(loan.fechaVencimiento).getFullYear();
      acc[year] = (acc[year] || 0) + loan.saldoActual;
    }
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumen del Pool de Deuda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalDeuda.toLocaleString()} €</div>
              <div className="text-sm text-muted-foreground">Deuda Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{deudaCP.toLocaleString()} €</div>
              <div className="text-sm text-muted-foreground">Corto Plazo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{deudaLP.toLocaleString()} €</div>
              <div className="text-sm text-muted-foreground">Largo Plazo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {isNaN(tipoInteresPromedio) ? '0.0' : tipoInteresPromedio.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">TIR Promedio</div>
            </div>
          </div>

          {Object.keys(vencimientosPorAno).length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium mb-2">Calendario de Vencimientos:</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(vencimientosPorAno).sort().map(([year, amount]) => (
                  <Badge 
                    key={year} 
                    variant={Number(year) <= currentYear + 1 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {year}: {amount.toLocaleString()} €
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loan Details */}
      <div className="space-y-4">
        {loans.map((loan, index) => (
          <Card key={loan.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Préstamo {index + 1}
              </CardTitle>
              {loans.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeLoan(loan.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`entidad-${loan.id}`}>Entidad Financiera</Label>
                  <Input
                    id={`entidad-${loan.id}`}
                    value={loan.entidad}
                    onChange={(e) => updateLoan(loan.id, 'entidad', e.target.value)}
                    placeholder="Ej: Banco Santander"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tipo-${loan.id}`}>Tipo de Deuda</Label>
                  <Select
                    value={loan.tipo}
                    onValueChange={(value) => updateLoan(loan.id, 'tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`importe-${loan.id}`}>Importe Inicial (€)</Label>
                  <Input
                    id={`importe-${loan.id}`}
                    type="number"
                    value={loan.importeInicial || ''}
                    onChange={(e) => updateLoan(loan.id, 'importeInicial', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`saldo-${loan.id}`}>Saldo Actual (€)</Label>
                  <Input
                    id={`saldo-${loan.id}`}
                    type="number"
                    value={loan.saldoActual || ''}
                    onChange={(e) => updateLoan(loan.id, 'saldoActual', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`interes-${loan.id}`}>Tipo de Interés (%)</Label>
                  <Input
                    id={`interes-${loan.id}`}
                    type="number"
                    step="0.01"
                    value={loan.tipoInteres || ''}
                    onChange={(e) => updateLoan(loan.id, 'tipoInteres', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`vencimiento-${loan.id}`}>Fecha Vencimiento</Label>
                  <Input
                    id={`vencimiento-${loan.id}`}
                    type="date"
                    value={loan.fechaVencimiento}
                    onChange={(e) => updateLoan(loan.id, 'fechaVencimiento', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`garantias-${loan.id}`}>Garantías</Label>
                  <Textarea
                    id={`garantias-${loan.id}`}
                    value={loan.garantias}
                    onChange={(e) => updateLoan(loan.id, 'garantias', e.target.value)}
                    placeholder="Ej: Hipoteca sobre inmueble"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`observaciones-${loan.id}`}>Observaciones</Label>
                  <Textarea
                    id={`observaciones-${loan.id}`}
                    value={loan.observaciones}
                    onChange={(e) => updateLoan(loan.id, 'observaciones', e.target.value)}
                    placeholder="Información adicional"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={addLoan}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir Préstamo
        </Button>
      </div>
    </div>
  );
};