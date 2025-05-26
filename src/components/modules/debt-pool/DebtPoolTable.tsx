
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';

interface DebtItem {
  id: string;
  entidad: string;
  tipo: string;
  capitalInicial: number;
  capitalPendiente: number;
  tipoInteres: number;
  plazoRestante: number;
  cuota: number;
  proximoVencimiento: string;
  ultimoVencimiento: string;
  frecuencia: string;
  garantias?: string;
}

interface DebtPoolTableProps {
  debtItems: DebtItem[];
}

export const DebtPoolTable = ({ debtItems }: DebtPoolTableProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 backdrop-blur-sm border border-teal-400/30 p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Detalle del Pool Bancario</h2>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-300">Entidad</TableHead>
              <TableHead className="text-gray-300">Tipo</TableHead>
              <TableHead className="text-gray-300 text-right">Capital Pendiente</TableHead>
              <TableHead className="text-gray-300 text-center">Tipo Interés</TableHead>
              <TableHead className="text-gray-300 text-center">Plazo Restante</TableHead>
              <TableHead className="text-gray-300 text-right">Cuota</TableHead>
              <TableHead className="text-gray-300">Próximo Vencimiento</TableHead>
              <TableHead className="text-gray-300 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debtItems.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell className="text-white font-medium">{debt.entidad}</TableCell>
                <TableCell className="text-gray-300">{debt.tipo}</TableCell>
                <TableCell className="text-right text-white">{formatCurrency(debt.capitalPendiente)}</TableCell>
                <TableCell className="text-center text-gray-300">{debt.tipoInteres}%</TableCell>
                <TableCell className="text-center text-gray-300">{debt.plazoRestante} meses</TableCell>
                <TableCell className="text-right text-gray-300">
                  {debt.cuota > 0 ? formatCurrency(debt.cuota) : 'A vencimiento'}
                </TableCell>
                <TableCell className="text-gray-300">{debt.proximoVencimiento}</TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
