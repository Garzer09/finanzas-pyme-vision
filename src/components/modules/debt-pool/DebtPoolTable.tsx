import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Filter, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DebtItem } from '@/hooks/useDebtData';

interface DebtPoolTableProps {
  debtItems: DebtItem[];
  onEdit: (id: string, updates: Partial<DebtItem>) => void;
  onDelete: (id: string) => void;
}

export const DebtPoolTable = ({ debtItems, onEdit, onDelete }: DebtPoolTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortField, setSortField] = useState<keyof DebtItem>('capitalPendiente');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get unique entities and types for filters
  const entities = useMemo(() => 
    [...new Set(debtItems.map(item => item.entidad))], [debtItems]
  );
  
  const types = useMemo(() => 
    [...new Set(debtItems.map(item => item.tipo))], [debtItems]
  );

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = debtItems.filter(item => {
      const matchesSearch = item.entidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.tipo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEntity = !entityFilter || item.entidad === entityFilter;
      const matchesType = !typeFilter || item.tipo === typeFilter;
      
      return matchesSearch && matchesEntity && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });

    return filtered;
  }, [debtItems, searchTerm, entityFilter, typeFilter, sortField, sortDirection]);

  const handleSort = (field: keyof DebtItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirm(null);
  };

  const SortableHeader = ({ field, children }: { field: keyof DebtItem; children: React.ReactNode }) => (
    <TableHead 
      className="text-slate-700 cursor-pointer hover:bg-slate-50 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span className="text-xs">
            {sortDirection === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </TableHead>
  );

  return (
    <Card className="bg-white border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#005E8A]" />
          Detalle del Pool Bancario
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por entidad o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por entidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las entidades</SelectItem>
              {entities.map(entity => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los tipos</SelectItem>
              {types.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="entidad">Entidad</SortableHeader>
                <SortableHeader field="tipo">Tipo</SortableHeader>
                <SortableHeader field="capitalPendiente">Capital Pendiente</SortableHeader>
                <SortableHeader field="tipoInteres">TIR</SortableHeader>
                <SortableHeader field="plazoRestante">Plazo Restante</SortableHeader>
                <SortableHeader field="cuota">Cuota</SortableHeader>
                <SortableHeader field="proximoVencimiento">Próx. Venc.</SortableHeader>
                <TableHead className="text-slate-700 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedData.map((debt) => (
                <TableRow key={debt.id} className="hover:bg-slate-50">
                  <TableCell className="font-medium text-slate-900">{debt.entidad}</TableCell>
                  <TableCell className="text-slate-700">{debt.tipo}</TableCell>
                  <TableCell className="text-right text-slate-900 font-semibold">
                    {formatCurrency(debt.capitalPendiente)}
                  </TableCell>
                  <TableCell className="text-center text-slate-700">{debt.tipoInteres}%</TableCell>
                  <TableCell className="text-center text-slate-700">{debt.plazoRestante} meses</TableCell>
                  <TableCell className="text-right text-slate-700">
                    {debt.cuota > 0 ? formatCurrency(debt.cuota) : 'A vencimiento'}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {new Date(debt.proximoVencimiento).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="h-3 w-3 text-blue-600" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirmar Eliminación</DialogTitle>
                            <DialogDescription>
                              ¿Estás seguro de que deseas eliminar la deuda de <strong>{debt.entidad}</strong>?
                              Esta acción no se puede deshacer.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline">Cancelar</Button>
                            <Button 
                              variant="destructive"
                              onClick={() => handleDelete(debt.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredAndSortedData.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No se encontraron registros que coincidan con los filtros aplicados.
          </div>
        )}
        
        {filteredAndSortedData.length > 0 && (
          <div className="mt-4 text-sm text-slate-600">
            Mostrando {filteredAndSortedData.length} de {debtItems.length} instrumentos
          </div>
        )}
      </CardContent>
    </Card>
  );
};