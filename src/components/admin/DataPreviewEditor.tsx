import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, AlertTriangle, CheckCircle, Edit3, X, RefreshCw } from 'lucide-react';
import { DataPreview, DataPreviewRow } from '@/services/realTemplateService';

interface DataPreviewEditorProps {
  preview: DataPreview;
  onSave: (modifiedRows: DataPreviewRow[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DataPreviewEditor: React.FC<DataPreviewEditorProps> = ({
  preview,
  onSave,
  onCancel,
  isLoading = false
}) => {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [modifiedRows, setModifiedRows] = useState<DataPreviewRow[]>(preview.rows);
  const [editValue, setEditValue] = useState<string>('');

  const handleCellEdit = useCallback((rowId: string, field: string, currentValue: any) => {
    setEditingCell({ rowId, field });
    setEditValue(String(currentValue || ''));
  }, []);

  const handleCellSave = useCallback(() => {
    if (!editingCell) return;

    setModifiedRows(prev => prev.map(row => {
      if (row._rowId === editingCell.rowId) {
        const updatedRow = {
          ...row,
          [editingCell.field]: editValue
        };
        
        // Revalidate row after edit
        updatedRow._errors = [];
        updatedRow._warnings = [];
        updatedRow._isValid = true;

        // Basic validation
        if (editingCell.field.toLowerCase().includes('importe') || 
            editingCell.field.toLowerCase().includes('valor')) {
          if (isNaN(Number(editValue))) {
            updatedRow._errors.push(`${editingCell.field} debe ser un número`);
            updatedRow._isValid = false;
          }
        }

        if (editingCell.field.toLowerCase().includes('concepto') && !editValue.trim()) {
          updatedRow._errors.push(`${editingCell.field} es requerido`);
          updatedRow._isValid = false;
        }

        return updatedRow;
      }
      return row;
    }));

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleDeleteRow = useCallback((rowId: string) => {
    setModifiedRows(prev => prev.filter(row => row._rowId !== rowId));
    toast.success('Fila eliminada');
  }, []);

  const handleSave = useCallback(() => {
    const validRows = modifiedRows.filter(row => row._isValid);
    const invalidRows = modifiedRows.filter(row => !row._isValid);

    if (invalidRows.length > 0) {
      toast.error(`Hay ${invalidRows.length} filas con errores que no se guardarán`);
    }

    if (validRows.length === 0) {
      toast.error('No hay filas válidas para guardar');
      return;
    }

    onSave(modifiedRows);
  }, [modifiedRows, onSave]);

  const getCellClassName = useCallback((row: DataPreviewRow, field: string) => {
    let baseClass = "min-h-[40px] cursor-pointer hover:bg-steel-50/50 transition-colors";
    
    if (row._errors.some(e => e.includes(field))) {
      baseClass += " bg-red-50 border-red-200";
    } else if (row._warnings.some(w => w.includes(field))) {
      baseClass += " bg-yellow-50 border-yellow-200";
    }

    return baseClass;
  }, []);

  const validRowsCount = modifiedRows.filter(row => row._isValid).length;
  const invalidRowsCount = modifiedRows.filter(row => !row._isValid).length;

  return (
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Vista Previa y Edición de Datos
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              {preview.fileName} • {preview.fileType.toUpperCase()}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={validRowsCount > 0 ? "secondary" : "destructive"}>
              <CheckCircle className="h-3 w-3 mr-1" />
              {validRowsCount} válidas
            </Badge>
            {invalidRowsCount > 0 && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {invalidRowsCount} con errores
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 bg-steel-50/30 rounded-lg">
            <div className="text-sm font-medium text-steel-700">Total de Filas</div>
            <div className="text-2xl font-bold text-steel-900">{modifiedRows.length}</div>
          </div>
          <div className="p-3 bg-green-50/30 rounded-lg">
            <div className="text-sm font-medium text-green-700">Filas Válidas</div>
            <div className="text-2xl font-bold text-green-900">{validRowsCount}</div>
          </div>
          <div className="p-3 bg-red-50/30 rounded-lg">
            <div className="text-sm font-medium text-red-700">Con Errores</div>
            <div className="text-2xl font-bold text-red-900">{invalidRowsCount}</div>
          </div>
        </div>

        {/* Data Table */}
        <div className="border rounded-lg">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-white border-b">
                <TableRow>
                  <TableHead className="w-12">Estado</TableHead>
                  {preview.headers.map((header) => (
                    <TableHead key={header} className="min-w-[120px]">
                      {header}
                    </TableHead>
                  ))}
                  <TableHead className="w-12">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modifiedRows.map((row) => (
                  <TableRow key={row._rowId} className={row._isValid ? '' : 'bg-red-50/30'}>
                    <TableCell>
                      {row._isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    {preview.headers.map((header) => (
                      <TableCell 
                        key={`${row._rowId}-${header}`}
                        className={getCellClassName(row, header)}
                        onClick={() => handleCellEdit(row._rowId, header, row[header])}
                      >
                        {editingCell?.rowId === row._rowId && editingCell?.field === header ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellSave();
                                if (e.key === 'Escape') handleCellCancel();
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button size="sm" variant="ghost" onClick={handleCellSave}>
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCellCancel}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="min-h-[32px] flex items-center">
                            {String(row[header] || '')}
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRow(row._rowId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Errors and Warnings Summary */}
        {(preview.criticalErrors.length > 0 || preview.warnings.length > 0) && (
          <div className="space-y-3">
            {preview.criticalErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Errores Críticos</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {preview.criticalErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {preview.criticalErrors.length > 5 && (
                    <li className="font-medium">... y {preview.criticalErrors.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}

            {preview.warnings.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Advertencias</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {preview.warnings.slice(0, 5).map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                  {preview.warnings.length > 5 && (
                    <li className="font-medium">... y {preview.warnings.length - 5} más</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Haz clic en cualquier celda para editarla. Solo se guardarán las filas válidas.
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading || validRowsCount === 0}
              className="bg-steel-600 hover:bg-steel-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Datos ({validRowsCount} filas)
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};