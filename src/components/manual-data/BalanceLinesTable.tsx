import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BalanceLineData {
  id?: number;
  company_id: string;
  period_date: string;
  period_type: string;
  period_year: number;
  period_quarter?: number | null;
  period_month?: number | null;
  section: string;
  concept: string;
  amount: number;
  currency_code: string;
  uploaded_by?: string | null;
  job_id?: string | null;
}

interface BalanceLinesTableProps {
  data: BalanceLineData[];
  onChange: (data: BalanceLineData[]) => void;
  companyId: string;
}

export const BalanceLinesTable: React.FC<BalanceLinesTableProps> = ({
  data,
  onChange,
  companyId
}) => {
  const updateRow = (index: number, field: keyof BalanceLineData, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    
    // Auto-update related fields
    if (field === 'period_year') {
      newData[index].period_date = `${value}-12-31`;
    } else if (field === 'period_quarter' && value) {
      const quarterEndMonth = value * 3;
      const quarterEndDate = new Date(newData[index].period_year, quarterEndMonth - 1, 0);
      newData[index].period_date = quarterEndDate.toISOString().split('T')[0];
      newData[index].period_month = null;
    } else if (field === 'period_month' && value) {
      const monthEndDate = new Date(newData[index].period_year, value, 0);
      newData[index].period_date = monthEndDate.toISOString().split('T')[0];
      newData[index].period_quarter = null;
    } else if (field === 'period_type') {
      if (value === 'annual') {
        newData[index].period_quarter = null;
        newData[index].period_month = null;
        newData[index].period_date = `${newData[index].period_year}-12-31`;
      } else if (value === 'quarterly') {
        newData[index].period_month = null;
      } else if (value === 'monthly') {
        newData[index].period_quarter = null;
      }
    }
    
    onChange(newData);
  };

  const removeRow = (index: number) => {
    const newData = data.filter((_, i) => i !== index);
    onChange(newData);
  };

  const sections = ['ACTIVO', 'PASIVO', 'PATRIMONIO_NETO'];
  
  const conceptsBySection = {
    'ACTIVO': [
      'ACTIVO_NO_CORRIENTE',
      'INMOVILIZADO_MATERIAL',
      'INMOVILIZADO_INTANGIBLE',
      'INVERSIONES_FINANCIERAS_LP',
      'ACTIVO_CORRIENTE',
      'EXISTENCIAS',
      'DEUDORES_COMERCIALES',
      'TESORERIA',
      'ACTIVO_TOTAL'
    ],
    'PASIVO': [
      'PATRIMONIO_NETO',
      'CAPITAL_SOCIAL',
      'RESERVAS',
      'RESULTADO_EJERCICIO',
      'PASIVO_NO_CORRIENTE',
      'DEUDA_LARGO_PLAZO',
      'PASIVO_CORRIENTE',
      'DEUDA_CORTO_PLAZO',
      'ACREEDORES_COMERCIALES',
      'PASIVO_TOTAL'
    ],
    'PATRIMONIO_NETO': [
      'CAPITAL_SOCIAL',
      'PRIMA_EMISION',
      'RESERVAS_LEGALES',
      'RESERVAS_VOLUNTARIAS',
      'RESULTADO_EJERCICIOS_ANTERIORES',
      'RESULTADO_EJERCICIO',
      'PATRIMONIO_NETO_TOTAL'
    ]
  };

  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No hay datos de Balance. Haz clic en "Añadir Fila" para comenzar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Sección</TableHead>
            <TableHead className="w-[200px]">Concepto</TableHead>
            <TableHead className="w-[120px]">Tipo Período</TableHead>
            <TableHead className="w-[100px]">Año</TableHead>
            <TableHead className="w-[100px]">Trimestre</TableHead>
            <TableHead className="w-[100px]">Mes</TableHead>
            <TableHead className="w-[120px]">Fecha Final</TableHead>
            <TableHead className="w-[120px]">Importe</TableHead>
            <TableHead className="w-[80px]">Moneda</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={row.id || index}>
              <TableCell>
                <Select 
                  value={row.section} 
                  onValueChange={(value) => updateRow(index, 'section', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sección" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section} value={section}>
                        {section.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Select 
                  value={row.concept} 
                  onValueChange={(value) => updateRow(index, 'concept', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar concepto" />
                  </SelectTrigger>
                  <SelectContent>
                    {row.section && conceptsBySection[row.section as keyof typeof conceptsBySection]?.map(concept => (
                      <SelectItem key={concept} value={concept}>
                        {concept.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Select 
                  value={row.period_type} 
                  onValueChange={(value) => updateRow(index, 'period_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Anual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Input
                  type="number"
                  value={row.period_year}
                  onChange={(e) => updateRow(index, 'period_year', parseInt(e.target.value) || new Date().getFullYear())}
                  min="2020"
                  max="2030"
                />
              </TableCell>
              
              <TableCell>
                <Select 
                  value={row.period_quarter?.toString() || ''} 
                  onValueChange={(value) => updateRow(index, 'period_quarter', value ? parseInt(value) : null)}
                  disabled={row.period_type !== 'quarterly'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Q" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Q1</SelectItem>
                    <SelectItem value="2">Q2</SelectItem>
                    <SelectItem value="3">Q3</SelectItem>
                    <SelectItem value="4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Select 
                  value={row.period_month?.toString() || ''} 
                  onValueChange={(value) => updateRow(index, 'period_month', value ? parseInt(value) : null)}
                  disabled={row.period_type !== 'monthly'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 12}, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(0, i).toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Input
                  type="date"
                  value={row.period_date}
                  onChange={(e) => updateRow(index, 'period_date', e.target.value)}
                />
              </TableCell>
              
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={row.amount}
                  onChange={(e) => updateRow(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </TableCell>
              
              <TableCell>
                <Select 
                  value={row.currency_code} 
                  onValueChange={(value) => updateRow(index, 'currency_code', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};