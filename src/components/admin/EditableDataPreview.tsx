import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  Edit3,
  Filter,
  Search,
  Trash2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface EditableCell {
  originalValue: any;
  currentValue: any;
  isModified: boolean;
  isValid: boolean;
  validationError?: string;
}

interface EditableRow {
  id: string;
  data: Record<string, EditableCell>;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface ValidationRule {
  field: string;
  type: 'required' | 'number' | 'date' | 'email' | 'custom';
  message: string;
  customValidator?: (value: any) => boolean;
}

interface EditableDataPreviewProps {
  originalData: any[];
  templateType: string;
  onSave: (modifiedData: any[]) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  validationRules?: ValidationRule[];
}

export const EditableDataPreview: React.FC<EditableDataPreviewProps> = ({
  originalData,
  templateType,
  onSave,
  onCancel,
  isProcessing = false,
  validationRules = []
}) => {
  const [editableRows, setEditableRows] = useState<EditableRow[]>(() => 
    initializeEditableData(originalData)
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [showOnlyModified, setShowOnlyModified] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

  // Initialize editable data structure
  function initializeEditableData(data: any[]): EditableRow[] {
    return data.map((row, index) => ({
      id: `row-${index}`,
      data: Object.keys(row).reduce((acc, key) => {
        acc[key] = {
          originalValue: row[key],
          currentValue: row[key],
          isModified: false,
          isValid: true
        };
        return acc;
      }, {} as Record<string, EditableCell>)
    }));
  }

  // Get column names from the first row
  const columns = useMemo(() => {
    if (editableRows.length === 0) return [];
    return Object.keys(editableRows[0].data);
  }, [editableRows]);

  // Filter and search logic
  const filteredRows = useMemo(() => {
    let filtered = editableRows.filter(row => !row.isDeleted);
    
    if (showOnlyModified) {
      filtered = filtered.filter(row => 
        Object.values(row.data).some(cell => cell.isModified) || row.isNew
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row.data).some(cell =>
          String(cell.currentValue).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedColumn) {
      filtered = filtered.filter(row => 
        String(row.data[selectedColumn]?.currentValue || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [editableRows, searchTerm, selectedColumn, showOnlyModified]);

  // Validation logic
  const validateCell = useCallback((value: any, field: string): { isValid: boolean; error?: string } => {
    const rule = validationRules.find(r => r.field === field);
    if (!rule) return { isValid: true };

    switch (rule.type) {
      case 'required':
        if (!value || String(value).trim() === '') {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'date':
        if (isNaN(Date.parse(value))) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return { isValid: false, error: rule.message };
        }
        break;
      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          return { isValid: false, error: rule.message };
        }
        break;
    }

    return { isValid: true };
  }, [validationRules]);

  // Update cell value
  const updateCellValue = useCallback((rowId: string, columnName: string, newValue: any) => {
    setEditableRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;

      const validation = validateCell(newValue, columnName);
      const isModified = newValue !== row.data[columnName].originalValue;

      return {
        ...row,
        data: {
          ...row.data,
          [columnName]: {
            ...row.data[columnName],
            currentValue: newValue,
            isModified,
            isValid: validation.isValid,
            validationError: validation.error
          }
        }
      };
    }));
  }, [validateCell]);

  // Add new row
  const addNewRow = useCallback(() => {
    const newRow: EditableRow = {
      id: `new-row-${Date.now()}`,
      isNew: true,
      data: columns.reduce((acc, col) => {
        acc[col] = {
          originalValue: '',
          currentValue: '',
          isModified: true,
          isValid: true
        };
        return acc;
      }, {} as Record<string, EditableCell>)
    };

    setEditableRows(prev => [...prev, newRow]);
    toast.success('Nueva fila añadida');
  }, [columns]);

  // Delete row
  const deleteRow = useCallback((rowId: string) => {
    setEditableRows(prev => prev.map(row => 
      row.id === rowId ? { ...row, isDeleted: true } : row
    ));
    toast.success('Fila marcada para eliminación');
  }, []);

  // Restore row
  const restoreRow = useCallback((rowId: string) => {
    setEditableRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      
      return {
        ...row,
        isDeleted: false,
        data: Object.keys(row.data).reduce((acc, key) => {
          acc[key] = {
            ...row.data[key],
            currentValue: row.data[key].originalValue,
            isModified: false,
            isValid: true,
            validationError: undefined
          };
          return acc;
        }, {} as Record<string, EditableCell>)
      };
    }));
    toast.success('Fila restaurada');
  }, []);

  // Get modification statistics
  const modificationStats = useMemo(() => {
    const modifiedRows = editableRows.filter(row => 
      Object.values(row.data).some(cell => cell.isModified) || row.isNew
    );
    const deletedRows = editableRows.filter(row => row.isDeleted);
    const invalidRows = editableRows.filter(row => 
      Object.values(row.data).some(cell => !cell.isValid)
    );

    return {
      totalRows: editableRows.length,
      modifiedRows: modifiedRows.length,
      deletedRows: deletedRows.length,
      newRows: editableRows.filter(row => row.isNew).length,
      invalidRows: invalidRows.length,
      hasChanges: modifiedRows.length > 0 || deletedRows.length > 0
    };
  }, [editableRows]);

  // Save changes
  const handleSave = useCallback(() => {
    const stats = modificationStats;
    
    if (stats.invalidRows > 0) {
      toast.error(`Hay ${stats.invalidRows} filas con errores de validación`);
      return;
    }

    // Convert back to original format
    const modifiedData = editableRows
      .filter(row => !row.isDeleted)
      .map(row => {
        const rowData: any = {};
        Object.keys(row.data).forEach(key => {
          rowData[key] = row.data[key].currentValue;
        });
        return rowData;
      });

    onSave(modifiedData);
    toast.success(`Guardados ${stats.modifiedRows} cambios`);
  }, [editableRows, modificationStats, onSave]);

  // Export modified data
  const exportData = useCallback(() => {
    const dataToExport = filteredRows.map(row => {
      const rowData: any = {};
      Object.keys(row.data).forEach(key => {
        rowData[key] = row.data[key].currentValue;
      });
      return rowData;
    });

    const csvContent = [
      columns.join(','),
      ...dataToExport.map(row => 
        columns.map(col => `"${row[col] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${templateType}_modified_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Datos exportados');
  }, [filteredRows, columns, templateType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Editor de Datos Avanzado</h3>
          <p className="text-muted-foreground">
            {modificationStats.totalRows} filas • {modificationStats.modifiedRows} modificadas • {modificationStats.deletedRows} eliminadas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!modificationStats.hasChanges || modificationStats.invalidRows > 0 || isProcessing}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{modificationStats.totalRows}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{modificationStats.modifiedRows}</p>
            <p className="text-sm text-muted-foreground">Modificadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{modificationStats.newRows}</p>
            <p className="text-sm text-muted-foreground">Nuevas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{modificationStats.deletedRows}</p>
            <p className="text-sm text-muted-foreground">Eliminadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{modificationStats.invalidRows}</p>
            <p className="text-sm text-muted-foreground">Errores</p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Alert */}
      {modificationStats.invalidRows > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {modificationStats.invalidRows} filas contienen errores de validación que deben corregirse.
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Buscar en datos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todas las columnas</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>

            <Button
              variant={showOnlyModified ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOnlyModified(!showOnlyModified)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Solo Modificadas
            </Button>

            <Button onClick={addNewRow} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Fila
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-3 text-left border-b">Acciones</th>
                  {columns.map(col => (
                    <th key={col} className="p-3 text-left border-b min-w-32">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr 
                    key={row.id} 
                    className={`border-b ${
                      row.isDeleted ? 'bg-red-50 opacity-50' : 
                      row.isNew ? 'bg-green-50' : 
                      Object.values(row.data).some(cell => cell.isModified) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex space-x-1">
                        {row.isDeleted ? (
                          <Button size="sm" variant="outline" onClick={() => restoreRow(row.id)}>
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => deleteRow(row.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                    {columns.map(col => {
                      const cell = row.data[col];
                      return (
                        <td key={col} className="p-3">
                          <div className="space-y-1">
                            <Input
                              value={cell.currentValue || ''}
                              onChange={(e) => updateCellValue(row.id, col, e.target.value)}
                              disabled={row.isDeleted}
                              className={`text-sm ${
                                cell.isModified ? 'border-blue-500' : ''
                              } ${
                                !cell.isValid ? 'border-red-500' : ''
                              }`}
                            />
                            {!cell.isValid && cell.validationError && (
                              <p className="text-xs text-red-600">{cell.validationError}</p>
                            )}
                            {cell.isModified && cell.isValid && (
                              <Badge variant="secondary" className="text-xs">Modificado</Badge>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {filteredRows.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron filas que coincidan con los filtros aplicados.
        </div>
      )}
    </div>
  );
};