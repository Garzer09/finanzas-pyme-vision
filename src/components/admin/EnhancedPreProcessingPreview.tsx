import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle, Info, Edit2, Save, X, FileText } from 'lucide-react';

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  row?: number;
  column?: string;
  suggestion?: string;
  fixable: boolean;
}

interface ProcessedFileData {
  fileName: string;
  templateType: string;
  result: {
    success: boolean;
    template_type: string;
    rows_processed: number;
    errors: string[];
    warnings: string[];
    preview: any[];
  };
  file?: File;
}

interface EditableCell {
  fileIndex: number;
  row: number;
  column: string;
  original_value: any;
  new_value: any;
  is_editing: boolean;
}

interface EnhancedPreProcessingPreviewProps {
  uploadResults: ProcessedFileData[];
  onValidationComplete: (results: ProcessedFileData[]) => void;
  onCancel: () => void;
  onEdit?: (result: ProcessedFileData) => void;
}

export const EnhancedPreProcessingPreview: React.FC<EnhancedPreProcessingPreviewProps> = ({
  uploadResults,
  onValidationComplete,
  onCancel,
  onEdit
}) => {
  const [editableCells, setEditableCells] = useState<{ [key: string]: EditableCell }>({});
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [modifiedResults, setModifiedResults] = useState<ProcessedFileData[]>(uploadResults);

  useEffect(() => {
    console.log('🔄 EnhancedPreProcessingPreview received uploadResults:', uploadResults);
    setModifiedResults(uploadResults);
    if (uploadResults.length > 0) {
      setCurrentFileIndex(0);
    }
  }, [uploadResults]);

  const isFixableError = (error: string): boolean => {
    const fixablePatterns = [
      /missing.*header/i,
      /invalid.*format/i,
      /empty.*value/i,
      /wrong.*type/i
    ];
    return fixablePatterns.some(pattern => pattern.test(error));
  };

  const isFixableWarning = (warning: string): boolean => {
    const fixablePatterns = [
      /unknown.*header/i,
      /recommended/i,
      /suggestion/i
    ];
    return fixablePatterns.some(pattern => pattern.test(warning));
  };

  const getValidationIssues = (file: ProcessedFileData): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    
    if (file.result.errors) {
      issues.push(...file.result.errors.map(error => ({
        type: 'error' as const,
        message: error,
        fixable: isFixableError(error)
      })));
    }
    
    if (file.result.warnings) {
      issues.push(...file.result.warnings.map(warning => ({
        type: 'warning' as const,
        message: warning,
        fixable: isFixableWarning(warning)
      })));
    }
    
    return issues;
  };

  const getIssueIcon = (type: 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const startCellEdit = (fileIndex: number, row: number, column: string, value: any) => {
    const key = `${fileIndex}-${row}-${column}`;
    setEditableCells(prev => ({
      ...prev,
      [key]: {
        fileIndex,
        row,
        column,
        original_value: value,
        new_value: value,
        is_editing: true
      }
    }));
  };

  const saveCellEdit = (fileIndex: number, row: number, column: string) => {
    const key = `${fileIndex}-${row}-${column}`;
    const editCell = editableCells[key];
    
    if (editCell) {
      console.log(`💾 Saving cell edit for ${column} in row ${row}:`, editCell.new_value);
      
      // Update the modified results
      setModifiedResults(prev => {
        const newResults = [...prev];
        if (newResults[fileIndex]?.result?.preview) {
          newResults[fileIndex].result.preview[row] = {
            ...newResults[fileIndex].result.preview[row],
            [column]: editCell.new_value
          };
        }
        return newResults;
      });

      // Remove from editable cells
      setEditableCells(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });

      toast({
        title: "Cell Updated",
        description: `Updated ${column} in row ${row + 1}`,
      });
    }
  };

  const cancelCellEdit = (fileIndex: number, row: number, column: string) => {
    const key = `${fileIndex}-${row}-${column}`;
    setEditableCells(prev => {
      const { [key]: removed, ...rest } = prev;
      return rest;
    });
  };

  const updateCellValue = (fileIndex: number, row: number, column: string, value: any) => {
    const key = `${fileIndex}-${row}-${column}`;
    setEditableCells(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        new_value: value
      }
    }));
  };

  const hasErrors = modifiedResults.some(file => 
    file.result.errors && file.result.errors.length > 0
  );

  const hasFixableIssues = modifiedResults.some(file => {
    const issues = getValidationIssues(file);
    return issues.some(issue => issue.fixable);
  });

  const currentFile = modifiedResults[currentFileIndex];

  if (!currentFile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-2">
            <FileText className="mx-auto h-16 w-16 text-gray-400" />
            <p className="text-muted-foreground">No files to preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Preview & Validation</h2>
          <p className="text-muted-foreground">
            Review data and fix any validation issues before final processing
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              console.log('🚀 Continuing with modified results:', modifiedResults);
              onValidationComplete(modifiedResults);
            }}
            disabled={hasErrors && !hasFixableIssues}
            className={hasErrors && !hasFixableIssues ? 'opacity-50' : 'bg-green-600 hover:bg-green-700'}
          >
            {hasErrors && !hasFixableIssues ? 'Fix Errors First' : 'Continue Processing'}
          </Button>
        </div>
      </div>

      {hasErrors && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Some files have validation errors that need to be fixed before processing.
            {hasFixableIssues && " Yellow-highlighted issues can be fixed by editing the data below."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={currentFileIndex.toString()} onValueChange={(value) => setCurrentFileIndex(parseInt(value))} className="w-full">
        <TabsList className="grid w-full grid-cols-auto">
          {modifiedResults.map((file, index) => {
            const issues = getValidationIssues(file);
            const errorCount = issues.filter(i => i.type === 'error').length;
            const warningCount = issues.filter(i => i.type === 'warning').length;
            
            return (
              <TabsTrigger key={index} value={index.toString()} className="relative">
                {file.fileName}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                    {errorCount}
                  </Badge>
                )}
                {warningCount > 0 && errorCount === 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs bg-yellow-100 text-yellow-800">
                    {warningCount}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {modifiedResults.map((file, fileIndex) => (
          <TabsContent key={fileIndex} value={fileIndex.toString()} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">File Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div>Name: {file.fileName}</div>
                  <div>Type: {file.result.template_type}</div>
                  <div>Rows: {file.result.rows_processed}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Validation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>{file.result.errors?.length || 0} Errors</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>{file.result.warnings?.length || 0} Warnings</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {(!file.result.errors || file.result.errors.length === 0) ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ready to Process</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <XCircle className="h-4 w-4" />
                      <span>Needs Attention</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {getValidationIssues(file).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Validation Issues</CardTitle>
                  <CardDescription>
                    Review and fix the following issues. Yellow items can be fixed by editing data below.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {getValidationIssues(file).map((issue, index) => (
                        <div 
                          key={index} 
                          className={`flex items-start space-x-2 p-2 border rounded ${
                            issue.fixable ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
                          }`}
                        >
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <p className="text-sm">{issue.message}</p>
                            {issue.suggestion && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Suggestion: {issue.suggestion}
                              </p>
                            )}
                          </div>
                          {issue.fixable && (
                            <Badge variant="outline" className="text-xs bg-yellow-100 border-yellow-300 text-yellow-800">
                              Fixable
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {file.result.preview && file.result.preview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Preview & Editor</CardTitle>
                  <CardDescription>
                    Preview of the data. Click any cell to edit it. Changes will be saved when you continue.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96 w-full">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(file.result.preview[0] || {}).map((header) => (
                            <TableHead key={header} className="min-w-[120px]">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {file.result.preview.slice(0, 10).map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {Object.keys(row).map((header) => {
                              const cellKey = `${fileIndex}-${rowIndex}-${header}`;
                              const editableCell = editableCells[cellKey];
                              const cellValue = row[header];

                              return (
                                <TableCell key={header} className="relative group">
                                  {editableCell?.is_editing ? (
                                    <div className="flex items-center space-x-1">
                                      <Input
                                        value={editableCell.new_value}
                                        onChange={(e) => updateCellValue(fileIndex, rowIndex, header, e.target.value)}
                                        className="h-8 text-xs"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => saveCellEdit(fileIndex, rowIndex, header)}
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => cancelCellEdit(fileIndex, rowIndex, header)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <div
                                      className="cursor-pointer hover:bg-muted p-1 rounded flex items-center justify-between"
                                      onClick={() => startCellEdit(fileIndex, rowIndex, header, cellValue)}
                                    >
                                      <span className="text-sm truncate">{cellValue}</span>
                                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 ml-1 flex-shrink-0" />
                                    </div>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};